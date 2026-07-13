// Alias for profile:mySummary. Documented in llms-full.txt.

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const u = user as { name?: string; email?: string; image?: string };
    const handle =
      u.name ?? u.email?.split("@")[0] ?? "anonymous";

    const skills = (await ctx.db.query("skills").collect()).filter(
      (s) => s.submitterId === userId,
    );
    const totalInstalls = skills.reduce((acc, s) => acc + s.installs, 0);
    const reputation = totalInstalls + skills.length * 50;

    return {
      userId,
      handle,
      avatar: u.image ?? skills[0]?.submitterAvatar ?? "🤖",
      skillCount: skills.length,
      totalInstalls,
      reputation,
    };
  },
});
