# Architecture

Technical overview of the marketplace: the stack, how a request flows
through it, where state lives, and what each directory contains.

---

## Stack

| Layer | Choice | Where it's configured |
|---|---|---|
| UI framework | Next.js 16 App Router (Turbopack) | `next.config.ts` |
| Styling | Tailwind CSS v4 | `app/globals.css` |
| Language | TypeScript 5 (strict) | `tsconfig.json` |
| Backend | Convex (serverless, strongly-consistent) | `convex/` |
| Auth | `@convex-dev/auth` with GitHub + Google OAuth | `convex/auth.ts`, `middleware.ts` |
| Analytics | Self-hosted Umami | injected in `app/layout.tsx` via `next/script` |
| Hosting | Vercel | `package.json` `build` script |

---

## Request flow

### A browser hit on `/skills/<slug>`

1. **Edge / Middleware** — `middleware.ts` runs `convexAuthNextjsMiddleware()`.
   It refreshes the session cookie if the token is close to expiry and
   wraps the response in `Cache-Control: no-store` so a per-user page
   doesn't get cached by a CDN.
2. **Server Component** — `app/skills/[slug]/page.tsx` pulls the
   viewer's auth token with `convexAuthNextjsToken()` and calls
   `getSkillWithRelated(slug)` in `lib/data.ts`, which uses
   `fetchQuery` with `{ token }` so Convex's `getAuthUserId` sees the
   real viewer. This is what lets a submitter see their own pending
   Skill while anonymous visitors 404.
3. **Convex** — `convex/skills.ts` `bySlug` filters non-approved rows
   unless the viewer is the submitter, then strips internal baseline
   fields via `publicSkillView()`.
4. **Hydration** — `<InstallButton>`, `<SkillSocialBar>`,
   `<StarRating>`, `<CommentThread>` take over as Client Components,
   each with its own `useQuery(api.*, ...)` subscription that keeps the
   UI live as other users interact.

### A `POST /api/mutation` hit from an agent

1. `app/api/mutation/route.ts` proxies the body to the Convex
   `determined-finch-765.convex.cloud/api/mutation` endpoint with any
   `Authorization` header passed through.
2. Convex looks up the mutation by name, type-checks args against its
   `v.object({…})` schema, runs the handler.
3. Any `ConvexError` thrown lands as `err.data` on the client; plain
   `new Error("…")` would reach the client as a generic `"Server
   Error"` and hide the real message, so project code throws
   `ConvexError` for anything a user sees.

### A `POST /api/agent/request` hit (device-code sign-in)

1. `app/api/agent/request/route.ts` proxies to Convex's `httpAction`
   at `determined-finch-765.convex.site/api/agent/request`.
2. The Convex HTTP action validates the body itself (agent name
   required, ≤ 80 chars; target handle optional, ≤ 80 chars), then
   inserts an `agentAuthCodes` row with a 12-char
   `crypto.getRandomValues` code and a 10-minute expiry.
3. The response is `{ code, approvalUrl }`. The code is shown to the
   human, who opens `approvalUrl` and clicks Approve/Reject.
4. The same `app/api/agent/request/route.ts` also responds to `GET`
   and `HEAD` with a 200 JSON hint so link-checker bots don't fill
   the logs with 405 noise.

---

## Directory layout

```
app/
  api/
    agent/
      poll/route.ts       # device-code poll (proxies to Convex)
      request/route.ts    # device-code request (proxies to Convex)
    auth/                 # NextAuth routes for GitHub + Google
    mutation/route.ts     # thin proxy to Convex /api/mutation
    query/route.ts        # thin proxy to Convex /api/query
  auth/agent/[code]/      # the human-visible approval page
  for-agents/             # /for-agents — docs, statically cached
  me/                     # redirects authed users to their profile
  publish/                # publish-a-Skill form
  skills/
    [slug]/               # Skill detail + /edit
    page.tsx              # Skills catalogue with search / filters
  users/[handle]/         # public profile
  not-found.tsx           # branded 404
  robots.ts, sitemap.ts   # Next's metadata-route convention
  page.tsx                # home

components/               # React components, mostly client-side
  skill-card.tsx, skill-edit-form.tsx, skill-owner-controls.tsx
  social-buttons.tsx, star-rating.tsx, comment-thread.tsx
  install-button.tsx, purchase-button.tsx
  header.tsx, auth-button.tsx, nav-link.tsx, …

convex/                   # Convex functions and schema
  schema.ts               # every table + index
  auth.ts                 # @convex-dev/auth config
  agentAuth.ts            # device-code flow + polling rate-limit
  skills.ts               # list / featured / bySlug / submit / update /
                          # delete / recordInstall / hasInstalled /
                          # moderation helpers
  social.ts               # ratings, votes, favourites
  comments.ts, labels.ts  # comment threads + "want/using/abandoned"
  points.ts               # purchase + cash-out ledger
  profile.ts, user.ts     # profile aggregation + `me` alias
  crawl.ts                # crawl github-anthropics into the catalogue

lib/
  data.ts                 # SSR helpers for fetching Convex data
  skills.ts               # mock Skills + type helpers (fallback path)
  categories.ts           # enum of category metadata

public/
  llms.txt, llms-full.txt # llms.txt-convention API docs
  robots.txt-equivalents are generated by app/robots.ts
```

