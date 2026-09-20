import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Search, PenTool, Rocket, LifeBuoy, CheckCircle2, Sparkles, Calendar, FileText,
  TrendingUp, Clock, DollarSign, ShieldCheck, Award, Users, Globe2, Zap, Heart,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { useServices } from "@/lib/dynamicContent";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — YESS Bangla" },
      { name: "description", content: "Business consulting, IT, OTT, web and e-commerce services with transparent engagement models. Free consultation in 24 hours." },
      { property: "og:title", content: "Services & Pricing — YESS Bangla" },
      { property: "og:description", content: "Consulting, IT, OTT, web and e-commerce — built for ambitious businesses." },
    ],
  }),
  component: Services,
});

const process = [
  { icon: Search, title: "Discover", desc: "Free 30-min discovery call to map your goals, constraints and success metrics." },
  { icon: PenTool, title: "Design", desc: "Architecture, UX flows and a written proposal with scope, timeline and price." },
  { icon: Rocket, title: "Deliver", desc: "Iterative two-week sprints with weekly demos so you see progress, not promises." },
  { icon: LifeBuoy, title: "Support", desc: "Warranty period, monitoring and a long-term improvement retainer." },
];

type CaseStudy = {
  category: string;
  client: string;
  title: string;
  summary: string;
  metrics: { icon: typeof TrendingUp; label: string; value: string }[];
};

const caseStudies: CaseStudy[] = [
  {
    category: "Akash OTT",
    client: "Akash TV Network",
    title: "Launching Bangladesh's next-gen streaming platform",
    summary: "Built and launched a multi-device OTT platform with SVOD + AVOD monetisation, integrated DRM and CDN-backed adaptive streaming.",
    metrics: [
      { icon: Clock, label: "Time to launch", value: "−38%" },
      { icon: TrendingUp, label: "Concurrent viewers", value: "120k+" },
      { icon: DollarSign, label: "Infra cost / stream", value: "−42%" },
    ],
  },
  {
    category: "Akash News",
    client: "National daily",
    title: "Doubling editorial throughput with a modern CMS",
    summary: "Replaced a legacy CMS with a real-time editorial workspace, automated SEO checks and multimedia publishing.",
    metrics: [
      { icon: TrendingUp, label: "Stories / day", value: "+108%" },
      { icon: Clock, label: "Publish time", value: "−65%" },
      { icon: DollarSign, label: "Editorial cost", value: "−22%" },
    ],
  },
  {
    category: "Web Development",
    client: "Mid-size logistics group",
    title: "Replatforming an internal operations suite",
    summary: "Migrated 14 internal tools into a single TypeScript + Node.js platform with SSO, audit logs and role-based access.",
    metrics: [
      { icon: Clock, label: "Task completion", value: "−54%" },
      { icon: TrendingUp, label: "Adoption in 60 days", value: "94%" },
      { icon: DollarSign, label: "Licensing saved / yr", value: "৳ 38L" },
    ],
  },
  {
    category: "Web Design",
    client: "Fintech startup",
    title: "Redesigning the onboarding for a digital wallet",
    summary: "Restructured the sign-up flow, added trust cues and shipped a new design system in a 4-week sprint.",
    metrics: [
      { icon: TrendingUp, label: "Sign-up conversion", value: "+47%" },
      { icon: Clock, label: "Time to first txn", value: "−51%" },
      { icon: DollarSign, label: "Acquisition cost", value: "−33%" },
    ],
  },
  {
    category: "Yess Bangla Shop",
    client: "Fashion retailer",
    title: "Scaling e-commerce to all 64 districts",
    summary: "Delivered a multi-vendor storefront, mobile apps, bKash/Nagad/COD checkout and a hybrid last-mile delivery model.",
    metrics: [
      { icon: TrendingUp, label: "Online revenue (12mo)", value: "+312%" },
      { icon: Clock, label: "Delivery TAT", value: "−40%" },
      { icon: DollarSign, label: "CAC", value: "−27%" },
    ],
  },
  {
    category: "YESS One Stop Solution",
    client: "Shared-services BPO",
    title: "Outsourced IT operations under one roof",
    summary: "Took over IT support, vendor management and on-site maintenance across 4 offices with SLA-backed response times.",
    metrics: [
      { icon: Clock, label: "Avg ticket resolution", value: "−61%" },
      { icon: TrendingUp, label: "Uptime", value: "99.95%" },
      { icon: DollarSign, label: "IT spend", value: "−24%" },
    ],
  },
];

