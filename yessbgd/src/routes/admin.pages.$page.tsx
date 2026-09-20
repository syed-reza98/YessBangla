import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deletePageSectionAction,
  listPageSectionsAction,
  upsertPageSectionAction,
  upsertSitePageAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { PageMenuPanel } from "@/components/admin/PageMenuPanel";

import { SITE_PAGE_FIELDS, useSitePage, type SitePage } from "@/lib/sitePages";
import { ArrowLeft, Save, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";

type EditorTab = "content" | "sections" | "navigation" | "seo";
const EDITOR_TABS: EditorTab[] = ["content", "sections", "navigation", "seo"];

export const Route = createFileRoute("/admin/pages/$page")({
  validateSearch: (search: Record<string, unknown>): { tab?: EditorTab } => {
    const t = String(search.tab ?? "");
    return EDITOR_TABS.includes(t as EditorTab) ? { tab: t as EditorTab } : {};
  },
  head: () => ({
    meta: [
      { title: "Edit page — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPageEditor,
});

type Section = {
  id: string;
  page: string;
  section_key: string;
  sort_order: number | null;
  title: string | null;
  title_bn: string | null;
  subtitle: string | null;
  subtitle_bn: string | null;
  body: string | null;
  body_bn: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  is_published: boolean | null;
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Field({
  label,
  value,
  onChange,
  textarea,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} ${mono ? "font-mono" : ""}`}
        />
      )}
    </label>
  );
}

function AdminPageEditor() {
  const { page } = useParams({ from: "/admin/pages/$page" });
  const { tab: tabFromUrl } = Route.useSearch();
  const qc = useQueryClient();
  const { data } = useSitePage(page);
  const [row, setRow] = useState<SitePage | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tab, setTab] = useState<EditorTab>(tabFromUrl ?? "content");
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tabFromUrl) setTab(tabFromUrl);
  }, [tabFromUrl]);


  useEffect(() => {
    if (data) setRow(data);
  }, [data]);

  const loadSections = async () => {
    const result = await listPageSectionsAction({ page });
    setSections((result.ok ? result.rows : []) as Section[]);
  };

  useEffect(() => {
    void loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const patch = (key: keyof SitePage, value: unknown) =>
    setRow((r) => (r ? ({ ...r, [key]: value } as SitePage) : r));

  const savePage = async () => {
    if (!row) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    const result = await upsertSitePageAction(row as unknown as Record<string, unknown>);
    setSaving(false);
    if (!result.ok) setErr(result.error);
    else {
      setMsg("Page saved · সংরক্ষিত হয়েছে");
      await qc.invalidateQueries({ queryKey: ["cms", "site-page", page] });
      await qc.invalidateQueries({ queryKey: ["cms", "site-pages"] });
    }
  };

  const patchSection = (id: string, key: keyof Section, value: unknown) =>
    setSections((rs) => rs.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  const saveSection = async (section: Section) => {
    setSavingSection(section.id);
    setErr(null);
    const result = await upsertPageSectionAction(section as unknown as Record<string, unknown>);
    setSavingSection(null);
    if (!result.ok) setErr(result.error);
    else {
      setMsg(`Section “${section.section_key}” saved.`);
      await qc.invalidateQueries({ queryKey: ["cms", "pages", page] });
    }
  };

  const addSection = async () => {
    const key = window.prompt("Section key (hero, intro, features, cta…)");
    if (!key) return;
    const result = await upsertPageSectionAction({
      page,
      section_key: key.trim().toLowerCase().replace(/\s+/g, "-"),
      sort_order: sections.length + 1,
      is_published: true,
    });
    if (!result.ok) setErr(result.error);
    else await loadSections();
  };

  const removeSection = async (id: string) => {
    if (!window.confirm("Delete this section?")) return;
    await deletePageSectionAction({ id });
    await loadSections();
  };

  if (!row) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const tabs: { key: typeof tab; label: string; labelBn: string }[] = [
    { key: "content", label: "Content & images", labelBn: "কনটেন্ট ও ছবি" },
    { key: "sections", label: `Sections (${sections.length})`, labelBn: "সেকশন" },
    { key: "navigation", label: "Navigation & submenu", labelBn: "মেনু ও সাবমেনু" },
    { key: "seo", label: "SEO & sharing", labelBn: "এসইও" },
  ];


  return (
    <div>
      <AdminPageHeader
        title={`Edit: ${row.name}`}
        titleBn={row.name_bn || row.path}
        description="Everything on this page — hero copy, images, sections and SEO — in English and Bangla."
        actions={
          <>
            <Link
              to="/admin/pages"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> All pages
            </Link>
            <a
              href={row.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" /> View
            </a>
            <button
              onClick={savePage}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </>
        }
      />

      {err && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {msg && <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-xs ${
              tab === t.key
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.label} <span className="opacity-70">· {t.labelBn}</span>
          </button>
        ))}
      </div>

      {tab === "content" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Page name (EN)" value={row.name} onChange={(v) => patch("name", v)} />
              <Field label="পেইজের নাম (BN)" value={row.name_bn ?? ""} onChange={(v) => patch("name_bn", v)} />
              <Field label="URL path" value={row.path} onChange={(v) => patch("path", v)} mono />
              <Field
                label="Sort order"
                value={String(row.sort_order ?? 0)}
                onChange={(v) => patch("sort_order", Number(v) || 0)}
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.is_published}
                onChange={(e) => patch("is_published", e.target.checked)}
              />
              Published · প্রকাশিত
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-base font-semibold">Hero & intro · হিরো ও ভূমিকা</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {SITE_PAGE_FIELDS.filter((f) => f.group !== "seo").map((f) => (
                <div key={String(f.key)} className="contents">
                  <Field
                    label={`${f.label} (EN)`}
                    value={(row[f.key] as string | null) ?? ""}
                    onChange={(v) => patch(f.key, v)}
                    textarea={f.textarea}
                  />
                  <Field
                    label={`${f.labelBn} (BN)`}
                    value={(row[f.keyBn as keyof SitePage] as string | null) ?? ""}
                    onChange={(v) => patch(f.keyBn as keyof SitePage, v)}
                    textarea={f.textarea}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <MediaPicker
                label="Hero image"
                labelBn="হিরো ছবি"
                value={row.hero_image ?? ""}
                onChange={(v) => patch("hero_image", v)}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "navigation" && (
        <PageMenuPanel path={row.path} nameEn={row.name} nameBn={row.name_bn} />
      )}



      {tab === "seo" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {SITE_PAGE_FIELDS.filter((f) => f.group === "seo").map((f) => (
              <div key={String(f.key)} className="contents">
                <Field
                  label={`${f.label} (EN)`}
                  value={(row[f.key] as string | null) ?? ""}
                  onChange={(v) => patch(f.key, v)}
                  textarea={f.textarea}
                />
                <Field
                  label={`${f.labelBn} (BN)`}
                  value={(row[f.keyBn as keyof SitePage] as string | null) ?? ""}
                  onChange={(v) => patch(f.keyBn as keyof SitePage, v)}
                  textarea={f.textarea}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <MediaPicker
              label="Social share image"
              labelBn="শেয়ার ছবি"
              value={row.og_image ?? ""}
              onChange={(v) => patch("og_image", v)}
            />
          </div>
        </div>
      )}

      {tab === "sections" && (
        <div className="space-y-4">
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Plus className="h-4 w-4" /> Add section · নতুন সেকশন
          </button>

          {sections.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No sections yet for this page.
            </p>
          )}

          {sections.map((s) => (
            <details key={s.id} className="rounded-xl border border-border bg-card p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{s.title || s.section_key}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{s.section_key}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    s.is_published ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s.is_published ? "Published" : "Hidden"}
                </span>
              </summary>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Title (EN)" value={s.title ?? ""} onChange={(v) => patchSection(s.id, "title", v)} />
                <Field label="শিরোনাম (BN)" value={s.title_bn ?? ""} onChange={(v) => patchSection(s.id, "title_bn", v)} />
                <Field label="Subtitle (EN)" value={s.subtitle ?? ""} onChange={(v) => patchSection(s.id, "subtitle", v)} />
                <Field label="সাব-টাইটেল (BN)" value={s.subtitle_bn ?? ""} onChange={(v) => patchSection(s.id, "subtitle_bn", v)} />
                <Field label="Body (EN)" value={s.body ?? ""} onChange={(v) => patchSection(s.id, "body", v)} textarea />
                <Field label="বডি (BN)" value={s.body_bn ?? ""} onChange={(v) => patchSection(s.id, "body_bn", v)} textarea />
                <Field label="CTA label" value={s.cta_label ?? ""} onChange={(v) => patchSection(s.id, "cta_label", v)} />
                <Field label="CTA link" value={s.cta_href ?? ""} onChange={(v) => patchSection(s.id, "cta_href", v)} mono />
                <Field
                  label="Sort order"
                  value={String(s.sort_order ?? 0)}
                  onChange={(v) => patchSection(s.id, "sort_order", Number(v) || 0)}
                />
              </div>

              <div className="mt-4">
                <MediaPicker
                  label="Section image"
                  labelBn="সেকশনের ছবি"
                  value={s.image_url ?? ""}
                  onChange={(v) => patchSection(s.id, "image_url", v)}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!s.is_published}
                    onChange={(e) => patchSection(s.id, "is_published", e.target.checked)}
                  />
                  Published
                </label>
                <button
                  onClick={() => saveSection(s)}
                  disabled={savingSection === s.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {savingSection === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
                <button
                  onClick={() => removeSection(s.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
