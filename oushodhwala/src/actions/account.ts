"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  products,
  userFavorites,
  userRecentMedicines,
  notifications,
} from "@/db/schema";
import { requireAuth, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function mapProduct(p: typeof products.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    en: p.name,
    brand: p.manufacturer,
    generic: p.genericName,
    strength: p.strength,
    form: p.dosageForm,
    price: Number(p.unitPrice),
    mrp: Number(p.mrp ?? 0),
    stock: p.stock,
    rx: p.requiresPrescription,
    image_url: p.imageUrl,
    manufacturer: p.manufacturer,
    indications: p.description,
  };
}

export async function getUserMedicinesAction(): Promise<
  ActionResult<{ favorites: unknown[]; recent: unknown[] }>
> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const favs = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId))
      .orderBy(userFavorites.sortOrder);
    const recent = await db
      .select()
      .from(userRecentMedicines)
      .where(eq(userRecentMedicines.userId, userId))
      .orderBy(desc(userRecentMedicines.lastViewedAt))
      .limit(20);

    const ids = [
      ...new Set([
        ...favs.map((f) => f.productId),
        ...recent.map((r) => r.productId),
      ]),
    ];
    const productRows =
      ids.length > 0
        ? await db.select().from(products).where(inArray(products.id, ids))
        : [];
    const byId = new Map(productRows.map((p) => [p.id, p]));

    return {
      ok: true,
      favorites: favs
        .map((f) => {
          const p = byId.get(f.productId);
          if (!p) return null;
          return {
            ...mapProduct(p),
            reminder_config: f.reminderConfig,
            sort_order: f.sortOrder,
          };
        })
        .filter(Boolean),
      recent: recent
        .map((r) => {
          const p = byId.get(r.productId);
          return p ? mapProduct(p) : null;
        })
        .filter(Boolean),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Load failed",
      status: 500,
    };
  }
}

export async function toggleFavoriteAction(input: {
  productId: string;
}): Promise<ActionResult<{ favorited: boolean }>> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.productId, input.productId)
        )
      )
      .limit(1);
    if (existing) {
      await db.delete(userFavorites).where(eq(userFavorites.id, existing.id));
      revalidatePath("/account/medicines");
      return { ok: true, favorited: false };
    }
    await db.insert(userFavorites).values({
      id: crypto.randomUUID(),
      userId,
      productId: input.productId,
    });
    revalidatePath("/account/medicines");
    return { ok: true, favorited: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Toggle failed",
      status: 500,
    };
  }
}

export async function addRecentMedicineAction(input: {
  productId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const [existing] = await db
      .select()
      .from(userRecentMedicines)
      .where(
        and(
          eq(userRecentMedicines.userId, userId),
          eq(userRecentMedicines.productId, input.productId)
        )
      )
      .limit(1);
    if (existing) {
      await db
        .update(userRecentMedicines)
        .set({ lastViewedAt: new Date() })
        .where(eq(userRecentMedicines.id, existing.id));
    } else {
      await db.insert(userRecentMedicines).values({
        id: crypto.randomUUID(),
        userId,
        productId: input.productId,
      });
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Recent failed",
      status: 500,
    };
  }
}

export async function listNotificationsAction(): Promise<
  ActionResult<{ notifications: unknown[] }>
> {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user!.id!))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return {
      ok: true,
      notifications: rows.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        is_read: n.isRead,
        created_at: n.createdAt,
      })),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function markNotificationReadAction(input: {
  id?: string;
  all?: boolean;
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    if (input.all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } else if (input.id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(eq(notifications.id, input.id), eq(notifications.userId, userId))
        );
    }
    revalidatePath("/notifications");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
      status: 500,
    };
  }
}

export async function removeFavoritesAction(input: {
  productIds: string[];
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    if (input.productIds.length === 0) return { ok: true };
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, session.user!.id!),
          inArray(userFavorites.productId, input.productIds)
        )
      );
    revalidatePath("/account/medicines");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Remove failed",
      status: 500,
    };
  }
}

export async function removeRecentMedicinesAction(input: {
  productIds: string[];
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    if (input.productIds.length === 0) return { ok: true };
    await db
      .delete(userRecentMedicines)
      .where(
        and(
          eq(userRecentMedicines.userId, session.user!.id!),
          inArray(userRecentMedicines.productId, input.productIds)
        )
      );
    revalidatePath("/account/medicines");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Remove failed",
      status: 500,
    };
  }
}
