"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { journalEntries, journalLines, purchases, purchaseItems, productStock } from "@/db/schema";
import { requireManager, AuthError } from "@/lib/authz";
import { sql } from "drizzle-orm";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export async function postJournalAction(input: {
  entryNumber: string;
  memo?: string;
  branchId?: string;
  lines: { accountId: string; debit: number; credit: number; memo?: string }[];
}): Promise<ActionResult> {
  try {
    const session = await requireManager();
    if (!input.lines?.length) {
      return { ok: false, error: "Journal needs lines", status: 400 };
    }
    const debit = input.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = input.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    if (Math.abs(debit - credit) > 0.01) {
      return { ok: false, error: "Debits must equal credits", status: 400 };
    }

    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(journalEntries).values({
        id,
        entryNumber: input.entryNumber,
        memo: input.memo || null,
        branchId: input.branchId || null,
        createdBy: session.user!.id!,
        status: "posted",
      });
      for (const line of input.lines) {
        await tx.insert(journalLines).values({
          id: crypto.randomUUID(),
          entryId: id,
          accountId: line.accountId,
          debit: money(line.debit),
          credit: money(line.credit),
          memo: line.memo || null,
        });
      }
    });
    revalidatePath("/journal");
    revalidatePath("/day-book");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Journal post failed",
      status: 500,
    };
  }
}

export async function createPurchaseAction(input: {
  invoiceNo?: string;
  supplierId?: string;
  branchId?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
  tax?: number;
  paid?: number;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireManager();
    if (!input.items?.length) {
      return { ok: false, error: "Purchase needs items", status: 400 };
    }
    const branchId = input.branchId || "MAIN";
    const invoiceNo =
      input.invoiceNo?.trim() ||
      `PO-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 100)}`;
    const subtotal = input.items.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.unitCost),
      0
    );
    const tax = Number(input.tax || 0);
    const total = subtotal + tax;
    const paid = Math.min(Number(input.paid || 0), total);
    const id = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(purchases).values({
        id,
        invoiceNo,
        supplierId: input.supplierId || null,
        branchId,
        subtotal: money(subtotal),
        tax: money(tax),
        total: money(total),
        paid: money(paid),
        status: "received",
        notes: input.notes || null,
        createdBy: session.user!.id!,
      });
      for (const item of input.items) {
        const lineTotal = Number(item.quantity) * Number(item.unitCost);
        await tx.insert(purchaseItems).values({
          id: crypto.randomUUID(),
          purchaseId: id,
          productId: item.productId,
          quantity: money(item.quantity),
          unitCost: money(item.unitCost),
          lineTotal: money(lineTotal),
        });
        const updated = await tx.execute(
          sql`UPDATE product_stock
              SET quantity = quantity + ${item.quantity}
              WHERE product_id = ${item.productId}
                AND branch_id = ${branchId}`
        );
        await tx.execute(
          sql`UPDATE products
              SET stock = stock + ${item.quantity}
              WHERE id = ${item.productId}`
        );
        const affected =
          Array.isArray(updated) && updated[0] && "affectedRows" in (updated[0] as object)
            ? Number((updated[0] as { affectedRows: number }).affectedRows)
            : 0;
        if (affected === 0) {
          await tx.insert(productStock).values({
            id: crypto.randomUUID(),
            productId: item.productId,
            branchId,
            quantity: money(item.quantity),
          });
        }
      }
    });

    revalidatePath("/purchases");
    revalidatePath("/inventory");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Purchase failed",
      status: 500,
    };
  }
}
