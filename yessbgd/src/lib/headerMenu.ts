// Composed header menu source: published CMS rows → role filter → draft preview
// override → canonical ordering lock. Every header surface uses this so desktop,
// tablet and mobile always render exactly the same structure.
import {
  buildMenuTree,
  canSeeMenuItem,
  useMenu,
  useSettings,
  useViewerRole,
  type MenuItem,
  type MenuNode,
} from "@/lib/siteContent";
import { useMenuPreview } from "@/lib/menuPreview";
import { MENU_LOCK_SETTING_KEY, applyHeaderLock, readMenuLock, type MenuLockValue } from "@/lib/menuLock";

export type HeaderMenu = {
  tree: MenuNode[];
  previewing: boolean;
  previewAt: string | null;
  lock: MenuLockValue;
};

export function useHeaderMenu(): HeaderMenu {
  const published = useMenu("header");
  const role = useViewerRole();
  const preview = useMenuPreview();
  const { map } = useSettings();
  const lock = readMenuLock(map[MENU_LOCK_SETTING_KEY]);

  const flat: MenuItem[] = preview
    ? preview.items.filter(
        (i) => i.location === "header" && i.is_published !== false && canSeeMenuItem(i, role),
      )
    : published;

  return {
    tree: applyHeaderLock(buildMenuTree(flat), lock),
    previewing: !!preview,
    previewAt: preview?.at ?? null,
    lock,
  };
}
