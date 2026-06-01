import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useMounted } from "@/hooks/use-mounted";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Pill-shaped sliding switch. The thumb glides between two slots and
 * shows the icon for the *currently active* mode (sun in light, moon in
 * dark) so the control reads as "this is what's on" rather than
 * "press for the other one".
 *
 * Gated on useMounted() - SSR renders a stable placeholder, then we hydrate
 * to the real toggle after the inline themeInitScript has applied the
 * persisted theme to <html>. Prevents a hydration mismatch.
 */
export function ThemeToggle() {
  const mounted = useMounted();
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    if (!mounted) return;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("th:theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-7 w-14 shrink-0 rounded-full border border-border bg-muted/60"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border border-border bg-muted/60 p-0.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Track icons - muted, indicate the destination of each slot */}
      <Sun
        className="pointer-events-none absolute left-1.5 h-3.5 w-3.5 text-muted-foreground/70"
        aria-hidden="true"
      />
      <Moon
        className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-muted-foreground/70"
        aria-hidden="true"
      />
      {/* Thumb */}
      <span
        className={`pointer-events-none relative z-10 inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border transition-transform duration-300 ease-out ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
