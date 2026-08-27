import { describe, expect, it } from "vitest";
import { createDemoReport } from "@/domain/demo";
import {
  createPortableReportExport,
  reportSha256,
  verifyPortableReportExport,
} from "@/server/report-export";

describe("portable report export", () => {
  it("creates a verifiable deterministic report digest", async () => {
    const report = await createDemoReport();
    const bundle = createPortableReportExport(report, "2026-08-27T00:00:00.000Z");

    expect(bundle.schemaVersion).toBe("offerlens-report/1");
    expect(bundle.reportSha256).toBe(reportSha256(report));
    expect(bundle.evidenceCount).toBe(report.candidate.evidence.length + report.role.evidence.length);
    expect(verifyPortableReportExport(bundle)).toBe(true);
  });

  it("rejects a report changed after export", async () => {
    const report = await createDemoReport();
    const bundle = createPortableReportExport(report, "2026-08-27T00:00:00.000Z");
    const tampered = structuredClone(bundle);
    tampered.report.executiveSummary = `${tampered.report.executiveSummary} altered`;

    expect(verifyPortableReportExport(tampered)).toBe(false);
  });
});
