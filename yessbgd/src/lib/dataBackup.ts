// Site-wide data backup helpers — daily export (download) and restore (upload).
import { exportBackupTablesAction } from "@/actions/cms";

export type BackupTable = {
  name: string;
  label: string;
  labelBn: string;
  dateColumn: string;
  conflictKey: string;
  group: "content" | "operations" | "system";
};

export const BACKUP_TABLES: BackupTable[] = [
  { name: "cms_site_pages", label: "Site pages", labelBn: "সাইট পেইজ", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "cms_pages", label: "Page blocks", labelBn: "পেইজ ব্লক", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "cms_ventures", label: "Ventures", labelBn: "ভেঞ্চার", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "cms_services", label: "Services", labelBn: "সার্ভিস", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "cms_industries", label: "Industries", labelBn: "ইন্ডাস্ট্রি", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "cms_insights", label: "Insights", labelBn: "ইনসাইট", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "cms_menu_items", label: "Menus", labelBn: "মেনু", dateColumn: "created_at", conflictKey: "id", group: "content" },
  { name: "cms_media", label: "Media library", labelBn: "ইমেজ গ্যালারি", dateColumn: "created_at", conflictKey: "id", group: "content" },
  { name: "cms_settings", label: "Site settings", labelBn: "সাইট সেটিংস", dateColumn: "updated_at", conflictKey: "id", group: "content" },
  { name: "job_applications", label: "Job applications", labelBn: "চাকরির আবেদন", dateColumn: "created_at", conflictKey: "id", group: "operations" },
  { name: "contact_messages", label: "Contact messages", labelBn: "যোগাযোগ বার্তা", dateColumn: "created_at", conflictKey: "id", group: "operations" },
  { name: "audit_logs", label: "Audit log", labelBn: "অডিট লগ", dateColumn: "created_at", conflictKey: "id", group: "system" },
];

export type DateRange = { from: string | null; to: string | null };

export type BackupFile = {
  format: "yess-site-backup";
  version: 1;
  exported_at: string;
  range: DateRange;
  tables: Record<string, Record<string, unknown>[]>;
};

export type TableResult = { table: string; count: number; error?: string };

export function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayRange(): DateRange {
  const t = isoDay(new Date());
  return { from: t, to: t };
}

export function shiftDays(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: isoDay(from), to: isoDay(to) };
}

function bounds(range: DateRange) {
  const start = range.from ? new Date(`${range.from}T00:00:00`) : null;
  const end = range.to ? new Date(`${range.to}T23:59:59.999`) : null;
  return { start: start?.getTime() ?? null, end: end?.getTime() ?? null };
}

function rowDate(row: Record<string, unknown>, col: string): number | null {
  const camel = col.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  const v = row[col] ?? row[camel];
  if (!v) return null;
  const t = new Date(v as string | Date).getTime();
  return Number.isNaN(t) ? null : t;
}

export async function fetchTable(table: BackupTable, range: DateRange) {
  const res = await exportBackupTablesAction();
  if (!res.ok) throw new Error(res.error);
  const all = (res.tables[table.name] ?? []) as Record<string, unknown>[];
  const { start, end } = bounds(range);
  if (!start && !end) return all;
  return all.filter((row) => {
    const t = rowDate(row, table.dateColumn);
    if (t == null) return true;
    if (start != null && t < start) return false;
    if (end != null && t > end) return false;
    return true;
  });
}

export async function buildBackup(
  tables: BackupTable[],
  range: DateRange,
  onProgress?: (table: string) => void,
): Promise<{ file: BackupFile; results: TableResult[] }> {
  const out: BackupFile = {
    format: "yess-site-backup",
    version: 1,
    exported_at: new Date().toISOString(),
    range,
    tables: {},
  };
  const results: TableResult[] = [];
  for (const t of tables) {
    onProgress?.(t.name);
    try {
      const rows = await fetchTable(t, range);
      out.tables[t.name] = rows;
      results.push({ table: t.name, count: rows.length });
    } catch (e) {
      out.tables[t.name] = [];
      results.push({
        table: t.name,
        count: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { file: out, results };
}

export function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

export function backupFilename(range: DateRange, ext: string) {
  const tag =
    range.from && range.to
      ? range.from === range.to
        ? range.from
        : `${range.from}_${range.to}`
      : "all";
  return `yess-data-${tag}.${ext}`;
}

export function parseBackup(text: string): BackupFile {
  const json = JSON.parse(text) as Partial<BackupFile>;
  if (!json || typeof json !== "object" || !json.tables || typeof json.tables !== "object") {
    throw new Error("ফাইলটি সঠিক ব্যাকআপ ফাইল নয়।");
  }
  return {
    format: "yess-site-backup",
    version: 1,
    exported_at: json.exported_at ?? new Date().toISOString(),
    range: json.range ?? { from: null, to: null },
    tables: json.tables as Record<string, Record<string, unknown>[]>,
  };
}

/** Full JSON upsert restore is not supported post-MySQL cutover. */
export async function restoreBackup(
  _file: BackupFile,
  _tableNames: string[],
  _onProgress?: (table: string) => void,
): Promise<TableResult[]> {
  return [
    {
      table: "_",
      count: 0,
      error:
        "Restore via JSON upsert is disabled after MySQL cutover — re-import with admin CMS or SQL.",
    },
  ];
}
