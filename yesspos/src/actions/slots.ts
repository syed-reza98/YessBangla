"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { deliveryOrders, deliverySlotCapacity } from "@/db/schema";

export type SlotAvailability = {
  slot_id: string;
  capacity: number;
  booked: number;
  available: number;
  is_active: boolean;
};

const DEFAULT_SLOTS: Array<{ slotId: string; capacity: number }> = [
  { slotId: "08:00-11:00", capacity: 25 },
  { slotId: "11:00-14:00", capacity: 30 },
  { slotId: "14:00-17:00", capacity: 30 },
  { slotId: "17:00-20:00", capacity: 25 },
];

async function ensureSlotCapacityRows() {
  const existing = await db.select().from(deliverySlotCapacity).limit(1);
  if (existing.length > 0) return;
  for (const s of DEFAULT_SLOTS) {
    await db.insert(deliverySlotCapacity).values({
      id: crypto.randomUUID(),
      slotId: s.slotId,
      capacity: s.capacity,
      isActive: true,
    });
  }
}

/** Live capacity for one delivery day (public-safe). */
export async function slotAvailabilityAction(
  day: string
): Promise<
  | { ok: true; rows: SlotAvailability[] }
  | { ok: false; error: string; status?: number }
> {
  try {
    if (!day) {
      return { ok: false, error: "day required", status: 400 };
    }
    await ensureSlotCapacityRows();

    const slots = await db.select().from(deliverySlotCapacity);
    const bookedRows = await db
      .select({
        slotId: deliveryOrders.slotId,
        cnt: sql<number>`count(*)`.mapWith(Number),
      })
      .from(deliveryOrders)
      .where(
        and(
          eq(deliveryOrders.slotDate, day),
          ne(deliveryOrders.status, "cancelled")
        )
      )
      .groupBy(deliveryOrders.slotId);

    const bookedMap = new Map(
      bookedRows
        .filter((r) => r.slotId)
        .map((r) => [r.slotId as string, Number(r.cnt) || 0])
    );

    const rows: SlotAvailability[] = slots
      .map((s) => {
        const booked = bookedMap.get(s.slotId) ?? 0;
        const capacity = Number(s.capacity) || 0;
        return {
          slot_id: s.slotId,
          capacity,
          booked,
          available: Math.max(capacity - booked, 0),
          is_active: Boolean(s.isActive),
        };
      })
      .sort((a, b) => a.slot_id.localeCompare(b.slot_id));

    return { ok: true, rows };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Slot availability failed",
      status: 500,
    };
  }
}
