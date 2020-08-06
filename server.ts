import express from "express";
import ioserver from "socket.io";
import * as http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = ioserver(server);

const PORT = process.env.PORT || 5000;

// Fix: improve any below
const users: any[] = [];
const isTyping: string[] = [];

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
  // Send roomData to all users
  const sendRoomData = () => {
    const roomData = {
      onlineUsers: users,
      typingUsers: isTyping
    };

    io.emit("new_roomdata", roomData);
  };

  // Send message to all users
  const sendMessage = (messageType: number, message?: string) => {
    const userOnlineIndex = users.findIndex(
      (user: { username: string }) => user.username === socket.username
    );

    const newMessage = {
      username: users[userOnlineIndex].username,
      color: users[userOnlineIndex].color,
      type: messageType,
      message: message ? message : "",
      timestamp: ""
    };

    io.emit("new_message", newMessage);
  };

  socket.on("join_chatroom", (username: string) => {
    const color = colors[Math.floor(Math.random() * colors.length)];

    socket.username = username;

    const newUser = {
      username,
      color
    };

    users.push(newUser);

    sendRoomData();
    sendMessage(0);
  });

  socket.on("leave_chatroom", () => {
    // Send user leave message directly on disconnecting
    sendMessage(1);
  });

  socket.on("disconnect", () => {
    const userTypingIndex = isTyping.findIndex(
      (isTypingUser: string) => isTypingUser === socket.username
    );

    if (userTypingIndex !== -1) {
      isTyping.splice(userTypingIndex, 1);
    }

    const userOnlineIndex = users.findIndex(
      (user: { username: string }) => user.username === socket.username
    );

    users.splice(userOnlineIndex, 1);

    socket.disconnect();

    sendRoomData();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
