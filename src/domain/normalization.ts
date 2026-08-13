const skillAliases: Record<string, string> = {
  "node.js": "node.js",
  nodejs: "node.js",
  node: "node.js",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  reactjs: "react",
  react: "react",
  nextjs: "next.js",
  "next.js": "next.js",
  postgres: "postgresql",
  postgresql: "postgresql",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  aws: "aws",
  "amazon web services": "aws",
  gcp: "google cloud",
  "google cloud platform": "google cloud",
  cicd: "ci/cd",
  "ci/cd": "ci/cd",
};

export function normalizeSkill(value: string): string {
  const cleaned = value.toLowerCase().trim().replace(/[®™]/g, "").replace(/\s+/g, " ");
  return skillAliases[cleaned] ?? cleaned;
}

export function normalizeRoleFamily(value: string): string {
  const normalized = value.toLowerCase();
  if (/data scientist|machine learning|ml engineer/.test(normalized)) return "data science";
  if (/quality assurance|qa engineer|test engineer/.test(normalized))
    return "software quality assurance";
  if (/web developer|frontend|front-end/.test(normalized)) return "web development";
  if (/software|backend|back-end|full.?stack|platform|developer|engineer/.test(normalized))
    return "software engineering";
  if (/product manager/.test(normalized)) return "product management";
  return normalized.trim() || "unknown";
}

export function containsNormalized(haystack: string, needle: string): boolean {
  const escaped = normalizeSkill(needle).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i").test(
    normalizeSkill(haystack),
  );
}

export function redactSensitiveProxies(text: string): string {
  return text
    .replace(/\b(?:born|age|aged)\s*[:\-]?\s*\d{1,3}\b/gi, "[excluded protected attribute]")
    .replace(
      /\b(?:male|female|gender|religion|marital status|pregnan(?:t|cy)|disabilit(?:y|ies))\s*[:\-]?[^\n]{0,80}/gi,
      "[excluded protected attribute]",
    )
    .replace(
      /(?:^|\n)\s*(?:date of birth|nationality|ethnicity|race|sexual orientation)\s*[:\-][^\n]*/gi,
      "\n[excluded protected attribute]",
    );
}
