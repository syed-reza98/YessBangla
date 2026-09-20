// In-browser QA harness for the venture brief watermark variants.
// Builds 3 PDF variants, renders page-1 thumbnails via pdfjs, and
// emits a REPORT.md summarising opacity/size, build time, PDF size,
// and per-page marker presence.
import {
  buildVentureBriefDoc,
  checkBriefIntegrity,
  DEFAULT_WATERMARK,
  type IntegrityReport,
  type PageFormat,
  type PageOrientation,
  type WatermarkOptions,
} from "@/lib/ventureBrief";
import type { BriefBranding } from "@/lib/briefBranding";
import type { Venture } from "@/data/ventures";

export interface QaVariantInput {
  label: string;
  description: string;
  target: string;
  watermark: WatermarkOptions;
}

export interface QaVariantResult {
  label: string;
  description: string;
  target: string;
  watermark: Required<WatermarkOptions>;
  pdfBlobUrl: string;
  pdfSizeKb: number;
  buildMs: number;
  pages: number;
  integrity: IntegrityReport;
  thumbnails: string[]; // data URLs for page 1 + 2 if present
}

export interface QaRunResult {
  variants: QaVariantResult[];
  reportMarkdown: string;
  reportBlobUrl: string;
  generatedAt: string;
  ventureTitle: string;
  ventureSlug: string;
}

export function defaultQaVariants(base: WatermarkOptions): QaVariantInput[] {
  const opacity = base.opacity ?? DEFAULT_WATERMARK.opacity;
  const sizeFraction = base.sizeFraction ?? DEFAULT_WATERMARK.sizeFraction;
  return [
    {
      label: "01-gstate-default",
      description:
        "GState alpha — modern viewers (Adobe, Preview, Chrome desktop)",
      target: "iOS Quick Look · Adobe Acrobat · Preview",
      watermark: { opacity, sizeFraction, forceFallback: false },
    },
    {
      label: "02-fallback-raster",
      description: "Pre-faded raster — mobile-safe (no GState dependency)",
      target: "Android Chrome · WPS Office · Xodo",
      watermark: { opacity, sizeFraction, forceFallback: true },
    },
    {
      label: "03-high-contrast",
      description: "Higher opacity for branding-forward review copies",
      target: "Desktop print preview · executive review",
      watermark: {
        opacity: Math.min(0.18, opacity * 2),
        sizeFraction: Math.min(0.95, sizeFraction + 0.1),
        forceFallback: false,
      },
    },
  ];
}

