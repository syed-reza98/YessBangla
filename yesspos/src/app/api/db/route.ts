import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth } from "@/auth";

const PUBLIC_SELECT = new Set([
  "products",
  "categories",
  "subcategories",
  "brands",
  "promotions",
  "business_settings",
  "delivery_zones",
  "site_content",
]);

/** Guest checkout / public track — inserts only for allowlisted tables. */
const PUBLIC_INSERT = new Set([
  "delivery_orders",
  "delivery_order_items",
  "customer_addresses",
  "delivery_feedback",
]);

const STAFF_ROLES = new Set(["cashier", "manager", "admin", "super_admin"]);

/** UI legacy column → real MySQL column mappings. */
const COLUMN_ALIASES: Record<string, Record<string, string>> = {
  products: {
    price: "selling_price",
    cost: "cost_price",
    name_en: "name_en",
    name_bn: "name_bn",
  },
  sales: {
    invoice_no: "invoice_number",
    paid: "paid_amount",
    due: "due_amount",
    contact_id: "customer_id",
  },
  coupons: {
    type: "discount_type",
    value: "discount_value",
    min_amount: "min_order_amount",
    expires_on: "valid_until",
    starts_on: "valid_from",
  },
  product_stock: {
    stock: "quantity",
  },
};

function mapFilterCol(table: string, col: string) {
  return COLUMN_ALIASES[table]?.[col] || col;
}

function mapWriteKey(table: string, key: string) {
  return COLUMN_ALIASES[table]?.[key] || key;
}

/** Enrich rows so UIs selecting legacy property names keep working. */
function aliasCatalogRows(table: string, rows: any[]) {
  if (table !== "categories" && table !== "brands" && table !== "products" && table !== "sales" && table !== "coupons" && table !== "product_stock") {
    return rows;
  }
  return rows.map((r) => {
    if (!r || typeof r !== "object") return r;
    const out: any = { ...r };

    if (table === "categories" || table === "brands" || table === "products") {
      out.name_en = r.name_en ?? r.name ?? null;
      out.name_bn = r.name_bn ?? null;
    }

    if (table === "products") {
      const price =
        r.price != null
          ? r.price
          : r.selling_price != null
            ? Number(r.selling_price)
            : null;
      out.price = price;
      out.cost =
        r.cost != null ? r.cost : r.cost_price != null ? Number(r.cost_price) : null;
      out.selling_price = r.selling_price ?? price;
    }

    if (table === "sales") {
      out.invoice_no = r.invoice_no ?? r.invoice_number ?? null;
      out.paid = r.paid != null ? Number(r.paid) : r.paid_amount != null ? Number(r.paid_amount) : 0;
      out.due = r.due != null ? Number(r.due) : r.due_amount != null ? Number(r.due_amount) : 0;
      out.contact_id = r.contact_id ?? r.customer_id ?? null;
    }

    if (table === "coupons") {
      out.type = r.type ?? r.discount_type ?? "percent";
      out.value = r.value != null ? Number(r.value) : r.discount_value != null ? Number(r.discount_value) : 0;
      out.min_amount = r.min_amount != null ? Number(r.min_amount) : r.min_order_amount != null ? Number(r.min_order_amount) : 0;
      out.expires_on = r.expires_on ?? r.valid_until ?? null;
      out.starts_on = r.starts_on ?? r.valid_from ?? null;
    }

    if (table === "product_stock") {
      out.stock = r.stock != null ? Number(r.stock) : r.quantity != null ? Number(r.quantity) : 0;
    }

    return out;
  });
}

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }
  const role = (session.user as { role?: string }).role || "customer";
  if (!STAFF_ROLES.has(role)) {
    throw Object.assign(new Error("Insufficient permissions"), { status: 403 });
  }
  return session;
}

