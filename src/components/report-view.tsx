"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { EvidenceRecord, Report } from "@/domain/schemas";
import { ArrowIcon, PrintIcon, TrashIcon } from "@/components/icons";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function confidenceLabel(value: number) {
  return value >= 75 ? "High" : value >= 50 ? "Medium" : "Low";
}

const statusCopy = {
  met: "Supported",
  partial: "Partial",
  "not-present": "Not present",
  "no-evidence": "No evidence supplied",
};

function EvidenceRefs({ ids, evidence }: { ids: string[]; evidence: Map<string, EvidenceRecord> }) {
  if (!ids.length) return <span className="no-evidence">No linked evidence</span>;
  return (
    <span className="evidence-refs">
      {ids.map((id) => (
        <a key={id} href={`#evidence-${id}`}>
          {id}
          {evidence.has(id) ? "" : " (missing)"}
        </a>
      ))}
    </span>
  );
}

export function ReportView({
  report,
  allowDelete = false,
}: {
  report: Report;
  allowDelete?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const allEvidence = [...report.candidate.evidence, ...report.role.evidence];
  const evidence = new Map(allEvidence.map((record) => [record.id, record]));
  const biggestRisk = report.gaps.critical[0] ??
    report.gaps.important[0] ??
    report.gaps.optional[0] ?? {
      title: "Evidence specificity",
      detail: "Strengthen role-specific measured examples.",
      evidenceIds: [],
    };
  const salary = report.salary;

  async function deleteAnalysis() {
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("The report could not be deleted. Try again.");
      router.push("/?deleted=1");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Deletion failed.");
      setDeleting(false);
    }
  }

  return (
    <article className="report-page">
      <div className="report-toolbar no-print">
        <div>
          <Link href="/" className="brand">
            <span className="brand-mark">OL</span>OfferLens
          </Link>
          <span className="toolbar-divider" />
          <span className="fine">Job Fit Report</span>
        </div>
        <div>
          {report.demo && <span className="pill pill-accent">Demo data · synthetic</span>}
          <button className="button secondary" type="button" onClick={() => window.print()}>
            <PrintIcon /> Print / Save as PDF
          </button>
          {allowDelete ? (
            <button
              className="button danger"
              type="button"
              onClick={() => dialogRef.current?.showModal()}
            >
              <TrashIcon /> Delete analysis
            </button>
          ) : (
            <Link className="button" href="/analyze">
              Analyze my opportunity <ArrowIcon />
            </Link>
          )}
        </div>
      </div>

      <header className="report-hero container">
        <div className="report-kicker">
          <span className="eyebrow">
            Opportunity intelligence ·{" "}
            {new Date(report.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="pill">Method {report.methodologyVersion}</span>
        </div>
        <div className="report-title-row">
          <div>
            <h1 className="display">{report.role.title}</h1>
            <p>
              {report.role.location} · {report.role.workArrangement} ·{" "}
              {report.candidate.yearsExperience
                ? `${report.candidate.yearsExperience} years supplied`
                : "Years not supplied"}
            </p>
          </div>
          {report.demo && (
            <div className="demo-stamp">
              <b>DEMO</b>
              <span>
                Fictional candidate
                <br />
                Synthetic salary fixture
              </span>
            </div>
          )}
        </div>

        <section className="report-summary-grid" aria-label="Executive report summary">
          <div className="fit-block print-break-avoid">
            <span className="metric-label">Evidence-backed fit</span>
            <div className="fit-value">
              <strong>{report.fit.score}</strong>
              <span>/100</span>
            </div>
            <div
              className="score-track"
              role="meter"
              aria-label={`Job fit score ${report.fit.score} out of 100`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={report.fit.score}
            >
              <span style={{ width: `${report.fit.score}%` }} />
            </div>
            <p>For this role only. Displayed as an integer; category uncertainty remains.</p>
          </div>
          <div className="confidence-block print-break-avoid">
            <span className="metric-label">Score confidence</span>
            <div className="confidence-value">
              <strong>{report.fit.confidence}%</strong>
              <span>{confidenceLabel(report.fit.confidence)}</span>
            </div>
            <p>
              Separate from fit. Based on evidence coverage, extraction confidence, and source
              completeness.
            </p>
          </div>
          <div className="salary-summary print-break-avoid">
            <span className="metric-label">Supported market baseline</span>
            {salary.marketRange ? (
              <>
                <strong>
                  {money(salary.marketRange.low, salary.currency)}–
                  {money(salary.marketRange.high, salary.currency)}
                </strong>
                <span>
                  {salary.compensationType} · {salary.period} · {salary.currency}
                </span>
              </>
            ) : (
              <strong className="insufficient">Insufficient reliable data</strong>
            )}
            <p>
              {salary.providerLabel}
              <br />
              {salary.freshness}
            </p>
          </div>
          <div className="ask-summary print-break-avoid">
            <span className="metric-label">Recommended asking range</span>
            {salary.recommendedRange ? (
              <>
                <strong>
                  {money(salary.recommendedRange.low, salary.currency)}–
                  {money(salary.recommendedRange.high, salary.currency)}
                </strong>
                <span>
                  {salary.compensationType} · {salary.period}
                </span>
              </>
            ) : (
              <strong className="insufficient">Do not anchor yet</strong>
            )}
            <p>
              {salary.adjustment.percent === 0
                ? "No candidate adjustment applied."
                : `${salary.adjustment.percent > 0 ? "+" : ""}${salary.adjustment.percent}% bounded positioning adjustment.`}
            </p>
          </div>
        </section>

        <section className="leverage-strip">
          <div className="leverage-title">
            <span className="eyebrow">Your strongest leverage</span>
            <p>{report.executiveSummary}</p>
          </div>
          <ol>
            {report.strengths.slice(0, 3).map((strength, index) => (
              <li key={`${strength.title}-${index}`}>
                <span>0{index + 1}</span>
                <div>
                  <b>{strength.title}</b>
                  <p>{strength.detail}</p>
                  <EvidenceRefs ids={strength.evidenceIds} evidence={evidence} />
                </div>
              </li>
            ))}
          </ol>
          <div className="risk-callout">
            <span className="eyebrow">Biggest risk</span>
            <b>{biggestRisk.title}</b>
            <p>{biggestRisk.detail}</p>
          </div>
        </section>
      </header>

      <div className="report-layout container">
        <nav className="report-nav no-print" aria-label="Report sections">
          <span className="eyebrow">In this report</span>
          {[
            ["coverage", "Requirements"],
            ["compensation", "Compensation"],
            ["evidence", "Evidence"],
            ["prepare", "Interview plan"],
            ["method", "How calculated"],
          ].map(([id, label]) => (
            <a href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
        <div className="report-content">
          <section id="coverage" className="report-section">
            <div className="report-section-heading">
              <span className="section-index">01</span>
              <div>
                <span className="eyebrow">Requirements coverage</span>
                <h2>What is supported—and what is not.</h2>
                <p>
                  “No evidence supplied” is intentionally different from “not present.” Neither
                  proves the candidate lacks the capability.
                </p>
              </div>
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              aria-label="Scrollable requirements coverage table"
            >
              <table className="coverage-table">
                <caption>Candidate evidence matched against explicit job requirements</caption>
                <thead>
                  <tr>
                    <th scope="col">Requirement</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Status</th>
                    <th scope="col">Why</th>
                    <th scope="col">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {report.fit.requirementMatches.map((match) => (
                    <tr key={match.requirementId}>
                      <th scope="row">{match.label}</th>
                      <td>{match.kind === "hard" ? "Must-have" : "Preferred"}</td>
                      <td>
                        <span className={`status status-${match.status}`}>
                          {statusCopy[match.status]}
                        </span>
                      </td>
                      <td>{match.explanation}</td>
                      <td>
                        <EvidenceRefs ids={match.evidenceIds} evidence={evidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="gap-columns">
              <GapColumn
                title="Critical gaps"
                items={report.gaps.critical}
                evidence={evidence}
                empty="No unsupported must-have was detected."
              />
              <GapColumn
                title="Important gaps"
                items={report.gaps.important}
                evidence={evidence}
                empty="No partial requirement was detected."
              />
              <GapColumn
                title="Optional gaps"
                items={report.gaps.optional}
                evidence={evidence}
                empty="No unmet preference was detected."
              />
            </div>
          </section>

          <section id="compensation" className="report-section">
            <div className="report-section-heading">
              <span className="section-index">02</span>
              <div>
                <span className="eyebrow">Compensation positioning</span>
                <h2>Baseline first. Positioning second.</h2>
                <p>
                  Base/gross cash compensation is kept separate from bonus, equity, and total
                  compensation.
                </p>
              </div>
            </div>
            {salary.percentiles ? (
              <div className="salary-figure print-break-avoid">
                <div className="salary-legend">
                  <span>
                    <i className="p25" /> Market P25
                  </span>
                  <span>
                    <i className="p50" /> Market median
                  </span>
                  <span>
                    <i className="p75" /> Market P75
                  </span>
                  <span>
                    <i className="ask" /> Recommended ask
                  </span>
                </div>
                <div className="salary-axis" aria-hidden="true">
                  <span className="point p25" style={{ left: "10%" }} />
                  <span className="point p50" style={{ left: "50%" }} />
                  <span className="point p75" style={{ left: "90%" }} />
                  <span className="ask-range" style={{ left: "58%", width: "25%" }} />
                </div>
                <table className="salary-table">
                  <caption>Compensation values represented in the distribution</caption>
                  <thead>
                    <tr>
                      <th scope="col">P25</th>
                      <th scope="col">P50 median</th>
                      <th scope="col">P75</th>
                      <th scope="col">Recommended ask</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{money(salary.percentiles.p25, salary.currency)}</td>
                      <td>{money(salary.percentiles.p50, salary.currency)}</td>
                      <td>{money(salary.percentiles.p75, salary.currency)}</td>
                      <td>
                        {salary.recommendedRange
                          ? `${money(salary.recommendedRange.low, salary.currency)}–${money(salary.recommendedRange.high, salary.currency)}`
                          : "Not supported"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="insufficient-state">
                <b>Insufficient reliable market data for this combination</b>
                <p>{salary.limitations.join(" ")}</p>
              </div>
            )}
            <div className="provenance-grid">
              <div>
                <span className="metric-label">Market baseline</span>
                <h3>{salary.occupationTitle}</h3>
                <dl>
                  <dt>Provider</dt>
                  <dd>{salary.providerLabel}</dd>
                  <dt>Occupation code</dt>
                  <dd>{salary.occupationCode ?? "No mapping"}</dd>
                  <dt>Geography</dt>
                  <dd>{salary.geography}</dd>
                  <dt>Sample date</dt>
                  <dd>{salary.sampleDate}</dd>
                  <dt>Accessed</dt>
                  <dd>{salary.accessedDate}</dd>
                </dl>
                {salary.sourceUrl && (
                  <a href={salary.sourceUrl} target="_blank" rel="noreferrer">
                    Open primary source ↗
                  </a>
                )}
              </div>
              <div>
                <span className="metric-label">Candidate positioning</span>
                <h3>
                  {salary.adjustment.percent > 0 ? "+" : ""}
                  {salary.adjustment.percent}% adjustment
                </h3>
                {salary.adjustment.reasons.length ? (
                  <ul>
                    {salary.adjustment.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No candidate-specific adjustment was supported.</p>
                )}
                <p className="fine">
                  Adjustments are bounded to ±10% in the current implementation, below the schema’s
                  absolute ±15% limit.
                </p>
              </div>
            </div>
            {salary.isDemo && (
              <div className="demo-warning">
                <b>Synthetic demo compensation</b>
                <p>
                  These values are fictional and exercise the report interface. They are not live
                  market evidence and must not be used for a compensation decision.
                </p>
              </div>
            )}
          </section>

          <section id="evidence" className="report-section">
            <div className="report-section-heading">
              <span className="section-index">03</span>
              <div>
                <span className="eyebrow">Evidence ledger</span>
                <h2>Inspect every supporting record.</h2>
                <p>
                  Excerpts are deliberately short. GitHub evidence reflects metadata and
                  repository-quality signals, never popularity as a proxy for ability.
                </p>
              </div>
            </div>
            <div className="ledger">
              {allEvidence.map((record) => (
                <article
                  id={`evidence-${record.id}`}
                  key={record.id}
                  className="ledger-item print-break-avoid"
                >
                  <div>
                    <span className="pill">{record.sourceType}</span>
                    <code>{record.id}</code>
                  </div>
                  <q>{record.excerpt}</q>
                  <p>{record.structuredFact}</p>
                  <dl>
                    <dt>Relevance</dt>
                    <dd>{record.relevance}</dd>
                    <dt>Confidence</dt>
                    <dd>{Math.round(record.confidence * 100)}%</dd>
                    <dt>Method</dt>
                    <dd>{record.extractionMethod}</dd>
                    <dt>Source ID</dt>
                    <dd>{record.sourceIdentifier}</dd>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section id="prepare" className="report-section">
            <div className="report-section-heading">
              <span className="section-index">04</span>
              <div>
                <span className="eyebrow">Prepare the conversation</span>
                <h2>Turn evidence into a clear case.</h2>
                <p>
                  Use only examples you can substantiate. Adapt the wording so it sounds like you.
                </p>
              </div>
            </div>
            <div className="prep-grid">
              <div>
                <h3>Interview talking points</h3>
                {report.interviewTalkingPoints.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <b>{item.title}</b>
                    <p>{item.detail}</p>
                    <EvidenceRefs ids={item.evidenceIds} evidence={evidence} />
                  </article>
                ))}
              </div>
              <div>
                <h3>Salary-expectation answer</h3>
                <blockquote>{report.salaryExpectationAnswer}</blockquote>
                <h3>Negotiation script</h3>
                <blockquote>{report.negotiationScript}</blockquote>
              </div>
            </div>
            <div className="plan">
              <h3>A realistic 30-day improvement plan</h3>
              {report.improvementPlan.map((item) => (
                <article key={item.timeframe}>
                  <span>{item.timeframe}</span>
                  <div>
                    <b>{item.action}</b>
                    <p>{item.outcome}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="method" className="report-section">
            <div className="report-section-heading">
              <span className="section-index">05</span>
              <div>
                <span className="eyebrow">How this was calculated</span>
                <h2>A score you can audit.</h2>
                <p>
                  Category weights are redistributed when the job does not state a category. The
                  final integer is a readable summary, not scientific precision.
                </p>
              </div>
            </div>
            <div className="score-categories">
              {report.fit.categories.map((category) => (
                <article key={category.id}>
                  <div>
                    <b>{category.label}</b>
                    <span>
                      {category.pointsAwarded} / {category.pointsAvailable} pts
                    </span>
                  </div>
                  <div className="category-track">
                    <span style={{ width: `${category.score}%` }} />
                  </div>
                  <p>{category.explanation}</p>
                  <EvidenceRefs ids={category.evidenceIds} evidence={evidence} />
                </article>
              ))}
            </div>
            <div className="limitations">
              <h3>Limitations and disclaimer</h3>
              <ul>
                {report.limitations.map((limitation, index) => (
                  <li key={`${limitation}-${index}`}>{limitation}</li>
                ))}
              </ul>
              <p>
                <b>Version record:</b> input {report.inputVersion} · scoring{" "}
                {report.methodologyVersion} · salary provider {salary.providerId}
              </p>
            </div>
          </section>
        </div>
      </div>

      {allowDelete && (
        <dialog className="delete-dialog" ref={dialogRef} onClose={() => setDeleteError("")}>
          <form method="dialog">
            <span className="eyebrow">Delete source and report</span>
            <h2>Delete this analysis?</h2>
            <p>
              This permanently removes the retained structured analysis and report from this
              OfferLens instance. Raw file bytes were not retained. This action cannot be undone.
            </p>
            {deleteError && (
              <div className="error" role="alert">
                {deleteError}
              </div>
            )}
            <div>
              <button className="button secondary" value="cancel" autoFocus>
                Keep report
              </button>
              <button
                className="button danger"
                value="confirm"
                type="button"
                disabled={deleting}
                onClick={() => void deleteAnalysis()}
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </article>
  );
}

function GapColumn({
  title,
  items,
  evidence,
  empty,
}: {
  title: string;
  items: Report["strengths"];
  evidence: Map<string, EvidenceRecord>;
  empty: string;
}) {
  return (
    <div>
      <h3>
        {title} <span>{items.length}</span>
      </h3>
      {items.length ? (
        items.map((item) => (
          <article key={`${title}-${item.title}`}>
            <b>{item.title}</b>
            <p>{item.detail}</p>
            <EvidenceRefs ids={item.evidenceIds} evidence={evidence} />
          </article>
        ))
      ) : (
        <p className="empty-note">{empty}</p>
      )}
    </div>
  );
}
