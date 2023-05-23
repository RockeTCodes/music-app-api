const { User } = require("../models");

const isAdmin = (req, res, next) => {
  const role = req.user.role;
  if (role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "You need to be admin to access this page." });
  }
};

module.exports = isAdmin;
