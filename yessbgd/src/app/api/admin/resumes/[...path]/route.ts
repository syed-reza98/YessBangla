import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { auth } from "@/auth";

type Ctx = { params: Promise<{ path: string[] }> };

function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "admin" && role !== "moderator")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segments = (await ctx.params).path || [];
  if (!segments.length) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }
  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const fileName = segments[segments.length - 1]!;
  const storageDir = path.resolve(process.cwd(), "storage", "resumes");
  const legacyDir = path.resolve(process.cwd(), "public", "uploads", "resumes");

  let abs = path.resolve(storageDir, ...segments);
  if (!abs.startsWith(storageDir)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  let found = false;
  try {
    await access(abs);
    found = true;
  } catch {
    const legacyAbs = path.resolve(legacyDir, ...segments);
    if (legacyAbs.startsWith(legacyDir)) {
      try {
        await access(legacyAbs);
        abs = legacyAbs;
        found = true;
      } catch {
        /* not found in legacy either */
      }
    }
  }

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const info = await stat(abs);
  const stream = createReadStream(abs);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentTypeFor(fileName),
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
