import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import { isConvexConfigured } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MePage() {
  if (!isConvexConfigured) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-sm text-zinc-500">Backend is not configured.</p>
      </div>
    );
  }

  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/");
  }

  const summary = await fetchQuery(api.profile.mySummary, {}, { token });
  if (!summary) {
    redirect("/");
  }

  redirect(`/users/${encodeURIComponent(summary.handle)}`);
}
