/**
 * Liquid Glass background settings.
 * - Intensity: off | subtle | standard | vivid (motion / opacity strength)
 * - Palette : aurora | nordic | sunset | mono | ivory (color story)
 *
 * Both are persisted in localStorage and reflected as `data-glass` and
 * `data-palette` attributes on <html>, which `src/styles.css` reads to
 * paint the body sheen. The WaterBackground canvas listens for change
 * events so it can retune without remounting.
 */
export type GlassIntensity = "off" | "subtle" | "standard" | "vivid";
export type GlassPalette = "aurora" | "nordic" | "sunset" | "mono" | "ivory";

const STORE_KEY = "yess-liquid-glass-v1";
const PALETTE_KEY = "yess-liquid-glass-palette-v1";
const PALETTE_VERSION_KEY = "yess-liquid-glass-palette-version-v1";
const EVENT = "liquidglass:change";
const PALETTE_EVENT = "liquidglass:palette";
const DEFAULT_PALETTE: GlassPalette = "nordic";
const PALETTE_VERSION = "editorial-nordic-v2";

export function detectLowEnd(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  const saveData = nav.connection?.saveData ?? false;
  return saveData || cores <= 4 || mem <= 4;
}

export function loadIntensity(): GlassIntensity {
  if (typeof window === "undefined") return "standard";
  try {
    const v = localStorage.getItem(STORE_KEY) as GlassIntensity | null;
    if (v === "off" || v === "subtle" || v === "standard" || v === "vivid") return v;
  } catch { /* quota / privacy */ }
  return detectLowEnd() ? "subtle" : "standard";
}

export function applyIntensity(value: GlassIntensity) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-glass", value);
}

export function saveIntensity(value: GlassIntensity) {
  applyIntensity(value);
  try { localStorage.setItem(STORE_KEY, value); } catch { /* quota */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<GlassIntensity>(EVENT, { detail: value }));
  }
}

export function onIntensityChange(cb: (v: GlassIntensity) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<GlassIntensity>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/* -------------------- Palettes -------------------- */

export function loadPalette(): GlassPalette {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  try {
    if (localStorage.getItem(PALETTE_VERSION_KEY) !== PALETTE_VERSION) {
      localStorage.setItem(PALETTE_KEY, DEFAULT_PALETTE);
      localStorage.setItem(PALETTE_VERSION_KEY, PALETTE_VERSION);
      return DEFAULT_PALETTE;
    }
    const v = localStorage.getItem(PALETTE_KEY) as GlassPalette | null;
    if (v === "aurora" || v === "nordic" || v === "sunset" || v === "mono" || v === "ivory") return v;
  } catch { /* quota */ }
  return DEFAULT_PALETTE;
}

export function applyPalette(value: GlassPalette) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-palette", value);
}

export function resetPalette() {
  applyPalette(DEFAULT_PALETTE);
  try {
    localStorage.setItem(PALETTE_KEY, DEFAULT_PALETTE);
    localStorage.setItem(PALETTE_VERSION_KEY, PALETTE_VERSION);
  } catch { /* quota */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<GlassPalette>(PALETTE_EVENT, { detail: DEFAULT_PALETTE }));
  }
}

export function savePalette(value: GlassPalette) {
  applyPalette(value);
  try {
    localStorage.setItem(PALETTE_KEY, value);
    localStorage.setItem(PALETTE_VERSION_KEY, PALETTE_VERSION);
  } catch { /* quota */ }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<GlassPalette>(PALETTE_EVENT, { detail: value }));
  }
}

export function onPaletteChange(cb: (v: GlassPalette) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<GlassPalette>).detail);
  window.addEventListener(PALETTE_EVENT, handler);
  return () => window.removeEventListener(PALETTE_EVENT, handler);
}

/* -------------------- Tuning -------------------- */

export interface GlassTuning {
  alphaLight: number;
  alphaDark: number;
  radiusMul: number;
  speed: number;
  blobCount: number;
  fpsCap: number;
  rippleAlpha: number;
  enabled: boolean;
}

export function tuningFor(level: GlassIntensity, lowEnd: boolean): GlassTuning {
  const base: Record<GlassIntensity, GlassTuning> = {
    off:      { alphaLight: 0,    alphaDark: 0,    radiusMul: 0.6, speed: 0.0,    blobCount: 0, fpsCap: 0,  rippleAlpha: 0,    enabled: false },
    subtle:   { alphaLight: 0.18, alphaDark: 0.14, radiusMul: 0.7, speed: 0.00025, blobCount: 3, fpsCap: 30, rippleAlpha: 0.15, enabled: true  },
    standard: { alphaLight: 0.30, alphaDark: 0.22, radiusMul: 0.6, speed: 0.0004,  blobCount: 4, fpsCap: 60, rippleAlpha: 0.24, enabled: true  },
    vivid:    { alphaLight: 0.42, alphaDark: 0.32, radiusMul: 0.55, speed: 0.0006, blobCount: 5, fpsCap: 60, rippleAlpha: 0.32, enabled: true  },
  };
  const t = { ...base[level] };
  if (lowEnd && t.enabled) {
    t.fpsCap = Math.min(t.fpsCap, 24);
    t.blobCount = Math.max(2, t.blobCount - 1);
    t.alphaLight *= 0.85;
    t.alphaDark *= 0.85;
  }
  return t;
}

/* -------------------- Palette data -------------------- */

export type PaletteStop = { hue: number; sat: number; l: number };

export interface PaletteDef {
  id: GlassPalette;
  label: string;
  hint: string;
  light: PaletteStop[];
  dark: PaletteStop[];
  /** swatch CSS gradient for the settings UI chip */
  swatch: string;
}

