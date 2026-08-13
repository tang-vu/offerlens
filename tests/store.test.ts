import { beforeEach, describe, expect, it } from "vitest";
import { createDemoReport } from "@/domain/demo";
import {
  deleteReport,
  findReport,
  hashValue,
  resetMemoryStoreForTests,
  saveReport,
} from "@/server/store";

describe("analysis ownership, idempotency, and deletion", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    resetMemoryStoreForTests();
  });

  it("returns the same report for an idempotent retry and rejects changed inputs", async () => {
    const report = await createDemoReport();
    const owner = hashValue("owner-a");
    const first = await saveReport(owner, "same-idempotency-key", "hash-a", report);
    const retry = await saveReport(owner, "same-idempotency-key", "hash-a", {
      ...report,
      id: "other",
    });
    expect(retry.id).toBe(first.id);
    await expect(saveReport(owner, "same-idempotency-key", "hash-b", report)).rejects.toThrow(
      /different inputs/,
    );
  });

  it("prevents another anonymous owner from reading or deleting and supports repeated deletion", async () => {
    const report = await createDemoReport();
    const owner = hashValue("owner-a");
    const other = hashValue("owner-b");
    await saveReport(owner, "delete-idempotency-key", "hash-a", report);
    expect(await findReport(other, report.id)).toBeUndefined();
    expect(await deleteReport(other, report.id)).toBe(false);
    expect(await deleteReport(owner, report.id)).toBe(true);
    expect(await deleteReport(owner, report.id)).toBe(false);
    expect(await findReport(owner, report.id)).toBeUndefined();
  });
});
