"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema";
import { requireStaff, requireManager, AuthError } from "@/lib/authz";
import { contactRow, money, type Dict } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listContactsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db.select().from(contacts).orderBy(asc(contacts.name));
    return { ok: true, rows: rows.map((r) => contactRow(r as never)) };
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

export async function upsertContactAction(input: {
  id?: string;
  payload: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const p = input.payload;
    const values = {
      name: String(p.name || "").trim(),
      nameBn: (p.name_bn as string) || null,
      phone: (p.phone as string) || null,
      email: (p.email as string) || null,
      address: (p.address as string) || null,
      type: String(p.type || "customer"),
      openingBalance: money(Number(p.opening_balance ?? 0)),
      loyaltyPoints: Number(p.loyalty_points ?? 0),
      isActive: p.is_active == null ? true : Boolean(p.is_active),
    };
    if (!values.name) return { ok: false, error: "name required", status: 400 };
    if (input.id) {
      await db.update(contacts).set(values).where(eq(contacts.id, input.id));
      revalidatePath("/contacts");
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(contacts).values({ id, ...values });
    revalidatePath("/contacts");
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

export async function deleteContactAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireManager();
    await db.delete(contacts).where(eq(contacts.id, input.id));
    revalidatePath("/contacts");
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

export async function listRecentContactsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .limit(50);
    return { ok: true, rows: rows.map((r) => contactRow(r as never)) };
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
