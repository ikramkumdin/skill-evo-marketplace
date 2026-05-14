import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const skillSocial = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const [favs, votes] = await Promise.all([
      ctx.db
        .query("favorites")
        .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
        .collect(),
      ctx.db
        .query("votes")
        .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
        .collect(),
    ]);

    const upvotes = votes.filter((v) => v.kind === "up").length;
    const downvotes = votes.filter((v) => v.kind === "down").length;

    let userFavorited = false;
    let userVote: "up" | "down" | null = null;
    if (userId) {
      userFavorited = favs.some((f) => f.userId === userId);
      const myVote = votes.find((v) => v.userId === userId);
      userVote = myVote ? myVote.kind : null;
    }

    return {
      favoritesCount: favs.length,
      upvotes,
      downvotes,
      userFavorited,
      userVote,
    };
  },
});

export const socialBatch = query({
  args: { skillIds: v.array(v.id("skills")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const result: Record<
      string,
      {
        favoritesCount: number;
        upvotes: number;
        downvotes: number;
        userFavorited: boolean;
        userVote: "up" | "down" | null;
      }
    > = {};

    for (const skillId of args.skillIds) {
      const [favs, votes] = await Promise.all([
        ctx.db
          .query("favorites")
          .withIndex("by_skill", (q) => q.eq("skillId", skillId))
          .collect(),
        ctx.db
          .query("votes")
          .withIndex("by_skill", (q) => q.eq("skillId", skillId))
          .collect(),
      ]);
      const upvotes = votes.filter((v) => v.kind === "up").length;
      const downvotes = votes.filter((v) => v.kind === "down").length;
      let userFavorited = false;
      let userVote: "up" | "down" | null = null;
      if (userId) {
        userFavorited = favs.some((f) => f.userId === userId);
        const myVote = votes.find((v) => v.userId === userId);
        userVote = myVote ? myVote.kind : null;
      }
      result[skillId] = {
        favoritesCount: favs.length,
        upvotes,
        downvotes,
        userFavorited,
        userVote,
      };
    }

    return result;
  },
});

export const myFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const skills = await Promise.all(favs.map((f) => ctx.db.get(f.skillId)));
    return skills.filter((s): s is NonNullable<typeof s> => s !== null);
  },
});

export const toggleFavorite = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in to favorite a Skill.");
    }
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }
    await ctx.db.insert("favorites", { userId, skillId: args.skillId });
    return { favorited: true };
  },
});

export const vote = mutation({
  args: {
    skillId: v.id("skills"),
    kind: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in to vote on a Skill.");
    }
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();

    if (existing) {
      if (existing.kind === args.kind) {
        await ctx.db.delete(existing._id);
        return { kind: null as null };
      }
      await ctx.db.patch(existing._id, { kind: args.kind });
      return { kind: args.kind };
    }

    await ctx.db.insert("votes", {
      userId,
      skillId: args.skillId,
      kind: args.kind,
    });
    return { kind: args.kind };
  },
});

export type SocialState = {
  favoritesCount: number;
  upvotes: number;
  downvotes: number;
  userFavorited: boolean;
  userVote: "up" | "down" | null;
};

// --- Star ratings -------------------------------------------------------

// On first user rating, snapshot the existing skill.rating/ratingCount as the
// "seeded baseline" so we can keep recomputing the blended total from there.
async function ensureSeededBaseline(
  ctx: { db: { get: Function; patch: Function } },
  skillId: import("./_generated/dataModel").Id<"skills">,
) {
  const skill = await ctx.db.get(skillId);
  if (!skill) return null;
  if (skill.seededRating === undefined || skill.seededRatingCount === undefined) {
    await ctx.db.patch(skillId, {
      seededRating: skill.rating,
      seededRatingCount: skill.ratingCount,
    });
    return {
      ...skill,
      seededRating: skill.rating,
      seededRatingCount: skill.ratingCount,
    };
  }
  return skill;
}

async function recomputeSkillRating(
  ctx: { db: { query: Function; patch: Function; get: Function } },
  skillId: import("./_generated/dataModel").Id<"skills">,
) {
  const skill = await ctx.db.get(skillId);
  if (!skill) return;

  const ratings: { value: number }[] = await ctx.db
    .query("ratings")
    .withIndex("by_skill", (q: any) => q.eq("skillId", skillId))
    .collect();

  const seededCount = skill.seededRatingCount ?? skill.ratingCount ?? 0;
  const seededAvg = skill.seededRating ?? skill.rating ?? 0;
  const realCount = ratings.length;
  const realSum = ratings.reduce((acc, r) => acc + r.value, 0);
  const totalCount = seededCount + realCount;
  const newAvg =
    totalCount === 0 ? 0 : (seededAvg * seededCount + realSum) / totalCount;

  await ctx.db.patch(skillId, {
    rating: newAvg,
    ratingCount: totalCount,
  });
}

export const ratingFor = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const skill = await ctx.db.get(args.skillId);

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .collect();

    const userRating = userId
      ? ratings.find((r) => r.userId === userId)?.value ?? null
      : null;

    // Compute live from ratings table + seeded baseline. Self-heals if
    // skill.rating is stale from rates made before the new write-through code.
    const seededCount = skill?.seededRatingCount ?? skill?.ratingCount ?? 0;
    const seededAvg = skill?.seededRating ?? skill?.rating ?? 0;
    const realCount = ratings.length;
    const realSum = ratings.reduce((acc, r) => acc + r.value, 0);
    // Avoid double-counting: if skill.rating was already updated by the new
    // mutation code, seeded* fields point to the original baseline.
    // If only the old code ran, seededRating is undefined and we use the
    // current skill.rating (which IS the original baseline since no real
    // ratings were written through).
    const totalCount = seededCount + realCount;
    const average =
      totalCount === 0 ? 0 : (seededAvg * seededCount + realSum) / totalCount;

    return {
      average,
      count: totalCount,
      userRating,
    };
  },
});

export const rateSkill = mutation({
  args: {
    skillId: v.id("skills"),
    value: v.number(), // 1..5
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to rate a Skill.");

    const value = Math.round(args.value);
    if (value < 1 || value > 5) throw new Error("Rating must be between 1 and 5.");

    await ensureSeededBaseline(ctx, args.skillId);

    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("ratings", { userId, skillId: args.skillId, value });
    }

    await recomputeSkillRating(ctx, args.skillId);
    return { value };
  },
});

// Public mutation: recomputes a skill's rating from the ratings table.
// Used to backfill skills rated before the new write-through code shipped.
export const refreshSkillRating = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    await ensureSeededBaseline(ctx, args.skillId);
    await recomputeSkillRating(ctx, args.skillId);
  },
});

export const unrateSkill = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to remove a rating.");

    await ensureSeededBaseline(ctx, args.skillId);

    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", args.skillId),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);

    await recomputeSkillRating(ctx, args.skillId);
    return { value: null as null };
  },
});
