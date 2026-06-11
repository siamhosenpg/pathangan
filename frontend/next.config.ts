import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    unoptimized: true, // ← local image এ optimization বন্ধ করো
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ← তোর Cloudinary images
      },
    ],
  },
};

export default nextConfig;
