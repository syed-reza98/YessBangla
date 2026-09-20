"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { serviceRequests, deliveries, orders } from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function bookHomeServiceAction(input: {
  serviceSlug: string;
  patientName: string;
  phone: string;
  address?: string;
  area?: string;
  scheduledDate?: string;
  slot?: string;
  duration?: string;
  note?: string;
  paymentMethod?: string;
}): Promise<ActionResult<{ request_no: string; id: string }>> {
  try {
    const session = await requireAuth();
    if (!input.serviceSlug || !input.patientName?.trim() || !input.phone?.trim()) {
      return { ok: false, error: "Missing required fields", status: 400 };
    }
    const id = crypto.randomUUID();
    const requestNo = `SRV-${Date.now().toString().slice(-8)}`;
    await db.insert(serviceRequests).values({
      id,
      requestNo,
      userId: session.user!.id!,
      serviceSlug: input.serviceSlug,
      patientName: input.patientName.trim().slice(0, 150),
      phone: input.phone.trim().slice(0, 50),
      address: input.address || null,
      area: input.area || null,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      slot: input.slot || null,
      duration: input.duration || null,
      note: input.note || null,
      paymentMethod: input.paymentMethod || null,
      status: "pending",
    });
    revalidatePath("/home-services");
    revalidatePath("/admin");
    return { ok: true, request_no: requestNo, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Booking failed",
      status: 500,
    };
  }
}

export async function assignDeliveryAction(input: {
  orderId: string;
  riderId: string;
  etaMinutes?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(deliveries).values({
      id,
      orderId: input.orderId,
      riderId: input.riderId,
      status: "assigned",
      etaMinutes: input.etaMinutes ?? 60,
    });
    await db
      .update(orders)
      .set({ status: "shipped" })
      .where(eq(orders.id, input.orderId));
    revalidatePath("/admin/delivery");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Assign failed",
      status: 500,
    };
  }
}

export async function riderUpdateDeliveryAction(input: {
  deliveryId: string;
  status: string;
  note?: string;
  lat?: number;
  lng?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const [row] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, input.deliveryId))
      .limit(1);
    if (!row) return { ok: false, error: "Not found", status: 404 };
    if (row.riderId && row.riderId !== session.user!.id) {
      const role = (session.user as { role?: string }).role || "";
      if (!["admin", "super_admin", "staff"].includes(role)) {
        return { ok: false, error: "Forbidden", status: 403 };
      }
    }
    await db
      .update(deliveries)
      .set({
        status: input.status,
        note: input.note || row.note,
        lastLat: input.lat != null ? String(input.lat) : row.lastLat,
        lastLng: input.lng != null ? String(input.lng) : row.lastLng,
        lastSeenAt: new Date(),
      })
      .where(eq(deliveries.id, input.deliveryId));

    if (input.status === "delivered") {
      await db
        .update(orders)
        .set({ status: "delivered" })
        .where(eq(orders.id, row.orderId));
    }
    revalidatePath("/delivery");
    revalidatePath("/admin/delivery");
    return { ok: true, id: input.deliveryId };
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

export async function setDeliveryEtaAction(input: {
  deliveryId: string;
  etaMinutes: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const eta = Math.round(Number(input.etaMinutes));
    if (!input.deliveryId || !Number.isFinite(eta) || eta <= 0) {
      return { ok: false, error: "Valid ETA required", status: 400 };
    }
    await db
      .update(deliveries)
      .set({ etaMinutes: eta })
      .where(eq(deliveries.id, input.deliveryId));
    revalidatePath("/admin/delivery");
    revalidatePath("/delivery");
    return { ok: true, id: input.deliveryId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "ETA update failed",
      status: 500,
    };
  }
}

/** Rider GPS ping — updates lat/lng without changing status. */
export async function riderPingLocationAction(input: {
  deliveryId: string;
  lat: number;
  lng: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const [row] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, input.deliveryId))
      .limit(1);
    if (!row) return { ok: false, error: "Not found", status: 404 };
    if (row.riderId && row.riderId !== session.user!.id) {
      const role = (session.user as { role?: string }).role || "";
      if (!["admin", "super_admin", "staff"].includes(role)) {
        return { ok: false, error: "Forbidden", status: 403 };
      }
    }
    await db
      .update(deliveries)
      .set({
        lastLat: String(input.lat),
        lastLng: String(input.lng),
        lastSeenAt: new Date(),
      })
      .where(eq(deliveries.id, input.deliveryId));
    return { ok: true, id: input.deliveryId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ping failed",
      status: 500,
    };
  }
}
