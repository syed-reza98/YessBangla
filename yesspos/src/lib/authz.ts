import { auth } from "@/auth";
import type { Session } from "next-auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export type AppRole =
  | "customer"
  | "cashier"
  | "manager"
  | "admin"
  | "super_admin";

const STAFF: AppRole[] = ["cashier", "manager", "admin", "super_admin"];
const MANAGERS: AppRole[] = ["manager", "admin", "super_admin"];
const ADMINS: AppRole[] = ["admin", "super_admin"];

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Authentication required", 401);
  }
  return session;
}

export function sessionRole(session: Session): AppRole {
  return ((session.user as { role?: string }).role || "customer") as AppRole;
}

export async function requireRole(roles: AppRole[]): Promise<Session> {
  const session = await requireAuth();
  const role = sessionRole(session);
  if (!roles.includes(role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}

export async function requireStaff(): Promise<Session> {
  return requireRole(STAFF);
}

export async function requireManager(): Promise<Session> {
  return requireRole(MANAGERS);
}

export async function requireAdmin(): Promise<Session> {
  return requireRole(ADMINS);
}
