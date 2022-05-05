const { User } = require("../model/user.model");
const bcrypt = require("bcrypt");
const errMsg = require("../utils/errorMessages.json");
const fs = require("fs");

module.exports.getUsers = async (req, res, next) => {
  const users = await User.find({ isDeleted: false })
    .select("-password -__v")
    .sort("name");
  return res.status(200).send({ data: users });
};

module.exports.getUserById = async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).select("-password -__v");
  if (!user) return res.status(404).send(errMsg.USER_API.USER_NOT_FOUND);
  return res.status(200).send({ data: user });
};

module.exports.createUser = async (req, res, next) => {
  const duplicateUser = await User.findOne({ email: req.body.email });
  if (duplicateUser) {
    deleteFile(req.file);
    return res.status(400).send(errMsg.USER_API.EMAIL_ALREADY_EXIST);
  }

  let user = new User({
    name: req.body.name,
    email: req.body.email,
    avatar: req.file.filename,
  });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  user.password = hashedPassword;

  user = await user.save();
  // const token = user.generateToken();
  let { _id, name, email, avatar, isAdmin, isActive } = user;
  res
    .status(200)
    // .header("access-control-expose-heades", "x-auth-token")
    // .header("x-auth-token", token)
    .send({
      status: 200,
      // token: token,
      data: {
        _id,
        name,
        email,
        avatar,
        isAdmin,
        isActive,
      },
    });
};

module.exports.deleteUser = async (req, res, next) => {
  if (req.user?._id?.toString() === req.params.id)
    return res.status(401).send(errMsg.USER_API.SELF_DELETE_ERROR);

  const user = await User.findOne({ _id: req.params.id });
  if (!user) return res.status(400).send(errMsg.USER_API.USER_NOT_FOUND);

  await User.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  res.status(200).send(errMsg.USER_API.USER_SUCCESSFULLY_DELETED);
};

function deleteFile(file) {
  if (file) {
    try {
      fs.existsSync(file?.path) && fs.unlinkSync(file?.path);
      return;
    } catch (err) {
      return;
    }
  }
}
