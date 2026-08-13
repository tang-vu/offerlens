import type { CandidateProfile, EvidenceRecord, FitResult, RoleProfile } from "@/domain/schemas";
import { normalizeRoleFamily, normalizeSkill } from "@/domain/normalization";

export const SCORING_METHODOLOGY_VERSION = "fit-1.0.0";

const baseWeights = {
  hard: 30,
  experience: 20,
  seniority: 15,
  outcomes: 12,
  domain: 8,
  preferred: 8,
  constraints: 4,
  evidence: 3,
} as const;

const seniorityRank = {
  unknown: 0,
  intern: 1,
  junior: 2,
  mid: 3,
  senior: 4,
  lead: 5,
  staff: 5,
  principal: 6,
} as const;

function evidenceMap(candidate: CandidateProfile, role: RoleProfile) {
  return new Map([...candidate.evidence, ...role.evidence].map((record) => [record.id, record]));
}

function requirementMatches(candidate: CandidateProfile, role: RoleProfile) {
  const candidateSkills = new Set(
    candidate.skills.map((skill) => normalizeSkill(skill.normalized)),
  );
  const evidence = evidenceMap(candidate, role);

  return role.requirements.map((requirement) => {
    let status: "met" | "partial" | "not-present" | "no-evidence" = "no-evidence";
    let ids: string[] = [];
    let explanation = "No relevant evidence was supplied.";

    if (requirement.category === "skill") {
      const skill = candidate.skills.find(
        (item) => normalizeSkill(item.normalized) === normalizeSkill(requirement.normalized),
      );
      if (skill) {
        ids = skill.evidenceIds.filter((id) => evidence.has(id));
        const enoughDepth =
          !requirement.minimumYears || (skill.years ?? 0) >= requirement.minimumYears;
        status = enoughDepth ? "met" : "partial";
        explanation = enoughDepth
          ? `Supplied evidence supports ${requirement.label}.`
          : `${requirement.label} is present, but the requested depth is not evidenced.`;
      } else if (candidateSkills.size > 0) {
        status = "not-present";
        explanation = `${requirement.label} was not present in the supplied skills evidence.`;
      }
    } else if (requirement.category === "experience") {
      if (candidate.yearsExperience === undefined) {
        status = "no-evidence";
      } else if (
        !requirement.minimumYears ||
        candidate.yearsExperience >= requirement.minimumYears
      ) {
        status = "met";
        ids = candidate.experiences.flatMap((item) => item.evidenceIds);
        explanation = `${candidate.yearsExperience} years supplied meets the stated experience threshold.`;
      } else if (candidate.yearsExperience >= requirement.minimumYears * 0.7) {
        status = "partial";
        ids = candidate.experiences.flatMap((item) => item.evidenceIds);
        explanation = `${candidate.yearsExperience} years is close to, but below, the stated ${requirement.minimumYears}-year threshold.`;
      } else {
        status = "not-present";
        explanation = `Supplied experience is below the stated ${requirement.minimumYears}-year threshold.`;
      }
    } else if (requirement.category === "seniority") {
      const candidateRank = seniorityRank[candidate.seniority];
      const roleRank = seniorityRank[role.seniority];
      status =
        candidate.seniority === "unknown"
          ? "no-evidence"
          : candidateRank >= roleRank
            ? "met"
            : candidateRank + 1 === roleRank
              ? "partial"
              : "not-present";
      ids = candidate.experiences.flatMap((item) => item.evidenceIds);
      explanation =
        status === "met"
          ? "The evidenced scope aligns with the role level."
          : "The supplied scope does not fully evidence the requested role level.";
    } else if (requirement.category === "domain") {
      const match = candidate.domains.some(
        (domain) => normalizeSkill(domain) === normalizeSkill(requirement.normalized),
      );
      status = match ? "met" : candidate.domains.length ? "not-present" : "no-evidence";
      ids = match ? candidate.experiences.flatMap((item) => item.evidenceIds) : [];
      explanation = match
        ? `Relevant ${requirement.label} domain evidence was supplied.`
        : "No matching domain evidence was supplied.";
    } else if (requirement.category === "certification") {
      const match = candidate.certifications.some((item) =>
        normalizeSkill(item).includes(normalizeSkill(requirement.normalized)),
      );
      status = match ? "met" : candidate.certifications.length ? "not-present" : "no-evidence";
      explanation = match
        ? "A matching certification was supplied."
        : "No matching certification was supplied.";
    } else if (requirement.category === "constraint") {
      if (!candidate.workAuthorization) {
        status = "no-evidence";
      } else {
        const matches = normalizeSkill(candidate.workAuthorization).includes(
          normalizeSkill(requirement.normalized),
        );
        status = matches ? "met" : "not-present";
        explanation = matches
          ? "The user-confirmed constraint is satisfied."
          : "The user-confirmed constraint does not appear satisfied.";
      }
    }

    return {
      requirementId: requirement.id,
      label: requirement.label,
      kind: requirement.kind,
      status,
      evidenceIds: [...new Set(ids)],
      explanation,
    };
  });
}