function Services() {
  const services = useServices();
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="services"
        eyebrow={t("pages.services.eyebrow")}
        title={t("pages.services.title")}
        subtitle={t("pages.services.subtitle")}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
          >
            Book free consultation <Calendar className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            Request a quote <FileText className="h-4 w-4" />
          </Link>
        </div>
      </PageHero>

      <section className="py-20">
        <div className="container-tight grid gap-6 md:grid-cols-2">
          {services.map((s) => (
            <article
              key={s.title}
              className="group flex flex-col rounded-2xl glass-card p-8 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground/85">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-center">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">From</div>
                  <div className="mt-1 font-display text-sm font-semibold text-primary">{s.pricing.from}</div>
                </div>
                <div className="border-x border-border/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Model</div>
                  <div className="mt-1 text-xs font-medium">{s.pricing.model}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</div>
                  <div className="mt-1 text-xs font-medium">{s.pricing.timeline}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
                <div>
                  <div className="text-xs text-muted-foreground">{s.cta.sub}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Free consultation
                  </Link>
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
                  >
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                  >
                    {s.cta.label}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How we work</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">A proven 4-step delivery model.</h2>
            <p className="mt-4 text-muted-foreground">Predictable outcomes, transparent communication and a partner that stays after launch.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <div key={p.title} className="relative rounded-2xl glass-card p-6">
                <span className="absolute right-4 top-4 text-xs font-semibold text-primary/60">0{i + 1}</span>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Case studies</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Real results, across every service.</h2>
            <p className="mt-4 text-muted-foreground">A snapshot of recent engagements and the measurable impact we delivered.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {caseStudies.map((c) => (
              <article key={c.title} className="flex flex-col rounded-2xl glass-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary">{c.category}</span>
                  <span className="text-muted-foreground">{c.client}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.summary}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
                  {c.metrics.map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="font-display text-base font-semibold text-primary">{m.value}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{m.label}</div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                >
                  Get similar results <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Standards strip */}
      <section className="border-y border-border/60 bg-secondary/15 py-8">
        <div className="container-tight">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Operated to international standards
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: ShieldCheck, label: "ISO-aligned processes" },
              { icon: Award, label: "Quality assured" },
              { icon: Users, label: "Senior-led pods" },
              { icon: Globe2, label: "Global delivery" },
              { icon: Zap, label: "24/5 support" },
              { icon: Heart, label: "NPS 60+" },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-center text-[11px] font-semibold text-foreground/80 backdrop-blur">
                <I className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing comparison table */}
      <section className="py-16">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Engagement models</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Choose the right way to engage</h2>
            <p className="mt-4 text-muted-foreground">Three transparent engagement models — pick what fits your stage and risk profile.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Fixed scope", price: "From ৳ 1,20,000", best: "Defined deliverables", features: ["Clear scope & milestones", "Predictable budget", "Best for launches"] },
              { name: "Time & materials", price: "From ৳ 6,500 / day", best: "Evolving requirements", features: ["Dedicated senior pod", "Weekly demos & invoicing", "Flexible scope"], highlight: true },
              { name: "Managed retainer", price: "From ৳ 35,000 / mo", best: "Ongoing partnership", features: ["SLA-backed support", "Quarterly roadmap reviews", "Priority access to team"] },
            ].map((p) => (
              <article key={p.name} className={`relative flex flex-col rounded-2xl border p-6 ${p.highlight ? "border-primary/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-elegant" : "border-border bg-secondary/20"}`}>
                {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-glow">Most chosen</span>}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <div className="mt-2 font-display text-2xl font-bold text-primary">{p.price}</div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Best for: {p.best}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with lead form */}
      <section className="py-20">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Have a project in mind?</h2>
                <p className="mt-3 max-w-xl text-primary-foreground/85">
                  Share a few details — we'll send back a written proposal with scope, timeline and pricing within 1–3 business days.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link to="/projects" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-5 py-2.5 text-sm font-semibold transition-all hover:bg-primary-foreground/10">
                    See our ventures <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="Services page" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
