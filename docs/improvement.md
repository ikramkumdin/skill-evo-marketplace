# Skill Evo Marketplace — Future Improvements

A grouped backlog of what's not built yet, ordered loosely by impact.

## Differentiation vs. clawhub.ai

The PM identified **social factors** as the primary moat. Most of those are now shipped (favorites, votes, ratings, labels, comments, verified badges, reputation). Remaining differentiation work:

- **Agent reputation** — surface it on Skill cards too, not just profiles. "Built by ⭐ Expert" tags would weight discovery toward proven authors.
- **Verified-working badge** — separate from "Currently Using" label. Auto-test that the Skill installs cleanly and the SKILL.md frontmatter is valid.
- **Skill telemetry from agents** — opt-in stats (success rate, avg tokens, cost) reported back from agents using the Skill. Makes the marketplace data-rich vs. opinion-rich.

## Discovery & Search

- **Real fuzzy search** — currently a naive `toLowerCase().includes()` scan. Move to Convex search index (already defined for `name`/`category`) and surface highlight matches.
- **Tag-based filtering UI** — clicking a tag filters but there's no "tag chip" UI to build queries. Add a tag cloud on the browse page.
- **Trending algorithm** — currently "Most installs" all-time. Add "Trending this week" using install velocity over a rolling window.
- **Similar Skills** — beyond same-category. Use tag overlap or vector search (Convex doesn't yet support embeddings, but could be done client-side or via an action).
- **Curated collections** — user-built lists like "MCP servers for data work" or "Agents I trust" — followable, shareable.
- **Onboarding quiz** — "What do you want to do?" → returns 3 recommended Skills.

## Authoring & Author Tools

- **Author dashboard** — install graph, rating distribution, comment feed, points earned, top referrers.
- **Skill versioning** — currently one repo URL = one version. Support release tags so authors can ship breaking changes safely.
- **Update notifications** — when an author pushes a new version, notify users who have it labeled "Currently Using."
- **Author payouts** — virtual points → real money. Stripe Connect or similar. Threshold-based (e.g., $50 minimum).
- **Tipping** — beyond purchases, let users tip authors directly with points (or money).
- **Submission rules / quality bar** — currently anyone can publish anything. Add automated linting (frontmatter check, README required, license file).
- **GitHub repo verification** — confirm the submitter actually owns the repo (currently anyone can submit any URL).
- **Real GitHub stars sync** — fetch `stargazers_count` from GitHub API on submit + periodic refresh. Replaces the dummy `stars` field.
- **README rendering** — pull the Skill's README from GitHub and render it on the detail page (markdown).
- **Skill preview** — render the SKILL.md frontmatter (name, description, when_to_use) on the detail page.

## Comments & Reviews

- **Long-form reviews** — separate from quick comments. Star rating + paragraph + pros/cons format. Reviews bubble above comments.
- **Review helpfulness** — "Was this helpful?" voting on individual reviews.
- **Mention notifications** — `@handle` in comments pings the user.
- **Mod tools** — flag/report comments, hide low-quality ones, shadow-ban repeat offenders.
- **Edit comments** — currently only delete + repost. Add edit history.

## User Profile

- **Bio + links** — let users add a tagline, website, Twitter, etc. Currently profile is just stats.
- **Activity feed** — chronological list of what the user did (rated X, labeled Y, bought Z).
- **Following / followers** — follow authors whose Skills you trust. Profile shows their feed.
- **Achievements / badges** — first publish, 100 installs, top contributor of the month, etc.
- **Custom avatar** — currently uses GitHub avatar or seeded emoji. Allow upload.
- **Email-only profiles** — currently we hard-require GitHub. Add email magic-link sign-in for non-developers.

## Auth & Identity

- **Google OAuth** — alongside GitHub for users who don't have GitHub.
- **Email magic link** — for the same reason.
- **Account deletion / data export** — GDPR compliance.
- **2FA** — beyond GitHub's own 2FA, add an app-level setting.
- **Audit log** — for users to see "you signed in from X at Y, agent Z was approved at W."

## Payments & Cash-Out

- **Automated payouts** — `payoutRequests` are processed manually today. Wire up Stripe Connect Express (or PayPal Payouts API) to disburse without admin involvement.
- **KYC / tax forms** — for US payouts ≥ $600/year we'll need W-9 / 1099-NEC handling. Currently no compliance pipeline.
- **FX support** — payouts are USD-only. Authors outside the US likely want EUR / INR / etc.
- **Earnings dashboard** — break down "what you earned this month vs. last," top-selling Skills, withdrawal history.
- **Subscriptions** — premium tier for unlimited installs of paid Skills, or recurring tipping of an author.
- **Bundles** — author can bundle 3 Skills for the price of 2.
- **Refunds** — currently purchases are final. Add a 24-hr refund window (refund returns points + reverses seller's 85%).
- **Tax-aware platform fee** — 15% is fixed today. May need volume tiers (10% above $1k/month, etc.).
- **Audit trail for platform fees** — currently the 15% gap is implicit (not recorded). Add an explicit `platformFee` field on `purchases` for accounting.
- **Currency rounding edge case** — `floor(price × 0.85)` always favors the platform. Document this and decide if it's the desired behavior.
- **Anti-fraud** — buyer/seller collusion detection (same person buying their own skills via alts to inflate metrics or launder points).

## AI Agent Integration

- **Agent token long-term storage** — currently the device-code flow gives a one-time token; not persisted server-side as a long-lived API key. Add an `agentTokens` table for revocable session tokens.
- **Per-agent scopes** — "this agent can install but not purchase" / "read-only." Currently any approved agent has full account access.
- **Agent activity log** — surface "what did this agent do on my account today" on the profile page.
- **Agent rate limiting** — prevent runaway agents from spamming installs.
- **Native Skill installer CLI** — a `skill-evo` CLI that runs the device-code flow + clones repos, instead of users copy-pasting `git clone` commands.
- **MCP marketplace integration** — expose the marketplace itself as an MCP server so agents can browse + install programmatically.

## Reliability & Quality

- **Rate limiting on mutations** — `addComment`, `vote`, `rateSkill` are unprotected. A bot could spam.
- **Spam / abuse detection** — heuristics on new accounts, similar comments, brigading.
- **Admin dashboard** — currently no way to delete bad Skills, ban users, audit purchases.
- **Test suite** — only manual testing right now. Add Playwright E2E for golden paths (publish, install, rate, buy).
- **Convex function tests** — unit-level coverage on mutations to lock in invariants (rating recompute, points conservation).
- **Error monitoring** — Sentry or similar. Today errors only show in dev console + dev-server logs.
- **Performance budget** — measure LCP/CLS on detail page; some sidebars are doing N+1-style queries.
- **Caching** — `getStats`, `getCategoryCounts` could be cached or pre-computed via Convex scheduled functions.

## UX Polish

- **Mobile responsive review** — built desktop-first; some grids don't break gracefully on narrow screens.
- **Accessibility audit** — axe-core pass, keyboard navigation for the rating widget, focus rings, aria-labels everywhere.
- **Loading states** — most queries show nothing while loading. Add skeleton placeholders.
- **Optimistic updates** — rating/favorite/vote mutations have a noticeable lag. Convex supports optimistic updates; wire them up.
- **Toast notifications** — successful purchase, comment posted, etc. Currently silent or page-state-based.
- **Dark mode polish** — works but some color combinations are subtle. Audit contrast.
- **i18n** — primarily English now. Project began with a Chinese fork — natural fit to add Chinese translation layer.
- **Search-as-you-type** — currently form submission only.

## Data & Analytics

- **Author analytics** — per-Skill funnel: views → installs → ratings.
- **Marketplace analytics** — admin view of total GMV, points circulation, daily active users.
- **Cohort retention** — do users who try one Skill come back?
- **A/B testing harness** — for tweaking the buy page, recommendations, etc.

## Operational

- **CI** — GitHub Actions for lint + typecheck + tests on every PR.
- **Preview deployments** — Vercel previews per PR.
- **Backup / restore** — Convex has its own backup story but a documented runbook is missing.
- **Migration scripts** — when schemas change, document the migration path. The `seededRating` snapshot was an ad-hoc migration; future ones should be more rigorous.
- **Status page** — uptime indicator for the marketplace + Convex deployment.

## Originally Roadmapped (Status)

- ✅ Threaded comments
- ✅ User profile pages
- ✅ Three-state Skill labels (Want to Use / Currently Using / Abandoned)
- ✅ Skill selling with virtual points
- ✅ Verified-usage badge on reviews
- ✅ Agent reputation surface
- ✅ 15% platform commission on Skill sales
- ✅ Cash-out flow (manual processing)
- ⏳ Automated payouts via Stripe Connect / PayPal API
- ⏳ Verified-working / auto-test badge

## Skill Hub Companion Repo

The original `skillmanager/` (rebranded "Skill Hub") repo is a separate project that pairs with this marketplace. Future work to align them:

- Skill Hub CLI integrates with marketplace (browse + install via CLI)
- Skill Hub uploads usage telemetry for verified-usage badge
- Shared auth between marketplace and CLI (device-code flow)
