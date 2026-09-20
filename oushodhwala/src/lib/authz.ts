/**
 * Shared authorization helpers for legacy server-function callers.
 * Role checks use Drizzle + user_roles (no db-client shim).
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userRoles } from "@/db/schema";
import { requireAuth, requireAdmin as requireAdminSession, requireStaff as requireStaffSession } from "@/lib/session-authz";

export type AuthzCtx = {
  userId: string;
};

export type Role = "admin" | "erp_manager";

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function unauthorized(message = "Authentication required"): Response {
  return jsonError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "You do not have permission to perform this action"): Response {
  return jsonError(403, "FORBIDDEN", message);
}

export function notFound(message = "Resource not found"): Response {
  return jsonError(404, "NOT_FOUND", message);
}

export function badRequest(message = "Invalid request"): Response {
  return jsonError(400, "BAD_REQUEST", message);
}

async function hasRole(userId: string, role: Role): Promise<boolean> {
  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)))
    .limit(1);
  return rows.length > 0;
}

/** Resolve Auth.js session into AuthzCtx (ignores empty createServerFn context). */
export async function resolveAuthzCtx(
  _context?: Partial<AuthzCtx> | undefined
): Promise<AuthzCtx> {
  const session = await requireAuth();
  return { userId: session.user!.id! };
}

export function requireUser(context: Partial<AuthzCtx> | undefined): AuthzCtx {
  if (!context?.userId) throw unauthorized();
  return context as AuthzCtx;
}

export async function requireAdmin(context?: Partial<AuthzCtx> | undefined): Promise<AuthzCtx> {
  if (context?.userId) {
    if (!(await hasRole(context.userId, "admin"))) throw forbidden("Admin role required");
    return context as AuthzCtx;
  }
  const session = await requireAdminSession();
  return { userId: session.user!.id! };
}

export async function requireStaff(context?: Partial<AuthzCtx> | undefined): Promise<AuthzCtx> {
  if (context?.userId) {
    const [admin, erp] = await Promise.all([
      hasRole(context.userId, "admin"),
      hasRole(context.userId, "erp_manager"),
    ]);
    if (!admin && !erp) {
      // Fall through to session role check for pharmacist/doctor/staff etc.
      await requireStaffSession();
    }
    return { userId: context.userId };
  }
  const session = await requireStaffSession();
  return { userId: session.user!.id! };
}

/** @deprecated Prefer Drizzle Actions — kept as no-op auth gate for legacy handlers */
export async function adminClient(context?: Partial<AuthzCtx> | undefined) {
  await requireAdmin(context);
  return null;
}

/** @deprecated Prefer Drizzle Actions — kept as no-op auth gate for legacy handlers */
export async function staffClient(context?: Partial<AuthzCtx> | undefined) {
  await requireStaff(context);
  return null;
}
