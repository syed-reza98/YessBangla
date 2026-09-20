"use server";

import { sql, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { posSales, posSaleItems, products } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/session-authz";

export type PosLineInput = {
  product_id: string;
  product_name?: string;
  price: number;
  qty: number;
};

export type PosCreateSaleInput = {
  items: PosLineInput[];
  customer_name?: string;
  phone?: string;
  discount?: number;
  paid?: number;
  method?: string;
  note?: string;
  branchId?: string;
  ref?: string;
};

export type PosCreateSaleResult =
  | { ok: true; invoice_no: string; saleId: string; conflicts?: string[] }
  | { ok: false; error: string; status?: number };

function money(n: number | undefined, fallback = "0.00") {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return fallback;
  return Number(n).toFixed(2);
}

export async function posCreateSaleAction(
  input: PosCreateSaleInput
): Promise<PosCreateSaleResult> {
  try {
    const session = await requireStaff();
    const lines = (input.items || []).filter((i) => i.qty > 0 && i.product_id);
    if (!lines.length) {
      return { ok: false, error: "Sale needs items", status: 400 };
    }

    if (input.ref) {
      const [existing] = await db
        .select({ invoiceNumber: posSales.invoiceNumber })
        .from(posSales)
        .where(like(posSales.note, `%#ref:${input.ref}%`))
        .limit(1);
      if (existing?.invoiceNumber) {
        return {
          ok: true,
          invoice_no: existing.invoiceNumber,
          saleId: "",
          conflicts: [],
        };
      }
    }

    const conflicts: string[] = [];
    for (const line of lines) {
      const [prod] = await db
        .select()
        .from(products)
        .where(sql`${products.id} = ${line.product_id}`)
        .limit(1);
      const stock = Number(prod?.stock ?? 0);
      if (!prod || stock < line.qty) {
        conflicts.push(
          `${prod?.name ?? line.product_name ?? line.product_id}: need ${line.qty}, stock ${stock}`
        );
      }
    }

    const subtotal = lines.reduce((s, l) => s + Number(l.price) * Number(l.qty), 0);
    const discount = Number(input.discount || 0);
    const total = Math.max(0, subtotal - discount);
    const paid = Number(input.paid ?? total);
    const saleId = crypto.randomUUID();
    const invoiceNumber = `POS-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 100)}`;
    const noteParts = [
      input.note?.trim(),
      input.ref ? `#ref:${input.ref}` : "",
      input.customer_name ? `Customer: ${input.customer_name}` : "",
      input.phone ? `Phone: ${input.phone}` : "",
      conflicts.length ? `Stock short: ${conflicts.join("; ")}` : "",
    ].filter(Boolean);

    await db.transaction(async (tx) => {
      await tx.insert(posSales).values({
        id: saleId,
        invoiceNumber,
        branchId: input.branchId || null,
        cashierId: session.user!.id!,
        total: money(total),
        paid: money(paid),
        paymentMethod: input.method || "cash",
        note: noteParts.join(" | ") || null,
      });

      for (const line of lines) {
        const qty = Number(line.qty);
        const unit = Number(line.price);
        await tx.insert(posSaleItems).values({
          id: crypto.randomUUID(),
          saleId,
          productId: line.product_id,
          quantity: qty,
          unitPrice: money(unit),
        });
        await tx.execute(
          sql`UPDATE products SET stock = GREATEST(0, stock - ${qty}) WHERE id = ${line.product_id}`
        );
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pos");
    revalidatePath("/admin/inventory");

    return { ok: true, invoice_no: invoiceNumber, saleId, conflicts };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "POS sale failed",
      status: 500,
    };
  }
}

export async function findPosSaleByRefAction(ref: string): Promise<string | null> {
  try {
    await requireStaff();
    const rows = await db
      .select({ invoiceNumber: posSales.invoiceNumber })
      .from(posSales)
      .where(like(posSales.note, `%#ref:${ref}%`))
      .limit(1);
    return rows[0]?.invoiceNumber ?? null;
  } catch {
    return null;
  }
}
