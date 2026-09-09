import { createFileRoute, Link } from "@tanstack/react-router";

import { GA4_ENABLED } from "@/lib/analytics";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "/privacy",
      "Privacy Policy",
      "How DocnTools handles your data. Files never leave your browser. Cookieless analytics. No ad networks on tool pages.",
    ),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-xl font-semibold">The short version</h2>
          <p>
            Every tool on DocnTools runs <strong>entirely in your browser</strong>. Your documents,
            images, text, and any other content you load into a tool are processed locally on your
            device and are <strong>never uploaded</strong> to our servers or to any third party. We
            have no way to see them.
          </p>
          <p>
            We use cookieless analytics to count anonymous pageviews
            {GA4_ENABLED ? " (Umami, and Google Analytics 4 in cookieless mode)" : " (Umami)"}. We
            do not run ad networks on tool pages, and no analytics provider receives the contents of
            anything you load into a tool.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Anonymous pageviews</strong> via Umami Cloud - the page URL, referrer,
              browser, country, and device type. No cookies, no fingerprinting, no personal
              identifiers. This is the bar the EU regulator considers consent-free.
            </li>
            <li>
              <strong>Theme preference</strong> stored in your browser's localStorage. This never
              leaves your device and is not a cookie.
            </li>
            <li>
              <strong>Recently used tools and pinned favorites</strong> stored in localStorage, so
              the homepage can show them. Local to your browser.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we do not collect</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>The contents of any file you load into a tool.</li>
            <li>Filenames, file sizes, or any metadata derived from your files.</li>
            <li>The text you paste into text tools.</li>
            <li>IP addresses tied to identifiers (Umami truncates and anonymises).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Data processors</h2>
          <p>We use the following sub-processors:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Umami Cloud</strong> - anonymous, cookieless analytics. EU-hosted.
            </li>
            {GA4_ENABLED && (
              <li>
                <strong>Google Analytics 4</strong> - aggregate traffic measurement, loaded with
                Consent Mode set to deny storage so it operates without cookies. Google processes
                this data as a sub-processor; pageview and device metadata only.
              </li>
            )}
            <li>
              <strong>Cloudflare</strong> - content delivery and edge hosting.
            </li>
            <li>
              <strong>Google Fonts</strong> - webfont delivery for Inter and JetBrains Mono.
            </li>
            <li>
              <strong>Ko-fi</strong> - only when you click the "Support on Ko-fi" link, which opens
              their site in a new tab.
            </li>
          </ul>
          <p className="text-muted-foreground">
            When account features ship, this list will be updated to include Supabase
            (authentication and account storage) and Stripe (billing).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Your rights</h2>
          <p>
            Today there are no user accounts, so there is no personal data tied to you to access,
            export, or delete. Once accounts launch, you will be able to:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Export your account data as JSON (right to portability).</li>
            <li>Delete your account and all associated data (right to erasure).</li>
            <li>Request a copy of any data we hold about you (right to access).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p>
            For any privacy questions or data requests, email{" "}
            <a className="underline" href="mailto:privacy@toolkithub.example">
              privacy@toolkithub.example
            </a>
            .
          </p>
        </section>

        <section>
          <p className="text-muted-foreground">
            See also:{" "}
            <Link className="underline" to="/cookies">
              Cookies
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
