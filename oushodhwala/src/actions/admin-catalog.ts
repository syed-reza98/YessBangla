"use server";

import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  products,
  categories,
  offers,
  doctors,
  labTests,
  doctorBlackouts,
  appSettings,
  profiles,
} from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/session-authz";
import {
  productToLegacy,
  categoryToLegacy,
  doctorToLegacy,
  labTestToLegacy,
  offerToLegacy,
  legacyProductToValues,
} from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
}

async function slugMap() {
  const rows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  return new Map(rows.map((r) => [r.id, r.slug]));
}

export async function listAdminProductsAction() {
  try {
    await requireStaff();
    const [rows, map] = await Promise.all([
      db.select().from(products).orderBy(asc(products.name)),
      slugMap(),
    ]);
    return {
      ok: true as const,
      data: rows.map((p) => productToLegacy(p, map.get(p.categoryId || "") || p.categoryId)),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertProductAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const values = legacyProductToValues(input);
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, values.id))
      .limit(1);
    if (existing.length) {
      const { id, ...rest } = values;
      await db.update(products).set(rest).where(eq(products.id, id));
    } else {
      await db.insert(products).values(values);
    }
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true as const, id: values.id };
  } catch (err) {
    return fail(err);
  }
}

export async function setProductActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(products).set({ isActive: active }).where(eq(products.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function updateProductStockAction(
  id: string,
  stock: number,
  lowStockThreshold?: number
) {
  try {
    await requireStaff();
    const patch: { stock: number; minStockAlert?: number } = {
      stock: Math.max(0, Number(stock) || 0),
    };
    if (lowStockThreshold !== undefined) {
      patch.minStockAlert = Math.max(0, Number(lowStockThreshold) || 0);
    }
    await db.update(products).set(patch).where(eq(products.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function updateProductImagesAction(
  productId: string,
  patch: { image_url?: string; medicine_image_url?: string }
) {
  try {
    await requireStaff();
    const url = patch.image_url || patch.medicine_image_url;
    if (url !== undefined) {
      await db.update(products).set({ imageUrl: url || null }).where(eq(products.id, productId));
    }
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function countActiveProductsAction(filters?: {
  hasImage?: boolean;
  missingImage?: boolean;
}) {
  try {
    await requireStaff();
    const conditions = [eq(products.isActive, true)];
    if (filters?.hasImage) {
      conditions.push(sql`${products.imageUrl} IS NOT NULL AND ${products.imageUrl} != ''`);
    }
    if (filters?.missingImage) {
      conditions.push(sql`(${products.imageUrl} IS NULL OR ${products.imageUrl} = '')`);
    }
    const [row] = await db
      .select({ c: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    return { ok: true as const, count: Number(row?.c ?? 0) };
  } catch (err) {
    return fail(err);
  }
}

export async function searchProductsLiteAction(q: string, limit = 10) {
  try {
    await requireStaff();
    const pat = `%${q.trim()}%`;
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
      })
      .from(products)
      .where(and(eq(products.isActive, true), like(products.name, pat)))
      .limit(limit);
    return { ok: true as const, data: rows };
  } catch (err) {
    return fail(err);
  }
}

export async function adminGlobalSearchAction(q: string) {
  try {
    await requireStaff();
    const likePat = `%${q.trim()}%`;
    const [prods, profs] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          en: products.name,
          stock: products.stock,
        })
        .from(products)
        .where(
          or(like(products.name, likePat), like(products.genericName, likePat), like(products.manufacturer, likePat))
        )
        .limit(5),
      db
        .select({
          id: profiles.id,
          name: profiles.fullName,
          phone: profiles.phone,
        })
        .from(profiles)
        .where(or(like(profiles.fullName, likePat), like(profiles.phone, likePat)))
        .limit(5),
    ]);
    return {
      ok: true as const,
      products: prods,
      profiles: profs.map((p) => ({ id: p.id, name: p.name ?? "", phone: p.phone ?? "" })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- categories ---------------- */

export async function listCategoriesAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return { ok: true as const, data: rows.map(categoryToLegacy) };
  } catch (err) {
    return fail(err);
  }
}

export async function listCategorySlugsAction() {
  try {
    await requireStaff();
    const rows = await db
      .select({ slug: categories.slug, bn: categories.name })
      .from(categories)
      .orderBy(asc(categories.sortOrder));
    return { ok: true as const, data: rows.map((r) => ({ slug: r.slug, bn: r.bn })) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertCategoryAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const slug = String(input.slug || "").trim();
    if (!slug) return { ok: false as const, error: "slug required" };
    const name = String(input.bn || input.name || input.en || slug).slice(0, 150);
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing.length) {
      await db
        .update(categories)
        .set({
          name,
          icon: String(input.emoji || input.icon || "") || null,
          sortOrder: Number(input.sort_order) || 0,
          isActive: true,
        })
        .where(eq(categories.slug, slug));
    } else {
      await db.insert(categories).values({
        id: crypto.randomUUID(),
        slug,
        name,
        icon: String(input.emoji || input.icon || "") || null,
        sortOrder: Number(input.sort_order) || 0,
        isActive: true,
      });
    }
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function setCategoryActiveAction(slug: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(categories).set({ isActive: active }).where(eq(categories.slug, slug));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- offers ---------------- */

export async function listOffersAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(offers).orderBy(desc(offers.createdAt));
    return { ok: true as const, data: rows.map(offerToLegacy) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertOfferAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const code = String(input.code || "").trim().toUpperCase();
    if (!code) return { ok: false as const, error: "code required" };
    const existing = await db.select().from(offers).where(eq(offers.code, code)).limit(1);
    const values = {
      code,
      title: String(input.title || code).slice(0, 255),
      subtitle: String(input.subtitle || "") || null,
      discountPct: Number(input.discount_pct || 0).toFixed(2),
      maxDiscount: input.max_discount != null ? Number(input.max_discount).toFixed(2) : null,
      minOrder: Number(input.min_order || 0).toFixed(2),
      isActive: true,
    };
    if (existing.length) {
      await db.update(offers).set(values).where(eq(offers.code, code));
    } else {
      await db.insert(offers).values({ id: crypto.randomUUID(), ...values });
    }
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function setOfferActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(offers).set({ isActive: active }).where(eq(offers.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- doctors ---------------- */

export async function listDoctorsAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(doctors).orderBy(asc(doctors.name));
    return { ok: true as const, data: rows.map(doctorToLegacy) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertDoctorAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      name: String(input.name || "").slice(0, 150),
      specialty: String(input.spec || input.specialty || "").slice(0, 150),
      degrees: String(input.degree || input.degrees || "") || null,
      hospital: String(input.exp || input.hospital || "") || null,
      consultationFee: Number(input.fee || input.consultation_fee || 0).toFixed(2),
      availableDays: (input.work_days as number[] | undefined) ?? [0, 1, 2, 3, 4, 5, 6],
      imageUrl: String(input.photo_url || input.image_url || "") || null,
      isActive: input.active === undefined ? true : !!input.active,
    };
    const existing = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.id, id)).limit(1);
    if (existing.length) {
      await db.update(doctors).set(values).where(eq(doctors.id, id));
    } else {
      await db.insert(doctors).values({ id, ...values });
    }
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function setDoctorActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(doctors).set({ isActive: active }).where(eq(doctors.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listDoctorBlackoutsAction(doctorId: string) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(doctorBlackouts)
      .where(eq(doctorBlackouts.doctorId, doctorId))
      .orderBy(asc(doctorBlackouts.day));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        doctor_id: r.doctorId,
        day: r.day,
        reason: r.reason,
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function getDoctorBlackoutDaysAction(doctorId: string) {
  const rows = await db
    .select({ day: doctorBlackouts.day, reason: doctorBlackouts.reason })
    .from(doctorBlackouts)
    .where(eq(doctorBlackouts.doctorId, doctorId));
  return rows.map((r) => ({ day: r.day, reason: r.reason }));
}

export async function addDoctorBlackoutAction(doctorId: string, day: string, reason: string) {
  try {
    await requireStaff();
    await db.insert(doctorBlackouts).values({
      id: crypto.randomUUID(),
      doctorId,
      day,
      reason: reason.trim() || null,
    });
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteDoctorBlackoutAction(id: string) {
  try {
    await requireStaff();
    await db.delete(doctorBlackouts).where(eq(doctorBlackouts.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- lab tests ---------------- */

export async function listLabTestsAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(labTests).orderBy(asc(labTests.name));
    return { ok: true as const, data: rows.map(labTestToLegacy) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertLabTestAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      name: String(input.bn || input.en || input.name || "").slice(0, 255),
      category: String(input.grp || input.group || input.category || "general").slice(0, 100),
      price: Number(input.price || 0).toFixed(2),
      turnaroundTime: String(input.prep || input.turnaround_time || "24 hours"),
      description: String(input.description || "") || null,
      isActive: input.active === undefined ? true : !!input.active,
    };
    const existing = await db.select({ id: labTests.id }).from(labTests).where(eq(labTests.id, id)).limit(1);
    if (existing.length) {
      await db.update(labTests).set(values).where(eq(labTests.id, id));
    } else {
      await db.insert(labTests).values({ id, ...values });
    }
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function setLabTestActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(labTests).set({ isActive: active }).where(eq(labTests.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- settings ---------------- */

export async function listAppSettingsAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(appSettings).orderBy(asc(appSettings.key));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        label: r.label,
        updated_at: r.updatedAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function updateAppSettingAction(key: string, value: string) {
  try {
    await requireStaff();
    await db.update(appSettings).set({ value }).where(eq(appSettings.key, key));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}
