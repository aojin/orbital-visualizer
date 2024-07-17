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
const getTTL = (key) => redisClient.ttl(key);

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
      const ttl = await getTTL(cacheKey);
      console.log(`Serving data from cache. TTL: ${ttl / 60} minutes`);
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

    console.log(`Parsed and cached ${parsedData.length} satellite records.`); // Summary log

    await setAsync(cacheKey, JSON.stringify(parsedData), cacheExpiration);
    return parsedData;
  } catch (error) {
    if (error.code === "NR_CLOSED") {
      console.error("Redis connection closed. Reconnecting...");
      await redisClient.connect(); // Reconnect to Redis server
      // Retry or handle appropriately
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
    res.json(data);
  } catch (error) {
    console.error("Error in /api/satellites route:", error);
    res.status(500).send("An error occurred while fetching satellite data.");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
