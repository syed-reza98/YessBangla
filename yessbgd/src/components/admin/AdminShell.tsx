import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { signOut as authSignOut } from "next-auth/react";
import { CMS_TYPES } from "@/lib/cmsSchema";
import {
  LayoutDashboard,
  Briefcase,
  Mail,
  ShieldCheck,
  Database,
  Layers,
  FileText,
  LogOut,
  UserCog,

  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  UserRound,
  ListTree,
  Image as ImageIcon,
  Settings,
  Search,
  Bell,
  Circle,
} from "lucide-react";

type NavLeaf = {
  label: string;
  labelBn: string;
  to: string;
  params?: Record<string, string>;
  icon?: typeof LayoutDashboard;
};

type NavGroup = {
  title: string;
  titleBn: string;
  icon: typeof LayoutDashboard;
  to?: string;
  items?: NavLeaf[];
};

const CMS_ICONS: Record<string, typeof Database> = {
  ventures: Briefcase,
  services: Layers,
  industries: Database,
  insights: FileText,
};

function buildNav(): NavGroup[] {
  return [
    { title: "Dashboard", titleBn: "ড্যাশবোর্ড", icon: LayoutDashboard, to: "/admin" },
    { title: "Pages", titleBn: "পেইজ", icon: FileText, to: "/admin/pages" },
    {
      title: "Content",
      titleBn: "কনটেন্ট",
      icon: Database,
      items: [
        { label: "All content", labelBn: "সব কনটেন্ট", to: "/admin/cms" },
        ...Object.entries(CMS_TYPES).map(([key, cfg]) => ({
          label: cfg.label,
          labelBn: cfg.labelBn,
          to: "/admin/cms/$type",
          params: { type: key },
          icon: CMS_ICONS[key] ?? Database,
        })),
      ],
    },
    {
      title: "Appearance",
      titleBn: "অ্যাপিয়ারেন্স",
      icon: ListTree,
      items: [
        { label: "Menus", labelBn: "মেনু ও ফুটার", to: "/admin/menus" },
        { label: "Media", labelBn: "ইমেজ গ্যালারি", to: "/admin/media" },
      ],
    },
    {
      title: "Operations",
      titleBn: "অপারেশন",
      icon: Briefcase,
      items: [
        { label: "Job applications", labelBn: "চাকরির আবেদন", to: "/admin/applications" },
        { label: "Contact messages", labelBn: "যোগাযোগ বার্তা", to: "/admin/messages" },
      ],
    },
    {
      title: "Tools",
      titleBn: "টুলস",
      icon: Settings,
      items: [
        { label: "Settings", labelBn: "সাইট সেটিংস", to: "/admin/settings" },
        { label: "Data backup", labelBn: "ডাটা ডাউনলোড/আপলোড", to: "/admin/data" },
        { label: "Audit log", labelBn: "অডিট লগ", to: "/admin/audit" },
      ],
    },
  ];
}

function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function breadcrumbs(pathname: string): string[] {
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
  return parts.map((p) => (p === "admin" ? "Dashboard" : p.replace(/-/g, " ")));
}

