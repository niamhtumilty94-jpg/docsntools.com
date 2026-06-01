# Tool Quality Spec — How to make every tool "best-in-class"

Goal: stop being a thin wrapper around a library, and ship tools users come back to.
Three differentiators we lean on across the board:

1. **100% client-side** — privacy badge on every tool ("files never leave your browser").
   This is the single biggest reason power users prefer self-hostable / static tools
   over SmallPDF/iLovePDF/TinyWow.
2. **Power-user UX** — keyboard shortcuts, drag-reorder, batch processing,
   live preview, copy-as-X, persistent settings (localStorage).
3. **Sharable state** — every tool encodes input/options into the URL hash so
   results can be linked (CyberChef-style "recipe" links). Huge SEO + virality lever.

Each tool below has: **Current gap → Library → Must-have features → Stretch features**.

---

## PDF (10 tools)

Reference quality bar: SmallPDF / iLovePDF / PDF24. We win by being faster, no upload,
no signup, and no daily limits.

### 1. Merge PDF
- **Gap**: probably no thumbnail reorder, no per-file page selection.
- **Lib**: `pdf-lib` (assembly) + `pdfjs-dist` (thumbnails).
- **Must-have**: drag-to-reorder file list, per-file page-range picker
  (`1-3, 5, 7-end`), thumbnail preview of first page per file, total page count
  + estimated output size, preserve bookmarks/outline from first doc.
- **Stretch**: drag-reorder *individual pages* across files (full thumbnail grid),
  add blank page divider between files, output filename template.

### 2. Split PDF
- **Lib**: `pdf-lib`.
- **Must-have**: 4 modes — by page range, every N pages, extract specific pages,
  one PDF per page. Live thumbnail grid with multi-select (shift-click, cmd-click).
  Output as ZIP via `JSZip` when >1 file.
- **Stretch**: split by bookmark/outline, split by detected blank page (whitespace
  ratio per rendered page).

### 3. Reorder / Delete pages
- **Lib**: `pdf-lib` + `pdfjs-dist` for thumbs + `@dnd-kit/core` for DnD.
- **Must-have**: visual page grid with drag-reorder, multi-select delete,
  rotate per page from same UI, undo/redo.
- **Stretch**: insert blank page, duplicate page, insert pages from another PDF.

### 4. Rotate PDF
- **Lib**: `pdf-lib`.
- **Must-have**: rotate all / odd / even / specific pages, 90/180/270, live thumbnail.
  Auto-detect page rotation via OCR-free heuristic (skip — needs OCR).
- **Stretch**: per-page rotation in the same grid as Reorder (share component).

### 5. PDF → Images
- **Lib**: `pdfjs-dist` render + `canvas.toBlob`.
- **Must-have**: per-page DPI slider (72/150/300/600), format choice
  (PNG / JPEG / WebP), JPEG quality slider, page range picker, ZIP output for
  multi-page, transparent-bg toggle for PNG.
- **Stretch**: combined long-image (vertical strip) export, color/grayscale/B&W.

### 6. Images → PDF
- **Lib**: `pdf-lib` + `browser-image-compression` (pre-shrink huge inputs).
- **Must-have**: drag-reorder thumbnails, page size (A4/Letter/Auto/Custom),
  orientation, margin, fit (contain/cover/stretch), JPEG quality slider,
  one-image-per-page or grid (2/4/6 per page).
- **Stretch**: OCR-free PDF/A-ish output, EXIF orientation auto-rotate (must-do
  actually), HEIC input via `heic2any`.

### 7. Page numbers
- **Lib**: `pdf-lib` (built-in StandardFonts).
- **Must-have**: position (9 anchor points), font + size + color, format
  (`{n}`, `{n}/{total}`, `Page {n}`), start-from page, skip first N pages,
  margin offset, live preview on first page.
- **Stretch**: roman numerals for front-matter, alternating L/R for double-sided.

