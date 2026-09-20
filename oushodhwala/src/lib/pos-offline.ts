/**
 * POS অফলাইন সিংক কিউ।
 *
 * নিয়ম (কনফ্লিক্ট মার্জ পলিসি):
 * 1. প্রতিটি বিক্রয়ে একটি ইউনিক `ref` থাকে যা নোটে `#ref:<id>` আকারে সার্ভারে যায়।
 *    সিংকের আগে ওই ref দিয়ে সার্ভারে খোঁজা হয় — পাওয়া গেলে ডুপ্লিকেট ইনভয়েস তৈরি হয় না (idempotent)।
 * 2. স্টকের ক্ষেত্রে সার্ভারই চূড়ান্ত। অফলাইনে থাকা অবস্থায় স্টক বদলে গেলে
 *    বিক্রয়টি বাতিল হয় না — বিক্রয় রেকর্ড হয় এবং ঘাটতি নোটে লেখা থাকে,
 *    যাতে পরে স্টক অ্যাডজাস্টমেন্টে মিলিয়ে নেওয়া যায়।
 * 3. সিংক না হওয়া পর্যন্ত কিউ লোকাল স্টোরেজে থাকে; ব্রাউজার বন্ধ করলেও হারায় না।
 */
import { posCreateSaleAction } from "@/actions/pos";
import { getProductsStockAction } from "@/actions/catalog";
import { findPosSaleByRefAction } from "@/actions/pos";

export type PosLine = { product_id: string; product_name: string; price: number; qty: number };

export type QueuedSale = {
  ref: string;
  at: string;
  items: PosLine[];
  customer_name: string;
  phone: string;
  discount: number;
  paid: number;
  method: string;
  note: string;
  status: "pending" | "synced" | "failed";
  invoice_no?: string;
  error?: string;
  conflicts?: string[];
};

const KEY = "ow.pos.queue.v1";

export const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine);

export function loadQueue(): QueuedSale[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedSale[]) : [];
  } catch {
    return [];
  }
}

export function saveQueue(q: QueuedSale[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(q.slice(-200)));
}

export function newRef() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueue(sale: Omit<QueuedSale, "ref" | "at" | "status">): QueuedSale {
  const item: QueuedSale = { ...sale, ref: newRef(), at: new Date().toISOString(), status: "pending" };
  saveQueue([...loadQueue(), item]);
  return item;
}

export function removeRef(ref: string) {
  saveQueue(loadQueue().filter((s) => s.ref !== ref));
}

export function clearSynced() {
  saveQueue(loadQueue().filter((s) => s.status !== "synced"));
}

/** সার্ভারে ইতিমধ্যে এই ref-এর বিক্রয় আছে কি না */
async function findExisting(ref: string): Promise<string | null> {
  return findPosSaleByRefAction(ref);
}

/** স্টক ঘাটতি বের করে — সার্ভারের স্টকই চূড়ান্ত */
export async function detectConflicts(items: PosLine[]): Promise<string[]> {
  const ids = items.map((i) => i.product_id);
  if (ids.length === 0) return [];
  const data = await getProductsStockAction(ids);
  const out: string[] = [];
  for (const line of items) {
    const p = data.find((d) => d.id === line.product_id);
    const stock = Number(p?.stock ?? 0);
    if (stock < line.qty) out.push(`${p?.name ?? line.product_name}: চাহিদা ${line.qty}, স্টক ${stock}`);
  }
  return out;
}

export type SyncResult = { synced: number; duplicate: number; failed: number; conflicts: number };

/** কিউয়ের সব পেন্ডিং বিক্রয় সার্ভারে পাঠায় (idempotent) */
export async function syncQueue(): Promise<SyncResult> {
  const res: SyncResult = { synced: 0, duplicate: 0, failed: 0, conflicts: 0 };
  if (!isOnline()) return res;

  const queue = loadQueue();
  for (const sale of queue) {
    if (sale.status === "synced") continue;

    const existing = await findExisting(sale.ref);
    if (existing) {
      sale.status = "synced";
      sale.invoice_no = existing;
      sale.error = "";
      res.duplicate += 1;
      continue;
    }

    const conflicts = await detectConflicts(sale.items);
    sale.conflicts = conflicts;
    if (conflicts.length) res.conflicts += 1;

    const note = [sale.note, conflicts.length ? `স্টক ঘাটতি: ${conflicts.join("; ")}` : ""]
      .filter(Boolean)
      .join(" | ");

    const result = await posCreateSaleAction({
      items: sale.items,
      customer_name: sale.customer_name,
      phone: sale.phone,
      discount: sale.discount,
      paid: sale.paid,
      method: sale.method,
      note,
      ref: sale.ref,
    });

    if (!result.ok) {
      sale.status = "failed";
      sale.error = result.error;
      res.failed += 1;
    } else {
      sale.status = "synced";
      sale.invoice_no = result.invoice_no;
      sale.error = "";
      if (result.conflicts?.length) {
        sale.conflicts = result.conflicts;
        res.conflicts += 1;
      }
      res.synced += 1;
    }
  }

  saveQueue(queue);
  return res;
}
