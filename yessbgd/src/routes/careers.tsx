import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  GraduationCap,
  Heart,
  Check,
  ChevronDown,
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Send,
  ClipboardCheck,
  MessageSquare,
  Handshake,
  Quote,
  Globe2,
  Trophy,
  Rocket,
  Mail,
  Loader2,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { openings } from "@/data/openings";
import { submitJobApplicationAction } from "@/actions/public";
import { toast } from "sonner";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Join YESS Bangla" },
      { name: "description", content: "Apply to open roles at YESS Bangla. Select a position and submit your application in minutes." },
      { property: "og:title", content: "Careers at YESS Bangla" },
      { property: "og:description", content: "Open roles in engineering, design, consulting and operations." },
    ],
  }),
  component: Careers,
});

const perks = [
  { icon: Heart, title: "Health & wellness", desc: "Comprehensive medical coverage for you and your family." },
  { icon: GraduationCap, title: "Learning budget", desc: "Annual stipend for courses, certifications and conferences." },
  { icon: Users, title: "Inclusive culture", desc: "A diverse, collaborative team that values every voice." },
  { icon: Sparkles, title: "Modern tooling", desc: "The best hardware and software to do your best work." },
];

const stats = [
  { value: "120+", label: "Team members" },
  { value: "12", label: "Open roles" },
  { value: "9", label: "Industries served" },
  { value: "4.8/5", label: "Glassdoor rating" },
];

const hiringSteps = [
  { icon: Send, title: "Apply", desc: "Submit your application in under 5 minutes — no account required." },
  { icon: ClipboardCheck, title: "Screen", desc: "Recruiter review within 5–7 business days, then a short intro call." },
  { icon: MessageSquare, title: "Interview", desc: "1–2 focused interviews with the hiring manager and the team." },
  { icon: Handshake, title: "Offer", desc: "Reference checks, transparent comp discussion and a written offer." },
];

const values = [
  { icon: Trophy, title: "Outcomes over optics", desc: "We measure work by the results it delivers, not the hours it took." },
  { icon: Globe2, title: "Built for South Asia", desc: "We design for emerging markets first — speed, resilience, accessibility." },
  { icon: Rocket, title: "Bias for momentum", desc: "Ship, learn, iterate. Small bets compound into category-defining work." },
];

const testimonials = [
  {
    quote:
      "I joined as a junior engineer and within 18 months was leading a product line. The growth here is real, not theoretical.",
    name: "Tasnim R.",
    role: "Engineering Lead",
  },
  {
    quote:
      "It's the rare workplace where designers, engineers and consultants actually sit at the same table on day one.",
    name: "Arif H.",
    role: "Product Designer",
  },
  {
    quote:
      "The clients are ambitious, the standards are high, and the team has your back. That combination is hard to find.",
    name: "Nabila K.",
    role: "Senior Consultant",
  },
];

const faqs = [
  {
    q: "Do I need to live in Dhaka?",
    a: "Many roles are hybrid or remote-friendly within Bangladesh. Each listing notes the expected location and travel pattern.",
  },
  {
    q: "What's your interview process like?",
    a: "Most roles involve a recruiter screen, a hiring-manager conversation and one practical exercise. We aim to wrap within two weeks of applying.",
  },
  {
    q: "I'm a fresh graduate — should I apply?",
    a: "Yes. We hire interns and entry-level talent across teams. Lead with the projects you've shipped and what you want to learn next.",
  },
  {
    q: "Can I apply to more than one role?",
    a: "Please apply to the single role that fits you best. Our recruiters route strong candidates internally if another team is a better match.",
  },
  {
    q: "Don't see a role that fits?",
    a: "Email yessbangla.bd@gmail.com with your CV and a short note on the work you want to do — we keep an active talent network.",
  },
];

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(30)
    .regex(/^[0-9+\-\s()]+$/, "Use digits, spaces, +, -, ( and ) only"),
  location: z
    .string()
    .trim()
    .min(2, "Please enter your city / country")
    .max(120, "Please keep it under 120 characters"),
  linkedin: z
    .string()
    .trim()
    .max(255)
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  coverLetter: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters")
    .max(2000, "Please keep it under 2000 characters"),
});

type Errors = Partial<Record<keyof z.infer<typeof applicationSchema> | "resume" | "job" | "desiredRole", string>>;

