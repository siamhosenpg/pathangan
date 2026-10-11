import multer from "multer";

const ALLOWED_EXT = /\.(jpg|jpeg|png|webp|mp4|mov|mp3)$/i;
const ALLOWED_MIME =
  /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime)|audio\/(mpeg|mp3))$/i;

const fileFilter = (req, file, cb) => {
  // frontend থেকে HEIC convert হয়ে আসে, তাই শুধু standard format
  const okExt = ALLOWED_EXT.test(file.originalname);
  const okMime = ALLOWED_MIME.test(file.mimetype);

  if (okExt && okMime) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // sharp এর জন্য memory storage দরকার
  limits: {
    // frontend ভিডিও compress করে ~45MB এর মধ্যে রাখে, তাই ৬০MB যথেষ্ট
    fileSize: 60 * 1024 * 1024,
    files: 10,
  },
  fileFilter,
});

export default upload;
