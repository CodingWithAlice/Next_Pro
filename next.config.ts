import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    API_HOST: process.env.API_HOST,
  }
};

export default nextConfig;
