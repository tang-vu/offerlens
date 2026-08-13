"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CandidateProfile, ExtractionResult, RoleProfile } from "@/domain/schemas";
import { ArrowIcon, GithubIcon, LockIcon, UploadIcon } from "@/components/icons";

const steps = ["Sources", "Context", "Review", "Analyze"];
type WorkArrangement = RoleProfile["workArrangement"];

async function jsonRequest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = (await response.json()) as T & { error?: string; detail?: string };
  if (!response.ok) throw new Error(body.error ?? "Request failed.");
  return body;
}

export function AnalysisWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [githubText, setGithubText] = useState("");
  const [location, setLocation] = useState("");
  const [arrangement, setArrangement] = useState<WorkArrangement>("unspecified");
  const [years, setYears] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [period, setPeriod] = useState<"annual" | "monthly">("annual");
  const [consent, setConsent] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult>();
  const [busy, setBusy] = useState<"file" | "url" | "extract" | "analyze">();
  const [error, setError] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wizardRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }, [step]);

  const githubUrls = useMemo(
    () =>
      githubText
        .split(/[,\n]/)
        .map((value) => value.trim())
        .filter(Boolean),
    [githubText],
  );
  const canContinueSources = resumeText.trim().length >= 80 && jobText.trim().length >= 80;
  const canExtract = location.trim().length >= 2;

  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function parseFile(file?: File) {
    if (!file) return;
    setBusy("file");
    setError("");
    setFileLabel(file.name);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/resume/parse", { method: "POST", body: form });
      const body = (await response.json()) as {
        text?: string;
        error?: string;
        truncated?: boolean;
      };
      if (!response.ok || !body.text)
        throw new Error(body.error ?? "The file could not be parsed.");
      setResumeText(body.text);
      if (body.truncated)
        fail("The extracted text reached the 60,000-character limit. Review the pasted result.");
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "The file could not be parsed.");
    } finally {
      setBusy(undefined);
    }
  }

  async function importJob() {
    setBusy("url");
    setError("");
    try {
      const body = await jsonRequest<{ text: string }>("/api/job/import", {
        method: "POST",
        body: JSON.stringify({ url: jobUrl }),
      });
      setJobText(body.text);
    } catch (caught) {
      fail(
        caught instanceof Error
          ? caught.message
          : "Import failed. Paste the job description instead.",
      );
    } finally {
      setBusy(undefined);
    }
  }

  async function extract() {
    setBusy("extract");
    setError("");
    setStep(3);
    try {
      const body = await jsonRequest<ExtractionResult>("/api/extract", {
        method: "POST",
        body: JSON.stringify({
          resumeText,
          jobText,
          location,
          workArrangement: arrangement,
          yearsExperience: years ? Number(years) : undefined,
          githubUrls,
          externalAiConsent: consent,
        }),
      });
      setExtraction(body);
      setStep(2);
    } catch (caught) {
      setStep(1);
      fail(caught instanceof Error ? caught.message : "Extraction failed.");
    } finally {
      setBusy(undefined);
    }
  }

  function updateCandidate(patch: Partial<CandidateProfile>) {
    setExtraction((current) =>
      current ? { ...current, candidate: { ...current.candidate, ...patch } } : current,
    );
  }

  function updateRole(patch: Partial<RoleProfile>) {
    setExtraction((current) =>
      current ? { ...current, role: { ...current.role, ...patch } } : current,
    );
  }

  async function analyze() {
    if (!extraction) return;
    setBusy("analyze");
    setError("");
    setStep(3);
    try {
      const body = await jsonRequest<{ report: { id: string } }>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          candidate: extraction.candidate,
          role: extraction.role,
          currency,
          period,
          salaryProvider: "bls",
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      router.push(`/report/${body.report.id}`);
    } catch (caught) {
      setStep(2);
      fail(caught instanceof Error ? caught.message : "Analysis failed.");
      setBusy(undefined);
    }
  }

  return (
    <div className="wizard-shell" ref={wizardRef}>
      <aside className="wizard-aside">
        <p className="eyebrow">Opportunity analysis</p>
        <h1 className="display">Build your evidence case.</h1>
        <p className="muted">
          Your inputs stay in this flow until you ask OfferLens to analyze them. External AI is
          never called without the consent step.
        </p>
        <ol className="wizard-progress" aria-label="Analysis progress">
          {steps.map((label, index) => (
            <li
              key={label}
              className={index === step ? "active" : index < step ? "complete" : ""}
              aria-current={index === step ? "step" : undefined}
            >
              <span>{index < step ? "✓" : index + 1}</span>
              <div>
                <b>{label}</b>
                <small>
                  {index === 0
                    ? "Résumé and job"
                    : index === 1
                      ? "Role and pay"
                      : index === 2
                        ? "Correct extracted facts"
                        : "Generate report"}
                </small>
              </div>
            </li>
          ))}
        </ol>
        <div className="notice">
          <LockIcon width={16} /> Raw uploads are processed transiently. Only a structured report is
          retained when persistence is configured.
        </div>
      </aside>

      <section className="wizard-main" aria-busy={Boolean(busy)}>
        {error && (
          <div className="error" role="alert" tabIndex={-1} ref={errorRef}>
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="wizard-panel">
            <header>
              <span className="eyebrow">Step 1 of 4</span>
              <h2>Supply the evidence</h2>
              <p>
                Paste text or upload a supported résumé. A public job URL is optional and always has
                a paste fallback.
              </p>
            </header>
            <div className="field">
              <label htmlFor="resume">
                Résumé text <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="resume"
                className="textarea source-textarea"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                maxLength={60_000}
                placeholder="Paste your résumé text here…"
                aria-describedby="resume-help"
              />
              <small id="resume-help" className="fine">
                At least 80 characters. Names, schools, addresses, and graduation dates are not used
                in scoring.
              </small>
            </div>
            <div className="upload-row">
              <label className="button secondary" htmlFor="resume-file">
                <UploadIcon /> {busy === "file" ? "Parsing securely…" : "Choose PDF or DOCX"}
              </label>
              <input
                id="resume-file"
                className="visually-hidden"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => void parseFile(event.target.files?.[0])}
              />
              {fileLabel && <span className="fine">{fileLabel}</span>}
              <span className="fine">5 MB · 40 PDF pages max</span>
            </div>
            <div className="source-divider">
              <span>Job description</span>
            </div>
            <div className="job-import">
              <div className="field">
                <label htmlFor="job-url">
                  Public job URL <span className="muted">(optional)</span>
                </label>
                <input
                  id="job-url"
                  className="input"
                  type="url"
                  value={jobUrl}
                  onChange={(event) => setJobUrl(event.target.value)}
                  placeholder="https://company.example/jobs/role"
                />
              </div>
              <button
                className="button secondary"
                type="button"
                disabled={!jobUrl || busy === "url"}
                onClick={() => void importJob()}
              >
                {busy === "url" ? "Checking…" : "Import"}
              </button>
            </div>
            <div className="field">
              <label htmlFor="job-text">
                Job description text <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="job-text"
                className="textarea source-textarea"
                value={jobText}
                onChange={(event) => setJobText(event.target.value)}
                maxLength={60_000}
                placeholder="Paste the complete job description here…"
                aria-describedby="job-help"
              />
              <small id="job-help" className="fine">
                Include requirements, responsibilities, location, and employment context when
                available.
              </small>
            </div>
            <div className="field">
              <label htmlFor="github">
                <GithubIcon width={15} /> Public GitHub links{" "}
                <span className="muted">(optional)</span>
              </label>
              <textarea
                id="github"
                className="textarea compact"
                value={githubText}
                onChange={(event) => setGithubText(event.target.value)}
                placeholder="https://github.com/username&#10;https://github.com/username/repository"
              />
              <small className="fine">
                Up to five github.com profile or repository URLs. Stars and raw commit counts are
                not treated as proof of ability.
              </small>
            </div>
            <div className="wizard-actions">
              <span className="fine">
                {resumeText.length.toLocaleString()} résumé · {jobText.length.toLocaleString()} job
                characters
              </span>
              <button
                className="button"
                type="button"
                disabled={!canContinueSources}
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
              >
                Continue <ArrowIcon />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-panel">
            <header>
              <span className="eyebrow">Step 2 of 4</span>
              <h2>Add employment context</h2>
              <p>
                Salary evidence is only useful when role geography, currency, and pay period are
                explicit.
              </p>
            </header>
            <div className="form-grid">
              <div className="field wide">
                <label htmlFor="location">
                  Role location <span aria-hidden="true">*</span>
                </label>
                <input
                  id="location"
                  className="input"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Seattle, WA, United States"
                  maxLength={160}
                />
              </div>
              <div className="field">
                <label htmlFor="arrangement">Work arrangement</label>
                <select
                  id="arrangement"
                  className="select"
                  value={arrangement}
                  onChange={(event) => setArrangement(event.target.value as WorkArrangement)}
                >
                  <option value="unspecified">Not specified</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="years">
                  Years of relevant experience <span className="muted">(optional)</span>
                </label>
                <input
                  id="years"
                  className="input"
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={years}
                  onChange={(event) => setYears(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  className="select"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  <option value="USD">USD — US dollar</option>
                  <option value="GBP">GBP — British pound</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="VND">VND — Vietnamese đồng</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="period">Compensation period</label>
                <select
                  id="period"
                  className="select"
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as "annual" | "monthly")}
                >
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="consent-box">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <div>
                <label htmlFor="consent">
                  Allow the configured external AI provider to process résumé and job text
                </label>
                <p>
                  If this server has a hosted provider configured, it receives the text only for
                  structured extraction. Without consent, OfferLens uses deterministic local
                  extraction. Review the host’s privacy terms before enabling this.
                </p>
              </div>
            </div>
            <div className="notice">
              The built-in real salary adapter currently supports verified historical U.S.
              software-developer and QA baselines in USD. Other combinations return “insufficient
              reliable data” instead of converting or inventing a range.
            </div>
            <div className="wizard-actions">
              <button className="button secondary" type="button" onClick={() => setStep(0)}>
                Back
              </button>
              <button
                className="button"
                type="button"
                disabled={!canExtract}
                onClick={() => void extract()}
              >
                Extract facts for review <ArrowIcon />
              </button>
            </div>
          </div>
        )}

        {step === 2 && extraction && (
          <div className="wizard-panel review-panel">
            <header>
              <span className="eyebrow">Step 3 of 4</span>
              <h2>Review the extracted record</h2>
              <p>
                Correct errors now. Original evidence stays visible so you can distinguish an
                extraction issue from missing evidence.
              </p>
            </header>
            {extraction.warnings.length > 0 && (
              <div className="notice">
                <b>Review notes</b>
                <ul>
                  {extraction.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <section className="review-section">
              <div className="review-heading">
                <div>
                  <span className="eyebrow">Candidate profile</span>
                  <h3>What the résumé supports</h3>
                </div>
                <span className="pill">
                  {extraction.candidate.evidence.length} evidence records
                </span>
              </div>
              <div className="form-grid">
                <div className="field wide">
                  <label htmlFor="candidate-role">Role family</label>
                  <input
                    id="candidate-role"
                    className="input"
                    value={extraction.candidate.roleFamily}
                    onChange={(event) => updateCandidate({ roleFamily: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="candidate-seniority">Seniority</label>
                  <select
                    id="candidate-seniority"
                    className="select"
                    value={extraction.candidate.seniority}
                    onChange={(event) =>
                      updateCandidate({
                        seniority: event.target.value as CandidateProfile["seniority"],
                      })
                    }
                  >
                    {[
                      "intern",
                      "junior",
                      "mid",
                      "senior",
                      "lead",
                      "staff",
                      "principal",
                      "unknown",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="candidate-years">Relevant years</label>
                  <input
                    id="candidate-years"
                    className="input"
                    type="number"
                    min="0"
                    max="60"
                    value={extraction.candidate.yearsExperience ?? ""}
                    onChange={(event) =>
                      updateCandidate({
                        yearsExperience: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
              <div className="review-list">
                <h4>Skills</h4>
                {extraction.candidate.skills.length ? (
                  extraction.candidate.skills.map((skill, index) => (
                    <div className="editable-row" key={`${skill.normalized}-${index}`}>
                      <input
                        className="input"
                        aria-label={`Skill ${index + 1}`}
                        value={skill.name}
                        onChange={(event) =>
                          updateCandidate({
                            skills: extraction.candidate.skills.map((item, current) =>
                              current === index
                                ? {
                                    ...item,
                                    name: event.target.value,
                                    normalized: event.target.value.toLowerCase().trim(),
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                      <span className="evidence-link">Evidence {skill.evidenceIds.join(", ")}</span>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() =>
                          updateCandidate({
                            skills: extraction.candidate.skills.filter(
                              (_, current) => current !== index,
                            ),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-note">
                    No skills were extracted. This means no evidence was detected—not that the
                    skills are absent.
                  </p>
                )}
              </div>
              <details className="evidence-details">
                <summary>Inspect candidate evidence excerpts</summary>
                <div className="evidence-grid">
                  {extraction.candidate.evidence.map((record) => (
                    <article key={record.id}>
                      <b>
                        {record.id} · {Math.round(record.confidence * 100)}% extraction confidence
                      </b>
                      <q>{record.excerpt}</q>
                      <p>{record.relevance}</p>
                    </article>
                  ))}
                </div>
              </details>
            </section>
            <section className="review-section">
              <div className="review-heading">
                <div>
                  <span className="eyebrow">Role profile</span>
                  <h3>What the job explicitly asks for</h3>
                </div>
                <span className="pill">{extraction.role.requirements.length} requirements</span>
              </div>
              <div className="form-grid">
                <div className="field wide">
                  <label htmlFor="role-title">Role title</label>
                  <input
                    id="role-title"
                    className="input"
                    value={extraction.role.title}
                    onChange={(event) => updateRole({ title: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="role-family">Role family</label>
                  <input
                    id="role-family"
                    className="input"
                    value={extraction.role.roleFamily}
                    onChange={(event) => updateRole({ roleFamily: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="role-level">Expected seniority</label>
                  <select
                    id="role-level"
                    className="select"
                    value={extraction.role.seniority}
                    onChange={(event) =>
                      updateRole({ seniority: event.target.value as RoleProfile["seniority"] })
                    }
                  >
                    {[
                      "intern",
                      "junior",
                      "mid",
                      "senior",
                      "lead",
                      "staff",
                      "principal",
                      "unknown",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="review-list">
                <h4>Requirements</h4>
                {extraction.role.requirements.length ? (
                  extraction.role.requirements.map((requirement, index) => (
                    <div className="requirement-edit" key={requirement.id}>
                      <input
                        className="input"
                        aria-label={`Requirement ${index + 1}`}
                        value={requirement.label}
                        onChange={(event) =>
                          updateRole({
                            requirements: extraction.role.requirements.map((item, current) =>
                              current === index ? { ...item, label: event.target.value } : item,
                            ),
                          })
                        }
                      />
                      <select
                        className="select"
                        aria-label={`Requirement ${index + 1} priority`}
                        value={requirement.kind}
                        onChange={(event) =>
                          updateRole({
                            requirements: extraction.role.requirements.map((item, current) =>
                              current === index
                                ? { ...item, kind: event.target.value as "hard" | "preferred" }
                                : item,
                            ),
                          })
                        }
                      >
                        <option value="hard">Must-have</option>
                        <option value="preferred">Preferred</option>
                      </select>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() =>
                          updateRole({
                            requirements: extraction.role.requirements.filter(
                              (_, current) => current !== index,
                            ),
                          })
                        }
                      >
                        Remove
                      </button>
                      <span className="evidence-link">
                        {requirement.category} · Evidence {requirement.evidenceIds.join(", ")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="empty-note">
                    No explicit requirements were detected. Return to the job text and include the
                    full requirements section.
                  </p>
                )}
              </div>
              <details className="evidence-details">
                <summary>Inspect job evidence excerpts</summary>
                <div className="evidence-grid">
                  {extraction.role.evidence.map((record) => (
                    <article key={record.id}>
                      <b>
                        {record.id} · {Math.round(record.confidence * 100)}% extraction confidence
                      </b>
                      <q>{record.excerpt}</q>
                      <p>{record.relevance}</p>
                    </article>
                  ))}
                </div>
              </details>
            </section>
            <div className="exclusion-note">
              <b>Excluded from decisions:</b> name, school, address, graduation date, language
              style, and all protected or sensitive characteristics. Work authorization is
              considered only when the user explicitly confirms a legally relevant job constraint.
            </div>
            <div className="wizard-actions">
              <button className="button secondary" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="button"
                type="button"
                disabled={!extraction.role.requirements.length}
                onClick={() => void analyze()}
              >
                Generate Job Fit Report <ArrowIcon />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="loading-state" role="status">
            <div className="loading-mark" aria-hidden="true">
              OL
            </div>
            <span className="eyebrow">
              {busy === "extract" ? "Structured extraction" : "Deterministic analysis"}
            </span>
            <h2>
              {busy === "extract"
                ? "Turning source text into reviewable facts…"
                : "Connecting every conclusion to evidence…"}
            </h2>
            <p>
              {busy === "extract"
                ? "Parsing candidate and role profiles, normalizing skills, and checking optional public metadata."
                : "Scoring stated requirements, selecting an attributed salary baseline, and preparing the report."}
            </p>
            <div className="indeterminate" aria-hidden="true">
              <span />
            </div>
            <small>
              No fabricated completion percentage. This stage usually takes a few seconds.
            </small>
          </div>
        )}
      </section>
    </div>
  );
}
