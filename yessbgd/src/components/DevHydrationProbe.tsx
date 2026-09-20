import { useEffect, useState } from "react";

/**
 * Dev-only overlay that surfaces hydration state, motion preference, viewport,
 * and DOM presence of critical above-the-fold elements (hero h1, header logo).
 *
 * Renders nothing in production. SSR-safe: returns null on server, mounts
 * on the client and reports any blank/null hero or header content.
 */
export function DevHydrationProbe() {
  // Mount strictly on the client to avoid SSR/CSR divergence on
  // `process.env.NODE_ENV !== "production"` (which can flip between server build and client),
  // which otherwise causes React to skip hydrating the probe subtree —
  // leaving every field stuck at its initial (✗ / ?) state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (process.env.NODE_ENV === "production") return null;
  return <ProbeInner />;
}

function ProbeInner() {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(true);
  const [forceReduce, setForceReduce] = useState(false);
  const [report, setReport] = useState({
    heroH1: "",
    heroH1Visible: false,
    headerLogo: false,
    headerNav: false,
    motion: "?",
    viewport: "?",
    dpr: 1,
    shimmerCount: 0,
    shimmerPaused: false,
    shimmerBgPos: "",
  });

  useEffect(() => {
    document.documentElement.classList.toggle("force-reduce-motion", forceReduce);
  }, [forceReduce]);

  useEffect(() => {
    setHydrated(true);

    const measure = () => {
      const h1 = document.querySelector("h1");
      const logoImg = document.querySelector('img[alt*="YESS"]');
      const headerNav =
        !!document.querySelector("header nav") ||
        !!document.querySelector('header [aria-label="Toggle menu"]');

      const visible = h1 ? isVisible(h1 as HTMLElement) : false;

      const shimmerEls = document.querySelectorAll<HTMLElement>(
        ".water-text, .water-text-accent",
      );
      let paused = shimmerEls.length > 0;
      let firstBgPos = "";
      shimmerEls.forEach((el, i) => {
        const cs = window.getComputedStyle(el);
        if (cs.animationPlayState !== "paused" && cs.animationName !== "none") {
          paused = false;
        }
        if (i === 0) firstBgPos = cs.backgroundPosition;
      });

      setReport({
        heroH1: (h1?.textContent || "").trim().slice(0, 60),
        heroH1Visible: visible,
        headerLogo: !!logoImg,
        headerNav,
        motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "reduce"
          : "no-preference",
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        dpr: window.devicePixelRatio,
        shimmerCount: shimmerEls.length,
        shimmerPaused: paused,
        shimmerBgPos: firstBgPos,
      });
    };

    measure();
    const t1 = setTimeout(measure, 120);
    const t2 = setTimeout(measure, 800);
    // Poll the shimmer's background-position so the readout reflects pause frames live
    const poll = window.setInterval(measure, 500);

    window.addEventListener("resize", measure);
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", measure);

    // Console summary for headless / scripted checks
    // eslint-disable-next-line no-console
    console.info("[DevHydrationProbe] mounted", {
      hydrated: true,
      ts: Date.now(),
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.clearInterval(poll);
      window.removeEventListener("resize", measure);
      mql.removeEventListener("change", measure);
    };
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  const ok = (b: boolean) => (b ? "✓" : "✗");
  const warn =
    !report.heroH1 ||
    !report.heroH1Visible ||
    !report.headerLogo ||
    !report.headerNav;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-[9999] rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-mono text-white shadow-lg backdrop-blur"
      >
        debug
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-3 right-3 z-[9999] max-w-[280px] rounded-lg border p-3 font-mono text-[11px] leading-relaxed shadow-xl backdrop-blur ${
        warn
          ? "border-red-400/60 bg-red-50/90 text-red-900"
          : "border-emerald-400/60 bg-white/90 text-emerald-900"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <strong>SSR/Hydration probe</strong>
        <button onClick={() => setOpen(false)} aria-label="Close" className="opacity-60 hover:opacity-100">×</button>
      </div>
      <div>hydrated: {ok(hydrated)}</div>
      <div>header.logo: {ok(report.headerLogo)} · nav: {ok(report.headerNav)}</div>
      <div>hero h1: {ok(!!report.heroH1)} visible: {ok(report.heroH1Visible)}</div>
      <div className="truncate opacity-70">↳ "{report.heroH1 || "(none)"}"</div>
      <div>motion: {report.motion}{forceReduce ? " (forced)" : ""}</div>
      <div>viewport: {report.viewport} @{report.dpr}x</div>
      <div className="mt-1 border-t border-current/20 pt-1">
        shimmer: {report.shimmerCount} {report.shimmerPaused ? "⏸ paused" : "▶ playing"}
      </div>
      <div className="truncate opacity-70">↳ bgPos: {report.shimmerBgPos || "(n/a)"}</div>
      <label className="mt-2 flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={forceReduce}
          onChange={(e) => setForceReduce(e.target.checked)}
        />
        force reduced-motion
      </label>
      <button
        onClick={toggleTheme}
        className="mt-1 w-full rounded border border-current/30 px-2 py-1 text-[11px] hover:bg-current/5"
      >
        toggle dark mode
      </button>
    </div>
  );
}

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const cs = window.getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none") return false;
  if (parseFloat(cs.opacity) < 0.05) return false;
  return true;
}
