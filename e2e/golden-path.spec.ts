import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const resume = `Senior Software Engineer\nEight years of software engineering experience.\n- Led a TypeScript and Node.js migration that reduced API latency by 42% for 18000 users.\n- Designed PostgreSQL models and automated testing on AWS.\nSkills: TypeScript, Node.js, React, PostgreSQL, AWS, Docker, testing.`;
const job = `Senior Software Engineer — Platform\nMust have:\n- 6+ years of software engineering experience.\n- Strong TypeScript and Node.js experience.\n- Production PostgreSQL data modeling.\n- Experience with AWS and automated testing.\nPreferred:\n- Kubernetes experience.\n- Platform engineering background.`;

function captureBrowserFailures(page: import("@playwright/test").Page) {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("pageerror", (error) => failures.push(error.message));
  return failures;
}

test("complete no-secret analysis, private report, print action, and deletion", async ({
  page,
}, testInfo) => {
  const browserFailures = captureBrowserFailures(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Know your leverage/ })).toBeVisible();
  if (process.env.CAPTURE_SURFACES) {
    await page.screenshot({
      path: `test-results/landing-${testInfo.project.name}.png`,
      fullPage: false,
    });
  }
  await page
    .getByRole("link", { name: /Analyze my opportunity/ })
    .first()
    .click();
  await page.getByLabel(/Résumé text/).fill(resume);
  await page.getByLabel(/Job description text/).fill(job);
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel(/Role location/).fill("Seattle, WA, United States");
  await page.getByLabel("Work arrangement").selectOption("hybrid");
  await page.getByLabel(/Years of relevant experience/).fill("8");
  await page.getByRole("button", { name: /Extract facts for review/ }).click();
  await expect(page.getByRole("heading", { name: /Review the extracted record/ })).toBeVisible();
  if (process.env.CAPTURE_SURFACES && testInfo.project.name === "desktop-chromium") {
    await page.screenshot({ path: "test-results/review-desktop.png", fullPage: false });
  }
  await expect(
    page.getByText(/External AI was not called|Deterministic extraction/).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /Generate Job Fit Report/ }).click();
  await expect(
    page.getByRole("heading", { name: /Senior Software Engineer/ }).first(),
  ).toBeVisible();
  await expect(page.getByText("Evidence-backed fit").first()).toBeVisible();
  await expect(page.getByText(/Bureau of Labor Statistics/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Print \/ Save as PDF/ })).toBeVisible();
  await page.getByRole("button", { name: /Delete analysis/ }).click();
  await expect(page.getByRole("heading", { name: /Delete this analysis/ })).toBeVisible();
  await page.getByRole("button", { name: /Delete permanently/ }).click();
  await expect(page).toHaveURL(/\/?deleted=1/);
  expect(browserFailures).toEqual([]);
});

test("demo report is complete, labeled synthetic, responsive, and has no serious axe violations", async ({
  page,
}, testInfo) => {
  const browserFailures = captureBrowserFailures(page);
  await page.goto("/demo");
  await expect(page.getByText(/Demo data · synthetic/)).toBeVisible();
  await expect(page.getByText(/Synthetic demo compensation/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /A score you can audit/ })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  if (process.env.CAPTURE_MOBILE && testInfo.project.name === "mobile-chromium") {
    await page.screenshot({ path: "test-results/mobile-qa.png", fullPage: false });
  }
  if (process.env.CAPTURE_PREVIEW && testInfo.project.name === "desktop-chromium") {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.screenshot({ path: "docs/assets/offerlens-demo.png", fullPage: false });
  }
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("navigation", { name: "Report sections" })).toBeHidden();
  await expect(page.getByRole("heading", { name: /A score you can audit/ })).toBeVisible();
  expect(browserFailures).toEqual([]);
});
