const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Please sign in to continue." });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Please sign in to continue." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Administrator access is required." });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
