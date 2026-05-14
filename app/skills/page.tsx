import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { listSkills, getCategoryCounts } from "@/lib/data";
import { SkillCard } from "@/components/skill-card";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "installs", label: "Most installed" },
  { value: "stars", label: "Most starred" },
  { value: "newest", label: "Recently updated" },
  { value: "name", label: "Name" },
] as const;

const PAGE_SIZE = 6;

export default async function SkillsPage(props: PageProps<"/skills">) {
  const sp = await props.searchParams;
  const category = typeof sp.category === "string" ? sp.category : "all";
  const query = typeof sp.q === "string" ? sp.q : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "featured";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const [allSkills, counts] = await Promise.all([
    listSkills({ category, query, sort }),
    getCategoryCounts(),
  ]);
  const totalCount = counts.all ?? 0;
  const totalResults = allSkills.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const skills = allSkills.slice(start, start + PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Skills</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse {totalCount} Skills built by the community.
        </p>
      </div>

      {/* Search + sort bar */}
      <form className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center" action="/skills">
        {category !== "all" && (
          <input type="hidden" name="category" value={category} />
        )}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16"
            height="16"
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
            defaultValue={query}
            placeholder="Search Skills by name, description, or tag..."
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950"
          />
        </div>
        <select
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-700 dark:focus:ring-indigo-950"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Apply
        </button>
      </form>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500">
            Categories
          </h3>
          <div className="flex flex-col gap-1">
            <CategoryLink
              href={`/skills${query ? `?q=${encodeURIComponent(query)}` : ""}`}
              active={category === "all"}
              icon="📚"
              label="All Skills"
              count={counts.all ?? 0}
            />
            {CATEGORIES.map((c) => {
              const count = counts[c.id] ?? 0;
              const params = new URLSearchParams();
              params.set("category", c.id);
              if (query) params.set("q", query);
              return (
                <CategoryLink
                  key={c.id}
                  href={`/skills?${params.toString()}`}
                  active={category === c.id}
                  icon={c.icon}
                  label={c.name}
                  count={count}
                />
              );
            })}
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
            <span>
              {totalResults === 0
                ? "No results"
                : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, totalResults)} of ${totalResults}`}
              {query ? ` for "${query}"` : ""}
            </span>
          </div>
          {totalResults === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-500">No Skills match your filters.</p>
              <Link
                href="/skills"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {skills.map((s) => (
                  <SkillCard key={s.slug} skill={s} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  category={category}
                  query={query}
                  sort={sort}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  category,
  query,
  sort,
}: {
  currentPage: number;
  totalPages: number;
  category: string;
  query: string;
  sort: string;
}) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (query) params.set("q", query);
    if (sort !== "featured") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/skills?${qs}` : "/skills";
  };

  // Compact page numbers: first, current ±1, last, with ellipses
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const cls = (active: boolean) =>
    `inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
      active
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    }`;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-1.5 flex-wrap"
    >
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className={cls(false)} aria-label="Previous page">
          ←
        </Link>
      ) : (
        <span className={`${cls(false)} opacity-40 cursor-not-allowed`} aria-disabled>
          ←
        </span>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="px-1 text-sm text-zinc-400">
            …
          </span>
        ) : (
          <Link key={p} href={buildHref(p)} className={cls(p === currentPage)}>
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className={cls(false)} aria-label="Next page">
          →
        </Link>
      ) : (
        <span className={`${cls(false)} opacity-40 cursor-not-allowed`} aria-disabled>
          →
        </span>
      )}
    </nav>
  );
}

function CategoryLink({
  href,
  active,
  icon,
  label,
  count,
}: {
  href: string;
  active: boolean;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-[11px] text-zinc-500 tabular-nums">{count}</span>
    </Link>
  );
}
