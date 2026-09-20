import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/auth";

const PUBLIC_SELECT = new Set([
  "products",
  "categories",
  "brands",
  "offers",
  "lab_tests",
  "doctors",
  "home_diagnostics",
  "home_services",
  "app_settings",
  "medicine_directory",
]);

const PUBLIC_INSERT = new Set([
  "contact_messages",
  "prescriptions",
  "support_messages",
]);

const STAFF_ROLES = new Set([
  "pharmacist",
  "doctor",
  "staff",
  "erp_manager",
  "admin",
  "super_admin",
]);

// Sensitive tables that only staff can read
const SENSITIVE_TABLES = new Set([
  "users",
  "user_roles",
  "chart_accounts",
  "journal_entries",
  "journal_entry_lines",
  "fiscal_periods",
  "error_logs",
]);

async function assertAccess(action: string, table: string) {
  if (action === "select" && PUBLIC_SELECT.has(table)) return;
  if (action === "insert" && PUBLIC_INSERT.has(table)) return;

  const session = await auth();
  if (!session?.user) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  const role = (session.user as { role?: string }).role || "customer";

  // Prevent regular users from reading sensitive system / financial tables
  if (action === "select") {
    if (SENSITIVE_TABLES.has(table) && !STAFF_ROLES.has(role)) {
      throw Object.assign(new Error("Insufficient permissions"), { status: 403 });
    }
    return;
  }

  if (!STAFF_ROLES.has(role) && action !== "insert" && action !== "upsert") {
    throw Object.assign(new Error("Insufficient permissions"), { status: 403 });
  }
  if (!STAFF_ROLES.has(role) && !PUBLIC_INSERT.has(table)) {
    throw Object.assign(new Error("Insufficient permissions"), { status: 403 });
  }
}

