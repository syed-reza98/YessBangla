"use server";

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  expenses,
  purchases,
  products,
} from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";

export type InsightInput = { from: string; to: string; lang?: "bn" | "en" };

function money(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export async function getReportInsightAction(data: InsightInput) {
  try {
    await requireStaff();
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const startIso = new Date(`${data.from}T00:00:00`);
    const endIso = new Date(`${data.to}T23:59:59`);

    const [salesRows, itemsRows, expenseRows, purchaseRows, lowStockRows] =
      await Promise.all([
        db
          .select()
          .from(sales)
          .where(and(gte(sales.createdAt, startIso), lte(sales.createdAt, endIso))),
        db.select().from(saleItems).limit(1000),
        db
          .select()
          .from(expenses)
          .where(
            and(
              gte(expenses.spentOn, new Date(data.from)),
              lte(expenses.spentOn, new Date(data.to))
            )
          ),
        db
          .select()
          .from(purchases)
          .where(
            and(
              gte(purchases.purchasedOn, new Date(data.from)),
              lte(purchases.purchasedOn, new Date(data.to))
            )
          ),
        db.select().from(products).orderBy(asc(products.stock)).limit(15),
      ]);

    const finalSales = salesRows.filter(
      (s) => s.status === "final" || s.status === "completed"
    );
    const salesTotal = finalSales.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const paidTotal = finalSales.reduce(
      (s, r) => s + Number(r.paidAmount ?? 0),
      0
    );
    const dueTotal = salesTotal - paidTotal;
    const expenseTotal = expenseRows.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const purchaseTotal = purchaseRows.reduce((s, r) => s + Number(r.total ?? 0), 0);

    const topMap = new Map<string, { qty: number; amount: number }>();
    for (const it of itemsRows) {
      const k = it.nameSnapshot ?? "-";
      const cur = topMap.get(k) ?? { qty: 0, amount: 0 };
      cur.qty += Number(it.quantity ?? 0);
      cur.amount += Number(it.lineTotal ?? it.totalPrice ?? 0);
      topMap.set(k, cur);
    }
    const topItems = [...topMap.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 8)
      .map(([name, v]) => `${name}: qty ${v.qty}, ৳${money(v.amount)}`)
      .join("; ");

    const lowStock = lowStockRows
      .map((p) => `${p.nameEn ?? p.name} (${p.stock})`)
      .join("; ");

    const bn = data.lang !== "en";
    const prompt = bn
      ? `দোকানের ${data.from} থেকে ${data.to} পর্যন্ত সারাংশ: বিক্রি ৳${money(salesTotal)}, আদায় ৳${money(paidTotal)}, বাকি ৳${money(dueTotal)}, খরচ ৳${money(expenseTotal)}, ক্রয় ৳${money(purchaseTotal)}. টপ আইটেম: ${topItems}. লো স্টক: ${lowStock}. সংক্ষিপ্ত ব্যবসায়িক পরামর্শ দিন।`
      : `Shop summary ${data.from} to ${data.to}: sales ৳${money(salesTotal)}, collected ৳${money(paidTotal)}, due ৳${money(dueTotal)}, expenses ৳${money(expenseTotal)}, purchases ৳${money(purchaseTotal)}. Top items: ${topItems}. Low stock: ${lowStock}. Give a short business readout.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "";
    return { ok: true as const, text, salesTotal, paidTotal, dueTotal, expenseTotal, purchaseTotal };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw err instanceof Error ? err : new Error("Insight failed");
  }
}
