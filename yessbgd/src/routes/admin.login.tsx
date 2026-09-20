import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin login — YESS Bangla" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLogin,
});

const highlights = [
  { title: "Pages & content", titleBn: "পেইজ ও কনটেন্ট", desc: "Edit every page in English and Bangla." },
  { title: "Menus & media", titleBn: "মেনু ও মিডিয়া", desc: "Tree menu editor with a live preview." },
  { title: "Secure by design", titleBn: "নিরাপদ অ্যাক্সেস", desc: "Role-based access with audit logging." },
];

/* --------------------------- brute-force throttle --------------------------- */
const LOCK_KEY = "yb_admin_login_guard";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes after 5 failed attempts
const WINDOW_MS = 15 * 60 * 1000; // failures older than this are forgotten

type Guard = { fails: number; first: number; lockedUntil: number };

function readGuard(): Guard {
  if (typeof window === "undefined") return { fails: 0, first: 0, lockedUntil: 0 };
  try {
    const raw = window.localStorage.getItem(LOCK_KEY);
    const g = raw ? (JSON.parse(raw) as Guard) : null;
    if (!g) return { fails: 0, first: 0, lockedUntil: 0 };
    if (g.lockedUntil < Date.now() && Date.now() - g.first > WINDOW_MS)
      return { fails: 0, first: 0, lockedUntil: 0 };
    return g;
  } catch {
    return { fails: 0, first: 0, lockedUntil: 0 };
  }
}

function writeGuard(g: Guard) {
  try {
    window.localStorage.setItem(LOCK_KEY, JSON.stringify(g));
  } catch {
    /* storage blocked — throttle simply won't persist */
  }
}

type Mode = "signin" | "forgot" | "reset";

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guard, setGuard] = useState<Guard>({ fails: 0, first: 0, lockedUntil: 0 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setGuard(readGuard());
  }, []);

  const locked = guard.lockedUntil > now;
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const remaining = Math.max(0, Math.ceil((guard.lockedUntil - now) / 1000));
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - guard.fails);

  const registerFailure = () => {
    const base = readGuard();
    const fails = (base.first && Date.now() - base.first < WINDOW_MS ? base.fails : 0) + 1;
    const next: Guard = {
      fails,
      first: base.first && Date.now() - base.first < WINDOW_MS ? base.first : Date.now(),
      lockedUntil: fails >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0,
    };
    writeGuard(next);
    setGuard(next);
    setNow(Date.now());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (mode === "forgot" || mode === "reset") {
      setError(
        "Password reset is managed by an administrator. Contact your system admin."
      );
      return;
    }

    if (locked) {
      setError(`Too many failed attempts. Try again in ${remaining}s.`);
      return;
    }

    setLoading(true);
    setStatus("Verifying credentials…");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });
    setLoading(false);

    if (result?.error) {
      registerFailure();
      setStatus(null);
      setError("Invalid email or password.");
      return;
    }

    writeGuard({ fails: 0, first: 0, lockedUntil: 0 });
    setGuard({ fails: 0, first: 0, lockedUntil: 0 });
    setStatus("Signed in — opening dashboard…");
    navigate({ to: "/admin" });
  };

  const field =
    "w-full rounded-xl border border-border bg-card/80 px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-[oklch(0.75_0.16_62_/_0.6)] focus:bg-card focus:ring-2 focus:ring-[oklch(0.72_0.17_50_/_0.35)]";


  return (
    <main className="admin-scope relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* ambient corporate mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.66 0.185 42 / 0.55), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 -right-32 h-[560px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.75 0.155 62 / 0.45), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.32 0.022 55 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.32 0.022 55 / 0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 78%)",
        }}
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card/70 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* Brand / value panel */}
        <section className="hidden flex-col justify-between gap-10 border-r border-border p-10 lg:flex">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Control Center
            </span>
            <h1 className="mt-6 text-3xl font-semibold leading-tight text-foreground">
              YESS Bangla
              <span className="block text-muted-foreground">Content Management Suite</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              পুরো ওয়েব পোর্টাল — পেইজ, মেনু, মিডিয়া, ক্যারিয়ার ও সেটিংস — একটি কর্পোরেট ড্যাশবোর্ড থেকে পরিচালনা করুন।
            </p>
          </div>

          <ul className="space-y-4">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-card/80 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {h.title} <span className="font-normal text-muted-foreground">— {h.titleBn}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{h.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            © {new Date().getFullYear()} YESS Bangla — Authorized personnel only
          </p>
        </section>

        {/* Form panel */}
        <section className="p-8 sm:p-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>

          <h2 className="mt-6 text-2xl font-semibold text-foreground">
            {mode === "signin" ? "Sign in" : mode === "forgot" ? "Reset password" : "Set a new password"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Restricted area — অনুমোদিত কর্মীদের জন্য সংরক্ষিত।"
              : mode === "forgot"
                ? "We'll email you a secure reset link — রিসেট লিংক পাঠানো হবে।"
                : "Choose a strong password of at least 8 characters."}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            {mode !== "reset" && (
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="admin@yessbangla.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={field}
                  />
                </div>
              </div>
            )}

            {mode !== "forgot" && (
              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {mode === "reset" ? "New password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="admin-password"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete={mode === "reset" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${field} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div aria-live="polite" className="space-y-2">
              {error && (
                <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}
              {status && !error && (
                <p className="flex items-start gap-2 rounded-xl border border-emerald-600/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {status}
                </p>
              )}
              {mode === "signin" && locked && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Account temporarily locked after {MAX_ATTEMPTS} failed attempts. Try again in {remaining}s.
                </p>
              )}
              {mode === "signin" && !locked && guard.fails > 0 && (
                <p className="text-[11px] text-amber-700">
                  {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left before a temporary lockout.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (mode === "signin" && locked)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,oklch(0.655_0.185_42)_0%,oklch(0.75_0.160_62)_100%)] px-6 py-3 text-sm font-semibold text-foreground shadow-[0_12px_30px_-12px_oklch(0.55_0.16_45_/_0.8)] transition hover:brightness-105 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Working…"
                : mode === "signin"
                  ? locked
                    ? `Locked — ${remaining}s`
                    : "Sign in to dashboard"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Update password"}
            </button>

            {mode === "signin" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                  setStatus(null);
                }}
                className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Forgot password? — পাসওয়ার্ড ভুলে গেছেন?
              </button>
            ) : mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setStatus(null);
                }}
                className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
              >
                Back to sign in
              </button>
            ) : null}
          </form>

          <p className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Sessions are encrypted, repeated failures are throttled, and every
            admin action is logged.
          </p>

        </section>
      </div>
    </main>
  );
}
