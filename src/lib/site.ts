/** Site-wide branding and canonical origin (override with VITE_SITE_URL). */
export const SITE_NAME = "DocnTools";
export const SITE_TAGLINE = "Free in-browser document & utility tools";

/**
 * Apex, not www: Search Console crawls docsntools.com and the sitemap is
 * submitted there, so canonicals must name the same host - otherwise the two
 * variants of the site compete as duplicates.
 */
const DEFAULT_SITE_URL = "https://docsntools.com";

export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? DEFAULT_SITE_URL
).replace(/\/$/, "");

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute URL of the social share card (1200x630). */
export const OG_IMAGE = `${SITE_URL}/og.png`;
