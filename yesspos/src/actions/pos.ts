"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sales, saleItems, salePayments } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";

export type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
};

export type SalePaymentInput = {
  method: string;
  amount: number;
  reference?: string | null;
};

export type CreateSaleInput = {
  invoiceNumber: string;
  customerId?: string | null;
  branchId: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMethod?: string;
  status?: string;
  notes?: string | null;
  items: SaleItemInput[];
  payment?: SalePaymentInput | null;
  decrementStock?: boolean;
};

export type CreateSaleResult =
  | { ok: true; saleId: string; invoiceNumber: string }
  | { ok: false; error: string; status?: number };

function money(n: number | undefined, fallback = "0.00") {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return fallback;
  return Number(n).toFixed(2);
}

export async function createSaleAction(
  payload: CreateSaleInput
): Promise<CreateSaleResult> {
  try {
    const session = await requireStaff();
    const cashierId = session.user!.id!;

    if (!payload.items?.length) {
      return { ok: false, error: "Sale requires at least one item", status: 400 };
    }
    if (!payload.branchId || !payload.invoiceNumber) {
      return {
        ok: false,
        error: "branchId and invoiceNumber are required",
        status: 400,
      };
    }

    const saleId = crypto.randomUUID();
    const status = payload.status || "completed";
    const shouldDecrement =
      payload.decrementStock !== false &&
      (status === "completed" || status === "final");

    await db.transaction(async (tx) => {
      await tx.insert(sales).values({
        id: saleId,
        invoiceNumber: payload.invoiceNumber,
        customerId: payload.customerId || null,
        branchId: payload.branchId,
        cashierId,
        subtotal: money(payload.subtotal),
        discount: money(payload.discount),
        tax: money(payload.tax),
        total: money(payload.total),
        paidAmount: money(payload.paidAmount ?? payload.total),
        dueAmount: money(payload.dueAmount),
        paymentMethod: payload.paymentMethod || "cash",
        status,
        notes: payload.notes || null,
      });

      for (const item of payload.items) {
        await tx.insert(saleItems).values({
          id: crypto.randomUUID(),
          saleId,
          productId: item.productId,
          quantity: money(item.quantity),
          unitPrice: money(item.unitPrice),
          discount: money(item.discount),
          tax: money(item.tax),
          totalPrice: money(item.totalPrice),
        });

        if (shouldDecrement) {
          await tx.execute(
            sql`UPDATE product_stock
                SET quantity = quantity - ${item.quantity}
                WHERE product_id = ${item.productId}
                  AND branch_id = ${payload.branchId}`
          );
          await tx.execute(
            sql`UPDATE products
                SET stock = stock - ${item.quantity}
                WHERE id = ${item.productId}`
          );
        }
      }

      if (payload.payment) {
        await tx.insert(salePayments).values({
          id: crypto.randomUUID(),
          saleId,
          method: payload.payment.method,
          amount: money(payload.payment.amount),
          reference: payload.payment.reference || null,
        });
      }
    });

    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/inventory");

    return { ok: true, saleId, invoiceNumber: payload.invoiceNumber };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    const message = err instanceof Error ? err.message : "Failed to create sale";
    return { ok: false, error: message, status: 500 };
  }
}
