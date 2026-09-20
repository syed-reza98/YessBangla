import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VentureDetailPage } from "@/components/VentureDetailPage";
import { getVenture } from "@/data/ventures";
import { toImageSrc } from "@/lib/mediaAssets";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = getVenture(slug);
  if (!v) {
    return { title: "Venture — YESS Bangla" };
  }
  const url = `https://yessbgd.lovable.app/ventures/${v.slug}`;
  const title = `${v.title} — ${v.category} | YESS Bangla`;
  const imageUrl = v.image ? toImageSrc(v.image) : undefined;
  return {
    title,
    description: v.desc,
    keywords: [v.title, v.category, ...v.services, "YESS Bangla", "Bangladesh"].join(", "),
    openGraph: {
      title,
      description: v.desc,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: "website",
      url,
    },
    alternates: { canonical: url },
    twitter: {
      card: "summary_large_image",
      title: `${v.title} — YESS Bangla`,
      description: v.desc,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const venture = getVenture(slug);
  if (!venture) notFound();

  const v = venture;
  const url = `https://yessbgd.lovable.app/ventures/${v.slug}`;
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: v.title,
    alternateName: `${v.title} — YESS Bangla`,
    description: v.desc,
    url,
    logo: toImageSrc(v.image),
    image: toImageSrc(v.image),
    foundingDate: v.founded,
    areaServed: v.reach ?? "Bangladesh",
    parentOrganization: { "@type": "Organization", name: "YESS Bangla" },
    sameAs: ["https://yessbgd.lovable.app"],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://yessbgd.lovable.app/" },
      { "@type": "ListItem", position: 2, name: "Ventures", item: "https://yessbgd.lovable.app/ventures" },
      { "@type": "ListItem", position: 3, name: v.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <VentureDetailPage slug={slug} />
    </>
  );
}