### 8. Watermark PDF
- **Lib**: `pdf-lib` + embed custom font via `@pdf-lib/fontkit`.
- **Must-have**: text or image watermark, opacity, rotation, tiled mode,
  position, font picker (load Google font subset client-side), color,
  apply to specific pages, live preview.
- **Stretch**: per-page-size scaling, behind/in front of content toggle.

### 9. Extract text
- **Lib**: `pdfjs-dist` (`page.getTextContent`).
- **Must-have**: layout-preserving mode (use item.transform x/y to reconstruct
  lines), plain mode, per-page output, copy-to-clipboard, download as `.txt` or
  `.md`, page range filter, find-in-result with highlight.
- **Stretch**: detect tables (group items by y-band, sort by x), export as CSV.
  No OCR — explicitly excluded per plan.

### 10. Compress PDF
- **Lib**: `pdfjs-dist` render + `pdf-lib` reassembly. Standard recipe per
  ultimatetools.io and the dev.to article we found.
- **Must-have**: 3 presets (Low/Med/High = 0.85/0.6/0.4 JPEG quality, scale
  1/0.75/0.5), live size estimate per preset, before/after KB display, preserve
  text-layer toggle (when off → rasterize; when on → only re-encode images).
  Show savings %.
- **Stretch**: per-page size analysis ("page 5 is 80% of file"), drop embedded
  fonts/metadata toggle.

---

## Image (6 tools)

Reference: TinyPNG, Squoosh, iLoveIMG.

### 11. Compress image
- **Lib**: `browser-image-compression` (uzip WebP fallback, web worker built-in).
- **Must-have**: batch upload, per-image before/after preview with zoom + slider
  comparator, target-size mode (`maxSizeMB`) AND quality-slider mode,
  format-convert option (`fileType: 'image/webp'`), preserve EXIF toggle,
  abort button, ZIP all results.
- **Stretch**: WASM mozjpeg/oxipng via `@jsquash/*` for better quality at same size
  (Squoosh-grade output). Worth doing.

### 12. Resize image
- **Lib**: native canvas + `pica` for high-quality resampling (Lanczos).
- **Must-have**: width / height / percent / preset (Instagram, Twitter, OG,
  favicon), lock aspect ratio, "fit inside" vs "exact", batch.
- **Stretch**: smart-crop using face/saliency (skip — heavy).

### 13. Crop image
- **Lib**: `react-easy-crop` (touch + zoom + rotate, declarative).
- **Must-have**: free crop, locked aspect ratio chips (1:1, 4:5, 16:9, 3:2, 9:16),
  rotate, flip, output size readout, download as PNG/JPEG/WebP.
- **Stretch**: round/circle crop output, multi-crop (export 4 sizes at once for
  social media kit).

### 14. Convert format
- **Lib**: native canvas + `@jsquash/avif` for AVIF, `heic2any` for HEIC input.
- **Must-have**: PNG ↔ JPEG ↔ WebP ↔ AVIF, HEIC → anything, quality slider,
  background color for PNG → JPEG (no transparency), batch.
- **Stretch**: animated WebP/GIF support.

### 15. Image ↔ Base64
- **Must-have**: paste base64 → preview + download; drop image → base64 with
  `data:` prefix toggle; CSS snippet (`background-image: url(...)`); HTML snippet;
  size warning when output >100KB ("inline base64 hurts page perf").
- **Stretch**: bulk to JSON map.

### 16. Bulk rename + ZIP
- **Lib**: `JSZip`.
- **Must-have**: pattern with tokens (`{i}`, `{name}`, `{ext}`, `{date}`,
  `{i:000}`), find/replace in original names (regex), preview table before download,
  preserve folder structure when input is folder drop.
- **Stretch**: also resize/convert in same pipeline.

---

## Text (6 + 4 converters)

Reference: convertcase.net, JSONLint, regex101, dillinger.io.

### 17. Case converter
- **Must-have**: upper, lower, title, sentence, camel, pascal, snake, kebab,
  CONST_CASE, dot.case, train-case, alternating, inverse, slug. Live re-render
  per-keystroke. Diff highlight vs input.
