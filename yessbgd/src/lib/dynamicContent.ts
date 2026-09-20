// Dynamic content layer — reads published CMS rows from the database and
// falls back to the bundled static content when a row is missing/empty.
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { listCmsTypeAction, type CmsListType } from "@/actions/cms";
import { upsertCmsRecordAction } from "@/actions/public";
import { resolveMediaUrl } from "@/lib/mediaAssets";

import { ventures as staticVentures, type Venture } from "@/data/ventures";
import { services as staticServices, type ServiceItem } from "@/data/services";
import { industries as staticIndustries, type IndustryItem } from "@/data/industries";
import { insights as staticInsights, type Insight } from "@/data/insights";

const STALE = 60_000;

function icon(name: unknown, fallback: LucideIcon): LucideIcon {
  if (typeof name !== "string" || !name) return fallback;
  const found = (Icons as unknown as Record<string, LucideIcon>)[name];
  return typeof found === "function" || typeof found === "object" ? (found ?? fallback) : fallback;
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length ? (value as T[]) : fallback;
}

/** Merge DB rows over static defaults, keeping static-only entries at the end.
 *  CMS-only rows without a static counterpart must include an image_path;
 *  otherwise incomplete seed data (e.g. slug-only inserts) would prepend
 *  blank cards and hide the bundled legacy catalog. */
function merge<T extends { slug: string }>(
  rows: Record<string, unknown>[] | undefined,
  statics: T[],
  map: (row: Record<string, unknown>, base: T | undefined) => T,
): T[] {
  if (!rows || rows.length === 0) return statics;
  const bySlug = new Map(statics.map((s) => [s.slug, s]));
  const dynamic = rows
    .filter((r) => typeof r.slug === "string")
    .filter((r) => {
      const slug = r.slug as string;
      if (bySlug.has(slug)) return true;
      const image =
        (typeof r.image_path === "string" && r.image_path.trim()) ||
        (typeof r.cover_image === "string" && r.cover_image.trim());
      return Boolean(image);
    })
    .map((r) => map(r, bySlug.get(r.slug as string)));
  const seen = new Set(dynamic.map((d) => d.slug));
  return [...dynamic, ...statics.filter((s) => !seen.has(s.slug))];
}

/* ---------------------------------- ventures --------------------------------- */

// Bundled venture artwork, keyed by file name. Lets the CMS store a friendly
// path like "/src/assets/ventures/yess-food.jpg" (or just "yess-food.jpg")
// while the site still serves the hashed, build-safe asset URL.
export function resolveImage(value: unknown, fallback: string | { src: string } = ""): string {
  if (value && typeof value === "object" && "src" in (value as object)) {
    return String((value as { src: string }).src);
  }
  return resolveMediaUrl(value, fallback);
}

function toVenture(row: Record<string, unknown>, base: Venture | undefined): Venture {
  const fallback = base ?? staticVentures[0];
  const extra = obj(row.data);
  return {
    ...fallback,
    ...extra,
    slug: row.slug as string,
    title: (row.title as string) ?? fallback.title,
    category: (row.category as string) ?? fallback.category,
    tagline: (row.tagline as string) ?? fallback.tagline,
    desc: (row.description as string) ?? fallback.desc,
    image: resolveImage(row.image_path, fallback.image),
    icon: icon(row.icon, fallback.icon),
  } as Venture;
}



export function useVentures(): Venture[] {
  const { data } = useQuery({
    queryKey: ["cms", "ventures"],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listCmsTypeAction({ type: "ventures" });
      if (!res.ok) throw new Error(res.error);
      return ((res.rows ?? []) as Array<Record<string, unknown>>).filter(
        (r) => r.is_published !== false
      );
    },
  });
  return merge(data as Record<string, unknown>[] | undefined, staticVentures, toVenture);
}

export function useVenture(slug: string): Venture | undefined {
  return useVentures().find((v) => v.slug === slug);
}

/* ---------------------------------- services --------------------------------- */

function toService(row: Record<string, unknown>, base: ServiceItem | undefined): ServiceItem {
  const fallback = base ?? staticServices[0];
  const extra = obj(row.data);
  return {
    ...fallback,
    ...extra,
    slug: row.slug as string,
    title: (row.title as string) ?? fallback.title,
    desc: (row.description as string) ?? fallback.desc,
    icon: icon(row.icon, fallback.icon),
    bullets: arr(row.bullets, fallback.bullets),
    pricing: { ...fallback.pricing, ...obj(row.pricing) },
  } as ServiceItem;
}

export function useServices(): ServiceItem[] {
  const { data } = useQuery({
    queryKey: ["cms", "services"],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listCmsTypeAction({ type: "services" });
      if (!res.ok) throw new Error(res.error);
      return ((res.rows ?? []) as Array<Record<string, unknown>>).filter(
        (r) => r.is_published !== false
      );
    },
  });
  return merge(data as Record<string, unknown>[] | undefined, staticServices, toService);
}

