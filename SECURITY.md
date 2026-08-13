# Security policy

## Supported versions

OfferLens is pre-1.0. Security fixes are applied to the latest `main` branch and the newest tagged release only.

## Report a vulnerability

Please do **not** open a public issue for a suspected vulnerability or include real résumé data, credentials, access tokens, report capability cookies, or exploit payloads in public discussions.

Use GitHub Private Vulnerability Reporting for this repository. If that feature is unavailable, contact the repository owner through the private address listed on the GitHub profile and request a secure reporting channel. Include:

- affected version/commit;
- impact and attack preconditions;
- minimal reproduction using synthetic data;
- whether credentials or personal data may have been exposed;
- suggested remediation, if known.

Maintainers aim to acknowledge a valid private report within 5 business days, provide an initial assessment within 10 business days, coordinate disclosure, and credit reporters who want attribution. Timelines vary with severity and release complexity.

## Scope priorities

High-priority areas include unauthorized report access/deletion, SSRF or cloud-metadata access, parser escape or arbitrary file read, remote code execution, secret exposure, external AI calls without consent, stored/reflected XSS, prompt injection that changes deterministic scores/salary/authorization, retention failures, and supply-chain compromise.

## Deployment notes

The repository ships safe application defaults but cannot secure an operator’s infrastructure. Production hosts must provide TLS and HSTS, outbound network controls, parser isolation for untrusted files, shared rate limiting for multiple instances, database and backup encryption/access control, scheduled expiry cleanup, proxy body limits, secret rotation, monitoring without raw PII, and timely dependency updates.

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for trust boundaries, implemented controls, residual risks, and primary references.
