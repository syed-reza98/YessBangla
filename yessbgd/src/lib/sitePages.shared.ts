/** Server-safe CMS page types + helpers (no React Query / i18n). */

export type SitePage = {
  id: string;
  page: string;
  path: string;
  name: string;
  name_bn: string | null;
  hero_eyebrow: string | null;
  hero_eyebrow_bn: string | null;
  hero_title: string | null;
  hero_title_bn: string | null;
  hero_subtitle: string | null;
  hero_subtitle_bn: string | null;
  hero_image: string | null;
  body: string | null;
  body_bn: string | null;
  seo_title: string | null;
  seo_title_bn: string | null;
  seo_description: string | null;
  seo_description_bn: string | null;
  og_image: string | null;
  is_custom: boolean;
  is_published: boolean;
  sort_order: number | null;
  data: Record<string, unknown> | null;
};

export function localised(en: string | null, bn: string | null, isBn: boolean) {
  const primary = isBn ? bn : en;
  const secondary = isBn ? en : bn;
  const value = (primary ?? "").trim() || (secondary ?? "").trim();
  return value || "";
}
