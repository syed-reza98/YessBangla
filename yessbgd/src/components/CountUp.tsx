import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export type CountFormat = {
  /** Compact suffix: 'K' (thousand), 'M' (million), 'B' (billion). Auto-applied if value >= threshold. */
  compact?: boolean;
  /** Show '%' suffix. */
  percent?: boolean;
  /** Show leading '+' sign for positive numbers. */
  plus?: boolean;
  /** Decimal places (default: 0, or 1 when compact and value < 10 in unit). */
  decimals?: number;
  /** Custom prefix (e.g. '$'). */
  prefix?: string;
  /** Custom suffix appended after unit/percent. */
  suffix?: string;
};

type Props = {
  /** Numeric target. */
  target: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Formatting options. */
  format?: CountFormat;
  className?: string;
};

/**
 * Animated number counter with K/M/B compaction, %/+ formatting,
 * intersection-triggered start and prefers-reduced-motion fallback.
 */
export function CountUp({ target, duration = 1600, format = {}, className }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<number>(reduce ? target : 0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (reduce) {
      setCurrent(target);
      return;
    }
    if (started) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, started, target]);

  useEffect(() => {
    if (!started || reduce) return;
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCurrent(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setCurrent(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, reduce, target, duration]);

  return (
    <span ref={ref} className={className}>
      {formatValue(current, format)}
    </span>
  );
}

export function formatValue(n: number, fmt: CountFormat = {}): string {
  const { compact, percent, plus, decimals, prefix = "", suffix = "" } = fmt;
  const sign = plus && n > 0 ? "+" : "";
  let body: string;
  let unit = "";

  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) {
      unit = "B";
      body = formatNumber(n / 1_000_000_000, decimals ?? (Math.abs(n) / 1_000_000_000 < 10 ? 1 : 0));
    } else if (abs >= 1_000_000) {
      unit = "M";
      body = formatNumber(n / 1_000_000, decimals ?? (Math.abs(n) / 1_000_000 < 10 ? 1 : 0));
    } else if (abs >= 1_000) {
      unit = "K";
      body = formatNumber(n / 1_000, decimals ?? (Math.abs(n) / 1_000 < 10 ? 1 : 0));
    } else {
      body = formatNumber(n, decimals ?? 0);
    }
  } else {
    body = formatNumber(n, decimals ?? 0);
  }

  const pct = percent ? "%" : "";
  return `${prefix}${body}${unit}${pct}${sign ? "" : ""}${sign}${suffix}`;
}

function formatNumber(n: number, decimals: number): string {
  if (decimals > 0) return n.toFixed(decimals);
  return Math.round(n).toLocaleString("en-US");
}

/** Skeleton placeholder matching CountUp's footprint to prevent layout jumps. */
export function CountUpSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        "inline-block h-[1em] w-[3.5ch] animate-pulse rounded-md bg-foreground/10 align-baseline " +
        (className ?? "")
      }
    />
  );
}
