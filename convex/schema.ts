import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  skills: defineTable({
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    githubUrl: v.string(),
    installCommand: v.string(),
    installs: v.number(),
    stars: v.number(),
    rating: v.number(),
    ratingCount: v.number(),
    seededRating: v.optional(v.number()),
    seededRatingCount: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    submitterId: v.optional(v.id("users")),
    submitterHandle: v.string(),
    submitterAvatar: v.string(),
    pricePoints: v.optional(v.number()), // undefined = free
    source: v.optional(v.union(v.literal("submitted"), v.literal("crawled"))),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .index("by_submitter", ["submitterId"])
    .index("by_submitter_handle", ["submitterHandle"])
    .searchIndex("search_skills", {
      searchField: "name",
      filterFields: ["category"],
    }),

  installEvents: defineTable({
    skillId: v.id("skills"),
    userId: v.optional(v.id("users")),
  }).index("by_skill", ["skillId"]),

  favorites: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillId"])
    .index("by_user_and_skill", ["userId", "skillId"]),

  votes: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    kind: v.union(v.literal("up"), v.literal("down")),
  })
    .index("by_skill", ["skillId"])
    .index("by_user_and_skill", ["userId", "skillId"]),

  ratings: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    value: v.number(), // 1..5
  })
    .index("by_skill", ["skillId"])
    .index("by_user_and_skill", ["userId", "skillId"]),

  comments: defineTable({
    skillId: v.id("skills"),
    userId: v.id("users"),
    body: v.string(),
    parentId: v.optional(v.id("comments")),
  })
    .index("by_skill", ["skillId"])
    .index("by_parent", ["parentId"]),

  // Three-state skill labels per user
  skillLabels: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    label: v.union(
      v.literal("want"),
      v.literal("using"),
      v.literal("abandoned"),
    ),
  })
    .index("by_user_and_skill", ["userId", "skillId"])
    .index("by_user", ["userId"])
    .index("by_skill", ["skillId"]),

  // Virtual points ledger
  pointsLedger: defineTable({
    userId: v.id("users"),
    delta: v.number(),
    reason: v.string(),
    relatedSkillId: v.optional(v.id("skills")),
    payoutRequestId: v.optional(v.id("payoutRequests")),
  })
    .index("by_user", ["userId"])
    .index("by_payout", ["payoutRequestId"]),

  // Cash-out requests: authors converting earned points to real money
  payoutRequests: defineTable({
    userId: v.id("users"),
    pointsAmount: v.number(),
    amountUsd: v.number(),
    payoutMethod: v.string(), // "paypal" | "stripe-connect" | "wire" — free-form for now
    payoutDestination: v.string(), // email or account ref
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("paid"),
      v.literal("rejected"),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Skill purchases
  purchases: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    pricePaid: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillId"])
    .index("by_user_and_skill", ["userId", "skillId"]),

  // Agent device-code authentication
  agentAuthCodes: defineTable({
    code: v.string(),           // short human-readable, e.g. "BLUE-LION-7"
    agentName: v.string(),      // label set by the agent
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    userId: v.optional(v.id("users")),
    token: v.optional(v.string()),
    expiresAt: v.number(),
  }).index("by_code", ["code"]),
});
