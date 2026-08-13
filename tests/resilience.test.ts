import JSZip from "jszip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as extract } from "@/app/api/extract/route";
import { DEMO_JOB_TEXT, DEMO_RESUME_TEXT } from "@/domain/demo";
import { parseResumeFile } from "@/server/files";
import { collectGithubEvidence } from "@/server/github";
import { resetRateLimitsForTests } from "@/server/security/rate-limit";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetRateLimitsForTests();
});

async function minimalDocx() {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      </Types>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p><w:r><w:t>Senior software engineer with TypeScript, PostgreSQL, and measured delivery outcomes.</w:t></w:r></w:p></w:body>
      </w:document>`,
  );
  return zip.generateAsync({ type: "arraybuffer" });
}

describe("resilient integrations and file intake", () => {
  it("rejects a PDF whose signature does not match its extension", async () => {
    const file = new File(["not actually a PDF"], "resume.pdf", { type: "application/pdf" });
    await expect(parseResumeFile(file)).rejects.toThrow(/valid PDF signature/);
  });

  it("extracts text from a structurally valid DOCX", async () => {
    const file = new File([await minimalDocx()], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await expect(parseResumeFile(file)).resolves.toMatchObject({
      fileType: "docx",
      truncated: false,
      text: expect.stringContaining("TypeScript"),
    });
  });

  it("continues without GitHub evidence when the public API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    const result = await collectGithubEvidence(["https://github.com/example"]);
    expect(result.evidence).toEqual([]);
    expect(result.skills).toEqual([]);
    expect(result.warnings).toEqual([
      "GitHub evidence could not be retrieved for github.com. The analysis can continue without it.",
    ]);
  });

  it("falls back to deterministic extraction when a consented AI provider fails", async () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "test-only-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    const request = new Request("http://localhost/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: "localhost",
        Origin: "http://localhost",
      },
      body: JSON.stringify({
        resumeText: DEMO_RESUME_TEXT,
        jobText: DEMO_JOB_TEXT,
        location: "Seattle, WA, United States",
        workArrangement: "hybrid",
        githubUrls: [],
        externalAiConsent: true,
      }),
    });
    const response = await extract(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.provider).toBe("deterministic");
    expect(body.warnings[0]).toMatch(/external AI provider failed/i);
  });
});
