"use client";

import { Link } from "@tanstack/react-router";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  submitJobApplicationFormAction,
  type JobApplyFormState,
} from "@/actions/public";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { openings, type Opening } from "@/data/openings";

export function CareersApplyNotFound() {
  return (
    <section className="py-24">
      <div className="container-tight max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Position not found</h1>
        <p className="mt-3 text-muted-foreground">
          This role may have been filled or the link is incorrect.
        </p>
        <Link
          to="/careers"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all openings
        </Link>
      </div>
    </section>
  );
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
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

type Errors = Partial<Record<keyof z.infer<typeof applicationSchema> | "resume", string>>;

const initialApplyState: JobApplyFormState = { ok: false };

export function CareersApplyPage({ job }: { job: Opening }) {
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const boundAction = async (prev: JobApplyFormState, formData: FormData) => {
    formData.set("jobSlug", job.slug);
    formData.set("jobTitle", job.title);
    if (resume) formData.set("resume", resume);
    return submitJobApplicationFormAction(prev, formData);
  };

  const [state, formAction, pending] = useActionState(
    boundAction,
    initialApplyState
  );

  useEffect(() => {
    if (state.ok) setSubmitted(true);
    else if (state.error) setErrors({ resume: state.error });
  }, [state]);

  const validateResume = (file: File | null): string | null => {
    if (!file) return "Please attach your CV / resume (PDF, DOC, or DOCX).";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const extOk = ["pdf", "doc", "docx"].includes(ext);
    const typeOk = ALLOWED_TYPES.includes(file.type);
    if (!extOk && !typeOk) {
      return `Unsupported file type${ext ? ` (.${ext})` : ""}. Please upload a PDF, DOC, or DOCX file.`;
    }
    if (file.size === 0) {
      return "This file appears to be empty. Please choose a different file.";
    }
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

  const onValidate = (e: FormEvent<HTMLFormElement>) => {
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      fullName: String(fd.get("fullName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      linkedin: String(fd.get("linkedin") ?? ""),
      coverLetter: String(fd.get("coverLetter") ?? ""),
    };
    const parsed = applicationSchema.safeParse(raw);
    const resumeErr = validateResume(resume);

    if (!parsed.success || resumeErr) {
      e.preventDefault();
      const fieldErrors: Errors = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof Errors;
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
      }
      if (resumeErr) fieldErrors.resume = resumeErr;
      setErrors(fieldErrors);
    }
  };

  if (submitted) {
    return (
      <>
        <PageHero
          eyebrow="Application received"
          title={`Thank you for applying to ${job.title}.`}
          subtitle="Our recruiting team reviews every submission and will reach out within 5–7 business days if your background is a fit."
        />
        <section className="pb-24">
          <div className="container-tight max-w-xl">
            <div className="rounded-2xl glass-card p-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                We've recorded your application for <span className="font-semibold text-foreground">{job.title}</span>.
                If you don't hear back within two weeks, feel free to follow up at{" "}
                <a className="text-primary underline" href="mailto:yessbangla.bd@gmail.com">
                  yessbangla.bd@gmail.com
                </a>
                .
              </p>
              <Link
                to="/careers"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Back to careers
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={job.dept}
        title={`Apply: ${job.title}`}
        subtitle={job.summary}
      />

      <section className="pb-24">
        <div className="container-tight grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <form
            action={formAction}
            onSubmit={onValidate}
            noValidate
            className="rounded-2xl glass-card p-6 sm:p-8"
          >
            <h2 className="font-display text-xl font-semibold">Your details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All fields marked * are required. Your information is used only to evaluate this application.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Full name *" error={errors.fullName} htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className={inputClass(!!errors.fullName)}
                />
              </Field>
              <Field label="Email *" error={errors.email} htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  required
                  className={inputClass(!!errors.email)}
                />
              </Field>
              <Field label="Phone *" error={errors.phone} htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={30}
                  required
                  className={inputClass(!!errors.phone)}
                />
              </Field>
              <Field label="LinkedIn / portfolio" error={errors.linkedin} htmlFor="linkedin">
                <input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  inputMode="url"
                  maxLength={255}
                  placeholder="https://"
                  className={inputClass(!!errors.linkedin)}
                />
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

            {/* File upload */}
            <div className="mt-5">
              <label className="text-sm font-medium">Resume / CV *</label>
              <p className="mt-1 text-xs text-muted-foreground">PDF or Word — up to 5 MB.</p>
              <div className="mt-2">
                {resume ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-white/60 p-3 backdrop-blur dark:bg-white/5">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{resume.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resume.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setResume(null);
                        setErrors((p) => ({ ...p, resume: undefined }));
                      }}
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
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>

            <p className="mt-4 text-xs text-muted-foreground">
              By submitting, you agree to our{" "}
              <Link to="/privacy" className="underline">
                privacy policy
              </Link>
              .
            </p>
          </form>

          {/* Job summary */}
          <aside className="space-y-6">
            <div className="rounded-2xl glass-card p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <Briefcase className="h-3.5 w-3.5" />
                {job.dept}
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">{job.title}</h3>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {job.type}
                </span>
              </div>
            </div>

            <div className="rounded-2xl glass-card p-6">
              <h4 className="font-display text-sm font-semibold">What you'll do</h4>
              <ul className="mt-3 space-y-2 text-sm text-foreground/85">
                {job.responsibilities.map((r: string) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl glass-card p-6">
              <h4 className="font-display text-sm font-semibold">What we're looking for</h4>
              <ul className="mt-3 space-y-2 text-sm text-foreground/85">
                {job.requirements.map((r: string) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/careers"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All openings ({openings.length})
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

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
    "w-full rounded-lg border bg-white/60 backdrop-blur px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 dark:bg-white/5 " +
    (hasError
      ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
      : "border-glass-border focus:border-primary focus:ring-primary/20")
  );
}
