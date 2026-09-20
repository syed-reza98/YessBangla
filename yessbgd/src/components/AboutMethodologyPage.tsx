"use client";

import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { methodology } from "@/data/about";

export function AboutMethodologyPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        eyebrow={t("pages.aboutMethodology.eyebrow")}
        title={t("pages.aboutMethodology.title")}
        subtitle={t("pages.aboutMethodology.subtitle")}
      />

      <section className="py-12">
        <div className="container-tight grid gap-6 md:grid-cols-2">
          {methodology.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.n} className="relative rounded-2xl glass-card p-8">
                <span className="absolute right-5 top-5 font-mono text-sm font-bold text-primary/60">{p.n}</span>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold">{p.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-12">
        <div className="container-tight rounded-3xl border border-border bg-secondary/15 p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold">What you can expect every week</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              "A demo of working software every Friday",
              "A written status update with risks and decisions",
              "Access to a public Kanban board with all tickets",
              "Direct Slack/Teams access to the engineering lead",
              "Documented architecture decisions for major changes",
              "A monthly business review with your account director",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold">Start with a 30-minute discovery call.</h2>
                <p className="mt-3 text-primary-foreground/85">No commitment — we'll map your goals and constraints together.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="About: Methodology" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
