import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Search, Star, Zap } from "lucide-react";
import { useSyncExternalStore } from "react";

import { ToolCard, ToolGrid } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";
import { homeHead } from "@/lib/seo";
import { getEmptyList, getFavorites, getRecents, subscribeStorage } from "@/lib/storage";
import { CATEGORIES, TOOLS, TOOLS_BY_CATEGORY, TOOLS_BY_SLUG } from "@/lib/tools";

export const Route = createFileRoute("/")({
  head: homeHead,
  component: HomePage,
});

function HomePage() {
  const favs = useSyncExternalStore(subscribeStorage, getFavorites, getEmptyList);
  const recents = useSyncExternalStore(subscribeStorage, getRecents, getEmptyList);

  const favTools = favs.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);
  const recentTools = recents.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="border-b border-border py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 font-mono text-xs text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden="true" /> 100% browser-based · no uploads · no
            signup
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Every utility you need.
            <span className="mt-1 block text-muted-foreground">In one toolbox.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {TOOLS.length}+ tools for PDF, images, text, and developers - all running in your
            browser. Nothing is ever uploaded.
          </p>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("th:open-command"))}
            className="mx-auto mt-8 flex w-full max-w-md items-center gap-2 rounded-lg border border-input bg-background px-4 py-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Open command menu to search tools"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search any tool…</span>
            <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>

          <nav
            aria-label="Browse tool categories"
            className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-2"
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={cat.path}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: cat.colorVar }}
                  aria-hidden="true"
                />
                {cat.name.replace(" Tools", "")}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Pinned */}
      {favTools.length > 0 && (
        <section className="py-10 sm:py-12" aria-labelledby="pinned-heading">
          <h2
            id="pinned-heading"
            className="mb-5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Star className="h-3.5 w-3.5" aria-hidden="true" /> Pinned
          </h2>
          <ToolGrid tools={favTools} />
        </section>
      )}

      {/* Recents */}
      {recentTools.length > 0 && (
        <section className="py-10 sm:py-12" aria-labelledby="recent-heading">
          <h2
            id="recent-heading"
            className="mb-5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Recently used
          </h2>
          <ToolGrid tools={recentTools} />
        </section>
      )}

      {/* Categories */}
      {CATEGORIES.map((cat) => {
        const pinned = new Set(favs);
        const tools = TOOLS_BY_CATEGORY[cat.slug].filter((t) => !pinned.has(t.slug));
        if (tools.length === 0) return null;
        const headingId = `cat-${cat.slug}-heading`;
        return (
          <section
            key={cat.slug}
            className="border-t border-border py-10 sm:py-12 first:border-t-0"
            aria-labelledby={headingId}
          >
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2 id={headingId} className="text-2xl font-semibold tracking-tight">
                  {cat.name}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{cat.description}</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to={cat.path}>
                  All {TOOLS_BY_CATEGORY[cat.slug].length}{" "}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tools.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Why */}
      <section className="border-t border-border py-12 sm:py-16" aria-labelledby="why-heading">
        <h2 id="why-heading" className="sr-only">
          Why {SITE_NAME}
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">Truly private</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Every tool runs locally in your browser using WebAssembly and modern browser APIs.
              Your files and text never leave your device.
            </p>
          </div>
          <div>
            <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">Instant results</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No upload waits, no queues, no rate limits. Process files at the speed of your own
              hardware.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
