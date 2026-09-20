/**
 * Offline sale queue.
 *
 * When the network is down the POS still takes the sale: the whole payload is
 * stored in IndexedDB and replayed against createSaleAction as soon as the
 * browser is online again. Stock, ledgers and reports stay untouched until the
 * replay succeeds, so nothing is double-counted.
 */
import { createSaleAction, type CreateSaleInput } from "@/actions/pos";

const DB_NAME = "yesspos-offline";
const STORE = "pending-sales";
const VERSION = 2;

export type PendingSaleItem = {
  product_id: string;
  name_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type PendingSale = {
  id: string;
  createdAt: string;
  /** Preferred: Action-shaped payload queued by POS */
  action?: CreateSaleInput;
  /** Legacy IndexedDB rows from earlier dual-insert path */
  sale?: Record<string, unknown>;
  items: PendingSaleItem[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export function isOfflineSupported() {
  return typeof indexedDB !== "undefined";
}

export async function queueSale(
  saleOrAction: Record<string, unknown> | CreateSaleInput,
  items: PendingSaleItem[],
) {
  const isAction =
    "invoiceNumber" in saleOrAction &&
    "branchId" in saleOrAction &&
    Array.isArray((saleOrAction as CreateSaleInput).items);

  const entry: PendingSale = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...(isAction
      ? { action: saleOrAction as CreateSaleInput }
      : { sale: saleOrAction as Record<string, unknown>, items }),
    items,
  };
  await tx("readwrite", (s) => s.add(entry));
  notify();
  return entry;
}

export async function listPendingSales(): Promise<PendingSale[]> {
  if (!isOfflineSupported()) return [];
  try {
    const rows = await tx<PendingSale[]>("readonly", (s) => s.getAll() as IDBRequest<PendingSale[]>);
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function countPendingSales() {
  return (await listPendingSales()).length;
}

async function removePending(id: string) {
  await tx("readwrite", (s) => s.delete(id));
}

function toActionPayload(entry: PendingSale): CreateSaleInput {
  if (entry.action) return entry.action;

  const sale = entry.sale || {};
  const invoiceNumber =
    String(sale.invoice_number || sale.invoiceNumber || "") ||
    `INV-OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const status = String(sale.status || "completed");
  const total = Number(sale.total || 0);
  const paid = Number(sale.paid || 0);

  return {
    invoiceNumber,
    customerId: (sale.contact_id as string | null | undefined) ?? null,
    branchId: String(sale.branch_id || sale.branchId || "MAIN"),
    subtotal: Number(sale.subtotal || total),
    discount: Number(sale.discount || 0),
    tax: Number(sale.tax || 0),
    total,
    paidAmount: paid,
    dueAmount: Math.max(0, total - paid),
    paymentMethod: String(sale.payment_method || sale.paymentMethod || "cash"),
    status: status === "final" ? "completed" : status,
    notes:
      sale.customer_name || sale.customer_phone
        ? `Customer: ${String(sale.customer_name || "")} / ${String(sale.customer_phone || "")}`
        : null,
    items: entry.items.map((i) => ({
      productId: i.product_id,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      totalPrice: i.line_total,
    })),
    payment:
      paid > 0
        ? {
            method: String(sale.payment_method || sale.paymentMethod || "cash"),
            amount: paid,
          }
        : null,
    decrementStock: true,
  };
}

/** Replays every queued sale via createSaleAction. */
export async function syncPendingSales(): Promise<{ synced: number; failed: number }> {
  if (!isOfflineSupported() || (typeof navigator !== "undefined" && !navigator.onLine))
    return { synced: 0, failed: 0 };

  const pending = await listPendingSales();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const result = await createSaleAction(toActionPayload(entry));
      if (!result.ok) throw new Error(result.error);
      await removePending(entry.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  if (synced) notify();
  return { synced, failed };
}

// --- tiny subscription so the header badge can react ---
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribePending(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
