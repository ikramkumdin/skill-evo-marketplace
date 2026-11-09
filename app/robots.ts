import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL ?? "https://evoskill.market";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // These paths are per-user or in-progress and don't need to be
        // indexed. Public catalog pages (/skills, /skills/<slug>, /users/*,
        // /about, /for-agents) stay crawlable.
        disallow: ["/api/", "/auth/", "/me", "/publish"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
