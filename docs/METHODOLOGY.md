# OfferLens methodology

Version: `fit-1.0.0` · Accessed/reviewed: 2026-08-13

OfferLens evaluates the fit supported by supplied evidence for one role, geography, and employment context. It does not measure human worth or predict a hiring outcome.

## Evidence contract

Every material extracted fact or conclusion references records with:

- source type and identifier;
- short excerpt or structured fact;
- relevance to the conclusion;
- confidence from 0 to 1;
- extraction method.

Source content is untrusted. Missing evidence is not evidence of absence. Reports distinguish `supported`, `partial`, `not present in supplied facts`, and `no evidence supplied`.

## Categories and base weights

| Category                 | Weight | Rule                                                           |
| ------------------------ | -----: | -------------------------------------------------------------- |
| Must-have coverage       |     30 | Exact explicit hard requirements only                          |
| Relevant experience      |     20 | Role-family and stated depth                                   |
| Role/seniority           |     15 | Evidenced responsibility scope relative to job level           |
| Demonstrated outcomes    |     12 | Specific outcomes, with measured results receiving more credit |
| Domain relevance         |      8 | Only domains explicit in the job                               |
| Preferred qualifications |      8 | Preferences remain separate from hard requirements             |
| Explicit constraints     |      4 | Only user-confirmed legally relevant constraints               |
| Evidence quality         |      3 | Coverage, confidence, and attributable records                 |

An absent job category is disabled and its weight redistributed proportionally. The score is rounded to an integer for readability, while the report preserves category points, weights, and confidence.

## Confidence

Confidence is not a score multiplier. It is derived separately from requirement evidence coverage, candidate evidence volume, and role-source completeness, and capped at 95. Low confidence is a reason to collect evidence, not a negative judgment about the candidate.

## Compensation

The salary provider owns raw market observations and provenance. Application code separately computes a bounded candidate adjustment:

- fit ≥85: +7%; fit ≥70: +4%; fit <50: −4%; otherwise 0%;
- two or more measured outcomes and confidence ≥60: +2%;
- confidence <50: adjustment reset to 0%;
- implementation bound: −10% to +10% (schema hard limit ±15%).

The recommended ask centers on the adjusted provider median while remaining capped by supported observations. This is a transparent initial heuristic, not a learned estimate. It requires calibration before high-stakes use.

## Fairness exclusions

Scoring and compensation schemas omit race/ethnicity, gender/gender identity, age, religion, disability/health, sexual orientation, pregnancy/family status, political affiliation, photos, nationality, names, schools, addresses, graduation dates, and linguistic style. Nationality is never used. A user may explicitly supply legally relevant work authorization when a job states a constraint.

These exclusions do not remove historical bias from job descriptions, résumés, labor data, or configured models. OfferLens must not be used as an automated employment decision system.

## Versioning

Every report stores input, methodology, and salary-provider versions. Methodology changes that can alter a score require a version bump and regression fixtures. Existing saved reports remain snapshots and are not silently recalculated.
