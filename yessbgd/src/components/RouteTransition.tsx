import { useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Native-feel page transition. Fades + lifts the route content on every
 * pathname change. Honors prefers-reduced-motion.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const reduce = useReducedMotion() ?? false;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: reduce ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