const statusValue = { met: 1, partial: 0.55, "not-present": 0, "no-evidence": 0 } as const;

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function activeWeights(role: RoleProfile) {
  const hard = role.requirements.some(
    (r) => r.kind === "hard" && !["experience", "seniority", "constraint"].includes(r.category),
  );
  const preferred = role.requirements.some((r) => r.kind === "preferred");
  const experience =
    role.requirements.some((r) => r.category === "experience") ||
    role.requirements.some((r) => r.minimumYears !== undefined);
  const seniority =
    role.seniority !== "unknown" || role.requirements.some((r) => r.category === "seniority");
  const domain = role.domains.length > 0 || role.requirements.some((r) => r.category === "domain");
  const constraints = role.requirements.some((r) => r.category === "constraint");
  const enabled = {
    hard,
    preferred,
    experience,
    seniority,
    outcomes: true,
    domain,
    constraints,
    evidence: true,
  };
  const total = Object.entries(baseWeights).reduce(
    (sum, [key, value]) => sum + (enabled[key as keyof typeof enabled] ? value : 0),
    0,
  );
  return Object.fromEntries(
    Object.entries(baseWeights).map(([key, value]) => [
      key,
      enabled[key as keyof typeof enabled] ? (value / total) * 100 : 0,
    ]),
  ) as Record<keyof typeof baseWeights, number>;
}

