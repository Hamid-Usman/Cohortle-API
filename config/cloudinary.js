require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Initialize using the CLOUDINARY_URL from .env
cloudinary.config({
  secure: true, // ensure HTTPS delivery
});

// Multer Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Detect whether it's image or video
    const isVideo = file.mimetype.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";

    // Choose upload folder based on the route
    let folder = "general_uploads";
    const url = req.originalUrl || "";

    if (url.includes("/profile")) folder = "profile_images";
    else if (url.includes("/lessons")) folder = "lesson_media";

    return {
      folder,
      resource_type: resourceType, // useful for video uploads
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"],
      transformation:
        resourceType === "image"
          ? [{ width: 1000, height: 1000, crop: "limit" }]
          : undefined,
    };
  },
});

// Multer upload middleware
const upload = multer({ storage });

module.exports = { cloudinary, upload };
