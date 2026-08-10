import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { ToolCard } from "@/components/tool-card";
import { categoryHead } from "@/lib/seo";
import { CATEGORY_BY_SLUG, TOOLS_BY_CATEGORY, type ToolCategory } from "@/lib/tools";

const VALID: ToolCategory[] = ["pdf", "image", "text", "dev", "utilities"];

export const Route = createFileRoute("/$category/")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.category as ToolCategory)) throw notFound();
  },
  // Safe to set a head here: this is the index route for /$category, not the
  // layout, so nothing it returns reaches /$category/$tool.
  head: ({ params }) => {
    const cat = CATEGORY_BY_SLUG[params.category as ToolCategory];
    if (!cat) return { meta: [{ title: "Not found" }] };
    return categoryHead(cat);
  },
  component: CategoryLanding,
});

function CategoryLanding() {
  const { category } = Route.useParams();
  const cat = CATEGORY_BY_SLUG[category as ToolCategory];
  const tools = TOOLS_BY_CATEGORY[category as ToolCategory] ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-foreground hover:underline">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-foreground" aria-current="page">
          {cat.name}
        </span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{cat.name}</h1>
        <p className="mt-3 text-base text-muted-foreground">{cat.description}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{cat.intro}</p>
      </header>

      <main id="main-content" className="mt-10">
        <h2 className="text-lg font-semibold">
          All {tools.length} tool{tools.length === 1 ? "" : "s"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </main>

      <section className="mt-14 max-w-3xl" aria-labelledby="cat-faq-heading">
        <h2 id="cat-faq-heading" className="text-lg font-semibold">
          Common questions
        </h2>
        <dl className="mt-4 space-y-5">
          {cat.faq.map((f) => (
            <div key={f.q}>
              <dt className="text-sm font-semibold">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
