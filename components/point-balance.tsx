"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function PointBalance() {
  if (!isConvexConfigured) return null;
  return <Connected />;
}

function Connected() {
  const { isAuthenticated } = useConvexAuth();
  const balance = useQuery(api.points.myBalance);

  if (!isAuthenticated || balance === null || balance === undefined) return null;

  return (
    <Link
      href="/points/cashout"
      title="Cash out your points"
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
    >
      ⭐ {balance.toLocaleString()} pts
    </Link>
  );
}
