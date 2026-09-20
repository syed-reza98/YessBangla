"use server";

import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  like,
  lt,
  lte,
  ne,
  or,
  sql,
  sum,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  appointments,
  deliveries,
  deliveryEvents,
  deliveryNotifications,
  diagnosticBookings,
  errorLogs,
  notifications,
  orderItems,
  orders,
  products,
  profiles,
  purchaseOrderItems,
  purchaseOrders,
  riders,
  serviceRequests,
  stockAlerts,
  stockBatches,
  stockMovements,
  suppliers,
  userRoles,
  users,
} from "@/db/schema";
import {
  requireAdmin,
  requireAuth,
  requireStaff,
  AuthError,
  sessionRole,
  type AppRole,
} from "@/lib/session-authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

const STAFF_DB_ROLES = [
  "super_admin",
  "admin",
  "erp_manager",
  "support_agent",
  "accountant",
  "pharmacist",
  "doctor",
  "staff",
] as const;

function randomToken(bytes = 9): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

async function userHasDbRole(userId: string, role: string): Promise<boolean> {
  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)))
    .limit(1);
  return rows.length > 0;
}

async function notify(
  userId: string | null | undefined,
  title: string,
  body: string,
  kind: string,
  orderNo = "",
) {
  if (!userId) return;
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    userId,
    title,
    body,
    kind,
    orderNo,
  });
}

/* ── bootstrap ─────────────────────────────────────────────── */

