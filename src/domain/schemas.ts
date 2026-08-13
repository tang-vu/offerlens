import { z } from "zod";

export const SOURCE_TYPES = ["resume", "job", "github", "user", "salary"] as const;
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const SENIORITY_LEVELS = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
  "lead",
  "unknown",
] as const;
export const WORK_ARRANGEMENTS = ["remote", "hybrid", "onsite", "unspecified"] as const;

const boundedText = (max = 500) => z.string().trim().min(1).max(max);

export const EvidenceRecordSchema = z.object({
  id: z.string().min(1).max(100),
  sourceType: z.enum(SOURCE_TYPES),
  sourceIdentifier: z.string().min(1).max(200),
  excerpt: z.string().trim().min(1).max(500),
  structuredFact: z.string().trim().min(1).max(500),
  relevance: z.string().trim().min(1).max(300),
  confidence: z.number().min(0).max(1),
  extractionMethod: z.enum([
    "deterministic",
    "ai-structured",
    "github-api",
    "user-confirmed",
    "provider",
  ]),
});

export const SkillSchema = z.object({
  name: boundedText(80),
  normalized: boundedText(80),
  years: z.number().min(0).max(60).optional(),
  lastUsedYear: z.number().int().min(1980).max(2100).optional(),
  evidenceIds: z.array(z.string()).max(20),
});

export const ExperienceSchema = z.object({
  role: boundedText(120),
  roleFamily: boundedText(80),
  years: z.number().min(0).max(60).optional(),
  domains: z.array(boundedText(80)).max(20),
  evidenceIds: z.array(z.string()).max(20),
});

export const AchievementSchema = z.object({
  statement: boundedText(300),
  hasMeasuredOutcome: z.boolean(),
  evidenceIds: z.array(z.string()).max(20),
});

export const CandidateProfileSchema = z.object({
  roleFamily: boundedText(80),
  seniority: z.enum(SENIORITY_LEVELS),
  yearsExperience: z.number().min(0).max(60).optional(),
  skills: z.array(SkillSchema).max(100),
  experiences: z.array(ExperienceSchema).max(40),
  achievements: z.array(AchievementSchema).max(40),
  domains: z.array(boundedText(80)).max(30),
  certifications: z.array(boundedText(120)).max(30),
  workAuthorization: z.string().trim().max(200).optional(),
  evidence: z.array(EvidenceRecordSchema).max(300),
});

export const RequirementSchema = z.object({
  id: z.string().min(1).max(100),
  label: boundedText(200),
  normalized: boundedText(120),
  kind: z.enum(["hard", "preferred"]),
  category: z.enum([
    "skill",
    "experience",
    "seniority",
    "domain",
    "education",
    "certification",
    "constraint",
    "other",
  ]),
  minimumYears: z.number().min(0).max(60).optional(),
  evidenceIds: z.array(z.string()).max(20),
});

export const RoleProfileSchema = z.object({
  title: boundedText(160),
  roleFamily: boundedText(80),
  seniority: z.enum(SENIORITY_LEVELS),
  location: boundedText(160),
  workArrangement: z.enum(WORK_ARRANGEMENTS),
  requirements: z.array(RequirementSchema).max(100),
  responsibilities: z.array(boundedText(300)).max(50),
  domains: z.array(boundedText(80)).max(30),
  evidence: z.array(EvidenceRecordSchema).max(300),
});

export const ExtractionResultSchema = z.object({
  candidate: CandidateProfileSchema,
  role: RoleProfileSchema,
  warnings: z.array(z.string().max(300)).max(20),
  provider: z.enum(["deterministic", "openai", "openai-compatible"]),
});

export const RequirementMatchSchema = z.object({
  requirementId: z.string(),
  label: z.string(),
  kind: z.enum(["hard", "preferred"]),
  status: z.enum(["met", "partial", "not-present", "no-evidence"]),
  evidenceIds: z.array(z.string()),
  explanation: z.string(),
});

