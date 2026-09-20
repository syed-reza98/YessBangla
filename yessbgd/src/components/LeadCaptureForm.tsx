"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import {
  submitLeadFormAction,
  type LeadFormState,
} from "@/actions/public";

const initialState: LeadFormState = { ok: false };

export function LeadCaptureForm({
  variant = "light",
  source = "Final CTA",
  className = "",
}: {
  variant?: "light" | "onPrimary";
  /** Stored in subject field for routing/analytics */
  source?: string;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    submitLeadFormAction,
    initialState
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true);
      formRef.current?.reset();
    }
  }, [state]);

  const onPrimary = variant === "onPrimary";
  const inputBase = onPrimary
    ? "w-full rounded-lg border border-primary-foreground/30 bg-background/10 px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:ring-2 focus:ring-primary-foreground/40"
    : "w-full rounded-lg border border-glass-border bg-white/60 dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20";
  const labelCls = onPrimary
    ? "text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/85"
    : "text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground";

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className={`text-left ${className}`}
    >
      <input type="hidden" name="source" value={source} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="name"
          labelCls={labelCls}
          inputCls={inputBase}
          error={errors.name}
          autoComplete="name"
        />
        <Field
          label="Work email"
          name="email"
          type="email"
          labelCls={labelCls}
          inputCls={inputBase}
          error={errors.email}
          autoComplete="email"
        />
        <Field
          label="Company"
          name="company"
          labelCls={labelCls}
          inputCls={inputBase}
          error={errors.company}
          autoComplete="organization"
        />
        <Field
          label="Country / role"
          name="role"
          labelCls={labelCls}
          inputCls={inputBase}
          optional
          autoComplete="organization-title"
        />
      </div>
      <div className="mt-4">
        <label className={labelCls} htmlFor="lcf-requirements">
          Your requirements
        </label>
        <textarea
          id="lcf-requirements"
          name="requirements"
          rows={4}
          maxLength={3000}
          placeholder="Briefly describe your goals, scope and timeline…"
          className={inputBase + " mt-1.5 min-h-[110px] resize-y"}
        />
        {errors.requirements && (
          <p
            className={
              (onPrimary ? "text-primary-foreground/90" : "text-destructive") +
              " mt-1.5 inline-flex items-center gap-1.5 text-xs"
            }
          >
            <AlertCircle className="h-3.5 w-3.5" /> {errors.requirements}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={
            (onPrimary
              ? "bg-background text-foreground"
              : "bg-gradient-primary text-primary-foreground shadow-glow") +
            " inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          }
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              Request callback <Send className="h-4 w-4" />
            </>
          )}
        </button>
        <p
          className={
            (onPrimary ? "text-primary-foreground/80" : "text-muted-foreground") +
            " text-xs"
          }
        >
          We respond within 1 business day. NDA available on request.
        </p>
      </div>

      {showSuccess && state.ok && (
        <p
          role="status"
          className={
            (onPrimary
              ? "bg-background/15 text-primary-foreground"
              : "bg-primary/10 text-primary") +
            " mt-4 inline-flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          }
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Thank you — your enquiry has been received. We&apos;ll be in touch
          shortly.
        </p>
      )}
      {!state.ok && state.error && (
        <p
          role="alert"
          className={
            (onPrimary
              ? "bg-background/15 text-primary-foreground"
              : "bg-destructive/10 text-destructive") +
            " mt-4 inline-flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
          }
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  labelCls,
  inputCls,
  optional,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  labelCls: string;
  inputCls: string;
  optional?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={`lcf-${name}`}>
        {label}
        {!optional && " *"}
      </label>
      <input
        id={`lcf-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        className={inputCls + " mt-1.5"}
      />
      {error && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
