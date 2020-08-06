import express from "express";
import ioserver from "socket.io";
import * as http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = ioserver(server, { pingInterval: 30000, pingTimeout: 30000 });

const PORT = process.env.PORT || 5000;

const users: { username: string; color: string; active: boolean }[] = [];
const isTyping: string[] = [];

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
  const activityKicker = () => {
    // Send user leave message directly on clicking disconnect
    sendMessage(2);

    const userOnlineIndex = users.findIndex(
      (user: { username: string }) => user.username === socket.username
    );
    if (userOnlineIndex !== -1) {
      users[userOnlineIndex].active = false;
    }

    socket.emit("leave_inactivity");
  };

  let logoffTimer: any;
  const activityChecker = () => {
    // clear the timer on activity
    clearTimeout(logoffTimer);

    // Set timer - maximum inactivity of 5 minute
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

  // Send message to all users
  const sendMessage = (messageType: number, message?: string) => {
    const userOnlineIndex = users.findIndex(
      (user: { username: string }) => user.username === socket.username
    );

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

  const changedTyping = (state: boolean) => {
    // Reset activityChecker();
    activityChecker();

    if (state) {
      isTyping.push(socket.username);
    } else {
      const userTypingIndex = isTyping.findIndex(
        (isTypingUser: string) => isTypingUser === socket.username
      );

      if (userTypingIndex !== -1) {
        isTyping.splice(userTypingIndex, 1);
      }
    }

    io.emit("changed_typing", isTyping);
  };

  // Joining chatroom
  socket.on("join_chatroom", (username: string) => {
    const color = colors[Math.floor(Math.random() * colors.length)];

    socket.username = username;

    const newUser = {
      username,
      color,
      active: true
    };

    users.push(newUser);

    sendRoomData();
    sendMessage(0);
    // Reset activityChecker();
    activityChecker();
  });

  // Leaving chatroom
  socket.on("leave_chatroom", () => {
    // Send user leave message directly on clicking disconnect
    sendMessage(1);

    const userOnlineIndex = users.findIndex(
      (user: { username: string }) => user.username === socket.username
    );

    if (userOnlineIndex !== -1) {
      users[userOnlineIndex].active = false;
    } else {
      socket.emit("leave_inactivity");
      return;
    }
  });

  // Changed typing
  socket.on("changed_typing", (state: boolean) => {
    changedTyping(state);
  });

  socket.on("send_message", (message: string) => {
    changedTyping(false);
    sendMessage(4, message);
  });

  // Disconnecting from server in all ways
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

    // Send user leave message on losing connection when user is active
    if (users[userOnlineIndex].active) {
      sendMessage(3);
    }

    users.splice(userOnlineIndex, 1);

    socket.disconnect();

    sendRoomData();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

// Close everything on SIGTERM signal
process.on("SIGTERM", () => {
  server.close(() => {
    io.close(() => {
      process.exit(0);
    });
  });
});

// Close everything on SIGINT signal
process.on("SIGINT", () => {
  server.close(() => {
    io.close(() => {
      process.exit(0);
    });
  });
});
