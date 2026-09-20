import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

const STAFF = new Set(["cashier", "manager", "admin", "super_admin"]);

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Defense in depth alongside proxy.ts — Auth.js session endpoint
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (!res.ok) throw redirect({ to: "/auth" });
    const session = (await res.json()) as {
      user?: { id?: string; role?: string };
    } | null;
    if (!session?.user?.id) throw redirect({ to: "/auth" });
    const role = session.user.role || "customer";
    if (!STAFF.has(role)) throw redirect({ to: "/" });
    return { user: session.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
