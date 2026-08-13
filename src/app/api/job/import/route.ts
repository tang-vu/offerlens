import { fetchPublicJobText } from "@/server/security/ssrf";
import { secureApiRequest, sensitiveJson } from "@/server/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secured = secureApiRequest(request, "job-import", 8);
  if (secured.response) return secured.response;
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string")
      return sensitiveJson({ error: "Enter a public job URL." }, { status: 400 });
    const result = await fetchPublicJobText(body.url);
    return sensitiveJson(result);
  } catch (error) {
    return sensitiveJson(
      {
        error: "We could not safely import that page. Paste the job description below instead.",
        detail: error instanceof Error ? error.message : "Import failed.",
      },
      { status: 422 },
    );
  }
}
