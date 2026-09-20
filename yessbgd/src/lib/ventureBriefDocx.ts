// DOCX export of the enterprise brief.
// Mirrors the PDF chrome: header band (letterhead), centered watermark on
// each section break, and a branded footer with page numbers + contacts.
//
// Letterhead is implemented as a Header that paints a colored shading bar
// containing the company name + document label. Watermark uses a centered
// faded image floating behind body text. Footer carries address / contacts.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  AlignmentType,
  PageNumber,
  ImageRun,
  ShadingType,
  BorderStyle,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  PositionalTab,
  PositionalTabAlignment,
  PositionalTabRelativeTo,
  PositionalTabLeader,
} from "docx";
import type { Venture } from "@/data/ventures";
import {
  getVentureCase,
  getVentureMilestones,
  getVenturePackages,
  getVentureFaqs,
} from "@/data/ventures";
import { resolveBranding, type BriefBranding } from "./briefBranding";
import logoUrl from "@/assets/yess-bangla-logo.png";
import letterheadUrl from "@/assets/yess-bangla-letterhead.jpeg";

export interface DocxBriefOptions {
  branding?: Partial<BriefBranding>;
  fileName?: string;
  /** Watermark opacity (0-1). Default 0.08 — baked into a faded raster. */
  watermarkOpacity?: number;
  /** Letterhead logo scale (0.6–1.4). Default 1. */
  logoScale?: number;
  /** Letterhead theme — "light" (white plate) or "dark" (navy plate). */
  letterheadTheme?: "light" | "dark";
}

const NAVY = "0F2350";
const GOLD = "E8B840";

async function fetchLogoBytes(): Promise<Uint8Array | null> {
  if (typeof fetch !== "function") return null;
  try {
    const url = typeof logoUrl === "string" ? logoUrl : (logoUrl as any)?.src || "";
    if (!url) return null;
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function fetchPadBytes(): Promise<Uint8Array | null> {
  if (typeof fetch !== "function") return null;
  try {
    const url = typeof letterheadUrl === "string" ? letterheadUrl : (letterheadUrl as any)?.src || "";
    if (!url) return null;
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function bakeWatermark(
  bytes: Uint8Array,
  opacity: number,
): Promise<Uint8Array | null> {
  if (typeof document === "undefined") return null;
  try {
    const blob = new Blob([bytes as BlobPart], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const max = 600;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const dataUrl = c.toDataURL("image/jpeg", 0.6);
    const b64 = dataUrl.split(",")[1];
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/**
 * Build a Header that floats the official letterhead pad behind the body
 * text on every page. The pad already carries the logo, watermark, and
 * navy footer band, so the body just needs comfortable margins.
 *
 * Falls back to a minimal typographic header when the pad fetch fails so
 * generated documents still carry the brand identity.
 */
function makeLetterhead(
  brand: BriefBranding,
  pad: Uint8Array | null,
): Header {
  if (pad) {
    return new Header({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              type: "jpg",
              data: pad,
              // A4 portrait at 96 DPI: 794 x 1123 px ≈ 8.27 x 11.69 in.
              transformation: { width: 794, height: 1123 },
              floating: {
                horizontalPosition: {
                  relative: "page" as never,
                  align: "center" as never,
                } as never,
                verticalPosition: {
                  relative: "page" as never,
                  align: "center" as never,
                } as never,
                behindDocument: true,
                zIndex: 0,
              },
              altText: {
                title: `${brand.companyName} letterhead`,
                description: `Official ${brand.companyName} letterhead — logo, watermark, and contact band.`,
                name: "letterhead",
              },
            }),
          ],
        }),
      ],
    });
  }
  // Fallback: minimal typographic letterhead band so brand still shows.
  return new Header({
    children: [
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Yess", bold: true, color: "BE1E2D", size: 32 }),
          new TextRun({ text: " bangla", bold: true, color: "148C3C", size: 32 }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 1 },
        },
        children: [new TextRun({ text: "", size: 2 })],
      }),
    ],
  });
}

function noBorder() {
  const n = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: n, bottom: n, left: n, right: n };
}
function tableNoBorders() {
  const n = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return {
    top: n,
    bottom: n,
    left: n,
    right: n,
    insideHorizontal: n,
    insideVertical: n,
  };
}

