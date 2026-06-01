/** Site-wide branding and canonical origin (override with VITE_SITE_URL). */
export const SITE_NAME = "DocnTools";
export const SITE_TAGLINE = "Free in-browser document & utility tools";

export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://docsntool.com"
).replace(/\/$/, "");

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
