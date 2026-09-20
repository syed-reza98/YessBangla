"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/session-authz";

export const listIntegrations = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  return [];
});
export const upsertIntegration = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireStaff();
    return { ok: true };
  });
export const deleteIntegration = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async () => {
    await requireStaff();
    return { ok: true };
  });
export const testIntegration = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async () => {
    await requireStaff();
    return { ok: true, status: 200 };
  });
