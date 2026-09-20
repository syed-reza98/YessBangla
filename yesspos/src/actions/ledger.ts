"use server";

import { and, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ledgerAccounts,
  journalLines,
  sales,
  purchases,
  payments,
  expenses,
  accountTransactions,
  contacts,
} from "@/db/schema";
import { requireManager, AuthError } from "@/lib/authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listLedgerAccountsAction(): Promise<
  ActionResult<{ accounts: unknown[] }>
> {
  try {
    await requireManager();
    const accounts = await db.select().from(ledgerAccounts);
    return { ok: true, accounts };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function upsertLedgerAccountAction(input: {
  id?: string;
  code: string;
  name: string;
  nameBn?: string;
  type: string;
  parentId?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireManager();
    if (!input.code?.trim() || !input.name?.trim() || !input.type) {
      return { ok: false, error: "code, name, type required", status: 400 };
    }
    const id = input.id || crypto.randomUUID();
    if (input.id) {
      await db
        .update(ledgerAccounts)
        .set({
          code: input.code.trim(),
          name: input.name.trim(),
          nameBn: input.nameBn || null,
          type: input.type,
          parentId: input.parentId || null,
        })
        .where(eq(ledgerAccounts.id, id));
    } else {
      await db.insert(ledgerAccounts).values({
        id,
        code: input.code.trim(),
        name: input.name.trim(),
        nameBn: input.nameBn || null,
        type: input.type,
        parentId: input.parentId || null,
      });
    }
    revalidatePath("/chart-of-accounts");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
      status: 500,
    };
  }
}

export async function deleteLedgerAccountAction(input: {
  id: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireManager();
    if (!input.id) return { ok: false, error: "id required", status: 400 };
    await db.delete(ledgerAccounts).where(eq(ledgerAccounts.id, input.id));
    revalidatePath("/chart-of-accounts");
    return { ok: true, id: input.id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
      status: 500,
    };
  }
}

export async function dayBookAction(input: {
  day: string;
}): Promise<
  ActionResult<{
    sales: unknown[];
    purchases: unknown[];
    payments: unknown[];
    expenses: unknown[];
    accTxns: unknown[];
    entries: unknown[];
  }>
> {
  try {
    await requireManager();
    const start = new Date(input.day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [salesRows, purchaseRows, paymentRows, expenseRows, txnRows, journalRows] =
      await Promise.all([
        db
          .select()
          .from(sales)
          .where(and(gte(sales.createdAt, start), lte(sales.createdAt, end))),
        db
          .select()
          .from(purchases)
          .where(and(gte(purchases.createdAt, start), lte(purchases.createdAt, end))),
        db
          .select()
          .from(payments)
          .where(and(gte(payments.createdAt, start), lte(payments.createdAt, end))),
        db
          .select()
          .from(expenses)
          .where(and(gte(expenses.expenseDate, start), lte(expenses.expenseDate, end))),
        db
          .select()
          .from(accountTransactions)
          .where(
            and(
              gte(accountTransactions.txnDate, start),
              lte(accountTransactions.txnDate, end)
            )
          ),
        db.execute(
          sql`SELECT e.*, 
          (SELECT COALESCE(SUM(debit),0) FROM journal_lines WHERE entry_id = e.id) AS debit_total,
          (SELECT COALESCE(SUM(credit),0) FROM journal_lines WHERE entry_id = e.id) AS credit_total
        FROM journal_entries e
        WHERE e.entry_date >= ${start} AND e.entry_date < ${end}
        ORDER BY e.entry_date DESC`
        ),
      ]);

    return {
      ok: true,
      sales: salesRows.map((s) => ({
        invoice_no: s.invoiceNumber,
        total: Number(s.total),
        paid: Number(s.paidAmount),
        created_at: s.createdAt,
      })),
      purchases: purchaseRows.map((p) => ({
        ref_no: p.invoiceNo,
        total: Number(p.total),
        paid: Number(p.paid),
        purchased_on: p.createdAt?.toISOString?.().slice(0, 10) ?? input.day,
      })),
      payments: paymentRows.map((p) => ({
        amount: Number(p.amount),
        direction: p.direction,
        method: p.method,
        paid_on: p.createdAt?.toISOString?.().slice(0, 10) ?? input.day,
      })),
      expenses: expenseRows.map((e) => ({
        title: e.note || e.reference || "Expense",
        amount: Number(e.amount),
        spent_on: e.expenseDate?.toISOString?.().slice(0, 10) ?? input.day,
      })),
      accTxns: txnRows.map((a) => ({
        type: a.type,
        amount: Number(a.amount),
        note: a.note,
        txn_date: a.txnDate?.toISOString?.().slice(0, 10) ?? input.day,
      })),
      entries: Array.isArray(journalRows) ? journalRows : [],
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Day book failed",
      status: 500,
    };
  }
}

export async function partyStatementAction(input: {
  partyId: string;
  from?: string;
  to?: string;
}): Promise<
  ActionResult<{
    contact: unknown | null;
    sales: unknown[];
    purchases: unknown[];
    payments: unknown[];
    rows: unknown[];
  }>
> {
  try {
    await requireManager();
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, input.partyId))
      .limit(1);

    const salesRows = await db
      .select()
      .from(sales)
      .where(eq(sales.customerId, input.partyId))
      .limit(200);
    const purchaseRows = await db
      .select()
      .from(purchases)
      .where(eq(purchases.supplierId, input.partyId))
      .limit(200);
    const paymentRows = await db
      .select()
      .from(payments)
      .where(eq(payments.partyId, input.partyId))
      .limit(200);

    // Also include journal memo matches as fallback rows
    const memoRows = await db
      .select()
      .from(journalLines)
      .where(sql`${journalLines.memo} LIKE ${"%" + input.partyId + "%"}`)
      .limit(100);

    return {
      ok: true,
      contact: contact
        ? {
            id: contact.id,
            name: contact.name,
            type: contact.type,
            opening_balance: 0,
          }
        : null,
      sales: salesRows.map((s) => ({
        invoice_no: s.invoiceNumber,
        total: Number(s.total),
        paid: Number(s.paidAmount),
        created_at: s.createdAt?.toISOString?.() ?? "",
      })),
      purchases: purchaseRows.map((p) => ({
        ref_no: p.invoiceNo,
        total: Number(p.total),
        paid: Number(p.paid),
        purchased_on: p.createdAt?.toISOString?.().slice(0, 10) ?? "",
      })),
      payments: paymentRows.map((p) => ({
        amount: Number(p.amount),
        direction: p.direction,
        method: p.method,
        paid_on: p.createdAt?.toISOString?.().slice(0, 10) ?? "",
      })),
      rows: memoRows,
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Statement failed",
      status: 500,
    };
  }
}
