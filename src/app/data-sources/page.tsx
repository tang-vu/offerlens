import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data sources",
  description:
    "Salary and occupation data sources implemented or evaluated by OfferLens, including provenance and limitations.",
};

export default function DataSourcesPage() {
  return (
    <div className="narrow content-page">
      <span className="eyebrow">Source register · accessed 13 August 2026</span>
      <h1 className="display">A number is only as credible as its provenance.</h1>
      <p className="lede">
        OfferLens prefers official, government, open-data, or clearly licensed sources. Demo
        fixtures are visually and structurally separated from real observations.
      </p>
      <div className="prose">
        <h2>Implemented</h2>
        <h3>U.S. Bureau of Labor Statistics — OEWS historical snapshot</h3>
        <p>
          The real provider bundles verified May 2023 U.S. national P25, median, and P75
          observations for Software Developers (SOC 15-1252) and Software Quality Assurance Analysts
          and Testers (SOC 15-1253). BLS material is public domain with attribution requested. It is
          employer-reported occupational cash wage data—not total compensation.
        </p>
        <p>
          <b>Why historical?</b> May 2025 is the current official release, published 15 May 2026,
          but the bulk ZIP could not be retrieved safely during this build because automated access
          was blocked. OfferLens never relabels old figures as current. Reports call the snapshot
          provisional and disclose its age.
        </p>
        <p>
          <a href="https://www.bls.gov/oes/tables.htm">Current OEWS tables ↗</a> ·{" "}
          <a href="https://www.bls.gov/oes/2023/may/oes151252.htm">
            Bundled software-developer observation ↗
          </a>{" "}
          · <a href="https://www.bls.gov/opub/copyright-information.htm">BLS reuse terms ↗</a>
        </p>
        <h3>OfferLens synthetic demo fixture</h3>
        <p>
          A fictional Seattle senior-engineer distribution exercises every report state without
          secrets or network access. It is not derived from BLS or another market provider and is
          always labeled “Demo data” and “synthetic.”
        </p>
        <h2>Occupation mapping</h2>
        <h3>O*NET Database 30.3</h3>
        <p>
          O*NET provides current occupation titles, alternate titles, technology skills, and
          official O*NET-SOC to 2018 SOC crosswalks. The database is CC BY 4.0. A pinned production
          subset is planned; this release uses a deliberately small reviewed mapping in code.
        </p>
        <p>
          <a href="https://www.onetcenter.org/database.html">O*NET database ↗</a> ·{" "}
          <a href="https://www.onetcenter.org/license_db.html">License ↗</a>
        </p>
        <h2>Evaluated next providers</h2>
        <ul>
          <li>
            <b>CareerOneStop:</b> U.S. Department of Labor API facade over OEWS; bearer token
            required.
          </li>
          <li>
            <b>ONS ASHE:</b> strongest next-country provider for UK occupation and regional
            earnings, licensed under the Open Government Licence.
          </li>
          <li>
            <b>Eurostat SES:</b> useful broad EU context, but public occupational detail is
            generally too coarse and the latest reference year is 2022.
          </li>
          <li>
            <b>ECB EXR:</b> replaceable reference-rate provider for explicit, dated currency
            conversions; not configured in this release.
          </li>
          <li>
            <b>DOL OFLC LCA:</b> possible visa-market context, never a substitute for observed
            market percentiles.
          </li>
        </ul>
        <h2>Not ingested</h2>
        <p>
          Levels.fyi and Payscale were reviewed as competitive products. Their salary data is
          proprietary. OfferLens does not scrape or republish it. No website is scraped against its
          terms, and no source is silently used to manufacture a salary range.
        </p>
        <h2>Provider requirements</h2>
        <p>
          Every future provider must preserve occupation code/title and mapping version, geography
          code/title and fallback, reference/publication/access dates, currency and period,
          compensation scope, percentiles, quality or RSE fields, suppression flags, attribution,
          limitations, and any exchange rate with its date.
        </p>
      </div>
    </div>
  );
}
