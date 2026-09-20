"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  stockAdjustments,
  stockCounts,
  stockCountItems,
  stockTransfers,
  stockTransferItems,
  productStock,
} from "@/db/schema";
import { requireStaff, requireManager, AuthError } from "@/lib/authz";

export type ActionResult =
  | { ok: true; id?: string; rows?: unknown[] }
  | { ok: false; error: string; status?: number };

export async function listStockAdjustmentsAction(): Promise<ActionResult> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockAdjustments)
      .orderBy(desc(stockAdjustments.createdAt))
      .limit(200);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        product_id: r.productId,
        branch_id: r.branchId,
        quantity_delta: Number(r.quantityDelta),
        reason: r.reason,
        created_by: r.createdBy,
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

export async function listStockCountsAction(): Promise<ActionResult> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockCounts)
      .orderBy(desc(stockCounts.createdAt))
      .limit(100);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        branch_id: r.branchId,
        status: r.status,
        notes: r.notes,
        created_by: r.createdBy,
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

export async function listStockTransfersAction(): Promise<ActionResult> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockTransfers)
      .orderBy(desc(stockTransfers.createdAt))
      .limit(100);
    const items = await db.select().from(stockTransferItems);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        from_branch_id: r.fromBranchId,
        to_branch_id: r.toBranchId,
        note: r.notes,
        status: r.status,
        transfer_date: r.createdAt,
        stock_transfer_items: items
          .filter((i) => i.transferId === r.id)
          .map((i) => ({
            id: i.id,
            product_id: i.productId,
            quantity: Number(i.quantity),
            name_snapshot: i.productId,
          })),
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

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export async function adjustStockAction(input: {
  productId: string;
  branchId: string;
  quantityDelta: number;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    if (!input.productId || !input.branchId || !input.quantityDelta) {
      return { ok: false, error: "productId, branchId, quantityDelta required", status: 400 };
    }
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(stockAdjustments).values({
        id,
        productId: input.productId,
        branchId: input.branchId,
        quantityDelta: money(input.quantityDelta),
        reason: input.reason || null,
        createdBy: session.user!.id!,
      });
      const updated = await tx.execute(
        sql`UPDATE product_stock
            SET quantity = quantity + ${input.quantityDelta}
            WHERE product_id = ${input.productId} AND branch_id = ${input.branchId}`
      );
      const affected =
        Array.isArray(updated) && updated[0] && "affectedRows" in (updated[0] as object)
          ? Number((updated[0] as { affectedRows: number }).affectedRows)
          : 0;
      if (affected === 0) {
        await tx.insert(productStock).values({
          id: crypto.randomUUID(),
          productId: input.productId,
          branchId: input.branchId,
          quantity: money(Math.max(0, input.quantityDelta)),
        });
      }
    });
    revalidatePath("/inventory");
    revalidatePath("/stock-adjustments");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Adjust failed",
      status: 500,
    };
  }
}

export async function createStockCountAction(input: {
  branchId: string;
  notes?: string;
  items: { productId: string; systemQty: number; countedQty: number }[];
}): Promise<ActionResult> {
  try {
    const session = await requireManager();
    if (!input.branchId || !input.items?.length) {
      return { ok: false, error: "branchId and items required", status: 400 };
    }
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(stockCounts).values({
        id,
        branchId: input.branchId,
        status: "posted",
        notes: input.notes || null,
        createdBy: session.user!.id!,
      });
      for (const item of input.items) {
        await tx.insert(stockCountItems).values({
          id: crypto.randomUUID(),
          countId: id,
          productId: item.productId,
          systemQty: money(item.systemQty),
          countedQty: money(item.countedQty),
        });
        const delta = Number(item.countedQty) - Number(item.systemQty);
        if (Math.abs(delta) > 0.0001) {
          await tx.execute(
            sql`UPDATE product_stock
                SET quantity = ${item.countedQty}
                WHERE product_id = ${item.productId} AND branch_id = ${input.branchId}`
          );
        }
      }
      await tx
        .update(stockCounts)
        .set({ status: "completed" })
        .where(eq(stockCounts.id, id));
    });
    revalidatePath("/stock-count");
    revalidatePath("/inventory");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Stock count failed",
      status: 500,
    };
  }
}

export async function createStockTransferAction(input: {
  fromBranchId: string;
  toBranchId: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}): Promise<ActionResult> {
  try {
    const session = await requireManager();
    if (!input.fromBranchId || !input.toBranchId || !input.items?.length) {
      return { ok: false, error: "branches and items required", status: 400 };
    }
    if (input.fromBranchId === input.toBranchId) {
      return { ok: false, error: "from/to branches must differ", status: 400 };
    }
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(stockTransfers).values({
        id,
        fromBranchId: input.fromBranchId,
        toBranchId: input.toBranchId,
        status: "completed",
        notes: input.notes || null,
        createdBy: session.user!.id!,
      });
      for (const item of input.items) {
        const qty = Number(item.quantity);
        await tx.insert(stockTransferItems).values({
          id: crypto.randomUUID(),
          transferId: id,
          productId: item.productId,
          quantity: money(qty),
        });
        await tx.execute(
          sql`UPDATE product_stock
              SET quantity = quantity - ${qty}
              WHERE product_id = ${item.productId} AND branch_id = ${input.fromBranchId}`
        );
        const updated = await tx.execute(
          sql`UPDATE product_stock
              SET quantity = quantity + ${qty}
              WHERE product_id = ${item.productId} AND branch_id = ${input.toBranchId}`
        );
        const affected =
          Array.isArray(updated) && updated[0] && "affectedRows" in (updated[0] as object)
            ? Number((updated[0] as { affectedRows: number }).affectedRows)
            : 0;
        if (affected === 0) {
          await tx.insert(productStock).values({
            id: crypto.randomUUID(),
            productId: item.productId,
            branchId: input.toBranchId,
            quantity: money(qty),
          });
        }
      }
    });
    revalidatePath("/stock-transfers");
    revalidatePath("/inventory");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Transfer failed",
      status: 500,
    };
  }
}
