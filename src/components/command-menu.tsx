import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  const navigate = useNavigate();
  const recents = useStoredList(getRecents);
  const favorites = useStoredList(getFavorites);

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

  const go = (path: string, slug?: string) => {
    if (slug) pushRecent(slug);
    setOpen(false);
    navigate({ to: path });
  };

  const recentTools = recents.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);
  const favTools = favorites.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tools…" />
      <CommandList>
        <CommandEmpty>
          <div className="space-y-1 py-2 text-center">
            <p className="text-sm">No tools found.</p>
            <p className="text-xs text-muted-foreground">
              Try keywords like <code className="font-mono">compress</code>,{" "}
              <code className="font-mono">qr</code>, or <code className="font-mono">regex</code>.
            </p>
          </div>
        </CommandEmpty>

        {favTools.length > 0 && (
          <CommandGroup heading="Pinned">
            {favTools.map((t) => (
              <CommandItem
                key={`fav-${t.slug}`}
                value={`pinned ${t.name} ${t.keywords.join(" ")}`}
                onSelect={() => go(t.path, t.slug)}
              >
                <t.icon className="opacity-70" />
                <span>{t.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentTools.length > 0 && (
          <CommandGroup heading="Recent">
            {recentTools.map((t) => (
              <CommandItem
                key={`rec-${t.slug}`}
                value={`recent ${t.name} ${t.keywords.join(" ")}`}
                onSelect={() => go(t.path, t.slug)}
              >
                <t.icon className="opacity-70" />
                <span>{t.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(favTools.length > 0 || recentTools.length > 0) && <CommandSeparator />}

        <CommandGroup heading="Categories">
          {CATEGORIES.map((c) => (
            <CommandItem
              key={c.slug}
              value={`category ${c.name} ${c.description}`}
              onSelect={() => go(c.path)}
            >
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
              value={`${t.name} ${t.description} ${t.category} ${t.keywords.join(" ")}`}
              onSelect={() => go(t.path, t.slug)}
            >
              <t.icon className="opacity-70" />
              <span>{t.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
