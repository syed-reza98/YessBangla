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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
      };
    }
    config.resolve.alias["@tanstack/react-router"] = path.resolve(
      __dirname,
      "src/lib/router-compat.tsx"
    );
    config.resolve.alias["@tanstack/react-start/server"] = path.resolve(
      __dirname,
      "src/lib/start-compat.ts"
    );
    config.resolve.alias["@tanstack/react-start"] = path.resolve(
      __dirname,
      "src/lib/start-compat.ts"
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@tanstack/react-router": "./src/lib/router-compat.tsx",
      "@tanstack/react-start/server": "./src/lib/start-compat.ts",
      "@tanstack/react-start": "./src/lib/start-compat.ts",
    },
  },
};

export default nextConfig;
