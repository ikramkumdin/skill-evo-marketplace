import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { listFeatured, getStats } from "@/lib/data";
import { SkillCard } from "@/components/skill-card";

export default async function HomePage() {
  const [featured, stats] = await Promise.all([listFeatured(), getStats()]);

  return (
    <>
      {/* Hero — editorial, left-aligned, monochrome */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="grid gap-12 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                The marketplace for AI agent Skills
              </p>
              <h1 className="text-[2.75rem] font-medium leading-[1.05] tracking-tight text-zinc-950 md:text-6xl dark:text-zinc-50">
                Skills built by the community, ready in one command.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 md:text-lg dark:text-zinc-400">
                Discover capabilities your agent needs. Install in one line.
                Publish what you build. Made for humans and the agents that work
                for them.
              </p>

              {/* Dual entry: humans search, agents follow protocol */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/for-agents"
                  className="group inline-flex items-center gap-2 border border-zinc-950 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-zinc-950"
                >
                  <BotIcon />
                  For AI agents
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <Link
                  href="/about"
                  className="text-xs font-medium uppercase tracking-wider text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  About the marketplace
                </Link>
              </div>

              {/* Refined search — squared off, no gradient */}
              <form action="/skills" className="mt-8 max-w-xl">
                <div className="flex items-center border-b border-zinc-300 focus-within:border-zinc-900 dark:border-zinc-700 dark:focus-within:border-zinc-100 transition-colors">
                  <svg
                    className="pointer-events-none text-zinc-400 shrink-0"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    name="q"
                    placeholder="Search Skills, MCP servers, prompts…"
                    className="h-12 w-full bg-transparent pl-3 pr-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center bg-zinc-950 px-4 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                  >
                    Search
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                  <span className="uppercase tracking-wider">Try</span>
                  {["postgres", "code review", "weekly digest", "security audit"].map(
                    (tag) => (
                      <Link
                        key={tag}
                        href={`/skills?q=${encodeURIComponent(tag)}`}
                        className="underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
                      >
                        {tag}
                      </Link>
                    ),
                  )}
                </div>
              </form>
            </div>

            {/* Stats — vertical column, editorial */}
            <div className="md:col-span-4 md:border-l md:border-zinc-200 md:pl-10 dark:md:border-zinc-800">
              <ul className="space-y-6">
                <Stat value={String(stats.skills)} label="Skills published" />
                <Stat value={formatBig(stats.installs)} label="Total installs" />
                <Stat
                  value={stats.avgRating.toFixed(1)}
                  label="Average rating (out of 5)"
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Featured
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-zinc-950 md:text-3xl dark:text-zinc-50">
              Hand-picked Skills
            </h2>
          </div>
          <Link
            href="/skills"
            className="text-xs font-medium uppercase tracking-wider text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Browse all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <SkillCard key={s.slug} skill={s} />
          ))}
        </div>
      </section>

      {/* Categories — index-style listing */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Browse
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight text-zinc-950 md:text-3xl dark:text-zinc-50">
              By category
            </h2>
          </div>
          <ul className="grid grid-cols-1 gap-px bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3 dark:bg-zinc-800">
            {CATEGORIES.map((c, i) => (
              <li key={c.id} className="bg-white dark:bg-zinc-950">
                <Link
                  href={`/skills?category=${c.id}`}
                  className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span className="font-mono text-xs text-zinc-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                      {c.description}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                    Explore →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA — quiet, editorial */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Publish
          </p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
            Built something useful?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
            Share it with the community. Submitting takes about a minute.
          </p>
          <Link
            href="/publish"
            className="mt-8 inline-flex h-11 items-center bg-zinc-950 px-6 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Publish a Skill
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <li>
      <div className="font-mono text-3xl font-medium tabular-nums text-zinc-950 md:text-4xl dark:text-zinc-50">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </li>
  );
}

function formatBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" aria-hidden>
      <rect x="3" y="7" width="18" height="14" rx="1" />
      <path d="M8 12h.01M16 12h.01" />
      <path d="M9 17h6" />
      <path d="M12 3v4" />
    </svg>
  );
}
