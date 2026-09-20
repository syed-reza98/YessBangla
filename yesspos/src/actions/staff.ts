"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, profiles, userRoles } from "@/db/schema";
import { requireAdmin, AuthError } from "@/lib/authz";

export const APP_ROLES = ["super_admin", "admin", "manager", "cashier", "staff"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type StaffResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

/** Admin-only staff user create (replaces supabaseAdmin.auth.admin). */
export async function createAppUserAction(input: {
  username: string;
  password: string;
  fullName?: string;
  role: AppRole;
}): Promise<StaffResult> {
  try {
    await requireAdmin();
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
      return { ok: false, error: "Invalid username" };
    }
    if (input.password.length < 6) {
      return { ok: false, error: "Password min 6 chars" };
    }
    const email = `${username}@yesspos.local`;
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) return { ok: false, error: "Username taken" };

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id, email, passwordHash });
      await tx.insert(profiles).values({
        id,
        username,
        fullName: input.fullName || username,
      });
      await tx.insert(userRoles).values({
        id: crypto.randomUUID(),
        userId: id,
        role: input.role,
      });
    });
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : "Create failed" };
  }
}

export async function setUserPasswordAction(input: {
  userId: string;
  password: string;
}): Promise<StaffResult> {
  try {
    await requireAdmin();
    if (input.password.length < 6) return { ok: false, error: "Password min 6 chars" };
    const passwordHash = await bcrypt.hash(input.password, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, input.userId));
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function deleteAppUserAction(input: {
  userId: string;
}): Promise<StaffResult> {
  try {
    const session = await requireAdmin();
    if (input.userId === session.user!.id) {
      return { ok: false, error: "You cannot delete your own account" };
    }
    await db.delete(userRoles).where(eq(userRoles.userId, input.userId));
    await db.delete(profiles).where(eq(profiles.id, input.userId));
    await db.delete(users).where(eq(users.id, input.userId));
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}
