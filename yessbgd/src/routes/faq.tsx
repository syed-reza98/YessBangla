import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "@/components/FaqPage";

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/faq */
export const Route = createFileRoute("/faq")({
  component: FaqPage,
});
