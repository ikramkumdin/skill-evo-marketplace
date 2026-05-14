import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const LABEL_VALUES = ["want", "using", "abandoned"] as const;
type Label = (typeof LABEL_VALUES)[number];

export const myLabel = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("skillLabels")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();
    return row?.label ?? null;
  },
});

export const myLabels = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("skillLabels")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const skills = await Promise.all(rows.map((r) => ctx.db.get(r.skillId)));
    return rows
      .map((r, i) => ({ label: r.label, skill: skills[i] }))
      .filter((x): x is { label: Label; skill: NonNullable<typeof x.skill> } => x.skill !== null);
  },
});

export const labelCounts = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("skillLabels")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    const counts = { want: 0, using: 0, abandoned: 0 };
    for (const r of rows) counts[r.label]++;
    return counts;
  },
});

export const isVerifiedUser = query({
  args: { skillId: v.id("skills"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("skillLabels")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", args.userId).eq("skillId", args.skillId),
      )
      .first();
    return row?.label === "using";
  },
});

export const setLabel = mutation({
  args: {
    skillId: v.id("skills"),
    label: v.union(v.literal("want"), v.literal("using"), v.literal("abandoned")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to label a Skill.");

    const existing = await ctx.db
      .query("skillLabels")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { label: args.label });
    } else {
      await ctx.db.insert("skillLabels", {
        userId,
        skillId: args.skillId,
        label: args.label,
      });
    }
    return { label: args.label };
  },
});

export const clearLabel = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to update a label.");
    const existing = await ctx.db
      .query("skillLabels")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return { label: null };
  },
});
