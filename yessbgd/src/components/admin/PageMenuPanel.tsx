// Lets an editor attach a page to the site navigation directly from the page
// editor: pick header/footer, choose a parent menu item (so it becomes a
// submenu), set bilingual labels, visibility rules, reorder siblings with
// drag & drop and preview the resulting menu live. Writes to cms_menu_items.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteMenuItemAction,
  listMenuItemsAction,
  updateMenuItemFieldsAction,
  upsertMenuItemAction,
} from "@/actions/cms";
import { buildMenuTree, type MenuItem, type MenuNode, type MenuVisibility } from "@/lib/siteContent";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  CornerDownRight,
  GripVertical,
  AlertTriangle,
  Eye,
  ChevronRight,
} from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const MAX_DEPTH = 2; // 0 = menu, 1 = submenu, 2 = sub-submenu

type Location = "header" | "footer";

const VISIBILITY_OPTIONS: { value: MenuVisibility; label: string }[] = [
  { value: "all", label: "Everyone · সবাই" },
  { value: "guest", label: "Signed-out only · লগইন ছাড়া" },
  { value: "authenticated", label: "Signed-in only · লগইন করা" },
  { value: "admin", label: "Admins only · শুধু অ্যাডমিন" },
];

function flatten(nodes: MenuNode[], out: { node: MenuNode; depth: number }[] = [], depth = 0) {
  for (const n of nodes) {
    out.push({ node: n, depth });
    flatten(n.children, out, depth + 1);
  }
  return out;
}

