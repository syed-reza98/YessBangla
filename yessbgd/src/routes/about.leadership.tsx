import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { leadership } from "@/data/about";

export const Route = createFileRoute("/about/leadership")({
  head: () => ({
    meta: [
      { title: "Leadership — YESS Bangla" },
      { name: "description", content: "Meet the leadership team behind YESS Bangla — strategists, engineers and designers united by craft." },
      { property: "og:title", content: "Leadership — YESS Bangla" },
      { property: "og:description", content: "Meet the people leading YESS Bangla." },
    ],
  }),
  component: LeadershipPage,
});

function LeadershipPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        eyebrow={t("pages.aboutLeadership.eyebrow")}
        title={t("pages.aboutLeadership.title")}
        subtitle={t("pages.aboutLeadership.subtitle")}
      />

      <section className="py-12">
        <div className="container-tight grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {leadership.map((m) => (
            <article key={m.name} className="rounded-2xl glass-card p-8">
              <div className="flex items-center gap-5">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-primary font-display text-xl font-bold text-primary-foreground shadow-glow">
                  {m.initials}
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">{m.name}</h2>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.role}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="container-tight rounded-3xl border border-border bg-secondary/15 p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-bold">Want to join the team?</h2>
          <p className="mt-3 text-muted-foreground">We're hiring across engineering, design and consulting.</p>
          <Link to="/careers" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            View open roles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold">Speak with our leadership.</h2>
                <p className="mt-3 text-primary-foreground/85">Senior partner-level conversations on every engagement.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="About: Leadership" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
