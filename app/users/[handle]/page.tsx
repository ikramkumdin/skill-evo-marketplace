import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SkillCard } from "@/components/skill-card";
import { isConvexConfigured } from "@/lib/data";

export const dynamic = "force-dynamic";

const LABEL_META = {
  want: { emoji: "🔖", text: "Want to Use" },
  using: { emoji: "✅", text: "Currently Using" },
  abandoned: { emoji: "🗑️", text: "Abandoned" },
} as const;

type LabelKey = keyof typeof LABEL_META;

export default async function UserProfilePage(props: PageProps<"/users/[handle]">) {
  const { handle: rawHandle } = await props.params;
  const handle = decodeURIComponent(rawHandle);

  if (!isConvexConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-sm text-zinc-500">Profiles require backend to be configured.</p>
      </div>
    );
  }

  type ProfileResult = Awaited<ReturnType<typeof fetchQuery<typeof api.profile.getUserProfile>>>;
  const profile = (await fetchQuery(api.profile.getUserProfile, { handle })) as ProfileResult;

  if (!profile || !profile.userId) {
    notFound();
  }

  const labelGroups = {
    want: profile.labeledSkills.filter((x) => x.label === "want"),
    using: profile.labeledSkills.filter((x) => x.label === "using"),
    abandoned: profile.labeledSkills.filter((x) => x.label === "abandoned"),
  };

  const reputationLevel =
    profile.reputation >= 2000
      ? "Expert"
      : profile.reputation >= 500
        ? "Contributor"
        : profile.reputation >= 100
          ? "Member"
          : "Newcomer";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="mb-10 flex items-start gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 text-4xl shrink-0 dark:bg-zinc-900">
          {typeof profile.avatar === "string" && profile.avatar.startsWith("http") ? (
            <img src={profile.avatar} alt={handle} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            profile.avatar
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">@{handle}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
            <span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {profile.skillCount}
              </span>{" "}
              skills published
            </span>
            <span>·</span>
            <span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {profile.totalInstalls.toLocaleString()}
              </span>{" "}
              total installs
            </span>
          </div>
          <ReputationBadge score={profile.reputation} level={reputationLevel} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main: published + labeled skills */}
        <div className="lg:col-span-2 space-y-10">
          {profile.publishedSkills.length === 0 &&
            profile.labeledSkills.length === 0 &&
            profile.favorites.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  This profile is empty
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Publish a Skill, favorite some, or label what you&apos;re using to get
                  started.
                </p>
              </div>
            )}
          {profile.publishedSkills.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Published Skills
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {profile.publishedSkills.map((s) => (
                  <SkillCard
                    key={s._id}
                    skill={{
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
                      author: { handle: s.submitterHandle, avatar: s.submitterAvatar },
                      createdAt: new Date(s._creationTime).toISOString().slice(0, 10),
                      updatedAt: new Date(s._creationTime).toISOString().slice(0, 10),
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {(["using", "want", "abandoned"] as LabelKey[]).map((label) => {
            const items = labelGroups[label];
            if (items.length === 0) return null;
            const meta = LABEL_META[label];
            return (
              <section key={label}>
                <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {meta.emoji} {meta.text}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {items.map(({ skill: s }) => (
                    <SkillCard
                      key={s._id}
                      skill={{
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
                        author: { handle: s.submitterHandle, avatar: s.submitterAvatar },
                        createdAt: new Date(s._creationTime).toISOString().slice(0, 10),
                        updatedAt: new Date(s._creationTime).toISOString().slice(0, 10),
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Sidebar: reputation + favorites */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="mb-4 text-xs font-semibold tracking-wide uppercase text-zinc-500">
              Agent Reputation
            </h3>
            <ReputationSurface
              score={profile.reputation}
              level={reputationLevel}
              installs={profile.totalInstalls}
              skillCount={profile.skillCount}
            />
          </div>

          {profile.favorites.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500">
                Favorites
              </h3>
              <ul className="space-y-2">
                {profile.favorites.slice(0, 8).map((s) => (
                  s && (
                    <li key={s._id}>
                      <Link
                        href={`/skills/${s.slug}`}
                        className="block text-sm text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                      >
                        <span className="mr-1">{s.submitterAvatar}</span>
                        {s.name}
                      </Link>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReputationBadge({ score, level }: { score: number; level: string }) {
  const color =
    level === "Expert"
      ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800"
      : level === "Contributor"
        ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:ring-indigo-800"
        : "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700";

  return (
    <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${color}`}>
      ⭐ {level} · {score.toLocaleString()} rep
    </span>
  );
}

function ReputationSurface({
  score,
  level,
  installs,
  skillCount,
}: {
  score: number;
  level: string;
  installs: number;
  skillCount: number;
}) {
  const LEVELS = [
    { name: "Newcomer", min: 0 },
    { name: "Member", min: 100 },
    { name: "Contributor", min: 500 },
    { name: "Expert", min: 2000 },
  ];

  const currentIdx = LEVELS.findIndex((l) => l.name === level);
  const next = LEVELS[currentIdx + 1];
  const current = LEVELS[currentIdx];
  const progress = next
    ? Math.min(100, Math.round(((score - current.min) / (next.min - current.min)) * 100))
    : 100;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
          {score.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">reputation points</div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
          <span>{level}</span>
          {next && <span>{next.name} at {next.min.toLocaleString()}</span>}
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-950">
          <div className="font-semibold text-zinc-900 dark:text-zinc-50">{skillCount}</div>
          <div className="text-zinc-500">Skills</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-950">
          <div className="font-semibold text-zinc-900 dark:text-zinc-50">
            {installs.toLocaleString()}
          </div>
          <div className="text-zinc-500">Installs</div>
        </div>
      </div>

      <div className="text-[11px] text-zinc-400 space-y-0.5">
        <p>+50 rep per published Skill</p>
        <p>+1 rep per install received</p>
      </div>
    </div>
  );
}
