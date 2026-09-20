"use client";

import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { getService, services } from "@/data/services";
import { useService } from "@/lib/dynamicContent";

export function ServiceDetailPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const s = useService(slug) ?? getService(slug);
  if (!s) return null;
  const Icon = s.icon;

  return (
    <>
      <PageHero eyebrow={t("pages.serviceDetail.eyebrow")} title={s.title} subtitle={s.desc}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            {s.cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/services" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold">
            ← All services
          </Link>
        </div>
      </PageHero>

      {/* Intro + pricing card */}
      <section className="py-12">
        <div className="container-tight grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="rounded-3xl glass-card p-8">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold">Overview</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{s.intro}</p>
            <ul className="mt-6 space-y-2.5">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-3xl border border-border bg-secondary/15 p-6">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">Engagement</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Starting from</dt>
                <dd className="mt-1 font-display text-2xl font-bold text-primary">{s.pricing.from}</dd>
              </div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Model</dt><dd className="mt-1 font-medium">{s.pricing.model}</dd></div>
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Timeline</dt><dd className="mt-1 font-medium">{s.pricing.timeline}</dd></div>
            </dl>
            <Link to="/contact" className="mt-6 block rounded-full bg-gradient-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground">
              {s.cta.sub}
            </Link>
          </aside>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold">Capabilities</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {s.capabilities.map((c) => (
              <div key={c.title} className="rounded-2xl glass-card p-6">
                <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables + Tech */}
      <section className="py-12">
        <div className="container-tight grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl glass-card p-8">
            <h2 className="font-display text-2xl font-bold">What you get</h2>
            <ul className="mt-5 space-y-2.5">
              {s.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" /><span>{d}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl glass-card p-8">
            <h2 className="font-display text-2xl font-bold">Tech stack</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {s.techStack.map((t) => (
                <span key={t} className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold">Our process</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {s.process.map((p) => (
              <div key={p.step} className="relative rounded-2xl glass-card p-6">
                <span className="absolute right-4 top-4 font-mono text-xs font-bold text-primary/60">{p.step}</span>
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12">
        <div className="container-tight max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Frequently asked</h2>
          <div className="mt-8 space-y-3">
            {s.faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-secondary/15 p-5">
                <summary className="cursor-pointer list-none font-display font-semibold">{f.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related services */}
      <section className="py-12">
        <div className="container-tight">
          <h2 className="font-display text-2xl font-bold">Other services</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.filter((x) => x.slug !== s.slug).slice(0, 3).map((o) => {
              const OIcon = o.icon;
              return (
                <Link key={o.slug} to="/services/$slug" params={{ slug: o.slug }} className="group rounded-2xl glass-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><OIcon className="h-5 w-5" /></div>
                  <h3 className="mt-3 font-display font-semibold">{o.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{o.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">Learn more <ArrowRight className="h-3.5 w-3.5" /></span>
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
                <h2 className="mt-4 font-display text-3xl font-bold">Ready to start with {s.title}?</h2>
                <p className="mt-3 text-primary-foreground/85">Tell us about your project and we'll respond within one business day.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source={`Service: ${s.title}`} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
