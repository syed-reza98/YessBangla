/**
 * FooterSettingsCard — full dashboard editor for the site footer:
 * style (background, spacing, column count, alignment, borders), all four
 * columns (type, bilingual titles, links, toggles), social icons, bottom
 * legal links and the copyright line. Saves into the `footer_config` row of
 * `cms_settings`.
 */
import { useEffect, useRef, useState } from "react";
import { listSettingsAction, upsertSettingAction } from "@/actions/cms";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  LayoutPanelTop,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Bookmark,
  Download,
  Upload,
  Undo2,
  Redo2,
  RotateCcw,
} from "lucide-react";
import { FooterLivePreview } from "@/components/admin/FooterLivePreview";
import {
  FOOTER_DEFAULTS,
  FOOTER_TEMPLATES,
  normaliseFooterConfig,
  type FooterColumn,
  type FooterColumnType,
  type FooterConfig,
  type FooterLink,
  type FooterSocial,
} from "@/lib/footerConfig";


const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const smallInput =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

const COLUMN_TYPES: { value: FooterColumnType; label: string }[] = [
  { value: "brand", label: "Logo + tagline · লোগো ও ট্যাগলাইন" },
  { value: "links", label: "Link list · লিংক তালিকা" },
  { value: "ventures", label: "Ventures · ভেঞ্চার তালিকা" },
  { value: "contact", label: "Contact + newsletter · যোগাযোগ" },
  { value: "text", label: "Free text · নিজের লেখা" },
];

const NETWORKS: FooterSocial["network"][] = ["facebook", "twitter", "youtube", "instagram", "linkedin"];

