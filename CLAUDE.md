# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (Vite)
npm run build        # production build (Cloudflare Workers target)
npm run preview      # preview production build locally
npm run lint         # ESLint
npm run format       # Prettier
npm run deploy       # build + wrangler deploy
```

There are no automated tests. Lint and type-check are the primary correctness gates.

## Environment

Copy `.env.example` to `.env`. Key variables:

| Variable                | Purpose                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL`         | Canonical origin - must be set before building for production (affects sitemap, canonical URLs, OG tags) |
| `VITE_UMAMI_WEBSITE_ID` | Optional analytics                                                                                       |
| `VITE_UMAMI_SRC`        | Optional analytics script URL                                                                            |

## Architecture

**Stack:** React 19, TanStack Router (file-based routing), TanStack Start, Vite, Tailwind CSS v4, deployed to Cloudflare Workers. The `vite.config.ts` defers entirely to `@lovable.dev/vite-tanstack-config` - do not add duplicate plugins (tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare are already included).

**Core principle:** Every tool runs 100% client-side. Files never leave the user's browser.

### Adding a new tool

1. **Register metadata** in `src/lib/tools.ts` - add a `Tool` object to the `TOOLS` array with `slug`, `category`, `name`, `description`, `longDescription`, `about`, `keywords`, `icon`, `path`, `faq`, `howTo`, and optional `related` slugs. This drives routing, SEO, and the site index.

2. **Create the component** at `src/tools/<category>/<slug>.tsx` as a default export React component.

3. **Register the lazy import** in `src/tools/registry.ts` - add `"<slug>": lazy(() => import("./<category>/<slug>"))`. Unregistered slugs fall back to `src/tools/placeholder.tsx`.

### Routing

TanStack Router with file-based routes in `src/routes/`. The tool route is `$category.$tool.tsx` - it looks up the tool from `TOOLS` by category+slug, then renders the matching component from `registry.ts` wrapped in `ToolPageLayout` / `CategoryShell`.

### PDF tools

PDF rendering uses `pdfjs-dist` (configured in `src/tools/pdf/_pdfjs.ts`). PDF manipulation uses `pdf-lib`. Heavy work should use Web Workers via the Comlink wrapper in `src/lib/worker-tool.ts`:

```ts
const api = wrapWorker<MyApi>(
  () => new Worker(new URL("./my.worker.ts", import.meta.url), { type: "module" }),
);
```

### Shared tool hooks

- `useToolSettings(toolId, defaults)` - persists tool settings to `localStorage` under `th:settings:<toolId>`, SSR-safe
- `useShareableState(paramKey)` - encodes/decodes tool state in the URL hash (`#s=...`) using deflate + base64url, for shareable links

### SEO

All SEO metadata is generated in `src/lib/seo.ts` from the `Tool` definition. Each tool page gets `<title>`, meta description, canonical, Open Graph, and JSON-LD schemas (SoftwareApplication, WebApplication, FAQPage, HowTo, BreadcrumbList). The `faq` and `howTo` arrays on each tool are used directly for structured data rich results.

### UI components

Shadcn/UI components live in `src/components/ui/`. Tool-specific shared components (drop zones, output panels, before/after preview) are in `src/components/tool/`.
