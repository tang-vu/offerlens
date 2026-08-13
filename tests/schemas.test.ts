import { describe, expect, it } from "vitest";
import {
  CandidateProfileSchema,
  ExtractRequestSchema,
  ReportSchema,
  RoleProfileSchema,
} from "@/domain/schemas";
import { demoCandidate, demoRole, createDemoReport } from "@/domain/demo";

describe("runtime schemas", () => {
  it("accepts the versioned demo profiles and complete report", async () => {
    expect(CandidateProfileSchema.parse(demoCandidate)).toEqual(demoCandidate);
    expect(RoleProfileSchema.parse(demoRole)).toEqual(demoRole);
    expect(ReportSchema.parse(await createDemoReport()).methodologyVersion).toBe("fit-1.0.0");
  });

  it("rejects undersized and oversized source data", () => {
    expect(() =>
      ExtractRequestSchema.parse({
        resumeText: "short",
        jobText: "short",
        location: "US",
        workArrangement: "remote",
      }),
    ).toThrow();
    expect(() =>
      ExtractRequestSchema.parse({
        resumeText: "r".repeat(61_000),
        jobText: "j".repeat(100),
        location: "US",
        workArrangement: "remote",
      }),
    ).toThrow();
  });

  it("strips unknown protected and proxy fields", () => {
    const parsed = CandidateProfileSchema.parse({
      ...demoCandidate,
      name: "Proxy Name",
      gender: "female",
      age: 44,
      school: "Prestige U",
      graduationDate: "2004",
    });
    expect(parsed).not.toHaveProperty("name");
    expect(parsed).not.toHaveProperty("gender");
    expect(parsed).not.toHaveProperty("age");
    expect(parsed).not.toHaveProperty("school");
  });
});
