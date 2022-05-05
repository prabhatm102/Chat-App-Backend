const Joi = require("joi");
const fs = require("fs");
const path = require("path");
const errMsg = require("../utils/errorMessages.json");

module.exports.validateUser = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(3),
    email: Joi.string().required().email().max(40),
    password: Joi.string().required().min(8).max(16),
    avatar: Joi.any(),
  });
  const { error } = schema.validate(req.body);

  if (!req.file)
    return res.status(404).send(errMsg.USER_API.AVATAR_IS_REQUIRED);

  if (error) {
    if (req.file) {
      try {
        fs.existsSync(req.file?.path) && fs.unlinkSync(req.file?.path);
      } catch (err) {}
    }
    return res.status(400).send({ message: error.details[0].message });
  }

  next();
};

module.exports.validateLogin = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().max(40),
    password: Joi.string().required().min(8).max(16),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  next();
};
