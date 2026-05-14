"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function InstallButton({
  slug,
  initialInstalls,
}: {
  slug: string;
  initialInstalls: number;
}) {
  if (!isConvexConfigured) return <DisabledButton />;
  return <ConnectedButton slug={slug} initialInstalls={initialInstalls} />;
}

function DisabledButton() {
  return (
    <button
      type="button"
      disabled
      title="Run npx convex dev to enable the install action"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white opacity-60 cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900"
    >
      Install
      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold dark:bg-zinc-900/20">
        SOON
      </span>
    </button>
  );
}

function ConnectedButton({
  slug,
  initialInstalls,
}: {
  slug: string;
  initialInstalls: number;
}) {
  const [installs, setInstalls] = useState(initialInstalls);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recordInstall = useMutation(api.skills.recordInstall);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const result = await recordInstall({ slug });
      setInstalls(result.installs);
      setState("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("install failed", e);
      setErrorMsg(msg);
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
          state === "done"
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : state === "error"
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        }`}
      >
        {busy ? (
          "Installing..."
        ) : state === "done" ? (
          <>
            ✓ Installed
            <span className="text-xs opacity-80">({installs.toLocaleString()})</span>
          </>
        ) : state === "error" ? (
          "Retry install"
        ) : (
          "Install"
        )}
      </button>
      {state === "error" && errorMsg && (
        <p className="text-[11px] text-red-500 max-w-xs text-right">{errorMsg}</p>
      )}
    </div>
  );
}
