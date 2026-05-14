import { AgentApprovalCard } from "@/components/agent-approval-card";

export const dynamic = "force-dynamic";

export default async function AgentApprovalPage(props: PageProps<"/auth/agent/[code]">) {
  const { code } = await props.params;
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <AgentApprovalCard code={code} />
    </div>
  );
}
