import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MenuNode } from "@/lib/siteContent";
import { MenuIcon } from "@/lib/menuStyles";
import { useVentures } from "@/lib/dynamicContent";
import { activeVentures } from "@/data/ventures";

/**
 * Desktop-parity navigation rail for tablet/mobile breakpoints.
 * Renders the exact same top-level items and dropdown panels as the desktop bar,
 * but horizontally scrollable and tap-driven (touch has no hover).
 */
export function HeaderNavRail({ tree, bn }: { tree: MenuNode[]; bn: boolean }) {
  const { t } = useTranslation();
  const ventures = useVentures();
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const label = (n: MenuNode) => (bn && n.label_bn) || n.label;

  useEffect(() => {
    if (!openId) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  if (!tree.length) return null;

  return (
    <div ref={rootRef} className="relative border-t border-glass-border/70 lg:hidden" data-testid="header-nav-rail">
      <nav
        aria-label="Main"
        data-testid="header-nav-mobile"
        className="container-tight flex items-center gap-1 overflow-x-auto overscroll-x-contain py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tree.map((item) => {
          const isVenturesMega = item.href === "/ventures" && item.children.length === 0;
          const hasPanel = isVenturesMega || item.children.length > 0;
          const opened = openId === item.id;

          if (!hasPanel) {
            return (
              <Link
                key={item.id}
                to={item.href}
                preload="intent"
                data-nav-item
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-secondary"
                activeProps={{ className: "text-primary bg-secondary" }}
                activeOptions={item.href === "/" ? { exact: true } : undefined}
              >
                <MenuIcon name={item.icon} className="h-3.5 w-3.5" />
                {label(item)}
              </Link>
            );
          }

          return (
            <div key={item.id} className="shrink-0">
              <button
                type="button"
                data-nav-item
                aria-haspopup="true"
                aria-expanded={opened}
                onClick={() => setOpenId((v) => (v === item.id ? null : item.id))}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-secondary ${opened ? "bg-secondary text-primary" : "text-foreground/80"}`}
              >
                <MenuIcon name={item.icon} className="h-3.5 w-3.5" />
                {label(item)}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${opened ? "rotate-180" : ""}`} />
              </button>
            </div>
          );
        })}
      </nav>

      {openId &&
        (() => {
          const item = tree.find((n) => n.id === openId);
          if (!item) return null;
          const isVenturesMega = item.href === "/ventures" && item.children.length === 0;
          return (
            <div className="absolute inset-x-0 top-full z-50 px-3 pt-1">
              <div className="max-h-[60dvh] overflow-y-auto rounded-2xl border border-glass-border bg-card p-2 shadow-elegant">
                {isVenturesMega ? (
                  <>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {activeVentures(ventures).map((v) => {
                        const Icon = v.icon;
                        return (
                          <Link
                            key={v.slug}
                            to="/ventures/$slug"
                            params={{ slug: v.slug }}
                            preload="intent"
                            onClick={() => setOpenId(null)}
                            className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-secondary"
                          >
                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${v.color} text-primary-foreground`}>
                              <Icon className="h-4 w-4" strokeWidth={1.6} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{v.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{v.category}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      to="/projects"
                      onClick={() => setOpenId(null)}
                      className="mt-2 block rounded-xl bg-secondary px-4 py-2 text-center text-sm font-semibold text-primary"
                    >
                      {t("nav.viewAllVentures")}
                    </Link>
                  </>
                ) : (
                  <ul>
                    <li>
                      <Link
                        to={item.href}
                        preload="intent"
                        onClick={() => setOpenId(null)}
                        className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-secondary"
                      >
                        {label(item)}
                      </Link>
                    </li>
                    {item.children.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={c.href}
                          preload="intent"
                          onClick={() => setOpenId(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/85 hover:bg-secondary"
                        >
                          <MenuIcon name={c.icon} className="h-4 w-4" />
                          {label(c)}
                        </Link>
                        {c.children.length > 0 && (
                          <ul className="ml-5 border-l border-border pl-2">
                            {c.children.map((g) => (
                              <li key={g.id}>
                                <Link
                                  to={g.href}
                                  preload="intent"
                                  onClick={() => setOpenId(null)}
                                  className="block rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                                >
                                  {label(g)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
