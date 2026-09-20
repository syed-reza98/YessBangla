import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteMenuItemAction,
  deleteSitePagesAction,
  listMenuItemsAction,
  setSitePagesPublishedAction,
  updateMenuItemFieldsAction,
  upsertMenuItemAction,
  upsertSitePageAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useSitePages } from "@/lib/sitePages";
import { useDashboardRole, ROLE_LABEL } from "@/lib/adminAccess";
import { buildMenuTree, type MenuItem, type MenuNode } from "@/lib/siteContent";
import {
  Plus,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Pencil,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  ListTree,
} from "lucide-react";


export const Route = createFileRoute("/admin/pages/")({
  head: () => ({
    meta: [
      { title: "Pages — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPagesList,
});

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type StatusFilter = "all" | "published" | "hidden";
type TypeFilter = "all" | "custom" | "system";

function AdminPagesList() {
  const { data, isLoading, isFetching, refetch } = useSitePages();
  const qc = useQueryClient();
  const { role, can } = useDashboardRole();
  const canPages = can("pages");
  const canMenus = can("menus");
  const [creating, setCreating] = useState(false);


  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nameBn: "", slug: "" });

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  // ---- menu placement for the create form (menu / submenu / sub-submenu) ----
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoc, setMenuLoc] = useState<"none" | "header" | "footer">("none");
  const [menuParent, setMenuParent] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const loadMenu = async () => {
    const result = await listMenuItemsAction();
    setMenuItems((result.ok ? result.rows : []) as MenuItem[]);
  };

  useEffect(() => {
    void loadMenu();
  }, []);

  const parentOptions = useMemo(() => {
    if (menuLoc === "none") return [] as { node: MenuNode; depth: number }[];
    const out: { node: MenuNode; depth: number }[] = [];
    const walk = (nodes: MenuNode[], depth: number) => {
      for (const n of nodes) {
        if (depth < 2) out.push({ node: n, depth });
        walk(n.children, depth + 1);
      }
    };
    walk(buildMenuTree(menuItems.filter((m) => m.location === menuLoc)), 0);
    return out;
  }, [menuItems, menuLoc]);

  useEffect(() => {
    if (menuParent && !parentOptions.some((o) => o.node.id === menuParent)) setMenuParent("");
  }, [parentOptions, menuParent]);

  const menuCountFor = (path: string) =>
    menuItems.filter((m) => (m.href ?? "").trim() === path.trim()).length;

  /** Menu nodes (any location, any depth) that point at this page path. */
  const menuNodesFor = (path: string) => {
    const out: { node: MenuNode; location: string }[] = [];
    for (const loc of ["header", "footer"]) {
      const walk = (nodes: MenuNode[]) => {
        for (const n of nodes) {
          if ((n.href ?? "").trim() === path.trim()) out.push({ node: n, location: loc });
          else walk(n.children);
        }
      };
      walk(buildMenuTree(menuItems.filter((m) => m.location === loc)));
    }
    return out;
  };

  const refreshMenus = async () => {
    await loadMenu();
    await qc.invalidateQueries({ queryKey: ["cms", "menu", "header"] });
    await qc.invalidateQueries({ queryKey: ["cms", "menu", "footer"] });
  };

  const addSubmenu = async (parent: MenuNode, label: string, labelBn: string, href: string) => {
    if (!canMenus) return;
    const siblings = menuItems.filter((m) => (m.parent_id ?? null) === parent.id);
    const result = await upsertMenuItemAction({
      location: parent.location,
      label: label.trim(),
      label_bn: labelBn.trim() || null,
      href: href.trim(),
      parent_id: parent.id,
      depth: (parent.depth ?? 0) + 1,
      sort_order: siblings.length + 1,
      is_published: true,
      visible_to: "all",
    });
    if (!result.ok) setErr(result.error);
    else await refreshMenus();
  };

  const toggleMenuPublished = async (id: string, next: boolean) => {
    if (!canMenus) return;
    await updateMenuItemFieldsAction({ id, patch: { is_published: next } });
    await refreshMenus();
  };

  const renameMenuItem = async (item: MenuNode) => {
    if (!canMenus) return;
    const label = window.prompt("Menu label (EN) · মেনু লেবেল", item.label);
    if (label === null) return;
    const labelBn = window.prompt("মেনু লেবেল (BN)", item.label_bn ?? "");
    await updateMenuItemFieldsAction({
      id: item.id,
      patch: { label: label.trim() || item.label, label_bn: (labelBn ?? "").trim() || null },
    });
    await refreshMenus();
  };

  const deleteMenuItem = async (item: MenuNode) => {
    if (!canMenus) return;
    if (!window.confirm(`Remove menu item “${item.label}”? · মেনু আইটেম মুছবেন?`)) return;
    await deleteMenuItemAction({ id: item.id });
    await refreshMenus();
  };

  /** Persist a new sibling order (array of menu item ids, top → bottom). */
  const reorderMenuItems = async (ids: string[]) => {
    if (!canMenus) return;
    for (let i = 0; i < ids.length; i++) {
      const result = await updateMenuItemFieldsAction({ id: ids[i], patch: { sort_order: i + 1 } });
      if (!result.ok) setErr(result.error);
    }
    await refreshMenus();
  };



  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["cms", "site-pages"] });
    await refetch();
  };

  const create = async () => {
    if (!canPages) { setErr('আপনার পেইজ তৈরির অনুমতি নেই।'); return; }
    const slug = slugify(form.slug || form.name);
    if (!slug || !form.name.trim()) {
      setErr("Name and slug are required.");
      return;
    }
    setBusy(true);
    setErr(null);
    setNotice(null);
    const path = `/p/${slug}`;
    const pageResult = await upsertSitePageAction({
      page: slug,
      path,
      name: form.name.trim(),
      name_bn: form.nameBn.trim() || null,
      hero_title: form.name.trim(),
      hero_title_bn: form.nameBn.trim() || null,
      is_custom: true,
      is_published: true,
      sort_order: (data?.length ?? 0) + 1,
    });
    if (!pageResult.ok) {
      setBusy(false);
      setErr(pageResult.error);
      return;
    }

    if (menuLoc !== "none") {
      const parent = menuParent ? menuItems.find((m) => m.id === menuParent) : undefined;
      const siblings = menuItems.filter(
        (m) => m.location === menuLoc && (m.parent_id ?? null) === (parent?.id ?? null),
      );
      const menuResult = await upsertMenuItemAction({
        location: menuLoc,
        label: form.name.trim(),
        label_bn: form.nameBn.trim() || null,
        href: path,
        parent_id: parent?.id ?? null,
        depth: parent ? (parent.depth ?? 0) + 1 : 0,
        sort_order: siblings.length + 1,
        is_published: true,
        visible_to: "all",
      });
      if (!menuResult.ok) {
        setBusy(false);
        setErr(`Page created, but adding it to the menu failed: ${menuResult.error}`);
        await invalidate();
        await loadMenu();
        return;
      }
      setNotice(
        parent
          ? `Page created and added as a submenu of “${parent.label}” · সাবমেনু হিসেবে যোগ হয়েছে`
          : "Page created and added to the menu · মেনুতে যোগ হয়েছে",
      );
      await qc.invalidateQueries({ queryKey: ["cms", "menu", "header"] });
      await qc.invalidateQueries({ queryKey: ["cms", "menu", "footer"] });
    } else {
      setNotice("Page created · পেইজ তৈরি হয়েছে");
    }

    setBusy(false);
    setForm({ name: "", nameBn: "", slug: "" });
    setMenuLoc("none");
    setMenuParent("");
    setCreating(false);
    await invalidate();
    await loadMenu();
  };

  const togglePublish = async (id: string, next: boolean) => {
    if (!canPages) return;
    await setSitePagesPublishedAction({ ids: [id], is_published: next });
    await invalidate();
  };

  const remove = async (id: string, name: string) => {
    if (!canPages) return;
    if (!window.confirm(`Delete the page “${name}”? This cannot be undone.`)) return;
    await deleteSitePagesAction({ ids: [id] });
    setSelected((s) => s.filter((x) => x !== id));
    await invalidate();
  };

  const bulk = async (action: "publish" | "hide" | "delete") => {
    if (!canPages) return;
    setBulkOpen(false);
    if (selected.length === 0) return;
    if (action === "delete") {
      const deletable = (data ?? []).filter((p) => selected.includes(p.id) && p.is_custom).map((p) => p.id);
      if (deletable.length === 0) {
        setErr("Only custom pages can be deleted.");
        return;
      }
      if (!window.confirm(`Delete ${deletable.length} page(s)? This cannot be undone.`)) return;
      await deleteSitePagesAction({ ids: deletable });
    } else {
      await setSitePagesPublishedAction({ ids: selected, is_published: action === "publish" });
    }
    setSelected([]);
    await invalidate();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (status === "published" && !p.is_published) return false;
      if (status === "hidden" && p.is_published) return false;
      if (type === "custom" && !p.is_custom) return false;
      if (type === "system" && p.is_custom) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_bn ?? "").toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q)
      );
    });
  }, [data, search, status, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * perPage;
  const rows = filtered.slice(start, start + perPage);
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div>
      <AdminPageHeader
        title="Pages"
        titleBn="সব পেইজ — বাংলা ও ইংরেজিতে সম্পাদনা করুন"
        description="Every page of the website, including the home page. Edit hero copy, images, body text and SEO — or create a brand new page."
      />

      {!canPages && (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          আপনার ভূমিকা ({ROLE_LABEL[role].bn}) পেইজ সম্পাদনা করতে পারে না — শুধু দেখার অনুমতি আছে।
        </p>
      )}
      {err && <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {notice && <p className="mb-4 rounded-md bg-admin-accent/10 px-3 py-2 text-sm text-admin-accent">{notice}</p>}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 p-4">
          <div className="relative">
            <button
              onClick={() => setBulkOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              Bulk Actions <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {bulkOpen && (
              <ul className="absolute left-0 top-11 z-30 w-44 overflow-hidden rounded-md border border-border bg-popover py-1 text-sm shadow-lg">
                <li>
                  <button onClick={() => bulk("publish")} className="block w-full px-3 py-2 text-left hover:bg-secondary">
                    Publish selected
                  </button>
                </li>
                <li>
                  <button onClick={() => bulk("hide")} className="block w-full px-3 py-2 text-left hover:bg-secondary">
                    Hide selected
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => bulk("delete")}
                    className="block w-full px-3 py-2 text-left text-destructive hover:bg-destructive/10"
                  >
                    Delete selected
                  </button>
                </li>
              </ul>
            )}
          </div>

          <button
            onClick={() => setShowFilters((f) => !f)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>

          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              aria-label="Search pages"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setCreating((c) => !c)}
              className="inline-flex items-center gap-2 rounded-md bg-admin-accent px-4 py-2 text-sm font-semibold text-admin-accent-foreground"
            >
              <Plus className="h-4 w-4" /> Create
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Reload
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-3 border-b border-border/70 bg-secondary/30 p-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as StatusFilter);
                  setPage(1);
                }}
                className={inputCls}
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TypeFilter);
                  setPage(1);
                }}
                className={inputCls}
              >
                <option value="all">All</option>
                <option value="system">Built-in</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatus("all");
                  setType("all");
                  setSearch("");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
              >
                Reset filters
              </button>
            </div>
          </div>
        )}

        {creating && (
          <div className="border-b border-border/70 bg-secondary/20 p-4">
            <h2 className="mb-3 font-display text-base font-semibold">Create a new page</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Page name (EN)
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Partnerships"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  পেইজের নাম (BN)
                </span>
                <input
                  value={form.nameBn}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                  placeholder="পার্টনারশিপ"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  URL slug
                </span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder={slugify(form.name) || "partnerships"}
                  className={`${inputCls} font-mono`}
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  /p/{slugify(form.slug || form.name) || "…"}
                </span>
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Add to menu · মেনুতে যোগ করুন
                </span>
                <select
                  value={menuLoc}
                  onChange={(e) => setMenuLoc(e.target.value as "none" | "header" | "footer")}
                  className={inputCls}
                >
                  <option value="none">Don&apos;t add · যোগ করবেন না</option>
                  <option value="header">Header menu · হেডার</option>
                  <option value="footer">Footer menu · ফুটার</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Place under (submenu) · কার নিচে
                </span>
                <select
                  value={menuParent}
                  onChange={(e) => setMenuParent(e.target.value)}
                  disabled={menuLoc === "none"}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  <option value="">Top level · টপ লেভেল</option>
                  {parentOptions.map((o) => (
                    <option key={o.node.id} value={o.node.id}>
                      {"— ".repeat(o.depth)}
                      {o.node.label} {o.depth === 0 ? "(submenu)" : "(sub-submenu)"}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  সর্বোচ্চ ৩ লেভেল — পরে Navigation &amp; submenu ট্যাব থেকেও বদলানো যাবে।
                </span>
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={create}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md bg-admin-accent px-4 py-2 text-sm font-semibold text-admin-accent-foreground disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create page
              </button>
              <button
                onClick={() => setCreating(false)}
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[820px] table-auto text-sm">

            <thead>
              <tr className="border-b border-border/70 bg-secondary/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allChecked}
                    onChange={(e) =>
                      setSelected(e.target.checked ? Array.from(new Set([...selected, ...rows.map((r) => r.id)])) : [])
                    }
                  />
                </th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Path</th>
                <th className="px-3 py-3">Template</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Operations</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No pages match your filters.
                  </td>
                </tr>
              )}
              {rows.map((p) => {
                const attached = menuNodesFor(p.path);
                const kids = attached.reduce((n, a) => n + a.node.children.length, 0);
                const isOpen = expanded.includes(p.id);
                return (
                <Fragment key={p.id}>
                <tr className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)))
                      }
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => (isOpen ? e.filter((x) => x !== p.id) : [...e, p.id]))}
                        aria-expanded={isOpen}
                        aria-label={`Submenus of ${p.name}`}
                        title="Submenus · সাবমেনু"
                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-border text-muted-foreground hover:bg-secondary"
                      >
                        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                      </button>
                      <div className="min-w-0">
                        <Link
                          to="/admin/pages/$page"
                          params={{ page: p.page }}
                          className="font-medium text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {p.name_bn || "—"}
                          {kids > 0 && (
                            <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                              {kids} submenu
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{p.path}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.is_custom ? "Custom" : "Built-in"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded px-2 py-1 text-[11px] font-semibold ${
                        p.is_published
                          ? "bg-admin-success text-admin-success-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {p.is_published ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to="/admin/pages/$page"
                        params={{ page: p.page }}
                        title="Edit"
                        className="grid h-8 w-8 place-items-center rounded bg-admin-accent text-admin-accent-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        to="/admin/pages/$page"
                        params={{ page: p.page }}
                        search={{ tab: "navigation" as const }}
                        title="Menu & submenu · মেনু ও সাবমেনু"
                        className="relative grid h-8 w-8 place-items-center rounded border border-border text-muted-foreground hover:bg-secondary"
                      >
                        <ListTree className="h-3.5 w-3.5" />
                        {menuCountFor(p.path) > 0 && (
                          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-admin-accent px-1 text-[9px] font-bold text-admin-accent-foreground">
                            {menuCountFor(p.path)}
                          </span>
                        )}
                      </Link>
                      <a
                        href={p.path}
                        target="_blank"
                        rel="noreferrer"
                        title="View"
                        className="grid h-8 w-8 place-items-center rounded border border-border text-muted-foreground hover:bg-secondary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => togglePublish(p.id, !p.is_published)}
                        title={p.is_published ? "Hide" : "Publish"}
                        className="grid h-8 w-8 place-items-center rounded border border-border text-muted-foreground hover:bg-secondary"
                      >
                        {p.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => remove(p.id, p.name)}
                        disabled={!p.is_custom}
                        title={p.is_custom ? "Delete" : "Built-in pages cannot be deleted"}
                        className="grid h-8 w-8 place-items-center rounded bg-destructive text-destructive-foreground disabled:opacity-35"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <td colSpan={6} className="px-4 py-4">
                      <PageSubmenus
                        pagePath={p.path}
                        attached={attached}
                        pages={(data ?? []).map((x) => ({ name: x.name, path: x.path }))}
                        canEdit={canMenus}
                        roleLabel={ROLE_LABEL[role].bn}
                        onAdd={addSubmenu}
                        onRename={renameMenuItem}
                        onDelete={deleteMenuItem}
                        onTogglePublished={toggleMenuPublished}
                        onReorder={reorderMenuItems}
                      />

                    </td>
                  </tr>
                )}
                </Fragment>
                );
              })}

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border/70 p-4 text-sm text-muted-foreground">
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Rows per page"
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>
            Show from {filtered.length === 0 ? 0 : start + 1} to {Math.min(start + perPage, filtered.length)} in{" "}
            <span className="rounded bg-secondary px-1.5 py-0.5 font-semibold text-foreground">{filtered.length}</span>{" "}
            records
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="rounded-md border border-border px-2.5 py-1.5 disabled:opacity-40"
            >
              « Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`min-w-8 rounded-md border px-2.5 py-1.5 ${
                  n === current
                    ? "border-admin-accent bg-admin-accent text-admin-accent-foreground"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              className="rounded-md border border-border px-2.5 py-1.5 disabled:opacity-40"
            >
              Next »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Submenu panel shown when a page row is expanded — lists every menu entry
   that points at this page plus its child items, and lets an editor add,
   rename, reorder (drag-drop + keyboard), hide or remove submenus without
   leaving the Pages list. Editing is gated on the `menus` capability.
--------------------------------------------------------------------------- */
function PageSubmenus({
  pagePath,
  attached,
  pages,
  canEdit,
  roleLabel,
  onAdd,
  onRename,
  onDelete,
  onTogglePublished,
  onReorder,
}: {
  pagePath: string;
  attached: { node: MenuNode; location: string }[];
  pages: { name: string; path: string }[];
  canEdit: boolean;
  roleLabel: string;
  onAdd: (parent: MenuNode, label: string, labelBn: string, href: string) => Promise<void>;
  onRename: (item: MenuNode) => Promise<void>;
  onDelete: (item: MenuNode) => Promise<void>;
  onTogglePublished: (id: string, next: boolean) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const [addFor, setAddFor] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [labelBn, setLabelBn] = useState("");
  const [href, setHref] = useState(pages[0]?.path ?? "/");
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const cls = "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

  const submit = async (parent: MenuNode) => {
    if (!label.trim()) return;
    setBusy(true);
    await onAdd(parent, label, labelBn, href);
    setBusy(false);
    setLabel("");
    setLabelBn("");
    setAddFor(null);
  };

  /** Move an item within its sibling list by `delta` positions. */
  const move = async (siblings: MenuNode[], id: string, delta: number) => {
    const from = siblings.findIndex((s) => s.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setStatus(`${siblings[from].label} moved to position ${to + 1} of ${siblings.length}`);
    await onReorder(ids);
  };

  const dropOn = async (siblings: MenuNode[], targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = siblings.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return; // only reorder within the same parent
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setStatus(`Moved to position ${to + 1} of ${ids.length}`);
    setDragId(null);
    setOverId(null);
    await onReorder(ids);
  };

  const renderChild = (n: MenuNode, siblings: MenuNode[], depth: number) => {
    const index = siblings.findIndex((s) => s.id === n.id);
    return (
      <Fragment key={n.id}>
        <li
          draggable={canEdit}
          onDragStart={() => setDragId(n.id)}
          onDragEnd={() => { setDragId(null); setOverId(null); }}
          onDragOver={(e) => {
            if (!canEdit || !dragId) return;
            if (!siblings.some((s) => s.id === dragId)) return;
            e.preventDefault();
            setOverId(n.id);
          }}
          onDrop={(e) => { e.preventDefault(); void dropOn(siblings, n.id); }}
          className={`flex flex-wrap items-center gap-2 py-1.5 ${
            overId === n.id ? "rounded bg-admin-accent/10 ring-1 ring-admin-accent" : ""
          } ${dragId === n.id ? "opacity-60" : ""}`}
          style={{ paddingLeft: depth * 18 }}
        >
          {canEdit ? (
            <span
              className="cursor-grab text-muted-foreground active:cursor-grabbing"
              title="Drag to reorder · টেনে ক্রম বদলান"
              aria-hidden
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          ) : (
            <span className="text-muted-foreground">↳</span>
          )}
          <span className="font-medium">{n.label}</span>
          {n.label_bn && <span className="text-xs text-muted-foreground">{n.label_bn}</span>}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{n.href}</code>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              n.is_published === false ? "bg-secondary text-muted-foreground" : "bg-admin-success text-admin-success-foreground"
            }`}
          >
            {n.is_published === false ? "Hidden" : "Published"}
          </span>
          {canEdit && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => void move(siblings, n.id, -1)}
                disabled={index <= 0}
                title="Move up · উপরে"
                aria-label={`Move ${n.label} up`}
                className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary disabled:opacity-35"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => void move(siblings, n.id, 1)}
                disabled={index === siblings.length - 1}
                title="Move down · নিচে"
                aria-label={`Move ${n.label} down`}
                className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary disabled:opacity-35"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              <button onClick={() => onRename(n)} title="Rename" aria-label={`Rename ${n.label}`} className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary">
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => onTogglePublished(n.id, n.is_published === false)}
                title={n.is_published === false ? "Publish" : "Hide"}
                aria-label={`${n.is_published === false ? "Publish" : "Hide"} ${n.label}`}
                className="grid h-7 w-7 place-items-center rounded border border-border hover:bg-secondary"
              >
                {n.is_published === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
              <button onClick={() => onDelete(n)} title="Remove" aria-label={`Remove ${n.label}`} className="grid h-7 w-7 place-items-center rounded border border-border text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </li>
        {n.children.map((c) => renderChild(c, n.children, depth + 1))}
      </Fragment>
    );
  };

  if (attached.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This page isn&apos;t in any menu yet · এই পেইজটি এখনো কোনো মেনুতে নেই —{" "}
        <span className="font-mono text-xs">{pagePath}</span>. Open the page editor&apos;s{" "}
        <strong>Navigation &amp; submenu</strong> tab to add it.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="sr-only" aria-live="polite">{status}</p>
      {!canEdit && (
        <p className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          মেনু সম্পাদনার অনুমতি নেই ({roleLabel}) — শুধু দেখতে পারবেন।
        </p>
      )}
      {attached.map(({ node, location }) => (
        <div key={node.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <ListTree className="h-4 w-4 text-admin-accent" />
            <span className="text-sm font-semibold">{node.label}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {location} menu
            </span>
            {canEdit && (
              <button
                onClick={() => setAddFor(addFor === node.id ? null : node.id)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-admin-accent px-2.5 py-1.5 text-xs font-semibold text-admin-accent-foreground"
              >
                <Plus className="h-3 w-3" /> Add submenu · সাবমেনু
              </button>
            )}
          </div>

          {canEdit && addFor === node.id && (
            <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md bg-secondary/40 p-3">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (EN)" aria-label="Submenu label (EN)" className={cls} />
              <input value={labelBn} onChange={(e) => setLabelBn(e.target.value)} placeholder="লেবেল (BN)" aria-label="Submenu label (BN)" className={cls} />
              <select value={href} onChange={(e) => setHref(e.target.value)} aria-label="Submenu link" className={cls}>
                {pages.map((pg) => (
                  <option key={pg.path} value={pg.path}>
                    {pg.name} — {pg.path}
                  </option>
                ))}
              </select>
              <button
                onClick={() => submit(node)}
                disabled={busy || !label.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-admin-accent px-3 py-1.5 text-xs font-semibold text-admin-accent-foreground disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Save
              </button>
            </div>
          )}

          {node.children.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No submenu items yet · কোনো সাবমেনু নেই।</p>
          ) : (
            <ul className="mt-2 divide-y divide-border/50 text-sm">
              {node.children.map((c) => renderChild(c, node.children, 0))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
