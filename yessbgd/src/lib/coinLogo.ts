// Hero coin logo auto-resolution.
// Priority chain: explicit logoUrl → live favicon from the venture's domain
// (128px via Google's favicon CDN) → null, in which case the engraved
// Lucide icon is rendered. CMS venture rows pass `logoUrl`/`domain` straight
// through the `data` JSON, so setting either field in the dashboard updates
// the coin automatically — no code change needed.
import type { Venture } from "@/data/ventures";

export function faviconUrl(domain: string): string {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=128`;
}

export function resolveCoinLogo(v: Venture): string | null {
  if (v.logoUrl) return v.logoUrl;
  if (v.domain) return faviconUrl(v.domain);
  return null;
}
