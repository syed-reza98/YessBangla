import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const SITE = "https://oushodhwala.com";

const STATIC_PATHS = [
  "/",
  "/products",
  "/categories",
  "/offers",
  "/lab-test",
  "/home-diagnostics",
  "/home-services",
  "/doctor-consultation",
  "/prescription",
  "/about",
  "/help",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, priority: string, changefreq = "weekly") {
  return `  <url><loc>${esc(SITE + loc)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export async function GET() {
  const lines: string[] = STATIC_PATHS.map((p) =>
    urlEntry(p, p === "/" ? "1.0" : "0.7", "daily")
  );

  try {
    const [cats, prods] = await Promise.all([
      db
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.isActive, true))
        .limit(200),
      db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(desc(products.createdAt))
        .limit(5000),
    ]);
    for (const c of cats) {
      if (c.slug) lines.push(urlEntry(`/category/${c.slug}`, "0.8"));
    }
    for (const p of prods) {
      lines.push(urlEntry(`/product/${encodeURIComponent(p.id)}`, "0.6"));
    }
  } catch {
    /* static-only fallback */
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
