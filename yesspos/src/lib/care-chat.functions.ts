import { createServerFn } from "@tanstack/react-start";

export type CareTurn = { role: "user" | "assistant"; content: string };

type CareInput = { messages: CareTurn[]; lang?: "bn" | "en"; website?: string };

function validate(input: unknown): CareInput {
  const raw = input as CareInput;
  if (raw && raw.website) {
    throw new Error("bot_rejected");
  }
  if (!raw || !Array.isArray(raw.messages) || raw.messages.length === 0) {
    throw new Error("messages required");
  }
  const messages = raw.messages
    .slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length) throw new Error("messages required");
  return { messages, lang: raw.lang === "en" ? "en" : "bn" };
}

/** Public "Bazar Bari Care" support chat — delegates to /api/care-chat (server-side). */
export const askCare = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

    const res = await fetch(`${base}/api/care-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.status === 429) throw new Error("rate_limit");
    if (res.status === 402) throw new Error("no_credits");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Chat failed" }));
      throw new Error((err as any).error ?? "Chat failed");
    }

    return res.json() as Promise<{ reply: string }>;
  });
