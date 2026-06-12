import { AgentApprovalCard } from "@/components/agent-approval-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent Authorization — Skill Evo Marketplace",
  description: "Approve or reject an AI agent's access request.",
};

export default async function AgentApprovalPage(props: PageProps<"/auth/agent/[code]">) {
  const { code: rawCode } = await props.params;
  const code = decodeURIComponent(rawCode);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Agent authorization
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
        Review this access request
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        An AI agent has requested access to a Skill Evo account using the
        authorization code below. Confirm you trust this agent before approving.
      </p>

      <div className="mt-10 flex justify-start">
        <AgentApprovalCard code={code} />
      </div>
    </div>
  );
}
