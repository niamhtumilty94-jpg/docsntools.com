import type { LucideIcon } from "lucide-react";
import {
  FileText,
  FileImage,
  Files,
  Scissors,
  RotateCw,
  Layers,
  ImagePlus,
  Hash,
  Type as TypeIcon,
  Search,
  Replace,
  Quote,
  GitCompare,
  ListMinus,
  Image as ImageIcon,
  Crop,
  Maximize2,
  FileCode,
  KeyRound,
  Binary,
  Gauge,
  Link2,
  Fingerprint,
  IdCard,
  Regex,
  Palette,
  QrCode,
  Lock,
  Ruler,
  Clock,
  Code2,
  FileJson,
  Braces,
  FileType,
  Stamp,
  ScanText,
  FileMinus2,
  Bot,
} from "lucide-react";

export type ToolCategory = "pdf" | "image" | "text" | "dev" | "utilities";

export interface Tool {
  slug: string;
  category: ToolCategory;
  name: string;
  /**
   * Name used in <title>, og:title and schema, when the UI name does not match
   * how people search. The converters read nicely as "YAML ↔ JSON" in the
   * sidebar, but nobody types "↔" - they search "yaml to json", so the arrow
   * silently removes the most valuable word in the query from the title.
   */
  seoName?: string;
  description: string;
  longDescription: string;
  about: string;
  keywords: string[];
  icon: LucideIcon;
  path: string;
  comingSoon?: boolean;
  faq: { q: string; a: string }[];
  howTo: string[];
  related?: string[]; // slugs
}

export interface CategoryMeta {
  slug: ToolCategory;
  name: string;
  description: string;
  path: string;
  colorVar: string;
  /** Opening copy for the category landing page. */
  intro: string;
  /** Questions answered on the landing page; also drives its FAQPage schema. */
  faq: { q: string; a: string }[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "pdf",
    name: "PDF Tools",
    description: "Merge, split, rotate, compress, watermark - all in your browser.",
    path: "/pdf",
    colorVar: "var(--cat-pdf)",
    intro:
      "Most online PDF editors work by uploading your document to a server, processing it there, and emailing you a download link. That is a poor trade for a contract, a payslip, or a medical form. These tools do the same jobs - merging, splitting, rotating, compressing, watermarking and extracting - entirely inside your browser tab, using pdf-lib and PDF.js. Nothing is transmitted, so there is no upload wait, no queue, and no file sitting on someone else's disk.",
    faq: [
      {
        q: "Are my PDFs uploaded anywhere?",
        a: "No. Every PDF tool here runs in your browser. The file is read from disk into memory, processed locally, and written back out as a download. It never crosses the network.",
      },
      {
        q: "Is there a file size or page limit?",
        a: "There is no imposed limit. The practical ceiling is your device's memory - large scanned documents of several hundred megabytes are usually fine on a desktop, less so on an older phone.",
      },
      {
        q: "Will editing a PDF reduce its quality?",
        a: "Merging, splitting, reordering and rotating copy pages losslessly, so text stays selectable and images keep their resolution. Only the compression tool deliberately re-encodes images, and it lets you choose how far to go.",
      },
    ],
  },
  {
    slug: "image",
    name: "Image Tools",
    description: "Compress, resize, crop, convert formats - instant, private.",
    path: "/image",
    colorVar: "var(--cat-image)",
    intro:
      "Resizing a screenshot or shrinking a photo for an email attachment should not require an account or a round trip to a stranger's server. These tools use the browser's own Canvas and File APIs to compress, resize, crop and convert between JPEG, PNG and WebP, plus batch-zip a folder of images at once. Because the work happens on your hardware, large batches process at local speed rather than upload speed.",
    faq: [
      {
        q: "Which image formats are supported?",
        a: "JPEG, PNG and WebP for both input and output, plus GIF and BMP as inputs. Conversion runs through the browser's Canvas encoder, so support tracks whatever your browser can decode.",
      },
      {
        q: "Does compressing an image lose quality?",
        a: "JPEG and WebP are lossy, so some quality is traded for size - you control the quality level and can preview the result before downloading. PNG output is lossless.",
      },
      {
        q: "Is image metadata like EXIF preserved?",
        a: "No. Re-encoding through Canvas drops EXIF, including GPS coordinates and camera details. That is usually desirable when sharing photos publicly, but keep an original if you need the metadata.",
      },
    ],
  },
  {
    slug: "text",
    name: "Text Tools",
    description: "Case, count, diff, format, convert - fast text utilities.",
    path: "/text",
    colorVar: "var(--cat-text)",
    intro:
      "Everyday text chores - changing case, counting words, comparing two drafts, removing duplicate lines, running a find-and-replace - are quick jobs that rarely justify opening an editor. These run instantly as you type, with no character limits. Since the text never leaves the page, they are safe to use on draft copy, internal notes, or anything else you would not paste into a random website.",
    faq: [
      {
        q: "Is there a limit on how much text I can paste?",
        a: "No fixed limit. Processing happens in your browser, so very large inputs are bounded by memory rather than by a server-side cap.",
      },
      {
        q: "Is my text sent anywhere?",
        a: "No. Nothing you type or paste is transmitted, logged, or stored on a server.",
      },
      {
        q: "Does the word counter match Word or Google Docs?",
        a: "Word counts match closely for ordinary prose. Small differences can appear around hyphenated compounds and numbers, since each application draws word boundaries slightly differently.",
      },
    ],
  },
  {
    slug: "dev",
    name: "Dev Tools",
    description: "JSON, JWT, base64, hash, regex - for developers.",
    path: "/dev",
    colorVar: "var(--cat-dev)",
    intro:
      "Formatting JSON, decoding a JWT, generating a hash or testing a regular expression are things developers do dozens of times a day, often against data that should not be pasted into an unknown website. Access tokens, API responses and customer records routinely end up in these boxes. Every tool here runs locally, using the Web Crypto API for hashing, so debugging data stays on your machine.",
    faq: [
      {
        q: "Is it safe to paste a real JWT or API response here?",
        a: "Safer than a server-side decoder, yes. Decoding happens entirely in your browser and nothing is sent anywhere. That said, treat any token you have pasted into any tool as worth rotating if it is highly sensitive.",
      },
      {
        q: "Does the JWT decoder verify signatures?",
        a: "It decodes and displays the header, payload and claims, and flags expiry. Verifying a signature requires the signing key, which stays on your server - so treat the output as inspection, not authentication.",
      },
      {
        q: "Which hash algorithms are available?",
        a: "SHA-1, SHA-256, SHA-384 and SHA-512 via the browser's Web Crypto API, plus MD5. MD5 and SHA-1 are included for checksums and legacy compatibility, not for security.",
      },
    ],
  },
  {
    slug: "utilities",
    name: "Utilities",
    description: "QR codes, passwords, units, timestamps - everyday helpers.",
    path: "/utilities",
    colorVar: "var(--cat-utilities)",
    intro:
      "A handful of small tools that are annoying to find and easy to distrust elsewhere: generating a QR code, creating a strong password, converting units, and translating Unix timestamps into readable dates. The password generator in particular uses the browser's cryptographic random source and never transmits what it produces - which is the whole point of a password generator.",
    faq: [
      {
        q: "Are generated passwords actually random and private?",
        a: "They are drawn from crypto.getRandomValues(), the browser's cryptographically secure random source, and are generated on your device. Nothing is sent over the network or stored.",
      },
      {
        q: "Do the QR codes expire or get tracked?",
        a: "No. The QR code is an image encoding your data directly - there is no redirect service in between, so nothing expires and no scans are counted.",
      },
      {
        q: "Which timezones does the timestamp converter handle?",
        a: "Any timezone your browser knows about via the IANA database, with common ones listed for quick access, alongside UTC and your local time.",
      },
    ],
  },
];

