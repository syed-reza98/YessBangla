import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useOffscreenPause } from "@/hooks/useOffscreenPause";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-business.jpg";
import aboutImg from "@/assets/about-team-bd.jpg";
import servicesImg from "@/assets/services-tech-bd.jpg";
import venturesImg from "@/assets/ventures-dhaka-bd.jpg";
import trustImg from "@/assets/trust-handshake-bd.jpg";
import contactImg from "@/assets/contact-welcome-bd.jpg";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { HeroOverlays } from "@/components/HeroOverlays";

import { CountUp, CountUpSkeleton } from "@/components/CountUp";
import { SectionHeader, SectionDivider } from "@/components/SectionHeader";
import { usePageOverride } from "@/lib/sitePages";
import { useVentures } from "@/lib/dynamicContent";
import { resolveCoinLogo } from "@/lib/coinLogo";
import { toImageSrc } from "@/lib/mediaAssets";
import type { Venture } from "@/data/ventures";
import { activeVentures, upcomingVentures } from "@/data/ventures";
import {
  ArrowRight,
  ArrowUpRight,
  Tv,
  Newspaper,
  LayoutGrid,
  Code2,
  Palette,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  Search,
  Lightbulb,
  Rocket,
  LineChart,
  Quote,
  Star,
  Tv2,
  Globe,
  Smartphone,
  Megaphone,
  GraduationCap,
  Briefcase,
  Building2,
  HeartHandshake,
  Download,
  FileText,
  Mail,
  Layers,
  Phone,
  
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
} from "lucide-react";
import { COMPANY_CONTACT, phoneHref } from "@/lib/companyContact";
import { FOOTER_DEFAULTS } from "@/lib/footerConfig";

/** Floating social rail icon map — mirrors the footer network list. */
const SOCIAL_ICONS = {
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
} as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YESS Bangla — Business Consulting & IT Solutions" },
      { name: "description", content: "International-grade business consulting, IT, OTT, e-commerce and web solutions in Bangladesh." },
      { property: "og:title", content: "YESS Bangla — Business Consulting & IT Solutions" },
      { property: "og:description", content: "We help businesses across Bangladesh reach the next level." },
    ],
  }),
  component: Index,
});

const serviceIcons = [Tv, Newspaper, LayoutGrid, Code2, Palette, ShoppingBag];
const featureIcons = [ShieldCheck, Sparkles, Users, TrendingUp];
const processIcons = [Search, Lightbulb, Rocket, LineChart];

const clients = ["Akash TV", "Akash News", "Akash OTT", "One Stop", "Yess Shop", "Bangla Media", "BD Logistics", "EduConnect"];

type ImpactMetric = {
  id: string;
  icon: typeof Briefcase;
  /** Raw numeric target — drives the counter. */
  target: number;
  format?: import("@/components/CountUp").CountFormat;
};

const impactMetrics: ImpactMetric[] = [
  { id: "projects",  icon: Briefcase,      target: 250,    format: { plus: true } },
  { id: "users",     icon: Users,          target: 180000, format: { compact: true, plus: true } },
  { id: "clients",   icon: Building2,      target: 120,    format: { plus: true } },
  { id: "districts", icon: Globe,          target: 64 },
  { id: "years",     icon: Award,          target: 11,     format: { plus: true } },
  { id: "retention", icon: HeartHandshake, target: 98,     format: { percent: true } },
];

type LocalizedItem = { title: string; desc: string };
type Testimonial = { name: string; role: string; quote: string };

/** Ventures featured in the hero coin row (matches the yessbd.com brand line-up). */
const HERO_VENTURE_SLUGS = ["yess-soft", "yess-service", "yess-organic-haat", "akash-ott"];

/** Coin emblem — auto-resolves the venture logo: explicit logoUrl → live
    domain favicon → engraved Lucide icon. A failed favicon image falls back
    to the icon so the coin never renders blank. */
function HeroCoinMark({ venture }: { venture: Venture }) {
  const Icon = venture.icon;
  const src = resolveCoinLogo(venture);
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-11 w-11 rounded-full object-contain sm:h-12 sm:w-12"
      />
    );
  }
  return <Icon aria-hidden="true" className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />;
}

