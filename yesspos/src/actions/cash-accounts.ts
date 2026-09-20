"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { accounts, accountTransactions, journalEntries } from "@/db/schema";
import { requireStaff, requireManager, AuthError } from "@/lib/authz";
import { money, type Dict } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listCashAccountsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db.select().from(accounts).orderBy(asc(accounts.name));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        account_number: r.accountNumber,
        bank_name: r.bankName,
        branch: r.branch,
        branch_id: r.branchId,
        opening_balance: Number(r.openingBalance),
        is_active: r.isActive,
        note: r.note,
        created_at: r.createdAt,
      })),
    };
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

export async function createCashAccountAction(input: {
  name: string;
  type: string;
  openingBalance?: number;
  accountNumber?: string | null;
  bankName?: string | null;
  branchId?: string | null;
  note?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireManager();
    const id = crypto.randomUUID();
    await db.insert(accounts).values({
      id,
      name: input.name,
      type: input.type,
      openingBalance: money(input.openingBalance ?? 0),
      accountNumber: input.accountNumber || null,
      bankName: input.bankName || null,
      branchId: input.branchId || null,
      note: input.note || null,
    });
    revalidatePath("/accounts");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
      status: 500,
    };
  }
}

export async function listAccountTransactionsAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(accountTransactions)
      .orderBy(desc(accountTransactions.createdAt))
      .limit(1000);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        account_id: r.accountId,
        to_account_id: r.toAccountId,
        branch_id: r.branchId,
        user_id: r.userId,
        type: r.type,
        amount: Number(r.amount),
        txn_date: r.txnDate,
        note: r.note,
        created_at: r.createdAt,
      })),
    };
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

export async function createAccountTransactionAction(input: {
  accountId?: string | null;
  toAccountId?: string | null;
  branchId?: string | null;
  type: string;
  amount: number;
  note?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(accountTransactions).values({
      id,
      accountId: input.accountId || null,
      toAccountId: input.toAccountId || null,
      branchId: input.branchId || null,
      userId: session.user!.id!,
      type: input.type,
      amount: money(input.amount),
      note: input.note || null,
    });
    revalidatePath("/accounts");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Txn failed",
      status: 500,
    };
  }
}

export async function deleteAccountTransactionAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(accountTransactions).where(eq(accountTransactions.id, input.id));
    revalidatePath("/accounts");
    return { ok: true };
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

export async function listJournalEntriesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireManager();
    const rows = await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.createdAt))
      .limit(200);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        entry_number: r.entryNumber,
        entry_date: r.entryDate,
        memo: r.memo,
        branch_id: r.branchId,
        created_by: r.createdBy,
        status: r.status,
        created_at: r.createdAt,
      })),
    };
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

export async function deleteJournalEntryAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireManager();
    await db.delete(journalEntries).where(eq(journalEntries.id, input.id));
    revalidatePath("/journal");
    return { ok: true };
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
