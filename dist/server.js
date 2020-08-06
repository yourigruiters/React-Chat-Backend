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
const io = socket_io_1.default(server);
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
    console.log(`Socket attached as ${socket}`);
    socket.on("join_chatroom", (username) => {
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
//# sourceMappingURL=server.js.map