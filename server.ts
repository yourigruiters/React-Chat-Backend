import express from "express";
import ioserver from "socket.io";
import * as http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = ioserver(server);

const PORT = process.env.PORT || 5000;

const users = [
  {
    username: "iSnaek",
    color: "#381953"
  },
  {
    username: "UsedToLoveYa",
    color: "#939128"
  }
];
const isTyping = [
  {
    username: "iSnaek",
    color: "#381953"
  },
  {
    username: "UsedToLoveYa",
    color: "#939128"
  }
];

const colors = ["#183734", "#885522"];

// Use cross-origin resource sharing for communication between 2 locations
app.use(cors());

// Server is running
app.get("/", (req, res) => {
  res.send("Server up and running");
});

// Check if username is already taken
app.get("/api/user/:username", (req, res) => {
  const username = req.params.username;
  const userIndex = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );

  if (!userIndex) {
    res.status(200).json({ message: "Username free" });
  } else {
    res.status(202).json({ error: "Username already taken" });
  }
});

// Socket.io logic
io.on("connection", (socket: any) => {
  console.log(`Socket attached as ${socket}`);

  socket.on("join_chatroom", (username: string) => {
    console.log(username);
  });
  // io.emit()
  // socket.emit("sync_to_host", room.currentTime);

  socket.on("disconnect", () => {
    console.log("someone disconnected");
    socket.disconnect();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
