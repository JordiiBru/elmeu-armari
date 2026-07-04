import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.47"],
  images: {
    formats: ["image/webp"],
    deviceSizes: [200, 400, 640, 828, 1080],
    imageSizes: [96, 200, 320],
    localPatterns: [
      {
        pathname: "/api/uploads/**",
      },
    ],
  },
};

export default nextConfig;
