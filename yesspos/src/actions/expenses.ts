"use server";

import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { expenses, expenseCategories } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";
import { money, type Dict } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listExpenseCategoriesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.nameEn));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        name: r.name,
        name_en: r.nameEn ?? r.name,
        name_bn: r.nameBn,
        description: r.description,
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

export async function listExpensesAction(input?: {
  from?: string;
  to?: string;
  branchId?: string;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const clauses = [];
    if (input?.from) clauses.push(gte(expenses.spentOn, new Date(input.from)));
    if (input?.to) clauses.push(lte(expenses.spentOn, new Date(input.to)));
    if (input?.branchId) clauses.push(eq(expenses.branchId, input.branchId));
    let q = db.select().from(expenses).$dynamic();
    if (clauses.length) q = q.where(and(...clauses));
    const rows = await q.orderBy(desc(expenses.createdAt));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        category_id: r.categoryId,
        branch_id: r.branchId,
        account_id: r.accountId,
        amount: Number(r.amount),
        spent_on:
          r.spentOn instanceof Date
            ? r.spentOn.toISOString().slice(0, 10)
            : r.spentOn
              ? String(r.spentOn).slice(0, 10)
              : r.expenseDate instanceof Date
                ? r.expenseDate.toISOString().slice(0, 10)
                : null,
        payment_method: r.paymentMethod,
        expense_date: r.expenseDate,
        reference: r.reference,
        note: r.note,
        created_by: r.createdBy,
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

export async function createExpenseAction(input: {
  categoryId?: string | null;
  branchId?: string | null;
  accountId?: string | null;
  amount: number;
  spentOn?: string;
  paymentMethod?: string | null;
  reference?: string | null;
  note?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    const spent = input.spentOn ? new Date(input.spentOn) : new Date();
    await db.insert(expenses).values({
      id,
      categoryId: input.categoryId || null,
      branchId: input.branchId || null,
      accountId: input.accountId || null,
      amount: money(input.amount),
      spentOn: spent,
      expenseDate: spent,
      paymentMethod: input.paymentMethod || null,
      reference: input.reference || null,
      note: input.note || null,
      createdBy: session.user!.id!,
    });
    revalidatePath("/expenses");
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

export async function deleteExpenseAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    await db.delete(expenses).where(eq(expenses.id, input.id));
    revalidatePath("/expenses");
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