function parseOrFilter(expr: string, values: any[]): string | null {
  // expr is e.g. "name.ilike.%pan%,en.ilike.%pan%" or "id.eq.123,name.ilike.%foo%"
  const parts = expr.split(",");
  const orClauses: string[] = [];
  for (const part of parts) {
    const segments = part.split(".");
    if (segments.length < 3) continue;
    const col = segments[0];
    const op = segments[1];
    const val = segments.slice(2).join(".");
    if (!/^[a-zA-Z0-9_]+$/.test(col)) continue;

    if (op === "eq") {
      orClauses.push(`\`${col}\` = ?`);
      values.push(val);
    } else if (op === "neq") {
      orClauses.push(`\`${col}\` != ?`);
      values.push(val);
    } else if (op === "like" || op === "ilike") {
      orClauses.push(`\`${col}\` LIKE ?`);
      values.push(val);
    } else if (op === "gte") {
      orClauses.push(`\`${col}\` >= ?`);
      values.push(val);
    } else if (op === "lte") {
      orClauses.push(`\`${col}\` <= ?`);
      values.push(val);
    }
  }
  return orClauses.length > 0 ? `(${orClauses.join(" OR ")})` : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, table, filters, order, limit, offset, single, maybeSingle, data, onConflict } = body;

    // Sanitize table name
    if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) {
      return NextResponse.json({ error: "Invalid table name", data: null }, { status: 400 });
    }

    await assertAccess(action, table);

    if (action === "select") {
      let query = `SELECT * FROM \`${table}\``;
      const values: any[] = [];

      if (filters && Array.isArray(filters) && filters.length > 0) {
        const clauses: string[] = [];
        for (const f of filters) {
          if (f.op === "or" && typeof f.val === "string") {
            const orClause = parseOrFilter(f.val, values);
            if (orClause) clauses.push(orClause);
            continue;
          }
          if (!/^[a-zA-Z0-9_]+$/.test(f.col)) continue;
          if (f.op === "eq") {
            clauses.push(`\`${f.col}\` = ?`);
            values.push(f.val);
          } else if (f.op === "neq") {
            clauses.push(`\`${f.col}\` != ?`);
            values.push(f.val);
          } else if (f.op === "in") {
            if (Array.isArray(f.val) && f.val.length > 0) {
              const placeholders = f.val.map(() => "?").join(",");
              clauses.push(`\`${f.col}\` IN (${placeholders})`);
              values.push(...f.val);
            }
          } else if (f.op === "like" || f.op === "ilike") {
            clauses.push(`\`${f.col}\` LIKE ?`);
            values.push(f.val);
          } else if (f.op === "gte") {
            clauses.push(`\`${f.col}\` >= ?`);
            values.push(f.val);
          } else if (f.op === "lte") {
            clauses.push(`\`${f.col}\` <= ?`);
            values.push(f.val);
          }
        }
        if (clauses.length > 0) {
          query += ` WHERE ${clauses.join(" AND ")}`;
        }
      }

      if (order && order.col && /^[a-zA-Z0-9_]+$/.test(order.col)) {
        query += ` ORDER BY \`${order.col}\` ${order.ascending === false ? "DESC" : "ASC"}`;
      }

      if (limit) {
        query += ` LIMIT ${Number(limit)}`;
        if (offset) {
          query += ` OFFSET ${Number(offset)}`;
        }
      }

      const [rows] = await pool.query(query, values);
      const resData = rows as any[];

      if (single) {
        if (resData.length === 0) {
          return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ data: resData[0], error: null });
      }

      if (maybeSingle) {
        return NextResponse.json({ data: resData.length > 0 ? resData[0] : null, error: null });
      }

      return NextResponse.json({ data: resData, error: null, count: resData.length });
    }

    if (action === "insert" || action === "upsert") {
      if (!data) {
        return NextResponse.json({ error: "No data provided", data: null }, { status: 400 });
      }
      const records = Array.isArray(data) ? data : [data];
      const insertedRows: any[] = [];

      for (const rec of records) {
        const keys = Object.keys(rec).filter((k) => /^[a-zA-Z0-9_]+$/.test(k));
        if (keys.length === 0) continue;

        if (!keys.includes("id")) {
          keys.unshift("id");
          rec.id = crypto.randomUUID();
        }

        const cols = keys.map((k) => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const vals = keys.map((k) => {
          const val = rec[k];
          if (val !== null && typeof val === "object") {
            return JSON.stringify(val);
          }
          return val;
        });

        let query = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`;
        if (action === "upsert") {
          const updateKeys = keys.filter((k) => k !== "id" && (!onConflict || k !== onConflict));
          if (updateKeys.length > 0) {
            const updateClauses = updateKeys.map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
            query += ` ON DUPLICATE KEY UPDATE ${updateClauses}`;
          }
        }

        await pool.query(query, vals);
        insertedRows.push(rec);
      }

      return NextResponse.json({ data: Array.isArray(data) ? insertedRows : insertedRows[0], error: null });
    }

    if (action === "update") {
      if (!data || typeof data !== "object") {
        return NextResponse.json({ error: "No update data provided", data: null }, { status: 400 });
      }

      const keys = Object.keys(data).filter((k) => /^[a-zA-Z0-9_]+$/.test(k) && k !== "id");
      if (keys.length === 0) {
        return NextResponse.json({ data: null, error: "No valid fields to update" });
      }

      const setClauses = keys.map((k) => `\`${k}\` = ?`).join(", ");
      const vals = keys.map((k) => {
        const val = data[k];
        if (val !== null && typeof val === "object") {
          return JSON.stringify(val);
        }
        return val;
      });

      let query = `UPDATE \`${table}\` SET ${setClauses}`;

      if (filters && Array.isArray(filters) && filters.length > 0) {
        const clauses: string[] = [];
        for (const f of filters) {
          if (!/^[a-zA-Z0-9_]+$/.test(f.col)) continue;
          if (f.op === "eq") {
            clauses.push(`\`${f.col}\` = ?`);
            vals.push(f.val);
          }
        }
        if (clauses.length > 0) {
          query += ` WHERE ${clauses.join(" AND ")}`;
        }
      }

      await pool.query(query, vals);
      return NextResponse.json({ data, error: null });
    }

    if (action === "delete") {
      let query = `DELETE FROM \`${table}\``;
      const vals: any[] = [];

      if (filters && Array.isArray(filters) && filters.length > 0) {
        const clauses: string[] = [];
        for (const f of filters) {
          if (!/^[a-zA-Z0-9_]+$/.test(f.col)) continue;
          if (f.op === "eq") {
            clauses.push(`\`${f.col}\` = ?`);
            vals.push(f.val);
          }
        }
        if (clauses.length > 0) {
          query += ` WHERE ${clauses.join(" AND ")}`;
        }
      }

      await pool.query(query, vals);
      return NextResponse.json({ data: true, error: null });
    }

    return NextResponse.json({ error: `Unsupported action ${action}`, data: null }, { status: 400 });
  } catch (err: any) {
    console.error("[Oushodhwala API/DB] Error:", err);
    const status = err?.status === 401 || err?.status === 403 ? err.status : 500;
    return NextResponse.json(
      { error: err?.message || "Internal database error", data: null },
      { status }
    );
  }
}