function Index() {
  const ventures = useVentures();
  // Live ventures only — upcoming projects are listed separately below.
  const live = activeVentures(ventures);
  const upcoming = upcomingVentures(ventures);
  // Featured hero cards: preferred brands first, then fill from the rest.
  const heroVentures = [
    ...HERO_VENTURE_SLUGS.map((s) => live.find((v) => v.slug === s)).filter((v) => v != null),
    ...live.filter((v) => !HERO_VENTURE_SLUGS.includes(v.slug)),
  ].slice(0, 4);
  const cmsHome = usePageOverride("home");
  const { t, i18n: i18nInst } = useTranslation();
  const isBn = (i18nInst?.language || i18n.language || "en").startsWith("bn");
  const [hydrated, setHydrated] = useState(false);
  // Pause water-ripple shimmer when the headline scrolls offscreen
  const headlineRef = useOffscreenPause<HTMLHeadingElement>();
  useEffect(() => {
    setHydrated(true);
  }, []);
  return (
    <>
      {/* HERO — international editorial, full-bleed cinematic */}
      <section
        className="hero-section relative isolate grid overflow-hidden bg-foreground text-background"
        style={{ minHeight: "clamp(192px, 27vh, 294px)" }}
      >
        {/* Background image */}
        <img
          src={toImageSrc(heroImg)}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1200}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center sm:object-[60%_center]"
          style={{ filter: "grayscale(0.85) brightness(1.05) contrast(0.92)" }}
        />
        {/* Overlay stack — tokens in styles.css, parallax + auto-contrast */}
        <HeroOverlays imageSrc={heroImg} />

        <div
          className="hero-dossier container-tight relative grid lg:grid-cols-12 lg:items-center"
          style={{
            rowGap: "var(--hero-rhythm-md)",
            columnGap: "var(--hero-rhythm-lg)",
            paddingTop: "var(--hero-rhythm-lg)",
            paddingBottom: "var(--hero-rhythm-lg)",
          }}
        >
          {/* LEFT — Headline column */}
          <div className="lg:col-span-7 xl:col-span-7">

            {/* Section label — international editorial eyebrow */}
            <div
              className="hero-fade flex items-center gap-2.5 sm:gap-3 text-[10px] sm:text-[11px] font-semibold uppercase text-background/65"
              style={{
                animationDelay: "40ms",
                marginTop: "var(--hero-rhythm-xs)",
                letterSpacing: isBn ? "0" : "0.32em",
                wordSpacing: "normal",
              }}
            >
              <span aria-hidden className="h-px w-6 sm:w-8 bg-background/45" />
              <span>{cmsHome.eyebrow ?? t("home.hero.eyebrow")}</span>
              <span aria-hidden className="hidden sm:inline h-px w-8 bg-background/45" />
            </div>

            {/* Headline — three-line editorial cadence with water shimmer.
                Typography contract (see scripts/check-hero-typography.mjs):
                  • fontSize: clamp(rem, expr, rem) — editorial ceiling 3.5rem
                  • lineHeight: unitless clamp — tighter as size grows
                  • letterSpacing: em-only — script-safe (Latin/Bangla/RTL)
                  • wordSpacing: normal — international parity */}
            <h1
              ref={headlineRef}
              data-testid="hero-headline"
              className="hero-fade max-w-[18ch] sm:max-w-none font-display font-semibold text-balance text-background"
              style={{
                animationDelay: "80ms",
                marginTop: "var(--hero-rhythm-md)",
                fontSize: "clamp(1.625rem, 0.7rem + 2.8vw, 3.5rem)",
                lineHeight: "clamp(1.06, 1.3 - 0.06vw, 1.2)",
                letterSpacing: "-0.028em",
                wordSpacing: "normal",
              }}
            >
              {/* Editorial three-line cadence — YESS acronym expanded:
                  Y outh E ntrepreneurship · S mart S uccess · with our
                  Excellence & Solutions. Overridden wholesale when an editor
                  sets a hero title in the dashboard. */}
              {cmsHome.title ? (
                <span className="water-text block">{cmsHome.title}</span>
              ) : (
                <>
                  <span className="water-text block whitespace-nowrap">{t("home.hero.h1Line1")}</span>
                  <span
                    className="block text-gradient-hero"
                    style={{ marginTop: "0.06em", letterSpacing: "-0.018em" }}
                  >
                    {t("home.hero.h1Line2Pre")}{" "}
                    <span
                      className="font-light text-background/90"
                      style={{ letterSpacing: "-0.008em" }}
                    >
                      {t("home.hero.h1Line2Smart")}
                    </span>
                  </span>
                  <span
                    className="block text-background/95"
                    style={{ marginTop: "0.06em", letterSpacing: "-0.024em" }}
                  >
                    {t("home.hero.h1Line3Pre")}{" "}
                    <span className="sm:whitespace-nowrap">{t("home.hero.h1Line3Tail")}</span>
                  </span>
                </>
              )}
            </h1>

            {/* Lede paragraph */}
            <p
              data-testid="hero-lede"
              className="hero-fade max-w-[34ch] sm:max-w-xl lg:max-w-2xl text-background/85"
              style={{
                animationDelay: "160ms",
                marginTop: "var(--hero-rhythm-sm)",
                fontSize: "clamp(0.90625rem, 0.78rem + 0.55vw, 1.125rem)",
                lineHeight: "clamp(1.5, 1.7 - 0.02vw, 1.64)",
                letterSpacing: "-0.006em",
                wordSpacing: "normal",
              }}
            >
              {cmsHome.subtitle ?? (
                <>
                  <span className="font-medium text-background/95">{t("home.hero.ledeBrand")}</span>{" "}
                  {t("home.hero.ledeBody")}
                  <span className="md:whitespace-nowrap"> {t("home.hero.ledeStandard")}</span>
                  <span className="md:whitespace-nowrap"> {t("home.hero.ledeOrigin")}</span>
                </>
              )}
            </p>


            {/* CTA row — stacks full-width on small phones for tap-target
                clarity, settles into a flex row from sm:+ */}
            <div
              data-testid="hero-buttons"
              className="hero-fade flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center"
              style={{
                animationDelay: "220ms",
                marginTop: "var(--hero-rhythm-md)",
                gap: "var(--hero-rhythm-xs)",
              }}
              role="group"
              aria-label="Primary hero actions"
            >
              <Link
                to="/contact"
                aria-label={t("home.hero.ctaPrimaryAria")}
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-7 sm:px-8 py-3.5 sm:py-4 text-[15px] font-semibold tracking-[-0.005em] text-primary-foreground shadow-xl ring-1 ring-primary/40 transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-2xl hover:bg-primary/90 focus:outline-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent focus-visible:ring-offset-[3px] focus-visible:ring-offset-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {t("home.hero.ctaPrimary")}
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none" />
              </Link>
              <Link
                to="/services"
                aria-label={t("home.hero.ctaSecondaryAria")}
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border-2 border-background/40 bg-background/5 px-7 sm:px-8 py-3.5 sm:py-4 text-[15px] font-semibold tracking-[-0.005em] text-background backdrop-blur transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-background/60 hover:bg-background/10 focus:outline-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-background focus-visible:ring-offset-[3px] focus-visible:ring-offset-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {t("home.hero.ctaSecondary")}
                <ArrowRight aria-hidden="true" className="h-4 w-4 opacity-80 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none" />
              </Link>
            </div>

            {/* Trust signals — divider + caps label for editorial weight */}
            <div data-testid="hero-trust-area">
              <div
                data-testid="hero-trust-row"
                className="hero-fade flex items-center"
                style={{
                  animationDelay: "320ms",
                  marginTop: "var(--hero-rhythm-md)",
                  gap: "var(--hero-rhythm-xs)",
                }}
              >
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.3em] text-background/75 sm:inline">
                  {t("home.hero.whyTeams")}
                </span>
                <span
                  data-testid="hero-trust-divider"
                  className="hidden h-px flex-1 bg-background/15 sm:block"
                />
              </div>
              {/* Phones: spec-sheet data footer (label / value pairs) */}
              <dl
                className="dossier-specs hero-fade sm:hidden"
                style={{ animationDelay: "360ms", marginTop: "var(--hero-rhythm-sm)" }}
              >
                <div>
                  <dt>Standards</dt>
                  <dd>{t("home.hero.trustIso")}</dd>
                </div>
                <div>
                  <dt>Experience</dt>
                  <dd>{t("home.hero.trustYears")}</dd>
                </div>
                <div>
                  <dt>Retention</dt>
                  <dd>{t("home.hero.trustRetention")}</dd>
                </div>
              </dl>
              <div
                data-testid="hero-trust-list"
                className="hero-fade hidden flex-wrap items-center text-[11px] sm:flex sm:text-xs text-background/85"
                style={{
                  animationDelay: "360ms",
                  marginTop: "var(--hero-rhythm-xs)",
                  columnGap: "var(--hero-rhythm-sm)",
                  rowGap: "var(--hero-rhythm-xs)",
                }}
              >
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> {t("home.hero.trustIso")}</span>
                <span className="inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-accent" /> {t("home.hero.trustYears")}</span>
                <span className="inline-flex items-center gap-1.5"><HeartHandshake className="h-3.5 w-3.5 text-accent" /> {t("home.hero.trustRetention")}</span>
              </div>

            </div>
          </div>

          {/* RIGHT — Venture brand cards in a 2×2 grid (reference: yessbd.com hero).
              Corporate index treatment: labelled grid header + uniform card anatomy
              (category chip over image, divider, title + arrow affordance, tagline). */}
          <div className="relative lg:col-span-5 xl:col-span-5">
            <div
              className="hero-fade ml-auto max-w-md"
              style={{ animationDelay: "240ms" }}
            >
              {/* Grid header — corporate index label + view-all affordance */}
              <div className="mb-3 flex items-end justify-between gap-3 border-b border-background/15 pb-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-background/70">
                  {t("home.hero.venturesKicker")}
                </p>
                <Link
                  to="/ventures"
                  className="group inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-background/85 transition-colors hover:text-background"
                >
                  {t("home.hero.viewAll")}
                  <ArrowRight aria-hidden="true" className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </div>
              {/* Coin row — minted venture coins floating on a calm water
                  surface. Even coins sit a step higher (gentle wave arc) so the
                  row reads as a composed editorial element, not a rigid strip;
                  each coin bobs slowly with a staggered phase and casts a soft
                  water reflection beneath. All animation is transform-only and
                  disabled under prefers-reduced-motion. */}
              <div className="coin-plate coin-row grid grid-cols-2 sm:grid-cols-4" style={{ gap: "clamp(18px, 5vw, 26px)" }}>
                {heroVentures.map((v, i) => {
                  return (
                    <Link
                      key={v.slug}
                      to="/ventures/$slug"
                      params={{ slug: v.slug }}
                      preload="intent"
                      className="coin-slot group flex flex-col items-center text-center motion-reduce:transition-none"
                      style={{ "--coin-i": i } as React.CSSProperties}
                      aria-label={`${v.title} — ${v.tagline}`}
                    >
                      {/* Floating assembly — bob + reflection stay in sync */}
                      <span className="coin-float relative">
                        {/* Minted coin face — auto-set venture logo in the middle */}
                        <span className="hero-coin grid aspect-square w-full max-w-[96px] place-items-center overflow-hidden sm:max-w-[96px] lg:max-w-[104px]">
                          <span
                            aria-hidden="true"
                            className={`absolute inset-[12%] rounded-full bg-gradient-to-br ${v.color} opacity-15`}
                          />
                          <span className="coin-engrave relative z-[1] grid place-items-center">
                            <HeroCoinMark venture={v} />
                          </span>
                          {/* Light gliding across the water-polished face */}
                          <span aria-hidden="true" className="coin-sheen" />
                        </span>
                        {/* Soft water reflection pooled under the coin */}
                        <span aria-hidden="true" className="coin-pool" />
                      </span>
                      {/* Named link under the coin */}
                      <span className="mt-3 flex w-full min-w-0 items-center justify-center gap-1 px-1 text-[9.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-background/85 transition-colors duration-300 group-hover:text-background sm:text-[11px] sm:normal-case sm:tracking-normal">
                        <span className="line-clamp-2">{v.title}</span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0 opacity-0 transition-[opacity,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none"
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* QUICK CTA STRIP — translated chrome + clearly labelled bilingual download cards.
          On mobile we keep EN and BN side-by-side (2 cols) so visitors can compare
          the editions on a single screen without scrolling. */}
      <section className="relative -mt-px border-y border-border/60 bg-gradient-to-br from-primary/8 via-background to-accent/8">
        <div className="container-tight py-12 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr] lg:items-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t("home.ctaStrip.kicker")}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("home.ctaStrip.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("home.ctaStrip.subtitle")}
              </p>
              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                  {t("home.ctaStrip.venturesKicker")}
                </p>
                {/* Compact ventures showcase — small thumbnails sized to area, with one-line summary.
                    Replaces the previous theme-preview switch in this CTA block. */}
                <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {live.slice(0, 6).map((v) => (
                    <li key={v.slug}>
                      <Link
                        to="/ventures/$slug"
                        params={{ slug: v.slug }}
                        preload="intent"
                        className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-2 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                      >
                        <span className="block aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                          <img
                            src={toImageSrc(v.image)}
                            alt={v.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        </span>
                        <span className="min-w-0 px-0.5 pb-1">
                          <span className="block truncate text-[12px] font-semibold text-foreground">{v.title}</span>
                          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{v.tagline}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <div>
              {/* Section label above the bilingual download pair */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 sm:hidden">
                {t("home.downloadCards.compareLabel")}
              </p>

              {/* Top row: generic CTAs — stay full width on mobile (1 col) */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                <Link
                  to="/contact"
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                      <Mail className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <div className="mt-6">
                    <div className="font-display text-base font-semibold">{t("home.ctaStrip.contactTitle")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t("home.ctaStrip.contactDesc")}</div>
                  </div>
                </Link>

                <Link
                  to="/services"
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-accent text-accent-foreground shadow-glow">
                      <Layers className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <div className="mt-6">
                    <div className="font-display text-base font-semibold">{t("home.ctaStrip.servicesTitle")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t("home.ctaStrip.servicesDesc")}</div>
                  </div>
                </Link>
              </div>

              {/* Bilingual download row — KEEP 2 columns even on mobile so EN/BN
                  cards sit side-by-side for instant comparison. Larger flag
                  badges and a clear "Choose your edition" label on mobile help
                  visitors scan the language at a glance. */}
              <p className="mt-5 hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80 sm:mb-3 sm:block">
                {t("home.downloadCards.compareLabel")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-0">
                <a
                  href="/yess-bangla-company-profile.pdf"
                  download="yess-bangla-company-profile.pdf"
                  aria-label={t("home.downloadCards.english.ariaButton")}
                  lang="en"
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#7a9ce0]/25 via-[#5b7fd1]/15 to-[#3b5ea8]/10 p-4 text-left text-foreground shadow-[0_8px_32px_-12px_rgba(59,94,168,0.35)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/30 hover:from-[#7a9ce0]/35 hover:via-[#5b7fd1]/20 hover:to-[#3b5ea8]/15 hover:shadow-[0_16px_40px_-12px_rgba(59,94,168,0.5)] sm:p-5"
                >
                  {/* Decorative gradient orb for premium feel */}
                  <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/30 to-[#7a9ce0]/0 blur-2xl" />
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  {/* Prominent flag + lang badge — sized larger on mobile */}
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-white/80 to-white/40 text-[#3b5ea8] shadow-sm ring-1 ring-white/50 sm:h-10 sm:w-10">
                      <Download className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#7a9ce0]/40 bg-background/70 text-[#3b5ea8] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] shadow-sm backdrop-blur sm:px-2.5 sm:text-[12px]">
                      <span aria-hidden="true" className="text-base leading-none">🇬🇧</span> EN
                    </span>
                  </div>
                  <div className="relative mt-5 sm:mt-6">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3b5ea8]/80">
                      {t("home.downloadCards.english.kicker")}
                    </div>
                    <div className="mt-1 font-display text-[13px] font-semibold leading-snug bg-gradient-to-r from-[#1e3a7a] to-[#3b5ea8] bg-clip-text text-transparent sm:text-base">
                      {t("home.downloadCards.english.title")}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                      {t("home.downloadCards.english.meta")}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/40 bg-gradient-to-r from-white/70 to-white/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#3b5ea8] shadow-sm sm:mt-3 sm:text-[10px]">
                      <Download className="h-3 w-3" aria-hidden="true" /> {t("home.downloadCards.english.lock")}
                    </div>
                  </div>
                </a>

                <a
                  href="/yess-bangla-company-profile-bn.pdf"
                  download="yess-bangla-company-profile-bn.pdf"
                  aria-label={t("home.downloadCards.bangla.ariaButton")}
                  lang="bn"
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/[0.10] via-background to-accent/[0.10] p-4 text-left transition-all hover:-translate-y-1 hover:border-primary/80 hover:shadow-xl sm:p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow sm:h-10 sm:w-10">
                      <Download className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] shadow-sm sm:px-2.5 sm:text-[12px]">
                      <span aria-hidden="true" className="text-base leading-none">🇧🇩</span> BN
                    </span>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                      {t("home.downloadCards.bangla.kicker")}
                    </div>
                    <div className="mt-1 font-display text-[13px] font-semibold leading-snug sm:text-base">
                      {t("home.downloadCards.bangla.title")}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                      {t("home.downloadCards.bangla.meta")}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary sm:mt-3 sm:text-[10px]">
                      <Download className="h-3 w-3" aria-hidden="true" /> {t("home.downloadCards.bangla.lock")}
                    </div>
                  </div>
                </a>
              </div>

              {/* Editable Word (.docx) twins of both editions — for partners who
                  need to adjust wording before print. */}
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {t("home.downloadCards.docxLabel")}
                </span>
                <a
                  href="/yess-bangla-company-profile.docx"
                  download="yess-bangla-company-profile.docx"
                  aria-label={`${t("home.downloadCards.docxEnglish")} — company profile`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                >
                  <FileText className="h-3 w-3" aria-hidden="true" /> {t("home.downloadCards.docxEnglish")}
                </a>
                <a
                  href="/yess-bangla-company-profile-bn.docx"
                  download="yess-bangla-company-profile-bn.docx"
                  aria-label={`${t("home.downloadCards.docxBangla")} — কোম্পানি প্রফাইল`}
                  lang="bn"
                  className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition-all hover:-translate-y-0.5 hover:border-primary/70"
                >
                  <FileText className="h-3 w-3" aria-hidden="true" /> {t("home.downloadCards.docxBangla")}
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CLIENTS — early trust signal, animated marquee
          Surfaces social proof immediately after CTA so visitors see who
          trusts us before any pitch. Reduced vertical padding keeps it
          feeling like a thin trust ribbon, not a full section. */}
      <section className="py-8 sm:py-10">
        <div className="container-tight">
          <Reveal>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
              {t("home.clients.trustedBy")}
            </p>
          </Reveal>
          <div className="marquee-mask mt-5 overflow-hidden sm:mt-6">
            <div className="marquee gap-10 pr-10 sm:gap-12 sm:pr-12">
              {[...clients, ...clients].map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="shrink-0 font-display text-[15px] font-semibold tracking-tight text-muted-foreground/65 transition-colors hover:text-primary sm:text-base lg:text-lg"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ABOUT STRIP — who we are */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
          <Reveal className="lg:col-span-5">
            <div className="relative mx-auto max-w-xs sm:max-w-sm lg:max-w-none">
              <div aria-hidden className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-primary/15 to-accent/15 blur-2xl sm:-inset-4 sm:rounded-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/60 p-1 shadow-xl backdrop-blur sm:rounded-3xl sm:p-1.5">
                <img
                  src={toImageSrc(aboutImg)}
                  alt={t("home.about.imageAlt")}
                  width={1280}
                  height={960}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[4/3] w-full rounded-xl object-cover sm:rounded-[1.35rem]"
                />
                {/* Glass stat chip — mirrors the reference "Completed Projects" overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-2xl border border-border/50 bg-background/85 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-5 sm:left-5">
                  <div className="font-display text-2xl font-semibold tabular-nums text-primary">
                    {hydrated ? <CountUp target={250} format={{ plus: true } as const} /> : <CountUpSkeleton />}
                  </div>
                  <div className="max-w-[10ch] text-[11px] font-medium leading-tight text-foreground/80">
                    {t("home.hero.kpi.projects")}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7">
            <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              <span aria-hidden className="h-px w-6 bg-primary/40" />
              {t("home.about.eyebrow")}
            </div>
            <h2 className="mt-3 font-display font-semibold tracking-tight text-balance">
              {t("home.about.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("home.about.lede")}
            </p>

            <Stagger className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4">
              {(t("home.about.features", { returnObjects: true }) as LocalizedItem[]).map((f, i) => {
                const Icon = featureIcons[i];
                return (
                  <StaggerItem key={f.title}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="glass-card h-full rounded-2xl p-4 sm:p-5"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 font-display text-[15px] font-semibold sm:mt-4 sm:text-base">{f.title}</h3>
                      <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">{f.desc}</p>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </Stagger>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary/90"
              >
                {t("home.about.readMore")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/ventures"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 px-6 py-3 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5"
              >
                {t("home.about.viewPortfolio", "View portfolio")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* SERVICES — what we offer */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight">
          <SectionHeader
            eyebrow={t("home.servicesSection.eyebrow")}
            title={t("home.servicesSection.title")}
            lede={t("home.servicesSection.lede")}
          />

          <Reveal className="mt-8 sm:mt-12">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-border/60 shadow-xl sm:max-w-none sm:rounded-3xl">
              <img
                src={toImageSrc(servicesImg)}
                alt={t("home.servicesSection.imageAlt")}
                width={1280}
                height={960}
                loading="lazy"
                decoding="async"
                className="block aspect-[4/3] w-full object-cover sm:aspect-[21/6]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
                <p className="max-w-xl text-xs font-medium text-foreground sm:text-base">
                  {t("home.servicesSection.imageCaption")}
                </p>
              </div>
            </div>
          </Reveal>

          <Stagger className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(t("home.servicesSection.items", { returnObjects: true }) as LocalizedItem[]).map((s, i) => {
              const Icon = serviceIcons[i];
              return (
                <StaggerItem key={s.title}>
                  <motion.article
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    className="group relative h-full overflow-hidden rounded-2xl glass-card p-5 sm:p-7"
                  >
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/8 transition-transform group-hover:scale-125" />
                    <div className="relative">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-semibold sm:mt-5 sm:text-xl">{s.title}</h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">{s.desc}</p>
                      <Link
                        to="/services"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5 sm:mt-5"
                      >
                        {t("home.servicesSection.learnMore")} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.article>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <SectionDivider />

      {/* IMPACT & METRICS — proof, placed right after capability pitch */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight">
          <SectionHeader
            eyebrow={t("home.impact.eyebrow")}
            title={t("home.impact.title")}
            lede={t("home.impact.lede")}
          />

          <Stagger className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {impactMetrics.map((m) => (
              <StaggerItem key={m.id}>
                <div className="relative h-full rounded-2xl glass-card p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-accent text-accent-foreground shadow-accent">
                      <m.icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      {/* Fixed-height numeric slot prevents layout shift between skeleton ↔ counter */}
                      <div className="flex h-9 items-baseline font-display text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                        {hydrated ? (
                          <CountUp target={m.target} format={m.format} />
                        ) : (
                          <CountUpSkeleton />
                        )}
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground/80">{t(`home.impact.items.${m.id}.label`)}</div>
                    </div>
                  </div>
                  <p className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">{t(`home.impact.items.${m.id}.note`)}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <SectionDivider />

      {/* PROCESS — how we work, before showcasing breadth */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight">
          <SectionHeader
            eyebrow={t("home.process.eyebrow")}
            title={t("home.process.title")}
            lede={t("home.process.lede")}
          />
          <Stagger className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(t("home.process.items", { returnObjects: true }) as LocalizedItem[]).map((p, i) => {
              const Icon = processIcons[i];
              return (
                <StaggerItem key={p.title}>
                  <div className="relative h-full rounded-2xl glass-card p-5 sm:p-6">
                    <div className="absolute right-5 top-5 font-display text-4xl font-semibold text-primary/10">0{i + 1}</div>
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1.5 text-[13px] text-muted-foreground sm:text-sm">{p.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      <SectionDivider />

      {/* VENTURES SHOWCASE — 11 ventures, breadth of ecosystem */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight">
          <SectionHeader
            eyebrow={t("home.venturesSection.eyebrow")}
            title={t("home.venturesSection.title")}
            lede={t("home.venturesSection.lede")}
          />

          <Reveal className="mt-8 sm:mt-12">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-border/60 shadow-xl sm:max-w-none sm:rounded-3xl">
              <img
                src={toImageSrc(venturesImg)}
                alt={t("home.venturesSection.imageAlt")}
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
                className="block aspect-[4/3] w-full object-cover sm:aspect-[16/5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent sm:bg-gradient-to-r sm:from-background/85 sm:via-background/40 sm:to-transparent" />
              <div className="absolute inset-0 flex items-end p-4 sm:items-center sm:p-10">
                <div className="max-w-md">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">{t("home.venturesSection.ribbonKicker")}</p>
                  <p className="mt-1.5 font-display text-base font-semibold leading-tight sm:mt-2 sm:text-2xl">
                    {t("home.venturesSection.ribbonTitle")}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Stagger className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((v) => {
              return (
                <StaggerItem key={v.slug}>
                  <Link
                    to="/ventures/$slug"
                    params={{ slug: v.slug }}
                    aria-label={`${t("home.venturesSection.readAbout")} ${v.title}`}
                    className="group relative block h-full w-full overflow-hidden rounded-2xl glass-card text-left transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="block aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={toImageSrc(v.image)}
                        alt={v.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </span>
                    <span className="relative block p-5 sm:p-6">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-display text-base font-semibold leading-tight sm:text-lg">{v.title}</span>
                        <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {v.category.split(" ")[0]}
                        </span>
                      </span>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">{v.desc}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-all group-hover:gap-2.5 sm:mt-4">
                        {t("home.venturesSection.explore")} {v.title} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>

          {/* UPCOMING PROJECTS — announced, not yet live */}
          {upcoming.length > 0 && (
            <Reveal className="mt-10 sm:mt-12">
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("home.venturesSection.upcomingKicker")}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {t("home.venturesSection.upcomingBadge")}
                  </span>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2.5">
                  {upcoming.map((v) => {
                    const Icon = v.icon;
                    return (
                      <li key={v.slug}>
                        <Link
                          to="/ventures/$slug"
                          params={{ slug: v.slug }}
                          preload="intent"
                          aria-label={`${t("home.venturesSection.readAbout")} ${v.title}`}
                          className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 py-1.5 pl-1.5 pr-3.5 text-[12px] font-medium text-foreground/85 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-md"
                        >
                          <span className={`grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br ${v.color} text-primary-foreground`}>
                            <Icon className="h-3 w-3" strokeWidth={1.8} />
                          </span>
                          {v.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* TESTIMONIALS — voice of the customer */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight">
          <SectionHeader
            eyebrow={t("home.testimonials.eyebrow")}
            title={t("home.testimonials.title")}
            lede={t("home.testimonials.lede")}
          />
          <Stagger className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 md:grid-cols-3">
            {(t("home.testimonials.items", { returnObjects: true }) as Testimonial[]).map((tm) => (
              <StaggerItem key={tm.name}>
                <figure className="relative h-full rounded-2xl glass-card p-5 sm:p-7">
                  <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15" />
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <blockquote className="mt-4 text-[13px] leading-relaxed text-foreground/90 sm:text-sm">"{tm.quote}"</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary font-display text-sm font-semibold text-primary-foreground">
                      {tm.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{tm.name}</div>
                      <div className="text-xs text-muted-foreground">{tm.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 sm:py-14 lg:py-16">
        <div className="container-tight">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 md:p-16">
              <img src={toImageSrc(contactImg)} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-foreground/85" />
              <div className="relative grid gap-6 sm:gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="font-display font-semibold tracking-tight text-background">
                    {t("home.finalCta.title")}
                  </h2>
                  <p className="mt-3 text-background/80">
                    {t("home.finalCta.lede")}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                  <a
                    href={phoneHref}
                    aria-label={t("home.finalCta.callAria", { phone: COMPANY_CONTACT.phone.display })}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-background/60 px-6 py-3 text-sm font-semibold text-background backdrop-blur transition-all hover:scale-[1.03] hover:bg-background/10"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <span className="tabular-nums">{COMPANY_CONTACT.phone.display}</span>
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.03] hover:bg-primary/90"
                  >
                    {t("home.finalCta.sendMessage")}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FLOATING SOCIAL RAIL — desktop only, mirrors the reference site.
          Portalled to <body> so an ancestor's contain/transform can never
          break position:fixed. */}
      {hydrated &&
        createPortal(
          <nav
            aria-label={t("nav.topbarFollow", "Follow us")}
            className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 lg:flex"
          >
            {FOOTER_DEFAULTS.social.map((s) => {
              const Icon = SOCIAL_ICONS[s.network as keyof typeof SOCIAL_ICONS];
              if (!Icon) return null;
              return (
                <a
                  key={s.network}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.network}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-md backdrop-blur transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </a>
              );
            })}
          </nav>,
          document.body,
        )}
    </>
  );
}
