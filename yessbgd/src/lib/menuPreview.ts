// Live "preview before publish" channel for CMS menu edits.
//
// The admin Menus editor writes an unsaved draft into sessionStorage; the public
// site (opened in another tab) picks it up and renders the header from the draft
// instead of the published rows, with a dismissible preview banner.

import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/siteContent";

export const MENU_PREVIEW_KEY = "yess:menu-preview";
export const MENU_PREVIEW_EVENT = "yess:menu-preview-change";

export type MenuPreviewPayload = {
  items: MenuItem[];
  at: string;
  by?: string | null;
};

function read(): MenuPreviewPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(MENU_PREVIEW_KEY) ?? window.localStorage.getItem(MENU_PREVIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MenuPreviewPayload;
    return Array.isArray(parsed?.items) ? parsed : null;
  } catch {
    return null;
  }
}

/** Publish a draft to every open tab (localStorage powers cross-tab sync). */
export function setMenuPreview(items: MenuItem[], by?: string | null) {
  if (typeof window === "undefined") return;
  const payload: MenuPreviewPayload = { items, at: new Date().toISOString(), by };
  const raw = JSON.stringify(payload);
  window.localStorage.setItem(MENU_PREVIEW_KEY, raw);
  window.sessionStorage.setItem(MENU_PREVIEW_KEY, raw);
  window.dispatchEvent(new CustomEvent(MENU_PREVIEW_EVENT));
}

export function clearMenuPreview() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MENU_PREVIEW_KEY);
  window.sessionStorage.removeItem(MENU_PREVIEW_KEY);
  window.dispatchEvent(new CustomEvent(MENU_PREVIEW_EVENT));
}

/** Read the current draft (null when not previewing). SSR-safe. */
export function useMenuPreview(): MenuPreviewPayload | null {
  const [payload, setPayload] = useState<MenuPreviewPayload | null>(null);

  useEffect(() => {
    const sync = () => setPayload(read());
    sync();
    window.addEventListener(MENU_PREVIEW_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MENU_PREVIEW_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return payload;
}
