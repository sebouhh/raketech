import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@raketech/ui", "@raketech/db"],
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
