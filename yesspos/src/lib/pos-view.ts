/**
 * Per-user POS view preferences (category, sort order, tile size).
 */
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type TileSize = "small" | "medium" | "large";
export type SortOrder = "name" | "price-asc" | "price-desc" | "stock-desc";

export type PosView = {
  cat: string;
  sort: SortOrder;
  tile: TileSize;
};

export const DEFAULT_POS_VIEW: PosView = { cat: "all", sort: "name", tile: "medium" };

/** Minimum tile width per size — feeds the auto-fit grid so tiles never collapse. */
export const TILE_MIN_WIDTH: Record<TileSize, number> = {
  small: 150,
  medium: 200,
  large: 260,
};

/** Image height per tile size (px). */
export const TILE_IMAGE_HEIGHT: Record<TileSize, number> = {
  small: 96,
  medium: 132,
  large: 176,
};

/** Sort catalog rows for the POS grid. */
export function sortProducts<
  T extends { name_en?: string | null; name?: string | null; price?: number | null; stock?: number | null },
>(rows: T[], sort: SortOrder): T[] {
  const out = [...rows];
  out.sort((a, b) => {
    switch (sort) {
      case "name": {
        const an = (a.name_en || a.name || "").toString();
        const bn = (b.name_en || b.name || "").toString();
        return an.localeCompare(bn, undefined, { sensitivity: "base" });
      }
      case "price-asc":
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      case "price-desc":
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      case "stock-desc":
        return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      default: {
        const _exhaustive: never = sort;
        return _exhaustive;
      }
    }
  });
  return out;
}

const PREFIX = "sokoler-pos-view";

function keyFor(userId: string | null) {
  return `${PREFIX}:${userId ?? "anon"}`;
}

function read(userId: string | null): PosView {
  if (typeof localStorage === "undefined") return DEFAULT_POS_VIEW;
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULT_POS_VIEW;
    const parsed = JSON.parse(raw) as Partial<PosView>;
    return {
      cat: typeof parsed.cat === "string" ? parsed.cat : DEFAULT_POS_VIEW.cat,
      sort: (["name", "price-asc", "price-desc", "stock-desc"] as SortOrder[]).includes(
        parsed.sort as SortOrder,
      )
        ? (parsed.sort as SortOrder)
        : DEFAULT_POS_VIEW.sort,
      tile: (["small", "medium", "large"] as TileSize[]).includes(parsed.tile as TileSize)
        ? (parsed.tile as TileSize)
        : DEFAULT_POS_VIEW.tile,
    };
  } catch {
    return DEFAULT_POS_VIEW;
  }
}

export function usePosView() {
  const session = useSession();
  const userId =
    (session?.data?.user as { id?: string } | undefined)?.id ?? null;
  const [view, setView] = useState<PosView>(DEFAULT_POS_VIEW);

  useEffect(() => {
    setView(read(userId));
  }, [userId]);

  const update = useCallback(
    (patch: Partial<PosView>) => {
      setView((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(keyFor(userId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [userId],
  );

  return { view, update, userId };
}
