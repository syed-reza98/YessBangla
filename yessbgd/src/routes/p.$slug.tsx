import { resolveMediaUrl } from "@/lib/mediaAssets";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/PageHero";
import { useSitePage, localised } from "@/lib/sitePages";
import { usePageSections } from "@/lib/siteContent";

export const Route = createFileRoute("/p/$slug")({
  head: () => ({
    meta: [
      { title: "Page — YESS Bangla" },
      { name: "description", content: "A page from the YESS Bangla web portal." },
      { property: "og:title", content: "YESS Bangla" },
      { property: "og:description", content: "A page from the YESS Bangla web portal." },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const { slug } = useParams({ from: "/p/$slug" });
  const { i18n } = useTranslation();
  const isBn = i18n.language?.startsWith("bn") ?? false;
  const { data: page, isLoading } = useSitePage(slug);
  const { sections } = usePageSections(slug);

  // Keep the document title in sync with the CMS row.
  useQuery({
    queryKey: ["cms", "site-page-title", slug, page?.seo_title, page?.name, isBn],
    enabled: typeof document !== "undefined" && !!page,
    queryFn: async () => {
      const title =
        localised(page?.seo_title ?? null, page?.seo_title_bn ?? null, isBn) ||
        localised(page?.name ?? null, page?.name_bn ?? null, isBn);
      if (title) document.title = `${title} — YESS Bangla`;
      return title;
    },
  });

  if (isLoading) {
    return <div className="container-tight py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!page || !page.is_published) {
    return (
      <div className="container-tight py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">এই পেইজটি খুঁজে পাওয়া যায়নি।</p>
      </div>
    );
  }

  const heroTitle =
    localised(page.hero_title, page.hero_title_bn, isBn) || localised(page.name, page.name_bn, isBn);
  const heroSubtitle = localised(page.hero_subtitle, page.hero_subtitle_bn, isBn);
  const eyebrow = localised(page.hero_eyebrow, page.hero_eyebrow_bn, isBn);
  const body = localised(page.body, page.body_bn, isBn);

  return (
    <div>
      <PageHero eyebrow={eyebrow || undefined} title={heroTitle} subtitle={heroSubtitle || undefined} />

      {page.hero_image && (
        <div className="container-tight -mt-4 mb-14">
          <img
            src={resolveMediaUrl(page.hero_image)}
            alt={heroTitle}
            className="w-full rounded-2xl border border-border/60 object-cover shadow-sm"
            loading="lazy"
          />
        </div>
      )}

      {body && (
        <section className="container-tight pb-12">
          <div className="mx-auto max-w-3xl whitespace-pre-line text-muted-foreground">{body}</div>
        </section>
      )}

      {sections.map((s, i) => {
        const title = localised(s.title, s.title_bn, isBn);
        const subtitle = localised(s.subtitle, s.subtitle_bn, isBn);
        const text = localised(s.body, s.body_bn, isBn);
        return (
          <section key={s.id} className={`container-tight py-12 ${i % 2 ? "" : ""}`}>
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div className={s.image_url ? "" : "md:col-span-2 mx-auto max-w-3xl text-center"}>
                {title && <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>}
                {subtitle && <p className="mt-2 text-primary">{subtitle}</p>}
                {text && <p className="mt-4 whitespace-pre-line text-muted-foreground">{text}</p>}
                {s.cta_label && s.cta_href && (
                  <a
                    href={s.cta_href}
                    className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    {s.cta_label}
                  </a>
                )}
              </div>
              {s.image_url && (
                <img
                  src={resolveMediaUrl(s.image_url)}
                  alt={title || ""}
                  className="w-full rounded-2xl border border-border/60 object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