export const PALETTES: Record<GlassPalette, PaletteDef> = {
  aurora: {
    id: "aurora",
    label: "Aurora",
    hint: "Cyan · peach · lavender · blush",
    light: [
      { hue: 200, sat: 0.045, l: 0.93 },
      { hue: 25,  sat: 0.055, l: 0.92 },
      { hue: 270, sat: 0.040, l: 0.93 },
      { hue: 35,  sat: 0.055, l: 0.91 },
      { hue: 220, sat: 0.030, l: 0.95 },
    ],
    dark: [
      { hue: 200, sat: 0.060, l: 0.45 },
      { hue: 25,  sat: 0.070, l: 0.45 },
      { hue: 270, sat: 0.060, l: 0.42 },
      { hue: 35,  sat: 0.070, l: 0.45 },
      { hue: 220, sat: 0.040, l: 0.30 },
    ],
    swatch:
      "linear-gradient(135deg, oklch(0.93 0.05 200), oklch(0.92 0.06 25) 35%, oklch(0.93 0.05 270) 70%, oklch(0.91 0.06 35))",
  },
  nordic: {
    id: "nordic",
    label: "Nordic",
    hint: "Glacier blue · teal · mint · slate",
    light: [
      { hue: 215, sat: 0.045, l: 0.93 },
      { hue: 190, sat: 0.050, l: 0.92 },
      { hue: 160, sat: 0.045, l: 0.93 },
      { hue: 235, sat: 0.030, l: 0.95 },
      { hue: 200, sat: 0.025, l: 0.96 },
    ],
    dark: [
      { hue: 215, sat: 0.060, l: 0.40 },
      { hue: 190, sat: 0.060, l: 0.38 },
      { hue: 160, sat: 0.055, l: 0.36 },
      { hue: 235, sat: 0.045, l: 0.28 },
      { hue: 200, sat: 0.035, l: 0.26 },
    ],
    swatch:
      "linear-gradient(135deg, oklch(0.93 0.05 215), oklch(0.92 0.05 190) 40%, oklch(0.93 0.045 160) 75%, oklch(0.95 0.03 235))",
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    hint: "Apricot · rose · amber · gold",
    light: [
      { hue: 35,  sat: 0.060, l: 0.92 },
      { hue: 15,  sat: 0.060, l: 0.91 },
      { hue: 55,  sat: 0.055, l: 0.93 },
      { hue: 350, sat: 0.045, l: 0.93 },
      { hue: 40,  sat: 0.030, l: 0.95 },
    ],
    dark: [
      { hue: 35,  sat: 0.075, l: 0.42 },
      { hue: 15,  sat: 0.075, l: 0.40 },
      { hue: 55,  sat: 0.065, l: 0.40 },
      { hue: 350, sat: 0.055, l: 0.35 },
      { hue: 40,  sat: 0.040, l: 0.28 },
    ],
    swatch:
      "linear-gradient(135deg, oklch(0.92 0.06 35), oklch(0.91 0.06 15) 40%, oklch(0.93 0.055 55) 75%, oklch(0.93 0.045 350))",
  },
  mono: {
    id: "mono",
    label: "Mono",
    hint: "Linen · stone · cream",
    light: [
      { hue: 60,  sat: 0.012, l: 0.96 },
      { hue: 230, sat: 0.012, l: 0.95 },
      { hue: 40,  sat: 0.018, l: 0.94 },
      { hue: 250, sat: 0.010, l: 0.96 },
      { hue: 80,  sat: 0.012, l: 0.95 },
    ],
    dark: [
      { hue: 230, sat: 0.020, l: 0.26 },
      { hue: 240, sat: 0.018, l: 0.22 },
      { hue: 60,  sat: 0.018, l: 0.28 },
      { hue: 250, sat: 0.015, l: 0.20 },
      { hue: 220, sat: 0.012, l: 0.24 },
    ],
    swatch:
      "linear-gradient(135deg, oklch(0.96 0.012 60), oklch(0.95 0.012 230) 50%, oklch(0.94 0.018 40))",
  },
  ivory: {
    id: "ivory",
    label: "Ivory + Gold",
    hint: "Warm ivory · champagne · soft gold",
    light: [
      { hue: 82,  sat: 0.026, l: 0.98 },
      { hue: 72,  sat: 0.045, l: 0.94 },
      { hue: 58,  sat: 0.052, l: 0.91 },
      { hue: 92,  sat: 0.032, l: 0.96 },
      { hue: 160, sat: 0.020, l: 0.94 },
    ],
    dark: [
      { hue: 72,  sat: 0.050, l: 0.38 },
      { hue: 58,  sat: 0.060, l: 0.34 },
      { hue: 88,  sat: 0.040, l: 0.30 },
      { hue: 160, sat: 0.030, l: 0.28 },
      { hue: 50,  sat: 0.028, l: 0.22 },
    ],
    swatch:
      "linear-gradient(135deg, oklch(0.98 0.026 82), oklch(0.94 0.045 72) 55%, oklch(0.91 0.052 58))",
  },
};

/** Live-resolved palette (reads current data-palette attribute). */
export function getPalette(theme: "light" | "dark"): PaletteStop[] {
  const id =
    (typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-palette") as GlassPalette | null)
      : null) ?? DEFAULT_PALETTE;
  const def = PALETTES[id] ?? PALETTES.ivory;
  return theme === "dark" ? def.dark : def.light;
}

/* Back-compat exports — kept so existing imports don't break.
   Prefer getPalette() so palette switching is reflected immediately. */
export const LIGHT_PALETTE = PALETTES.ivory.light;
export const DARK_PALETTE = PALETTES.ivory.dark;
