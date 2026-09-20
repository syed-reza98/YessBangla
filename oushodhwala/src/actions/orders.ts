"use server";

import { desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orders, orderItems, products } from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

export type PlaceOrderItem = {
  id: string;
  kind?: string;
  name?: string;
  price: number;
  qty: number;
};

export type PlaceOrderInput = {
  items: PlaceOrderItem[];
  customerName: string;
  phone: string;
  address: string;
  slot?: string;
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: string;
  paymentRef?: string;
  branchId?: string;
};

export type PlaceOrderResult =
  | { ok: true; order_no: string; orderId: string; tracking_token: string }
  | { ok: false; error: string; status?: number };

function money(n: number | undefined, fallback = "0.00") {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return fallback;
  return Number(n).toFixed(2);
}

export async function placeOrderAction(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  try {
    const session = await requireAuth();
    const customerId = session.user!.id!;

    const productLines = (input.items || []).filter(
      (i) => (i.kind || "product") === "product" && i.qty > 0
    );
    if (productLines.length === 0) {
      return { ok: false, error: "Cart is empty", status: 400 };
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `OW-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 100)}`;
    const trackingToken = `TRK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const subtotal = productLines.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
    const deliveryFee = Number(input.deliveryFee || 0);
    const discount = Number(input.discount || 0);
    const total = Math.max(0, subtotal + deliveryFee - discount);

    await db.transaction(async (tx) => {
      for (const line of productLines) {
        const [prod] = await tx
          .select()
          .from(products)
          .where(sql`${products.id} = ${line.id}`)
          .limit(1);
        if (!prod) {
          throw new Error(`OUT_OF_STOCK:${line.name || line.id}:0`);
        }
        if (Number(prod.stock) < Number(line.qty)) {
          throw new Error(
            `OUT_OF_STOCK:${prod.name}:${prod.stock}`
          );
        }
      }

      await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        customerId,
        customerName: input.customerName?.slice(0, 150) || "Customer",
        customerPhone: input.phone?.slice(0, 50) || "",
        deliveryAddress: input.address,
        subtotal: money(subtotal),
        discount: money(discount),
        deliveryFee: money(deliveryFee),
        total: money(total),
        status: "pending",
        paymentMethod: input.paymentMethod || "cod",
        paymentStatus:
          input.paymentMethod && input.paymentMethod !== "cod"
            ? "pending_verification"
            : "unpaid",
        paymentRef: input.paymentRef?.slice(0, 150) || null,
        branchId: input.branchId || null,
        trackingToken,
      });

      for (const line of productLines) {
        const unit = Number(line.price);
        const qty = Number(line.qty);
        await tx.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId,
          productId: line.id,
          quantity: qty,
          unitPrice: money(unit),
          totalPrice: money(unit * qty),
        });
        await tx.execute(
          sql`UPDATE products SET stock = stock - ${qty} WHERE id = ${line.id} AND stock >= ${qty}`
        );
      }
    });

    revalidatePath("/orders");
    revalidatePath("/admin");

    return {
      ok: true,
      order_no: orderNumber,
      orderId,
      tracking_token: trackingToken,
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "AUTH_REQUIRED", status: err.status };
    }
    const message = err instanceof Error ? err.message : "Order failed";
    return { ok: false, error: message, status: 500 };
  }
}

export async function adminSetOrderStatusAction(
  orderId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireStaff();
    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    revalidatePath("/admin");
    revalidatePath("/orders");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to update order status" };
  }
}

export async function getAdminOrdersAction() {
  await requireStaff();
  const orderList = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  if (orderList.length === 0) return [];

  const orderIds = orderList.map((o) => o.id);
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const itemsByOrder = new Map<string, any[]>();
  for (const item of items) {
    const arr = itemsByOrder.get(item.orderId) || [];
    arr.push({
      id: item.id,
      name: (item as any).name || "Item",
      qty: item.quantity,
      price: item.unitPrice,
      total: item.totalPrice,
    });
    itemsByOrder.set(item.orderId, arr);
  }

  return orderList.map((o) => ({
    ...o,
    order_no: o.orderNumber,
    customer_name: o.customerName,
    phone: o.customerPhone,
    address: o.deliveryAddress,
    payment_method: o.paymentMethod || "cod",
    payment_status: o.paymentStatus || "unpaid",
    order_items: itemsByOrder.get(o.id) || [],
  }));
}
