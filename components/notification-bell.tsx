"use client";

import Link from "next/link";
import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function NotificationBell() {
  if (!isConvexConfigured) return null;
  return <Connected />;
}

function Connected() {
  const { isAuthenticated } = useConvexAuth();
  const pending = useQuery(api.agentAuth.pendingForMe);
  const approve = useMutation(api.agentAuth.approveAgentAuth);
  const reject = useMutation(api.agentAuth.rejectAgentAuth);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (!isAuthenticated) return null;

  const count = pending?.length ?? 0;

  const handle = (action: "approve" | "reject", code: string) => async () => {
    if (busy) return;
    setBusy(code);
    try {
      if (action === "approve") await approve({ code });
      else await reject({ code });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white tabular-nums">
            {count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-80 border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-900">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Pending agent requests
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {count === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">No pending requests.</p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Agents that request access on your behalf will appear here.
                  </p>
                </div>
              ) : (
                <ul>
                  {pending!.map((p) => (
                    <li
                      key={p._id}
                      className="border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-900"
                    >
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        🤖 {p.agentName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        Code <span className="font-mono">{p.code}</span> · expires in{" "}
                        {Math.max(0, Math.round((p.expiresAt - Date.now()) / 60000))}m
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={handle("approve", p.code)}
                          disabled={busy !== null}
                          className="inline-flex h-7 items-center bg-zinc-950 px-3 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                        >
                          {busy === p.code ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={handle("reject", p.code)}
                          disabled={busy !== null}
                          className="inline-flex h-7 items-center border border-zinc-200 px-3 text-[10px] font-medium uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        >
                          Reject
                        </button>
                        <Link
                          href={`/auth/agent/${p.code}`}
                          onClick={() => setOpen(false)}
                          className="ml-auto inline-flex h-7 items-center text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          Open →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
