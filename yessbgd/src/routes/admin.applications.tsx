import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession, signOut as authSignOut } from "next-auth/react";
import {
  deleteApplicationsAction,
  listApplicationsAction,
  updateApplicationsAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Download, LogOut, Mail, Phone, Linkedin, FileText, Trash2, RefreshCw } from "lucide-react";

type Status =
  | "Submitted"
  | "Under review"
  | "Interview"
  | "Offer"
  | "Hired"
  | "On hold"
  | "Rejected"
  | "New"
  | "Reviewed";
const STATUSES: Status[] = [
  "Submitted",
  "Under review",
  "Interview",
  "Offer",
  "Hired",
  "On hold",
  "Rejected",
];
const STATUS_STYLES: Record<Status, string> = {
  Submitted: "bg-primary/15 text-primary border-primary/30",
  "Under review": "bg-primary/15 text-primary border-primary/30",
  Interview: "bg-accent/15 text-accent-foreground border-accent/30",
  Offer: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Hired: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "On hold": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
  New: "bg-primary/15 text-primary border-primary/30",
  Reviewed: "bg-primary/15 text-primary border-primary/30",
};

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Job applications — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminApplications,
});

type Application = {
  id: string;
  job_slug: string;
  job_title: string;
  full_name: string;
  email: string;
  phone: string;
  linkedin: string | null;
  cover_letter: string;
  resume_path: string;
  resume_name: string;
  resume_size: number;
  resume_type: string;
  created_at: string;
  status: Status;
  status_note: string | null;
  status_updated_at: string;
};

type ResumeKind = "all" | "pdf" | "doc" | "other";

