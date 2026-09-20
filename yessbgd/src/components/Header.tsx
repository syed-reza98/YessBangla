import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Menu, X, ChevronDown, Mail, Phone, Facebook, Twitter, Youtube, Linkedin } from "lucide-react";
import { COMPANY_CONTACT, phoneHref } from "@/lib/companyContact";
import { FOOTER_DEFAULTS } from "@/lib/footerConfig";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useTranslation } from "react-i18next";
import fallbackLogo from "@/assets/yess-bangla-logo.png";
import { useVentures } from "@/lib/dynamicContent";
import { activeVentures } from "@/data/ventures";
import { type MenuNode, useSettingText } from "@/lib/siteContent";
import { resolveMediaUrl } from "@/lib/mediaAssets";
import { useHeaderMenu } from "@/lib/headerMenu";
import { clearMenuPreview } from "@/lib/menuPreview";
import { HeaderNavRail } from "@/components/HeaderNavRail";
import { MenuIcon, menuItemAppearance } from "@/lib/menuStyles";

import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ThemePreviewSwitch } from "@/components/ThemePreviewSwitch";

// Nav items reference i18n keys; labels are resolved at render time so they
// re-render when the user toggles language without remounting the header.
const nav = [
  { to: "/", key: "home" },
  { to: "/about", key: "about" },
  { to: "/services", key: "services" },
  { to: "/industries", key: "industries" },
  { to: "/insights", key: "insights" },
  { to: "/careers", key: "careers" },
  { to: "/contact", key: "contact" },
] as const;

// Corporate topbar social icons — mirrors the footer network list.
const TOPBAR_SOCIAL_ICONS = {
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
} as const;
const whatsappHref = `https://wa.me/${COMPANY_CONTACT.phone.tel.replace(/^\+/, "")}`;

const label = (n: MenuNode, bn: boolean) => (bn && n.label_bn) || n.label;
const badgeOf = (n: MenuNode, bn: boolean) => (bn && n.badge_bn) || n.badge;

// ---- Memoized mobile panel ----------------------------------------------
interface MobilePanelProps {
  onClose: () => void;
  mobileVenturesOpen: boolean;
  toggleMobileVentures: () => void;
  reduceMotion: boolean;
  venturesActive: boolean;
  tree: MenuNode[];
  bn: boolean;
}

const panelTransition = (reduce: boolean): Transition =>
  reduce
    ? { duration: 0 }
    : { duration: 0.26, ease: [0.32, 0.72, 0, 1] };

