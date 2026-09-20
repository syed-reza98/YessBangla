import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config) => {
    config.resolve.alias["@tanstack/react-router"] = path.resolve(
      __dirname,
      "src/lib/router-compat.tsx"
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@tanstack/react-router": "./src/lib/router-compat.tsx",
    },
  },
};

export default nextConfig;