export async function adminExistsAction(): Promise<ActionResult<{ exists: boolean }>> {
  try {
    await requireAuth();
    const rows = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(eq(userRoles.role, "admin"))
      .limit(1);
    return { ok: true, exists: rows.length > 0 };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function claimFirstAdminAction(): Promise<ActionResult<{ claimed: boolean }>> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;

    const existing = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(eq(userRoles.role, "admin"))
      .limit(1);
    if (existing.length > 0) {
      return { ok: true, claimed: false };
    }

    await db.insert(userRoles).values({
      id: crypto.randomUUID(),
      userId,
      role: "admin",
    });
    await db
      .update(profiles)
      .set({ role: "admin" })
      .where(eq(profiles.id, userId));

    revalidatePath("/admin");
    return { ok: true, claimed: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

/* ── customers / roles ─────────────────────────────────────── */

export type CustomerRow = {
  user_id: string;
  name: string;
  phone: string;
  email: string;
  is_admin: boolean;
  orders_count: number;
  total_spent: number;
  joined_at: string;
};

export async function adminListCustomersAction(input?: {
  q?: string;
  limit?: number;
}): Promise<ActionResult<{ customers: CustomerRow[] }>> {
  try {
    await requireAdmin();
    const q = (input?.q ?? "").trim();
    const limit = Math.max(input?.limit ?? 100, 1);

    const orderAgg = db
      .select({
        uid: orders.customerId,
        cnt: count().as("cnt"),
        sumTotal: sum(orders.total).as("sum_total"),
      })
      .from(orders)
      .where(ne(orders.status, "cancelled"))
      .groupBy(orders.customerId)
      .as("oagg");

    const adminRoles = db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.role, "admin"))
      .as("aroles");

    const conditions = q
      ? or(
          like(profiles.fullName, `%${q}%`),
          like(profiles.phone, `%${q}%`),
          like(users.email, `%${q}%`),
        )
      : undefined;

    const rows = await db
      .select({
        userId: profiles.id,
        name: profiles.fullName,
        phone: profiles.phone,
        email: users.email,
        adminUserId: adminRoles.userId,
        ordersCount: orderAgg.cnt,
        totalSpent: orderAgg.sumTotal,
        joinedAt: profiles.createdAt,
      })
      .from(profiles)
      .leftJoin(users, eq(users.id, profiles.id))
      .leftJoin(orderAgg, eq(orderAgg.uid, profiles.id))
      .leftJoin(adminRoles, eq(adminRoles.userId, profiles.id))
      .where(conditions)
      .orderBy(desc(profiles.createdAt))
      .limit(limit);

    return {
      ok: true,
      customers: rows.map((r) => ({
        user_id: r.userId,
        name: r.name || "",
        phone: r.phone || "",
        email: r.email || "",
        is_admin: !!r.adminUserId,
        orders_count: Number(r.ordersCount || 0),
        total_spent: Number(r.totalSpent || 0),
        joined_at: r.joinedAt?.toISOString?.() ?? String(r.joinedAt ?? ""),
      })),
    };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function adminSetUserAdminAction(input: {
  userId: string;
  makeAdmin: boolean;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const actorId = session.user!.id!;
    if (!input.makeAdmin && input.userId === actorId) {
      return { ok: false, error: "CANNOT_DEMOTE_SELF", status: 400 };
    }
    if (input.makeAdmin) {
      const has = await userHasDbRole(input.userId, "admin");
      if (!has) {
        await db.insert(userRoles).values({
          id: crypto.randomUUID(),
          userId: input.userId,
          role: "admin",
        });
      }
      await db.update(profiles).set({ role: "admin" }).where(eq(profiles.id, input.userId));
    } else {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, input.userId), eq(userRoles.role, "admin")));
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export type StaffRow = {
  user_id: string;
  name: string;
  phone: string;
  email: string;
  roles: string[];
};

export async function adminListStaffAction(): Promise<ActionResult<{ staff: StaffRow[] }>> {
  try {
    await requireAdmin();
    const roleRows = await db
      .select({
        userId: userRoles.userId,
        role: userRoles.role,
        name: profiles.fullName,
        phone: profiles.phone,
        email: users.email,
      })
      .from(userRoles)
      .innerJoin(profiles, eq(profiles.id, userRoles.userId))
      .leftJoin(users, eq(users.id, userRoles.userId))
      .where(inArray(userRoles.role, [...STAFF_DB_ROLES]));

    const byUser = new Map<string, StaffRow>();
    for (const r of roleRows) {
      const cur = byUser.get(r.userId);
      if (cur) {
        if (!cur.roles.includes(r.role)) cur.roles.push(r.role);
      } else {
        byUser.set(r.userId, {
          user_id: r.userId,
          name: r.name || "",
          phone: r.phone || "",
          email: r.email || "",
          roles: [r.role],
        });
      }
    }
    const staff = Array.from(byUser.values()).sort((a, b) => a.name.localeCompare(b.name));
    return { ok: true, staff };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function adminSetRoleAction(input: {
  userId: string;
  role: string;
  grant: boolean;
}): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const actorId = session.user!.id!;
    const actorRole = sessionRole(session);
    const isSuper = actorRole === "super_admin" || (await userHasDbRole(actorId, "super_admin"));

    if ((input.role === "super_admin" || input.role === "admin") && !isSuper) {
      return { ok: false, error: "SUPER_ADMIN_REQUIRED", status: 403 };
    }
    if (
      !input.grant &&
      input.userId === actorId &&
      (input.role === "super_admin" || input.role === "admin")
    ) {
      return { ok: false, error: "CANNOT_DEMOTE_SELF", status: 400 };
    }

    if (input.grant) {
      const has = await userHasDbRole(input.userId, input.role);
      if (!has) {
        await db.insert(userRoles).values({
          id: crypto.randomUUID(),
          userId: input.userId,
          role: input.role,
        });
      }
    } else {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, input.userId), eq(userRoles.role, input.role)));
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export type ErpUserRow = {
  user_id: string;
  name: string;
  phone: string;
  is_admin: boolean;
  is_erp_manager: boolean;
};

export async function adminListErpUsersAction(): Promise<ActionResult<{ users: ErpUserRow[] }>> {
  try {
    await requireAdmin();
    const roleRows = await db
      .select({
        userId: userRoles.userId,
        role: userRoles.role,
        name: profiles.fullName,
        phone: profiles.phone,
      })
      .from(userRoles)
      .innerJoin(profiles, eq(profiles.id, userRoles.userId))
      .where(inArray(userRoles.role, ["admin", "erp_manager", "super_admin"]));

    const byUser = new Map<string, ErpUserRow>();
    for (const r of roleRows) {
      const cur = byUser.get(r.userId) ?? {
        user_id: r.userId,
        name: r.name || "",
        phone: r.phone || "",
        is_admin: false,
        is_erp_manager: false,
      };
      if (r.role === "admin" || r.role === "super_admin") cur.is_admin = true;
      if (r.role === "erp_manager") cur.is_erp_manager = true;
      byUser.set(r.userId, cur);
    }
    return { ok: true, users: Array.from(byUser.values()) };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function adminSetErpManagerAction(input: {
  userId: string;
  grant: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (input.grant) {
      const has = await userHasDbRole(input.userId, "erp_manager");
      if (!has) {
        await db.insert(userRoles).values({
          id: crypto.randomUUID(),
          userId: input.userId,
          role: "erp_manager",
        });
      }
    } else {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, input.userId), eq(userRoles.role, "erp_manager")));
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

/* ── delivery track link + demo ────────────────────────────── */

export async function adminSetTrackLinkAction(input: {
  deliveryId: string;
  hours?: number | null;
  revoked?: boolean | null;
  scope?: string | null;
  rotate?: boolean;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    const scope = input.scope ?? null;
    if (scope && !["public", "authenticated", "staff"].includes(scope)) {
      return { ok: false, error: "BAD_SCOPE", status: 400 };
    }

    const [row] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, input.deliveryId))
      .limit(1);
    if (!row) return { ok: false, error: "NOT_FOUND", status: 404 };

    const patch: Partial<typeof deliveries.$inferInsert> = {};
    if (input.hours != null) {
      if (input.hours <= 0) patch.tokenExpiresAt = null;
      else patch.tokenExpiresAt = new Date(Date.now() + input.hours * 3600_000);
    }
    if (input.revoked != null) patch.tokenRevoked = input.revoked;
    if (scope) patch.tokenScope = scope;
    if (input.rotate) patch.publicToken = randomToken(9);
    if (!row.publicToken && !patch.publicToken) patch.publicToken = randomToken(9);

    await db.update(deliveries).set(patch).where(eq(deliveries.id, input.deliveryId));
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

async function demoSeedOne(zone: string, userId: string): Promise<string> {
  const names = ["রফিকুল ইসলাম", "সাদিয়া আক্তার", "তানভীর হাসান", "নুসরাত জাহান", "মাহবুব আলম"];
  const areas = ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "মোহাম্মদপুর"];
  const ar = zone || areas[Math.floor(Math.random() * areas.length)];
  const n = Math.floor(Math.random() * 9000 + 1000);
  const orderId = crypto.randomUUID();
  const orderNo = `OWDEMO${n}`;
  const customerName = names[Math.floor(Math.random() * names.length)];
  const phone = `017${Math.floor(10000000 + Math.random() * 89999999)}`;

  const activeProducts = await db
    .select({ id: products.id, name: products.name, price: products.unitPrice })
    .from(products)
    .where(eq(products.isActive, true))
    .limit(50);
  const picks = activeProducts.sort(() => Math.random() - 0.5).slice(0, 2);
  let sub = 0;
  for (const p of picks) sub += Number(p.price || 0);
  const deliveryFee = 40;
  const total = sub + deliveryFee;

  await db.insert(orders).values({
    id: orderId,
    orderNumber: orderNo,
    customerId: userId,
    customerName,
    customerPhone: phone,
    deliveryAddress: `${ar}, ঢাকা`,
    subtotal: money(sub),
    deliveryFee: money(deliveryFee),
    discount: "0.00",
    total: money(total),
    paymentMethod: Math.random() < 0.5 ? "cod" : "bkash",
    paymentStatus: "pending",
    status: "shipped",
  });

  for (const p of picks) {
    const price = Number(p.price || 0);
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId,
      productId: p.id,
      quantity: 1,
      unitPrice: money(price),
      totalPrice: money(price),
    });
  }

  let riderId: string | null = null;
  const zoneRiders = zone
    ? await db
        .select()
        .from(riders)
        .where(and(eq(riders.active, true), eq(riders.zone, zone)))
        .limit(20)
    : [];
  const anyRiders =
    zoneRiders.length > 0
      ? zoneRiders
      : await db.select().from(riders).where(eq(riders.active, true)).limit(20);
  if (anyRiders.length > 0) {
    riderId = anyRiders[Math.floor(Math.random() * anyRiders.length)].id;
  }

  const deliveryId = crypto.randomUUID();
  const status = riderId ? "assigned" : "unassigned";
  await db.insert(deliveries).values({
    id: deliveryId,
    orderId,
    orderNo,
    userId,
    riderId,
    status,
    otp: String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
    etaMinutes: 20 + Math.floor(Math.random() * 40),
    note: "ডেমো অর্ডার",
    publicToken: randomToken(9),
    tokenScope: "public",
    tokenRevoked: false,
  });
  await db.insert(deliveryEvents).values({
    id: crypto.randomUUID(),
    deliveryId,
    status,
    note: "ডেমো ডেলিভারি তৈরি",
    actor: "demo",
  });
  return deliveryId;
}

export async function demoSeedBulkAction(input: {
  zone?: string;
  count?: number;
  scenario?: string;
}): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireStaff();
    const userId = session.user!.id!;
    const count = input.count ?? 1;
    if (count < 1 || count > 25) return { ok: false, error: "BAD_COUNT", status: 400 };

    const zone = input.zone ?? "";
    let made = 0;
    for (let i = 0; i < count; i++) {
      const deliveryId = await demoSeedOne(zone, userId);
      let sc = input.scenario || "assigned";
      if (sc === "random" || sc === "mixed") {
        const opts = ["assigned", "picked", "on_the_way", "arrived", "delivered", "failed"];
        sc = opts[Math.floor(Math.random() * opts.length)];
      }

      const stepsByScenario: Record<string, string[]> = {
        assigned: [],
        picked: ["picked"],
        on_the_way: ["picked", "on_the_way"],
        arrived: ["picked", "on_the_way", "arrived"],
        delivered: ["picked", "on_the_way", "arrived", "delivered"],
        failed: ["picked", "on_the_way", "failed"],
      };
      const steps = stepsByScenario[sc] ?? [];
      const baseLat = 23.75 + (Math.random() - 0.5) * 0.08;
      const baseLng = 90.39 + (Math.random() - 0.5) * 0.08;

      const [d0] = await db.select().from(deliveries).where(eq(deliveries.id, deliveryId)).limit(1);
      let k = 0;
      for (const s of steps) {
        k += 1;
        const lat = baseLat + k * 0.004;
        const lng = baseLng + k * 0.003;
        await db
          .update(deliveries)
          .set({
            status: s,
            lastLat: String(lat),
            lastLng: String(lng),
            lastSeenAt: new Date(Date.now() - (steps.length - k) * 6 * 60_000),
            etaMinutes: Math.max(2, (d0?.etaMinutes ?? 30) - k * 8),
          })
          .where(eq(deliveries.id, deliveryId));
        await db.insert(deliveryEvents).values({
          id: crypto.randomUUID(),
          deliveryId,
          status: s,
          note: "ডেমো পরিস্থিতি",
          lat: String(lat),
          lng: String(lng),
          actor: "demo",
        });
      }
      if (sc === "delivered" && d0) {
        const [ord] = await db.select().from(orders).where(eq(orders.id, d0.orderId)).limit(1);
        await db
          .update(orders)
          .set({
            status: "delivered",
            paymentStatus: ord?.paymentMethod === "cod" ? "paid" : ord?.paymentStatus,
          })
          .where(eq(orders.id, d0.orderId));
      }
      made += 1;
    }
    revalidatePath("/admin");
    return { ok: true, count: made };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function demoCancelDeliveryAction(input: {
  deliveryId: string;
}): Promise<ActionResult<{ cancelled: boolean }>> {
  try {
    await requireStaff();
    const [d] = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, input.deliveryId))
      .limit(1);
    if (!d) return { ok: true, cancelled: false };

    await db
      .update(deliveries)
      .set({ status: "failed", note: "বাতিল করা হয়েছে" })
      .where(eq(deliveries.id, d.id));
    await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, d.orderId));
    await db.insert(deliveryEvents).values({
      id: crypto.randomUUID(),
      deliveryId: d.id,
      status: "failed",
      note: "অ্যাডমিন কর্তৃক বাতিল",
      actor: "admin",
    });
    revalidatePath("/admin");
    return { ok: true, cancelled: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function demoResetDeliveriesAction(): Promise<ActionResult<{ count: number }>> {
  try {
    await requireStaff();
    const demoOrders = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber })
      .from(orders)
      .where(like(orders.orderNumber, "OWDEMO%"));
    const ids = demoOrders.map((o) => o.id);
    if (ids.length === 0) return { ok: true, count: 0 };

    const demoDeliveries = await db
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(inArray(deliveries.orderId, ids));
    const dids = demoDeliveries.map((d) => d.id);

    if (dids.length > 0) {
      await db.delete(deliveryEvents).where(inArray(deliveryEvents.deliveryId, dids));
      await db.delete(deliveryNotifications).where(inArray(deliveryNotifications.deliveryId, dids));
      await db.delete(deliveries).where(inArray(deliveries.id, dids));
    }
    const orderNos = demoOrders.map((o) => o.orderNumber);
    if (orderNos.length > 0) {
      await db.delete(notifications).where(inArray(notifications.orderNo, orderNos));
    }
    await db.delete(orderItems).where(inArray(orderItems.orderId, ids));
    await db.delete(orders).where(inArray(orders.id, ids));

    revalidatePath("/admin");
    return { ok: true, count: ids.length };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

/* ── service / diagnostic / refund ─────────────────────────── */

const SERVICE_STATUSES = [
  "requested",
  "confirmed",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export async function adminSetServiceStatusAction(input: {
  requestId: string;
  status: string;
  assigneeName?: string;
  assigneePhone?: string;
  adminNote?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!(SERVICE_STATUSES as readonly string[]).includes(input.status)) {
      return { ok: false, error: "BAD_STATUS", status: 400 };
    }
    const [row] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, input.requestId))
      .limit(1);
    if (!row) return { ok: false, error: "NOT_FOUND", status: 404 };

    const patch: Partial<typeof serviceRequests.$inferInsert> = { status: input.status };
    if (input.assigneeName) patch.assigneeName = input.assigneeName;
    if (input.assigneePhone) patch.assigneePhone = input.assigneePhone;
    if (input.adminNote) patch.adminNote = input.adminNote;
    if (input.status === "completed" && row.paymentMethod === "cod") {
      patch.paymentStatus = "paid";
    }

    await db.update(serviceRequests).set(patch).where(eq(serviceRequests.id, input.requestId));

    const title =
      input.status === "confirmed"
        ? "হোম সার্ভিস নিশ্চিত হয়েছে"
        : input.status === "assigned"
          ? "সেবাদানকারী নিয়োগ হয়েছে"
          : input.status === "in_progress"
            ? "সেবা চলছে"
            : input.status === "completed"
              ? "সেবা সম্পন্ন হয়েছে"
              : input.status === "cancelled"
                ? "হোম সার্ভিস বাতিল"
                : "হোম সার্ভিস হালনাগাদ";

    const assignee =
      (input.assigneeName || row.assigneeName || "") !== ""
        ? ` (${input.assigneeName || row.assigneeName} · ${input.assigneePhone || row.assigneePhone || ""})`
        : "";
    await notify(
      row.userId,
      title,
      `অনুরোধ #${row.requestNo} — ${row.serviceName || row.serviceSlug} · ${title}${assignee}।`,
      "service",
      row.requestNo,
    );
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

const DIAG_STATUSES = [
  "requested",
  "confirmed",
  "on_the_way",
  "collected",
  "processing",
  "report_ready",
  "cancelled",
] as const;

export async function adminSetDiagnosticStatusAction(input: {
  bookingId: string;
  status: string;
  collectorName?: string;
  collectorPhone?: string;
  reportUrl?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!(DIAG_STATUSES as readonly string[]).includes(input.status)) {
      return { ok: false, error: "BAD_STATUS", status: 400 };
    }
    const [row] = await db
      .select()
      .from(diagnosticBookings)
      .where(eq(diagnosticBookings.id, input.bookingId))
      .limit(1);
    if (!row) return { ok: false, error: "NOT_FOUND", status: 404 };

    const patch: Partial<typeof diagnosticBookings.$inferInsert> = { status: input.status };
    if (input.collectorName) patch.collectorName = input.collectorName;
    if (input.collectorPhone) patch.collectorPhone = input.collectorPhone;
    if (input.reportUrl) patch.reportUrl = input.reportUrl;
    if (input.status === "report_ready" && row.paymentMethod === "cod") {
      patch.paymentStatus = "paid";
    }

    await db
      .update(diagnosticBookings)
      .set(patch)
      .where(eq(diagnosticBookings.id, input.bookingId));

    const title =
      input.status === "confirmed"
        ? "স্যাম্পল কালেকশন নিশ্চিত"
        : input.status === "on_the_way"
          ? "কালেক্টর পথে আছেন"
          : input.status === "collected"
            ? "স্যাম্পল সংগ্রহ হয়েছে"
            : input.status === "processing"
              ? "ল্যাবে পরীক্ষা চলছে"
              : input.status === "report_ready"
                ? "রিপোর্ট প্রস্তুত"
                : input.status === "cancelled"
                  ? "বুকিং বাতিল"
                  : "বুকিং হালনাগাদ";

    await notify(
      row.userId,
      title,
      `বুকিং #${row.bookingNo || row.id} — ${title}।`,
      "diagnostic",
      row.bookingNo || "",
    );
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

const REFUND_STATUSES = [
  "none",
  "pending",
  "processing",
  "refunded",
  "not_eligible",
  "not_applicable",
] as const;

export async function adminSetRefundStatusAction(input: {
  appointmentId: string;
  status: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!(REFUND_STATUSES as readonly string[]).includes(input.status)) {
      return { ok: false, error: "BAD_STATUS", status: 400 };
    }
    const [row] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, input.appointmentId))
      .limit(1);
    if (!row) return { ok: false, error: "NOT_FOUND", status: 404 };

    await db
      .update(appointments)
      .set({ refundStatus: input.status })
      .where(eq(appointments.id, input.appointmentId));

    if (input.status === "refunded") {
      await notify(
        row.patientId,
        "রিফান্ড সম্পন্ন",
        `অ্যাপয়েন্টমেন্ট #${row.invoiceNo || row.id} এর ৳${row.refundAmount ?? 0} রিফান্ড সম্পন্ন হয়েছে।`,
        "appointment",
        row.invoiceNo || "",
      );
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

/* ── system / inventory ────────────────────────────────────── */

export async function adminSystemStatsAction(): Promise<
  ActionResult<{ stats: Record<string, string | number> }>
> {
  try {
    await requireStaff();

    const [[productsTotal], [productsActive], [productsNoImage], [lowStock], [outOfStock]] =
      await Promise.all([
        db.select({ c: count() }).from(products),
        db.select({ c: count() }).from(products).where(eq(products.isActive, true)),
        db
          .select({ c: count() })
          .from(products)
          .where(or(eq(products.imageUrl, ""), sql`${products.imageUrl} IS NULL`)),
        db
          .select({ c: count() })
          .from(products)
          .where(
            and(
              eq(products.isActive, true),
              sql`${products.stock} <= GREATEST(${products.minStockAlert}, 0)`,
            ),
          ),
        db
          .select({ c: count() })
          .from(products)
          .where(and(eq(products.isActive, true), lte(products.stock, 0))),
      ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const d30 = new Date(Date.now() - 30 * 864e5);
    const d24 = new Date(Date.now() - 864e5);
    const d60 = new Date();
    d60.setDate(d60.getDate() + 60);
    const now = new Date();

    const [
      [ordersTotal],
      [ordersToday],
      [ordersPending],
      [revenue30],
      [customers],
      [ridersActive],
      [deliveriesOpen],
      [suppliersActive],
      [poOpen],
      [batches],
      [expiring60],
      [expired],
      [errors24],
      [alerts24],
    ] = await Promise.all([
      db.select({ c: count() }).from(orders),
      db.select({ c: count() }).from(orders).where(gte(orders.createdAt, todayStart)),
      db
        .select({ c: count() })
        .from(orders)
        .where(inArray(orders.status, ["confirmed", "processing", "shipped"])),
      db
        .select({ s: sum(orders.total) })
        .from(orders)
        .where(and(ne(orders.status, "cancelled"), gte(orders.createdAt, d30))),
      db.select({ c: count() }).from(profiles),
      db.select({ c: count() }).from(riders).where(eq(riders.active, true)),
      db
        .select({ c: count() })
        .from(deliveries)
        .where(sql`${deliveries.status} NOT IN ('delivered','failed')`),
      db.select({ c: count() }).from(suppliers).where(eq(suppliers.isActive, true)),
      db.select({ c: count() }).from(purchaseOrders).where(ne(purchaseOrders.status, "received")),
      db.select({ c: count() }).from(stockBatches).where(sql`${stockBatches.quantity} > 0`),
      db
        .select({ c: count() })
        .from(stockBatches)
        .where(
          and(
            sql`${stockBatches.quantity} > 0`,
            lte(stockBatches.expiryDate, d60),
            gte(stockBatches.expiryDate, now),
          ),
        ),
      db
        .select({ c: count() })
        .from(stockBatches)
        .where(and(sql`${stockBatches.quantity} > 0`, lt(stockBatches.expiryDate, now))),
      db.select({ c: count() }).from(errorLogs).where(gte(errorLogs.createdAt, d24)),
      db.select({ c: count() }).from(stockAlerts).where(gte(stockAlerts.createdAt, d24)),
    ]);

    return {
      ok: true,
      stats: {
        products: Number(productsTotal.c),
        products_active: Number(productsActive.c),
        products_no_image: Number(productsNoImage.c),
        low_stock: Number(lowStock.c),
        out_of_stock: Number(outOfStock.c),
        orders: Number(ordersTotal.c),
        orders_today: Number(ordersToday.c),
        orders_pending: Number(ordersPending.c),
        revenue_30d: Number(revenue30.s || 0),
        customers: Number(customers.c),
        riders_active: Number(ridersActive.c),
        deliveries_open: Number(deliveriesOpen.c),
        suppliers: Number(suppliersActive.c),
        po_open: Number(poOpen.c),
        batches: Number(batches.c),
        expiring_60d: Number(expiring60.c),
        expired: Number(expired.c),
        errors_24h: Number(errors24.c),
        alerts_24h: Number(alerts24.c),
        db_size: "n/a",
        server_time: new Date().toISOString(),
      },
    };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function runStockAlertsAction(input?: {
  expiryDays?: number;
}): Promise<ActionResult<{ count: number }>> {
  try {
    await requireStaff();
    const expiryDays = input?.expiryDays ?? 60;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + expiryDays);
    const dayAgo = new Date(Date.now() - 864e5);
    let n = 0;

    const admins = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.role, "admin"));

    const batches = await db
      .select()
      .from(stockBatches)
      .where(
        and(
          sql`${stockBatches.quantity} > 0`,
          lte(stockBatches.expiryDate, cutoff),
        ),
      );

    for (const b of batches) {
      const key = `expiry:${b.id}`;
      const recent = await db
        .select({ id: stockAlerts.id })
        .from(stockAlerts)
        .where(and(eq(stockAlerts.ref, key), gte(stockAlerts.createdAt, dayAgo)))
        .limit(1);
      if (recent.length > 0) continue;

      const daysLeft = Math.ceil(
        (new Date(b.expiryDate).getTime() - Date.now()) / 864e5,
      );
      const pname = b.productName || b.productId;
      const body = `${pname} (ব্যাচ ${b.batchNumber || "—"}) — মেয়াদ ${new Date(b.expiryDate).toLocaleDateString("en-GB")}, বাকি ${daysLeft} দিন, স্টক ${b.quantity}`;
      await db.insert(stockAlerts).values({
        id: crypto.randomUUID(),
        productId: b.productId,
        productName: pname,
        batchId: b.id,
        type: "expiry",
        ref: key,
        detail: body,
        severity: daysLeft < 0 ? "critical" : "warning",
      });
      for (const a of admins) {
        await notify(a.userId, "মেয়াদ সতর্কতা", body, "inventory");
      }
      n += 1;
    }

    const lowProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stock} <= GREATEST(${products.minStockAlert}, 0)`,
        ),
      )
      .limit(200);

    for (const p of lowProducts) {
      const key = `lowstock:${p.id}`;
      const recent = await db
        .select({ id: stockAlerts.id })
        .from(stockAlerts)
        .where(and(eq(stockAlerts.ref, key), gte(stockAlerts.createdAt, dayAgo)))
        .limit(1);
      if (recent.length > 0) continue;

      const body = `${p.name} — স্টক ${p.stock} (সীমা ${p.minStockAlert})। পুনরায় ক্রয় প্রয়োজন।`;
      await db.insert(stockAlerts).values({
        id: crypto.randomUUID(),
        productId: p.id,
        productName: p.name,
        type: "low_stock",
        ref: key,
        detail: body,
        severity: "warning",
      });
      for (const a of admins) {
        await notify(a.userId, "কম স্টক সতর্কতা", body, "inventory");
      }
      n += 1;
    }

    revalidatePath("/admin");
    return { ok: true, count: n };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export type ExpiringBatchRow = {
  id: string;
  product_id: string;
  product_name: string;
  batch_no: string;
  expiry: string;
  qty: number;
  days_left: number;
};

export async function adminExpiringBatchesAction(input?: {
  days?: number;
}): Promise<ActionResult<{ batches: ExpiringBatchRow[] }>> {
  try {
    await requireAdmin();
    const days = input?.days ?? 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        id: stockBatches.id,
        productId: stockBatches.productId,
        productName: stockBatches.productName,
        batchNumber: stockBatches.batchNumber,
        expiryDate: stockBatches.expiryDate,
        quantity: stockBatches.quantity,
        prodName: products.name,
      })
      .from(stockBatches)
      .leftJoin(products, eq(products.id, stockBatches.productId))
      .where(and(sql`${stockBatches.quantity} > 0`, lte(stockBatches.expiryDate, cutoff)))
      .orderBy(stockBatches.expiryDate)
      .limit(500);

    return {
      ok: true,
      batches: rows.map((r) => {
        const exp = new Date(r.expiryDate);
        const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 864e5);
        return {
          id: r.id,
          product_id: r.productId,
          product_name: r.productName || r.prodName || "",
          batch_no: r.batchNumber || "",
          expiry: exp.toISOString().slice(0, 10),
          qty: r.quantity,
          days_left: daysLeft,
        };
      }),
    };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function adminAdjustStockAction(input: {
  productId: string;
  change: number;
  reason?: string;
}): Promise<ActionResult<{ balance: number }>> {
  try {
    await requireAdmin();
    const [prod] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1);
    if (!prod) return { ok: false, error: "product not found", status: 404 };

    const newbal = Math.max(0, (Number(prod.stock) || 0) + Number(input.change || 0));
    await db.update(products).set({ stock: newbal }).where(eq(products.id, input.productId));
    await db.insert(stockMovements).values({
      id: crypto.randomUUID(),
      productId: input.productId,
      type: "adjust",
      quantity: Number(input.change || 0),
      referenceId: input.reason || "",
    });
    revalidatePath("/admin");
    return { ok: true, balance: newbal };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

/* ── procurement ───────────────────────────────────────────── */

export type PoItemInput = {
  product_id: string;
  product_name?: string;
  qty: number;
  cost: number;
  batch_no?: string;
  expiry?: string | null;
};

export async function adminCreatePurchaseOrderAction(input: {
  supplierId: string;
  items: PoItemInput[];
  expected?: string | null;
  discount?: number;
  note?: string;
}): Promise<ActionResult<{ id: string; poNumber: string }>> {
  try {
    const session = await requireAdmin();
    const [sup] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, input.supplierId))
      .limit(1);
    if (!sup) return { ok: false, error: "supplier not found", status: 404 };

    const items = input.items || [];
    const sub = items.reduce((s, it) => s + Number(it.qty || 0) * Number(it.cost || 0), 0);
    const discount = Number(input.discount || 0);
    const total = Math.max(sub - discount, 0);
    const poId = crypto.randomUUID();
    const poNumber = `PO-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomToken(3).toUpperCase()}`;

    await db.transaction(async (tx) => {
      await tx.insert(purchaseOrders).values({
        id: poId,
        poNumber,
        supplierId: input.supplierId,
        supplierName: sup.name,
        status: "ordered",
        expectedAt: input.expected || null,
        subtotal: money(sub),
        discount: money(discount),
        total: money(total),
        notes: input.note || "",
        createdBy: session.user!.id!,
      });
      for (const it of items) {
        await tx.insert(purchaseOrderItems).values({
          id: crypto.randomUUID(),
          poId,
          productId: it.product_id,
          productName: it.product_name || "",
          qty: Number(it.qty || 0),
          cost: money(Number(it.cost || 0)),
          batchNo: it.batch_no || "",
          expiry: it.expiry || null,
        });
      }
    });

    revalidatePath("/admin");
    return { ok: true, id: poId, poNumber };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

export async function adminReceivePurchaseOrderAction(input: {
  poId: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, input.poId))
      .limit(1);
    if (!po) return { ok: false, error: "PO not found", status: 404 };
    if (po.status === "received") return { ok: true, id: po.id };

    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.poId, input.poId));

    await db.transaction(async (tx) => {
      for (const r of items) {
        const [prod] = await tx
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, r.productId))
          .limit(1);
        const newbal = (Number(prod?.stock) || 0) + Number(r.qty);
        if (prod) {
          await tx
            .update(products)
            .set({ stock: newbal })
            .where(eq(products.id, r.productId));
        }

        await tx.insert(stockBatches).values({
          id: crypto.randomUUID(),
          productId: r.productId,
          productName: r.productName,
          batchNumber: r.batchNo || `B-${Date.now().toString().slice(-6)}`,
          expiryDate: r.expiry ? new Date(r.expiry) : new Date(Date.now() + 365 * 864e5),
          quantity: r.qty,
          costPrice: r.cost,
          supplierId: po.supplierId,
          poId: po.id,
        });

        await tx.insert(stockMovements).values({
          id: crypto.randomUUID(),
          productId: r.productId,
          type: "purchase",
          quantity: r.qty,
          referenceId: po.poNumber,
        });

        await tx
          .update(purchaseOrderItems)
          .set({ receivedQty: r.qty })
          .where(eq(purchaseOrderItems.id, r.id));
      }

      await tx
        .update(purchaseOrders)
        .set({ status: "received", receivedAt: new Date() })
        .where(eq(purchaseOrders.id, input.poId));
    });

    revalidatePath("/admin");
    return { ok: true, id: po.id };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message, status: err.status };
    return { ok: false, error: err instanceof Error ? err.message : "Failed", status: 500 };
  }
}

/** Drizzle helper for legacy authz callers */
export async function hasRoleQuery(userId: string, role: AppRole | string): Promise<boolean> {
  return userHasDbRole(userId, role);
}
