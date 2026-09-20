"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { profiles, users } from "@/db/schema";
import { requireEditor, AuthError } from "@/lib/authz";
import { auth } from "@/auth";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

export async function updateProfileAction(input: {
  fullName?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  language?: string | null;
  theme?: string | null;
  itemsPerPage?: number | null;
  notifyNewApplication?: boolean | null;
  notifyNewMessage?: boolean | null;
}): Promise<ActionResult> {
  try {
    const session = await requireEditor();
    const id = session.user!.id!;

    const [existing] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    if (!existing) {
      await db.insert(profiles).values({ id });
    }

    await db
      .update(profiles)
      .set({
        fullName: input.fullName ?? undefined,
        phone: input.phone ?? undefined,
        jobTitle: input.jobTitle ?? undefined,
        avatarUrl: input.avatarUrl ?? undefined,
        language: input.language || undefined,
        theme: input.theme || undefined,
        itemsPerPage: input.itemsPerPage ?? undefined,
        notifyNewApplication: input.notifyNewApplication ?? undefined,
        notifyNewMessage: input.notifyNewMessage ?? undefined,
      })
      .where(eq(profiles.id, id));

    revalidatePath("/admin/profile");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Profile update failed",
      status: 500,
    };
  }
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Authentication required", status: 401 };
    }
    const current = input.currentPassword || "";
    const next = input.newPassword || "";
    if (next.length < 8) {
      return { ok: false, error: "New password must be at least 8 characters", status: 400 };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (!user) return { ok: false, error: "User not found", status: 404 };

    const valid = await bcrypt.compare(current, user.passwordHash);
    if (!valid) {
      return { ok: false, error: "Current password is incorrect", status: 400 };
    }

    const passwordHash = await bcrypt.hash(next, 10);
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

export async function getMyProfileAction(): Promise<
  | {
      ok: true;
      data: {
        id: string;
        full_name: string | null;
        phone: string | null;
        job_title: string | null;
        avatar_url: string | null;
        language: string;
        theme: string;
        items_per_page: number;
        notify_new_application: boolean;
        notify_new_message: boolean;
      } | null;
    }
  | { ok: false; error: string; status?: number }
> {
  try {
    const session = await requireEditor();
    const id = session.user!.id!;
    let [row] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    if (!row) {
      await db.insert(profiles).values({ id });
      [row] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    }
    if (!row) return { ok: true, data: null };
    return {
      ok: true,
      data: {
        id: row.id,
        full_name: row.fullName,
        phone: row.phone,
        job_title: row.jobTitle,
        avatar_url: row.avatarUrl,
        language: row.language,
        theme: row.theme,
        items_per_page: row.itemsPerPage,
        notify_new_application: row.notifyNewApplication,
        notify_new_message: row.notifyNewMessage,
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Profile load failed",
      status: 500,
    };
  }
}
