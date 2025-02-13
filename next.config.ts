import type { NextConfig } from "next";

// 在构建和运行时使用
const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // API_HOST: process.env.NEXT_PUBLIC_API_HOST,
  }
};

export default nextConfig;
