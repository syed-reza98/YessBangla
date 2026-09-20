// @ts-nocheck
"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/session-authz";

export type ApiTestResult = { ok: boolean; status?: number; body?: string; ms?: number };

export const runApiTest = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data }): Promise<ApiTestResult> => {
    await requireStaff();
    const url = String((data as { url?: string }).url || "");
    if (!url) return { ok: false, body: "missing url" };
    const t0 = Date.now();
    try {
      const res = await fetch(url, { method: String((data as { method?: string }).method || "GET") });
      const body = (await res.text()).slice(0, 4000);
      return { ok: res.ok, status: res.status, body, ms: Date.now() - t0 };
    } catch (e) {
      return { ok: false, body: e instanceof Error ? e.message : "fetch failed", ms: Date.now() - t0 };
    }
  });
