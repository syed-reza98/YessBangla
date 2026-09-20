"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { businessSettings, profiles, userRoles } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";
import { settingsRow, money } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function getBusinessSettingsAction(): Promise<
  ActionResult<{ settings: Record<string, unknown> | null }>
> {
  try {
    const rows = await db.select().from(businessSettings).limit(5);
    const wide = rows.find((r) => r.shopName != null) ?? rows[0] ?? null;
    return { ok: true, settings: wide ? settingsRow(wide as never) : null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Settings load failed",
      status: 500,
    };
  }
}

export async function upsertBusinessSettingsAction(input: {
  id?: string;
  shop_name?: string;
  address?: string | null;
  phone?: string | null;
  currency_symbol?: string;
  default_tax_pct?: number;
  receipt_footer?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const values = {
      shopName: (input.shop_name || "Bazar Bari").slice(0, 80),
      address: input.address ?? null,
      phone: input.phone ?? null,
      currencySymbol: (input.currency_symbol || "৳").slice(0, 4),
      defaultTaxPct: money(input.default_tax_pct ?? 0),
      receiptFooter: input.receipt_footer ?? null,
    };
    if (input.id) {
      await db
        .update(businessSettings)
        .set(values)
        .where(eq(businessSettings.id, input.id));
      revalidatePath("/settings");
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(businessSettings).values({ id, ...values });
    revalidatePath("/settings");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Settings save failed",
      status: 500,
    };
  }
}

export async function healthCheckSettingsAction(): Promise<
  ActionResult<{ okHealth: boolean }>
> {
  try {
    await db.select({ id: businessSettings.id }).from(businessSettings).limit(1);
    return { ok: true, okHealth: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Backend unreachable",
      status: 500,
    };
  }
}

export async function debugProfileAction(input: {
  username: string;
}): Promise<
  ActionResult<{
    profile: { id: string; username: string | null } | null;
    roles: string[];
  }>
> {
  try {
    const [profile] = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(eq(profiles.username, input.username))
      .limit(1);
    if (!profile) {
      return { ok: true, profile: null, roles: [] };
    }
    const roles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, profile.id));
    return {
      ok: true,
      profile,
      roles: roles.map((r) => r.role),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Debug failed",
      status: 500,
    };
  }
}
