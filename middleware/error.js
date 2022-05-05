const winston = require("winston");

module.exports = (ex, req, res, next) => {
  console.log(ex);
  winston.error(ex.message);
  winston.add(new winston.transports.File({ filename: "logException.log" }));
  res.status(500).send({ status: 500, message: ex.message });
};
