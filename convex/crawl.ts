import { v } from "convex/values";
import { action, mutation, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";

const ANTHROPIC_OWNER = "anthropics";
const ANTHROPIC_REPO = "skills";
const ANTHROPIC_SKILLS_PATH = "skills";

type GitHubDir = {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
};

type ParsedSkill = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  githubUrl: string;
  installCommand: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseFrontmatter(markdown: string): Record<string, string> | null {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const body = match[1];
  const result: Record<string, string> = {};
  // Simple YAML parser: handles `key: value` (multi-line values not supported)
  for (const line of body.split("\n")) {
    const m = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[m[1]] = val;
  }
  return result;
}

// Map to real categories defined in lib/categories.ts:
// mcp-tools | prompts | workflows | dev-tools | data-apis | security | automation | other
function guessCategory(name: string, description: string): string {
  const haystack = `${name} ${description}`.toLowerCase();
  if (/(mcp|model context protocol)/.test(haystack)) return "mcp-tools";
  if (/(security|audit|encrypt|vulnerab|harden|sast)/.test(haystack)) return "security";
  if (/(slack|teams|chat|email|notify|cron|schedul|automation|webhook)/.test(haystack)) return "automation";
  if (/(workflow|orchestrat|pipeline|coauthor|multi-step|step-by-step)/.test(haystack)) return "workflows";
  if (/(prompt|template|few-shot|system prompt)/.test(haystack)) return "prompts";
  if (/(api|sdk|database|postgres|sql|graphql|fetch|rest|integrat)/.test(haystack)) return "data-apis";
  if (/(code|debug|deploy|test|build|skill creator|claude code|frontend|webapp)/.test(haystack)) return "dev-tools";
  return "other";
}

function guessTags(name: string, description: string): string[] {
  const tags = new Set<string>();
  const haystack = `${name} ${description}`.toLowerCase();
  const candidates = [
    "pdf",
    "docx",
    "pptx",
    "xlsx",
    "slack",
    "design",
    "frontend",
    "api",
    "mcp",
    "test",
    "doc",
    "writing",
    "art",
    "canvas",
    "brand",
    "theme",
    "internal",
    "skill",
  ];
  for (const c of candidates) if (haystack.includes(c)) tags.add(c);
  if (tags.size === 0) tags.add("anthropic");
  return [...tags].slice(0, 5);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "skill-evo-marketplace",
    },
  });
  if (!res.ok) throw new Error(`GitHub fetch ${url} failed: ${res.status}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "skill-evo-marketplace" } });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return res.text();
}

// --- Action: crawl Anthropic's official skills repo ---------------------

export const crawlAnthropicSkills = action({
  args: {},
  handler: async (ctx): Promise<{ inserted: number; skipped: number; total: number }> => {
    return await ctx.runAction(api.crawl.crawlGitHubRepo, {
      owner: ANTHROPIC_OWNER,
      repo: ANTHROPIC_REPO,
      skillsPath: ANTHROPIC_SKILLS_PATH,
      submitterHandle: "anthropics",
    });
  },
});

// --- Action: crawl ANY GitHub repo for SKILL.md files -------------------

export const crawlGitHubRepo = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    skillsPath: v.optional(v.string()),    // subdirectory containing skills (default: "skills")
    branch: v.optional(v.string()),        // default: "main"
    submitterHandle: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ inserted: number; skipped: number; total: number }> => {
    const path = args.skillsPath ?? "skills";
    const branch = args.branch ?? "main";
    const handle = args.submitterHandle ?? args.owner;

    let listing: GitHubDir[];
    try {
      listing = (await fetchJson(
        `https://api.github.com/repos/${args.owner}/${args.repo}/contents/${path}?ref=${branch}`,
      )) as GitHubDir[];
    } catch {
      return { inserted: 0, skipped: 0, total: 0 };
    }

    const dirs = listing.filter((e) => e.type === "dir");

    const parsed: ParsedSkill[] = [];
    for (const dir of dirs) {
      try {
        const skillMd = await fetchText(
          `https://raw.githubusercontent.com/${args.owner}/${args.repo}/${branch}/${path}/${dir.name}/SKILL.md`,
        );
        const fm = parseFrontmatter(skillMd);
        if (!fm?.name || !fm?.description) continue;

        const description = fm.description;
        const tagline = description.length > 120 ? description.slice(0, 117) + "..." : description;
        const slug = slugify(`${args.owner}-${fm.name}`);

        parsed.push({
          slug,
          name: fm.name,
          tagline,
          description,
          category: guessCategory(fm.name, description),
          tags: guessTags(fm.name, description),
          githubUrl: `https://github.com/${args.owner}/${args.repo}/tree/${branch}/${path}/${dir.name}`,
          installCommand: `git clone --depth=1 https://github.com/${args.owner}/${args.repo} && cp -r ${path}/${dir.name} ~/.claude/skills/${slugify(fm.name)}`,
        });
      } catch {
        // Skip dirs without a SKILL.md or with fetch errors
      }
    }

    const result = await ctx.runMutation(internal.crawl.upsertCrawledSkills, {
      skills: parsed,
      submitterHandle: handle,
    });
    return { ...result, total: parsed.length };
  },
});

// --- Internal mutation: upsert crawled skills ---------------------------

export const upsertCrawledSkills = internalMutation({
  args: {
    skills: v.array(
      v.object({
        slug: v.string(),
        name: v.string(),
        tagline: v.string(),
        description: v.string(),
        category: v.string(),
        tags: v.array(v.string()),
        githubUrl: v.string(),
        installCommand: v.string(),
      }),
    ),
    submitterHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const handle = args.submitterHandle ?? "crawler";
    let inserted = 0;
    let skipped = 0;
    for (const s of args.skills) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_slug", (q) => q.eq("slug", s.slug))
        .first();
      if (existing) {
        skipped++;
        continue;
      }
      await ctx.db.insert("skills", {
        slug: s.slug,
        name: s.name,
        tagline: s.tagline,
        description: s.description,
        category: s.category,
        tags: s.tags,
        githubUrl: s.githubUrl,
        installCommand: s.installCommand,
        installs: 0,
        stars: 0,
        rating: 0,
        ratingCount: 0,
        featured: false,
        submitterHandle: handle,
        submitterAvatar: "🤖",
        source: "crawled",
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

// One-shot: rewrite category on existing skills that used invented categories.
export const recategorizeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("skills").collect();
    const validCategories = new Set([
      "mcp-tools",
      "prompts",
      "workflows",
      "dev-tools",
      "data-apis",
      "security",
      "automation",
      "other",
    ]);
    let fixed = 0;
    for (const s of all) {
      if (validCategories.has(s.category)) continue;
      const next = guessCategory(s.name, s.description);
      await ctx.db.patch(s._id, { category: next });
      fixed++;
    }
    return { fixed, total: all.length };
  },
});

export const listCrawled = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("skills").collect();
    return all.filter((s) => s.source === "crawled");
  },
});
