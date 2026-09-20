"use server";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  auditLogs,
  cmsIndustries,
  cmsInsights,
  cmsMedia,
  cmsMenuItems,
  cmsPages,
  cmsServices,
  cmsSettings,
  cmsSitePages,
  cmsVentures,
  contactMessages,
  jobApplications,
  userRoles,
} from "@/db/schema";
import { auth } from "@/auth";
import { requireEditor, AuthError, type AppRole } from "@/lib/authz";

export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status?: number };

function fail(err: unknown): { ok: false; error: string; status: number } {
  if (err instanceof AuthError) {
    return { ok: false, error: err.message, status: err.status };
  }
  return {
    ok: false,
    error: err instanceof Error ? err.message : "Request failed",
    status: 500,
  };
}

const CMS_TABLE = {
  ventures: cmsVentures,
  services: cmsServices,
  industries: cmsIndustries,
  insights: cmsInsights,
} as const;

export type CmsListType = keyof typeof CMS_TABLE;

/* ------------------------------- auth / role ------------------------------- */

export async function getViewerRoleAction(): Promise<
  ActionResult<{ role: "guest" | "authenticated" | "admin" }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: true, role: "guest" };
    const role = ((session.user as { role?: string }).role || "user") as AppRole;
    return { ok: true, role: role === "admin" ? "admin" : "authenticated" };
  } catch (err) {
    return fail(err);
  }
}

export async function getDashboardRoleAction(): Promise<
  ActionResult<{
    role: "admin" | "moderator" | "user";
    userId: string | null;
    email: string | null;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: true, role: "user", userId: null, email: null };
    }
    const rows = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id));
    const roles = rows.map((r) => r.role);
    const role = roles.includes("admin")
      ? "admin"
      : roles.includes("moderator")
        ? "moderator"
        : "user";
    return {
      ok: true,
      role,
      userId: session.user.id,
      email: session.user.email ?? null,
    };
  } catch (err) {
    return fail(err);
  }
}

/* --------------------------------- settings -------------------------------- */

