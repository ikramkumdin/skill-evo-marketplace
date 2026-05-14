"use client";

import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function PurchaseButton({
  skillId,
  pricePoints,
}: {
  skillId: string;
  pricePoints: number;
}) {
  if (!isConvexConfigured) return <DisabledButton price={pricePoints} />;
  return <Connected skillId={skillId as Id<"skills">} pricePoints={pricePoints} />;
}

function Connected({
  skillId,
  pricePoints,
}: {
  skillId: Id<"skills">;
  pricePoints: number;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const owned = useQuery(api.points.hasPurchased, { skillId });
  const balance = useQuery(api.points.myBalance);
  const purchase = useMutation(api.points.purchaseSkill);
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (owned) {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
        ✓ Owned
      </span>
    );
  }

  const canAfford = balance !== null && balance !== undefined && balance >= pricePoints;

  const handleBuy = async () => {
    if (!isAuthenticated) {
      await signIn("github", { redirectTo: window.location.pathname });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await purchase({ skillId });
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Purchase failed.");
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  if (state === "done") {
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
        ✓ Purchased!
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleBuy}
        disabled={busy || (isAuthenticated && !canAfford)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500"
      >
        {busy ? "Buying…" : `Buy · ${pricePoints} pts`}
      </button>
      {isAuthenticated && !canAfford && balance !== null && (
        <span className="text-[11px] text-red-500">
          Need {pricePoints} pts, have {balance}
        </span>
      )}
      {state === "error" && (
        <span className="text-[11px] text-red-500">{errorMsg}</span>
      )}
    </div>
  );
}

function DisabledButton({ price }: { price: number }) {
  return (
    <button
      disabled
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white opacity-50"
    >
      Buy · {price} pts
    </button>
  );
}
