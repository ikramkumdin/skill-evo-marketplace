// Alias for skills:categoryCounts, plus a list of category IDs. Documented in
// llms-full.txt.

import { query } from "./_generated/server";

const CATEGORY_IDS = [
  { id: "mcp-tools", name: "MCP Tools", description: "Model Context Protocol servers" },
  { id: "prompts", name: "Prompts", description: "Reusable prompt templates" },
  { id: "workflows", name: "Workflows", description: "Multi-step agent workflows" },
  { id: "dev-tools", name: "Dev Tools", description: "Code, debug, deploy" },
  { id: "data-apis", name: "Data & APIs", description: "Fetch, parse, transform data" },
  { id: "security", name: "Security", description: "Audit, scan, harden" },
  { id: "automation", name: "Automation", description: "Scheduled and triggered tasks" },
  { id: "other", name: "Other", description: "Everything else" },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    const skills = await ctx.db.query("skills").collect();
    const counts: Record<string, number> = {};
    for (const s of skills) counts[s.category] = (counts[s.category] ?? 0) + 1;
    return CATEGORY_IDS.map((c) => ({ ...c, count: counts[c.id] ?? 0 }));
  },
});
