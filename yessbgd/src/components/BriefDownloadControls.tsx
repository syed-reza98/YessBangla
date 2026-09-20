import { useEffect, useState } from "react";
import {
  Download,
  Settings2,
  FlaskConical,
  Loader2,
  
  Building2,
  AlertTriangle,
  X,
  FileDown,
  ImageIcon,
  Camera,
  GitCompare,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  loadLogoSettings,
  saveLogoSettings,
  DEFAULT_LOGO_SETTINGS,
  type LogoSettings,
} from "@/lib/logoSettings";
import {
  downloadVentureBrief,
  DEFAULT_WATERMARK,
  type WatermarkOptions,
  type PageFormat,
  type PageOrientation,
  type IntegrityReport,
} from "@/lib/ventureBrief";

import {
  loadBranding,
  saveBranding,
  listPresets,
  getActivePresetId,
  setActivePreset,
  createPreset,
  deletePreset,
  DEFAULT_BRANDING,
  type BriefBranding,
  type BrandingPreset,
} from "@/lib/briefBranding";
import {
  runQaPreview,
  disposeQaRun,
  type QaRunResult,
} from "@/lib/briefQaPreview";
import {
  captureBaseline,
  runVisualDiff,
  downloadHtmlReport,
  downloadPdfReport,
  type VisualDiffRun,
  type PageDiffResult,
} from "@/lib/briefVisualDiff";
import type { Venture } from "@/data/ventures";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  venture: Venture;
  className?: string;
  variant?: "primary" | "ghost";
}

