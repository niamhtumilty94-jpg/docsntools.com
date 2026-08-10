import { createFileRoute, notFound, redirect, Link } from "@tanstack/react-router";

import { TOOLS_BY_CATEGORY, type ToolCategory } from "@/lib/tools";

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
  // Deliberately no head() here.
  //
  // This is a layout route, so anything it returns is merged into every child
  // tool page. `links` are not de-duplicated by `rel`, so a canonical here
  // emitted a SECOND <link rel="canonical"> on all 39 tool pages, pointing at
  // the category URL and ordered before the tool's own canonical. Google
  // honoured it and reported the tool pages as "Alternative page with proper
  // canonical tag" - i.e. dropped them from the index in favour of /pdf, which
  // itself only redirects.
  //
  // The bare category path (/pdf) always redirects in beforeLoad above, so this
  // route never renders standalone and has no head of its own to describe.
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Category not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        Back home
      </Link>
    </div>
  ),
});
