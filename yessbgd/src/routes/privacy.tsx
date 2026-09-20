import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/PrivacyPage";

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/privacy */
export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});
