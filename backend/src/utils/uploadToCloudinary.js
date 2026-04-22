import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

export const uploadMedia = async (file) => {
  // 🖼 IMAGE
  if (file.mimetype.startsWith("image/")) {
    const image = sharp(file.buffer);
    const meta = await image.metadata();

    let buffer = file.buffer;

    const shouldCompress =
      meta.size > 400 * 1024 || meta.width > 1080 || meta.format !== "webp";

    if (shouldCompress) {
      // Decide optimal quality based on image size
      let webpQuality = 80; // default safe value
      if (meta.size > 2 * 1024 * 1024) webpQuality = 75; // very big images
      else if (meta.size < 800 * 1024) webpQuality = 85; // medium/small images

      buffer = await image
        .resize({ width: 1080, withoutEnlargement: true })
        .webp({ quality: webpQuality, effort: 5 }) // effort improves visual quality
        .toBuffer();
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "posts", resource_type: "image" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        )
        .end(buffer);
    });
  }

  // 🎥 VIDEO / 🎵 AUDIO (NO LOGIC CHANGE)
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "posts",
          resource_type: "auto",
          chunk_size: 6000000,
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result.secure_url);
        }
      )
      .end(file.buffer);
  });
};
