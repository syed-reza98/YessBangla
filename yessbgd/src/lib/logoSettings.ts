// Per-surface logo tuning — header/footer scale + opacity (CSS-driven),
// and PDF/DOCX letterhead scale + opacity (passed into doc builders).
// Persisted in localStorage; applied to :root as CSS variables so the
// preview UI updates instantly without a remount.

export interface LogoSettings {
  /** 0.6 – 1.4 — multiplies the responsive height in the site header. */
  headerScale: number;
  /** 0 – 1 — opacity of the wordmark in the site header. */
  headerOpacity: number;
  /** 0.6 – 1.4 — multiplies the responsive height in the site footer. */
  footerScale: number;
  /** 0 – 1 — opacity of the wordmark in the site footer. */
  footerOpacity: number;
  /** 0.6 – 1.4 — multiplies the auto-fit logo height in PDF letterhead. */
  pdfScale: number;
  /** 0 – 1 — opacity of the PDF letterhead logo (independent of watermark). */
  pdfOpacity: number;
  /** 0.6 – 1.4 — multiplies the DOCX header logo width/height. */
  docxScale: number;
  /** 0 – 1 — relative opacity (DOCX has no native alpha; ignored unless < 1, then plate is dimmed). */
  docxOpacity: number;
}

export const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  headerScale: 1,
  headerOpacity: 1,
  footerScale: 1,
  footerOpacity: 1,
  pdfScale: 1,
  pdfOpacity: 1,
  docxScale: 1,
  docxOpacity: 1,
};

const STORE_KEY = "yess-logo-settings-v1";

const SCALE_MIN = 0.6;
const SCALE_MAX = 1.4;
const OP_MIN = 0.2;
const OP_MAX = 1;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function clampLogoSettings(s: Partial<LogoSettings>): LogoSettings {
  const merged = { ...DEFAULT_LOGO_SETTINGS, ...s };
  return {
    headerScale: clamp(merged.headerScale, SCALE_MIN, SCALE_MAX),
    headerOpacity: clamp(merged.headerOpacity, OP_MIN, OP_MAX),
    footerScale: clamp(merged.footerScale, SCALE_MIN, SCALE_MAX),
    footerOpacity: clamp(merged.footerOpacity, OP_MIN, OP_MAX),
    pdfScale: clamp(merged.pdfScale, SCALE_MIN, SCALE_MAX),
    pdfOpacity: clamp(merged.pdfOpacity, OP_MIN, OP_MAX),
    docxScale: clamp(merged.docxScale, SCALE_MIN, SCALE_MAX),
    docxOpacity: clamp(merged.docxOpacity, OP_MIN, OP_MAX),
  };
}

export function loadLogoSettings(): LogoSettings {
  if (typeof localStorage === "undefined") return DEFAULT_LOGO_SETTINGS;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULT_LOGO_SETTINGS;
    return clampLogoSettings(JSON.parse(raw) as Partial<LogoSettings>);
  } catch {
    return DEFAULT_LOGO_SETTINGS;
  }
}

const SETTINGS_EVENT = "yess:logo-settings-changed";

export function saveLogoSettings(s: LogoSettings) {
  const clamped = clampLogoSettings(s);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(clamped));
    } catch {
      /* quota */
    }
  }
  applyHeaderFooterCssVars(clamped);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: clamped }));
  }
  return clamped;
}

/** Push header/footer settings into :root CSS vars. */
export function applyHeaderFooterCssVars(s: LogoSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--logo-header-scale", String(s.headerScale));
  root.style.setProperty("--logo-header-opacity", String(s.headerOpacity));
  root.style.setProperty("--logo-footer-scale", String(s.footerScale));
  root.style.setProperty("--logo-footer-opacity", String(s.footerOpacity));
}

/** Subscribe to live changes (header/footer reapply CSS vars on mount + on event). */
export function onLogoSettingsChange(cb: (s: LogoSettings) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = (e: Event) => cb((e as CustomEvent<LogoSettings>).detail);
  window.addEventListener(SETTINGS_EVENT, handler as EventListener);
  return () => window.removeEventListener(SETTINGS_EVENT, handler as EventListener);
}
