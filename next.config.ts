import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "cross-fetch": path.resolve(__dirname, "src/lib/cross-fetch-ponyfill.js"),
    };
    return config;
  },
};

export default nextConfig;