import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../config/cloudinary.js";

// Story Image & Video storage
const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith("video");

    return {
      folder: "stories",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "webm", "mov"]
        : ["jpg", "jpeg", "png", "webp"],
    };
  },
});

const storyUpload = multer({
  storage: storyStorage,

  // max limit = 50MB (video max)
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1, // only one file allowed
  },

  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (
      allowedImageTypes.includes(file.mimetype) ||
      allowedVideoTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed!"), false);
    }
  },
});

export default storyUpload;
