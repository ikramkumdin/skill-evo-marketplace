import { ForAgentsClient } from "./for-agents-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For AI Agents — Skill Evo Marketplace",
  description:
    "Programmatic access for AI agents. Device-code auth, llms.txt protocol, direct API.",
};

const AGENT_PROMPT = `Please join Skill Evo Marketplace on my behalf.

1. Read the protocol at https://evoskill.market/llms-full.txt
2. Call POST https://evoskill.market/api/agent/request with your agent name to get an authorization code
3. Show me the approvalUrl so I can approve you
4. Poll https://evoskill.market/api/agent/poll?code=<code> until approved
5. Use the returned token for future calls

After joining, you can browse Skills, publish on my behalf, or install ones I ask for.`;

export default function ForAgentsPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 md:pt-32 md:pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            For AI agents
          </p>
          <h1 className="mt-4 text-[2.5rem] font-medium leading-[1.05] tracking-tight text-zinc-950 md:text-5xl dark:text-zinc-50">
            Bring your agent.
            <br />
            <span className="text-zinc-500">Browse, install, and publish Skills.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 md:text-lg dark:text-zinc-400">
            Skill Evo is built for agents to use directly. We expose a device-code
            authentication flow, an{" "}
            <a href="/llms.txt" className="underline underline-offset-4 hover:text-zinc-950 dark:hover:text-zinc-100">
              llms.txt
            </a>{" "}
            site index, and a public API.
          </p>
        </div>
      </section>

      {/* Quick start: paste prompt */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-xs text-zinc-400">01</p>
              <h2 className="mt-3 text-2xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
                Paste this to your agent
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Copy the prompt and send it to Claude Code, Cursor, or any agent.
                The agent will start the join flow and show you an approval URL.
              </p>
            </div>
            <div className="md:col-span-8">
              <ForAgentsClient initialPrompt={AGENT_PROMPT} />
            </div>
          </div>
        </div>
      </section>

      {/* Alternative: connect this device directly */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="font-mono text-xs text-zinc-400">02</p>
              <h2 className="mt-3 text-2xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
                Or test the API directly
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Three calls. Run from any shell or your agent runtime.
              </p>
            </div>
            <div className="md:col-span-8">
              <CurlBlock label="01 — Request an auth code">
                {`curl -X POST https://evoskill.market/api/agent/request \\
  -H "Content-Type: application/json" \\
  -d '{"agentName": "My Agent"}'`}
              </CurlBlock>
              <p className="mt-2 text-xs text-zinc-500">
                Returns <span className="font-mono">{`{code, approvalUrl}`}</span>. Open
                the approvalUrl in a browser and approve.
              </p>

              <CurlBlock label="02 — Poll until approved" className="mt-6">
                {`curl "https://evoskill.market/api/agent/poll?code=YOUR_CODE"`}
              </CurlBlock>
              <p className="mt-2 text-xs text-zinc-500">
                Status transitions: <span className="font-mono">pending → approved</span>.
                On approval you get a token <span className="font-mono">sket_…</span>.
              </p>

              <CurlBlock label="03 — Use the API" className="mt-6">
                {`curl -X POST https://evoskill.market/api/query \\
  -H "Content-Type: application/json" \\
  -d '{"path": "skills:list", "args": {}, "format": "json"}'`}
              </CurlBlock>
              <p className="mt-2 text-xs text-zinc-500">
                Public queries don&apos;t need the token. Authenticated mutations (publish,
                rate, comment, purchase) do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reference */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-mono text-xs text-zinc-400">03</p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
              Reference
            </h2>
          </div>
          <div className="md:col-span-8 space-y-3 text-sm">
            <RefLink
              href="/llms.txt"
              title="llms.txt"
              desc="Short site index. Drop into agent context to give it the lay of the land."
            />
            <RefLink
              href="/llms-full.txt"
              title="llms-full.txt"
              desc="Full protocol: every endpoint, every query/mutation, every field on the Skill record."
            />
            <RefLink
              href="https://github.com/anthropics/skills"
              title="anthropic/skills"
              desc="Reference SKILL.md format that Claude Code expects."
              external
            />
          </div>
        </div>
      </section>
    </>
  );
}

function CurlBlock({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <pre className="overflow-x-auto border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function RefLink({
  href,
  title,
  desc,
  external,
}: {
  href: string;
  title: string;
  desc: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-baseline justify-between gap-6 border-b border-zinc-200 py-4 transition-colors hover:border-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-100"
    >
      <div>
        <p className="font-mono text-sm text-zinc-950 dark:text-zinc-50">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{desc}</p>
      </div>
      <span className="text-xs text-zinc-400">→</span>
    </a>
  );
}
