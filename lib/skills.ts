import type { CategoryId } from "./categories";

export interface Skill {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CategoryId;
  tags: string[];
  author: {
    handle: string;
    avatar: string;
  };
  githubUrl: string;
  installCommand: string;
  installs: number;
  stars: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export const SKILLS: Skill[] = [
  {
    slug: "github-pr-reviewer",
    name: "GitHub PR Reviewer",
    tagline: "Automated PR review with security and style checks",
    description:
      "Reviews pull requests for security issues, style violations, and missing test coverage. Posts inline comments with actionable suggestions and severity tags.",
    category: "dev-tools",
    tags: ["github", "code-review", "security"],
    author: { handle: "anova", avatar: "🐙" },
    githubUrl: "https://github.com/example/github-pr-reviewer",
    installCommand: "skill-evo install github-pr-reviewer",
    installs: 12480,
    stars: 842,
    rating: 4.7,
    ratingCount: 213,
    createdAt: "2026-01-12",
    updatedAt: "2026-04-28",
    featured: true,
  },
  {
    slug: "postgres-migration-guard",
    name: "Postgres Migration Guard",
    tagline: "Safe schema migrations with concurrent-write checks",
    description:
      "Analyzes Postgres migrations for unsafe patterns (NOT NULL adds without defaults, blocking ALTERs, missing indexes). Produces a risk report and a safer migration plan.",
    category: "dev-tools",
    tags: ["postgres", "migrations", "safety"],
    author: { handle: "vela", avatar: "🐘" },
    githubUrl: "https://github.com/example/postgres-migration-guard",
    installCommand: "skill-evo install postgres-migration-guard",
    installs: 8930,
    stars: 612,
    rating: 4.8,
    ratingCount: 154,
    createdAt: "2026-02-03",
    updatedAt: "2026-04-30",
    featured: true,
  },
  {
    slug: "weekly-changelog",
    name: "Weekly Changelog",
    tagline: "Auto-generate changelogs from git history",
    description:
      "Reads commits from the last 7 days, groups them by type (feat / fix / docs), drafts a release note, and posts it to your team channel.",
    category: "automation",
    tags: ["git", "changelog", "weekly"],
    author: { handle: "kira", avatar: "📅" },
    githubUrl: "https://github.com/example/weekly-changelog",
    installCommand: "skill-evo install weekly-changelog",
    installs: 5640,
    stars: 318,
    rating: 4.5,
    ratingCount: 87,
    createdAt: "2026-01-22",
    updatedAt: "2026-04-15",
    featured: true,
  },
  {
    slug: "mcp-postgres",
    name: "MCP Postgres",
    tagline: "Postgres MCP server with read-only safeguards",
    description:
      "Exposes a Postgres database to your agent over MCP. Read-only by default; explicit allowlist for write operations. Includes query cost estimation.",
    category: "mcp-tools",
    tags: ["mcp", "postgres", "database"],
    author: { handle: "orion", avatar: "🔌" },
    githubUrl: "https://github.com/example/mcp-postgres",
    installCommand: "skill-evo install mcp-postgres",
    installs: 21300,
    stars: 1542,
    rating: 4.9,
    ratingCount: 401,
    createdAt: "2025-11-08",
    updatedAt: "2026-04-29",
    featured: true,
  },
  {
    slug: "interview-prep-coach",
    name: "Interview Prep Coach",
    tagline: "System design + behavioral interview practice",
    description:
      "Conducts mock interviews with adaptive difficulty. Tracks weak areas across sessions and generates a focused study plan.",
    category: "prompts",
    tags: ["interview", "coaching", "career"],
    author: { handle: "mira", avatar: "🎓" },
    githubUrl: "https://github.com/example/interview-prep-coach",
    installCommand: "skill-evo install interview-prep-coach",
    installs: 3210,
    stars: 198,
    rating: 4.6,
    ratingCount: 62,
    createdAt: "2026-03-04",
    updatedAt: "2026-04-22",
  },
  {
    slug: "secret-scanner",
    name: "Secret Scanner",
    tagline: "Find leaked credentials in any repo or PR",
    description:
      "Scans diffs for high-entropy strings, common API key prefixes (sk-, ghp_, AKIA…), and known exfil patterns. Quarantines and reports findings.",
    category: "security",
    tags: ["secrets", "security", "audit"],
    author: { handle: "atlas", avatar: "🛡️" },
    githubUrl: "https://github.com/example/secret-scanner",
    installCommand: "skill-evo install secret-scanner",
    installs: 14820,
    stars: 1108,
    rating: 4.8,
    ratingCount: 287,
    createdAt: "2025-12-19",
    updatedAt: "2026-04-26",
  },
  {
    slug: "openapi-fetcher",
    name: "OpenAPI Fetcher",
    tagline: "Call any OpenAPI-described service from your agent",
    description:
      "Point this skill at an OpenAPI spec URL; it generates typed callers and exposes them as tools. Handles auth, retries, and rate limits.",
    category: "data-apis",
    tags: ["openapi", "rest", "integration"],
    author: { handle: "lyra", avatar: "📡" },
    githubUrl: "https://github.com/example/openapi-fetcher",
    installCommand: "skill-evo install openapi-fetcher",
    installs: 6790,
    stars: 421,
    rating: 4.4,
    ratingCount: 103,
    createdAt: "2026-02-14",
    updatedAt: "2026-04-18",
  },
  {
    slug: "incident-responder",
    name: "Incident Responder",
    tagline: "Triage alerts, draft postmortems",
    description:
      "Listens to PagerDuty / OpsGenie webhooks, summarizes the incident, pulls related logs, and drafts an initial postmortem with timeline and contributing factors.",
    category: "workflows",
    tags: ["incident", "oncall", "postmortem"],
    author: { handle: "nova", avatar: "🚨" },
    githubUrl: "https://github.com/example/incident-responder",
    installCommand: "skill-evo install incident-responder",
    installs: 4150,
    stars: 287,
    rating: 4.6,
    ratingCount: 71,
    createdAt: "2026-01-28",
    updatedAt: "2026-04-12",
  },
  {
    slug: "calendar-batch",
    name: "Calendar Batch",
    tagline: "Group meetings into focus blocks",
    description:
      "Analyzes your calendar, suggests rescheduling to create focus blocks of 90+ minutes, and drafts polite reschedule requests for stakeholders.",
    category: "automation",
    tags: ["calendar", "productivity"],
    author: { handle: "ren", avatar: "🗓️" },
    githubUrl: "https://github.com/example/calendar-batch",
    installCommand: "skill-evo install calendar-batch",
    installs: 2890,
    stars: 156,
    rating: 4.3,
    ratingCount: 48,
    createdAt: "2026-03-15",
    updatedAt: "2026-04-20",
  },
  {
    slug: "design-token-sync",
    name: "Design Token Sync",
    tagline: "Keep Figma tokens and Tailwind config in lockstep",
    description:
      "Watches your Figma file for token changes and opens a PR to update tailwind.config.ts and css custom properties. Diffs are reviewed before merge.",
    category: "dev-tools",
    tags: ["design-system", "figma", "tailwind"],
    author: { handle: "iris", avatar: "🎨" },
    githubUrl: "https://github.com/example/design-token-sync",
    installCommand: "skill-evo install design-token-sync",
    installs: 1820,
    stars: 134,
    rating: 4.5,
    ratingCount: 39,
    createdAt: "2026-02-26",
    updatedAt: "2026-04-08",
  },
];

export function getSkill(slug: string): Skill | undefined {
  return SKILLS.find((s) => s.slug === slug);
}

export function getFeaturedSkills(): Skill[] {
  return SKILLS.filter((s) => s.featured);
}

export type SortKey = "featured" | "installs" | "stars" | "newest" | "name";

export interface SkillFilter {
  category?: string;
  query?: string;
  sort?: SortKey;
}

export function filterSkills(skills: Skill[], filter: SkillFilter): Skill[] {
  let result = skills;

  if (filter.category && filter.category !== "all") {
    result = result.filter((s) => s.category === filter.category);
  }

  if (filter.query) {
    const q = filter.query.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  switch (filter.sort) {
    case "installs":
      result = [...result].sort((a, b) => b.installs - a.installs);
      break;
    case "stars":
      result = [...result].sort((a, b) => b.stars - a.stars);
      break;
    case "newest":
      result = [...result].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    case "name":
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "featured":
    default:
      result = [...result].sort((a, b) => {
        const af = a.featured ? 1 : 0;
        const bf = b.featured ? 1 : 0;
        if (af !== bf) return bf - af;
        return b.installs - a.installs;
      });
      break;
  }

  return result;
}

export function totalStats() {
  return {
    skills: SKILLS.length,
    installs: SKILLS.reduce((acc, s) => acc + s.installs, 0),
    avgRating: SKILLS.reduce((acc, s) => acc + s.rating, 0) / SKILLS.length,
  };
}
