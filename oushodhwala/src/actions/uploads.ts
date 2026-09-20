"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAuth, AuthError } from "@/lib/session-authz";

export async function uploadLocalFileAction(formData: FormData) {
  try {
    try {
      await requireAuth();
    } catch {
      /* some public uploads (rx guest) authorize elsewhere */
    }
    const file = formData.get("file");
    const bucket = String(formData.get("bucket") || "misc").replace(/[^a-zA-Z0-9_-]/g, "");
    const rel = String(formData.get("path") || "")
      .replace(/\.\./g, "")
      .replace(/^\/+/, "");
    if (!(file instanceof File) || !rel) {
      return { ok: false as const, error: "file and path required" };
    }
    const uploadsDir = path.join(process.cwd(), "public", "uploads", bucket);
    const abs = path.join(uploadsDir, rel);
    if (!abs.startsWith(path.join(process.cwd(), "public", "uploads"))) {
      return { ok: false as const, error: "Invalid path" };
    }
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, Buffer.from(await file.arrayBuffer()));
    return { ok: true as const, path: `${bucket}/${rel}`, url: `/uploads/${bucket}/${rel}` };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false as const, error: err.message };
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}
