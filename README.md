# OfferLens

**OfferLens turns a résumé, one job description, and optional public GitHub evidence into an explainable job-fit and compensation report—without pretending to measure a person’s worth.**

[Try the no-secret demo](http://localhost:3000/demo) · [Read the methodology](docs/METHODOLOGY.md) · [Review the threat model](docs/THREAT_MODEL.md)

> OfferLens is decision support, not legal, financial, tax, or employment advice. Demo compensation is synthetic and never presented as live data.

## What works

- PDF, DOCX, or pasted résumé intake with size, signature, archive, page, and text limits
- Pasted job descriptions plus SSRF-protected public URL import with an honest paste fallback
- Optional public GitHub profile/repository evidence based on technologies, documentation, tests, licensing, and recency—not stars as a proxy for ability
- Deterministic no-secret extraction, hosted OpenAI extraction when explicitly consented, and an OpenAI-compatible adapter
- Editable extraction review with original evidence excerpts before scoring
- Deterministic, versioned fit scoring that separates hard requirements from preferences and fit from confidence
- Pluggable salary-provider interface, a verified historical BLS OEWS snapshot, and a clearly synthetic offline demo provider
- Full evidence-led report with leverage, gaps, compensation provenance, interview preparation, negotiation language, and a 30-day plan
- Anonymous-session report ownership, idempotent analysis, print / Save as PDF, and deletion
- No analytics, telemetry, advertising trackers, or external AI calls by default

## Product preview

Run the demo at `/demo`. It is the same fixture used by unit and browser tests: Maya Chen and Meridian Works are fictional, GitHub-style evidence is synthetic, and every salary value is labeled demo data.

![OfferLens synthetic demo report showing role-specific fit, confidence, supported market range, asking range, leverage, and risk](docs/assets/offerlens-demo.png)

## 60-second local setup

Requirements: [Node.js 24 LTS](https://nodejs.org/) and npm 11+.

```bash
git clone <your-fork-url> offerlens
cd offerlens
npm install
npm run dev
```

Open <http://localhost:3000>. No environment file, database, account, network request, or AI key is required for the demo or deterministic analysis.

### Docker Compose

```bash
docker compose up --build
```

This starts OfferLens and PostgreSQL, initializes the committed SQL schema on a new database volume, and exposes the app at <http://localhost:3000>.

## Configuration

Copy `.env.example` to `.env.local` only when you need optional integrations.

| Variable                  | Default      | Purpose                                                                 |
| ------------------------- | ------------ | ----------------------------------------------------------------------- |
| `AI_PROVIDER`             | `demo`       | `demo`, `openai`, or `openai-compatible`                                |
| `OPENAI_API_KEY`          | unset        | Server-only hosted-provider credential                                  |
| `OPENAI_MODEL`            | `gpt-5-mini` | Configured extraction model                                             |
| `OPENAI_BASE_URL`         | OpenAI API   | Fixed server-side provider base; never user supplied                    |
| `GITHUB_TOKEN`            | unset        | Optional server token for higher public API limits                      |
| `DATABASE_URL`            | unset        | PostgreSQL URL; without it, reports use ephemeral single-process memory |
| `ANALYSIS_RETENTION_DAYS` | `30`         | Expiry stamped on persisted structured reports                          |
| `TRUST_PROXY`             | `false`      | Trust `X-Forwarded-For` only behind a configured proxy                  |
| `RATE_LIMIT_MAX`          | `20`         | Single-process request budget per route/window                          |

External AI remains consent-gated even when configured. The server falls back to conservative deterministic extraction if the provider fails, and tells the user.

## Database

The application stores versioned structured reports—not raw PDF/DOCX bytes or raw source text.

```bash
$env:DATABASE_URL="postgres://offerlens:offerlens@localhost:5432/offerlens" # PowerShell
npm run db:migrate
npm run db:seed   # optional synthetic row for database verification
```

`docker compose up` initializes `drizzle/0000_initial.sql` automatically on a fresh volume. Configure a scheduled expiry cleanup before production; see [Privacy](docs/ARCHITECTURE.md#persistence-and-retention).

## Architecture

OfferLens is one self-hostable Next.js application—no microservices or required queue.

```text
Browser wizard
  → bounded parsers / SSRF-safe importer / optional GitHub metadata
  → deterministic or consented schema-validated extraction
  → user review and correction
  → deterministic fit engine + attributed salary provider
  → evidence-linked report
  → ephemeral memory or PostgreSQL
```

Key boundaries live under `src/domain` (schemas, normalization, scoring, salary, report), `src/server` (parsing, provider adapters, security, storage), and `src/app` (routes and UI). Read [Architecture](docs/ARCHITECTURE.md) for contracts and deployment boundaries.

## Salary data

- **Implemented real provider:** verified May 2023 U.S. national OEWS snapshots for Software Developers and Software QA Analysts/Testers. Reports call it historical/provisional and expose occupation code, geography, dates, units, source URL, and limitations.
- **Implemented demo provider:** fully synthetic 2026 fixture, always labeled demo data.
- **Next:** pinned May 2025 OEWS bulk ingestion, O\*NET 30.3 mapping subset, UK ONS ASHE adapter, and dated ECB reference-rate conversion.

See [Data Sources](docs/DATA_SOURCES.md) for source URLs, licenses, access date, exclusions, and limitations.

## Privacy and security

- Raw documents are processed transiently and not intentionally persisted.
- External AI is off by default and requires explicit user consent.
- Sensitive APIs set `Cache-Control: private, no-store`; code avoids raw-source logging.
- Report access and deletion are tied to a high-entropy HttpOnly anonymous-session capability.
- Job imports reject local/private/special IP space, re-check redirects, and limit types, bytes, redirects, and duration.
- CSP and defensive headers ship by default. Production hosts still need TLS, egress controls, parser isolation, shared rate limiting, backup retention, and secret management.

Read [SECURITY.md](SECURITY.md), the [threat model](docs/THREAT_MODEL.md), and the in-product privacy page.

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --audit-level=high
```

The Playwright suite runs the full no-key analysis and deletion flow at desktop and mobile sizes and checks the demo with axe.

## Known limitations

- Deterministic extraction is conservative and English-first; review is mandatory.
- The bundled real salary provider covers only two U.S. occupation families in USD and uses historical national observations. Unsupported locations, currencies, and roles return insufficient data.
- URL fetching cannot defeat every DNS-rebinding technique without deployment-level egress controls.
- Parser zero-days remain possible; high-risk hosts should isolate file parsing in a no-network worker/container.
- In-memory reports and rate limits are single-process. Multi-instance deployments need PostgreSQL plus a shared limiter.
- The current print route relies on browser “Save as PDF”; it does not promise a tagged accessible PDF.
- Anonymous capability cookies are appropriate for private self-hosted evaluation, not multi-user enterprise access control.

## Roadmap

1. Automate pinned BLS May 2025 ingestion with suppression/RSE preservation and metro → state → national fallbacks.
2. Add the licensed O\*NET occupation mapping subset and user-correctable mapping confidence.
3. Add ONS ASHE and replaceable ECB FX providers.
4. Move parsers and long-running configured AI extraction behind an isolated job adapter.
5. Add account-backed ownership, shared distributed rate limiting, automated expiry cleanup, and backup deletion evidence.
6. Add localization catalogs after English copy stabilizes.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security findings should follow [SECURITY.md](SECURITY.md), not a public issue.

## License

Apache License 2.0. This permissive license supports broad personal and commercial self-hosting while providing an explicit patent grant and preserving attribution. See [LICENSE](LICENSE).
