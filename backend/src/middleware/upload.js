import multer from "multer";

const fileFilter = (req, file, cb) => {
  // frontend থেকে HEIC convert হয়ে আসে, তাই শুধু standard format
  const allowedExtensions = /\.(jpg|jpeg|png|webp|mp4|mov|mp3)$/i;
  const extname = allowedExtensions.test(file.originalname);

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // sharp এর জন্য memory storage দরকার
  limits: { fileSize: 100 * 1024 * 1024 }, // ১০০MB max
  fileFilter,
});

export default upload;
