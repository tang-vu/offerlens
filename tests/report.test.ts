import { describe, expect, it } from "vitest";
import { createDemoReport } from "@/domain/demo";

describe("evidence-linked reporting", () => {
  it("links every claimed strength and talking point only to existing evidence", async () => {
    const report = await createDemoReport();
    const ids = new Set(
      [...report.candidate.evidence, ...report.role.evidence].map((record) => record.id),
    );
    for (const claim of [
      ...report.strengths,
      ...report.interviewTalkingPoints,
      ...report.gaps.critical,
      ...report.gaps.important,
      ...report.gaps.optional,
    ]) {
      expect(claim.evidenceIds.every((id) => ids.has(id))).toBe(true);
    }
    expect(report.salary.isDemo).toBe(true);
    expect(
      report.limitations.some((item) => item.includes("does not measure personal worth")),
    ).toBe(true);
  });
});
