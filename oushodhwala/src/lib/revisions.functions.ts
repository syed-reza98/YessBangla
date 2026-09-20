"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/session-authz";

export const listImageRevisions = createServerFn({ method: "GET" })
  .inputValidator((d: { productId?: string }) => d)
  .handler(async () => { await requireAdmin(); return []; });
export const createImageRevision = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => { await requireAdmin(); return { ok: true }; });
export const restoreImageRevision = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => { await requireAdmin(); return { ok: true }; });
export const deleteImageRevision = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => { await requireAdmin(); return { ok: true }; });
export const listRevisionProducts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return [];
});
export const getRevisionDiff = createServerFn({ method: "GET" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => { await requireAdmin(); return null; });
export const purgeOldRevisions = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  return { purged: 0 };
});
