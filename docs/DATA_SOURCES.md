# Data-source register

All sources below were reviewed on **2026-08-13**. “Implemented” means the repository contains a provider or fixture. “Evaluated” means no data is ingested in this release.

## Implemented sources

### U.S. Bureau of Labor Statistics — Occupational Employment and Wage Statistics

Status: implemented as a small, pinned **May 2023 historical national snapshot**.

- Current tables: <https://www.bls.gov/oes/tables.htm>
- Current documentation: <https://www.bls.gov/oes/oes_doc.htm>
- Technical notes: <https://www.bls.gov/OES/current/oes_tec.htm>
- Percentiles: <https://www.bls.gov/oes/oes_perc.htm>
- Raw time-series directory: <https://download.bls.gov/pub/time.series/oe/>
- Bundled software-developer observation: <https://www.bls.gov/oes/2023/may/oes151252.htm>
- Bundled QA observation: <https://www.bls.gov/oes/2023/may/oes151253.htm>
- Copyright: <https://www.bls.gov/opub/copyright-information.htm>
- API terms: <https://www.bls.gov/developers/termsOfService.htm>

License/reuse: BLS publications are public domain except separately copyrighted material; attribution is requested. The BLS name or emblem must not imply endorsement.

Current official release: May 2025 estimates, published 2026-05-15. OEWS updates annually and covers roughly 830 2018 SOC occupations at national, state, metropolitan, and nonmetropolitan levels. It publishes means and P10/P25/P50/P75/P90 where disclosure and quality rules permit.

Compensation scope: straight-time gross cash wages. This may include commissions, production bonuses, tips, guaranteed pay, hazard pay, and cost-of-living allowances. It excludes overtime, shift differentials, nonproduction bonuses, severance, employer benefit costs, tuition reimbursement, and stock bonuses. It is not total compensation. Annual values generally use hourly wage × 2,080.

Population limits: wage and salary employees in nonfarm establishments; excludes the self-employed, unincorporated owners/partners, private-household employees, unpaid family workers, and most agricultural workers.

Implemented records:

| SOC     | Occupation                       | Geography     | Sample   |      P25 |      P50 |      P75 |
| ------- | -------------------------------- | ------------- | -------- | -------: | -------: | -------: |
| 15-1252 | Software Developers              | U.S. national | May 2023 | $101,200 | $132,270 | $167,540 |
| 15-1253 | Software QA Analysts and Testers | U.S. national | May 2023 |  $78,470 | $101,800 | $130,630 |

Why the provider is historical: current May 2025 bulk ZIP access was blocked by BLS automated-access controls during this run. OfferLens does not work around access controls or relabel the older verified figures as live. Reports expose “historical/provisional,” sample/access dates, and limitations. A production update should ingest a pinned official bulk release offline, preserve RSE/suppression fields, and use metro → state → national fallbacks.

### OfferLens synthetic demo fixture

Status: implemented, offline, no license dependency.

The demo salary distribution, candidate, role, and GitHub-style evidence are fictional project data under the repository license. Values are structurally realistic but not observations from any labor market. Every consuming report sets `isDemo: true`, names the provider “OfferLens synthetic demo fixture,” and states that it must not guide compensation decisions.

## Occupation mapping

### O\*NET Database 30.3

Status: evaluated; the release uses a small reviewed mapping in code rather than bundling the database.

- Database/downloads: <https://www.onetcenter.org/database.html>
- Crosswalks: <https://www.onetcenter.org/crosswalks.html>
- Database license: <https://www.onetcenter.org/license_db.html>

O*NET 30.3 was current on access. It updates quarterly, with a primary annual release. O*NET-SOC 2019 has an official crosswalk to the 2018 SOC used by OEWS. Downloads include titles, alternate titles, technology/software skills, Job Zones, and crosswalks in several formats.

License: CC BY 4.0, requiring versioned attribution to the O*NET database and U.S. Department of Labor/ETA, a license link, and disclosure of modifications. O*NET trademark rules apply.

Planned mapping: `job title → O*NET-SOC → official crosswalk → 2018 SOC`, with version, method, confidence, and user correction stored. Demographic and work-style variables will not enter fit or compensation calculations.

## Evaluated U.S. sources

### CareerOneStop API

- Overview: <https://www.careeronestop.org/Developers/WebAPI/web-api.aspx>
- Explorer/registration: <https://api.careeronestop.org/api-explorer/>
- Compare Salaries: <https://api.careeronestop.org/api-explorer/home/index/CompareSalaries_GetSalariesByOccupations>

Sponsored by the U.S. Department of Labor/ETA. Its salary pages attribute data to BLS OEWS and identified May 2025 on access. The REST API requires registered user ID and bearer token and returns occupation/location low, median, high, year, and annual/hourly values.

Limitation: the exact semantic mapping of `low`/`high` to OEWS percentiles was not verified, so OfferLens would not relabel them P10/P90 without endpoint metadata. Recommended only as an optional credentialed facade over pinned BLS data.

