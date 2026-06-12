"use client";

import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButtons } from "@/components/sign-in-buttons";

const isConvexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export function AgentApprovalCard({ code }: { code: string }) {
  if (!isConvexConfigured) {
    return <ConfigurationError />;
  }
  return <Connected code={code} />;
}

function Connected({ code }: { code: string }) {
  const { isAuthenticated } = useConvexAuth();
  const poll = useQuery(api.agentAuth.pollAgentAuth, { code });
  const approve = useMutation(api.agentAuth.approveAgentAuth);
  const reject = useMutation(api.agentAuth.rejectAgentAuth);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (poll === undefined) {
    return (
      <Shell>
        <CodeBadge code={code} />
        <p className="mt-6 text-sm text-zinc-500">Looking up this code…</p>
      </Shell>
    );
  }

  if (poll.status === "not_found") {
    return (
      <Shell>
        <CodeBadge code={code} />
        <StatusIcon kind="error" />
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Code not found
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          This authorization code doesn&apos;t exist. Double-check the URL your
          agent gave you — codes look like <span className="font-mono">Blue-Lion-42</span>.
        </p>
        <DoneActions />
      </Shell>
    );
  }

  if (poll.status === "expired") {
    return (
      <Shell>
        <CodeBadge code={code} />
        <StatusIcon kind="error" />
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Code expired
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Codes expire 10 minutes after they&apos;re generated. Ask your agent to
          request a new authorization code, then return here with the new URL.
        </p>
        <DoneActions />
      </Shell>
    );
  }

  if (done === "approved" || poll.status === "approved") {
    return (
      <Shell>
        <StatusIcon kind="success" />
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Agent approved
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{poll.agentName}</span> now
          has access to your Skill Evo account.
        </p>
        <DoneActions />
      </Shell>
    );
  }

  if (done === "rejected" || poll.status === "rejected") {
    return (
      <Shell>
        <StatusIcon kind="warning" />
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Agent rejected
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Access was denied.</p>
        <DoneActions />
      </Shell>
    );
  }

  // Status is "pending"
  if (!isAuthenticated) {
    return (
      <Shell>
        <div className="flex h-14 w-14 items-center justify-center border border-zinc-200 text-3xl dark:border-zinc-800">
          🤖
        </div>
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Agent authorization request
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {poll.agentName ?? "An AI agent"}
          </span>{" "}
          wants access to a Skill Evo account. Sign in first to decide.
        </p>
        <CodeBadge code={code} />
        <div className="mt-6 w-full">
          <SignInButtons />
        </div>
      </Shell>
    );
  }

  const handleApprove = async () => {
    setBusy("approve");
    setError(null);
    try {
      await approve({ code });
      setDone("approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve.");
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    setError(null);
    try {
      await reject({ code });
      setDone("rejected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Shell>
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-3xl dark:bg-indigo-900/30">
        🤖
      </div>
      <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Authorize this agent?
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {poll.agentName ?? "An AI agent"}
        </span>{" "}
        is requesting access to your Skill Evo account. Only approve if you trust this agent.
      </p>
      <CodeBadge code={code} />
      <div className="mt-6 flex gap-3 w-full">
        <button
          onClick={handleApprove}
          disabled={busy !== null}
          className="flex-1 h-10 bg-zinc-950 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          {busy === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={busy !== null}
          className="flex-1 h-10 border border-zinc-200 bg-white text-xs font-medium uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}
    </Shell>
  );
}

function DoneActions() {
  return (
    <div className="mt-6 flex flex-col gap-2 w-full">
      <a
        href="/"
        className="inline-flex h-10 w-full items-center justify-center bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
      >
        Back to home
      </a>
      <a
        href="/me"
        className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
      >
        Or view your profile
      </a>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}

function CodeBadge({ code }: { code: string }) {
  return (
    <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
      <p className="text-[11px] text-zinc-400 uppercase tracking-wide mb-1">Authorization code</p>
      <code className="text-lg font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-50">
        {code}
      </code>
    </div>
  );
}

function StatusIcon({ kind }: { kind: "success" | "error" | "warning" }) {
  const map = {
    success: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "✓", color: "text-emerald-600" },
    error: { bg: "bg-red-50 dark:bg-red-900/20", text: "✕", color: "text-red-600" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "!", color: "text-amber-600" },
  }[kind];

  return (
    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${map.bg} mx-auto`}>
      <span className={`text-2xl font-bold ${map.color}`}>{map.text}</span>
    </div>
  );
}

function ConfigurationError() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Backend is not configured.</p>
    </div>
  );
}
