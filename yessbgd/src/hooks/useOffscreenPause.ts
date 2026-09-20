import { useEffect, useRef } from "react";

/**
 * Pauses CSS animations on the element (and its descendants) when the
 * element is fully offscreen, using IntersectionObserver. Saves GPU/CPU
 * cycles for decorative animations like the hero water-ripple shimmer.
 *
 * Adds `is-paused` class when not intersecting; removes it when visible.
 * Pair with a CSS rule like:
 *   .is-paused .water-text,
 *   .is-paused .water-text-accent { animation-play-state: paused; }
 */
export function useOffscreenPause<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR / no IO support → leave animations running (graceful fallback)
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          el.classList.toggle("is-paused", !entry.isIntersecting);
        }
      },
      // Small rootMargin so we resume slightly before scrolling into view
      { root: null, rootMargin: "50px", threshold: 0, ...options }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [options]);

  return ref;
}
