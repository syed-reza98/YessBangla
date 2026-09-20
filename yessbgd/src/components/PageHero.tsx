import { type ReactNode } from "react";
import { usePageOverride } from "@/lib/sitePages";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  page,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** CMS page key — lets the dashboard override the hero copy and image. */
  page?: string;
  children?: ReactNode;
}) {
  const cms = usePageOverride(page ?? "");
  const finalEyebrow = cms.eyebrow ?? eyebrow;
  const finalTitle = cms.title ?? title;
  const finalSubtitle = cms.subtitle ?? subtitle;

  return (
    <section className="relative overflow-hidden pt-10 pb-10 sm:pt-16 sm:pb-14 md:pt-28 md:pb-20">
      <div className="orb hidden sm:block h-[420px] w-[420px] -top-32 -left-24" style={{ background: "oklch(0.82 0.14 188 / 0.5)" }} />
      <div className="orb hidden sm:block h-[360px] w-[360px] -top-20 right-0" style={{ background: "oklch(0.85 0.16 28 / 0.4)", animationDelay: "-8s" }} />
      <div className="orb sm:hidden h-[260px] w-[260px] -top-20 -left-16" style={{ background: "oklch(0.82 0.14 188 / 0.45)" }} />
      <div className="container-tight relative max-w-3xl text-center">
        {finalEyebrow && (
          <p className="hero-fade text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {finalEyebrow}
          </p>
        )}
        <h1
          className="hero-fade mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          {finalTitle}
        </h1>
        {finalSubtitle && (
          <p
            className="hero-fade mt-5 text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            {finalSubtitle}
          </p>
        )}
        {cms.image && (
          <img
            src={cms.image}
            alt=""
            className="hero-fade mt-8 w-full rounded-2xl border border-border/60 object-cover shadow-sm"
            style={{ animationDelay: "180ms" }}
            loading="lazy"
          />
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
