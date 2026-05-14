import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id, Doc } from "./_generated/dataModel";

const STARTING_BALANCE = 500;

// Platform fee on every Skill sale (15% to platform, 85% to author)
export const PLATFORM_FEE_RATE = 0.15;

// Cash-out conversion + thresholds
export const POINTS_PER_USD = 100; // 100 pts = $1
export const MIN_PAYOUT_POINTS = 1000; // $10 minimum

async function getBalanceForUser(
  ctx: { db: { query: (table: "pointsLedger") => { withIndex: Function } } },
  userId: Id<"users">,
): Promise<number> {
  const rows: Doc<"pointsLedger">[] = await ctx.db
    .query("pointsLedger")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  if (rows.length === 0) return STARTING_BALANCE;
  return rows.reduce((acc, r) => acc + r.delta, 0);
}

export const myBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return getBalanceForUser(ctx, userId);
  },
});

export const hasPurchased = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const row = await ctx.db
      .query("purchases")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();
    return row !== null;
  },
});

export const purchaseSkill = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to purchase a Skill.");

    const skill = await ctx.db.get(args.skillId);
    if (!skill) throw new Error("Skill not found.");

    const price = skill.pricePoints ?? 0;
    if (price === 0) throw new Error("This Skill is free — no purchase needed.");

    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();
    if (existing) throw new Error("You already own this Skill.");

    const balance = await getBalanceForUser(ctx, userId);
    if (balance < price) {
      throw new Error(`Not enough points. You have ${balance}, need ${price}.`);
    }

    // Buyer pays full price
    await ctx.db.insert("pointsLedger", {
      userId,
      delta: -price,
      reason: `Purchased: ${skill.name}`,
      relatedSkillId: args.skillId,
    });

    // Seller gets 85% (rounded down); the 15% platform fee is the implicit
    // remainder — we don't credit it anywhere (platform earns it by retaining
    // the difference).
    if (skill.submitterId) {
      const sellerCut = Math.floor(price * (1 - PLATFORM_FEE_RATE));
      await ctx.db.insert("pointsLedger", {
        userId: skill.submitterId,
        delta: sellerCut,
        reason: `Sale of: ${skill.name} (after ${Math.round(PLATFORM_FEE_RATE * 100)}% fee)`,
        relatedSkillId: args.skillId,
      });
    }

    await ctx.db.insert("purchases", {
      userId,
      skillId: args.skillId,
      pricePaid: price,
    });

    return { success: true, newBalance: balance - price };
  },
});

// Internal: award points for activity (e.g., publishing, installs)
export const awardPoints = internalMutation({
  args: {
    userId: v.id("users"),
    delta: v.number(),
    reason: v.string(),
    relatedSkillId: v.optional(v.id("skills")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pointsLedger", {
      userId: args.userId,
      delta: args.delta,
      reason: args.reason,
      relatedSkillId: args.relatedSkillId,
    });
  },
});

export const myLedger = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("pointsLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return rows.slice(0, 20);
  },
});

// --- Cash out -----------------------------------------------------------

export const payoutInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const balance = await getBalanceForUser(ctx, userId);
    return {
      balance,
      pointsPerUsd: POINTS_PER_USD,
      minPayoutPoints: MIN_PAYOUT_POINTS,
      maxPayoutPoints: balance,
      maxPayoutUsd: balance / POINTS_PER_USD,
    };
  },
});

export const myPayouts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("payoutRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const requestPayout = mutation({
  args: {
    pointsAmount: v.number(),
    payoutMethod: v.string(),
    payoutDestination: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to request a payout.");

    const points = Math.floor(args.pointsAmount);
    if (points < MIN_PAYOUT_POINTS) {
      throw new Error(`Minimum payout is ${MIN_PAYOUT_POINTS} points.`);
    }

    const balance = await getBalanceForUser(ctx, userId);
    if (balance < points) {
      throw new Error(`Insufficient balance. Have ${balance}, need ${points}.`);
    }

    const dest = args.payoutDestination.trim();
    if (!dest) throw new Error("Payout destination required.");

    const amountUsd = points / POINTS_PER_USD;

    const payoutId = await ctx.db.insert("payoutRequests", {
      userId,
      pointsAmount: points,
      amountUsd,
      payoutMethod: args.payoutMethod,
      payoutDestination: dest,
      status: "pending",
    });

    // Lock the points immediately by debiting the ledger
    await ctx.db.insert("pointsLedger", {
      userId,
      delta: -points,
      reason: `Payout request: $${amountUsd.toFixed(2)}`,
      payoutRequestId: payoutId,
    });

    return { payoutId, amountUsd };
  },
});
