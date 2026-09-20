"use server";

import { and, asc, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  customerAddresses,
  customerNotifications,
  deliveryOrders,
  siteContent,
  branches,
  profiles,
  userRoles,
  auditLogs,
  mediaAssets,
  products,
  brands,
} from "@/db/schema";
import {
  requireAuth,
  requireStaff,
  requireAdmin,
  AuthError,
} from "@/lib/authz";
import { branchRow, type Dict } from "@/lib/legacy-rows";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

export async function listMyAddressesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, session.user!.id!))
      .orderBy(desc(customerAddresses.createdAt));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        user_id: r.userId,
        label: r.label,
        address: r.address,
        phone: r.phone,
        is_default: r.isDefault,
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

export async function createAddressAction(input: {
  label?: string | null;
  address: string;
  phone?: string | null;
  isDefault?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const id = crypto.randomUUID();
    if (input.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.userId, session.user!.id!));
    }
    await db.insert(customerAddresses).values({
      id,
      userId: session.user!.id!,
      label: input.label || null,
      address: input.address,
      phone: input.phone || null,
      isDefault: Boolean(input.isDefault),
    });
    revalidatePath("/my-account");
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

export async function deleteAddressAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    await db
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, input.id),
          eq(customerAddresses.userId, session.user!.id!)
        )
      );
    revalidatePath("/my-account");
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

export async function setDefaultAddressAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(and(eq(customerAddresses.userId, userId), ne(customerAddresses.id, input.id)));
    await db
      .update(customerAddresses)
      .set({ isDefault: true })
      .where(
        and(eq(customerAddresses.id, input.id), eq(customerAddresses.userId, userId))
      );
    revalidatePath("/my-account");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
      status: 500,
    };
  }
}

export async function listMyDeliveryOrdersAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    const session = await requireAuth();
    const rows = await db
      .select()
      .from(deliveryOrders)
      .where(eq(deliveryOrders.userId, session.user!.id!))
      .orderBy(desc(deliveryOrders.createdAt))
      .limit(50);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        order_no: r.orderNo,
        status: r.status,
        total: Number(r.total),
        payment_method: r.paymentMethod,
        tracking_code: r.trackingCode,
        address: r.address ?? r.deliveryAddress,
        area: r.area,
        slot: r.slot,
        created_at:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
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

export async function updateNotificationSendAction(input: {
  id: string;
  sendAttempts: number;
  ok: boolean;
  error?: string;
}): Promise<ActionResult> {
  try {
    await requireStaff();
    const now = new Date();
    await db
      .update(customerNotifications)
      .set({
        sendAttempts: input.sendAttempts + 1,
        lastAttemptAt: now,
        sendStatus: input.ok ? "sent" : "failed",
        lastError: input.ok ? null : (input.error ?? "Unknown error").slice(0, 300),
        isSent: input.ok,
        sentAt: input.ok ? now : null,
      })
      .where(eq(customerNotifications.id, input.id));
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
      status: 500,
    };
  }
}

