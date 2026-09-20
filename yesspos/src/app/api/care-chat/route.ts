import { NextRequest, NextResponse } from "next/server";

const ipBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_PER_WINDOW) return false;
  bucket.count += 1;
  return true;
}

type CareTurn = { role: "user" | "assistant"; content: string };
type CareInput = { messages: CareTurn[]; lang?: "bn" | "en"; website?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CareInput;

    if (body?.website) {
      return NextResponse.json({ error: "bot_rejected" }, { status: 400 });
    }
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown-ip";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "rate_limit" }, { status: 429 });
    }

    const messages = body.messages
      .slice(-12)
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (!messages.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const lang: "bn" | "en" = body.lang === "en" ? "en" : "bn";
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { buildCareKnowledge } = await import("@/lib/care-chat.server");
    const knowledge = await buildCareKnowledge();

    const system = [
      "You are 'Bazar Bari Care' (বাজার বাড়ি কেয়ার), the official customer care assistant of Bazar Bari (বাজার বাড়ি) — an online + in-shop grocery bazar in Bangladesh.",
      lang === "en"
        ? "Answer in clear, friendly English."
        : "উত্তর সহজ, ভদ্র বাংলায় দিন (সংখ্যা ইংরেজি অঙ্কে চলবে)।",
      "Help with: product availability and prices, delivery areas, fees and time, order placing, tracking, cancel/reschedule, coupons, loyalty points, payment methods, and general shop information.",
      "Use only the knowledge base below. If something is not there, say you don't have that information and suggest contacting the shop phone or using the relevant page link.",
      "Be concise: short answers with bullet points. Always show money as ৳. Never invent products, prices or offers.",
      "Never ask for passwords, card numbers or OTP.",
      "Write plain text only — no markdown symbols like **, ## or backticks. Use simple dashes for lists.",
      "",
      "BAZAR BARI KNOWLEDGE BASE:",
      knowledge,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (res.status === 429) return NextResponse.json({ error: "rate_limit" }, { status: 429 });
    if (res.status === 402) return NextResponse.json({ error: "no_credits" }, { status: 402 });
    if (!res.ok) {
      return NextResponse.json({ error: `AI request failed [${res.status}]` }, { status: 502 });
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return NextResponse.json({ reply: json.choices?.[0]?.message?.content ?? "" });
  } catch (err: any) {
    console.error("[care-chat] Error:", err);
    return NextResponse.json({ error: err?.message || "Chat failed" }, { status: 500 });
  }
}
