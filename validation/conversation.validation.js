const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const fs = require("fs");
const path = require("path");
const errMsg = require("../utils/errorMessages.json");

module.exports.validateCreateGroup = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(3),
    members: Joi.array()
      .items(Joi.objectId().required())
      .unique()
      .required()
      .label("Members"),
    groupIcon: Joi.any(),
  });
  const { error } = schema.validate(req.body);

  if (!req.file)
    return res.status(404).send(errMsg.CONVERSATION_API.GROUP_ICON_IS_REQUIRED);

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

module.exports.validateSendMessage = async (req, res, next) => {
  const schema = Joi.object({
    message: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  next();
};

module.exports.validateAddMembers = async (req, res, next) => {
  const schema = Joi.object({
    members: Joi.array()
      .items(Joi.objectId().required())
      .unique()
      .required()
      .label("Members"),
    groupIcon: Joi.any(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  next();
};

module.exports.validateMessageSeen = async (req, res, next) => {
  const schema = Joi.object({
    isSeen: Joi.boolean().required(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  next();
};
