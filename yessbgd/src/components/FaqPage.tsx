"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero } from "@/components/PageHero";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";

const groups = [
  {
    title: "General",
    items: [
      { q: "What services does YESS Bangla offer?", a: "We provide business consulting, web and software development, OTT and media platforms, e-commerce, IT support and One Stop Solution services across Bangladesh." },
      { q: "Do you work with clients outside Dhaka?", a: "Yes — we serve clients in all 64 districts of Bangladesh and run remote engagements with international clients as well." },
      { q: "Can you take over an existing project?", a: "Absolutely. We frequently audit and rescue in-flight projects, then either stabilise them or rebuild from a clean foundation depending on what's most cost-effective." },
    ],
  },
  {
    title: "Engagement & pricing",
    items: [
      { q: "How do engagements typically start?", a: "We begin with a free discovery call to understand your goals, then share a written proposal with scope, timeline and pricing within one to three business days." },
      { q: "What is your pricing model?", a: "We offer fixed-price project quotes, monthly retainers and dedicated team models. The right model depends on the scope and how mature the requirements are." },
      { q: "Do you sign NDAs?", a: "Yes, by default. We can use yours or share our standard mutual NDA." },
    ],
  },
  {
    title: "Delivery & support",
    items: [
      { q: "Do you provide post-launch support?", a: "Yes. Every project ships with a defined warranty period, and most clients continue with a monthly support and improvement retainer afterwards." },
      { q: "How do you handle data security and confidentiality?", a: "We follow industry security best practices, keep all client data isolated, and for regulated industries we align to your internal compliance policies." },
      { q: "What's your typical project timeline?", a: "Most web projects ship in 6–12 weeks. Larger platforms (OTT, ERP, marketplaces) usually run 3–6 months with phased rollouts." },
    ],
  },
];

export function FaqPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="faq"
        eyebrow={t("pages.faq.eyebrow")}
        title={t("pages.faq.title")}
        subtitle={
          <>
            {t("pages.faq.subtitleLead")}{" "}
            <Link to="/contact" className="text-primary underline underline-offset-4">
              {t("pages.faq.subtitleLink")}
            </Link>{" "}
            {t("pages.faq.subtitleTail")}
          </>
        }
      />

      <section className="py-16">
        <div className="container-tight max-w-3xl space-y-12">
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className="font-display text-xl font-semibold text-primary">{g.title}</h2>
              <Accordion type="single" collapsible className="mt-4 w-full glass-card rounded-2xl px-6">
                {g.items.map((f, i) => (
                  <AccordionItem key={i} value={`${g.title}-${i}`} className="border-border/50 last:border-b-0">
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
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Link to="/contact" className="group rounded-2xl glass-card p-8 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">Send us a message</h3>
              <p className="mt-2 text-sm text-muted-foreground">Reply within one business day.</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                Open contact form <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <a href="tel:+880" className="group rounded-2xl glass-card p-8 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">Talk to our team</h3>
              <p className="mt-2 text-sm text-muted-foreground">Sun–Thu, 10 AM – 6 PM (BST).</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                Call us <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
