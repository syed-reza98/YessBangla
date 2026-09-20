import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// Column name must be `role` (matches schema.sql). First mysqlEnum arg is the column name.
export const appRoleEnum = mysqlEnum("role", ["admin", "moderator", "user"]);

// 1. Authentication & Profiles
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fullName: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 150 }),
  avatarUrl: text("avatar_url"),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  theme: varchar("theme", { length: 20 }).default("light").notNull(),
  itemsPerPage: int("items_per_page").default(20).notNull(),
  notifyNewApplication: boolean("notify_new_application").default(true).notNull(),
  notifyNewMessage: boolean("notify_new_message").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const userRoles = mysqlTable("user_roles", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull(),
  role: appRoleEnum.default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. CMS Dynamic Site Pages
export const cmsSitePages = mysqlTable("cms_site_pages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: varchar("page", { length: 100 }).notNull().unique(),
  path: varchar("path", { length: 255 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  nameBn: varchar("name_bn", { length: 150 }),
  heroEyebrow: text("hero_eyebrow"),
  heroEyebrowBn: text("hero_eyebrow_bn"),
  heroTitle: text("hero_title"),
  heroTitleBn: text("hero_title_bn"),
  heroSubtitle: text("hero_subtitle"),
  heroSubtitleBn: text("hero_subtitle_bn"),
  heroImage: text("hero_image"),
  body: text("body"),
  bodyBn: text("body_bn"),
  seoTitle: text("seo_title"),
  seoTitleBn: text("seo_title_bn"),
  seoDescription: text("seo_description"),
  seoDescriptionBn: text("seo_description_bn"),
  ogImage: text("og_image"),
  isCustom: boolean("is_custom").default(false).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  sortOrder: int("sort_order").default(0),
  data: json("data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 3. Ventures & Businesses
export const cmsVentures = mysqlTable("cms_ventures", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  nameBn: varchar("name_bn", { length: 150 }),
  tag: varchar("tag", { length: 100 }),
  tagBn: varchar("tag_bn", { length: 100 }),
  category: varchar("category", { length: 100 }).default("tech"),
  status: varchar("status", { length: 50 }).default("active"),
  summary: text("summary"),
  summaryBn: text("summary_bn"),
  description: text("description"),
  descriptionBn: text("description_bn"),
  metrics: json("metrics").$type<Record<string, unknown>>().default({}),
  heroImage: text("hero_image"),
  logoImage: text("logo_image"),
  linkUrl: text("link_url"),
  sortOrder: int("sort_order").default(0),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 4. Services & Industries
export const cmsServices = mysqlTable("cms_services", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  nameBn: varchar("name_bn", { length: 150 }),
  summary: text("summary"),
  summaryBn: text("summary_bn"),
  description: text("description"),
  descriptionBn: text("description_bn"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const cmsIndustries = mysqlTable("cms_industries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  nameBn: varchar("name_bn", { length: 150 }),
  summary: text("summary"),
  summaryBn: text("summary_bn"),
  description: text("description"),
  descriptionBn: text("description_bn"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sort_order").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 5. Insights & Articles
export const cmsInsights = mysqlTable("cms_insights", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  titleBn: varchar("title_bn", { length: 255 }),
  category: varchar("category", { length: 100 }).default("Strategy"),
  excerpt: text("excerpt"),
  excerptBn: text("excerpt_bn"),
  content: text("content"),
  contentBn: text("content_bn"),
  author: varchar("author", { length: 150 }).default("Yess Editorial Team"),
  readTime: varchar("read_time", { length: 50 }).default("5 min read"),
  coverImage: text("cover_image"),
  isPublished: boolean("is_published").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 6. Navigation Menus & Media
export const cmsMenuItems = mysqlTable("cms_menu_items", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  location: varchar("location", { length: 50 }).default("header").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  labelBn: varchar("label_bn", { length: 100 }),
  href: varchar("href", { length: 255 }).notNull(),
  groupLabel: varchar("group_label", { length: 100 }),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isExternal: boolean("is_external").default(false),
  isPublished: boolean("is_published").default(true),
  parentId: varchar("parent_id", { length: 36 }),
  depth: int("depth").default(0),
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  descriptionBn: text("description_bn"),
  accent: varchar("accent", { length: 50 }),
  itemStyle: varchar("item_style", { length: 50 }),
  badge: varchar("badge", { length: 50 }),
  badgeBn: varchar("badge_bn", { length: 50 }),
  visibleTo: varchar("visible_to", { length: 30 }).default("all"),
  target: varchar("target", { length: 20 }).default("_self"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cmsMedia = mysqlTable("cms_media", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: int("size").default(0),
  altText: varchar("alt_text", { length: 255 }),
  folder: varchar("folder", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cmsSettings = mysqlTable("cms_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: json("value").$type<Record<string, unknown>>().default({}),
  label: varchar("label", { length: 255 }),
  group: varchar("group", { length: 100 }),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/** Page section blocks (hero, intro, …) keyed by site page slug */
export const cmsPages = mysqlTable("cms_pages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  page: varchar("page", { length: 100 }).notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  sortOrder: int("sort_order").default(0),
  title: text("title"),
  titleBn: text("title_bn"),
  subtitle: text("subtitle"),
  subtitleBn: text("subtitle_bn"),
  body: text("body"),
  bodyBn: text("body_bn"),
  ctaLabel: varchar("cta_label", { length: 150 }),
  ctaHref: varchar("cta_href", { length: 255 }),
  imageUrl: text("image_url"),
  data: json("data").$type<Record<string, unknown>>().default({}),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 7. Operations: Contact Inquiries, Job Applications & Audit
export const contactMessages = mysqlTable("contact_messages", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  status: varchar("status", { length: 50 }).default("new"),
  statusNote: text("status_note"),
  statusUpdatedAt: timestamp("status_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobApplications = mysqlTable("job_applications", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobSlug: varchar("job_slug", { length: 100 }).notNull(),
  jobTitle: varchar("job_title", { length: 150 }).notNull(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  linkedin: text("linkedin"),
  coverLetter: text("cover_letter").notNull(),
  resumePath: text("resume_path").notNull(),
  resumeName: varchar("resume_name", { length: 255 }).notNull(),
  resumeSize: int("resume_size").notNull(),
  resumeType: varchar("resume_type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  statusNote: text("status_note"),
  statusUpdatedAt: timestamp("status_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: varchar("entity_id", { length: 36 }),
  details: json("details").$type<Record<string, unknown>>().default({}),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
