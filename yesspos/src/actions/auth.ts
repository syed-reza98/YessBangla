"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, profiles, userRoles } from "@/db/schema";
import { AuthError, requireAdmin, requireAuth } from "@/lib/authz";

export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; status?: number };

export type SignUpFormState = {
  ok: boolean;
  error?: string;
  userId?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "fullName", string>>;
};

/** Map username-or-email input to the internal credentials email. */
function toAuthEmail(value: string) {
  const v = value.trim();
  return v.includes("@") ? v.toLowerCase() : `${v.toLowerCase()}@yesspos.local`;
}

/** FormData entry for React 19 `useActionState` signup forms. */
export async function customerSignUpFormAction(
  _prev: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const rawEmail = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  const fieldErrors: SignUpFormState["fieldErrors"] = {};
  if (rawEmail.length < 3) fieldErrors.email = "Enter a username or email";
  if (password.length < 6) fieldErrors.password = "Password must be at least 6 characters";
  if (fullName.length > 80) fieldErrors.fullName = "Name is too long";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const result = await customerSignUpAction({
    email: toAuthEmail(rawEmail),
    password,
    fullName: fullName || undefined,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, userId: result.userId };
}

/** Public storefront signup — always role `customer`. */
export async function customerSignUpAction(input: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}): Promise<SignupResult> {
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
        fullName: input.fullName?.trim() || null,
        phone: input.phone?.trim() || null,
        role: "customer",
      });
      await tx.insert(userRoles).values({
        id: crypto.randomUUID(),
        userId,
        role: "customer",
        branchId: "MAIN",
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

/** Admin-only staff provisioning. */
export async function provisionStaffAction(input: {
  email: string;
  password: string;
  fullName?: string;
  role: "cashier" | "manager" | "admin";
  branchId?: string;
}): Promise<SignupResult> {
  try {
    await requireAdmin();
    const email = input.email.trim().toLowerCase();
    if (!email || input.password.length < 8) {
      return { ok: false, error: "Email and password (min 8) required", status: 400 };
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
    const passwordHash = await bcrypt.hash(input.password, 12);

    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, email, passwordHash });
      await tx.insert(profiles).values({
        id: userId,
        fullName: input.fullName?.trim() || null,
        role: input.role,
        branchId: input.branchId || null,
      });
      await tx.insert(userRoles).values({
        id: crypto.randomUUID(),
        userId,
        role: input.role,
        branchId: input.branchId || "MAIN",
      });
    });

    return { ok: true, userId };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Provisioning failed",
      status: 500,
    };
  }
}

/** Authenticated user updating their own password */
export async function updateSelfPasswordAction(input: {
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user?.id;
    if (!userId) return { ok: false, error: "Not authenticated" };
    if (!input.password || input.password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters" };
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    return { ok: false, error: err instanceof Error ? err.message : "Password update failed" };
  }
}
