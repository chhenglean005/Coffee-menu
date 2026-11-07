const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const CoffeeItem = require("../models/CoffeeItem");
const { requireAuth } = require("../middleware/requireAuth");
const { deleteImage, uploadImage } = require("../services/cloudinary");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "..", "uploads");
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error("Choose a JPEG, PNG, WebP, or GIF image.");
      error.code = "INVALID_IMAGE_TYPE";
      return callback(error);
    }
    return callback(null, true);
  },
});
const editableFields = ["name", "description", "price", "category", "available"];

function getImageFormat(buffer, mimetype) {
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isGif = buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6));
  const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  const detectedType = isPng ? "image/png" : isJpeg ? "image/jpeg" : isGif ? "image/gif" : isWebp ? "image/webp" : "";
  if (!detectedType || detectedType !== mimetype) {
    const error = new Error("The selected file is not a valid JPEG, PNG, WebP, or GIF image.");
    error.code = "INVALID_IMAGE_TYPE";
    throw error;
  }
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[detectedType];
}

async function removeStoredImage(image, publicId) {
  if (publicId) {
    await deleteImage(publicId);
    return;
  }

  // Remove files uploaded before image storage moved to Cloudinary.
  if (!image?.startsWith("/uploads/")) return;
  const filename = path.basename(image);
  try {
    await fs.promises.unlink(path.join(uploadDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(async (error) => {
      if (req.uploadedImage?.publicId) {
        try {
          await deleteImage(req.uploadedImage.publicId);
        } catch (cleanupError) {
          console.error("Unable to remove uncommitted Cloudinary upload:", cleanupError);
        }
      }
      next(error);
    });
  };
}

function uploadImageToCloudinary(req, res, next) {
  if (!req.file) return next();

  Promise.resolve()
    .then(() => uploadImage(req.file.buffer, getImageFormat(req.file.buffer, req.file.mimetype)))
    .then((image) => {
      req.uploadedImage = image;
      next();
    })
    .catch(next);
}

function isValidItemId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Menu item ID is invalid." });
  }
  return next();
}

function pickEditableFields(body) {
  return Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [field, body[field]]),
  );
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await CoffeeItem.find().sort({ category: 1, name: 1 });
    res.json(items);
  }),
);

router.get(
  "/:id",
  isValidItemId,
  asyncHandler(async (req, res) => {
    const item = await CoffeeItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    return res.json(item);
  }),
);

router.post(
  "/",
  requireAuth,
  imageUpload.single("image"),
  uploadImageToCloudinary,
  asyncHandler(async (req, res) => {
    const item = await CoffeeItem.create({
      ...pickEditableFields(req.body),
      image: req.uploadedImage?.url ?? "",
      imagePublicId: req.uploadedImage?.publicId ?? "",
    });
    res.status(201).json(item);
  }),
);

router.put(
  "/:id",
  isValidItemId,
  requireAuth,
  imageUpload.single("image"),
  uploadImageToCloudinary,
  asyncHandler(async (req, res) => {
    const updates = pickEditableFields(req.body);
    if (req.uploadedImage) {
      updates.image = req.uploadedImage.url;
      updates.imagePublicId = req.uploadedImage.publicId;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide at least one editable menu item field." });
    }

    const item = await CoffeeItem.findById(req.params.id).select("+imagePublicId");
    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }
    const previousImage = item.image;
    const previousImagePublicId = item.imagePublicId;
    item.set(updates);
    await item.save();

    if (req.uploadedImage && (previousImagePublicId || previousImage?.startsWith("/uploads/"))) {
      try {
        await removeStoredImage(previousImage, previousImagePublicId);
      } catch (cleanupError) {
        console.error("Unable to remove replaced menu image from storage:", cleanupError);
      }
    }
    return res.json(item);
  }),
);

router.delete(
  "/:id",
  isValidItemId,
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await CoffeeItem.findById(req.params.id).select("+imagePublicId");
    if (!item) return res.status(404).json({ message: "Menu item not found." });
    await item.deleteOne();
    try {
      await removeStoredImage(item.image, item.imagePublicId);
    } catch (cleanupError) {
      console.error("Unable to remove deleted menu image from storage:", cleanupError);
    }
    return res.status(204).end();
  }),
);

module.exports = router;
