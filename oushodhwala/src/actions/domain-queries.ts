"use server";

/**
 * Focused list/query Server Actions for admin and account UIs.
 */

import { and, asc, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  expenses,
  journalEntries,
  apiTestLogs,
  purchaseOrders,
  purchaseOrderItems,
  stockMovements,
  productReviews,
  errorLogs,
  stockAlerts,
  stockAdjustments,
  stockAdjustmentItems,
  stockCounts,
  products,
  posSales,
  orderReturns,
  serviceRequests,
  diagnosticBookings,
  doctorReviews,
  appointments,
  orders,
  orderItems,
  loyaltyTransactions,
  prescriptions,
  appSettings,
  apiEndpoints,
} from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";
import { productToLegacy } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
}

function snakeRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}

/* ---------- finance ---------- */

export async function listExpensesAction(limit = 200) {
  try {
    await requireStaff();
    const rows = await db.select().from(expenses).orderBy(desc(expenses.spentOn)).limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        spent_on: r.spentOn,
        method: "cash",
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listJournalEntriesAction(limit = 50) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(journalEntries)
      .orderBy(desc(journalEntries.entryDate))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        entry_date: r.entryDate,
        journal_lines: [],
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- api hub ---------- */

export async function listApiTestLogsAction(limit = 50) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(apiTestLogs)
      .orderBy(desc(apiTestLogs.createdAt))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        status_code: r.statusCode,
        duration_ms: r.durationMs,
        endpoint_id: r.endpointId,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertAppSettingByKeyAction(input: {
  key: string;
  value: string;
  label?: string;
}) {
  try {
    await requireStaff();
    const key = input.key.slice(0, 100);
    const [existing] = await db
      .select({ id: appSettings.id })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    if (existing) {
      await db
        .update(appSettings)
        .set({ value: input.value, label: input.label || null })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({
        id: crypto.randomUUID(),
        key,
        value: input.value,
        label: input.label || null,
      });
    }
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function markApiEndpointTestedAction(input: {
  id: string;
  last_status?: number;
  last_ok?: boolean;
  last_ms?: number;
}) {
  try {
    await requireStaff();
    await db
      .update(apiEndpoints)
      .set({ updatedAt: new Date() })
      .where(eq(apiEndpoints.id, input.id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- procurement / stock ---------- */

export async function listPurchaseOrdersAction(limit = 50) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit);
    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db.select().from(purchaseOrderItems).where(inArray(purchaseOrderItems.poId, ids))
      : [];
    const byPo = new Map<string, Record<string, unknown>[]>();
    for (const it of items) {
      const list = byPo.get(it.poId) || [];
      list.push(snakeRow(it as unknown as Record<string, unknown>));
      byPo.set(it.poId, list);
    }
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        po_number: r.poNumber,
        supplier_id: r.supplierId,
        supplier_name: r.supplierName,
        purchase_order_items: byPo.get(r.id) || [],
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listStockMovementsAction(limit = 60) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockMovements)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listStockAdjustmentsAction(limit = 30) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockAdjustments)
      .orderBy(desc(stockAdjustments.createdAt))
      .limit(limit);
    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db
          .select()
          .from(stockAdjustmentItems)
          .where(inArray(stockAdjustmentItems.adjId, ids))
      : [];
    const byAdj = new Map<string, Record<string, unknown>[]>();
    for (const it of items) {
      const list = byAdj.get(it.adjId) || [];
      list.push(snakeRow(it as unknown as Record<string, unknown>));
      byAdj.set(it.adjId, list);
    }
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        adj_no: r.adjNo,
        stock_adjustment_items: byAdj.get(r.id) || [],
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function createStockCountAction(input: { count_no?: string } = {}) {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    const countNo = String(input.count_no || `SC-${Date.now()}`).slice(0, 100);
    await db.insert(stockCounts).values({
      id,
      countNo,
      status: "draft",
      createdBy: session.user?.id || null,
    });
    revalidatePath("/admin");
    return { ok: true as const, data: { id, count_no: countNo, status: "draft" } };
  } catch (err) {
    return fail(err);
  }
}

export async function listErrorLogsAction(limit = 60) {
  try {
    await requireStaff();
    const rows = await db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listStockAlertsAction(limit = 50) {
  try {
    await requireStaff();
    const rows = await db.select().from(stockAlerts).orderBy(desc(stockAlerts.createdAt)).limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- products / POS ---------- */

export async function listProductsImageIndexAction(from = 0, limit = 1000) {
  try {
    await requireStaff();
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name))
      .limit(limit)
      .offset(from);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        en: r.name,
        image_url: r.imageUrl,
        medicine_image_url: r.imageUrl,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function posSearchProductsAction(input: {
  q?: string;
  category?: string;
  limit?: number;
}) {
  try {
    await requireStaff();
    const lim = Math.min(input.limit || 80, 120);
    const conditions = [eq(products.isActive, true)];
    if (input.q && input.q.trim().length > 1) {
      const pat = `%${input.q.trim()}%`;
      conditions.push(
        or(
          like(products.name, pat),
          like(products.genericName, pat),
          like(products.manufacturer, pat)
        )!
      );
    }
    if (input.category && input.category !== "all") {
      conditions.push(eq(products.categoryId, input.category));
    }
    const rows = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.stock))
      .limit(lim);
    return {
      ok: true as const,
      data: rows.map((p) => {
        const leg = productToLegacy(p);
        return {
          id: String(leg.id),
          name: String(leg.name),
          en: String(leg.en),
          price: Number(leg.price),
          stock: Number(leg.stock),
          pack: String(leg.pack || ""),
          category: String(leg.category || ""),
          brand: String(leg.brand || leg.manufacturer || ""),
          image_url: String(leg.image_url || ""),
          medicine_image_url: String(leg.medicine_image_url || leg.image_url || ""),
          emoji: "",
          generic: String(leg.generic || ""),
        };
      }),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function posScanProductAction(q: string) {
  try {
    await requireStaff();
    const pat = `%${q.trim()}%`;
    const [row] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(eq(products.id, q.trim()), like(products.name, pat), like(products.genericName, pat))
        )
      )
      .limit(1);
    if (!row) return { ok: true as const, data: null };
    const leg = productToLegacy(row);
    return {
      ok: true as const,
      data: {
        id: String(leg.id),
        name: String(leg.name),
        en: String(leg.en),
        price: Number(leg.price),
        stock: Number(leg.stock),
        pack: String(leg.pack || ""),
        category: String(leg.category || ""),
        brand: String(leg.brand || ""),
        image_url: String(leg.image_url || ""),
        medicine_image_url: String(leg.medicine_image_url || leg.image_url || ""),
        emoji: "",
      },
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listRecentPosSalesAction(limit = 10) {
  try {
    await requireStaff();
    const rows = await db.select().from(posSales).orderBy(desc(posSales.createdAt)).limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        invoice_no: r.invoiceNumber,
        customer_name: "",
        total: r.total,
        method: r.paymentMethod,
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function searchProductsForPoAction(q: string, limit = 8) {
  try {
    await requireStaff();
    const pat = `%${q.trim()}%`;
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        unitPrice: products.unitPrice,
        stock: products.stock,
      })
      .from(products)
      .where(and(eq(products.isActive, true), or(like(products.name, pat), like(products.genericName, pat))))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        price: Number(r.unitPrice),
        stock: r.stock,
        en: r.name,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- reviews / returns / moderation ---------- */

export async function listProductReviewsAction(productId: string, limit = 50) {
  try {
    const rows = await db
      .select()
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.status, "approved")))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listAdminProductReviewsAction(input?: { status?: string; limit?: number }) {
  try {
    await requireStaff();
    const lim = input?.limit || 200;
    const rows = input?.status
      ? await db
          .select()
          .from(productReviews)
          .where(eq(productReviews.status, input.status))
          .orderBy(desc(productReviews.createdAt))
          .limit(lim)
      : await db.select().from(productReviews).orderBy(desc(productReviews.createdAt)).limit(lim);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listOrderReturnsAction(input?: { status?: string; limit?: number }) {
  try {
    await requireStaff();
    const lim = input?.limit || 200;
    const rows = input?.status
      ? await db
          .select()
          .from(orderReturns)
          .where(eq(orderReturns.status, input.status))
          .orderBy(desc(orderReturns.createdAt))
          .limit(lim)
      : await db.select().from(orderReturns).orderBy(desc(orderReturns.createdAt)).limit(lim);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function updateOrderReturnStatusAction(input: {
  id: string;
  status: string;
  admin_note?: string;
}) {
  try {
    await requireStaff();
    const patch: { status: string; details?: string } = { status: input.status };
    if (input.admin_note !== undefined) patch.details = input.admin_note;
    await db.update(orderReturns).set(patch).where(eq(orderReturns.id, input.id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- user-facing lists ---------- */

export async function listMyServiceRequestsAction(limit = 20) {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.userId, session.user!.id!))
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listMyDiagnosticBookingsAction(limit = 10) {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(diagnosticBookings)
      .where(eq(diagnosticBookings.userId, session.user!.id!))
      .orderBy(desc(diagnosticBookings.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listAdminDiagnosticBookingsAction(limit = 200) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(diagnosticBookings)
      .orderBy(desc(diagnosticBookings.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listDoctorReviewsAction(limit = 500) {
  try {
    const rows = await db
      .select({
        doctorId: doctorReviews.doctorId,
        rating: doctorReviews.rating,
        comment: doctorReviews.comment,
        createdAt: doctorReviews.createdAt,
      })
      .from(doctorReviews)
      .orderBy(desc(doctorReviews.createdAt))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        doctor_id: r.doctorId,
        rating: r.rating,
        comment: r.comment,
        patient_name: "",
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listMyAppointmentsAction() {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, session.user!.id!))
      .orderBy(desc(appointments.appointmentDate));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        scheduled_at: r.appointmentDate,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listMyLoyaltyTransactionsAction(limit = 8) {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, session.user!.id!))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        points: r.points,
        kind: r.kind,
        order_id: r.orderId,
        note: r.note,
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listAdminPrescriptionsAction(limit = 200) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(prescriptions)
      .orderBy(desc(prescriptions.createdAt))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        note: r.notes,
        admin_note: r.reviewNotes,
        file_urls: r.imageUrl ? [r.imageUrl] : [],
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listMyPrescriptionsAction(limit = 100) {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.userId, session.user!.id!))
      .orderBy(desc(prescriptions.createdAt))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        note: r.notes,
        admin_note: r.reviewNotes,
        file_urls: r.imageUrl ? [r.imageUrl] : [],
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- reports ---------- */

export async function listOrdersForReportsAction(from: string, to: string) {
  try {
    await requireStaff();
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        paymentMethod: orders.paymentMethod,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, start), lte(orders.createdAt, end)))
      .orderBy(asc(orders.createdAt));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        order_no: r.orderNumber,
        total: r.total,
        status: r.status,
        created_at: r.createdAt,
        customer_name: r.customerName,
        payment_method: r.paymentMethod,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listOrderItemsForReportsAction(from: string, to: string, limit = 5000) {
  try {
    await requireStaff();
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    const rows = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        orderCreatedAt: orders.createdAt,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(gte(orders.createdAt, start), lte(orders.createdAt, end)))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        product_id: r.productId,
        product_name: r.productName || r.productId,
        quantity: r.quantity,
        unit_price: r.unitPrice,
        created_at: r.orderCreatedAt,
        orders: { created_at: r.orderCreatedAt },
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listLowStockProductsAction(threshold = 20, limit = 200) {
  try {
    await requireStaff();
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        minStockAlert: products.minStockAlert,
        unitPrice: products.unitPrice,
      })
      .from(products)
      .where(and(eq(products.isActive, true), lte(products.stock, threshold)))
      .orderBy(asc(products.stock))
      .limit(limit);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        stock: r.stock,
        low_stock_threshold: r.minStockAlert,
        price: Number(r.unitPrice),
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- admin notification feed ---------- */

export async function getAdminNotificationFeedAction() {
  try {
    await requireStaff();
    const [orderRows, lowStock, returns, reviews, rx] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(inArray(orders.status, ["pending", "confirmed"]))
        .orderBy(desc(orders.createdAt))
        .limit(6),
      db
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
          minStockAlert: products.minStockAlert,
        })
        .from(products)
        .where(and(eq(products.isActive, true), lte(products.stock, 5)))
        .orderBy(asc(products.stock))
        .limit(5),
      db
        .select()
        .from(orderReturns)
        .where(eq(orderReturns.status, "pending"))
        .orderBy(desc(orderReturns.createdAt))
        .limit(5),
      db
        .select()
        .from(productReviews)
        .where(eq(productReviews.status, "pending"))
        .orderBy(desc(productReviews.createdAt))
        .limit(5),
      db
        .select({
          id: prescriptions.id,
          phone: prescriptions.phone,
          status: prescriptions.status,
          createdAt: prescriptions.createdAt,
        })
        .from(prescriptions)
        .where(eq(prescriptions.status, "pending"))
        .orderBy(desc(prescriptions.createdAt))
        .limit(5),
    ]);

    const reviewProductIds = [...new Set(reviews.map((r) => r.productId))];
    const nameRows = reviewProductIds.length
      ? await db
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(inArray(products.id, reviewProductIds))
      : [];
    const nameMap = new Map(nameRows.map((p) => [p.id, p.name]));

    return {
      ok: true as const,
      orders: orderRows.map((o) => ({
        id: o.id,
        order_no: o.orderNumber,
        customer_name: o.customerName,
        total: o.total,
        status: o.status,
        created_at: o.createdAt,
      })),
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        low_stock_threshold: p.minStockAlert,
      })),
      returns: returns.map((r) => snakeRow(r as unknown as Record<string, unknown>)),
      reviews: reviews.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        product_name: nameMap.get(r.productId) || r.productId,
      })),
      prescriptions: rx.map((r) => ({
        id: r.id,
        phone: r.phone,
        status: r.status,
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}
