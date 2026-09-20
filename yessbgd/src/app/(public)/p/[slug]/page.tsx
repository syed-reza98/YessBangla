import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSitePageAction, listPageSectionsAction } from "@/actions/cms";
import { CmsCustomPage } from "@/components/CmsCustomPage";
import type { PageSection } from "@/lib/siteContent";
import { localised, type SitePage } from "@/lib/sitePages.shared";

type Params = Promise<{ slug: string }>;

async function loadCmsPage(slug: string) {
  const [pageRes, sectionsRes] = await Promise.all([
    getSitePageAction({ page: slug }),
    listPageSectionsAction({ page: slug, publishedOnly: true }),
  ]);
  const page =
    pageRes.ok && pageRes.row ? (pageRes.row as SitePage) : null;
  const sections =
    sectionsRes.ok && sectionsRes.rows
      ? (sectionsRes.rows as PageSection[])
      : [];
  return { page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await loadCmsPage(slug);
  if (!page || !page.is_published) {
    return { title: "Page not found — YESS Bangla" };
  }
  const title =
    localised(page.seo_title, page.seo_title_bn, false) ||
    localised(page.name, page.name_bn, false);
  const description =
    localised(page.seo_description, page.seo_description_bn, false) ||
    "A page from the YESS Bangla web portal.";
  const fullTitle = `${title} — YESS Bangla`;
  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      images: page.og_image ? [{ url: page.og_image }] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const { page, sections } = await loadCmsPage(slug);
  if (!page || !page.is_published) notFound();
  return <CmsCustomPage page={page} sections={sections} />;
}
