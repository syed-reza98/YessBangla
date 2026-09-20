"use server";
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/session-authz";

export type Segment = { kind: string; value?: string };

export const countAudience = createServerFn({ method: "POST" })
  .inputValidator((d: { segment: Segment }) => d)
  .handler(async () => {
    await requireAdmin();
    return { count: 0 };
  });

export const sendCampaign = createServerFn({ method: "POST" })
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async () => {
    await requireAdmin();
    return { ok: true, sent: 0 };
  });
