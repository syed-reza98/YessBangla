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

export type AppRole = "admin" | "moderator" | "user";

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Authentication required", 401);
  }
  return session;
}

export async function requireRole(roles: AppRole[]): Promise<Session> {
  const session = await requireAuth();
  const role = ((session.user as { role?: string }).role || "user") as AppRole;
  if (!roles.includes(role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  return requireRole(["admin"]);
}

export async function requireEditor(): Promise<Session> {
  return requireRole(["admin", "moderator"]);
}

export function sessionRole(session: Session): AppRole {
  return ((session.user as { role?: string }).role || "user") as AppRole;
}
