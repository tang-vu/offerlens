// @vitest-environment jsdom

import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisWizard } from "@/components/analysis-wizard";
import { DEMO_JOB_TEXT, DEMO_RESUME_TEXT } from "@/domain/demo";
import { extractDeterministically } from "@/server/extraction/deterministic";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

interface PendingRequest {
  url: string;
  init: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
}

let requests: PendingRequest[];

beforeEach(() => {
  requests = [];
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  // Deliberately allow completion after abort to exercise stale-response guards too.
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          requests.push({ url, init, resolve, reject });
        }),
    ),
  );
  render(createElement(AnalysisWizard));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function request(index: number) {
  const pending = requests[index];
  if (!pending) throw new Error(`Missing request ${index}`);
  return pending;
}

async function respond(index: number, body: object, status = 200) {
  await act(async () => {
    request(index).resolve(new Response(JSON.stringify(body), { status }));
  });
}

async function reject(index: number) {
  await act(async () => {
    request(index).reject(new Error("Synthetic connection failure"));
  });
}

function resumeField() {
  return screen.getByLabelText<HTMLTextAreaElement>(/Résumé text/);
}

function jobField() {
  return screen.getByLabelText<HTMLTextAreaElement>(/Job description text/);
}

function chooseFile(name = "synthetic-resume.pdf") {
  const input = document.getElementById("resume-file") as HTMLInputElement;
  // Simulate the browser-populated path; jsdom forbids assigning a nonempty file value.
  Object.defineProperty(input, "value", {
    configurable: true,
    writable: true,
    value: `C:\\fakepath\\${name}`,
  });
  fireEvent.change(input, {
    target: { files: [new File(["synthetic fixture"], name, { type: "application/pdf" })] },
  });
  return input;
}

function importJob(url = "https://example.com/jobs/synthetic") {
  fireEvent.change(screen.getByLabelText(/Public job URL/), { target: { value: url } });
  fireEvent.click(screen.getByRole("button", { name: "Import" }));
}

function fillSources() {
  fireEvent.change(resumeField(), { target: { value: DEMO_RESUME_TEXT } });
  fireEvent.change(jobField(), { target: { value: DEMO_JOB_TEXT } });
}

function expectBusy(value: boolean) {
  expect(document.querySelector(".wizard-main")?.getAttribute("aria-busy")).toBe(String(value));
}

