"use server";

import { eq, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  products,
  orders,
  stockAdjustments,
  stockAdjustmentItems,
  stockCounts,
  stockCountItems,
  stockTransfers,
  stockMovements,
  medicineDirectory,
} from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

export type StockAdjustmentItemInput = {
  product_id: string;
  change: number;
  note?: string;
};

export type StockAdjustmentInput = {
  reason: string;
  note?: string;
  items: StockAdjustmentItemInput[];
};

export async function applyStockAdjustmentAction(input: StockAdjustmentInput) {
  try {
    const session = await requireStaff();
    const userId = session.user?.id || null;

    if (!input.items || input.items.length === 0) {
      return { ok: false, error: "NO_ITEMS" };
    }

    const adjId = crypto.randomUUID();
    const adjNo = `ADJ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.transaction(async (tx) => {
      await tx.insert(stockAdjustments).values({
        id: adjId,
        adjNo,
        reason: input.reason || "correction",
        note: input.note || "",
        createdBy: userId,
      });

      for (const it of input.items) {
        const prod = await tx
          .select({ stock: products.stock, name: products.name })
          .from(products)
          .where(eq(products.id, it.product_id))
          .limit(1);

        if (!prod || prod.length === 0) continue;
        const beforeQty = Number(prod[0].stock) || 0;
        const changeQty = Number(it.change) || 0;
        const afterQty = Math.max(0, beforeQty + changeQty);
        const actualChange = afterQty - beforeQty;

        await tx
          .update(products)
          .set({ stock: afterQty })
          .where(eq(products.id, it.product_id));

        await tx.insert(stockAdjustmentItems).values({
          id: crypto.randomUUID(),
          adjId,
          productId: it.product_id,
          productName: prod[0].name || "",
          changeQty: actualChange,
          beforeQty,
          afterQty,
          note: it.note || "",
        });

        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId: it.product_id,
          type: "adjustment",
          quantity: actualChange,
          referenceId: adjNo,
        });
      }
    });

    revalidatePath("/admin");
    return { ok: true, adjNo };
  } catch (err: any) {
    if (err instanceof AuthError) return { ok: false, error: "FORBIDDEN" };
    return { ok: false, error: err?.message || "Failed to apply stock adjustment" };
  }
}

export async function applyStockCountAction(countId: string) {
  try {
    const session = await requireStaff();
    const userId = session.user?.id || null;

    const countRows = await db
      .select()
      .from(stockCounts)
      .where(eq(stockCounts.id, countId))
      .limit(1);

    if (countRows.length === 0) {
      return { ok: false, error: "Count not found" };
    }

    const countNo = countRows[0].countNo;
    const items = await db
      .select()
      .from(stockCountItems)
      .where(eq(stockCountItems.countId, countId));

    let updatedCount = 0;
    await db.transaction(async (tx) => {
      for (const r of items) {
        const counted = Number(r.countedQty);
        const system = Number(r.systemQty);
        if (counted !== system) {
          const newStock = Math.max(0, counted);
          await tx
            .update(products)
            .set({ stock: newStock })
            .where(eq(products.id, r.productId));

          await tx.insert(stockMovements).values({
            id: crypto.randomUUID(),
            productId: r.productId,
            type: "count",
            quantity: counted - system,
            referenceId: countNo,
          });
          updatedCount++;
        }
      }

      await tx
        .update(stockCounts)
        .set({ status: "applied", appliedAt: new Date() })
        .where(eq(stockCounts.id, countId));
    });

    revalidatePath("/admin");
    return { ok: true, data: updatedCount };
  } catch (err: any) {
    if (err instanceof AuthError) return { ok: false, error: "FORBIDDEN" };
    return { ok: false, error: err?.message || "Failed to apply stock count" };
  }
}

export async function updateTransferStatusAction(transferId: string, status: string) {
  try {
    await requireStaff();
    if (!["draft", "sent", "received", "cancelled"].includes(status)) {
      return { ok: false, error: "BAD_STATUS" };
    }

    const patch: any = { status };
    if (status === "sent") patch.sentAt = new Date();
    if (status === "received") patch.receivedAt = new Date();

    await db
      .update(stockTransfers)
      .set(patch)
      .where(eq(stockTransfers.id, transferId));

    revalidatePath("/admin");
    return { ok: true };
  } catch (err: any) {
    if (err instanceof AuthError) return { ok: false, error: "FORBIDDEN" };
    return { ok: false, error: err?.message || "Failed to update transfer status" };
  }
}

export async function saveOrderLocationAction(orderId: string, lat: number, lng: number, address?: string) {
  try {
    await requireAuth();
    // Orders table can store lat, lng or address note
    const patch: any = {};
    if (address) patch.deliveryAddress = address;
    await db
      .update(orders)
      .set(patch)
      .where(eq(orders.id, orderId));

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to save order location" };
  }
}

export async function getMedicineDirectoryFacetsAction() {
  try {
    // Collect distinct forms, generics, manufacturers from products or medicine_directory
    const forms = await db.selectDistinct({ form: medicineDirectory.form }).from(medicineDirectory).limit(50);
    const generics = await db.selectDistinct({ generic: medicineDirectory.generic }).from(medicineDirectory).limit(100);
    const companies = await db.selectDistinct({ company: medicineDirectory.company }).from(medicineDirectory).limit(100);

    return {
      forms: forms.map((f) => f.form).filter(Boolean),
      generics: generics.map((g) => g.generic).filter(Boolean),
      manufacturers: companies.map((m) => m.company).filter(Boolean),
    };
  } catch (err: any) {
    return { forms: [], generics: [], manufacturers: [] };
  }
}
