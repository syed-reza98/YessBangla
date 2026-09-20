import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightDetailPage } from "@/components/InsightDetailPage";
import { getInsight } from "@/data/insights";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getInsight(slug);
  const title = post ? `${post.title} — YESS Bangla Insights` : "Article — YESS Bangla";
  const description = post?.excerpt ?? "Read the latest insight from YESS Bangla.";
  const url = post ? `https://yessbangla.com/insights/${post.slug}` : "https://yessbangla.com/insights";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
    },
    alternates: { canonical: url },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post) notFound();

  const url = `https://yessbangla.com/insights/${post.slug}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author.name },
    datePublished: post.date,
    articleSection: post.tag,
    mainEntityOfPage: url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <InsightDetailPage slug={slug} />
    </>
  );
}
