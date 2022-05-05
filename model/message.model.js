const mongoose = require("mongoose");

const message = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    members: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        isSeen: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("messages", message);

module.exports.Message = Message;
