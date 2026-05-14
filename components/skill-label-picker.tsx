"use client";

import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

const LABELS = [
  { value: "want", emoji: "🔖", text: "Want to Use" },
  { value: "using", emoji: "✅", text: "Currently Using" },
  { value: "abandoned", emoji: "🗑️", text: "Abandoned" },
] as const;

type Label = (typeof LABELS)[number]["value"];

export function SkillLabelPicker({ skillId }: { skillId: string }) {
  if (!isConvexConfigured) return null;
  return <Connected skillId={skillId as Id<"skills">} />;
}

function Connected({ skillId }: { skillId: Id<"skills"> }) {
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const current = useQuery(api.labels.myLabel, { skillId });
  const counts = useQuery(api.labels.labelCounts, { skillId });
  const setLabel = useMutation(api.labels.setLabel);
  const clearLabel = useMutation(api.labels.clearLabel);
  const [busy, setBusy] = useState(false);

  const handleClick = async (label: Label) => {
    if (!isAuthenticated) {
      await signIn("github", { redirectTo: window.location.pathname });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (current === label) {
        await clearLabel({ skillId });
      } else {
        await setLabel({ skillId, label });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {LABELS.map(({ value, emoji, text }) => {
        const active = current === value;
        const count = counts?.[value] ?? 0;
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            disabled={busy}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
              active
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{emoji}</span>
              <span className="font-medium">{text}</span>
            </span>
            {count > 0 && (
              <span className="text-[11px] tabular-nums text-zinc-400">{count}</span>
            )}
          </button>
        );
      })}
      {!isAuthenticated && (
        <p className="text-[11px] text-zinc-400">Sign in to track your status.</p>
      )}
    </div>
  );
}
