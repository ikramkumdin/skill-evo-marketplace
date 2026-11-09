import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillWithRelated } from "@/lib/data";
import { SkillEditForm } from "@/components/skill-edit-form";

export const dynamic = "force-dynamic";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getSkillWithRelated(slug);
  if (!result || !result.skill.id) notFound();

  const s = result.skill;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link
          href={`/skills/${s.slug}`}
          className="hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to {s.name}
        </Link>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        Edit Skill
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Only the original submitter can make changes here. The URL slug
        stays the same so existing links keep working.
      </p>

      <div className="mt-8">
        <SkillEditForm
          skill={{
            id: s.id!,
            slug: s.slug,
            name: s.name,
            tagline: s.tagline,
            description: s.description,
            githubUrl: s.githubUrl,
            category: s.category,
            tags: s.tags,
            pricePoints: s.pricePoints,
            submitterId: s.submitterId ?? null,
          }}
        />
      </div>
    </div>
  );
}
