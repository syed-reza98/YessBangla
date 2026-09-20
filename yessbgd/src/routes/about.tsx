import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/AboutPage";

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/about */
export const Route = createFileRoute("/about")({
  component: AboutPage,
});
