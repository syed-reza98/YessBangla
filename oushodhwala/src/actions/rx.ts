"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  prescriptions,
  prescriptionShares,
  rxRetention,
} from "@/db/schema";
import { requireAuth, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export type RxScopes = {
  medicines: boolean;
  dosage: boolean;
  prices: boolean;
  patient: boolean;
  advice: boolean;
};

export async function getRxSettingsAction(): Promise<
  ActionResult<{ days: number; notifyEmail: boolean }>
> {
  try {
    const session = await requireAuth();
    const [row] = await db
      .select()
      .from(rxRetention)
      .where(eq(rxRetention.userId, session.user!.id!))
      .limit(1);
    return {
      ok: true,
      days: row?.days ?? 0,
      notifyEmail: row?.notifyEmail ?? true,
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Settings failed",
      status: 500,
    };
  }
}

export async function saveRxSettingsAction(input: {
  days: number;
  notifyEmail: boolean;
}): Promise<ActionResult<{ days: number; notifyEmail: boolean }>> {
  try {
    const session = await requireAuth();
    const days = Math.max(0, Math.min(3650, Math.round(input.days)));
    const userId = session.user!.id!;
    const [existing] = await db
      .select()
      .from(rxRetention)
      .where(eq(rxRetention.userId, userId))
      .limit(1);
    if (existing) {
      await db
        .update(rxRetention)
        .set({ days, notifyEmail: input.notifyEmail })
        .where(eq(rxRetention.userId, userId));
    } else {
      await db.insert(rxRetention).values({
        id: crypto.randomUUID(),
        userId,
        days,
        notifyEmail: input.notifyEmail,
      });
    }
    return { ok: true, days, notifyEmail: input.notifyEmail };
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

export async function deleteRxAction(input: {
  id: string;
}): Promise<ActionResult<{ deleted: number }>> {
  try {
    const session = await requireAuth();
    const [row] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, input.id),
          eq(prescriptions.userId, session.user!.id!)
        )
      )
      .limit(1);
    if (!row) return { ok: false, error: "Not found", status: 404 };
    if (row.imageUrl?.startsWith("/uploads/")) {
      const abs = path.join(process.cwd(), "public", row.imageUrl.replace(/^\//, ""));
      try {
        await unlink(abs);
      } catch {
        /* may already be gone */
      }
    }
    await db.delete(prescriptionShares).where(eq(prescriptionShares.prescriptionId, row.id));
    await db.delete(prescriptions).where(eq(prescriptions.id, row.id));
    revalidatePath("/prescription");
    return { ok: true, deleted: 1 };
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

export async function createRxShareAction(input: {
  prescriptionId: string;
  hours: number;
  scopes: RxScopes;
}): Promise<
  ActionResult<{
    share: {
      id: string;
      token: string;
      expiresAt: string;
      revoked: boolean;
      views: number;
      createdAt: string;
      scopes: RxScopes;
    };
  }>
> {
  try {
    const session = await requireAuth();
    const hours = Math.min(Math.max(Math.round(input.hours) || 24, 1), 24 * 30);
    const [rx] = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          eq(prescriptions.id, input.prescriptionId),
          eq(prescriptions.userId, session.user!.id!)
        )
      )
      .limit(1);
    if (!rx) return { ok: false, error: "Prescription not found", status: 404 };
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "").slice(0, 40);
    const expiresAt = new Date(Date.now() + hours * 3600_000);
    const id = crypto.randomUUID();
    await db.insert(prescriptionShares).values({
      id,
      prescriptionId: input.prescriptionId,
      userId: session.user!.id!,
      token,
      scopes: input.scopes,
      expiresAt,
    });
    return {
      ok: true,
      share: {
        id,
        token,
        expiresAt: expiresAt.toISOString(),
        revoked: false,
        views: 0,
        createdAt: new Date().toISOString(),
        scopes: input.scopes,
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Share failed",
      status: 500,
    };
  }
}

export async function listRxSharesAction(input: {
  prescriptionId: string;
}): Promise<ActionResult<{ shares: unknown[] }>> {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(prescriptionShares)
      .where(
        and(
          eq(prescriptionShares.prescriptionId, input.prescriptionId),
          eq(prescriptionShares.userId, session.user!.id!)
        )
      )
      .orderBy(desc(prescriptionShares.createdAt));
    return {
      ok: true,
      shares: rows.map((r) => ({
        id: r.id,
        token: r.token,
        expiresAt: r.expiresAt,
        revoked: r.revoked,
        views: r.views,
        createdAt: r.createdAt,
        scopes: r.scopes,
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

export async function revokeRxShareAction(input: {
  shareId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await db
      .update(prescriptionShares)
      .set({ revoked: true })
      .where(
        and(
          eq(prescriptionShares.id, input.shareId),
          eq(prescriptionShares.userId, session.user!.id!)
        )
      );
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Revoke failed",
      status: 500,
    };
  }
}

export async function openRxShareAction(input: {
  token: string;
}): Promise<ActionResult<{ prescriptionId: string; scopes: unknown }>> {
  try {
    const [share] = await db
      .select()
      .from(prescriptionShares)
      .where(eq(prescriptionShares.token, input.token))
      .limit(1);
    if (!share || share.revoked) {
      return { ok: false, error: "Invalid or revoked", status: 404 };
    }
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return { ok: false, error: "Expired", status: 410 };
    }
    await db
      .update(prescriptionShares)
      .set({ views: (share.views ?? 0) + 1 })
      .where(eq(prescriptionShares.id, share.id));
    return {
      ok: true,
      prescriptionId: share.prescriptionId,
      scopes: share.scopes,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Open failed",
      status: 500,
    };
  }
}
