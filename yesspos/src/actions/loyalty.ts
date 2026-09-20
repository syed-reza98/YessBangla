"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contacts, loyaltyTransactions } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";

export type Member = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_member: boolean;
  loyalty_points: number;
};

export type LoyaltyActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function toMember(row: typeof contacts.$inferSelect): Member {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    is_member: Boolean(row.isMember),
    loyalty_points: Number(row.loyaltyPoints) || 0,
  };
}

/** Register (or look up) a loyalty member by phone. */
export async function registerMemberAction(input: {
  phone: string;
  name?: string | null;
}): Promise<LoyaltyActionResult<{ member: Member }>> {
  try {
    await requireStaff();
    const phone = (input.phone || "").trim();
    if (!phone) {
      return { ok: false, error: "Phone required", status: 400 };
    }
    const name = (input.name || "").trim() || phone;

    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.type, "customer"), eq(contacts.phone, phone)))
      .limit(1);

    if (!existing) {
      const id = crypto.randomUUID();
      await db.insert(contacts).values({
        id,
        type: "customer",
        name,
        phone,
        isMember: true,
        memberSince: new Date(),
        loyaltyPoints: 0,
      });
      const [created] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, id))
        .limit(1);
      revalidatePath("/contacts");
      return { ok: true, member: toMember(created!) };
    }

    if (!existing.isMember) {
      await db
        .update(contacts)
        .set({
          isMember: true,
          memberSince: existing.memberSince ?? new Date(),
          name: name || existing.name,
        })
        .where(eq(contacts.id, existing.id));
      const [updated] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, existing.id))
        .limit(1);
      revalidatePath("/contacts");
      return { ok: true, member: toMember(updated!) };
    }

    return { ok: true, member: toMember(existing) };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Register member failed",
      status: 500,
    };
  }
}

/**
 * Redeem + earn points for a finalised sale.
 * 1 point per 10 currency spent; redeem needs ≥1000 points; 10 pts = 1 currency.
 */
export async function applyLoyaltyAction(input: {
  contactId: string;
  saleId?: string | null;
  amount: number;
  redeemPoints?: number;
  branchId?: string | null;
}): Promise<LoyaltyActionResult<{ balance: number }>> {
  try {
    await requireStaff();

    const balance = await db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(contacts)
        .where(
          and(eq(contacts.id, input.contactId), eq(contacts.isMember, true))
        )
        .limit(1);

      if (!row) return 0;

      let bal = Number(row.loyaltyPoints) || 0;
      let redeem = Math.max(Number(input.redeemPoints) || 0, 0);

      if (redeem > 0) {
        if (bal < 1000) {
          throw new Error("Minimum 1000 points required to redeem");
        }
        if (redeem > bal) {
          throw new Error("Not enough points");
        }
        await tx
          .update(contacts)
          .set({ loyaltyPoints: bal - redeem })
          .where(eq(contacts.id, input.contactId));
        await tx.insert(loyaltyTransactions).values({
          id: crypto.randomUUID(),
          customerId: input.contactId,
          saleId: input.saleId || null,
          points: -redeem,
          type: "redeem",
          description: input.branchId
            ? `Redeem at branch ${input.branchId}`
            : "Redeem",
        });
        bal -= redeem;
      }

      const earned = Math.floor(Math.max(Number(input.amount) || 0, 0) / 10);
      if (earned > 0) {
        await tx
          .update(contacts)
          .set({ loyaltyPoints: bal + earned })
          .where(eq(contacts.id, input.contactId));
        await tx.insert(loyaltyTransactions).values({
          id: crypto.randomUUID(),
          customerId: input.contactId,
          saleId: input.saleId || null,
          points: earned,
          type: "earn",
          description: `Earn on amount ${input.amount}`,
        });
        bal += earned;
      }

      return bal;
    });

    revalidatePath("/pos");
    revalidatePath("/contacts");
    return { ok: true, balance };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Apply loyalty failed",
      status: 500,
    };
  }
}
