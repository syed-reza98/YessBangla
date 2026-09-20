"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contactMessages,
  jobApplications,
  cmsVentures,
  cmsServices,
  cmsInsights,
  cmsIndustries,
  cmsSitePages,
} from "@/db/schema";
import { requireEditor, AuthError } from "@/lib/authz";
import { headers } from "next/headers";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type ActionResult =
  | { ok: true; id?: string; createdAt?: string }
  | { ok: false; error: string; status?: number };

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIpFromHeaders(h: Headers) {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function checkRate(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export async function submitContactAction(input: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<ActionResult> {
  try {
    const h = await headers();
    const ip = clientIpFromHeaders(h);
    if (!checkRate(`contact:${ip}`, 5, 15 * 60 * 1000)) {
      return { ok: false, error: "Too many requests. Try again later.", status: 429 };
    }

    const name = input.name?.trim().slice(0, 150);
    const email = input.email?.trim().toLowerCase().slice(0, 255);
    const phone = (input.phone?.trim() || "n/a").slice(0, 50);
    const message = input.message?.trim();
    if (!name || !email || !message) {
      return { ok: false, error: "Missing required fields", status: 400 };
    }

    const id = crypto.randomUUID();
    await db.insert(contactMessages).values({
      id,
      name,
      email,
      phone,
      subject: input.subject?.trim().slice(0, 255) || null,
      message,
    });

    revalidatePath("/admin/messages");
    return { ok: true, id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit message",
      status: 500,
    };
  }
}

export type ContactFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "email" | "phone" | "subject" | "message", string>
  >;
};

/** FormData entry for React 19 `useActionState` contact forms. */
export async function submitContactFormAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email";
  }
  if (phone && !/^[0-9+\-\s()]*$/.test(phone)) {
    fieldErrors.phone = "Use digits, spaces, +, -, ( and ) only";
  }
  if (message.length < 10) {
    fieldErrors.message = "Please write at least 10 characters";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const result = await submitContactAction({
    name,
    email,
    phone,
    subject: subject || undefined,
    message,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true };
}

export type LeadFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "email" | "company" | "requirements", string>
  >;
};

/** Lead capture FormData Action for `useActionState`. */
export async function submitLeadFormAction(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const requirements = String(formData.get("requirements") ?? "").trim();
  const source = String(formData.get("source") ?? "Final CTA").trim();

  const fieldErrors: LeadFormState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email";
  }
  if (company.length < 2) fieldErrors.company = "Please enter your company";
  if (requirements.length < 10) {
    fieldErrors.requirements =
      "Please describe your requirement (10+ chars)";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const result = await submitContactAction({
    name,
    email,
    phone: "n/a",
    subject: `Lead — ${source || "Final CTA"}`,
    message: `Company: ${company}\n\nRequirements:\n${requirements}`,
  });
  if (!result.ok) {
    return {
      ok: false,
      error:
        "We couldn't submit your enquiry. Please try again or email yessbangla.bd@gmail.com.",
    };
  }
  return { ok: true };
}

export async function submitJobApplicationAction(formData: FormData): Promise<ActionResult> {
  try {
    const h = await headers();
    const ip = clientIpFromHeaders(h);
    if (!checkRate(`jobs:${ip}`, 3, 60 * 60 * 1000)) {
      return { ok: false, error: "Too many applications. Try again later.", status: 429 };
    }

    const jobSlug = String(formData.get("jobSlug") || "").trim();
    const jobTitle = String(formData.get("jobTitle") || "").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const linkedin = String(formData.get("linkedin") || "").trim() || null;
    const location = String(formData.get("location") || "").trim();
    const coverLetterBase = String(formData.get("coverLetter") || "").trim();
    const coverLetter = location
      ? `${coverLetterBase}\n\n— Applicant location: ${location}`
      : coverLetterBase;
    const resume = formData.get("resume");

    if (!jobSlug || !jobTitle || !fullName || !email || !phone || !coverLetterBase) {
      return { ok: false, error: "Missing required fields", status: 400 };
    }
    if (!(resume instanceof File) || resume.size === 0) {
      return { ok: false, error: "Resume file is required", status: 400 };
    }
    if (resume.size > 5 * 1024 * 1024) {
      return { ok: false, error: "Resume must be under 5MB", status: 400 };
    }

    const ext = path.extname(resume.name).toLowerCase();
    const allowedExts = [".pdf", ".doc", ".docx"];
    if (!allowedExts.includes(ext)) {
      return { ok: false, error: "Only PDF, DOC, and DOCX files are allowed", status: 400 };
    }
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
    ];
    if (resume.type && !allowedMimes.includes(resume.type.toLowerCase())) {
      return { ok: false, error: "Invalid file type. Please upload a PDF or Word document.", status: 400 };
    }

    const storageDir = path.join(process.cwd(), "storage", "resumes");
    await mkdir(storageDir, { recursive: true });
    const safeBase = path.basename(resume.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    const fileName = `${Date.now()}-${safeBase}${ext}`;
    const absPath = path.join(storageDir, fileName);
    const buffer = Buffer.from(await resume.arrayBuffer());
    await writeFile(absPath, buffer);
    const resumePath = `/api/admin/resumes/${fileName}`;

    const id = crypto.randomUUID();
    await db.insert(jobApplications).values({
      id,
      jobSlug,
      jobTitle,
      fullName,
      email,
      phone,
      linkedin,
      coverLetter,
      resumePath,
      resumeName: resume.name.slice(0, 255),
      resumeSize: resume.size,
      resumeType: resume.type || "application/octet-stream",
    });

    revalidatePath("/admin/applications");
    return { ok: true, id, createdAt: new Date().toISOString() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to submit application",
      status: 500,
    };
  }
}

export type JobApplyFormState = {
  ok: boolean;
  error?: string;
  id?: string;
  createdAt?: string;
};

/** FormData entry for React 19 `useActionState` job applications. */
export async function submitJobApplicationFormAction(
  _prev: JobApplyFormState,
  formData: FormData
): Promise<JobApplyFormState> {
  const result = await submitJobApplicationAction(formData);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, id: result.id, createdAt: result.createdAt };
}

