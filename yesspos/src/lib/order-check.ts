/**
 * Backend order consistency check.
 *
 * Before any order (POS sale or online delivery order) is written we ask the
 * server to re-verify price, pack size and stock for every line across all
 * branches. The check runs server-side so a stale cart in the browser can
 * never place an inconsistent order.
 */
import {
  checkOrderConsistencyAction,
  type ConsistencyIssue,
  type ConsistencyLine,
} from "@/actions/order-check";

export type { ConsistencyIssue, ConsistencyLine };

const LABELS: Record<string, { en: string; bn: string }> = {
  missing_product: { en: "no longer in catalog", bn: "ক্যাটালগে নেই" },
  inactive: { en: "unavailable", bn: "অনুপলব্ধ" },
  price_mismatch: { en: "price changed", bn: "দাম পরিবর্তন হয়েছে" },
  pack_size_missing: { en: "pack size missing", bn: "প্যাক সাইজ নেই" },
  pack_size_mismatch: { en: "pack size changed", bn: "প্যাক সাইজ পরিবর্তিত" },
  stock_desync: { en: "branch stock mismatch", bn: "ব্রাঞ্চ স্টক মেলেনি" },
  insufficient_stock: { en: "not enough stock", bn: "পর্যাপ্ত স্টক নেই" },
};

export function issueLabel(issue: string, bn: boolean) {
  const l = LABELS[issue];
  return l ? (bn ? l.bn : l.en) : issue;
}

export function formatIssues(issues: ConsistencyIssue[], bn: boolean) {
  return issues.map((i) => `${i.name}: ${issueLabel(i.issue, bn)} (${i.detail})`).join("\n");
}

/** Runs the server-side check. Throws when the Action itself fails. */
export async function checkOrderConsistency(lines: ConsistencyLine[]): Promise<ConsistencyIssue[]> {
  if (lines.length === 0) return [];
  const res = await checkOrderConsistencyAction(lines);
  if (!res.ok) throw new Error(res.error);
  return res.issues;
}
