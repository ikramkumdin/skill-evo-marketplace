import { internalMutation } from "./_generated/server";

const SEED_SKILLS = [
  {
    slug: "github-pr-reviewer",
    name: "GitHub PR Reviewer",
    tagline: "Automated PR review with security and style checks",
    description:
      "Reviews pull requests for security issues, style violations, and missing test coverage. Posts inline comments with actionable suggestions and severity tags.",
    category: "dev-tools",
    tags: ["github", "code-review", "security"],
    githubUrl: "https://github.com/example/github-pr-reviewer",
    installCommand: "skill-evo install github-pr-reviewer",
    installs: 12480,
    stars: 842,
    rating: 4.7,
    ratingCount: 213,
    featured: true,
    submitterHandle: "anova",
    submitterAvatar: "🐙",
  },
  {
    slug: "postgres-migration-guard",
    name: "Postgres Migration Guard",
    tagline: "Safe schema migrations with concurrent-write checks",
    description:
      "Analyzes Postgres migrations for unsafe patterns (NOT NULL adds without defaults, blocking ALTERs, missing indexes). Produces a risk report and a safer migration plan.",
    category: "dev-tools",
    tags: ["postgres", "migrations", "safety"],
    githubUrl: "https://github.com/example/postgres-migration-guard",
    installCommand: "skill-evo install postgres-migration-guard",
    installs: 8930,
    stars: 612,
    rating: 4.8,
    ratingCount: 154,
    featured: true,
    submitterHandle: "vela",
    submitterAvatar: "🐘",
  },
  {
    slug: "weekly-changelog",
    name: "Weekly Changelog",
    tagline: "Auto-generate changelogs from git history",
    description:
      "Reads commits from the last 7 days, groups them by type (feat / fix / docs), drafts a release note, and posts it to your team channel.",
    category: "automation",
    tags: ["git", "changelog", "weekly"],
    githubUrl: "https://github.com/example/weekly-changelog",
    installCommand: "skill-evo install weekly-changelog",
    installs: 5640,
    stars: 318,
    rating: 4.5,
    ratingCount: 87,
    featured: true,
    submitterHandle: "kira",
    submitterAvatar: "📅",
  },
  {
    slug: "mcp-postgres",
    name: "MCP Postgres",
    tagline: "Postgres MCP server with read-only safeguards",
    description:
      "Exposes a Postgres database to your agent over MCP. Read-only by default; explicit allowlist for write operations. Includes query cost estimation.",
    category: "mcp-tools",
    tags: ["mcp", "postgres", "database"],
    githubUrl: "https://github.com/example/mcp-postgres",
    installCommand: "skill-evo install mcp-postgres",
    installs: 21300,
    stars: 1542,
    rating: 4.9,
    ratingCount: 401,
    featured: true,
    submitterHandle: "orion",
    submitterAvatar: "🔌",
  },
  {
    slug: "interview-prep-coach",
    name: "Interview Prep Coach",
    tagline: "System design + behavioral interview practice",
    description:
      "Conducts mock interviews with adaptive difficulty. Tracks weak areas across sessions and generates a focused study plan.",
    category: "prompts",
    tags: ["interview", "coaching", "career"],
    githubUrl: "https://github.com/example/interview-prep-coach",
    installCommand: "skill-evo install interview-prep-coach",
    installs: 3210,
    stars: 198,
    rating: 4.6,
    ratingCount: 62,
    featured: false,
    submitterHandle: "mira",
    submitterAvatar: "🎓",
  },
  {
    slug: "secret-scanner",
    name: "Secret Scanner",
    tagline: "Find leaked credentials in any repo or PR",
    description:
      "Scans diffs for high-entropy strings, common API key prefixes (sk-, ghp_, AKIA…), and known exfil patterns. Quarantines and reports findings.",
    category: "security",
    tags: ["secrets", "security", "audit"],
    githubUrl: "https://github.com/example/secret-scanner",
    installCommand: "skill-evo install secret-scanner",
    installs: 14820,
    stars: 1108,
    rating: 4.8,
    ratingCount: 287,
    featured: false,
    submitterHandle: "atlas",
    submitterAvatar: "🛡️",
  },
  {
    slug: "openapi-fetcher",
    name: "OpenAPI Fetcher",
    tagline: "Call any OpenAPI-described service from your agent",
    description:
      "Point this skill at an OpenAPI spec URL; it generates typed callers and exposes them as tools. Handles auth, retries, and rate limits.",
    category: "data-apis",
    tags: ["openapi", "rest", "integration"],
    githubUrl: "https://github.com/example/openapi-fetcher",
    installCommand: "skill-evo install openapi-fetcher",
    installs: 6790,
    stars: 421,
    rating: 4.4,
    ratingCount: 103,
    featured: false,
    submitterHandle: "lyra",
    submitterAvatar: "📡",
  },
  {
    slug: "incident-responder",
    name: "Incident Responder",
    tagline: "Triage alerts, draft postmortems",
    description:
      "Listens to PagerDuty / OpsGenie webhooks, summarizes the incident, pulls related logs, and drafts an initial postmortem with timeline and contributing factors.",
    category: "workflows",
    tags: ["incident", "oncall", "postmortem"],
    githubUrl: "https://github.com/example/incident-responder",
    installCommand: "skill-evo install incident-responder",
    installs: 4150,
    stars: 287,
    rating: 4.6,
    ratingCount: 71,
    featured: false,
    submitterHandle: "nova",
    submitterAvatar: "🚨",
  },
  {
    slug: "calendar-batch",
    name: "Calendar Batch",
    tagline: "Group meetings into focus blocks",
    description:
      "Analyzes your calendar, suggests rescheduling to create focus blocks of 90+ minutes, and drafts polite reschedule requests for stakeholders.",
    category: "automation",
    tags: ["calendar", "productivity"],
    githubUrl: "https://github.com/example/calendar-batch",
    installCommand: "skill-evo install calendar-batch",
    installs: 2890,
    stars: 156,
    rating: 4.3,
    ratingCount: 48,
    featured: false,
    submitterHandle: "ren",
    submitterAvatar: "🗓️",
  },
  {
    slug: "design-token-sync",
    name: "Design Token Sync",
    tagline: "Keep Figma tokens and Tailwind config in lockstep",
    description:
      "Watches your Figma file for token changes and opens a PR to update tailwind.config.ts and css custom properties. Diffs are reviewed before merge.",
    category: "dev-tools",
    tags: ["design-system", "figma", "tailwind"],
    githubUrl: "https://github.com/example/design-token-sync",
    installCommand: "skill-evo install design-token-sync",
    installs: 1820,
    stars: 134,
    rating: 4.5,
    ratingCount: 39,
    featured: false,
    submitterHandle: "iris",
    submitterAvatar: "🎨",
  },
];

export const seedSkills = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let skipped = 0;
    for (const s of SEED_SKILLS) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_slug", (q) => q.eq("slug", s.slug))
        .first();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("skills", s);
      inserted++;
    }
    return { inserted, skipped };
  },
});
