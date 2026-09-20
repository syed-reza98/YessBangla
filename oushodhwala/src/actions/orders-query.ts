"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/db/schema";
import { requireAuth, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listMyOrdersAction(): Promise<
  ActionResult<{ orders: unknown[] }>
> {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, session.user!.id!))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const out = [];
    for (const o of rows) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, o.id));
      out.push({
        id: o.id,
        order_no: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        tracking_token: o.trackingToken,
        created_at: o.createdAt,
        delivery_address: o.deliveryAddress,
        customer_name: o.customerName,
        order_items: items.map((i) => ({
          id: i.id,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: Number(i.unitPrice),
          total_price: Number(i.totalPrice),
        })),
        order_events: [],
      });
    }
    return { ok: true, orders: out };
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

export async function cancelMyOrderAction(input: {
  orderNo: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.orderNumber, input.orderNo),
          eq(orders.customerId, session.user!.id!)
        )
      )
      .limit(1);
    if (!order) return { ok: false, error: "Order not found", status: 404 };
    if (["shipped", "delivered", "cancelled"].includes(order.status)) {
      return { ok: false, error: "Order cannot be cancelled", status: 400 };
    }
    await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, order.id));
    revalidatePath("/orders");
    return { ok: true, id: order.id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cancel failed",
      status: 500,
    };
  }
}

export async function trackOrderByTokenAction(input: {
  token: string;
}): Promise<ActionResult<{ data: Record<string, unknown> }>> {
  try {
    const token = (input.token || "").trim();
    if (!token) {
      return { ok: true, data: { found: false, reason: "invalid" } };
    }
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingToken, token))
      .limit(1);
    if (!order) {
      return { ok: true, data: { found: false, reason: "invalid" } };
    }
    return {
      ok: true,
      data: {
        found: true,
        order_no: order.orderNumber,
        status: order.status,
        customer_name: order.customerName,
        total: Number(order.total),
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        created_at: order.createdAt,
        area: order.deliveryAddress,
        events: [],
        path: [],
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Track failed",
      status: 500,
    };
  }
}
