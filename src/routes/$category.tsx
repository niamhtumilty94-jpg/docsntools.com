import { createFileRoute, notFound, redirect, Link } from "@tanstack/react-router";

import { categoryHead } from "@/lib/seo";
import {
  CATEGORY_BY_SLUG,
  TOOLS_BY_CATEGORY,
  type ToolCategory,
} from "@/lib/tools";

const VALID: ToolCategory[] = ["pdf", "image", "text", "dev", "utilities"];

export const Route = createFileRoute("/$category")({
  beforeLoad: ({ params, location }) => {
    if (!VALID.includes(params.category as ToolCategory)) throw notFound();
    // Only redirect when on the bare category index (e.g. /pdf), not on a child like /pdf/merge.
    const expected = `/${params.category}`;
    const current = location.pathname.replace(/\/+$/, "");
    if (current === expected) {
      const tools = TOOLS_BY_CATEGORY[params.category as ToolCategory] ?? [];
      const first = tools.find((t) => !t.comingSoon) ?? tools[0];
      if (first) {
        throw redirect({ to: first.path });
      }
    }
  },
  head: ({ params }) => {
    const cat = CATEGORY_BY_SLUG[params.category as ToolCategory];
    if (!cat) return { meta: [{ title: "Not found" }] };
    return categoryHead(cat.name, cat.description);
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Category not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        Back home
      </Link>
    </div>
  ),
});
