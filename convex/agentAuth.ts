import { v } from "convex/values";
import { mutation, query, action, httpAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Poll rate-limit windows. Anyone polling /api/agent/poll faster than this
// gets a 429. A real agent polls every 2–5s, so 30/minute is generous.
const POLL_WINDOW_MS = 60_000;
const POLL_MAX_PER_WINDOW = 30;
// Longer, sticky window to kill brute-force sweeps that trickle under the
// per-minute cap: more than this many polls in 10 minutes = blocked.
const POLL_LONG_WINDOW_MS = 10 * 60_000;
const POLL_LONG_MAX = 200;

// Alphabet excludes confusable glyphs (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 12; // 12 chars from 31-char alphabet = ~59 bits of entropy

// WebCrypto is available in Convex's V8 runtime.
function randomCode(): string {
  const bytes = new Uint8Array(CODE_LEN);
  crypto.getRandomValues(bytes);
  const out: string[] = [];
  for (let i = 0; i < CODE_LEN; i++) {
    out.push(CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]);
  }
  // Group as XXXX-XXXX-XXXX for readability.
  return `${out.slice(0, 4).join("")}-${out.slice(4, 8).join("")}-${out.slice(8, 12).join("")}`;
}

function randomToken(): string {
  const bytes = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return `sket_${hex}`;
}

// Called by the agent (no auth required).
export const requestAgentAuth = mutation({
  args: {
    agentName: v.string(),
    targetUserHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.agentName.trim().slice(0, 80) || "Unnamed Agent";
    const target = args.targetUserHandle?.trim();

    // Code space is ~59 bits — collisions are effectively impossible, but
    // keep the retry loop as a defence-in-depth.
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
      targetUserHandle: target || undefined,
      status: "pending",
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    return { code };
  },
});

// Query: pending agent requests for the currently signed-in user.
// Matches by user's name/handle/email-prefix against targetUserHandle.
export const pendingForMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    const u = user as { name?: string; email?: string };
    const candidates = new Set<string>();
    if (u.name) candidates.add(u.name.toLowerCase().trim());
    if (u.email) {
      candidates.add(u.email.toLowerCase().trim());
      const prefix = u.email.split("@")[0];
      if (prefix) candidates.add(prefix.toLowerCase().trim());
    }

    const now = Date.now();
    const allPending = await ctx.db
      .query("agentAuthCodes")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return allPending
      .filter((c) => c.expiresAt > now)
      .filter(
        (c) =>
          c.targetUserHandle &&
          candidates.has(c.targetUserHandle.toLowerCase().trim()),
      )
      .map((c) => ({
        _id: c._id,
        code: c.code,
        agentName: c.agentName,
        expiresAt: c.expiresAt,
        _creationTime: c._creationTime,
      }));
  },
});

// Poll by agent (no auth required). Unlimited caller-safe — used only by the
// signed-in approval page which already knows the code it's polling for.
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

// Rate-limited poll used by the external HTTP endpoint. Tracks per-IP
// attempts so an attacker can't sweep the code space.
export const pollAgentAuthWithRateLimit = mutation({
  args: { code: v.string(), ip: v.string() },
  handler: async (ctx, args) => {
    const ip = args.ip.trim() || "unknown";
    const now = Date.now();
    const shortCutoff = now - POLL_WINDOW_MS;
    const longCutoff = now - POLL_LONG_WINDOW_MS;

    // Gather this IP's recent polls within the long window.
    const recent = await ctx.db
      .query("pollRateLimit")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .collect();

    const inLongWindow = recent.filter((r) => r.timestamp > longCutoff);
    const inShortWindow = inLongWindow.filter((r) => r.timestamp > shortCutoff);

    if (inShortWindow.length >= POLL_MAX_PER_WINDOW) {
      return { status: "rate_limited" as const, retryAfterSec: 60 };
    }
    if (inLongWindow.length >= POLL_LONG_MAX) {
      return { status: "rate_limited" as const, retryAfterSec: 600 };
    }

    // Record this poll.
    await ctx.db.insert("pollRateLimit", { ip, timestamp: now });

    // Opportunistic cleanup of records older than the long window.
    if (Math.random() < 0.1) {
      for (const r of recent) {
        if (r.timestamp <= longCutoff) await ctx.db.delete(r._id);
      }
    }

    // Do the actual code lookup.
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

// Called by the authenticated user who approves the agent.
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

// Called by the authenticated user who rejects.
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

// Treated as hard caps so a 5,000-char agentName or targetUserHandle
// gets rejected at the edge instead of silently sliced in the mutation.
const AGENT_NAME_MAX = 80;
const TARGET_HANDLE_MAX = 80;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// HTTP endpoint: POST /api/agent/request  → { code, approvalUrl }
export const httpRequestAgentAuth = httpAction(async (ctx, request) => {
  let body: unknown = {};
  const text = await request.text();
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      return jsonError("Request body is not valid JSON.", 400);
    }
  }
  if (body === null || typeof body !== "object") {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const b = body as { agentName?: unknown; targetUserHandle?: unknown };

  // agentName is required — the approval page shows it to the user,
  // so accepting a request without one would let agents hide their
  // identity behind "Unnamed Agent".
  if (b.agentName === undefined || b.agentName === null) {
    return jsonError("agentName is required.", 400);
  }
  if (typeof b.agentName !== "string") {
    return jsonError("agentName must be a string.", 400);
  }
  const agentNameTrimmed = b.agentName.trim();
  if (agentNameTrimmed.length === 0) {
    return jsonError("agentName must not be empty.", 400);
  }
  if (agentNameTrimmed.length > AGENT_NAME_MAX) {
    return jsonError(
      `agentName must be ${AGENT_NAME_MAX} characters or fewer.`,
      400,
    );
  }
  const agentName = agentNameTrimmed;

  let targetUserHandle: string | undefined;
  if (b.targetUserHandle !== undefined && b.targetUserHandle !== null) {
    if (typeof b.targetUserHandle !== "string") {
      return jsonError("targetUserHandle must be a string.", 400);
    }
    const trimmed = b.targetUserHandle.trim();
    if (trimmed.length === 0) {
      // Treat empty string as "no target" instead of erroring out —
      // common for callers that always send an empty string.
      targetUserHandle = undefined;
    } else if (trimmed.length > TARGET_HANDLE_MAX) {
      return jsonError(
        `targetUserHandle must be ${TARGET_HANDLE_MAX} characters or fewer.`,
        400,
      );
    } else {
      targetUserHandle = trimmed;
    }
  }

  const { code } = await ctx.runMutation(api.agentAuth.requestAgentAuth, {
    agentName,
    targetUserHandle,
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.SITE_URL ?? "http://localhost:3000";

  return new Response(
    JSON.stringify({ code, approvalUrl: `${siteUrl}/auth/agent/${code}` }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

// Pull a best-guess client IP out of request headers. Vercel/Convex sit behind
// proxies so the direct socket IP is theirs, not the caller's.
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// HTTP endpoint: GET /api/agent/poll?code=X → { status, token? }
// Rate-limited per client IP.
export const httpPollAgentAuth = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const ip = clientIp(request);

  const result = await ctx.runMutation(
    api.agentAuth.pollAgentAuthWithRateLimit,
    { code, ip },
  );

  if (result.status === "rate_limited") {
    return new Response(
      JSON.stringify({ status: "rate_limited", retryAfterSec: result.retryAfterSec }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSec),
        },
      },
    );
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