export function computeFit(candidate: CandidateProfile, role: RoleProfile): FitResult {
  const matches = requirementMatches(candidate, role);
  const weights = activeWeights(role);
  const hardMatches = matches.filter(
    (m) =>
      m.kind === "hard" &&
      !role.requirements.some(
        (r) =>
          r.id === m.requirementId &&
          ["experience", "seniority", "constraint"].includes(r.category),
      ),
  );
  const preferredMatches = matches.filter((m) => m.kind === "preferred");
  const experienceMatches = matches.filter((m) =>
    role.requirements.some((r) => r.id === m.requirementId && r.category === "experience"),
  );
  const seniorityMatches = matches.filter((m) =>
    role.requirements.some((r) => r.id === m.requirementId && r.category === "seniority"),
  );
  const constraintMatches = matches.filter((m) =>
    role.requirements.some((r) => r.id === m.requirementId && r.category === "constraint"),
  );

  const roleFamilyAligned =
    normalizeRoleFamily(candidate.roleFamily) === normalizeRoleFamily(role.roleFamily);
  const outcomeScore = candidate.achievements.length
    ? Math.min(
        100,
        45 + candidate.achievements.filter((item) => item.hasMeasuredOutcome).length * 18,
      )
    : 0;
  const domainScore = role.domains.length
    ? (role.domains.filter((domain) =>
        candidate.domains.some((item) => normalizeSkill(item) === normalizeSkill(domain)),
      ).length /
        role.domains.length) *
      100
    : 0;
  const validEvidence = candidate.evidence.filter((record) => record.sourceType !== "salary");
  const evidenceScore = Math.min(
    100,
    average(validEvidence.map((record) => record.confidence * 100)) *
      Math.min(1, validEvidence.length / 6),
  );

  const categoryInputs = [
    [
      "hard",
      "Must-have coverage",
      average(hardMatches.map((m) => statusValue[m.status])) * 100,
      hardMatches,
      "Coverage of explicitly stated hard requirements.",
    ],
    [
      "experience",
      "Relevant experience",
      experienceMatches.length
        ? average(experienceMatches.map((m) => statusValue[m.status])) * 100
        : roleFamilyAligned
          ? 85
          : 35,
      experienceMatches,
      "Relevant years and role-family depth supplied by the candidate.",
    ],
    [
      "seniority",
      "Role and seniority",
      seniorityMatches.length
        ? average(seniorityMatches.map((m) => statusValue[m.status])) * 100
        : roleFamilyAligned && seniorityRank[candidate.seniority] >= seniorityRank[role.seniority]
          ? 90
          : roleFamilyAligned
            ? 60
            : 25,
      seniorityMatches,
      "Alignment between evidenced scope and the role level.",
    ],
    [
      "outcomes",
      "Demonstrated outcomes",
      outcomeScore,
      [],
      "Measured impact is weighted more than responsibility statements.",
    ],
    [
      "domain",
      "Domain relevance",
      domainScore,
      [],
      "Overlap with domains explicitly present in the role evidence.",
    ],
    [
      "preferred",
      "Preferred qualifications",
      average(preferredMatches.map((m) => statusValue[m.status])) * 100,
      preferredMatches,
      "Coverage of qualifications labeled preferred rather than required.",
    ],
    [
      "constraints",
      "Explicit constraints",
      average(constraintMatches.map((m) => statusValue[m.status])) * 100,
      constraintMatches,
      "Only explicit, legally relevant work constraints are considered.",
    ],
    [
      "evidence",
      "Evidence quality",
      evidenceScore,
      [],
      "Completeness and confidence of supplied, attributable evidence.",
    ],
  ] as const;

  const categories = categoryInputs
    .filter(([id]) => weights[id] > 0)
    .map(([id, label, rawScore, categoryMatches, explanation]) => {
      const score = Math.round(Math.max(0, Math.min(100, rawScore)));
      const pointsAvailable = Number(weights[id].toFixed(1));
      return {
        id,
        label,
        weight: pointsAvailable,
        score,
        pointsAwarded: Number(((score / 100) * pointsAvailable).toFixed(1)),
        pointsAvailable,
        explanation,
        evidenceIds: [...new Set(categoryMatches.flatMap((match) => match.evidenceIds))],
      };
    });

  const score = Math.round(categories.reduce((sum, category) => sum + category.pointsAwarded, 0));
  const evidenceCoverage = role.requirements.length
    ? matches.filter((m) => m.status !== "no-evidence").length / role.requirements.length
    : 0.4;
  const confidence = Math.round(
    Math.min(
      95,
      30 +
        evidenceCoverage * 35 +
        Math.min(1, candidate.evidence.length / 8) * 25 +
        (role.evidence.length ? 5 : 0),
    ),
  );

  return {
    score,
    confidence,
    confidenceLevel: confidence >= 75 ? "high" : confidence >= 50 ? "medium" : "low",
    methodologyVersion: SCORING_METHODOLOGY_VERSION,
    categories,
    requirementMatches: matches,
  };
}

export function getEvidenceByIds(records: EvidenceRecord[], ids: string[]) {
  const wanted = new Set(ids);
  return records.filter((record) => wanted.has(record.id));
}
