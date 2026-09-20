// In-browser visual regression for the venture brief PDF.
//
// Builds a PDF for every (format × orientation) combo, rasterises every
// page via pdfjs-dist, and compares the rendered PNG bytes against a
// stored baseline using pixelmatch. Baselines live in IndexedDB keyed by
// the active branding preset so swapping presets does not invalidate
// unrelated baselines.
//
// Returns rich result objects (per page, per region) so the UI can show
// before/after thumbnails plus a red-pixel diff overlay, and so we can
// emit a self-contained HTML / PDF QA report.

import pixelmatch from "pixelmatch";
import jsPDF from "jspdf";
import {
  buildVentureBriefDoc,
  type PageFormat,
  type PageOrientation,
} from "@/lib/ventureBrief";
import type { BriefBranding } from "@/lib/briefBranding";
import type { Venture } from "@/data/ventures";

export type ComboKey = `${PageFormat}-${PageOrientation}`;

export const COMBOS: Array<{
  format: PageFormat;
  orientation: PageOrientation;
  key: ComboKey;
}> = [
  { format: "a4", orientation: "portrait", key: "a4-portrait" },
  { format: "a4", orientation: "landscape", key: "a4-landscape" },
  { format: "letter", orientation: "portrait", key: "letter-portrait" },
  { format: "letter", orientation: "landscape", key: "letter-landscape" },
];

export interface PageDiffResult {
  page: number;
  status: "match" | "mismatch" | "added" | "missing" | "no-baseline";
  mismatchPct: number;
  diffPixels: number;
  totalPixels: number;
  width: number;
  height: number;
  current: string | null; // PNG data URL (downscaled)
  baseline: string | null; // PNG data URL (downscaled)
  diff: string | null; // PNG data URL with red diff overlay
}

export interface ComboDiffResult {
  combo: ComboKey;
  format: PageFormat;
  orientation: PageOrientation;
  pages: PageDiffResult[];
  pagesCompared: number;
  pagesMismatched: number;
  hasBaseline: boolean;
  buildMs: number;
}

export interface VisualDiffRun {
  generatedAt: string;
  presetId: string;
  presetName: string;
  ventureSlug: string;
  ventureTitle: string;
  combos: ComboDiffResult[];
  totalMismatched: number;
  totalCompared: number;
}

// ───────────────────────────────────────── IndexedDB baseline store

const DB_NAME = "yess-brief-visual-baseline";
const DB_STORE = "snapshots";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbKeys(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
    req.onerror = () => reject(req.error);
  });
}

