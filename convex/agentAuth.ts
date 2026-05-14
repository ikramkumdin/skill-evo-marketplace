import { v } from "convex/values";
import { mutation, query, action, httpAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const ADJECTIVES = [
  "Blue", "Red", "Gold", "Jade", "Iron", "Neon", "Dark", "Calm", "Swift", "Wise",
];
const NOUNS = [
  "Lion", "Hawk", "Wolf", "Star", "Moon", "Sage", "River", "Storm", "Echo", "Pulse",
];

function randomCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90 + 10); // 10–99
  return `${adj}-${noun}-${num}`;
}

function randomToken(): string {
  const bytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0"),
  );
  return `sket_${bytes.join("")}`;
}

// Called by the agent (no auth required)
export const requestAgentAuth = mutation({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    const name = args.agentName.trim().slice(0, 80) || "Unnamed Agent";

    // Generate a unique code (retry on collision)
    let code = randomCode();
    for (let i = 0; i < 5; i++) {
      const existing = await ctx.db
        .query("agentAuthCodes")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing || existing.status !== "pending") break;
      code = randomCode();
    }

    await ctx.db.insert("agentAuthCodes", {
      code,
      agentName: name,
      status: "pending",
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    return { code };
  },
});

// Poll by agent (no auth required)
export const pollAgentAuth = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("agentAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!record) return { status: "not_found" as const };
    if (Date.now() > record.expiresAt) return { status: "expired" as const };

    return {
      status: record.status,
      token: record.status === "approved" ? record.token : undefined,
      agentName: record.agentName,
    };
  },
});

// Called by the authenticated user who approves the agent
export const approveAgentAuth = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to approve agent access.");

    const record = await ctx.db
      .query("agentAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!record) throw new Error("Code not found.");
    if (record.status !== "pending") throw new Error("Code already used.");
    if (Date.now() > record.expiresAt) throw new Error("Code expired.");

    const token = randomToken();
    await ctx.db.patch(record._id, {
      status: "approved",
      userId,
      token,
    });

    return { approved: true };
  },
});

// Called by the authenticated user who rejects
export const rejectAgentAuth = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to reject agent access.");

    const record = await ctx.db
      .query("agentAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!record) throw new Error("Code not found.");
    if (record.status !== "pending") throw new Error("Code already used.");

    await ctx.db.patch(record._id, { status: "rejected" });
    return { rejected: true };
  },
});

// HTTP endpoint: POST /api/agent/request  → { code, approvalUrl }
export const httpRequestAgentAuth = httpAction(async (ctx, request) => {
  let agentName = "Unnamed Agent";
  try {
    const body = await request.json();
    if (typeof body.agentName === "string") agentName = body.agentName;
  } catch { /* no body */ }

  const { code } = await ctx.runMutation(api.agentAuth.requestAgentAuth, { agentName });

  const siteUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.SITE_URL ?? "http://localhost:3000";

  return new Response(
    JSON.stringify({ code, approvalUrl: `${siteUrl}/auth/agent/${code}` }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

// HTTP endpoint: GET /api/agent/poll?code=X → { status, token? }
export const httpPollAgentAuth = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";

  const result = await ctx.runQuery(api.agentAuth.pollAgentAuth, { code });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
