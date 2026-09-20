"use server";

import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { errorLogs } from "@/db/schema";
import { requireAuth, AuthError } from "@/lib/session-authz";
import { badRequest } from "@/lib/authz";

export const OPS_ACTIONS = [
  "checkout",
  "order_status_change",
  "prescription_upload",
  "appointment_booking",
  "appointment_cancel",
  "diagnostic_booking",
] as const;

export type OpsAction = (typeof OPS_ACTIONS)[number];
export type OpsStatus = "started" | "success" | "failure";

export type OpsEventInput = {
  action: OpsAction;
  status: OpsStatus;
  ref?: string;
  path?: string;
  detail?: Record<string, unknown>;
  error?: string;
};

export const logOpsEvent = createServerFn({ method: "POST" })
  .inputValidator((d: OpsEventInput) => {
    if (!d || !OPS_ACTIONS.includes(d.action)) throw badRequest("Unknown ops action");
    if (!["started", "success", "failure"].includes(d.status)) throw badRequest("Unknown ops status");
    return d;
  })
  .handler(async ({ data }) => {
    let userId = "";
    try {
      const session = await requireAuth();
      userId = session.user!.id!;
    } catch (err) {
      if (err instanceof AuthError) return { logged: false as const };
      throw err;
    }

    const severity = data.status === "failure" ? "error" : "info";
    const line = {
      ts: new Date().toISOString(),
      action: data.action,
      status: data.status,
      ref: data.ref ?? "",
      userId,
      path: data.path ?? "",
      detail: data.detail ?? {},
      error: data.error ?? "",
    };

    if (severity === "error") console.error("[ops]", JSON.stringify(line));
    else console.log("[ops]", JSON.stringify(line));

    try {
      await db.insert(errorLogs).values({
        id: crypto.randomUUID(),
        source: "ops",
        message: `[${data.action}] ${data.status}${data.ref ? ` ref=${data.ref}` : ""}${
          data.error ? ` — ${data.error}` : ""
        }`.slice(0, 500),
        stack: JSON.stringify(line).slice(0, 2000),
        context: { severity, path: data.path ?? "", user_id: userId },
      });
    } catch (e) {
      console.error("[ops] persist failed:", e);
    }

    return { logged: true as const };
  });
