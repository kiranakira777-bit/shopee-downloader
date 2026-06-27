import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.shopee.co.id",
      },
      {
        protocol: "https",
        hostname: "cf.shopee.co.id",
      },
      {
        protocol: "https",
        hostname: "down-**.img.susercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.susercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
