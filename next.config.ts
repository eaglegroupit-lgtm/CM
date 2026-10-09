import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The staff guide is a static page in /public; serve it at a friendly address
  async rewrites() {
    return [{ source: "/guide", destination: "/guide.html" }];
  },
};

export default nextConfig;
