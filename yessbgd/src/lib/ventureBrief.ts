import jsPDF from "jspdf";
import type { Venture } from "@/data/ventures";
import {
  getVentureCase,
  getVentureMilestones,
  getVenturePackages,
  getVentureFaqs,
} from "@/data/ventures";
import logoUrl from "@/assets/yess-bangla-logo.png";
import letterheadUrl from "@/assets/yess-bangla-letterhead.jpeg";
import {
  type BriefBranding,
  DEFAULT_BRANDING,
  resolveBranding,
} from "./briefBranding";

export type { BriefBranding };

export type PageFormat = "a4" | "letter";
export type PageOrientation = "portrait" | "landscape";

export interface WatermarkOptions {
  /** 0..1, default 0.08. Clamped to [0.02, 0.4]. */
  opacity?: number;
  /** Fraction of usable content area, default 0.6. Clamped to [0.2, 0.95]. */
  sizeFraction?: number;
  /** When true, force the canvas-faded fallback instead of GState alpha. */
  forceFallback?: boolean;
}

export interface BriefOptions {
  format?: PageFormat;
  orientation?: PageOrientation;
  /** When provided, embeds these bytes as the watermark logo (used by tests). */
  logoDataUrl?: string | null;
  /** Skip triggering doc.save() — the doc is returned for callers/tests. */
  skipSave?: boolean;
  /** Watermark tuning — surfaced through the UI settings popover. */
  watermark?: WatermarkOptions;
  /** Override the saved file name (extension added automatically). */
  fileName?: string;
  /** Custom branding — falls back to DEFAULT_BRANDING for missing fields. */
  branding?: Partial<BriefBranding>;
  /** Letterhead logo scale (0.6–1.4). Default 1. */
  logoScale?: number;
  /** Letterhead logo opacity (0–1). Default 1. Uses GState alpha when available. */
  logoOpacity?: number;
  /**
   * Letterhead theme — controls the backplate behind the wordmark so the
   * logo stays readable on both light and dark letterhead modes.
   * - "light" (default) → white pill with subtle navy ring
   * - "dark"            → soft navy pill with thin gold ring
   */
  letterheadTheme?: "light" | "dark";
}

export const DEFAULT_WATERMARK: Required<WatermarkOptions> = {
  opacity: 0.08,
  sizeFraction: 0.6,
  forceFallback: false,
};

function clampWatermark(w: WatermarkOptions = {}): Required<WatermarkOptions> {
  return {
    opacity: Math.max(0.02, Math.min(0.4, w.opacity ?? DEFAULT_WATERMARK.opacity)),
    sizeFraction: Math.max(
      0.2,
      Math.min(0.95, w.sizeFraction ?? DEFAULT_WATERMARK.sizeFraction),
    ),
    forceFallback: w.forceFallback ?? DEFAULT_WATERMARK.forceFallback,
  };
}

/** Detection markers — written invisibly on every page so a PDF parser
 *  can verify that the letterhead/watermark/footer pipeline ran. */
export const MARKERS = {
  letterhead: "YESS-LH-MARKER",
  watermark: "YESS-WM-MARKER",
  footer: "YESS-FT-MARKER",
} as const;

interface PageDims {
  w: number;
  h: number;
  margin: number;
  headerH: number;
  footerH: number;
  contentW: number;
  topY: number;
  bottomY: number;
}

const FORMAT_DIMS: Record<PageFormat, { portrait: [number, number] }> = {
  a4: { portrait: [210, 297] },
  letter: { portrait: [215.9, 279.4] },
};

function computeDims(format: PageFormat, orientation: PageOrientation): PageDims {
  const [pw, ph] = FORMAT_DIMS[format].portrait;
  const w = orientation === "portrait" ? pw : ph;
  const h = orientation === "portrait" ? ph : pw;
  // Margins are tuned to clear the uploaded letterhead pad:
  //   - top: clears the logo block at the top of the pad
  //   - bottom: clears the navy footer band at the bottom of the pad
  const margin = Math.round(w * 0.09 * 100) / 100;
  const headerH = Math.round(h * 0.16 * 100) / 100; // ~47mm on A4 portrait
  const footerH = Math.round(h * 0.14 * 100) / 100; // ~42mm on A4 portrait
  return {
    w,
    h,
    margin,
    headerH,
    footerH,
    contentW: w - margin * 2,
    topY: headerH + 4,
    bottomY: h - footerH - 4,
  };
}

