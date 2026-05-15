import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
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

function guessCategory(name: string, description: string): string {
  const haystack = `${name} ${description}`.toLowerCase();
  if (/(pdf|docx|pptx|xlsx|spreadsheet|document)/.test(haystack)) return "productivity";
  if (/(slack|teams|email|chat|comm)/.test(haystack)) return "automation";
  if (/(design|canvas|brand|gif|theme|art|frontend)/.test(haystack)) return "content";
  if (/(api|sdk|mcp|builder|test|debug)/.test(haystack)) return "dev-tools";
  if (/(webapp|web)/.test(haystack)) return "dev-tools";
  return "dev-tools";
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
    const listing = (await fetchJson(
      `https://api.github.com/repos/${ANTHROPIC_OWNER}/${ANTHROPIC_REPO}/contents/${ANTHROPIC_SKILLS_PATH}`,
    )) as GitHubDir[];

    const dirs = listing.filter((e) => e.type === "dir");

    const parsed: ParsedSkill[] = [];
    for (const dir of dirs) {
      try {
        const skillMd = await fetchText(
          `https://raw.githubusercontent.com/${ANTHROPIC_OWNER}/${ANTHROPIC_REPO}/main/${ANTHROPIC_SKILLS_PATH}/${dir.name}/SKILL.md`,
        );
        const fm = parseFrontmatter(skillMd);
        if (!fm?.name || !fm?.description) continue;

        const description = fm.description;
        const tagline = description.length > 120 ? description.slice(0, 117) + "..." : description;

        parsed.push({
          slug: slugify(fm.name),
          name: fm.name,
          tagline,
          description,
          category: guessCategory(fm.name, description),
          tags: guessTags(fm.name, description),
          githubUrl: `https://github.com/${ANTHROPIC_OWNER}/${ANTHROPIC_REPO}/tree/main/${ANTHROPIC_SKILLS_PATH}/${dir.name}`,
          installCommand: `git clone --depth=1 https://github.com/${ANTHROPIC_OWNER}/${ANTHROPIC_REPO} && cp -r skills/${ANTHROPIC_SKILLS_PATH}/${dir.name} ~/.claude/skills/${slugify(fm.name)}`,
        });
      } catch {
        // Skip dirs without a SKILL.md or with fetch errors
      }
    }

    const result = await ctx.runMutation(internal.crawl.upsertCrawledSkills, {
      skills: parsed,
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
  },
  handler: async (ctx, args) => {
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
        submitterHandle: "anthropics",
        submitterAvatar: "🤖",
        source: "crawled",
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});

export const listCrawled = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("skills").collect();
    return all.filter((s) => s.source === "crawled");
  },
});
