import { useEffect } from "react";

/**
 * Loads the Umami analytics script exactly once if both env vars are set.
 *
 * Required env vars:
 *   - VITE_UMAMI_WEBSITE_ID  - the website UUID from your Umami dashboard
 *   - VITE_UMAMI_SRC         - the script URL (e.g. https://cloud.umami.is/script.js
 *                              for Umami Cloud, or your self-hosted URL)
 *
 * Both must be defined or the script does not load - no placeholder requests.
 *
 * Umami is privacy-friendly: no cookies, no cross-site tracking, and no
 * personal data is collected. GDPR/CCPA-compliant by default.
 */
export function UmamiAnalytics() {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
  const src = import.meta.env.VITE_UMAMI_SRC as string | undefined;

  useEffect(() => {
    if (!websiteId || !src) return;
    if (document.querySelector('script[data-umami-loader="true"]')) return;
    const s = document.createElement("script");
    s.async = true;
    s.defer = true;
    s.src = src;
    s.dataset.websiteId = websiteId;
    s.dataset.umamiLoader = "true";
    document.head.appendChild(s);
  }, [websiteId, src]);

  return null;
}
