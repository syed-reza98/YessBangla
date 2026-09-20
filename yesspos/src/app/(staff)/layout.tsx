import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";

const STAFF = new Set(["cashier", "manager", "admin", "super_admin"]);

/**
 * Defense-in-depth staff gate (proxy.ts is coarse only).
 * Used by staff App Router segments under /(staff).
 */
export default async function StaffLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth?callbackUrl=/dashboard");
  }
  const role = (session.user as { role?: string }).role || "customer";
  if (!STAFF.has(role)) {
    redirect("/");
  }
  return <>{children}</>;
}
