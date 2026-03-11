import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.2ndswing.com",
      },
      {
        protocol: "https",
        hostname: "media.2ndswing.com",
      },
    ],
  },
};

export default nextConfig;
