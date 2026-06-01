import { useState } from "react";
import { ChevronDown, CheckCircle2, AlertCircle, Search } from "lucide-react";

import { buildToolSeo } from "@/lib/seo";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

interface SeoPreviewProps {
  tool: Tool;
}

export function SeoPreview({ tool }: SeoPreviewProps) {
  const [open, setOpen] = useState(false);
  const seo = buildToolSeo(tool);
  const allValid = seo.jsonLd.every((b) => b.valid);
  const titleLen = seo.title.length;
  const descLen = seo.description.length;
  const titleOk = titleLen <= 60;
  const descOk = descLen >= 120 && descLen <= 160;

  return (
    <section
      aria-labelledby="seo-preview-heading"
      className="rounded-lg border border-border bg-card"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2
            id="seo-preview-heading"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            SEO preview
          </h2>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              allValid
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            )}
          >
            {allValid ? (
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
            )}
            JSON-LD {allValid ? "valid" : "issues"}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-5 py-4">
          {/* Google SERP-style preview */}
          <div className="rounded-md border border-border bg-background p-4">
            <div className="text-xs text-muted-foreground">{seo.url}</div>
            <div className="mt-1 truncate text-lg text-blue-700 dark:text-blue-400">
              {seo.title}
            </div>
            <div className="mt-1 text-sm leading-snug text-muted-foreground">
              {seo.description}
            </div>
          </div>

          {/* Field details */}
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Title tag
              </dt>
              <dd className="mt-1 break-words">{seo.title}</dd>
              <dd
                className={cn(
                  "mt-0.5 text-xs",
                  titleOk ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400",
                )}
              >
                {titleLen} chars {titleOk ? "(ok)" : "(over 60)"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Meta description
              </dt>
              <dd className="mt-1 break-words">{seo.description}</dd>
              <dd
                className={cn(
                  "mt-0.5 text-xs",
                  descOk ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400",
                )}
              >
                {descLen} chars {descOk ? "(ok)" : "(target 120–160)"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Canonical URL
              </dt>
              <dd className="mt-1 break-all font-mono text-xs">{seo.canonical}</dd>
            </div>
          </dl>

          {/* JSON-LD validation */}
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              JSON-LD blocks ({seo.jsonLd.length})
            </h3>
            <ul className="mt-2 space-y-1.5">
              {seo.jsonLd.map((b) => (
                <li
                  key={b.type}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {b.valid ? (
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertCircle
                        className="h-4 w-4 text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                      />
                    )}
                    <span className="font-mono text-xs">{b.type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {b.valid ? "valid" : (b.error ?? "invalid")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
