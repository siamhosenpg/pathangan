import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

export const uploadMedia = async (file) => {
  if (file.mimetype.startsWith("image/")) {
    const image = sharp(file.buffer, { failOnError: false });
    const meta = await image.metadata();
    let buffer = file.buffer;
    const shouldCompress =
      meta.size > 400 * 1024 || meta.width > 1080 || meta.format !== "webp";
    if (shouldCompress) {
      let webpQuality = 80;
      if (meta.size > 2 * 1024 * 1024) webpQuality = 75;
      else if (meta.size < 800 * 1024) webpQuality = 85;
      buffer = await image
        .rotate()
        .resize({ width: 1080, withoutEnlargement: true })
        .webp({ quality: webpQuality, effort: 5 })
        .toBuffer();
    }
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "posts", resource_type: "image" },
          (err, result) => {
            if (err) reject(err);
            // ✅ image — শুধু url return করো (আগের মতো)
            else resolve({ url: result.secure_url });
          },
        )
        .end(buffer);
    });
  }

  // 🎥 VIDEO
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
          // ✅ video — url + width + height return করো
          else
            resolve({
              url: result.secure_url,
              width: result.width ?? null,
              height: result.height ?? null,
            });
        },
      )
      .end(file.buffer);
  });
};
