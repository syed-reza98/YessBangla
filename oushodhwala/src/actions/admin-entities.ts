"use server";

import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  branches,
  deliveryZones,
  riders,
  suppliers,
  expenses,
  chartAccounts,
  stockCounts,
  stockCountItems,
  stockTransfers,
  stockTransferItems,
  serviceRequests,
  diagnosticBookings,
  orders,
  erpAuditLog,
  profiles,
  productReviews,
  prescriptions,
  refillReminders,
  errorLogs,
  apiEndpoints,
  apiTestLogs,
  mediaAssets,
  orderReturns,
  appointments,
} from "@/db/schema";
import { requireAuth, requireStaff, AuthError } from "@/lib/session-authz";

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

/* ---------- branches / zones / riders / suppliers ---------- */

export async function listBranchesAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(branches).orderBy(desc(branches.createdAt));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        active: r.isActive,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function insertBranchAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(branches).values({
      id,
      name: String(input.name || "").slice(0, 150),
      code: String(input.code || `BR-${Date.now()}`).slice(0, 50),
      address: String(input.address || "") || null,
      phone: String(input.phone || "") || null,
      isActive: true,
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function setBranchActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(branches).set({ isActive: active }).where(eq(branches.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listDeliveryZonesAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.name));
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function insertDeliveryZoneAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(deliveryZones).values({
      id,
      name: String(input.name || "").slice(0, 100),
      code: String(input.code || `Z-${Date.now()}`).slice(0, 50),
      baseFee: Number(input.base_fee || input.baseFee || 60).toFixed(2),
      active: true,
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function updateDeliveryZoneAction(id: string, patch: Record<string, unknown>) {
  try {
    await requireStaff();
    const set: Record<string, unknown> = {};
    if (patch.name !== undefined) set.name = String(patch.name);
    if (patch.code !== undefined) set.code = String(patch.code);
    if (patch.base_fee !== undefined || patch.baseFee !== undefined) {
      set.baseFee = Number(patch.base_fee ?? patch.baseFee).toFixed(2);
    }
    if (patch.active !== undefined) set.active = !!patch.active;
    await db.update(deliveryZones).set(set).where(eq(deliveryZones.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listRidersAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(riders).orderBy(desc(riders.createdAt));
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function getMyRiderAction() {
  try {
    const session = await requireAuth();
    const [row] = await db
      .select()
      .from(riders)
      .where(eq(riders.userId, session.user!.id!))
      .limit(1);
    return { ok: true as const, data: row ? snakeRow(row as unknown as Record<string, unknown>) : null };
  } catch (err) {
    return fail(err);
  }
}

export async function insertRiderAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(riders).values({
      id,
      userId: input.user_id ? String(input.user_id) : null,
      name: String(input.name || "").slice(0, 150),
      phone: String(input.phone || "").slice(0, 50),
      vehicle: String(input.vehicle || "bike").slice(0, 50),
      zone: String(input.zone || "").slice(0, 100),
      active: true,
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function setRiderActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(riders).set({ active }).where(eq(riders.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteRiderAction(id: string) {
  try {
    await requireStaff();
    await db.delete(riders).where(eq(riders.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listSuppliersAction(activeOnly = false) {
  try {
    await requireStaff();
    const rows = activeOnly
      ? await db
          .select()
          .from(suppliers)
          .where(eq(suppliers.isActive, true))
          .orderBy(asc(suppliers.name))
      : await db.select().from(suppliers).orderBy(asc(suppliers.name));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        active: r.isActive,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function insertSupplierAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(suppliers).values({
      id,
      name: String(input.name || "").trim().slice(0, 150),
      phone: String(input.phone || "") || null,
      email: String(input.email || "") || null,
      address: String(input.address || "") || null,
      isActive: true,
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function setSupplierActiveAction(id: string, active: boolean) {
  try {
    await requireStaff();
    await db.update(suppliers).set({ isActive: active }).where(eq(suppliers.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- finance extras ---------- */

export async function insertExpenseAction(input: Record<string, unknown>) {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(expenses).values({
      id,
      title: String(input.title || "").slice(0, 255),
      amount: Number(input.amount || 0).toFixed(2),
      category: String(input.category || "") || null,
      spentOn: input.spent_on ? new Date(String(input.spent_on)) : new Date(),
      note: String(input.note || "") || null,
      createdBy: session.user?.id || null,
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    await requireStaff();
    await db.delete(expenses).where(eq(expenses.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listChartAccountsAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(chartAccounts).orderBy(asc(chartAccounts.code));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        ...snakeRow(r as unknown as Record<string, unknown>),
        kind: r.type,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function insertChartAccountAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(chartAccounts).values({
      id,
      code: String(input.code || "").slice(0, 50),
      name: String(input.name || "").slice(0, 150),
      type: String(input.kind || input.type || "expense").slice(0, 50),
      balance: Number(input.balance || 0).toFixed(2),
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- stock counts / transfers ---------- */

export async function listStockCountsAction(limit = 20) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockCounts)
      .orderBy(desc(stockCounts.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listStockCountItemsAction(countId: string) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(stockCountItems)
      .where(eq(stockCountItems.countId, countId));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        count_id: r.countId,
        product_id: r.productId,
        product_name: "",
        system_qty: r.systemQty,
        counted_qty: r.countedQty,
        discrepancy: r.discrepancy,
        note: r.note,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function insertStockCountItemAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(stockCountItems).values({
      id,
      countId: String(input.count_id),
      productId: String(input.product_id),
      systemQty: Number(input.system_qty) || 0,
      countedQty: Number(input.counted_qty) || 0,
      discrepancy: Number(input.discrepancy) || 0,
      note: String(input.note || "") || null,
    });
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function updateStockCountItemQtyAction(id: string, qty: number) {
  try {
    await requireStaff();
    await db.update(stockCountItems).set({ countedQty: qty }).where(eq(stockCountItems.id, id));
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function createStockTransferAction(input: {
  from_branch_id: string;
  to_branch_id: string;
  notes?: string;
  items: Array<{ product_id: string; quantity: number; note?: string }>;
}) {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(stockTransfers).values({
        id,
        fromBranchId: input.from_branch_id,
        toBranchId: input.to_branch_id,
        status: "pending",
        notes: input.notes || null,
        createdBy: session.user?.id || null,
      });
      for (const it of input.items) {
        await tx.insert(stockTransferItems).values({
          id: crypto.randomUUID(),
          transferId: id,
          productId: it.product_id,
          quantity: Number(it.quantity) || 0,
          note: it.note || null,
        });
      }
    });
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- service / diagnostics / accounts ---------- */

export async function listServiceRequestsAction(limit = 200) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(serviceRequests)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listAccountsRowsAction(from: number, to: number) {
  try {
    await requireStaff();
    const limit = Math.max(1, to - from + 1);
    const offset = Math.max(0, from);
    const [ords, diags, svcs] = await Promise.all([
      db
        .select({
          order_no: orders.orderNumber,
          created_at: orders.createdAt,
          customer_name: orders.customerName,
          total: orders.total,
          payment_method: orders.paymentMethod,
          payment_status: orders.paymentStatus,
          status: orders.status,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          booking_no: diagnosticBookings.bookingNo,
          created_at: diagnosticBookings.createdAt,
          patient_name: diagnosticBookings.patientName,
          total: diagnosticBookings.totalAmount,
          payment_method: diagnosticBookings.paymentMethod,
          payment_status: diagnosticBookings.paymentStatus,
          status: diagnosticBookings.status,
        })
        .from(diagnosticBookings)
        .orderBy(desc(diagnosticBookings.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          request_no: serviceRequests.requestNo,
          created_at: serviceRequests.createdAt,
          patient_name: serviceRequests.patientName,
          fee: serviceRequests.fee,
          payment_method: serviceRequests.paymentMethod,
          payment_status: serviceRequests.paymentStatus,
          status: serviceRequests.status,
        })
        .from(serviceRequests)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(limit)
        .offset(offset),
    ]);
    return { ok: true as const, orders: ords, diagnostics: diags, services: svcs };
  } catch (err) {
    return fail(err);
  }
}

export async function listErpAuditLogAction(limit = 300) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(erpAuditLog)
      .orderBy(desc(erpAuditLog.createdAt))
      .limit(limit);
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function listProfileNamesAction() {
  try {
    await requireStaff();
    const rows = await db.select({ id: profiles.id, name: profiles.fullName }).from(profiles);
    return {
      ok: true as const,
      data: rows.map((r) => ({ id: r.id, name: r.name ?? "" })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- reviews / rx / refill / returns ---------- */

export async function upsertProductReviewAction(input: {
  product_id: string;
  rating: number;
  comment?: string;
  id?: string;
}) {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    if (input.id) {
      await db
        .update(productReviews)
        .set({
          rating: Number(input.rating) || 5,
          comment: input.comment || null,
        })
        .where(and(eq(productReviews.id, input.id), eq(productReviews.userId, userId)));
      return { ok: true as const, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(productReviews).values({
      id,
      productId: input.product_id,
      userId,
      rating: Number(input.rating) || 5,
      comment: input.comment || null,
      status: "pending",
    });
    revalidatePath("/");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteProductReviewAction(id: string) {
  try {
    const session = await requireAuth();
    await db
      .delete(productReviews)
      .where(and(eq(productReviews.id, id), eq(productReviews.userId, session.user!.id!)));
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function moderateProductReviewAction(id: string, status: string) {
  try {
    await requireStaff();
    await db.update(productReviews).set({ status }).where(eq(productReviews.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function staffDeleteProductReviewAction(id: string) {
  try {
    await requireStaff();
    await db.delete(productReviews).where(eq(productReviews.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function updatePrescriptionStatusAction(
  id: string,
  status: string,
  adminNote?: string
) {
  try {
    await requireStaff();
    await db
      .update(prescriptions)
      .set({
        status,
        reviewNotes: adminNote ?? undefined,
        reviewedAt: new Date(),
      })
      .where(eq(prescriptions.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleRefillReminderAction(input: {
  product_id: string;
  existing_id?: string | null;
  reminder_date?: string;
  frequency_days?: number;
}) {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    if (input.existing_id) {
      await db
        .delete(refillReminders)
        .where(and(eq(refillReminders.id, input.existing_id), eq(refillReminders.userId, userId)));
      return { ok: true as const, removed: true };
    }
    const id = crypto.randomUUID();
    await db.insert(refillReminders).values({
      id,
      userId,
      productId: input.product_id,
      reminderDate: input.reminder_date ? new Date(input.reminder_date) : new Date(),
      frequencyDays: input.frequency_days ?? 30,
      status: "active",
    });
    return { ok: true as const, id, removed: false };
  } catch (err) {
    return fail(err);
  }
}

export async function createOrderReturnAction(input: {
  order_id: string;
  order_no: string;
  reason: string;
  details?: string;
}) {
  try {
    const session = await requireAuth();
    const id = crypto.randomUUID();
    await db.insert(orderReturns).values({
      id,
      userId: session.user!.id!,
      orderId: input.order_id,
      orderNo: input.order_no,
      reason: input.reason,
      details: input.details || null,
      status: "pending",
    });
    revalidatePath("/orders");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- account counts / error log / api hub / media ---------- */

export async function getAccountCountsAction() {
  try {
    const session = await requireAuth();
    const uid = session.user!.id!;
    const [o, a] = await Promise.all([
      db
        .select({ c: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.customerId, uid)),
      db
        .select({ c: sql<number>`count(*)` })
        .from(appointments)
        .where(eq(appointments.patientId, uid)),
    ]);
    return {
      ok: true as const,
      orders: Number(o[0]?.c ?? 0),
      appointments: Number(a[0]?.c ?? 0),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function logClientErrorAction(input: {
  message: string;
  stack?: string;
  severity?: string;
  path?: string;
}) {
  try {
    await db.insert(errorLogs).values({
      id: crypto.randomUUID(),
      source: "client",
      message: (input.message || "").slice(0, 500),
      stack: (input.stack || "").slice(0, 2000) || null,
      context: {
        severity: input.severity || "error",
        path: input.path || "",
      },
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "log failed" };
  }
}

export async function listApiEndpointsAction() {
  try {
    await requireStaff();
    const rows = await db.select().from(apiEndpoints).orderBy(asc(apiEndpoints.name));
    return { ok: true as const, data: rows.map((r) => snakeRow(r as unknown as Record<string, unknown>)) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertApiEndpointAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      name: String(input.name || "").slice(0, 150),
      method: String(input.method || "GET").slice(0, 10),
      url: String(input.url || ""),
      headers: (input.headers as Record<string, unknown>) || null,
      active: input.active === undefined ? true : !!input.active,
    };
    const existing = await db
      .select({ id: apiEndpoints.id })
      .from(apiEndpoints)
      .where(eq(apiEndpoints.id, id))
      .limit(1);
    if (existing.length) {
      await db.update(apiEndpoints).set(values).where(eq(apiEndpoints.id, id));
    } else {
      await db.insert(apiEndpoints).values({ id, ...values });
    }
    revalidatePath("/admin");
    return { ok: true as const, id };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteApiEndpointAction(id: string) {
  try {
    await requireStaff();
    await db.delete(apiEndpoints).where(eq(apiEndpoints.id, id));
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function insertApiTestLogAction(input: Record<string, unknown>) {
  try {
    await requireStaff();
    const excerpt =
      String(input.response_excerpt || input.response_body || "").slice(0, 8000) || null;
    await db.insert(apiTestLogs).values({
      id: crypto.randomUUID(),
      endpointId: String(input.endpoint_id || ""),
      statusCode: Number(input.status_code) || null,
      responseBody: excerpt,
      durationMs: Number(input.duration_ms) || null,
    });
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}

export async function listApiTestLogsAction(limit = 50) {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(apiTestLogs)
      .orderBy(desc(apiTestLogs.createdAt))
      .limit(Math.min(Math.max(limit, 1), 200));
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        endpoint_id: r.endpointId,
        name: r.endpointId,
        method: "",
        url: "",
        status_code: r.statusCode,
        ok: r.statusCode != null && r.statusCode >= 200 && r.statusCode < 400,
        duration_ms: r.durationMs ?? 0,
        response_excerpt: r.responseBody ?? "",
        error: "",
        created_at: r.createdAt?.toISOString?.() ?? String(r.createdAt ?? ""),
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listMediaAssetsAction(kind?: string, q?: string) {
  try {
    await requireStaff();
    let rows = await db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(300);
    if (q?.trim()) {
      const pat = q.trim().toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(pat));
    }
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        url: r.url,
        path: r.path,
        name: r.name,
        kind: "other",
        tags: [] as string[],
        size: r.size ?? 0,
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function uploadMediaAssetAction(formData: FormData) {
  try {
    const session = await requireStaff();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "other").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "File required" };
    }
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "media", kind || "other");
    await mkdir(uploadsDir, { recursive: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const fileName = `${Date.now()}-${safe}`;
    await writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
    const relPath = `media/${kind || "other"}/${fileName}`;
    const url = `/uploads/${relPath}`;
    const id = crypto.randomUUID();
    await db.insert(mediaAssets).values({
      id,
      name: file.name.slice(0, 255),
      path: relPath,
      url,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdBy: session.user?.id || null,
    });
    return {
      ok: true as const,
      data: {
        id,
        url,
        path: relPath,
        name: file.name,
        kind: kind || "other",
        tags: [] as string[],
        size: file.size,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    return fail(err);
  }
}

export async function addMediaByUrlAction(input: {
  url: string;
  name: string;
  kind?: string;
}) {
  try {
    const session = await requireStaff();
    const id = crypto.randomUUID();
    await db.insert(mediaAssets).values({
      id,
      name: (input.name || "image").slice(0, 255),
      path: "",
      url: input.url,
      createdBy: session.user?.id || null,
    });
    return {
      ok: true as const,
      data: {
        id,
        url: input.url,
        path: "",
        name: input.name,
        kind: input.kind || "other",
        tags: [] as string[],
        size: 0,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteMediaAssetAction(id: string, filePath?: string) {
  try {
    await requireStaff();
    if (filePath) {
      const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
      const abs = path.resolve(uploadsDir, filePath.replace(/^\//, ""));
      if (abs.startsWith(uploadsDir)) {
        try {
          await unlink(abs);
        } catch {
          /* ignore missing */
        }
      }
    }
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    return { ok: true as const };
  } catch (err) {
    return fail(err);
  }
}
