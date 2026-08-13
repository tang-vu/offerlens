# Architecture

Accessed and reviewed: 2026-08-13. Current analysis contracts are versioned as `analysis-input-1.0.0` and `fit-1.0.0`.

## Design goals

OfferLens is a vertical, self-hostable product with a narrow trust model: language models can extract or explain, but cannot set scores, choose or invent salary observations, authorize report access, delete data, fetch arbitrary URLs, or call tools. The application stays one deployable Next.js process with optional PostgreSQL.

## Layers

| Layer             | Location                                               | Responsibility                                                                               |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Runtime contracts | `src/domain/schemas.ts`                                | Zod validation for inputs, extraction, evidence, scoring, salary, and reports                |
| Normalization     | `src/domain/normalization.ts`                          | Skill aliases, role-family mapping, sensitive-proxy redaction                                |
| Scoring           | `src/domain/scoring.ts`                                | Pure deterministic requirement matching, weight redistribution, fit, and confidence          |
| Compensation      | `src/domain/salary.ts`                                 | Provider interface, real historical BLS adapter, synthetic demo adapter, bounded positioning |
| Report            | `src/domain/report.ts`                                 | Evidence-linked narrative assembled from deterministic results                               |
| Extraction        | `src/server/extraction`                                | Conservative local parser, OpenAI Responses adapter, OpenAI-compatible adapter               |
| Ingestion         | `src/server/files.ts`, `github.ts`, `security/ssrf.ts` | Bounded file parsing, public metadata, protected web import                                  |
| Persistence       | `src/server/store.ts`, `src/server/db/schema.ts`       | Anonymous ownership, idempotency, ephemeral or PostgreSQL report storage                     |
| Transport/UI      | `src/app`, `src/components`                            | Same-origin APIs, review workflow, report, print, and deletion                               |

## Analysis sequence

1. Browser collects résumé/job/context with explicit external-AI consent off.
2. PDF and DOCX files are bounded and converted to text in memory; paste remains available.
3. Job URL imports validate scheme, credentials, port, hostname, every resolved IP, redirects, type, time, and byte count.
4. Configured extraction either uses the deterministic parser or a consented provider with a narrow no-tools prompt and strict output validation.
5. Optional GitHub evidence uses public REST metadata; failures are non-fatal and disclosed.
6. The user reviews and edits the extracted profiles and supporting excerpts.
7. The API validates schemas and evidence-reference integrity.
8. Pure application code calculates requirement status, weighted categories, score, and confidence.
9. A salary provider maps role/geography or returns insufficient data. Candidate positioning is a bounded application heuristic.
10. The report builder accepts only validated profiles and deterministic results.
11. The report is stored under a hashed anonymous capability and can be printed or deleted.

## AI providers

`AI_PROVIDER=demo` is the default and makes no external AI call. `openai` uses the Responses API structured-output format. `openai-compatible` uses a fixed server-configured Chat Completions endpoint and validates JSON with the same Zod contract. An arbitrary user-supplied base URL is never accepted.

Provider content is untrusted on return. A provider failure falls back to deterministic extraction with a visible warning. There is no provider call in scoring or salary calculation.

## Scoring

Scoring is a pure function over `CandidateProfile` and `RoleProfile`. Each report persists the methodology version. Base category weights total 100 only when every category is explicitly evaluable; absent job categories are removed and remaining weights are normalized to 100. Status values are supported `1`, partial `0.55`, and no supplied support `0`.

Names, education institutions, addresses, graduation dates, writing style, and protected traits do not exist in the scoring schema. Tests assert that extra fields are stripped and cannot alter output.

## Salary providers

`SalaryDataProvider.getEstimate()` receives validated role, candidate, fit, currency, and period. It returns status, provider/version, demo flag, occupation, geography, dates, units, percentiles/ranges, confidence, freshness, source URL, adjustment, exchange-rate record if any, and limitations.

Provider baseline, candidate adjustment, and recommended ask are separate fields. Non-USD BLS requests and unsupported geographies or occupation families return insufficient rather than converted or fabricated values.

## Persistence and retention

Without `DATABASE_URL`, a process-local map stores reports until restart. With PostgreSQL, the committed migration stores only the structured report and an expiry time. The owner capability is 256 bits in an HttpOnly, SameSite=Strict cookie; the store keeps only its SHA-256 hash. Queries constrain report ID and owner hash.

The current release stamps expiry but does not run scheduled cleanup. Production deployment must delete expired rows and define backup expiry. Deletion is ownership-checked and idempotent; raw file bytes were never intentionally stored.

## Background work

The current bounded flow runs inside ordinary route limits. Extraction has explicit 45-second provider timeouts; imports and metadata have shorter limits. If document/provider latency grows, preserve the `inputHash + methodologyVersion + idempotencyKey` contract behind a background-job adapter. A queue is not justified in this release.

## Localization readiness

The domain schemas use stable enum values and typed fields; UI copy is currently English and still inline. The next localization step is extracting visible strings into message catalogs without changing domain contracts.

## Deployment boundary

The included container runs non-root and builds a standalone Next.js image. Production operators are responsible for TLS/HSTS, reverse-proxy body limits, database isolation, shared rate limits for multiple replicas, outbound firewall/egress proxy, no-network parser isolation, secrets management, backups, expiry cleanup, monitoring without PII, and prompt/provider data agreements.
