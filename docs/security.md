# Security

Threat model, the controls shipped against each item, and the areas
that are deliberately out of scope so they don't get re-opened in
future reviews without context.

---

## Threat model (short form)

The marketplace exposes three independent attack surfaces:

1. **The browser UI.** Anyone can load the site, open DevTools and
   craft arbitrary API calls. Security can't rely on the UI gating
   anything.
2. **The public API** (`/api/query`, `/api/mutation`, `/api/agent/*`).
   Hit directly by AI agents and scripts; no browser in the loop.
3. **Content posted by users** (Skill names, descriptions, GitHub
   URLs, comments, install commands). An attacker publishing a Skill
   can try to make every viewer run attacker-controlled code.

The rest of this file walks through what's shipped against each.

---

## Agent sign-in (device-code auth)

### Controls

| Risk | Control |
|---|---|
| Brute-force the approval code to intercept a token | 12-char code drawn from a 31-character alphabet with `crypto.getRandomValues`. ~59 bits of entropy. Formatted `XXXX-XXXX-XXXX` for readability; the letters chosen to avoid confusable glyphs (0/O, 1/I/L). |
| Scan the whole code space with /api/agent/poll | `pollAgentAuthWithRateLimit` records every poll in the `pollRateLimit` table keyed by client IP. 30 polls / minute and 200 / 10 minutes trigger a 429 with a `Retry-After` header. |
| Predictable token lets an attacker guess session tokens | Tokens are 256 bits of `crypto.getRandomValues`, hex-encoded with a `sket_` prefix. |
| User doesn't realise what they're approving | The approval page lists every permission the token grants — install/buy Skills, publish, request payouts, vote/comment — before the Approve button. |
| Old codes linger forever | Codes expire 10 minutes after creation and are consumed on first successful approval. |

### IP source

Convex sits behind a proxy. `clientIp()` in `convex/agentAuth.ts`
reads `x-forwarded-for` (first entry), falls back to `x-real-ip`,
falls back to the string `"unknown"`. The rate-limit table buckets
by this value.

### What isn't covered

- A compromised OAuth provider (GitHub / Google) can issue a session
  to an attacker. Nothing here mitigates that; it's upstream.
- Someone shoulder-surfing the approval URL on the user's screen can
  of course click Approve before the real user does. Not a
  technical attack surface.

---

## Publishing a Skill

### Controls

| Risk | Control |
|---|---|
| Publish a Skill whose install step runs arbitrary shell | `installCommand` is not accepted as a mutation arg. The server builds it from the validated `githubUrl` as `git clone <url> ~/.claude/skills/<slug>`. The record's `installCommand` field is server-generated at submit time — any value a caller tries to pass is ignored (Convex rejects extra fields at the schema boundary). |
| Publish under someone else's GitHub namespace | `githubUrl` must match `^https://github\.com/<owner>/<repo>$` after normalising trailing `.git` and `/`. Non-GitHub hosts rejected with a clear `ConvexError`. |
| API callers bypass UI-side validation to publish bad data | Server-side length and presence checks on `name` (1–60 chars), `tagline` (1–120), `description` (non-empty), tags (max 5). Slug must be at least 2 characters after `slugify`. Duplicate slug → `ConvexError("A Skill with that name already exists.")`. |
| Spam listings farm +50 reputation each | New Skills land as `moderationStatus: "pending"`. They're hidden from the public catalogue and from anonymous visits to the submitter's profile until a moderator approves. Reputation only counts approved (or pre-moderation-legacy) Skills. |

### Editing a Skill

- `updateSkill` reloads the row first and throws
  `ConvexError("You can only edit Skills you published.")` if
  `submitterId !== auth user id`. The UI's "Not yours" state is UX
  only; the server check is the actual guarantee.
- The slug is intentionally **frozen** — editing the name never
  re-slugs. If the submitter wants a different URL they need to
  delete and republish.
- All the same validation rules apply as on `submit`.

---

## Installing a Skill

### Controls