function Field({ label, labelBn, children }: { label: string; labelBn?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {labelBn && <span className="font-normal normal-case tracking-normal"> · {labelBn}</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}

export function FooterSettingsCard({ canEdit = true }: { canEdit?: boolean }) {
  const [cfg, setCfg] = useState<FooterConfig>(FOOTER_DEFAULTS);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  /* ------------------------------ undo / redo ---------------------------- */
  const past = useRef<FooterConfig[]>([]);
  const future = useRef<FooterConfig[]>([]);
  const skipHistory = useRef(true);
  const lastCfg = useRef<FooterConfig>(FOOTER_DEFAULTS);
  const [histTick, setHistTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false;
      lastCfg.current = cfg;
      return;
    }
    if (cfg === lastCfg.current) return;
    past.current = [...past.current.slice(-49), lastCfg.current];
    future.current = [];
    lastCfg.current = cfg;
    setHistTick((n) => n + 1);
  }, [cfg]);

  /** Replace the config without recording an extra history entry. */
  const applyHistory = (next: FooterConfig) => {
    skipHistory.current = true;
    lastCfg.current = next;
    setCfg(next);
    setHistTick((n) => n + 1);
  };

  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [lastCfg.current, ...future.current].slice(0, 50);
    applyHistory(prev);
  };

  const redo = () => {
    const next = future.current.shift();
    if (!next) return;
    past.current = [...past.current, lastCfg.current];
    applyHistory(next);
  };

  /* ------------------------------ export / import ------------------------ */
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `footer-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Exported · JSON ডাউনলোড হয়েছে।");
  };

  const importJson = async (file: File) => {
    setErr(null);
    setMsg(null);
    try {
      const parsed = JSON.parse(await file.text());
      setCfg((c) => ({ ...normaliseFooterConfig(parsed), saved_presets: c.saved_presets ?? [] }));
      setMsg("Imported · JSON প্রয়োগ হয়েছে, প্রিভিউ আপডেট হয়েছে। সেভ করুন।");
    } catch {
      setErr("Invalid JSON file · সঠিক Footer JSON ফাইল নয়।");
    }
  };

  /* --------------------------------- reset ------------------------------- */
  const resetAll = () => {
    if (!canEdit) return;
    setCfg((c) => ({ ...normaliseFooterConfig(FOOTER_DEFAULTS), saved_presets: c.saved_presets ?? [] }));
    setMsg("Reset to defaults · ডিফল্টে ফেরানো হয়েছে।");
  };

  const resetStyle = () => {
    if (!canEdit) return;
    setCfg((c) => ({ ...c, style: { ...FOOTER_DEFAULTS.style } }));
    setMsg("Style reset · স্টাইল ডিফল্টে ফেরানো হয়েছে।");
  };

  useEffect(() => {
    void (async () => {
      const result = await listSettingsAction();
      if (!result.ok) setErr(result.error);
      const data = (result.ok ? result.rows : []).find(
        (r) => (r as { key: string }).key === "footer_config",
      ) as { id: string; value: unknown } | undefined;
      if (data) {
        setRowId(data.id);
        skipHistory.current = true;
        setCfg(normaliseFooterConfig(data.value));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    const result = await upsertSettingAction({
      id: rowId ?? undefined,
      key: "footer_config",
      label: "Footer",
      group: "footer",
      value: cfg as unknown as Record<string, unknown>,
      sort_order: 90,
    });
    if (!result.ok) setErr(result.error);
    else {
      if (!rowId) setRowId(result.id);
      setMsg("Footer saved · ফুটার সেভ হয়েছে।");
    }
    setSaving(false);
  };

  const setStyle = <K extends keyof FooterConfig["style"]>(k: K, v: FooterConfig["style"][K]) =>
    setCfg((c) => ({ ...c, style: { ...c.style, [k]: v } }));

  const setColumn = (i: number, patch: Partial<FooterColumn>) =>
    setCfg((c) => ({ ...c, columns: c.columns.map((col, idx) => (idx === i ? { ...col, ...patch } : col)) }));

  const moveColumn = (i: number, delta: number) =>
    setCfg((c) => {
      const to = i + delta;
      if (to < 0 || to >= c.columns.length) return c;
      const columns = [...c.columns];
      columns.splice(to, 0, columns.splice(i, 1)[0]);
      return { ...c, columns };
    });

  /* ------------------------------ drag & drop ---------------------------- */
  const moveColumnTo = (from: number, to: number) =>
    setCfg((c) => {
      if (from === to || to < 0 || to >= c.columns.length) return c;
      const columns = [...c.columns];
      columns.splice(to, 0, columns.splice(from, 1)[0]);
      return { ...c, columns };
    });

  /* -------------------------------- presets ------------------------------ */
  const applyTemplate = (id: string) => {
    const tpl = FOOTER_TEMPLATES.find((t) => t.id === id);
    if (!tpl || !canEdit) return;
    setCfg((c) => ({ ...tpl.apply(c), saved_presets: c.saved_presets ?? [] }));
  };

  const saveCurrentPreset = () => {
    const name = presetName.trim();
    if (!name || !canEdit) return;
    setCfg((c) => {
      const { saved_presets: _drop, ...snapshot } = c;
      const others = (c.saved_presets ?? []).filter((p) => p.name !== name);
      return { ...c, saved_presets: [...others, { name, config: snapshot }] };
    });
    setPresetName("");
  };

  const applySavedPreset = (name: string) => {
    if (!canEdit) return;
    setCfg((c) => {
      const found = (c.saved_presets ?? []).find((p) => p.name === name);
      if (!found) return c;
      return { ...normaliseFooterConfig(found.config), saved_presets: c.saved_presets ?? [] };
    });
  };

  const deleteSavedPreset = (name: string) =>
    setCfg((c) => ({ ...c, saved_presets: (c.saved_presets ?? []).filter((p) => p.name !== name) }));



  const setLink = (colIdx: number, linkIdx: number, patch: Partial<FooterLink>) =>
    setCfg((c) => ({
      ...c,
      columns: c.columns.map((col, idx) =>
        idx === colIdx
          ? { ...col, links: (col.links ?? []).map((l, li) => (li === linkIdx ? { ...l, ...patch } : l)) }
          : col,
      ),
    }));

  if (loading) {
    return (
      <div className="mb-8 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Loading footer settings…
      </div>
    );
  }

  const canUndo = histTick >= 0 && past.current.length > 0;
  const canRedo = histTick >= 0 && future.current.length > 0;
  const toolBtn =
    "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50";

  return (
    <section className="mb-8 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <LayoutPanelTop className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">
          Footer <span className="font-normal text-muted-foreground">· ফুটার স্টাইল ও চারটি কলাম</span>
        </h2>
        <button
          onClick={save}
          disabled={saving || !canEdit}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save footer
        </button>
      </div>

      {/* ------------------------------------------------------- toolbar --- */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/60 p-3">
        <button type="button" onClick={undo} disabled={!canUndo || !canEdit} className={toolBtn} aria-label="Undo">
          <Undo2 className="h-3.5 w-3.5" /> Undo · পূর্বাবস্থা
        </button>
        <button type="button" onClick={redo} disabled={!canRedo || !canEdit} className={toolBtn} aria-label="Redo">
          <Redo2 className="h-3.5 w-3.5" /> Redo · পুনরায়
        </button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <button type="button" onClick={exportJson} className={toolBtn}>
          <Download className="h-3.5 w-3.5" /> Export JSON · এক্সপোর্ট
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!canEdit}
          className={toolBtn}
        >
          <Upload className="h-3.5 w-3.5" /> Import JSON · ইম্পোর্ট
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Import footer config JSON"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
            e.target.value = "";
          }}
        />

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <button type="button" onClick={resetStyle} disabled={!canEdit} className={toolBtn}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset style · স্টাইল রিসেট
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset the whole footer config to defaults? · পুরো ফুটার ডিফল্টে ফেরাবেন?")) resetAll();
          }}
          disabled={!canEdit}
          className={`${toolBtn} border-destructive/40 text-destructive hover:bg-destructive/10`}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset all · সব রিসেট
        </button>
      </div>


      {err && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {msg && <p className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}

      {/* -------------------------------------------------------- presets -- */}
      <div className="mb-4 rounded-lg border border-border bg-background/60 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Templates <span className="font-normal normal-case tracking-normal">· টেমপ্লেট প্রিসেট</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {FOOTER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              disabled={!canEdit}
              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              {t.label} · {t.label_bn}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="My preset name · প্রিসেটের নাম"
            aria-label="Preset name"
            className={`${smallInput} max-w-[14rem]`}
          />
          <button
            type="button"
            onClick={saveCurrentPreset}
            disabled={!canEdit || !presetName.trim()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <Bookmark className="h-3 w-3" /> Save current · সেভ করুন
          </button>
        </div>

        {(cfg.saved_presets ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(cfg.saved_presets ?? []).map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs"
              >
                <button type="button" onClick={() => applySavedPreset(p.name)} className="font-semibold hover:text-primary">
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSavedPreset(p.name)}
                  aria-label={`Delete preset ${p.name}`}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- preview --- */}
      <div className="mb-4">
        <FooterLivePreview cfg={cfg} />
      </div>

      {/* ---------------------------------------------------------- style -- */}
      <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-3 sm:grid-cols-2 lg:grid-cols-4">

        <Field label="Background" labelBn="ব্যাকগ্রাউন্ড">
          <select
            value={cfg.style.background}
            onChange={(e) => setStyle("background", e.target.value as FooterConfig["style"]["background"])}
            className={input}
          >
            <option value="gradient">Gradient · গ্রেডিয়েন্ট</option>
            <option value="solid">Solid · সলিড</option>
            <option value="transparent">Transparent · স্বচ্ছ</option>
            <option value="ink">Deep ink · গাঢ়</option>
          </select>
        </Field>
        <Field label="Spacing" labelBn="ফাঁকা জায়গা">
          <select
            value={cfg.style.spacing}
            onChange={(e) => setStyle("spacing", e.target.value as FooterConfig["style"]["spacing"])}
            className={input}
          >
            <option value="compact">Compact · কম</option>
            <option value="normal">Normal · স্বাভাবিক</option>
            <option value="spacious">Spacious · বেশি</option>
          </select>
        </Field>
        <Field label="Columns" labelBn="কলাম সংখ্যা">
          <select
            value={cfg.style.columns}
            onChange={(e) => setStyle("columns", Number(e.target.value) as FooterConfig["style"]["columns"])}
            className={input}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Heading style" labelBn="শিরোনাম স্টাইল">
          <select
            value={cfg.style.heading}
            onChange={(e) => setStyle("heading", e.target.value as FooterConfig["style"]["heading"])}
            className={input}
          >
            <option value="uppercase">UPPERCASE</option>
            <option value="normal">Normal case</option>
          </select>
        </Field>
        <Field label="Mobile columns" labelBn="মোবাইল কলাম">
          <select
            value={cfg.style.mobile_columns}
            onChange={(e) => setStyle("mobile_columns", Number(e.target.value) as FooterConfig["style"]["mobile_columns"])}
            className={input}
          >
            <option value={1}>1 column · এক কলাম</option>
            <option value={2}>2 columns · দুই কলাম</option>
          </select>
        </Field>
        <Field label="Mobile alignment" labelBn="মোবাইল অ্যালাইনমেন্ট">
          <select
            value={cfg.style.mobile_align}
            onChange={(e) => setStyle("mobile_align", e.target.value as FooterConfig["style"]["mobile_align"])}
            className={input}
          >
            <option value="left">Left · বামে</option>
            <option value="center">Center · মাঝে</option>
          </select>
        </Field>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4">
          <Toggle checked={cfg.style.border_top} onChange={(v) => setStyle("border_top", v)} label="Top border · উপরের বর্ডার" />
          <Toggle
            checked={cfg.style.show_bottom_bar}
            onChange={(v) => setStyle("show_bottom_bar", v)}
            label="Bottom bar · নিচের বার"
          />
          <Toggle
            checked={cfg.style.align_center}
            onChange={(v) => setStyle("align_center", v)}
            label="Centre align (desktop) · ডেস্কটপে মাঝে"
          />
        </div>
      </div>

      {/* -------------------------------------------------------- columns -- */}
      <p className="mt-4 text-[11px] text-muted-foreground">
        রো-গুলো ড্র্যাগ করে ক্রম বদলান · drag the rows to reorder
      </p>
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        {cfg.columns.map((col, i) => (
          <div
            key={i}
            onDragOver={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              setDragOver(i);
            }}
            onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null && canEdit) moveColumnTo(dragIndex, i);
              setDragIndex(null);
              setDragOver(null);
            }}
            className={`rounded-lg border bg-background/60 p-3 transition-colors ${
              dragOver === i && dragIndex !== null ? "border-primary ring-2 ring-primary/30" : "border-border"
            } ${dragIndex === i ? "opacity-60" : ""} ${i >= cfg.style.columns ? "opacity-50" : ""}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                draggable={canEdit}
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOver(null);
                }}
                role="button"
                tabIndex={0}
                aria-label={`Drag row ${i + 1} to reorder`}
                className="grid h-7 w-7 cursor-grab place-items-center rounded border border-border text-muted-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">Row {i + 1}</span>
              {i >= cfg.style.columns && (

                <span className="text-[11px] text-muted-foreground">দেখানো হচ্ছে না (কলাম সংখ্যা বাড়ান)</span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => moveColumn(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move row ${i + 1} up`}
                  className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary disabled:opacity-35"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveColumn(i, 1)}
                  disabled={i === cfg.columns.length - 1}
                  aria-label={`Move row ${i + 1} down`}
                  className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary disabled:opacity-35"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setColumn(i, { hidden: !col.hidden })}
                  aria-label={`${col.hidden ? "Show" : "Hide"} row ${i + 1}`}
                  className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary"
                >
                  {col.hidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Content type" labelBn="কী দেখাবে">
                <select
                  value={col.type}
                  onChange={(e) => setColumn(i, { type: e.target.value as FooterColumnType })}
                  className={input}
                >
                  {COLUMN_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title (EN)" labelBn="শিরোনাম">
                <input value={col.title ?? ""} onChange={(e) => setColumn(i, { title: e.target.value })} className={input} />
              </Field>
              <Field label="Title (BN)" labelBn="বাংলা শিরোনাম">
                <input
                  value={col.title_bn ?? ""}
                  onChange={(e) => setColumn(i, { title_bn: e.target.value })}
                  className={input}
                />
              </Field>
            </div>

            {(col.type === "brand" || col.type === "text") && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Text (EN)" labelBn="লেখা">
                  <textarea
                    rows={3}
                    value={col.text ?? ""}
                    onChange={(e) => setColumn(i, { text: e.target.value })}
                    className={input}
                  />
                </Field>
                <Field label="Text (BN)" labelBn="বাংলা লেখা">
                  <textarea
                    rows={3}
                    value={col.text_bn ?? ""}
                    onChange={(e) => setColumn(i, { text_bn: e.target.value })}
                    className={input}
                  />
                </Field>
              </div>
            )}

            {col.type === "brand" && (
              <div className="mt-3 flex flex-wrap gap-4">
                <Toggle checked={col.show_logo !== false} onChange={(v) => setColumn(i, { show_logo: v })} label="Logo · লোগো" />
                <Toggle
                  checked={col.show_social !== false}
                  onChange={(v) => setColumn(i, { show_social: v })}
                  label="Social icons · সোশ্যাল আইকন"
                />
              </div>
            )}

            {col.type === "contact" && (
              <div className="mt-3 flex flex-wrap gap-4">
                <Toggle checked={col.show_address !== false} onChange={(v) => setColumn(i, { show_address: v })} label="Address · ঠিকানা" />
                <Toggle checked={col.show_phone !== false} onChange={(v) => setColumn(i, { show_phone: v })} label="Phone · ফোন" />
                <Toggle checked={col.show_email !== false} onChange={(v) => setColumn(i, { show_email: v })} label="Email · ইমেইল" />
                <Toggle
                  checked={col.show_newsletter !== false}
                  onChange={(v) => setColumn(i, { show_newsletter: v })}
                  label="Newsletter · নিউজলেটার"
                />
              </div>
            )}

            {(col.type === "links" || col.type === "text") && (
              <div className="mt-3">
                {col.type === "links" && (
                  <Toggle
                    checked={col.use_menu !== false}
                    onChange={(v) => setColumn(i, { use_menu: v })}
                    label="Use the Footer menu · ফুটার মেনু ব্যবহার করুন"
                  />
                )}
                {(col.type === "text" || col.use_menu === false) && (
                  <div className="mt-2 space-y-2">
                    {(col.links ?? []).map((l, li) => (
                      <div key={li} className="flex flex-wrap items-center gap-2">
                        <input
                          value={l.label}
                          onChange={(e) => setLink(i, li, { label: e.target.value })}
                          placeholder="Label (EN)"
                          aria-label="Link label English"
                          className={`${smallInput} max-w-[9rem]`}
                        />
                        <input
                          value={l.label_bn ?? ""}
                          onChange={(e) => setLink(i, li, { label_bn: e.target.value })}
                          placeholder="লেবেল (BN)"
                          aria-label="Link label Bangla"
                          className={`${smallInput} max-w-[9rem]`}
                        />
                        <input
                          value={l.href}
                          onChange={(e) => setLink(i, li, { href: e.target.value })}
                          placeholder="/about"
                          aria-label="Link URL"
                          className={`${smallInput} max-w-[10rem]`}
                        />
                        <Toggle
                          checked={Boolean(l.external)}
                          onChange={(v) => setLink(i, li, { external: v })}
                          label="External"
                        />
                        <button
                          onClick={() =>
                            setColumn(i, { links: (col.links ?? []).filter((_, idx) => idx !== li) })
                          }
                          aria-label="Remove link"
                          className="grid h-7 w-7 place-items-center rounded border border-border text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setColumn(i, { links: [...(col.links ?? []), { label: "", href: "/" }] })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary"
                    >
                      <Plus className="h-3 w-3" /> Add link · লিংক যোগ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------- social -- */}
      <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Social icons <span className="font-normal normal-case tracking-normal">· সোশ্যাল আইকন</span>
        </p>
        <div className="space-y-2">
          {cfg.social.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={s.network}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    social: c.social.map((x, xi) =>
                      xi === i ? { ...x, network: e.target.value as FooterSocial["network"] } : x,
                    ),
                  }))
                }
                aria-label="Network"
                className={`${smallInput} max-w-[9rem]`}
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <input
                value={s.href}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    social: c.social.map((x, xi) => (xi === i ? { ...x, href: e.target.value } : x)),
                  }))
                }
                placeholder="https://…"
                aria-label="Social URL"
                className={`${smallInput} max-w-[20rem]`}
              />
              <button
                onClick={() => setCfg((c) => ({ ...c, social: c.social.filter((_, xi) => xi !== i) }))}
                aria-label="Remove social link"
                className="grid h-7 w-7 place-items-center rounded border border-border text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setCfg((c) => ({ ...c, social: [...c.social, { network: "facebook", href: "" }] }))}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            <Plus className="h-3 w-3" /> Add social · যোগ করুন
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------- bottom bar -- */}
      <div className="mt-4 grid gap-3 rounded-lg border border-border bg-background/60 p-3 lg:grid-cols-2">
        <Field label="Copyright (EN)" labelBn="কপিরাইট">
          <input
            value={cfg.copyright}
            onChange={(e) => setCfg((c) => ({ ...c, copyright: e.target.value }))}
            placeholder="© 2026 YESS Bangla Private Limited. All rights reserved."
            className={input}
          />
        </Field>
        <Field label="Copyright (BN)" labelBn="বাংলা কপিরাইট">
          <input
            value={cfg.copyright_bn ?? ""}
            onChange={(e) => setCfg((c) => ({ ...c, copyright_bn: e.target.value }))}
            className={input}
          />
        </Field>
        <div className="lg:col-span-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bottom links <span className="font-normal normal-case tracking-normal">· নিচের লিংক</span>
          </p>
          <div className="space-y-2">
            {cfg.bottom_links.map((l, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  value={l.label}
                  onChange={(e) =>
                    setCfg((c) => ({
                      ...c,
                      bottom_links: c.bottom_links.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)),
                    }))
                  }
                  placeholder="Label (EN)"
                  aria-label="Bottom link label English"
                  className={`${smallInput} max-w-[9rem]`}
                />
                <input
                  value={l.label_bn ?? ""}
                  onChange={(e) =>
                    setCfg((c) => ({
                      ...c,
                      bottom_links: c.bottom_links.map((x, xi) => (xi === i ? { ...x, label_bn: e.target.value } : x)),
                    }))
                  }
                  placeholder="লেবেল (BN)"
                  aria-label="Bottom link label Bangla"
                  className={`${smallInput} max-w-[9rem]`}
                />
                <input
                  value={l.href}
                  onChange={(e) =>
                    setCfg((c) => ({
                      ...c,
                      bottom_links: c.bottom_links.map((x, xi) => (xi === i ? { ...x, href: e.target.value } : x)),
                    }))
                  }
                  placeholder="/privacy"
                  aria-label="Bottom link URL"
                  className={`${smallInput} max-w-[10rem]`}
                />
                <button
                  onClick={() => setCfg((c) => ({ ...c, bottom_links: c.bottom_links.filter((_, xi) => xi !== i) }))}
                  aria-label="Remove bottom link"
                  className="grid h-7 w-7 place-items-center rounded border border-border text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCfg((c) => ({ ...c, bottom_links: [...c.bottom_links, { label: "", href: "/" }] }))}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              <Plus className="h-3 w-3" /> Add link · লিংক যোগ
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        পরিবর্তন করার পর উপরের <strong>Save footer</strong> বাটনে ক্লিক করুন — সাইটে সাথে সাথেই দেখা যাবে।
      </p>
    </section>
  );
}
