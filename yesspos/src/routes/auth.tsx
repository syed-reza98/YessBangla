import { BrandLogo } from "@/components/BrandLogo";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";
import { logAudit } from "@/lib/audit";
import { LangToggle } from "@/components/LangToggle";
import { signIn } from "next-auth/react";
import { customerSignUpAction } from "@/actions/auth";
import {
  healthCheckSettingsAction,
  debugProfileAction,
} from "@/actions/settings";
import { useSession } from "next-auth/react";
import { ClipboardCopy, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Bazar Bari" },
      { name: "description", content: "Sign in to your Bazar Bari shop account to start billing." },
      { property: "og:title", content: "Sign in — Bazar Bari" },
      { property: "og:description", content: "Sign in to your Bazar Bari shop account." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().min(3).max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().max(80).optional(),
});

// Users can sign in with a plain username (mapped to an internal email) or a real email.
function toEmail(value: string) {
  return value.includes("@") ? value.toLowerCase() : `${value.toLowerCase()}@yesspos.local`;
}


function AuthPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ 
    status: string; 
    details?: string; 
    timestamp?: string;
    endpoint?: string;
    roleValue?: string;
    isError?: boolean;
  } | null>(null);

  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user) navigate({ to: "/dashboard", replace: true });
  }, [navigate, session]);

  async function checkBackend() {
    setBusy(true);
    setDebugInfo(null);
    const now = new Date().toLocaleTimeString();
    try {
      const endpoint = "healthCheckSettingsAction";
      const health = await healthCheckSettingsAction();
      if (!health.ok) {
        setDebugInfo({ 
          status: "Backend Unreachable", 
          details: health.error, 
          endpoint,
          timestamp: now,
          isError: true 
        });
        return;
      }

      const username = email || "admin";
      const lookup = await debugProfileAction({ username });
      if (!lookup.ok || !lookup.profile) {
        setDebugInfo({ 
          status: "Account Not Found", 
          details: `No profile for "${username}".`,
          timestamp: now,
          isError: true
        });
        return;
      }
      const userCheck = lookup.profile;
      const rolesStr = lookup.roles.join(", ") || "none";
      
      setDebugInfo({ 
        status: "System Verified", 
        details: `User "${userCheck.username}" found.`,
        roleValue: rolesStr,
        timestamp: now,
        isError: rolesStr === "none"
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDebugInfo({ status: "Error", details: msg, timestamp: now, isError: true });
    } finally {
      setBusy(false);
    }
  }

  const copyDebugInfo = () => {
    if (!debugInfo) return;
    const text = `Status: ${debugInfo.status}\nDetails: ${debugInfo.details}\nTimestamp: ${debugInfo.timestamp}\nEndpoint: ${debugInfo.endpoint || "N/A"}\nRole Value: ${debugInfo.roleValue || "N/A"}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setDebugInfo(null);
    try {
      const emailAddr = toEmail(parsed.data.email);
      if (mode === "signup") {
        // Public signup is always customer — staff roles are admin-provisioned only.
        const created = await customerSignUpAction({
          email: emailAddr,
          password: parsed.data.password,
          fullName: parsed.data.fullName || "",
        });
        if (!created.ok) throw new Error(created.error);
        toast.success("Account created — sign in to continue");
        setMode("signin");
        return;
      }

      const result = await signIn("credentials", {
        email: emailAddr,
        password: parsed.data.password,
        redirect: false,
      });
      if (result?.error) {
        setDebugInfo({
          status: "Login Failed",
          details: "Invalid username or password.",
          timestamp: new Date().toLocaleTimeString(),
          isError: true,
        });
        throw new Error("Invalid username or password");
      }
      await logAudit("login", { details: "password" });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
      return;
    }
    if ((result as any).redirected) return;
    await logAudit("login", { details: "google" });
    navigate({ to: "/dashboard", replace: true });
  }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo size={36} priority />
          <span className="font-display text-lg font-bold">{t("appName")}</span>
        </Link>
        <LangToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="surface-panel w-full max-w-sm p-6">
          <h1 className="text-2xl font-bold">
            {mode === "signin" ? t("signIn") : t("signUp")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>

          {debugInfo && (
            <div className={`mt-4 rounded-lg border p-4 text-sm shadow-sm ${!debugInfo.isError ? "border-green-200 bg-green-50 text-green-800" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 font-bold">
                  {!debugInfo.isError ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {debugInfo.status}
                </div>
                <button onClick={copyDebugInfo} className="rounded p-1 hover:bg-black/5" title="Copy report">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <div className="mt-2 space-y-1 opacity-90">
                {debugInfo.details && <p>{debugInfo.details}</p>}
                {debugInfo.roleValue && (
                  <p className="flex items-center gap-1.5 font-medium">
                    <span className="text-xs uppercase opacity-60">Roles:</span> {debugInfo.roleValue}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider opacity-60">
                  {debugInfo.timestamp && <span>Last Check: {debugInfo.timestamp}</span>}
                  {debugInfo.endpoint && <span className="truncate max-w-[150px]">URL: {debugInfo.endpoint}</span>}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{t("fullName")}</Label>
                <Input id="fullName" value={fullName} maxLength={80} onChange={(e) => setFullName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("usernameOrEmail")}</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                required
                placeholder=""
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin" ? t("signIn") : t("signUp")}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t("or")} <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={onGoogle} disabled={busy}>
            {t("continueGoogle")}
          </Button>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? t("noAccount") : t("haveAccount")}
            </button>
            
            <button
              type="button"
              className="w-full text-center text-xs text-primary/60 underline-offset-4 hover:underline"
              onClick={checkBackend}
              disabled={busy}
            >
              {lang === "bn" ? "সিস্টেম কানেকশন ও অ্যাডমিন স্ট্যাটাস চেক করুন" : "Check system connection & admin status"}
            </button>


          </div>
        </div>
      </main>
    </div>
  );
}