export type LookupFormState = {
  ok: boolean;
  error?: string;
  data?: {
    id: string;
    job_title: string;
    full_name: string;
    email: string;
    status: string;
    status_note: string | null;
    status_updated_at: string;
    created_at: string;
  } | null;
};

/** FormData entry for application-status lookup. */
export async function lookupApplicationFormAction(
  _prev: LookupFormState,
  formData: FormData
): Promise<LookupFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const ref = String(formData.get("ref") ?? "").trim();
  if (email.length < 3 || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email" };
  }
  if (ref.length < 4) {
    return { ok: false, error: "Reference must be at least 4 characters" };
  }
  const result = await lookupApplicationAction({ email, ref });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, data: result.data };
}

export async function lookupApplicationAction(input: {
  email: string;
  ref?: string;
  applicationId?: string;
}): Promise<
  | {
      ok: true;
      data: {
        id: string;
        job_title: string;
        full_name: string;
        email: string;
        status: string;
        status_note: string | null;
        status_updated_at: string;
        created_at: string;
      } | null;
    }
  | { ok: false; error: string; status?: number }
> {
  try {
    const h = await headers();
    const ip = clientIpFromHeaders(h);
    if (!checkRate(`lookup:${ip}`, 10, 10 * 60 * 1000)) {
      return { ok: false, error: "Too many lookup requests. Try again later.", status: 429 };
    }

    const email = input.email?.trim().toLowerCase();
    if (!email) return { ok: false, error: "Email required", status: 400 };

    if (!input.ref && !input.applicationId) {
      return { ok: false, error: "Application reference number is required", status: 400 };
    }

    const mapStatus = (raw: string | null | undefined): string => {
      const s = (raw || "pending").toLowerCase();
      switch (s) {
        case "pending":
        case "new":
        case "submitted":
          return "Submitted";
        case "reviewed":
        case "under review":
        case "under_review":
          return "Under review";
        case "interview":
          return "Interview";
        case "offer":
          return "Offer";
        case "hired":
          return "Hired";
        case "on hold":
        case "on_hold":
          return "On hold";
        case "rejected":
          return "Rejected";
        default:
          return "Submitted";
      }
    };

    const mapRow = (row: typeof jobApplications.$inferSelect) => ({
      id: row.id,
      job_title: row.jobTitle,
      full_name: row.fullName,
      email: row.email,
      status: mapStatus(row.status),
      status_note: row.statusNote || null,
      status_updated_at: row.statusUpdatedAt?.toISOString?.() ?? row.createdAt?.toISOString?.() ?? String(row.createdAt),
      created_at: row.createdAt?.toISOString?.() ?? String(row.createdAt),
    });

    if (input.applicationId) {
      const [row] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, input.applicationId))
        .limit(1);
      if (!row || row.email.toLowerCase() !== email) {
        return { ok: true, data: null };
      }
      return { ok: true, data: mapRow(row) };
    }

    const ref = (input.ref || "").trim().toLowerCase().replace(/-/g, "");
    if (ref) {
      const rows = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.email, email));
      const match = rows.find((r) =>
        r.id.replace(/-/g, "").toLowerCase().startsWith(ref.slice(0, 8))
      );
      return { ok: true, data: match ? mapRow(match) : null };
    }

    return { ok: true, data: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lookup failed",
      status: 500,
    };
  }
}

type CmsType = "ventures" | "services" | "insights" | "industries" | "pages";

