import { describe, expect, it } from "vitest";
import { demoCandidate, demoRole } from "@/domain/demo";
import { computeFit } from "@/domain/scoring";
import { BlsSnapshotSalaryProvider, DemoSalaryProvider } from "@/domain/salary";

const fit = computeFit(demoCandidate, demoRole);

describe("salary providers", () => {
  it("normalizes annual values to monthly without changing provenance", async () => {
    const provider = new DemoSalaryProvider();
    const annual = await provider.getEstimate({
      candidate: demoCandidate,
      role: demoRole,
      fit,
      currency: "USD",
      period: "annual",
    });
    const monthly = await provider.getEstimate({
      candidate: demoCandidate,
      role: demoRole,
      fit,
      currency: "USD",
      period: "monthly",
    });
    expect(monthly.percentiles!.p50).toBe(Math.round(annual.percentiles!.p50 / 12));
    expect(monthly.providerId).toBe(annual.providerId);
    expect(monthly.isDemo).toBe(true);
  });

  it("returns insufficient data outside supported geography or currency", async () => {
    const provider = new BlsSnapshotSalaryProvider();
    const outside = await provider.getEstimate({
      candidate: demoCandidate,
      role: { ...demoRole, location: "Hanoi, Vietnam" },
      fit,
      currency: "USD",
      period: "annual",
    });
    const currency = await provider.getEstimate({
      candidate: demoCandidate,
      role: demoRole,
      fit,
      currency: "EUR",
      period: "annual",
    });
    expect(outside.status).toBe("insufficient");
    expect(outside.marketRange).toBeUndefined();
    expect(currency.status).toBe("insufficient");
  });

  it("removes candidate adjustment when fit confidence is low", async () => {
    const provider = new DemoSalaryProvider();
    const result = await provider.getEstimate({
      candidate: demoCandidate,
      role: demoRole,
      fit: { ...fit, confidence: 35 },
      currency: "USD",
      period: "annual",
    });
    expect(result.adjustment.percent).toBe(0);
    expect(result.adjustment.reasons[0]).toMatch(/Low fit confidence/);
  });
});
