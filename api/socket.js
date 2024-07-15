import { WebSocketServer } from "ws";
import axios from "axios";

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  console.log("Client connected");

  setInterval(async () => {
    const response = await axios.get(
      `https://aviation-edge.com/v2/public/satelliteDetails?key=YOUR_API_KEY&limit=30000`
    );
    ws.send(JSON.stringify({ type: "update", data: response.data }));
  }, 600000); // Every 10 minutes
});

export default (req, res) => {
  if (req.method === "GET") {
    res.socket.server.on("upgrade", (request, socket, head) => {
      if (request.url === "/api/socket") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    });
    res.status(200).end();
  } else {
    res.status(405).end();
  }
};
