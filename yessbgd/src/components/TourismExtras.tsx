import { Reveal } from "@/components/Reveal";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import {
  Plane,
  Sparkles,
  MoonStar,
  Building2,
  CheckCircle2,
  Minus,
  ShieldCheck,
  Clock4,
  HeartHandshake,
} from "lucide-react";
import type { VenturePackage } from "@/data/ventures";

/**
 * Yess Tourism specific extras:
 * - 4 tier highlight cards (Explorer / Signature / Hajj & Umrah / Corporate)
 * - Side-by-side comparison table of inclusions
 * - "Free quote" (ফ্রি কোট নিন) lead form section
 *
 * Rendered only on the /ventures/yess-tourism page.
 */

type TierMeta = {
  icon: typeof Plane;
  bn: string;
  blurb: string;
  badge: string;
  gradient: string;
};

const TIER_META: Record<string, TierMeta> = {
  Explorer: {
    icon: Plane,
    bn: "এক্সপ্লোরার",
    blurb: "Quick weekend escapes & nearby getaways for first-time travellers.",
    badge: "Starter",
    gradient: "from-primary/15 to-primary-glow/10",
  },
  Signature: {
    icon: Sparkles,
    bn: "সিগনেচার",
    blurb: "Curated international holidays with premium stays and private experiences.",
    badge: "Most chosen",
    gradient: "from-accent/25 to-primary-glow/15",
  },
  "Hajj & Umrah": {
    icon: MoonStar,
    bn: "হজ্জ ও উমরাহ",
    blurb: "Government-licensed pilgrimage packages with experienced muallims.",
    badge: "Faith-based",
    gradient: "from-primary/20 to-accent/15",
  },
  Corporate: {
    icon: Building2,
    bn: "কর্পোরেট",
    blurb: "Managed business-travel desk with negotiated fares and reporting.",
    badge: "Enterprise",
    gradient: "from-primary-glow/15 to-primary/15",
  },
};

const COMPARE_ROWS: { label: string; vals: Record<string, string | true | false> }[] = [
  {
    label: "Return flights / transport",
    vals: { Explorer: true, Signature: true, "Hajj & Umrah": true, Corporate: true },
  },
  {
    label: "Hotel grade",
    vals: {
      Explorer: "4★",
      Signature: "5★",
      "Hajj & Umrah": "Walking-distance to Haram",
      Corporate: "Negotiated 4–5★",
    },
  },
  {
    label: "Visa filing & documentation",
    vals: { Explorer: false, Signature: true, "Hajj & Umrah": true, Corporate: true },
  },
  {
    label: "Travel insurance",
    vals: { Explorer: "Add-on", Signature: true, "Hajj & Umrah": true, Corporate: true },
  },
  {
    label: "Private guide / muallim",
    vals: { Explorer: false, Signature: true, "Hajj & Umrah": true, Corporate: "On request" },
  },
  {
    label: "24/7 on-trip concierge",
    vals: {
      Explorer: "WhatsApp support",
      Signature: true,
      "Hajj & Umrah": true,
      Corporate: true,
    },
  },
  {
    label: "Monthly reporting & savings audit",
    vals: { Explorer: false, Signature: false, "Hajj & Umrah": false, Corporate: true },
  },
  {
    label: "Best-fare guarantee",
    vals: { Explorer: true, Signature: true, "Hajj & Umrah": true, Corporate: true },
  },
];

export function TourismExtras({ packages }: { packages: VenturePackage[] }) {
  return (
    <>
      {/* 4-tier highlight cards */}
      <section className="py-12">
        <div className="container-tight">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Yess Tourism · চারটি প্যাকেজ টিয়ার
              </p>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Pick the journey that fits you.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((p, i) => {
              const meta = TIER_META[p.name] ?? {
                icon: Plane,
                bn: p.name,
                blurb: p.summary,
                badge: "Tier",
                gradient: "from-primary/15 to-primary-glow/10",
              };
              const Icon = meta.icon;
              return (
                <Reveal key={p.name} delay={i * 0.05}>
                  <article
                    className={`relative flex h-full flex-col overflow-hidden rounded-3xl border ${
                      p.highlight ? "border-primary/50" : "border-border"
                    } bg-gradient-to-br ${meta.gradient} p-6 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-elegant`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                        <Icon className="h-5 w-5" strokeWidth={1.7} />
                      </span>
                      <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                        {meta.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold leading-tight">
                      {p.name}
                      <span className="ml-2 text-sm font-medium text-muted-foreground">
                        {meta.bn}
                      </span>
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {meta.blurb}
                    </p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-foreground">
                        {p.price}
                      </span>
                      {p.cadence && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {p.cadence}
                        </span>
                      )}
                    </div>
                    <ul className="mt-4 space-y-2">
                      {p.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-foreground/85">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#tourism-quote"
                      className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-sm transition-transform hover:-translate-y-0.5"
                    >
                      ফ্রি কোট নিন · Get free quote
                    </a>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-12">
        <div className="container-tight">
          <div className="rounded-3xl border border-border bg-secondary/15 p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Tier comparison
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                  What's included in each package.
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Need a custom mix? Mention it in the quote form below.
              </p>
            </div>

            <div className="mt-6 -mx-2 overflow-x-auto px-2">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-secondary/40 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Inclusion
                    </th>
                    {packages.map((p) => (
                      <th
                        key={p.name}
                        className={`px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          p.highlight ? "text-primary" : "text-foreground/85"
                        }`}
                      >
                        {p.name}
                        {p.highlight && (
                          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="rounded-xl">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 rounded-l-xl bg-background/80 px-4 py-3 text-left text-[13px] font-medium text-foreground/85 backdrop-blur"
                      >
                        {row.label}
                      </th>
                      {packages.map((p, idx) => {
                        const v = row.vals[p.name];
                        const isLast = idx === packages.length - 1;
                        return (
                          <td
                            key={p.name}
                            className={`bg-background/60 px-3 py-3 text-center text-[13px] backdrop-blur ${
                              isLast ? "rounded-r-xl" : ""
                            } ${p.highlight ? "ring-1 ring-inset ring-primary/30" : ""}`}
                          >
                            {v === true ? (
                              <CheckCircle2
                                className="mx-auto h-4 w-4 text-primary"
                                aria-label="Included"
                              />
                            ) : v === false ? (
                              <Minus
                                className="mx-auto h-4 w-4 text-muted-foreground/50"
                                aria-label="Not included"
                              />
                            ) : (
                              <span className="text-foreground/80">{v}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Free quote form */}
      <section id="tourism-quote" className="scroll-mt-24 py-14">
        <div className="container-tight">
          <div className="grid gap-8 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                ফ্রি কোট নিন · Free quote
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                আপনার পরবর্তী যাত্রার জন্য কাস্টম প্ল্যান নিন।
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Share your destinations, dates and travellers — a senior travel designer will
                respond within <strong>4 working hours</strong> with a written itinerary, hotel
                options and a transparent price card. কোনো অগ্রিম পেমেন্ট ছাড়াই কোট পাওয়া যাবে।
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { icon: Clock4, label: "Quote within 4 working hours" },
                  { icon: ShieldCheck, label: "Best-fare guarantee · transparent pricing" },
                  { icon: HeartHandshake, label: "No commitment — review before you book" },
                ].map(({ icon: I, label }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/70 text-primary shadow-sm">
                      <I className="h-4 w-4" />
                    </span>
                    <span className="pt-1.5 text-foreground/85">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur sm:p-6">
              <LeadCaptureForm variant="light" source="Yess Tourism · Free Quote" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
