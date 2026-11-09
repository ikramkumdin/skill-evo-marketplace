import type { MetadataRoute } from "next";
import { listSkills } from "@/lib/data";
import { CATEGORIES } from "@/lib/categories";

const SITE_URL = process.env.SITE_URL ?? "https://evoskill.market";

export const revalidate = 3600; // regenerate once an hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/skills`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/for-agents`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/submission-rules`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/skills?category=${encodeURIComponent(c.id)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  let skillEntries: MetadataRoute.Sitemap = [];
  try {
    const skills = await listSkills({});
    skillEntries = skills.map((s) => ({
      url: `${SITE_URL}/skills/${s.slug}`,
      lastModified: new Date(s.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // If Convex is unavailable at build time, serve the sitemap with just
    // the static entries rather than failing the build.
  }

  return [...staticEntries, ...categoryEntries, ...skillEntries];
}
