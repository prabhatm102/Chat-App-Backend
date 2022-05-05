const mongoose = require("mongoose");

const conversation = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      maxLength: 40,
    },
    groupIcon: {
      type: String,
      default: "",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("conversations", conversation);

module.exports.Conversation = Conversation;
