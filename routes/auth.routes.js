const express = require("express");
const { login } = require("../controller/auth.controller");
const { validateLogin } = require("../validation/user.validate");
const router = express.Router();

router.post("/", validateLogin, login);

module.exports = router;
