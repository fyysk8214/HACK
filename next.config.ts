import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Windows의 OneDrive 캐시 충돌을 피하고, 클라우드에서는 기본 경로를 사용합니다.
  distDir: process.platform === "win32" ? ".next-local" : ".next",
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
