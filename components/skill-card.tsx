import Link from "next/link";
import type { DisplaySkill } from "@/lib/data";
import { getCategory } from "@/lib/categories";
import { SkillSocialBar } from "@/components/social-buttons";

export function SkillCard({ skill }: { skill: DisplaySkill }) {
  const category = getCategory(skill.category);

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group flex flex-col border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-100"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl leading-none">{skill.author.avatar}</span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium text-zinc-950 dark:text-zinc-50">
              {skill.name}
            </h3>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              @{skill.author.handle}
            </p>
          </div>
        </div>
        {skill.featured && (
          <span className="inline-flex items-center border border-zinc-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-950 dark:border-zinc-100 dark:text-zinc-100">
            Featured
          </span>
        )}
      </div>

      <p className="mb-5 flex-1 text-sm leading-relaxed text-zinc-600 line-clamp-2 dark:text-zinc-400">
        {skill.tagline}
      </p>

      <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
        {category && (
          <span className="border border-zinc-200 px-2 py-0.5 dark:border-zinc-800">
            {category.name}
          </span>
        )}
        {skill.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="border border-zinc-200 px-2 py-0.5 dark:border-zinc-800">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
        <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-500">
          <Stat icon="↓" value={formatCount(skill.installs)} label="installs" />
          <Stat icon="★" value={skill.rating.toFixed(1)} label={`${skill.ratingCount} reviews`} />
        </div>
        {skill.id && <SkillSocialBar skillId={skill.id} size="sm" />}
      </div>
    </Link>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className="text-zinc-400">{icon}</span>
      <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{value}</span>
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
