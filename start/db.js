const config = require("config");
const { default: mongoose } = require("mongoose");
const winston = require("winston");

module.exports = () => {
  let db = config.get("db");
  mongoose.connect(db).then(() => {
    winston.info(`Connected to ${db}`);
  });
};