export function PageMenuPanel({
  path,
  nameEn,
  nameBn,
}: {
  path: string;
  nameEn: string;
  nameBn?: string | null;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "bn">("en");

  // form state for adding this page to a menu
  const [location, setLocation] = useState<Location>("header");
  const [parentId, setParentId] = useState<string>("");
  const [label, setLabel] = useState(nameEn);
  const [labelBn, setLabelBn] = useState(nameBn ?? "");
  const [visibleTo, setVisibleTo] = useState<MenuVisibility>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listMenuItemsAction();
    if (!result.ok) setErr(result.error);
    setRows((result.ok ? result.rows : []) as MenuItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setLabel(nameEn);
    setLabelBn(nameBn ?? "");
  }, [nameEn, nameBn]);

  const treeFor = useCallback(
    (loc: Location) => buildMenuTree(rows.filter((r) => r.location === loc)),
    [rows],
  );

  /** Existing menu entries that already point at this page. */
  const linked = useMemo(() => rows.filter((r) => (r.href ?? "").trim() === path.trim()), [rows, path]);

  const parentOptions = useMemo(
    () => flatten(treeFor(location)).filter((f) => f.depth < MAX_DEPTH),
    [treeFor, location],
  );

  useEffect(() => {
    // reset parent when switching location if it no longer exists there
    if (parentId && !parentOptions.some((o) => o.node.id === parentId)) setParentId("");
  }, [parentOptions, parentId]);

  const refreshSite = async () => {
    await qc.invalidateQueries({ queryKey: ["cms", "menu", "header"] });
    await qc.invalidateQueries({ queryKey: ["cms", "menu", "footer"] });
  };

  /* ------------------------------ validation ------------------------------ */

  const addError = useMemo(() => {
    if (!path.trim())
      return "This page has no URL path yet — পেইজটির লিংক নেই। আগে পেইজের path সেট করুন।";
    if (!label.trim() && !nameEn.trim())
      return "An English label is required — ইংরেজি লেবেল দিতে হবে।";
    const parent = parentId ? rows.find((r) => r.id === parentId) : undefined;
    if (parentId && !parent)
      return "The selected parent no longer exists — নির্বাচিত প্যারেন্ট মেনুটি আর নেই। আবার সিলেক্ট করুন।";
    if (parent && parent.location !== location)
      return "The parent belongs to another menu location — প্যারেন্ট মেনুটি অন্য অবস্থানের।";
    if (parent && (parent.depth ?? 0) + 1 > MAX_DEPTH)
      return "Maximum 3 levels are supported — সর্বোচ্চ ৩ লেভেল পর্যন্ত সাবমেনু করা যায়।";
    if (parent && (parent.href ?? "").trim() === path.trim())
      return "A page cannot be placed under itself — পেইজটিকে নিজের নিচে রাখা যাবে না।";
    const dup = rows.find(
      (r) =>
        r.location === location &&
        (r.parent_id ?? null) === (parent?.id ?? null) &&
        (r.href ?? "").trim() === path.trim(),
    );
    if (dup)
      return `Already in this menu as “${dup.label}” — এই জায়গায় পেইজটি আগে থেকেই আছে।`;
    return null;
  }, [path, label, nameEn, parentId, rows, location]);

  /** Validation for changing the parent of an existing entry. */
  const parentChangeError = (item: MenuItem, newParentId: string | null): string | null => {
    if (!newParentId) return null;
    const parent = rows.find((r) => r.id === newParentId);
    if (!parent) return "That parent no longer exists — প্যারেন্টটি আর নেই।";
    if (parent.id === item.id) return "An item cannot be its own parent — নিজেই নিজের প্যারেন্ট হতে পারে না।";
    if (parent.location !== item.location)
      return "Parent must be in the same menu location — একই মেনু অবস্থানে হতে হবে।";
    // cycle check
    let cur: MenuItem | undefined = parent;
    const guard = new Set<string>();
    while (cur) {
      if (cur.id === item.id) return "That would create a loop — এতে মেনুতে লুপ তৈরি হবে।";
      if (guard.has(cur.id)) break;
      guard.add(cur.id);
      cur = cur.parent_id ? rows.find((r) => r.id === cur!.parent_id) : undefined;
    }
    if ((parent.depth ?? 0) + 1 > MAX_DEPTH)
      return "Maximum 3 levels are supported — সর্বোচ্চ ৩ লেভেল পর্যন্ত।";
    const childDepth = flatten(buildMenuTree(rows.filter((r) => r.location === item.location)))
      .filter((f) => f.node.id === item.id)
      .map((f) => {
        const sub = flatten([f.node]);
        return Math.max(...sub.map((s) => s.depth));
      })[0] ?? 0;
    if ((parent.depth ?? 0) + 1 + childDepth > MAX_DEPTH)
      return "Its own submenus would go past 3 levels — এর সাবমেনুগুলো ৩ লেভেল ছাড়িয়ে যাবে।";
    return null;
  };

  /* -------------------------------- mutations ------------------------------- */

  const addToMenu = async () => {
    if (addError) {
      setErr(addError);
      setMsg(null);
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const parent = parentId ? rows.find((r) => r.id === parentId) : undefined;
    const depth = parent ? (parent.depth ?? 0) + 1 : 0;
    const siblings = rows.filter(
      (r) => r.location === location && (r.parent_id ?? null) === (parent?.id ?? null),
    );
    const result = await upsertMenuItemAction({
      location,
      label: label.trim() || nameEn,
      label_bn: labelBn.trim() || null,
      href: path,
      parent_id: parent?.id ?? null,
      depth,
      sort_order: siblings.length + 1,
      is_published: true,
      visible_to: visibleTo,
    });
    setBusy(false);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setMsg(
      parent
        ? `Added as a submenu of “${parent.label}” · সাবমেনু যোগ হয়েছে`
        : "Added to the menu · মেনুতে যোগ হয়েছে",
    );
    await load();
    await refreshSite();
  };

  const updateEntry = async (item: MenuItem, patch: Partial<MenuItem>, successMsg?: string) => {
    setBusy(true);
    setErr(null);
    const result = await updateMenuItemFieldsAction({
      id: item.id,
      patch: patch as Record<string, unknown>,
    });
    setBusy(false);
    if (!result.ok) setErr(result.error);
    else {
      setMsg(successMsg ?? "Menu entry updated · আপডেট হয়েছে");
      await load();
      await refreshSite();
    }
  };

  const removeEntry = async (item: MenuItem) => {
    if (!window.confirm(`Remove “${item.label}” from the ${item.location} menu?`)) return;
    setBusy(true);
    const result = await deleteMenuItemAction({ id: item.id });
    setBusy(false);
    if (!result.ok) setErr(result.error);
    else {
      setMsg("Removed from the menu · মেনু থেকে সরানো হয়েছে");
      await load();
      await refreshSite();
    }
  };

  /* ------------------------------ drag & drop ------------------------------- */

  const persistOrder = async (ordered: MenuItem[]) => {
    setBusy(true);
    setErr(null);
    for (let i = 0; i < ordered.length; i++) {
      const result = await updateMenuItemFieldsAction({
        id: ordered[i].id,
        patch: { sort_order: i + 1 },
      });
      if (!result.ok) {
        setBusy(false);
        setErr(result.error);
        return;
      }
    }
    setBusy(false);
    setMsg("Order updated · ক্রম আপডেট হয়েছে");
    await load();
    await refreshSite();
  };

  const reorder = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const source = rows.find((r) => r.id === sourceId);
    const target = rows.find((r) => r.id === targetId);
    if (!source || !target) return;
    if (source.location !== target.location || (source.parent_id ?? null) !== (target.parent_id ?? null)) {
      setErr(
        "Drag & drop reorders items inside the same parent only — একই প্যারেন্টের ভেতরেই ক্রম বদলানো যায়। প্যারেন্ট বদলাতে “Parent” সিলেক্ট ব্যবহার করুন।",
      );
      return;
    }
    const siblings = rows
      .filter((r) => r.location === source.location && (r.parent_id ?? null) === (source.parent_id ?? null))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const from = siblings.findIndex((s) => s.id === sourceId);
    const to = siblings.findIndex((s) => s.id === targetId);
    const next = [...siblings];
    next.splice(to, 0, next.splice(from, 1)[0]);
    await persistOrder(next);
  };

  const moveBy = async (item: MenuItem, delta: number) => {
    const siblings = rows
      .filter((r) => r.location === item.location && (r.parent_id ?? null) === (item.parent_id ?? null))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const from = siblings.findIndex((s) => s.id === item.id);
    const to = from + delta;
    if (to < 0 || to >= siblings.length) return;
    const next = [...siblings];
    next.splice(to, 0, next.splice(from, 1)[0]);
    await persistOrder(next);
  };

  const parentLabel = (item: MenuItem) => {
    const p = item.parent_id ? rows.find((r) => r.id === item.parent_id) : undefined;
    return p ? p.label : "Top level";
  };

  const previewTree = treeFor(location);
  const text = (n: MenuNode) => (previewLang === "bn" ? n.label_bn || n.label : n.label);

  const renderPreview = (nodes: MenuNode[], depth = 0) => (
    <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1 border-l border-border pl-3"}>
      {nodes.map((n) => {
        const isThisPage = (n.href ?? "").trim() === path.trim();
        const hidden = n.is_published === false;
        return (
          <li key={n.id}>
            <div
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${
                isThisPage ? "bg-primary/10 font-semibold text-primary" : "text-foreground"
              } ${hidden ? "opacity-40 line-through" : ""}`}
            >
              {depth > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
              <span className="truncate">{text(n)}</span>
              {(n.visible_to ?? "all") !== "all" && (
                <span className="ml-auto rounded bg-secondary px-1 text-[10px] uppercase text-muted-foreground">
                  {n.visible_to}
                </span>
              )}
            </div>
            {n.children.length > 0 && renderPreview(n.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {err && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {err}
          </p>
        )}
        {msg && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{msg}</p>}

        {/* existing links */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">
            In navigation <span className="font-normal text-muted-foreground">· নেভিগেশনে</span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Menu entries pointing to <code className="font-mono">{path}</code>.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : linked.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              This page is not in any menu yet — এই পেইজটি এখনো কোনো মেনুতে নেই। Use the form below to add it as a
              menu or submenu item.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {linked.map((item) => {
                const depth = item.depth ?? 0;
                const options = flatten(treeFor(item.location as Location)).filter(
                  (o) => o.depth < MAX_DEPTH && o.node.id !== item.id,
                );
                return (
                  <li key={item.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {item.location}
                      </span>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {depth === 0 ? "Menu" : depth === 1 ? "Sub" : "Sub·2"}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        <CornerDownRight className="mr-1 inline h-3 w-3" />
                        {parentLabel(item)}
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeEntry(item)}
                        disabled={busy}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className={labelCls}>Parent · প্যারেন্ট</span>
                        <select
                          className={inputCls}
                          value={item.parent_id ?? ""}
                          onChange={(e) => {
                            const pid = e.target.value || null;
                            const problem = parentChangeError(item, pid);
                            if (problem) {
                              setErr(problem);
                              setMsg(null);
                              return;
                            }
                            const p = pid ? rows.find((r) => r.id === pid) : undefined;
                            void updateEntry(item, {
                              parent_id: pid,
                              depth: p ? (p.depth ?? 0) + 1 : 0,
                            });
                          }}
                        >
                          <option value="">Top level · টপ লেভেল</option>
                          {options.map((o) => (
                            <option key={o.node.id} value={o.node.id}>
                              {"— ".repeat(o.depth)}
                              {o.node.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelCls}>Visibility · ভিজিবিলিটি</span>
                        <select
                          className={inputCls}
                          value={item.is_published === false ? "hidden" : "visible"}
                          onChange={(e) =>
                            void updateEntry(item, { is_published: e.target.value === "visible" })
                          }
                        >
                          <option value="visible">Visible · দৃশ্যমান</option>
                          <option value="hidden">Hidden · লুকানো</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelCls}>Who can see · কারা দেখবে</span>
                        <select
                          className={inputCls}
                          value={(item.visible_to ?? "all") as string}
                          onChange={(e) =>
                            void updateEntry(
                              item,
                              { visible_to: e.target.value as MenuVisibility },
                              "Visibility rule updated · রুল আপডেট হয়েছে",
                            )
                          }
                        >
                          {VISIBILITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* reorder */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">
            Reorder menu &amp; submenus{" "}
            <span className="font-normal text-muted-foreground">· ড্র্যাগ করে ক্রম বদলান</span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag an item onto one of its siblings to change the order. Keyboard: use the ↑ / ↓ buttons.
          </p>

          <ul className="mt-4 space-y-1" role="list">
            {flatten(previewTree).map(({ node, depth }) => {
              const isThisPage = (node.href ?? "").trim() === path.trim();
              return (
                <li
                  key={node.id}
                  draggable={!busy}
                  onDragStart={() => setDragId(node.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) void reorder(dragId, node.id);
                    setDragId(null);
                  }}
                  onDragEnd={() => setDragId(null)}
                  style={{ marginInlineStart: depth * 18 }}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${
                    dragId === node.id ? "border-primary bg-primary/5" : "border-border bg-background"
                  } ${isThisPage ? "font-semibold text-primary" : ""}`}
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" aria-hidden />
                  <span className="truncate">{node.label}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${node.label} up`}
                      disabled={busy}
                      onClick={() => void moveBy(node, -1)}
                      className="rounded border border-border px-1.5 text-xs disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${node.label} down`}
                      disabled={busy}
                      onClick={() => void moveBy(node, 1)}
                      className="rounded border border-border px-1.5 text-xs disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* add form */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">
            Add to menu / submenu{" "}
            <span className="font-normal text-muted-foreground">· মেনু বা সাবমেনুতে যোগ করুন</span>
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Menu location · অবস্থান</span>
              <select
                className={inputCls}
                value={location}
                onChange={(e) => setLocation(e.target.value as Location)}
              >
                <option value="header">Header · হেডার</option>
                <option value="footer">Footer · ফুটার</option>
              </select>
            </label>

            <label className="block">
              <span className={labelCls}>Place under · কার নিচে</span>
              <select className={inputCls} value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">Top level menu · টপ লেভেল</option>
                {parentOptions.map((o) => (
                  <option key={o.node.id} value={o.node.id}>
                    {"— ".repeat(o.depth)}
                    {o.node.label} {o.depth === 0 ? "(submenu)" : "(sub-submenu)"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelCls}>Label (EN)</span>
              <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} />
            </label>
            <label className="block">
              <span className={labelCls}>লেবেল (BN)</span>
              <input className={inputCls} value={labelBn} onChange={(e) => setLabelBn(e.target.value)} />
            </label>

            <label className="block">
              <span className={labelCls}>Who can see · কারা দেখবে</span>
              <select
                className={inputCls}
                value={visibleTo}
                onChange={(e) => setVisibleTo(e.target.value as MenuVisibility)}
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Link · লিংক: <code className="font-mono">{path}</code>
          </p>

          {addError && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {addError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void addToMenu()}
            disabled={busy || !!addError}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {parentId ? "Add as submenu" : "Add to menu"}
          </button>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Save className="h-3.5 w-3.5" /> Menu changes apply to the live site immediately.
          </p>
        </div>
      </div>

      {/* live preview */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              Live preview <span className="font-normal text-muted-foreground">· লাইভ প্রিভিউ</span>
            </h3>
            <div className="ml-auto flex rounded-lg border border-border p-0.5">
              {(["en", "bn"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setPreviewLang(l)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${
                    previewLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {location === "header" ? "Header menu · হেডার" : "Footer menu · ফুটার"} — this page is highlighted.
          </p>

          <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-border bg-background p-3">
            {previewTree.length === 0 ? (
              <p className="text-xs text-muted-foreground">No items yet · কোনো আইটেম নেই</p>
            ) : (
              renderPreview(previewTree)
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
