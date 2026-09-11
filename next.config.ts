import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ['admin','home','inclass','deck','login','mine','sessions'].map(page => ({
      source: `/${page}/:path*`,
      destination: `/routes/${page}/:path*`,
      permanent: false,
    }));
  },
};

export default nextConfig;