---

## Data model — core tables

Full definitions in `convex/schema.ts`; the summary:

| Table | Role |
|---|---|
| `skills` | The catalogue. `moderationStatus` ("pending" / "approved" / "rejected") gates public visibility; undefined = pre-moderation legacy row, treated as approved. |
| `installEvents` | One row per (user, skill) install. `by_user_and_skill` index guarantees uniqueness of the credit. |
| `favorites`, `votes`, `ratings`, `skillLabels`, `comments` | Social side-tables. Each has a `by_skill` index so cascade-delete on a Skill is cheap. |
| `agentAuthCodes` | Device-code auth. `code` is a 12-char `XXXX-XXXX-XXXX` string with ~59 bits of entropy; expires 10 min after creation. |
| `pollRateLimit` | One row per poll attempt against `/api/agent/poll`, keyed by client IP, pruned opportunistically. Used by `pollAgentAuthWithRateLimit`. |
| `pointsLedger` | Virtual-points deltas. Earns from installs, spends on paid Skills, cashes out to real money via the manual `requestPayout` flow. |
| `purchases` | Idempotent record of which user bought which paid Skill. |
| `payoutRequests` | Open cash-out requests for an admin to resolve offline. |

---

## Auth model

### Client

- `@convex-dev/auth` stores the session token in `localStorage` by
  default. Different browser tabs share the same signed-in state.
- Sign-in is GitHub or Google. Both are OAuth; no password store.

### Server

- `convexAuthNextjsMiddleware` runs on every non-static path and keeps
  the session cookie fresh. For public pages that need no auth at all,
  the matcher in `middleware.ts` excludes them so Next's `revalidate`
  can actually cache them.
- `convexAuthNextjsToken()` in a Server Component returns the viewer's
  token. Pass it to `fetchQuery` so the Convex query sees the real
  viewer instead of acting as anonymous.

### Agents

- An AI agent can't go through the browser OAuth flow, so it uses the
  device-code pattern:
  1. `POST /api/agent/request` → returns `{ code, approvalUrl }`.
  2. Agent prints the code and the URL to the human.
  3. Human opens the URL, signs in with GitHub/Google, approves.
  4. Agent polls `GET /api/agent/poll?code=…` until status transitions
     from `pending` → `approved`, at which point the response includes
     a one-time `sket_…` token (256 bits of `crypto.getRandomValues`)
     the agent can use as `Authorization: Bearer sket_…` on subsequent
     calls.
- `/api/agent/poll` is rate-limited per client IP: 30 polls per
  minute and 200 per 10 minutes. See `pollAgentAuthWithRateLimit` in
  `convex/agentAuth.ts`.

---

## Caching and revalidation

- Fully-public static pages (`/for-agents`, `/about`, `/privacy`,
  `/terms`, `/submission-rules`) are excluded from the auth middleware
  matcher and get Next's native revalidation. `/for-agents` sets
  `revalidate = 3600`.
- Everything else is rendered per-request because it reads cookies via
  `convexAuthNextjsToken()`.
- `Link` components to high-fan-out destinations — the header nav,
  category sidebar links, pagination buttons, Skill tile links — all
  pass `prefetch={false}`. Default-prefetch would fire a Server
  Component render on hover+intent for each visible link; disabling it
  prevents preload storms that would otherwise show up as throttled
  5xx responses under load.

---

## Where the public API docs live

- `public/llms.txt` — the llms.txt-convention index. Agents point here
  first.
- `public/llms-full.txt` — the full reference. Lists every public
  Convex function, its arg schema, and the Skill record shape.
