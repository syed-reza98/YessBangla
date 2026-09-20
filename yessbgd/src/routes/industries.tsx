import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/PageHero";
import {
  ArrowRight, CheckCircle2, Sparkles,
  ShieldCheck, Award, Users, Globe2, Zap, Heart,
} from "lucide-react";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { useIndustries } from "@/lib/dynamicContent";

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industries — YESS Bangla Private Limited" },
      { name: "description", content: "Industries we serve: media, retail, education, healthcare, finance, manufacturing, logistics and government in Bangladesh." },
      { property: "og:title", content: "Industries we serve — YESS Bangla" },
      { property: "og:description", content: "Cross-industry consulting and IT solutions delivered nation-wide." },
    ],
  }),
  component: Industries,
});

const stats = [
  { value: "10+", label: "Years of experience" },
  { value: "64", label: "Districts served" },
  { value: "200+", label: "Projects delivered" },
  { value: "98%", label: "Client retention" },
];

function Industries() {
  const industries = useIndustries();
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="industries"
        eyebrow={t("pages.industries.eyebrow")}
        title={t("pages.industries.title")}
        subtitle={t("pages.industries.subtitle")}
      />

      <section className="pb-10">
        <div className="container-tight grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl glass-card p-6 text-center">
              <div className="font-display text-3xl font-semibold text-primary">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="container-tight grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {industries.map((i) => (
            <Link key={i.slug} to="/industries/$slug" params={{ slug: i.slug }} className="group rounded-2xl glass-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <i.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{i.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {i.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-xs text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="container-tight mt-16">
          {/* Standards strip */}
          <div className="rounded-3xl border border-border bg-secondary/15 p-6 md:p-8">
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Sector-specific compliance & standards
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { icon: ShieldCheck, label: "ISO-aligned QMS" },
                { icon: Award, label: "PCI-aware fintech" },
                { icon: Users, label: "Healthcare HIPAA-aware" },
                { icon: Globe2, label: "GDPR-ready" },
                { icon: Zap, label: "24/5 SLA support" },
                { icon: Heart, label: "Senior-led delivery" },
              ].map(({ icon: I, label }) => (
                <div key={label} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-center text-[11px] font-semibold text-foreground/80 backdrop-blur">
                  <I className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA with lead form */}
        <div className="container-tight mt-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Don't see your industry?</h2>
                <p className="mt-3 max-w-xl text-primary-foreground/85">
                  We've worked across more sectors than we can list. Tell us about yours — we adapt fast.
                </p>
                <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
                  Explore services <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="Industries page" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