function makeFooter(): Footer {
  // Pad already shows the navy contact band — footer just carries the
  // page number, anchored above the band so it stays visible.
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Page ", color: "808080", size: 14 }),
          new TextRun({ children: [PageNumber.CURRENT], color: "808080", size: 14 }),
          new TextRun({ text: " of ", color: "808080", size: 14 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "808080", size: 14 }),
        ],
      }),
    ],
  });
}

function p(text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 22,
        color: opts.color ?? "3C3C3C",
      }),
    ],
  });
}

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({ text, bold: true, color: "141414", size: 40 }),
    ],
  });
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 1 },
    },
    children: [
      new TextRun({ text, bold: true, color: NAVY, size: 28 }),
    ],
  });
}

function bullet(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: "•  " + text, color: "373737", size: 22 }),
    ],
  });
}

export async function buildVentureBriefDocx(
  v: Venture,
  opts: DocxBriefOptions = {},
): Promise<Blob> {
  const brand = resolveBranding(opts.branding);
  // Pad fetch is the new primary brand asset — logo bytes are no longer
  // required for the header (the pad already contains the logo + footer).
  const pad = await fetchPadBytes();

  const cs = getVentureCase(v);
  const milestones = getVentureMilestones(v);
  const packages = getVenturePackages(v);
  const faqs = getVentureFaqs(v);

  // Body paragraphs
  const body: Paragraph[] = [];

  body.push(h1(v.title));
  body.push(p(v.tagline, { bold: true, size: 24, color: "505050" }));
  body.push(p(v.longDesc));

  body.push(h2("Highlights"));
  v.highlights.forEach((x) => body.push(bullet(x)));

  body.push(h2("Services"));
  body.push(p(v.services.join(" · ")));

  body.push(h2("Audience"));
  body.push(p(v.audience));

  body.push(h2("Challenge"));
  body.push(p(cs.challenge));
  body.push(h2("Our solution"));
  body.push(p(cs.solution));

  body.push(h2("Delivery phases"));
  cs.phases.forEach((ph, i) => {
    body.push(p(`${i + 1}. ${ph.title}`, { bold: true, color: "282828" }));
    body.push(p(ph.desc));
  });

  body.push(h2("Capabilities & stack"));
  body.push(p(cs.techStack.join(", ")));

  body.push(h2("Outcomes"));
  cs.results.forEach((r) => body.push(bullet(`${r.value} — ${r.label}`)));

  body.push(h2("Key milestones"));
  milestones.forEach((m) => body.push(bullet(`${m.year} — ${m.title}: ${m.desc}`)));

  body.push(h2("Engagement packages"));
  packages.forEach((pk) => {
    body.push(
      p(`${pk.name} — ${pk.price}${pk.cadence ? " " + pk.cadence : ""}`, {
        bold: true,
        color: NAVY,
        size: 24,
      }),
    );
    body.push(p(pk.summary));
    pk.features.forEach((f) => body.push(bullet(f)));
  });

  body.push(h2("FAQs"));
  faqs.forEach((f) => {
    body.push(p("Q: " + f.q, { bold: true }));
    body.push(p("A: " + f.a));
  });

  body.push(h2("Talk to us"));
  body.push(
    p(
      "Reach out to our enterprise desk for a tailored proposal, references on request, and NDA-ready discovery.",
    ),
  );

  const doc = new Document({
    creator: brand.companyName,
    title: `${v.title} — ${brand.documentLabel}`,
    description: v.tagline,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: 2160, // ~1.5"
              right: 1440,
              bottom: 1800,
              left: 1440,
              header: 360,
              footer: 360,
            },
          },
        },
        headers: { default: makeLetterhead(brand, pad) },
        footers: { default: makeFooter() },
        children: body,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadVentureBriefDocx(
  v: Venture,
  opts: DocxBriefOptions = {},
) {
  const blob = await buildVentureBriefDocx(v, opts);
  const name = (opts.fileName ?? `${v.slug}-enterprise-brief`).replace(/\.docx$/, "");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".docx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob;
}
