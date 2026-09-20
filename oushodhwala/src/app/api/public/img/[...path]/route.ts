import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

type Ctx = { params: Promise<{ path: string[] }> };

function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

/** Serves images from public/uploads (replaces Supabase storage proxy). */
export async function GET(_req: Request, ctx: Ctx) {
  const segments = (await ctx.params).path || [];
  if (!segments.length || segments.some((s) => s.includes(".."))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const abs = path.join(process.cwd(), "public", "uploads", ...segments);
  try {
    await access(abs);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const info = await stat(abs);
  const stream = createReadStream(abs);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": contentTypeFor(segments[segments.length - 1]!),
      "Content-Length": String(info.size),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
