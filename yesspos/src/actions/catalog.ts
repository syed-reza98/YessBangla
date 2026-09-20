"use server";

import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  products,
  categories,
  brands,
  subcategories,
  productStock,
  productReviews,
  promotions,
} from "@/db/schema";
import { requireStaff, requireManager, AuthError } from "@/lib/authz";
import {
  productRow,
  categoryRow,
  brandRow,
  money,
  type Dict,
} from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listCategoriesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    const rows = await db.select().from(categories).orderBy(asc(categories.nameEn));
    return { ok: true, rows: rows.map((r) => categoryRow(r as never)) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function listBrandsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db.select().from(brands).orderBy(asc(brands.nameEn));
    return { ok: true, rows: rows.map((r) => brandRow(r as never)) };
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

export async function listSubcategoriesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db.select().from(subcategories);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        category_id: r.categoryId,
        name: r.name,
        slug: r.slug,
        is_active: r.isActive,
        created_at: r.createdAt,
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

export async function listProductsAction(input?: {
  categoryId?: string;
  activeOnly?: boolean;
  limit?: number;
  lowStock?: boolean;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    let q = db.select().from(products).$dynamic();
    const clauses = [];
    if (input?.categoryId) clauses.push(eq(products.categoryId, input.categoryId));
    if (input?.activeOnly) clauses.push(eq(products.isActive, true));
    if (input?.lowStock) clauses.push(sql`${products.stock} <= 5`);
    if (clauses.length) q = q.where(and(...clauses));
    q = q.orderBy(asc(products.nameEn));
    if (input?.limit) q = q.limit(input.limit);
    const rows = await q;
    return { ok: true, rows: rows.map((r) => productRow(r as never)) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function getProductAction(input: {
  id: string;
}): Promise<ActionResult<{ product: Dict | null }>> {
  try {
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.id))
      .limit(1);
    return { ok: true, product: row ? productRow(row as never) : null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Load failed",
      status: 500,
    };
  }
}

export async function upsertProductAction(input: {
  id?: string;
  payload: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const p = input.payload;
    const values: Partial<typeof products.$inferInsert> = {};
    if (p.name != null || p.name_en != null) {
      values.name = String(p.name_en ?? p.name ?? "");
      values.nameEn = String(p.name_en ?? p.name ?? "");
    }
    if (p.name_bn !== undefined) values.nameBn = (p.name_bn as string) || null;
    if (p.sku !== undefined) values.sku = (p.sku as string) || null;
    if (p.barcode !== undefined) values.barcode = (p.barcode as string) || null;
    if (p.category_id !== undefined) values.categoryId = (p.category_id as string) || null;
    if (p.brand_id !== undefined) values.brandId = (p.brand_id as string) || null;
    if (p.unit !== undefined) values.unit = (p.unit as string) || "pcs";
    if (p.pack_size !== undefined) values.packSize = (p.pack_size as string) || null;
    if (p.cost != null || p.cost_price != null) {
      values.costPrice = money(Number(p.cost ?? p.cost_price));
    }
    if (p.price != null || p.selling_price != null) {
      values.sellingPrice = money(Number(p.price ?? p.selling_price));
    }
    if (p.mrp != null) values.mrp = money(Number(p.mrp));
    if (p.stock != null) values.stock = money(Number(p.stock));
    if (p.low_stock_at != null) values.lowStockAt = money(Number(p.low_stock_at));
    if (p.image_url !== undefined) values.imageUrl = (p.image_url as string) || null;
    if (p.description !== undefined) values.description = (p.description as string) || null;
    if (p.is_active !== undefined) values.isActive = Boolean(p.is_active);
    if (p.expiry_date !== undefined) {
      values.expiryDate = p.expiry_date ? new Date(String(p.expiry_date)) : null;
    }

    if (input.id) {
      await db.update(products).set(values).where(eq(products.id, input.id));
      revalidatePath("/products");
      revalidatePath("/inventory");
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(products).values({
      id,
      name: values.name || "Product",
      nameEn: values.nameEn || values.name || "Product",
      ...values,
    });
    revalidatePath("/products");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
      status: 500,
    };
  }
}

export async function updateProductsBulkAction(input: {
  ids: string[];
  patch: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    await requireManager();
    if (!input.ids?.length) return { ok: false, error: "ids required", status: 400 };
    const p = input.patch;
    const values: Partial<typeof products.$inferInsert> = {};
    if (p.price != null || p.selling_price != null) {
      values.sellingPrice = money(Number(p.price ?? p.selling_price));
    }
    if (p.cost != null || p.cost_price != null) {
      values.costPrice = money(Number(p.cost ?? p.cost_price));
    }
    if (p.is_active !== undefined) values.isActive = Boolean(p.is_active);
    if (p.category_id !== undefined) values.categoryId = (p.category_id as string) || null;
    if (p.image_url !== undefined) values.imageUrl = (p.image_url as string) || null;
    await db.update(products).set(values).where(inArray(products.id, input.ids));
    revalidatePath("/products");
    revalidatePath("/product-audit");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bulk update failed",
      status: 500,
    };
  }
}

export async function deleteProductAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireManager();
    await db.delete(products).where(eq(products.id, input.id));
    revalidatePath("/products");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
      status: 500,
    };
  }
}

export async function listProductStockAction(input?: {
  branchId?: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    let q = db.select().from(productStock).$dynamic();
    if (input?.branchId) q = q.where(eq(productStock.branchId, input.branchId));
    const rows = await q;
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        product_id: r.productId,
        branch_id: r.branchId,
        stock: Number(r.quantity),
        quantity: Number(r.quantity),
        min_stock_alert: r.minStockAlert != null ? Number(r.minStockAlert) : null,
      })),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Stock list failed",
      status: 500,
    };
  }
}

