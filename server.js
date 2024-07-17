import express from "express";
import { ApolloServer } from "apollo-server-express";
import path from "path";
import http from "http";
import graphqlSchema from "./api/graphql.js";
import cors from "cors";
import axios from "axios";
import { createClient } from "redis";
import {
  getSatelliteName,
  getCatalogNumber,
  getCOSPAR,
  getLatLngObj,
  getSatelliteInfo,
} from "tle.js"; // Import specific functions from tle.js
import {
  OWNER_MAP,
  OPS_STATUS_DESCRIPTIONS,
  OBJECT_TYPE_MAP,
  ORBIT_TYPE_MAP,
  LAUNCH_SITE_MAP,
} from "./utils/mappings.js";

const app = express();
app.use(cors());

const server = http.createServer(app);

// Setup Redis
const redisClient = createClient();
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis Client Connected"));

await redisClient.connect(); // Connect to Redis server

const getAsync = (key) => redisClient.get(key);
const setAsync = (key, value, expiration) =>
  redisClient.set(key, value, { EX: expiration });
const delAsync = (key) => redisClient.del(key); // Delete key from Redis

// Fetch and cache SATCAT data
const fetchAndCacheSatcatData = async () => {
  const cacheKey = "satcatData";
  const cacheExpiration = 60 * 60 * 24; // 24 hours

  try {
    const cachedData = await getAsync(cacheKey);
    if (cachedData) {
      console.log("Serving SATCAT data from cache");
      return JSON.parse(cachedData);
    }

    const response = await axios.get(
      "https://celestrak.org/satcat/records.php?GROUP=active&FORMAT=JSON"
    );
    console.log("SATCAT data fetched from API:", response.data);

    const satcatData = response.data.reduce((acc, item) => {
      acc[item.NORAD_CAT_ID] = {
        country: item.OWNER,
        objectType: OBJECT_TYPE_MAP[item.OBJECT_TYPE] || "Unknown",
        opsStatus: OPS_STATUS_DESCRIPTIONS[item.OPS_STATUS_CODE] || "Unknown",
        launchDate: item.LAUNCH_DATE || "Unknown",
        launchSite: LAUNCH_SITE_MAP[item.LAUNCH_SITE] || "Unknown",
        decayDate: item.DECAY_DATE || "Unknown",
        owner: OWNER_MAP[item.OWNER] || "Unknown",
        orbitType: ORBIT_TYPE_MAP[item.ORBIT_TYPE] || "Unknown",
        period: item.PERIOD || null,
        inclination: item.INCLINATION || null,
        apogee: item.APOGEE || null,
        perigee: item.PERIGEE || null,
      };
      return acc;
    }, {});

    await setAsync(cacheKey, JSON.stringify(satcatData), cacheExpiration);
    return satcatData;
  } catch (error) {
    console.error("Error fetching SATCAT data:", error);
    return {};
  }
};

// Initialize TLE data with SATCAT data if missing
const initializeTleDataWithSatcat = async (tleData) => {
  const satcatData = await fetchAndCacheSatcatData();
  return tleData.map((satellite) => {
    const satcatInfo = satcatData[satellite.catalogNumber] || {};
    satellite.country = satcatInfo.country || "Unknown";
    satellite.objectType = satcatInfo.objectType || "Unknown";
    satellite.opsStatus = satcatInfo.opsStatus || "Unknown";
    satellite.launchDate = satcatInfo.launchDate || "Unknown";
    satellite.launchSite = satcatInfo.launchSite || "Unknown";
    satellite.decayDate = satcatInfo.decayDate || "Unknown";
    satellite.owner = satcatInfo.owner || "Unknown";
    satellite.orbitType = satcatInfo.orbitType || "Unknown";
    satellite.period = satcatInfo.period || null;
    satellite.inclination = satcatInfo.inclination || null;
    satellite.apogee = satcatInfo.apogee || null;
    satellite.perigee = satcatInfo.perigee || null;
    return satellite;
  });
};

// GraphQL setup
const apolloServer = new ApolloServer({ schema: graphqlSchema });
await apolloServer.start();
apolloServer.applyMiddleware({ app, path: "/api/graphql" });

// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

const fetchCelestrakData = async (retryCount = 0) => {
  const cacheKey = "celestrakData";
  const cacheExpiration = 60 * 60 * 2; // 2 hours

  try {
    const cachedData = await getAsync(cacheKey);
    if (cachedData) {
      console.log("Serving data from cache");
      const parsedData = JSON.parse(cachedData);
      return parsedData;
    }

    // Fetch from Celestrak
    const response = await axios.get(
      "https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    );

    const tleData = response.data;
    const lines = tleData.split("\n");
    const parsedData = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (lines[i].trim() && lines[i + 1] && lines[i + 2]) {
        const tle = `${lines[i]}\n${lines[i + 1]}\n${lines[i + 2]}`;
        const satName = getSatelliteName(tle);
        const catalogNumber = getCatalogNumber(tle);
        const cosparId = getCOSPAR(tle);
        const timestampMS = Date.now();
        const latLonObj = getLatLngObj(tle, timestampMS);
        const satInfo = getSatelliteInfo(tle, timestampMS);

        parsedData.push({
          name: satName,
          catalogNumber,
          cosparId,
          tle1: lines[i + 1].trim(),
          tle2: lines[i + 2].trim(),
          latitude: latLonObj.lat,
          longitude: latLonObj.lng,
          altitude: satInfo.height, // Include altitude
        });
      }
    }

    await setAsync(cacheKey, JSON.stringify(parsedData), cacheExpiration);
    return parsedData;
  } catch (error) {
    if (error.code === "NR_CLOSED") {
      console.error("Redis connection closed. Reconnecting...");
      await redisClient.connect(); // Reconnect to Redis server
      return fetchCelestrakData(retryCount + 1); // Retry fetching data
    } else {
      console.error("Error fetching Celestrak data:", error);
      return [];
    }
  }
};

// Define API route for fetching satellite data
app.get("/api/satellites", async (req, res) => {
  try {
    const data = await fetchCelestrakData();
    const initializedData = await initializeTleDataWithSatcat(data);
    res.json(initializedData);
  } catch (error) {
    console.error("Error in /api/satellites route:", error);
    res.status(500).send("An error occurred while fetching satellite data.");
  }
});

// Define API route for refreshing SATCAT cache
app.get("/api/refresh-satcat-cache", async (req, res) => {
  try {
    const cacheKey = "satcatData";
    await delAsync(cacheKey); // Delete the current cache
    await fetchAndCacheSatcatData(); // Fetch and cache new SATCAT data
    res.send("SATCAT cache has been refreshed.");
  } catch (error) {
    console.error("Error refreshing SATCAT cache:", error);
    res.status(500).send("An error occurred while refreshing SATCAT cache.");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
