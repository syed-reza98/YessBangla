"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { aboutPillars, getPillar } from "@/data/about";

export function AboutPillarPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const pillar = getPillar(slug);
  if (!pillar) return null;
  const Icon = pillar.icon;

  return (
    <>
      <PageHero eyebrow={t("pages.aboutPillar.eyebrow")} title={pillar.title} subtitle={pillar.short} />

      <section className="py-12">
        <div className="container-tight max-w-3xl">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Icon className="h-7 w-7" />
          </div>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{pillar.long}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold">What this means in practice</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pillar.pillars.map((p) => (
              <div key={p.title} className="rounded-2xl glass-card p-6">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sibling pillars */}
      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-2xl font-bold">More about us</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aboutPillars.filter((p) => p.slug !== pillar.slug).map((p) => {
              const PIcon = p.icon;
              return (
                <Link key={p.slug} to="/about/$pillar" params={{ pillar: p.slug }} className="group rounded-2xl glass-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><PIcon className="h-5 w-5" /></div>
                  <h3 className="mt-3 font-display font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.short}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">Read more <ArrowRight className="h-3.5 w-3.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold">Work with a team that lives these values.</h2>
                <p className="mt-3 text-primary-foreground/85">Tell us about your goals — we'll respond within one business day.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source={`About: ${pillar.title}`} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
