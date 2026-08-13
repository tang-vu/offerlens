import type { CandidateProfile, FitResult, RoleProfile, SalaryEstimate } from "@/domain/schemas";
import { normalizeRoleFamily } from "@/domain/normalization";

export interface SalaryQuery {
  role: RoleProfile;
  candidate: CandidateProfile;
  fit: FitResult;
  currency: string;
  period: "annual" | "monthly";
}

export interface SalaryDataProvider {
  readonly id: string;
  getEstimate(query: SalaryQuery): Promise<SalaryEstimate>;
}

interface SalaryRecord {
  occupationCode: string;
  title: string;
  roleFamily: string;
  sourceUrl: string;
  p25: number;
  p50: number;
  p75: number;
}

const BLS_2023_NATIONAL: SalaryRecord[] = [
  {
    occupationCode: "15-1252",
    title: "Software Developers",
    roleFamily: "software engineering",
    sourceUrl: "https://www.bls.gov/oes/2023/may/oes151252.htm",
    p25: 101_200,
    p50: 132_270,
    p75: 167_540,
  },
  {
    occupationCode: "15-1253",
    title: "Software Quality Assurance Analysts and Testers",
    roleFamily: "software quality assurance",
    sourceUrl: "https://www.bls.gov/oes/2023/may/oes151253.htm",
    p25: 78_470,
    p50: 101_800,
    p75: 130_630,
  },
];

function emptyEstimate(
  query: SalaryQuery,
  providerId: string,
  providerLabel: string,
  limitations: string[],
): SalaryEstimate {
  return {
    status: "insufficient",
    providerId,
    providerLabel,
    isDemo: false,
    occupationTitle: query.role.roleFamily,
    geography: query.role.location,
    sampleDate: "not available",
    accessedDate: "2026-08-13",
    currency: query.currency,
    period: query.period,
    compensationType: "base",
    confidence: "low",
    freshness: "No reliable matching observation",
    adjustment: { percent: 0, reasons: [] },
    limitations,
  };
}

function boundedAdjustment(query: SalaryQuery) {
  let percent =
    query.fit.score >= 85 ? 7 : query.fit.score >= 70 ? 4 : query.fit.score < 50 ? -4 : 0;
  const reasons: string[] = [];
  if (percent > 0)
    reasons.push(`Fit score supports positioning ${percent}% above the matched baseline midpoint.`);
  if (percent < 0)
    reasons.push("Material evidence gaps support conservative positioning against the baseline.");
  const measured = query.candidate.achievements.filter((item) => item.hasMeasuredOutcome).length;
  if (measured >= 2 && query.fit.confidence >= 60) {
    percent += 2;
    reasons.push("Multiple measured outcomes add bounded leverage.");
  }
  if (query.fit.confidence < 50) {
    percent = 0;
    reasons.splice(
      0,
      reasons.length,
      "Low fit confidence prevents a candidate-specific adjustment.",
    );
  }
  return { percent: Math.max(-10, Math.min(10, percent)), reasons };
}

function convertPeriod(value: number, period: "annual" | "monthly") {
  return Math.round(period === "monthly" ? value / 12 : value);
}

export class BlsSnapshotSalaryProvider implements SalaryDataProvider {
  readonly id = "bls-oews-2023-snapshot";

  async getEstimate(query: SalaryQuery): Promise<SalaryEstimate> {
    if (query.currency !== "USD") {
      return emptyEstimate(query, this.id, "U.S. BLS OEWS historical snapshot", [
        "This provider contains USD observations only and no verified exchange-rate provider is configured.",
      ]);
    }
    const isUs =
      /\b(usa|united states|u\.s\.|us|seattle|new york|san francisco|austin|boston|chicago|california|washington|texas)\b/i.test(
        query.role.location,
      );
    if (!isUs) {
      return emptyEstimate(query, this.id, "U.S. BLS OEWS historical snapshot", [
        "The available official baseline covers the United States; applying it to another labor market would be misleading.",
      ]);
    }
    const record = BLS_2023_NATIONAL.find(
      (item) => item.roleFamily === normalizeRoleFamily(query.role.roleFamily),
    );
    if (!record) {
      return emptyEstimate(query, this.id, "U.S. BLS OEWS historical snapshot", [
        "No verified SOC occupation mapping is included for this role family.",
      ]);
    }
    const adjustment = boundedAdjustment(query);
    const p25 = convertPeriod(record.p25, query.period);
    const p50 = convertPeriod(record.p50, query.period);
    const p75 = convertPeriod(record.p75, query.period);
    const factor = 1 + adjustment.percent / 100;
    return {
      status: "provisional",
      providerId: this.id,
      providerLabel: "U.S. Bureau of Labor Statistics — OEWS historical snapshot",
      isDemo: false,
      occupationCode: record.occupationCode,
      occupationTitle: record.title,
      geography: "United States — national",
      sampleDate: "2023-05-01",
      accessedDate: "2026-08-13",
      currency: "USD",
      period: query.period,
      compensationType: "base",
      percentiles: { p25, p50, p75 },
      marketRange: { low: p25, high: p75 },
      recommendedRange: {
        low: Math.round(p50 * factor * 0.98),
        high: Math.round(Math.min(p75, p50 * factor * 1.08)),
      },
      confidence: "medium",
      freshness: "May 2023 observation; historical and older than the current BLS release",
      sourceUrl: record.sourceUrl,
      adjustment,
      limitations: [
        "National estimates do not capture city, company stage, industry, bonus, or equity differences.",
        "OEWS estimates are employer-reported occupational wages, not candidate-specific offers.",
        "The bundled percentiles are a verified historical snapshot, not live data.",
      ],
    };
  }
}

export class DemoSalaryProvider implements SalaryDataProvider {
  readonly id = "synthetic-demo-2026-v1";

  async getEstimate(query: SalaryQuery): Promise<SalaryEstimate> {
    const periodFactor = query.period === "monthly" ? 1 / 12 : 1;
    const adjustment = boundedAdjustment(query);
    const p25 = Math.round(128_000 * periodFactor);
    const p50 = Math.round(151_000 * periodFactor);
    const p75 = Math.round(178_000 * periodFactor);
    return {
      status: "supported",
      providerId: this.id,
      providerLabel: "OfferLens synthetic demo fixture",
      isDemo: true,
      occupationCode: "DEMO-ENG-01",
      occupationTitle: "Senior software engineer (fictional fixture)",
      geography: "Seattle, WA — synthetic demo market",
      sampleDate: "2026-06-30",
      accessedDate: "2026-08-13",
      currency: "USD",
      period: query.period,
      compensationType: "base",
      percentiles: { p25, p50, p75 },
      marketRange: { low: p25, high: p75 },
      recommendedRange: {
        low: Math.round(162_000 * periodFactor),
        high: Math.round(174_000 * periodFactor),
      },
      confidence: "high",
      freshness: "Synthetic fixture dated June 2026 — not a live observation",
      adjustment,
      limitations: [
        "These numbers are fictional and exist only to demonstrate the full report experience.",
        "Do not use this fixture to make a compensation decision.",
        "Bonus, equity, and total compensation are intentionally excluded.",
      ],
    };
  }
}

export function getSalaryProvider(id: "bls" | "demo"): SalaryDataProvider {
  return id === "demo" ? new DemoSalaryProvider() : new BlsSnapshotSalaryProvider();
}
