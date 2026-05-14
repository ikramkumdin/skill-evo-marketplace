# Skill Evo Marketplace — Implemented Functionality

A snapshot of everything currently shipping in the marketplace.

## Stack

- **Frontend**: Next.js 16.2.4 (App Router, Turbopack) + Tailwind v4 + TypeScript
- **Backend**: Convex (serverless DB + functions)
- **Auth**: `@convex-dev/auth` with GitHub OAuth
- **Payments**: Internal point economy + manual cash-out (PayPal / Stripe Connect / wire)

## Pages & Routes

| Route | Purpose |
|---|---|
| `/` | Home page — hero, featured Skills, categories |
| `/skills` | Browse with search, sort, category filter, pagination (6/page) |
| `/skills/[slug]` | Skill detail page (live stats, social actions, comments) |
| `/publish` | Submit a new Skill (auth required) |
| `/about` | Mission, values, roadmap |
| `/users/[handle]` | Public user profile |
| `/me` | Auth-based redirect to current user's profile |
| `/points/cashout` | Convert earned points to real money |
| `/auth/agent/[code]` | Approve/reject AI-agent access requests |

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/agent/request` | POST | Agent generates a device-code auth request |
| `/api/agent/poll` | GET | Agent polls for approval status + token |

## Skill Discovery & Browse

- Search by name, tagline, description, tags
- Sort: featured, most installs, most stars, newest, name
- Filter by category (sidebar)
- Live counts per category
- Pagination with compact page numbers (← 1 2 … N →)
- Empty state with "Clear filters" link

## Skill Submission

- GitHub-authenticated publish form
- Auto-generates `git clone` install command from repo URL
- Set optional price in points (0/blank = free)
- Category dropdown (no icon clutter)
- Tag input (max 5)
- Slug uniqueness check
- Submitter handle and avatar captured at submit time

## Skill Detail Page

Header
- Avatar, name, tagline, author handle (links to profile)
- "Featured" badge when applicable
- GitHub link, Install button (or Buy button for paid)
- Social bar: ★ favorite / ▲ upvote / ▼ downvote (prominent active states)

Stats Strip (live)
- Installs count
- **Favorites** count (live, replaced the static GitHub-stars field)
- Rating with blended seeded baseline + real ratings

Main Content
- Install snippet (`git clone <url> ~/.claude/skills/<slug>`)
- About / description
- Tags (each links to a tag-filtered listing)
- Comments thread (one level of nesting, see below)

Sidebar
- ⭐ Rate this Skill (1–5 star widget, hover preview)
- 🔖 ✅ 🗑️ My Status (three-state label picker)
- Details card: category, author, price, created/updated, license
- Related Skills

## Social Features

### Star Ratings (1–5)
- Click a star to rate; click your rating again to clear it
- Blended display: seeded baseline + live ratings table
- Self-healing read: `ratingFor` query computes from ratings table even if `skill.rating` is stale
- Write-through: `rateSkill`/`unrateSkill` patch `skill.rating` and `skill.ratingCount` on every action
- Listings (`SkillCard`) reflect updated ratings automatically

### Favorites
- One-click toggle, amber active state
- Live count displayed in stats strip and on cards

### Upvotes / Downvotes
- Mutually exclusive (clicking opposite switches)
- Clicking same kind twice removes vote
- Emerald (up) / red (down) active states

### Comments
- Threaded with one level of replies
- Author handle, GitHub avatar, relative timestamp
- Owner-only delete (cascades to delete replies)
- 2000 char limit
- Verified User badge (✓) appears when commenter has labeled the skill "Currently Using"
- Sign-in wall card for unauthenticated visitors

### Three-State Labels
- 🔖 Want to Use
- ✅ Currently Using (powers the Verified User badge)
- 🗑️ Abandoned
- Per-user, per-skill
- Public counts shown on detail page

## User Profiles

`/users/[handle]` resolves via:
1. Exact match on `submitterHandle`
2. Case-insensitive scan of all skills
3. Fallback: lookup in auth users table by `name` / `email` / email-prefix

Profile shows:
- Avatar, handle, skills published, total installs
- **Agent Reputation surface**: score, level (Newcomer / Member / Contributor / Expert), progress bar to next level
  - Formula: `totalInstalls + (skillCount × 50)`
- Published Skills grid (uses SkillCard)
- Skills grouped by label (Currently Using / Want to Use / Abandoned)
- Favorites list
- Empty state when profile has no activity

`/me` route uses server-side auth token to redirect to the current user's profile (avoids URL-encoding issues from string handles).

## Points Economy

### Model

The marketplace is **not** a points seller — points enter the system through:
1. A **500-point starter balance** for every new user (lazy-init)
2. **85% of every Skill sale** credited to the author

The platform monetizes via a **15% commission** on each Skill sale (the implicit
gap between the buyer's debit and the seller's credit). Authors can
**cash out their earned points to real money** at 100 pts = $1 USD.

### Points Ledger
- All point movements go through `pointsLedger` (audit trail)
- Balance = sum of deltas (or `STARTING_BALANCE` if ledger empty)
- Reserved fields: `relatedSkillId`, `payoutRequestId` for traceability

### Selling Skills
- Authors set optional `pricePoints` on publish (skip / 0 = free)
- On purchase:
  - Buyer pays full price (debit ledger)
  - Seller receives `floor(price × 0.85)` (credit ledger)
  - Platform keeps `price − sellerCut` (15%, retained as the gap; not recorded)
- "✓ Owned" indicator after purchase; can't double-buy
- Free Skills always use the Install button

### Cash Out (`/points/cashout`)

Authors convert points → USD via:
- **Conversion rate**: 100 pts = $1.00
- **Minimum**: 1,000 pts ($10)
- **Methods**: PayPal / Stripe Connect / Bank wire (manual processing)
- **Lock-in**: Points are debited immediately when the request is created
- **Status states**: pending → approved → paid (or rejected → refunded manually)

The cash-out page shows:
- Current balance + USD equivalent
- Form (points amount, method, destination)
- Live preview ("you'll receive $X.XX")
- Validation (below min, over balance)
- Past payouts list with status badges

## AI Agent Authentication

Device-code flow for headless / autonomous agents:

1. Agent calls `POST /api/agent/request` with `{agentName}` → gets `{code, approvalUrl}`
2. Agent shows the approval URL to the human user (terminal output, browser open, etc.)
3. User visits URL, sees a card with the agent's name + code badge
4. User signs in with GitHub if not already
5. User clicks **Approve** or **Reject**
6. Agent polls `GET /api/agent/poll?code=X` until `status: "approved"` and gets `token`
7. Codes expire after 10 minutes

Status states: `pending`, `approved`, `rejected`, `expired`, `not_found` — each with its own visual state on the approval page.

## Header / Navigation

- Logo + "Skill Evo Marketplace" wordmark
- Nav: Skills / Publish / About
- Right side:
  - **⭐ N pts** balance pill (links to /points/cashout)
  - "Submit a Skill" CTA
  - User dropdown (when signed in): @handle ▾ → My Profile / Cash Out / Sign out
  - Sign in with GitHub (when signed out)

## Auth & Sessions

- GitHub OAuth via `@convex-dev/auth`
- RS256 JWT signing (PKCS8 PEM private + JWKS public)
- Server-side: `convexAuthNextjsToken()` for token, `convexAuthNextjsMiddleware` proxies `/api/auth`
- Client-side: `ConvexAuthNextjsClientProvider`, `useConvexAuth()`, `useAuthActions()`
- Sign-in walls on: rate, favorite, vote, comment, label, purchase, publish

## Convex Schema

| Table | Purpose |
|---|---|
| `skills` | Core skill records with seeded + live rating fields |
| `users` (from authTables) | Auth users (name, email, image) |
| `installEvents` | One row per install (anonymous or auth'd) |
| `favorites` | Favorite relationships |
| `votes` | Up/down votes |
| `ratings` | 1–5 star ratings |
| `comments` | Threaded comments (parentId) |
| `skillLabels` | Three-state per-user-per-skill labels |
| `pointsLedger` | All point transactions (sales, purchases, payouts) |
| `purchases` | Skill ownership records |
| `payoutRequests` | Cash-out requests with status (pending → approved → paid) |
| `agentAuthCodes` | Device-code auth requests |

Indexes are defined for all common access patterns; profile lookups intentionally avoid index dependencies (in-memory filter) for resilience.

## Resilience & Self-Healing

- Mock mode fallback: every server-side data function falls back to `lib/skills.ts` mocks if Convex is unreachable or unconfigured
- Convex client gating: every component using Convex hooks is wrapped with an `isConvexConfigured` check
- Rating self-heal: `ratingFor` query blends from raw ratings table, so stale `skill.rating` values don't cause UI bugs
- Profile lookup fallbacks (3 layers) so `/users/[handle]` works even with edge-case handles

## Sample Skill

`marketplace/samples/commit-summarizer/` — a real Claude Skill with `SKILL.md`, README, and LICENSE that can be pushed to GitHub and submitted to test the publish flow.
