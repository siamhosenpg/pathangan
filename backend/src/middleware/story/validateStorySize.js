export const validateStorySize = (req, res, next) => {
  if (!req.file) return next();

  const isVideo = req.file.mimetype.startsWith("video");

  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  if (!isVideo && req.file.size > maxImageSize) {
    return res.status(400).json({
      message: "Image size must be less than 10MB",
    });
  }

  if (isVideo && req.file.size > maxVideoSize) {
    return res.status(400).json({
      message: "Video size must be less than 50MB",
    });
  }

  next();
};
