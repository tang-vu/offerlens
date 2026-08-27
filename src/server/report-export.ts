import { createHash } from "node:crypto";
import type { Report } from "@/domain/schemas";
import { ReportSchema } from "@/domain/schemas";

export const REPORT_EXPORT_SCHEMA = "offerlens-report/1" as const;

export interface PortableReportExport {
  schemaVersion: typeof REPORT_EXPORT_SCHEMA;
  exportedAt: string;
  reportSha256: string;
  evidenceCount: number;
  report: Report;
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  }
  return value;
}

export function canonicalReportJson(report: Report): string {
  const parsed = ReportSchema.parse(report);
  return JSON.stringify(normalize(parsed));
}

export function reportSha256(report: Report): string {
  return `sha256:${createHash("sha256").update(canonicalReportJson(report), "utf8").digest("hex")}`;
}

export function createPortableReportExport(
  report: Report,
  exportedAt = new Date().toISOString(),
): PortableReportExport {
  const parsed = ReportSchema.parse(report);
  return {
    schemaVersion: REPORT_EXPORT_SCHEMA,
    exportedAt,
    reportSha256: reportSha256(parsed),
    evidenceCount: parsed.candidate.evidence.length + parsed.role.evidence.length,
    report: parsed,
  };
}

export function verifyPortableReportExport(bundle: PortableReportExport): boolean {
  try {
    if (bundle.schemaVersion !== REPORT_EXPORT_SCHEMA) return false;
    return reportSha256(ReportSchema.parse(bundle.report)) === bundle.reportSha256;
  } catch {
    return false;
  }
}
