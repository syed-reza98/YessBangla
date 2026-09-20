import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  CareersApplyNotFound,
  CareersApplyPage,
} from "@/components/CareersApplyPage";
import { getOpening } from "@/data/openings";

/** @deprecated Phase A shim — App Router page is canonical at app/(public)/careers/[slug] */
export const Route = createFileRoute("/careers/$slug")({
  loader: ({ params }) => {
    const job = getOpening(params.slug);
    if (!job) throw notFound();
    return { job };
  },
  notFoundComponent: CareersApplyNotFound,
  component: CareersApplyRoute,
});

function CareersApplyRoute() {
  const { job } = Route.useLoaderData();
  return <CareersApplyPage job={job} />;
}
