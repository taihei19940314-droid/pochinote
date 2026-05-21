import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/line-preview",
        destination: "/help/line-demo",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
