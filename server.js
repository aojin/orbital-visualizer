import express from "express";
import { createServer } from "http";
import startApolloServer from "./api/graphql.js";
import socketHandler from "./api/socket.js";

(async () => {
  const app = await startApolloServer();

  app.use(express.static("public")); // Ensure this line is present to serve static files

  const server = createServer(app);
  app.use("/api/socket", socketHandler);

  server.listen(4000, () => {
    console.log("Server running at http://localhost:4000");
  });
})();
