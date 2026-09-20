import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteMenuItemAction,
  listMenuItemsAction,
  listSettingsAction,
  updateMenuItemFieldsAction,
  upsertMenuItemAction,
  upsertSettingAction,
} from "@/actions/cms";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { buildMenuTree, type MenuItem, type MenuNode } from "@/lib/siteContent";
import { useInternalLinkOptions } from "@/lib/internalLinks";
import {
  DEFAULT_MENU_LOCK,
  MENU_LOCK_SETTING_KEY,
  normalizeHeaderOrder,
  readMenuLock,
  validateHeaderMenu,
  type MenuLockValue,
} from "@/lib/menuLock";
import { clearMenuPreview, setMenuPreview } from "@/lib/menuPreview";
import {
  MENU_ACCENTS,
  MENU_ICON_NAMES,
  MENU_STYLES,
  MenuIcon,
  accentColor,
  menuItemAppearance,
} from "@/lib/menuStyles";
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  Pencil,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  Check,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  ExternalLink,
  Wand2,
} from "lucide-react";


export const Route = createFileRoute("/admin/menus")({
  head: () => ({
    meta: [
      { title: "Menus — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminMenus,
});

const inputCls =
  "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";
const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

const MAX_DEPTH = 2; // 0 = menu, 1 = submenu, 2 = sub-submenu

type DropMode = "before" | "after" | "inside";

const VISIBILITY: { key: string; label: string; labelBn: string }[] = [
  { key: "all", label: "Everyone", labelBn: "সবাই" },
  { key: "guest", label: "Signed-out visitors", labelBn: "লগইন ছাড়া" },
  { key: "authenticated", label: "Signed-in users", labelBn: "লগইন করা ব্যবহারকারী" },
  { key: "admin", label: "Admins only", labelBn: "শুধু অ্যাডমিন" },
];

function AdminMenus() {
  const [rows, setRowsState] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewBn, setPreviewBn] = useState(false);
  const [previewMobile, setPreviewMobile] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; mode: DropMode } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const linkOptions = useInternalLinkOptions();
  const [lock, setLock] = useState<MenuLockValue>(DEFAULT_MENU_LOCK);
  const [lockRowId, setLockRowId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const dragIdRef = useRef<string | null>(null);

  // ---- undo / redo history -------------------------------------------------
  const past = useRef<MenuItem[][]>([]);
  const future = useRef<MenuItem[][]>([]);
  const [histTick, setHistTick] = useState(0);
  const dirty = useRef(false);
  const skipAutoSave = useRef(true);

  /** Update rows and push the previous snapshot onto the undo stack. */
  const setRows = (updater: MenuItem[] | ((prev: MenuItem[]) => MenuItem[]), track = true) => {
    setRowsState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: MenuItem[]) => MenuItem[])(prev) : updater;
      if (track) {
        past.current = [...past.current.slice(-49), prev];
        future.current = [];
        dirty.current = true;
        setHistTick((t) => t + 1);
      }
      return next;
    });
  };

  const load = async () => {
    const result = await listMenuItemsAction();
    if (!result.ok) setErr(result.error);
    skipAutoSave.current = true;
    setRowsState((result.ok ? result.rows : []) as MenuItem[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    void (async () => {
      const result = await listSettingsAction();
      if (!result.ok) return;
      const row = (result.rows as { id: string; key: string; value: unknown }[]).find(
        (r) => r.key === MENU_LOCK_SETTING_KEY,
      );
      if (row) {
        setLockRowId(row.id);
        setLock(readMenuLock(row.value));
      }
    })();
  }, []);

  /** Persist the header ordering lock into cms_settings. */
  const saveLock = async (next: MenuLockValue) => {
    setLock(next);
    const result = await upsertSettingAction({
      id: lockRowId ?? undefined,
      key: MENU_LOCK_SETTING_KEY,
      label: "Header menu lock",
      group: "navigation",
      value: next as unknown as Record<string, unknown>,
      sort_order: 99,
    });
    if (!result.ok) setErr(result.error);
    else if (!lockRowId) setLockRowId(result.id);
  };

  const patch = (id: string, key: keyof MenuItem, value: unknown) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const persistRows = async (list: MenuItem[], silent = false) => {
    setSaving(true);
    setErr(null);
    if (!silent) setMsg(null);
    for (const row of list) {
      const { id, created_at, updated_at, ...rest } = row as MenuItem & {
        created_at?: string;
        updated_at?: string;
      };
      void created_at;
      void updated_at;
      const result = await updateMenuItemFieldsAction({ id, patch: rest as Record<string, unknown> });
      if (!result.ok) {
        setErr(result.error);
        setSaving(false);
        return false;
      }
    }
    dirty.current = false;
    setSavedAt(new Date().toLocaleTimeString());
    if (!silent) setMsg("Menu structure saved.");
    setSaving(false);
    return true;
  };

  const saveAll = () => persistRows(rows);

  // Debounced autosave — every edit is written ~1s after you stop typing.
  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }
    if (!autoSave || loading || !rows.length) return;
    const t = setTimeout(() => {
      void persistRows(rows, true);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, autoSave, loading]);

  const undo = async () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [rows, ...future.current].slice(0, 50);
    skipAutoSave.current = !autoSave;
    setRowsState(prev);
    setHistTick((t) => t + 1);
    setAnnouncement("Change undone");
    if (autoSave) await persistRows(prev, true);
  };

  const redo = async () => {
    const [next, ...rest] = future.current;
    if (!next) return;
    future.current = rest;
    past.current = [...past.current, rows];
    skipAutoSave.current = !autoSave;
    setRowsState(next);
    setHistTick((t) => t + 1);
    setAnnouncement("Change redone");
    if (autoSave) await persistRows(next, true);
  };

  // Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        void undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        void redo();
      } else if (k === "s") {
        e.preventDefault();
        void saveAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  const addItem = async (location: "header" | "footer", parent?: MenuItem) => {
    const depth = parent ? (parent.depth ?? 0) + 1 : 0;
    const siblings = rows.filter(
      (r) => r.location === location && (r.parent_id ?? null) === (parent?.id ?? null),
    );
    const result = await upsertMenuItemAction({
      location,
      label: depth === 0 ? "New menu" : depth === 1 ? "New submenu" : "New sub-item",
      href: "/",
      parent_id: parent?.id ?? null,
      depth,
      sort_order: siblings.length + 1,
      is_published: true,
    });
    if (!result.ok) setErr(result.error);
    else {
      if (parent) setCollapsed((c) => ({ ...c, [parent.id]: false }));
      await load();
    }
  };

  const remove = async (node: MenuNode) => {
    const n = countDescendants(node);
    if (
      !window.confirm(
        n > 0 ? `Delete "${node.label}" and its ${n} sub-item(s)?` : `Delete "${node.label}"?`,
      )
    )
      return;
    const result = await deleteMenuItemAction({ id: node.id });
    if (!result.ok) setErr(result.error);
    else await load();
  };

  /** Persist parent/depth/sort_order for the rows that actually changed. */
  const persistStructure = async (next: MenuItem[], prev: MenuItem[]) => {
    const before = new Map(prev.map((r) => [r.id, r]));
    for (const r of next) {
      const p = before.get(r.id);
      if (
        p &&
        (p.parent_id ?? null) === (r.parent_id ?? null) &&
        (p.depth ?? 0) === (r.depth ?? 0) &&
        (p.sort_order ?? 0) === (r.sort_order ?? 0)
      )
        continue;
      const result = await updateMenuItemFieldsAction({
        id: r.id,
        patch: {
          parent_id: r.parent_id ?? null,
          depth: r.depth ?? 0,
          sort_order: r.sort_order ?? 0,
        },
      });
      if (!result.ok) {
        setErr(result.error);
        return;
      }
    }
  };

  /** Reorder within siblings (persisted immediately). */
  const move = async (node: MenuNode, siblings: MenuNode[], dir: -1 | 1) => {
    const idx = siblings.findIndex((s) => s.id === node.id);
    const target = siblings[idx + dir];
    if (!target) return;
    const a = node.sort_order ?? idx + 1;
    const b = target.sort_order ?? idx + 1 + dir;
    const next = rows.map((r) =>
      r.id === node.id ? { ...r, sort_order: b } : r.id === target.id ? { ...r, sort_order: a } : r,
    );
    setRows(next);
    await updateMenuItemFieldsAction({ id: node.id, patch: { sort_order: b } });
    await updateMenuItemFieldsAction({ id: target.id, patch: { sort_order: a } });
  };

  /** Indent: become a child of the previous sibling. Outdent: move up a level. */
  const reparent = async (node: MenuNode, siblings: MenuNode[], dir: "in" | "out", parent?: MenuNode) => {
    const idx = siblings.findIndex((s) => s.id === node.id);
    if (dir === "in") {
      const prev = siblings[idx - 1];
      if (!prev) return;
      setCollapsed((c) => ({ ...c, [prev.id]: false }));
      await applyDrop(node.id, prev.id, "inside");
    } else {
      if (!parent) return;
      await applyDrop(node.id, parent.id, "after");
    }
  };

  /** Drag & drop / indent engine: move `dragId` relative to `targetId`. */
  const applyDrop = async (dragedId: string, targetId: string, mode: DropMode) => {
    if (dragedId === targetId) return;
    const drag = rows.find((r) => r.id === dragedId);
    const target = rows.find((r) => r.id === targetId);
    if (!drag || !target || drag.location !== target.location) return;

    const location = drag.location;
    const scoped = rows.filter((r) => r.location === location);
    const tree = buildMenuTree(scoped);

    // Prevent dropping a node inside its own subtree.
    const dragNode = findNode(tree, dragedId);
    if (!dragNode || findNode(dragNode.children, targetId)) return;

    const detached = removeNode(tree, dragedId);
    const moved: MenuNode = { ...dragNode };
    const targetDepth = target.depth ?? 0;
    if (mode === "inside" && targetDepth + 1 > MAX_DEPTH) return;
    if (mode !== "inside" && targetDepth > MAX_DEPTH) return;

    const ok = insertNode(detached, targetId, mode, moved);
    if (!ok) return;

    const flatUpdated = flattenTree(detached, null, 0);
    const byId = new Map(flatUpdated.map((r) => [r.id, r]));
    const prev = rows;
    const next = rows.map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id)! } : r));
    setRows(next);
    if (mode === "inside") setCollapsed((c) => ({ ...c, [targetId]: false }));
    await persistStructure(next, prev);
  };

  const trees = useMemo(
    () => ({
      header: buildMenuTree(rows.filter((r) => r.location === "header")),
      footer: buildMenuTree(rows.filter((r) => r.location === "footer")),
    }),
    [rows],
  );

  const onRowDragOver = (e: React.DragEvent, node: MenuNode) => {
    if (!dragIdRef.current || dragIdRef.current === node.id) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const canNest = (node.depth ?? 0) < MAX_DEPTH;
    const mode: DropMode = ratio < 0.3 ? "before" : ratio > 0.7 || !canNest ? "after" : "inside";
    setDropTarget({ id: node.id, mode });
  };

  const renderNode = (
    node: MenuNode,
    siblings: MenuNode[],
    location: "header" | "footer",
    parent?: MenuNode,
  ) => {
    const depth = node.depth ?? 0;
    const hasKids = node.children.length > 0;
    const isCollapsed = collapsed[node.id];
    const isEditing = editingId === node.id;
    const idx = siblings.findIndex((s) => s.id === node.id);
    const dt = dropTarget?.id === node.id ? dropTarget.mode : null;

    const posLabel = `${node.label}, level ${depth + 1}, item ${idx + 1} of ${siblings.length}`;

    const onRowKeyDown = (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,select,textarea,button")) return;
      const alt = e.altKey;
      switch (e.key) {
        case "ArrowUp":
          if (alt) {
            e.preventDefault();
            void move(node, siblings, -1);
            setAnnouncement(`${node.label} moved up`);
          }
          break;
        case "ArrowDown":
          if (alt) {
            e.preventDefault();
            void move(node, siblings, 1);
            setAnnouncement(`${node.label} moved down`);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (alt) {
            void reparent(node, siblings, "in", parent);
            setAnnouncement(`${node.label} nested as submenu`);
          } else if (hasKids) setCollapsed((c) => ({ ...c, [node.id]: false }));
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (alt) {
            void reparent(node, siblings, "out", parent);
            setAnnouncement(`${node.label} moved one level up`);
          } else if (hasKids) setCollapsed((c) => ({ ...c, [node.id]: true }));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          setEditingId(isEditing ? null : node.id);
          break;
        default:
          break;
      }
    };

    return (
      <li key={node.id} role="none">
        <div
          role="treeitem"
          tabIndex={0}
          aria-level={depth + 1}
          aria-posinset={idx + 1}
          aria-setsize={siblings.length}
          aria-expanded={hasKids ? !isCollapsed : undefined}
          aria-selected={isEditing}
          aria-label={posLabel}
          onKeyDown={onRowKeyDown}
          draggable
          onDragStart={(e) => {
            dragIdRef.current = node.id;
            setDragId(node.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", node.id);
          }}
          onDragEnd={() => {
            dragIdRef.current = null;
            setDragId(null);
            setDropTarget(null);
          }}
          onDragOver={(e) => onRowDragOver(e, node)}
          onDragLeave={() => setDropTarget((d) => (d?.id === node.id ? null : d))}
          onDrop={(e) => {
            e.preventDefault();
            const id = dragIdRef.current ?? e.dataTransfer.getData("text/plain");
            const mode = dropTarget?.mode ?? "after";
            setDropTarget(null);
            setDragId(null);
            dragIdRef.current = null;
            if (id) void applyDrop(id, node.id, mode);
          }}
          className={`flex flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2 transition hover:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
            dragId === node.id ? "opacity-40" : ""
          } ${dt === "before" ? "border-t-2 border-t-primary" : ""} ${
            dt === "after" ? "border-b-2 border-b-primary" : ""
          } ${dt === "inside" ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : ""}`}
          style={{ paddingLeft: 12 + depth * 26 }}
        >
          <GripVertical
            aria-hidden
            className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/60 active:cursor-grabbing"
          />

          <button
            type="button"
            onClick={() => setCollapsed((c) => ({ ...c, [node.id]: !c[node.id] }))}
            className={`rounded p-0.5 text-muted-foreground ${hasKids ? "hover:bg-secondary" : "invisible"}`}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              depth === 0
                ? "bg-primary/10 text-primary"
                : depth === 1
                  ? "bg-secondary text-muted-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {depth === 0 ? "Menu" : depth === 1 ? "Sub" : "Sub·2"}
          </span>

          <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm font-medium">
            {node.icon ? (
              <span style={{ color: accentColor(node.accent) }}>
                <MenuIcon name={node.icon} className="h-4 w-4" />
              </span>
            ) : null}
            <span className="shrink-0" style={{ color: accentColor(node.accent) }}>{node.label}</span>
            {node.label_bn ? (
              <span className="max-w-[9rem] shrink-0 truncate text-muted-foreground">/ {node.label_bn}</span>
            ) : null}
            {node.badge ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {node.badge}
              </span>
            ) : null}
            <span className="ml-1 truncate text-xs text-muted-foreground">{node.href}</span>
          </span>

          {!node.is_published && (
            <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">
              Hidden
            </span>
          )}

          <div className="flex items-center gap-1">
            <IconBtn label="Move up" disabled={idx === 0} onClick={() => void move(node, siblings, -1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              label="Move down"
              disabled={idx === siblings.length - 1}
              onClick={() => void move(node, siblings, 1)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              label="Make submenu of item above"
              disabled={idx === 0 || depth >= MAX_DEPTH}
              onClick={() => void reparent(node, siblings, "in", parent)}
            >
              <CornerDownRight className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              label="Move one level up"
              disabled={!parent}
              onClick={() => void reparent(node, siblings, "out", parent)}
            >
              <CornerDownRight className="h-3.5 w-3.5 -scale-x-100" />
            </IconBtn>
            <IconBtn
              label="Add submenu"
              disabled={depth >= MAX_DEPTH}
              onClick={() => void addItem(location, node)}
            >
              <Plus className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn label={isEditing ? "Close" : "Edit"} onClick={() => setEditingId(isEditing ? null : node.id)}>
              {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            </IconBtn>
            <IconBtn label="Delete" danger onClick={() => void remove(node)}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        </div>

        {isEditing && (
          <div
            className="grid gap-3 border-b border-border/50 bg-secondary/30 px-3 py-3 sm:grid-cols-2"
            style={{ paddingLeft: 12 + depth * 26 }}
          >
            <div>
              <label className={labelCls}>Label (EN)</label>
              <input className={inputCls} value={node.label} onChange={(e) => patch(node.id, "label", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Label (BN)</label>
              <input
                className={inputCls}
                value={node.label_bn ?? ""}
                onChange={(e) => patch(node.id, "label_bn", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Link</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className={`${inputCls} sm:w-1/2`}
                  value={linkOptions.some((o) => o.value === node.href) ? node.href : ""}
                  onChange={(e) => e.target.value && patch(node.id, "href", e.target.value)}
                >
                  <option value="">— Choose an internal page —</option>
                  {Array.from(new Set(linkOptions.map((o) => o.group))).map((g) => (
                    <optgroup key={g} label={g}>
                      {linkOptions
                        .filter((o) => o.group === g)
                        .map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label} ({o.value})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <input
                  className={`${inputCls} sm:w-1/2`}
                  value={node.href}
                  placeholder="/custom-path or https://…"
                  onChange={(e) => patch(node.id, "href", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description (EN)</label>
              <input
                className={inputCls}
                value={node.description ?? ""}
                onChange={(e) => patch(node.id, "description", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Description (BN)</label>
              <input
                className={inputCls}
                value={node.description_bn ?? ""}
                onChange={(e) => patch(node.id, "description_bn", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Badge (EN)</label>
              <input
                className={inputCls}
                value={node.badge ?? ""}
                placeholder="New / Hot"
                onChange={(e) => patch(node.id, "badge", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Badge (BN)</label>
              <input
                className={inputCls}
                value={node.badge_bn ?? ""}
                placeholder="নতুন"
                onChange={(e) => patch(node.id, "badge_bn", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Group label (mega-menu column)</label>
              <input
                className={inputCls}
                value={node.group_label ?? ""}
                onChange={(e) => patch(node.id, "group_label", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Order</label>
              <input
                type="number"
                className={inputCls}
                value={node.sort_order ?? 0}
                onChange={(e) => patch(node.id, "sort_order", Number(e.target.value) || 0)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Icon</label>
              <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
                <button
                  type="button"
                  onClick={() => patch(node.id, "icon", "")}
                  className={`rounded-md px-2 py-1 text-[11px] ${!node.icon ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  None
                </button>
                {MENU_ICON_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => patch(node.id, "icon", name)}
                    className={`grid h-8 w-8 place-items-center rounded-md border ${
                      node.icon === name ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-secondary"
                    }`}
                  >
                    <MenuIcon name={name} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Accent colour</label>
              <div className="flex flex-wrap gap-1.5">
                {MENU_ACCENTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    title={a.label}
                    onClick={() => patch(node.id, "accent", a.key)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      (node.accent ?? "default") === a.key ? "border-foreground" : "border-border"
                    }`}
                    style={{
                      background:
                        a.color ||
                        "repeating-linear-gradient(45deg, var(--muted) 0 4px, var(--background) 4px 8px)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Style</label>
              <select
                className={inputCls}
                value={node.item_style ?? "plain"}
                onChange={(e) => patch(node.id, "item_style", e.target.value)}
              >
                {MENU_STYLES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} — {s.labelBn}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <span {...menuItemAppearance(node.item_style, node.accent)}>
                  <MenuIcon name={node.icon} className="h-4 w-4" />
                  {node.label}
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor={`vis-${node.id}`}>
                <Users className="mr-1 inline h-3 w-3" /> Visible to (role rule)
              </label>
              <select
                id={`vis-${node.id}`}
                className={inputCls}
                value={(node.visible_to as string) ?? "all"}
                onChange={(e) => patch(node.id, "visible_to", e.target.value)}
              >
                {VISIBILITY.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label} — {v.labelBn}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Admin-only items are hidden from everyone except users with the admin role.
              </p>
            </div>

            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!node.is_published}
                  onChange={(e) => patch(node.id, "is_published", e.target.checked)}
                />
                Live
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!node.is_external}
                  onChange={(e) => patch(node.id, "is_external", e.target.checked)}
                />
                External
              </label>
            </div>
          </div>
        )}

        {hasKids && !isCollapsed && (
          <ul role="group">{node.children.map((c) => renderNode(c, node.children, location, node))}</ul>
        )}
      </li>
    );
  };

  const section = (location: "header" | "footer", title: string, titleBn: string) => {
    const tree = trees[location];
    return (
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {title} <span className="font-normal normal-case tracking-normal">— {titleBn}</span>
          </h2>
          <button
            onClick={() => void addItem(location)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add top-level menu
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {tree.length ? (
            <ul
              role="tree"
              aria-label={`${title} structure. Use arrow keys to expand, Alt plus arrows to move or nest items.`}
            >
              {tree.map((n) => renderNode(n, tree, location))}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No links yet.</p>
          )}
        </div>
      </section>
    );
  };


  // Keep the site-preview draft in sync with the editor while preview is active.
  useEffect(() => {
    if (previewing) setMenuPreview(rows);
  }, [rows, previewing]);
  useEffect(() => () => clearMenuPreview(), []);

  const issues = useMemo(() => validateHeaderMenu(rows, lock), [rows, lock]);
  const currentHeaderOrder = useMemo(
    () =>
      rows
        .filter((r) => r.location === "header" && !r.parent_id)
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((r) => r.href),
    [rows],
  );

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  void histTick; // re-render trigger for the undo/redo buttons

  return (
    <div>
      <AdminPageHeader
        title="Menus"
        titleBn="মেনু, সাব-মেনু ও ফুটার"
        description="Drag rows to reorder or nest (drop on the middle of a row to make it a submenu). Keyboard: focus a row, then Alt+↑/↓ to move, Alt+←/→ to change level, ←/→ to collapse or expand, Enter to edit. Changes autosave; Ctrl/Cmd+Z undoes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              <button
                onClick={() => void undo()}
                disabled={!canUndo}
                aria-label="Undo last menu change"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-secondary disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" /> Undo
              </button>
              <button
                onClick={() => void redo()}
                disabled={!canRedo}
                aria-label="Redo menu change"
                className="inline-flex items-center gap-1.5 border-l border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-40"
              >
                <Redo2 className="h-4 w-4" /> Redo
              </button>
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
              Autosave
            </label>
            <button
              onClick={() => {
                if (previewing) {
                  clearMenuPreview();
                  setPreviewing(false);
                  return;
                }
                setMenuPreview(rows);
                setPreviewing(true);
                window.open("/", "_blank", "noopener");
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${previewing ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}
            >
              <ExternalLink className="h-4 w-4" />
              {previewing ? "Stop site preview" : "Preview on site"}
            </button>
            <button
              onClick={() => void saveLock({ ...lock, locked: !lock.locked })}
              aria-pressed={lock.locked}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${lock.locked ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}
            >
              {lock.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              {lock.locked ? "Order locked" : "Order unlocked"}
            </button>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "Hide preview" : "Live preview"}
            </button>
            <button
              onClick={() => void saveAll()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save all
            </button>
          </div>
        }
      />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        {saving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
          </>
        ) : savedAt ? (
          <>
            <Check className="h-3.5 w-3.5 text-primary" /> All changes saved at {savedAt}
          </>
        ) : autoSave ? (
          <>Autosave is on — edits save about a second after you stop typing.</>
        ) : (
          <>Autosave is off — use “Save all”.</>
        )}
      </div>

      <MenuLockPanel
        issues={issues}
        lock={lock}
        onFixOrder={() => setRows((rs) => normalizeHeaderOrder(rs, lock))}
        onCapture={() => void saveLock({ ...lock, order: currentHeaderOrder })}
      />

      {err && <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      {msg && <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className={showPreview ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]" : ""}>
        <div className="min-w-0">
          {section("header", "Header navigation", "হেডার মেনু")}
          {section("footer", "Footer links", "ফুটার লিংক")}
        </div>

        {showPreview && (
          <aside className="xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                  {previewMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />} Live menu
                  preview
                </h3>
                <div className="flex items-center gap-2">
                  <div className="inline-flex overflow-hidden rounded-full border border-border text-[11px] font-semibold">
                    <button
                      onClick={() => setPreviewMobile(false)}
                      aria-pressed={!previewMobile}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 ${!previewMobile ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                    >
                      <Monitor className="h-3.5 w-3.5" /> Desktop
                    </button>
                    <button
                      onClick={() => setPreviewMobile(true)}
                      aria-pressed={previewMobile}
                      className={`inline-flex items-center gap-1 border-l border-border px-2.5 py-1 ${previewMobile ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Mobile
                    </button>
                  </div>
                  <button
                    onClick={() => setPreviewBn((v) => !v)}
                    aria-label="Toggle preview language"
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-secondary"
                  >
                    {previewBn ? "বাংলা" : "EN"}
                  </button>
                </div>
              </div>

              {previewMobile ? (
                <div className="mx-auto w-[320px] rounded-[2rem] border-4 border-foreground/80 bg-background p-2 shadow-lg">
                  <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-foreground/30" />
                  <div className="max-h-[520px] overflow-y-auto">
                    <MobileMenuPreview tree={trees.header} bn={previewBn} title="Header" />
                    <div className="mt-3">
                      <MobileMenuPreview tree={trees.footer} bn={previewBn} title="Footer" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <MenuPreview tree={trees.header} bn={previewBn} title="Header" />
                  <div className="mt-4">
                    <MenuPreview tree={trees.footer} bn={previewBn} title="Footer" footer />
                  </div>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );

}

/* ------------------------------ live preview ------------------------------ */

/** App-style mobile drawer preview (mirrors the public mobile nav panel). */
function MobileMenuPreview({ tree, bn, title }: { tree: MenuNode[]; bn: boolean; title: string }) {
  const visible = tree.filter((n) => n.is_published !== false);
  const text = (n: MenuNode) => (bn && n.label_bn) || n.label;
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      {visible.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No live items.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {visible.map((n) => {
            const kids = n.children.filter((c) => c.is_published !== false);
            return (
              <div key={n.id}>
                <div className="flex min-h-10 items-center justify-between rounded-xl px-3 py-2 text-[14px] font-medium hover:bg-secondary">
                  <span className="flex items-center gap-2">
                    <MenuIcon name={n.icon} className="h-4 w-4" />
                    {text(n)}
                  </span>
                  {kids.length > 0 && <ChevronDown className="h-4 w-4 opacity-60" />}
                </div>
                {kids.length > 0 && (
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-3">
                    {kids.map((c) => (
                      <div key={c.id}>
                        <div className="flex min-h-9 items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] text-muted-foreground">
                          <MenuIcon name={c.icon} className="h-3.5 w-3.5" />
                          {text(c)}
                        </div>
                        {c.children
                          .filter((g) => g.is_published !== false)
                          .map((g) => (
                            <div key={g.id} className="ml-4 py-0.5 text-[11px] text-muted-foreground/80">
                              {text(g)}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function MenuPreview({
  tree,
  bn,
  title,
  footer,
}: {
  tree: MenuNode[];
  bn: boolean;
  title: string;
  footer?: boolean;
}) {
  const visible = tree.filter((n) => n.is_published !== false);
  const text = (n: MenuNode) => (bn && n.label_bn) || n.label;
  const badge = (n: MenuNode) => (bn && n.badge_bn) || n.badge;

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      {visible.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No live items.</p>
      ) : (
        <div className={footer ? "grid grid-cols-2 gap-3" : "flex flex-wrap items-center gap-1"}>
          {visible.map((n) => {
            const app = menuItemAppearance(n.item_style, n.accent);
            const kids = n.children.filter((c) => c.is_published !== false);
            return (
              <div key={n.id} className={footer ? "" : "group relative"}>
                <span className={app.className} style={app.style}>
                  <MenuIcon name={n.icon} className="h-4 w-4" />
                  {text(n)}
                  {badge(n) ? (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {badge(n)}
                    </span>
                  ) : null}
                  {kids.length > 0 && !footer ? <ChevronDown className="h-3 w-3 opacity-60" /> : null}
                </span>
                {kids.length > 0 && (
                  <div
                    className={
                      footer
                        ? "mt-1 space-y-1 border-l border-border pl-3"
                        : "mt-1 hidden space-y-1 rounded-lg border border-border bg-card p-2 shadow-sm group-hover:block"
                    }
                  >
                    {kids.map((c) => {
                      const sub = menuItemAppearance(c.item_style, c.accent);
                      return (
                        <div key={c.id}>
                          <span className={`${sub.className} !px-2 !py-1 text-xs`} style={sub.style}>
                            <MenuIcon name={c.icon} className="h-3.5 w-3.5" />
                            {text(c)}
                          </span>
                          {c.children.filter((g) => g.is_published !== false).length > 0 && (
                            <div className="ml-3 border-l border-border pl-2">
                              {c.children
                                .filter((g) => g.is_published !== false)
                                .map((g) => (
                                  <div key={g.id} className="py-0.5 text-[11px] text-muted-foreground">
                                    {text(g)}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border border-transparent p-1.5 text-muted-foreground transition hover:bg-secondary disabled:opacity-30 ${
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------- tree helpers ------------------------------ */

function findNode(list: MenuNode[], id: string): MenuNode | undefined {
  for (const n of list) {
    if (n.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return undefined;
}

/** Returns a new tree without `id`. */
function removeNode(list: MenuNode[], id: string): MenuNode[] {
  return list
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

/** Inserts `node` relative to `targetId`. Mutates `list` in place. */
function insertNode(list: MenuNode[], targetId: string, mode: DropMode, node: MenuNode): boolean {
  for (let i = 0; i < list.length; i++) {
    const cur = list[i];
    if (cur.id === targetId) {
      if (mode === "inside") cur.children = [...cur.children, node];
      else list.splice(mode === "before" ? i : i + 1, 0, node);
      return true;
    }
    if (insertNode(cur.children, targetId, mode, node)) return true;
  }
  return false;
}

/** Walks the tree assigning parent_id / depth / sort_order. */
function flattenTree(
  list: MenuNode[],
  parentId: string | null,
  depth: number,
): { id: string; parent_id: string | null; depth: number; sort_order: number }[] {
  const out: { id: string; parent_id: string | null; depth: number; sort_order: number }[] = [];
  list.forEach((n, i) => {
    out.push({ id: n.id, parent_id: parentId, depth, sort_order: i + 1 });
    out.push(...flattenTree(n.children, n.id, depth + 1));
  });
  return out;
}

function countDescendants(node: MenuNode): number {
  return node.children.reduce((n, c) => n + 1 + countDescendants(c), 0);
}

/* --------------------------- lock & validation UI -------------------------- */

function MenuLockPanel({
  issues,
  lock,
  onFixOrder,
  onCapture,
}: {
  issues: ReturnType<typeof validateHeaderMenu>;
  lock: MenuLockValue;
  onFixOrder: () => void;
  onCapture: () => void;
}) {
  const errors = issues.filter((i) => i.level === "error");
  return (
    <div
      data-testid="menu-lock-panel"
      className={`mb-4 rounded-xl border p-3 text-sm ${errors.length ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-semibold">
          {errors.length ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : lock.locked ? (
            <Lock className="h-4 w-4 text-primary" />
          ) : (
            <Unlock className="h-4 w-4 text-muted-foreground" />
          )}
          Header structure {errors.length ? "needs attention" : "is consistent"}
          <span className="font-normal text-muted-foreground">— হেডার কাঠামো যাচাই</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onFixOrder}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
          >
            <Wand2 className="h-3.5 w-3.5" /> Restore locked order
          </button>
          <button
            onClick={onCapture}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
          >
            <Lock className="h-3.5 w-3.5" /> Lock current order
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Locked order: {lock.order.join(" → ")}
        {lock.locked ? " — the public header always renders in this order." : " — lock is off, the header follows CMS order."}
      </p>
      {issues.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {issues.map((i, idx) => (
            <li key={idx} className={i.level === "error" ? "text-destructive" : "text-muted-foreground"}>
              • {i.message} <span className="opacity-70">{i.messageBn}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
