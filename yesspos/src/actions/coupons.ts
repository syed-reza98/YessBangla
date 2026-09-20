"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { coupons } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";
import { money } from "@/lib/legacy-rows";

export type CouponResult = {
  ok: boolean;
  code: string;
  discount: number;
  reason: string;
};

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function couponRow(r: typeof coupons.$inferSelect) {
  return {
    id: r.id,
    code: r.code,
    type: r.discountType,
    discount_type: r.discountType,
    value: Number(r.discountValue),
    discount_value: Number(r.discountValue),
    min_amount: Number(r.minOrderAmount ?? 0),
    min_order_amount: Number(r.minOrderAmount ?? 0),
    max_discount: r.maxDiscount != null ? Number(r.maxDiscount) : null,
    usage_limit: r.usageLimit,
    used_count: r.usedCount,
    starts_on: r.validFrom,
    expires_on: r.validUntil,
    valid_from: r.validFrom,
    valid_until: r.validUntil,
    is_active: r.isActive,
    created_at: r.createdAt,
  };
}

export async function listCouponsAction(): Promise<
  ActionResult<{ rows: ReturnType<typeof couponRow>[] }>
> {
  try {
    await requireStaff();
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return { ok: true, rows: rows.map(couponRow) };
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

export async function upsertCouponAction(input: {
  id?: string;
  values: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const v = input.values;
    const mapped = {
      code: String(v.code || "").toUpperCase(),
      discountType: String(v.type || v.discount_type || "percent"),
      discountValue: money(Number(v.value ?? v.discount_value ?? 0)),
      minOrderAmount: money(Number(v.min_amount ?? v.min_order_amount ?? 0)),
      maxDiscount:
        v.max_discount != null ? money(Number(v.max_discount)) : null,
      usageLimit: v.usage_limit != null ? Number(v.usage_limit) : null,
      validFrom: v.starts_on || v.valid_from
        ? new Date(String(v.starts_on ?? v.valid_from))
        : null,
      validUntil: v.expires_on || v.valid_until
        ? new Date(String(v.expires_on ?? v.valid_until))
        : null,
      isActive: v.is_active == null ? true : Boolean(v.is_active),
    };
    if (input.id) {
      await db.update(coupons).set(mapped).where(eq(coupons.id, input.id));
      revalidatePath("/coupons");
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(coupons).values({ id, ...mapped });
    revalidatePath("/coupons");
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

export async function deleteCouponAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(coupons).where(eq(coupons.id, input.id));
    revalidatePath("/coupons");
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

export async function validateCouponAction(input: {
  code: string;
  subtotal: number;
}): Promise<CouponResult> {
  const trimmed = (input.code || "").trim().toUpperCase();
  if (!trimmed) {
    return { ok: false, code: "", discount: 0, reason: "empty" };
  }

  try {
    const [row] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, trimmed))
      .limit(1);

    if (!row) {
      return { ok: false, code: trimmed, discount: 0, reason: "not_found" };
    }
    if (!row.isActive) {
      return { ok: false, code: trimmed, discount: 0, reason: "inactive" };
    }
    const now = new Date();
    if (row.validFrom && row.validFrom > now) {
      return { ok: false, code: trimmed, discount: 0, reason: "not_started" };
    }
    if (row.validUntil && row.validUntil < now) {
      return { ok: false, code: trimmed, discount: 0, reason: "expired" };
    }
    if (row.usageLimit != null && row.usedCount >= row.usageLimit) {
      return { ok: false, code: trimmed, discount: 0, reason: "limit_reached" };
    }
    const min = Number(row.minOrderAmount || 0);
    if (input.subtotal < min) {
      return { ok: false, code: trimmed, discount: 0, reason: "min_amount" };
    }

    let discount = 0;
    const value = Number(row.discountValue || 0);
    if (row.discountType === "fixed" || row.discountType === "amount") {
      discount = value;
    } else {
      discount = (input.subtotal * value) / 100;
      if (row.maxDiscount != null) {
        discount = Math.min(discount, Number(row.maxDiscount));
      }
    }
    discount = Math.max(0, Math.min(discount, input.subtotal));
    if (discount <= 0) {
      return { ok: false, code: trimmed, discount: 0, reason: "inactive" };
    }

    return { ok: true, code: row.code, discount, reason: "ok" };
  } catch {
    return { ok: false, code: trimmed, discount: 0, reason: "error" };
  }
}
