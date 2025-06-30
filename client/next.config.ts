// FILE: client/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // This wildcard pattern correctly allows any bucket from s3.amazonaws.com
        hostname: '*.s3.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;