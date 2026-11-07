const cloudinary = require("cloudinary").v2;

let configured = false;

function getCloudinary() {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
      });
    } else {
      const error = new Error(
        "Image uploads require CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      );
      error.code = "CLOUDINARY_NOT_CONFIGURED";
      throw error;
    }

    configured = true;
  }

  return cloudinary;
}

function uploadImage(buffer, format) {
  const uploader = getCloudinary().uploader;

  return new Promise((resolve, reject) => {
    const stream = uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "coffee-shop/menu",
        resource_type: "image",
        format,
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error) {
          const uploadError = new Error(error.message || "Cloudinary image upload failed.");
          uploadError.code = "CLOUDINARY_UPLOAD_FAILED";
          return reject(uploadError);
        }
        if (!result?.secure_url || !result?.public_id) {
          return reject(new Error("Cloudinary did not return an image URL and asset ID."));
        }
        return resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

async function deleteImage(publicId) {
  if (!publicId) return;
  const result = await getCloudinary().uploader.destroy(publicId, { resource_type: "image" });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary could not delete image asset "${publicId}".`);
  }
}

module.exports = { deleteImage, uploadImage };
