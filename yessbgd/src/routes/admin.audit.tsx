import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useSession, signOut as authSignOut } from "next-auth/react";
import { listAuditLogsAction } from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { LogOut, RefreshCw, Filter } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminAudit,
});

type AuditRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
};

const ACTION_STYLES: Record<string, string> = {
  INSERT: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  UPDATE: "bg-primary/15 text-primary border-primary/30",
  DELETE: "bg-destructive/10 text-destructive border-destructive/30",
};
const DEFAULT_ACTION_STYLE = "bg-secondary text-muted-foreground border-border";

function diffSummary(row: AuditRow): string {
  if (row.action === "INSERT" || row.action.toLowerCase().includes("create")) return "Created";
  if (row.action === "DELETE" || row.action.toLowerCase().includes("delete")) return "Removed";
  const before = (row.old_data ?? {}) as Record<string, unknown>;
  const after = (row.new_data ?? row.details ?? {}) as Record<string, unknown>;
  const changes: string[] = [];
  for (const k of Object.keys(after)) {
    if (k === "status_updated_at") continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      changes.push(k);
    }
  }
  if (changes.length) return `Updated: ${changes.join(", ")}`;
  return row.action || "Updated";
}

function mapAuditRow(raw: Record<string, unknown>): AuditRow {
  const details =
    raw.details && typeof raw.details === "object" && !Array.isArray(raw.details)
      ? (raw.details as Record<string, unknown>)
      : null;
  return {
    id: String(raw.id),
    created_at: String(raw.created_at ?? ""),
    actor_id: (raw.user_id as string) ?? (raw.actor_id as string) ?? null,
    action: String(raw.action ?? ""),
    table_name: String(raw.entity ?? raw.table_name ?? ""),
    record_id: (raw.entity_id as string) ?? (raw.record_id as string) ?? null,
    old_data:
      (details?.before as Record<string, unknown>) ??
      (details?.old_data as Record<string, unknown>) ??
      (raw.old_data as Record<string, unknown>) ??
      null,
    new_data:
      (details?.after as Record<string, unknown>) ??
      (details?.new_data as Record<string, unknown>) ??
      (raw.new_data as Record<string, unknown>) ??
      null,
    details,
  };
}

function AdminAudit() {
  const navigate = useNavigate();
  const { data: session, status: authStatus } = useSession();
  const authChecked = authStatus === "authenticated" && !!session?.user;
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    setError(null);
    const result = await listAuditLogsAction();
    if (!result.ok) {
      setError(result.error);
      setRows([]);
      return;
    }
    setRows((result.rows ?? []).map((r) => mapAuditRow(r as Record<string, unknown>)));
  };

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!session?.user) {
      navigate({ to: "/admin/login" });
      return;
    }
    void load();
  }, [authStatus, session, navigate]);

  const signOut = async () => {
    await authSignOut({ redirect: false });
    navigate({ to: "/admin/login" });
  };

  const tables = useMemo(() => {
    const s = new Set<string>();
    (rows ?? []).forEach((r) => {
      if (r.table_name) s.add(r.table_name);
    });
    return Array.from(s).sort();
  }, [rows]);

  const filtered = (rows ?? []).filter((r) => {
    if (table !== "all" && r.table_name !== table) return false;
    if (action !== "all" && r.action !== action) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = JSON.stringify({
        ...r.old_data,
        ...r.new_data,
        ...r.details,
        id: r.record_id,
      }).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (!authChecked) {
    return (
      <section className="py-24">
        <div>Loading…</div>
      </section>
    );
  }

  return (
    <>
      <AdminPageHeader title="Audit log" description="Every database change to applications, messages, and roles. Last 500 events." />
      <section>
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {rows ? `${filtered.length} of ${rows.length} event${rows.length === 1 ? "" : "s"}` : "Loading…"}
            </div>
            <div className="flex gap-2">
              <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 rounded-2xl glass-card p-4 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="inline h-3 w-3 mr-1" /> Table
              </label>
              <select
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All tables</option>
                {tables.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All actions</option>
                <option value="INSERT">Insert</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Search</label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Field, value, ID…"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {rows && filtered.length === 0 && !error && (
            <div className="rounded-2xl glass-card p-10 text-center text-sm text-muted-foreground">
              No events match your filters.
            </div>
          )}

          <div className="grid gap-3">
            {filtered.map((r) => (
              <article key={r.id} className="rounded-2xl glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ACTION_STYLES[r.action] ?? DEFAULT_ACTION_STYLE}`}
                    >
                      {r.action}
                    </span>
                    <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono">{r.table_name || "—"}</code>
                    {r.record_id && (
                      <code className="text-xs text-muted-foreground font-mono">#{r.record_id.slice(0, 8)}</code>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <p className="mt-2 text-sm text-foreground/85">{diffSummary(r)}</p>
                {(r.new_data || r.old_data || r.details) && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-primary">View payload</summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary/60 p-3 text-[11px] leading-relaxed">
                      {JSON.stringify(
                        { before: r.old_data, after: r.new_data, details: r.details },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                )}
                {r.actor_id && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Actor: <code className="font-mono">{r.actor_id.slice(0, 8)}…</code>
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
