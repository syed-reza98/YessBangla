// Bundled site imagery — Next.js equivalent of Vite import.meta.glob.
// Keeps CMS `/src/assets/...` refs and bare filenames resolvable at runtime.
import type { StaticImageData } from "next/image";

import aboutTeamBd from "@/assets/about-team-bd.jpg";
import contactWelcomeBd from "@/assets/contact-welcome-bd.jpg";
import heroBusiness from "@/assets/hero-business.jpg";
import servicesTechBd from "@/assets/services-tech-bd.jpg";
import trustHandshakeBd from "@/assets/trust-handshake-bd.jpg";
import venturesDhakaBd from "@/assets/ventures-dhaka-bd.jpg";
import yessBanglaLetterhead from "@/assets/yess-bangla-letterhead.jpeg";
import yessBanglaLogo from "@/assets/yess-bangla-logo.png";
import akashOtt from "@/assets/ventures/akash-ott.jpg";
import akashTv from "@/assets/ventures/akash-tv.jpg";
import theDailyAkash from "@/assets/ventures/the-daily-akash.jpg";
import yessAllInOne from "@/assets/ventures/yess-all-in-one-solution.jpg";
import yessEvent from "@/assets/ventures/yess-event.jpg";
import yessFood from "@/assets/ventures/yess-food.jpg";
import yessHost from "@/assets/ventures/yess-host.jpg";
import yessLegalAdvice from "@/assets/ventures/yess-legal-advice.jpg";
import yessModel from "@/assets/ventures/yess-model.jpg";
import yessOrganicHaat from "@/assets/ventures/yess-organic-haat.jpg";
import yessService from "@/assets/ventures/yess-service.jpg";
import yessSoft from "@/assets/ventures/yess-soft.jpg";
import yessTourism from "@/assets/ventures/yess-tourism.jpg";

type BundledImage = string | StaticImageData;

function toSrc(img: BundledImage): string {
  return typeof img === "string" ? img : String(img.src || "");
}

/** Legacy CMS / Vite-style path keys → Next hashed URL */
const ASSET_ENTRIES: Array<[string, BundledImage]> = [
  ["/src/assets/about-team-bd.jpg", aboutTeamBd],
  ["/src/assets/contact-welcome-bd.jpg", contactWelcomeBd],
  ["/src/assets/hero-business.jpg", heroBusiness],
  ["/src/assets/services-tech-bd.jpg", servicesTechBd],
  ["/src/assets/trust-handshake-bd.jpg", trustHandshakeBd],
  ["/src/assets/ventures-dhaka-bd.jpg", venturesDhakaBd],
  ["/src/assets/yess-bangla-letterhead.jpeg", yessBanglaLetterhead],
  ["/src/assets/yess-bangla-logo.png", yessBanglaLogo],
  ["/src/assets/ventures/akash-ott.jpg", akashOtt],
  ["/src/assets/ventures/akash-tv.jpg", akashTv],
  ["/src/assets/ventures/the-daily-akash.jpg", theDailyAkash],
  ["/src/assets/ventures/yess-all-in-one-solution.jpg", yessAllInOne],
  ["/src/assets/ventures/yess-event.jpg", yessEvent],
  ["/src/assets/ventures/yess-food.jpg", yessFood],
  ["/src/assets/ventures/yess-host.jpg", yessHost],
  ["/src/assets/ventures/yess-legal-advice.jpg", yessLegalAdvice],
  ["/src/assets/ventures/yess-model.jpg", yessModel],
  ["/src/assets/ventures/yess-organic-haat.jpg", yessOrganicHaat],
  ["/src/assets/ventures/yess-service.jpg", yessService],
  ["/src/assets/ventures/yess-soft.jpg", yessSoft],
  ["/src/assets/ventures/yess-tourism.jpg", yessTourism],
];

/** "/src/assets/ventures/yess-food.jpg" -> hashed build URL */
export const BUNDLED_BY_PATH: Record<string, string> = Object.fromEntries(
  ASSET_ENTRIES.map(([path, img]) => [path, toSrc(img)])
);

/** "yess-food.jpg" -> hashed build URL */
export const BUNDLED_BY_NAME: Record<string, string> = Object.fromEntries(
  ASSET_ENTRIES.map(([path, img]) => [(path.split("/").pop() ?? path).toLowerCase(), toSrc(img)])
);

/** Images served straight from /public. */
export const PUBLIC_IMAGES = [
  "/favicon.png",
  "/letterhead-header.png",
  "/letterhead-footer.png",
  "/letterhead-watermark.png",
  "/yess-bangla-logo.jpeg",
  "/yess-bangla-letterhead.jpeg",
];

export type SiteAsset = { ref: string; name: string; folder: string };

/** Canonical list of every image bundled with the portal. */
export function listSiteAssets(): SiteAsset[] {
  const fromAssets = ASSET_ENTRIES.map(([p]) => {
    const name = p.split("/").pop() ?? p;
    const folder = p.includes("/assets/ventures/") ? "ventures" : "site";
    return { ref: p, name, folder };
  });
  const fromPublic = PUBLIC_IMAGES.map((p) => ({
    ref: p,
    name: p.replace(/^\//, ""),
    folder: "public",
  }));
  return [...fromAssets, ...fromPublic].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve any stored image reference to a URL usable in the browser.
 * Handles absolute URLs, data/blob URIs, bundled `/src/assets/...` paths,
 * bare file names and `/public` paths.
 */
export function resolveMediaUrl(value: unknown, fallback: string | { src: string } = ""): string {
  const fallbackStr =
    typeof fallback === "object" && fallback !== null && "src" in fallback
      ? String(fallback.src)
      : String(fallback || "");

  if (value && typeof value === "object" && value !== null && "src" in value) {
    return String((value as { src: string }).src);
  }
  if (typeof value !== "string" || !value.trim()) return fallbackStr;
  const v = value.trim();
  if (/^(https?:)?\/\//.test(v) || v.startsWith("data:") || v.startsWith("blob:")) return v;
  if (BUNDLED_BY_PATH[v]) return BUNDLED_BY_PATH[v];
  // Also accept "@/assets/..." and "src/assets/..." variants
  const normalized = v
    .replace(/^@\/assets\//, "/src/assets/")
    .replace(/^src\/assets\//, "/src/assets/");
  if (BUNDLED_BY_PATH[normalized]) return BUNDLED_BY_PATH[normalized];
  const name = (v.split("?")[0].split("/").pop() ?? v).toLowerCase();
  if (BUNDLED_BY_NAME[name]) return BUNDLED_BY_NAME[name];
  if (v.startsWith("/") && !v.startsWith("/src/")) return v;
  return fallbackStr || v;
}

/** Helper to extract string src from string or StaticImageData */
export function toImageSrc(img: unknown): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof img === "object" && img !== null && "src" in img) {
    return String((img as { src: string }).src);
  }
  return "";
}
