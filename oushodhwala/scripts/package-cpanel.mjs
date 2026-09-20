import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");
const publicDir = path.join(rootDir, "public");
const staticDir = path.join(rootDir, ".next", "static");

console.log("📦 Starting cPanel Standalone packaging for @yessbangla/oushodhwala...");

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

// 3. Verify server.js exists
const passengerEntry = path.join(standaloneDir, "server.js");
if (fs.existsSync(passengerEntry)) {
  console.log("Passenger entrypoint server.js is verified.");
}

// 4. Generate CloudLinux / cPanel Phusion Passenger .htaccess
const htaccessPath = path.join(standaloneDir, ".htaccess");
const htaccessContent = `# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "${process.env.CPANEL_APP_ROOT || "/home/username/app"}"
PassengerBaseURI "/"
PassengerNodejs "/home/username/nodevenv/app/20/bin/node"
PassengerAppType node
PassengerStartupFile server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

# DO NOT REMOVE OR MODIFY. REWRITE RULES BEGIN
RewriteEngine On
RewriteRule ^/*$ "http://127.0.0.1:3000/" [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ "http://127.0.0.1:3000/$1" [P,L]
# DO NOT REMOVE OR MODIFY. REWRITE RULES END
`;
fs.writeFileSync(htaccessPath, htaccessContent, "utf8");
console.log("Generated cPanel / Phusion Passenger .htaccess in standalone directory.");

console.log("✅ cPanel standalone packaging complete! Deploy contents of .next/standalone to your cPanel application root.");
