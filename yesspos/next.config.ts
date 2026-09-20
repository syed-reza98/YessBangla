import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mysql2", "mysql2/promise", "drizzle-orm", "bcryptjs", "@node-rs/argon2", "better-sqlite3"],
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
