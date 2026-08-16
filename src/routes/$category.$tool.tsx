import { createFileRoute, notFound, redirect, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { ToolPageLayout } from "@/components/tool-page";
import { toolHead } from "@/lib/seo";
import { CATEGORY_BY_SLUG, TOOLS, TOOLS_BY_SLUG, type ToolCategory } from "@/lib/tools";
import { TOOL_COMPONENTS } from "@/tools/registry";

const VALID: ToolCategory[] = ["pdf", "image", "text", "dev", "utilities"];

function findTool(category: string, slug: string) {
  return TOOLS.find((t) => t.category === category && t.path === `/${category}/${slug}`);
}

/**
 * A tool's `slug` and the last segment of its `path` are not always the same -
 * "merge-pdf" lives at /pdf/merge, "crop-image" at /image/crop. 15 of the 39
 * tools differ this way, so the slug-shaped URL (the obvious guess, and what
 * any slug-derived link or older sitemap would have produced) used to 404.
 * Send those to the real page instead of losing the visitor and the link.
 */
function findToolBySlug(category: string, slug: string) {
  return TOOLS.find((t) => t.category === category && t.slug === slug);
}

export const Route = createFileRoute("/$category/$tool")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.category as ToolCategory)) throw notFound();
    const tool = findTool(params.category, params.tool);
    if (tool) return;

    const bySlug = findToolBySlug(params.category, params.tool);
    if (bySlug) throw redirect({ to: bySlug.path, statusCode: 301 });

    throw notFound();
  },
  head: ({ params }) => {
    const tool = findTool(params.category, params.tool);
    if (!tool) return { meta: [{ title: "Not found" }] };
    return toolHead(tool);
  },
  component: ToolRoute,
  notFoundComponent: ToolNotFound,
});

function ToolNotFound() {
  const { category } = Route.useParams();
  const cat = CATEGORY_BY_SLUG[category as ToolCategory];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Tool not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The tool you’re looking for doesn’t exist (yet).
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {cat && (
          <Link
            to={cat.path}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Browse {cat.name}
          </Link>
        )}
        <Link
          to="/"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

const Placeholder = lazy(() => import("@/tools/placeholder"));

function ToolRoute() {
  const { category, tool } = Route.useParams();
  const meta = findTool(category, tool);
  if (!meta) return null;
  void TOOLS_BY_SLUG;
  void CATEGORY_BY_SLUG;
  const Comp = TOOL_COMPONENTS[meta.slug] ?? Placeholder;
  return (
    <ToolPageLayout tool={meta}>
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <Comp />
      </Suspense>
    </ToolPageLayout>
  );
}
