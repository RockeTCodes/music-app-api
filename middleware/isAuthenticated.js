const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).json({ message: "You need to login first." });
  }
};

module.exports = isAuthenticated;
