import { afterEach, describe, expect, it } from "vitest";
import {
  clientKey,
  configuredRateLimitMax,
  rateLimit,
  resetRateLimitsForTests,
} from "@/server/security/rate-limit";

afterEach(() => {
  delete process.env.RATE_LIMIT_MAX;
  delete process.env.TRUST_PROXY;
  resetRateLimitsForTests();
});

describe("rate-limit trust boundary", () => {
  it("ignores client-supplied forwarding headers unless proxy trust is explicit", () => {
    const request = new Request("https://offerlens.example/api/analyze", {
      headers: { "X-Forwarded-For": "203.0.113.10", "X-Real-IP": "203.0.113.11" },
    });
    expect(clientKey(request)).toBe("local-client");
    process.env.TRUST_PROXY = "true";
    expect(clientKey(request)).toBe("203.0.113.10");
  });

  it("falls back to a safe configured limit when the environment value is invalid", () => {
    process.env.RATE_LIMIT_MAX = "not-a-number";
    expect(configuredRateLimitMax()).toBe(20);
    for (let count = 0; count < 20; count += 1) {
      expect(rateLimit("invalid-config").allowed).toBe(true);
    }
    expect(rateLimit("invalid-config").allowed).toBe(false);
  });
});
