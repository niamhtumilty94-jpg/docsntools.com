/**
 * Consent Mode controls for Google Analytics 4.
 *
 * GA4 is loaded with every storage type denied by default (see
 * components/analytics/ga4.tsx), which keeps it cookieless. Wire these to a
 * consent banner to move between cookieless and full measurement.
 *
 * Both are safe to call before gtag.js has finished loading - commands queue
 * through dataLayer - and safe to call during SSR, where they no-op.
 */

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.gtag?.(...args);
}

/** Visitor agreed: allow GA4 to set its _ga cookies. */
export function grantAnalyticsConsent(): void {
  gtag("consent", "update", { analytics_storage: "granted" });
}

/** Visitor declined or withdrew: back to cookieless pings. */
export function revokeAnalyticsConsent(): void {
  gtag("consent", "update", { analytics_storage: "denied" });
}