async function assertAccess(action: string, table: string) {
  if (action === "select" && PUBLIC_SELECT.has(table)) return;
  if (action === "insert" && PUBLIC_INSERT.has(table)) return;
  await requireStaffSession();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, table, filters, order, limit, offset, single, maybeSingle, data } = body;

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
            const parts = f.val.split(",");
            const subClauses: string[] = [];
            for (const part of parts) {
              const [c, op, v] = part.split(".");
              if (!c || !op || v === undefined) continue;
              const col = mapFilterCol(table, c.trim());
              if (!/^[a-zA-Z0-9_]+$/.test(col)) continue;
              if (op === "eq") {
                subClauses.push(`\`${col}\` = ?`);
                values.push(v);
              } else if (op === "like" || op === "ilike") {
                subClauses.push(`\`${col}\` LIKE ?`);
                values.push(v);
              }
            }
            if (subClauses.length > 0) {
              clauses.push(`(${subClauses.join(" OR ")})`);
            }
            continue;
          }

          if (!/^[a-zA-Z0-9_]+$/.test(f.col)) continue;
          const col = mapFilterCol(table, f.col);
          if (!/^[a-zA-Z0-9_]+$/.test(col)) continue;

          if (f.op === "eq") {
            clauses.push(`\`${col}\` = ?`);
            values.push(f.val);
          } else if (f.op === "neq") {
            clauses.push(`\`${col}\` != ?`);
            values.push(f.val);
          } else if (f.op === "gte") {
            clauses.push(`\`${col}\` >= ?`);
            values.push(f.val);
          } else if (f.op === "lte") {
            clauses.push(`\`${col}\` <= ?`);
            values.push(f.val);
          } else if (f.op === "gt") {
            clauses.push(`\`${col}\` > ?`);
            values.push(f.val);
          } else if (f.op === "lt") {
            clauses.push(`\`${col}\` < ?`);
            values.push(f.val);
          } else if (f.op === "like" || f.op === "ilike") {
            clauses.push(`\`${col}\` LIKE ?`);
            values.push(f.val);
          } else if (f.op === "not_is" || f.op === "not") {
            if (f.val === null) {
              clauses.push(`\`${col}\` IS NOT NULL`);
            } else {
              clauses.push(`\`${col}\` != ?`);
              values.push(f.val);
            }
          } else if (f.op === "in") {
            if (Array.isArray(f.val) && f.val.length > 0) {
              const placeholders = f.val.map(() => "?").join(",");
              clauses.push(`\`${col}\` IN (${placeholders})`);
              values.push(...f.val);
            }
          }
        }
        if (clauses.length > 0) {
          query += ` WHERE ${clauses.join(" AND ")}`;
        }
      }

      if (order && order.col && /^[a-zA-Z0-9_]+$/.test(order.col)) {
        const orderCol = mapFilterCol(table, order.col);
        if (/^[a-zA-Z0-9_]+$/.test(orderCol)) {
          query += ` ORDER BY \`${orderCol}\` ${order.ascending === false ? "DESC" : "ASC"}`;
        }
      }

      if (limit) {
        query += ` LIMIT ${Number(limit)}`;
        if (offset) {
          query += ` OFFSET ${Number(offset)}`;
        }
      }

      const [rows] = await pool.query(query, values);
      let resData = rows as any[];
      resData = aliasCatalogRows(table, resData);

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

    if (action === "insert") {
      if (!data) {
        return NextResponse.json({ error: "No data provided", data: null }, { status: 400 });
      }
      const records = Array.isArray(data) ? data : [data];
      const insertedRows: any[] = [];

      for (const rec of records) {
        const mapped: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rec)) {
          if (!/^[a-zA-Z0-9_]+$/.test(k)) continue;
          const key = mapWriteKey(table, k);
          mapped[key] = v;
        }
        if (table === "products") {
          if (mapped.name_en && !mapped.name) mapped.name = mapped.name_en;
          if (mapped.name && !mapped.name_en) mapped.name_en = mapped.name;
        }

        const keys = Object.keys(mapped);
        if (keys.length === 0) continue;

        if (!keys.includes("id")) {
          keys.unshift("id");
          mapped.id = crypto.randomUUID();
        }

        const cols = keys.map((k) => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const vals = keys.map((k) => {
          const val = mapped[k];
          if (val !== null && typeof val === "object") {
            return JSON.stringify(val);
          }
          return val;
        });

        const query = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`;
        await pool.query(query, vals);
        insertedRows.push(mapped);
      }

      return NextResponse.json({
        data: Array.isArray(data) ? insertedRows : insertedRows[0],
        error: null,
      });
    }

    if (action === "upsert") {
      const payload = data?.data ?? data;
      if (!payload) {
        return NextResponse.json({ error: "No upsert data provided", data: null }, { status: 400 });
      }
      const records = Array.isArray(payload) ? payload : [payload];
      const upsertedRows: any[] = [];

      for (const rec of records) {
        const mapped: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rec)) {
          if (!/^[a-zA-Z0-9_]+$/.test(k)) continue;
          const key = mapWriteKey(table, k);
          mapped[key] = v;
        }
        if (table === "products") {
          if (mapped.name_en && !mapped.name) mapped.name = mapped.name_en;
          if (mapped.name && !mapped.name_en) mapped.name_en = mapped.name;
        }

        const keys = Object.keys(mapped);
        if (keys.length === 0) continue;

        if (!keys.includes("id")) {
          keys.unshift("id");
          mapped.id = crypto.randomUUID();
        }

        const cols = keys.map((k) => `\`${k}\``).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const vals = keys.map((k) => {
          const val = mapped[k];
          if (val !== null && typeof val === "object") {
            return JSON.stringify(val);
          }
          return val;
        });

        const updateAssignments = keys
          .filter((k) => k !== "id")
          .map((k) => `\`${k}\` = VALUES(\`${k}\`)`)
          .join(", ");

        const query = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})` +
          (updateAssignments ? ` ON DUPLICATE KEY UPDATE ${updateAssignments}` : "");

        await pool.query(query, vals);
        upsertedRows.push(mapped);
      }

      return NextResponse.json({
        data: Array.isArray(payload) ? upsertedRows : upsertedRows[0],
        error: null,
      });
    }

    if (action === "update") {
      if (!data || typeof data !== "object") {
        return NextResponse.json({ error: "No update data provided", data: null }, { status: 400 });
      }

      const mapped: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        if (!/^[a-zA-Z0-9_]+$/.test(k) || k === "id") continue;
        const key = mapWriteKey(table, k);
        mapped[key] = v;
      }
      if (table === "products") {
        if (mapped.name_en && !mapped.name) mapped.name = mapped.name_en;
        if (mapped.name && mapped.name_en === undefined) {
          /* keep name_en if only name sent */
        }
      }

      const keys = Object.keys(mapped);
      if (keys.length === 0) {
        return NextResponse.json({ data: null, error: "No valid fields to update" });
      }

      const setClauses = keys.map((k) => `\`${k}\` = ?`).join(", ");
      const vals = keys.map((k) => {
        const val = mapped[k];
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
          const col = mapFilterCol(table, f.col);
          if (f.op === "eq") {
            clauses.push(`\`${col}\` = ?`);
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
          const col = mapFilterCol(table, f.col);
          if (f.op === "eq") {
            clauses.push(`\`${col}\` = ?`);
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
    console.error("[YessPOS API/DB] Error:", err);
    const status = err?.status === 401 || err?.status === 403 ? err.status : 500;
    return NextResponse.json(
      { error: err?.message || "Internal database error", data: null },
      { status }
    );
  }
}
