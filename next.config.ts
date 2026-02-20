import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d39-a.sdn.cz",
      },
      {
        protocol: "https",
        hostname: "instagram.fprg1-1.fna.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "instagram.fesb1-1.fna.fbcdn.net",
      },
    ],
  },
};

export default nextConfig;
