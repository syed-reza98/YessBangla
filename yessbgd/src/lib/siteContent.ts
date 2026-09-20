// Site-wide dynamic content: settings, page sections, menus and media.
import { useQuery } from "@tanstack/react-query";
import { uploadMediaAction, deleteMediaAction, listMediaAction } from "@/actions/media";
import {
  getViewerRoleAction,
  listMenuItemsAction,
  listPageSectionsAction,
  listSettingsAction,
} from "@/actions/cms";

const STALE = 60_000;

/* --------------------------------- settings -------------------------------- */

export type SettingRow = {
  id: string;
  key: string;
  label: string | null;
  group: string | null;
  value: Record<string, unknown> | null;
  sort_order: number | null;
};

export function useSettings() {
  const { data } = useQuery({
    queryKey: ["cms", "settings"],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listSettingsAction();
      if (!res.ok) throw new Error(res.error);
      return (res.rows ?? []) as SettingRow[];
    },
  });
  const map: Record<string, Record<string, unknown>> = {};
  for (const row of data ?? []) map[row.key] = (row.value ?? {}) as Record<string, unknown>;
  return { rows: data ?? [], map };
}

/** Read a single text setting (`{ "text": "..." }` shape) with fallback. */
export function useSettingText(key: string, fallback = ""): string {
  const { map } = useSettings();
  const v = map[key]?.text;
  return typeof v === "string" && v.trim() ? v : fallback;
}

export function useSettingObject(key: string): Record<string, unknown> {
  const { map } = useSettings();
  return map[key] ?? {};
}

/* ------------------------------- page sections ------------------------------ */

export type PageSection = {
  id: string;
  page: string;
  section_key: string;
  sort_order: number | null;
  title: string | null;
  title_bn: string | null;
  subtitle: string | null;
  subtitle_bn: string | null;
  body: string | null;
  body_bn: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  data: Record<string, unknown> | null;
  is_published: boolean | null;
};

export function usePageSections(page: string) {
  const { data } = useQuery({
    queryKey: ["cms", "pages", page],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listPageSectionsAction({ page, publishedOnly: true });
      if (!res.ok) throw new Error(res.error);
      return (res.rows ?? []) as PageSection[];
    },
  });
  const rows = data ?? [];
  const bySection = new Map(rows.map((r) => [r.section_key, r]));
  return {
    sections: rows,
    section: (key: string) => bySection.get(key),
  };
}

/* ----------------------------------- menus ---------------------------------- */

export type MenuVisibility = "all" | "guest" | "authenticated" | "admin";

export type MenuItem = {
  id: string;
  location: string;
  label: string;
  label_bn: string | null;
  href: string;
  group_label: string | null;
  sort_order: number | null;
  is_external: boolean | null;
  is_published?: boolean | null;
  parent_id?: string | null;
  depth?: number | null;
  icon?: string | null;
  description?: string | null;
  description_bn?: string | null;
  accent?: string | null;
  item_style?: string | null;
  badge?: string | null;
  badge_bn?: string | null;
  visible_to?: MenuVisibility | string | null;
};

export type MenuNode = MenuItem & { children: MenuNode[] };

/** Build a nested tree (unlimited depth) from a flat menu list. */
export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const map = new Map<string, MenuNode>();
  items.forEach((i) => map.set(i.id, { ...i, children: [] }));
  const roots: MenuNode[] = [];
  map.forEach((node) => {
    const parent = node.parent_id ? map.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (list: MenuNode[]) => {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/* ------------------------------- viewer role ------------------------------- */

export type ViewerRole = "guest" | "authenticated" | "admin";

/** Who is looking at the site right now (used for menu visibility rules). */
export function useViewerRole(): ViewerRole {
  const { data } = useQuery({
    queryKey: ["viewer", "role"],
    staleTime: STALE,
    queryFn: async (): Promise<ViewerRole> => {
      const res = await getViewerRoleAction();
      if (!res.ok) return "guest";
      return res.role;
    },
  });
  return data ?? "guest";
}

/** Does a menu item's visibility rule allow this viewer? */
export function canSeeMenuItem(item: MenuItem, role: ViewerRole): boolean {
  const rule = (item.visible_to ?? "all") as MenuVisibility;
  if (rule === "all") return true;
  if (rule === "guest") return role === "guest";
  if (rule === "authenticated") return role !== "guest";
  return role === "admin";
}

export function useMenu(location: "header" | "footer") {
  const role = useViewerRole();
  const { data } = useQuery({
    queryKey: ["cms", "menu", location],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listMenuItemsAction({ location, publishedOnly: true });
      if (!res.ok) throw new Error(res.error);
      return (res.rows ?? []) as MenuItem[];
    },
  });
  return (data ?? []).filter((i) => canSeeMenuItem(i, role));
}

/** Same as useMenu but nested by parent_id. */
export function useMenuTree(location: "header" | "footer") {
  const flat = useMenu(location);
  return buildMenuTree(flat);
}

/* ----------------------------------- media ---------------------------------- */

export type MediaRow = {
  id: string;
  file_name: string;
  url: string;
  path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  folder: string | null;
  created_at: string;
};

export const MEDIA_BUCKET = "media";

export async function signedMediaUrl(path: string): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/uploads/${path}`;
}

export function useMediaLibrary() {
  return useQuery({
    queryKey: ["cms", "media"],
    staleTime: 10_000,
    queryFn: async () => {
      const result = await listMediaAction();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}

/** Uploads a file to disk under public/uploads/media and records it in cms_media. */
export async function uploadMedia(file: File, folder = "general", alt = "") {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("folder", folder);
  fd.set("alt", alt);
  const result = await uploadMediaAction(fd);
  if (!result.ok) throw new Error(result.error);
  return { path: result.path!, url: result.url! };
}

export async function deleteMedia(row: MediaRow) {
  const result = await deleteMediaAction({ id: row.id, path: row.path });
  if (!result.ok) throw new Error(result.error);
}
