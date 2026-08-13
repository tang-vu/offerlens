import { parseResumeFile } from "@/server/files";
import { secureApiRequest, sensitiveJson } from "@/server/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secured = secureApiRequest(request, "resume-parse", 8);
  if (secured.response) return secured.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return sensitiveJson({ error: "Choose a PDF or DOCX résumé file." }, { status: 400 });
    const result = await parseResumeFile(file);
    return sensitiveJson(result);
  } catch (error) {
    return sensitiveJson(
      { error: error instanceof Error ? error.message : "The résumé could not be parsed safely." },
      { status: 422 },
    );
  }
}
