import { useEffect, useState } from "react";
import { Droplets, Check, Sun, Moon, Monitor } from "lucide-react";
import {
  type GlassIntensity,
  type GlassPalette,
  PALETTES,
  loadIntensity,
  saveIntensity,
  loadPalette,
  savePalette,
} from "@/lib/liquidGlass";

/**
 * Floating Liquid Glass settings panel.
 * - Bottom-left, safe-area aware.
 * - Lets the user switch intensity tier and instantly preview the aurora
 *   palette in light / dark / system theme without touching app state.
 * - Persists both choices in localStorage.
 */
type Theme = "light" | "dark" | "system";
const THEME_KEY = "yess-theme-preview-v1";

const TIERS: { value: GlassIntensity; label: string; hint: string; swatch: string }[] = [
  { value: "off",      label: "Off",      hint: "No background animation",       swatch: "bg-muted" },
  { value: "subtle",   label: "Subtle",   hint: "Minimal motion, calm",          swatch: "bg-gradient-to-br from-[oklch(0.88_0.06_250)] to-[oklch(0.90_0.05_25)]" },
  { value: "standard", label: "Standard", hint: "Balanced (recommended)",        swatch: "bg-gradient-to-br from-[oklch(0.78_0.10_250)] via-[oklch(0.82_0.09_295)] to-[oklch(0.82_0.12_25)]" },
  { value: "vivid",    label: "Vivid",    hint: "Rich, cinematic",               swatch: "bg-gradient-to-br from-[oklch(0.72_0.14_250)] via-[oklch(0.74_0.13_305)] to-[oklch(0.78_0.16_20)]" },
];

function applyTheme(mode: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && sysDark);
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
}

function loadTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_KEY) as Theme | null;
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch { /* quota */ }
  return "system";
}

export function LiquidGlassToggle() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [intensity, setIntensity] = useState<GlassIntensity>("standard");
  const [palette, setPaletteState] = useState<GlassPalette>("aurora");
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setMounted(true);
    setIntensity(loadIntensity());
    setPaletteState(loadPalette());
    const t = loadTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  if (!mounted) return null;

  const pickIntensity = (v: GlassIntensity) => {
    setIntensity(v);
    saveIntensity(v);
  };
  const pickPalette = (v: GlassPalette) => {
    setPaletteState(v);
    savePalette(v);
  };
  const pickTheme = (m: Theme) => {
    setTheme(m);
    try { localStorage.setItem(THEME_KEY, m); } catch { /* quota */ }
    applyTheme(m);
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-40"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative">
        {open && (
          <div
            role="dialog"
            aria-label="Liquid Glass settings"
            className="absolute bottom-12 left-0 w-72 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur"
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Liquid Glass
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-md px-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Intensity tiers */}
            <div className="space-y-1" role="radiogroup" aria-label="Intensity">
              {TIERS.map((t) => {
                const active = intensity === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => pickIntensity(t.value)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                      active ? "bg-secondary text-foreground" : "text-foreground/80 hover:bg-secondary/60"
                    }`}
                  >
                    <span className={`h-7 w-7 shrink-0 rounded-lg border border-border/60 ${t.swatch}`} aria-hidden />
                    <span className="flex-1 leading-tight">
                      <span className="block font-medium">{t.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
                    </span>
                    <span className="inline-flex h-4 w-4 items-center justify-center">
                      {active && <Check className="h-4 w-4 text-primary" aria-hidden />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Palette presets */}
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Palette
              </p>
              <div role="radiogroup" aria-label="Palette" className="grid grid-cols-2 gap-1.5">
                {Object.values(PALETTES).map((p) => {
                  const active = palette === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => pickPalette(p.id)}
                      title={p.hint}
                      className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? "border-foreground/40 bg-secondary text-foreground"
                          : "border-border/60 bg-secondary/40 text-foreground/80 hover:bg-secondary/70"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="h-6 w-6 shrink-0 rounded-md border border-border/60"
                        style={{ backgroundImage: p.swatch }}
                      />
                      <span className="flex-1 leading-tight">
                        <span className="block font-medium">{p.label}</span>
                      </span>
                      {active && <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme preview */}
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Preview theme
              </p>
              <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1.5">
                {([
                  { value: "light",  label: "Light",  Icon: Sun },
                  { value: "dark",   label: "Dark",   Icon: Moon },
                  { value: "system", label: "Auto",   Icon: Monitor },
                ] as const).map(({ value, label, Icon }) => {
                  const active = theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => pickTheme(value)}
                      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors ${
                        active ? "bg-foreground text-background" : "bg-secondary/60 text-foreground/80 hover:bg-secondary"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          aria-label="Background settings"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="grid h-10 w-10 place-items-center rounded-full border border-border/70 bg-card/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-card"
        >
          <Droplets className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
