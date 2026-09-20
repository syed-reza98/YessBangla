import { describe, expect, test, beforeAll } from "bun:test";
import { ventures } from "@/data/ventures";
import {
  buildVentureBriefDoc,
  inspectBriefDoc,
  verifyBriefIntegrity,
  MARKERS,
  type PageFormat,
  type PageOrientation,
} from "@/lib/ventureBrief";

// jsPDF needs a DOM; set one up before any module touches `window`.
beforeAll(async () => {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("", { url: "http://localhost/" });
  // @ts-expect-error — assign minimal browser globals
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  // @ts-expect-error
  globalThis.navigator = dom.window.navigator;
  // @ts-expect-error
  globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
});

const sample = ventures[0];

const matrix: Array<{ format: PageFormat; orientation: PageOrientation }> = [
  { format: "a4", orientation: "portrait" },
  { format: "a4", orientation: "landscape" },
  { format: "letter", orientation: "portrait" },
  { format: "letter", orientation: "landscape" },
];

describe("ventureBrief PDF generator", () => {
  for (const { format, orientation } of matrix) {
    test(`renders letterhead/watermark/footer on every page (${format}/${orientation})`, async () => {
      const doc = await buildVentureBriefDoc(sample, {
        format,
        orientation,
        logoDataUrl: null, // tests don't need the raster logo
        skipSave: true,
      });
      const presence = inspectBriefDoc(doc);
      expect(presence.length).toBeGreaterThan(0);
      for (const p of presence) {
        expect(p.letterhead, `page ${p.page} missing letterhead`).toBe(true);
        expect(p.watermark, `page ${p.page} missing watermark`).toBe(true);
        expect(p.footer, `page ${p.page} missing footer`).toBe(true);
      }
      // Page geometry must match requested format/orientation
      const internal = doc.internal as unknown as {
        pageSize: { getWidth: () => number; getHeight: () => number };
      };
      const w = internal.pageSize.getWidth();
      const h = internal.pageSize.getHeight();
      if (orientation === "portrait") {
        expect(h).toBeGreaterThan(w);
      } else {
        expect(w).toBeGreaterThan(h);
      }
    });
  }

  test("verifyBriefIntegrity passes for a fresh brief", async () => {
    const doc = await buildVentureBriefDoc(sample, {
      logoDataUrl: null,
      skipSave: true,
    });
    expect(() => verifyBriefIntegrity(doc)).not.toThrow();
  });

  test("verifyBriefIntegrity throws when a marker is missing", async () => {
    const doc = await buildVentureBriefDoc(sample, {
      logoDataUrl: null,
      skipSave: true,
    });
    // Mutate the internal page stream to strip the watermark marker on page 1
    // and confirm the integrity check fires.
    const pages = (doc.internal as unknown as { pages: string[][] }).pages;
    pages[1] = pages[1].map((op) => op.replaceAll(MARKERS.watermark, ""));
    expect(() => verifyBriefIntegrity(doc)).toThrow(/watermark/);
  });

  test("multi-page docs apply chrome to every page", async () => {
    const doc = await buildVentureBriefDoc(sample, {
      logoDataUrl: null,
      skipSave: true,
    });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const presence = inspectBriefDoc(doc);
    const allOk = presence.every((p) => p.letterhead && p.watermark && p.footer);
    expect(allOk).toBe(true);
  });
});
