import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth?callbackUrl=/admin");
  }

  const role = (session.user as { role?: string }).role || "customer";
  const staff = new Set([
    "pharmacist",
    "doctor",
    "staff",
    "erp_manager",
    "admin",
    "super_admin",
  ]);
  if (!staff.has(role)) {
    redirect("/");
  }

  return <>{children}</>;
}
