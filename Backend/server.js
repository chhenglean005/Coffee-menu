require("dotenv").config();

const cors = require("cors");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcryptjs");
const path = require("path");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const { requireAuth } = require("./middleware/requireAuth");

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;
const uploadDirectory = path.join(__dirname, "uploads");
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const sessionCookieName = "coffee-shop.sid";

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters. Generate one with crypto.randomBytes(32).toString('hex').");
}

if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadDirectory, { index: false }));

app.use(
  session({
    name: sessionCookieName,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      clientPromise: mongoose.connection.asPromise().then((connection) => connection.getClient()),
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== frontendOrigin) {
    const error = new Error("Request origin is not allowed.");
    error.code = "ORIGIN_NOT_ALLOWED";
    return next(error);
  }
  return next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image files must be 5 MB or smaller." });
  }
  if (error.code === "INVALID_IMAGE_TYPE") {
    return res.status(400).json({ message: "Choose a JPEG, PNG, WebP, or GIF image." });
  }
  if (error.code === "EBADCSRFTOKEN" || error.code === "ORIGIN_NOT_ALLOWED") {
    return res.status(403).json({ message: "This request origin is not allowed." });
  }
  if (error.code === "CLOUDINARY_NOT_CONFIGURED") {
    return res.status(503).json({ message: "Image storage is not configured. Add the Cloudinary credentials to the backend environment." });
  }
  if (error.code === "CLOUDINARY_UPLOAD_FAILED") {
    console.error("Cloudinary image upload failed:", error.message);
    return res.status(502).json({ message: "Image storage could not process the upload. Please try again." });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must contain valid JSON." });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  console.error("API request failed:", error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

async function startServer() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Add it to Backend/.env before starting the API.");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");
  await initializeFirstAdmin();

  app.listen(port, () => {
    console.log(`Coffee shop API listening on http://localhost:${port}`);
  });
}

async function initializeFirstAdmin() {
  if (await User.exists({})) return;

  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("No users exist. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in Backend/.env to create the first admin.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("INITIAL_ADMIN_EMAIL must be a valid email address.");
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be between 12 and 128 characters.");
  }

  await User.create({
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
  });
  console.log(`Created the initial administrator account for ${email}.`);
}

startServer().catch((error) => {
  console.error("Unable to start the coffee shop API:", error.message);
  process.exitCode = 1;
});
