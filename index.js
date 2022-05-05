const express = require("express");
const app = express();
const winston = require("winston");
const PORT = process.env.PORT || 5000;

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User Connected:" + socket.id);

  // socket.broadcast.emit("userStatus", { id: socket.id, status: true });

  socket.on("joinRoom", (data) => {
    socket.join(data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:" + socket.id);
    //  io.emit("userStatus", { id: , status: false });
    // socket.broadcast.emit("userStatus", { id: socket.id, status: false });
  });
});

module.exports = io;

require("./start/config")();
require("./start/logging")();
require("./start/db")();
require("./start/routes")(app);

server.listen(PORT, () => {
  winston.info(`Server listening on port ${PORT}`);
});
