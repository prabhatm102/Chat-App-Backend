const { User } = require("../model/user.model");
const io = require("../index");
const errMsg = require("../utils/errorMessages.json");
const fs = require("fs");
const { Conversation } = require("../model/conversation.model");
const { Message } = require("../model/message.model");

module.exports.getChatsByConversationOrUserId = async (req, res, next) => {
  const conversation = await Conversation.findOne({
    $or: [
      { _id: req.params.id },
      { members: [req.params.id, req.user?._id?.toString()] },
      { members: [req.user?._id?.toString(), req.params.id] },
    ],
    isDeleted: false,
  });
  // console.log(conversation);
  // console.log(req.params.id, req.user._id);
  if (!conversation) return res.status(200).send({ data: [] });
  // return res
  //   .status(400)
  //   .send(errMsg.CONVERSATION_API.INVALID_CONVERSATION_ID);

  let chats = await Message.find({
    conversation: conversation?._id?.toString(),
    isDeleted: false,
  })
    .populate("sender")
    .populate("members.member")
    .populate("conversation")
    .populate("conversation.member")
    .populate("conversation.creator");
  return res.status(200).send({ data: chats });
};

module.exports.getConversationByUserId = async (req, res, next) => {
  let user = await User.findOne({ _id: req.params.id, isDeleted: false });
  if (!user) return res.status(404).send(errMsg.USER_API.USER_NOT_FOUND);

  const conversation = await Conversation.find({
    members: { $in: req.params.id },
    isDeleted: false,
  })
    .populate("members")
    .populate("creator")
    .sort("-createdAt");
  // if (!conversation)
  //   return res.status(400).send(errMsg.CONVERSATION_API.GROUP_NOT_FOUND);

  res.status(200).send({ data: conversation });
};

module.exports.sendMessage = async (req, res, next) => {
  const receiver = await User.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  let conversation;

  if (!receiver) {
    conversation = await Conversation.findOne({
      _id: req.params.id,
      isDeleted: false,
      isGroup: true,
    });

    if (!conversation)
      return res.status(400).send({ message: "There is no receiver." });
    if (
      !conversation.members.some(
        (m) => m?.toString() === req.user?._id?.toString()
      )
    )
      return res.status(401).send(errMsg.CONVERSATION_API.NOT_A_GROUP_MEMBER);
  }
  if (req.user?.email === receiver?.email)
    return res.status(400).send({ message: "There is no receiver." });

  if (!conversation) {
    conversation = await Conversation.findOne({
      $and: [
        { isDeleted: false },
        {
          $or: [
            { members: [req.user?._id?.toString(), req.params.id] },
            { members: [req.params.id, req.user?._id?.toString()] },
          ],
        },
      ],
    }).select(" -__v");

    if (!conversation) {
      conversation = await new Conversation({
        members: [req.params.id, req.user?._id],
        creator: req.user?._id,
      }).save();
    }
  }

  let message = new Message({
    sender: req.user?._id?.toString(),
    message: req.body.message,
    conversation: conversation?._id?.toString(),
  });

  if (conversation)
    message.members = conversation.members.map((m) => {
      if (m?.toString() === req.user?._id?.toString())
        return { member: m, isSeen: true };
      else return { member: m };
    });

  message = await message.save();

  message = await Message.findOne({
    _id: message?._id?.toString(),
    isDeleted: false,
  }).populate([
    { path: "sender" },
    { path: "members.member" },
    {
      path: "conversation",
      populate: [{ path: "members" }, { path: "creator" }],
    },
  ]);
  if (receiver)
    io.to(req.params.id).emit("receiveMessage", {
      data: message,
      id: req.user?._id?.toString(),
    });
  else {
    let index = conversation?.members?.indexOf(req.user?._id?.toString());
    if (index > -1) {
      conversation?.members?.splice(index, 1);
      for (let member of conversation?.members) {
        io.to(member?._id?.toString()).emit("receiveMessage", {
          data: message,
          id: conversation?._id?.toString(),
        });
      }
    }
  }

  res.status(200).send({
    data: message,
  });
};