export function BriefDownloadControls({
  venture,
  className = "",
  variant = "primary",
}: Props) {
  const [opacity, setOpacity] = useState(DEFAULT_WATERMARK.opacity);
  const [sizeFraction, setSizeFraction] = useState(
    DEFAULT_WATERMARK.sizeFraction,
  );
  const [forceFallback, setForceFallback] = useState(false);
  const [format, setFormat] = useState<PageFormat>("a4");
  const [orientation, setOrientation] = useState<PageOrientation>("portrait");
  const [busy, setBusy] = useState<
    null | "pdf" | "samples" | "baseline" | "diff"
  >(null);
  const [presets, setPresets] = useState<BrandingPreset[]>(() => listPresets());
  const [activeId, setActiveId] = useState<string>(() => getActivePresetId());
  const [branding, setBranding] = useState<BriefBranding>(() => loadBranding());
  const [integrityWarn, setIntegrityWarn] = useState<IntegrityReport | null>(
    null,
  );
  const [qaRun, setQaRun] = useState<QaRunResult | null>(null);
  const [diffRun, setDiffRun] = useState<VisualDiffRun | null>(null);
  const [diffMessage, setDiffMessage] = useState<string | null>(null);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(() => loadLogoSettings());

  const updateLogo = <K extends keyof LogoSettings>(k: K, v: LogoSettings[K]) => {
    const next = { ...logoSettings, [k]: v };
    setLogoSettings(saveLogoSettings(next));
  };

  useEffect(() => {
    return () => {
      disposeQaRun(qaRun);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPresets = () => {
    setPresets(listPresets());
    setActiveId(getActivePresetId());
    setBranding(loadBranding());
  };

  const handleSelectPreset = (id: string) => {
    setActivePreset(id);
    refreshPresets();
  };

  const handleCreatePreset = () => {
    const name = window.prompt("Name this preset (e.g. 'Acme Group')");
    if (!name) return;
    createPreset(name, branding);
    refreshPresets();
  };

  const handleDeletePreset = (id: string) => {
    if (id === "default") return;
    if (!window.confirm("Delete this branding preset?")) return;
    deletePreset(id);
    refreshPresets();
  };

  const activePreset =
    presets.find((p) => p.id === activeId) ?? presets[0];

  const handleCaptureBaseline = async () => {
    setBusy("baseline");
    setDiffMessage(null);
    try {
      const summary = await captureBaseline(venture, {
        presetId: activeId,
        presetName: activePreset?.name ?? "default",
        branding,
      });
      const total = summary.reduce((s, r) => s + r.pages, 0);
      setDiffMessage(
        `Baseline captured: ${total} page(s) across ${summary.length} format combos.`,
      );
      setDiffRun(null);
    } catch (e) {
      setDiffMessage(`Baseline failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleRunDiff = async () => {
    setBusy("diff");
    setDiffMessage(null);
    try {
      const run = await runVisualDiff(venture, {
        presetId: activeId,
        presetName: activePreset?.name ?? "default",
        branding,
      });
      setDiffRun(run);
      const noBaseline = run.combos.every((c) => !c.hasBaseline);
      if (noBaseline) {
        setDiffMessage(
          "No baseline yet for this preset — use “Capture baseline” first, then re-run.",
        );
      }
    } catch (e) {
      setDiffMessage(`Visual diff failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const watermark: WatermarkOptions = { opacity, sizeFraction, forceFallback };

  const handleDownloadPdf = async () => {
    setBusy("pdf");
    setIntegrityWarn(null);
    try {
      const { integrity } = await downloadVentureBrief(venture, {
        format,
        orientation,
        watermark,
        branding,
        logoScale: logoSettings.pdfScale,
        logoOpacity: logoSettings.pdfOpacity,
      });
      if (!integrity.ok) setIntegrityWarn(integrity);
    } finally {
      setBusy(null);
    }
  };


  const handleGenerateSamples = async () => {
    setBusy("samples");
    setIntegrityWarn(null);
    // Dispose any previous run to release blob URLs.
    disposeQaRun(qaRun);
    setQaRun(null);
    try {
      const run = await runQaPreview(venture, {
        format,
        orientation,
        branding,
        baseWatermark: { opacity, sizeFraction, forceFallback },
      });
      setQaRun(run);
      const bad = run.variants.find((v) => !v.integrity.ok);
      if (bad) setIntegrityWarn(bad.integrity);
    } finally {
      setBusy(null);
    }
  };

  const downloadReport = () => {
    if (!qaRun) return;
    const a = document.createElement("a");
    a.href = qaRun.reportBlobUrl;
    a.download = `${qaRun.ventureSlug}-pdf-qa-report.md`;
    a.click();
  };

  const downloadVariantPdf = (label: string, url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${venture.slug}-brief-sample-${label}.pdf`;
    a.click();
  };

  const downloadThumbnail = (label: string, page: number, url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${venture.slug}-brief-${label}-page${page}.jpg`;
    a.click();
  };

  const updateBrand = <K extends keyof BriefBranding>(k: K, val: BriefBranding[K]) => {
    const next = { ...branding, [k]: val };
    setBranding(next);
    const saved = saveBranding(next);
    // saveBranding may have spawned a fresh Custom preset (when editing
    // the immutable default) — refresh state so the picker reflects it.
    if (saved.id !== activeId) refreshPresets();
  };

  const primaryClass =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      : "inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm font-semibold backdrop-blur transition-transform hover:-translate-y-0.5 hover:bg-background disabled:opacity-60";

  return (
    <div className={`flex w-full flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={busy !== null}
          className={primaryClass}
        >
          {busy === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download brief (PDF)
        </button>


        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Branding"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold backdrop-blur hover:bg-background"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-96 max-w-[90vw] space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Branding presets</p>
              <button
                type="button"
                onClick={handleCreatePreset}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Save current as new
              </button>
            </div>
            <div className="space-y-1.5">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${
                    p.id === activeId
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className="flex-1 text-left text-xs font-medium"
                  >
                    {p.name}
                    {p.id === "default" && (
                      <span className="ml-1 text-[10px] uppercase text-muted-foreground">
                        · built-in
                      </span>
                    )}
                  </button>
                  {p.id !== "default" && (
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(p.id)}
                      aria-label={`Delete preset ${p.name}`}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="font-semibold">Edit active preset</p>
              <button
                type="button"
                onClick={() => {
                  setBranding(DEFAULT_BRANDING);
                  const saved = saveBranding(DEFAULT_BRANDING);
                  if (saved.id !== activeId) refreshPresets();
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset fields
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Editing the built-in default automatically forks a new
              <strong> Custom </strong>preset so the original stays intact.
            </p>
            {([
              ["companyName", "Company name"],
              ["tagline", "Tagline"],
              ["address", "Address"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["web", "Website"],
              ["copyrightHolder", "Copyright holder"],
              ["documentLabel", "Document label"],
              ["confidentialityNote", "Confidentiality note"],
            ] as Array<[keyof BriefBranding, string]>).map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <input
                  type="text"
                  value={branding[k]}
                  onChange={(e) => updateBrand(k, e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </label>
            ))}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="PDF settings"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold backdrop-blur hover:bg-background"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">PDF settings</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-4 p-4 text-sm">
            <div>
              <div className="mb-2 font-semibold">Page</div>
              <div className="flex gap-2">
                {(["a4", "letter"] as PageFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`flex-1 rounded-md border px-2 py-1 text-xs uppercase ${
                      format === f ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                {(["portrait", "landscape"] as PageOrientation[]).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrientation(o)}
                    className={`flex-1 rounded-md border px-2 py-1 text-xs capitalize ${
                      orientation === o ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="wm-opacity" className="font-semibold">
                  Watermark opacity
                </label>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                id="wm-opacity"
                type="range"
                min={0.02}
                max={0.4}
                step={0.01}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="wm-size" className="font-semibold">
                  Watermark size
                </label>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(sizeFraction * 100)}%
                </span>
              </div>
              <input
                id="wm-size"
                type="range"
                min={0.2}
                max={0.95}
                step={0.05}
                value={sizeFraction}
                onChange={(e) => setSizeFraction(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={forceFallback}
                onChange={(e) => setForceFallback(e.target.checked)}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="font-semibold">Force raster fallback</span>
                <span className="block text-xs text-muted-foreground">
                  Required for some Android Chrome and WPS Office viewers.
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={handleGenerateSamples}
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              {busy === "samples" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              Generate 3 QA sample PDFs
            </button>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Logo settings"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold backdrop-blur hover:bg-background"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Logo</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-96 max-w-[92vw] space-y-4 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Logo per surface</p>
              <button
                type="button"
                onClick={() => setLogoSettings(saveLogoSettings(DEFAULT_LOGO_SETTINGS))}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset all
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust the wordmark independently in each context. Header &amp; Footer
              update live; PDF values apply to your next download.
            </p>

            {([
              ["Header (live)", "headerScale", "headerOpacity"],
              ["Footer (live)", "footerScale", "footerOpacity"],
              ["PDF letterhead", "pdfScale", "pdfOpacity"],
            ] as const).map(([label, scaleKey, opKey]) => (
              <fieldset key={label} className="space-y-2 rounded-lg border border-border p-3">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </legend>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor={`logo-${scaleKey}`} className="text-xs font-medium">
                      Scale
                    </label>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {Math.round(logoSettings[scaleKey] * 100)}%
                    </span>
                  </div>
                  <input
                    id={`logo-${scaleKey}`}
                    type="range"
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    value={logoSettings[scaleKey]}
                    onChange={(e) => updateLogo(scaleKey, parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label htmlFor={`logo-${opKey}`} className="text-xs font-medium">
                      Opacity
                    </label>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {Math.round(logoSettings[opKey] * 100)}%
                    </span>
                  </div>
                  <input
                    id={`logo-${opKey}`}
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={logoSettings[opKey]}
                    onChange={(e) => updateLogo(opKey, parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </fieldset>
            ))}
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={handleCaptureBaseline}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold backdrop-blur hover:bg-background disabled:opacity-60"
          title="Snapshot every page across A4/Letter × portrait/landscape for the active preset"
        >
          {busy === "baseline" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Capture baseline</span>
        </button>

        <button
          type="button"
          onClick={handleRunDiff}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold backdrop-blur hover:bg-background disabled:opacity-60"
          title="Render every format combo and diff against baseline"
        >
          {busy === "diff" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitCompare className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Run visual diff</span>
        </button>
      </div>

      {diffMessage && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
          {diffMessage}
        </div>
      )}

      {diffRun && (
        <VisualDiffSection
          run={diffRun}
          onClose={() => setDiffRun(null)}
        />
      )}

      {integrityWarn && !integrityWarn.ok && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              Some pages in your downloaded PDF are missing branding.
            </p>
            <p className="mt-1 text-xs opacity-90">
              The file was still saved, but the following pages didn't render
              the full letterhead / watermark / footer:
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
              {integrityWarn.failures.map((f) => (
                <li key={f.page}>
                  Page {f.page} — missing{" "}
                  {[
                    !f.letterhead && "letterhead",
                    !f.watermark && "watermark",
                    !f.footer && "footer",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs opacity-80">
              Try regenerating; if the issue persists, switch on{" "}
              <strong>Force raster fallback</strong> in PDF settings.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setIntegrityWarn(null)}
            className="rounded-md p-1 hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {qaRun && (
        <section className="rounded-xl border border-border bg-background/60 p-4 backdrop-blur">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">QA preview</h3>
              <p className="text-xs text-muted-foreground">
                {qaRun.variants.length} variants ·{" "}
                {format.toUpperCase()} · {orientation} · generated{" "}
                {new Date(qaRun.generatedAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadReport}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <FileDown className="h-3.5 w-3.5" />
                Download REPORT.md
              </button>
              <button
                type="button"
                onClick={() => {
                  disposeQaRun(qaRun);
                  setQaRun(null);
                }}
                aria-label="Dismiss QA preview"
                className="rounded-full border border-border bg-background p-1.5 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-2 py-1.5">Variant</th>
                  <th className="px-2 py-1.5">Watermark</th>
                  <th className="px-2 py-1.5 text-right">Build</th>
                  <th className="px-2 py-1.5 text-right">Size</th>
                  <th className="px-2 py-1.5 text-right">Pages</th>
                  <th className="px-2 py-1.5 text-center">Markers</th>
                </tr>
              </thead>
              <tbody>
                {qaRun.variants.map((v) => (
                  <tr key={v.label} className="border-t border-border">
                    <td className="px-2 py-1.5 font-mono">{v.label}</td>
                    <td className="px-2 py-1.5">
                      {Math.round(v.watermark.opacity * 100)}% ·{" "}
                      {Math.round(v.watermark.sizeFraction * 100)}%
                      {v.watermark.forceFallback ? " · raster" : ""}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {v.buildMs} ms
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {v.pdfSizeKb} KB
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {v.pages}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {v.integrity.ok ? (
                        <span className="text-emerald-500">✅</span>
                      ) : (
                        <span className="text-destructive">❌</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {qaRun.variants.map((v) => (
              <article
                key={v.label}
                className="rounded-lg border border-border bg-background p-3"
              >
                <header className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold">{v.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadVariantPdf(v.label, v.pdfBlobUrl)}
                    className="shrink-0 rounded-md border border-border p-1.5 hover:bg-muted"
                    title="Download PDF"
                    aria-label={`Download ${v.label} PDF`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </header>
                {v.thumbnails.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {v.thumbnails.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          downloadThumbnail(v.label, idx + 1, src)
                        }
                        className="group relative overflow-hidden rounded-md border border-border bg-muted"
                        title={`Page ${idx + 1} — click to download JPEG`}
                      >
                        <img
                          src={src}
                          alt={`${v.label} page ${idx + 1} preview`}
                          loading="lazy"
                          className="block h-auto w-full"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium opacity-0 transition group-hover:opacity-100">
                          p{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    <ImageIcon className="mr-1 h-3.5 w-3.5" /> preview
                    unavailable
                  </div>
                )}
                <a
                  href={v.pdfBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-center text-[11px] text-primary hover:underline"
                >
                  Open PDF in new tab ↗
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ───────────────────────── Visual diff viewer ─────────────────────────

function statusBadge(status: PageDiffResult["status"]) {
  const map: Record<
    PageDiffResult["status"],
    { label: string; cls: string }
  > = {
    match: {
      label: "Match",
      cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    mismatch: {
      label: "Mismatch",
      cls: "bg-destructive/15 text-destructive",
    },
    added: {
      label: "Added",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    missing: {
      label: "Missing",
      cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    "no-baseline": {
      label: "No baseline",
      cls: "bg-muted text-muted-foreground",
    },
  };
  const m = map[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function VisualDiffSection({
  run,
  onClose,
}: {
  run: VisualDiffRun;
  onClose: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-background/60 p-4 backdrop-blur">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Visual regression</h3>
          <p className="text-xs text-muted-foreground">
            Preset <strong>{run.presetName}</strong> · {run.totalCompared}{" "}
            page(s) compared ·{" "}
            <span
              className={
                run.totalMismatched === 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }
            >
              {run.totalMismatched} mismatched
            </span>{" "}
            · generated {new Date(run.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadHtmlReport(run)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <FileDown className="h-3.5 w-3.5" /> HTML report
          </button>
          <button
            type="button"
            onClick={() => downloadPdfReport(run)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <FileDown className="h-3.5 w-3.5" /> PDF report
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="rounded-full border border-border bg-background p-1.5 hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {run.combos.map((c) => {
          const flagged = c.pages.filter((p) => p.status !== "match");
          return (
            <article
              key={c.combo}
              className="rounded-lg border border-border bg-background p-3"
            >
              <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-sm font-semibold uppercase">
                  {c.format} · {c.orientation}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.pages.length} page(s) · build {c.buildMs} ms ·{" "}
                  {c.hasBaseline ? (
                    c.pagesMismatched === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        all match
                      </span>
                    ) : (
                      <span className="text-destructive">
                        {c.pagesMismatched} flagged
                      </span>
                    )
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      no baseline
                    </span>
                  )}
                </div>
              </header>

              {(flagged.length === 0 ? c.pages.slice(0, 1) : flagged).map(
                (p) => (
                  <div
                    key={p.page}
                    className="mt-3 border-t border-border pt-3 first:mt-0 first:border-0 first:pt-0"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Page {p.page}</span>
                        {statusBadge(p.status)}
                      </div>
                      <span className="tabular-nums text-muted-foreground">
                        {p.mismatchPct}% pixels differ
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <DiffCell label="Baseline" src={p.baseline} />
                      <DiffCell label="Current" src={p.current} />
                      <DiffCell label="Diff" src={p.diff} highlight />
                    </div>
                  </div>
                ),
              )}
              {flagged.length === 0 && c.pages.length > 1 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Showing page 1 — every page in this combo matches the
                  baseline.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DiffCell({
  label,
  src,
  highlight,
}: {
  label: string;
  src: string | null;
  highlight?: boolean;
}) {
  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </figcaption>
      {src ? (
        <a
          href={src}
          download={`brief-${label.toLowerCase()}.png`}
          className="block overflow-hidden rounded-md border border-border bg-muted"
        >
          <img
            src={src}
            alt={`${label} preview`}
            loading="lazy"
            className={`block h-auto w-full ${
              highlight ? "bg-white" : ""
            }`}
          />
        </a>
      ) : (
        <div className="flex aspect-[1/1.4] items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">
          n/a
        </div>
      )}
    </figure>
  );
}
