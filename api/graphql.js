import { ApolloServer, gql } from "apollo-server-express";
import axios from "axios";
import redis from "redis";
import express from "express";

const redisClient = redis.createClient();

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const typeDefs = gql`
  type Position {
    posX: String
    posY: String
    posZ: String
  }

  type Satellite {
    id: String
    name: String
    country: String
    launchYear: String
    position: Position
    type: String
  }

  type Query {
    satellites: [Satellite]
  }
`;

const resolvers = {
  Query: {
    satellites: async () => {
      const cachedData = await new Promise((resolve, reject) => {
        redisClient.get("satellites", (err, data) => {
          if (err) return reject(err);
          if (data) return resolve(JSON.parse(data));

          axios
            .get(
              `https://aviation-edge.com/v2/public/satelliteDetails?key=YOUR_API_KEY&limit=30000`
            )
            .then((response) => {
              redisClient.set(
                "satellites",
                JSON.stringify(response.data),
                "EX",
                600
              ); // Cache for 10 minutes
              resolve(response.data);
            })
            .catch(reject);
        });
      });
      return cachedData;
    },
  },
};

async function startApolloServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = express();
  server.applyMiddleware({ app, path: "/api/graphql" });

  return app;
}

export default startApolloServer;
