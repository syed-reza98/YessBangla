"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { cmsMedia } from "@/db/schema";
import { requireEditor, AuthError } from "@/lib/authz";

export type MediaActionResult =
  | { ok: true; id?: string; path?: string; url?: string }
  | { ok: false; error: string; status?: number };

export async function uploadMediaAction(formData: FormData): Promise<MediaActionResult> {
  try {
    await requireEditor();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "general")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 60) || "general";
    const alt = String(formData.get("alt") || "").slice(0, 255);

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "File required", status: 400 };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: "File must be under 10MB", status: 400 };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "media", folder);
    await mkdir(uploadsDir, { recursive: true });
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase().slice(0, 120);
    const fileName = `${Date.now()}-${safe}`;
    const absPath = path.join(uploadsDir, fileName);
    await writeFile(absPath, Buffer.from(await file.arrayBuffer()));

    const relPath = `media/${folder}/${fileName}`;
    const url = `/uploads/${relPath}`;
    const id = crypto.randomUUID();
    const displayName = alt ? `${file.name} · ${alt}` : file.name;

    await db.insert(cmsMedia).values({
      id,
      name: displayName.slice(0, 255),
      path: relPath,
      url,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    });

    revalidatePath("/admin/media");
    return { ok: true, id, path: relPath, url };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed",
      status: 500,
    };
  }
}

export async function deleteMediaAction(input: {
  id: string;
  path?: string | null;
}): Promise<MediaActionResult> {
  try {
    await requireEditor();
    if (!input.id) return { ok: false, error: "id required", status: 400 };

    if (input.path) {
      const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
      const abs = path.resolve(uploadsDir, input.path.replace(/^\//, ""));
      if (abs.startsWith(uploadsDir)) {
        try {
          await unlink(abs);
        } catch {
          /* file may already be gone */
        }
      }
    }

    await db.delete(cmsMedia).where(eq(cmsMedia.id, input.id));
    revalidatePath("/admin/media");
    return { ok: true, id: input.id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
      status: 500,
    };
  }
}

export async function listMediaAction(): Promise<
  | {
      ok: true;
      data: {
        id: string;
        file_name: string;
        url: string;
        path: string | null;
        mime_type: string | null;
        size_bytes: number | null;
        alt_text: string | null;
        folder: string | null;
        created_at: string;
      }[];
    }
  | { ok: false; error: string; status?: number }
> {
  try {
    await requireEditor();
    const rows = await db.select().from(cmsMedia);
    return {
      ok: true,
      data: rows.map((r) => {
        const folder = r.path?.includes("/") ? r.path.split("/")[1] ?? null : null;
        return {
          id: r.id,
          file_name: r.name,
          url: r.url,
          path: r.path,
          mime_type: r.mimeType,
          size_bytes: r.size,
          alt_text: null,
          folder,
          created_at: r.createdAt?.toISOString?.() ?? String(r.createdAt),
        };
      }),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "List failed",
      status: 500,
    };
  }
}
