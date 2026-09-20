"use server";

import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { mediaAssets } from "@/db/schema";
import { requireStaff, AuthError } from "@/lib/authz";

export type MediaActionResult =
  | {
      ok: true;
      asset?: {
        id: string;
        path: string;
        url: string;
        name: string;
        folder: string;
        mime_type: string | null;
        size_bytes: number;
        created_at: string;
        tags: string[];
        alt_text: string | null;
        variants: null;
        deleted_at: null;
      };
      assets?: unknown[];
    }
  | { ok: false; error: string; status?: number };

export async function uploadMediaAction(formData: FormData): Promise<MediaActionResult> {
  try {
    const session = await requireStaff();
    const file = formData.get("file");
    const folder =
      String(formData.get("folder") || "general")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 60) || "general";

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

    await db.insert(mediaAssets).values({
      id,
      name: file.name.slice(0, 255),
      path: relPath,
      url,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdBy: session.user!.id!,
    });

    revalidatePath("/media");
    return {
      ok: true,
      asset: {
        id,
        path: relPath,
        url,
        name: file.name,
        folder,
        mime_type: file.type || null,
        size_bytes: file.size,
        created_at: new Date().toISOString(),
        tags: [],
        alt_text: null,
        variants: null,
        deleted_at: null,
      },
    };
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

export async function listMediaAssetsAction(): Promise<MediaActionResult> {
  try {
    await requireStaff();
    const rows = await db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(500);
    const assets = rows.map((r) => {
      const folder = r.path.includes("/") ? r.path.split("/")[1] || "general" : "general";
      return {
        id: r.id,
        path: r.path,
        url: r.url,
        name: r.name,
        folder,
        mime_type: r.mimeType,
        size_bytes: r.size ?? 0,
        created_at: r.createdAt?.toISOString?.() ?? String(r.createdAt),
        tags: [] as string[],
        alt_text: null as string | null,
        variants: null,
        deleted_at: null as string | null,
      };
    });
    return { ok: true, assets };
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

export async function deleteMediaAssetAction(input: {
  id: string;
  path?: string | null;
}): Promise<MediaActionResult> {
  try {
    await requireStaff();
    if (!input.id) return { ok: false, error: "id required", status: 400 };
    if (input.path) {
      const abs = path.join(process.cwd(), "public", "uploads", input.path);
      try {
        await unlink(abs);
      } catch {
        /* may already be gone */
      }
    }
    await db.delete(mediaAssets).where(eq(mediaAssets.id, input.id));
    revalidatePath("/media");
    return { ok: true };
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
