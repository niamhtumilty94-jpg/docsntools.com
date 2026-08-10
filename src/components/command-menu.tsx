import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { searchItems } from "@/lib/search";
import { CATEGORIES, TOOLS, TOOLS_BY_SLUG } from "@/lib/tools";
import {
  getEmptyList,
  getFavorites,
  getRecents,
  pushRecent,
  subscribeStorage,
} from "@/lib/storage";

function useStoredList(getter: () => string[]) {
  return useSyncExternalStore(subscribeStorage, getter, getEmptyList);
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const recents = useStoredList(getRecents);
  const favorites = useStoredList(getFavorites);

  // Ranking is ours (see @/lib/search), not cmdk's - so results are computed
  // here and the palette runs with shouldFilter={false}.
  const searching = query.trim().length > 0;
  const toolResults = useMemo(() => searchItems(TOOLS, query), [query]);
  const categoryResults = useMemo(() => searchItems(CATEGORIES, query), [query]);
  const noResults = searching && toolResults.length === 0 && categoryResults.length === 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("th:open-command", handler);
    return () => window.removeEventListener("th:open-command", handler);
  }, []);

  // Start each visit to the palette from a clean slate.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (path: string, slug?: string) => {
    if (slug) pushRecent(slug);
    setOpen(false);
    navigate({ to: path });
  };

  const recentTools = recents.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);
  const favTools = favorites.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} commandProps={{ shouldFilter: false }}>
      <CommandInput placeholder="Search tools…" value={query} onValueChange={setQuery} />
      <CommandList>
        {noResults && (
          <div className="space-y-1 py-6 text-center">
            <p className="text-sm">No tools found.</p>
            <p className="text-xs text-muted-foreground">
              Try keywords like <code className="font-mono">compress</code>,{" "}
              <code className="font-mono">qr</code>, or <code className="font-mono">regex</code>.
            </p>
          </div>
        )}

        {searching && toolResults.length > 0 && (
          <CommandGroup heading="Tools">
            {toolResults.map((t) => (
              <CommandItem
                key={`hit-${t.slug}`}
                value={`hit-${t.slug}`}
                onSelect={() => go(t.path, t.slug)}
              >
                <t.icon className="opacity-70" />
                <span>{t.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searching && categoryResults.length > 0 && (
          <CommandGroup heading="Categories">
            {categoryResults.map((c) => (
              <CommandItem
                key={`hitcat-${c.slug}`}
                value={`hitcat-${c.slug}`}
                onSelect={() => go(c.path)}
              >
                <Search className="opacity-70" />
                <span>{c.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.slug}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!searching && favTools.length > 0 && (
          <CommandGroup heading="Pinned">
            {favTools.map((t) => (
              <CommandItem
                key={`fav-${t.slug}`}
                value={`pinned-${t.slug}`}
                onSelect={() => go(t.path, t.slug)}
              >
                <t.icon className="opacity-70" />
                <span>{t.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!searching && recentTools.length > 0 && (
          <CommandGroup heading="Recent">
            {recentTools.map((t) => (
              <CommandItem
                key={`rec-${t.slug}`}
                value={`recent-${t.slug}`}
                onSelect={() => go(t.path, t.slug)}
              >
                <t.icon className="opacity-70" />
                <span>{t.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!searching && (favTools.length > 0 || recentTools.length > 0) && <CommandSeparator />}

        {!searching && (
          <>
            <CommandGroup heading="Categories">
              {CATEGORIES.map((c) => (
                <CommandItem key={c.slug} value={`category-${c.slug}`} onSelect={() => go(c.path)}>
                  <Search className="opacity-70" />
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.slug}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="All tools">
              {TOOLS.map((t) => (
                <CommandItem
                  key={t.slug}
                  value={`tool-${t.slug}`}
                  onSelect={() => go(t.path, t.slug)}
                >
                  <t.icon className="opacity-70" />
                  <span>{t.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