async function idbClearPrefix(prefix: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (String(cursor.key).startsWith(prefix)) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function baselineKey(
  presetId: string,
  ventureSlug: string,
  combo: ComboKey,
  page: number,
): string {
  return `${presetId}::${ventureSlug}::${combo}::p${page}`;
}

// ───────────────────────────────────────── PDF → ImageData via pdfjs

const RENDER_SCALE = 0.55; // balance fidelity vs. memory for big briefs

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "5.7.284"}/build/pdf.worker.min.mjs`;
  (
    pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }
  ).GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

interface RenderedPage {
  width: number;
  height: number;
  imageData: ImageData;
  dataUrl: string;
}

async function renderPdf(bytes: Uint8Array): Promise<RenderedPage[]> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const out: RenderedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    out.push({
      width: canvas.width,
      height: canvas.height,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      dataUrl: canvas.toDataURL("image/png"),
    });
  }
  await doc.destroy();
  return out;
}

// ───────────────────────────────────────── Diff helpers

function dataUrlToImageData(
  url: string,
): Promise<{ data: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      resolve({
        data: ctx.getImageData(0, 0, canvas.width, canvas.height),
        width: canvas.width,
        height: canvas.height,
      });
    };
    img.onerror = () => reject(new Error("baseline decode failed"));
    img.src = url;
  });
}

function imageDataToDataUrl(img: ImageData): string {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

interface DiffPixelOutcome {
  diffPixels: number;
  diffDataUrl: string;
}

function diffPixels(
  a: ImageData,
  b: ImageData,
): DiffPixelOutcome {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const out = new ImageData(w, h);
  const aSlice = sliceImage(a, w, h);
  const bSlice = sliceImage(b, w, h);
  const count = pixelmatch(aSlice.data, bSlice.data, out.data, w, h, {
    threshold: 0.12,
    includeAA: false,
    diffColor: [255, 64, 64],
    alpha: 0.35,
  });
  return { diffPixels: count, diffDataUrl: imageDataToDataUrl(out) };
}

function sliceImage(src: ImageData, w: number, h: number): ImageData {
  if (src.width === w && src.height === h) return src;
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.getContext("2d")!.putImageData(src, 0, 0);
  const c2 = document.createElement("canvas");
  c2.width = w;
  c2.height = h;
  c2.getContext("2d")!.drawImage(c, 0, 0);
  return c2.getContext("2d")!.getImageData(0, 0, w, h);
}

// ───────────────────────────────────────── Public API

export interface VisualDiffOptions {
  presetId: string;
  presetName: string;
  branding: BriefBranding;
  combos?: typeof COMBOS;
}

export async function captureBaseline(
  v: Venture,
  opts: VisualDiffOptions,
): Promise<{ combo: ComboKey; pages: number }[]> {
  const combos = opts.combos ?? COMBOS;
  // Wipe previous baselines for this preset/venture so removed pages
  // don't linger as ghost diffs.
  await idbClearPrefix(`${opts.presetId}::${v.slug}::`);
  const summary: { combo: ComboKey; pages: number }[] = [];
  for (const c of combos) {
    const doc = await buildVentureBriefDoc(v, {
      format: c.format,
      orientation: c.orientation,
      branding: opts.branding,
      skipSave: true,
    });
    const bytes = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
    const pages = await renderPdf(bytes);
    for (let i = 0; i < pages.length; i++) {
      await idbPut(
        baselineKey(opts.presetId, v.slug, c.key, i + 1),
        pages[i].dataUrl,
      );
    }
    summary.push({ combo: c.key, pages: pages.length });
  }
  return summary;
}

export async function hasBaseline(
  v: Venture,
  presetId: string,
): Promise<boolean> {
  const keys = await idbKeys();
  const prefix = `${presetId}::${v.slug}::`;
  return keys.some((k) => k.startsWith(prefix));
}

export async function runVisualDiff(
  v: Venture,
  opts: VisualDiffOptions,
): Promise<VisualDiffRun> {
  const combos = opts.combos ?? COMBOS;
  const results: ComboDiffResult[] = [];

  for (const c of combos) {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const doc = await buildVentureBriefDoc(v, {
      format: c.format,
      orientation: c.orientation,
      branding: opts.branding,
      skipSave: true,
    });
    const bytes = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
    const rendered = await renderPdf(bytes);
    const buildMs = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        t0,
    );

    // Pull every baseline page (and detect missing/added).
    const baselineUrls: (string | null)[] = [];
    let baselineMaxPage = 0;
    {
      // Probe up to rendered.length + 4 pages so we catch baseline pages
      // that no longer exist in current output.
      const probeLimit = Math.max(rendered.length + 4, 1);
      for (let i = 1; i <= probeLimit; i++) {
        const url = await idbGet(
          baselineKey(opts.presetId, v.slug, c.key, i),
        );
        if (url) baselineMaxPage = i;
        baselineUrls.push(url);
      }
    }

    const hasBase = baselineMaxPage > 0;
    const totalPages = Math.max(rendered.length, baselineMaxPage);
    const pages: PageDiffResult[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const cur = rendered[i - 1];
      const baseUrl = baselineUrls[i - 1] ?? null;

      if (!hasBase) {
        pages.push({
          page: i,
          status: "no-baseline",
          mismatchPct: 0,
          diffPixels: 0,
          totalPixels: cur ? cur.width * cur.height : 0,
          width: cur?.width ?? 0,
          height: cur?.height ?? 0,
          current: cur?.dataUrl ?? null,
          baseline: null,
          diff: null,
        });
        continue;
      }
      if (cur && !baseUrl) {
        pages.push({
          page: i,
          status: "added",
          mismatchPct: 100,
          diffPixels: cur.width * cur.height,
          totalPixels: cur.width * cur.height,
          width: cur.width,
          height: cur.height,
          current: cur.dataUrl,
          baseline: null,
          diff: null,
        });
        continue;
      }
      if (!cur && baseUrl) {
        const base = await dataUrlToImageData(baseUrl);
        pages.push({
          page: i,
          status: "missing",
          mismatchPct: 100,
          diffPixels: base.width * base.height,
          totalPixels: base.width * base.height,
          width: base.width,
          height: base.height,
          current: null,
          baseline: baseUrl,
          diff: null,
        });
        continue;
      }
      // Both sides present — pixel diff.
      const base = await dataUrlToImageData(baseUrl!);
      const { diffPixels: dp, diffDataUrl } = diffPixels(
        base.data,
        cur!.imageData,
      );
      const total = Math.min(base.width, cur!.width) *
        Math.min(base.height, cur!.height);
      const pct = total === 0 ? 0 : (dp / total) * 100;
      pages.push({
        page: i,
        status: pct > 0.5 ? "mismatch" : "match",
        mismatchPct: +pct.toFixed(3),
        diffPixels: dp,
        totalPixels: total,
        width: cur!.width,
        height: cur!.height,
        current: cur!.dataUrl,
        baseline: baseUrl,
        diff: diffDataUrl,
      });
    }

    const pagesCompared = pages.filter(
      (p) => p.status === "match" || p.status === "mismatch",
    ).length;
    const pagesMismatched = pages.filter(
      (p) =>
        p.status === "mismatch" ||
        p.status === "added" ||
        p.status === "missing",
    ).length;

    results.push({
      combo: c.key,
      format: c.format,
      orientation: c.orientation,
      pages,
      pagesCompared,
      pagesMismatched,
      hasBaseline: hasBase,
      buildMs,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    presetId: opts.presetId,
    presetName: opts.presetName,
    ventureSlug: v.slug,
    ventureTitle: v.title,
    combos: results,
    totalMismatched: results.reduce((s, r) => s + r.pagesMismatched, 0),
    totalCompared: results.reduce((s, r) => s + r.pagesCompared, 0),
  };
}

// ───────────────────────────────────────── Reports

const STATUS_BADGE: Record<PageDiffResult["status"], { label: string; bg: string; fg: string }> = {
  match: { label: "MATCH", bg: "#dcfce7", fg: "#166534" },
  mismatch: { label: "MISMATCH", bg: "#fee2e2", fg: "#991b1b" },
  added: { label: "ADDED", bg: "#fef3c7", fg: "#92400e" },
  missing: { label: "MISSING", bg: "#fef3c7", fg: "#92400e" },
  "no-baseline": { label: "NO BASELINE", bg: "#e5e7eb", fg: "#374151" },
};

export function buildHtmlReport(run: VisualDiffRun): string {
  const css = `
    body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 32px 0 8px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 16px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0 24px; }
    .stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
    .stat .v { font-size: 22px; font-weight: 700; }
    .stat .l { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
    .combo { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .combo header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .page { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .page figure { margin: 0; }
    .page figcaption { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
    .page img { width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; }
    .page-row { padding: 12px 0; border-bottom: 1px dashed #e2e8f0; }
    .page-row:last-child { border-bottom: 0; }
    .page-row h3 { font-size: 13px; margin: 0 0 4px; }
  `;
  const summary = `
    <div class="summary">
      <div class="stat"><div class="v">${run.totalMismatched}</div><div class="l">Mismatched pages</div></div>
      <div class="stat"><div class="v">${run.totalCompared}</div><div class="l">Pages compared</div></div>
      <div class="stat"><div class="v">${run.combos.length}</div><div class="l">Format combos</div></div>
      <div class="stat"><div class="v">${run.presetName}</div><div class="l">Branding preset</div></div>
    </div>
  `;
  const combos = run.combos
    .map((c) => {
      const status = c.pagesMismatched === 0 && c.hasBaseline
        ? `<span class="badge" style="background:#dcfce7;color:#166534">All pages match</span>`
        : !c.hasBaseline
          ? `<span class="badge" style="background:#e5e7eb;color:#374151">No baseline</span>`
          : `<span class="badge" style="background:#fee2e2;color:#991b1b">${c.pagesMismatched} mismatched</span>`;
      const pages = c.pages
        .map((p) => {
          const b = STATUS_BADGE[p.status];
          const cells: string[] = [];
          cells.push(
            `<figure><figcaption>Baseline</figcaption>${p.baseline ? `<img src="${p.baseline}" alt="baseline page ${p.page}" />` : `<div style="aspect-ratio:1/1.4;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:6px;color:#94a3b8;font-size:11px">none</div>`}</figure>`,
          );
          cells.push(
            `<figure><figcaption>Current</figcaption>${p.current ? `<img src="${p.current}" alt="current page ${p.page}" />` : `<div style="aspect-ratio:1/1.4;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:6px;color:#94a3b8;font-size:11px">none</div>`}</figure>`,
          );
          cells.push(
            `<figure><figcaption>Diff</figcaption>${p.diff ? `<img src="${p.diff}" alt="diff page ${p.page}" />` : `<div style="aspect-ratio:1/1.4;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:6px;color:#94a3b8;font-size:11px">n/a</div>`}</figure>`,
          );
          return `
            <div class="page-row">
              <h3>Page ${p.page} <span class="badge" style="background:${b.bg};color:${b.fg}">${b.label}</span> <span style="color:#64748b;font-weight:400">— ${p.mismatchPct}% pixels differ</span></h3>
              <div class="page">${cells.join("")}</div>
            </div>`;
        })
        .join("");
      return `
        <section class="combo">
          <header>
            <div>
              <h2 style="margin:0">${c.format.toUpperCase()} · ${c.orientation}</h2>
              <div class="meta">${c.pages.length} page(s) · build ${c.buildMs} ms</div>
            </div>
            ${status}
          </header>
          ${pages}
        </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>QA report — ${run.ventureTitle}</title>
<style>${css}</style>
</head>
<body>
<h1>PDF Visual Regression — ${run.ventureTitle}</h1>
<div class="meta">Preset: <strong>${run.presetName}</strong> · Generated ${new Date(run.generatedAt).toLocaleString()}</div>
${summary}
${combos}
</body>
</html>`;
}

export function downloadHtmlReport(run: VisualDiffRun) {
  const html = buildHtmlReport(run);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${run.ventureSlug}-pdf-qa-report.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Compose a printable PDF QA report using jsPDF. */
export function downloadPdfReport(run: VisualDiffRun) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`PDF Visual Regression — ${run.ventureTitle}`, margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(
    `Preset: ${run.presetName}    Generated: ${new Date(run.generatedAt).toLocaleString()}`,
    margin,
    y,
  );
  y += 14;
  doc.text(
    `Pages compared: ${run.totalCompared}    Mismatched: ${run.totalMismatched}    Combos: ${run.combos.length}`,
    margin,
    y,
  );
  y += 20;
  doc.setTextColor(0);

  for (const c of run.combos) {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(
      `${c.format.toUpperCase()} · ${c.orientation}`,
      margin,
      y,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `${c.pages.length} page(s) · ${c.pagesMismatched} mismatched · build ${c.buildMs} ms`,
      margin,
      y + 12,
    );
    doc.setTextColor(0);
    y += 24;

    for (const p of c.pages) {
      const rowH = 110;
      ensureSpace(rowH + 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        `Page ${p.page} — ${STATUS_BADGE[p.status].label} (${p.mismatchPct}%)`,
        margin,
        y,
      );
      y += 6;

      const cellW = (pageW - margin * 2 - 16) / 3;
      const labels = ["Baseline", "Current", "Diff"];
      const sources = [p.baseline, p.current, p.diff];
      for (let i = 0; i < 3; i++) {
        const x = margin + i * (cellW + 8);
        doc.setDrawColor(200);
        doc.rect(x, y + 4, cellW, rowH - 12);
        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.text(labels[i], x + 2, y + 12);
        doc.setTextColor(0);
        const src = sources[i];
        if (src) {
          try {
            doc.addImage(
              src,
              "PNG",
              x + 4,
              y + 16,
              cellW - 8,
              rowH - 28,
              undefined,
              "FAST",
            );
          } catch {
            /* skip if jspdf can't decode */
          }
        } else {
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text("n/a", x + cellW / 2 - 6, y + rowH / 2);
          doc.setTextColor(0);
        }
      }
      y += rowH;
    }
    y += 8;
  }

  doc.save(`${run.ventureSlug}-pdf-qa-report.pdf`);
}
