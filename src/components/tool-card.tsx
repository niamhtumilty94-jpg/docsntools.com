import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import {
  getEmptyList,
  getFavorites,
  isFavorite,
  subscribeStorage,
  toggleFavorite,
} from "@/lib/storage";
import type { Tool } from "@/lib/tools";

const categoryClass: Record<Tool["category"], string> = {
  pdf: "text-[color:var(--cat-pdf)]",
  image: "text-[color:var(--cat-image)]",
  text: "text-[color:var(--cat-text)]",
  dev: "text-[color:var(--cat-dev)]",
  utilities: "text-[color:var(--cat-utilities)]",
};

const categoryBg: Record<Tool["category"], string> = {
  pdf: "bg-[color:var(--cat-pdf)]/10 border-[color:var(--cat-pdf)]/20",
  image: "bg-[color:var(--cat-image)]/10 border-[color:var(--cat-image)]/20",
  text: "bg-[color:var(--cat-text)]/10 border-[color:var(--cat-text)]/20",
  dev: "bg-[color:var(--cat-dev)]/10 border-[color:var(--cat-dev)]/20",
  utilities: "bg-[color:var(--cat-utilities)]/10 border-[color:var(--cat-utilities)]/20",
};

export function ToolCard({ tool }: { tool: Tool }) {
  const favs = useSyncExternalStore(subscribeStorage, getFavorites, getEmptyList);
  const fav = favs.includes(tool.slug);

  return (
    <Link
      to={tool.path}
      aria-label={`${tool.name} - ${tool.description}`}
      className={cn(
        "group relative flex h-full flex-col rounded-lg border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-foreground/25 focus-visible:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md border",
            categoryBg[tool.category],
          )}
        >
          <tool.icon className={cn("h-5 w-5", categoryClass[tool.category])} aria-hidden="true" />
        </div>
        <button
          type="button"
          aria-label={fav ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
          aria-pressed={fav}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(tool.slug);
          }}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-opacity hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            fav && "opacity-100 text-yellow-500 hover:text-yellow-500 sm:opacity-100",
          )}
        >
          <Star className={cn("h-4 w-4", fav && "fill-current")} aria-hidden="true" />
        </button>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-snug text-foreground">{tool.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {tool.description}
      </p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
            categoryBg[tool.category],
            categoryClass[tool.category],
          )}
        >
          {tool.category}
        </span>
        {tool.comingSoon && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            soon
          </span>
        )}
      </div>
    </Link>
  );
}

export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((t) => (
        <ToolCard key={t.slug} tool={t} />
      ))}
    </div>
  );
}

// Used to avoid unused warning for getFavorites in some bundlers
void isFavorite;
