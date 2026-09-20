"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  lookupApplicationAction,
  lookupApplicationFormAction,
  type LookupFormState,
} from "@/actions/public";
import { PageHero } from "@/components/PageHero";
import { Check, Search, Loader2, AlertCircle, ArrowRight, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react";

type Status =
  | "Submitted"
  | "Under review"
  | "Interview"
  | "Offer"
  | "Hired"
  | "On hold"
  | "Rejected"
  | "New"
  | "Reviewed";

type Application = {
  id: string;
  job_title: string;
  full_name: string;
  email: string;
  status: Status;
  status_note: string | null;
  status_updated_at: string;
  created_at: string;
};

// Canonical pipeline shown on the tracker
const PIPELINE: { key: Status; title: string; desc: string }[] = [
  { key: "Submitted", title: "Submitted", desc: "We've received your application." },
  { key: "Under review", title: "Under review", desc: "Our recruiters are reviewing your profile." },
  { key: "Interview", title: "Interview", desc: "You're invited for an interview round." },
  { key: "Offer", title: "Offer", desc: "An offer is on its way." },
  { key: "Hired", title: "Hired", desc: "Welcome to the team!" },
];

// Map legacy / side statuses into the pipeline progress index
function progressIndex(s: Status): number {
  switch (s) {
    case "Submitted":
    case "New":
      return 0;
    case "Under review":
    case "Reviewed":
      return 1;
    case "Interview":
      return 2;
    case "Offer":
      return 3;
    case "Hired":
      return 4;
    default:
      return 0;
  }
}

const STATUS_BADGE: Record<Status, string> = {
  Submitted: "border-primary/30 bg-primary/10 text-primary",
  "Under review": "border-primary/30 bg-primary/10 text-primary",
  Interview: "border-accent/30 bg-accent/15 text-accent-foreground",
  Offer: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Hired: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "On hold": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  New: "border-primary/30 bg-primary/10 text-primary",
  Reviewed: "border-primary/30 bg-primary/10 text-primary",
};

type ErrKind = "validation" | "network" | "server" | "notfound";

const initialLookupState: LookupFormState = { ok: false };

/** Client wrapper: offline gate, then FormData Server Action. */
async function lookupFormAction(
  prev: LookupFormState,
  formData: FormData,
): Promise<LookupFormState> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      ok: false,
      error: "You're offline.|Reconnect to the internet and try again.|network",
    };
  }
  return lookupApplicationFormAction(prev, formData);
}

function classifyActionError(message: string): {
  kind: ErrKind;
  message: string;
  detail?: string;
} {
  const parts = message.split("|");
  if (parts.length >= 3 && parts[2] === "network") {
    return { kind: "network", message: parts[0]!, detail: parts[1] };
  }
  if (/enter a valid email|reference must be/i.test(message)) {
    return { kind: "validation", message };
  }
  const isNet = /fetch|network|failed to fetch|networkerror|timeout|offline/i.test(message);
  if (isNet) {
    return { kind: "network", message: "Network problem reaching the server.", detail: message };
  }
  return { kind: "server", message: "The server couldn't process this lookup.", detail: message };
}

