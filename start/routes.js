const error = require("../middleware/error");
const express = require("express");
const cors = require("cors");

const user = require("../routes/user.routes");
const auth = require("../routes/auth.routes");
const conversation = require("../routes/conversation.routes");

module.exports = function (app) {
  var corsOptions = {
    origin: process.env.origin || "*",
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.use(express.static("public/"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API;
  app.use("/api/v1/users", user);
  app.use("/api/v1/auth", auth);
  app.use("/api/v1/conversations", conversation);

  app.use(error);
};
