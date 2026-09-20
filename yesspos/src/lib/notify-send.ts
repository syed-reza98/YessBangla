import { updateNotificationSendAction } from "@/actions/customers";
import { normalizePhone, shareOnSms, shareOnWhatsApp } from "@/lib/share-invoice";

export type SendChannel = "sms" | "whatsapp";

export type NotificationRow = {
  id: string;
  order_id: string | null;
  order_no: number | null;
  customer_phone: string | null;
  channel: string;
  title: string;
  body: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  send_status: string;
  send_attempts: number;
  last_attempt_at: string | null;
  last_error: string | null;
};

export const NOTIFICATION_COLUMNS =
  "id,order_id,order_no,customer_phone,channel,title,body,is_sent,sent_at,created_at,send_status,send_attempts,last_attempt_at,last_error";

async function recordAttempt(
  row: { id: string; send_attempts: number },
  ok: boolean,
  error?: string,
) {
  await updateNotificationSendAction({
    id: row.id,
    sendAttempts: row.send_attempts ?? 0,
    ok,
    error,
  });
}

/**
 * Hand the message to the device (SMS app / WhatsApp) and record whether the
 * hand-off actually happened.
 */
export async function sendNotification(
  row: NotificationRow,
  channel: SendChannel,
  phone?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const target = (phone ?? row.customer_phone ?? "").trim();
  try {
    if (!target) throw new Error("No customer phone number");
    if (channel === "sms") {
      shareOnSms(target, row.body);
    } else {
      if (!normalizePhone(target)) throw new Error("Invalid phone number");
      const win = window.open(
        `https://wa.me/${normalizePhone(target)}?text=${encodeURIComponent(row.body)}`,
        "_blank",
        "noopener,noreferrer",
      );
      if (!win) throw new Error("WhatsApp window was blocked by the browser");
      void shareOnWhatsApp;
    }
    await recordAttempt(row, true);
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Send failed";
    await recordAttempt(row, false, error);
    return { ok: false, error };
  }
}

/** Manually flag a message as delivered (staff sent it another way). */
export async function markNotificationSent(row: NotificationRow) {
  await recordAttempt(row, true);
}
