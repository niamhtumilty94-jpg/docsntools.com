import { createFileRoute, Link } from "@tanstack/react-router";

import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "/terms",
      "Terms of Service",
      "Terms governing your use of DocnTools's free in-browser utility tools.",
    ),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
      </p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="text-xl font-semibold">1. Acceptance</h2>
          <p>
            By using DocnTools ("the Service") you agree to these Terms. If you do not agree, do not
            use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. The Service</h2>
          <p>
            DocnTools provides free, in-browser utility tools for working with PDFs, images, text,
            and developer formats. All processing happens on your device. We do not see, store, or
            transmit the files or text you load into the tools.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Use the Service for any unlawful purpose or in violation of any law.</li>
            <li>
              Attempt to interfere with, disrupt, or reverse-engineer the Service or its
              infrastructure.
            </li>
            <li>
              Use automated means (scrapers, bots) to access the Service in a way that imposes
              unreasonable load.
            </li>
            <li>
              Process content you do not have the legal right to process (for example, copyrighted
              material without permission, or personal data of others without a lawful basis).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. No warranty</h2>
          <p>
            The Service is provided <strong>"as is" and "as available"</strong> without warranties
            of any kind, express or implied. We do not warrant that the Service will be
            uninterrupted, error-free, or fit for any particular purpose. You are responsible for
            verifying the output of any tool before relying on it, especially for legal, financial,
            medical, or other sensitive uses.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, DocnTools shall not be liable for any indirect,
            incidental, consequential, or punitive damages arising out of or related to your use of
            the Service, including loss of data, loss of profits, or business interruption.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Accounts and billing</h2>
          <p>
            DocnTools is currently free with no user accounts. When optional paid plans launch,
            additional terms covering accounts, subscriptions, billing, refunds, and cancellation
            will apply and will be presented to you before purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Changes</h2>
          <p>
            We may update these Terms from time to time. Material changes will be reflected in the
            "Last updated" date above. Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p>
            Questions:{" "}
            <a className="underline" href="mailto:hello@toolkithub.example">
              hello@toolkithub.example
            </a>
          </p>
        </section>

        <section>
          <p className="text-muted-foreground">
            See also:{" "}
            <Link className="underline" to="/privacy">
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link className="underline" to="/cookies">
              Cookies
            </Link>
          </p>
        </section>
      </div>
    </article>
  );
}
