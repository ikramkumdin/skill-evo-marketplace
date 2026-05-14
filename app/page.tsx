import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { listFeatured, getStats } from "@/lib/data";
import { SkillCard } from "@/components/skill-card";

export default async function HomePage() {
  const [featured, stats] = await Promise.all([listFeatured(), getStats()]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-linear-to-b from-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-950 dark:to-black">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Built by the community
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-950 md:text-6xl dark:text-zinc-50">
              Skills built by thousands,
              <br />
              <span className="bg-linear-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                ready in one search.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-zinc-600 md:text-lg dark:text-zinc-400">
              The marketplace for AI agent Skills. Discover capabilities your agent needs,
              install in one command, share what you build.
            </p>

            {/* Search */}
            <form action="/skills" className="mt-8 w-full max-w-xl">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Search Skills, MCP servers, prompts..."
                  className="h-12 w-full rounded-full border border-zinc-200 bg-white pl-11 pr-32 text-sm text-zinc-900 shadow-sm transition-shadow placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Search
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-zinc-500">Try:</span>
                {["github integrations", "postgres", "security audit", "weekly digest"].map((tag) => (
                  <Link
                    key={tag}
                    href={`/skills?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </form>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 md:gap-16 text-center">
              <Stat value={String(stats.skills)} label="Skills" />
              <Stat value={formatBig(stats.installs)} label="Installs" />
              <Stat value={stats.avgRating.toFixed(1)} label="Avg rating" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Featured Skills</h2>
            <p className="mt-1 text-sm text-zinc-500">Hand-picked by the community.</p>
          </div>
          <Link
            href="/skills"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Browse all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <SkillCard key={s.slug} skill={s} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">Browse by category</h2>
          <p className="mt-1 text-sm text-zinc-500 mb-8">
            Find Skills grouped by what they do.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={`/skills?category=${c.id}`}
                className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-indigo-800"
              >
                <span className="text-2xl leading-none">{c.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950 group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
                    {c.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-zinc-950 dark:text-zinc-50">Built something useful?</h2>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Share it with the community. Submitting takes about a minute.
        </p>
        <Link
          href="/publish"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Publish a Skill
        </Link>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-zinc-950 md:text-3xl dark:text-zinc-50 tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