describe("source intake preserves the latest user intent", () => {
  it("accepts current file and URL results, including the file truncation warning", async () => {
    chooseFile();
    await respond(0, { text: DEMO_RESUME_TEXT, truncated: true });
    expect(resumeField().value).toBe(DEMO_RESUME_TEXT);
    expect(screen.getByRole("alert").textContent).toContain("60,000-character limit");
    importJob();
    await respond(1, { text: DEMO_JOB_TEXT });
    expect(jobField().value).toBe(DEMO_JOB_TEXT);
    expect(screen.queryByRole("alert")).toBeNull();
    expectBusy(false);
  });

  it.each(["success", "error", "rejection"] as const)(
    "ignores an older file's late %s after selecting a newer file",
    async (outcome) => {
      chooseFile("old.pdf");
      chooseFile("new.pdf");
      expect(request(0).init.signal?.aborted).toBe(true);
      if (outcome === "success") await respond(0, { text: "Stale text", truncated: true });
      else if (outcome === "error") await respond(0, { error: "Stale parsing error" }, 422);
      else await reject(0);
      expectBusy(true);
      expect(screen.getByText(/Parsing securely/)).toBeDefined();
      expect(screen.queryByRole("alert")).toBeNull();
      await respond(1, { text: DEMO_RESUME_TEXT });
      expect(resumeField().value).toBe(DEMO_RESUME_TEXT);
      expect(screen.getByText("new.pdf")).toBeDefined();
      expectBusy(false);
    },
  );

  it("keeps the newer file when responses finish in reverse order", async () => {
    chooseFile("old.pdf");
    chooseFile("new.pdf");
    await respond(1, { text: DEMO_RESUME_TEXT });
    await respond(0, { text: "Stale text" });
    expect(resumeField().value).toBe(DEMO_RESUME_TEXT);
    expect(screen.getByText("new.pdf")).toBeDefined();
  });

  it.each(["resume", "job"] as const)(
    "preserves manual %s edits when a canceled request succeeds or fails",
    async (source) => {
      const field = source === "resume" ? resumeField : jobField;
      const start = source === "resume" ? chooseFile : importJob;
      start();
      fireEvent.change(field(), { target: { value: "New manual correction" } });
      expect(request(0).init.signal?.aborted).toBe(true);
      expectBusy(false);
      await respond(0, { text: "Stale result" });
      expect(field().value).toBe("New manual correction");
      start();
      fireEvent.change(field(), { target: { value: "Latest manual correction" } });
      await reject(1);
      expect(field().value).toBe("Latest manual correction");
      expect(screen.queryByRole("alert")).toBeNull();
      if (source === "resume") expect(screen.queryByText("synthetic-resume.pdf")).toBeNull();
    },
  );

  it.each(["success", "error"] as const)(
    "ignores a previous URL's %s after the URL changes and permits the new import",
    async (outcome) => {
      importJob("https://example.com/jobs/old");
      importJob("https://example.com/jobs/new");
      expect(request(0).init.signal?.aborted).toBe(true);
      if (outcome === "success") await respond(0, { text: "Old URL result" });
      else await respond(0, { error: "Old URL error" }, 422);
      expectBusy(true);
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Checking…" }).disabled).toBe(
        true,
      );
      expect(screen.queryByRole("alert")).toBeNull();
      await respond(1, { text: DEMO_JOB_TEXT });
      expect(jobField().value).toBe(DEMO_JOB_TEXT);
      expectBusy(false);
    },
  );

  it.each([0, 1])(
    "keeps intake busy until both requests finish, with request %s first",
    async (first) => {
      fireEvent.change(resumeField(), {
        target: { value: "Outdated synthetic résumé. ".repeat(5) },
      });
      fireEvent.change(jobField(), {
        target: { value: "Outdated synthetic job description. ".repeat(5) },
      });
      chooseFile();
      importJob();
      const continueButton = screen.getByRole<HTMLButtonElement>("button", { name: /Continue/ });
      expect(continueButton.disabled).toBe(true);
      await respond(first, { text: first === 0 ? DEMO_RESUME_TEXT : DEMO_JOB_TEXT });
      expectBusy(true);
      expect(continueButton.disabled).toBe(true);
      if (first === 0)
        expect(screen.getByRole<HTMLButtonElement>("button", { name: "Checking…" }).disabled).toBe(
          true,
        );
      else expect(screen.getByText(/Parsing securely/)).toBeDefined();
      await respond(1 - first, { text: first === 0 ? DEMO_JOB_TEXT : DEMO_RESUME_TEXT });
      expectBusy(false);
      expect(continueButton.disabled).toBe(false);
      fireEvent.click(continueButton);
      fireEvent.change(screen.getByLabelText(/Role location/), {
        target: { value: "Seattle, United States" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Extract facts for review/ }));
      const input = JSON.parse(String(request(2).init.body));
      expect(request(2).url).toBe("/api/extract");
      expect(input).toMatchObject({
        resumeText: DEMO_RESUME_TEXT,
        jobText: DEMO_JOB_TEXT,
        externalAiConsent: false,
      });
      await respond(2, extractDeterministically(input));
      expect(screen.getByRole("heading", { name: "Review the extracted record" })).toBeDefined();
    },
  );

  it.each(["resume", "job"] as const)(
    "preserves existing %s text on failure and supports retry",
    async (source) => {
      fillSources();
      const field = source === "resume" ? resumeField : jobField;
      const original = field().value;
      const start = source === "resume" ? chooseFile : importJob;
      start();
      await respond(0, { error: "Synthetic intake failure" }, 422);
      expect(field().value).toBe(original);
      expect(screen.getByRole("alert").textContent).toContain("Synthetic intake failure");
      expectBusy(false);
      start();
      expect(screen.queryByRole("alert")).toBeNull();
      await respond(1, { text: "Successful retry" });
      expect(field().value).toBe("Successful retry");
      expectBusy(false);
      if (source === "resume")
        expect((document.getElementById("resume-file") as HTMLInputElement).value).toBe("");
    },
  );

  it("aborts both intake requests on unmount and ignores their completion", async () => {
    chooseFile();
    importJob();
    cleanup();
    expect(request(0).init.signal?.aborted).toBe(true);
    expect(request(1).init.signal?.aborted).toBe(true);
    await respond(0, { text: "Discarded résumé" });
    await reject(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
