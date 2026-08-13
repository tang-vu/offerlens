import type {
  CandidateProfile,
  FitResult,
  Report,
  RoleProfile,
  SalaryEstimate,
} from "@/domain/schemas";

function topEvidenceIds(candidate: CandidateProfile, count = 2) {
  return candidate.evidence
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, count)
    .map((record) => record.id);
}

function money(value: number | undefined, currency: string, period: string) {
  if (value === undefined) return "an evidence-backed range";
  return `${new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)} ${period}`;
}

export function buildReport(input: {
  id: string;
  createdAt?: string;
  demo: boolean;
  candidate: CandidateProfile;
  role: RoleProfile;
  fit: FitResult;
  salary: SalaryEstimate;
}): Report {
  const { candidate, role, fit, salary } = input;
  const allEvidence = [...candidate.evidence, ...role.evidence];
  const evidenceExists = new Set(allEvidence.map((record) => record.id));
  const verified = (ids: string[]) => ids.filter((id) => evidenceExists.has(id));
  const met = fit.requirementMatches.filter((match) => match.status === "met");
  const critical = fit.requirementMatches.filter(
    (match) => match.kind === "hard" && ["not-present", "no-evidence"].includes(match.status),
  );
  const partial = fit.requirementMatches.filter((match) => match.status === "partial");
  const optional = fit.requirementMatches.filter(
    (match) => match.kind === "preferred" && match.status !== "met",
  );
  const strongestAchievements = candidate.achievements
    .slice()
    .sort((a, b) => Number(b.hasMeasuredOutcome) - Number(a.hasMeasuredOutcome))
    .slice(0, 3);
  const strengthItems = [
    ...strongestAchievements.map((achievement) => ({
      title: achievement.hasMeasuredOutcome
        ? "Measured delivery impact"
        : "Relevant delivery evidence",
      detail: achievement.statement,
      evidenceIds: verified(achievement.evidenceIds),
    })),
    ...met.slice(0, 3).map((match) => ({
      title: match.label,
      detail: match.explanation,
      evidenceIds: verified(match.evidenceIds),
    })),
  ]
    .filter(
      (item, index, items) => items.findIndex((other) => other.detail === item.detail) === index,
    )
    .slice(0, 5);

  while (strengthItems.length < 3) {
    strengthItems.push({
      title: "Evidence to strengthen",
      detail:
        "Add a concise, measured example tied to a stated requirement before using it as negotiation leverage.",
      evidenceIds: topEvidenceIds(candidate, 1),
    });
  }

  const gapItem = (match: FitResult["requirementMatches"][number]) => ({
    title: match.label,
    detail: `${match.explanation} Treat this as an evidence gap, not proof that the capability is absent.`,
    evidenceIds: verified(match.evidenceIds),
  });

  const hasSalary = salary.recommendedRange !== undefined;
  const askingLow = salary.recommendedRange?.low;
  const askingHigh = salary.recommendedRange?.high;
  const strongest = strengthItems[0];
  const risk =
    critical[0]?.label ?? partial[0]?.label ?? optional[0]?.label ?? "Evidence specificity";

  return {
    id: input.id,
    createdAt: input.createdAt ?? new Date().toISOString(),
    inputVersion: "analysis-input-1.0.0",
    methodologyVersion: fit.methodologyVersion,
    demo: input.demo,
    candidate,
    role,
    fit,
    salary,
    executiveSummary: `The supplied evidence indicates a ${fit.score >= 80 ? "strong" : fit.score >= 65 ? "credible" : "developing"} fit for this specific ${role.title} opportunity (${fit.score}/100, ${fit.confidenceLevel} confidence). ${strongest?.title ?? "The strongest evidence"} is the clearest leverage point; ${risk} is the first risk to address.`,
    strengths: strengthItems,
    gaps: {
      critical: critical.map(gapItem),
      important: partial.map(gapItem),
      optional: optional.map(gapItem),
    },
    interviewTalkingPoints: strengthItems.slice(0, 3).map((item) => ({
      title: `Tell the story: ${item.title}`,
      detail: `Use a situation–action–result answer grounded in this evidence: ${item.detail}`,
      evidenceIds: item.evidenceIds,
    })),
    salaryExpectationAnswer: hasSalary
      ? `Based on the role scope and the ${salary.providerLabel} baseline, I’m targeting ${money(askingLow, salary.currency, salary.period)} to ${money(askingHigh, salary.currency, salary.period)} in base compensation. I’d also like to understand the full package and level expectations before narrowing that range.`
      : "I’d like to understand the level, scope, and total package before naming a precise figure. I’m researching reliable local market evidence and would welcome the budgeted base-salary range for the role.",
    negotiationScript: `I’m excited about the role. The strongest match is ${strongest?.detail ?? "the evidence we discussed"}. I also see the expectation around ${risk}, and I’m prepared to address it directly. ${hasSalary ? `Given the supported market range and this evidence, I’d like to discuss base compensation between ${money(askingLow, salary.currency, salary.period)} and ${money(askingHigh, salary.currency, salary.period)}.` : "Because the available market evidence is insufficient, I do not want to anchor on an unsupported number."} How does that compare with the approved range for this level?`,
    improvementPlan: [
      {
        timeframe: "Days 1–7",
        action: `Prepare one evidence-backed example for ${risk}.`,
        outcome: "A two-minute interview story with a concrete result and no invented details.",
      },
      {
        timeframe: "Days 8–14",
        action: `Create a small work sample or written design note addressing ${critical[0]?.label ?? partial[0]?.label ?? optional[0]?.label ?? "the role’s highest-weight requirement"}.`,
        outcome: "A reviewable artifact linked to the requirement.",
      },
      {
        timeframe: "Days 15–21",
        action:
          "Validate the compensation baseline with two additional lawful sources or recruiter-provided bands.",
        outcome: "A triangulated range with geography, level, base/total units, and dates aligned.",
      },
      {
        timeframe: "Days 22–30",
        action:
          "Run two mock interviews and one negotiation rehearsal using only verified evidence.",
        outcome: "Clearer delivery, calibrated confidence, and a practiced pause after the ask.",
      },
    ],
    limitations: [
      "OfferLens evaluates supplied evidence against one job; it does not measure personal worth or predict a hiring decision.",
      "Missing evidence is not proof that a skill or experience is absent.",
      "Protected characteristics and common proxy fields are excluded from scoring and compensation adjustments.",
      "Compensation is decision support, not legal, financial, tax, or employment advice.",
      ...salary.limitations,
    ],
  };
}
