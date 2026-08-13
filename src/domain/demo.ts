import { buildReport } from "@/domain/report";
import type { CandidateProfile, RoleProfile } from "@/domain/schemas";
import { computeFit } from "@/domain/scoring";
import { DemoSalaryProvider } from "@/domain/salary";

export const DEMO_RESUME_TEXT = `
Maya Chen — Fictional demo candidate
Senior Software Engineer

Eight years building reliable web platforms and internal tools.

Northstar Labs — Senior Software Engineer
- Led a four-engineer migration from a monolith to TypeScript services, reducing p95 API latency by 42% and deployment rollback time from 30 minutes to 6 minutes.
- Designed PostgreSQL data models and introduced contract tests covering the highest-risk billing paths.
- Mentored three engineers and ran architecture reviews across product and platform teams.

Harbor Systems — Software Engineer
- Built React and Node.js workflows used by 18,000 monthly operators.
- Introduced CI/CD quality gates and AWS infrastructure checks, cutting escaped defects by 28%.

Skills: TypeScript, React, Node.js, PostgreSQL, AWS, Docker, CI/CD, REST APIs, system design, testing.
Public work: Maintains "queue-scope," a fictional Apache-2.0 TypeScript diagnostics library with documentation, tests, releases, and recent maintainer activity.
`;

export const DEMO_JOB_TEXT = `
Senior Software Engineer — Platform, Meridian Works (fictional)
Seattle, WA · Hybrid

We are looking for a senior software engineer to improve the reliability and developer experience of our multi-tenant B2B platform.

Must have:
- 6+ years of professional software engineering experience.
- Strong TypeScript and Node.js experience.
- Production PostgreSQL data modeling and API design.
- Evidence of leading cross-team technical projects with measured outcomes.
- Experience with AWS and automated testing.

Preferred:
- Kubernetes experience.
- Developer tooling or platform engineering background.
- Experience mentoring engineers.

You will lead reliability initiatives, shape technical direction, partner with product teams, and improve deployment safety. Hybrid presence in Seattle two days per week is required.
`;

export const demoCandidate: CandidateProfile = {
  roleFamily: "software engineering",
  seniority: "senior",
  yearsExperience: 8,
  skills: [
    ["TypeScript", "typescript", 6, "r-skill-ts"],
    ["Node.js", "node.js", 6, "r-skill-node"],
    ["React", "react", 5, "r-skill-react"],
    ["PostgreSQL", "postgresql", 5, "r-skill-pg"],
    ["AWS", "aws", 4, "r-skill-aws"],
    ["Docker", "docker", 4, "r-skill-docker"],
    ["CI/CD", "ci/cd", 5, "r-outcome-quality"],
    ["Automated testing", "testing", 6, "r-testing"],
  ].map(([name, normalized, years, evidenceId]) => ({
    name: String(name),
    normalized: String(normalized),
    years: Number(years),
    evidenceIds: [String(evidenceId)],
  })),
  experiences: [
    {
      role: "Senior Software Engineer",
      roleFamily: "software engineering",
      years: 4,
      domains: ["B2B SaaS", "platform engineering"],
      evidenceIds: ["r-role-senior", "r-outcome-latency"],
    },
    {
      role: "Software Engineer",
      roleFamily: "software engineering",
      years: 4,
      domains: ["operations software"],
      evidenceIds: ["r-role-engineer", "r-outcome-quality"],
    },
  ],
  achievements: [
    {
      statement:
        "Reduced p95 API latency by 42% and rollback time from 30 minutes to 6 minutes while leading a four-engineer migration.",
      hasMeasuredOutcome: true,
      evidenceIds: ["r-outcome-latency"],
    },
    {
      statement: "Introduced CI/CD quality gates that cut escaped defects by 28%.",
      hasMeasuredOutcome: true,
      evidenceIds: ["r-outcome-quality"],
    },
    {
      statement: "Mentored three engineers and facilitated cross-team architecture reviews.",
      hasMeasuredOutcome: true,
      evidenceIds: ["r-mentoring"],
    },
  ],
  domains: ["B2B SaaS", "platform engineering", "developer tooling"],
  certifications: [],
  evidence: [
    {
      id: "r-role-senior",
      sourceType: "resume",
      sourceIdentifier: "demo-resume:experience-1",
      excerpt: "Northstar Labs — Senior Software Engineer",
      structuredFact: "Four years at senior scope",
      relevance: "Supports seniority and relevant experience",
      confidence: 0.96,
      extractionMethod: "deterministic",
    },
    {
      id: "r-role-engineer",
      sourceType: "resume",
      sourceIdentifier: "demo-resume:experience-2",
      excerpt: "Harbor Systems — Software Engineer",
      structuredFact: "Four years in software engineering",
      relevance: "Supports total relevant experience",
      confidence: 0.94,
      extractionMethod: "deterministic",
    },
    {
      id: "r-outcome-latency",
      sourceType: "resume",
      sourceIdentifier: "demo-resume:achievement-1",
      excerpt:
        "reducing p95 API latency by 42% and deployment rollback time from 30 minutes to 6 minutes",
      structuredFact: "Measured reliability impact while leading a migration",
      relevance: "Direct evidence of technical leadership and outcomes",
      confidence: 0.98,
      extractionMethod: "deterministic",
    },
    {
      id: "r-outcome-quality",
      sourceType: "resume",
      sourceIdentifier: "demo-resume:achievement-2",
      excerpt: "cutting escaped defects by 28%",
      structuredFact: "Measured quality improvement through CI/CD",
      relevance: "Supports delivery quality and automation",
      confidence: 0.98,
      extractionMethod: "deterministic",
    },
    {
      id: "r-mentoring",
      sourceType: "resume",
      sourceIdentifier: "demo-resume:achievement-3",
      excerpt: "Mentored three engineers and ran architecture reviews",
      structuredFact: "Mentoring and cross-team architecture leadership",
      relevance: "Supports preferred mentoring qualification",
      confidence: 0.94,
      extractionMethod: "deterministic",
    },
    ...[
      ["r-skill-ts", "TypeScript", "TypeScript services"],
      ["r-skill-node", "Node.js", "Node.js workflows"],
      ["r-skill-react", "React", "Built React and Node.js workflows"],
      ["r-skill-pg", "PostgreSQL", "Designed PostgreSQL data models"],
      ["r-skill-aws", "AWS", "AWS infrastructure checks"],
      ["r-skill-docker", "Docker", "Skills: Docker"],
      ["r-testing", "Automated testing", "introduced contract tests"],
    ].map(([id, fact, excerpt]) => ({
      id: id!,
      sourceType: "resume" as const,
      sourceIdentifier: `demo-resume:${id}`,
      excerpt: excerpt!,
      structuredFact: fact!,
      relevance: `Supports ${fact} requirement`,
      confidence: 0.93,
      extractionMethod: "deterministic" as const,
    })),
    {
      id: "g-quality",
      sourceType: "github",
      sourceIdentifier: "github.com/demo/queue-scope",
      excerpt: "TypeScript · README · tests · 7 tagged releases · updated 18 days ago",
      structuredFact:
        "Maintained public TypeScript project with documentation, tests, releases, and recent activity",
      relevance:
        "Corroborates developer tooling and software quality evidence; popularity is not treated as ability",
      confidence: 0.86,
      extractionMethod: "github-api",
    },
  ],
};

