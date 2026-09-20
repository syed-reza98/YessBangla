import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPillarPage } from "@/components/AboutPillarPage";
import { getPillar } from "@/data/about";

type Params = Promise<{ pillar: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { pillar: slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar) {
    return { title: "Page not found — YESS Bangla" };
  }
  const title = `${pillar.title} — YESS Bangla`;
  return {
    title,
    description: pillar.short,
    openGraph: { title, description: pillar.short },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { pillar: slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar) notFound();
  return <AboutPillarPage slug={slug} />;
}
