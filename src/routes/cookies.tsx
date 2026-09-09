import { createFileRoute, Link } from "@tanstack/react-router";

import { GA4_ENABLED } from "@/lib/analytics";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead(
      "/cookies",
      "Cookie Policy",
      "DocnTools does not set tracking cookies. Analytics is cookieless; theme preference uses localStorage.",
    ),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-xl font-semibold">Short version</h2>
          <p>
            <strong>DocnTools does not set tracking cookies.</strong> That is why you do not see a
            cookie consent banner - there is nothing to consent to.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we use instead</h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Analytics (Umami Cloud)</strong> - cookieless. Umami counts anonymous
              pageviews using a hashed, daily-rotating identifier that cannot be tied back to a
              specific person. This is recognised by EU data-protection regulators as not requiring
              consent.
            </li>
            {GA4_ENABLED && (
              <li>
                <strong>Analytics (Google Analytics 4)</strong> - runs in cookieless mode. We load
                GA4 with Google Consent Mode set to deny storage, so it does not write the{" "}
                <code>_ga</code> cookies it normally would, and measurement is limited to aggregate,
                cookieless pings. If that ever changes we will ask for your consent first, and this
                page will say so.
              </li>
            )}
            <li>
              <strong>Theme preference</strong> - stored in your browser's <code>localStorage</code>{" "}
              under the key <code>th:theme</code>. This is not a cookie, is never sent to any
              server, and exists only so the site remembers light/dark mode between visits.
            </li>
            <li>
              <strong>Recently used and pinned tools</strong> - stored in <code>localStorage</code>{" "}
              so the homepage can show them. Local to your browser only.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Third parties</h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Google Fonts</strong> - loads webfonts from Google's CDN. Google may log the
              request (browser, IP, font name). No cookies are set by Google Fonts.
            </li>
            <li>
              <strong>Ko-fi</strong> - only loaded when you click "Support on Ko-fi", which opens
              their site in a new tab. Their cookie policy applies once you are on their site.
            </li>
          </ul>
          <p className="text-muted-foreground">
            When billing launches, Stripe will set cookies on the checkout page (their own domain)
            for fraud prevention. Those cookies are governed by Stripe's cookie policy and only
            apply during checkout.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Clearing local storage</h2>
          <p>
            You can clear the small amount of data we keep in your browser at any time via your
            browser's "Clear site data" or "Clear local storage" controls. Doing so will reset your
            theme preference and remove your pinned/recent tools list.
          </p>
        </section>

        <section>
          <p className="text-muted-foreground">
            See also:{" "}
            <Link className="underline" to="/privacy">
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link className="underline" to="/terms">
              Terms of Service
            </Link>
          </p>
        </section>
      </div>
    </article>
  );
}
