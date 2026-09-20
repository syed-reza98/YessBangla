import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLoadingState } from "@/components/admin/AdminLoading";

export const Route = createFileRoute("/admin/cms")({
  head: () => ({
    meta: [
      { title: "Content management — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  pendingMs: 150,
  pendingMinMs: 200,
  pendingComponent: () => <AdminLoadingState />,
  component: () => <Outlet />,
});
