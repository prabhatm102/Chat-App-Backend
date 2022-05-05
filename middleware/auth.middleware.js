const config = require("config");
const jwt = require("jsonwebtoken");
const { User } = require("../model/user.model");
const errMsg = require("../utils/errorMessages.json");

module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send(errMsg.GLOBAL.NO_TOKEN);
  }
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    const user = await User.findOne({
      _id: decoded?._id?.toString(),
      isDeleted: false,
    });
    if (!user) return res.status(401).send(errMsg.GLOBAL.INVALID_USER);
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(401).send(errMsg.GLOBAL.INVALID_TOKEN);
  }
};
