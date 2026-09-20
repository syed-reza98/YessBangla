import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  deleteMessagesAction,
  listMessagesAction,
  updateMessagesAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useDashboardRole, useProfile } from "@/lib/adminAccess";
import { CheckCircle2, Mail, Phone, RefreshCw, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Contact messages — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminMessages,
});

export type MessageStatus = "new" | "read" | "replied" | "archived";
const STATUSES: MessageStatus[] = ["new", "read", "replied", "archived"];
const STATUS_LABEL: Record<MessageStatus, string> = {
  new: "New · নতুন",
  read: "Read · পড়া হয়েছে",
  replied: "Replied · উত্তর দেওয়া",
  archived: "Archived · আর্কাইভ",
};
const STATUS_STYLE: Record<MessageStatus, string> = {
  new: "border-primary/30 bg-primary/10 text-primary",
  read: "border-border bg-secondary text-muted-foreground",
  replied: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "border-border bg-secondary/60 text-muted-foreground",
};

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  created_at: string;
  status: MessageStatus | null;
  status_note: string | null;
  status_updated_at: string | null;
};

type SortKey = "newest" | "oldest" | "name" | "status";

function AdminMessages() {
  const { can } = useDashboardRole();
  const { profile } = useProfile();
  const canEdit = can("messages");

  const [items, setItems] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MessageStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError(null);
    const result = await listMessagesAction();
    if (!result.ok) {
      setError(result.error);
      setItems([]);
      return;
    }
    setItems((result.rows ?? []) as Message[]);
  };

  useEffect(() => {
    void load();
  }, []);

  /* ------------------------------ inline edits ----------------------------- */

  const patchLocal = (id: string, patch: Partial<Message>) =>
    setItems((list) => list?.map((m) => (m.id === id ? { ...m, ...patch } : m)) ?? null);

  const saveFields = async (id: string, patch: Partial<Message>) => {
    const before = items?.find((m) => m.id === id);
    patchLocal(id, patch);
    const result = await updateMessagesAction({ ids: [id], patch });
    if (!result.ok) {
      setError(result.error);
      if (before) patchLocal(id, before);
    }
  };

  const removeItem = async (m: Message) => {
    if (!confirm(`Delete message from ${m.name}? · বার্তাটি মুছবেন?`)) return;
    const result = await deleteMessagesAction({ ids: [m.id] });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) => prev?.filter((x) => x.id !== m.id) ?? null);
    setSelected((s) => s.filter((x) => x !== m.id));
  };

  /* ------------------------------ bulk actions ----------------------------- */

  const bulkStatus = async (next: MessageStatus) => {
    if (selected.length === 0) return;
    setBusy(true);
    const result = await updateMessagesAction({ ids: selected, patch: { status: next } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((list) => list?.map((m) => (selected.includes(m.id) ? { ...m, status: next } : m)) ?? null);
    setSelected([]);
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} message(s)? · ${selected.length}টি বার্তা মুছবেন?`)) return;
    setBusy(true);
    const result = await deleteMessagesAction({ ids: selected });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((list) => list?.filter((m) => !selected.includes(m.id)) ?? null);
    setSelected([]);
  };

  /* -------------------------- search / filter / sort ------------------------ */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (items ?? []).filter((m) => {
      if (status !== "all" && (m.status ?? "new") !== status) return false;
      if (!q) return true;
      return `${m.name} ${m.email} ${m.phone ?? ""} ${m.subject ?? ""} ${m.message}`
        .toLowerCase()
        .includes(q);
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "status") return (a.status ?? "new").localeCompare(b.status ?? "new");
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
    return sorted;
  }, [items, query, status, sort]);

  const perPage = profile?.items_per_page ?? 25;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, status, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const allVisibleSelected = visible.length > 0 && visible.every((m) => selected.includes(m.id));

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: (items ?? []).length };
    for (const s of STATUSES) out[s] = (items ?? []).filter((m) => (m.status ?? "new") === s).length;
    return out;
  }, [items]);

  const inputCls =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <>
      <AdminPageHeader
        title="Contact messages"
        titleBn="যোগাযোগ বার্তা"
        description="খুঁজুন, ফিল্টার করুন, স্ট্যাটাস বদলান — একসাথে অনেকগুলোও।"
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Search · খুঁজুন
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, ইমেইল, বিষয়, বার্তা…"
            className={`${inputCls} w-full`}
          />
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status · অবস্থা
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MessageStatus | "all")}
            className={inputCls}
          >
            <option value="all">All ({counts.all ?? 0})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]} ({counts[s] ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sort · সাজান
          </span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={inputCls}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="status">Status</option>
          </select>
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          {items ? `${filtered.length} / ${items.length}` : "Loading…"}
        </div>
      </div>

      {/* Bulk action bar */}
      {canEdit && selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <span className="font-semibold">{selected.length} selected · নির্বাচিত</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={busy}
              onClick={() => bulkStatus(s)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
            >
              Mark {STATUS_LABEL[s]}
            </button>
          ))}
          <button
            disabled={busy}
            onClick={bulkDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button
            onClick={() => setSelected([])}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      {canEdit && visible.length > 0 && (
        <label className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(e) =>
              setSelected((s) =>
                e.target.checked
                  ? Array.from(new Set([...s, ...visible.map((m) => m.id)]))
                  : s.filter((id) => !visible.some((m) => m.id === id)),
              )
            }
          />
          Select all on this page · এই পাতার সব
        </label>
      )}

      {items && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          কোনো বার্তা পাওয়া যায়নি।
        </div>
      )}

      <div className="grid gap-4">
        {visible.map((m) => {
          const st = (m.status ?? "new") as MessageStatus;
          return (
            <article key={m.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {canEdit && (
                    <input
                      type="checkbox"
                      aria-label={`Select message from ${m.name}`}
                      className="mt-1.5"
                      checked={selected.includes(m.id)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, m.id] : s.filter((x) => x !== m.id)))
                      }
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold">{m.name}</h3>
                    {m.subject && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{m.subject}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLE[st]}`}
                  >
                    {st}
                  </span>
                  {canEdit && (
                    <>
                      <select
                        value={st}
                        aria-label="Change status"
                        onChange={(e) => saveFields(m.id, { status: e.target.value as MessageStatus })}
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveFields(m.id, { status: "replied" })}
                        title="Mark replied"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Replied
                      </button>
                      <button
                        onClick={() => removeItem(m)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                  <Mail className="h-3.5 w-3.5" /> {m.email}
                </a>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" /> {m.phone}
                  </a>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{m.message}</p>

              {canEdit && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Internal note · অভ্যন্তরীণ নোট
                  </label>
                  <textarea
                    defaultValue={m.status_note ?? ""}
                    rows={2}
                    placeholder="কে ফলো-আপ করছে, কী সিদ্ধান্ত হলো…"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (m.status_note ?? "")) saveFields(m.id, { status_note: v || null });
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    ফোকাস সরালেই সেভ হয়ে যায়।
                    {m.status_updated_at && ` · শেষ আপডেট ${new Date(m.status_updated_at).toLocaleString()}`}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
