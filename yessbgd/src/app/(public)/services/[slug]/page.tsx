import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailPage } from "@/components/ServiceDetailPage";
import { getService } from "@/data/services";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) {
    return { title: "Service not found — YESS Bangla" };
  }
  const title = `${service.title} — YESS Bangla`;
  return {
    title,
    description: service.desc,
    openGraph: { title, description: service.desc },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  return <ServiceDetailPage slug={slug} />;
}
