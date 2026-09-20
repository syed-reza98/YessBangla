import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/TermsPage";

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/terms */
export const Route = createFileRoute("/terms")({
  component: TermsPage,
});