export function useService(slug: string): ServiceItem | undefined {
  return useServices().find((s) => s.slug === slug);
}

/* --------------------------------- industries -------------------------------- */

function toIndustry(row: Record<string, unknown>, base: IndustryItem | undefined): IndustryItem {
  const fallback = base ?? staticIndustries[0];
  const extra = obj(row.data);
  return {
    ...fallback,
    ...extra,
    slug: row.slug as string,
    title: (row.title as string) ?? fallback.title,
    desc: (row.description as string) ?? fallback.desc,
    icon: icon(row.icon, fallback.icon),
    outcomes: arr(row.outcomes, fallback.outcomes),
  } as IndustryItem;
}

export function useIndustries(): IndustryItem[] {
  const { data } = useQuery({
    queryKey: ["cms", "industries"],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listCmsTypeAction({ type: "industries" });
      if (!res.ok) throw new Error(res.error);
      return ((res.rows ?? []) as Array<Record<string, unknown>>).filter(
        (r) => r.is_published !== false
      );
    },
  });
  return merge(data as Record<string, unknown>[] | undefined, staticIndustries, toIndustry);
}

export function useIndustry(slug: string): IndustryItem | undefined {
  return useIndustries().find((i) => i.slug === slug);
}

/* ---------------------------------- insights --------------------------------- */

function toInsight(row: Record<string, unknown>, base: Insight | undefined): Insight {
  const fallback = base ?? staticInsights[0];
  const extra = obj(row.data);
  return {
    ...fallback,
    ...extra,
    slug: row.slug as string,
    title: (row.title as string) ?? fallback.title,
    excerpt: (row.excerpt as string) ?? fallback.excerpt,
    tag: (row.category as string) ?? (extra.tag as string) ?? fallback.tag,
  } as Insight;
}

export function useInsights(): Insight[] {
  const { data } = useQuery({
    queryKey: ["cms", "insights"],
    staleTime: STALE,
    queryFn: async () => {
      const res = await listCmsTypeAction({ type: "insights" });
      if (!res.ok) throw new Error(res.error);
      return ((res.rows ?? []) as Array<Record<string, unknown>>).filter(
        (r) => r.is_published !== false
      );
    },
  });
  return merge(data as Record<string, unknown>[] | undefined, staticInsights, toInsight);
}

export function useInsight(slug: string): Insight | undefined {
  return useInsights().find((i) => i.slug === slug);
}

/* ------------------------------- static → DB sync ----------------------------- */

const iconName = (fn: unknown) =>
  (fn as { displayName?: string; name?: string })?.displayName ||
  (fn as { name?: string })?.name ||
  null;

/** One-click: push the bundled static content into the CMS tables (admin only). */
export async function syncStaticContentToCms() {
  const ventureRows = staticVentures.map((v, index) => {
    const { slug, title, category, tagline, desc, image, icon: ic, ...rest } = v;
    return {
      slug,
      title,
      category,
      tagline,
      description: desc,
      image_path: image,
      icon: iconName(ic),
      sort_order: index,
      is_published: true,
      data: rest as unknown as Record<string, unknown>,
    };
  });

  const serviceRows = staticServices.map((s, index) => {
    const { slug, title, desc, icon: ic, bullets, pricing, ...rest } = s;
    return {
      slug,
      title,
      description: desc,
      icon: iconName(ic),
      bullets,
      pricing,
      sort_order: index,
      is_published: true,
      data: rest as unknown as Record<string, unknown>,
    };
  });

  const industryRows = staticIndustries.map((i, index) => {
    const { slug, title, desc, icon: ic, outcomes, ...rest } = i;
    return {
      slug,
      title,
      description: desc,
      icon: iconName(ic),
      outcomes,
      sort_order: index,
      is_published: true,
      data: rest as unknown as Record<string, unknown>,
    };
  });

  const insightRows = staticInsights.map((p) => {
    const { slug, title, excerpt, tag, date, ...rest } = p;
    const parsed = new Date(date);
    return {
      slug,
      title,
      excerpt,
      category: tag,
      author: p.author?.name ?? null,
      body_md: p.content?.map((c) => (c.heading ? `## ${c.heading}\n\n${c.body}` : c.body)).join("\n\n") ?? null,
      published_at: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
      is_published: true,
      data: { tag, date, ...rest } as unknown as Record<string, unknown>,
    };
  });

  const syncType = async (
    type: CmsListType,
    rows: Array<Record<string, unknown>>
  ) => {
    for (const row of rows) {
      const res = await upsertCmsRecordAction({ type, data: row });
      if (!res.ok) throw new Error(res.error);
    }
  };

  await syncType("ventures", ventureRows);
  await syncType("services", serviceRows);
  await syncType("industries", industryRows);
  await syncType("insights", insightRows);

  return {
    ventures: ventureRows.length,
    services: serviceRows.length,
    industries: industryRows.length,
    insights: insightRows.length,
  };
}
