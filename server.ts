import express from "express";
import ioserver from "socket.io";
import * as http from "http";
import cors from "cors";
import winston from "winston";

const app = express();
const server = http.createServer(app);
const io = ioserver(server, { pingInterval: 30000, pingTimeout: 30000 });

const PORT = process.env.PORT || 5000;

const users: { username: string; color: string; active: boolean }[] = [];
const isTyping: string[] = [];

// Winston logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "express-socket-logging" },
  transports: [
    // - Write all logs with level `info (could add error)' to logfile-info.log
    new winston.transports.File({
      filename: "log/logfile-info.log",
      level: "info"
    })
  ]
});

const colors = [
  "#e13838",
  "#e138a4",
  "#4438e1",
  "#38e1db",
  "#38e16e",
  "#60e138",
  "#e1dd38",
  "#e1be38",
  "#e18038",
  "#e15138",
  "#000000",
  "#8c8c8c",
  "#38a2e1",
  "#386ce1",
  "#6938e1"
];

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
    (user: { username: string }) =>
      user.username.toLowerCase() === username.toLowerCase()
  );

  if (!userIndex) {
    res.status(200).json({ message: "Username free" });
  } else {
    res.status(202).json({ error: "Username already taken" });
  }
});

// Socket.io logic
io.on("connection", (socket: any) => {
  // Get and return index of user in user array
  const getUserOnlineIndex = () => {
    const userOnlineIndex = users.findIndex(
      (user: { username: string }) => user.username === socket.username
    );

    return userOnlineIndex;
  };

  // Get and return index of user in isTyping array
  const getUserTypingIndex = () => {
    const userTypingIndex = isTyping.findIndex(
      (isTypingUser: string) => isTypingUser === socket.username
    );

    return userTypingIndex;
  };

  // Remove user from the chatroom if inactive
  const activityKicker = () => {
    // Send activity disconnecting message
    sendMessage(2);

    const userOnlineIndex = getUserOnlineIndex();

    if (userOnlineIndex !== -1) {
      users[userOnlineIndex].active = false;
    }

    socket.emit("leave_inactivity");
  };

  // Reset and use activityChecker to remove user if inactive for 5 minutes
  let logoffTimer: any;
  const activityChecker = () => {
    clearTimeout(logoffTimer);

    logoffTimer = setTimeout(activityKicker, 300000);
  };

  // Send roomData to all users
  const sendRoomData = () => {
    const roomData = {
      onlineUsers: users,
      typingUsers: isTyping
    };

    io.emit("new_roomdata", roomData);
  };

  // Send new message to all users
  const sendMessage = (messageType: number, message?: string) => {
    const userOnlineIndex = getUserOnlineIndex();

    if (userOnlineIndex === -1) {
      return;
    }

    const newMessage = {
      username: users[userOnlineIndex].username,
      color: users[userOnlineIndex].color,
      type: messageType,
      message: message ? message : "",
      timestamp: ""
    };

    io.emit("new_message", newMessage);
  };

  // Send isTyping users to all users
  const changedTyping = (state: boolean) => {
    // Reset activityChecker();
    activityChecker();

    if (state) {
      isTyping.push(socket.username);
    } else {
      const userTypingIndex = getUserTypingIndex();

      if (userTypingIndex !== -1) {
        isTyping.splice(userTypingIndex, 1);
      }
    }

    io.emit("changed_typing", isTyping);
  };

  // User joining a chatroom  - Request roomData
  socket.on("join_chatroom", (username: string) => {
    logger.log("info", `${username} has joined the server at ${new Date()}`);
    const userOnlineIndex = getUserOnlineIndex();

    if (userOnlineIndex !== -1) {
      socket.emit("leave_inactivity");
      return;
    }

    const color = colors[Math.floor(Math.random() * colors.length)];

    // Set username to socket for simplified user tracking
    socket.username = username;

    const newUser = {
      username,
      color,
      active: true
    };

    users.push(newUser);

    sendRoomData();
    // Send joining message
    sendMessage(0);
    // Reset activityChecker();
    activityChecker();
  });

  // Leaving chatroom
  socket.on("leave_chatroom", () => {
    logger.log(
      "info",
      `${socket.username} has left the server at ${new Date()}`
    );
    // Send leaving message
    sendMessage(1);

    const userOnlineIndex = getUserOnlineIndex();

    if (userOnlineIndex !== -1) {
      users[userOnlineIndex].active = false;
    } else {
      socket.emit("leave_inactivity");
      return;
    }
  });

  // Changed typing - Call function to resend isTyping
  socket.on("changed_typing", (state: boolean) => {
    changedTyping(state);
  });

  // Default message function called from client
  socket.on("send_message", (message: string) => {
    changedTyping(false);
    // Send refreshing disconnecting message
    sendMessage(4, message);
  });

  // Disconnecting from server in all ways
  socket.on("disconnect", () => {
    const userTypingIndex = getUserTypingIndex();

    if (userTypingIndex !== -1) {
      // Remove user from list of typing users
      isTyping.splice(userTypingIndex, 1);
    }

    const userOnlineIndex = getUserOnlineIndex();

    if (users[userOnlineIndex]) {
      if (users[userOnlineIndex].active) {
        // Send user connection message if active
        sendMessage(3);
      }
    }

    // Remove user from list of online users
    users.splice(userOnlineIndex, 1);

    socket.disconnect();

    sendRoomData();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

// Close connections on SIGTERM signal
process.on("SIGTERM", () => {
  server.close(() => {
    io.close(() => {
      process.exit(0);
    });
  });
});

// Close connections on SIGINT signal
process.on("SIGINT", () => {
  server.close(() => {
    io.close(() => {
      process.exit(0);
    });
  });
});
