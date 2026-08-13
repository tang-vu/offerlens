import { normalizeSkill } from "@/domain/normalization";
import type { CandidateProfile } from "@/domain/schemas";

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  license: { spdx_id: string } | null;
  topics?: string[];
}

const headers = () => ({
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "OfferLens/0.1",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function parseGithubUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com")
    throw new Error("Only public https://github.com profile or repository URLs are supported.");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 1 || parts.length > 2 || parts.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part)))
    throw new Error("Use a GitHub profile or repository URL.");
  return { owner: parts[0]!, repo: parts[1] };
}

async function inspectRepo(owner: string, repo: string) {
  const metadata = await githubFetch<GitHubRepo>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
  );
  const contents = await githubFetch<Array<{ name: string; type: string }>>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`,
  ).catch(() => []);
  const rootNames = contents.map((item) => item.name.toLowerCase());
  const hasDocs = rootNames.some((name) => /^readme(?:\.|$)/.test(name) || name === "docs");
  const hasTests = rootNames.some((name) => ["test", "tests", "__tests__", "spec"].includes(name));
  const hasCi = rootNames.includes(".github");
  return { metadata, hasDocs, hasTests, hasCi };
}

export async function collectGithubEvidence(urls: string[]) {
  const evidence: CandidateProfile["evidence"] = [];
  const skills: CandidateProfile["skills"] = [];
  const warnings: string[] = [];
  const seenRepos = new Set<string>();

  for (const raw of urls.slice(0, 5)) {
    try {
      const parsed = parseGithubUrl(raw);
      const repos = parsed.repo
        ? [await inspectRepo(parsed.owner, parsed.repo)]
        : (
            await githubFetch<GitHubRepo[]>(
              `/users/${encodeURIComponent(parsed.owner)}/repos?sort=pushed&per_page=5&type=owner`,
            )
          )
            .filter((repo) => !repo.fork)
            .slice(0, 3)
            .map((repo) => ({ metadata: repo, hasDocs: false, hasTests: false, hasCi: false }));
      for (const repo of repos) {
        if (seenRepos.has(repo.metadata.full_name)) continue;
        seenRepos.add(repo.metadata.full_name);
        const recent =
          Date.now() - new Date(repo.metadata.pushed_at).getTime() < 365 * 24 * 60 * 60 * 1_000;
        const signals = [
          repo.metadata.language,
          repo.hasDocs ? "documentation" : undefined,
          repo.hasTests ? "tests" : undefined,
          repo.hasCi ? "CI configuration" : undefined,
          repo.metadata.license?.spdx_id ? `${repo.metadata.license.spdx_id} license` : undefined,
          recent ? "activity within the last year" : "no recent activity signal",
        ].filter(Boolean);
        const id = `github-${evidence.length + 1}`;
        evidence.push({
          id,
          sourceType: "github",
          sourceIdentifier: repo.metadata.html_url,
          excerpt: `${repo.metadata.full_name}: ${signals.join(" · ")}`.slice(0, 500),
          structuredFact: `Public repository metadata shows ${signals.join(", ")}.`,
          relevance:
            "Corroborates public project technology and quality signals; stars and raw commit volume are not used as ability evidence.",
          confidence: parsed.repo ? 0.82 : 0.68,
          extractionMethod: "github-api",
        });
        if (
          repo.metadata.language &&
          !skills.some((skill) => skill.normalized === normalizeSkill(repo.metadata.language!))
        ) {
          skills.push({
            name: repo.metadata.language,
            normalized: normalizeSkill(repo.metadata.language),
            evidenceIds: [id],
          });
        }
      }
    } catch {
      warnings.push(
        `GitHub evidence could not be retrieved for ${new URL(raw).hostname}. The analysis can continue without it.`,
      );
    }
  }
  return { evidence, skills, warnings };
}
