# Threat model

Reviewed: 2026-08-13. This is a concise release model, not a penetration-test report.

## Assets and boundaries

```text
Browser → Next.js routes → parser/importer → normalized profiles
        → optional external AI → deterministic scoring/salary → report store
        → optional GitHub and public job-site egress
```

Assets: résumé/job PII, structured facts and reports, anonymous ownership capabilities, AI/GitHub/database secrets, scoring integrity, salary provenance, and service availability. Adversaries include malicious uploaders, hostile documents/web pages, prompt injection in source content, opportunistic attackers guessing IDs, compromised dependencies, and misconfigured self-hosting infrastructure.

## Main threats and implemented controls

| Threat                          | Implemented control                                                                                                                                                                     | Residual risk / production action                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Unauthorized report read/delete | 256-bit HttpOnly SameSite capability; only SHA-256 hash retained; queries constrain ID + owner; 404 for unknown                                                                         | Add authenticated accounts for shared/multi-user deployments; protect backups                           |
| Malicious PDF/DOCX              | Extension + MIME + magic checks; 5 MB; PDF page cap; ZIP structure/path/entry/decompressed-size/DTD checks; plain-text extraction; no file persistence                                  | Isolate parsers in a no-network low-privilege worker/container and add AV/CDR for high-risk hosts       |
| SSRF job import                 | WHATWG URL; HTTP/S only; no credentials/nonstandard ports; DNS/IP special-range denial; redirect revalidation; manual redirect cap; type/time/byte limits; no secrets/cookies forwarded | App filtering cannot fully pin DNS against rebinding; enforce network egress denial/proxy in production |
| Prompt injection                | Source content is untrusted quoted data; provider has no tools; strict schemas; bounded outputs; deterministic score and salary; evidence IDs                                           | Injection cannot be fully prevented; never add model tools or authority without a new review            |
| XSS                             | Content is rendered as React text; job HTML becomes allowlist-free sanitized text; no user HTML rendering; CSP                                                                          | CSP currently permits inline script/style needed by framework; adopt nonce CSP for stricter deployments |
| External disclosure             | Provider off by default; explicit checkbox; server verifies consent path; fixed server base URL; server-only secrets                                                                    | Provider retention/deletion depends on operator agreement                                               |
| Sensitive logs/cache            | No raw-input logging in app; sensitive API/report responses `private, no-store`; no telemetry                                                                                           | Reverse proxies/platforms need PII-safe logging configuration                                           |
| Cost/DoS                        | Per-route process limiter; source/output limits; parser/import/provider timeouts; idempotency                                                                                           | Multi-instance needs a shared limiter, proxy body caps, global concurrency bounds, and circuit breakers |
| Deletion/retention              | Raw files transient; owner-checked idempotent report deletion; expiry stored; configurable days                                                                                         | Add scheduled expiry cleanup and documented encrypted-backup expiry before production                   |
| Supply chain                    | Lockfile, non-root multi-stage image, CI verification/audit, Dependabot; current audit zero                                                                                             | Enable repository secret scanning, CodeQL, dependency review, container/SBOM scan in the hosting org    |

## Security tests

Unit and integration tests cover private/special IP space, encoded loopback, URL schemes/credentials/internal names, MIME/signature mismatch, valid DOCX extraction, prompt text not affecting scoring, protected fields not affecting scoring, evidence references, salary-provider insufficiency, hosted-AI failure fallback, GitHub API failure, fail-safe rate limiting, proxy-header trust, idempotent retry, cross-owner reads/deletes, and repeated deletion. Browser tests cover the no-key flow, report ownership cookie path, deletion, print layout, responsive overflow, browser errors, and axe serious/critical violations.

Recommended parser corpus additions: MIME spoof, truncated PDF, script/attachment PDF, DOCM, ZIP slip, ZIP bomb, nested archives, excessive entries, XXE/billion laughs, parser timeout/crash, SVG/event-handler XSS, and temp-file cleanup. Recommended network harness additions: mixed public/private DNS answers, public-to-private redirect, simulated DNS rebinding, slow/chunked oversized body, and compressed response bomb.

## References

- OWASP File Upload Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html>
- OWASP SSRF Prevention: <https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html>
- OWASP XXE Prevention: <https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html>
- OWASP LLM Prompt Injection Prevention: <https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html>
- OWASP Logging Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>
- OWASP CSRF Prevention: <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
- IANA IPv4/IPv6 special registries: <https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml>, <https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry.xhtml>
- GitHub Actions secure use: <https://docs.github.com/en/actions/reference/security/secure-use>
