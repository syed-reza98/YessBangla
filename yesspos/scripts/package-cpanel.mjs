import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const publicDir = path.join(rootDir, "public");
const staticDir = path.join(rootDir, ".next", "static");

console.log("📦 Starting cPanel Standalone packaging for @yessbangla/pos...");

if (!fs.existsSync(standaloneDir)) {
  console.error("❌ Standalone build directory not found. Did you run 'next build'?");
  process.exit(1);
}

// 1. Copy public assets into .next/standalone/public
const targetPublicDir = path.join(standaloneDir, "public");
if (fs.existsSync(publicDir)) {
  console.log("Copying public assets into standalone/public...");
  fs.cpSync(publicDir, targetPublicDir, { recursive: true });
}

// 2. Copy .next/static into .next/standalone/.next/static
const targetStaticDir = path.join(standaloneDir, ".next", "static");
if (fs.existsSync(staticDir)) {
  console.log("Copying .next/static into standalone/.next/static...");
  fs.cpSync(staticDir, targetStaticDir, { recursive: true });
}

// 3. Ensure server.js exists in standalone root for Phusion Passenger
const passengerEntry = path.join(standaloneDir, "server.js");
if (fs.existsSync(passengerEntry)) {
  console.log("Passenger entrypoint server.js is verified.");
}

console.log("✅ cPanel standalone packaging complete! Deploy contents of .next/standalone to your cPanel application root.");
