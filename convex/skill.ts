// Convenience aliases (singular "skill:*") that forward to the real endpoints in
// "skills:*", "comments:*", and "social:*". Documented in llms-full.txt.

import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const lookup = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!skill) return null;
    const related = (
      await ctx.db
        .query("skills")
        .withIndex("by_category", (q) => q.eq("category", skill.category))
        .collect()
    )
      .filter((s) => s._id !== skill._id)
      .slice(0, 3);
    return { skill, related };
  },
});

export const comments = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const all = await ctx.db
      .query("comments")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .order("asc")
      .collect();
    return all.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      skillId: c.skillId,
      userId: c.userId,
      body: c.body,
      parentId: c.parentId ?? null,
      isOwn: userId !== null && c.userId === userId,
    }));
  },
});

export const ratings = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const skill = await ctx.db.get(args.skillId);
    const rows = await ctx.db
      .query("ratings")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();
    const userRating = userId
      ? rows.find((r) => r.userId === userId)?.value ?? null
      : null;
    return {
      average: skill?.rating ?? 0,
      count: skill?.ratingCount ?? 0,
      userRating,
    };
  },
});
