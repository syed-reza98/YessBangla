"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { productStock, products } from "@/db/schema";

export type ConsistencyIssue = {
  product_id: string | null;
  name: string;
  issue: string;
  detail: string;
};

export type ConsistencyLine = {
  product_id: string;
  name?: string;
  price?: number;
  pack_size?: string | null;
  quantity: number;
};

/** Server-side price/pack/stock consistency check before checkout. */
export async function checkOrderConsistencyAction(
  lines: ConsistencyLine[]
): Promise<
  | { ok: true; issues: ConsistencyIssue[] }
  | { ok: false; error: string; status?: number }
> {
  try {
    if (!lines?.length) return { ok: true, issues: [] };

    const issues: ConsistencyIssue[] = [];

    for (const line of lines) {
      const want = Math.max(Number(line.quantity) || 0, 0);
      const [p] = await db
        .select()
        .from(products)
        .where(eq(products.id, line.product_id))
        .limit(1);

      if (!p) {
        issues.push({
          product_id: null,
          name: line.name || "Unknown",
          issue: "missing_product",
          detail: "Product no longer exists in the catalog",
        });
        continue;
      }

      const displayName = p.nameEn || p.name;

      if (!p.isActive) {
        issues.push({
          product_id: p.id,
          name: displayName,
          issue: "inactive",
          detail: "Product is currently unavailable",
        });
      }

      if (line.price !== undefined && line.price !== null) {
        const catalogPrice = Number(p.sellingPrice) || 0;
        if (Math.abs(Number(line.price) - catalogPrice) > 0.009) {
          issues.push({
            product_id: p.id,
            name: displayName,
            issue: "price_mismatch",
            detail: `Cart price ${line.price}, current price ${catalogPrice}`,
          });
        }
      }

      const pack = (p.packSize || "").trim();
      if (!pack) {
        issues.push({
          product_id: p.id,
          name: displayName,
          issue: "pack_size_missing",
          detail: "Pack size / weight is not set for this product",
        });
      } else if (
        line.pack_size != null &&
        String(line.pack_size).trim() !== "" &&
        String(line.pack_size).trim() !== pack
      ) {
        issues.push({
          product_id: p.id,
          name: displayName,
          issue: "pack_size_mismatch",
          detail: `Selected pack ${line.pack_size}, catalog pack ${pack}`,
        });
      }

      const [stockAgg] = await db
        .select({
          total: sql<number>`coalesce(sum(${productStock.quantity}), 0)`.mapWith(
            Number
          ),
          branchCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(productStock)
        .where(eq(productStock.productId, p.id));

      const totalStock = Number(stockAgg?.total) || 0;
      const branchCount = Number(stockAgg?.branchCount) || 0;
      const productStockQty = Number(p.stock) || 0;

      if (branchCount > 0 && totalStock !== productStockQty) {
        issues.push({
          product_id: p.id,
          name: displayName,
          issue: "stock_desync",
          detail: `Branch stock total ${totalStock} does not match product stock ${productStockQty}`,
        });
      }

      const available = Math.max(productStockQty, totalStock);
      if (want > available) {
        issues.push({
          product_id: p.id,
          name: displayName,
          issue: "insufficient_stock",
          detail: `Requested ${want}, available ${available}`,
        });
      }
    }

    return { ok: true, issues };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Consistency check failed",
      status: 500,
    };
  }
}
