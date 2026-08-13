import {
  normalizeRoleFamily,
  normalizeSkill,
  redactSensitiveProxies,
} from "@/domain/normalization";
import type { CandidateProfile, ExtractionResult, RoleProfile } from "@/domain/schemas";

const SKILLS = [
  "TypeScript",
  "JavaScript",
  "Node.js",
  "React",
  "Next.js",
  "PostgreSQL",
  "MySQL",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "Terraform",
  "GraphQL",
  "REST APIs",
  "Redis",
  "Kafka",
  "Spark",
  "PyTorch",
  "TensorFlow",
  "CI/CD",
  "testing",
  "Playwright",
  "Cypress",
  "Vitest",
  "Jest",
  "Linux",
  "Git",
] as const;

const preferredPattern = /\b(preferred|nice to have|bonus|ideally|a plus)\b/i;
const hardPattern = /\b(required|must|need|minimum|strong|proficient|experience with|years? of)\b/i;
const bulletPattern = /^\s*(?:[-*•]|\d+[.)])\s*/;

function lines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function excerpt(value: string) {
  return value.slice(0, 500);
}

function findSkills(text: string) {
  const lowered = text.toLowerCase();
  return SKILLS.filter((skill) => {
    const variants = [skill.toLowerCase(), normalizeSkill(skill)];
    return variants.some((value) => lowered.includes(value));
  });
}

function inferSeniority(text: string): CandidateProfile["seniority"] {
  const lowered = text.toLowerCase();
  if (/\bprincipal\b/.test(lowered)) return "principal";
  if (/\bstaff\b/.test(lowered)) return "staff";
  if (/\blead\b/.test(lowered)) return "lead";
  if (/\bsenior|\bsr\.?\b/.test(lowered)) return "senior";
  if (/\bjunior|\bjr\.?\b|entry.level/.test(lowered)) return "junior";
  if (/\bintern(ship)?\b/.test(lowered)) return "intern";
  return "mid";
}

