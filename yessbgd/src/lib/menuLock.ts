// Header menu ordering lock + structural validation.
//
// The public header is CMS-driven, which historically let stray/test items
// (e.g. a "New submenu" under Home) and re-ordered rows drift into production.
// This module defines the canonical header structure, validates a CMS menu
// against it, and can enforce it at render time when the lock is enabled.

import type { MenuItem, MenuNode } from "@/lib/siteContent";

export const MENU_LOCK_SETTING_KEY = "header_menu_lock";

/** Canonical top-level header order (by href). */
export const CANONICAL_HEADER_ORDER = [
  "/",
  "/about",
  "/services",
  "/ventures",
  "/industries",
  "/insights",
  "/careers",
  "/contact",
] as const;

/** Top-level items that must never grow a submenu (they own bespoke UI). */
export const NO_SUBMENU_HREFS = new Set<string>(["/", "/ventures"]);

export type MenuLockValue = {
  locked: boolean;
  order: string[];
  /** Drop root items that are not part of the locked order. */
  strict?: boolean;
};

export const DEFAULT_MENU_LOCK: MenuLockValue = {
  locked: true,
  order: [...CANONICAL_HEADER_ORDER],
  strict: true,
};

export function readMenuLock(value: unknown): MenuLockValue {
  if (!value || typeof value !== "object") return DEFAULT_MENU_LOCK;
  const v = value as Partial<MenuLockValue>;
  const order = Array.isArray(v.order) && v.order.length ? v.order.map(String) : [...CANONICAL_HEADER_ORDER];
  return { locked: v.locked !== false, order, strict: v.strict !== false };
}

const norm = (href: string | null | undefined) => {
  const h = (href ?? "").trim();
  if (!h) return "";
  return h.length > 1 && h.endsWith("/") ? h.slice(0, -1) : h;
};

/**
 * Enforce the locked order on a header tree:
 * - root items are sorted by the locked order,
 * - unknown roots are dropped when `strict`,
 * - submenus under protected roots (Home, Ventures) are removed.
 */
export function applyHeaderLock(tree: MenuNode[], lock: MenuLockValue): MenuNode[] {
  if (!lock.locked) return tree;
  const index = new Map(lock.order.map((h, i) => [norm(h), i]));

  const kept = tree.filter((n) => (lock.strict === false ? true : index.has(norm(n.href))));
  const sorted = [...kept].sort((a, b) => {
    const ai = index.get(norm(a.href)) ?? Number.MAX_SAFE_INTEGER;
    const bi = index.get(norm(b.href)) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return sorted.map((n) => (NO_SUBMENU_HREFS.has(norm(n.href)) ? { ...n, children: [] } : n));
}

/* ------------------------------- validation ------------------------------- */

export type MenuIssue = {
  level: "error" | "warning";
  message: string;
  messageBn: string;
  itemId?: string;
};

/** Validate a flat header menu list against the canonical structure. */
export function validateHeaderMenu(items: MenuItem[], lock: MenuLockValue = DEFAULT_MENU_LOCK): MenuIssue[] {
  const issues: MenuIssue[] = [];
  const header = items.filter((i) => i.location === "header");
  const byId = new Map(header.map((i) => [i.id, i]));
  const roots = header.filter((i) => !i.parent_id || !byId.has(i.parent_id));

  // 1. Unknown / stray root items.
  const allowed = new Set(lock.order.map(norm));
  for (const r of roots) {
    if (!allowed.has(norm(r.href))) {
      issues.push({
        level: "error",
        itemId: r.id,
        message: `“${r.label}” (${r.href || "no link"}) is not part of the locked header structure.`,
        messageBn: `“${r.label}” লক করা হেডার কাঠামোর অংশ নয়।`,
      });
    }
  }

  // 2. Submenus under protected roots.
  for (const r of roots) {
    if (!NO_SUBMENU_HREFS.has(norm(r.href))) continue;
    const kids = header.filter((i) => i.parent_id === r.id);
    if (kids.length) {
      issues.push({
        level: "error",
        itemId: r.id,
        message: `“${r.label}” must not have submenu items (${kids.map((k) => k.label).join(", ")}).`,
        messageBn: `“${r.label}” এর নিচে সাবমেনু থাকা যাবে না।`,
      });
    }
  }

  // 3. Duplicate links.
  const seen = new Map<string, string>();
  for (const r of roots) {
    const key = norm(r.href);
    if (!key) continue;
    if (seen.has(key)) {
      issues.push({
        level: "warning",
        itemId: r.id,
        message: `Duplicate top-level link ${key} (“${seen.get(key)}” and “${r.label}”).`,
        messageBn: `একই লিংক দুইবার আছে: ${key}।`,
      });
    } else seen.set(key, r.label);
  }

  // 4. Order drift.
  const current = roots
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => norm(r.href))
    .filter((h) => allowed.has(h));
  const expected = lock.order.map(norm).filter((h) => current.includes(h));
  if (current.join("|") !== expected.join("|")) {
    issues.push({
      level: lock.locked ? "warning" : "error",
      message: `Header order drifted. Expected: ${expected.join(" → ")}. Found: ${current.join(" → ")}.`,
      messageBn: "হেডার মেনুর ক্রম বদলে গেছে — লক করা ক্রমে ফিরিয়ে আনুন।",
    });
  }

  // 5. Missing canonical entries.
  for (const href of lock.order.map(norm)) {
    if (!roots.some((r) => norm(r.href) === href)) {
      issues.push({
        level: "warning",
        message: `Canonical header item ${href} is missing.`,
        messageBn: `হেডারের নির্ধারিত আইটেম ${href} নেই।`,
      });
    }
  }

  return issues;
}

/** Re-number sort_order of header roots to match the locked order. */
export function normalizeHeaderOrder(items: MenuItem[], lock: MenuLockValue = DEFAULT_MENU_LOCK): MenuItem[] {
  const index = new Map(lock.order.map((h, i) => [norm(h), i]));
  const byId = new Map(items.map((i) => [i.id, i]));
  return items.map((i) => {
    if (i.location !== "header") return i;
    if (i.parent_id && byId.has(i.parent_id)) return i;
    const at = index.get(norm(i.href));
    return at === undefined ? i : { ...i, sort_order: at + 1 };
  });
}