const standardFaq = (name: string, extra: { q: string; a: string }[] = []) => [
  ...extra,
  {
    q: `Is ${name} free?`,
    a: `Yes. Every tool on DocnTools is 100% free with no signup, no watermarks, and no upload limits.`,
  },
  {
    q: "Are my files uploaded to a server?",
    a: "No. All processing happens entirely in your browser. Your files never leave your device.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes - every tool is responsive and works in modern mobile browsers (Chrome, Safari, Firefox).",
  },
];

export const TOOLS: Tool[] = [
  // ---------------- PDF ----------------
  {
    slug: "merge-pdf",
    category: "pdf",
    name: "Merge PDF",
    description: "Combine multiple PDFs into a single file.",
    longDescription:
      "Merge any number of PDF files into one document, in any order. 100% browser-based - your files are never uploaded.",
    about:
      "Merge PDF combines two or more PDF documents into a single file in the order you choose. It's useful for assembling scanned receipts, stitching together report chapters, or bundling signed contracts before sending. Because everything runs locally, even confidential documents stay on your machine.",
    keywords: ["combine", "join", "concatenate", "pdf", "merge"],
    icon: Files,
    path: "/pdf/merge",
    howTo: [
      "Drop PDF files into the upload area (or click to choose).",
      "Drag to reorder them as you want them combined.",
      "Click ‘Merge’ and download the resulting PDF.",
    ],
    faq: standardFaq("Merge PDF", [
      {
        q: "How many PDFs can I merge at once?",
        a: "There's no hard limit - merging happens in your browser, so the practical cap depends on your device's memory. Most users can comfortably merge 50+ documents totalling several hundred megabytes.",
      },
      {
        q: "Will merging PDFs reduce quality?",
        a: "No. Pages are copied byte-for-byte from the source PDFs, so text stays selectable and images keep their original resolution. Nothing is re-rendered or recompressed.",
      },
      {
        q: "Are bookmarks and form fields preserved?",
        a: "Page content, fonts, and form fields carry over. Some advanced features (top-level bookmarks, per-document JavaScript) may be flattened during the merge.",
      },
    ]),
    related: ["split-pdf", "reorder-pdf", "rotate-pdf", "images-to-pdf"],
  },
  {
    slug: "split-pdf",
    category: "pdf",
    name: "Split PDF",
    description: "Extract pages or split a PDF into ranges.",
    longDescription:
      "Split a PDF into separate files by page range or one file per page. All processing in your browser.",
    about:
      "Split PDF lets you break a single document into smaller files, either one PDF per page or grouped by ranges you define. It's the fastest way to pull a single chapter out of a book, separate invoices in a batch scan, or extract just the pages someone asked for.",
    keywords: ["split", "extract", "pages", "pdf", "separate"],
    icon: Scissors,
    path: "/pdf/split",
    howTo: [
      "Upload a PDF.",
      "Choose ‘Each page’ or specify ranges (e.g. 1-3, 5, 7-9).",
      "Download the resulting PDFs as a ZIP.",
    ],
    faq: standardFaq("Split PDF", [
      {
        q: "What range syntax is supported?",
        a: "Use comma-separated values and dashes for ranges, e.g. `1-3, 5, 7-9`. You can also pick ‘Each page’ to produce one PDF per page automatically.",
      },
      {
        q: "Are the resulting PDFs identical to the originals?",
        a: "Yes - pages are copied losslessly. Fonts, images, and embedded data carry over without re-rendering.",
      },
      {
        q: "How are multiple output files delivered?",
        a: "When the split produces more than one file, they're packaged into a single ZIP for easy download.",
      },
    ]),
    related: ["merge-pdf", "reorder-pdf", "pdf-to-images", "extract-text"],
  },
  {
    slug: "reorder-pdf",
    category: "pdf",
    name: "Reorder & Delete Pages",
    description: "Rearrange or remove PDF pages visually.",
    longDescription:
      "Drag pages to reorder, or remove unwanted pages from your PDF. Browser-only - no uploads.",
    about:
      "Reorder & Delete Pages gives you a visual thumbnail grid where you can drag pages into a new order or remove ones you don't need. It's ideal for tidying up scans, reorganising slide handouts, or removing blank separator pages before sharing.",
    keywords: ["reorder", "delete", "remove", "pages", "pdf", "rearrange"],
    icon: Layers,
    path: "/pdf/reorder",
    howTo: [
      "Upload a PDF to see all its pages.",
      "Drag thumbnails to reorder, click ✕ to delete pages.",
      "Save the new PDF.",
    ],
    faq: standardFaq("Reorder PDF", [
      {
        q: "Can I undo a deletion?",
        a: "Yes - deletions and reorderings only apply when you click ‘Save’. Until then you can refresh or re-add the original file to start over.",
      },
      {
        q: "Will rearranging affect text or images on the pages?",
        a: "No. Each page is moved as a whole unit, so its text, vectors, and embedded fonts stay intact.",
      },
    ]),
    related: ["merge-pdf", "split-pdf", "rotate-pdf"],
  },
  {
    slug: "rotate-pdf",
    category: "pdf",
    name: "Rotate PDF",
    description: "Rotate any or all pages 90°, 180°, 270°.",
    longDescription:
      "Rotate PDF pages individually or all at once. Permanent rotation saved into the file.",
    about:
      "Rotate PDF fixes pages that were scanned upside-down or sideways and saves the new orientation directly into the file. Apply a rotation to a single page, a range, or every page at once - useful for cleaning up mobile-camera scans or landscape spreadsheets exported as portrait.",
    keywords: ["rotate", "turn", "orientation", "pdf"],
    icon: RotateCw,
    path: "/pdf/rotate",
    howTo: [
      "Upload a PDF.",
      "Click rotate buttons on individual pages, or rotate all at once.",
      "Download the rotated PDF.",
    ],
    faq: standardFaq("Rotate PDF", [
      {
        q: "Is the rotation permanent?",
        a: "Yes. Unlike a viewer-only rotation, the new orientation is written into the file itself, so it looks correct in any PDF reader you open it with later.",
      },
      {
        q: "Can I rotate only specific pages?",
        a: "Yes - each page thumbnail has its own rotate buttons. There's also an ‘all pages’ control if you want to spin the whole document at once.",
      },
    ]),
    related: ["reorder-pdf", "merge-pdf", "split-pdf"],
  },
  {
    slug: "pdf-to-images",
    category: "pdf",
    name: "PDF to Images",
    description: "Convert each PDF page to PNG or JPG.",
    longDescription:
      "Render every page of a PDF as a high-quality PNG or JPG image and download as a ZIP.",
    about:
      "PDF to Images renders each page of a PDF as a high-resolution PNG or JPG. It's perfect when you need to embed pages in a slide deck, post a document preview to social media, or feed pages into a tool that only accepts image files.",
    keywords: ["pdf to image", "pdf to png", "pdf to jpg", "convert", "render"],
    icon: FileImage,
    path: "/pdf/to-images",
    howTo: [
      "Upload a PDF.",
      "Choose format (PNG/JPG) and resolution.",
      "Download images as a ZIP.",
    ],
    faq: standardFaq("PDF to Images", [
      {
        q: "What resolution can I export at?",
        a: "Pick from common DPI presets - higher values produce sharper images at the cost of file size. 150 DPI is fine for screen previews; 300 DPI is better for print.",
      },
      {
        q: "Should I choose PNG or JPG?",
        a: "PNG is lossless and best for documents with crisp text or diagrams. JPG produces much smaller files and is preferable for photo-heavy pages.",
      },
    ]),
    related: ["images-to-pdf", "split-pdf", "extract-text"],
  },
  {
    slug: "images-to-pdf",
    category: "pdf",
    name: "Images to PDF",
    description: "Combine JPG/PNG/WebP images into one PDF.",
    longDescription:
      "Drop images and create a single PDF, one image per page. Reorderable and fully client-side.",
    about:
      "Images to PDF turns a batch of JPG, PNG, or WebP images into a single multi-page PDF. Use it to build photo portfolios, package scanned receipts for expense reports, or send a handful of screenshots as one tidy attachment.",
    keywords: ["jpg to pdf", "png to pdf", "image to pdf", "combine images"],
    icon: ImagePlus,
    path: "/pdf/from-images",
    howTo: ["Drop your images.", "Reorder them with drag-and-drop.", "Click ‘Create PDF’."],
    faq: standardFaq("Images to PDF", [
      {
        q: "Which image formats are supported?",
        a: "JPG, PNG, and WebP are supported. Each image becomes one page; the page size is fitted to the image dimensions.",
      },
      {
        q: "Can I control page order?",
        a: "Yes - drag thumbnails to reorder before generating the PDF. The final PDF follows the order you set.",
      },
    ]),
    related: ["pdf-to-images", "merge-pdf", "convert-image"],
  },
  {
    slug: "page-numbers",
    category: "pdf",
    name: "Add Page Numbers",
    description: "Stamp page numbers onto a PDF.",
    longDescription:
      "Add page numbers in any position with custom format and starting page. All in your browser.",
    about:
      "Add Page Numbers stamps consistent footer or header numbering onto every page of a PDF. It's helpful for printing reports, preparing legal exhibits, or adding pagination to a scanned document that didn't have any.",
    keywords: ["page numbers", "stamp", "footer", "pdf"],
    icon: Hash,
    path: "/pdf/page-numbers",
    howTo: [
      "Upload a PDF.",
      "Choose position, font size, and starting number.",
      "Download the numbered PDF.",
    ],
    faq: standardFaq("Add Page Numbers", [
      {
        q: "Can I start numbering from a page other than 1?",
        a: "Yes - set both the starting page (which page in the PDF gets the first number) and the starting number itself, useful when prepending a cover sheet.",
      },
      {
        q: "Where on the page can the number be placed?",
        a: "You can choose corners or centre positions in the header or footer, and adjust font size to match your document's margins.",
      },
    ]),
    related: ["watermark-pdf", "merge-pdf", "rotate-pdf"],
  },
  {
    slug: "watermark-pdf",
    category: "pdf",
    name: "Watermark PDF",
    description: "Add a text watermark to every page.",
    longDescription:
      "Stamp custom text watermark on every page with adjustable opacity, rotation, and color.",
    about:
      "Watermark PDF stamps custom text - like “DRAFT”, “CONFIDENTIAL”, or your company name - onto every page of a document. Adjust opacity, rotation, and colour to make it discreet or prominent. Great for sharing previews of unfinished work.",
    keywords: ["watermark", "stamp", "text", "pdf", "draft"],
    icon: Stamp,
    path: "/pdf/watermark",
    howTo: ["Upload a PDF.", "Type your watermark text and adjust style.", "Download."],
    faq: standardFaq("Watermark PDF", [
      {
        q: "Can I rotate the watermark diagonally?",
        a: "Yes - set any rotation angle. A common ‘draft’ look uses 45° across the centre with reduced opacity.",
      },
      {
        q: "Will the watermark appear on every page?",
        a: "Yes, the watermark is applied to every page of the PDF with the same style settings.",
      },
    ]),
    related: ["page-numbers", "merge-pdf", "rotate-pdf"],
  },
  {
    slug: "extract-text",
    category: "pdf",
    name: "Extract Text from PDF",
    description: "Pull all text content out of a PDF.",
    longDescription:
      "Extract selectable text from any PDF (no OCR for scanned docs). Copy or download as .txt.",
    about:
      "Extract Text from PDF pulls all selectable text out of a document so you can copy it, paste it elsewhere, or save it as a plain `.txt` file. It's perfect for grabbing quotes from a research paper or feeding a contract into another tool.",
    keywords: ["extract", "text", "copy", "pdf to text", "convert"],
    icon: ScanText,
    path: "/pdf/extract-text",
    howTo: ["Upload a PDF.", "Wait for processing.", "Copy or download the extracted text."],
    faq: standardFaq("Extract Text", [
      {
        q: "Does it work on scanned PDFs?",
        a: "Only if the scan already has an OCR text layer. This tool reads existing text - it doesn't run OCR on raster images.",
      },
      {
        q: "Is page structure preserved?",
        a: "Text is extracted page by page in reading order. Complex multi-column layouts may flow differently than they appear visually.",
      },
    ]),
    related: ["pdf-to-images", "split-pdf", "word-counter"],
  },
  {
    slug: "compress-pdf",
    category: "pdf",
    name: "Compress PDF",
    description: "Reduce PDF file size in your browser.",
    longDescription:
      "Re-saves the PDF with object-stream compression to shrink file size. Best for PDFs with redundant data.",
    about:
      "Compress PDF re-saves your file with tighter object compression to shrink its size for email or web upload. Savings depend on the source - PDFs with redundant or uncompressed objects can shrink dramatically, while already-optimised files may see only modest gains.",
    keywords: ["compress", "reduce", "shrink", "size", "pdf", "optimize"],
    icon: FileMinus2,
    path: "/pdf/compress",
    howTo: ["Upload a PDF.", "Click ‘Compress’.", "Download the smaller PDF."],
    faq: standardFaq("Compress PDF", [
      {
        q: "How much smaller will my PDF be?",
        a: "It varies. Documents with uncompressed object streams can shrink 30–60%; already-optimised exports from modern tools may save much less.",
      },
      {
        q: "Will it reduce image quality?",
        a: "No - this tool focuses on lossless object compression. Embedded images keep their original resolution.",
      },
    ]),
    related: ["merge-pdf", "split-pdf", "compress-image"],
  },

  // ---------------- IMAGE ----------------
  {
    slug: "compress-image",
    category: "image",
    name: "Compress Image",
    description: "Shrink JPG, PNG, WebP image file size.",
    longDescription: "Compress images to a target size or quality without leaving your browser.",
    about:
      "Compress Image shrinks JPG, PNG, and WebP files by re-encoding them at a quality level you control, with a side-by-side preview so you can see exactly what you're trading. Use it before uploading photos to a website, attaching screenshots to email, or shipping graphics in an app bundle.",
    keywords: ["compress", "image", "jpg", "png", "webp", "shrink"],
    icon: ImageIcon,
    path: "/image/compress",
    howTo: ["Drop your image.", "Adjust target quality / size.", "Download the compressed image."],
    faq: standardFaq("Compress Image", [
      {
        q: "Which formats can I compress?",
        a: "JPG, PNG, WebP, and (where your browser supports it) AVIF. You can also re-encode between formats during compression.",
      },
      {
        q: "Will it strip EXIF metadata?",
        a: "Yes - re-encoding removes EXIF metadata such as GPS location and camera details, which is often desirable when sharing photos publicly.",
      },
      {
        q: "Can I see the difference before downloading?",
        a: "Yes, a before/after slider lets you compare the original and compressed image at full resolution.",
      },
    ]),
    related: ["resize-image", "convert-image", "crop-image"],
  },
  {
    slug: "resize-image",
    category: "image",
    name: "Resize Image",
    description: "Change image dimensions while keeping quality.",
    longDescription: "Resize by pixels or percent, lock aspect ratio, all in your browser.",
    about:
      "Resize Image scales an image to exact pixel dimensions or a percentage of its original size, with optional aspect-ratio lock. It's the right tool for prepping product photos for a webshop, fitting profile pictures into a required size, or downscaling huge screenshots for documentation.",
    keywords: ["resize", "scale", "dimensions", "image"],
    icon: Maximize2,
    path: "/image/resize",
    howTo: ["Drop your image.", "Set width/height.", "Download the resized image."],
    faq: standardFaq("Resize Image", [
      {
        q: "Can I lock the aspect ratio?",
        a: "Yes - toggle the lock so changing one dimension automatically updates the other in proportion.",
      },
      {
        q: "Can I resize by percentage instead of pixels?",
        a: "Yes, switch the unit to ‘%’ to scale relative to the original (e.g. 50% halves both dimensions).",
      },
    ]),
    related: ["compress-image", "crop-image", "convert-image"],
  },
  {
    slug: "crop-image",
    category: "image",
    name: "Crop Image",
    description: "Crop images to a custom area or aspect ratio.",
    longDescription: "Visual crop with preset aspect ratios. Browser-only.",
    about:
      "Crop Image lets you trim an image to a specific area or aspect ratio with a visual selection box. Use the presets for common ratios (1:1, 4:3, 16:9) or drag a free-form selection - handy for social-media avatars, banner artwork, or removing distracting edges.",
    keywords: ["crop image", "image cropper", "crop photo", "trim", "aspect ratio", "crop"],
    icon: Crop,
    path: "/image/crop",
    howTo: [
      "Drop your image.",
      "Drag to select crop area or pick a preset.",
      "Download the cropped image.",
    ],
    faq: standardFaq("Crop Image", [
      {
        q: "Which aspect-ratio presets are included?",
        a: "Common presets like 1:1 (square), 4:3, 3:2, and 16:9 are available. You can also drag a free-form crop without locking the ratio.",
      },
      {
        q: "Does cropping reduce image quality?",
        a: "No - the cropped region is exported at the same pixel density as the source.",
      },
    ]),
    related: ["resize-image", "compress-image", "convert-image"],
  },
  {
    slug: "convert-image",
    category: "image",
    name: "Convert Image",
    description: "Convert between PNG, JPG, WebP.",
    longDescription: "Convert images between formats with quality control. Local only.",
    about:
      "Convert Image transcodes between PNG, JPG, and WebP with quality control. Convert PNGs to JPG to slash file size for photographs, or move to WebP for modern web performance - all without uploading the original anywhere.",
    keywords: ["convert", "png to jpg", "jpg to webp", "format", "image"],
    icon: FileType,
    path: "/image/convert",
    howTo: ["Drop image.", "Choose target format.", "Download."],
    faq: standardFaq("Convert Image", [
      {
        q: "Which conversions are supported?",
        a: "PNG, JPG, and WebP can be converted between each other. AVIF output is available where your browser supports encoding it.",
      },
      {
        q: "Will I lose transparency converting PNG to JPG?",
        a: "Yes - JPG doesn't support transparency, so transparent areas will be flattened against a solid background. Use WebP if you need both compression and an alpha channel.",
      },
    ]),
    related: ["compress-image", "resize-image", "image-base64"],
  },
  {
    slug: "image-base64",
    category: "image",
    name: "Image ↔ Base64",
    seoName: "Image to Base64 Converter",
    description: "Encode images to Base64 or decode back.",
    longDescription: "Generate data: URIs from images, or recover an image from a Base64 string.",
    about:
      "Image ↔ Base64 converts images to data URIs you can paste straight into HTML, CSS, or JSON, and decodes Base64 strings back into downloadable images. Useful for embedding small icons inline, debugging API payloads, or recovering an image from a copied data URL.",
    keywords: [
      "image to base64",
      "base64 to image",
      "base64",
      "data uri",
      "image",
      "encode",
      "converter",
    ],
    icon: Binary,
    path: "/image/base64",
    howTo: ["Drop image to encode, or paste Base64 to decode.", "Copy result or download image."],
    faq: standardFaq("Image Base64", [
      {
        q: "Should I inline large images as data URIs?",
        a: "Generally no - Base64 inflates size by ~33% and bloats your HTML/CSS. It's most useful for small icons or one-off embedded assets.",
      },
      {
        q: "What format does the output use?",
        a: "A standard `data:image/<type>;base64,…` URI you can paste into `src` attributes, CSS `url()`, or JSON fields.",
      },
    ]),
    related: ["base64", "convert-image", "compress-image"],
  },
  {
    slug: "bulk-zip",
    category: "image",
    name: "Bulk Rename & Zip",
    description: "Rename a batch of files and download as ZIP.",
    longDescription: "Apply a naming pattern to many files and download a single ZIP. Client-side.",
    about:
      "Bulk Rename & Zip applies a consistent naming pattern across many files at once and packages them into a single ZIP. Perfect for prepping photo batches before upload, sequencing assets for a project handoff, or normalising filenames before importing into a CMS.",
    keywords: ["zip", "bulk", "rename", "batch", "archive"],
    icon: Files,
    path: "/image/bulk-zip",
    howTo: [
      "Drop multiple files.",
      "Set naming pattern like image-{n}.",
      "Download the renamed ZIP.",
    ],
    faq: standardFaq("Bulk Zip", [
      {
        q: "What naming patterns are supported?",
        a: "Use placeholders like `{n}` for an incrementing number. The original file extension is preserved automatically.",
      },
      {
        q: "Can I drop a mix of file types?",
        a: "Yes - any files can be added. They'll all be renamed using the same pattern and bundled into a single ZIP.",
      },
    ]),
    related: ["compress-image", "convert-image", "resize-image"],
  },

  // ---------------- TEXT ----------------
  {
    slug: "case-converter",
    category: "text",
    name: "Case Converter",
    description: "UPPER, lower, Title, camelCase, snake_case, kebab.",
    longDescription:
      "Convert text between common case styles. Live preview and copy. No server processing.",
    about:
      "Case Converter rewrites text into UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, and more, with live preview as you type. Handy for normalising headlines, building consistent variable or filename schemes, and cleaning up copy from inconsistent sources.",
    keywords: ["case", "uppercase", "lowercase", "camel", "snake", "kebab", "title"],
    icon: TypeIcon,
    path: "/text/case-converter",
    howTo: ["Paste your text.", "Pick a case style.", "Copy the result."],
    faq: standardFaq("Case Converter", [
      {
        q: "Which case styles are supported?",
        a: "UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, and kebab-case.",
      },
      {
        q: "Does it handle multi-line text?",
        a: "Yes - paste any length of text and the conversion runs across all lines simultaneously.",
      },
    ]),
    related: ["word-counter", "find-replace", "lorem-ipsum"],
  },
  {
    slug: "word-counter",
    category: "text",
    name: "Word & Character Counter",
    description: "Live word, character, line, and reading time count.",
    longDescription: "Real-time stats for any text. Useful for essays, social posts, SEO copy.",
    about:
      "Word & Character Counter gives you live counts of words, characters (with and without spaces), sentences, paragraphs, lines, and estimated reading time. Use it to fit copy into Twitter or meta-description limits, hit an essay word target, or sanity-check the length of an article.",
    keywords: [
      "word count",
      "character count",
      "characters to words",
      "letter count",
      "reading time",
      "stats",
    ],
    icon: Hash,
    path: "/text/word-counter",
    howTo: ["Paste text.", "See live counts.", "Copy stats if needed."],
    faq: standardFaq("Word Counter", [
      {
        q: "How is reading time estimated?",
        a: "Reading time is calculated from word count assuming an average reading speed of about 225 words per minute.",
      },
      {
        q: "Does the character count include spaces?",
        a: "You'll see both totals - characters with spaces and characters without - so you can match whichever limit you're working against.",
      },
    ]),
    related: ["case-converter", "find-replace", "remove-duplicates"],
  },
  {
    slug: "find-replace",
    category: "text",
    name: "Find & Replace",
    description: "Find and replace with regex support.",
    longDescription: "Plain or regex find/replace with live highlighting. Stays in your browser.",
    about:
      "Find & Replace performs plain-text or regex substitutions across any block of text, with live match highlighting so you can see exactly what's about to change. Useful for cleaning data dumps, fixing recurring typos in long documents, or doing one-off bulk edits without firing up a full editor.",
    keywords: ["find", "replace", "regex", "text"],
    icon: Replace,
    path: "/text/find-replace",
    howTo: ["Paste text.", "Enter find / replace patterns.", "Copy the new text."],
    faq: standardFaq("Find & Replace", [
      {
        q: "Does it support regular expressions?",
        a: "Yes - toggle regex mode to use JavaScript-flavour patterns, including capture groups (`$1`, `$2`) in the replacement.",
      },
      {
        q: "Is the search case-sensitive?",
        a: "You can toggle case sensitivity. In regex mode, you can also add the `i` flag for case-insensitive matching.",
      },
    ]),
    related: ["regex-tester", "case-converter", "remove-duplicates"],
  },
  {
    slug: "lorem-ipsum",
    category: "text",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text by words, sentences, paragraphs.",
    longDescription: "Quickly generate dummy copy for designs and prototypes.",
    about:
      "Lorem Ipsum Generator produces classic Latin placeholder text in any quantity - words, sentences, or paragraphs. Use it to fill a layout while a designer waits on real copy, stress-test typography, or stub out CMS content during development.",
    keywords: ["lorem", "ipsum", "placeholder", "dummy text"],
    icon: Quote,
    path: "/text/lorem-ipsum",
    howTo: ["Choose paragraph/sentence/word count.", "Click ‘Generate’.", "Copy."],
    faq: standardFaq("Lorem Ipsum", [
      {
        q: "Can I generate by word count instead of paragraphs?",
        a: "Yes - switch the unit between paragraphs, sentences, and words to hit an exact length.",
      },
      {
        q: "Does it always start with ‘Lorem ipsum dolor sit amet’?",
        a: "You can choose whether to start with the classic opening line or jump straight into the middle of the text.",
      },
    ]),
    related: ["word-counter", "case-converter", "find-replace"],
  },
  {
    slug: "text-diff",
    category: "text",
    name: "Text Diff",
    description: "Compare two texts and see line-level changes.",
    longDescription: "Side-by-side diff with added / removed highlights. Local only.",
    about:
      "Text Diff compares two pieces of text side by side and highlights additions, deletions, and unchanged lines - like a lightweight code review for any kind of writing. Useful for spotting changes between contract revisions, reviewing edits to an article, or comparing two config snippets.",
    keywords: ["diff", "compare", "text", "changes"],
    icon: GitCompare,
    path: "/text/diff",
    howTo: ["Paste original and new text.", "See highlighted diff."],
    faq: standardFaq("Text Diff", [
      {
        q: "Is the diff line-based or word-based?",
        a: "It compares line by line and highlights which lines were added, removed, or kept the same.",
      },
      {
        q: "Will it work with code?",
        a: "Yes - any plain text works, including code, JSON, YAML, prose, or config files.",
      },
    ]),
    related: ["find-replace", "remove-duplicates", "json-formatter"],
  },
  {
    slug: "remove-duplicates",
    category: "text",
    name: "Sort & Dedupe Lines",
    description: "Sort lines and remove duplicates.",
    longDescription: "Sort, deduplicate, and trim lines of text in one click.",
    about:
      "Sort & Dedupe Lines processes a list of lines: sort alphabetically (or numerically), strip duplicates, and trim whitespace, all in a single pass. Perfect for cleaning up email lists, normalising tag dumps, or preparing data for a spreadsheet import.",
    keywords: ["sort", "deduplicate", "unique", "lines"],
    icon: ListMinus,
    path: "/text/dedupe",
    howTo: ["Paste lines.", "Pick options.", "Copy result."],
    faq: standardFaq("Sort & Dedupe", [
      {
        q: "Is dedupe case-sensitive?",
        a: "You can choose. Case-sensitive mode treats ‘Apple’ and ‘apple’ as different; case-insensitive collapses them.",
      },
      {
        q: "Can I keep the original order?",
        a: "Yes - sorting is optional, so you can dedupe while preserving the order lines first appeared.",
      },
    ]),
    related: ["find-replace", "case-converter", "word-counter"],
  },
  {
    slug: "markdown-html",
    category: "text",
    name: "Markdown ↔ HTML",
    seoName: "Markdown to HTML Converter",
    description: "Convert Markdown to HTML and back.",
    longDescription: "Live preview Markdown → HTML rendering, and HTML → Markdown. All in browser.",
    about:
      "Markdown ↔ HTML converts between Markdown and HTML in either direction with a live preview. Use it to draft a blog post in Markdown and copy clean HTML into a CMS, or to convert legacy HTML snippets back into editable Markdown.",
    keywords: [
      "markdown to html",
      "html to markdown",
      "markdown",
      "md",
      "html",
      "converter",
      "preview",
    ],
    icon: FileCode,
    path: "/text/markdown-html",
    howTo: ["Paste source.", "See live preview.", "Copy the conversion."],
    faq: standardFaq("Markdown ↔ HTML", [
      {
        q: "Which Markdown flavour is supported?",
        a: "GitHub-Flavored Markdown (GFM) - including tables, task lists, fenced code blocks, and strikethrough.",
      },
      {
        q: "Can I see the rendered output live?",
        a: "Yes, the preview updates as you type so you can confirm formatting before copying the HTML.",
      },
    ]),
    related: ["csv-json", "yaml-json", "json-formatter"],
  },
  {
    slug: "csv-json",
    category: "text",
    name: "CSV ↔ JSON",
    seoName: "CSV to JSON Converter",
    description: "Convert CSV data to JSON and back.",
    longDescription: "Auto-detects headers, quoting, and types. No data leaves your browser.",
    about:
      "CSV ↔ JSON converts spreadsheet data to JSON arrays and back, with auto-detection of delimiters, optional type inference, and configurable headers. Use it to feed CSV exports into a JSON-based API, or to flatten an API response into a sheet you can open in Excel.",
    keywords: ["csv to json", "json to csv", "csv", "json", "converter", "data", "spreadsheet"],
    icon: FileJson,
    path: "/text/csv-json",
    howTo: ["Paste CSV or JSON.", "Pick direction.", "Copy result."],
    faq: standardFaq("CSV ↔ JSON", [
      {
        q: "Which delimiters are supported?",
        a: "Comma, semicolon, tab, and pipe - plus an auto-detect mode that picks the most likely delimiter from your sample.",
      },
      {
        q: "What does ‘infer types’ do?",
        a: "It converts strings that look like numbers, booleans, or `null` into their native JSON types instead of leaving everything as strings.",
      },
      {
        q: "Can I convert nested JSON to CSV?",
        a: "Top-level arrays of flat objects convert cleanly. Deeply nested structures don't map to a flat CSV - flatten them first or use JSON output.",
      },
    ]),
    related: ["yaml-json", "json-formatter", "markdown-html"],
  },
  {
    slug: "yaml-json",
    category: "text",
    name: "YAML ↔ JSON",
    seoName: "YAML to JSON Converter",
    description: "Convert YAML to JSON and back.",
    longDescription: "Strict YAML parser, pretty-prints both directions.",
    about:
      "YAML ↔ JSON converts between the two formats in either direction, with strict YAML parsing and pretty-printed output. Useful for translating a Kubernetes or CI config to JSON for inspection, or generating YAML from a JSON snippet you copied from documentation.",
    keywords: [
      "yaml to json",
      "json to yaml",
      "yaml",
      "json",
      "yml",
      "converter",
      "parser",
      "config",
    ],
    icon: Braces,
    path: "/text/yaml-json",
    howTo: ["Paste YAML or JSON.", "Pick direction.", "Copy result."],
    faq: standardFaq("YAML ↔ JSON", [
      {
        q: "Which YAML version is supported?",
        a: "YAML 1.2, the version used by most modern tools (Kubernetes, GitHub Actions, Docker Compose).",
      },
      {
        q: "Are comments preserved?",
        a: "JSON has no comment syntax, so YAML comments are lost when converting YAML → JSON. JSON → YAML output is comment-free by default.",
      },
    ]),
    related: ["csv-json", "json-formatter", "markdown-html"],
  },
  {
    slug: "svg-optimizer",
    category: "text",
    name: "SVG Optimizer",
    description: "SVG optimization: minify and clean SVG markup.",
    longDescription: "SVGO-powered cleanup: remove metadata, collapse styles, shrink paths.",
    about:
      "SVG Optimizer runs SVGO in your browser to strip editor metadata, collapse redundant styles, and shrink path data - typically cutting SVG file size in half or more without changing how the icon looks. Use it before shipping icons in a web app or embedding SVG inline in HTML.",
    keywords: [
      "svg optimization",
      "optimize svg",
      "compress svg",
      "minify svg",
      "svgo",
      "svg",
      "clean",
    ],
    icon: FileCode,
    path: "/text/svg-optimizer",
    howTo: ["Paste or upload SVG.", "Click ‘Optimize’.", "Download or copy."],
    faq: standardFaq("SVG Optimizer", [
      {
        q: "How much can SVG file size shrink?",
        a: "Editor exports (Figma, Illustrator, Sketch) often shrink 40–70% because they include lots of unused metadata and verbose path data.",
      },
      {
        q: "Will optimization change how the SVG looks?",
        a: "No - visual output stays identical. Only metadata, redundant attributes, and unused styles are removed.",
      },
    ]),
    related: ["json-formatter", "markdown-html", "convert-image"],
  },

  // ---------------- DEV ----------------
  {
    slug: "json-formatter",
    category: "dev",
    name: "JSON Formatter",
    description: "Validate, format, and minify JSON.",
    longDescription: "Pretty-print, validate, or minify JSON with helpful error messages.",
    about:
      "JSON Formatter validates JSON syntax, pretty-prints it with consistent indentation, or minifies it for transport. The error messages point to the exact line and column that broke parsing - saving you from squinting at a wall of one-line API output.",
    keywords: ["json", "format", "validate", "minify", "lint"],
    icon: Braces,
    path: "/dev/json-formatter",
    howTo: ["Paste JSON.", "Pick format / minify.", "Copy result."],
    faq: standardFaq("JSON Formatter", [
      {
        q: "Does it support JSON5 or JSONC?",
        a: "Strict JSON only. JSON5 features like trailing commas, single quotes, and comments will be flagged as errors.",
      },
      {
        q: "Can I minify as well as pretty-print?",
        a: "Yes - switch the mode to minify and the output collapses to a single line with no whitespace.",
      },
      {
        q: "Where do parse errors point?",
        a: "Errors include the line and column number plus a short description of what was expected, so you can jump straight to the problem.",
      },
    ]),
    related: ["yaml-json", "csv-json", "jwt-decoder"],
  },
  {
    slug: "jwt-decoder",
    category: "dev",
    name: "JWT Decoder",
    description: "Decode and inspect JSON Web Tokens.",
    longDescription:
      "Paste a JWT to inspect header and payload. Signature is shown but never sent anywhere.",
    about:
      "JWT Decoder splits a JSON Web Token into its header, payload, and signature so you can read claims like `exp`, `iat`, and `sub` at a glance. Use it to debug auth flows or check token expiry - and because it runs locally, even production tokens never leave your browser.",
    keywords: ["jwt", "decode", "token", "json"],
    icon: KeyRound,
    path: "/dev/jwt-decoder",
    howTo: ["Paste a JWT.", "Inspect decoded header & payload."],
    faq: standardFaq("JWT Decoder", [
      {
        q: "Does it verify the signature?",
        a: "No - verification requires the signing secret or public key, which you should never paste into a third-party tool. The signature is shown so you can copy it, not validated.",
      },
      {
        q: "Are timestamps converted to readable dates?",
        a: "Yes - standard claims like `exp`, `iat`, and `nbf` are shown both as Unix timestamps and human-readable dates.",
      },
    ]),
    related: ["base64", "json-formatter", "hash-generator"],
  },
  {
    slug: "base64",
    category: "dev",
    name: "Base64 Encode/Decode",
    description: "Encode and decode Base64 text.",
    longDescription: "Standard or URL-safe Base64. Handles UTF-8 properly.",
    about:
      "Base64 Encode/Decode handles standard and URL-safe Base64 with proper UTF-8 support, so emoji and non-ASCII characters round-trip cleanly. Useful for embedding short binary data in JSON, building data URIs, or decoding tokens from logs.",
    keywords: ["base64", "encode", "decode"],
    icon: Binary,
    path: "/dev/base64",
    howTo: ["Paste text.", "Pick encode / decode.", "Copy result."],
    faq: standardFaq("Base64", [
      {
        q: "Does it support URL-safe Base64?",
        a: "Yes - toggle URL-safe mode to use `-` and `_` instead of `+` and `/`, with optional padding stripped.",
      },
      {
        q: "Does it handle UTF-8 / emoji?",
        a: "Yes. Unlike `btoa()` directly, this tool encodes and decodes UTF-8 properly, so emoji and accented characters survive round-tripping.",
      },
    ]),
    related: ["url-encoder", "image-base64", "jwt-decoder"],
  },
  {
    slug: "url-encoder",
    category: "dev",
    name: "URL Encode/Decode",
    description: "URL-encode or decode strings and components.",
    longDescription: "Use encodeURIComponent / decodeURIComponent for query strings and paths.",
    about:
      "URL Encode/Decode applies `encodeURIComponent` and `decodeURIComponent` to safely escape characters for query strings, path segments, and form data - or unescape them back to readable text. Useful for hand-building API URLs or debugging redirects with mangled parameters.",
    keywords: ["url", "encode", "decode", "percent"],
    icon: Link2,
    path: "/dev/url-encoder",
    howTo: ["Paste text or URL.", "Pick direction.", "Copy result."],
    faq: standardFaq("URL Encode", [
      {
        q: "What's the difference vs `encodeURI`?",
        a: "This tool uses `encodeURIComponent`, which escapes characters like `&`, `=`, and `?` so they're safe inside a single query parameter. `encodeURI` would leave those alone.",
      },
      {
        q: "Can I decode an entire URL at once?",
        a: "Yes - paste the whole URL and it will decode all percent-encoded sequences in one pass.",
      },
    ]),
    related: ["base64", "json-formatter", "regex-tester"],
  },
  {
    slug: "hash-generator",
    category: "dev",
    name: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes.",
    longDescription: "Cryptographic hashes computed locally with the WebCrypto API.",
    about:
      "Hash Generator computes SHA-1, SHA-256, SHA-384, and SHA-512 digests from any text using the browser's built-in WebCrypto API. Useful for verifying file checksums, generating fingerprints for cache keys, or quickly hashing test strings while debugging an auth flow.",
    keywords: ["hash", "sha", "checksum", "md5"],
    icon: Fingerprint,
    path: "/dev/hash-generator",
    howTo: ["Paste text.", "Choose algorithm.", "Copy the hash."],
    faq: standardFaq("Hash Generator", [
      {
        q: "Why isn't MD5 included?",
        a: "MD5 isn't supported by the browser's WebCrypto API and is considered cryptographically broken. Use SHA-256 or stronger for new work.",
      },
      {
        q: "Are the hashes computed locally?",
        a: "Yes - hashing runs entirely in your browser via WebCrypto. The input text never leaves your machine.",
      },
    ]),
    related: ["uuid-generator", "password-generator", "base64"],
  },
  {
    slug: "uuid-generator",
    category: "dev",
    name: "UUID Generator",
    description: "Generate v4 UUIDs in bulk.",
    longDescription: "Generate one or many RFC 4122 v4 UUIDs locally.",
    about:
      "UUID Generator produces RFC 4122 version 4 UUIDs - one at a time or in bulk. Drop them straight into database seed scripts, mock API responses, or test fixtures, with cryptographic-quality randomness from the browser's `crypto` API.",
    keywords: ["uuid", "guid", "id", "generator", "v4"],
    icon: IdCard,
    path: "/dev/uuid-generator",
    howTo: ["Pick count.", "Click ‘Generate’.", "Copy UUIDs."],
    faq: standardFaq("UUID Generator", [
      {
        q: "Which UUID version is generated?",
        a: "Version 4 (random), the most common UUID type for application IDs and database keys.",
      },
      {
        q: "Are the UUIDs cryptographically random?",
        a: "Yes - they're generated with `crypto.getRandomValues`, the same source used for cryptographic operations in the browser.",
      },
      {
        q: "Can I generate many at once?",
        a: "Yes, pick any count and the result is a clean newline-separated list ready to copy.",
      },
    ]),
    related: ["hash-generator", "password-generator", "timestamp"],
  },
  {
    slug: "regex-tester",
    category: "dev",
    name: "Regex Tester",
    description: "Test regular expressions live with match highlighting.",
    longDescription: "JS-flavour regex with flag toggles, capture groups, and live highlights.",
    about:
      "Regex Tester runs JavaScript-flavour regular expressions against any input with live match highlighting and capture-group breakdowns. Use it to iterate on a pattern, debug why something isn't matching, or extract data from log lines without writing a script.",
    keywords: ["regex", "regexp", "test", "match"],
    icon: Regex,
    path: "/dev/regex-tester",
    howTo: ["Type your regex and flags.", "Paste input text.", "See matches highlighted."],
    faq: standardFaq("Regex Tester", [
      {
        q: "Which regex flavour is supported?",
        a: "JavaScript regex - the same engine used by Node.js and browsers. PCRE-only features like recursion or possessive quantifiers aren't available.",
      },
      {
        q: "Are capture groups shown?",
        a: "Yes - each match lists its captured groups (numbered and named) so you can verify your extraction logic.",
      },
      {
        q: "Which flags can I toggle?",
        a: "All standard JS flags: `g`, `i`, `m`, `s`, `u`, and `y`.",
      },
    ]),
    related: ["find-replace", "json-formatter", "url-encoder"],
  },
  {
    slug: "color-converter",
    category: "dev",
    name: "Color Converter",
    description: "HEX ↔ RGB ↔ HSL ↔ OKLCH plus color picker.",
    longDescription: "Live convert between color spaces, with a built-in picker.",
    about:
      "Color Converter translates a single colour between HEX, RGB, HSL, and OKLCH simultaneously, with a built-in picker for visual selection. Handy for porting designs into a Tailwind config, matching a brand colour across CSS frameworks, or exploring OKLCH for modern wide-gamut palettes.",
    keywords: ["color", "hex", "rgb", "hsl", "oklch", "picker"],
    icon: Palette,
    path: "/dev/color-converter",
    howTo: ["Pick or paste a color.", "See conversions across spaces.", "Copy any value."],
    faq: standardFaq("Color Converter", [
      {
        q: "Why does OKLCH matter?",
        a: "OKLCH is a perceptually uniform colour space - equal numeric changes produce equal visual changes - making it ideal for generating consistent palettes and accessible contrast.",
      },
      {
        q: "Can I paste any format?",
        a: "Yes - paste a HEX (`#3b82f6`), RGB (`rgb(59 130 246)`), HSL, or OKLCH value and the others update automatically.",
      },
    ]),
    related: ["regex-tester", "json-formatter", "qr-code"],
  },
  {
    slug: "robots-tester",
    category: "dev",
    name: "Robots.txt Tester",
    description: "Test robots.txt rules against any URL and user-agent.",
    longDescription:
      "Paste a robots.txt and a list of URLs to see which are allowed or blocked for Googlebot, Bingbot, GPTBot, or any custom user-agent.",
    about:
      "Robots.txt Tester parses a robots.txt file the same way Google's crawler does - longest-match wins, with Allow beating Disallow on ties - and shows you exactly which URLs are blocked or allowed for any user-agent. Use it to debug indexing problems, validate edits before deploying, and confirm AI crawler rules (GPTBot, ClaudeBot, PerplexityBot).",
    keywords: ["robots.txt", "robots", "seo", "crawler", "googlebot", "indexing"],
    icon: Bot,
    path: "/dev/robots-tester",
    howTo: [
      "Paste your robots.txt content.",
      "Enter a user-agent (e.g. Googlebot).",
      "List URLs to test - see allow/block per rule.",
    ],
    faq: standardFaq("Robots.txt Tester", [
      {
        q: "Which matching algorithm is used?",
        a: "Google's spec: the most specific (longest) matching pattern wins, and Allow beats Disallow on ties. Wildcards `*` and end-of-path `$` are supported.",
      },
      {
        q: "Can I test AI crawlers?",
        a: "Yes - type any user-agent string (GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.) and rules with that token will apply.",
      },
      {
        q: "Does it fetch live URLs?",
        a: "No. Everything runs locally in your browser; nothing is requested or uploaded. Paste robots.txt content directly.",
      },
    ]),
    related: ["regex-tester", "url-encoder", "json-formatter"],
  },
  {
    slug: "token-counter",
    category: "dev",
    name: "Token Counter",
    description: "Count LLM tokens in a prompt, with a live token preview.",
    longDescription:
      "Count tokens with the real BPE tokenizers (o200k_base and cl100k_base) rather than a rough estimate. Runs entirely in your browser, so prompts stay private.",
    about:
      "Token Counter tells you exactly how many tokens a piece of text becomes, using the same byte-pair encodings the models use rather than a characters-divided-by-four guess. That matters because tokens drive both cost and context limits, and the ratio varies enormously - dense English prose runs about four characters per token, while code, JSON, non-Latin scripts and emoji can run far higher. The token preview shades each token separately, which makes it obvious why a string tokenises the way it does. Everything happens locally, so you can safely paste real prompts, system messages and customer data.",
    keywords: ["token", "tokenizer", "llm", "gpt", "bpe", "count", "prompt", "context"],
    icon: Binary,
    path: "/dev/token-counter",
    howTo: [
      "Paste or type the text you want to measure.",
      "Pick the encoding your model uses (o200k_base for the GPT-4o generation, cl100k_base for GPT-4 and GPT-3.5).",
      "Read the token count, and use the preview to see where the boundaries fall.",
    ],
    faq: standardFaq("Token Counter", [
      {
        q: "Is this an estimate or the real count?",
        a: "The real count. It runs the actual byte-pair encoding in your browser, so the number matches what the tokenizer produces - not a characters-per-token approximation.",
      },
      {
        q: "Which encoding should I choose?",
        a: "o200k_base for the GPT-4o generation, cl100k_base for GPT-4, GPT-3.5 and the text-embedding-3 models. Other providers use their own tokenizers, so treat these counts as a close guide rather than an exact figure there.",
      },
      {
        q: "Why is my token count higher than my word count?",
        a: "Tokens are sub-word units. Ordinary English averages roughly 0.75 words per token, but code, JSON, URLs, non-Latin scripts and emoji split into many more tokens - a single emoji can cost several on its own.",
      },
      {
        q: "Is my prompt sent anywhere?",
        a: "No. The tokenizer runs locally in your browser, which is why it is safe to paste real system prompts or customer data.",
      },
    ]),
    related: ["context-window", "json-formatter", "base64", "word-counter"],
  },
  {
    slug: "context-window",
    category: "dev",
    name: "Context Window Calculator",
    description: "Check whether a prompt fits in a model's context window.",
    longDescription:
      "Tokenise a prompt, set your context window and how much to reserve for the reply, and see instantly whether it fits and how much room is left.",
    about:
      "Context Window Calculator answers the practical question behind a token count: will this actually fit? It tokenises your prompt locally, subtracts the space you want to keep free for the model's reply, and shows how much of the window you are using and how much is left. That is useful when assembling retrieval-augmented prompts, deciding how many documents or conversation turns to include, or working out why a request is being truncated. Because context limits differ by model and provider tier and change frequently, the window size is a field you control rather than a figure baked into the page.",
    keywords: ["context", "window", "tokens", "llm", "prompt", "limit", "rag", "truncation"],
    icon: Gauge,
    path: "/dev/context-window",
    howTo: [
      "Paste the prompt, documents or transcript you plan to send.",
      "Enter your model's context window, or pick one of the common sizes.",
      "Set how many tokens to reserve for the reply, then check the remaining budget.",
    ],
    faq: standardFaq("Context Window Calculator", [
      {
        q: "Why do I need to reserve tokens for the output?",
        a: "On most APIs the context window covers the input and the generated reply together. If you fill the whole window with input, there is no room left to answer, so reserve at least as many tokens as the longest reply you expect.",
      },
      {
        q: "Why aren't specific models listed?",
        a: "Context limits vary by model and provider tier and change often, so a hard-coded list would go out of date and mislead. Check your provider's current documentation and enter the number - the common sizes are one click away.",
      },
      {
        q: "What does 'copies that fit' mean?",
        a: "How many times your current text would fit into the usable window. It is a quick way to judge how many similar documents or conversation turns you can include before running out of room.",
      },
    ]),
    related: ["token-counter", "json-formatter", "word-counter"],
  },

  // ---------------- UTILITIES ----------------
  {
    slug: "qr-code",
    category: "utilities",
    name: "QR Code Generator",
    description: "Make QR codes for URLs, text, Wi-Fi, contact.",
    longDescription: "Customise size and error correction. Download as PNG or SVG.",
    about:
      "QR Code Generator builds scannable codes for URLs, plain text, Wi-Fi credentials, and contact details, with adjustable size and error-correction level. Download as PNG for posters and slides or as SVG for crisp printing at any size.",
    keywords: ["qr", "qr code", "generator", "barcode"],
    icon: QrCode,
    path: "/utilities/qr-code",
    howTo: ["Type or paste content.", "Adjust size / error correction.", "Download QR."],
    faq: standardFaq("QR Code Generator", [
      {
        q: "What error-correction levels are supported?",
        a: "All four standard levels - L (~7%), M (~15%), Q (~25%), and H (~30%). Higher levels stay scannable when partially obscured but produce denser codes.",
      },
      {
        q: "Can I download as SVG?",
        a: "Yes - SVG output is vector-perfect and ideal for print or embedding in design files. PNG is also available for quick use.",
      },
      {
        q: "Is there a maximum content length?",
        a: "QR codes have a hard capacity limit. Long URLs or large blocks of text may need a higher version (denser code) or shortening before they fit.",
      },
    ]),
    related: ["password-generator", "uuid-generator", "color-converter"],
  },
  {
    slug: "password-generator",
    category: "utilities",
    name: "Password Generator",
    description: "Generate strong passwords with full control.",
    longDescription: "Cryptographically secure random passwords with length and character options.",
    about:
      "Password Generator creates cryptographically secure random passwords with full control over length, uppercase, digits, and symbols. Use it for new account signups, generating service credentials, or rotating an old password - generation runs in your browser, so nothing is logged anywhere.",
    keywords: ["password", "generator", "secure", "random"],
    icon: Lock,
    path: "/utilities/password-generator",
    howTo: ["Pick length and character types.", "Generate.", "Copy."],
    faq: standardFaq("Password Generator", [
      {
        q: "Are the passwords truly random?",
        a: "Yes - they're generated with `crypto.getRandomValues`, the same cryptographically secure source the browser uses for HTTPS.",
      },
      {
        q: "Can I exclude ambiguous characters?",
        a: "Yes - you can opt out of look-alike characters (like `0`/`O` or `1`/`l`) for passwords that need to be typed by hand.",
      },
      {
        q: "Are generated passwords stored anywhere?",
        a: "No. Generation happens locally in your browser and nothing is sent to a server. Save the password somewhere safe before closing the tab.",
      },
    ]),
    related: ["uuid-generator", "hash-generator", "qr-code"],
  },
  {
    slug: "unit-converter",
    category: "utilities",
    name: "Unit Converter",
    description: "Length, weight, temperature, data size.",
    longDescription: "Quick unit conversion across common categories.",
    about:
      "Unit Converter handles quick conversions across length, weight, temperature, and digital data sizes (KB, MB, GB, TB). Useful for sanity-checking a recipe, sizing an upload limit, or translating measurements between metric and imperial without firing up a search engine.",
    keywords: ["units", "convert", "length", "weight", "temperature", "data"],
    icon: Ruler,
    path: "/utilities/unit-converter",
    howTo: ["Pick a category.", "Enter a value.", "See all unit conversions."],
    faq: standardFaq("Unit Converter", [
      {
        q: "Which categories are supported?",
        a: "Length, weight/mass, temperature, and digital data size are included by default.",
      },
      {
        q: "Are data sizes binary or decimal?",
        a: "Both interpretations are shown where they differ (e.g. KB vs KiB), so you can match the convention used by your tool or OS.",
      },
    ]),
    related: ["timestamp", "color-converter", "qr-code"],
  },
  {
    slug: "timestamp",
    category: "utilities",
    name: "Timestamp Converter",
    description: "Unix timestamp ↔ human date.",
    longDescription: "Convert between Unix epoch (s/ms) and human-readable date in any timezone.",
    about:
      "Timestamp Converter translates between Unix epoch values (seconds or milliseconds) and human-readable dates in any timezone. Helpful for debugging API timestamps, reading log files, or scheduling cron jobs that take an epoch input.",
    keywords: ["timestamp", "epoch", "unix", "date", "time"],
    icon: Clock,
    path: "/utilities/timestamp",
    howTo: ["Paste a timestamp or date.", "See conversion live.", "Copy."],
    faq: standardFaq("Timestamp Converter", [
      {
        q: "Does it handle seconds and milliseconds?",
        a: "Yes - it auto-detects whether your input is in seconds (10 digits) or milliseconds (13 digits) and converts accordingly.",
      },
      {
        q: "Can I see other timezones?",
        a: "Yes - the converter shows the result in your local timezone and UTC, with the option to pick others.",
      },
    ]),
    related: ["unit-converter", "uuid-generator", "regex-tester"],
  },
];

export const TOOLS_BY_SLUG: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

export const TOOLS_BY_CATEGORY: Record<ToolCategory, Tool[]> = {
  pdf: [],
  image: [],
  text: [],
  dev: [],
  utilities: [],
};
for (const t of TOOLS) TOOLS_BY_CATEGORY[t.category].push(t);

export const CATEGORY_BY_SLUG: Record<ToolCategory, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<ToolCategory, CategoryMeta>;

/**
 * Marketing-friendly tool count, rounded down to the nearest 5 so copy stays
 * accurate as tools are added without needing to be edited by hand.
 */
export const TOOL_COUNT_LABEL = `${Math.floor(TOOLS.length / 5) * 5}+`;

export function getRelatedTools(tool: Tool): Tool[] {
  if (!tool.related) return [];
  return tool.related.map((s) => TOOLS_BY_SLUG[s]).filter(Boolean);
}

export function getToolByPath(path: string): Tool | undefined {
  return TOOLS.find((t) => t.path === path);
}

// Used for the dev/code icon if needed
export const DevIcon = Code2;

// Suppress unused-import warning for icons currently referenced only
// indirectly through `Tool.icon` literals above.
void FileText;
void Search;
