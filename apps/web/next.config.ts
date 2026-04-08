import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@crm-bot/db"],
};

export default nextConfig;
