// Branding card for Site settings — browse/upload or pick the site logo
// from the dashboard image gallery. Values are stored in `cms_settings`
// as `{ "text": "<url>" }` rows so the rest of the CMS reads them as usual.
import { useEffect, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { listSettingsAction, upsertSettingAction } from "@/actions/cms";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { resolveMediaUrl } from "@/lib/mediaAssets";

const FIELDS = [
  { key: "logo_url", label: "Header logo", labelBn: "হেডার লোগো" },
  { key: "logo_url_dark", label: "Dark-mode logo (optional)", labelBn: "ডার্ক মোড লোগো" },
  { key: "footer_logo_url", label: "Footer logo (optional)", labelBn: "ফুটার লোগো" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

export function BrandingLogoCard({ onSaved }: { onSaved?: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const result = await listSettingsAction();
      if (!result.ok) setErr(result.error);
      const next: Record<string, string> = {};
      const keys = new Set(FIELDS.map((f) => f.key));
      for (const row of (result.ok ? result.rows : []) as { key: string; value: { text?: string } | null }[]) {
        if (!keys.has(row.key as Key)) continue;
        next[row.key] = typeof row.value?.text === "string" ? row.value.text : "";
      }
      setValues(next);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setErr(null);
    setDone(false);
    try {
      for (const f of FIELDS) {
        const result = await upsertSettingAction({
          key: f.key,
          label: f.label,
          group: "branding",
          value: { text: values[f.key] ?? "" },
        });
        if (!result.ok) throw new Error(result.error);
      }
      setDone(true);
      onSaved?.();
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const preview = resolveMediaUrl(values.logo_url);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Logo &amp; branding</h2>
          <p className="text-xs text-muted-foreground">
            লোগো ব্রাউজ করে আপলোড করুন অথবা ইমেজ গ্যালারি থেকে বেছে নিন — সাইটের হেডার ও ফুটারে সাথে সাথে দেখাবে।
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {done ? "Saved" : "Save logo"}
        </button>
      </div>

      {err && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <MediaPicker
              key={f.key}
              label={f.label}
              labelBn={f.labelBn}
              value={values[f.key] ?? ""}
              onChange={(url) => setValues((v) => ({ ...v, [f.key as Key]: url }))}
            />
          ))}
        </div>
      )}

      {preview && (
        <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Header preview · হেডার প্রিভিউ
          </p>
          <img src={preview} alt="Site logo preview" className="h-10 w-auto object-contain" />
        </div>
      )}
    </section>
  );
}