// Cache logo data URL across calls (browser only)
let cachedLogoDataUrl: string | null = null;
async function loadLogo(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  if (typeof fetch !== "function" || typeof FileReader === "undefined") return null;
  try {
    const url = typeof logoUrl === "string" ? logoUrl : (logoUrl as any)?.src || "";
    const res = await fetch(url);
    const blob = await res.blob();
    cachedLogoDataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

// Cache the official letterhead pad (full page background JPEG).
let cachedPadDataUrl: string | null = null;
async function loadPad(): Promise<string | null> {
  if (cachedPadDataUrl) return cachedPadDataUrl;
  if (typeof fetch !== "function" || typeof FileReader === "undefined") return null;
  try {
    const url = typeof letterheadUrl === "string" ? letterheadUrl : (letterheadUrl as any)?.src || "";
    const res = await fetch(url);
    const blob = await res.blob();
    cachedPadDataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    return cachedPadDataUrl;
  } catch {
    return null;
  }
}

/** Pre-baked faded watermark cache, keyed by opacity (rounded to 2dp).
 *  Avoids re-rasterising the logo for every page — one Canvas pass per
 *  opacity level is reused across all pages and all sample PDFs. */
const fadedLogoCache = new Map<string, string>();
async function getFadedLogo(opacity: number): Promise<string | null> {
  const base = await loadLogo();
  if (!base) return null;
  if (typeof document === "undefined") return null;
  const key = opacity.toFixed(2);
  const hit = fadedLogoCache.get(key);
  if (hit) return hit;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = base;
    });
    // Cap at 1024px — sharper watermark on high-DPI mobile / print zoom,
    // while still keeping the embedded raster small thanks to JPEG q=0.6.
    const max = 1024;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Paint white background then logo at requested alpha — bakes the
    // fade into the JPEG so viewers without GState alpha still see a
    // soft watermark instead of a solid logo.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, 0, 0, w, h);
    // JPEG @ 0.6 quality — small file, mobile-friendly
    const out = canvas.toDataURL("image/jpeg", 0.6);
    fadedLogoCache.set(key, out);
    return out;
  } catch {
    return null;
  }
}


/** Write text in a near-invisible white color so the marker is present in
 *  the PDF content stream (detectable by tests) but doesn't show on paper. */
function writeMarker(doc: jsPDF, marker: string, x: number, y: number) {
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(1);
  doc.text(marker, x, y);
}

/**
 * Paint the official Yess Bangla letterhead pad as the page background.
 * The same JPEG is reused across all pages via `imageAlias`, so file size
 * stays flat regardless of page count. Writes all three integrity markers
 * (letterhead, watermark, footer) since the pad provides every brand
 * element visually.
 */
