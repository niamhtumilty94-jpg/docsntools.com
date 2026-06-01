import { Link } from "@tanstack/react-router";
import { Search, Wrench } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { SITE_NAME } from "@/lib/site";
import { CATEGORIES } from "@/lib/tools";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold" aria-label={`${SITE_NAME} home`}>
          <Wrench className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm tracking-tight">
            {SITE_NAME}
            <span className="ml-1 hidden font-mono text-[10px] font-normal text-muted-foreground sm:inline">
              v1
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={c.path}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {c.name.replace(" Tools", "")}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("th:open-command"))}
            className="group inline-flex h-9 w-full max-w-[280px] items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Search tools (Cmd+K)"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">Search tools…</span>
            <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>

      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
        aria-label="Categories (mobile)"
      >
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            to={c.path}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "bg-accent text-foreground" }}
          >
            {c.name.replace(" Tools", "")}
          </Link>
        ))}
      </nav>
    </header>
  );
}
