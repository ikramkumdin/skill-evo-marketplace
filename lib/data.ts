import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import {
  SKILLS as MOCK_SKILLS,
  filterSkills as filterMock,
  getFeaturedSkills,
  getSkill as getMockSkill,
  totalStats as mockStats,
  type Skill as MockSkill,
} from "./skills";
import { CATEGORIES } from "./categories";

// Pull the signed-in viewer's Convex auth token when we're rendering on
// the server, so `getAuthUserId` inside Convex queries sees the real
// user. Without this, SSR calls like `skills:bySlug` and
// `profile:getUserProfile` think the viewer is anonymous and hide
// pending rows from the submitter looking at their own content.
// Swallows errors so unauthenticated page loads still render.
async function viewerToken(): Promise<string | undefined> {
  try {
    const token = await convexAuthNextjsToken();
    return token ?? undefined;
  } catch {
    return undefined;
  }
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
export const isConvexConfigured = Boolean(convexUrl);

export type DisplaySkill = {
  id?: string; // Convex doc _id when sourced from Convex; absent in mock mode
  submitterId?: string | null; // Convex users._id of the submitter, when present
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  githubUrl: string;
  installCommand: string;
  installs: number;
  stars: number;
  rating: number;
  ratingCount: number;
  featured?: boolean;
  pricePoints?: number; // undefined = free
  source?: "submitted" | "crawled";
  moderationStatus?: "pending" | "approved" | "rejected";
  author: { handle: string; avatar: string };
  createdAt: string;
  updatedAt: string;
};

function mockToDisplay(s: MockSkill): DisplaySkill {
  return {
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    category: s.category,
    tags: s.tags,
    githubUrl: s.githubUrl,
    installCommand: s.installCommand,
    installs: s.installs,
    stars: s.stars,
    rating: s.rating,
    ratingCount: s.ratingCount,
    featured: s.featured,
    author: s.author,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

type ConvexSkillDoc = {
  _id: string;
  _creationTime: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  githubUrl: string;
  installCommand: string;
  installs: number;
  stars: number;
  rating: number;
  ratingCount: number;
  featured?: boolean;
  pricePoints?: number;
  source?: "submitted" | "crawled";
  submitterId?: string | null;
  submitterHandle: string;
  submitterAvatar: string;
  moderationStatus?: "pending" | "approved" | "rejected";
};

function convexToDisplay(s: ConvexSkillDoc): DisplaySkill {
  const date = new Date(s._creationTime).toISOString().slice(0, 10);
  return {
    id: s._id,
    submitterId: s.submitterId ?? null,
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    category: s.category,
    tags: s.tags,
    githubUrl: s.githubUrl,
    installCommand: s.installCommand,
    installs: s.installs,
    stars: s.stars,
    rating: s.rating,
    ratingCount: s.ratingCount,
    featured: s.featured,
    pricePoints: s.pricePoints,
    source: s.source,
    moderationStatus: s.moderationStatus,
    author: { handle: s.submitterHandle, avatar: s.submitterAvatar },
    createdAt: date,
    updatedAt: date,
  };
}

export async function listSkills(filter: {
  category?: string;
  query?: string;
  sort?: string;
}): Promise<DisplaySkill[]> {
  if (isConvexConfigured) {
    try {
      const docs = (await fetchQuery(api.skills.list, filter)) as ConvexSkillDoc[];
      return docs.map(convexToDisplay);
    } catch (e) {
      console.warn("[data] Convex query failed, falling back to mock:", e);
    }
  }
  return filterMock(MOCK_SKILLS, {
    category: filter.category,
    query: filter.query,
    sort: filter.sort as "featured" | "installs" | "stars" | "newest" | "name" | undefined,
  }).map(mockToDisplay);
}

export async function listFeatured(): Promise<DisplaySkill[]> {
  if (isConvexConfigured) {
    try {
      const docs = (await fetchQuery(api.skills.featured, {})) as ConvexSkillDoc[];
      return docs.map(convexToDisplay);
    } catch (e) {
      console.warn("[data] Convex query failed, falling back to mock:", e);
    }
  }
  return getFeaturedSkills().map(mockToDisplay);
}

export async function getSkillWithRelated(slug: string): Promise<{
  skill: DisplaySkill;
  related: DisplaySkill[];
} | null> {
  if (isConvexConfigured) {
    try {
      // Pass the viewer's token so pending skills are visible to their
      // submitter. Anonymous viewers get undefined → the Convex query's
      // `isPubliclyVisible` filter keeps pending rows hidden.
      const token = await viewerToken();
      const result = (await fetchQuery(
        api.skills.bySlug,
        { slug },
        { token },
      )) as { skill: ConvexSkillDoc; related: ConvexSkillDoc[] } | null;
      if (!result) return null;
      return {
        skill: convexToDisplay(result.skill),
        related: result.related.map(convexToDisplay),
      };
    } catch (e) {
      console.warn("[data] Convex query failed, falling back to mock:", e);
    }
  }
  const mock = getMockSkill(slug);
  if (!mock) return null;
  const related = MOCK_SKILLS.filter(
    (s) => s.category === mock.category && s.slug !== mock.slug,
  )
    .slice(0, 3)
    .map(mockToDisplay);
  return { skill: mockToDisplay(mock), related };
}

export async function getStats(): Promise<{
  skills: number;
  installs: number;
  avgRating: number;
}> {
  if (isConvexConfigured) {
    try {
      return (await fetchQuery(api.skills.stats, {})) as {
        skills: number;
        installs: number;
        avgRating: number;
      };
    } catch (e) {
      console.warn("[data] Convex query failed, falling back to mock:", e);
    }
  }
  return mockStats();
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (isConvexConfigured) {
    try {
      return (await fetchQuery(api.skills.categoryCounts, {})) as Record<string, number>;
    } catch (e) {
      console.warn("[data] Convex query failed, falling back to mock:", e);
    }
  }
  const counts: Record<string, number> = { all: MOCK_SKILLS.length };
  for (const c of CATEGORIES) {
    counts[c.id] = MOCK_SKILLS.filter((s) => s.category === c.id).length;
  }
  return counts;
}
