import { Link, useLocation } from "@tanstack/react-router";
import { Home, Briefcase, Layers, Building2, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Native-app-style bottom tab bar.
 * - Visible only below `lg` (mobile + small tablet)
 * - Safe-area inset aware (iOS home indicator)
 * - Glass surface, blurred, with active pill indicator
 * - Tap feedback via active:scale + soft haptic-like spring
 */
type Tab = {
  to: "/" | "/services" | "/ventures" | "/about" | "/contact";
  key: string;
  icon: typeof Home;
  exact?: boolean;
  match?: string[];
};

const tabs: Tab[] = [
  { to: "/", key: "home", icon: Home, exact: true },
  { to: "/services", key: "services", icon: Briefcase },
  { to: "/ventures", key: "ventures", icon: Layers, match: ["/ventures", "/projects"] },
  { to: "/about", key: "about", icon: Building2 },
  { to: "/contact", key: "contact", icon: Mail },
];

export function MobileTabBar() {
  const { t } = useTranslation();
  const pathname = useLocation({ select: (l) => l.pathname });
  const reduce = useReducedMotion() ?? false;

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-auto mx-auto max-w-md px-3 pb-2 pt-2">
        <ul className="glass-strong border border-glass-border shadow-elegant rounded-2xl flex items-stretch justify-between px-1.5 py-1.5 backdrop-blur">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const matches = tab.match ?? [tab.to];
            const isActive = tab.exact
              ? pathname === tab.to
              : matches.some((m) => pathname === m || pathname.startsWith(m + "/"));
            return (
              <li key={tab.to} className="flex-1">
                <Link
                  to={tab.to}
                  preload="intent"
                  aria-label={t(`nav.${tab.key}`)}
                  aria-current={isActive ? "page" : undefined}
                  className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 min-h-12 text-[10.5px] font-semibold tracking-tight transition-colors active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-active-pill"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 380, damping: 32 }
                      }
                      className="absolute inset-1 -z-10 rounded-xl bg-secondary"
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={`h-[20px] w-[20px] transition-transform ${isActive ? "text-primary scale-105" : "text-foreground/65"}`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className={isActive ? "text-primary" : "text-foreground/70"}>
                    {t(`nav.${tab.key}`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
