import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "@/lib/mediaAssets";
import { getSitePageAction, listSitePagesAction } from "@/actions/cms";
import type { SitePage } from "@/lib/sitePages.shared";

export type { SitePage } from "@/lib/sitePages.shared";
export { localised } from "@/lib/sitePages.shared";

const STALE = 60_000;

export const SITE_PAGE_FIELDS: {
  key: keyof SitePage;
  keyBn?: keyof SitePage;
  label: string;
  labelBn: string;
  textarea?: boolean;
  group: "hero" | "body" | "seo";
}[] = [
  { key: "hero_eyebrow", keyBn: "hero_eyebrow_bn", label: "Hero eyebrow", labelBn: "হিরো আইব্রো", group: "hero" },
  { key: "hero_title", keyBn: "hero_title_bn", label: "Hero title", labelBn: "হিরো শিরোনাম", group: "hero" },
  { key: "hero_subtitle", keyBn: "hero_subtitle_bn", label: "Hero subtitle", labelBn: "হিরো সাব-টাইটেল", textarea: true, group: "hero" },
  { key: "body", keyBn: "body_bn", label: "Intro body", labelBn: "ভূমিকা", textarea: true, group: "body" },
  { key: "seo_title", keyBn: "seo_title_bn", label: "SEO title", labelBn: "এসইও টাইটেল", group: "seo" },
  { key: "seo_description", keyBn: "seo_description_bn", label: "SEO description", labelBn: "এসইও বর্ণনা", textarea: true, group: "seo" },
];

/** All pages (admin view — includes unpublished when signed in). */
export function useSitePages() {
  return useQuery({
    queryKey: ["cms", "site-pages"],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listSitePagesAction();
      if (!res.ok) throw new Error(res.error);
      return (res.rows ?? []) as SitePage[];
    },
  });
}

/** A single page row by its key (`home`, `services`, custom slug…). */
export function useSitePage(page: string) {
  return useQuery({
    queryKey: ["cms", "site-page", page],
    staleTime: STALE,
    enabled: !!page,
    queryFn: async () => {
      const res = await getSitePageAction({ page });
      if (!res.ok) throw new Error(res.error);
      return (res.row ?? null) as SitePage | null;
    },
  });
}

function pick(en: string | null | undefined, bn: string | null | undefined, isBn: boolean) {
  const primary = isBn ? bn : en;
  const secondary = isBn ? en : bn;
  const value = (primary ?? "").trim() || (secondary ?? "").trim();
  return value || undefined;
}

export type HeroOverride = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image?: string;
};

/**
 * Dashboard-managed hero copy for an existing route.
 * Returns only the values an editor actually filled in, so callers can do
 * `override.title ?? defaultTitle`.
 */
export function usePageOverride(page: string): HeroOverride {
  const { i18n } = useTranslation();
  const isBn = i18n.language?.startsWith("bn") ?? false;
  const { data } = useSitePage(page);
  if (!data || data.is_published === false) return {};
  return {
    eyebrow: pick(data.hero_eyebrow, data.hero_eyebrow_bn, isBn),
    title: pick(data.hero_title, data.hero_title_bn, isBn),
    subtitle: pick(data.hero_subtitle, data.hero_subtitle_bn, isBn),
    body: pick(data.body, data.body_bn, isBn),
    image: data.hero_image ? resolveMediaUrl(data.hero_image, data.hero_image) : undefined,
  };
}
