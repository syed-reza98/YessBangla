"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { prescriptions } from "@/db/schema";
import { requireAuth } from "@/lib/session-authz";

export type GuestRxRow = {
  id: string;
  status: string;
  note: string;
  adminNote: string;
  createdAt: string;
  parsedAt: string | null;
  files: number;
  medicines: number;
};

/** Guest prescriptions keyed by phone-as-token stored in notes JSON prefix */
export const listGuestRx = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }): Promise<GuestRxRow[]> => {
    if (!data.token || data.token.length < 24) return [];
    const rows = await db
      .select()
      .from(prescriptions)
      .where(and(isNull(prescriptions.userId), eq(prescriptions.phone, data.token.slice(0, 50))))
      .orderBy(desc(prescriptions.createdAt))
      .limit(30);
    return rows.map((r) => ({
      id: r.id,
      status: r.status ?? "pending",
      note: r.notes ?? "",
      adminNote: r.reviewNotes ?? "",
      createdAt: String(r.createdAt),
      parsedAt: null,
      files: r.imageUrl ? 1 : 0,
      medicines: 0,
    }));
  });

export const deleteGuestRx = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; token: string }) => d)
  .handler(async ({ data }) => {
    if (!data.token || data.token.length < 24) throw new Error("গেস্ট কোড সঠিক নয়");
    const [row] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, data.id))
      .limit(1);
    if (!row || row.userId || row.phone !== data.token.slice(0, 50)) {
      throw new Error("প্রেসক্রিপশন পাওয়া যায়নি");
    }
    if (row.imageUrl && row.imageUrl.startsWith("/uploads/")) {
      const abs = path.join(process.cwd(), "public", row.imageUrl.replace(/^\//, ""));
      try {
        await unlink(abs);
      } catch {
        /* ignore */
      }
    }
    await db.delete(prescriptions).where(eq(prescriptions.id, data.id));
    return { ok: true };
  });

export const claimGuestRx = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    if (!data.token || data.token.length < 24) return { claimed: 0 };
    const session = await requireAuth();
    const result = await db
      .update(prescriptions)
      .set({ userId: session.user!.id! })
      .where(and(eq(prescriptions.phone, data.token.slice(0, 50)), isNull(prescriptions.userId)));
    void result;
    const claimed = await db
      .select({ c: sql<number>`count(*)` })
      .from(prescriptions)
      .where(eq(prescriptions.userId, session.user!.id!));
    return { claimed: Number(claimed[0]?.c ?? 0) };
  });
