import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { standards } from "@/data/about";

export const Route = createFileRoute("/about/standards")({
  head: () => ({
    meta: [
      { title: "International Standards — YESS Bangla" },
      { name: "description", content: "How YESS Bangla is operated to international quality, security and delivery standards." },
      { property: "og:title", content: "International Standards — YESS Bangla" },
      { property: "og:description", content: "ISO-aligned processes, senior-led delivery, 24/5 support and more." },
    ],
  }),
  component: StandardsPage,
});

function StandardsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        eyebrow={t("pages.aboutStandards.eyebrow")}
        title={t("pages.aboutStandards.title")}
        subtitle={t("pages.aboutStandards.subtitle")}
      />

      <section className="py-12">
        <div className="container-tight grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {standards.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.label} className="rounded-2xl glass-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold">{s.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-12">
        <div className="container-tight rounded-3xl border border-border bg-secondary/15 p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold">Audit-ready by default</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every engagement ships with documented architecture decisions, immutable audit logs,
            and a security-and-quality runbook your team can hand to internal or external auditors.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <Sparkles className="h-8 w-8 opacity-90" />
                <h2 className="mt-4 font-display text-3xl font-bold">Hold your delivery to a higher bar.</h2>
                <p className="mt-3 text-primary-foreground/85">Speak to our delivery leads about how we'd run your project.</p>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="About: Standards" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
