import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getDashboardStatsAction,
  updateApplicationsAction,
  updateMessagesAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CMS_TYPES } from "@/lib/cmsSchema";
import { ROLE_LABEL, useDashboardRole, useProfile, type Capability } from "@/lib/adminAccess";
import {
  Briefcase,
  Mail,
  Database,
  Layers,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  FilePlus2,
  Settings,
  ListTree,
  Users,
  ArrowRight,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminDashboard,
});

const APP_STATUSES = ["Submitted", "Under review", "Interview", "Offer", "Hired", "On hold", "Rejected"] as const;
const MSG_STATUSES = ["new", "read", "replied", "archived"] as const;

type AppRow = { id: string; created_at: string; full_name: string; job_title: string; status: string };
type MsgRow = { id: string; created_at: string; name: string; subject: string | null; status: string | null };

/** Big, plain-language shortcuts — each one tagged with the capability it needs. */
const TASKS: {
  to: string;
  cap: Capability;
  icon: typeof FilePlus2;
  title: string;
  titleBn: string | React.ReactNode;
  help: string;
}[] = [
  {
    to: "/admin/pages",
    cap: "pages",
    icon: FilePlus2,
    title: "Edit a page",
    titleBn: (
      <>
        '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
        <br />
        <br />
        Organized Manu Bar
      </>
    ),
    help: "হোম, About, Contact — যেকোনো পেজের লেখা ও ছবি বদলান।",
  },
  {
    to: "/admin/media",
    cap: "media",
    icon: ImageIcon,
    title: "Photos & files",
    titleBn: "ছবি আপলোড করুন",
    help: "নতুন ছবি আপলোড করুন বা গ্যালারি থেকে বেছে নিন।",
  },
  {
    to: "/admin/cms",
    cap: "content",
    icon: Layers,
    title: "Content",
    titleBn: "ভেঞ্চার, সার্ভিস, ইনসাইট",
    help: "ভেঞ্চার, সার্ভিস, ইন্ডাস্ট্রি ও ইনসাইট যোগ বা সম্পাদনা করুন।",
  },
  {
    to: "/admin/menus",
    cap: "menus",
    icon: ListTree,
    title: "Menu",
    titleBn: "মেনু সাজান",
    help: "উপরের মেনু ও সাবমেনুর ক্রম ঠিক করুন।",
  },
  {
    to: "/admin/settings",
    cap: "settings",
    icon: Settings,
    title: "Site settings",
    titleBn: "নাম, ঠিকানা, লোগো",
    help: "কোম্পানির নাম, ফোন, ইমেইল, ঠিকানা ও লোগো।",
  },
  {
    to: "/admin/applications",
    cap: "applications",
    icon: Users,
    title: "Job applications",
    titleBn: "চাকরির আবেদন",
    help: "কে কোন পদে আবেদন করেছে দেখুন ও স্ট্যাটাস বদলান।",
  },
  {
    to: "/admin/messages",
    cap: "messages",
    icon: Mail,
    title: "Contact messages",
    titleBn: "যোগাযোগ বার্তা",
    help: "নতুন বার্তা পড়ুন, উত্তর দিন ও আর্কাইভ করুন।",
  },
];

