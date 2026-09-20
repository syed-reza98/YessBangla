import { db } from "@/lib/db";
import { apiSettings, customerNotifications } from "@/db/schema";
import { eq, and, ne, lt, asc } from "drizzle-orm";

type SmsConfig = {
  baseUrl: string | null;
  apiKey: string | null;
  senderId: string | null;
  extra: Record<string, unknown> | null;
};

export type DispatchResult = { sent: number; failed: number; skipped: string | null };

/** Sends one SMS through the configured gateway (sms.net.bd compatible form POST). */
async function sendSms(cfg: SmsConfig, to: string, msg: string) {
  const url = (cfg.baseUrl ?? "").trim();
  if (!url) throw new Error("SMS gateway URL is not configured");
  if (!cfg.apiKey) throw new Error("SMS gateway API key is missing");

  const body = new URLSearchParams({ api_key: cfg.apiKey, msg, to });
  if (cfg.senderId) body.set("sender_id", cfg.senderId);
  const extra = cfg.extra ?? {};
  for (const [k, v] of Object.entries(extra)) {
    if (typeof v === "string" || typeof v === "number") body.set(k, String(v));
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${text.slice(0, 200)}`);
  try {
    const json = JSON.parse(text) as { error?: number; msg?: string };
    if (typeof json.error === "number" && json.error !== 0) {
      throw new Error(json.msg ?? `Gateway error ${json.error}`);
    }
  } catch (e) {
    if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
  }
  return text.slice(0, 200);
}

/**
 * Picks up unsent customer notifications and delivers them automatically.
 * Runs with the service role because it is called from trusted server code only.
 */
export async function dispatchPending(limit = 25): Promise<DispatchResult> {
  const [gw] = await db
    .select({
      baseUrl: apiSettings.baseUrl,
      apiKey: apiSettings.apiKey,
      senderId: apiSettings.senderId,
      extra: apiSettings.extra,
      enabled: apiSettings.enabled,
    })
    .from(apiSettings)
    .where(eq(apiSettings.provider, "sms"))
    .limit(1);

  if (!gw || !gw.enabled) return { sent: 0, failed: 0, skipped: "sms_gateway_disabled" };

  const rows = await db
    .select({
      id: customerNotifications.id,
      body: customerNotifications.body,
      customerPhone: customerNotifications.customerPhone,
      sendAttempts: customerNotifications.sendAttempts,
      sendStatus: customerNotifications.sendStatus,
    })
    .from(customerNotifications)
    .where(
      and(
        eq(customerNotifications.isSent, false),
        ne(customerNotifications.sendStatus, "sending"),
        lt(customerNotifications.sendAttempts, 3)
      )
    )
    .orderBy(asc(customerNotifications.createdAt))
    .limit(limit);

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const now = new Date();
    const attempts = (row.sendAttempts ?? 0) + 1;
    try {
      const phone = (row.customerPhone ?? "").trim();
      if (!phone) throw new Error("No customer phone number");
      await sendSms(gw as SmsConfig, phone, row.body || "");
      sent += 1;
      await db
        .update(customerNotifications)
        .set({
          isSent: true,
          sentAt: now,
          sendStatus: "sent",
          sendAttempts: attempts,
          lastAttemptAt: now,
          lastError: null,
        })
        .where(eq(customerNotifications.id, row.id));
    } catch (e) {
      failed += 1;
      const message = e instanceof Error ? e.message : "Send failed";
      await db
        .update(customerNotifications)
        .set({
          sendStatus: "failed",
          sendAttempts: attempts,
          lastAttemptAt: now,
          lastError: message.slice(0, 300),
        })
        .where(eq(customerNotifications.id, row.id));
    }
  }

  return { sent, failed, skipped: null };
}

