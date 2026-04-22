import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/jpg",
    "image/webp",
    "video/mp4",
    "video/mov",
    "audio/mpeg",
    "audio/mp3",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // 🔥 REQUIRED for sharp
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter,
});

export default upload;
