"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function LiveFavoritesStat({ skillId }: { skillId: string }) {
  if (!isConvexConfigured) {
    return <Display count={0} />;
  }
  return <Connected skillId={skillId as Id<"skills">} />;
}

function Connected({ skillId }: { skillId: Id<"skills"> }) {
  const data = useQuery(api.social.skillSocial, { skillId });
  return <Display count={data?.favoritesCount ?? 0} />;
}

function Display({ count }: { count: number }) {
  return (
    <div className="bg-white p-4 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">Favorites</div>
      <div className="mt-1 text-base font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums">
        ★ {count.toLocaleString()}
      </div>
    </div>
  );
}
