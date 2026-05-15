import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillWithRelated } from "@/lib/data";
import { getCategory } from "@/lib/categories";
import { InstallButton } from "@/components/install-button";
import { SkillSocialBar } from "@/components/social-buttons";
import { StarRating } from "@/components/star-rating";
import { CommentThread } from "@/components/comment-thread";
import { SkillLabelPicker } from "@/components/skill-label-picker";
import { PurchaseButton } from "@/components/purchase-button";
import { LiveRatingStat } from "@/components/live-rating-stat";
import { LiveFavoritesStat } from "@/components/live-favorites-stat";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage(props: PageProps<"/skills/[slug]">) {
  const { slug } = await props.params;
  const result = await getSkillWithRelated(slug);
  if (!result) notFound();

  const { skill, related } = result;
  const category = getCategory(skill.category);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/skills" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Skills
        </Link>
        <span>/</span>
        {category && (
          <>
            <Link
              href={`/skills?category=${category.id}`}
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-700 dark:text-zinc-300">{skill.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-2xl shrink-0 dark:bg-zinc-900">
            {skill.author.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50 truncate">
                {skill.name}
              </h1>
              {skill.featured && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                  Featured
                </span>
              )}
              {skill.source === "crawled" && (
                <span
                  title="Auto-discovered from a public GitHub repo"
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
                >
                  Auto-discovered
                </span>
              )}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">{skill.tagline}</p>
            <p className="mt-2 text-xs text-zinc-500">
              by{" "}
              <Link href="#" className="font-medium text-zinc-700 hover:underline dark:text-zinc-300">
                @{skill.author.handle}
              </Link>
              {" · "}
              Updated {formatDate(skill.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={skill.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <GitHubIcon />
              GitHub
            </a>
            {skill.pricePoints ? (
              skill.id && (
                <PurchaseButton skillId={skill.id} pricePoints={skill.pricePoints} />
              )
            ) : (
              <InstallButton slug={skill.slug} initialInstalls={skill.installs} />
            )}
          </div>
          {skill.id && <SkillSocialBar skillId={skill.id} size="md" />}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-px rounded-xl bg-zinc-200 p-px mb-8 overflow-hidden dark:bg-zinc-800">
        <Stat label="Installs" value={skill.installs.toLocaleString()} />
        {skill.id ? (
          <LiveFavoritesStat skillId={skill.id} />
        ) : (
          <Stat label="Favorites" value="0" />
        )}
        {skill.id ? (
          <LiveRatingStat
            skillId={skill.id}
            fallbackRating={skill.rating}
            fallbackCount={skill.ratingCount}
          />
        ) : (
          <Stat label="Rating" value={`★ ${skill.rating.toFixed(1)} (${skill.ratingCount})`} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          <Section title="Install">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <code className="block text-sm font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
                {`git clone ${skill.githubUrl} ~/.claude/skills/${skill.slug}`}
              </code>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Clones the Skill into Claude Code's global skills directory. Then
              restart Claude Code so it picks up the new Skill.
            </p>
          </Section>

          <Section title="About this Skill">
            <p className="text-sm text-zinc-700 leading-relaxed dark:text-zinc-300">
              {skill.description}
            </p>
          </Section>

          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/skills?q=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </Section>

          {skill.id && (
            <Section title="Comments">
              <CommentThread skillId={skill.id} />
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {skill.id && (
            <SidebarCard title="Rate this Skill">
              <StarRating skillId={skill.id} />
            </SidebarCard>
          )}
          {skill.id && (
            <SidebarCard title="My Status">
              <SkillLabelPicker skillId={skill.id} />
            </SidebarCard>
          )}
          <SidebarCard title="Details">
            <DetailRow label="Category">
              {category && (
                <Link
                  href={`/skills?category=${category.id}`}
                  className="inline-flex items-center gap-1 text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                >
                  <span>{category.icon}</span> {category.name}
                </Link>
              )}
            </DetailRow>
            <DetailRow label="Author">
              <Link href={`/users/${encodeURIComponent(skill.author.handle)}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                @{skill.author.handle}
              </Link>
            </DetailRow>
            <DetailRow label="Price">
              {skill.pricePoints ? `${skill.pricePoints} pts` : "Free"}
            </DetailRow>
            <DetailRow label="Created">{formatDate(skill.createdAt)}</DetailRow>
            <DetailRow label="Updated">{formatDate(skill.updatedAt)}</DetailRow>
            <DetailRow label="License">MIT</DetailRow>
          </SidebarCard>

          {related.length > 0 && (
            <SidebarCard title="Related Skills">
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/skills/${r.slug}`}
                      className="block text-sm text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                    >
                      <span className="mr-1">{r.author.avatar}</span>
                      {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-base font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="mb-3 text-xs font-semibold tracking-wide uppercase text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-100">{children}</span>
    </div>
  );
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
