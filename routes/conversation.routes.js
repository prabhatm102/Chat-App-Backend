const express = require("express");

const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { validateObjectId } = require("../middleware/validateObjectId");

const multer = require("multer");
const path = require("path");
const {
  validateCreateGroup,
  validateSendMessage,
  validateAddMembers,
  validateMessageSeen,
} = require("../validation/conversation.validation");
const {
  createGroup,
  sendMessage,
  getConversationByUserId,
  getChatsByConversationOrUserId,
  addMembersToGroup,
  updateMessageSeen,
  removeMembersFromGroup,
} = require("../controller/conversation.controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/groupIcon/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/user/:id", validateObjectId, auth, getConversationByUserId);
router.get(
  "/chats/:id",
  validateObjectId,
  auth,
  getChatsByConversationOrUserId
);

router.post(
  "/create-group",
  upload.single("groupIcon"),
  auth,
  validateCreateGroup,
  createGroup
);

router.patch(
  "/send-message/:id",
  validateObjectId,
  auth,
  validateSendMessage,
  sendMessage
);

router.patch(
  "/add-members/:id",
  validateObjectId,
  auth,
  validateAddMembers,
  addMembersToGroup
);

router.patch(
  "/remove-members/:id",
  validateObjectId,
  auth,
  validateAddMembers,
  removeMembersFromGroup
);

router.patch(
  "/chats/update-seen/:id",
  validateObjectId,
  auth,
  validateMessageSeen,
  updateMessageSeen
);

module.exports = router;
