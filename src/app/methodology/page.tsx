import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How OfferLens extracts evidence, calculates role-specific fit, positions compensation, and limits unfairness.",
};

export default function MethodologyPage() {
  return (
    <div className="narrow content-page">
      <span className="eyebrow">Methodology · fit-1.0.0</span>
      <h1 className="display">A useful score must show where it came from.</h1>
      <p className="lede">
        OfferLens evaluates the fit supported by supplied evidence for one job. It does not rank
        people, predict a hiring decision, or measure intrinsic worth.
      </p>
      <div className="prose">
        <h2>The pipeline</h2>
        <ol>
          <li>
            PDF, DOCX, pasted résumé, and job content are treated as untrusted data and reduced to
            bounded plain text.
          </li>
          <li>
            A deterministic or explicitly consented AI provider extracts facts into strict schemas.
            Unsupported fields are rejected.
          </li>
          <li>
            Skills, role families, seniority, experience, domains, outcomes, requirements, and
            constraints are normalized.
          </li>
          <li>
            Every important fact carries evidence: source type, source ID, excerpt or structured
            fact, relevance, confidence, and extraction method.
          </li>
          <li>
            Versioned deterministic code—not an LLM—calculates fit and compensation positioning.
          </li>
          <li>
            The report explains coverage, uncertainty, salary provenance, leverage, gaps, and next
            actions.
          </li>
        </ol>
        <h2>Fit score</h2>
        <p>
          The current methodology starts with the following maximum weights. If a job does not state
          a category, its weight is redistributed across categories that can be evaluated.
          Candidates are never penalized for an unstated requirement.
        </p>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Base weight</th>
              <th>What earns credit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Must-have coverage</td>
              <td>30</td>
              <td>Direct evidence for hard requirements</td>
            </tr>
            <tr>
              <td>Relevant experience</td>
              <td>20</td>
              <td>Role-family and stated depth</td>
            </tr>
            <tr>
              <td>Role and seniority</td>
              <td>15</td>
              <td>Evidenced scope aligned to the level</td>
            </tr>
            <tr>
              <td>Demonstrated outcomes</td>
              <td>12</td>
              <td>Specific delivery evidence; measured results receive more credit</td>
            </tr>
            <tr>
              <td>Domain relevance</td>
              <td>8</td>
              <td>Overlap only where the job names a domain</td>
            </tr>
            <tr>
              <td>Preferred qualifications</td>
              <td>8</td>
              <td>Evidence for explicitly preferred qualifications</td>
            </tr>
            <tr>
              <td>Explicit constraints</td>
              <td>4</td>
              <td>User-confirmed, legally relevant constraints only</td>
            </tr>
            <tr>
              <td>Evidence quality</td>
              <td>3</td>
              <td>Coverage, confidence, and attributable records</td>
            </tr>
          </tbody>
        </table>
        <p>
          Requirements can be <b>supported</b>, <b>partial</b>, <b>not present in supplied facts</b>
          , or <b>no evidence supplied</b>. The latter two are not claims that a person lacks a
          capability.
        </p>
        <h2>Confidence is separate</h2>
        <p>
          Fit confidence reflects evidence coverage, number of attributable records, extraction
          confidence, and job-source completeness. A high fit score with low confidence means the
          available evidence looks aligned but is too thin for a strong conclusion.
        </p>
        <h2>Compensation</h2>
        <p>
          Salary providers return occupation mapping, geography, sample date, access date, currency,
          period, compensation scope, percentiles, source URL, and limitations. The report separates
          a provider baseline from bounded candidate positioning and the recommended ask. If the
          occupation, geography, or currency cannot be supported, OfferLens returns insufficient
          data.
        </p>
        <p>
          The current candidate adjustment is bounded to ±10%: fit may shift positioning by −4% to
          +7%, and multiple measured outcomes can add 2% when confidence is adequate. Low confidence
          resets the adjustment to zero. This heuristic is transparent and should be recalibrated
          with validated outcome data before high-stakes deployment.
        </p>
        <h2>Fairness boundaries</h2>
        <p>
          OfferLens excludes race, ethnicity, gender, gender identity, age, religion, disability or
          health, sexual orientation, pregnancy or family status, political affiliation, photos, and
          nationality. It also excludes names, schools, addresses, graduation dates, and linguistic
          style as common proxies. Nationality is not used; only explicitly supplied, legally
          relevant work-authorization information may satisfy a job constraint.
        </p>
        <p>
          These exclusions reduce obvious proxy use but cannot make a résumé, job description,
          labor-market dataset, or model free of historical bias. Users must review extracted facts
          and should not use OfferLens as an automated employment decision system.
        </p>
        <h2>Limitations</h2>
        <ul>
          <li>Résumé evidence is selective and self-reported.</li>
          <li>Job descriptions can be incomplete, inflated, inconsistent, or discriminatory.</li>
          <li>
            Open-source work is not available or representative for many excellent candidates.
          </li>
          <li>Government wage data is broad, delayed, and usually excludes equity and benefits.</li>
          <li>
            Prompt injection cannot be completely eliminated; the architecture limits its authority.
          </li>
          <li>A report is decision support, not legal, financial, tax, or employment advice.</li>
        </ul>
        <p>
          <Link href="/data-sources">Inspect the data-source register →</Link>
        </p>
      </div>
    </div>
  );
}
