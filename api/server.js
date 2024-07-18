import express from "express";
import path from "path";
import http from "http";
import cors from "cors";
import axios from "axios";
import { createClient } from "redis";
import {
  getSatelliteName,
  getCatalogNumber,
  getCOSPAR,
  getLatLngObj,
  getSatelliteInfo,
} from "tle.js";
import {
  OWNER_MAP,
  OPS_STATUS_DESCRIPTIONS,
  OWNER_TO_COUNTRY_CODE_MAP,
  OBJECT_TYPE_MAP,
  ORBIT_TYPE_MAP,
  LAUNCH_SITE_MAP,
} from "../utils/mappings.js";
import {
  getFlagPath,
  downloadFlagOverwrite,
  getCountryCode,
} from "../utils/downloadFlags.js";

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
const ttlAsync = (key) => redisClient.ttl(key); // Get the TTL for a key

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

    // Group ALL does not exist, must be active or inactive
    const response = await axios.get(
      "https://celestrak.org/satcat/records.php?GROUP=active&FORMAT=JSON"
    );

    // Ensure response.data is an array
    if (!Array.isArray(response.data)) {
      throw new Error("Expected response.data to be an array");
    }

    // console.log("SATCAT data fetched from API:", response.data);

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
    console.error("Error fetching SATCAT data:", error.message);
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

// Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

async function fetchCelestrakData(retryCount = 0) {
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
        const ownerKey = tle.split("\n")[0].trim();
        const countryCode = OWNER_TO_COUNTRY_CODE_MAP[ownerKey] || "unk"; // Use "unk" if no country code found
        const flagPath = `/flags/${countryCode}.png`; // Get flag path

        console.log(`Setting flagPath for ${satName}: ${flagPath}`); // Log the flag path

        parsedData.push({
          name: satName,
          catalogNumber,
          cosparId,
          tle1: lines[i + 1].trim(),
          tle2: lines[i + 2].trim(),
          latitude: latLonObj.lat,
          longitude: latLonObj.lng,
          altitude: satInfo.height, // Include altitude
          flagPath, // Include flag path
        });
      }
    }

    await setAsync(cacheKey, JSON.stringify(parsedData), cacheExpiration);
    return parsedData;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const ttl = await ttlAsync(cacheKey);
      const minutesLeft = Math.floor(ttl / 60);
      console.error(
        `Error fetching Celestrak data: Access forbidden. Serving cached data. Minutes left until cache expiry: ${minutesLeft}`
      );
      const cachedData = await getAsync(cacheKey);
      if (cachedData) {
        console.log("Serving cached data due to access restriction");
        return JSON.parse(cachedData);
      } else {
        console.error("No cached data available");
        return [];
      }
    } else if (error.code === "NR_CLOSED") {
      console.error("Redis connection closed. Reconnecting...");
      await redisClient.connect(); // Reconnect to Redis server
      return fetchCelestrakData(retryCount + 1); // Retry fetching data
    } else {
      console.error("Error fetching Celestrak data:", error);
      return [];
    }
  }
}

const getTopSatelliteOwners = (satcatData) => {
  const ownerCounts = Object.values(satcatData).reduce((acc, item) => {
    const owner = item.owner || "Unknown";
    acc[owner] = (acc[owner] || 0) + 1;
    return acc;
  }, {});

  const sortedOwners = Object.entries(ownerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return sortedOwners;
};

app.get("/api/satellites", async (req, res) => {
  try {
    const data = await fetchCelestrakData();
    const initializedData = await initializeTleDataWithSatcat(data);
    const satcatData = await fetchAndCacheSatcatData();
    const topOwners = getTopSatelliteOwners(satcatData);
    res.json({ satellites: initializedData, topOwners });
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

// Define API route for refreshing flag paths
app.get("/api/refresh-flag-paths", async (req, res) => {
  try {
    const satcatData = await fetchAndCacheSatcatData();

    const owners = new Set(Object.values(satcatData).map((sat) => sat.owner));
    const promises = [];

    owners.forEach((owner) => {
      const countryCode = getCountryCode(owner);
      if (countryCode) {
        promises.push(downloadFlagOverwrite(countryCode));
      }
    });

    const results = await Promise.all(promises);

    res.json({
      message: "Flag paths refreshed successfully",
      refreshedOwners: results.filter((result) => result !== null),
    });
  } catch (error) {
    console.error("Error refreshing flag paths:", error);
    res.status(500).send("An error occurred while refreshing flag paths.");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
