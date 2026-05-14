"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function StarRating({ skillId }: { skillId: string }) {
  if (!isConvexConfigured) return null;
  return <Connected skillId={skillId} />;
}

function Connected({ skillId }: { skillId: string }) {
  const id = skillId as Id<"skills">;
  const data = useQuery(api.social.ratingFor, { skillId: id });
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const rate = useMutation(api.social.rateSkill);
  const unrate = useMutation(api.social.unrateSkill);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);

  const userRating = data?.userRating ?? null;
  const average = data?.average ?? 0;
  const count = data?.count ?? 0;

  const onRate = async (value: number) => {
    if (busy) return;
    if (!isAuthenticated) {
      await signIn("github", { redirectTo: window.location.pathname });
      return;
    }
    setBusy(true);
    try {
      if (userRating === value) {
        await unrate({ skillId: id });
      } else {
        await rate({ skillId: id, value });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <div
          className="flex items-center"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled =
              hover > 0 ? n <= hover : userRating !== null ? n <= userRating : n <= Math.round(average);
            const isYour = userRating !== null && hover === 0;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} ${n === 1 ? "star" : "stars"}`}
                onClick={() => onRate(n)}
                onMouseEnter={() => setHover(n)}
                disabled={busy}
                className="text-xl leading-none p-0.5 transition-colors disabled:opacity-50"
              >
                <span
                  className={
                    filled
                      ? isYour
                        ? "text-amber-500"
                        : "text-amber-400"
                      : "text-zinc-300 dark:text-zinc-700"
                  }
                >
                  ★
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-xs text-zinc-500 tabular-nums">
          {count > 0 ? `${average.toFixed(1)} (${count})` : "no ratings yet"}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">
        {userRating !== null ? (
          <>
            Your rating: <span className="font-medium text-amber-500">{userRating}/5</span>
            {" · "}
            <button
              type="button"
              onClick={() => onRate(userRating)}
              className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              disabled={busy}
            >
              clear
            </button>
          </>
        ) : isAuthenticated ? (
          "Click a star to rate."
        ) : (
          "Sign in to rate this Skill."
        )}
      </p>
    </div>
  );
}
