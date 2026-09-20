import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Mode = "light" | "dark";
const STORE_KEY = "yess-theme-preview-v1";

function apply(mode: Mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
}

function readInitial(): Mode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    if (saved === "system" || !saved) {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  } catch { /* ignore */ }
  return "light";
}

interface ThemeToggleProps {
  variant?: "pill" | "compact";
  className?: string;
}

const LONG_PRESS_MS = 450;

export function ThemeToggle({ variant = "pill", className = "" }: ThemeToggleProps) {
  const [mode, setMode] = useState<Mode>("light");
  const [mounted, setMounted] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const tipId = useId();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [tipShift, setTipShift] = useState<{ left?: number; right?: number; top?: number }>({});

  useEffect(() => {
    const initial = readInitial();
    setMode(initial);
    apply(initial);
    setMounted(true);
  }, []);

  // Hide tooltip on Escape, scroll/wheel, and touch swipe (touchstart→touchend gesture).
  useEffect(() => {
    if (!tipOpen) return;
    const close = () => setTipOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };

    // Swipe detection — close if finger moves > SWIPE_PX in any direction
    const SWIPE_PX = 8;
    let startX = 0, startY = 0, startT = 0, tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      tracking = true;
      startX = t.clientX; startY = t.clientY; startT = performance.now();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      if (dx > SWIPE_PX || dy > SWIPE_PX) { tracking = false; close(); }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      const dt = performance.now() - startT;
      // Either a recognized swipe distance, or a quick flick — both dismiss
      if (dx > SWIPE_PX || dy > SWIPE_PX || dt < 250) close();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("wheel", close, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", close, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("wheel", close);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", close);
    };
  }, [tipOpen]);

  // Auto-reposition: when tooltip opens, measure and clamp into viewport.
  // Flips horizontally (right→left) or shifts inward; flips vertically below header if clipped.
  useLayoutEffect(() => {
    if (!tipOpen || !tipRef.current) { setTipShift({}); return; }
    const measure = () => {
      const tip = tipRef.current;
      if (!tip) return;
      // Reset to natural position to measure honestly
      tip.style.left = ""; tip.style.right = ""; tip.style.top = "";
      const rect = tip.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;
      const next: { left?: number; right?: number; top?: number } = {};
      if (rect.right > vw - margin) {
        // Overflow right — anchor to right edge with margin
        next.right = margin;
        next.left = undefined;
      } else if (rect.left < margin) {
        // Overflow left — flip to left edge
        next.left = margin;
        next.right = undefined;
      }
      if (rect.bottom > vh - margin) {
        // Not enough room below — pin near bottom of viewport
        next.top = Math.max(margin, vh - rect.height - margin);
      }
      setTipShift(next);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tipOpen, mode, mounted]);

  const isDark = mode === "dark";
  const currentLabel = isDark ? "Dark mode" : "Light mode";
  const switchLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
  const tipText = mounted
    ? `${currentLabel} · ${switchLabel}`
    : "Theme";

  const toggle = () => {
    const next: Mode = isDark ? "light" : "dark";
    setMode(next);
    try { localStorage.setItem(STORE_KEY, next); } catch { /* quota */ }
    apply(next);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Pointer handlers — desktop hover + mobile long-press both reveal the tooltip
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setTipOpen(true);
  };
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setTipOpen(false);
    clearLongPress();
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") {
      clearLongPress();
      longPressTimer.current = setTimeout(() => setTipOpen(true), LONG_PRESS_MS);
    }
  };
  const handlePointerUp = () => clearLongPress();
  const handlePointerCancel = () => { clearLongPress(); setTipOpen(false); };

  const baseBtn =
    "relative inline-flex items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground/85 backdrop-blur transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const sizeCls = variant === "compact"
    ? "h-9 w-9"
    : "h-9 gap-1.5 px-3 text-xs font-semibold";

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-pressed={isDark}
        aria-label={switchLabel}
        aria-describedby={tipId}
        title={tipText}
        suppressHydrationWarning
        onClick={toggle}
        onFocus={() => setTipOpen(true)}
        onBlur={() => setTipOpen(false)}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`${baseBtn} ${sizeCls}`}
      >
        {mounted && isDark ? (
          <Sun className={variant === "compact" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
        ) : (
          <Moon className={variant === "compact" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
        )}
        {variant === "pill" && (
          <span className="hidden md:inline">{mounted && isDark ? "Light" : "Dark"}</span>
        )}
        <span className="sr-only">
          {mounted ? `Current theme: ${currentLabel}. Activate to ${switchLabel.toLowerCase()}.` : "Theme toggle"}
        </span>
      </button>

      {/* Tooltip — shown on hover, focus, or long-press. role=tooltip, linked via aria-describedby.
          On <sm screens, the toggle lives inside the 4rem sticky header, so anchor the tip with
          `fixed` just below the header bottom (calc(4rem + 0.5rem)) to guarantee no overlap.
          On sm+ it stays absolute relative to the button. */}
      <span
        ref={tipRef}
        id={tipId}
        role="tooltip"
        aria-hidden={!tipOpen}
        style={{
          left: tipShift.left !== undefined ? `${tipShift.left}px` : undefined,
          right: tipShift.right !== undefined ? `${tipShift.right}px` : undefined,
          top: tipShift.top !== undefined ? `${tipShift.top}px` : undefined,
        }}
        className={`pointer-events-none fixed right-3 top-[calc(4rem+0.5rem)] z-[60] max-w-[min(80vw,18rem)] truncate whitespace-nowrap rounded-md border border-border/70 bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-elegant transition-opacity duration-150 sm:absolute sm:right-0 sm:top-full sm:mt-2 ${tipOpen ? "opacity-100" : "opacity-0"}`}
      >
        {tipText}
      </span>
    </span>
  );
}
