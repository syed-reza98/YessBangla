import { createFileRoute, redirect } from "@tanstack/react-router";

// `/projects` was a near-duplicate of `/ventures`. We now treat `/ventures`
// as the canonical portfolio route and 301-redirect `/projects` to it so we
// preserve any inbound links / SEO equity without serving duplicate content.
export const Route = createFileRoute("/projects")({
  beforeLoad: () => {
    throw redirect({ to: "/ventures", replace: true });
  },
  component: () => null,
});
