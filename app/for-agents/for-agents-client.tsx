"use client";

import { useState } from "react";

export function ForAgentsClient({ initialPrompt }: { initialPrompt: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(initialPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      <div className="relative">
        <pre className="overflow-x-auto whitespace-pre-wrap border border-zinc-200 bg-zinc-50 p-5 font-mono text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <code>{initialPrompt}</code>
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute right-3 top-3 inline-flex items-center bg-zinc-950 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Works with Claude Code, Cursor, Windsurf, or any agent that can make HTTP
        calls.
      </p>
    </div>
  );
}
