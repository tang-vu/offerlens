interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function configuredRateLimitMax() {
  const parsed = Number(process.env.RATE_LIMIT_MAX ?? 20);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 20;
}

export function rateLimit(key: string, max = configuredRateLimitMax(), windowMs = 60_000) {
  const safeMax = Number.isFinite(max) && max > 0 ? Math.floor(max) : 20;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: safeMax - 1, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > safeMax)
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1_000) };
  return { allowed: true, remaining: safeMax - current.count, retryAfter: 0 };
}

export function clientKey(request: Request) {
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwarded = trustProxy
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  const realIp = trustProxy ? request.headers.get("x-real-ip") : undefined;
  return forwarded || realIp || "local-client";
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
