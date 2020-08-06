"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http = __importStar(require("http"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
const server = http.createServer(app);
const io = socket_io_1.default(server, { pingInterval: 30000, pingTimeout: 30000 });
const PORT = process.env.PORT || 5000;
// Fix: improve any below
const users = [];
const isTyping = [];
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
    "#8c8c8c"
];
// Use cross-origin resource sharing for communication between 2 locations
app.use(cors_1.default());
// Server is running
app.get("/", (req, res) => {
    res.send("Server up and running");
});
// Check if username is already taken
app.get("/api/user/:username", (req, res) => {
    const username = req.params.username;
    const userIndex = users.find((user) => user.username.toLowerCase() === username.toLowerCase());
    if (!userIndex) {
        res.status(200).json({ message: "Username free" });
    }
    else {
        res.status(202).json({ error: "Username already taken" });
    }
});
// Socket.io logic
io.on("connection", (socket) => {
    const activityKicker = () => {
        console.log("FIREEEE");
        // Send user leave message directly on clicking disconnect
        sendMessage(2);
        const userOnlineIndex = users.findIndex((user) => user.username === socket.username);
        users[userOnlineIndex].active = false;
        socket.emit("leave_inactivity");
    };
    let logoffTimer;
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
    const sendMessage = (messageType, message) => {
        const userOnlineIndex = users.findIndex((user) => user.username === socket.username);
        const newMessage = {
            username: users[userOnlineIndex].username,
            color: users[userOnlineIndex].color,
            type: messageType,
            message: message ? message : "",
            timestamp: ""
        };
        io.emit("new_message", newMessage);
    };
    // Fix: on send message also call changedTyping with false
    const changedTyping = (state) => {
        console.log(socket.username, "CHANGED TYPING");
        // Reset activityChecker();
        activityChecker();
        if (state) {
            isTyping.push(socket.username);
        }
        else {
            const userTypingIndex = isTyping.findIndex((isTypingUser) => isTypingUser === socket.username);
            if (userTypingIndex !== -1) {
                isTyping.splice(userTypingIndex, 1);
            }
        }
        io.emit("changed_typing", isTyping);
    };
    // Joining chatroom
    socket.on("join_chatroom", (username) => {
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
        const userOnlineIndex = users.findIndex((user) => user.username === socket.username);
        users[userOnlineIndex].active = false;
    });
    // Changed typing
    socket.on("changed_typing", (state) => {
        changedTyping(state);
    });
    socket.on("send_message", (message) => {
        changedTyping(false);
        sendMessage(4, message);
    });
    // Disconnecting from server in all ways
    socket.on("disconnect", () => {
        const userTypingIndex = isTyping.findIndex((isTypingUser) => isTypingUser === socket.username);
        if (userTypingIndex !== -1) {
            isTyping.splice(userTypingIndex, 1);
        }
        const userOnlineIndex = users.findIndex((user) => user.username === socket.username);
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
//# sourceMappingURL=server.js.map