function mapCmsPayload(type: CmsType, data: Record<string, unknown>) {
  const str = (k: string) => {
    const v = data[k];
    if (v == null || v === "") return null;
    return String(v);
  };
  const num = (k: string) => {
    const n = Number(data[k]);
    return Number.isFinite(n) ? n : 0;
  };
  const bool = (k: string) => Boolean(data[k]);

  switch (type) {
    case "ventures":
      return {
        slug: str("slug") || `item-${Date.now()}`,
        name: str("title") || str("name") || "Untitled",
        nameBn: str("name_bn") || str("title_bn"),
        tag: str("tagline") || str("tag"),
        tagBn: str("tag_bn") || str("tagline_bn"),
        category: str("category") || "tech",
        status: str("status") || "active",
        summary: str("summary") || str("description"),
        summaryBn: str("summary_bn") || str("description_bn"),
        description: str("description"),
        descriptionBn: str("description_bn"),
        heroImage: str("hero_image") || str("image_path"),
        logoImage: str("logo_image"),
        linkUrl: str("link_url") || str("website"),
        sortOrder: num("sort_order"),
        metrics: (data.data as Record<string, unknown>) || (data.metrics as Record<string, unknown>) || {},
        isFeatured: bool("is_featured"),
        isPublished: data.is_published == null ? true : bool("is_published"),
      };
    case "services":
      return {
        slug: str("slug") || `item-${Date.now()}`,
        name: str("title") || str("name") || "Untitled",
        nameBn: str("name_bn") || str("title_bn"),
        summary: str("summary") || str("description"),
        summaryBn: str("summary_bn") || str("description_bn"),
        description: str("description"),
        descriptionBn: str("description_bn"),
        icon: str("icon"),
        sortOrder: num("sort_order"),
        isPublished: data.is_published == null ? true : bool("is_published"),
      };
    case "industries":
      return {
        slug: str("slug") || `item-${Date.now()}`,
        name: str("title") || str("name") || "Untitled",
        nameBn: str("name_bn") || str("title_bn"),
        summary: str("summary") || str("description"),
        summaryBn: str("summary_bn") || str("description_bn"),
        description: str("description"),
        descriptionBn: str("description_bn"),
        icon: str("icon"),
        sortOrder: num("sort_order"),
        isPublished: data.is_published == null ? true : bool("is_published"),
      };
    case "insights":
      return {
        slug: str("slug") || `item-${Date.now()}`,
        title: str("title") || "Untitled",
        titleBn: str("title_bn"),
        category: str("category") || "Strategy",
        excerpt: str("excerpt"),
        excerptBn: str("excerpt_bn"),
        content: str("body_md") || str("content"),
        contentBn: str("content_bn") || str("body_md_bn"),
        author: str("author") || "Yess Editorial Team",
        readTime: str("read_time") || "5 min read",
        coverImage: str("cover_image"),
        isPublished: data.is_published == null ? true : bool("is_published"),
        publishedAt: str("published_at") ? new Date(String(data.published_at)) : new Date(),
      };
    case "pages":
      return data;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export async function upsertCmsRecordAction(input: {
  table?: "ventures" | "services" | "insights" | "pages";
  type?: CmsType;
  id?: string;
  data: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    await requireEditor();
    const type: CmsType =
      input.type ||
      (input.table === "pages"
        ? "pages"
        : input.table === "ventures"
          ? "ventures"
          : input.table === "services"
            ? "services"
            : input.table === "insights"
              ? "insights"
              : "ventures");
    const id = input.id || crypto.randomUUID();
    const mapped = mapCmsPayload(type, input.data);

    switch (type) {
      case "ventures": {
        if (input.id) {
          await db.update(cmsVentures).set(mapped as any).where(eq(cmsVentures.id, input.id));
        } else {
          await db.insert(cmsVentures).values({ id, ...(mapped as any) });
        }
        revalidatePath("/admin/cms");
        revalidatePath("/ventures");
        break;
      }
      case "services": {
        if (input.id) {
          await db.update(cmsServices).set(mapped as any).where(eq(cmsServices.id, input.id));
        } else {
          await db.insert(cmsServices).values({ id, ...(mapped as any) });
        }
        revalidatePath("/admin/cms");
        revalidatePath("/services");
        break;
      }
      case "industries": {
        if (input.id) {
          await db.update(cmsIndustries).set(mapped as any).where(eq(cmsIndustries.id, input.id));
        } else {
          await db.insert(cmsIndustries).values({ id, ...(mapped as any) });
        }
        revalidatePath("/admin/cms");
        break;
      }
      case "insights": {
        if (input.id) {
          await db.update(cmsInsights).set(mapped as any).where(eq(cmsInsights.id, input.id));
        } else {
          await db.insert(cmsInsights).values({ id, ...(mapped as any) });
        }
        revalidatePath("/admin/cms");
        revalidatePath("/insights");
        break;
      }
      case "pages": {
        if (input.id) {
          await db
            .update(cmsSitePages)
            .set(input.data as any)
            .where(eq(cmsSitePages.id, input.id));
        } else {
          await db.insert(cmsSitePages).values({ id, ...(input.data as any) });
        }
        revalidatePath("/admin/pages");
        break;
      }
      default: {
        const _exhaustive: never = type;
        return { ok: false, error: `Unknown type: ${_exhaustive}`, status: 400 };
      }
    }

    return { ok: true, id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "CMS save failed",
      status: 500,
    };
  }
}
