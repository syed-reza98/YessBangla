"use server";

import { and, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { chartAccounts, journalEntries, erpAuditLog } from "@/db/schema";
import { requireAdmin, requireStaff, AuthError } from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

/** Post a simple memo journal (chart account balances adjusted). */
export async function postJournalAction(input: {
  date?: string;
  memo?: string;
  ref?: string;
  lines: { account_code: string; debit: number; credit: number; note?: string }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    if (!input.lines?.length) {
      return { ok: false, error: "Journal needs lines", status: 400 };
    }
    const debit = input.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = input.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    if (Math.abs(debit - credit) > 0.01) {
      return { ok: false, error: "Debits must equal credits", status: 400 };
    }

    const id = crypto.randomUUID();
    const entryDate = input.date ? new Date(input.date) : new Date();

    await db.transaction(async (tx) => {
      await tx.insert(journalEntries).values({
        id,
        entryDate,
        reference: input.ref || null,
        description: input.memo || null,
      });

      for (const line of input.lines) {
        const delta = Number(line.debit || 0) - Number(line.credit || 0);
        if (Math.abs(delta) < 0.0001) continue;
        await tx.execute(
          sql`UPDATE chart_accounts
              SET balance = balance + ${delta}
              WHERE code = ${line.account_code}`
        );
      }

      await tx.insert(erpAuditLog).values({
        id: crypto.randomUUID(),
        action: "post_journal",
        entity: "journal_entries",
        entityId: id,
        details: JSON.stringify({
          memo: input.memo,
          lines: input.lines.length,
          debit,
          credit,
        }),
      });
    });

    revalidatePath("/admin/finance");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Journal failed",
      status: 500,
    };
  }
}

export async function dayBookAction(input: {
  day: string;
}): Promise<ActionResult<{ entries: unknown[] }>> {
  try {
    await requireStaff();
    const start = new Date(input.day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const entries = await db
      .select()
      .from(journalEntries)
      .where(
        and(gte(journalEntries.entryDate, start), lte(journalEntries.entryDate, end))
      );

    return { ok: true, entries };
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

export async function financeSummaryAction(input: {
  from: string;
  to: string;
}): Promise<
  ActionResult<{
    accounts: { code: string; name: string; type: string; balance: string }[];
    from: string;
    to: string;
  }>
> {
  try {
    await requireStaff();
    const accounts = await db.select().from(chartAccounts);
    return {
      ok: true,
      from: input.from,
      to: input.to,
      accounts: accounts.map((a) => ({
        code: a.code,
        name: a.name,
        type: a.type,
        balance: String(a.balance),
      })),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Summary failed",
      status: 500,
    };
  }
}

export async function partyStatementAction(input: {
  kind: string;
  partyId: string;
  from: string;
  to: string;
}): Promise<ActionResult<{ rows: unknown[]; kind: string; partyId: string }>> {
  try {
    await requireStaff();
    // Minimal stub backed by audit log until party ledgers are expanded
    const rows = await db
      .select()
      .from(erpAuditLog)
      .where(eq(erpAuditLog.entityId, input.partyId))
      .limit(200);
    return {
      ok: true,
      kind: input.kind,
      partyId: input.partyId,
      rows,
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