const CMS_ICONS: Record<string, typeof Database> = {
  ventures: Briefcase,
  services: Layers,
  industries: Database,
  insights: FileText,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "এইমাত্র";
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ঘন্টা আগে`;
  const d = Math.round(h / 24);
  return `${d} দিন আগে`;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { data: session, status: authStatus } = useSession();
  const { role, can, isLoading: roleLoading } = useDashboardRole();
  const { profile } = useProfile();

  const [apps, setApps] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<number | null>(null);
  const [cmsCounts, setCmsCounts] = useState<Record<string, number>>({});
  const [recentApps, setRecentApps] = useState<AppRow[]>([]);
  const [recentMsgs, setRecentMsgs] = useState<MsgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appQuery, setAppQuery] = useState("");
  const [msgQuery, setMsgQuery] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedMsgs, setSelectedMsgs] = useState<string[]>([]);

  const limit = profile?.items_per_page && profile.items_per_page <= 25 ? profile.items_per_page : 8;

  const load = async () => {
    setError(null);
    setLoading(true);
    if (authStatus === "unauthenticated" || !session?.user) {
      navigate({ to: "/admin/login" });
      return;
    }
    try {
      if (can("applications") || can("messages") || can("content")) {
        const result = await getDashboardStatsAction();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (can("applications") || can("messages")) {
          setApps(result.appCount);
          setMsgs(result.msgCount);
          setRecentApps((result.recentApps as AppRow[]).slice(0, limit));
          setRecentMsgs((result.recentMsgs as MsgRow[]).slice(0, limit));
        }
        if (can("content")) {
          setCmsCounts(result.cmsCounts ?? {});
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleLoading || authStatus === "loading") return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, role, authStatus]);

  /* ------------------------- inline + bulk status edits ------------------------ */

  const setAppStatus = async (ids: string[], status: string) => {
    if (ids.length === 0) return;
    setRecentApps((list) => list.map((a) => (ids.includes(a.id) ? { ...a, status } : a)));
    const result = await updateApplicationsAction({ ids, patch: { status } });
    if (!result.ok) setError(result.error);
    setSelectedApps([]);
  };

  const setMsgStatus = async (ids: string[], status: string) => {
    if (ids.length === 0) return;
    setRecentMsgs((list) => list.map((m) => (ids.includes(m.id) ? { ...m, status } : m)));
    const result = await updateMessagesAction({ ids, patch: { status } });
    if (!result.ok) setError(result.error);
    setSelectedMsgs([]);
  };

  /* --------------------------------- filters -------------------------------- */

  const shownApps = useMemo(() => {
    const q = appQuery.trim().toLowerCase();
    return recentApps.filter((a) =>
      q ? `${a.full_name} ${a.job_title} ${a.status}`.toLowerCase().includes(q) : true,
    );
  }, [recentApps, appQuery]);

  const shownMsgs = useMemo(() => {
    const q = msgQuery.trim().toLowerCase();
    return recentMsgs.filter((m) =>
      q ? `${m.name} ${m.subject ?? ""} ${m.status ?? ""}`.toLowerCase().includes(q) : true,
    );
  }, [recentMsgs, msgQuery]);

  const tasks = TASKS.filter((t) => can(t.cap));
  const roleInfo = ROLE_LABEL[role];

  /* --------------------------------- quick add ------------------------------- */

  const quickActions = [
    can("content") && {
      label: "New insight · নতুন ইনসাইট",
      to: "/admin/cms/$type",
      params: { type: "insights" },
    },
    can("content") && {
      label: "New venture · নতুন ভেঞ্চার",
      to: "/admin/cms/$type",
      params: { type: "ventures" },
    },
    can("pages") && { label: "New page · নতুন পেইজ", to: "/admin/pages", params: undefined },
    can("media") && { label: "Upload image · ছবি আপলোড", to: "/admin/media", params: undefined },
    can("applications") && {
      label: "Applications queue · আবেদন",
      to: "/admin/applications",
      params: undefined,
    },
    can("messages") && { label: "Message inbox · বার্তা", to: "/admin/messages", params: undefined },
  ].filter(Boolean) as { label: string; to: string; params?: Record<string, string> }[];

  const searchCls =
    "w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary";

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        titleBn={`${roleInfo.bn} — আপনি কী করতে চান?`}
        description={roleInfo.help}
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="admin-glass-strong inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-glass-border px-4 text-sm font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh · রিফ্রেশ</span>
          </button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl glass-card p-4">
        <span className="mr-1 inline-flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary" /> Quick actions · দ্রুত কাজ
        </span>
        {quickActions.map((qa) => (
          <Link
            key={qa.label}
            to={qa.to}
            params={qa.params}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
          >
            {qa.label}
          </Link>
        ))}
        <Link
          to="/admin/profile"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> {roleInfo.en}
        </Link>
      </div>

      {/* Task cards for this role only */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-2xl glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-3 text-base font-semibold">{t.titleBn}</div>
              <div className="text-xs text-muted-foreground">{t.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t.help}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                শুরু করুন <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Numbers, filtered by capability */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {can("applications") && (
          <Link to="/admin/applications" className="rounded-2xl glass-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" /> চাকরির আবেদন
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{apps ?? "—"}</div>
          </Link>
        )}
        {can("messages") && (
          <Link to="/admin/messages" className="rounded-2xl glass-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-primary" /> যোগাযোগ বার্তা
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{msgs ?? "—"}</div>
          </Link>
        )}
        {can("content") && (
          <div className="rounded-2xl glass-card p-5">
            <div className="text-sm font-semibold">কনটেন্ট সংখ্যা</div>
            <div className="mt-3 space-y-2">
              {Object.entries(CMS_TYPES).map(([key, cfg]) => {
                const Icon = CMS_ICONS[key] ?? Database;
                return (
                  <Link
                    key={key}
                    to="/admin/cms/$type"
                    params={{ type: key }}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-primary/5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{cfg.labelBn || cfg.label}</span>
                    </span>
                    <span className="font-semibold">{cmsCounts[key] ?? "—"}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Editable recent lists */}
      {(can("applications") || can("messages")) && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {can("applications") && (
            <section className="rounded-2xl glass-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold">নতুন আবেদন</h2>
                <Link to="/admin/applications" className="text-xs font-semibold text-primary">
                  সব দেখুন
                </Link>
              </div>

              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={appQuery}
                  onChange={(e) => setAppQuery(e.target.value)}
                  placeholder="নাম, পদ বা স্ট্যাটাস…"
                  className={searchCls}
                />
              </div>

              {selectedApps.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                  <span className="font-semibold">{selectedApps.length} selected</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) void setAppStatus(selectedApps, e.target.value);
                      e.target.value = "";
                    }}
                    className="rounded-md border border-border bg-background px-2 py-1"
                    aria-label="Bulk status for applications"
                  >
                    <option value="">Change status to…</option>
                    {APP_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setSelectedApps([])} className="underline text-muted-foreground">
                    Clear
                  </button>
                </div>
              )}

              {shownApps.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো আবেদন পাওয়া যায়নি।</p>
              ) : (
                <ul className="divide-y divide-glass-border">
                  {shownApps.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${a.full_name}`}
                        checked={selectedApps.includes(a.id)}
                        onChange={(e) =>
                          setSelectedApps((s) =>
                            e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id),
                          )
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.full_name}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.job_title}</div>
                      </div>
                      <select
                        value={a.status}
                        onChange={(e) => setAppStatus([a.id], e.target.value)}
                        aria-label={`Status for ${a.full_name}`}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {APP_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {can("messages") && (
            <section className="rounded-2xl glass-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold">নতুন বার্তা</h2>
                <Link to="/admin/messages" className="text-xs font-semibold text-primary">
                  সব দেখুন
                </Link>
              </div>

              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={msgQuery}
                  onChange={(e) => setMsgQuery(e.target.value)}
                  placeholder="নাম, বিষয় বা স্ট্যাটাস…"
                  className={searchCls}
                />
              </div>

              {selectedMsgs.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                  <span className="font-semibold">{selectedMsgs.length} selected</span>
                  {MSG_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setMsgStatus(selectedMsgs, s)}
                      className="rounded-full border border-border bg-background px-2 py-1 font-semibold"
                    >
                      {s}
                    </button>
                  ))}
                  <button onClick={() => setSelectedMsgs([])} className="underline text-muted-foreground">
                    Clear
                  </button>
                </div>
              )}

              {shownMsgs.length === 0 ? (
                <p className="text-sm text-muted-foreground">কোনো বার্তা পাওয়া যায়নি।</p>
              ) : (
                <ul className="divide-y divide-glass-border">
                  {shownMsgs.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select message from ${m.name}`}
                        checked={selectedMsgs.includes(m.id)}
                        onChange={(e) =>
                          setSelectedMsgs((s) =>
                            e.target.checked ? [...s, m.id] : s.filter((x) => x !== m.id),
                          )
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{m.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.subject || "—"}</div>
                      </div>
                      <select
                        value={m.status ?? "new"}
                        onChange={(e) => setMsgStatus([m.id], e.target.value)}
                        aria-label={`Status for message from ${m.name}`}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {MSG_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <p className="mt-8 rounded-2xl glass-card p-5 text-sm text-muted-foreground">
        সাহায্য দরকার? যেকোনো কার্ডে ক্লিক করুন — প্রতিটি পাতায় ধাপে ধাপে ফর্ম দেওয়া আছে। পরিবর্তনের পর
        <span className="font-semibold text-foreground"> Save</span> বাটনে ক্লিক করলেই ওয়েবসাইটে দেখা যাবে।
      </p>
    </>
  );
}
