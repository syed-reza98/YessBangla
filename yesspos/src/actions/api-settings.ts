"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { apiSettings } from "@/db/schema";
import { requireManager, AuthError } from "@/lib/authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listApiSettingsAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    await requireManager();
    const rows = await db.select().from(apiSettings).orderBy(asc(apiSettings.key));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        meta: r.meta,
        provider: r.provider,
        label: r.label,
        category: r.category,
        enabled: r.enabled,
        base_url: r.baseUrl,
        api_key: r.apiKey,
        api_secret: r.apiSecret,
        sender_id: r.senderId,
        extra: r.extra,
        notes: r.notes,
        updated_at: r.updatedAt,
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

export async function upsertApiSettingAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireManager();
    const key = String(input.key || input.provider || crypto.randomUUID());
    const id = String(input.id || crypto.randomUUID());
    const values = {
      key,
      value: (input.value as string) ?? null,
      meta: (input.meta as Record<string, unknown>) ?? {},
      provider: (input.provider as string) ?? null,
      label: (input.label as string) ?? null,
      category: (input.category as string) ?? null,
      enabled: input.enabled == null ? true : Boolean(input.enabled),
      baseUrl: (input.base_url as string) ?? null,
      apiKey: (input.api_key as string) ?? null,
      apiSecret: (input.api_secret as string) ?? null,
      senderId: (input.sender_id as string) ?? null,
      extra: (input.extra as Record<string, unknown>) ?? {},
      notes: (input.notes as string) ?? null,
    };
    const [existing] = await db
      .select()
      .from(apiSettings)
      .where(eq(apiSettings.key, key))
      .limit(1);
    if (existing) {
      await db
        .update(apiSettings)
        .set(values)
        .where(eq(apiSettings.id, existing.id));
      revalidatePath("/api-hub");
      return { ok: true, id: existing.id };
    }
    await db.insert(apiSettings).values({ id, ...values });
    revalidatePath("/api-hub");
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

export async function deleteApiSettingAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireManager();
    await db.delete(apiSettings).where(eq(apiSettings.id, input.id));
    revalidatePath("/api-hub");
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