export async function listSettingsAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    const rows = await db
      .select()
      .from(cmsSettings)
      .orderBy(asc(cmsSettings.sortOrder));
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        key: r.key,
        label: r.label,
        group: r.group,
        value: r.value,
        sort_order: r.sortOrder,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertSettingAction(input: {
  id?: string;
  key: string;
  value: Record<string, unknown> | unknown;
  label?: string | null;
  group?: string | null;
  sort_order?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireEditor();
    const value =
      input.value && typeof input.value === "object" && !Array.isArray(input.value)
        ? (input.value as Record<string, unknown>)
        : { text: input.value };
    const [existing] = await db
      .select()
      .from(cmsSettings)
      .where(eq(cmsSettings.key, input.key))
      .limit(1);
    if (existing) {
      await db
        .update(cmsSettings)
        .set({
          value,
          label: input.label ?? existing.label,
          group: input.group ?? existing.group,
          sortOrder: input.sort_order ?? existing.sortOrder,
        })
        .where(eq(cmsSettings.id, existing.id));
      revalidatePath("/");
      return { ok: true, id: existing.id };
    }
    const id = input.id || crypto.randomUUID();
    await db.insert(cmsSettings).values({
      id,
      key: input.key,
      value,
      label: input.label ?? null,
      group: input.group ?? null,
      sortOrder: input.sort_order ?? 0,
    });
    revalidatePath("/");
    return { ok: true, id };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteSettingAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    await db.delete(cmsSettings).where(eq(cmsSettings.id, input.id));
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------------------------- menus ---------------------------------- */

function mapMenu(r: typeof cmsMenuItems.$inferSelect) {
  return {
    id: r.id,
    location: r.location,
    label: r.label,
    label_bn: r.labelBn,
    href: r.href,
    group_label: r.groupLabel,
    sort_order: r.sortOrder,
    is_external: r.isExternal,
    is_published: r.isPublished,
    is_active: r.isActive,
    parent_id: r.parentId,
    depth: r.depth,
    icon: r.icon,
    description: r.description,
    description_bn: r.descriptionBn,
    accent: r.accent,
    item_style: r.itemStyle,
    badge: r.badge,
    badge_bn: r.badgeBn,
    visible_to: r.visibleTo,
    target: r.target,
  };
}

export async function listMenuItemsAction(input?: {
  location?: string;
  publishedOnly?: boolean;
}): Promise<ActionResult<{ rows: unknown[] }>> {
  try {
    const rows = await db
      .select()
      .from(cmsMenuItems)
      .orderBy(asc(cmsMenuItems.location), asc(cmsMenuItems.sortOrder));
    let filtered = rows;
    if (input?.location) {
      filtered = filtered.filter((r) => r.location === input.location);
    }
    if (input?.publishedOnly) {
      filtered = filtered.filter((r) => r.isPublished !== false);
    }
    return { ok: true, rows: filtered.map(mapMenu) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertMenuItemAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string; row: unknown }>> {
  try {
    await requireEditor();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      location: String(input.location ?? "header"),
      label: String(input.label ?? "Menu"),
      labelBn: (input.label_bn as string) ?? null,
      href: String(input.href ?? "#"),
      groupLabel: (input.group_label as string) ?? null,
      sortOrder: Number(input.sort_order ?? 0),
      isExternal: Boolean(input.is_external),
      isPublished: input.is_published == null ? true : Boolean(input.is_published),
      isActive: input.is_active == null ? true : Boolean(input.is_active),
      parentId: (input.parent_id as string) ?? null,
      depth: Number(input.depth ?? 0),
      icon: (input.icon as string) ?? null,
      description: (input.description as string) ?? null,
      descriptionBn: (input.description_bn as string) ?? null,
      accent: (input.accent as string) ?? null,
      itemStyle: (input.item_style as string) ?? null,
      badge: (input.badge as string) ?? null,
      badgeBn: (input.badge_bn as string) ?? null,
      visibleTo: String(input.visible_to ?? "all"),
      target: String(input.target ?? "_self"),
    };
    const [existing] = input.id
      ? await db
          .select()
          .from(cmsMenuItems)
          .where(eq(cmsMenuItems.id, id))
          .limit(1)
      : [];
    if (existing) {
      await db.update(cmsMenuItems).set(values).where(eq(cmsMenuItems.id, id));
    } else {
      await db.insert(cmsMenuItems).values({ id, ...values });
    }
    const [row] = await db
      .select()
      .from(cmsMenuItems)
      .where(eq(cmsMenuItems.id, id))
      .limit(1);
    revalidatePath("/");
    return { ok: true, id, row: row ? mapMenu(row) : null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteMenuItemAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    await db.delete(cmsMenuItems).where(eq(cmsMenuItems.id, input.id));
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMenuItemFieldsAction(input: {
  id: string;
  patch: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    const p = input.patch;
    const set: Partial<typeof cmsMenuItems.$inferInsert> = {};
    if ("label" in p) set.label = String(p.label);
    if ("label_bn" in p) set.labelBn = (p.label_bn as string) ?? null;
    if ("href" in p) set.href = String(p.href);
    if ("sort_order" in p) set.sortOrder = Number(p.sort_order);
    if ("parent_id" in p) set.parentId = (p.parent_id as string) ?? null;
    if ("depth" in p) set.depth = Number(p.depth ?? 0);
    if ("is_published" in p) set.isPublished = Boolean(p.is_published);
    if ("location" in p) set.location = String(p.location);
    if ("visible_to" in p) set.visibleTo = String(p.visible_to);
    if ("group_label" in p) set.groupLabel = (p.group_label as string) ?? null;
    if ("is_external" in p) set.isExternal = Boolean(p.is_external);
    if ("icon" in p) set.icon = (p.icon as string) ?? null;
    if ("description" in p) set.description = (p.description as string) ?? null;
    if ("description_bn" in p)
      set.descriptionBn = (p.description_bn as string) ?? null;
    if ("accent" in p) set.accent = (p.accent as string) ?? null;
    if ("item_style" in p) set.itemStyle = (p.item_style as string) ?? null;
    if ("badge" in p) set.badge = (p.badge as string) ?? null;
    if ("badge_bn" in p) set.badgeBn = (p.badge_bn as string) ?? null;
    if ("is_active" in p) set.isActive = Boolean(p.is_active);
    if ("target" in p) set.target = String(p.target ?? "_self");
    await db.update(cmsMenuItems).set(set).where(eq(cmsMenuItems.id, input.id));
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ------------------------------- site pages -------------------------------- */

function mapSitePage(r: typeof cmsSitePages.$inferSelect) {
  return {
    id: r.id,
    page: r.page,
    path: r.path,
    name: r.name,
    name_bn: r.nameBn,
    hero_eyebrow: r.heroEyebrow,
    hero_eyebrow_bn: r.heroEyebrowBn,
    hero_title: r.heroTitle,
    hero_title_bn: r.heroTitleBn,
    hero_subtitle: r.heroSubtitle,
    hero_subtitle_bn: r.heroSubtitleBn,
    hero_image: r.heroImage,
    body: r.body,
    body_bn: r.bodyBn,
    seo_title: r.seoTitle,
    seo_title_bn: r.seoTitleBn,
    seo_description: r.seoDescription,
    seo_description_bn: r.seoDescriptionBn,
    og_image: r.ogImage,
    is_custom: r.isCustom,
    is_published: r.isPublished,
    sort_order: r.sortOrder,
    data: r.data,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

export async function listSitePagesAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    const rows = await db
      .select()
      .from(cmsSitePages)
      .orderBy(asc(cmsSitePages.sortOrder), asc(cmsSitePages.name));
    return { ok: true, rows: rows.map(mapSitePage) };
  } catch (err) {
    return fail(err);
  }
}

export async function getSitePageAction(input: {
  page: string;
}): Promise<ActionResult<{ row: unknown | null }>> {
  try {
    const [row] = await db
      .select()
      .from(cmsSitePages)
      .where(eq(cmsSitePages.page, input.page))
      .limit(1);
    return { ok: true, row: row ? mapSitePage(row) : null };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertSitePageAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireEditor();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      page: String(input.page),
      path: String(input.path ?? `/${input.page}`),
      name: String(input.name ?? input.page),
      nameBn: (input.name_bn as string) ?? null,
      heroEyebrow: (input.hero_eyebrow as string) ?? null,
      heroEyebrowBn: (input.hero_eyebrow_bn as string) ?? null,
      heroTitle: (input.hero_title as string) ?? null,
      heroTitleBn: (input.hero_title_bn as string) ?? null,
      heroSubtitle: (input.hero_subtitle as string) ?? null,
      heroSubtitleBn: (input.hero_subtitle_bn as string) ?? null,
      heroImage: (input.hero_image as string) ?? null,
      body: (input.body as string) ?? null,
      bodyBn: (input.body_bn as string) ?? null,
      seoTitle: (input.seo_title as string) ?? null,
      seoTitleBn: (input.seo_title_bn as string) ?? null,
      seoDescription: (input.seo_description as string) ?? null,
      seoDescriptionBn: (input.seo_description_bn as string) ?? null,
      ogImage: (input.og_image as string) ?? null,
      isCustom: Boolean(input.is_custom),
      isPublished:
        input.is_published == null ? true : Boolean(input.is_published),
      sortOrder: Number(input.sort_order ?? 0),
      data: (input.data as Record<string, unknown>) ?? {},
    };
    const [existing] = input.id
      ? await db
          .select()
          .from(cmsSitePages)
          .where(eq(cmsSitePages.id, id))
          .limit(1)
      : await db
          .select()
          .from(cmsSitePages)
          .where(eq(cmsSitePages.page, values.page))
          .limit(1);
    if (existing) {
      await db
        .update(cmsSitePages)
        .set(values)
        .where(eq(cmsSitePages.id, existing.id));
      revalidatePath("/");
      return { ok: true, id: existing.id };
    }
    await db.insert(cmsSitePages).values({ id, ...values });
    revalidatePath("/");
    return { ok: true, id };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteSitePagesAction(input: {
  ids: string[];
}): Promise<ActionResult> {
  try {
    await requireEditor();
    if (!input.ids.length) return { ok: true };
    await db.delete(cmsSitePages).where(inArray(cmsSitePages.id, input.ids));
    revalidatePath("/admin/pages");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function setSitePagesPublishedAction(input: {
  ids: string[];
  is_published: boolean;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    if (!input.ids.length) return { ok: true };
    await db
      .update(cmsSitePages)
      .set({ isPublished: input.is_published })
      .where(inArray(cmsSitePages.id, input.ids));
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ------------------------------- page sections ----------------------------- */

function mapSection(r: typeof cmsPages.$inferSelect) {
  return {
    id: r.id,
    page: r.page,
    section_key: r.sectionKey,
    sort_order: r.sortOrder,
    title: r.title,
    title_bn: r.titleBn,
    subtitle: r.subtitle,
    subtitle_bn: r.subtitleBn,
    body: r.body,
    body_bn: r.bodyBn,
    cta_label: r.ctaLabel,
    cta_href: r.ctaHref,
    image_url: r.imageUrl,
    data: r.data,
    is_published: r.isPublished,
  };
}

export async function listPageSectionsAction(input: {
  page: string;
  publishedOnly?: boolean;
}): Promise<ActionResult<{ rows: unknown[] }>> {
  try {
    const rows = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.page, input.page))
      .orderBy(asc(cmsPages.sortOrder));
    const filtered = input.publishedOnly
      ? rows.filter((r) => r.isPublished)
      : rows;
    return { ok: true, rows: filtered.map(mapSection) };
  } catch (err) {
    return fail(err);
  }
}

export async function upsertPageSectionAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireEditor();
    const id = String(input.id || crypto.randomUUID());
    const values = {
      page: String(input.page),
      sectionKey: String(input.section_key),
      sortOrder: Number(input.sort_order ?? 0),
      title: (input.title as string) ?? null,
      titleBn: (input.title_bn as string) ?? null,
      subtitle: (input.subtitle as string) ?? null,
      subtitleBn: (input.subtitle_bn as string) ?? null,
      body: (input.body as string) ?? null,
      bodyBn: (input.body_bn as string) ?? null,
      ctaLabel: (input.cta_label as string) ?? null,
      ctaHref: (input.cta_href as string) ?? null,
      imageUrl: (input.image_url as string) ?? null,
      data: (input.data as Record<string, unknown>) ?? {},
      isPublished:
        input.is_published == null ? true : Boolean(input.is_published),
    };
    if (input.id) {
      await db.update(cmsPages).set(values).where(eq(cmsPages.id, id));
    } else {
      await db.insert(cmsPages).values({ id, ...values });
    }
    revalidatePath("/");
    return { ok: true, id };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePageSectionAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    await db.delete(cmsPages).where(eq(cmsPages.id, input.id));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------------------- CMS type catalogs ---------------------------- */

function mapCmsRow(type: CmsListType, r: Record<string, unknown>) {
  const base = {
    id: r.id,
    slug: r.slug,
    sort_order: r.sortOrder ?? r.sort_order,
    is_published: r.isPublished ?? r.is_published ?? true,
    created_at: r.createdAt ?? r.created_at,
    updated_at: r.updatedAt ?? r.updated_at,
  };
  if (type === "ventures") {
    return {
      ...base,
      title: r.name,
      name: r.name,
      name_bn: r.nameBn,
      tagline: r.tag,
      tag: r.tag,
      category: r.category,
      status: r.status,
      description: r.description ?? r.summary,
      image_path: r.heroImage,
      is_featured: r.isFeatured,
      data: r.metrics,
    };
  }
  if (type === "insights") {
    return {
      ...base,
      title: r.title,
      title_bn: r.titleBn,
      category: r.category,
      excerpt: r.excerpt,
      content: r.content,
      author: r.author,
      cover_image: r.coverImage,
      image_path: r.coverImage,
    };
  }
  return {
    ...base,
    title: r.name,
    name: r.name,
    name_bn: r.nameBn,
    description: r.description ?? r.summary,
    icon: r.icon,
  };
}

export async function listCmsTypeAction(input: {
  type: CmsListType;
}): Promise<ActionResult<{ rows: unknown[] }>> {
  try {
    const table = CMS_TABLE[input.type];
    const rows = await db.select().from(table).orderBy(asc(sql`sort_order`));
    return {
      ok: true,
      rows: rows.map((r) => mapCmsRow(input.type, r as Record<string, unknown>)),
    };
  } catch (err) {
    return fail(err);
  }
}

export async function getCmsTypeAction(input: {
  type: CmsListType;
  id: string;
}): Promise<ActionResult<{ row: unknown | null }>> {
  try {
    const table = CMS_TABLE[input.type];
    const [row] = await db
      .select()
      .from(table)
      .where(eq(table.id, input.id))
      .limit(1);
    return {
      ok: true,
      row: row ? mapCmsRow(input.type, row as Record<string, unknown>) : null,
    };
  } catch (err) {
    return fail(err);
  }
}

export async function setCmsPublishedAction(input: {
  type: CmsListType;
  id: string;
  is_published: boolean;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    const table = CMS_TABLE[input.type];
    await db
      .update(table)
      .set({ isPublished: input.is_published } as never)
      .where(eq(table.id, input.id));
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCmsTypeAction(input: {
  type: CmsListType;
  id: string;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    const table = CMS_TABLE[input.type];
    await db.delete(table).where(eq(table.id, input.id));
    revalidatePath("/admin/cms");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function countCmsTypesAction(): Promise<
  ActionResult<{ counts: Record<string, number> }>
> {
  try {
    const counts: Record<string, number> = {};
    for (const [key, table] of Object.entries(CMS_TABLE)) {
      const [row] = await db.select({ c: count() }).from(table);
      counts[key] = Number(row?.c ?? 0);
    }
    return { ok: true, counts };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------------------- messages / apps ------------------------------ */

function mapMessage(r: typeof contactMessages.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    subject: r.subject,
    message: r.message,
    created_at: r.createdAt,
    status: r.status ?? (r.isRead ? "read" : "new"),
    status_note: r.statusNote,
    status_updated_at: r.statusUpdatedAt ?? r.createdAt,
    is_read: r.isRead,
  };
}

function mapApplication(r: typeof jobApplications.$inferSelect) {
  return {
    id: r.id,
    job_slug: r.jobSlug,
    job_title: r.jobTitle,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    linkedin: r.linkedin,
    cover_letter: r.coverLetter,
    resume_path: r.resumePath,
    resume_name: r.resumeName,
    resume_size: r.resumeSize,
    resume_type: r.resumeType,
    status: r.status,
    status_note: r.statusNote,
    status_updated_at: r.statusUpdatedAt ?? r.createdAt,
    created_at: r.createdAt,
  };
}

export async function listMessagesAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    await requireEditor();
    const rows = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
    return { ok: true, rows: rows.map(mapMessage) };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMessagesAction(input: {
  ids: string[];
  patch: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    if (!input.ids.length) return { ok: true };
    const set: Partial<typeof contactMessages.$inferInsert> = {
      statusUpdatedAt: new Date(),
    };
    if ("status" in input.patch) {
      set.status = String(input.patch.status);
      set.isRead = input.patch.status !== "new";
    }
    if ("status_note" in input.patch) {
      set.statusNote = (input.patch.status_note as string) ?? null;
    }
    if ("is_read" in input.patch) set.isRead = Boolean(input.patch.is_read);
    await db
      .update(contactMessages)
      .set(set)
      .where(inArray(contactMessages.id, input.ids));
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteMessagesAction(input: {
  ids: string[];
}): Promise<ActionResult> {
  try {
    await requireEditor();
    if (!input.ids.length) return { ok: true };
    await db
      .delete(contactMessages)
      .where(inArray(contactMessages.id, input.ids));
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function listApplicationsAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    await requireEditor();
    const rows = await db
      .select()
      .from(jobApplications)
      .orderBy(desc(jobApplications.createdAt));
    return { ok: true, rows: rows.map(mapApplication) };
  } catch (err) {
    return fail(err);
  }
}

export async function updateApplicationsAction(input: {
  ids: string[];
  patch: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    if (!input.ids.length) return { ok: true };
    const set: Partial<typeof jobApplications.$inferInsert> = {
      statusUpdatedAt: new Date(),
    };
    if ("status" in input.patch) set.status = String(input.patch.status);
    if ("status_note" in input.patch) {
      set.statusNote = (input.patch.status_note as string) ?? null;
    }
    await db
      .update(jobApplications)
      .set(set)
      .where(inArray(jobApplications.id, input.ids));
    revalidatePath("/admin/applications");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteApplicationsAction(input: {
  ids: string[];
}): Promise<ActionResult> {
  try {
    await requireEditor();
    if (!input.ids.length) return { ok: true };
    const rows = await db
      .select()
      .from(jobApplications)
      .where(inArray(jobApplications.id, input.ids));
    for (const r of rows) {
      if (r.resumePath) {
        const cleanName = path.basename(r.resumePath);
        const privatePath = path.join(process.cwd(), "storage", "resumes", cleanName);
        const publicPath = path.join(process.cwd(), "public", "uploads", "resumes", cleanName);
        try {
          await unlink(privatePath);
        } catch {
          /* ignore */
        }
        try {
          await unlink(publicPath);
        } catch {
          /* ignore */
        }
      }
    }
    await db
      .delete(jobApplications)
      .where(inArray(jobApplications.id, input.ids));
    revalidatePath("/admin/applications");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* --------------------------------- audit ----------------------------------- */

export async function listAuditLogsAction(): Promise<
  ActionResult<{ rows: unknown[] }>
> {
  try {
    await requireEditor();
    const rows = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(500);
    return {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        user_id: r.userId,
        action: r.action,
        entity: r.entity,
        entity_id: r.entityId,
        details: r.details,
        ip_address: r.ipAddress,
        created_at: r.createdAt,
      })),
    };
  } catch (err) {
    return fail(err);
  }
}

/* ------------------------------- dashboard --------------------------------- */

export async function getDashboardStatsAction(): Promise<
  ActionResult<{
    appCount: number;
    msgCount: number;
    recentApps: unknown[];
    recentMsgs: unknown[];
    cmsCounts: Record<string, number>;
  }>
> {
  try {
    await requireEditor();
    const [appC] = await db.select({ c: count() }).from(jobApplications);
    const [msgC] = await db.select({ c: count() }).from(contactMessages);
    const recentApps = await db
      .select()
      .from(jobApplications)
      .orderBy(desc(jobApplications.createdAt))
      .limit(5);
    const recentMsgs = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(5);
    const cmsCounts: Record<string, number> = {};
    for (const [key, table] of Object.entries(CMS_TABLE)) {
      const [row] = await db.select({ c: count() }).from(table);
      cmsCounts[key] = Number(row?.c ?? 0);
    }
    return {
      ok: true,
      appCount: Number(appC?.c ?? 0),
      msgCount: Number(msgC?.c ?? 0),
      recentApps: recentApps.map(mapApplication),
      recentMsgs: recentMsgs.map(mapMessage),
      cmsCounts,
    };
  } catch (err) {
    return fail(err);
  }
}

/* --------------------------------- media ----------------------------------- */

export async function insertMediaRecordAction(input: {
  name: string;
  path: string;
  url: string;
  mime_type?: string | null;
  size?: number;
  folder?: string | null;
  alt_text?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireEditor();
    const id = crypto.randomUUID();
    await db.insert(cmsMedia).values({
      id,
      name: input.name.slice(0, 255),
      path: input.path,
      url: input.url,
      mimeType: input.mime_type ?? null,
      size: input.size ?? 0,
      folder: input.folder ?? null,
      altText: input.alt_text ?? null,
    });
    revalidatePath("/admin/media");
    return { ok: true, id };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMediaUrlAction(input: {
  id: string;
  url: string;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    await db
      .update(cmsMedia)
      .set({ url: input.url })
      .where(eq(cmsMedia.id, input.id));
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* --------------------------------- backup ---------------------------------- */

export async function exportBackupTablesAction(): Promise<
  ActionResult<{ tables: Record<string, unknown[]> }>
> {
  try {
    await requireEditor();
    const tables: Record<string, unknown[]> = {
      cms_site_pages: await db.select().from(cmsSitePages),
      cms_pages: await db.select().from(cmsPages),
      cms_ventures: await db.select().from(cmsVentures),
      cms_services: await db.select().from(cmsServices),
      cms_industries: await db.select().from(cmsIndustries),
      cms_insights: await db.select().from(cmsInsights),
      cms_menu_items: await db.select().from(cmsMenuItems),
      cms_media: await db.select().from(cmsMedia),
      cms_settings: await db.select().from(cmsSettings),
      job_applications: await db.select().from(jobApplications),
      contact_messages: await db.select().from(contactMessages),
      audit_logs: await db.select().from(auditLogs),
    };
    return { ok: true, tables };
  } catch (err) {
    return fail(err);
  }
}