export async function upsertProductStockAction(input: {
  productId: string;
  branchId: string;
  quantity: number;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    const [existing] = await db
      .select()
      .from(productStock)
      .where(
        and(
          eq(productStock.productId, input.productId),
          eq(productStock.branchId, input.branchId)
        )
      )
      .limit(1);
    if (existing) {
      await db
        .update(productStock)
        .set({ quantity: money(input.quantity) })
        .where(eq(productStock.id, existing.id));
    } else {
      await db.insert(productStock).values({
        id: crypto.randomUUID(),
        productId: input.productId,
        branchId: input.branchId,
        quantity: money(input.quantity),
      });
    }
    revalidatePath("/inventory");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Stock save failed",
      status: 500,
    };
  }
}

export async function listReviewsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(productReviews)
      .orderBy(desc(productReviews.createdAt))
      .limit(500);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        product_id: r.productId,
        customer_id: r.customerId,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        is_approved: r.isApproved ?? false,
        created_at:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
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

export async function moderateReviewAction(input: {
  id: string;
  isApproved: boolean;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db
      .update(productReviews)
      .set({
        isApproved: input.isApproved,
        status: input.isApproved ? "approved" : "pending",
      })
      .where(eq(productReviews.id, input.id));
    revalidatePath("/reviews");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Moderate failed",
      status: 500,
    };
  }
}

export async function deleteReviewAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(productReviews).where(eq(productReviews.id, input.id));
    revalidatePath("/reviews");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
      status: 500,
    };
  }
}

function promotionRow(r: typeof promotions.$inferSelect): Dict {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    title_en: r.titleEn ?? r.title,
    title_bn: r.titleBn,
    body: r.body,
    image_url: r.imageUrl,
    discount_pct: Number(r.discountPct ?? 0),
    discount_amt: Number(r.discountAmt ?? 0),
    min_order: Number(r.minOrder ?? 0),
    sort_order: r.sortOrder ?? 0,
    is_active: r.isActive,
    expires_at:
      r.expiresAt instanceof Date ? r.expiresAt.toISOString() : r.expiresAt,
    created_at:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

export async function listPromotionsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    const rows = await db
      .select()
      .from(promotions)
      .orderBy(asc(promotions.sortOrder));
    return { ok: true, rows: rows.map(promotionRow) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function upsertPromotionAction(input: {
  id?: string;
  values: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const v = input.values;
    const mapped = {
      code: (v.code as string) || null,
      title: (v.title as string) || (v.title_en as string) || null,
      titleEn: (v.title_en as string) || (v.title as string) || null,
      titleBn: (v.title_bn as string) || null,
      body: (v.body as string) || null,
      imageUrl: (v.image_url as string) || null,
      discountPct: money(Number(v.discount_pct ?? 0)),
      discountAmt: money(Number(v.discount_amt ?? 0)),
      minOrder: money(Number(v.min_order ?? 0)),
      sortOrder: Number(v.sort_order ?? 0),
      isActive: v.is_active == null ? true : Boolean(v.is_active),
      expiresAt: v.expires_at ? new Date(String(v.expires_at)) : null,
    };
    if (input.id) {
      await db.update(promotions).set(mapped).where(eq(promotions.id, input.id));
      revalidatePath("/promotions");
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(promotions).values({ id, ...mapped });
    revalidatePath("/promotions");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
      status: 500,
    };
  }
}

export async function deletePromotionAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(promotions).where(eq(promotions.id, input.id));
    revalidatePath("/promotions");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
      status: 500,
    };
  }
}

/** Catalog table insert for brands/categories/subcategories quick-add. */
export async function insertCatalogRowAction(input: {
  table: "brands" | "categories" | "subcategories";
  payload: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    if (input.table === "brands") {
      const name = String(input.payload.name_en || input.payload.name || "Brand");
      await db.insert(brands).values({
        id,
        name,
        nameEn: name,
        nameBn: (input.payload.name_bn as string) || null,
        slug: String(input.payload.slug || name.toLowerCase().replace(/\s+/g, "-")),
        logoUrl: (input.payload.logo_url as string) || null,
      });
    } else if (input.table === "categories") {
      const name = String(input.payload.name_en || input.payload.name || "Category");
      await db.insert(categories).values({
        id,
        name,
        nameEn: name,
        nameBn: (input.payload.name_bn as string) || null,
        slug: String(input.payload.slug || name.toLowerCase().replace(/\s+/g, "-")),
        imageUrl: (input.payload.image_url as string) || null,
      });
    } else {
      await db.insert(subcategories).values({
        id,
        categoryId: String(input.payload.category_id),
        name: String(input.payload.name || "Sub"),
        slug: String(input.payload.slug || "sub"),
      });
    }
    revalidatePath("/catalog");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Insert failed",
      status: 500,
    };
  }
}

export async function deleteCatalogRowAction(input: {
  table: "brands" | "categories" | "subcategories";
  id: string;
}): Promise<ActionResult> {
  try {
    await requireManager();
    if (input.table === "brands") {
      await db.delete(brands).where(eq(brands.id, input.id));
    } else if (input.table === "categories") {
      await db.delete(categories).where(eq(categories.id, input.id));
    } else {
      await db.delete(subcategories).where(eq(subcategories.id, input.id));
    }
    revalidatePath("/catalog");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
      status: 500,
    };
  }
}