const MobilePanel = memo(function MobilePanel({
  onClose,
  mobileVenturesOpen,
  toggleMobileVentures,
  reduceMotion,
  venturesActive,
  tree,
  bn,
}: MobilePanelProps) {
  const { t } = useTranslation();
  const ventures = useVentures();
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpenIds((o) => ({ ...o, [id]: !o[id] }));

  const venturesBlock = (
    <div key="ventures-block">
      <button
        type="button"
        onClick={toggleMobileVentures}
        aria-expanded={mobileVenturesOpen}
        className={`flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-secondary ${venturesActive ? "text-primary bg-secondary" : ""}`}
      >
        <span>{t("nav.ventures")}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${mobileVenturesOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out"
        style={{
          gridTemplateRows: mobileVenturesOpen ? "1fr" : "0fr",
          opacity: mobileVenturesOpen ? 1 : 0,
        }}
        aria-hidden={!mobileVenturesOpen}
      >
        <div className="min-h-0">
          <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-3 py-1">
            {activeVentures(ventures).map((v) => {
              const Icon = v.icon;
              return (
                <Link
                  key={v.slug}
                  to="/ventures/$slug"
                  params={{ slug: v.slug }}
                  preload="intent"
                  onClick={onClose}
                  tabIndex={mobileVenturesOpen ? 0 : -1}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-[14px] text-foreground/85 transition-colors hover:bg-secondary"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${v.color} text-primary-foreground`}>
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{v.title}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{v.category}</span>
                  </span>
                </Link>
              );
            })}
            <Link
              to="/projects"
              preload="intent"
              onClick={onClose}
              tabIndex={mobileVenturesOpen ? 0 : -1}
              className="mt-1 rounded-xl px-2 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-secondary"
            >
              {t("nav.viewAllVentures")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCmsNode = (node: MenuNode, depth = 0): React.ReactNode => {
    if (node.href === "/ventures" && node.children.length === 0) return venturesBlock;
    if (node.children.length === 0) {
      return (
        <Link
          key={node.id}
          to={node.href}
          preload="intent"
          onClick={onClose}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-secondary active:bg-secondary"
          activeProps={{ className: "text-primary bg-secondary" }}
          activeOptions={node.href === "/" ? { exact: true } : undefined}
        >
          <MenuIcon name={node.icon} className="h-4 w-4" />
          {label(node, bn)}
          {badgeOf(node, bn) ? (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {badgeOf(node, bn)}
            </span>
          ) : null}
        </Link>
      );
    }
    const isOpen = !!openIds[node.id];
    return (
      <div key={node.id}>
        <button
          type="button"
          onClick={() => toggle(node.id)}
          aria-expanded={isOpen}
          aria-controls={`m-sub-${node.id}`}
          className="flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-secondary"
        >
          <span className="flex items-center gap-2">
            <MenuIcon name={node.icon} className="h-4 w-4" />
            {label(node, bn)}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <div
          id={`m-sub-${node.id}`}
          className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0">
            <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-3 py-1">
              {node.children.map((c) =>
                c.children.length ? (
                  <div key={c.id} className="py-1">
                    <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {label(c, bn)}
                    </p>
                    {c.children.map((g) => (
                      <Link
                        key={g.id}
                        to={g.href}
                        preload="intent"
                        onClick={onClose}
                        tabIndex={isOpen ? 0 : -1}
                        className="flex min-h-10 items-center gap-2 rounded-xl px-2 py-2 text-[14px] text-foreground/85 transition-colors hover:bg-secondary"
                      >
                        <MenuIcon name={g.icon} className="h-3.5 w-3.5" />
                        {label(g, bn)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={c.id}
                    to={c.href}
                    preload="intent"
                    onClick={onClose}
                    tabIndex={isOpen ? 0 : -1}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-[14px] text-foreground/85 transition-colors hover:bg-secondary"
                  >
                    <MenuIcon name={c.icon} className="h-4 w-4" />
                    {label(c, bn)}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key="mobile-menu"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={panelTransition(reduceMotion)}
      style={{ transformOrigin: "top", willChange: "transform, opacity", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      id="mobile-nav-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain glass-strong border-t border-glass-border shadow-elegant lg:hidden"
    >
      <div className="container-tight flex flex-col gap-1 py-3">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("nav.explore")}
        </p>

        {tree.length ? (
          tree.map((n) => renderCmsNode(n))
        ) : (
          <>
            {nav.slice(0, 3).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                onClick={onClose}
                className="flex min-h-11 items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-secondary active:bg-secondary"
                activeProps={{ className: "text-primary bg-secondary" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {t(`nav.${n.key}`)}
              </Link>
            ))}
            {venturesBlock}
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("nav.company")}
            </p>
            {nav.slice(3).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                onClick={onClose}
                className="flex min-h-11 items-center rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-secondary"
                activeProps={{ className: "text-primary bg-secondary" }}
              >
                {t(`nav.${n.key}`)}
              </Link>
            ))}
          </>
        )}

        {/* Mobile language switch — kept inside the panel for reachability */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("nav.explore")} · EN / BN
          </span>
          <LanguageSwitch variant="pill" />
        </div>

        <Link
          to="/contact"
          preload="intent"
          onClick={onClose}
          className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          {t("nav.letsTalk")} →
        </Link>
      </div>
    </motion.div>
  );
});

export function Header() {
  const ventures = useVentures();
  const { t, i18n } = useTranslation();
  const { tree, previewing } = useHeaderMenu();
  const bn = !!i18n.language?.startsWith("bn");
  const logo = resolveMediaUrl(useSettingText("logo_url", ""), fallbackLogo);

  const navNodes: MenuNode[] = tree.length
    ? tree
    : (nav.map((n) => ({
        id: n.to,
        location: "header",
        label: t(`nav.${n.key}`),
        label_bn: null,
        href: n.to,
        group_label: null,
        sort_order: 0,
        is_external: false,
        children: [],
      })) as unknown as MenuNode[]);

  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileVenturesOpen, setMobileVenturesOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape and restore focus to the toggle
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);
  const toggleMobileVentures = useCallback(() => setMobileVenturesOpen((v) => !v), []);

  const pathname = useLocation({ select: (l) => l.pathname });
  const venturesActive = pathname === "/ventures" || pathname.startsWith("/ventures/") || pathname === "/projects";

  return (
    <>
      {/* Corporate topbar — desktop only. Scrolls away naturally while the
          sticky glass navbar below stays pinned. */}
      <div className="hidden bg-primary text-primary-foreground lg:block">
        <div className="container-tight flex h-9 items-center justify-between gap-4 text-[12px] font-medium">
          <div className="flex min-w-0 items-center gap-5">
            <a
              href={`mailto:${COMPANY_CONTACT.email}`}
              className="inline-flex items-center gap-1.5 opacity-90 transition-opacity hover:opacity-100"
            >
              <Mail aria-hidden className="h-3.5 w-3.5" />
              <span className="truncate">{COMPANY_CONTACT.email}</span>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 opacity-90 transition-opacity hover:opacity-100"
            >
              <Phone aria-hidden className="h-3.5 w-3.5" />
              <span className="tabular-nums">WhatsApp: {COMPANY_CONTACT.phone.display}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">{t("nav.topbarFollow", "Follow us")}</span>
            <span aria-hidden className="h-3 w-px bg-primary-foreground/30" />
            <div className="flex items-center gap-1.5">
              {FOOTER_DEFAULTS.social.map((s) => {
                const Icon = TOPBAR_SOCIAL_ICONS[s.network as keyof typeof TOPBAR_SOCIAL_ICONS];
                if (!Icon) return null;
                return (
                  <a
                    key={s.network}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.network}
                    className="grid h-6 w-6 place-items-center rounded-full opacity-90 transition-all hover:scale-110 hover:bg-primary-foreground/15 hover:opacity-100"
                  >
                    <Icon aria-hidden className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <header data-on-dark className="sticky top-0 z-50 glass-nav">
      {previewing && (
        <div
          data-testid="menu-preview-banner"
          className="flex items-center justify-center gap-3 bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
        >
          <span>{t("nav.menuPreview", "Previewing unpublished menu changes")}</span>
          <button
            type="button"
            onClick={() => clearMenuPreview()}
            className="rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-[11px] font-semibold"
          >
            {t("nav.exitPreview", "Exit preview")}
          </button>
        </div>
      )}
      <div className="relative mx-auto grid h-16 w-full max-w-[1320px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group relative flex min-w-0 shrink-0 items-center"
          aria-label={t("nav.homeAria")}
        >
          <span className="logo-halo pointer-events-none absolute inset-0 -z-10 rounded-2xl" aria-hidden />
          <span className="logo-plate" role="img" aria-label={t("nav.homeAria")}>
            <img
              src={logo}
              srcSet={`${logo} 1x, ${logo} 2x, ${logo} 3x`}
              alt="YESS Bangla — Enterprise Solutions, Media & Technology"
              width={279}
              height={153}
              decoding="async"
              fetchPriority="high"
              data-surface="header"
              style={{ imageRendering: "auto" }}
              className="logo-mark h-8 w-auto max-w-[44vw] bg-transparent object-contain transition-transform duration-300 group-hover:scale-[1.04] [@media(min-width:380px)]:h-9 sm:h-10 lg:h-11 [@media(min-width:1440px)]:h-12"
            />
          </span>
          {/* Brand name + tagline beside the logo (reference: yessbd.com navbar) */}
          <span className="ml-3 hidden min-w-0 flex-col justify-center whitespace-nowrap leading-tight min-[1440px]:flex">
            <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
              {t("nav.brandName", "Yess Bangla Private Limited")}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("nav.brandTagline", "Where Solution Begins")}
            </span>
          </span>
        </Link>

        <nav
          className="hidden min-w-0 max-w-full items-center gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex lg:justify-self-center"
          aria-label="Main"
          data-testid="header-nav-desktop"
        >
          {navNodes.map((item) => {
            const kids = item.children ?? [];
            const isVenturesMega = item.href === "/ventures" && kids.length === 0;
            const app = menuItemAppearance(item.item_style, item.accent);

            if (isVenturesMega) {
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setOpenId(item.id)}
                  onMouseLeave={() => setOpenId((v) => (v === item.id ? null : v))}
                >
                  <Link
                    to="/ventures"
                    aria-haspopup="true"
                    aria-expanded={openId === item.id}
                    onFocus={() => setOpenId(item.id)}
                    className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground ${venturesActive ? "text-primary bg-secondary" : "text-foreground/80"}`}
                  >
                    {label(item, bn)} <ChevronDown className="h-3.5 w-3.5" />
                  </Link>
                  {openId === item.id && (
                    <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
                      <div className="glass-strong w-[640px] rounded-2xl border border-glass-border p-3 shadow-elegant">
                        <div className="grid grid-cols-2 gap-1">
                          {activeVentures(ventures).map((v) => {
                            const Icon = v.icon;
                            return (
                              <Link
                                key={v.slug}
                                to="/ventures/$slug"
                                params={{ slug: v.slug }}
                                preload="intent"
                                onClick={() => setOpenId(null)}
                                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-secondary"
                              >
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${v.color} text-primary-foreground`}>
                                  <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold">{v.title}</span>
                                  <span className="block text-xs text-muted-foreground truncate">{v.category}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                        <Link
                          to="/projects"
                          onClick={() => setOpenId(null)}
                          className="mt-2 block rounded-xl bg-secondary px-4 py-2.5 text-center text-sm font-semibold text-primary"
                        >
                          {t("nav.viewAllVentures")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (kids.length) {
              const opened = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setOpenId(item.id)}
                  onMouseLeave={() => setOpenId((v) => (v === item.id ? null : v))}
                >
                  <Link
                    to={item.href}
                    aria-haspopup="true"
                    aria-expanded={opened}
                    onFocus={() => setOpenId(item.id)}
                    className={`${app.className} hover:bg-secondary hover:text-foreground ${item.accent && item.accent !== "default" ? "" : "text-foreground/80"}`}
                    style={app.style}
                    activeProps={{ className: "text-primary bg-secondary" }}
                  >
                    <MenuIcon name={item.icon} className="h-4 w-4" />
                    {label(item, bn)}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Link>
                  {opened && (
                    <div className="absolute left-0 top-full z-50 pt-2">
                      <ul className="glass-strong min-w-[260px] rounded-2xl border border-glass-border p-2 shadow-elegant">
                        {kids.map((c) => (
                          <li key={c.id} className="relative">
                            <Link
                              to={c.href}
                              preload="intent"
                              onClick={() => setOpenId(null)}
                              className="flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-secondary"
                            >
                              <MenuIcon name={c.icon} className="mt-0.5 h-4 w-4" />
                              <span className="min-w-0">
                                <span className="block font-medium">{label(c, bn)}</span>
                                {(bn && c.description_bn) || c.description ? (
                                  <span className="block text-xs text-muted-foreground">
                                    {(bn && c.description_bn) || c.description}
                                  </span>
                                ) : null}
                              </span>
                            </Link>
                            {c.children.length > 0 && (
                              <ul className="ml-6 border-l border-border pl-2">
                                {c.children.map((g) => (
                                  <li key={g.id}>
                                    <Link
                                      to={g.href}
                                      preload="intent"
                                      onClick={() => setOpenId(null)}
                                      className="block rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    >
                                      {label(g, bn)}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.href}
                className={`${app.className} hover:bg-secondary hover:text-foreground ${item.accent && item.accent !== "default" ? "" : "text-foreground/80"}`}
                style={app.style}
                activeProps={{ className: "text-primary bg-secondary" }}
                activeOptions={item.href === "/" ? { exact: true } : undefined}
              >
                <MenuIcon name={item.icon} className="h-4 w-4" />
                {label(item, bn)}
                {badgeOf(item, bn) ? (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {badgeOf(item, bn)}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>


        {/* Right cluster — language + CTA on desktop, compact toggle + hamburger on mobile. */}
        <div className="flex shrink-0 items-center gap-2 justify-self-end">
          <div className="hidden shrink-0 sm:inline-flex">
            <LanguageSwitch variant="pill" />
          </div>
          <div className="shrink-0 sm:hidden">
            <LanguageSwitch variant="compact" />
          </div>
          {/* Theme tri-switch (Light / Dark / System) — visible on both mobile top bar and desktop menubar */}
          <div className="shrink-0">
            <ThemePreviewSwitch />
          </div>
          <div className="hidden shrink-0 xl:block">
            <Link
              to="/contact"
              className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:scale-[1.03] hover:shadow-md"
            >
              {t("nav.letsTalk")}
            </Link>
          </div>

          <button
            ref={toggleBtnRef}
            type="button"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            aria-haspopup="menu"
            onClick={toggleMenu}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-background/60 backdrop-blur sm:hidden overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={open ? "x" : "menu"}
              initial={reduceMotion ? { opacity: 0 } : { rotate: -90, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { rotate: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { rotate: 90, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
              className="absolute inset-0 grid place-items-center"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <MobilePanel
              onClose={closeMenu}
              mobileVenturesOpen={mobileVenturesOpen}
              toggleMobileVentures={toggleMobileVentures}
              reduceMotion={reduceMotion}
              venturesActive={venturesActive}
              tree={tree}
              bn={bn}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Tablet/mobile: desktop-parity scrollable nav rail with tap dropdowns. */}
      <HeaderNavRail tree={navNodes} bn={bn} />
      </header>
    </>
  );
}
