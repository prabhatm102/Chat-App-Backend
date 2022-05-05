const express = require("express");
const {
  getUsers,
  getUserById,
  createUser,
  deleteUser,
} = require("../controller/user.controller");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");
const { validateObjectId } = require("../middleware/validateObjectId");
const { validateUser } = require("../validation/user.validate");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/avatar/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get("/:id", validateObjectId, auth, getUserById);
router.get("/", auth, getUsers);

router.post("/", upload.single("avatar"), validateUser, createUser);

router.delete("/:id", validateObjectId, auth, admin, deleteUser);

module.exports = router;
