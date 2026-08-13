import { secureApiRequest, sensitiveJson } from "@/server/security/request";
import { attachOwnerCookie, deleteReport, findReport, ownerContext } from "@/server/store";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = ownerContext(request);
  const { id } = await context.params;
  const report = await findReport(owner.ownerHash, id);
  return attachOwnerCookie(
    report
      ? sensitiveJson({ report })
      : sensitiveJson({ error: "Report not found." }, { status: 404 }),
    owner,
  );
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const secured = secureApiRequest(request, "delete-report", 20);
  if (secured.response) return secured.response;
  const owner = ownerContext(request);
  const { id } = await context.params;
  const deleted = await deleteReport(owner.ownerHash, id);
  return attachOwnerCookie(
    deleted
      ? sensitiveJson({ deleted: true })
      : sensitiveJson({ error: "Report not found." }, { status: 404 }),
    owner,
  );
}
