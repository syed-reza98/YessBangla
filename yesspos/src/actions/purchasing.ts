"use server";

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  purchases,
  purchaseItems,
  purchaseReturns,
  purchaseReturnItems,
  purchaseOrders,
  purchaseOrderItems,
  products,
} from "@/db/schema";
import { requireStaff, requireManager, AuthError } from "@/lib/authz";
import { money, type Dict } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function purchaseRow(r: typeof purchases.$inferSelect): Dict {
  return {
    id: r.id,
    invoice_no: r.invoiceNo,
    supplier_id: r.supplierId,
    branch_id: r.branchId,
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    total: Number(r.total),
    paid: Number(r.paid),
    status: r.status,
    purchased_on:
      r.purchasedOn instanceof Date
        ? r.purchasedOn.toISOString().slice(0, 10)
        : r.purchasedOn
          ? String(r.purchasedOn).slice(0, 10)
          : r.createdAt instanceof Date
            ? r.createdAt.toISOString().slice(0, 10)
            : null,
    notes: r.notes,
    created_by: r.createdBy,
    created_at:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
  };
}

export async function listPurchasesAction(input?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const clauses = [];
    if (input?.from) clauses.push(gte(purchases.purchasedOn, new Date(input.from)));
    if (input?.to) clauses.push(lte(purchases.purchasedOn, new Date(input.to)));
    let q = db.select().from(purchases).$dynamic();
    if (clauses.length) q = q.where(and(...clauses));
    const rows = await q
      .orderBy(desc(purchases.createdAt))
      .limit(input?.limit ?? 500);
    return { ok: true, rows: rows.map(purchaseRow) };
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

export async function listPurchaseItemsAction(input: {
  purchaseId: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, input.purchaseId));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        purchase_id: r.purchaseId,
        product_id: r.productId,
        quantity: Number(r.quantity),
        unit_cost: Number(r.unitCost),
        line_total: Number(r.lineTotal),
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

export async function createPurchaseReturnAction(input: {
  purchaseId: string;
  supplierId?: string | null;
  total: number;
  reason?: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(purchaseReturns).values({
        id,
        purchaseId: input.purchaseId,
        supplierId: input.supplierId || null,
        total: money(input.total),
        reason: input.reason || null,
        createdBy: session.user!.id!,
      });
      for (const item of input.items) {
        await tx.insert(purchaseReturnItems).values({
          id: crypto.randomUUID(),
          returnId: id,
          productId: item.productId,
          quantity: money(item.quantity),
          unitCost: money(item.unitCost),
          lineTotal: money(item.lineTotal),
        });
      }
    });
    revalidatePath("/purchases");
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

export async function listPurchaseReturnsAction(input?: {
  fromIso?: string;
  toIso?: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const clauses = [];
    if (input?.fromIso) {
      clauses.push(gte(purchaseReturns.createdAt, new Date(input.fromIso)));
    }
    if (input?.toIso) {
      clauses.push(lte(purchaseReturns.createdAt, new Date(input.toIso)));
    }
    let q = db.select().from(purchaseReturns).$dynamic();
    if (clauses.length) q = q.where(and(...clauses));
    const rows = await q.orderBy(desc(purchaseReturns.createdAt));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        purchase_id: r.purchaseId,
        supplier_id: r.supplierId,
        total: Number(r.total),
        reason: r.reason,
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

export async function updateProductCostAction(input: {
  productId: string;
  cost: number;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db
      .update(products)
      .set({ costPrice: money(input.cost) })
      .where(eq(products.id, input.productId));
    revalidatePath("/products");
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

export async function listPurchaseOrdersAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.createdAt));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        po_number: r.poNumber,
        supplier_id: r.supplierId,
        branch_id: r.branchId,
        status: r.status,
        total_amount: Number(r.totalAmount),
        paid_amount: Number(r.paidAmount),
        due_amount: Number(r.dueAmount),
        order_date:
          r.orderDate instanceof Date
            ? r.orderDate.toISOString()
            : String(r.orderDate),
        delivery_date:
          r.deliveryDate instanceof Date
            ? r.deliveryDate.toISOString()
            : r.deliveryDate,
        notes: r.notes,
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

export async function listPurchaseOrderItemsAction(input: {
  poId: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.poId, input.poId));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        po_id: r.poId,
        product_id: r.productId,
        quantity: Number(r.quantity),
        unit_cost: Number(r.unitCost),
        total_cost: Number(r.totalCost),
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

export async function createPurchaseOrderAction(input: {
  poNumber: string;
  supplierId: string;
  branchId?: string | null;
  notes?: string | null;
  totalAmount: number;
  items: { productId: string; quantity: number; unitCost: number }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireManager();
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(purchaseOrders).values({
        id,
        poNumber: input.poNumber,
        supplierId: input.supplierId,
        branchId: input.branchId || null,
        status: "pending",
        totalAmount: money(input.totalAmount),
        notes: input.notes || null,
      });
      for (const item of input.items) {
        await tx.insert(purchaseOrderItems).values({
          id: crypto.randomUUID(),
          poId: id,
          productId: item.productId,
          quantity: money(item.quantity),
          unitCost: money(item.unitCost),
          totalCost: money(item.quantity * item.unitCost),
        });
      }
    });
    revalidatePath("/purchase-orders");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
      status: 500,
    };
  }
}

export async function receivePurchaseOrderAction(input: {
  poId: string;
  invoiceNo: string;
  branchId?: string | null;
}): Promise<ActionResult<{ purchaseId: string }>> {
  try {
    const session = await requireManager();
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, input.poId))
      .limit(1);
    if (!po) return { ok: false, error: "PO not found", status: 404 };
    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.poId, input.poId));
    const purchaseId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(purchases).values({
        id: purchaseId,
        invoiceNo: input.invoiceNo,
        supplierId: po.supplierId,
        branchId: input.branchId || po.branchId,
        subtotal: money(Number(po.totalAmount)),
        total: money(Number(po.totalAmount)),
        paid: money(0),
        status: "received",
        purchasedOn: new Date(),
        createdBy: session.user!.id!,
      });
      for (const item of items) {
        await tx.insert(purchaseItems).values({
          id: crypto.randomUUID(),
          purchaseId,
          productId: item.productId,
          quantity: money(Number(item.quantity)),
          unitCost: money(Number(item.unitCost)),
          lineTotal: money(Number(item.totalCost)),
        });
      }
      await tx
        .update(purchaseOrders)
        .set({ status: "received" })
        .where(eq(purchaseOrders.id, input.poId));
    });
    revalidatePath("/purchase-orders");
    revalidatePath("/purchases");
    return { ok: true, purchaseId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Receive failed",
      status: 500,
    };
  }
}
