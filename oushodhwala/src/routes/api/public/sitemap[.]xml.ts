import { createFileRoute } from "@tanstack/react-router";
import { getSitemapCatalogAction } from "@/actions/catalog";

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

/** SEO sitemap — static pages + active categories + top products */
export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const lines: string[] = STATIC_PATHS.map((p) => urlEntry(p, p === "/" ? "1.0" : "0.7", "daily"));

        try {
          const [cats, prods] = await Promise.all([
            getSitemapCatalogAction().then((r) => ({ data: r.categories })),
            getSitemapCatalogAction().then((r) => ({ data: r.products })),
          ]);

          for (const c of (cats.data ?? [])) lines.push(urlEntry(`/category/${c.slug}`, "0.8"));
          for (const p of (prods.data ?? [])) lines.push(urlEntry(`/product/${encodeURIComponent(p.id)}`, "0.6"));
        } catch {
          // MySQL query failed — return static-only sitemap
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
