"use server";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  deliveryFeedback,
  deliveryOrderEvents,
  deliveryOrderItems,
  deliveryOrders,
  deliveryProofs,
  deliveryRiders,
  deliveryZones,
  customerNotifications,
} from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";
import { createSaleAction } from "@/actions/pos";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function money(n: number | undefined, fallback = "0.00") {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return fallback;
  return Number(n).toFixed(2);
}

async function appendEvent(
  orderId: string,
  status: string,
  note?: string | null,
  actorId?: string | null
) {
  await db.insert(deliveryOrderEvents).values({
    id: crypto.randomUUID(),
    orderId,
    status,
    note: note ?? null,
    actorId: actorId ?? null,
  });
}

export async function listDeliveryOrdersAction(input?: {
  status?: string;
  limit?: number;
}): Promise<ActionResult<{ orders: unknown[] }>> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(deliveryOrders)
      .orderBy(desc(deliveryOrders.createdAt))
      .limit(input?.limit ?? 100);
    const filtered = input?.status
      ? rows.filter((r) => r.status === input.status)
      : rows;
    return {
      ok: true,
      orders: filtered.map((r) => ({
        id: r.id,
        order_no: r.orderNo,
        status: r.status,
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        address: r.address ?? r.deliveryAddress,
        area: r.area,
        note: r.note,
        slot: r.slot,
        payment_method: r.paymentMethod,
        subtotal: Number(r.subtotal),
        discount: Number(r.discount),
        delivery_fee: Number(r.deliveryFee ?? r.deliveryCharge ?? 0),
        total: Number(r.total),
        rider_id: r.riderId,
        sale_id: r.saleId,
        branch_id: r.branchId,
        tracking_code: r.trackingCode,
        eta_minutes: r.etaMinutes,
        created_at:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
        updated_at:
          r.updatedAt instanceof Date
            ? r.updatedAt.toISOString()
            : String(r.updatedAt),
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

export async function updateDeliveryOrderStatusAction(input: {
  id: string;
  status: string;
  note?: string | null;
  riderId?: string | null;
  etaMinutes?: number | null;
}): Promise<ActionResult> {
  try {
    const session = await requireStaff();
    const set: Partial<typeof deliveryOrders.$inferInsert> = {
      status: input.status,
    };
    if (input.riderId !== undefined) set.riderId = input.riderId;
    if (input.etaMinutes !== undefined) set.etaMinutes = input.etaMinutes;
    if (input.status === "delivered") set.deliveredAt = new Date();
    await db
      .update(deliveryOrders)
      .set(set)
      .where(eq(deliveryOrders.id, input.id));
    await appendEvent(
      input.id,
      input.status,
      input.note,
      session.user!.id!
    );
    revalidatePath("/delivery-orders");
    revalidatePath("/track");
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

export async function listRidersAction(): Promise<
  ActionResult<{ riders: unknown[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(deliveryRiders)
      .orderBy(asc(deliveryRiders.name));
    return {
      ok: true,
      riders: rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        vehicle_type: r.vehicleType,
        nid: r.nid,
        branch_id: r.branchId,
        note: r.note,
        current_lat: r.currentLat != null ? Number(r.currentLat) : null,
        current_lng: r.currentLng != null ? Number(r.currentLng) : null,
        location_updated_at: r.locationUpdatedAt
          ? r.locationUpdatedAt instanceof Date
            ? r.locationUpdatedAt.toISOString()
            : String(r.locationUpdatedAt)
          : null,
        is_active: r.isActive,
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

export async function upsertRiderAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      name: String(input.name || "Rider"),
      phone: String(input.phone || ""),
      vehicleType: String(input.vehicle_type || "bike"),
      nid: (input.nid as string) ?? null,
      branchId: (input.branch_id as string) ?? null,
      note: (input.note as string) ?? null,
      isActive: input.is_active == null ? true : Boolean(input.is_active),
      currentLat:
        input.current_lat != null ? money(Number(input.current_lat)) : null,
      currentLng:
        input.current_lng != null ? money(Number(input.current_lng)) : null,
      locationUpdatedAt: input.current_lat != null ? new Date() : undefined,
    };
    const [existing] = input.id
      ? await db
          .select()
          .from(deliveryRiders)
          .where(eq(deliveryRiders.id, id))
          .limit(1)
      : [];
    if (existing) {
      await db.update(deliveryRiders).set(values).where(eq(deliveryRiders.id, id));
    } else {
      await db.insert(deliveryRiders).values({ id, ...values });
    }
    revalidatePath("/riders");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
      status: 500,
    };
  }
}

export async function deleteRiderAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(deliveryRiders).where(eq(deliveryRiders.id, input.id));
    revalidatePath("/riders");
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

export async function listDeliveryZonesAction(): Promise<
  ActionResult<{ zones: unknown[] }>
> {
  try {
    const rows = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder));
    return {
      ok: true,
      zones: rows.map((z) => ({
        id: z.id,
        name: z.name,
        name_en: z.nameEn ?? z.name,
        name_bn: z.nameBn,
        fee: Number(z.fee),
        delivery_fee: Number(z.deliveryFee ?? z.fee),
        min_order: Number(z.minOrder ?? 0),
        free_delivery_above: z.freeDeliveryAbove
          ? Number(z.freeDeliveryAbove)
          : null,
        eta_minutes: z.etaMinutes,
        sort_order: z.sortOrder,
        branch_id: z.branchId,
        is_active: z.isActive,
      })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function upsertDeliveryZoneAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const id = String(input.id || crypto.randomUUID());
    const fee = money(Number(input.delivery_fee ?? input.fee ?? 0));
    const values = {
      name: String(input.name_en || input.name || "Zone"),
      nameEn: (input.name_en as string) ?? String(input.name || "Zone"),
      nameBn: (input.name_bn as string) ?? null,
      fee,
      deliveryFee: fee,
      minOrder: money(Number(input.min_order ?? 0)),
      freeDeliveryAbove:
        input.free_delivery_above != null
          ? money(Number(input.free_delivery_above))
          : null,
      etaMinutes:
        input.eta_minutes != null ? Number(input.eta_minutes) : null,
      sortOrder: Number(input.sort_order ?? 0),
      branchId: (input.branch_id as string) ?? null,
      isActive: input.is_active == null ? true : Boolean(input.is_active),
    };
    const [existing] = input.id
      ? await db
          .select()
          .from(deliveryZones)
          .where(eq(deliveryZones.id, id))
          .limit(1)
      : [];
    if (existing) {
      await db.update(deliveryZones).set(values).where(eq(deliveryZones.id, id));
    } else {
      await db.insert(deliveryZones).values({ id, ...values });
    }
    revalidatePath("/delivery-zones");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
      status: 500,
    };
  }
}

export async function deleteDeliveryZoneAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(deliveryZones).where(eq(deliveryZones.id, input.id));
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

/** Public track by order number + phone (replaces track_delivery_order RPC) */
export async function trackDeliveryOrderAction(input: {
  orderNo: number;
  phone: string;
}): Promise<ActionResult<{ order: unknown; events: unknown[]; proofs: unknown[] }>> {
  try {
    const phone = input.phone.trim();
    const [row] = await db
      .select()
      .from(deliveryOrders)
      .where(
        and(
          eq(deliveryOrders.orderNo, input.orderNo),
          eq(deliveryOrders.customerPhone, phone)
        )
      )
      .limit(1);
    if (!row) return { ok: false, error: "Order not found", status: 404 };

    let riderName: string | null = null;
    let riderPhone: string | null = null;
    let riderVehicle: string | null = null;
    let riderLat: number | null = null;
    let riderLng: number | null = null;
    let riderLocationAt: string | null = null;
    if (row.riderId) {
      const [rider] = await db
        .select()
        .from(deliveryRiders)
        .where(eq(deliveryRiders.id, row.riderId))
        .limit(1);
      if (rider) {
        riderName = rider.name;
        riderPhone = rider.phone;
        riderVehicle = rider.vehicleType;
        riderLat = rider.currentLat ? Number(rider.currentLat) : null;
        riderLng = rider.currentLng ? Number(rider.currentLng) : null;
        riderLocationAt = rider.locationUpdatedAt
          ? String(rider.locationUpdatedAt)
          : null;
      }
    }

    const events = await db
      .select()
      .from(deliveryOrderEvents)
      .where(eq(deliveryOrderEvents.orderId, row.id))
      .orderBy(asc(deliveryOrderEvents.createdAt));
    const proofs = await db
      .select()
      .from(deliveryProofs)
      .where(eq(deliveryProofs.orderId, row.id))
      .orderBy(desc(deliveryProofs.createdAt));

    return {
      ok: true,
      order: {
        order_no: row.orderNo,
        status: row.status,
        total: Number(row.total),
        created_at: row.createdAt,
        updated_at: row.updatedAt,
        slot: row.slot,
        area: row.area,
        payment_method: row.paymentMethod,
        rider_name: riderName,
        rider_phone: riderPhone,
        rider_vehicle: riderVehicle,
        eta_minutes: row.etaMinutes,
        rider_lat: riderLat,
        rider_lng: riderLng,
        rider_location_at: riderLocationAt,
      },
      events: events.map((e) => ({
        id: e.id,
        status: e.status,
        note: e.note,
        created_at: e.createdAt,
      })),
      proofs: proofs.map((p) => ({
        kind: p.kind,
        file_path: p.filePath.startsWith("/") ? p.filePath : `/uploads/${p.filePath}`,
        receiver_name: p.receiverName,
        note: p.note,
        created_at: p.createdAt,
        captured_at: p.createdAt,
        lat: p.lat ? Number(p.lat) : null,
        lng: p.lng ? Number(p.lng) : null,
        status: p.status,
      })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Track failed",
      status: 500,
    };
  }
}

export async function submitDeliveryFeedbackAction(input: {
  orderNo: number;
  phone: string;
  kind: string;
  message?: string | null;
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
    const isIssue = input.kind === "issue";
    const dueAt = new Date(
      Date.now() + (isIssue ? 2 : 24) * 60 * 60 * 1000
    );
    await db.insert(deliveryFeedback).values({
      id: crypto.randomUUID(),
      orderId: row.id,
      orderNo: row.orderNo,
      phone: input.phone.trim(),
      kind: input.kind,
      message: input.message ?? null,
      severity: isIssue ? "high" : "normal",
      dueAt,
      resolved: false,
      escalated: false,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Feedback failed",
      status: 500,
    };
  }
}

export async function listDeliveryProofsAction(input: {
  orderId: string;
}): Promise<ActionResult<{ proofs: unknown[] }>> {
  try {
    await requireStaff();
    const proofs = await db
      .select()
      .from(deliveryProofs)
      .where(eq(deliveryProofs.orderId, input.orderId))
      .orderBy(desc(deliveryProofs.createdAt));
    return {
      ok: true,
      proofs: proofs.map((p) => ({
        id: p.id,
        kind: p.kind,
        file_path: p.filePath.startsWith("/")
          ? p.filePath
          : `/uploads/${p.filePath}`,
        receiver_name: p.receiverName,
        note: p.note,
        created_at:
          p.createdAt instanceof Date
            ? p.createdAt.toISOString()
            : String(p.createdAt),
        captured_at:
          p.createdAt instanceof Date
            ? p.createdAt.toISOString()
            : String(p.createdAt),
        lat: p.lat ? Number(p.lat) : null,
        lng: p.lng ? Number(p.lng) : null,
        accuracy_m: null,
        status: p.status ?? "ok",
        reject_reason: null,
        verified_at: null,
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

export async function uploadDeliveryProofAction(
  formData: FormData
): Promise<ActionResult<{ id: string; url: string }>> {
  try {
    await requireStaff();
    const orderId = String(formData.get("orderId") || "");
    const file = formData.get("file");
    const receiverName = String(formData.get("receiverName") || "").slice(0, 150);
    const note = String(formData.get("note") || "");
    const kind = String(formData.get("kind") || "photo").slice(0, 50);
    const latRaw = formData.get("lat");
    const lngRaw = formData.get("lng");
    const lat =
      latRaw != null && String(latRaw) !== ""
        ? Number(latRaw).toFixed(7)
        : null;
    const lng =
      lngRaw != null && String(lngRaw) !== ""
        ? Number(lngRaw).toFixed(7)
        : null;
    if (!orderId) return { ok: false, error: "orderId required", status: 400 };
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "File required", status: 400 };
    }
    const dir = path.join(process.cwd(), "public", "uploads", "delivery-proofs");
    await mkdir(dir, { recursive: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase().slice(0, 80);
    const fileName = `${Date.now()}-${safe}`;
    await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
    const rel = `delivery-proofs/${fileName}`;
    const id = crypto.randomUUID();
    await db.insert(deliveryProofs).values({
      id,
      orderId,
      kind: kind === "signature" ? "signature" : "photo",
      filePath: rel,
      receiverName: receiverName || null,
      note: note || null,
      lat,
      lng,
      status: "ok",
    });
    return { ok: true, id, url: `/uploads/${rel}` };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
      status: 500,
    };
  }
}

export async function listOrderEventsAction(input: {
  orderId: string;
}): Promise<ActionResult<{ events: unknown[] }>> {
  try {
    await requireStaff();
    const events = await db
      .select()
      .from(deliveryOrderEvents)
      .where(eq(deliveryOrderEvents.orderId, input.orderId))
      .orderBy(asc(deliveryOrderEvents.createdAt));
    return {
      ok: true,
      events: events.map((e) => ({
        id: e.id,
        order_id: e.orderId,
        status: e.status,
        note: e.note,
        event_type: "status",
        from_value: null,
        to_value: e.status,
        actor_name: e.note,
        created_at:
          e.createdAt instanceof Date
            ? e.createdAt.toISOString()
            : String(e.createdAt),
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

export async function getDeliveryOrderItemsAction(input: {
  orderId: string;
}): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    const items = await db
      .select()
      .from(deliveryOrderItems)
      .where(eq(deliveryOrderItems.orderId, input.orderId));
    return {
      ok: true,
      items: items.map((i) => ({
        id: i.id,
        order_id: i.orderId,
        product_id: i.productId,
        name_snapshot: i.nameSnapshot,
        unit_price: Number(i.unitPrice),
        quantity: Number(i.quantity),
        line_total: Number(i.lineTotal),
      })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Items failed",
      status: 500,
    };
  }
}

export async function verifyDeliveryProofAction(input: {
  proofId: string;
  status: "approved" | "rejected";
  reason?: string | null;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db
      .update(deliveryProofs)
      .set({
        status: input.status,
        ...(input.status === "rejected" && input.reason
          ? { note: input.reason.slice(0, 500) }
          : {}),
      })
      .where(eq(deliveryProofs.id, input.proofId));
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Verify failed",
      status: 500,
    };
  }
}

export async function deleteDeliveryProofAction(input: {
  proofId: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(deliveryProofs).where(eq(deliveryProofs.id, input.proofId));
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

export async function convertDeliveryOrderToSaleAction(input: {
  orderId: string;
  branchId: string;
}): Promise<ActionResult<{ saleId: string; invoiceNumber: string }>> {
  try {
    await requireStaff();
    const [order] = await db
      .select()
      .from(deliveryOrders)
      .where(eq(deliveryOrders.id, input.orderId))
      .limit(1);
    if (!order) return { ok: false, error: "Order not found", status: 404 };
    if (order.saleId) {
      return { ok: false, error: "Already converted", status: 400 };
    }
    const items = await db
      .select()
      .from(deliveryOrderItems)
      .where(eq(deliveryOrderItems.orderId, input.orderId));
    if (!items.length) {
      return { ok: false, error: "No items", status: 400 };
    }
    const missing = items.filter((i) => !i.productId);
    if (missing.length) {
      return {
        ok: false,
        error: "Some lines lack product_id — cannot convert",
        status: 400,
      };
    }

    const invoiceNumber = `DLV-${order.orderNo}`;
    const payMethod =
      order.paymentMethod === "cod" ? "cash" : order.paymentMethod || "cash";
    const paid =
      order.paymentMethod === "cod" ? 0 : Number(order.total);

    const sale = await createSaleAction({
      invoiceNumber,
      branchId: input.branchId || order.branchId || "MAIN",
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: 0,
      total: Number(order.total),
      paidAmount: paid,
      dueAmount: Number(order.total) - paid,
      paymentMethod: payMethod,
      status: "final",
      notes: `Delivery order #${order.orderNo}`,
      items: items.map((i) => ({
        productId: i.productId!,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.lineTotal),
      })),
      payment: {
        method: payMethod,
        amount: paid || Number(order.total),
      },
      decrementStock: true,
    });

    if (!sale.ok) {
      return { ok: false, error: sale.error, status: sale.status };
    }

    await db
      .update(deliveryOrders)
      .set({ saleId: sale.saleId, status: "delivered" })
      .where(eq(deliveryOrders.id, order.id));
    await appendEvent(order.id, "delivered", `Converted to sale ${sale.invoiceNumber}`);
    revalidatePath("/delivery-orders");
    revalidatePath("/sales");
    return { ok: true, saleId: sale.saleId, invoiceNumber: sale.invoiceNumber };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Convert failed",
      status: 500,
    };
  }
}

export async function listDeliveryFeedbackAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(deliveryFeedback)
      .orderBy(desc(deliveryFeedback.createdAt))
      .limit(200);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        order_id: r.orderId,
        order_no: r.orderNo,
        customer_phone: r.phone,
        kind: r.kind,
        message: r.message,
        severity: r.severity,
        resolved: Boolean(r.resolved),
        resolved_at:
          r.resolvedAt instanceof Date
            ? r.resolvedAt.toISOString()
            : r.resolvedAt
              ? String(r.resolvedAt)
              : null,
        escalated: Boolean(r.escalated),
        escalated_at:
          r.escalatedAt instanceof Date
            ? r.escalatedAt.toISOString()
            : r.escalatedAt
              ? String(r.escalatedAt)
              : null,
        due_at:
          r.dueAt instanceof Date
            ? r.dueAt.toISOString()
            : r.dueAt
              ? String(r.dueAt)
              : null,
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
      error: err instanceof Error ? err.message : "List feedback failed",
      status: 500,
    };
  }
}

export async function resolveDeliveryFeedbackAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db
      .update(deliveryFeedback)
      .set({ resolved: true, resolvedAt: new Date() })
      .where(eq(deliveryFeedback.id, input.id));
    revalidatePath("/delivery-orders");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Resolve failed",
      status: 500,
    };
  }
}

/** Escalate overdue unresolved feedback and queue staff notifications. */
export async function escalateOverdueFeedbackAction(): Promise<
  ActionResult<{ count: number }>
> {
  try {
    await requireStaff();
    const overdue = await db
      .select()
      .from(deliveryFeedback)
      .where(
        and(
          eq(deliveryFeedback.resolved, false),
          eq(deliveryFeedback.escalated, false),
          sql`${deliveryFeedback.dueAt} IS NOT NULL AND ${deliveryFeedback.dueAt} < NOW()`
        )
      );

    let n = 0;
    for (const r of overdue) {
      await db
        .update(deliveryFeedback)
        .set({
          escalated: true,
          escalatedAt: new Date(),
          severity: "critical",
        })
        .where(eq(deliveryFeedback.id, r.id));

      await db.insert(customerNotifications).values({
        id: crypto.randomUUID(),
        orderId: r.orderId,
        orderNo: r.orderNo,
        customerPhone: r.phone,
        channel: "sms",
        title: "SLA অতিক্রম: গ্রাহক ফিডব্যাক",
        body:
          `অর্ডার #${r.orderNo ?? "-"} এর ` +
          `${r.kind === "issue" ? "সমস্যা রিপোর্ট" : "ফিডব্যাক"} ` +
          `নির্ধারিত সময়ে সমাধান হয়নি। দ্রুত ব্যবস্থা নিন।`,
        isSent: false,
        isRead: false,
        sendStatus: "pending",
      });
      n += 1;
    }

    revalidatePath("/delivery-orders");
    return { ok: true, count: n };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Escalate failed",
      status: 500,
    };
  }
}
