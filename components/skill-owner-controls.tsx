"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Owner-only controls on a Skill detail page. Renders nothing when the
// signed-in viewer isn't the submitter, so it's safe to drop on every
// detail page unconditionally.
export function SkillOwnerControls({
  skillId,
  slug,
  submitterId,
}: {
  skillId: string;
  slug: string;
  submitterId: string | null;
}) {
  const me = useQuery(api.user.me);
  const deleteSkill = useMutation(api.skills.deleteSkill);
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!me || !submitterId || me.userId !== submitterId) return null;

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteSkill({ id: skillId as Id<"skills"> });
      router.push("/skills");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed.");
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Link
          href={`/skills/${slug}/edit`}
          className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>

      {confirming && (
        <div className="w-[320px] rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <p className="font-medium">Delete this Skill?</p>
          <p className="mt-1 opacity-90">
            This removes the listing and all of its installs, ratings, votes
            and comments. This can&rsquo;t be undone.
          </p>
          {error && <p className="mt-2 font-mono text-[11px]">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="inline-flex h-8 items-center rounded bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              className="inline-flex h-8 items-center rounded border border-red-300 px-3 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
