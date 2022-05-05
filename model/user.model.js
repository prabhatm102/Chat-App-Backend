const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxlength: 255,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 40,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 255,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.generateToken = function () {
  const userInfo = {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    isAdmin: this.isAdmin,
    isActive: this.isActive,
  };

  return jwt.sign(userInfo, config.get("jwtPrivateKey")); //, { expiresIn: "24h" }
};

const User = mongoose.model("users", userSchema);

module.exports.User = User;
