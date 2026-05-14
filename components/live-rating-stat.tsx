"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function LiveRatingStat({
  skillId,
  fallbackRating,
  fallbackCount,
}: {
  skillId: string;
  fallbackRating: number;
  fallbackCount: number;
}) {
  if (!isConvexConfigured) {
    return <StatDisplay rating={fallbackRating} count={fallbackCount} />;
  }
  return (
    <Connected
      skillId={skillId as Id<"skills">}
      fallbackRating={fallbackRating}
      fallbackCount={fallbackCount}
    />
  );
}

function Connected({
  skillId,
  fallbackRating,
  fallbackCount,
}: {
  skillId: Id<"skills">;
  fallbackRating: number;
  fallbackCount: number;
}) {
  const data = useQuery(api.social.ratingFor, { skillId });
  const rating = data?.average ?? fallbackRating;
  const count = data?.count ?? fallbackCount;
  return <StatDisplay rating={rating} count={count} />;
}

function StatDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="bg-white p-4 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">Rating</div>
      <div className="mt-1 text-base font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums">
        ★ {rating.toFixed(1)} ({count})
      </div>
    </div>
  );
}
