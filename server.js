const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const cors = require("cors");
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

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server up and running");
});

app.get("/api/user/:username", (req, res) => {
  const username = req.params.username;
  const userIndex = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );

  console.log("oleee");

  if (!userIndex) {
    res.status(200).json({ message: "Username free" });
  } else {
    res.status(202).json({ error: "Username already taken" });
  }
});

io.on("connection", (socket) => {
  console.log(`Socket attached as ${socket}`);
});

http.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
