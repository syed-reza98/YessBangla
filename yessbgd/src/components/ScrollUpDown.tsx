import { useEffect, useState, useCallback } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Floating scroll up/down control.
 * - Bottom-right, safe-area aware, never overlaps mobile nav
 * - Shows after the user scrolls a bit
 * - Up arrow: smooth scroll to top
 * - Down arrow: smooth scroll to bottom; hides when already at bottom
 */
export function ScrollUpDown() {
  const [visible, setVisible] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setVisible(y > 240);
        setAtBottom(max - y < 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const scrollTo = useCallback(
    (top: number) => {
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    },
    [reduce]
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="scroll-controls"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="fixed z-40 flex flex-col gap-2"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
          aria-label="Page scroll controls"
        >
          <button
            type="button"
            onClick={() => scrollTo(0)}
            aria-label="Scroll to top"
            className="group grid h-11 w-11 place-items-center rounded-full glass-strong border border-glass-border text-foreground shadow-elegant backdrop-blur transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() =>
              scrollTo(document.documentElement.scrollHeight)
            }
            aria-label="Scroll to bottom"
            disabled={atBottom}
            className="group grid h-11 w-11 place-items-center rounded-full glass-strong border border-glass-border text-foreground shadow-elegant backdrop-blur transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowDown className="h-5 w-5" strokeWidth={2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
