import { NextResponse } from "next/server";
import { clientKey, configuredRateLimitMax, rateLimit } from "@/server/security/rate-limit";

export function secureApiRequest(request: Request, scope: string, max?: number) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host)
        return {
          response: NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 }),
        };
    } catch {
      return { response: NextResponse.json({ error: "Invalid request origin." }, { status: 403 }) };
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
    return {
      response: NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 }),
    };
  const configuredMax = configuredRateLimitMax();
  const result = rateLimit(
    `${scope}:${clientKey(request)}`,
    max === undefined ? configuredMax : Math.min(max, configuredMax),
  );
  if (!result.allowed)
    return {
      response: NextResponse.json(
        { error: "Too many requests. Please wait and retry." },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
      ),
    };
  return { response: undefined, remaining: result.remaining };
}

export function sensitiveJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
