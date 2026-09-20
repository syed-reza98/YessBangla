"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/admin/login");
  const { data: session, status } = useSession();

  useEffect(() => {
    if (isLogin) return;
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [isLogin, status, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "admin" && role !== "moderator")) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Redirecting to login…
      </div>
    );
  }

  return (
    <AdminShell email={session.user.email ?? null}>
      <Suspense fallback={null}>{children}</Suspense>
    </AdminShell>
  );
}
