import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/ContactPage";

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/contact */
export const Route = createFileRoute("/contact")({
  component: ContactPage,
});
