import { createServerFn } from "@tanstack/react-start";
import { listSalesAction, listSaleItemsAction } from "@/actions/sales-admin";
import { listExpensesAction } from "@/actions/expenses";
import { listProductsAction } from "@/actions/catalog";

export type AssistantTurn = { role: "user" | "assistant"; content: string };

type AskInput = { messages: AssistantTurn[]; lang?: "bn" | "en" };

function validate(input: unknown): AskInput {
  const raw = input as AskInput;
  if (!raw || !Array.isArray(raw.messages) || raw.messages.length === 0) {
    throw new Error("messages required");
  }
  const messages = raw.messages
    .slice(-12)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  return { messages, lang: raw.lang === "en" ? "en" : "bn" };
}

function money(n: number) {
  return `${Math.round(n).toLocaleString("en-US")}`;
}

/** Ask the business assistant — loads live data via Server Actions. */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const dayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();

    const [salesRes, lowStockRes, expenseRes, topRes] = await Promise.all([
      listSalesAction({ fromIso: start, status: "final", limit: 500 }),
      listProductsAction({ lowStock: true, limit: 15 }),
      listExpensesAction({ from: start.slice(0, 10) }),
      listSaleItemsAction({ limit: 500 }),
    ]);

    const sales = salesRes.ok ? salesRes.rows : [];
    const monthTotal = sales.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const todayRows = sales.filter(
      (r) => String(r.created_at ?? "") >= dayStart
    );
    const todayTotal = todayRows.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const expenseTotal = expenseRes.ok
      ? expenseRes.rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)
      : 0;
    const lowStock = lowStockRes.ok
      ? lowStockRes.rows
          .map((p) => `${p.name_en ?? p.name} (${p.stock})`)
          .join("; ")
      : "";

    const topMap = new Map<string, { qty: number; amount: number }>();
    for (const it of topRes.ok ? topRes.rows : []) {
      const k = String(it.name_snapshot ?? "-");
      const cur = topMap.get(k) ?? { qty: 0, amount: 0 };
      cur.qty += Number(it.quantity ?? 0);
      cur.amount += Number(it.line_total ?? 0);
      topMap.set(k, cur);
    }
    const topItems = [...topMap.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5)
      .map(([name, v]) => `${name}: ৳${money(v.amount)}`)
      .join("; ");

    const bn = data.lang !== "en";
    const snapshot = bn
      ? `আজকের বিক্রি ৳${money(todayTotal)}, মাসের বিক্রি ৳${money(monthTotal)}, খরচ ৳${money(expenseTotal)}. টপ: ${topItems}. লো স্টক: ${lowStock}.`
      : `Today sales ৳${money(todayTotal)}, month ৳${money(monthTotal)}, expenses ৳${money(expenseTotal)}. Top: ${topItems}. Low stock: ${lowStock}.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a shop assistant. Use this live snapshot:\n${snapshot}`,
          },
          ...data.messages,
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      reply: json.choices?.[0]?.message?.content ?? "",
    };
  });
