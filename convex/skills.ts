import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    query: v.optional(v.string()),
    sort: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let skills = await ctx.db.query("skills").collect();

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

    return skills;
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("skills")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
    return all.sort((a, b) => b.installs - a.installs);
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

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const skills = await ctx.db.query("skills").collect();
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
    const skills = await ctx.db.query("skills").collect();
    const counts: Record<string, number> = { all: skills.length };
    for (const s of skills) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  },
});

export const submit = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    githubUrl: v.string(),
    installCommand: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    pricePoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in to submit a Skill.");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User record missing.");
    }

    const slug = slugify(args.name);
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

    const id = await ctx.db.insert("skills", {
      slug,
      name: args.name,
      tagline: args.tagline,
      description: args.description,
      category: args.category,
      tags: args.tags,
      githubUrl: args.githubUrl,
      installCommand: args.installCommand,
      installs: 0,
      stars: 0,
      rating: 0,
      ratingCount: 0,
      featured: false,
      submitterId: userId,
      submitterHandle: handle,
      submitterAvatar: avatar,
      pricePoints: args.pricePoints && args.pricePoints > 0 ? args.pricePoints : undefined,
    });

    return { id, slug };
  },
});

export const recordInstall = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const skill = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!skill) throw new Error("Skill not found.");

    const userId = await getAuthUserId(ctx);
    await ctx.db.insert("installEvents", {
      skillId: skill._id,
      userId: userId ?? undefined,
    });
    await ctx.db.patch(skill._id, { installs: skill.installs + 1 });

    return { installs: skill.installs + 1 };
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
