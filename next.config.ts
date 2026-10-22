import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RU-копия на VDSina собирается в standalone (BUILD_STANDALONE=1); на Vercel сборка как раньше
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  experimental: {
    reactCompiler: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
