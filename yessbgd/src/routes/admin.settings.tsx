import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  deleteSettingAction,
  listSettingsAction,
  upsertSettingAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { BrandingLogoCard } from "@/components/admin/BrandingLogoCard";
import { FooterSettingsCard } from "@/components/admin/FooterSettingsCard";
import { Save, Plus, Trash2, Loader2, Code2, MapPin } from "lucide-react";
import { toMapEmbedSrc } from "@/lib/mapEmbed";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Site settings — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminSettings,
});

type Row = {
  id: string;
  key: string;
  label: string | null;
  group: string | null;
  value: unknown;
  sort_order: number | null;
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/**
 * Friendly editors — the admin just types plain text, no JSON.
 * Each entry maps a settings key to one or more labelled text fields
 * that read/write a property inside the stored JSON value.
 */
type Field = {
  prop: string;
  label: string;
  labelBn: string;
  placeholder?: string;
  type?: "text" | "textarea" | "email" | "tel" | "url";
  help?: string;
};

const FRIENDLY: Record<string, { title: string; titleBn: string; fields: Field[] }> = {
  company_name: {
    title: "Company name",
    titleBn: "কোম্পানির নাম",
    fields: [{ prop: "text", label: "Company name", labelBn: "কোম্পানির নাম", placeholder: "Yess Bangla Private Limited" }],
  },
  company_tagline: {
    title: "Tagline",
    titleBn: "ট্যাগলাইন",
    fields: [
      {
        prop: "text",
        label: "Tagline",
        labelBn: "ট্যাগলাইন",
        type: "textarea",
        placeholder: "Building ventures that move Bangladesh forward",
      },
    ],
  },
  contact_email: {
    title: "Contact email",
    titleBn: "যোগাযোগ ইমেইল",
    fields: [{ prop: "text", label: "Email", labelBn: "ইমেইল", type: "email", placeholder: "info@yessbangla.com" }],
  },
  contact_phone: {
    title: "Contact phone",
    titleBn: "যোগাযোগ ফোন",
    fields: [{ prop: "text", label: "Phone", labelBn: "ফোন", type: "tel", placeholder: "+880 1XXXXXXXXX" }],
  },
  contact_address: {
    title: "Address",
    titleBn: "ঠিকানা",
    fields: [
      {
        prop: "text",
        label: "Office address",
        labelBn: "অফিসের ঠিকানা",
        type: "textarea",
        placeholder: "House 127, Road 3, Mirpur 12, Dhaka 1216",
      },
    ],
  },
  contact_map: {
    title: "Google Map",
    titleBn: "গুগল ম্যাপ",
    fields: [
      {
        prop: "text",
        label: "Google Maps link or address",
        labelBn: "গুগল ম্যাপ লিংক অথবা ঠিকানা",
        placeholder: "Mirpur 12, Dhaka  —  অথবা Google Maps embed link",
        help: "শুধু ঠিকানা লিখলেও চলবে, অথবা Google Maps থেকে Share → Embed a map লিংক পেস্ট করুন।",
      },
    ],
  },
  social_links: {
    title: "Social links",
    titleBn: "সোশ্যাল লিংক",
    fields: [
      { prop: "facebook", label: "Facebook", labelBn: "ফেসবুক", type: "url", placeholder: "https://facebook.com/…" },
      { prop: "linkedin", label: "LinkedIn", labelBn: "লিংকডইন", type: "url", placeholder: "https://linkedin.com/company/…" },
      { prop: "youtube", label: "YouTube", labelBn: "ইউটিউব", type: "url", placeholder: "https://youtube.com/@…" },
    ],
  },
  seo_default: {
    title: "Default SEO",
    titleBn: "ডিফল্ট এসইও",
    fields: [
      { prop: "title", label: "Meta title", labelBn: "মেটা টাইটেল", placeholder: "Yess Bangla Private Limited" },
      { prop: "description", label: "Meta description", labelBn: "মেটা বিবরণ", type: "textarea", placeholder: "Short description under 160 characters" },
    ],
  },
};

const GROUP_TITLES: Record<string, { en: string; bn: string }> = {
  general: { en: "Company", bn: "কোম্পানি" },
  contact: { en: "Contact & map", bn: "যোগাযোগ ও ম্যাপ" },
  social: { en: "Social", bn: "সোশ্যাল" },
  seo: { en: "SEO", bn: "এসইও" },
  branding: { en: "Branding", bn: "ব্র্যান্ডিং" },
  custom: { en: "Custom", bn: "কাস্টম" },
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function AdminSettings() {
  const [rows, setRows] = useState<Row[]>([]);
  /** key -> { prop: string } friendly drafts */
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  /** id -> raw JSON draft, for keys without a friendly editor */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const result = await listSettingsAction();
    if (!result.ok) setErr(result.error);
    const list = (result.ok ? result.rows : []) as Row[];
    setRows(list);
    const nextValues: Record<string, Record<string, string>> = {};
    for (const r of list) {
      const spec = FRIENDLY[r.key];
      if (!spec) continue;
      const obj = asObject(r.value);
      nextValues[r.key] = Object.fromEntries(
        spec.fields.map((f) => [f.prop, typeof obj[f.prop] === "string" ? (obj[f.prop] as string) : ""]),
      );
    }
    setValues(nextValues);
    setDrafts(Object.fromEntries(list.map((r) => [r.id, JSON.stringify(r.value ?? {}, null, 2)])));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      for (const row of rows) {
        // Footer is managed by its own editor card below.
        if (row.key === "footer_config") continue;
        const spec = FRIENDLY[row.key];
        let parsed: unknown;
        if (spec) {
          const base = asObject(row.value);
          for (const f of spec.fields) base[f.prop] = values[row.key]?.[f.prop] ?? "";
          parsed = base;
        } else {
          try {
            parsed = JSON.parse(drafts[row.id] || "{}");
          } catch {
            throw new Error(`Invalid JSON in "${row.key}"`);
          }
        }
        const result = await upsertSettingAction({
          id: row.id,
          key: row.key,
          value: parsed as Record<string, unknown>,
          label: row.label,
          group: row.group,
          sort_order: row.sort_order ?? 0,
        });
        if (!result.ok) throw new Error(result.error);
      }
      setMsg("Settings saved · সেটিংস সেভ হয়েছে।");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addSetting = async () => {
    const key = window.prompt("New setting key (e.g. footer_note)");
    if (!key) return;
    const result = await upsertSettingAction({
      key,
      label: key,
      group: "custom",
      value: { text: "" },
      sort_order: rows.length + 1,
    });
    if (!result.ok) setErr(result.error);
    else void load();
  };

  const removeSetting = async (id: string) => {
    if (!window.confirm("Delete this setting?")) return;
    const result = await deleteSettingAction({ id });
    if (!result.ok) setErr(result.error);
    else void load();
  };

  const setField = (key: string, prop: string, v: string) =>
    setValues((s) => ({ ...s, [key]: { ...(s[key] ?? {}), [prop]: v } }));

  const friendlyRows = rows.filter((r) => FRIENDLY[r.key]);
  const rawRows = rows.filter(
    (r) =>
      !FRIENDLY[r.key] &&
      r.key !== "logo_url" &&
      r.key !== "logo_url_dark" &&
      r.key !== "footer_logo_url" &&
      r.key !== "footer_config",
  );
  const groups = Array.from(new Set(friendlyRows.map((r) => r.group ?? "general")));
  const mapPreview = toMapEmbedSrc(values.contact_map?.text ?? "");

  return (
    <div>
      <AdminPageHeader
        title="Site settings"
        titleBn="সাইট সেটিংস"
        description="Company name, tagline, contact email, phone, address and Google Map — just type the text and hit save."
        actions={
          <>
            <button
              onClick={addSetting}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              <Plus className="h-4 w-4" /> New setting
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save all
            </button>
          </>
        }
      />

      {err && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {msg && <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <BrandingLogoCard onSaved={() => void load()} />

      <FooterSettingsCard />

      <div className="space-y-8">
        {groups.map((g) => {
          const gt = GROUP_TITLES[g] ?? { en: g, bn: "" };
          return (
            <section key={g}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {gt.en} {gt.bn && <span className="normal-case tracking-normal">· {gt.bn}</span>}
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {friendlyRows
                  .filter((r) => (r.group ?? "general") === g)
                  .map((r) => {
                    const spec = FRIENDLY[r.key];
                    return (
                      <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold">
                            {spec.title} <span className="font-normal text-muted-foreground">· {spec.titleBn}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {spec.fields.map((f) => (
                            <label key={f.prop} className="block">
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {f.label} <span className="font-normal normal-case tracking-normal">· {f.labelBn}</span>
                              </span>
                              {f.type === "textarea" ? (
                                <textarea
                                  rows={3}
                                  value={values[r.key]?.[f.prop] ?? ""}
                                  onChange={(e) => setField(r.key, f.prop, e.target.value)}
                                  placeholder={f.placeholder}
                                  className={inputCls}
                                />
                              ) : (
                                <input
                                  type={f.type ?? "text"}
                                  value={values[r.key]?.[f.prop] ?? ""}
                                  onChange={(e) => setField(r.key, f.prop, e.target.value)}
                                  placeholder={f.placeholder}
                                  className={inputCls}
                                />
                              )}
                              {f.help && <span className="mt-1 block text-[11px] text-muted-foreground">{f.help}</span>}
                            </label>
                          ))}

                          {r.key === "contact_map" && mapPreview && (
                            <div className="overflow-hidden rounded-lg border border-border">
                              <div className="flex items-center gap-1.5 border-b border-border bg-secondary/50 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" /> Map preview · ম্যাপ প্রিভিউ
                              </div>
                              <iframe
                                title="Google Map preview"
                                src={mapPreview}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="h-52 w-full"
                                style={{ border: 0 }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          );
        })}
      </div>

      {rawRows.length > 0 && (
        <section className="mt-10">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showAdvanced ? "Hide advanced (JSON)" : "Advanced settings (JSON) · অ্যাডভান্সড"}
          </button>
          {showAdvanced && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {rawRows.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{r.label || r.key}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{r.key}</div>
                    </div>
                    <button
                      onClick={() => removeSetting(r.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete setting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={drafts[r.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    className={`${inputCls} font-mono text-xs`}
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