function readSavedLookup(): { ref: string; email: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("yess:lastApplication");
    if (!raw) return null;
    const v = JSON.parse(raw) as { ref?: string; email?: string };
    if (v && typeof v.ref === "string" && typeof v.email === "string") {
      return { ref: v.ref, email: v.email };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistLookup(parsedRef: string, parsedEmail: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      "yess:lastApplication",
      JSON.stringify({
        ref: parsedRef,
        email: parsedEmail,
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}

export function ApplicationStatusPage({
  initialRef,
  initialEmail,
}: {
  initialRef?: string;
  initialEmail?: string;
} = {}) {
  const { t } = useTranslation();
  const sp = { ref: initialRef, email: initialEmail };
  const saved = useMemo(() => readSavedLookup(), []);
  const [ref, setRef] = useState(sp.ref ?? saved?.ref ?? "");
  const [email, setEmail] = useState(sp.email ?? saved?.email ?? "");
  const autofilled = !sp.ref && !sp.email && !!saved;
  const [state, formAction, pending] = useActionState(lookupFormAction, initialLookupState);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ kind: ErrKind; message: string; detail?: string } | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [flash, setFlash] = useState(false);
  const prevSigRef = useRef<string | null>(null);
  const sawPendingRef = useRef(false);
  const autoStartedRef = useRef(false);

  const runLookup = async (
    parsedRef: string,
    parsedEmail: string,
  ): Promise<
    | { row: Application | null; error: null }
    | { row: null; error: { kind: Exclude<ErrKind, "validation" | "notfound">; message: string; detail?: string } }
  > => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return {
        row: null,
        error: {
          kind: "network",
          message: "You're offline.",
          detail: "Reconnect to the internet and try again.",
        },
      };
    }
    try {
      const result = await lookupApplicationAction({
        ref: parsedRef,
        email: parsedEmail,
      });
      if (!result.ok) {
        const msg = result.error || "Unknown server error";
        const isNet = /fetch|network|failed to fetch|networkerror|timeout/i.test(msg);
        return {
          row: null,
          error: isNet
            ? { kind: "network", message: "Network problem reaching the server.", detail: msg }
            : { kind: "server", message: "The server couldn't process this lookup.", detail: msg },
        };
      }
      const row = (result.data as Application | null) ?? null;
      return { row, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isNet = /fetch|network|failed to fetch|networkerror|timeout|abort/i.test(msg);
      return {
        row: null,
        error: isNet
          ? { kind: "network", message: "Couldn't reach the server.", detail: msg }
          : { kind: "server", message: "Something went wrong.", detail: msg },
      };
    }
  };

  const submitLookup = (parsedRef = ref, parsedEmail = email) => {
    const fd = new FormData();
    fd.set("ref", parsedRef);
    fd.set("email", parsedEmail);
    formAction(fd);
  };

  useEffect(() => {
    if (pending) {
      sawPendingRef.current = true;
      setError(null);
      setApp(null);
      prevSigRef.current = null;
      return;
    }
    if (!sawPendingRef.current) return;
    sawPendingRef.current = false;
    setLastChecked(new Date());

    if (!state.ok) {
      if (state.error) setError(classifyActionError(state.error));
      return;
    }
    const row = (state.data as Application | null) ?? null;
    if (!row) {
      setError({
        kind: "notfound",
        message: "No application matches that reference and email.",
        detail: "Double-check both values — the reference is the 8-character code from your confirmation.",
      });
      return;
    }
    prevSigRef.current = `${row.status}|${row.status_updated_at}`;
    setApp(row);
    persistLookup(ref, email);
  }, [pending, state, ref, email]);

  const clearSaved = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("yess:lastApplication");
      } catch {
        /* ignore */
      }
    }
    setRef("");
    setEmail("");
    setApp(null);
    setError(null);
    prevSigRef.current = null;
  };

  const refresh = async () => {
    if (!app || refreshing) return;
    setRefreshing(true);
    const { row } = await runLookup(ref, email);
    setRefreshing(false);
    setLastChecked(new Date());
    if (row) {
      const sig = `${row.status}|${row.status_updated_at}`;
      if (sig !== prevSigRef.current) {
        prevSigRef.current = sig;
        setFlash(true);
        setTimeout(() => setFlash(false), 1600);
      }
      setApp(row);
    }
  };

  useEffect(() => {
    if (autoStartedRef.current) return;
    if ((sp.ref && sp.email) || (saved && ref && email)) {
      autoStartedRef.current = true;
      submitLookup(ref, email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!app?.id) return;
    const tick = () => {
      if (document.hidden || !navigator.onLine) return;
      void refresh();
    };
    const t = setInterval(tick, 20000);
    const onVis = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id, ref, email]);

  const refDisplay = useMemo(() => (app ? app.id.slice(0, 8).toUpperCase() : ""), [app]);

  return (
    <>
      <PageHero
        eyebrow={t("pages.applicationStatus.eyebrow")}
        title={t("pages.applicationStatus.title")}
        subtitle={t("pages.applicationStatus.subtitle")}
      />
      <section className="pb-24">
        <div className="container-tight max-w-3xl">
          <form action={formAction} className="rounded-2xl glass-card p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Reference ID
                </label>
                <input
                  name="ref"
                  value={ref}
                  onChange={(e) => setRef(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60 sm:w-auto"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Track
                </button>
              </div>
            </div>

            {autofilled && !app && !error && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary" />
                Filled from your last application.
                <button
                  type="button"
                  onClick={clearSaved}
                  className="ml-1 font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Clear
                </button>
              </p>
            )}

            {error && (() => {
              const palette =
                error.kind === "validation"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : error.kind === "notfound"
                    ? "border-border bg-secondary/40 text-foreground"
                    : error.kind === "network"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-destructive/30 bg-destructive/10 text-destructive";
              const Icon =
                error.kind === "network" ? WifiOff : error.kind === "notfound" ? Search : AlertCircle;
              const heading =
                error.kind === "validation"
                  ? "Check your inputs"
                  : error.kind === "network"
                    ? "Connection problem"
                    : error.kind === "notfound"
                      ? "Not found"
                      : "Server error";
              const canRetry = error.kind === "network" || error.kind === "server";
              return (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`mt-3 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${palette}`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{heading}</p>
                    <p className="mt-0.5 opacity-90">{error.message}</p>
                    {error.detail && (
                      <p className="mt-1 break-words font-mono text-[10px] opacity-70">
                        {error.detail}
                      </p>
                    )}
                    {canRetry && (
                      <button
                        type="button"
                        onClick={() => submitLookup()}
                        disabled={pending}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-current bg-background/60 px-3 py-1 font-semibold hover:bg-background disabled:opacity-60"
                      >
                        <RefreshCw className={"h-3 w-3 " + (pending ? "animate-spin" : "")} />
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </form>

          {pending && !app && (
            <div className="mt-6 rounded-3xl glass-card p-6 sm:p-8" aria-busy="true" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-48 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-64 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-6 space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 flex-1 animate-pulse rounded-full bg-muted" />
                  </div>
                ))}
              </div>
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking up your application…
              </p>
            </div>
          )}

          {app && (
            <article
              className={
                "mt-6 rounded-3xl glass-card p-6 transition-shadow duration-700 sm:p-8 " +
                (flash ? "ring-2 ring-primary/60 shadow-glow" : "")
              }
              aria-live="polite"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {app.job_title}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold">{app.full_name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reference <span className="font-mono font-semibold text-foreground">{refDisplay}</span>
                    {" · "}Submitted {new Date(app.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${STATUS_BADGE[app.status]}`}
                >
                  {app.status}
                </span>
              </div>

              {app.status_note && (
                <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4 text-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Note from the team
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground/90">{app.status_note}</p>
                </div>
              )}

              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last update: {new Date(app.status_updated_at).toLocaleString()}
              </p>

              <Tracker status={app.status} />

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {online ? (
                    <>
                      <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Live · auto-refresh every 20s
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5 text-amber-500" /> Offline — updates paused
                    </>
                  )}
                  {lastChecked && (
                    <span className="ml-2 hidden sm:inline">
                      · checked {lastChecked.toLocaleTimeString()}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing || !online}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-semibold text-foreground hover:bg-secondary/40 disabled:opacity-60"
                >
                  <RefreshCw className={"h-3.5 w-3.5 " + (refreshing ? "animate-spin" : "")} />
                  Refresh now
                </button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Questions?{" "}
                <a className="text-primary underline" href="mailto:yessbangla.bd@gmail.com">
                  yessbangla.bd@gmail.com
                </a>
              </p>
              <Link
                to="/careers"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary"
              >
                Back to careers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          )}
        </div>
      </section>
    </>
  );
}

function Tracker({ status }: { status: Status }) {
  const rejected = status === "Rejected";
  const onHold = status === "On hold";
  const idx = progressIndex(status);

  return (
    <div className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Progress
      </p>
      <ol className="mt-3 space-y-3">
        {PIPELINE.map((step, i) => {
          const done = !rejected && i < idx;
          const current = !rejected && !onHold && i === idx;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold " +
                    (done
                      ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                      : current
                        ? "border-primary bg-primary/10 text-primary animate-pulse"
                        : "border-border bg-background text-muted-foreground")
                  }
                  aria-hidden
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                {i < PIPELINE.length - 1 && (
                  <div
                    className={
                      "mt-1 h-full min-h-[18px] w-px " + (done ? "bg-primary/60" : "bg-border")
                    }
                    aria-hidden
                  />
                )}
              </div>
              <div className="pb-2">
                <p className={"text-sm font-semibold " + (current ? "text-primary" : "")}>
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {rejected && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Unfortunately your application was not successful this time. We're grateful you applied.
        </div>
      )}
      {onHold && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Your application is currently on hold. We'll reach out as soon as there's an update.
        </div>
      )}
    </div>
  );
}
