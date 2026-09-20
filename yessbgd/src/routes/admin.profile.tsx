import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { changePasswordAction } from "@/actions/profile";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ROLE_LABEL, useDashboardRole, useProfile, type Profile } from "@/lib/adminAccess";
import { KeyRound, Loader2, Save, ShieldCheck, UserRound } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminProfile,
});

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Field({
  label,
  labelBn,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  labelBn?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {labelBn && <span className="opacity-70">· {labelBn}</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

function Toggle({
  label,
  labelBn,
  checked,
  onChange,
}: {
  label: string;
  labelBn: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4"
      />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{labelBn}</span>
      </span>
    </label>
  );
}

function AdminProfile() {
  const { role, email } = useDashboardRole();
  const { profile, isLoading, save } = useProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pwSent, setPwSent] = useState(false);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const patch = (key: keyof Profile, value: unknown) =>
    setDraft((d) => (d ? ({ ...d, [key]: value } as Profile) : d));

  const submit = async () => {
    if (!draft) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      await save({
        full_name: draft.full_name,
        phone: draft.phone,
        job_title: draft.job_title,
        avatar_url: draft.avatar_url,
        language: draft.language,
        theme: draft.theme,
        items_per_page: draft.items_per_page,
        notify_new_application: draft.notify_new_application,
        notify_new_message: draft.notify_new_message,
      });
      setMsg("Saved · সংরক্ষিত হয়েছে");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    const currentPassword = window.prompt("Current password / বর্তমান পাসওয়ার্ড");
    if (!currentPassword) return;
    const newPassword = window.prompt("New password (min 8) / নতুন পাসওয়ার্ড");
    if (!newPassword) return;
    const result = await changePasswordAction({ currentPassword, newPassword });
    if (!result.ok) setErr(result.error);
    else setPwSent(true);
  };

  if (isLoading || !draft) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const roleInfo = ROLE_LABEL[role];

  return (
    <div>
      <AdminPageHeader
        title="My profile"
        titleBn="আমার প্রোফাইল ও সেটিংস"
        description="আপনার নাম, যোগাযোগের তথ্য ও ড্যাশবোর্ড পছন্দ এখান থেকে বদলান।"
        actions={
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        }
      />

      {err && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {msg && <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
              <UserRound className="h-4 w-4 text-primary" /> Contact information · যোগাযোগের তথ্য
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Full name"
                labelBn="পূর্ণ নাম"
                value={draft.full_name ?? ""}
                onChange={(v) => patch("full_name", v)}
              />
              <Field
                label="Job title"
                labelBn="পদবি"
                value={draft.job_title ?? ""}
                onChange={(v) => patch("job_title", v)}
                placeholder="e.g. Content manager"
              />
              <Field
                label="Phone"
                labelBn="ফোন"
                type="tel"
                value={draft.phone ?? ""}
                onChange={(v) => patch("phone", v)}
              />
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sign-in email · ইমেইল
                </span>
                <input value={email ?? ""} readOnly disabled className={`${inputCls} opacity-70`} />
              </label>
            </div>
            <div className="mt-4">
              <MediaPicker
                label="Profile photo"
                labelBn="প্রোফাইল ছবি"
                value={draft.avatar_url ?? ""}
                onChange={(v) => patch("avatar_url", v)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-base font-semibold">Preferences · পছন্দ</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Language · ভাষা
                </span>
                <select
                  value={draft.language}
                  onChange={(e) => patch("language", e.target.value)}
                  className={inputCls}
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Theme · থিম
                </span>
                <select value={draft.theme} onChange={(e) => patch("theme", e.target.value)} className={inputCls}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rows per list · প্রতি পাতায়
                </span>
                <select
                  value={String(draft.items_per_page)}
                  onChange={(e) => patch("items_per_page", Number(e.target.value))}
                  className={inputCls}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Toggle
                label="Notify me about new job applications"
                labelBn="নতুন আবেদন এলে জানান"
                checked={draft.notify_new_application}
                onChange={(v) => patch("notify_new_application", v)}
              />
              <Toggle
                label="Notify me about new contact messages"
                labelBn="নতুন বার্তা এলে জানান"
                checked={draft.notify_new_message}
                onChange={(v) => patch("notify_new_message", v)}
              />
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Your access · আপনার অ্যাক্সেস
            </h2>
            <p className="text-lg font-semibold">{roleInfo.bn}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{roleInfo.en}</p>
            <p className="mt-2 text-sm text-muted-foreground">{roleInfo.help}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              অ্যাক্সেস বদলাতে হলে একজন অ্যাডমিনিস্ট্রেটরকে বলুন।
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
              <KeyRound className="h-4 w-4 text-primary" /> Password · পাসওয়ার্ড
            </h2>
            <p className="text-sm text-muted-foreground">
              পাসওয়ার্ড বদলাতে চাইলে নিচের বাটনে ক্লিক করুন — আপনার ইমেইলে একটি লিংক যাবে।
            </p>
            <button
              onClick={sendPasswordReset}
              className="mt-3 w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Send reset link · রিসেট লিংক পাঠান
            </button>
            {pwSent && <p className="mt-2 text-xs text-primary">ইমেইল পাঠানো হয়েছে ✓</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
