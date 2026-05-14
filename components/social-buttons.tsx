"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

type Size = "sm" | "md";

export function SkillSocialBar({
  skillId,
  size = "md",
  layout = "row",
}: {
  skillId: string;
  size?: Size;
  layout?: "row" | "stack";
}) {
  if (!isConvexConfigured) return null;
  return <Connected skillId={skillId} size={size} layout={layout} />;
}

function Connected({
  skillId,
  size,
  layout,
}: {
  skillId: string;
  size: Size;
  layout: "row" | "stack";
}) {
  const id = skillId as Id<"skills">;
  const social = useQuery(api.social.skillSocial, { skillId: id });
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const toggleFavorite = useMutation(api.social.toggleFavorite);
  const vote = useMutation(api.social.vote);
  const [busy, setBusy] = useState<"fav" | "up" | "down" | null>(null);

  const requireAuth = async () => {
    if (isAuthenticated) return true;
    await signIn("github", { redirectTo: window.location.pathname });
    return false;
  };

  const onFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await requireAuth())) return;
    setBusy("fav");
    try {
      await toggleFavorite({ skillId: id });
    } finally {
      setBusy(null);
    }
  };

  const onVote = (kind: "up" | "down") => async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await requireAuth())) return;
    setBusy(kind);
    try {
      await vote({ skillId: id, kind });
    } finally {
      setBusy(null);
    }
  };

  const fav = social?.userFavorited ?? false;
  const myVote = social?.userVote ?? null;
  const favCount = social?.favoritesCount ?? 0;
  const upCount = social?.upvotes ?? 0;
  const downCount = social?.downvotes ?? 0;

  const cls =
    size === "sm"
      ? "h-7 px-2 text-[11px] gap-1"
      : "h-9 px-3 text-xs gap-1.5";

  const wrap =
    layout === "stack"
      ? "flex flex-col gap-1.5 items-stretch"
      : "flex items-center gap-1.5";

  return (
    <div className={wrap} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onFavorite}
        disabled={busy === "fav"}
        title={fav ? "Remove from favorites" : "Save to favorites"}
        aria-pressed={fav}
        className={`inline-flex items-center justify-center rounded-md border font-medium transition-all disabled:opacity-50 ${cls} ${
          fav
            ? "border-amber-500 bg-amber-500 text-white shadow-sm dark:border-amber-400 dark:bg-amber-500"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <span className={`text-sm leading-none ${fav ? "" : ""}`}>
          {fav ? "★" : "☆"}
        </span>
        <span className="tabular-nums">{favCount}</span>
      </button>
      <button
        type="button"
        onClick={onVote("up")}
        disabled={busy === "up"}
        title={myVote === "up" ? "Remove upvote" : "Upvote"}
        aria-pressed={myVote === "up"}
        className={`inline-flex items-center justify-center rounded-md border font-medium transition-all disabled:opacity-50 ${cls} ${
          myVote === "up"
            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <span className="leading-none">▲</span>
        <span className="tabular-nums">{upCount}</span>
      </button>
      <button
        type="button"
        onClick={onVote("down")}
        disabled={busy === "down"}
        title={myVote === "down" ? "Remove downvote" : "Downvote"}
        aria-pressed={myVote === "down"}
        className={`inline-flex items-center justify-center rounded-md border font-medium transition-all disabled:opacity-50 ${cls} ${
          myVote === "down"
            ? "border-red-500 bg-red-500 text-white shadow-sm dark:border-red-400 dark:bg-red-500"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <span className="leading-none">▼</span>
        <span className="tabular-nums">{downCount}</span>
      </button>
    </div>
  );
}
