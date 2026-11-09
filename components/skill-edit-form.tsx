"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CATEGORIES } from "@/lib/categories";

interface EditableSkill {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  githubUrl: string;
  category: string;
  tags: string[];
  pricePoints?: number;
  submitterId: string | null;
}

export function SkillEditForm({ skill }: { skill: EditableSkill }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.user.me);
  const update = useMutation(api.skills.updateSkill);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || me === undefined) {
    return (
      <Banner kind="info" title="Loading…">
        Checking your sign-in state.
      </Banner>
    );
  }

  if (!isAuthenticated || !me) {
    return (
      <Banner kind="warn" title="Sign in to edit">
        Only the original submitter can edit a Skill.
      </Banner>
    );
  }

  if (!skill.submitterId || me.userId !== skill.submitterId) {
    return (
      <Banner kind="warn" title="Not yours">
        You can only edit Skills you published.
      </Banner>
    );
  }

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const rawPrice = parseInt(String(fd.get("pricePoints") ?? "0"), 10);

    const payload = {
      id: skill.id as Id<"skills">,
      name: String(fd.get("name") ?? "").trim(),
      tagline: String(fd.get("tagline") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      githubUrl: String(fd.get("githubUrl") ?? "").trim(),
      category: String(fd.get("category") ?? ""),
      tags: String(fd.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5),
      pricePoints: rawPrice > 0 ? rawPrice : 0, // 0 is treated as "unset" server-side
    };

    try {
      await update(payload);
      router.push(`/skills/${skill.slug}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed.");
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <Field label="Skill name" hint="Up to 60 characters. The URL slug stays the same once published." required>
        <input
          type="text"
          name="name"
          required
          maxLength={60}
          defaultValue={skill.name}
          className={inputCls}
        />
      </Field>

      <Field label="GitHub repository URL" hint="Must be a https://github.com/<owner>/<repo> URL." required>
        <input
          type="url"
          name="githubUrl"
          required
          defaultValue={skill.githubUrl}
          className={inputCls}
        />
      </Field>

      <Field label="Tagline" hint="One-sentence pitch, up to 120 characters." required>
        <input
          type="text"
          name="tagline"
          required
          maxLength={120}
          defaultValue={skill.tagline}
          className={inputCls}
        />
      </Field>

      <Field label="Description" required>
        <textarea
          name="description"
          required
          rows={6}
          defaultValue={skill.description}
          className={textareaCls}
        />
      </Field>

      <Field label="Category" required>
        <select name="category" required defaultValue={skill.category} className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.description}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tags" hint="Comma-separated. Up to 5.">
        <input
          type="text"
          name="tags"
          defaultValue={skill.tags.join(", ")}
          className={inputCls}
        />
      </Field>

      <Field label="Price (optional)" hint="Set a point price, or 0 for free.">
        <input
          type="number"
          name="pricePoints"
          min={0}
          max={10000}
          step={10}
          defaultValue={skill.pricePoints ?? 0}
          className={inputCls}
        />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/skills/${skill.slug}`}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950";

const textareaCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-700 dark:focus:ring-indigo-950";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Banner({
  kind,
  title,
  children,
}: {
  kind: "info" | "warn";
  title: string;
  children: React.ReactNode;
}) {
  const colors =
    kind === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  return (
    <div className={`rounded-lg border p-4 text-sm ${colors}`}>
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-xs opacity-90">{children}</div>
    </div>
  );
}
