import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  deleteCmsTypeAction,
  listCmsTypeAction,
  setCmsPublishedAction,
  type CmsListType,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { getCmsConfig } from "@/lib/cmsSchema";
import { AdminTableSkeleton, AdminLoadingState } from "@/components/admin/AdminLoading";
import { Plus, Eye, EyeOff, Trash2, Pencil, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/cms/$type/")({
  head: () => ({
    meta: [
      { title: "CMS — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  pendingMs: 150,
  pendingMinMs: 200,
  pendingComponent: () => <AdminLoadingState />,
  component: AdminCmsList,
});

type Row = Record<string, unknown> & { id: string; is_published?: boolean };

function AdminCmsList() {
  const { type } = useParams({ from: "/admin/cms/$type/" });
  const navigate = useNavigate();
  const { data: session, status: authStatus } = useSession();
  const cfg = useMemo(() => getCmsConfig(type), [type]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      if (authStatus === "loading") return;
      if (!session?.user) {
        navigate({ to: "/admin/login" });
        return;
      }
      if (!cfg) {
        setError("Unknown content type");
        return;
      }
      const result = await listCmsTypeAction({ type: type as CmsListType });
      if (!result.ok) {
        setError(result.error);
        setRows([]);
        return;
      }
      setRows((result.rows ?? []) as Row[]);
    })();
  }, [cfg, navigate, session, authStatus, type]);

  if (!cfg) {
    return (
      <section>
        <div>
          <p className="text-sm text-destructive">Unknown CMS type: {type}</p>
          <Link to="/admin/cms" className="mt-4 inline-block text-sm text-primary">
            ← Back to CMS
          </Link>
        </div>
      </section>
    );
  }

  const togglePublish = async (row: Row) => {
    const next = !row.is_published;
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, is_published: next } : r)) ?? null);
    const result = await setCmsPublishedAction({
      type: type as CmsListType,
      id: row.id,
      is_published: next,
    });
    if (!result.ok) {
      alert(result.error);
      setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, is_published: !next } : r)) ?? null);
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${String(row.title ?? row.id)}"? This cannot be undone.`)) return;
    const result = await deleteCmsTypeAction({ type: type as CmsListType, id: row.id });
    if (!result.ok) {
      alert(result.error);
      return;
    }
    setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? null);
  };

  const filtered = (rows ?? []).filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return cfg.listColumns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q));
  });

  return (
    <>
      <AdminPageHeader title={cfg.label} description={cfg.description} />
      <section>
        <div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/admin/cms"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> All content
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter…"
                className="rounded-lg border border-glass-border bg-white/60 px-3 py-1.5 text-sm outline-none focus:border-primary dark:bg-white/5"
              />
              <Link
                to="/admin/cms/$type/$id"
                params={{ type, id: "new" }}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                <Plus className="h-4 w-4" /> New {cfg.label.slice(0, -1)}
              </Link>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {!rows && !error && <AdminTableSkeleton cols={cfg.listColumns.length + 2} />}
          {rows && filtered.length === 0 && (
            <div className="rounded-2xl glass-card p-8 text-center text-sm text-muted-foreground">
              কোন এন্ট্রি নেই। উপরে "New" বোতাম চেপে যোগ করুন।
            </div>
          )}
          {filtered.length > 0 && (
            <div className="overflow-x-auto rounded-2xl glass-card">
              <table className="w-full text-sm">
                <thead className="border-b border-glass-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {cfg.listColumns.map((c) => (
                      <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
                    ))}
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b border-glass-border/50 last:border-0">
                      {cfg.listColumns.map((c) => (
                        <td key={c.key} className="px-4 py-3">
                          {String(row[c.key] ?? "—")}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                            row.is_published
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => togglePublish(row)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={row.is_published ? "Unpublish" : "Publish"}
                          >
                            {row.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <Link
                            to="/admin/cms/$type/$id"
                            params={{ type, id: row.id }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => remove(row)}
                            className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
