import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useDashboardRole } from "@/lib/adminAccess";
import {
  BACKUP_TABLES,
  type BackupFile,
  type BackupTable,
  type DateRange,
  type TableResult,
  backupFilename,
  buildBackup,
  downloadBlob,
  isoDay,
  parseBackup,
  restoreBackup,
  shiftDays,
  toCsv,
  todayRange,
} from "@/lib/dataBackup";
import { Download, Upload, RefreshCw, CalendarDays, FileJson, Table2, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/data")({
  head: () => ({
    meta: [
      { title: "Data backup — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminData,
});

const GROUPS: { key: BackupTable["group"]; label: string; labelBn: string }[] = [
  { key: "content", label: "Content", labelBn: "কনটেন্ট" },
  { key: "operations", label: "Operations", labelBn: "অপারেশন" },
  { key: "system", label: "System", labelBn: "সিস্টেম" },
];

const card = "rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur";
const btn =
  "inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50";
const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50";

function AdminData() {
  const { role, can, isLoading } = useDashboardRole();
  const [range, setRange] = useState<DateRange>(todayRange());
  const [allTime, setAllTime] = useState(false);
  const [selected, setSelected] = useState<string[]>(BACKUP_TABLES.map((t) => t.name));
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<TableResult[] | null>(null);
  const [mode, setMode] = useState<"export" | "import" | null>(null);
  const [pending, setPending] = useState<{ file: BackupFile; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allowed = useMemo(
    () =>
      BACKUP_TABLES.filter((t) =>
        t.group === "operations" ? can("applications") || can("messages") : t.group === "system" ? can("audit") : can("content"),
      ),
    [can],
  );

  const effectiveRange: DateRange = allTime ? { from: null, to: null } : range;
  const chosen = allowed.filter((t) => selected.includes(t.name));

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const runExport = async (kind: "json" | "csv") => {
    setError(null);
    setResults(null);
    setMode("export");
    try {
      const { file, results: res } = await buildBackup(chosen, effectiveRange, (t) => setBusy(t));
      setResults(res);
      if (kind === "json") {
        downloadBlob(JSON.stringify(file, null, 2), backupFilename(effectiveRange, "json"), "application/json");
      } else {
        const parts = chosen
          .map((t) => {
            const csv = toCsv(file.tables[t.name] ?? []);
            return csv ? `### ${t.name}\n${csv}` : "";
          })
          .filter(Boolean)
          .join("\n\n");
        downloadBlob(parts || "no data", backupFilename(effectiveRange, "csv"), "text/csv");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const onPickFile = async (f: File | null) => {
    if (!f) return;
    setError(null);
    setResults(null);
    try {
      const file = parseBackup(await f.text());
      setPending({ file, name: f.name });
      setSelected(Object.keys(file.tables).filter((n) => allowed.some((t) => t.name === n)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const runImport = async () => {
    if (!pending) return;
    if (!window.confirm("এই ফাইলের ডাটা সাইটে যুক্ত/আপডেট হবে। চালিয়ে যাবেন?")) return;
    setError(null);
    setMode("import");
    try {
      const names = Object.keys(pending.file.tables).filter((n) => selected.includes(n));
      const res = await restoreBackup(pending.file, names, (t) => setBusy(t));
      setResults(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (role !== "admin") {
    return (
      <div className={card}>
        <div className="flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <span>এই পেইজটি শুধুমাত্র অ্যাডমিনিস্ট্রেটরের জন্য।</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Data backup"
        titleBn="ডাটা ডাউনলোড ও আপলোড"
        description="প্রতিদিনের (বা যেকোনো তারিখ পরিসরের) সাইট ডাটা JSON/CSV ফাইলে ডাউনলোড করুন, এবং প্রয়োজনে সেই ফাইল আপলোড করে ডাটা ফিরিয়ে আনুন।"
        actions={
          <button className={btn} onClick={() => { setResults(null); setPending(null); setError(null); }}>
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* ------------------------------ date range ----------------------------- */}
        <section className={card}>
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" /> তারিখ নির্বাচন
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">ডিফল্টভাবে আজকের ডাটা নির্বাচিত।</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <button className={btn} onClick={() => { setAllTime(false); setRange(todayRange()); }}>আজ</button>
            <button
              className={btn}
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setAllTime(false);
                setRange({ from: isoDay(d), to: isoDay(d) });
              }}
            >
              গতকাল
            </button>
            <button className={btn} onClick={() => { setAllTime(false); setRange(shiftDays(7)); }}>শেষ ৭ দিন</button>
            <button className={btn} onClick={() => { setAllTime(false); setRange(shiftDays(30)); }}>শেষ ৩০ দিন</button>
            <button className={`${btn} ${allTime ? "border-primary/60 bg-primary/10 text-primary" : ""}`} onClick={() => setAllTime(true)}>
              সব সময়
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">শুরু</span>
              <input
                type="date"
                value={range.from ?? ""}
                disabled={allTime}
                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 disabled:opacity-50"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">শেষ</span>
              <input
                type="date"
                value={range.to ?? ""}
                disabled={allTime}
                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 disabled:opacity-50"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className={btnPrimary} disabled={!!busy || !chosen.length} onClick={() => runExport("json")}>
              <FileJson className="h-4 w-4" /> JSON ডাউনলোড
            </button>
            <button className={btn} disabled={!!busy || !chosen.length} onClick={() => runExport("csv")}>
              <Table2 className="h-4 w-4" /> CSV ডাউনলোড
            </button>
          </div>
        </section>

        {/* -------------------------------- tables ------------------------------- */}
        <section className={card}>
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
            <Download className="h-4 w-4 text-primary" /> কোন ডাটা?
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {chosen.length} / {allowed.length} টেবিল নির্বাচিত
            <button className="ml-3 underline" onClick={() => setSelected(allowed.map((t) => t.name))}>সব</button>
            <button className="ml-3 underline" onClick={() => setSelected([])}>কিছু না</button>
          </p>

          <div className="space-y-4">
            {GROUPS.map((g) => {
              const items = allowed.filter((t) => t.group === g.key);
              if (!items.length) return null;
              return (
                <div key={g.key}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {g.label} · {g.labelBn}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((t) => (
                      <label
                        key={t.name}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(t.name)}
                          onChange={() => toggle(t.name)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span>{t.labelBn}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* -------------------------------- upload ------------------------------- */}
        <section className={card}>
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
            <Upload className="h-4 w-4 text-primary" /> ডাটা আপলোড (রিস্টোর)
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            আগে ডাউনলোড করা JSON ব্যাকআপ ফাইল আপলোড করুন। একই আইডির রেকর্ড আপডেট হবে, নতুনগুলো যুক্ত হবে।
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> ফাইল নির্বাচন
            </button>
            {pending && (
              <button className={btnPrimary} disabled={!!busy} onClick={runImport}>
                <CheckCircle2 className="h-4 w-4" /> আপলোড শুরু করুন
              </button>
            )}
          </div>

          {pending && (
            <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
              <p className="font-medium">{pending.name}</p>
              <p className="text-muted-foreground">
                এক্সপোর্ট: {new Date(pending.file.exported_at).toLocaleString()}
              </p>
              <ul className="mt-2 space-y-1">
                {Object.entries(pending.file.tables).map(([name, rows]) => {
                  const meta = BACKUP_TABLES.find((t) => t.name === name);
                  const allowedTable = allowed.some((t) => t.name === name);
                  return (
                    <li key={name} className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!allowedTable}
                          checked={selected.includes(name)}
                          onChange={() => toggle(name)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span>{meta?.labelBn ?? name}</span>
                      </label>
                      <span className="text-muted-foreground">{rows.length} সারি</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* -------------------------------- result ------------------------------- */}
        <section className={card}>
          <h2 className="mb-3 font-display text-lg font-semibold">ফলাফল</h2>
          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" /> {mode === "import" ? "আপলোড" : "ডাউনলোড"} চলছে… ({busy})
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4" /> {error}
            </p>
          )}
          {!busy && !results && !error && (
            <p className="text-sm text-muted-foreground">এখনো কোনো কাজ চালানো হয়নি।</p>
          )}
          {results && (
            <ul className="space-y-1 text-sm">
              {results.map((r) => {
                const meta = BACKUP_TABLES.find((t) => t.name === r.table);
                return (
                  <li key={r.table} className="flex items-center justify-between gap-3">
                    <span>{meta?.labelBn ?? r.table}</span>
                    {r.error ? (
                      <span className="text-destructive">{r.error}</span>
                    ) : (
                      <span className="text-muted-foreground">{r.count} সারি</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
