import { randomUUID } from "node:crypto";
import { AnalyzeRequestSchema } from "@/domain/schemas";
import { buildReport } from "@/domain/report";
import { computeFit } from "@/domain/scoring";
import { getSalaryProvider } from "@/domain/salary";
import { secureApiRequest, sensitiveJson } from "@/server/security/request";
import { attachOwnerCookie, inputHash, ownerContext, saveReport } from "@/server/store";

export const runtime = "nodejs";

function assertEvidenceLinks(
  candidate: ReturnType<typeof AnalyzeRequestSchema.parse>["candidate"],
  role: ReturnType<typeof AnalyzeRequestSchema.parse>["role"],
) {
  const candidateIds = new Set(candidate.evidence.map((record) => record.id));
  const roleIds = new Set(role.evidence.map((record) => record.id));
  const badCandidate = [
    ...candidate.skills,
    ...candidate.experiences,
    ...candidate.achievements,
  ].some((item) => item.evidenceIds.some((id) => !candidateIds.has(id)));
  const badRole = role.requirements.some((item) => item.evidenceIds.some((id) => !roleIds.has(id)));
  if (badCandidate || badRole)
    throw new Error(
      "A fact references missing evidence. Return to review and re-extract the inputs.",
    );
}

export async function POST(request: Request) {
  const secured = secureApiRequest(request, "analyze", 10);
  if (secured.response) return secured.response;
  const owner = ownerContext(request);
  try {
    const input = AnalyzeRequestSchema.parse(await request.json());
    assertEvidenceLinks(input.candidate, input.role);
    const hash = inputHash({ ...input, idempotencyKey: undefined });
    const fit = computeFit(input.candidate, input.role);
    const salary = await getSalaryProvider(input.salaryProvider).getEstimate({
      candidate: input.candidate,
      role: input.role,
      fit,
      currency: input.currency,
      period: input.period,
    });
    const report = buildReport({
      id: randomUUID(),
      demo: input.salaryProvider === "demo",
      candidate: input.candidate,
      role: input.role,
      fit,
      salary,
    });
    const saved = await saveReport(owner.ownerHash, input.idempotencyKey, hash, report);
    return attachOwnerCookie(sensitiveJson({ report: saved }), owner);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "ZodError"
        ? "Reviewed facts did not pass schema validation."
        : error instanceof Error
          ? error.message
          : "Analysis failed.";
    return attachOwnerCookie(sensitiveJson({ error: message }, { status: 422 }), owner);
  }
}
