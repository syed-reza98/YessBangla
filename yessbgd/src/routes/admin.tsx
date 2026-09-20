import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname.startsWith("/admin/login");
  const { data: session, status } = useSession();

  useEffect(() => {
    if (isLogin) return;
    if (status === "unauthenticated") {
      navigate({ to: "/admin/login" });
    }
  }, [isLogin, status, navigate]);

  if (isLogin) return <Outlet />;

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <AdminShell email={session?.user?.email ?? null}>
      <Outlet />
    </AdminShell>
  );
}
