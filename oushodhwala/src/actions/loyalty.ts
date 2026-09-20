"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { loyaltyAccounts, loyaltyTransactions } from "@/db/schema";
import { requireAuth, requireAdmin, AuthError } from "@/lib/session-authz";

export type LoyaltyResult =
  | { ok: true; balance: number }
  | { ok: false; error: string; status?: number };

async function ensureAccount(userId: string) {
  const [row] = await db
    .select()
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.userId, userId))
    .limit(1);
  if (row) return row;
  const id = crypto.randomUUID();
  await db.insert(loyaltyAccounts).values({
    id,
    userId,
    points: 0,
  });
  const [created] = await db
    .select()
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.id, id))
    .limit(1);
  return created!;
}

export async function getMyLoyaltyAction(): Promise<
  | { ok: true; balance: number; accountId: string }
  | { ok: false; error: string; status?: number }
> {
  try {
    const session = await requireAuth();
    const account = await ensureAccount(session.user!.id!);
    return { ok: true, balance: Number(account.points || 0), accountId: account.id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Loyalty lookup failed",
      status: 500,
    };
  }
}

export async function redeemLoyaltyAction(input: {
  points: number;
  orderId?: string;
  note?: string;
}): Promise<LoyaltyResult> {
  try {
    const session = await requireAuth();
    const points = Math.floor(Number(input.points || 0));
    if (points <= 0) return { ok: true, balance: 0 };

    const userId = session.user!.id!;
    let newBalance = 0;

    await db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.userId, userId))
        .limit(1);
      const current = Number(account?.points || 0);
      if (current < points) {
        throw new Error(`Insufficient loyalty points (have ${current}, need ${points})`);
      }
      if (!account) {
        throw new Error("Loyalty account missing");
      }
      newBalance = current - points;
      await tx
        .update(loyaltyAccounts)
        .set({ points: newBalance, updatedAt: new Date() })
        .where(eq(loyaltyAccounts.id, account.id));
      await tx.insert(loyaltyTransactions).values({
        id: crypto.randomUUID(),
        accountId: account.id,
        userId,
        points: -points,
        kind: "redeem",
        orderId: input.orderId || null,
        note: input.note || null,
      });
    });

    revalidatePath("/checkout");
    revalidatePath("/account");
    return { ok: true, balance: newBalance };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Redeem failed",
      status: 500,
    };
  }
}

export async function earnLoyaltyAction(input: {
  points: number;
  orderId?: string;
  note?: string;
}): Promise<LoyaltyResult> {
  try {
    const session = await requireAuth();
    const points = Math.floor(Number(input.points || 0));
    if (points <= 0) {
      const account = await ensureAccount(session.user!.id!);
      return { ok: true, balance: Number(account.points || 0) };
    }

    const userId = session.user!.id!;
    let newBalance = 0;
    await db.transaction(async (tx) => {
      let [account] = await tx
        .select()
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.userId, userId))
        .limit(1);
      if (!account) {
        const id = crypto.randomUUID();
        await tx.insert(loyaltyAccounts).values({ id, userId, points: 0 });
        [account] = await tx
          .select()
          .from(loyaltyAccounts)
          .where(eq(loyaltyAccounts.id, id))
          .limit(1);
      }
      newBalance = Number(account!.points || 0) + points;
      await tx
        .update(loyaltyAccounts)
        .set({ points: newBalance, updatedAt: new Date() })
        .where(eq(loyaltyAccounts.id, account!.id));
      await tx.insert(loyaltyTransactions).values({
        id: crypto.randomUUID(),
        accountId: account!.id,
        userId,
        points,
        kind: "earn",
        orderId: input.orderId || null,
        note: input.note || null,
      });
    });

    return { ok: true, balance: newBalance };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Earn failed",
      status: 500,
    };
  }
}

/** Admin adjust — positive or negative delta */
export async function adminAdjustLoyaltyAction(input: {
  userId: string;
  delta: number;
  note?: string;
}): Promise<LoyaltyResult> {
  try {
    await requireAdmin();
    const delta = Math.trunc(Number(input.delta || 0));
    if (!input.userId || delta === 0) {
      return { ok: false, error: "userId and non-zero delta required", status: 400 };
    }

    let newBalance = 0;
    await db.transaction(async (tx) => {
      let [account] = await tx
        .select()
        .from(loyaltyAccounts)
        .where(eq(loyaltyAccounts.userId, input.userId))
        .limit(1);
      if (!account) {
        const id = crypto.randomUUID();
        await tx.insert(loyaltyAccounts).values({
          id,
          userId: input.userId,
          points: 0,
        });
        [account] = await tx
          .select()
          .from(loyaltyAccounts)
          .where(eq(loyaltyAccounts.id, id))
          .limit(1);
      }
      newBalance = Math.max(0, Number(account!.points || 0) + delta);
      await tx
        .update(loyaltyAccounts)
        .set({ points: newBalance, updatedAt: new Date() })
        .where(eq(loyaltyAccounts.id, account!.id));
      await tx.insert(loyaltyTransactions).values({
        id: crypto.randomUUID(),
        accountId: account!.id,
        userId: input.userId,
        points: delta,
        kind: "adjust",
        note: input.note || null,
      });
    });

    revalidatePath("/admin");
    return { ok: true, balance: newBalance };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Adjust failed",
      status: 500,
    };
  }
}

export async function listLoyaltyAccountsAction(limit = 200) {
  try {
    await requireAdmin();
    const rows = await db
      .select()
      .from(loyaltyAccounts)
      .orderBy(sql`${loyaltyAccounts.updatedAt} DESC`)
      .limit(Math.min(limit, 500));
    return { ok: true as const, data: rows };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false as const, error: err.message, status: err.status };
    }
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}