export const demoRole: RoleProfile = {
  title: "Senior Software Engineer — Platform",
  roleFamily: "software engineering",
  seniority: "senior",
  location: "Seattle, WA, United States",
  workArrangement: "hybrid",
  requirements: [
    ["j-exp", "6+ years of software engineering", "software engineering", "hard", "experience", 6],
    ["j-ts", "Strong TypeScript", "typescript", "hard", "skill", 3],
    ["j-node", "Strong Node.js", "node.js", "hard", "skill", 3],
    ["j-pg", "Production PostgreSQL data modeling", "postgresql", "hard", "skill", 2],
    ["j-lead", "Cross-team technical leadership", "senior", "hard", "seniority", undefined],
    ["j-aws", "AWS", "aws", "hard", "skill", 1],
    ["j-test", "Automated testing", "testing", "hard", "skill", 2],
    ["j-k8s", "Kubernetes", "kubernetes", "preferred", "skill", undefined],
    [
      "j-platform",
      "Platform engineering",
      "platform engineering",
      "preferred",
      "domain",
      undefined,
    ],
    ["j-mentor", "Mentoring engineers", "mentoring", "preferred", "other", undefined],
  ].map(([id, label, normalized, kind, category, minimumYears]) => ({
    id: String(id),
    label: String(label),
    normalized: String(normalized),
    kind: kind as "hard" | "preferred",
    category: category as "skill" | "experience" | "seniority" | "domain" | "other",
    minimumYears: minimumYears === undefined ? undefined : Number(minimumYears),
    evidenceIds: [`${id}-e`],
  })),
  responsibilities: [
    "Lead reliability initiatives",
    "Shape technical direction",
    "Partner with product teams",
    "Improve deployment safety",
  ],
  domains: ["B2B SaaS", "platform engineering"],
  evidence: [
    ["j-exp-e", "6+ years of professional software engineering experience"],
    ["j-ts-e", "Strong TypeScript and Node.js experience"],
    ["j-node-e", "Strong TypeScript and Node.js experience"],
    ["j-pg-e", "Production PostgreSQL data modeling and API design"],
    ["j-lead-e", "Evidence of leading cross-team technical projects with measured outcomes"],
    ["j-aws-e", "Experience with AWS and automated testing"],
    ["j-test-e", "Experience with AWS and automated testing"],
    ["j-k8s-e", "Preferred: Kubernetes experience"],
    ["j-platform-e", "Developer tooling or platform engineering background"],
    ["j-mentor-e", "Experience mentoring engineers"],
  ].map(([id, excerpt]) => ({
    id: id!,
    sourceType: "job" as const,
    sourceIdentifier: `demo-job:${id}`,
    excerpt: excerpt!,
    structuredFact: excerpt!,
    relevance: "Defines an explicit role requirement",
    confidence: 0.98,
    extractionMethod: "deterministic" as const,
  })),
};

export async function createDemoReport() {
  const fit = computeFit(demoCandidate, demoRole);
  const salary = await new DemoSalaryProvider().getEstimate({
    candidate: demoCandidate,
    role: demoRole,
    fit,
    currency: "USD",
    period: "annual",
  });
  return buildReport({
    id: "demo-maya-meridian",
    createdAt: "2026-08-13T00:00:00.000Z",
    demo: true,
    candidate: demoCandidate,
    role: demoRole,
    fit,
    salary,
  });
}
