const mongoose = require("mongoose");
const errMsg = require("../utils/errorMessages.json");

module.exports.validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).send(errMsg.GLOBAL.INVALID_OBJECT_ID);

  next();
};
