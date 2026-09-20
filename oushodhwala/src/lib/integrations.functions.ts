"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/session-authz";

export type IntegrationRow = {
  id: string;
  name: string;
  provider: string;
  category: string;
  active: boolean;
  base_url?: string;
  config?: Record<string, unknown>;
  created_at?: string;
};

export const listIntegrations = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  return [] as IntegrationRow[];
});

export const saveIntegration = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireStaff();
    return { ok: true as const, id: crypto.randomUUID() };
  });

export const upsertIntegration = saveIntegration;

export const deleteIntegration = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async () => {
    await requireStaff();
    return { ok: true as const };
  });

export const testIntegration = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async () => {
    await requireStaff();
    return { ok: true as const, status: 200 };
  });