export const ScoreCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
  pointsAwarded: z.number().min(0).max(100),
  pointsAvailable: z.number().min(0).max(100),
  explanation: z.string(),
  evidenceIds: z.array(z.string()),
});

export const FitResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  confidenceLevel: z.enum(CONFIDENCE_LEVELS),
  methodologyVersion: z.string(),
  categories: z.array(ScoreCategorySchema),
  requirementMatches: z.array(RequirementMatchSchema),
});

export const SalaryEstimateSchema = z.object({
  status: z.enum(["supported", "provisional", "insufficient"]),
  providerId: z.string(),
  providerLabel: z.string(),
  isDemo: z.boolean(),
  occupationCode: z.string().optional(),
  occupationTitle: z.string(),
  geography: z.string(),
  sampleDate: z.string(),
  accessedDate: z.string(),
  currency: z.string().length(3),
  period: z.enum(["annual", "monthly", "hourly"]),
  compensationType: z.enum(["base", "gross"]),
  percentiles: z
    .object({
      p25: z.number().nonnegative(),
      p50: z.number().nonnegative(),
      p75: z.number().nonnegative(),
    })
    .optional(),
  marketRange: z
    .object({ low: z.number().nonnegative(), high: z.number().nonnegative() })
    .optional(),
  recommendedRange: z
    .object({ low: z.number().nonnegative(), high: z.number().nonnegative() })
    .optional(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  freshness: z.string(),
  sourceUrl: z.string().url().optional(),
  adjustment: z.object({ percent: z.number().min(-15).max(15), reasons: z.array(z.string()) }),
  exchangeRate: z
    .object({
      rate: z.number().positive(),
      base: z.string().length(3),
      quote: z.string().length(3),
      date: z.string(),
      source: z.string(),
    })
    .optional(),
  limitations: z.array(z.string()),
});

export const NarrativeItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  evidenceIds: z.array(z.string()),
});

export const ImprovementItemSchema = z.object({
  timeframe: z.string(),
  action: z.string(),
  outcome: z.string(),
});

export const ReportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  inputVersion: z.string(),
  methodologyVersion: z.string(),
  demo: z.boolean(),
  candidate: CandidateProfileSchema,
  role: RoleProfileSchema,
  fit: FitResultSchema,
  salary: SalaryEstimateSchema,
  executiveSummary: z.string(),
  strengths: z.array(NarrativeItemSchema),
  gaps: z.object({
    critical: z.array(NarrativeItemSchema),
    important: z.array(NarrativeItemSchema),
    optional: z.array(NarrativeItemSchema),
  }),
  interviewTalkingPoints: z.array(NarrativeItemSchema),
  salaryExpectationAnswer: z.string(),
  negotiationScript: z.string(),
  improvementPlan: z.array(ImprovementItemSchema),
  limitations: z.array(z.string()),
});

export const ExtractRequestSchema = z.object({
  resumeText: z.string().trim().min(80).max(60_000),
  jobText: z.string().trim().min(80).max(60_000),
  location: z.string().trim().min(2).max(160),
  workArrangement: z.enum(WORK_ARRANGEMENTS),
  yearsExperience: z.number().min(0).max(60).optional(),
  githubUrls: z.array(z.string().url()).max(5).default([]),
  externalAiConsent: z.boolean().default(false),
});

export const AnalyzeRequestSchema = z.object({
  candidate: CandidateProfileSchema,
  role: RoleProfileSchema,
  currency: z.string().length(3).default("USD"),
  period: z.enum(["annual", "monthly"]).default("annual"),
  salaryProvider: z.enum(["bls", "demo"]).default("bls"),
  idempotencyKey: z.string().min(16).max(128),
});

export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
export type RoleProfile = z.infer<typeof RoleProfileSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type FitResult = z.infer<typeof FitResultSchema>;
export type SalaryEstimate = z.infer<typeof SalaryEstimateSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
