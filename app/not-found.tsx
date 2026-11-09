import Link from "next/link";

export const metadata = {
  title: "Page not found — Skill Evo Marketplace",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        404
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
        We couldn&rsquo;t find that page.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        The URL might be wrong, the Skill may have been removed, or the link
        is out of date. Try the Skill catalogue or start over.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Back to home
        </Link>
        <Link
          href="/skills"
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Browse all Skills
        </Link>
      </div>
    </main>
  );
}