export async function listNotificationsAction(input?: {
  orderId?: string;
  limit?: number;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    let q = db.select().from(customerNotifications).$dynamic();
    if (input?.orderId) {
      q = q.where(eq(customerNotifications.orderId, input.orderId));
    }
    const rows = await q
      .orderBy(desc(customerNotifications.createdAt))
      .limit(input?.limit ?? 100);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        user_id: r.userId,
        order_id: r.orderId,
        order_no: r.orderNo,
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        channel: r.channel,
        title: r.title,
        body: r.body,
        is_sent: r.isSent,
        is_read: r.isRead,
        sent_at: r.sentAt,
        send_status: r.sendStatus,
        send_attempts: r.sendAttempts,
        last_error: r.lastError,
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

export async function listSiteContentAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    const rows = await db
      .select()
      .from(siteContent)
      .orderBy(asc(siteContent.groupName), asc(siteContent.sortOrder));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        key: r.key,
        group_name: r.groupName,
        label: r.label,
        kind: r.kind,
        value_bn: r.valueBn ?? "",
        value_en: r.valueEn ?? "",
        sort_order: r.sortOrder ?? 0,
      })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function upsertSiteContentAction(input: {
  id?: string;
  key: string;
  group_name?: string;
  label?: string;
  kind?: string;
  value_bn?: string;
  value_en?: string;
  sort_order?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaff();
    const values = {
      key: input.key,
      groupName: input.group_name || "general",
      label: input.label || "",
      kind: input.kind || "text",
      valueBn: input.value_bn || null,
      valueEn: input.value_en || null,
      sortOrder: input.sort_order ?? 0,
    };
    if (input.id) {
      await db.update(siteContent).set(values).where(eq(siteContent.id, input.id));
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(siteContent).values({ id, ...values });
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

export async function listBranchesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    const rows = await db.select().from(branches).orderBy(asc(branches.name));
    return { ok: true, rows: rows.map((r) => branchRow(r as never)) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}

export async function upsertBranchAction(input: {
  id?: string;
  payload: Record<string, unknown>;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const p = input.payload;
    const values = {
      name: String(p.name || ""),
      code: String(p.code || ""),
      address: (p.address as string) || null,
      phone: (p.phone as string) || null,
      email: (p.email as string) || null,
      isActive: p.is_active == null ? true : Boolean(p.is_active),
    };
    if (input.id) {
      await db.update(branches).set(values).where(eq(branches.id, input.id));
      revalidatePath("/branches");
      return { ok: true, id: input.id };
    }
    const id = crypto.randomUUID();
    await db.insert(branches).values({ id, ...values });
    revalidatePath("/branches");
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

export async function getMyProfileAction(): Promise<
  ActionResult<{
    userId: string | null;
    username: string | null;
    role: string | null;
    branchId: string | null;
  }>
> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    const roles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    const role =
      roles.map((r) => r.role).sort((a, b) => {
        const order = ["super_admin", "admin", "manager", "cashier", "staff", "customer"];
        return order.indexOf(a) - order.indexOf(b);
      })[0] ??
      profile?.role ??
      ((session.user as { role?: string }).role || null);
    return {
      ok: true,
      userId,
      username: profile?.username ?? session.user?.email?.split("@")[0] ?? null,
      role,
      branchId: profile?.branchId ?? null,
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: true,
        userId: null,
        username: null,
        role: null,
        branchId: null,
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Profile failed",
      status: 500,
    };
  }
}

export async function listProfilesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireAdmin();
    const rows = await db.select().from(profiles);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        full_name: r.fullName,
        username: r.username,
        created_at: r.createdAt,
        branch_id: r.branchId,
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

export async function listUserRolesAction(): Promise<
  ActionResult<{ rows: Dict[] }>
> {
  try {
    await requireAdmin();
    const rows = await db.select().from(userRoles);
    return {
      ok: true,
      rows: rows.map((r) => ({
        user_id: r.userId,
        role: r.role,
        branch_id: r.branchId,
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

export async function setUserRoleAction(input: {
  userId: string;
  role: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.delete(userRoles).where(eq(userRoles.userId, input.userId));
    await db.insert(userRoles).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      role: input.role,
    });
    await db
      .update(profiles)
      .set({ role: input.role })
      .where(eq(profiles.id, input.userId));
    revalidatePath("/users");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Role update failed",
      status: 500,
    };
  }
}

export async function updateProfileBranchAction(input: {
  username: string;
  branchId: string | null;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db
      .update(profiles)
      .set({ branchId: input.branchId })
      .where(eq(profiles.username, input.username));
    revalidatePath("/users");
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
      status: 500,
    };
  }
}

export async function logAuditAction(input: {
  action: string;
  entity?: string | null;
  entityId?: string | null;
  details?: string | null;
}): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const userId = session.user!.id!;
    const [profile] = await db
      .select({ username: profiles.username })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId,
      username:
        profile?.username ?? session.user?.email?.split("@")[0] ?? null,
      action: input.action,
      entity: input.entity ?? null,
      entityId: input.entityId ?? null,
      details: input.details?.slice(0, 300) ?? null,
    });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function listAuditLogsAction(input?: {
  limit?: number;
}): Promise<ActionResult<{ rows: Dict[] }>> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(input?.limit ?? 200);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        user_id: r.userId,
        username: r.username,
        action: r.action,
        entity: r.entity,
        entity_id: r.entityId,
        details: r.details,
        created_at:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
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

export async function lookupProfileByUsernameAction(input: {
  username: string;
}): Promise<
  ActionResult<{
    profile: { id: string; username: string | null } | null;
    roles: string[];
  }>
> {
  try {
    const [profile] = await db
      .select({ id: profiles.id, username: profiles.username })
      .from(profiles)
      .where(eq(profiles.username, input.username))
      .limit(1);
    if (!profile) return { ok: true, profile: null, roles: [] };
    const roles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, profile.id));
    return { ok: true, profile, roles: roles.map((r) => r.role) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lookup failed",
      status: 500,
    };
  }
}

export async function syncMediaFromCatalogAction(): Promise<
  ActionResult<{ inserted: number }>
> {
  try {
    await requireStaff();
    const existing = await db.select({ url: mediaAssets.url }).from(mediaAssets);
    const urls = new Set(existing.map((e) => e.url));
    const [prods, brandRows, content] = await Promise.all([
      db
        .select({ nameEn: products.nameEn, imageUrl: products.imageUrl })
        .from(products)
        .limit(2000),
      db
        .select({ nameEn: brands.nameEn, logoUrl: brands.logoUrl })
        .from(brands)
        .limit(500),
      db
        .select({ label: siteContent.label, valueEn: siteContent.valueEn })
        .from(siteContent)
        .limit(500),
    ]);
    const chunk: (typeof mediaAssets.$inferInsert)[] = [];
    for (const p of prods) {
      if (p.imageUrl && !urls.has(p.imageUrl)) {
        chunk.push({
          id: crypto.randomUUID(),
          name: p.nameEn || "product",
          path: p.imageUrl.replace(/^\/uploads\//, ""),
          url: p.imageUrl,
        });
        urls.add(p.imageUrl);
      }
    }
    for (const b of brandRows) {
      if (b.logoUrl && !urls.has(b.logoUrl)) {
        chunk.push({
          id: crypto.randomUUID(),
          name: b.nameEn || "brand",
          path: b.logoUrl.replace(/^\/uploads\//, ""),
          url: b.logoUrl,
        });
        urls.add(b.logoUrl);
      }
    }
    for (const c of content) {
      const url = c.valueEn;
      if (url && url.startsWith("/uploads/") && !urls.has(url)) {
        chunk.push({
          id: crypto.randomUUID(),
          name: c.label || "content",
          path: url.replace(/^\/uploads\//, ""),
          url,
        });
        urls.add(url);
      }
    }
    for (let i = 0; i < chunk.length; i += 50) {
      await db.insert(mediaAssets).values(chunk.slice(i, i + 50));
    }
    return { ok: true, inserted: chunk.length };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sync failed",
      status: 500,
    };
  }
}
