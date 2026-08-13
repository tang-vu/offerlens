import Link from "next/link";
import { ArrowIcon, CheckIcon, EvidenceIcon, LockIcon } from "@/components/icons";

export default function Home() {
  return (
    <>
      <div className="hero container">
        <section>
          <p className="eyebrow">Role-specific career intelligence</p>
          <h1 className="display">Know your leverage before the interview.</h1>
          <p className="hero-copy">
            OfferLens turns your résumé, a job description, and optional GitHub evidence into an
            explainable fit and compensation report—without pretending an AI can measure your worth.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/analyze">
              Analyze my opportunity <ArrowIcon />
            </Link>
            <Link className="button secondary" href="/demo">
              Explore the demo
            </Link>
          </div>
          <div className="trust-row">
            <span>
              <LockIcon width={15} /> No tracking. Local-first.
            </span>
            <span>
              <EvidenceIcon width={15} /> Every claim cites evidence.
            </span>
            <span>
              <CheckIcon width={15} /> Demo needs no key.
            </span>
          </div>
        </section>
        <aside className="report-preview" aria-label="Sample report preview">
          <div className="preview-header">
            <div>
              <span className="eyebrow">Opportunity brief 01</span>
              <div style={{ fontWeight: 760, marginTop: 7 }}>Senior Platform Engineer</div>
            </div>
            <span className="pill pill-accent">Demo data</span>
          </div>
          <div className="preview-score">
            <div>
              <span className="fine">Evidence-backed fit</span>
              <strong>82</strong>
              <div className="preview-bar">
                <span style={{ width: "82%" }} />
              </div>
            </div>
            <div>
              <span className="fine">Score confidence</span>
              <strong>78%</strong>
              <div className="preview-bar">
                <span style={{ width: "78%", background: "#65736c" }} />
              </div>
            </div>
          </div>
          <div className="rule" style={{ paddingTop: 16 }}>
            <span className="fine">SUPPORTED BASE RANGE · SYNTHETIC</span>
            <div style={{ fontFamily: "var(--serif)", fontSize: "1.7rem", marginTop: 5 }}>
              $128k–$178k
            </div>
          </div>
          <div className="preview-lines">
            <div className="preview-line">
              <b>01</b>
              <span>42% latency reduction tied to role reliability scope</span>
            </div>
            <div className="preview-line">
              <b>02</b>
              <span>Direct TypeScript, Node.js, and PostgreSQL evidence</span>
            </div>
            <div className="preview-line">
              <b>03</b>
              <span>Cross-team leadership with measured outcomes</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="section rule">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A clear path from evidence to action</span>
              <h2 className="display">
                One opportunity.
                <br />
                No black box.
              </h2>
            </div>
            <p>
              Review the facts before any score is calculated. Deterministic application logic
              controls fit and salary positioning; AI can assist with extraction, never invent the
              verdict.
            </p>
          </div>
          <div className="steps">
            <article className="step-card">
              <span className="step-number">01</span>
              <h3>Bring the opportunity</h3>
              <p>
                Upload PDF or DOCX, paste the job description, and optionally add public GitHub
                links. Source documents are treated as untrusted data.
              </p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <h3>Correct the record</h3>
              <p>
                Inspect skills, requirements, evidence excerpts, seniority, and context. Missing
                evidence is labeled—never quietly treated as absence.
              </p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <h3>Use the report</h3>
              <p>
                See weighted fit, honest confidence, salary provenance, leverage, gaps, interview
                preparation, an asking range, and a 30-day plan.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Designed for defensible decisions</span>
              <h2 className="display">Confidence comes from showing the work.</h2>
            </div>
            <p>
              OfferLens is intentionally narrower than a résumé chatbot. It answers what the
              supplied evidence supports for this role, location, and employment context—and what it
              cannot support yet.
            </p>
          </div>
          <div className="principles">
            <article className="principle">
              <h3>Evidence, not adjectives</h3>
              <p>
                Every important claim links to a résumé excerpt, job requirement, public repository
                fact, user confirmation, or attributed salary observation.
              </p>
            </article>
            <article className="principle">
              <h3>Fit is not worth</h3>
              <p>
                Scores are role-specific. Names, schools, photos, graduation dates, protected
                traits, and linguistic style are excluded from decisions.
              </p>
            </article>
            <article className="principle">
              <h3>Salary with provenance</h3>
              <p>
                Market baseline, candidate positioning, and recommended ask stay separate. Units,
                geography, sample date, freshness, and limitations travel with the number.
              </p>
            </article>
            <article className="principle">
              <h3>Privacy by default</h3>
              <p>
                No analytics, advertising, or external AI calls by default. Hosted AI requires
                explicit consent, and raw uploaded files are processed transiently.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="cta-band container">
        <h2>Walk into the conversation with a case—not a guess.</h2>
        <Link className="button" href="/analyze">
          Start an analysis <ArrowIcon />
        </Link>
      </section>
    </>
  );
}
