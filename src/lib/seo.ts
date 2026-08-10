import { OG_IMAGE, SITE_NAME, SITE_TAGLINE, absUrl } from "./site";
import { TOOL_COUNT_LABEL, type CategoryMeta, type Tool } from "./tools";

export { SITE_NAME, SITE_TAGLINE };

function abs(path: string): string {
  return absUrl(path);
}

/**
 * Trims to `max` characters without cutting a word in half, so meta
 * descriptions don't end mid-token (".. in any order. 100%").
 */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "");
  return `${base}...`;
}

/**
 * Builds head() output for a tool route.
 *
 * Includes (in order of importance for SEO):
 *  - <title> with primary keyword + brand
 *  - meta description trimmed to <160 chars
 *  - canonical link (prevents duplicate-content issues with utm params etc.)
 *  - Open Graph + Twitter card tags
 *  - JSON-LD: SoftwareApplication, FAQPage, HowTo, BreadcrumbList
 *
 * The HowTo schema makes Google sometimes show the steps as a rich result
 * directly in search. The BreadcrumbList schema lets Google render the
 * "Home > PDF Tools > Merge PDF" path under the title in SERPs.
 */
export interface ToolSeoPreview {
  title: string;
  description: string;
  url: string;
  canonical: string;
  keywords: string;
  jsonLd: { type: string; data: unknown; valid: boolean; error?: string }[];
}

export function buildToolSeo(tool: Tool): ToolSeoPreview {
  const title = `${tool.name} - Free, In-Browser, No Upload | ${SITE_NAME}`;
  const fullDescription =
    `${tool.description} 100% free, no signup, processed in your browser. ${tool.longDescription}`.slice(
      0,
      300,
    );
  const description = truncateAtWord(fullDescription, 158);
  const url = abs(tool.path);
  const categoryName = categoryDisplayName(tool.category);

  const blocks: { type: string; data: unknown }[] = [
    {
      type: "SoftwareApplication",
      data: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.name,
        description: tool.description,
        url,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (Web Browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        // No aggregateRating: this previously emitted a hardcoded 4.8 from 120
        // ratings on every tool page. Those ratings do not exist, and marking up
        // review data that isn't visible on the page (let alone real) breaks
        // Google's structured-data policy and risks a manual action against the
        // whole domain. Only add it back when there are genuine, on-page ratings.
      },
    },
    {
      type: "WebApplication",
      data: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: tool.name,
        url,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: tool.description,
      },
    },
    {
      type: "FAQPage",
      data: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: tool.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    },
    {
      type: "HowTo",
      data: {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to use ${tool.name}`,
        description: tool.description,
        totalTime: "PT1M",
        step: tool.howTo.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: `Step ${i + 1}`,
          text: s,
        })),
      },
    },
    {
      type: "BreadcrumbList",
      data: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: abs(`/${tool.category}`),
          },
          { "@type": "ListItem", position: 3, name: tool.name, item: url },
        ],
      },
    },
  ];

  const jsonLd = blocks.map((b) => {
    try {
      const serialized = JSON.stringify(b.data);
      JSON.parse(serialized);
      const obj = b.data as Record<string, unknown>;
      if (!obj["@context"] || !obj["@type"]) {
        return { ...b, valid: false, error: "Missing @context or @type" };
      }
      return { ...b, valid: true };
    } catch (err) {
      return { ...b, valid: false, error: (err as Error).message };
    }
  });

  return {
    title,
    description,
    url,
    canonical: url,
    keywords: tool.keywords.join(", "),
    jsonLd,
  };
}

export function toolHead(tool: Tool) {
  const seo = buildToolSeo(tool);
  const { title, description, url } = seo;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: seo.keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: seo.jsonLd.map((b) => ({
      type: "application/ld+json",
      children: JSON.stringify(b.data),
    })),
  };
}

export function categoryHead(category: CategoryMeta | string, description?: string) {
  const meta: CategoryMeta | undefined = typeof category === "string" ? undefined : category;
  const name = meta ? meta.name : (category as string);
  const desc = meta ? meta.description : (description ?? "");
  const path = meta ? meta.path : `/${(category as string).toLowerCase()}`;
  const title = `${name} - Free Online ${name} | ${SITE_NAME}`;
  const url = abs(path);

  return {
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
            { "@type": "ListItem", position: 2, name, item: url },
          ],
        }),
      },
      // Only emitted when the questions are actually rendered on the page.
      ...(meta && meta.faq.length > 0
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: meta.faq.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            },
          ]
        : []),
    ],
  };
}

/**
 * Head for a simple standalone page (privacy, terms, cookies).
 *
 * These are listed in the sitemap, so they need a self-referencing canonical -
 * without one, query-string variants (?utm_source=...) are crawled as separate
 * URLs and reported as duplicates.
 */
export function pageHead(path: string, title: string, description: string) {
  const url = abs(path);
  return {
    meta: [
      { title: `${title} - ${SITE_NAME}` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} - ${SITE_NAME}` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function homeHead() {
  const title = `${SITE_NAME} - ${SITE_TAGLINE}`;
  const description = `${TOOL_COUNT_LABEL} free online tools for PDF, images, text, and developers. No signup, no uploads - everything runs in your browser.`;
  const url = abs("/");
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url,
          potentialAction: {
            "@type": "SearchAction",
            target: `${abs("/")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  };
}

function categoryDisplayName(slug: string): string {
  switch (slug) {
    case "pdf":
      return "PDF Tools";
    case "image":
      return "Image Tools";
    case "text":
      return "Text Tools";
    case "dev":
      return "Dev Tools";
    case "utilities":
      return "Utilities";
    default:
      return slug;
  }
}
