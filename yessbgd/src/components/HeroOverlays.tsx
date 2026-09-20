import { useEffect, useRef } from "react";

/**
 * Hero overlay stack — premium cinematic look, perf-tuned.
 *
 * Design tokens (see src/styles.css → "HERO OVERLAY DESIGN TOKENS"):
 *   --hero-overlay-h     horizontal fade
 *   --hero-overlay-v     vertical vignette
 *   --hero-overlay-glow  warm radial spotlight
 *   --hero-halo-primary  / --hero-halo-accent  blurred color halos
 *   --hero-halo-blur     halo blur radius (≤ 48px for perf)
 *   --hero-glow-opacity  glow strength (auto-bumped via .hero-bright)
 *   --hero-grid-opacity  grid texture strength
 *
 * Behavior:
 *   • Hover parallax — handled by CSS (.hero-section:hover sets vars).
 *   • Scroll parallax — this component nudges --hero-py / --hero-hy on scroll,
 *     using a single rAF loop, transform-only (GPU compositor, no repaints).
 *   • Auto-contrast — samples the hero image's left side once on load and
 *     toggles .hero-bright on the parent section if the photo is light,
 *     boosting overlay opacity to keep the headline WCAG AA.
 *
 * Parent must be the <section className="hero-section ..."> wrapper.
 */
export function HeroOverlays({ imageSrc }: { imageSrc: string | { src: string } }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const src = typeof imageSrc === "string" ? imageSrc : imageSrc?.src || "";

  // Scroll parallax — rAF, transform vars only
  useEffect(() => {
    const el = rootRef.current?.parentElement as HTMLElement | null;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        // Progress through the section: 0 at top of viewport → 1 leaving
        const vh = window.innerHeight || 1;
        const p = Math.max(-1, Math.min(1, -rect.top / vh));
        // Subtle: max 14px translate — keeps the look premium, not gimmicky
        el.style.setProperty("--hero-py", `${(p * 14).toFixed(2)}px`);
        el.style.setProperty("--hero-hy", `${(p * -10).toFixed(2)}px`);
        el.style.setProperty("--hero-hx", `${(p * 6).toFixed(2)}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Auto-contrast — sample the left third of the hero image once
  useEffect(() => {
    const el = rootRef.current?.parentElement as HTMLElement | null;
    if (!el || !src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = 32, h = 32;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: false });
        if (!ctx) return;
        // Draw left third of the image (where headline sits)
        ctx.drawImage(img, 0, 0, img.width / 3, img.height, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Rec. 709 luma
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const luma = sum / (data.length / 4) / 255; // 0..1
        if (luma > 0.55) el.classList.add("hero-bright");
        else el.classList.remove("hero-bright");
      } catch {
        // Tainted canvas or decode failure — silently keep defaults
      }
    };
    img.src = src;
  }, [src]);

  return (
    <div ref={rootRef} aria-hidden className="contents">
      <div className="hero-overlay hero-overlay--h -z-10" />
      <div className="hero-overlay hero-overlay--v -z-10" />
      <div className="hero-overlay hero-overlay--glow -z-10" />
      <div
        className="hero-halo hero-halo--primary -z-10"
        style={{ left: "-5rem", top: "50%", height: "16rem", width: "16rem", marginTop: "-8rem" }}
      />
      <div
        className="hero-halo hero-halo--accent -z-10"
        style={{ right: "-2.5rem", top: "-2.5rem", height: "13rem", width: "13rem" }}
      />
      <div className="hero-overlay hero-overlay--grid -z-10" />
    </div>
  );
}
