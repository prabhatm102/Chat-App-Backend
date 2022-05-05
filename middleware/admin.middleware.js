const errMsg = require("../utils/errorMessages.json");

module.exports = async (req, res, next) => {
  if (!req.user?.isAdmin)
    return res.status(403).send(errMsg.GLOBAL.DONT_HAVE_PERMISSION);
  next();
};
