"use server";

import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  deliveries,
  deliveryEvents,
  deliveryNotifications,
  orders,
  riders,
} from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  return { ok: false, error: err instanceof Error ? err.message : "Failed" };
}

export async function listDeliverableOrdersAction() {
  try {
    await requireStaff();
    const rows = await db
      .select({
        id: orders.id,
        order_no: orders.orderNumber,
        customer_name: orders.customerName,
        phone: orders.customerPhone,
        address: orders.deliveryAddress,
        total: orders.total,
        status: orders.status,
        created_at: orders.createdAt,
      })
      .from(orders)
      .where(inArray(orders.status, ["confirmed", "processing", "shipped"]))
      .orderBy(desc(orders.createdAt))
      .limit(80);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...r,
        area: "",
        thana: "",
        phone: r.phone,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listAdminDeliveriesAction() {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(deliveries)
      .orderBy(desc(deliveries.createdAt))
      .limit(100);
    const riderIds = [...new Set(rows.map((r) => r.riderId).filter(Boolean))] as string[];
    const riderMap = new Map<string, { name: string; phone: string }>();
    if (riderIds.length) {
      const rs = await db.select().from(riders).where(inArray(riders.id, riderIds));
      for (const r of rs) riderMap.set(r.id, { name: r.name, phone: r.phone });
    }
    return {
      ok: true as const,
      data: rows.map((d) => ({
        id: d.id,
        order_id: d.orderId,
        order_no: d.orderNo,
        user_id: d.userId,
        rider_id: d.riderId,
        status: d.status,
        otp: d.otp,
        eta_minutes: d.etaMinutes,
        last_lat: d.lastLat,
        last_lng: d.lastLng,
        last_seen_at: d.lastSeenAt,
        note: d.note,
        public_token: d.publicToken,
        token_expires_at: d.tokenExpiresAt,
        token_revoked: d.tokenRevoked,
        token_scope: d.tokenScope,
        created_at: d.createdAt,
        riders: d.riderId ? riderMap.get(d.riderId) ?? null : null,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listDeliveryPathAction(deliveryId: string) {
  try {
    await requireStaff();
    const rows = await db
      .select({
        lat: deliveryEvents.lat,
        lng: deliveryEvents.lng,
        created_at: deliveryEvents.createdAt,
      })
      .from(deliveryEvents)
      .where(and(eq(deliveryEvents.deliveryId, deliveryId), isNotNull(deliveryEvents.lat)))
      .orderBy(deliveryEvents.createdAt);
    return { ok: true as const, data: rows };
  } catch (err) {
    return fail(err);
  }
}

export async function listDeliveryNotificationsAction() {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(deliveryNotifications)
      .orderBy(desc(deliveryNotifications.createdAt))
      .limit(200);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        order_no: "",
        channel: "app",
        target: r.userId,
        status_key: "",
        body: r.message,
        status: r.isRead ? "sent" : "queued",
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function markDeliveryNotificationSentAction(id: string) {
  try {
    await requireStaff();
    await db
      .update(deliveryNotifications)
      .set({ isRead: true })
      .where(eq(deliveryNotifications.id, id));
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function trackOrderPageAction(orderNo: string) {
  try {
    await requireAuth();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNo))
      .limit(1);
    if (!order) return { ok: true as const, order: null, delivery: null, events: [], notifications: [] };

    const [delivery] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.orderNo, orderNo))
      .limit(1);

    let events: unknown[] = [];
    let rider: { name: string; phone: string; vehicle: string } | null = null;
    if (delivery) {
      events = await db
        .select({
          id: deliveryEvents.id,
          status: deliveryEvents.status,
          note: deliveryEvents.note,
          created_at: deliveryEvents.createdAt,
        })
        .from(deliveryEvents)
        .where(eq(deliveryEvents.deliveryId, delivery.id))
        .orderBy(deliveryEvents.createdAt);
      if (delivery.riderId) {
        const [r] = await db.select().from(riders).where(eq(riders.id, delivery.riderId)).limit(1);
        if (r) rider = { name: r.name, phone: r.phone, vehicle: r.vehicle };
      }
    }

    return {
      ok: true as const,
      order: {
        id: order.id,
        order_no: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        customer_name: order.customerName,
        phone: order.customerPhone,
        address: order.deliveryAddress,
        created_at: order.createdAt,
        order_items: [],
        order_events: [],
      },
      delivery: delivery
        ? {
            id: delivery.id,
            status: delivery.status,
            eta_minutes: delivery.etaMinutes,
            last_lat: delivery.lastLat,
            last_lng: delivery.lastLng,
            last_seen_at: delivery.lastSeenAt,
            riders: rider,
          }
        : null,
      events,
      notifications: [],
    };
  } catch (err) {
    return fail(err);
  }
}

export async function publicTrackAction(token: string) {
  try {
    const [d] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.publicToken, token))
      .limit(1);
    if (!d || d.tokenRevoked) {
      return { found: false as const, reason: d?.tokenRevoked ? ("revoked" as const) : ("invalid" as const) };
    }
    if (d.tokenExpiresAt && d.tokenExpiresAt.getTime() < Date.now()) {
      return { found: false as const, reason: "expired" as const };
    }
    const [order] = d.orderId
      ? await db.select().from(orders).where(eq(orders.id, d.orderId)).limit(1)
      : [null];
    const events = await db
      .select({
        id: deliveryEvents.id,
        status: deliveryEvents.status,
        note: deliveryEvents.note,
        created_at: deliveryEvents.createdAt,
        lat: deliveryEvents.lat,
        lng: deliveryEvents.lng,
      })
      .from(deliveryEvents)
      .where(eq(deliveryEvents.deliveryId, d.id))
      .orderBy(deliveryEvents.createdAt);

    let rider_name: string | null = null;
    let rider_vehicle: string | null = null;
    if (d.riderId) {
      const [r] = await db.select().from(riders).where(eq(riders.id, d.riderId)).limit(1);
      if (r) {
        rider_name = r.name;
        rider_vehicle = r.vehicle;
      }
    }

    return {
      found: true as const,
      order_no: d.orderNo ?? order?.orderNumber,
      status: d.status,
      eta_minutes: d.etaMinutes,
      last_lat: d.lastLat ? Number(d.lastLat) : null,
      last_lng: d.lastLng ? Number(d.lastLng) : null,
      last_seen_at: d.lastSeenAt?.toISOString() ?? null,
      rider_name,
      rider_vehicle,
      customer_name: order?.customerName,
      total: order ? Number(order.total) : undefined,
      payment_method: order?.paymentMethod,
      payment_status: order?.paymentStatus,
      created_at: order?.createdAt?.toISOString(),
      expires_at: d.tokenExpiresAt?.toISOString() ?? null,
      scope: d.tokenScope,
      events: events.map((e) => ({
        id: e.id,
        status: e.status,
        note: e.note ?? "",
        created_at: e.created_at,
      })),
      path: events
        .filter((e) => e.lat != null && e.lng != null)
        .map((e) => ({ lat: Number(e.lat), lng: Number(e.lng), at: String(e.created_at) })),
    };
  } catch {
    return { found: false as const, reason: "invalid" as const };
  }
}
