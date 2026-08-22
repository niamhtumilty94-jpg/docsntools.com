import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/**
 * Google Analytics 4, loaded once when VITE_GA4_MEASUREMENT_ID is set.
 *
 * Two deliberate choices:
 *
 * 1. Consent Mode v2 defaults to *denied* for every storage type. GA4 then runs
 *    without cookies - it sends cookieless pings instead of writing _ga - so the
 *    site keeps its "no tracking cookies, no consent banner" position and stays
 *    the right side of UK/EU PECR, which requires consent before non-essential
 *    cookies are set. Call grantAnalyticsConsent() from lib/analytics-consent
 *    to switch to full cookie-based measurement.
 *
 * 2. Automatic page_view is disabled (send_page_view: false) and page views are
 *    sent on route change instead. This is a single-page app, so a document-load
 *    event fires once and would otherwise under-count every subsequent
 *    navigation.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const LOADER_ATTR = "data-ga4-loader";

export function GA4Analytics() {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const loaded = useRef(false);

  // Load gtag.js once, with consent defaults queued before any hit is sent.
  useEffect(() => {
    if (!measurementId) return;
    if (loaded.current || document.querySelector(`script[${LOADER_ATTR}="true"]`)) {
      loaded.current = true;
      return;
    }

    window.dataLayer = window.dataLayer ?? [];
    // Must use `arguments`, not a rest array: gtag reads the raw arguments
    // object, and pushing an array instead produces a malformed command.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };

    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    s.setAttribute(LOADER_ATTR, "true");
    document.head.appendChild(s);
    loaded.current = true;
  }, [measurementId]);

  // One page_view per navigation, including the first.
  useEffect(() => {
    if (!measurementId || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [measurementId, pathname]);

  return null;
}
