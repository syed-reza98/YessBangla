import { createFileRoute } from "@tanstack/react-router";
import { ApplicationStatusPage } from "@/components/ApplicationStatusPage";

type SearchParams = { ref?: string; email?: string };

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/application-status */
export const Route = createFileRoute("/application-status")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: ApplicationStatusRoute,
});

function ApplicationStatusRoute() {
  const sp = Route.useSearch();
  return (
    <ApplicationStatusPage initialRef={sp.ref} initialEmail={sp.email} />
  );
}
