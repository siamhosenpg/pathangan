import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

export const uploadMedia = async (file) => {
  // 🖼 IMAGE — frontend থেকে HEIC convert হয়ে JPEG আসে, তাই শুধু image/ চেক যথেষ্ট
  if (file.mimetype.startsWith("image/")) {
    const image = sharp(file.buffer, {
      failOnError: false,
    });

    const meta = await image.metadata();

    let buffer = file.buffer;

    const shouldCompress =
      meta.size > 400 * 1024 || meta.width > 1080 || meta.format !== "webp";

    if (shouldCompress) {
      let webpQuality = 80;
      if (meta.size > 2 * 1024 * 1024)
        webpQuality = 75; // বড় ছবি
      else if (meta.size < 800 * 1024) webpQuality = 85; // ছোট ছবি

      buffer = await image
        .rotate() // EXIF rotation ঠিক করে
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
            else resolve(result.secure_url);
          },
        )
        .end(buffer);
    });
  }

  // 🎥 VIDEO / 🎵 AUDIO
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
        },
      )
      .end(file.buffer);
  });
};
