import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { getCmsTypeAction, type CmsListType } from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { getCmsConfig, type CmsField } from "@/lib/cmsSchema";
import { AdminFormSkeleton, AdminLoadingState } from "@/components/admin/AdminLoading";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { upsertCmsRecordAction } from "@/actions/public";

export const Route = createFileRoute("/admin/cms/$type/$id")({
  head: () => ({
    meta: [
      { title: "Edit content — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  pendingMs: 150,
  pendingMinMs: 200,
  pendingComponent: () => <AdminLoadingState label="Loading entry…" />,
  component: AdminCmsEdit,
});

type FormState = Record<string, unknown>;

function defaultsFor(fields: CmsField[]): FormState {
  const out: FormState = {};
  for (const f of fields) {
    if (f.type === "boolean") out[f.key] = f.key === "is_published" ? true : false;
    else if (f.type === "number") out[f.key] = 0;
    else if (f.type === "json") out[f.key] = "";
    else out[f.key] = "";
  }
  return out;
}

function AdminCmsEdit() {
  const { type, id } = useParams({ from: "/admin/cms/$type/$id" });
  const navigate = useNavigate();
  const { data: session, status } = useSession();
  const cfg = useMemo(() => getCmsConfig(type), [type]);
  const isNew = id === "new";

  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (status === "loading") return;
      if (!session?.user) {
        navigate({ to: "/admin/login" });
        return;
      }
      if (!cfg) {
        setLoading(false);
        return;
      }
      if (isNew) {
        setForm(defaultsFor(cfg.fields));
        setLoading(false);
        return;
      }
      const result = await getCmsTypeAction({ type: type as CmsListType, id });
      if (!result.ok || !result.row) {
        setError(result.ok ? "Not found" : result.error);
        setLoading(false);
        return;
      }
      const row = result.row as Record<string, unknown>;
      // Map schema columns → form keys used by cmsSchema
      const aliases: Record<string, string> = {
        title: "name",
        tagline: "tag",
        image_path: "hero_image",
        body_md: "content",
        cover_image: "cover_image",
      };
      const next: FormState = {};
      for (const f of cfg.fields) {
        const srcKey = aliases[f.key] && row[aliases[f.key]] != null ? aliases[f.key] : f.key;
        const alt =
          f.key === "title"
            ? row.title ?? row.name
            : f.key === "tagline"
              ? row.tagline ?? row.tag
              : f.key === "image_path"
                ? row.image_path ?? row.hero_image ?? row.heroImage
                : f.key === "body_md"
                  ? row.body_md ?? row.content
                  : row[srcKey] ?? row[f.key];
        const v = alt;
        if (f.type === "json") {
          next[f.key] = v == null ? "" : JSON.stringify(v, null, 2);
        } else if (f.type === "boolean") {
          next[f.key] = Boolean(v ?? row.is_published ?? row.isPublished);
        } else if (f.type === "number") {
          next[f.key] = v == null ? 0 : Number(v);
        } else {
          next[f.key] = v == null ? "" : String(v);
        }
      }
      setForm(next);
      setLoading(false);
    })();
  }, [cfg, id, isNew, navigate, session, status]);

  if (!cfg) {
    return (
      <section>
        <div>
          <p className="text-sm text-destructive">Unknown CMS type: {type}</p>
          <Link to="/admin/cms" className="mt-4 inline-block text-sm text-primary">
            ← Back
          </Link>
        </div>
      </section>
    );
  }

  const setField = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const f of cfg.fields) {
      const raw = form[f.key];
      if (f.type === "json") {
        const s = String(raw ?? "").trim();
        if (!s) {
          payload[f.key] = null;
        } else {
          try {
            payload[f.key] = JSON.parse(s);
          } catch {
            setError(`Invalid JSON in field "${f.label}"`);
            setSaving(false);
            return;
          }
        }
      } else if (f.type === "boolean") {
        payload[f.key] = Boolean(raw);
      } else if (f.type === "number") {
        const n = Number(raw);
        payload[f.key] = Number.isFinite(n) ? n : 0;
      } else {
        const s = String(raw ?? "").trim();
        payload[f.key] = s === "" ? null : s;
      }
    }
    if (cfg.fields.find((f) => f.key === "slug" && f.required) && !payload.slug) {
      setError("Slug is required");
      setSaving(false);
      return;
    }

    const cmsType = type as "ventures" | "services" | "insights" | "industries";
    const res = await upsertCmsRecordAction({
      type: cmsType,
      id: isNew ? undefined : id,
      data: payload,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ to: "/admin/cms/$type", params: { type } });
  };

  return (
    <>
      <AdminPageHeader
        title={isNew ? `New ${cfg.label.slice(0, -1)}` : "Edit entry"}
        description={cfg.description}
      />
      <section>
        <div className="max-w-3xl">
          <Link
            to="/admin/cms/$type"
            params={{ type }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to list
          </Link>
          {loading ? (
            <AdminFormSkeleton fields={Math.min(8, cfg.fields.length || 6)} />
          ) : (
            <form onSubmit={onSubmit} className="rounded-2xl glass-card p-6 sm:p-8 space-y-5">
              {cfg.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={form[f.key]} onChange={(v) => setField(f.key, v)} />
              ))}
              {error && (
                <p className="inline-flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {error}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : isNew ? "Create" : "Save changes"}
                </button>
                <Link
                  to="/admin/cms/$type"
                  params={{ type }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CmsField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const baseInput =
    "mt-1.5 w-full rounded-lg border border-glass-border bg-white/60 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/5";

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-glass-border text-primary focus:ring-primary"
        />
        <span className="font-medium">{field.label}</span>
        {field.help && <span className="text-xs text-muted-foreground">— {field.help}</span>}
      </label>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </label>
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      {field.type === "textarea" || field.type === "markdown" || field.type === "json" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === "markdown" ? 12 : field.type === "json" ? 8 : 4}
          className={`${baseInput} font-${field.type === "json" ? "mono" : "sans"}`}
          spellCheck={field.type !== "json"}
        />
      ) : field.type === "number" ? (
        <input
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={baseInput}
        />
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}
    </div>
  );
}