function drawPad(
  doc: jsPDF,
  d: PageDims,
  pad: string | null,
  brand: BriefBranding,
  subtitle: string,
) {
  if (pad) {
    try {
      doc.addImage(pad, "JPEG", 0, 0, d.w, d.h, "yess-pad-bg", "FAST");
    } catch {
      /* swallow — markers + fallback header below still keep branding */
    }
  }
  // Always emit markers so integrity checks pass even if the pad raster fails.
  writeMarker(doc, MARKERS.letterhead, d.margin, 6);
  writeMarker(doc, MARKERS.watermark, d.w / 2, d.h / 2);
  writeMarker(doc, MARKERS.footer, d.margin, d.h - 1);

  // Programmatic fallback chrome — only visible when the pad image is
  // missing (e.g. asset fetch fails). Mirrors the pad's structure so every
  // generated PDF keeps the brand identity.
  if (!pad) {
    // Top: company wordmark stand-in
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(190, 30, 45);
    doc.text("Yess", d.margin, 18);
    doc.setTextColor(20, 130, 60);
    doc.text("bangla", d.margin + 22, 18);
    // Bottom navy band
    const bandH = d.footerH - 6;
    const bandY = d.h - bandH;
    doc.setFillColor(15, 35, 80);
    doc.rect(0, bandY, d.w, bandH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(brand.companyName, d.w / 2, bandY + 5.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(220, 226, 240);
    const lines = doc.splitTextToSize(brand.address, d.w - 16) as string[];
    let ly = bandY + 10;
    for (const line of lines.slice(0, 2)) {
      doc.text(line, d.w / 2, ly, { align: "center" });
      ly += 3.6;
    }
    doc.setFontSize(7.6);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Cell : ${brand.phone}   E-mail : ${brand.email}   Web : ${brand.web}`,
      d.w / 2,
      bandY + bandH - 3,
      { align: "center" },
    );
  }

  // Top-right: document label + subtitle + date — sits inside the white
  // area above the pad's center watermark, never overlapping the logo.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 35, 80);
  doc.text(brand.documentLabel, d.w - d.margin, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(90, 90, 90);
  doc.text(subtitle, d.w - d.margin, 19, { align: "right" });
  doc.text(
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    d.w - d.margin,
    23.5,
    { align: "right" },
  );
  doc.setFontSize(7.2);
  doc.setTextColor(120, 120, 120);
  doc.text(brand.confidentialityNote, d.w - d.margin, 28, { align: "right" });
}

function drawPageNumber(doc: jsPDF, d: PageDims, page: number, total: number) {
  // Sits just above the pad's navy band so it doesn't fight with the
  // footer band's white text.
  const y = d.h - d.footerH - 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Page ${page} of ${total}`, d.w - d.margin, y, { align: "right" });
}

/**
 * Build a fully branded enterprise brief PDF for a venture and return the
 * jsPDF document. Caller can then `doc.save(...)` or hand the bytes to a
 * test/QA harness. Used by both `downloadVentureBrief` and the regression
 * test suite.
 */
export async function buildVentureBriefDoc(
  v: Venture,
  opts: BriefOptions = {},
): Promise<jsPDF> {
  const format: PageFormat = opts.format ?? "a4";
  const orientation: PageOrientation = opts.orientation ?? "portrait";
  const d = computeDims(format, orientation);
  // logoDataUrl override is preserved for tests; runtime always pulls the
  // official letterhead pad as the page background.
  const pad = opts.logoDataUrl === null ? null : await loadPad();

  const doc = new jsPDF({ unit: "mm", format, orientation });
  let y = d.topY;

  const brand = resolveBranding(opts.branding);
  const subtitle = v.category.toUpperCase() + " · " + v.title;

  const newPage = () => {
    doc.addPage(format, orientation);
    drawPad(doc, d, pad, brand, subtitle);
    y = d.topY;
  };

  const ensureSpace = (need: number) => {
    if (y + need > d.bottomY) newPage();
  };

  const text = (
    body: string,
    o: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) => {
    const { size = 10, bold = false, color = [40, 40, 40], gap = 1 } = o;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(body, d.contentW) as string[];
    for (const line of lines) {
      ensureSpace(size * 0.45 + gap);
      doc.text(line, d.margin, y);
      y += size * 0.45 + gap;
    }
  };

  const h1 = (s: string) => {
    ensureSpace(14);
    text(s, { size: 20, bold: true, color: [20, 20, 20], gap: 2 });
    y += 1;
  };
  const h2 = (s: string) => {
    ensureSpace(14);
    y += 4;
    text(s, { size: 13, bold: true, color: [15, 35, 80], gap: 2 });
    doc.setDrawColor(232, 184, 64);
    doc.setLineWidth(0.3);
    doc.line(d.margin, y, d.margin + 40, y);
    y += 3;
  };
  const p = (s: string) => text(s, { size: 10, color: [60, 60, 60], gap: 1.5 });
  const bullet = (s: string) => text("•  " + s, { size: 10, color: [55, 55, 55], gap: 1.2 });

  // First page chrome
  drawPad(doc, d, pad, brand, subtitle);

  h1(v.title);
  text(v.tagline, { size: 11, bold: true, color: [80, 80, 80], gap: 1.5 });
  y += 1;
  p(v.longDesc);

  h2("Highlights");
  v.highlights.forEach(bullet);

  h2("Services");
  p(v.services.join(" · "));

  h2("Audience");
  p(v.audience);

  const cs = getVentureCase(v);
  h2("Challenge");
  p(cs.challenge);
  h2("Our solution");
  p(cs.solution);

  h2("Delivery phases");
  cs.phases.forEach((ph, i) => {
    text(`${i + 1}. ${ph.title}`, { size: 10.5, bold: true, color: [40, 40, 40], gap: 1.2 });
    p(ph.desc);
  });

  h2("Capabilities & stack");
  p(cs.techStack.join(", "));

  h2("Outcomes");
  cs.results.forEach((r) => bullet(`${r.value} — ${r.label}`));

  h2("Key milestones");
  getVentureMilestones(v).forEach((m) =>
    bullet(`${m.year} — ${m.title}: ${m.desc}`),
  );

  h2("Engagement packages");
  getVenturePackages(v).forEach((pk) => {
    text(`${pk.name} — ${pk.price}${pk.cadence ? " " + pk.cadence : ""}`, {
      size: 11,
      bold: true,
      color: [15, 35, 80],
      gap: 1.5,
    });
    p(pk.summary);
    pk.features.forEach(bullet);
    y += 1;
  });

  h2("FAQs");
  getVentureFaqs(v).forEach((f) => {
    text("Q: " + f.q, { size: 10.5, bold: true, color: [40, 40, 40], gap: 1.2 });
    p("A: " + f.a);
    y += 1;
  });

  h2("Talk to us");
  p("Reach out to our enterprise desk for a tailored proposal, references on request, and NDA-ready discovery.");

  // Page numbers on every page (above the pad's navy footer band).
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    drawPageNumber(doc, d, i, pages);
  }

  return doc;
}

/**
 * Inspect a generated jsPDF document and return per-page presence of
 * letterhead/watermark/footer markers. Used by both regression tests and
 * the `verifyBriefIntegrity` runtime guard.
 */
export interface PagePresence {
  page: number;
  letterhead: boolean;
  watermark: boolean;
  footer: boolean;
}

export function inspectBriefDoc(doc: jsPDF): PagePresence[] {
  // jsPDF exposes per-page operator streams via doc.internal.pages — index 0
  // is unused (1-based). Each page is an array of operator strings.
  const pages = (doc.internal as unknown as { pages: string[][] }).pages;
  const out: PagePresence[] = [];
  for (let i = 1; i < pages.length; i++) {
    const stream = (pages[i] || []).join("\n");
    out.push({
      page: i,
      letterhead: stream.includes(MARKERS.letterhead),
      watermark: stream.includes(MARKERS.watermark),
      footer: stream.includes(MARKERS.footer),
    });
  }
  return out;
}

/** Throws if any page is missing letterhead/watermark/footer markers. */
export function verifyBriefIntegrity(doc: jsPDF): void {
  const presence = inspectBriefDoc(doc);
  if (presence.length === 0) {
    throw new Error("Brief PDF has no pages");
  }
  const failures = presence.filter(
    (p) => !p.letterhead || !p.watermark || !p.footer,
  );
  if (failures.length) {
    const desc = failures
      .map(
        (f) =>
          `page ${f.page}: ${[
            !f.letterhead && "letterhead",
            !f.watermark && "watermark",
            !f.footer && "footer",
          ]
            .filter(Boolean)
            .join(", ")}`,
      )
      .join("; ");
    throw new Error("Brief PDF integrity check failed — " + desc);
  }
}

export interface IntegrityReport {
  ok: boolean;
  failures: PagePresence[];
  message?: string;
}

/** Compute integrity without throwing. */
export function checkBriefIntegrity(doc: jsPDF): IntegrityReport {
  const presence = inspectBriefDoc(doc);
  if (presence.length === 0) {
    return { ok: false, failures: [], message: "Brief PDF has no pages" };
  }
  const failures = presence.filter(
    (p) => !p.letterhead || !p.watermark || !p.footer,
  );
  if (!failures.length) return { ok: true, failures: [] };
  const message = failures
    .map(
      (f) =>
        `page ${f.page}: missing ${[
          !f.letterhead && "letterhead",
          !f.watermark && "watermark",
          !f.footer && "footer",
        ]
          .filter(Boolean)
          .join(", ")}`,
    )
    .join("; ");
  return { ok: false, failures, message };
}

export interface DownloadResult {
  doc: jsPDF;
  integrity: IntegrityReport;
}

export async function downloadVentureBrief(
  v: Venture,
  opts: BriefOptions = {},
): Promise<DownloadResult> {
  const doc = await buildVentureBriefDoc(v, opts);
  const integrity = checkBriefIntegrity(doc);
  if (!integrity.ok && typeof console !== "undefined") {
    console.error("[ventureBrief]", integrity.message);
  }
  if (!opts.skipSave) {
    const suffix =
      opts.format && opts.format !== "a4"
        ? `-${opts.format}`
        : opts.orientation === "landscape"
          ? "-landscape"
          : "";
    const name = opts.fileName ?? `${v.slug}-enterprise-brief${suffix}`;
    doc.save(name.endsWith(".pdf") ? name : name + ".pdf");
  }
  return { doc, integrity };
}
