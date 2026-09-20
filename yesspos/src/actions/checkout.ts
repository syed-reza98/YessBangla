"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  deliveryOrderItems,
  deliveryOrders,
  userCarts,
} from "@/db/schema";
import { auth } from "@/auth";
import { AuthError, requireAuth } from "@/lib/authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export type CartLine = {
  id: string;
  qty: number;
  name_en?: string;
  name_bn?: string;
  price?: number;
  pack_size?: string;
};

function money(n: number | undefined, fallback = "0.00") {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return fallback;
  return Number(n).toFixed(2);
}

export async function getCartAction(): Promise<
  ActionResult<{ lines: CartLine[] }>
> {
  try {
    const session = await requireAuth();
    const [row] = await db
      .select()
      .from(userCarts)
      .where(eq(userCarts.userId, session.user!.id!))
      .limit(1);
    return { ok: true, lines: (row?.lines as CartLine[]) ?? [] };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cart load failed",
      status: 500,
    };
  }
}

export async function saveCartAction(input: {
  lines: CartLine[];
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const [existing] = await db
      .select()
      .from(userCarts)
      .where(eq(userCarts.userId, userId))
      .limit(1);
    if (existing) {
      await db
        .update(userCarts)
        .set({ lines: input.lines, updatedAt: new Date() })
        .where(eq(userCarts.id, existing.id));
    } else {
      await db.insert(userCarts).values({
        id: crypto.randomUUID(),
        userId,
        lines: input.lines,
      });
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cart save failed",
      status: 500,
    };
  }
}

export type PlaceDeliveryOrderInput = {
  customerName: string;
  customerPhone: string;
  address: string;
  area?: string | null;
  note?: string | null;
  slot?: string | null;
  slotDate?: string | null;
  slotId?: string | null;
  paymentMethod?: string;
  subtotal: number;
  discount?: number;
  couponCode?: string | null;
  deliveryFee?: number;
  total: number;
  items: Array<{
    productId?: string | null;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export async function placeDeliveryOrderAction(
  input: PlaceDeliveryOrderInput
): Promise<ActionResult<{ id: string; orderNo: number; trackingCode: string }>> {
  try {
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {
      /* guest checkout */
    }

    if (!input.items?.length) {
      return { ok: false, error: "Order needs items", status: 400 };
    }
    if (!input.customerName?.trim() || !input.customerPhone?.trim()) {
      return { ok: false, error: "Name and phone required", status: 400 };
    }
    if (!input.address?.trim()) {
      return { ok: false, error: "Address required", status: 400 };
    }

    const id = crypto.randomUUID();
    const [maxRow] = await db
      .select({ m: sql<number>`IFNULL(MAX(${deliveryOrders.orderNo}), 1000)` })
      .from(deliveryOrders);
    const orderNo = Number(maxRow?.m ?? 1000) + 1;
    const tracking = `YP${orderNo}${Date.now().toString(36).slice(-4).toUpperCase()}`;

    await db.transaction(async (tx) => {
      await tx.insert(deliveryOrders).values({
        id,
        orderNo,
        userId,
        customerName: input.customerName.trim().slice(0, 150),
        customerPhone: input.customerPhone.trim().slice(0, 50),
        deliveryAddress: input.address.trim(),
        address: input.address.trim(),
        area: input.area ?? null,
        note: input.note ?? null,
        slot: input.slot ?? null,
        slotDate: input.slotDate ?? null,
        slotId: input.slotId ?? null,
        paymentMethod: input.paymentMethod || "cod",
        subtotal: money(input.subtotal),
        discount: money(input.discount),
        couponCode: input.couponCode ?? null,
        deliveryFee: money(input.deliveryFee),
        deliveryCharge: money(input.deliveryFee),
        total: money(input.total),
        status: "pending",
        trackingCode: tracking,
      });

      for (const item of input.items) {
        await tx.insert(deliveryOrderItems).values({
          id: crypto.randomUUID(),
          orderId: id,
          productId: item.productId || null,
          nameSnapshot: item.nameSnapshot.slice(0, 255),
          unitPrice: money(item.unitPrice),
          quantity: money(item.quantity),
          lineTotal: money(item.lineTotal),
        });
      }
    });

    revalidatePath("/my-orders");
    revalidatePath("/delivery-orders");
    return { ok: true, id, orderNo, trackingCode: tracking };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Checkout failed",
      status: 500,
    };
  }
}

export async function listMyOrdersAction(): Promise<
  ActionResult<{ orders: unknown[] }>
> {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(deliveryOrders)
      .where(eq(deliveryOrders.userId, session.user!.id!))
      .orderBy(desc(deliveryOrders.createdAt))
      .limit(50);
    return {
      ok: true,
      orders: rows.map((r) => ({
        id: r.id,
        order_no: r.orderNo,
        status: r.status,
        total: Number(r.total),
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        coupon_code: r.couponCode,
        delivery_fee: Number(r.deliveryFee ?? r.deliveryCharge ?? 0),
        created_at: r.createdAt,
        area: r.area,
        slot: r.slot,
        payment_method: r.paymentMethod,
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        address: r.address ?? r.deliveryAddress,
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

export async function cancelDeliveryOrderAction(input: {
  orderNo: number;
  phone: string;
  reason?: string | null;
}): Promise<ActionResult> {
  try {
    const [row] = await db
      .select()
      .from(deliveryOrders)
      .where(
        and(
          eq(deliveryOrders.orderNo, input.orderNo),
          eq(deliveryOrders.customerPhone, input.phone.trim())
        )
      )
      .limit(1);
    if (!row) return { ok: false, error: "Order not found", status: 404 };
    if (["shipped", "delivered", "cancelled"].includes(row.status)) {
      return { ok: false, error: "Cannot cancel this order", status: 400 };
    }
    await db
      .update(deliveryOrders)
      .set({
        status: "cancelled",
        note: input.reason
          ? `${row.note ? row.note + " | " : ""}cancel: ${input.reason}`.slice(0, 500)
          : row.note,
      })
      .where(eq(deliveryOrders.id, row.id));
    revalidatePath("/my-orders");
    revalidatePath("/track");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cancel failed",
      status: 500,
    };
  }
}

export async function rescheduleDeliveryOrderAction(input: {
  orderNo: number;
  phone: string;
  slot?: string | null;
  slotDate?: string | null;
  slotId?: string | null;
}): Promise<ActionResult> {
  try {
    const [row] = await db
      .select()
      .from(deliveryOrders)
      .where(
        and(
          eq(deliveryOrders.orderNo, input.orderNo),
          eq(deliveryOrders.customerPhone, input.phone.trim())
        )
      )
      .limit(1);
    if (!row) return { ok: false, error: "Order not found", status: 404 };
    if (["shipped", "delivered", "cancelled"].includes(row.status)) {
      return { ok: false, error: "Cannot reschedule", status: 400 };
    }
    await db
      .update(deliveryOrders)
      .set({
        slot: input.slot ?? row.slot,
        slotDate: input.slotDate ?? row.slotDate,
        slotId: input.slotId ?? row.slotId,
      })
      .where(eq(deliveryOrders.id, row.id));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reschedule failed",
      status: 500,
    };
  }
}
