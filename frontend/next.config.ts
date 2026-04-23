import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    unoptimized: true, // ← local image এ optimization বন্ধ করো
  },
};

export default nextConfig;