| Risk | Control |
|---|---|
| Inflate install counters by clicking the Install button repeatedly | `recordInstall` requires sign-in. For a signed-in user, the mutation checks `installEvents` by the `by_user_and_skill` index. If a row exists, the write is a no-op and the response says `counted: false`. Anonymous clicks don't count at all. |
| Install button forgets state after a refresh | `skills:hasInstalled({slug})` reads `installEvents` for the signed-in viewer on mount; the button renders in its "✓ Installed" state when true. |

---

## Rate limiting

Two distinct schemes:

| Endpoint | Scheme |
|---|---|
| `/api/agent/poll` | Short window: 30 req/min/IP. Long window: 200 req/10 min/IP. Returns 429 with `Retry-After`. |
| All other Convex mutations | Relies on Convex's own per-deployment per-IP throttling. No additional per-handler limiting; add one if a specific mutation becomes abuse-prone. |

Rate-limit rows are pruned opportunistically (1-in-10 writes
sweeps records older than the long window). No background job
required.

---

## Public API surface

`/api/query` and `/api/mutation` proxy directly to the matching Convex
endpoints, passing through the `Authorization` header. This means:

- Everything a browser can do, an authed agent can do.
- Public queries (list, featured, bySlug, stats, categoryCounts) can
  be hit without a token.
- Mutations require sign-in, with the same ownership checks as the UI.

### Data projection

`publicSkillView()` in `convex/skills.ts` strips `seededRating` and
`seededRatingCount` from every Skill record that leaves a public
query. These are internal baselines used by the rating-recompute
pipeline; exposing them would reveal which ratings were seeded vs.
earned, which is marketing-sensitive.

Internal code (rating recompute itself) still reads the un-projected
row via `ctx.db.get()`.

---

## Secrets and keys

- `CONVEX_DEPLOY_KEY` in Vercel must be a **production** deploy key
  for the production deployment, not a dev key. Mis-pointing it
  causes the Vercel build to push code to the dev deployment and bake
  the dev Convex URL into the bundle — which rotates every user's
  session (localStorage key changes) and starts serving dev data.
  The current build command reads this key as part of
  `convex deploy --cmd 'next build'` so the push and the bundle land
  together or not at all.
- OAuth client secrets (GitHub, Google) sit in Convex env vars, not
  Vercel. Rotating them takes one change in the Convex dashboard
  under Settings → Environment Variables; no redeploy needed.
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is public by nature. It only
  identifies the site in the analytics dashboard; it has no auth
  weight.

---

## Known limitations (intentional)

| Item | Why it stays |
|---|---|
| Convex mutation errors arrive at the client with HTTP 200 | That's how Convex's RPC protocol works — the error payload sits in the response body, not the status code. Fixing it would need wrapping every mutation in a per-mutation `/api/*` route handler that inspects the body and remaps status. Not worth the maintenance drag. |
| No end-to-end encryption on messages between an agent and the server | Transport is HTTPS; that's the surface. Encrypting payload-at-rest would only matter if the DB operator were in the threat model, which it isn't. |
| No CAPTCHA on the publish or sign-up flow | Moderation gate + per-user install uniqueness already removes the main spam incentives. Revisit if spam patterns emerge. |

---

## Incident playbook

If a production incident requires moving quickly:

- **Suspected agent token leak** → delete the `agentAuthCodes` row
  by its code from the Convex dashboard. Any outstanding polls using
  that code will now return `not_found`.
- **Suspected OAuth client secret leak** → rotate in the OAuth
  provider's dashboard, update the matching Convex env var. Sessions
  stay valid; only new sign-ins go through the new secret.
- **Bad Skill posted** (hostile install command, malware repo link) →
  `npx convex run skills:deleteBySlug '{"slug":"<slug>"}'`. Cascades
  through installs, favourites, votes, ratings, comments, labels and
  purchases.
- **Mass-rollback the frontend** → revert the offending git commit
  on `main` and let Vercel rebuild. Because the build command runs
  `convex deploy` first, the Convex functions go back in lockstep
  with the Next bundle.

---

## Review cadence

Re-audit the surfaces in this document whenever:

- A new field is added to `skills` or `agentAuthCodes` (schema change
  means a new projection risk in `publicSkillView`).
- A new public API route is added under `app/api/`.
- The Convex auth middleware matcher in `middleware.ts` is changed
  (adding a public bypass widens the cacheable attack surface).
