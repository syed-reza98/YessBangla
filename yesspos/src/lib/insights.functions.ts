import { createServerFn } from "@tanstack/react-start";
import { getReportInsightAction } from "@/actions/insights";

type InsightInput = { from: string; to: string; lang?: "bn" | "en" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function validate(input: unknown): InsightInput {
  const raw = input as InsightInput;
  if (!raw || !DATE.test(raw.from ?? "") || !DATE.test(raw.to ?? "")) {
    throw new Error("from/to must be YYYY-MM-DD");
  }
  return { from: raw.from, to: raw.to, lang: raw.lang === "en" ? "en" : "bn" };
}

/**
 * AI insight for the report period — delegates to Server Action (Drizzle).
 */
export const getReportInsight = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const result = await getReportInsightAction(data);
    return {
      insight: result.text,
      metrics: {
        salesTotal: result.salesTotal,
        paidTotal: result.paidTotal,
        dueTotal: result.dueTotal,
        expenseTotal: result.expenseTotal,
        purchaseTotal: result.purchaseTotal,
        invoices: 0,
      },
    };
  });
