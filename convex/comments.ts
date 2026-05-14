import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listComments = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const all = await ctx.db
      .query("comments")
      .withIndex("by_skill", (q) => q.eq("skillId", args.skillId))
      .order("asc")
      .collect();

    // Fetch author info + verified-user flag (label === "using") for each comment
    const withAuthors = await Promise.all(
      all.map(async (c) => {
        const [user, labelRow] = await Promise.all([
          ctx.db.get(c.userId),
          ctx.db
            .query("skillLabels")
            .withIndex("by_user_and_skill", (q) =>
              q.eq("userId", c.userId).eq("skillId", args.skillId),
            )
            .first(),
        ]);
        return {
          _id: c._id,
          _creationTime: c._creationTime,
          skillId: c.skillId,
          userId: c.userId,
          body: c.body,
          parentId: c.parentId ?? null,
          authorHandle:
            (user as { name?: string } | null)?.name ??
            (user as { email?: string } | null)?.email?.split("@")[0] ??
            "anonymous",
          authorAvatar: (user as { image?: string } | null)?.image ?? null,
          isOwn: userId !== null && c.userId === userId,
          isVerifiedUser: labelRow?.label === "using",
        };
      }),
    );

    return withAuthors;
  },
});

export const addComment = mutation({
  args: {
    skillId: v.id("skills"),
    body: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to comment.");

    const body = args.body.trim();
    if (!body) throw new Error("Comment cannot be empty.");
    if (body.length > 2000) throw new Error("Comment too long (max 2000 chars).");

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.skillId !== args.skillId) {
        throw new Error("Invalid parent comment.");
      }
      // Only one level of nesting allowed
      if (parent.parentId) throw new Error("Cannot nest replies more than one level.");
    }

    const id = await ctx.db.insert("comments", {
      skillId: args.skillId,
      userId,
      body,
      parentId: args.parentId,
    });
    return id;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to delete a comment.");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found.");
    if (comment.userId !== userId) throw new Error("Cannot delete someone else's comment.");

    // Delete all replies first
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .collect();
    await Promise.all(replies.map((r) => ctx.db.delete(r._id)));

    await ctx.db.delete(args.commentId);
  },
});
