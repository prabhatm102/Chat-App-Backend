const { User } = require("../model/user.model");
const bcrypt = require("bcrypt");
const errMsg = require("../utils/errorMessages.json");

module.exports.login = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email, isDeleted: false });
  if (!user) return res.status(404).send(errMsg.AUTH_API.INVALID_EMAIL);

  const isValid = await bcrypt.compare(req.body.password, user.password);

  if (!isValid) return res.status(400).send(errMsg.AUTH_API.INVALID_PASSWORD);

  if (!user.isActive) return res.status(403).send(errMsg.AUTH_API.DEACTIVATED);

  const token = user.generateToken();

  const { _id, name, email, avatar, isAdmin, isActive } = user;

  res
    .status(200)
    .header("access-control-expose-headers", "x-auth-token")
    .header("x-auth-token", token)
    .send({
      status: 200,
      token: token,
      message: "Login successful!",
    });
};
