import { cpSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

console.log("📦 Starting cPanel Standalone packaging for @yessbangla/portal...");

const rootDir = process.cwd();
const standaloneDir = resolve(rootDir, ".next/standalone");
const staticDir = resolve(rootDir, ".next/static");
const publicDir = resolve(rootDir, "public");

if (!existsSync(standaloneDir)) {
  console.error("❌ .next/standalone does not exist. Run 'next build' first.");
  process.exit(1);
}

// 1. Copy public assets into standalone/public
if (existsSync(publicDir)) {
  console.log("Copying public assets into standalone/public...");
  cpSync(publicDir, resolve(standaloneDir, "public"), { recursive: true });
}

// 2. Copy .next/static into standalone/.next/static
if (existsSync(staticDir)) {
  console.log("Copying .next/static into standalone/.next/static...");
  mkdirSync(resolve(standaloneDir, ".next"), { recursive: true });
  cpSync(staticDir, resolve(standaloneDir, ".next/static"), { recursive: true });
}

// 3. Ensure native Next.js standalone server.js is preserved
if (!existsSync(resolve(standaloneDir, "server.js"))) {
  console.error("❌ .next/standalone/server.js missing! Next.js standalone build was not generated properly.");
  process.exit(1);
}

// 4. Write Apache .htaccess for cPanel
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^uploads/(.*)$ public/uploads/$1 [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
`;
writeFileSync(resolve(standaloneDir, ".htaccess"), htaccessContent, "utf8");

console.log("✅ cPanel standalone packaging complete! Deploy contents of .next/standalone to your cPanel application root.");