async function renderPdfThumbnails(
  bytes: Uint8Array,
  maxPages = 2,
): Promise<string[]> {
  // pdfjs-dist is heavy — load it lazily.
  const pdfjs = await import("pdfjs-dist");
  // Worker for pdfjs
  const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "5.7.284"}/build/pdf.worker.min.mjs`;
  (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } })
    .GlobalWorkerOptions.workerSrc = workerUrl;
  const loading = pdfjs.getDocument({ data: bytes });
  const doc = await loading.promise;
  const out: string[] = [];
  const pageCount = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 0.6 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    out.push(canvas.toDataURL("image/jpeg", 0.78));
  }
  await doc.destroy();
  return out;
}

export interface QaRunOptions {
  format?: PageFormat;
  orientation?: PageOrientation;
  branding?: BriefBranding;
  variants?: QaVariantInput[];
  baseWatermark?: WatermarkOptions;
}

export async function runQaPreview(
  v: Venture,
  opts: QaRunOptions = {},
): Promise<QaRunResult> {
  const variants =
    opts.variants ??
    defaultQaVariants(opts.baseWatermark ?? DEFAULT_WATERMARK);
  const results: QaVariantResult[] = [];

  for (const variant of variants) {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const doc = await buildVentureBriefDoc(v, {
      format: opts.format,
      orientation: opts.orientation,
      branding: opts.branding,
      watermark: variant.watermark,
      skipSave: true,
    });
    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      t0;
    const ab = doc.output("arraybuffer") as ArrayBuffer;
    const bytes = new Uint8Array(ab);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const integrity = checkBriefIntegrity(doc);
    const settings: Required<WatermarkOptions> = {
      opacity:
        variant.watermark.opacity ?? DEFAULT_WATERMARK.opacity,
      sizeFraction:
        variant.watermark.sizeFraction ?? DEFAULT_WATERMARK.sizeFraction,
      forceFallback:
        variant.watermark.forceFallback ?? DEFAULT_WATERMARK.forceFallback,
    };
    let thumbnails: string[] = [];
    try {
      thumbnails = await renderPdfThumbnails(bytes, 2);
    } catch (err) {
      console.warn("[qa] thumbnail render failed", err);
    }
    results.push({
      label: variant.label,
      description: variant.description,
      target: variant.target,
      watermark: settings,
      pdfBlobUrl: URL.createObjectURL(blob),
      pdfSizeKb: +(bytes.byteLength / 1024).toFixed(1),
      buildMs: Math.round(elapsed),
      pages: doc.getNumberOfPages(),
      integrity,
      thumbnails,
    });
  }

  const generatedAt = new Date().toISOString();
  const reportMarkdown = buildReportMarkdown(v, results, generatedAt, {
    format: opts.format ?? "a4",
    orientation: opts.orientation ?? "portrait",
  });
  const reportBlob = new Blob([reportMarkdown], { type: "text/markdown" });

  return {
    variants: results,
    reportMarkdown,
    reportBlobUrl: URL.createObjectURL(reportBlob),
    generatedAt,
    ventureTitle: v.title,
    ventureSlug: v.slug,
  };
}

function buildReportMarkdown(
  v: Venture,
  rows: QaVariantResult[],
  generatedAt: string,
  meta: { format: PageFormat; orientation: PageOrientation },
): string {
  const header = `# PDF Watermark QA Report

Generated: ${generatedAt}
Sample venture: **${v.title}** (${v.slug})
Page format: **${meta.format.toUpperCase()} · ${meta.orientation}**

## Variants

| # | Label | Watermark | Target viewers | PDF size | Build time | Pages | Markers |
|---|-------|-----------|----------------|---------:|-----------:|------:|:-------:|
${rows
  .map(
    (r, i) =>
      `| ${i + 1} | \`${r.label}\` | opacity ${Math.round(
        r.watermark.opacity * 100,
      )}% / size ${Math.round(r.watermark.sizeFraction * 100)}%${
        r.watermark.forceFallback ? " · raster" : ""
      } | ${r.target} | ${r.pdfSizeKb} KB | ${r.buildMs} ms | ${r.pages} | ${
        r.integrity.ok ? "✅" : "❌"
      } |`,
  )
  .join("\n")}

## Variant details

${rows
  .map(
    (r, i) => `### ${i + 1}. ${r.description}

- **Label:** \`${r.label}\`
- **Target viewers:** ${r.target}
- **Opacity:** ${r.watermark.opacity} · **Size fraction:** ${r.watermark.sizeFraction}${r.watermark.forceFallback ? " · **forceFallback: true**" : ""}
- **PDF size:** ${r.pdfSizeKb} KB · **Build time:** ${r.buildMs} ms · **Pages:** ${r.pages}
- **Integrity:** ${r.integrity.ok ? "✅ all pages contain letterhead, watermark and footer markers" : `❌ ${r.integrity.message}`}
`,
  )
  .join("\n")}

## Mobile viewer compatibility checklist

| Viewer | GState alpha | Recommended variant |
|--------|:------------:|---------------------|
| iOS Safari Quick Look | ✅ | \`01-gstate-default\` |
| iOS Adobe Acrobat | ✅ | \`01-gstate-default\` |
| Android Chrome (Pdfium) | ⚠️ partial | \`02-fallback-raster\` |
| Android WPS Office | ❌ inconsistent | \`02-fallback-raster\` |
| Xodo / Foxit Mobile | ✅ | \`01-gstate-default\` |
| Desktop print | ✅ | \`03-high-contrast\` |
`;
  return header;
}

export function disposeQaRun(run: QaRunResult | null) {
  if (!run) return;
  URL.revokeObjectURL(run.reportBlobUrl);
  for (const v of run.variants) URL.revokeObjectURL(v.pdfBlobUrl);
}
