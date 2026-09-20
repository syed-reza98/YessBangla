"use client";

import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { getIndustry, industries } from "@/data/industries";
import { useIndustry } from "@/lib/dynamicContent";

export function IndustryDetailPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const i = useIndustry(slug) ?? getIndustry(slug);
  if (!i) return null;
  const Icon = i.icon;

  return (
    <>
      <PageHero eyebrow={t("pages.industryDetail.eyebrow")} title={i.title} subtitle={i.intro}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">Talk to a sector specialist <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/industries" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold">← All industries</Link>
        </div>
      </PageHero>

      {/* Key metrics */}
      <section className="pb-12">
        <div className="container-tight grid grid-cols-2 gap-4 md:grid-cols-4">
          {i.keyMetrics.map((m) => (
            <div key={m.label} className="rounded-2xl glass-card p-6 text-center">
              <div className="font-display text-3xl font-bold text-primary">{m.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Challenges + Solutions */}
      <section className="py-12">
        <div className="container-tight grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl glass-card p-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Common challenges</h2>
            <ul className="mt-5 space-y-2.5">
              {i.challenges.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow">
            <h2 className="font-display text-2xl font-bold">How we help</h2>
            <div className="mt-6 space-y-5">
              {i.solutions.map((sol) => (
                <div key={sol.title}>
                  <h3 className="font-display font-semibold">{sol.title}</h3>
                  <p className="mt-1 text-sm text-primary-foreground/85">{sol.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case highlights */}
      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold">Recent results</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {i.caseHighlights.map((c) => (
              <div key={c.title} className="rounded-2xl glass-card p-6">
                <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-12">
        <div className="container-tight rounded-3xl border border-border bg-secondary/15 p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="font-display text-xl font-bold">Compliance & standards</h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {i.compliance.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />{c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="container-tight max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Frequently asked</h2>
          <div className="mt-8 space-y-3">
            {i.faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-secondary/15 p-5">
                <summary className="cursor-pointer list-none font-display font-semibold">{f.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related industries */}
      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-2xl font-bold">Other industries we serve</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industries.filter((x) => x.slug !== i.slug).slice(0, 4).map((o) => {
              const OIcon = o.icon;
              return (
                <Link key={o.slug} to="/industries/$slug" params={{ slug: o.slug }} className="group rounded-2xl glass-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><OIcon className="h-5 w-5" /></div>
                  <h3 className="mt-3 font-display font-semibold">{o.title}</h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">Learn more <ArrowRight className="h-3.5 w-3.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold">Build for {i.title}</h2>
                <p className="mt-3 text-primary-foreground/85">Tell us about your goals — we'll connect you with a sector specialist within one business day.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source={`Industry: ${i.title}`} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
