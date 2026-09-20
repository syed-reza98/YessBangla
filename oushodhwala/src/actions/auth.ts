"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, profiles, userRoles } from "@/db/schema";
import { auth } from "@/auth";
import { requireAuth, AuthError } from "@/lib/session-authz";

export type AuthActionResult =
  | { ok: true; userId?: string; roles?: string[] }
  | { ok: false; error: string; status?: number };

export async function customerSignUpAction(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}): Promise<AuthActionResult> {
  try {
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    if (!email || password.length < 6) {
      return { ok: false, error: "Valid email and password (min 6) required", status: 400 };
    }
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return { ok: false, error: "Account already exists", status: 409 };
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, email, passwordHash });
      await tx.insert(profiles).values({
        id: userId,
        fullName: input.name?.trim() || null,
        phone: input.phone?.trim() || null,
        role: "customer",
      });
      await tx.insert(userRoles).values({
        id: crypto.randomUUID(),
        userId,
        role: "customer",
      });
    });
    return { ok: true, userId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Signup failed",
      status: 500,
    };
  }
}

export async function getMyRolesAction(): Promise<AuthActionResult> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const rows = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    const roles = rows.map((r) => r.role);
    if (!roles.length) {
      const [p] = await db
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      if (p?.role) roles.push(p.role);
    }
    if (!roles.length) roles.push("customer");
    return { ok: true, roles };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Roles failed",
      status: 500,
    };
  }
}

export async function getMyProfileAction(): Promise<
  | { ok: true; data: { id: string; name: string; phone: string } | null }
  | { ok: false; error: string; status?: number }
> {
  try {
    const session = await requireAuth();
    const [p] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.user!.id!))
      .limit(1);
    if (!p) return { ok: true, data: null };
    return {
      ok: true,
      data: { id: p.id, name: p.fullName || "", phone: p.phone || "" },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Profile failed",
      status: 500,
    };
  }
}

export async function updateMyProfileAction(input: {
  name?: string;
  phone?: string;
}): Promise<AuthActionResult> {
  try {
    const session = await requireAuth();
    await db
      .update(profiles)
      .set({
        fullName: input.name?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
      })
      .where(eq(profiles.id, session.user!.id!));
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

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Authentication required", status: 401 };
    }
    if ((input.newPassword || "").length < 6) {
      return { ok: false, error: "New password must be at least 6 characters", status: 400 };
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (!user) return { ok: false, error: "User not found", status: 404 };
    const valid = await bcrypt.compare(input.currentPassword || "", user.passwordHash);
    if (!valid) {
      return { ok: false, error: "Current password is incorrect", status: 400 };
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Password change failed",
      status: 500,
    };
  }
}
