"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/session-authz";

export const getImageAuditSummary = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return { counts: {}, total: 0, withMedicine: 0, lastCheckedAt: null };
});

export const listImageIssues = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string; q?: string; limit?: number; offset?: number }) => d)
  .handler(async () => {
    await requireAdmin();
    return { rows: [], count: 0 };
  });

export const exportImageIssuesCsv = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string }) => d)
  .handler(async () => {
    await requireAdmin();
    return "";
  });

export const listImportRuns = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return [];
});

export const rescanImages = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true, scanned: 0 };
  });

export const runImageImport = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true, imported: 0 };
  });

/** Aliases kept for older call sites */
export const runImageAudit = rescanImages;
export const applyImageFix = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true };
  });
export const importProductImages = runImageImport;
