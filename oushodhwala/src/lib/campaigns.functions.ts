"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/session-authz";

export type Segment = "all" | "buyers30" | "inactive60" | "highvalue";

export const countAudience = createServerFn({ method: "POST" })
  .inputValidator((d: { segment: Segment }) => d)
  .handler(async () => {
    await requireAdmin();
    return { count: 0 };
  });

export const sendCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: { segment: Segment; title?: string; body?: string }) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true as const, sent: 0 };
  });