module.exports.createGroup = async (req, res, next) => {
  const isGroupNameExits = await Conversation.findOne({
    name: req.body.name.toLowerCase(),
    isDeleted: false,
    isGroup: true,
  });
  if (isGroupNameExits) {
    if (req.file) deleteFile(req.file);
    return res
      .status(400)
      .send(errMsg.CONVERSATION_API.GROUP_NAME_ALREADY_EXISTS);
  }

  let user;
  for (let member of req.body.members) {
    user = await User.findOne({ _id: member, isDeleted: false });
    if (!user) {
      if (req.file) deleteFile(req.file);
      return res.status(404).send(errMsg.CONVERSATION_API.MEMBER_NOT_FOUND);
    }
  }

  let isCreator = req.body.members.find((m) => m === req.user?._id?.toString());
  if (!isCreator) req.body.members.push(req.user?._id);

  let conversation = await new Conversation({
    name: req.body.name?.toLowerCase(),
    groupIcon: req.file.filename,
    members: req.body.members,
    creator: req.user?._id,
    isGroup: true,
  }).save();

  conversation = await Conversation.findOne({
    _id: conversation?._id?.toString(),
    isDeleted: false,
  })
    .populate("members")
    .populate("creator")
    .select("-isDeleted -__V");

  for (let member of conversation?.members) {
    if (member?._id.toString() === req.user?._id?.toString()) continue;
    io.to(member?._id?.toString()).emit("addedToGroup", {
      data: conversation,
    });
  }

  res.status(200).send({ data: conversation });
};

module.exports.addMembersToGroup = async (req, res, next) => {
  let conversation = await Conversation.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!conversation)
    return res
      .status(404)
      .send(errMsg.CONVERSATION_API.INVALID_CONVERSATION_ID);

  let isGroupMember = conversation.members.indexOf(req.user?._id?.toString());
  if (isGroupMember === -1)
    return res.status(401).send(errMsg.CONVERSATION_API.NOT_A_GROUP_MEMBER);
  let user;

  for (let member of req.body.members) {
    user = await User.findOne({ _id: member, isDeleted: false });
    if (!user)
      return res.status(404).send(errMsg.CONVERSATION_API.MEMBER_NOT_FOUND);
  }

  conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { $addToSet: { members: req.body.members } },
    { new: true }
  );
  let allMembers = conversation?.members;

  conversation = await Conversation.findOne({
    _id: conversation?._id?.toString(),
    isDeleted: false,
  })
    .populate("members")
    .populate("creator")
    .select("-isDeleted -__V");

  for (let member of allMembers) {
    if (member?.toString() === req.user?._id?.toString()) continue;
    io.to(member?.toString()).emit("addedToGroup", { data: conversation });
  }
  res.status(200).send({ data: conversation });
};

module.exports.removeMembersFromGroup = async (req, res, next) => {
  let conversation = await Conversation.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!conversation)
    return res
      .status(404)
      .send(errMsg.CONVERSATION_API.INVALID_CONVERSATION_ID);

  let isGroupMember = conversation.members.indexOf(req.user?._id?.toString());
  if (isGroupMember === -1)
    return res.status(401).send(errMsg.CONVERSATION_API.NOT_A_GROUP_MEMBER);
  let user;

  for (let member of req.body.members) {
    user = await User.findOne({ _id: member, isDeleted: false });
    if (!user)
      return res.status(404).send(errMsg.CONVERSATION_API.MEMBER_NOT_FOUND);
  }

  const isAllUsersGroupMember = await Conversation.findOne({
    members: { $in: req.body.members },
  });

  if (!isAllUsersGroupMember)
    return res
      .status(401)
      .send(errMsg.CONVERSATION_API.USER_NOT_A_GROUP_MEMBER);

  let totalMembers = conversation?.members;

  conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { $pullAll: { members: req.body.members } },
    { new: true }
  );

  conversation = await Conversation.findOne({
    _id: conversation?._id?.toString(),
    isDeleted: false,
  })
    .populate("members")
    .populate("creator")
    .select("-isDeleted -__V");

  for (let member of totalMembers) {
    if (member?.toString() === req.user?._id?.toString()) continue;
    io.to(member?.toString()).emit("removedFromGroup", {
      data: conversation,
      removedMembers: req.body.members,
    });
  }

  res.status(200).send({ data: conversation });
};

module.exports.updateMessageSeen = async (req, res, next) => {
  let message = await Message.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!message)
    return res.status(404).send(errMsg.CONVERSATION_API.MESSAGE_NOT_FOUND);

  let index = message?.members.findIndex(
    (m) => m?.member?.toString() === req.user?._id?.toString()
  );
  if (index === -1) return res.status(401).send(errMsg.GLOBAL.INVALID_USER);

  await Message.updateMany(
    {
      createdAt: { $lte: message?.createdAt },
      conversation: message?.conversation?.toString(),
      members: { $elemMatch: { member: req.user?._id?.toString() } },
    },
    { $set: { "members.$.isSeen": true } }
  );

  message = await Message.findOne({
    _id: message?._id?.toString(),
    isDeleted: false,
  }).populate([
    { path: "sender" },
    { path: "members.member" },
    {
      path: "conversation",
      populate: [{ path: "members" }, { path: "creator" }],
    },
  ]);

  io.to(message?.sender?._id?.toString()).emit("updateSeen", {
    data: message,
    seenBy: req.user?._id.toString(),
  });
  res.status(200).send({ data: message });
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
