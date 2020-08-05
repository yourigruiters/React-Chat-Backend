const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const cors = require("cors");
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server up and running");
});

io.on("connection", (socket) => {
  console.log(`Socket attached as ${socket}`);
});

http.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
