import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";

type SkillDoc = Doc<"skills">;
type LabelValue = "want" | "using" | "abandoned";

export const getUserProfile = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const handleNorm = args.handle.toLowerCase().trim();

    // Scan all skills and case-insensitive filter — avoids depending on the
    // by_submitter_handle index existing yet (resilient to stale deploys).
    const allSkills = await ctx.db.query("skills").collect();
    let skills = allSkills.filter(
      (s) => s.submitterHandle.toLowerCase().trim() === handleNorm,
    );

    let userId = skills.find((s) => s.submitterId)?.submitterId ?? null;
    let avatar: string = skills[0]?.submitterAvatar ?? "🤖";

    // Fallback: no skills matched the handle — look up user by name/email
    // in the auth users table. This lets profile pages exist for users who
    // haven't published any skills yet.
    if (!userId) {
      const allUsers = await ctx.db.query("users").collect();
      const matched = allUsers.find((u) => {
        const u2 = u as { name?: string; email?: string };
        const userName = u2.name?.toLowerCase().trim();
        const userEmail = u2.email?.toLowerCase().trim();
        const emailPrefix = userEmail?.split("@")[0];
        return (
          userName === handleNorm ||
          userEmail === handleNorm ||
          emailPrefix === handleNorm
        );
      });
      if (matched) {
        userId = matched._id;
        avatar = (matched as { image?: string }).image ?? "🤖";
        // Pick up any skills they submitted (different handle, etc.)
        const moreSkills = allSkills.filter((s) => s.submitterId === matched._id);
        const existingIds = new Set(skills.map((s) => s._id));
        for (const s of moreSkills) if (!existingIds.has(s._id)) skills.push(s);
      }
    }

    const totalInstalls = skills.reduce((acc, s) => acc + s.installs, 0);
    const reputation = totalInstalls + skills.length * 50;

    // Labels (public)
    const labeledSkills: Array<{ label: LabelValue; skill: SkillDoc }> = [];
    if (userId) {
      const labelRows = await ctx.db
        .query("skillLabels")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const row of labelRows) {
        const skill = await ctx.db.get(row.skillId);
        if (skill) labeledSkills.push({ label: row.label, skill });
      }
    }

    // Favorites (public)
    const favorites: SkillDoc[] = [];
    if (userId) {
      const favRows = await ctx.db
        .query("favorites")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const row of favRows) {
        const skill = await ctx.db.get(row.skillId);
        if (skill) favorites.push(skill);
      }
    }

    return {
      handle: args.handle,
      avatar,
      userId,
      publishedSkills: skills,
      labeledSkills,
      favorites,
      reputation,
      skillCount: skills.length,
      totalInstalls,
    };
  },
});

export const mySummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const handle =
      (user as { name?: string }).name ??
      (user as { email?: string }).email?.split("@")[0] ??
      "anonymous";

    const allSkills = await ctx.db.query("skills").collect();
    const skills = allSkills.filter((s) => s.submitterId === userId);

    const totalInstalls = skills.reduce((acc, s) => acc + s.installs, 0);
    const reputation = totalInstalls + skills.length * 50;

    return {
      userId,
      handle,
      avatar: (user as { image?: string }).image ?? skills[0]?.submitterAvatar ?? "🤖",
      skillCount: skills.length,
      totalInstalls,
      reputation,
    };
  },
});