function Careers() {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchSummary, setSearchSummary] = useState(true);
  const [searchDuties, setSearchDuties] = useState(true);
  const [filterType, setFilterType] = useState<string>("All");
  const [filterLocation, setFilterLocation] = useState<string>("All");
  const [filterDept, setFilterDept] = useState<string>("All");
  const [filterLevel, setFilterLevel] = useState<string>("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string | null; createdAt: string; email: string } | null>(null);

  const openApplication = useMemo(
    () => ({
      slug: "open-application",
      title: "Open Application — role not listed",
      type: "Any",
      location: "Any",
      dept: "General",
      level: "Any" as const,
      summary:
        "Don't see a role that matches? Send us your CV and tell us about the work you'd love to do — we'll route it to the right team.",
      responsibilities: [
        "Tell us the kind of work you want to do.",
        "Share examples of projects you've shipped or contributed to.",
      ],
      requirements: [
        "A short cover note explaining your interest and strengths.",
        "An up-to-date CV (PDF, DOC, or DOCX).",
      ],
    }),
    [],
  );

  const selectedJob = useMemo(
    () => {
      if (selectedSlug === openApplication.slug) return openApplication as unknown as (typeof openings)[number];
      return openings.find((o) => o.slug === selectedSlug) ?? null;
    },
    [selectedSlug, openApplication],
  );

  const facets = useMemo(() => {
    const uniq = (arr: string[]) => Array.from(new Set(arr)).sort();
    return {
      types: ["All", ...uniq(openings.map((o) => o.type))],
      locations: ["All", ...uniq(openings.map((o) => o.location))],
      depts: ["All", ...uniq(openings.map((o) => o.dept))],
      levels: ["All", ...uniq(openings.map((o) => o.level))],
    };
  }, []);

  const filtered = useMemo(() => {
    const norm = (s: string) =>
      s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const q = norm(query.trim());
    const has = (s: string) => norm(s).includes(q);
    return openings.filter((o) => {
      if (filterType !== "All" && o.type !== filterType) return false;
      if (filterLocation !== "All" && o.location !== filterLocation) return false;
      if (filterDept !== "All" && o.dept !== filterDept) return false;
      if (filterLevel !== "All" && o.level !== filterLevel) return false;
      if (!q) return true;
      if (has(o.title) || has(o.dept) || has(o.location) || has(o.level) || has(o.type))
        return true;
      if (searchSummary && has(o.summary)) return true;
      if (
        searchDuties &&
        (o.responsibilities.some(has) || o.requirements.some(has))
      )
        return true;
      return false;
    });
  }, [query, filterType, filterLocation, filterDept, filterLevel, searchSummary, searchDuties]);

  const activeFilterCount =
    (filterType !== "All" ? 1 : 0) +
    (filterLocation !== "All" ? 1 : 0) +
    (filterDept !== "All" ? 1 : 0) +
    (filterLevel !== "All" ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  // Reset to page 1 whenever filters/search change
  const filtersKey = `${query}|${filterType}|${filterLocation}|${filterDept}|${filterLevel}|${searchSummary}|${searchDuties}`;
  const lastKeyRef = useRef(filtersKey);
  if (lastKeyRef.current !== filtersKey) {
    lastKeyRef.current = filtersKey;
    if (page !== 1) setPage(1);
  }

  const resetFilters = () => {
    setFilterType("All");
    setFilterLocation("All");
    setFilterDept("All");
    setFilterLevel("All");
    setQuery("");
    setPage(1);
  };

  const proceedToForm = () => {
    if (!selectedSlug) {
      setErrors({ job: "Please select a position to continue." });
      return;
    }
    setErrors({});
    setStep(2);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById("application-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const validateResume = (file: File | null): string | null => {
    if (!file) return "Please attach your CV / resume (PDF, DOC, or DOCX).";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const extOk = ["pdf", "doc", "docx"].includes(ext);
    const typeOk = ALLOWED_TYPES.includes(file.type);
    if (!extOk && !typeOk) {
      return `Unsupported file type${ext ? ` (.${ext})` : ""}. Please upload a PDF, DOC, or DOCX file.`;
    }
    if (file.size === 0) return "This file appears to be empty. Please choose a different file.";
    if (file.size > MAX_RESUME_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      return `File is too large (${mb} MB). Maximum allowed size is 5 MB.`;
    }
    return null;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setResume(f);
    const err = validateResume(f);
    setErrors((prev) => ({ ...prev, resume: err ?? undefined }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJob) {
      setStep(1);
      setErrors({ job: "Please select a position first." });
      return;
    }
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      fullName: String(fd.get("fullName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      location: String(fd.get("location") ?? ""),
      linkedin: String(fd.get("linkedin") ?? ""),
      coverLetter: String(fd.get("coverLetter") ?? ""),
    };
    const parsed = applicationSchema.safeParse(raw);
    const resumeErr = validateResume(resume);
    const isOpen = selectedJob.slug === "open-application";
    const desiredRole = String(fd.get("desiredRole") ?? "").trim();
    let desiredRoleErr: string | null = null;
    if (isOpen) {
      if (desiredRole.length < 2) desiredRoleErr = "Please tell us the role you're interested in.";
      else if (desiredRole.length > 120) desiredRoleErr = "Please keep it under 120 characters.";
    }

    if (!parsed.success || resumeErr || desiredRoleErr) {
      const fieldErrors: Errors = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof Errors;
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
      }
      if (resumeErr) fieldErrors.resume = resumeErr;
      if (desiredRoleErr) (fieldErrors as Errors & { desiredRole?: string }).desiredRole = desiredRoleErr;
      setErrors(fieldErrors);
      return;
    }

    const finalJobTitle = isOpen ? `Open Application — ${desiredRole}` : selectedJob.title;

    setSubmitting(true);
    try {
      const fdOut = new FormData();
      fdOut.set("jobSlug", selectedJob.slug);
      fdOut.set("jobTitle", finalJobTitle);
      fdOut.set("fullName", parsed.data.fullName);
      fdOut.set("email", parsed.data.email);
      fdOut.set("phone", parsed.data.phone);
      if (parsed.data.location) fdOut.set("location", parsed.data.location);
      if (parsed.data.linkedin) fdOut.set("linkedin", parsed.data.linkedin);
      fdOut.set("coverLetter", parsed.data.coverLetter);
      fdOut.set("resume", resume!);
      const result = await submitJobApplicationAction(fdOut);
      if (!result.ok) throw new Error(result.error);
      const newId = result.id ?? null;
      setReceipt({
        id: newId,
        createdAt: result.createdAt ?? new Date().toISOString(),
        email: parsed.data.email,
      });
      // Save lookup credentials so the tracker auto-fills on return visits
      if (typeof window !== "undefined" && newId) {
        try {
          window.localStorage.setItem(
            "yess:lastApplication",
            JSON.stringify({ ref: newId.slice(0, 8).toUpperCase(), email: parsed.data.email, savedAt: Date.now() }),
          );
        } catch {
          /* ignore quota/private-mode errors */
        }
      }
      toast.success("Application submitted", {
        description: newId
          ? `Reference ${newId.slice(0, 8).toUpperCase()} — confirmation sent to ${parsed.data.email}.`
          : `Confirmation sent to ${parsed.data.email}.`,
      });
      setStep(3);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          document.getElementById("application-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setErrors({ resume: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        page="careers"
        eyebrow={t("pages.careers.eyebrow")}
        title={t("pages.careers.title")}
        subtitle={t("pages.careers.subtitle")}
      />

      {/* Stats strip */}
      <section className="border-b border-border bg-secondary/30 py-10">
        <div className="container-tight">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Application flow */}
      <section id="application-flow" className="py-16 sm:py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-3xl">
            <Stepper step={step} />
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            {step === 1 && (
              <StepSelect
                openings={paged}
                filteredCount={filtered.length}
                allCount={openings.length}
                page={safePage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  if (typeof window !== "undefined") {
                    window.requestAnimationFrame(() => {
                      document.getElementById("application-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }
                }}
                query={query}
                setQuery={setQuery}
                searchSummary={searchSummary}
                setSearchSummary={setSearchSummary}
                searchDuties={searchDuties}
                setSearchDuties={setSearchDuties}
                selectedSlug={selectedSlug}
                onSelect={(slug) => {
                  setSelectedSlug((prev) => (prev === slug ? null : slug));
                  setErrors((p) => ({ ...p, job: undefined }));
                }}
                onContinue={proceedToForm}
                error={errors.job}
                facets={facets}
                filterType={filterType}
                filterLocation={filterLocation}
                filterDept={filterDept}
                filterLevel={filterLevel}
                setFilterType={setFilterType}
                setFilterLocation={setFilterLocation}
                setFilterDept={setFilterDept}
                setFilterLevel={setFilterLevel}
                activeFilterCount={activeFilterCount}
                resetFilters={resetFilters}
              />
            )}

            {step === 2 && selectedJob && (
              <StepForm
                job={selectedJob}
                isOpenApplication={selectedJob.slug === "open-application"}
                onBack={() => setStep(1)}
                onSubmit={onSubmit}
                resume={resume}
                onFileChange={onFileChange}
                clearResume={() => {
                  setResume(null);
                  setErrors((p) => ({ ...p, resume: undefined }));
                }}
                errors={errors}
                submitting={submitting}
              />
            )}

            {step === 3 && selectedJob && (
              <StepSuccess
                job={selectedJob}
                receipt={receipt}
                isOpenApplication={selectedJob.slug === "open-application"}
                onAnother={() => {
                  setStep(1);
                  setSelectedSlug(null);
                  setResume(null);
                  setErrors({});
                  setReceipt(null);
                }}
              />)}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-t border-border py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why YESS Bangla</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              A workplace built for ambition.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="rounded-2xl glass-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring process */}
      <section className="border-t border-border py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How we hire</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              A clear, respectful process.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Most candidates go from application to offer in two to three weeks. You'll always know where you stand.
            </p>
          </div>
          <ol className="relative mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {hiringSteps.map((s, idx) => (
              <li key={s.title} className="rounded-2xl glass-card p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {idx + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">What we value</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              The principles behind the work.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl glass-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border py-20">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Voices from the team</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Why people stay and grow here.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="flex h-full flex-col rounded-2xl glass-card p-6">
                <Quote className="h-6 w-6 text-primary" aria-hidden />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4">
                  <p className="font-display text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-20">
        <div className="container-tight max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered.
            </h2>
          </div>
          <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl glass-card">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold sm:text-base">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-20">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl glass-card p-8 text-center sm:p-12">
            <div className="mx-auto max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Don't see your role?</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                We're always meeting great people.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground sm:text-base">
                Send your CV and a short note about the work you want to do. We'll keep you in mind as new
                roles open across engineering, design, consulting and operations.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="mailto:yessbangla.bd@gmail.com?subject=General%20application%20—%20YESS%20Bangla"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  <Mail className="h-4 w-4" /> Email our recruiters
                </a>
                <a
                  href="#application-flow"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary/40"
                >
                  Browse open roles <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------- Stepper ---------------- */

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Select position" },
    { n: 2, label: "Your details" },
    { n: 3, label: "Submitted" },
  ];
  return (
    <ol className="flex items-center justify-between gap-2 sm:gap-4">
      {items.map((it, idx) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <li key={it.n} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div
              className={
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors " +
                (done
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : active
                  ? "bg-foreground text-background"
                  : "border border-border bg-background text-muted-foreground")
              }
            >
              {done ? <Check className="h-4 w-4" /> : it.n}
            </div>
            <span
              className={
                "hidden text-xs font-medium sm:inline " +
                (active || done ? "text-foreground" : "text-muted-foreground")
              }
            >
              {it.label}
            </span>
            {idx < items.length - 1 && (
              <div
                className={
                  "ml-1 h-px flex-1 transition-colors sm:ml-2 " +
                  (step > it.n ? "bg-primary/60" : "bg-border")
                }
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Step 1: Select ---------------- */

function StepSelect({
  openings,
  filteredCount,
  allCount,
  page,
  totalPages,
  onPageChange,
  query,
  setQuery,
  searchSummary,
  setSearchSummary,
  searchDuties,
  setSearchDuties,
  selectedSlug,
  onSelect,
  onContinue,
  error,
  facets,
  filterType,
  filterLocation,
  filterDept,
  filterLevel,
  setFilterType,
  setFilterLocation,
  setFilterDept,
  setFilterLevel,
  activeFilterCount,
  resetFilters,
}: {
  openings: typeof import("@/data/openings").openings;
  filteredCount: number;
  allCount: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  query: string;
  setQuery: (s: string) => void;
  searchSummary: boolean;
  setSearchSummary: (v: boolean) => void;
  searchDuties: boolean;
  setSearchDuties: (v: boolean) => void;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onContinue: () => void;
  error?: string;
  facets: { types: string[]; locations: string[]; depts: string[]; levels: string[] };
  filterType: string;
  filterLocation: string;
  filterDept: string;
  filterLevel: string;
  setFilterType: (s: string) => void;
  setFilterLocation: (s: string) => void;
  setFilterDept: (s: string) => void;
  setFilterLevel: (s: string) => void;
  activeFilterCount: number;
  resetFilters: () => void;
}) {
  return (
    <div className="rounded-3xl glass-card p-6 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step 1</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Find your role
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Type a keyword — title, skill, team or location.
        </p>
      </div>

      {/* Big, friendly search */}
      <div className="mt-5">
        <label htmlFor="job-search" className="sr-only">Search openings</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="job-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "engineer", "design", "Dhaka"'
            className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-12 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Quick chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick search:
          </span>
          {["Engineering", "Design", "Remote", "Internship"].map((chip) => {
            const active = query.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(active ? "" : chip)}
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                }
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Search scope toggles */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Also search in:
          </span>
          {[
            { label: "Summary", value: searchSummary, set: setSearchSummary },
            { label: "Responsibilities & Requirements", value: searchDuties, set: setSearchDuties },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              role="switch"
              aria-checked={t.value}
              onClick={() => t.set(!t.value)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                (t.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground")
              }
            >
              <span
                className={
                  "grid h-3.5 w-3.5 place-items-center rounded-full border " +
                  (t.value ? "border-primary bg-primary text-primary-foreground" : "border-border")
                }
                aria-hidden
              >
                {t.value && <Check className="h-2.5 w-2.5" />}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters */}
      <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Refine results
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Type" value={filterType} onChange={setFilterType} options={facets.types} />
          <FilterSelect label="Location" value={filterLocation} onChange={setFilterLocation} options={facets.locations} />
          <FilterSelect label="Department" value={filterDept} onChange={setFilterDept} options={facets.depts} />
          <FilterSelect label="Level" value={filterLevel} onChange={setFilterLevel} options={facets.levels} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {openings.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No openings match your search.
          </div>
        ) : (
          openings.map((o) => {
            const active = selectedSlug === o.slug;
            return (
              <button
                key={o.slug}
                type="button"
                onClick={() => onSelect(o.slug)}
                aria-pressed={active}
                className={
                  "group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all " +
                  (active
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border bg-background hover:border-primary/40 hover:bg-secondary/40")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <Briefcase className="h-3.5 w-3.5" />
                    {o.dept}
                  </div>
                  <div
                    className={
                      "grid h-5 w-5 place-items-center rounded-full border transition-colors " +
                      (active ? "border-primary bg-primary text-primary-foreground" : "border-border")
                    }
                    aria-hidden
                  >
                    {active && <Check className="h-3 w-3" />}
                  </div>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug">{o.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{o.summary}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {o.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {o.type}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
                    {o.level}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Open application — outside listed categories */}
      <button
        type="button"
        onClick={() => onSelect("open-application")}
        aria-pressed={selectedSlug === "open-application"}
        className={
          "mt-4 flex w-full flex-col items-start gap-2 rounded-2xl border-2 border-dashed p-5 text-left transition-all sm:flex-row sm:items-center sm:justify-between " +
          (selectedSlug === "open-application"
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-border hover:border-primary/50 hover:bg-secondary/40")
        }
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Don't see your role?
            </p>
            <h3 className="mt-1 font-display text-base font-semibold leading-snug">
              Submit an open application
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Send your CV with a short note — we keep an active talent network across teams.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold">
          {selectedSlug === "open-application" ? (
            <><Check className="h-3.5 w-3.5 text-primary" /> Selected</>
          ) : (
            <>Choose <ArrowRight className="h-3.5 w-3.5" /></>
          )}
        </span>
      </button>

      {error && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}

      <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">
          {filteredCount === 0
            ? `No roles match · ${allCount} total open`
            : `Showing ${openings.length} of ${filteredCount} match${filteredCount > 1 ? "es" : ""} · ${allCount} total open`}
        </p>
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
          {selectedSlug && (
            <button
              type="button"
              onClick={() => onSelect(selectedSlug)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <XCircle className="h-3.5 w-3.5" /> Clear selection
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedSlug}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to application <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 2: Form ---------------- */

function StepForm({
  job,
  isOpenApplication,
  onBack,
  onSubmit,
  resume,
  onFileChange,
  clearResume,
  errors,
  submitting,
}: {
  job: (typeof openings)[number];
  isOpenApplication: boolean;
  onBack: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  resume: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearResume: () => void;
  errors: Errors;
  submitting: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-3xl glass-card p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step 2</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Your details</h2>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Change role
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          All fields marked * are required. Your information is used only to evaluate this application.
        </p>

        {isOpenApplication && (
          <div className="mt-6">
            <Field
              label="Desired role *"
              error={errors.desiredRole}
              htmlFor="desiredRole"
            >
              <input
                id="desiredRole"
                name="desiredRole"
                type="text"
                maxLength={120}
                required
                placeholder="e.g. Senior Brand Designer, Data Analyst…"
                className={inputClass(!!errors.desiredRole)}
              />
            </Field>
            <p className="mt-1 text-xs text-muted-foreground">
              Tell us the role or area you'd like to be considered for.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name *" error={errors.fullName} htmlFor="fullName">
            <input id="fullName" name="fullName" type="text" autoComplete="name" maxLength={100} required className={inputClass(!!errors.fullName)} />
          </Field>
          <Field label="Email *" error={errors.email} htmlFor="email">
            <input id="email" name="email" type="email" autoComplete="email" maxLength={255} required className={inputClass(!!errors.email)} />
          </Field>
          <Field label="Phone *" error={errors.phone} htmlFor="phone">
            <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} required className={inputClass(!!errors.phone)} />
          </Field>
          <Field label="Location *" error={errors.location} htmlFor="location">
            <input id="location" name="location" type="text" autoComplete="address-level2" maxLength={120} required placeholder="City, Country" className={inputClass(!!errors.location)} />
          </Field>
          <Field label="LinkedIn / portfolio" error={errors.linkedin} htmlFor="linkedin">
            <input id="linkedin" name="linkedin" type="url" inputMode="url" maxLength={255} placeholder="https://" className={inputClass(!!errors.linkedin)} />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Cover letter *" error={errors.coverLetter} htmlFor="coverLetter">
            <textarea
              id="coverLetter"
              name="coverLetter"
              rows={6}
              maxLength={2000}
              required
              placeholder="Tell us why you're a great fit for this role…"
              className={inputClass(!!errors.coverLetter) + " min-h-[140px] resize-y"}
            />
          </Field>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium">Resume / CV *</label>
          <p className="mt-1 text-xs text-muted-foreground">PDF or Word — up to 5 MB.</p>
          <div className="mt-2">
            {resume ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{resume.name}</p>
                    <p className="text-xs text-muted-foreground">{(resume.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearResume}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="resume"
                className={
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-secondary/40 " +
                  (errors.resume ? "border-destructive/60" : "border-border")
                }
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Click to upload your CV</span>
                <span className="text-xs text-muted-foreground">PDF, DOC, DOCX · max 5 MB</span>
              </label>
            )}
            <input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={onFileChange}
            />
            {errors.resume && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.resume}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading & submitting…
            </>
          ) : (
            <>
              Submit application <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-muted-foreground">
          By submitting, you agree to our{" "}
          <Link to="/privacy" className="underline">privacy policy</Link>.
        </p>
      </form>

      <aside className="space-y-6">
        <div className="rounded-3xl glass-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Applying for
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{job.title}</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.dept}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {job.type}</span>
          </div>
          <p className="mt-3 text-sm text-foreground/80">{job.summary}</p>
        </div>

        <details className="group rounded-3xl glass-card p-6">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
            What you'll do
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85">
            {job.responsibilities.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </details>

        <details className="group rounded-3xl glass-card p-6">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
            What we're looking for
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-foreground/85">
            {job.requirements.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {r}
              </li>
            ))}
          </ul>
        </details>
      </aside>
    </div>
  );
}

/* ---------------- Step 3: Success ---------------- */

function StepSuccess({
  job,
  receipt,
  isOpenApplication,
  onAnother,
}: {
  job: (typeof openings)[number];
  receipt: { id: string | null; createdAt: string; email: string } | null;
  isOpenApplication: boolean;
  onAnother: () => void;
}) {
  const refId = receipt?.id ? receipt.id.slice(0, 8).toUpperCase() : "—";
  const submittedAt = receipt?.createdAt
    ? new Date(receipt.createdAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Just now";

  const tracker = isOpenApplication
    ? [
        { title: "Submitted", desc: "We've received your CV and cover note.", done: true, current: true },
        { title: "Talent network review", desc: "Within 7–10 business days, our recruiters route your profile to relevant teams." },
        { title: "Team match", desc: "If a hiring manager wants to connect, we'll email you to schedule an intro call." },
        { title: "Stay in touch", desc: "We keep your profile on file for 12 months and reach out when a fit opens." },
      ]
    : [
        { title: "Submitted", desc: "We've received your application for this role.", done: true, current: true },
        { title: "Recruiter screen", desc: "Reviewed within 5–7 business days. You'll hear back either way." },
        { title: "Interview", desc: "1–2 conversations with the hiring manager and team." },
        { title: "Decision & offer", desc: "Reference checks, transparent comp talk, and a written offer." },
      ];

  return (
    <div className="mx-auto max-w-2xl rounded-3xl glass-card p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        {isOpenApplication ? (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Send className="h-3 w-3" /> Open application
          </span>
        ) : (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="h-3 w-3" /> Role application
          </span>
        )}
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {isOpenApplication ? "Thanks — your CV is in!" : "Application received"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {isOpenApplication ? (
            <>We'll keep your profile in our talent network and reach out when a matching role opens.</>
          ) : (
            <>Thanks for applying to <span className="font-semibold text-foreground">{job.title}</span>. We review every submission carefully.</>
          )}
        </p>
      </div>

      {/* Receipt */}
      <dl className="mt-6 grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</dt>
          <dd className="mt-1 font-mono text-sm font-semibold">{refId}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Submitted</dt>
          <dd className="mt-1 text-sm">{submittedAt}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Confirmation to</dt>
          <dd className="mt-1 truncate text-sm">{receipt?.email ?? "—"}</dd>
        </div>
      </dl>

      {/* Tracker */}
      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          What happens next
        </p>
        <ol className="mt-3 space-y-3">
          {tracker.map((t, i) => (
            <li key={t.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold " +
                    (t.done
                      ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                      : t.current
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground")
                  }
                  aria-hidden
                >
                  {t.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < tracker.length - 1 && (
                  <div className="mt-1 h-full min-h-[18px] w-px bg-border" aria-hidden />
                )}
              </div>
              <div className="pb-2">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-semibold">Track your application</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use your reference <span className="font-mono font-semibold text-foreground">{refId}</span> and the email{" "}
          <span className="font-semibold text-foreground">{receipt?.email ?? "—"}</span> to see live status updates.
        </p>
        <Link
          to="/application-status"
          search={{ ref: refId, email: receipt?.email ?? "" }}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background px-4 py-2 text-xs font-semibold text-primary"
        >
          Open status tracker <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Questions? Email{" "}
        <a className="text-primary underline" href="mailto:yessbangla.bd@gmail.com">
          yessbangla.bd@gmail.com
        </a>{" "}
        and quote your reference <span className="font-mono font-semibold text-foreground">{refId}</span>.
      </p>

      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          {isOpenApplication ? "Apply to a listed role" : "Apply for another role"}
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Field + input ---------------- */

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return (
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary " +
    (hasError ? "border-destructive/60" : "border-border")
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-3 pr-9 text-sm outline-none transition-colors focus:border-primary"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  const add = (p: number | "…") => pages.push(p);
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      add(i);
    } else if (pages[pages.length - 1] !== "…") {
      add("…");
    }
  }
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav
      aria-label="Job listings pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} border-border text-muted-foreground hover:text-foreground`}
        aria-label="Previous page"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`e-${idx}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              btn +
              " " +
              (p === page
                ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                : "border-border text-foreground/80 hover:bg-secondary/40")
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btn} border-border text-muted-foreground hover:text-foreground`}
        aria-label="Next page"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
