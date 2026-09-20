import type { Metadata } from "next";
import {
  CareersApplyNotFound,
  CareersApplyPage,
} from "@/components/CareersApplyPage";
import { getOpening } from "@/data/openings";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getOpening(slug);
  const title = job
    ? `Apply: ${job.title} — YESS Bangla`
    : "Position not found — YESS Bangla";
  const description = job
    ? `Apply for the ${job.title} role at YESS Bangla. ${job.summary}`
    : "This position could not be found.";
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const job = getOpening(slug);
  if (!job) return <CareersApplyNotFound />;
  return <CareersApplyPage job={job} />;
}
