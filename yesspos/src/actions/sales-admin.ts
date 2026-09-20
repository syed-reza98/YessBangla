"use server";

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  saleReturns,
  saleReturnItems,
  payments,
} from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";
import { saleRow, saleItemRow, money, type Dict } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listSalesAction(input?: {
  fromIso?: string;
  toIso?: string;
  status?: string;
  limit?: number;
  branchId?: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const clauses = [];
    if (input?.fromIso) clauses.push(gte(sales.createdAt, new Date(input.fromIso)));
    if (input?.toIso) clauses.push(lte(sales.createdAt, new Date(input.toIso)));
    if (input?.status) clauses.push(eq(sales.status, input.status));
    if (input?.branchId) clauses.push(eq(sales.branchId, input.branchId));
    let q = db.select().from(sales).$dynamic();
    if (clauses.length) q = q.where(and(...clauses));
    q = q.orderBy(desc(sales.createdAt)).limit(input?.limit ?? 500);
    const rows = await q;
    return { ok: true, rows: rows.map((r) => saleRow(r as never)) };
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

export async function listSaleItemsAction(input?: {
  saleId?: string;
  limit?: number;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    let q = db.select().from(saleItems).$dynamic();
    if (input?.saleId) q = q.where(eq(saleItems.saleId, input.saleId));
    q = q.limit(input?.limit ?? 2000);
    const rows = await q;
    return { ok: true, rows: rows.map((r) => saleItemRow(r as never)) };
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

export async function updateSaleAction(input: {
  id: string;
  patch: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    const p = input.patch;
    const values: Partial<typeof sales.$inferInsert> = {};
    if (p.paid != null || p.paid_amount != null) {
      values.paidAmount = money(Number(p.paid ?? p.paid_amount));
    }
    if (p.due != null || p.due_amount != null) {
      values.dueAmount = money(Number(p.due ?? p.due_amount));
    }
    if (p.status != null) values.status = String(p.status);
    if (p.notes !== undefined) values.notes = (p.notes as string) || null;
    await db.update(sales).set(values).where(eq(sales.id, input.id));
    revalidatePath("/sales");
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

export async function createSaleReturnAction(input: {
  saleId: string;
  total: number;
  reason?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(saleReturns).values({
        id,
        saleId: input.saleId,
        total: money(input.total),
        reason: input.reason || null,
        createdBy: session.user!.id!,
      });
      for (const item of input.items) {
        await tx.insert(saleReturnItems).values({
          id: crypto.randomUUID(),
          returnId: id,
          productId: item.productId,
          quantity: money(item.quantity),
          unitPrice: money(item.unitPrice),
          lineTotal: money(item.lineTotal),
        });
      }
    });
    revalidatePath("/sales");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Return failed",
      status: 500,
    };
  }
}

export async function listSaleReturnsAction(input?: {
  fromIso?: string;
  toIso?: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const clauses = [];
    if (input?.fromIso) {
      clauses.push(gte(saleReturns.createdAt, new Date(input.fromIso)));
    }
    if (input?.toIso) {
      clauses.push(lte(saleReturns.createdAt, new Date(input.toIso)));
    }
    let q = db.select().from(saleReturns).$dynamic();
    if (clauses.length) q = q.where(and(...clauses));
    const rows = await q.orderBy(desc(saleReturns.createdAt));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        sale_id: r.saleId,
        total: Number(r.total),
        reason: r.reason,
        created_by: r.createdBy,
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

export async function listPaymentsAction(input?: {
  limit?: number;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(input?.limit ?? 500);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        party_id: r.partyId,
        party_type: r.partyType,
        amount: Number(r.amount),
        method: r.method,
        reference: r.reference,
        direction: r.direction,
        notes: r.notes,
        branch_id: r.branchId,
        created_by: r.createdBy,
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

export async function createPaymentAction(input: {
  partyId?: string | null;
  partyType?: string;
  amount: number;
  method?: string;
  reference?: string | null;
  direction?: string;
  notes?: string | null;
  branchId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(payments).values({
      id,
      partyId: input.partyId || null,
      partyType: input.partyType || "customer",
      amount: money(input.amount),
      method: input.method || "cash",
      reference: input.reference || null,
      direction: input.direction || "in",
      notes: input.notes || null,
      branchId: input.branchId || null,
      createdBy: session.user!.id!,
    });
    revalidatePath("/payments");
    revalidatePath("/sales");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Payment failed",
      status: 500,
    };
  }
}

export async function deletePaymentAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(payments).where(eq(payments.id, input.id));
    revalidatePath("/payments");
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
