import Link from "next/link";
import type { DisplaySkill } from "@/lib/data";
import { getCategory } from "@/lib/categories";
import { SkillSocialBar } from "@/components/social-buttons";

export function SkillCard({ skill }: { skill: DisplaySkill }) {
  const category = getCategory(skill.category);

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{skill.author.avatar}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-950 group-hover:text-indigo-600 transition-colors dark:text-zinc-50 dark:group-hover:text-indigo-400 truncate">
              {skill.name}
            </h3>
            <p className="text-[11px] text-zinc-500">@{skill.author.handle}</p>
          </div>
        </div>
        {skill.featured && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
            Featured
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2 flex-1">
        {skill.tagline}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {category && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
            <span>{category.icon}</span>
            {category.name}
          </span>
        )}
        {skill.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
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
    <span className="flex items-center gap-1" title={label}>
      <span className="text-zinc-400">{icon}</span>
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{value}</span>
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
