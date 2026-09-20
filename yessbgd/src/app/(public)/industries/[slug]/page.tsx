import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndustryDetailPage } from "@/components/IndustryDetailPage";
import { getIndustry } from "@/data/industries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) {
    return { title: "Industry not found — YESS Bangla" };
  }
  const title = `${industry.title} — YESS Bangla`;
  return {
    title,
    description: industry.desc,
    openGraph: { title, description: industry.desc },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();
  return <IndustryDetailPage slug={slug} />;
}
