import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How OfferLens handles résumé, job, GitHub, report, and optional external AI data.",
};

export default function PrivacyPage() {
  return (
    <div className="narrow content-page">
      <span className="eyebrow">Privacy model · local-first</span>
      <h1 className="display">Your career evidence is not an advertising asset.</h1>
      <p className="lede">
        OfferLens has no analytics, telemetry, advertising pixels, or third-party trackers by
        default. Self-hosters control the server, database, AI provider, logs, backups, and
        retention.
      </p>
      <div className="prose">
        <h2>What is processed</h2>
        <p>
          Résumé text, job-description text, user-supplied role context, optional public GitHub
          metadata, extracted profiles, evidence records, scores, and the generated report. File
          bytes are processed in memory and are not intentionally persisted by the application.
        </p>
        <h2>What is retained</h2>
        <p>
          Without <code>DATABASE_URL</code>, reports are held in single-process memory and disappear
          on restart. With PostgreSQL configured, the structured report is retained for the
          configured policy period (30 days by default). Raw PDF/DOCX bytes and raw source text are
          not stored in the report table. Server operators must configure cleanup for expired
          database rows and backup expiry.
        </p>
        <h2>Anonymous ownership</h2>
        <p>
          OfferLens assigns this browser a high-entropy capability in an HttpOnly, SameSite=Strict
          cookie. Only its SHA-256 hash is associated with a report. Report reads and deletion
          require the same browser capability; unknown and unauthorized IDs return the same
          not-found response. This is privacy-oriented anonymous access, not a substitute for
          accounts in a shared high-risk deployment.
        </p>
        <h2>External AI</h2>
        <p>
          Demo/deterministic mode makes no external AI call. If the host configures OpenAI or an
          OpenAI-compatible endpoint, OfferLens calls it only when the user checks the explicit
          consent box. The provider receives bounded résumé and job text plus employment context for
          structured extraction. Provider retention and deletion depend on the selected provider and
          the self-hoster’s agreement.
        </p>
        <h2>GitHub and job URLs</h2>
        <p>
          Optional public GitHub links are read through GitHub’s public API. A server token may be
          configured to increase rate limits; it is never sent to the browser. Job URLs use a
          bounded safe fetcher that blocks internal and special-use networks, revalidates redirects,
          accepts only HTML/plain text, and limits duration and size. Some sites cannot or should
          not be imported; paste remains the fallback.
        </p>
        <h2>Logs</h2>
        <p>
          Application code does not log raw résumé or job content, prompts, provider payloads,
          cookies, tokens, or report text. Deployment platforms and reverse proxies can add access
          logs, so self-hosters should exclude query strings and sensitive headers and set
          appropriate retention.
        </p>
        <h2>Delete your analysis</h2>
        <p>
          Every retained report has a “Delete analysis” control. It deletes the structured report
          for the current anonymous owner. It cannot delete data a configured external AI provider
          may retain; consult that provider’s policy. Database backups expire according to the
          host’s backup policy.
        </p>
        <h2>Operator responsibilities</h2>
        <p>
          Production hosts must provide TLS, timely security updates, egress restrictions, parser
          isolation where practical, database access controls, encrypted backups, secrets
          management, retention cleanup, rate limiting suitable for multiple instances, and a lawful
          privacy notice for their jurisdiction.
        </p>
      </div>
    </div>
  );
}