- **Stretch**: per-line transform, preserve acronyms toggle.

### 18. Word & char counter
- **Must-have**: chars (with/without spaces), words, sentences, paragraphs,
  lines, reading time (200/265/wpm), speaking time (150 wpm), Twitter (280),
  Bluesky (300), SMS (160) gauges. Per-keystroke.
- **Stretch**: keyword density top-10, Flesch reading ease score.

### 19. Find & replace
- **Lib**: native `String.replace` + `RegExp`.
- **Must-have**: regex toggle, flags (g/i/m/s/u), case-sensitive, whole word,
  capture-group references in replacement (`$1`), match counter, highlight all
  matches in input, undo, save replacement preset to localStorage.
- **Stretch**: multiple sequential replace rules (recipe).

### 20. Lorem ipsum
- **Must-have**: paragraphs / sentences / words / list items, count, start with
  classic "Lorem ipsum…" toggle, alternative dictionaries (cupcake, hipster,
  pirate, bacon), HTML wrap (`<p>`), markdown wrap.

### 21. Text diff
- **Lib**: `diff` (jsdiff) + custom side-by-side renderer (avoid heavy
  `react-diff-viewer-continued` — use jsdiff hunks directly with our design tokens).
- **Must-have**: char/word/line modes, side-by-side AND unified, ignore whitespace,
  ignore case, syntax-highlight (Shiki) when input looks like code, sticky line
  numbers, jump-to-next-change shortcut (`n`/`p`).

### 22. Dedupe / sort lines
- **Must-have**: dedupe (preserve order or sort), sort A→Z / Z→A / numeric /
  natural / shuffled / by length, trim, drop empty, drop comments
  (`#`, `//`), case-insensitive options. Show count delta.

### 23. Markdown ↔ HTML
- **Lib**: `marked` + `DOMPurify` (Markdown → HTML), `turndown` (HTML → Markdown).
- **Must-have**: live split-pane preview, GFM tables/strikethrough/task-lists,
  code-fence syntax highlight via Shiki, copy HTML, export `.md`/`.html`.

### 24. CSV ↔ JSON
- **Lib**: `papaparse`.
- **Must-have**: header row toggle, delimiter auto-detect + override, dynamic
  typing, JSON array of objects OR array of arrays, streaming for big files
  (worker mode), preview first 100 rows in table.

### 25. YAML ↔ JSON
- **Lib**: `js-yaml`.
- **Must-have**: bidirectional, validate, indent picker (2/4/tab), sort keys,
  error line marker, copy.

### 26. SVG optimizer
- **Lib**: `svgo/browser`.
- **Must-have**: drop SVG → before/after size + savings %, preview side-by-side
  (rendered + code), per-plugin toggle (the 30+ default plugins), copy optimized
  code, download.

---

## Dev (8 tools)

Reference: JSONLint, jwt.io, regex101, CyberChef. We win by bundling them in one
keyboard-driven app with shared theming and recipe URLs.

### 27. JSON formatter / validator / minifier
- **Must-have**: format (pretty), minify, validate with line/col error,
  collapsible tree view (`react-json-tree`), JSONPath query box (`jsonpath-plus`)
  with highlight, sort keys, fix common errors (trailing commas, single quotes,
  unquoted keys via `json5` / `jsonc-parser`), copy as JS object literal,
  copy as TypeScript interface (use `quicktype-core`), file upload, share via
  URL (gzipped + base64).

### 28. JWT decoder
- **Lib**: `jose`.
- **Must-have**: paste JWT → show header, payload, signature in 3 panes with
  syntax highlight; decode `iat`/`exp`/`nbf` to local time + relative;
  show alg + kid; verify signature against pasted secret (HS256) or public key
  / JWK / JWKS URL (RS256/ES256). Color-coded valid/invalid/expired.
- **Stretch**: encode side (build a JWT).

### 29. Base64 encode/decode
- **Must-have**: text mode AND file mode (any file → base64, base64 → file
  with detected mime), URL-safe variant, line-wrap option, data URI mode,
  auto-detect input direction.

