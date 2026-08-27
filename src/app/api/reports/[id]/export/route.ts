import { attachOwnerCookie, findReport, ownerContext } from "@/server/store";
import { createPortableReportExport } from "@/server/report-export";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const owner = ownerContext(request);
  const { id } = await context.params;
  const report = await findReport(owner.ownerHash, id);

  if (!report) {
    return attachOwnerCookie(
      new Response(JSON.stringify({ error: "Report not found." }), {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "private, no-store",
        },
      }),
      owner,
    );
  }

  const bundle = createPortableReportExport(report);
  const safeId = report.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  return attachOwnerCookie(
    new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="offerlens-${safeId}.json"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }),
    owner,
  );
}
