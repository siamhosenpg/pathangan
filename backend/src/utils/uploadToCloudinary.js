import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

// ── HLS সেটিং ──
// HLS হলে ভিডিও টুকরো টুকরো হয়ে আসে, তাই পুরো ফাইল নামার অপেক্ষা করতে হয় না
const HLS_PROFILE = "hd";

// false  = আপলোডের সময়ই HLS বানানো শেষ হবে, পোস্ট হওয়ার পর প্রথম view-তেই ভিডিও তৈরি পাওয়া যাবে
//          (আপলোডে একটু বেশি সময় লাগবে)
// true   = আপলোড দ্রুত শেষ হবে, কিন্তু HLS পিছনে তৈরি হবে; পোস্টের প্রথম কিছুক্ষণ ভিডিও
//          চলতে দেরি বা error হতে পারে
// আপনার hosting-এ request timeout নিয়ে সমস্যা হলে এটা true করুন
const HLS_EAGER_ASYNC = false;

/**
 * @param {Express.Multer.File} file - multer memoryStorage file
 * @param {Object} options
 * @param {string} [options.baseFolder="posts"] - main folder name (e.g. "posts", "handouts")
 * @param {string} [options.username] - user এর username, দিলে folder হবে `${baseFolder}/${username}`
 * @param {boolean} [options.hls] - ভিডিওর জন্য HLS URL দেবে কি না (না দিলে শুধু "posts" folder-এ true)
 */
export const uploadMedia = async (file, options = {}) => {
  const { baseFolder = "posts", username } = options;

  // username দিলে সেই ইউজারের নিজস্ব sub-folder এ যাবে, না দিলে আগের মতো একটাই folder
  const folder = username ? `${baseFolder}/${username}` : baseFolder;

  // course ইত্যাদির player HLS সামলাতে পারবে কি না জানা নেই, তাই ডিফল্টে শুধু posts-এ চালু
  const useHls = options.hls ?? baseFolder === "posts";

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
        .upload_stream({ folder, resource_type: "image" }, (err, result) => {
          if (err) reject(err);
          // ✅ image — শুধু url return করো
          else resolve({ url: result.secure_url });
        })
        .end(buffer);
    });
  }

  // 🎥 VIDEO / 🎵 AUDIO (Cloudinary তে অডিও ও "video" resource type এ থাকে)
  const isVideo = file.mimetype.startsWith("video/");
  const wantHls = isVideo && useHls;

  const uploadOptions = {
    folder,
    resource_type: "video",
    timeout: wantHls && !HLS_EAGER_ASYNC ? 300000 : 120000, // HLS বানাতে বেশি সময় লাগতে পারে
  };

  if (wantHls) {
    // আপলোডের সাথেই HLS version বানাতে বলা হচ্ছে
    uploadOptions.eager = [{ streaming_profile: HLS_PROFILE, format: "m3u8" }];
    uploadOptions.eager_async = HLS_EAGER_ASYNC;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(uploadOptions, (err, result) => {
        if (err) return reject(err);

        let url = result.secure_url; // সাধারণ MP4 (অডিওর জন্য এটাই থাকবে)

        if (wantHls) {
          // একই public_id থেকে HLS (.m3u8) URL বানাই
          url = cloudinary.url(result.public_id, {
            resource_type: "video",
            streaming_profile: HLS_PROFILE,
            format: "m3u8",
            secure: true,
          });
        }

        // ✅ video — url + width + height return করো (অডিওতে এগুলো null)
        resolve({
          url,
          width: result.width ?? null,
          height: result.height ?? null,
        });
      })
      .end(file.buffer);
  });
};
