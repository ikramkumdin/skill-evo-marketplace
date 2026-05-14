export type CategoryId =
  | "mcp-tools"
  | "prompts"
  | "workflows"
  | "dev-tools"
  | "data-apis"
  | "security"
  | "automation"
  | "other";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "mcp-tools", name: "MCP Tools", description: "Model Context Protocol servers", icon: "🔌" },
  { id: "prompts", name: "Prompts", description: "Reusable prompt templates", icon: "💬" },
  { id: "workflows", name: "Workflows", description: "Multi-step agent workflows", icon: "🔁" },
  { id: "dev-tools", name: "Dev Tools", description: "Code, debug, deploy", icon: "🛠️" },
  { id: "data-apis", name: "Data & APIs", description: "Fetch, parse, transform data", icon: "📊" },
  { id: "security", name: "Security", description: "Audit, scan, harden", icon: "🛡️" },
  { id: "automation", name: "Automation", description: "Scheduled and triggered tasks", icon: "⚡" },
  { id: "other", name: "Other", description: "Everything else", icon: "✨" },
];

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
