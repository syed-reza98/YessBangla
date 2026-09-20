import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { awards } from "@/data/about";

export const Route = createFileRoute("/about/awards")({
  head: () => ({
    meta: [
      { title: "Awards & Recognition — YESS Bangla" },
      { name: "description", content: "Awards, partnerships and certifications recognising YESS Bangla's craft and delivery." },
      { property: "og:title", content: "Awards & Recognition — YESS Bangla" },
      { property: "og:description", content: "A snapshot of recognition our team has earned along the way." },
    ],
  }),
  component: AwardsPage,
});

function AwardsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        eyebrow={t("pages.aboutAwards.eyebrow")}
        title={t("pages.aboutAwards.title")}
        subtitle={t("pages.aboutAwards.subtitle")}
      />

      <section className="py-12">
        <div className="container-tight grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {awards.map((a) => {
            const Icon = a.icon;
            return (
              <article key={a.title} className="rounded-2xl glass-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold">{a.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold">Partner with a recognised team.</h2>
                <p className="mt-3 text-primary-foreground/85">Tell us about your goals and we'll show you why our clients stay.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="About: Awards" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
