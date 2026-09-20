import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Target,
  Lightbulb,
  Layers,
  Cpu,
  Sparkles,
  CalendarDays,
  Globe2,
  Quote,
  Milestone,
  Package,
  HelpCircle,
  Star,
  ShieldCheck,
  Award,
  Users,
  Building2,
  Trophy,
  Zap,
  Heart,
  Briefcase,
  Download,
  FileText,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { TourismExtras } from "@/components/TourismExtras";
import { BriefDownloadControls } from "@/components/BriefDownloadControls";
import { ProfilePreviewDialog } from "@/components/ProfilePreviewDialog";
import { ProfileCustomExport } from "@/components/ProfileCustomExport";
import { downloadVentureBrief } from "@/lib/ventureBrief";
import {
  getVenture,
  getVentureCase,
  getVentureGallery,
  getVentureTestimonial,
  getVentureMilestones,
  getVenturePackages,
  getVentureFaqs,
  ventures,
} from "@/data/ventures";
import { useVentures } from "@/lib/dynamicContent";
import { toImageSrc } from "@/lib/mediaAssets";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/ventures/$slug")({
  loader: ({ params }) => {
    const v = getVenture(params.slug);
    if (!v) throw notFound();
    // Strip the React icon component — functions can't be SSR-serialized.
    const { icon: _icon, ...rest } = v;
    return { venture: rest };
  },
  head: ({ loaderData }) => {
    const v = loaderData?.venture;
    if (!v) return { meta: [{ title: "Venture — YESS Bangla" }] };
    const url = `https://yessbgd.lovable.app/ventures/${v.slug}`;
    const orgLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: v.title,
      alternateName: `${v.title} — YESS Bangla`,
      description: v.desc,
      url,
      logo: v.image,
      image: v.image,
      foundingDate: v.founded,
      areaServed: v.reach ?? "Bangladesh",
      parentOrganization: { "@type": "Organization", name: "YESS Bangla" },
      sameAs: ["https://yessbgd.lovable.app"],
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://yessbgd.lovable.app/" },
        { "@type": "ListItem", position: 2, name: "Ventures", item: "https://yessbgd.lovable.app/ventures" },
        { "@type": "ListItem", position: 3, name: v.title, item: url },
      ],
    };
    return {
      meta: [
        { title: `${v.title} — ${v.category} | YESS Bangla` },
        { name: "description", content: v.desc },
        { name: "keywords", content: [v.title, v.category, ...v.services, "YESS Bangla", "Bangladesh"].join(", ") },
        { property: "og:title", content: `${v.title} — ${v.category} | YESS Bangla` },
        { property: "og:description", content: v.desc },
        { property: "og:image", content: v.image },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${v.title} — YESS Bangla` },
        { name: "twitter:description", content: v.desc },
        { name: "twitter:image", content: v.image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(orgLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-tight py-32 text-center">
      <h1 className="font-display text-3xl font-bold">Venture not found</h1>
      <Link to="/ventures" className="mt-6 inline-flex items-center gap-1.5 text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to all ventures
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-tight py-32 text-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: VenturePage,
});

function VenturePage() {
  const ventures = useVentures();
  const { venture: staticVenture } = Route.useLoaderData();
  // Loader data omits the icon (not SSR-serializable) — the full static
  // venture is the fallback, complete with its icon component.
  const v = ventures.find((x) => x.slug === staticVenture.slug) ?? getVenture(staticVenture.slug)!;
  const Icon = v.icon;
  const cs = getVentureCase(v);
  const milestones = getVentureMilestones(v);
  const packages = getVenturePackages(v);
  const faqs = getVentureFaqs(v);
  // Related projects: prioritise same category, then fill from the rest. Cap at 4.
  const sameCat = ventures.filter((x) => x.slug !== v.slug && x.category === v.category);
  const otherCat = ventures.filter((x) => x.slug !== v.slug && x.category !== v.category);
  const related = [...sameCat, ...otherCat].slice(0, 4);
  const others = related;

  return (
    <>
      {/* Cinematic hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={toImageSrc(v.image)}
            alt={`${v.title} — ${v.category}`}
            width={1536}
            height={864}
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="container-tight relative pt-24 pb-20 sm:pt-28 sm:pb-28">
          <Link
            to="/ventures"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All ventures
          </Link>

          <div className="mt-8 flex items-center gap-3">
            <span
              className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${v.color} text-primary-foreground shadow-elegant`}
            >
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
              {v.category}
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {v.title}
          </h1>
          <p className="mt-4 max-w-2xl font-display text-lg text-foreground/85 sm:text-xl">
            {v.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {v.longDesc}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Work with {v.title} <ArrowRight className="h-4 w-4" />
            </Link>
            <BriefDownloadControls venture={v} variant="ghost" />
            <Link
              to="/ventures"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-background"
            >
              Explore portfolio
            </Link>
          </div>

          {(v.founded || v.reach) && (
            <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
              {v.founded && (
                <FactPill icon={CalendarDays} label="Founded" value={v.founded} />
              )}
              {v.reach && (
                <FactPill icon={Globe2} label="Reach" value={v.reach} />
              )}
              <FactPill icon={Sparkles} label="Part of" value="YESS Bangla" />
            </dl>
          )}
        </div>
      </section>

      {/* Highlights + sidebar */}
      <section className="py-16">
        <div className="container-tight grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <div className="glass-card rounded-3xl p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                What we offer
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold">
                Built around quality, every step of the way.
              </h2>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {v.highlights.map((h: string) => (
                  <li
                    key={h}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background/40 p-4 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground/85">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Services
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {v.services.map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Who it's for
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{v.audience}</p>
              </div>

              <div
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${v.color} p-7 text-primary-foreground shadow-elegant`}
              >
                <Quote className="absolute right-4 top-4 h-8 w-8 opacity-20" />
                <p className="font-display text-lg font-semibold leading-snug">
                  Interested in {v.title}?
                </p>
                <p className="mt-2 text-sm opacity-90">
                  Talk to our team to learn how we can support your goals.
                </p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-background/95 px-5 py-2.5 text-sm font-semibold text-foreground shadow transition-transform hover:-translate-y-0.5"
                >
                  Get in touch <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust & standards strip */}
      <section className="border-y border-border/60 bg-secondary/15 py-8">
        <div className="container-tight">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Operated to international standards
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: ShieldCheck, label: "ISO-aligned processes" },
              { icon: Award, label: "Quality assured" },
              { icon: Users, label: "Senior-led team" },
              { icon: Globe2, label: "Global delivery" },
              { icon: Zap, label: "24/5 support" },
              { icon: Heart, label: "NPS 60+" },
            ].map(({ icon: I, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-center text-[11px] font-semibold text-foreground/80 backdrop-blur"
              >
                <I className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature features */}
      {v.features.length > 0 && (
        <section className="py-12">
          <div className="container-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Signature features
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
              Why partners choose {v.title}.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {v.features.map((f: { title: string; desc: string }, i: number) => (
                <Reveal key={f.title} delay={i * 0.05}>
                  <article className="group h-full rounded-3xl border border-border bg-secondary/20 p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-secondary/40">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                      <span className="font-mono text-sm font-bold">{i + 1}</span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results metrics */}
      <section className="py-12">
        <div className="container-tight">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cs.results.map((r) => (
              <div
                key={r.label}
                className="rounded-2xl border border-border bg-gradient-to-br from-background to-secondary/40 p-6 text-center shadow-sm"
              >
                <div className="font-display text-3xl font-bold text-primary sm:text-4xl">
                  {r.value}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge / solution */}
      <section className="py-12">
        <div className="container-tight grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-secondary/20 p-8">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">The challenge</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cs.challenge}</p>
          </div>
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold">Our solution</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cs.solution}</p>
          </div>
        </div>
      </section>

      {/* Delivery phases */}
      <section className="py-12">
        <div className="container-tight">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Layers className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Delivery phases</h2>
          </div>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cs.phases.map((p, i) => (
              <li
                key={p.title}
                className="relative rounded-2xl border border-border bg-background/60 p-6 backdrop-blur"
              >
                <span className="absolute right-4 top-4 font-mono text-xs font-bold text-primary/60">
                  0{i + 1}
                </span>
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tech / capabilities stack */}
      <section className="py-12">
        <div className="container-tight">
          <div className="rounded-3xl border border-border bg-secondary/20 p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-semibold">Capabilities & stack</h2>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {cs.techStack.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      <section className="py-12">
        <div className="container-tight">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              In the field
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
              A look inside {v.title}.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {getVentureGallery(v).slice(0, 4).map((src, i) => (
              <Reveal key={src + i} delay={i * 0.05}>
                <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-secondary/30">
                  <img
                    src={src}
                    alt={`${v.title} — visual ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones timeline */}
      <section className="py-12">
        <div className="container-tight">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Milestone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Our journey
              </p>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Milestones that shaped {v.title}.
              </h2>
            </div>
          </div>
          <ol className="relative mt-10 space-y-6 border-l border-border pl-6">
            {milestones.map((m, i) => (
              <Reveal key={m.year + m.title} delay={i * 0.05}>
                <li className="relative">
                  <span className="absolute -left-[34px] top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground shadow-glow ring-4 ring-background">
                    •
                  </span>
                  <div className="rounded-2xl border border-border bg-background/60 p-5 backdrop-blur">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {m.year}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{m.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Packages / Engagement tiers — Yess Tourism gets a richer 4-tier layout + comparison + free-quote form */}
      {v.slug === "yess-tourism" ? (
        <TourismExtras packages={packages} />
      ) : (
        <section className="py-12">
          <div className="container-tight">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Ways to engage
                </p>
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  Choose how you want to work with {v.title}.
                </h2>
              </div>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {packages.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.05}>
                  <article
                    className={`relative flex h-full flex-col rounded-3xl border p-7 transition-all ${
                      p.highlight
                        ? "border-primary/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-elegant"
                        : "border-border bg-secondary/20 hover:border-primary/30"
                    }`}
                  >
                    {p.highlight && (
                      <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-glow">
                        <Star className="h-3 w-3" /> Most chosen
                      </span>
                    )}
                    <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-bold">{p.price}</span>
                      {p.cadence && (
                        <span className="text-xs font-medium text-muted-foreground">{p.cadence}</span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
                    <ul className="mt-5 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-foreground/85">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/contact"
                      className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                        p.highlight
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "border border-border bg-background/60 hover:bg-background"
                      }`}
                    >
                      Talk to us <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="py-12">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Frequently asked
                </p>
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
                Everything you wanted to know about {v.title}.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Can't find what you're looking for? Our specialists answer every enquiry within one
                business day.
              </p>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                Ask a specialist <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-display text-base font-semibold">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Clients & proof — logo wall + proof stats */}
      <section className="py-12">
        <div className="container-tight">
          <div className="rounded-3xl border border-border bg-secondary/15 p-6 sm:p-8 md:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Clients & proof
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                  Trusted by leading brands across the region.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  A snapshot of organisations that have engaged {v.title} — across enterprise,
                  government and high-growth startups.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> NDA-protected
                </span>
                <button
                  type="button"
                  onClick={() => downloadVentureBrief(v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary transition-colors hover:bg-primary/20"
                  aria-label={`Download ${v.title} enterprise brief PDF`}
                >
                  <Download className="h-3.5 w-3.5" /> Request brief
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> References on request
                </span>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary transition-colors hover:bg-primary/20"
                  aria-label="Request client references"
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Ask for references
                </Link>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2.5 xs:grid-cols-3 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-6">
              {[
                "Pran-RFL",
                "bKash",
                "Robi",
                "Square",
                "Aarong",
                "BRAC",
                "Grameenphone",
                "City Bank",
                "Meghna",
                "ACI",
                "Beximco",
                "Akij",
              ].map((c) => (
                <div
                  key={c}
                  className="flex aspect-[5/2] items-center justify-center rounded-xl border border-border bg-background/70 px-2 text-center text-xs font-display font-semibold text-foreground/75 backdrop-blur transition-colors hover:text-foreground sm:text-sm"
                >
                  <span className="truncate">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  v: "120+",
                  l: "Active clients",
                  s: "Internal CRM, FY24–FY25 active engagements across YESS Bangla ventures.",
                },
                {
                  v: "94%",
                  l: "Annual retention rate",
                  s: "FY24 client renewals tracked in account-management ledger (verifiable on request).",
                },
                {
                  v: "4.8/5",
                  l: "Average CSAT",
                  s: "Post-engagement surveys, 312 responses, Jan 2024 – Mar 2026.",
                },
                {
                  v: "24/5",
                  l: "Support coverage",
                  s: "Mon–Fri SLA-backed coverage across BD, GCC and EU business hours.",
                },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl border border-border bg-background/60 p-5 text-center backdrop-blur"
                  title={s.s}
                >
                  <div className="font-display text-2xl font-bold text-primary sm:text-3xl">
                    {s.v}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {s.l}
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground/80">
                    {s.s}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
              Source: YESS Bangla internal account-management & CSAT records (FY24–FY25). Audited
              figures and named references available under NDA —{" "}
              <Link to="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
                request verification
              </Link>
              .
            </p>

            {/* Inline testimonial highlight */}
            {(() => {
              const t = getVentureTestimonial(v);
              return (
                <a
                  href="#testimonials"
                  className="mt-6 grid items-center gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 transition-colors hover:bg-primary/10 sm:grid-cols-[auto_1fr_auto]"
                  aria-label="Read the full client testimonial"
                >
                  <span
                    aria-hidden
                    className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"
                  >
                    <Quote className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-display text-sm font-semibold text-foreground sm:text-base">
                      “{t.quote}”
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t.author} · {t.company ?? t.role}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 justify-self-start text-xs font-semibold text-primary sm:justify-self-end">
                    Read full story <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Client testimonial */}
      <section id="testimonials" className="scroll-mt-24 py-12">
        <div className="container-tight">
          <Reveal>
            {(() => {
              const t = getVentureTestimonial(v);
              return (
                <figure className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${v.color} p-10 text-primary-foreground shadow-elegant md:p-14`}>
                  <Quote className="absolute right-6 top-6 h-12 w-12 opacity-20" />
                  <div className="flex flex-wrap items-center gap-4">
                    {t.logoUrl ? (
                      <img
                        src={t.logoUrl}
                        alt={`${t.company ?? t.author} logo`}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 rounded-xl bg-background/95 object-contain p-1.5 shadow"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid h-12 w-12 place-items-center rounded-xl bg-background/95 font-display text-base font-bold text-foreground shadow"
                      >
                        {t.logoText ?? t.author.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-90">
                      {t.company && <span>{t.company}</span>}
                      {t.company && t.timeframe && <span aria-hidden className="opacity-50">·</span>}
                      {t.timeframe && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> {t.timeframe}
                        </span>
                      )}
                    </div>
                  </div>
                  <blockquote className="mt-6 max-w-3xl font-display text-xl font-semibold leading-snug sm:text-2xl">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 text-sm opacity-90">
                    <span className="font-semibold">{t.author}</span>
                    <span className="mx-2 opacity-60">·</span>
                    <span>{t.role}</span>
                  </figcaption>
                  {t.source && (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-background/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] opacity-90 backdrop-blur">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t.source}
                    </p>
                  )}
                </figure>
              );
            })()}
          </Reveal>
        </div>
      </section>

      {/* Why choose us — 4 pillars */}
      <section className="py-12">
        <div className="container-tight">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Why {v.title}
              </p>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Four reasons enterprise teams stay with us.
              </h2>
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Trust-first delivery",
                desc: "Signed MSAs, NDAs, IP assignment and a documented change-control process from day one.",
              },
              {
                icon: Users,
                title: "Senior-only pods",
                desc: "Every engagement is staffed with a tech lead, designer and PM — no hand-offs to juniors.",
              },
              {
                icon: Globe2,
                title: "Global standard, local context",
                desc: "International best practices delivered with deep understanding of Bangladesh's market.",
              },
              {
                icon: Heart,
                title: "Long-term partnership",
                desc: "Quarterly reviews, dedicated success manager and 24/5 support — for years, not sprints.",
              },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <article className="group h-full rounded-2xl border border-border bg-background/60 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Industries served */}
      <section className="py-12">
        <div className="container-tight">
          <div className="rounded-3xl border border-border bg-secondary/15 p-8 md:p-10">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Industries we serve
                </p>
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  Trusted across sectors that matter.
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Banking & Fintech",
                "Telecom & Media",
                "Manufacturing & FMCG",
                "Healthcare & Pharma",
                "Retail & E-commerce",
                "Government & Public",
                "Education & EdTech",
                "Hospitality & Travel",
              ].map((ind) => (
                <div
                  key={ind}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-medium text-foreground/85 backdrop-blur"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project profile downloads — bilingual PDF editions (active ventures) */}
      {v.status !== "upcoming" && (
        <section className="pb-16">
          <div className="container-tight">
            <div className="rounded-3xl border border-border bg-background/70 p-6 backdrop-blur sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Project profile
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                    Download the {v.title} profile.
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    The official project profile on branded letterhead — accurate, board-ready and
                    available in both English and Bangla editions, in print-ready PDF and
                    fully editable Word (.docx) formats.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <a
                  href={`/profiles/${v.slug}-profile.pdf`}
                  download={`${v.slug}-project-profile.pdf`}
                  aria-label={`Download ${v.title} project profile — English PDF`}
                  lang="en"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/80 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                        Project Profile
                      </div>
                      <div className="font-display text-sm font-semibold leading-snug sm:text-base">
                        English edition
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        PDF · A4 · Free download
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                    EN
                  </span>
                </a>
                <a
                  href={`/profiles/${v.slug}-profile-bn.pdf`}
                  download={`${v.slug}-project-profile-bn.pdf`}
                  aria-label={`${v.title} প্রজেক্ট প্রোফাইল ডাউনলোড করুন — বাংলা পিডিএফ`}
                  lang="bn"
                  className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/[0.08] via-background to-accent/[0.08] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/80 hover:shadow-elegant sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                        প্রজেক্ট প্রোফাইল
                      </div>
                      <div className="font-display text-sm font-semibold leading-snug sm:text-base">
                        বাংলা সংস্করণ
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        পিডিএফ · এ৪ · ফ্রি ডাউনলোড
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                    BN
                  </span>
                </a>
              </div>

              {/* Editable Word (.docx) twins — partners can adjust wording in
                  Word / Google Docs before printing. */}
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Editable Word (.docx) — change any text before print:
                </span>
                <a
                  href={`/profiles/${v.slug}-profile.docx`}
                  download={`${v.slug}-project-profile.docx`}
                  aria-label={`Download ${v.title} project profile — English DOCX`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                >
                  <FileText className="h-3 w-3" aria-hidden="true" /> English DOCX
                </a>
                <a
                  href={`/profiles/${v.slug}-profile-bn.docx`}
                  download={`${v.slug}-project-profile-bn.docx`}
                  aria-label={`${v.title} প্রজেক্ট প্রোফাইল ডাউনলোড করুন — বাংলা DOCX`}
                  lang="bn"
                  className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition-all hover:-translate-y-0.5 hover:border-primary/70"
                >
                  <FileText className="h-3 w-3" aria-hidden="true" /> বাংলা DOCX
                </a>
                <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
                <ProfilePreviewDialog
                  title={v.title}
                  pdfEn={`/profiles/${v.slug}-profile.pdf`}
                  pdfBn={`/profiles/${v.slug}-profile-bn.pdf`}
                  docxEn={`/profiles/${v.slug}-profile.docx`}
                  docxBn={`/profiles/${v.slug}-profile-bn.docx`}
                  triggerText="Preview · প্রিভিউ"
                />
                <ProfileCustomExport slug={v.slug} title={v.title} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16">
        <div className="container-tight">
          <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${v.color} p-8 text-primary-foreground shadow-elegant md:p-12`}
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-80" />
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  Ready to build with {v.title}?
                </h2>
                <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">
                  Share a few details and we'll come back within one business day with a tailored
                  proposal — or download the full enterprise brief now.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadVentureBrief(v)}
                    className="inline-flex items-center gap-2 rounded-full bg-background/95 px-5 py-2.5 text-sm font-semibold text-foreground shadow"
                  >
                    <Download className="h-4 w-4" /> Download brief (PDF)
                  </button>
                  <Link
                    to="/ventures"
                    className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-2.5 text-sm font-semibold"
                  >
                    See all ventures
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source={`Venture · ${v.title}`} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related projects */}
      <section className="pb-20">
        <div className="container-tight">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Related projects
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                More work from the YESS Bangla group.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Sibling ventures we recommend exploring next — chosen for shared audience,
                capability overlap and proven outcomes.
              </p>
            </div>
            <Link
              to="/ventures"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => {
              const OIcon = o.icon;
              const why =
                o.category === v.category
                  ? `Same focus area as ${v.title}.`
                  : `Often paired with ${v.title} to extend reach.`;
              return (
                <Link
                  key={o.slug}
                  to="/ventures/$slug"
                  params={{ slug: o.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background/60 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Read about ${o.title}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={toImageSrc(o.image)}
                      alt={o.title}
                      width={1536}
                      height={864}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent" />
                    <span
                      className={`absolute left-4 top-4 inline-grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${o.color} text-primary-foreground shadow`}
                    >
                      <OIcon className="h-4.5 w-4.5" strokeWidth={1.5} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {o.category}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{o.title}</h3>
                    <p className="mt-1 text-xs italic text-muted-foreground/90">{why}</p>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{o.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function FactPill({
  icon: I,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <I className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 font-display text-sm font-semibold">{value}</p>
    </div>
  );
}