### 30. URL encode/decode
- **Must-have**: full encode, component encode, decode, side-by-side query-string
  parser (table view of params, edit cells, regenerate URL).

### 31. Hash generator
- **Lib**: `crypto.subtle` (native, no dep) for SHA-1/256/384/512;
  `js-md5` for MD5 (subtle doesn't include MD5).
- **Must-have**: text + file input, all algos shown simultaneously, HMAC mode
  with key input, lower/upper hex, base64 output, drag-drop file (stream-hash via
  chunked read so it doesn't OOM on big files).

### 32. UUID generator
- **Must-have**: v1, v3 (namespace + name), v4, v5 (namespace + name), v7
  (timestamp-sortable — high demand), bulk generate (1-1000), uppercase, with/
  without hyphens, copy-all, download as `.txt`/`.csv`.

### 33. Regex tester
- **Lib**: native + CodeMirror 6 (`@codemirror/lang-javascript`) for inline
  highlight; or just a contenteditable with our own match-overlay for lighter
  bundle.
- **Must-have**: pattern + flags + test string, live highlight of matches and
  capture groups (color per group), match table (index, value, groups, named
  groups), substitution preview pane, common-pattern library (email, URL, IPv4,
  hex color, etc.), explain pattern (use `regexp-tree` to AST-render).
- **Stretch**: cheatsheet sidebar, share via URL.

### 34. Color converter + picker
- **Lib**: `colord` + plugins (`a11y`, `mix`, `lab`, `hwb`, `names`).
- **Must-have**: large color picker, simultaneous outputs (HEX, RGB, HSL, HWB,
  OKLCH, OKLab, LAB, CMYK, name), WCAG contrast vs paired color (AA/AAA badges
  for normal/large text), eyedropper API where supported, palette generator
  (tints/shades/complementary/triad), copy-as-Tailwind/CSS-var.

---

## Utilities (4 tools — already shipped, need real upgrades)

### 35. QR code
- **Currently**: basic `qrcode` lib, single-mode.
- **Lib**: swap to `qr-code-styling` for logo + styling. Keep `qrcode` as
  fallback for tiny SVG path output.
- **Must-have**: data presets (URL, plain text, vCard, MeCard, WiFi, Email,
  SMS, Phone, Geo, Calendar event), error-correction L/M/Q/H selector,
  size px, margin, foreground+background color, gradient option, dot style
  (square/dots/rounded/classy/extra-rounded), corner-square+corner-dot styles,
  logo upload + size + clear-area-around-logo, export PNG/JPEG/WebP/SVG,
  live preview that re-renders on every change.

### 36. Password generator
- **Lib**: `crypto.getRandomValues` + `@zxcvbn-ts/core` for strength.
- **Must-have**: length slider (4-128), char-class toggles (upper/lower/digits/
  symbols), exclude ambiguous (`0OIl1|`), exclude similar, must-include rule per
  class (guarantees at least one of each enabled class), passphrase mode (4-8
  EFF wordlist words, separator picker, capitalize, add number), zxcvbn score +
  estimated crack time, bulk generate (1-100), copy-with-clear-after-30s,
  history (last 10, this-session-only).
- **Stretch**: PIN mode, pronounceable mode, custom alphabet.

### 37. Unit converter
- **Lib**: `convert-units` or `js-quantities` (vetted). Skip currency for v1
  (needs API + key).
- **Must-have**: 10+ categories — length, area, volume, mass, temperature,
  speed, time, data (bits/bytes through PB), pressure, energy, power, angle,
  frequency, fuel economy. Bidirectional inputs (typing in either side
  converts). Searchable category + unit combobox. Recent conversions.
- **Stretch**: currency via exchangerate.host (no key), share recipe URL.

### 38. Timestamp converter
- **Lib**: `date-fns` + `date-fns-tz` (lighter than Luxon, tree-shakable).
- **Must-have**: live "now" in epoch s/ms/µs/ns, ISO 8601, RFC 2822, human
  relative ("3 minutes ago"); IANA timezone picker (use `Intl.supportedValuesOf
  ('timeZone')`), DST badge, batch mode (paste many timestamps → table).
  Convert any → all formats simultaneously.
- **Stretch**: cron next-run preview (`cron-parser` + `cronstrue`), Discord
  `<t:...>` snippet copy.

---

## Cross-cutting upgrades (apply to ALL tools)

These are what make the site feel premium vs "yet another tools site":

1. **Drop zone everywhere**: full-page drop overlay on tool routes — drop a
   file anywhere on the page, not just the small box.
2. **Keyboard shortcuts**: `?` opens a per-tool shortcut sheet; `cmd+enter` runs;
   `cmd+s` downloads; `cmd+c` copies primary output.
3. **Recents per tool**: last 5 inputs (text tools only — never persist files).
4. **Share via URL**: `#i=...` (gzipped + base64 of input + options) for text
   tools. CyberChef-style. Massive growth lever.
5. **Privacy badge**: small green "Processed locally" pill always visible on
   every tool.
6. **Progress UI**: long ops show streaming progress (page 3/12), not a spinner.
7. **Sample data button**: every tool has "Try with sample" — removes the empty-
   state friction that kills competitor conversion.
8. **Output actions row**: copy / download / share / open-in-other-tool
   (e.g. JSON formatter → "send to YAML converter"). Tool-to-tool linking.
9. **Settings persist** per tool in localStorage (last format, last quality,
   etc.) so power users don't re-pick every time.
10. **No-config worker offload**: any op >50ms moves to a Web Worker via Comlink
    so the UI never freezes (especially Hash large files, PDF render, image
    compress, SVGO).

---

## Recommended new dependencies

```
pdfjs-dist                  # PDF render → thumbs + extract + compress
@dnd-kit/core @dnd-kit/sortable  # drag-reorder grids
@pdf-lib/fontkit            # custom font watermarks
jszip                       # ZIP outputs
pica                        # high-quality canvas resize
react-easy-crop             # cropper
@jsquash/jpeg @jsquash/png @jsquash/webp @jsquash/avif  # WASM codecs (optional, big quality bump)
heic2any                    # HEIC input
marked dompurify turndown   # MD/HTML
papaparse js-yaml           # CSV / YAML
svgo                        # SVG optimize (browser bundle)
diff                        # text diff
react-json-tree jsonpath-plus json5 quicktype-core  # JSON tools
jose                        # JWT
js-md5                      # MD5 (subtle has no MD5)
regexp-tree                 # regex AST explainer
colord                      # color
qr-code-styling             # styled QR
@zxcvbn-ts/core @zxcvbn-ts/language-en @zxcvbn-ts/language-common  # password strength
convert-units               # units (or js-quantities)
date-fns date-fns-tz        # timestamps
cronstrue cron-parser       # cron stretch
comlink                     # easy worker wrapper
fflate                      # gzip for share-URL hashes (lighter than pako)
```

Don't add all at once — install per phase as we build.

---

## Build order (revised, ROI-first)

| Phase | What | Why |
|------|------|-----|
| 0 | Cross-cutting infra (drop overlay, share-URL hash, sample-data button, settings persistence, worker wrapper) | Unlocks the "premium feel" for every later tool. |
| 1 | Dev tools (8) | Highest repeat-use, smallest deps, biggest dev/SEO audience for an obvious "one of us" signal. |
| 2 | Utilities upgrade (4) | Already shipped — fastest visible quality jump. |
| 3 | Text tools (6) + 4 converters (MD/HTML, CSV/JSON, YAML/JSON, SVG) | Cheap, pure-JS, easy SEO wins. |
| 4 | PDF tools (10) | Biggest competitor pressure, most user trust at stake. |
| 5 | Image tools (6) | Last because Squoosh is genuinely best-in-class and we differentiate on batch + privacy badge, not on encoder quality. |

Each phase ships behind no flags — old tool replaced by new in one commit per
tool, plus an updated FAQ block per page (SEO content pass).
