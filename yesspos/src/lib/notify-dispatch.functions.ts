import { createServerFn } from "@tanstack/react-start";

/**
 * Delivers queued order-status notifications (SMS) automatically.
 * Staff-triggered: runs after every status change and on a background poll.
 * Delegates to /api/notify-dispatch (server-side API route) via fetch so that
 * mysql2/db never enters the client bundle.
 */
export const dispatchNotifications = createServerFn({ method: "POST" })
  .handler(async () => {
    const base = typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    const res = await fetch(`${base}/api/notify-dispatch`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Dispatch failed" }));
      throw new Error((err as any).error ?? "Dispatch failed");
    }
    return res.json();
  });