export function AdminShell({ children, email }: { children: ReactNode; email?: string | null }) {
  const navigate = useNavigate();
  const pathname = useActivePath();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const nav = useMemo(buildNav, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin-sidebar-collapsed") : null;
    if (saved === "1") setCollapsed(true);
  }, []);

  const leafActive = (item: NavLeaf) => {
    if (item.params?.type) return pathname.startsWith(`/admin/cms/${item.params.type}`);
    if (item.to === "/admin/cms") return pathname === "/admin/cms";
    return pathname.startsWith(item.to);
  };

  const groupActive = (group: NavGroup) => {
    if (group.to === "/admin") return pathname === "/admin" || pathname === "/admin/";
    if (group.to) return pathname.startsWith(group.to);
    return (group.items ?? []).some(leafActive);
  };

  // Auto-expand the group holding the current route.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      nav.forEach((g) => {
        if (!g.items) return;
        if (g.items.some(leafActive)) next[g.title] = true;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") localStorage.setItem("admin-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  const signOut = async () => {
    await authSignOut({ redirect: false });
    navigate({ to: "/admin/login" });
  };

  // Global search over all navigation destinations.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const flat: NavLeaf[] = [];
    nav.forEach((g) => {
      if (g.to) flat.push({ label: g.title, labelBn: g.titleBn, to: g.to });
      (g.items ?? []).forEach((i) => flat.push(i));
    });
    return flat
      .filter((i) => i.label.toLowerCase().includes(q) || i.labelBn.includes(query.trim()))
      .slice(0, 8);
  }, [query, nav]);

  const sidebar = (
    <div className="flex h-full flex-col bg-admin-sidebar text-admin-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-admin-accent text-admin-accent-foreground">
          <LayoutDashboard className="h-4.5 w-4.5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold leading-tight">YESS Bangla</div>
            <div className="truncate text-[11px] text-admin-sidebar-muted">Control Panel</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {nav.map((group) => {
            const Icon = group.icon;
            const active = groupActive(group);
            const open = openGroups[group.title] ?? false;

            if (group.to) {
              return (
                <li key={group.title}>
                  <Link
                    to={group.to}
                    title={collapsed ? group.title : undefined}
                    data-active={active ? "true" : undefined}
                    aria-current={active ? "page" : false}
                    className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-admin-accent font-semibold text-admin-accent-foreground shadow-sm before:absolute before:inset-y-1.5 before:-left-0.5 before:w-1 before:rounded-full before:bg-admin-accent-foreground"
                        : "text-admin-sidebar-foreground/85 hover:bg-admin-sidebar-hover"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="min-w-0 flex-1 truncate">
                        {group.title}
                        <span className="block text-[10px] font-normal opacity-70">{group.titleBn}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            }

            return (
              <li key={group.title}>
                <button
                  onClick={() => {
                    if (collapsed) toggleCollapsed();
                    setOpenGroups((p) => ({ ...p, [group.title]: !open }));
                  }}
                  aria-expanded={open}
                  data-active={active ? "true" : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-admin-sidebar-hover font-semibold text-admin-sidebar-foreground before:absolute before:inset-y-1.5 before:-left-0.5 before:w-1 before:rounded-full before:bg-admin-accent"
                      : "text-admin-sidebar-foreground/85 hover:bg-admin-sidebar-hover"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {group.title}
                        <span className="block text-[10px] font-normal opacity-70">{group.titleBn}</span>
                      </span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </>
                  )}
                </button>

                {!collapsed && open && (
                  <ul className="mt-0.5 space-y-0.5 pb-1">
                    {(group.items ?? []).map((item) => {
                      const itemActive = leafActive(item);
                      return (
                        <li key={`${item.to}-${item.params?.type ?? ""}`}>
                          <Link
                            to={item.to}
                            params={item.params}
                            data-active={itemActive ? "true" : undefined}
                            aria-current={itemActive ? "page" : false}
                            className={`relative flex items-center gap-2.5 rounded-md py-2 pl-9 pr-3 text-[13px] transition ${
                              itemActive
                                ? "bg-admin-accent font-semibold text-admin-accent-foreground shadow-sm before:absolute before:inset-y-1 before:left-3 before:w-1 before:rounded-full before:bg-admin-accent-foreground"
                                : "text-admin-sidebar-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-foreground"
                            }`}
                          >
                            <Circle
                              className={`h-2 w-2 shrink-0 ${itemActive ? "fill-current" : ""}`}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-2">
        <Link
          to="/admin/profile"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-admin-sidebar-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-foreground"
        >
          <UserCog className="h-4 w-4 shrink-0" />
          {!collapsed && <span>My profile · আমার প্রোফাইল</span>}
        </Link>
        <button

          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-admin-sidebar-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={toggleCollapsed}
          className="mt-1 hidden w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-admin-sidebar-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-foreground lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-scope flex min-h-screen bg-admin-canvas">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 transition-all lg:block ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-admin-sidebar-muted hover:bg-admin-sidebar-hover"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-admin-topbar px-3 text-admin-sidebar-foreground sm:px-5">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-admin-sidebar-muted hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={toggleCollapsed}
            className="hidden rounded-md p-2 text-admin-sidebar-muted hover:bg-white/10 lg:block"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="relative ml-auto hidden w-full max-w-md sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-sidebar-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin…"
              aria-label="Search admin"
              className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-admin-sidebar-foreground placeholder:text-admin-sidebar-muted focus:border-admin-accent focus:outline-none"
            />
            {results.length > 0 && (
              <ul className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md border border-border bg-card py-1 text-card-foreground shadow-xl">
                {results.map((r) => (
                  <li key={`${r.to}-${r.params?.type ?? ""}`}>
                    <Link
                      to={r.to}
                      params={r.params}
                      onClick={() => setQuery("")}
                      className="block px-3 py-2 text-sm hover:bg-secondary"
                    >
                      {r.label}
                      <span className="ml-2 text-xs text-muted-foreground">{r.labelBn}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/"
            target="_blank"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/10 sm:ml-0"
          >
            <Globe className="h-4 w-4" /> <span className="hidden sm:inline">View website</span>
          </Link>

          <Link
            to="/admin/messages"
            className="relative rounded-md p-2 text-admin-sidebar-muted hover:bg-white/10"
            aria-label="Messages"
          >
            <Bell className="h-4.5 w-4.5" />
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-admin-accent text-admin-accent-foreground">
              <UserRound className="h-4 w-4" />
            </span>
            <span className="hidden max-w-[160px] truncate text-xs text-admin-sidebar-muted lg:block">
              {email ?? "admin"}
            </span>
          </div>
        </header>

        {/* Breadcrumb strip */}
        <div className="border-b border-border/60 bg-admin-canvas px-4 py-3 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {breadcrumbs(pathname).map((crumb, i, all) => (
                <li key={`${crumb}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground/50">/</span>}
                  <span className={i === all.length - 1 ? "text-foreground" : "text-primary"}>{crumb}</span>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>
            Copyright {new Date().getFullYear()} © Yess Bangla Limited. Version <span className="text-primary">1.0.0</span>
          </span>
          <span className="hidden sm:inline">YESS Bangla Control Panel</span>
        </footer>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  titleBn,
  description,
  actions,
}: {
  title: string;
  titleBn?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {titleBn && <p className="text-sm text-muted-foreground">{titleBn}</p>}
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