function classifyResume(a: Application): Exclude<ResumeKind, "all"> {
  const t = (a.resume_type || "").toLowerCase();
  const n = (a.resume_name || "").toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (
    t.includes("msword") ||
    t.includes("wordprocessingml") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx")
  )
    return "doc";
  return "other";
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminApplications() {
  const navigate = useNavigate();
  const { data: session, status: authStatus } = useSession();
  const [items, setItems] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ResumeKind>("all");
  const [minKB, setMinKB] = useState<string>("");
  const [maxKB, setMaxKB] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "name" | "status" | "role">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const authChecked = authStatus === "authenticated" && !!session?.user;

  const load = async () => {
    setError(null);
    const result = await listApplicationsAction();
    if (!result.ok) {
      setError(result.error);
      setItems([]);
      return;
    }
    setItems((result.rows ?? []) as Application[]);
  };

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!session?.user) {
      navigate({ to: "/admin/login" });
      return;
    }
    void load();
  }, [authStatus, session, navigate]);

  const downloadResume = async (path: string, name: string) => {
    // Paths may be "/uploads/resumes/file.pdf" or "job-slug/file.pdf" (legacy)
    const cleaned = path.replace(/^\/?uploads\/resumes\//, "").replace(/^\//, "");
    const href = `/api/admin/resumes/${cleaned
      .split("/")
      .map((s) => encodeURIComponent(s))
      .join("/")}`;
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeItem = async (app: Application) => {
    if (!confirm(`Delete application from ${app.full_name}? This also removes their CV.`)) return;
    const result = await deleteApplicationsAction({ ids: [app.id] });
    if (!result.ok) {
      alert(result.error);
      return;
    }
    setItems((prev) => prev?.filter((x) => x.id !== app.id) ?? null);
  };

  const updateStatus = async (app: Application, status: Status) => {
    const prev = app.status;
    setItems((list) => list?.map((x) => (x.id === app.id ? { ...x, status } : x)) ?? null);
    const result = await updateApplicationsAction({ ids: [app.id], patch: { status } });
    if (!result.ok) {
      alert(result.error);
      setItems((list) => list?.map((x) => (x.id === app.id ? { ...x, status: prev } : x)) ?? null);
    }
  };

  /* ------------------------------ bulk actions ----------------------------- */

  const bulkStatus = async (status: Status) => {
    if (selected.length === 0) return;
    setBulkBusy(true);
    const result = await updateApplicationsAction({ ids: selected, patch: { status } });
    setBulkBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((list) => list?.map((x) => (selected.includes(x.id) ? { ...x, status } : x)) ?? null);
    setSelected([]);
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} application(s) and their CVs? · ${selected.length}টি আবেদন মুছবেন?`))
      return;
    setBulkBusy(true);
    const result = await deleteApplicationsAction({ ids: selected });
    setBulkBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((list) => list?.filter((x) => !selected.includes(x.id)) ?? null);
    setSelected([]);
  };

  const updateNote = async (app: Application, status_note: string) => {
    const prev = app.status_note;
    setItems((list) =>
      list?.map((x) => (x.id === app.id ? { ...x, status_note } : x)) ?? null,
    );
    const result = await updateApplicationsAction({
      ids: [app.id],
      patch: { status_note: status_note || null },
    });
    if (!result.ok) {
      alert(result.error);
      setItems((list) =>
        list?.map((x) => (x.id === app.id ? { ...x, status_note: prev } : x)) ?? null,
      );
    }
  };

  const signOut = async () => {
    await authSignOut({ redirect: false });
    navigate({ to: "/admin/login" });
  };

  const exportCSV = () => {
    const headers = ["Submitted","Job","Name","Email","Phone","LinkedIn","Status","Status updated","Note","Resume name","Resume size (KB)"];
    const escape = (v: unknown) => {
      const s = (v ?? "").toString().replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const rows = filtered.map((a) => [
      new Date(a.created_at).toISOString(),
      a.job_title, a.full_name, a.email, a.phone, a.linkedin ?? "",
      a.status, new Date(a.status_updated_at).toISOString(), a.status_note ?? "",
      a.resume_name, Math.round(a.resume_size / 1024),
    ].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authChecked) {
    return (
      <section className="py-24">
        <div>Loading…</div>
      </section>
    );
  }

  const minBytes = minKB.trim() === "" ? null : Math.max(0, Number(minKB)) * 1024;
  const maxBytes = maxKB.trim() === "" ? null : Math.max(0, Number(maxKB)) * 1024;
  const q = query.trim().toLowerCase();
  const base = (items ?? []).filter((a) => {
    if (kind !== "all" && classifyResume(a) !== kind) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (minBytes !== null && !Number.isNaN(minBytes) && a.resume_size < minBytes) return false;
    if (maxBytes !== null && !Number.isNaN(maxBytes) && a.resume_size > maxBytes) return false;
    if (q) {
      const hay = `${a.full_name} ${a.email} ${a.job_title} ${a.resume_name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const dateFiltered = selectedDate ? base.filter((a) => dayKey(a.created_at) === selectedDate) : base;
  const filtered = [...dateFiltered].sort((a, b) => {
    if (sort === "name") return a.full_name.localeCompare(b.full_name);
    if (sort === "role") return a.job_title.localeCompare(b.job_title);
    if (sort === "status") return a.status.localeCompare(b.status);
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sort === "oldest" ? da - db : db - da;
  });
  const groups: { key: string; items: Application[] }[] = [];
  for (const a of filtered) {
    const k = dayKey(a.created_at);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(a);
    else groups.push({ key: k, items: [a] });
  }
  const allSelected = filtered.length > 0 && filtered.every((a) => selected.includes(a.id));
  const clearFilters = () => {
    setQuery("");
    setKind("all");
    setMinKB("");
    setMaxKB("");
    setSelectedDate(null);
    setStatusFilter("all");
    setSort("newest");
    setSelected([]);
  };





  return (
    <>
      <AdminPageHeader title="Job applications" description="All career form submissions with downloadable CVs." />
      <section>
        <div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {items
                ? `${filtered.length} of ${items.length} application${items.length === 1 ? "" : "s"}`
                : "Loading…"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                disabled={!filtered.length}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 rounded-2xl glass-card p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Search
              </label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, email, role, file…"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status · অবস্থা
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sort · সাজান
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
                <option value="role">Role A–Z</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resume type
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as ResumeKind)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All types</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word (DOC/DOCX)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Min size (KB)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minKB}
                onChange={(e) => setMinKB(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Max size (KB)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={maxKB}
                  onChange={(e) => setMaxKB(e.target.value)}
                  placeholder="5120"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={clearFilters}
                  className="shrink-0 rounded-lg border border-border px-3 text-xs font-semibold"
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => setSelected(e.target.checked ? filtered.map((a) => a.id) : [])}
              />
              Select all shown · সব নির্বাচন
            </label>
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                <span className="text-sm font-semibold">{selected.length} selected</span>
                <select
                  defaultValue=""
                  disabled={bulkBusy}
                  onChange={(e) => {
                    if (e.target.value) void bulkStatus(e.target.value as Status);
                    e.target.value = "";
                  }}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium"
                  aria-label="Bulk change status"
                >
                  <option value="">Change status to…</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  disabled={bulkBusy}
                  onClick={bulkDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete selected
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="text-xs font-semibold text-muted-foreground underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>


          {error && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <div className="mt-2 text-xs">
                If you see a permission error, your account does not have the <code>admin</code> role yet.
                Ask the project owner to grant it.
              </div>
            </div>
          )}

          {items && items.length === 0 && !error && (
            <div className="rounded-2xl glass-card p-10 text-center text-sm text-muted-foreground">
              No applications yet. Share the{" "}
              <Link to="/careers" className="text-primary underline">
                careers page
              </Link>
              .
            </div>
          )}

          {items && items.length > 0 && filtered.length === 0 && (
            <div className="rounded-2xl glass-card p-10 text-center text-sm text-muted-foreground">
              No applications match your filters.{" "}
              <button onClick={clearFilters} className="text-primary underline">
                Clear filters
              </button>
            </div>
          )}

          <div className="grid gap-8">
            {groups.map((g) => (
              <section key={g.key}>
                <div className="mb-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(selectedDate === g.key ? null : g.key)}
                    aria-pressed={selectedDate === g.key}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                      selectedDate === g.key
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {dayLabel(g.key)}
                    <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold">
                      {g.items.length}
                    </span>
                  </button>
                  {selectedDate === g.key && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      className="text-xs font-semibold text-muted-foreground underline"
                    >
                      Show all dates
                    </button>
                  )}
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-4">
                {g.items.map((a) => (

              <article key={a.id} className="rounded-2xl glass-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Select application from ${a.full_name}`}
                      className="mt-1.5"
                      checked={selected.includes(a.id)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id)))
                      }
                    />
                    <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {a.job_title}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{a.full_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[a.status]}`}
                      >
                        {a.status}
                      </span>
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a, e.target.value as Status)}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium"
                        aria-label="Update status"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            Mark {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadResume(a.resume_path, a.resume_name)}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow"
                    >
                      <Download className="h-3.5 w-3.5" /> Download CV
                    </button>
                    <button
                      onClick={() => removeItem(a)}
                      className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" /> {a.email}
                  </a>
                  <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" /> {a.phone}
                  </a>
                  {a.linkedin && (
                    <a
                      href={a.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                    >
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {a.resume_name} · {(a.resume_size / 1024).toFixed(0)} KB · {a.resume_type || "file"}
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Note to applicant (visible on tracker)
                  </label>
                  <textarea
                    defaultValue={a.status_note ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (a.status_note ?? "")) updateNote(a, v);
                    }}
                    rows={2}
                    placeholder="e.g. We'll email you to schedule a call this week."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Saved on blur. Last update: {new Date(a.status_updated_at).toLocaleString()}
                  </p>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold">Cover letter</summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{a.cover_letter}</p>
                </details>
              </article>
                ))}
                </div>
              </section>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
