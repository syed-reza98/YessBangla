// @ts-nocheck
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  products,
  userFavorites,
  userRecentMedicines,
} from "@/db/schema";
import type { MedSuggestion } from "./rx-suggest.server";

const productSelect = {
  id: products.id,
  name: products.name,
  manufacturer: products.manufacturer,
  genericName: products.genericName,
  strength: products.strength,
  dosageForm: products.dosageForm,
  unitPrice: products.unitPrice,
  mrp: products.mrp,
  stock: products.stock,
  requiresPrescription: products.requiresPrescription,
  imageUrl: products.imageUrl,
  description: products.description,
};

function mapProduct(
  p: typeof products.$inferSelect,
  extra?: Record<string, unknown>
): MedSuggestion {
  return {
    id: p.id,
    name: p.name,
    en: p.name,
    brand: p.manufacturer ?? "",
    generic: p.genericName ?? "",
    strength: p.strength ?? "",
    form: p.dosageForm ?? "",
    pack: "",
    price: Number(p.unitPrice),
    mrp: Number(p.mrp ?? 0),
    stock: p.stock,
    rx: p.requiresPrescription,
    emoji: "",
    image_url: p.imageUrl ?? "",
    medicine_image_url: p.imageUrl ?? "",
    manufacturer: p.manufacturer ?? "",
    indications: p.description ?? "",
    indications_en: "",
    dosage: "",
    dosage_en: "",
    side_effects: "",
    side_effects_en: "",
    therapeutic_class: "",
    therapeutic_class_en: "",
    precautions: "",
    precautions_en: "",
    contraindications: "",
    contraindications_en: "",
    pregnancy: "",
    pregnancy_en: "",
    ...extra,
  } as MedSuggestion;
}

export async function getFavorites(userId: string): Promise<MedSuggestion[]> {
  const favs = await db
    .select()
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId))
    .orderBy(userFavorites.sortOrder);
  if (favs.length === 0) return [];
  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        favs.map((f) => f.productId)
      )
    );
  const byId = new Map(rows.map((p) => [p.id, p]));
  return favs
    .map((f) => {
      const p = byId.get(f.productId);
      if (!p) return null;
      return mapProduct(p, {
        reminder_config: f.reminderConfig,
        sort_order: f.sortOrder,
      });
    })
    .filter(Boolean) as MedSuggestion[];
}

export async function getRecent(userId: string): Promise<MedSuggestion[]> {
  const recent = await db
    .select()
    .from(userRecentMedicines)
    .where(eq(userRecentMedicines.userId, userId))
    .orderBy(desc(userRecentMedicines.lastViewedAt))
    .limit(20);
  if (recent.length === 0) return [];
  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        recent.map((r) => r.productId)
      )
    );
  const byId = new Map(rows.map((p) => [p.id, p]));
  return recent
    .map((r) => {
      const p = byId.get(r.productId);
      return p ? mapProduct(p) : null;
    })
    .filter(Boolean) as MedSuggestion[];
}

export async function syncMedicines(
  userId: string,
  localFavIds: string[],
  localRecentIds: string[]
) {
  const existingFavs = await db
    .select({ productId: userFavorites.productId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));
  const existingIds = new Set(existingFavs.map((e) => e.productId));
  const toAddFavs = localFavIds.filter((id) => !existingIds.has(id));
  for (const productId of toAddFavs) {
    await db.insert(userFavorites).values({
      id: crypto.randomUUID(),
      userId,
      productId,
    });
  }
  for (const productId of localRecentIds) {
    const [existing] = await db
      .select()
      .from(userRecentMedicines)
      .where(
        and(
          eq(userRecentMedicines.userId, userId),
          eq(userRecentMedicines.productId, productId)
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
        productId,
      });
    }
  }
  return { favorites: await getFavorites(userId), recent: await getRecent(userId) };
}

export async function toggleFavorite(userId: string, productId: string) {
  const [existing] = await db
    .select()
    .from(userFavorites)
    .where(
      and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId))
    )
    .limit(1);
  if (existing) {
    await db.delete(userFavorites).where(eq(userFavorites.id, existing.id));
    return { favorite: false };
  }
  await db.insert(userFavorites).values({
    id: crypto.randomUUID(),
    userId,
    productId,
  });
  return { favorite: true };
}

export async function updateReminder(
  userId: string,
  productId: string,
  config: unknown
) {
  await db
    .update(userFavorites)
    .set({ reminderConfig: config })
    .where(
      and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId))
    );
}

export async function updateSortOrder(userId: string, productIds: string[]) {
  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    if (!productId) continue;
    await db
      .update(userFavorites)
      .set({ sortOrder: i })
      .where(
        and(eq(userFavorites.userId, userId), eq(userFavorites.productId, productId))
      );
  }
}

export async function getAuditLogs(_userId: string) {
  return [];
}

export async function addRecent(userId: string, productId: string) {
  const [existing] = await db
    .select()
    .from(userRecentMedicines)
    .where(
      and(
        eq(userRecentMedicines.userId, userId),
        eq(userRecentMedicines.productId, productId)
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
      productId,
    });
  }
}

export async function bulkRemoveFavorites(userId: string, productIds: string[]) {
  if (productIds.length === 0) return;
  await db
    .delete(userFavorites)
    .where(
      and(
        eq(userFavorites.userId, userId),
        inArray(userFavorites.productId, productIds)
      )
    );
}

export async function bulkRemoveRecent(userId: string, productIds: string[]) {
  if (productIds.length === 0) return;
  await db
    .delete(userRecentMedicines)
    .where(
      and(
        eq(userRecentMedicines.userId, userId),
        inArray(userRecentMedicines.productId, productIds)
      )
    );
}

export async function bulkUpdateStatus(
  _userId: string,
  _productIds: string[],
  _active: boolean
) {
  /* reminder active flag not in schema — no-op */
}

// silence unused select helper in case of tree-shaking
void productSelect;
