import { ExtractRequestSchema, ExtractionResultSchema } from "@/domain/schemas";
import { configuredExtractionProvider } from "@/server/extraction/ai";
import { extractDeterministically } from "@/server/extraction/deterministic";
import { collectGithubEvidence } from "@/server/github";
import { secureApiRequest, sensitiveJson } from "@/server/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secured = secureApiRequest(request, "extract", 10);
  if (secured.response) return secured.response;
  try {
    const input = ExtractRequestSchema.parse(await request.json());
    const provider = configuredExtractionProvider();
    let result;
    if (provider && input.externalAiConsent) {
      try {
        result = await provider.extract(input);
      } catch {
        result = extractDeterministically(input);
        result.warnings.unshift(
          "The configured external AI provider failed. OfferLens used conservative deterministic extraction; review every fact.",
        );
      }
    } else {
      result = extractDeterministically(input);
      if (provider && !input.externalAiConsent)
        result.warnings.unshift("External AI was not called because consent was not given.");
    }
    if (input.githubUrls.length) {
      const github = await collectGithubEvidence(input.githubUrls);
      result.candidate.evidence.push(...github.evidence);
      for (const skill of github.skills) {
        const existing = result.candidate.skills.find(
          (item) => item.normalized === skill.normalized,
        );
        if (existing) existing.evidenceIds.push(...skill.evidenceIds);
        else result.candidate.skills.push(skill);
      }
      result.warnings.push(...github.warnings);
    }
    return sensitiveJson(ExtractionResultSchema.parse(result));
  } catch (error) {
    const message =
      error instanceof Error && error.name === "ZodError"
        ? "Some inputs are missing or exceed safe limits."
        : error instanceof Error
          ? error.message
          : "Extraction failed.";
    return sensitiveJson({ error: message }, { status: 422 });
  }
}
