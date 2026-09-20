import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "Pages — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => <Outlet />,
});
