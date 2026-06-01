# DocnTools

Free, privacy-first browser tools for PDFs, images, text, and developers. Everything runs client-side—files never leave your device.

**Site:** [docsntool.com](https://docsntool.com)

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default port from Vite).

## Build & preview

```bash
npm run build
npm run preview
```

## Deploy (Cloudflare Workers)

This app uses TanStack Start with the Cloudflare adapter.

```bash
npm run build
npx wrangler deploy
```

Set `VITE_SITE_URL` to your production domain before building so canonical URLs, sitemap, and Open Graph tags are correct.

## Environment

Copy `.env.example` to `.env` and adjust:

| Variable | Description |
|----------|-------------|
| `VITE_SITE_URL` | Canonical origin (e.g. `https://docsntool.com`) |
| `VITE_UMAMI_WEBSITE_ID` | Optional Umami site ID |
| `VITE_UMAMI_SRC` | Optional Umami script URL |

## Tools

40+ tools across PDF, image, text, dev, and utilities—see `src/lib/tools.ts` and `src/tools/registry.ts`.