function inferYears(text: string) {
  const values = [...text.matchAll(/\b(\d{1,2})(?:\s*\+)?\s+years?\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => value <= 60);
  return values.length ? Math.max(...values) : undefined;
}

function inferDomains(text: string) {
  const domains = [
    "B2B SaaS",
    "fintech",
    "healthcare",
    "e-commerce",
    "developer tooling",
    "platform engineering",
    "cybersecurity",
    "machine learning",
    "data infrastructure",
    "payments",
  ];
  return domains.filter((domain) => text.toLowerCase().includes(domain.toLowerCase()));
}

function roleTitle(text: string) {
  const candidate = lines(text).find(
    (line) =>
      line.length >= 4 &&
      line.length <= 160 &&
      /(engineer|developer|scientist|analyst|manager|designer|architect|specialist)/i.test(line),
  );
  return candidate?.replace(bulletPattern, "") ?? "Role supplied by user";
}

export function extractDeterministically(input: {
  resumeText: string;
  jobText: string;
  location: string;
  workArrangement: RoleProfile["workArrangement"];
  yearsExperience?: number;
}): ExtractionResult {
  const resumeText = redactSensitiveProxies(input.resumeText);
  const jobText = redactSensitiveProxies(input.jobText);
  const resumeLines = lines(resumeText);
  const jobLines = lines(jobText);
  let evidenceCounter = 0;
  const candidateEvidence: CandidateProfile["evidence"] = [];
  const roleEvidence: RoleProfile["evidence"] = [];
  const addCandidateEvidence = (line: string, fact: string, relevance: string) => {
    const id = `resume-${++evidenceCounter}`;
    candidateEvidence.push({
      id,
      sourceType: "resume",
      sourceIdentifier: `resume:line-${resumeLines.indexOf(line) + 1}`,
      excerpt: excerpt(line),
      structuredFact: fact,
      relevance,
      confidence: 0.78,
      extractionMethod: "deterministic",
    });
    return id;
  };
  const addRoleEvidence = (line: string, fact: string) => {
    const id = `job-${++evidenceCounter}`;
    roleEvidence.push({
      id,
      sourceType: "job",
      sourceIdentifier: `job:line-${jobLines.indexOf(line) + 1}`,
      excerpt: excerpt(line),
      structuredFact: fact,
      relevance: "Defines role scope or requirement",
      confidence: 0.82,
      extractionMethod: "deterministic",
    });
    return id;
  };

  const skills = findSkills(resumeText).map((name) => {
    const line =
      resumeLines.find(
        (item) =>
          item.toLowerCase().includes(name.toLowerCase()) ||
          item.toLowerCase().includes(normalizeSkill(name)),
      ) ?? name;
    const years = inferYears(line);
    return {
      name,
      normalized: normalizeSkill(name),
      years,
      evidenceIds: [
        addCandidateEvidence(
          line,
          `${name}${years ? ` (${years} years stated)` : ""}`,
          `Supports evidence of ${name}`,
        ),
      ],
    };
  });

  const achievementLines = resumeLines
    .filter(
      (line) =>
        bulletPattern.test(line) &&
        /\b(?:\d+(?:\.\d+)?%|\$[\d,.]+|\d+[xX]|\d{2,}\s+(?:users|customers|requests|engineers|teams)|reduced|increased|improved|cut|grew|saved|led|launched|delivered)\b/i.test(
          line,
        ),
    )
    .slice(0, 20);
  const achievements = achievementLines.map((line) => ({
    statement: line.replace(bulletPattern, "").slice(0, 300),
    hasMeasuredOutcome:
      /\b(?:\d+(?:\.\d+)?%|\$[\d,.]+|\d+[xX]|\d{2,}\s+(?:users|customers|requests|engineers|teams))\b/i.test(
        line,
      ),
    evidenceIds: [
      addCandidateEvidence(line, line.replace(bulletPattern, ""), "Supports demonstrated outcomes"),
    ],
  }));
  const candidateTitle = roleTitle(resumeText);
  const candidateRoleFamily = normalizeRoleFamily(candidateTitle);
  const yearsExperience = input.yearsExperience ?? inferYears(resumeText);
  const roleLine = resumeLines.find((line) => line === candidateTitle) ?? candidateTitle;
  const roleEvidenceId = addCandidateEvidence(
    roleLine,
    candidateTitle,
    "Supports role-family and seniority alignment",
  );

  const requirements: RoleProfile["requirements"] = [];
  let section: "hard" | "preferred" = "hard";
  for (const line of jobLines) {
    if (preferredPattern.test(line) && line.length < 80) section = "preferred";
    if (
      /\b(must have|required|requirements|qualifications)\b/i.test(line) &&
      line.length < 80 &&
      !preferredPattern.test(line)
    )
      section = "hard";
    const foundSkills = findSkills(line);
    const minimumYears = inferYears(line);
    const isRequirement =
      bulletPattern.test(line) || hardPattern.test(line) || preferredPattern.test(line);
    if (!isRequirement) continue;
    const kind = preferredPattern.test(line) || section === "preferred" ? "preferred" : "hard";
    if (foundSkills.length) {
      for (const skill of foundSkills) {
        const id = `req-${requirements.length + 1}`;
        requirements.push({
          id,
          label: line.replace(bulletPattern, "").slice(0, 200),
          normalized: normalizeSkill(skill),
          kind,
          category: "skill",
          minimumYears,
          evidenceIds: [addRoleEvidence(line, `${kind} skill: ${skill}`)],
        });
      }
    } else if (minimumYears !== undefined) {
      const id = `req-${requirements.length + 1}`;
      requirements.push({
        id,
        label: line.replace(bulletPattern, "").slice(0, 200),
        normalized: "relevant experience",
        kind,
        category: "experience",
        minimumYears,
        evidenceIds: [addRoleEvidence(line, `${minimumYears} years requested`)],
      });
    } else if (/\b(lead|mentor|senior|staff|principal)\b/i.test(line)) {
      const id = `req-${requirements.length + 1}`;
      requirements.push({
        id,
        label: line.replace(bulletPattern, "").slice(0, 200),
        normalized: "seniority",
        kind,
        category: /mentor/i.test(line) ? "other" : "seniority",
        evidenceIds: [addRoleEvidence(line, line)],
      });
    } else if (preferredPattern.test(line)) {
      const id = `req-${requirements.length + 1}`;
      requirements.push({
        id,
        label: line.replace(bulletPattern, "").slice(0, 200),
        normalized: line.replace(bulletPattern, "").slice(0, 120).toLowerCase(),
        kind,
        category: "other",
        evidenceIds: [addRoleEvidence(line, line)],
      });
    }
  }

  const title = roleTitle(jobText);
  const jobTitleLine = jobLines.find((line) => line === title) ?? title;
  addRoleEvidence(jobTitleLine, title);
  const jobDomains = inferDomains(jobText);
  for (const domain of jobDomains) {
    const domainLine =
      jobLines.find((line) => line.toLowerCase().includes(domain.toLowerCase())) ?? domain;
    const id = `req-${requirements.length + 1}`;
    requirements.push({
      id,
      label: `${domain} domain experience`,
      normalized: normalizeSkill(domain),
      kind: "preferred",
      category: "domain",
      evidenceIds: [addRoleEvidence(domainLine, `${domain} domain`)],
    });
  }

  return {
    provider: "deterministic",
    warnings: [
      "Deterministic extraction is conservative. Review every fact before analysis.",
      ...(requirements.length < 3
        ? ["Few explicit requirements were detected; add or correct them before analysis."]
        : []),
    ],
    candidate: {
      roleFamily: candidateRoleFamily,
      seniority: inferSeniority(candidateTitle),
      yearsExperience,
      skills,
      experiences: [
        {
          role: candidateTitle,
          roleFamily: candidateRoleFamily,
          years: yearsExperience,
          domains: inferDomains(resumeText),
          evidenceIds: [roleEvidenceId],
        },
      ],
      achievements,
      domains: inferDomains(resumeText),
      certifications: [],
      evidence: candidateEvidence,
    },
    role: {
      title,
      roleFamily: normalizeRoleFamily(title),
      seniority: inferSeniority(title),
      location: input.location,
      workArrangement: input.workArrangement,
      requirements: requirements.slice(0, 100),
      responsibilities: jobLines
        .filter(
          (line) =>
            bulletPattern.test(line) &&
            !requirements.some(
              (requirement) => requirement.label === line.replace(bulletPattern, ""),
            ),
        )
        .slice(0, 20)
        .map((line) => line.replace(bulletPattern, "").slice(0, 300)),
      domains: jobDomains,
      evidence: roleEvidence,
    },
  };
}
