import { Link } from "@tanstack/react-router";
import { ChevronRight, Star } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { PrivacyBadge } from "@/components/tool/privacy-badge";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getEmptyList,
  getFavorites,
  pushRecent,
  subscribeStorage,
  toggleFavorite,
} from "@/lib/storage";
import { CATEGORY_BY_SLUG, TOOLS_BY_CATEGORY, getRelatedTools, type Tool } from "@/lib/tools";

const categoryAccent: Record<Tool["category"], string> = {
  pdf: "text-[color:var(--cat-pdf)]",
  image: "text-[color:var(--cat-image)]",
  text: "text-[color:var(--cat-text)]",
  dev: "text-[color:var(--cat-dev)]",
  utilities: "text-[color:var(--cat-utilities)]",
};

const categoryActiveBg: Record<Tool["category"], string> = {
  pdf: "bg-[color:var(--cat-pdf)]/10 border-[color:var(--cat-pdf)]/30",
  image: "bg-[color:var(--cat-image)]/10 border-[color:var(--cat-image)]/30",
  text: "bg-[color:var(--cat-text)]/10 border-[color:var(--cat-text)]/30",
  dev: "bg-[color:var(--cat-dev)]/10 border-[color:var(--cat-dev)]/30",
  utilities: "bg-[color:var(--cat-utilities)]/10 border-[color:var(--cat-utilities)]/30",
};

interface CategoryShellProps {
  tool: Tool;
  children: React.ReactNode;
}

export function CategoryShell({ tool, children }: CategoryShellProps) {
  const cat = CATEGORY_BY_SLUG[tool.category];
  const tools = TOOLS_BY_CATEGORY[tool.category];
  const related = getRelatedTools(tool);

  useEffect(() => {
    pushRecent(tool.slug);
  }, [tool.slug]);

  const favs = useSyncExternalStore(subscribeStorage, getFavorites, getEmptyList);
  const fav = favs.includes(tool.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="hover:text-foreground hover:underline">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link to={cat.path} className="hover:text-foreground hover:underline">
          {cat.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-foreground" aria-current="page">
          {tool.name}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left: tool selector */}
        <aside className="lg:sticky lg:top-20 lg:self-start" aria-label={`${cat.name} list`}>
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className={cn("text-sm font-semibold", categoryAccent[tool.category])}>
                {cat.name}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tools.length} tool{tools.length === 1 ? "" : "s"}
              </p>
            </div>
            <nav className="p-2" aria-label={`${cat.name} navigation`}>
              <ul className="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto lg:max-h-[calc(100vh-12rem)]">
                {tools.map((t) => {
                  const active = t.slug === tool.slug;
                  return (
                    <li key={t.slug}>
                      <Link
                        to={t.path}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-sm transition-colors",
                          active
                            ? cn("font-medium text-foreground", categoryActiveBg[t.category])
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <t.icon
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            active ? categoryAccent[t.category] : "text-muted-foreground",
                          )}
                          aria-hidden="true"
                        />
                        <span className="flex-1 leading-tight">
                          {t.name}
                          {t.comingSoon && (
                            <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                              soon
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Right: active tool */}
        <div className="min-w-0 space-y-5">
          {/* Header */}
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <tool.icon
                  className={cn("h-6 w-6", categoryAccent[tool.category])}
                  aria-hidden="true"
                />
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {tool.longDescription}
              </p>
              <PrivacyBadge className="mt-3" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleFavorite(tool.slug)}
              className="shrink-0"
              aria-pressed={fav}
              aria-label={fav ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
            >
              <Star
                className={cn("h-4 w-4", fav && "fill-yellow-500 text-yellow-500")}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{fav ? "Pinned" : "Pin"}</span>
            </Button>
          </header>

          {/* About this tool - SEO-friendly intro paragraph */}
          {tool.about && (
            <section
              aria-labelledby="about-heading"
              className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground"
            >
              <h2 id="about-heading" className="sr-only">
                About {tool.name}
              </h2>
              {tool.about}
            </section>
          )}

          {/* Tool UI */}
          <main id="main-content" className="rounded-lg border border-border bg-card p-5 sm:p-6">
            {children}
          </main>

          {/* How to + FAQ + Related */}
          <div className="grid gap-5 md:grid-cols-2">
            <section
              className="rounded-lg border border-border bg-card p-5"
              aria-labelledby="howto-heading"
            >
              <h2
                id="howto-heading"
                className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                How to use
              </h2>
              <ol className="space-y-2 text-sm leading-relaxed">
                {tool.howTo.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className="rounded-lg border border-border bg-card p-5"
              aria-labelledby="faq-heading"
            >
              <h2
                id="faq-heading"
                className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                FAQ
              </h2>
              <div className="space-y-4">
                {tool.faq.map((f, i) => (
                  <div key={i}>
                    <div className="text-sm font-semibold">{f.q}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.a}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {related.length > 0 && (
            <section
              className="rounded-lg border border-border bg-card p-5"
              aria-labelledby="related-heading"
            >
              <h2
                id="related-heading"
                className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Related tools
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={r.path}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                    >
                      <r.icon
                        className={cn("h-4 w-4", categoryAccent[r.category])}
                        aria-hidden="true"
                      />
                      <span>{r.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
