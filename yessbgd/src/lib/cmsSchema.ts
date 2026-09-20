// CMS schema definitions — drives generic list & edit UI for cms_* tables.
export type CmsFieldType = "text" | "textarea" | "markdown" | "number" | "boolean" | "json";

export type CmsField = {
  key: string;
  label: string;
  type: CmsFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type CmsTypeConfig = {
  table: "cms_ventures" | "cms_services" | "cms_industries" | "cms_insights";
  label: string;
  labelBn: string;
  description: string;
  listColumns: { key: string; label: string }[];
  fields: CmsField[];
  orderBy: { column: string; ascending: boolean };
};

const COMMON_PUBLISHED: CmsField = {
  key: "is_published",
  label: "Published",
  type: "boolean",
  help: "Unpublished items are hidden from the public site.",
};

const SLUG_FIELD: CmsField = {
  key: "slug",
  label: "Slug",
  type: "text",
  required: true,
  placeholder: "akash-tv",
  help: "URL-safe identifier. Lowercase, hyphens only.",
};

export const CMS_TYPES: Record<string, CmsTypeConfig> = {
  ventures: {
    table: "cms_ventures",
    label: "Ventures",
    labelBn: "ভেঞ্চার",
    description: "Akash TV, Organic Haat, Yess Soft সহ সব ভেঞ্চার।",
    orderBy: { column: "sort_order", ascending: true },
    listColumns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "sort_order", label: "Order" },
    ],
    fields: [
      SLUG_FIELD,
      { key: "title", label: "Title", type: "text", required: true },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category", type: "text", placeholder: "media | agriculture | software" },
      { key: "status", label: "Status", type: "text", placeholder: "active | upcoming | retired" },
      { key: "icon", label: "Icon name (lucide)", type: "text", placeholder: "Tv" },
      { key: "image_path", label: "Image path / URL", type: "text" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "data", label: "Extra data (JSON)", type: "json", help: "Free-form JSON for gallery, links, metrics, etc." },
      COMMON_PUBLISHED,
    ],
  },
  services: {
    table: "cms_services",
    label: "Services",
    labelBn: "সার্ভিস",
    description: "কোর সার্ভিস অফারিংস।",
    orderBy: { column: "sort_order", ascending: true },
    listColumns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "Order" },
    ],
    fields: [
      SLUG_FIELD,
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon name", type: "text" },
      { key: "bullets", label: "Bullets (JSON array)", type: "json", placeholder: '["item 1", "item 2"]' },
      { key: "pricing", label: "Pricing (JSON)", type: "json" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "data", label: "Extra data (JSON)", type: "json" },
      COMMON_PUBLISHED,
    ],
  },
  industries: {
    table: "cms_industries",
    label: "Industries",
    labelBn: "ইন্ডাস্ট্রি",
    description: "সেক্টর/ভার্টিকাল কভারেজ।",
    orderBy: { column: "sort_order", ascending: true },
    listColumns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "sort_order", label: "Order" },
    ],
    fields: [
      SLUG_FIELD,
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon name", type: "text" },
      { key: "outcomes", label: "Outcomes (JSON array)", type: "json" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "data", label: "Extra data (JSON)", type: "json" },
      COMMON_PUBLISHED,
    ],
  },
  insights: {
    table: "cms_insights",
    label: "Insights",
    labelBn: "ইনসাইট",
    description: "ব্লগ পোস্ট, কেস স্টাডি, আর্টিকেল।",
    orderBy: { column: "published_at", ascending: false },
    listColumns: [
      { key: "title", label: "Title" },
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category" },
      { key: "published_at", label: "Published" },
    ],
    fields: [
      SLUG_FIELD,
      { key: "title", label: "Title", type: "text", required: true },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "body_md", label: "Body (Markdown)", type: "markdown" },
      { key: "category", label: "Category", type: "text" },
      { key: "author", label: "Author", type: "text" },
      { key: "cover_image", label: "Cover image URL", type: "text" },
      { key: "tags", label: "Tags (JSON array)", type: "json", placeholder: '["ai", "bangla"]' },
      { key: "published_at", label: "Publish date (ISO)", type: "text", placeholder: "2026-05-12T10:00:00Z" },
      { key: "data", label: "Extra data (JSON)", type: "json" },
      COMMON_PUBLISHED,
    ],
  },
};

export type CmsTypeKey = keyof typeof CMS_TYPES;

export function getCmsConfig(type: string): CmsTypeConfig | null {
  return CMS_TYPES[type as CmsTypeKey] ?? null;
}
