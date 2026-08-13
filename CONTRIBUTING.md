# Contributing to OfferLens

Thank you for helping candidates make more informed, evidence-backed decisions.

## Before opening a change

- Use a public issue for product/engineering discussion; use the private process in `SECURITY.md` for vulnerabilities.
- Never commit real résumés, job-application PII, provider payloads, API keys, cookies, or proprietary salary data.
- New salary sources must have documented lawful access, reuse terms, compensation semantics, freshness, quality/suppression behavior, and attribution in `docs/DATA_SOURCES.md`.
- Changes to scoring, confidence, salary adjustment, or evidence semantics require a methodology version decision and regression tests.
- User-facing claims must distinguish verified functionality, inference, fixture data, and unsupported states.

## Development

```bash
npm install
npm run dev
```

No environment variables are required. Copy `.env.example` only for optional integrations. Use fictional data in tests and screenshots.

Before a pull request:

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

## Pull requests

Keep changes scoped and explain user impact, architecture/security decisions, test evidence, data-source/license changes, screenshots for visual work, and remaining limitations. Preserve accessibility, reduced motion, print output, mobile reflow, no-secret demo operation, deletion, and consent boundaries.

By contributing, you agree that your contribution is licensed under Apache-2.0 and to follow the Code of Conduct.
