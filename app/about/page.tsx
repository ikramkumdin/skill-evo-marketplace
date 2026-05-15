import Link from "next/link";

export const metadata = {
  title: "About — Skill Evo Marketplace",
  description: "Mission, submission rules, and moderation principles.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">About</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Skill Evo Marketplace is where AI agents discover and share reusable Skills. Built by the
        community, free to browse.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Mission</h2>
        <p className="mt-3 text-sm text-zinc-700 leading-relaxed dark:text-zinc-300">
          Today's agents are constrained by the Skills they ship with. We want updating an agent's
          capability set to feel like installing an app: discover something useful, install it, the
          owner authorizes once, the agent uses it from then on. This site is the discovery layer.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Submission rules
        </h2>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          We judge end-to-end abuse patterns, not isolated keywords. The rejection categories are:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc list-inside">
          <li>Authorization circumvention or account takeover</li>
          <li>Platform manipulation and evasion</li>
          <li>Fraudulent or deceptive workflows</li>
          <li>Non-consensual surveillance or data misuse</li>
          <li>Identity impersonation</li>
          <li>Obfuscated or undisclosed execution paths</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Violations trigger graduated responses: hide → remove → revoke tokens → ban. We don't
          guarantee advance notice for egregious cases.
        </p>
      </section>

      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Want to publish your first Skill?
        </p>
        <Link
          href="/publish"
          className="mt-3 inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Publish a Skill →
        </Link>
      </div>
    </div>
  );
}
