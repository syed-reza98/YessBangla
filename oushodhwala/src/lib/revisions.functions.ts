"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/session-authz";

export const getRevisionSummary = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return { pending: 0, approved: 0, rejected: 0 };
});

export const listRevisions = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string; productId?: string }) => d)
  .handler(async () => {
    await requireAdmin();
    return [];
  });

export const listImageAudit = createServerFn({ method: "GET" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireAdmin();
    return [];
  });

export const approveRevisions = createServerFn({ method: "POST" })
  .inputValidator((d: { ids?: string[] }) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true };
  });

export const rejectRevisions = createServerFn({ method: "POST" })
  .inputValidator((d: { ids?: string[] }) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true };
  });

export const rollbackRevisions = createServerFn({ method: "POST" })
  .inputValidator((d: { ids?: string[] }) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true };
  });

export const autoFetchAlternates = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true, fetched: 0 };
  });
