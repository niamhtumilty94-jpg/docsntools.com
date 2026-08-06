import { Link } from "@tanstack/react-router";

import { SITE_NAME } from "@/lib/site";
import { CATEGORIES } from "@/lib/tools";

// Build marker - bumped on each publish so we can verify the live site picked
// up the latest deployment without guessing. Visible in the footer.
const BUILD_TAG = "v1.0 · 2026-06-01";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
          <div className="col-span-2 md:col-span-1">
            <div className="font-mono text-sm font-semibold text-foreground">{SITE_NAME}</div>
            <p className="mt-1 leading-relaxed">
              Free in-browser utilities. Your files never leave your device.
            </p>
          </div>
          {CATEGORIES.map((c) => (
            <div key={c.slug}>
              <div className="font-medium text-foreground">{c.name}</div>
              <Link to={c.path} className="mt-1 block hover:text-foreground hover:underline">
                Browse all →
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {SITE_NAME} · All processing client-side ·{" "}
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              privacy-first, minimal tracking
            </Link>
            {" · "}
            <span className="font-mono text-[10px] opacity-60" title="Build tag">
              {BUILD_TAG}
            </span>
            .
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
            <Link to="/cookies" className="hover:text-foreground hover:underline">
              Cookies
            </Link>
            <a href="/sitemap.xml" className="hover:text-foreground hover:underline">
              Sitemap
            </a>
            <a href="/robots.txt" className="hover:text-foreground hover:underline">
              Robots
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
