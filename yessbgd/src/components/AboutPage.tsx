"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2, Target, Eye, Heart, ShieldCheck, Award, Users, Globe2, Zap,
  Trophy, Building2, Sparkles, ArrowRight,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="about"
        eyebrow={t("pages.about.eyebrow")}
        title={t("pages.about.title")}
        subtitle={t("pages.about.subtitle")}
      />

      <section className="py-20">
        <div className="container-tight grid gap-10 lg:grid-cols-3">
          {[
            { slug: "mission", icon: Target, title: "Our Mission", desc: "Empower organisations across Bangladesh with strategic consulting and technology that drives measurable growth." },
            { slug: "vision", icon: Eye, title: "Our Vision", desc: "To become the most trusted partner for businesses transitioning into the digital era — locally and globally." },
            { slug: "values", icon: Heart, title: "Our Values", desc: "Integrity, craftsmanship, customer focus and a relentless pursuit of quality in every engagement." },
          ].map((c) => (
            <Link key={c.title} to="/about/$pillar" params={{ pillar: c.slug }} className="group rounded-2xl glass-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">Read more <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="container-tight grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why choose us</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Customer-centric. Tech-driven. Results-focused.
            </h2>
            <p className="mt-4 text-muted-foreground">
              When you work with YESS Bangla, you get a partner that adapts to your process. We
              build long-term relationships through transparency, accountability and consistently
              high-quality delivery.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Senior consultants with deep industry expertise",
                "Long-term guarantees on every deliverable",
                "Adoption of modern technologies and frameworks",
                "Nation-wide presence across all 64 districts",
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl glass-strong p-8 shadow-elegant">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-primary font-display text-xl font-bold text-primary-foreground">
                EH
              </div>
              <div>
                <div className="font-display text-lg font-semibold">Md Enamul Hayder</div>
                <div className="text-sm text-muted-foreground">Managing Director</div>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              "Our promise is simple — we treat every client's business as if it were our own.
              That's how we've earned trust across Bangladesh for more than a decade, and that's
              how we plan to keep growing alongside the businesses we serve."
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      {/* LEADERSHIP TEAM */}
      <section className="py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Leadership</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Meet the people behind YESS Bangla</h2>
            <p className="mt-4 text-muted-foreground">A multidisciplinary team of strategists, engineers and designers united by craft.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Md Enamul Hayder", role: "Managing Director", initials: "EH" },
              { name: "Sadia Rahman", role: "Chief Operating Officer", initials: "SR" },
              { name: "Arif Khan", role: "Head of Engineering", initials: "AK" },
              { name: "Mahfuza Akter", role: "Head of Design", initials: "MA" },
            ].map((m) => (
              <div key={m.name} className="rounded-2xl glass-card p-6 text-center shadow-sm transition-transform hover:-translate-y-1">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-primary font-display text-2xl font-bold text-primary-foreground shadow-glow">
                  {m.initials}
                </div>
                <div className="mt-5 font-display text-base font-semibold">{m.name}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{m.role}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/about/leadership" className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold">Meet the leadership team <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our journey</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Milestones along the way</h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="relative space-y-8 border-l-2 border-border pl-8">
              {[
                { year: "2014", title: "YESS Bangla founded", desc: "Started as a small consulting firm in Dhaka with a focus on SME modernisation." },
                { year: "2018", title: "IT services division launched", desc: "Expanded into web, mobile and software engineering for enterprise clients." },
                { year: "2021", title: "Akash TV partnership", desc: "Launched media operations powering Akash News and digital streaming." },
                { year: "2024", title: "Akash OTT goes live", desc: "Bangladesh's new digital streaming platform — built and operated by our team." },
                { year: "2026", title: "Nation-wide footprint", desc: "Active engagements across all 64 districts, with 250+ delivered projects." },
              ].map((m) => (
                <div key={m.year} className="relative">
                  <span className="absolute -left-[42px] grid h-6 w-6 place-items-center rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground shadow-glow">●</span>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{m.year}</div>
                  <h3 className="mt-1 font-display text-lg font-semibold">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof stats */}
      <section className="py-12">
        <div className="container-tight grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { v: "11+", l: "Years in business" },
            { v: "250+", l: "Projects delivered" },
            { v: "120+", l: "Active clients" },
            { v: "98%", l: "Client retention" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl glass-card p-6 text-center">
              <div className="font-display text-3xl font-bold text-primary">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
            </div>
          ))}
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
              { icon: Users, label: "Senior-led team" },
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
          <div className="mt-6 text-center">
            <Link to="/about/standards" className="text-sm font-semibold text-primary hover:underline">Read about our standards →</Link>
          </div>
        </div>
      </section>

      {/* Awards & certifications */}
      <section className="py-16">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Recognition</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Awards, partnerships & certifications</h2>
            <p className="mt-4 text-muted-foreground">A snapshot of the recognition our team and partners have earned along the way.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Trophy, title: "BASIS Member", desc: "Member of Bangladesh Association of Software & Information Services." },
              { icon: Award, title: "ISO-aligned QMS", desc: "Internal quality processes aligned with ISO 9001 principles." },
              { icon: ShieldCheck, title: "GDPR-aware delivery", desc: "Privacy-by-design for clients with EU and global obligations." },
              { icon: Globe2, title: "Cross-border partner", desc: "Delivery partner for agencies in UK, UAE, Singapore and US." },
              { icon: Building2, title: "Enterprise vendor", desc: "Empanelled with leading banks, telcos and government bodies." },
              { icon: Heart, title: "Best place to work 2024", desc: "Internal recognition for engineering culture & retention." },
            ].map((a) => (
              <div key={a.title} className="rounded-2xl glass-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/about/awards" className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold">View all recognition <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Methodology</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">How we work with clients</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Discover", d: "Free 30-min discovery, success metrics and constraints mapped." },
              { n: "02", t: "Design", d: "Architecture, UX flows and a written proposal in 1–3 days." },
              { n: "03", t: "Deliver", d: "Two-week sprints, weekly demos and transparent progress." },
              { n: "04", t: "Support", d: "Warranty, monitoring and a long-term improvement retainer." },
            ].map((p) => (
              <div key={p.n} className="relative rounded-2xl glass-card p-6">
                <span className="absolute right-4 top-4 font-mono text-xs font-semibold text-primary/60">{p.n}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/about/methodology" className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold">See full methodology <ArrowRight className="h-4 w-4" /></Link>
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
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Let's discuss your next move.</h2>
                <p className="mt-3 max-w-xl text-primary-foreground/85">
                  Tell us about your goals — we'll respond within one business day with a tailored next step.
                </p>
                <Link to="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
                  Or visit our contact page <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl bg-background/10 p-6 backdrop-blur">
                <LeadCaptureForm variant="onPrimary" source="About page" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
