import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

const LEGAL_PATHS = ["/privacy", "/terms", "/cookies"];

function urlEntry(path: string, priority: string, changefreq = "weekly") {
  const today = new Date().toISOString().slice(0, 10);
  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function buildSitemap(): string {
  const entries: string[] = [];
  entries.push(urlEntry("/", "1.0", "weekly"));
  // Category paths (/pdf, /image, ...) are intentionally omitted: they redirect
  // to their first tool rather than rendering a page, and listing redirects in a
  // sitemap gets them reported as indexing errors. Add them back here if real
  // category landing pages are ever built.
  for (const t of TOOLS) entries.push(urlEntry(t.path, "0.8", "weekly"));
  for (const p of LEGAL_PATHS) entries.push(urlEntry(p, "0.3", "yearly"));

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(buildSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