### Census ACS PUMS

- API: <https://www.census.gov/data/developers/data-sets/census-microdata-api.ACS_1-Year_PUMS.html>
- Access: <https://www.census.gov/programs-surveys/acs/microdata/access.html>
- Documentation: <https://www.census.gov/programs-surveys/acs/microdata/documentation.html>

Latest listed 1-year vintage was 2024. State and PUMA microdata can support weighted custom estimates, but credible use needs survey weighting, uncertainty, minimum-sample rules, and occupation harmonization. From 2026-07-09, Census announced API keys for queries. Terms prohibit re-identification and require a non-endorsement notice.

Not recommended as the initial salary baseline. If added, protected fields must be discarded and age/graduation dates must never proxy experience.

### DOL OFLC disclosure data

- Performance/disclosure downloads: <https://www.dol.gov/agencies/eta/foreign-labor/performance>
- H-1B wage context: <https://www.dol.gov/agencies/whd/laws-and-regulations/laws/ina/h1b>

Newest posted data on access was FY2026 Q2. Rows are employer-filed applications, not proof of hire or observed compensation. Visa selection bias, amendments/duplicates, status differences, ranges, and units make this context-only. A precise redistribution license for all artifacts was not verified. It must never replace OEWS percentiles.

## Evaluated international sources

### UK Office for National Statistics — ASHE

- 2025 provisional bulletin: <https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2025>
- 4-digit occupation Table 14: <https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14>
- Region × occupation Table 15: <https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/regionbyoccupation4digitsoc2010ashetable15>
- Reuse terms: <https://www.ons.gov.uk/help/terms-conditions>
- SOC 2020: <https://www.ons.gov.uk/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020>

The 2025 provisional release covers a pay period including 2025-04-30 and was published 2025-10-23. ASHE is an employer survey based on a 1% employee sample (about 174,000 achieved in 2025). Workbooks include means, medians, percentiles, coefficients of variation, and suppression/quality markers.

License: most ONS statistical material is reusable under Open Government Licence 3.0 with attribution, subject to third-party exceptions.

Recommended as the second-country provider. It must preserve provisional/correction/suppression and CV metadata and must not relabel generic gross annual earnings as pure base salary.

### Eurostat Structure of Earnings Survey

- Overview: <https://ec.europa.eu/eurostat/web/labour-market/information-data/earnings>
- Metadata: <https://ec.europa.eu/eurostat/cache/metadata/en/earn_ses_main_esms.htm>
- API: <https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/api>
- Reuse: <https://ec.europa.eu/eurostat/help/copyright-notice>

Latest reference year is 2022; the survey is every four years. Public occupational tables are mainly ISCO-08 one-digit because of disclosure controls. Gross earnings can include irregular pay, extra months, bonuses, and benefits in kind. Coverage/methods vary and enterprises generally have at least ten employees.

The API is free without a key and reuse is permitted with attribution and modification disclosure, subject to exceptions. Detail and freshness are too weak for a role-specific asking range; use only as broad context or return insufficient data.

### European Central Bank EXR

- Rates: <https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html>
- API: <https://data.ecb.europa.eu/help/api/data>
- Reuse: <https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html>

ECB publishes working-day EUR reference rates, normally around 16:00 CET. They are informational rather than transaction quotes. Statistical data is reusable with source attribution; derived data must be identified.

Planned conversion: `target = source / source_per_EUR × target_per_EUR`. Reports must store source/target currencies, rate, rate date, retrieval date, and label the result derived by OfferLens.

## Competitive landscape and excluded proprietary data

Official product pages reviewed:

- Jobscan résumé matcher and published checks: <https://www.jobscan.co/resume-matcher>
- Teal job matcher: <https://help.tealhq.com/en/articles/12060992-using-the-job-matcher>
- Levels.fyi software-engineer compensation and terms: <https://www.levels.fyi/t/software-engineer/locations/united-states>, <https://www.levels.fyi/about/terms.html>
- Payscale salary report and methodology: <https://www.payscale.com/salary>, <https://www.payscale.com/why-payscale/data-methodology>

The market generally separates résumé/ATS matching from compensation/negotiation. OfferLens combines them through versioned evidence and official baselines. Levels.fyi terms restrict scraping/automated downloading and use to build competing products; Payscale data is proprietary. Neither dataset is ingested without an explicit future license.

## Non-negotiable ingestion rules

- Never turn suppression markers into zero or impute missing percentiles silently.
- Never call gross wage/earnings pure base salary unless the source definition supports it.
- Never apply employee datasets authoritatively to contractors/self-employed workers.
- Keep baseline, bounded positioning, and asking range separate.
- Pin data and FX versions in the report.
- Exclude protected traits and proxies from every calculation.
- Do not bypass provider access controls, scraping restrictions, or credentials.
