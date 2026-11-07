const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const User = require("../models/User");
const { requireAdmin, requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
const passwordMinLength = 12;
const dummyPasswordHash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 12);
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please wait 15 minutes and try again." },
});

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function validateCredentials(req, res, next) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (typeof password !== "string" || password.length < passwordMinLength || password.length > 128) {
    return res.status(400).json({ message: `Password must be between ${passwordMinLength} and 128 characters.` });
  }
  return next();
}

router.post(
  "/login",
  loginLimiter,
  validateCredentials,
  asyncHandler(async (req, res, next) => {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    const passwordMatches = await bcrypt.compare(req.body.password, user?.passwordHash ?? dummyPasswordHash);
    if (!user || !passwordMatches) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.userId = user.id;
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.json({ user: publicUser(user) });
      });
    });
  }),
);

router.get(
  "/me",
  requireAuth,
  (req, res) => res.json({ user: publicUser(req.user) }),
);

router.post(
  "/logout",
  (req, res, next) => {
    if (!req.session) return res.status(204).end();
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("coffee-shop.sid", req.app.locals.sessionCookieOptions);
      return res.status(204).end();
    });
  },
);

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: 1 });
    res.json(users.map(publicUser));
  }),
);

router.post(
  "/users",
  requireAuth,
  requireAdmin,
  validateCredentials,
  asyncHandler(async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const existing = await User.exists({ email });
    if (existing) return res.status(409).json({ message: "An account with that email already exists." });

    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(req.body.password, 12),
      role: "staff",
    });
    return res.status(201).json({ user: publicUser(user) });
  }),
);

router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "User ID is invalid." });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot remove your own account." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found." });
    if (target.role !== "staff") {
      return res.status(403).json({ message: "Only staff accounts can be removed here." });
    }

    await target.deleteOne();
    return res.status(204).end();
  }),
);

module.exports = router;
