import { fetchQuery } from "convex/nextjs";
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

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
export const isConvexConfigured = Boolean(convexUrl);

export type DisplaySkill = {
  id?: string; // Convex doc _id when sourced from Convex; absent in mock mode
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
  submitterHandle: string;
  submitterAvatar: string;
};

function convexToDisplay(s: ConvexSkillDoc): DisplaySkill {
  const date = new Date(s._creationTime).toISOString().slice(0, 10);
  return {
    id: s._id,
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
      const result = (await fetchQuery(api.skills.bySlug, { slug })) as
        | { skill: ConvexSkillDoc; related: ConvexSkillDoc[] }
        | null;
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
