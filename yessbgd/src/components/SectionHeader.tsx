import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

/**
 * Editorial section header — single source of truth for eyebrow + h2 + lede
 * across the home page. Keeps visual hierarchy consistent across all sections.
 *
 * Variants:
 *  - align="center" (default) — for full-width feature sections
 *  - align="left"             — for two-column / asymmetric sections
 *
 * Tokens:
 *  - eyebrow uses --primary, uppercase tracking [0.2em], 11–12px
 *  - h2 uses font-display, 600 weight, fluid clamp from base styles
 *  - lede uses --muted-foreground, 14–16px, max-w-2xl
 */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "center",
  className = "",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "center" | "left";
  className?: string;
  children?: ReactNode;
}) {
  const alignCls =
    align === "center"
      ? "mx-auto max-w-2xl text-center"
      : "max-w-2xl text-left";
  return (
    <Reveal className={`${alignCls} ${className}`}>
      <div
        className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        <span aria-hidden className="h-px w-6 bg-primary/40" />
        {eyebrow}
        <span aria-hidden className="h-px w-6 bg-primary/40" />
      </div>
      <h2 className="mt-3 font-display font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {lede && (
        <p
          className={`mt-3 text-muted-foreground ${
            align === "center" ? "mx-auto max-w-xl" : "max-w-xl"
          }`}
        >
          {lede}
        </p>
      )}
      {children}
    </Reveal>
  );
}

/**
 * Hairline gradient divider — subtle visual transition between sections.
 * Render BETWEEN sections (not inside) so it doesn't affect section padding.
 * Width-constrained via container-tight so it never stretches edge-to-edge.
 *
 * Contrast tuning:
 *  - Uses --foreground at low alpha (not --border) so the line strength is
 *    perceptually identical in light AND dark themes. `--border` resolves to
 *    a near-white 10% alpha in dark mode, which is barely visible against the
 *    dark mesh background; foreground-derived alpha solves that.
 *  - Two stacked gradients: a 1px hairline + a soft 1px highlight underneath,
 *    creating a gentle "etched" line that reads as premium without being heavy.
 *  - Edges fade fully to transparent so the divider feels suspended, not boxed.
 */
export function SectionDivider() {
  return (
    <div aria-hidden className="container-tight" role="presentation">
      <div className="relative mx-auto h-px w-full max-w-3xl">
        {/* Primary hairline — foreground at ~14% / 22% (light/dark via .dark variant) */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/15 to-transparent dark:via-foreground/25"
        />
        {/* Soft highlight directly beneath — adds depth in light mode, fades in dark */}
        <div
          className="absolute left-0 right-0 top-px h-px bg-gradient-to-r from-transparent via-background/80 to-transparent dark:via-foreground/5"
        />
      </div>
    </div>
  );
}
