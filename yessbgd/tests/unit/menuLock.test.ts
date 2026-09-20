import { describe, expect, it } from "bun:test";
import {
  CANONICAL_HEADER_ORDER,
  DEFAULT_MENU_LOCK,
  applyHeaderLock,
  normalizeHeaderOrder,
  validateHeaderMenu,
} from "../../src/lib/menuLock";
import { buildMenuTree, type MenuItem } from "../../src/lib/siteContent";

const item = (over: Partial<MenuItem>): MenuItem => ({
  id: over.href ?? "x",
  location: "header",
  label: over.label ?? "Item",
  label_bn: null,
  href: "/",
  group_label: null,
  sort_order: 0,
  is_external: false,
  ...over,
});

const canonicalRows = CANONICAL_HEADER_ORDER.map((href, i) =>
  item({ id: href, href, label: href, sort_order: i + 1 }),
);

describe("header menu lock", () => {
  it("keeps the canonical order even when sort_order drifts", () => {
    const drifted = canonicalRows.map((r) => ({ ...r, sort_order: 100 - (r.sort_order ?? 0) }));
    const tree = applyHeaderLock(buildMenuTree(drifted), DEFAULT_MENU_LOCK);
    expect(tree.map((n) => n.href)).toEqual([...CANONICAL_HEADER_ORDER]);
  });

  it("drops stray root items and submenus under protected roots", () => {
    const stray = item({ id: "stray", href: "/stray", label: "New submenu", sort_order: 2 });
    const homeChild = item({ id: "kid", href: "/kid", label: "New submenu", parent_id: "/" });
    const tree = applyHeaderLock(buildMenuTree([...canonicalRows, stray, homeChild]), DEFAULT_MENU_LOCK);
    expect(tree.some((n) => n.href === "/stray")).toBe(false);
    expect(tree.find((n) => n.href === "/")!.children).toHaveLength(0);
  });

  it("reports validation issues for strays, protected submenus and drift", () => {
    const rows = [
      ...canonicalRows,
      item({ id: "stray", href: "/stray", label: "New submenu", sort_order: 9 }),
      item({ id: "kid", href: "/kid", label: "Child", parent_id: "/" }),
    ];
    const issues = validateHeaderMenu(rows);
    expect(issues.some((i) => i.message.includes("/stray"))).toBe(true);
    expect(issues.some((i) => /must not have submenu/.test(i.message))).toBe(true);
  });

  it("normalizes sort_order back to the locked order", () => {
    const shuffled = canonicalRows.map((r) => ({ ...r, sort_order: 0 }));
    const fixed = normalizeHeaderOrder(shuffled);
    expect(fixed.map((r) => r.sort_order)).toEqual(CANONICAL_HEADER_ORDER.map((_, i) => i + 1));
  });

  it("passes clean menus with no errors", () => {
    expect(validateHeaderMenu(canonicalRows).filter((i) => i.level === "error")).toHaveLength(0);
  });
});
