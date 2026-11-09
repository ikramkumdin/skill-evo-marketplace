# Deployment

How a production build reaches users, what each environment variable
controls, and how to debug the common failure modes.

For the first-ever setup of a new Vercel project, see
`deploy-vercel.md`. This document covers the steady-state build
pipeline.

---

## The pipeline

Every push to `main` goes through the same sequence:

```
GitHub main        Vercel build container        Convex prod
──────────         ───────────────────────       ─────────────────────
push to main  ──►  install deps
                   ├─ convex deploy  ─────────►  uploads convex/ code
                   │                             runs schema diff
                   │                             deploys functions
                   │
                   └─ next build                 ◄── NEXT_PUBLIC_CONVEX_URL
                      (bundle has the            injected from the live
                       deployed URL baked in)    prod URL at this point
                                                 
                   ▼
                   static assets + edge functions
                   ──► Vercel edge
```

The two commands happen in one invocation because `package.json`
sets:

```json
"build": "convex deploy --cmd 'next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL"
```

If `convex deploy` fails (schema conflict, auth error, missing
functions), `next build` never runs and the Vercel deploy fails as a
whole. There's no "frontend updated, backend didn't" window.

### Why `--cmd-url-env-var-name`

Convex supports per-environment URLs (dev vs. prod). The flag tells
Convex to set `NEXT_PUBLIC_CONVEX_URL` in the `next build` process to
the URL of whichever deployment just received the push. That way the
compiled client JS points at the deployment it was built against.

Without the flag, the bundle would rely on whatever
`NEXT_PUBLIC_CONVEX_URL` happens to be set in Vercel's env vars —
usually fine, but a single wrong row in Vercel can silently point
every user at the wrong Convex, which has been known to break prod
in surprising ways.

---

## Required environment variables

Set on the Vercel project (Settings → Environment Variables) unless
noted.

| Name | Scope | Purpose |
|---|---|---|
| `CONVEX_DEPLOY_KEY` | Production | The `prod:…\|…` deploy key for the production Convex deployment. Generated in the Convex dashboard under the **Production** deployment → Settings → Deploy Keys. **Must start with `prod:`**; a `dev:` key would push to dev and rotate every user's session. |
| `NEXT_PUBLIC_CONVEX_URL` | Production, Preview, Development | Fallback URL used if the build-time injection ever fails. Harmless to set; the `--cmd-url-env-var-name` override wins when it fires. |
| `CONVEX_SITE_URL` | Production, Preview, Development | Base URL for the Convex HTTP router (used by `/api/agent/request` proxy). Format: `https://<deployment>.convex.site`. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Production | Enables Umami analytics in the compiled bundle. Omit to disable analytics. |
| `SITE_URL` | Production | Used by `app/robots.ts`, `app/sitemap.ts` and the agent-approval URL builder. Format: `https://evoskill.market`. |
| `NEXT_PUBLIC_SOCIAL_TWITTER`, `_INSTAGRAM`, `_FACEBOOK` | Any | Optional social URLs in the footer. Empty = icon hidden (no `href="#"` leak). |

OAuth client secrets for GitHub and Google live on the **Convex**
side (dashboard → Settings → Environment Variables), not Vercel.
Rotating them doesn't need a Vercel redeploy.

---

## Preview deploys

Preview branches don't have `CONVEX_DEPLOY_KEY` by design. A Preview
build will attempt `convex deploy`, fail, and the Preview will fail.
This is intentional — we don't want every open PR silently pushing
code to the production Convex deployment.

Two ways to get working Previews when needed:

1. **Override the Vercel Preview Build Command** to
   `npm run build:next-only`. The `build:next-only` script is just
   `next build` and skips the Convex push, so the Preview bundle
   points at the current prod Convex (set via `NEXT_PUBLIC_CONVEX_URL`
   in Vercel's Preview scope).
2. **Set up a Convex preview-deployment key.** The Convex dashboard
   can generate preview-scoped keys. Set that as a separate Vercel
   env var scoped to Preview only. This requires a bit more
   plumbing and is only worth it if Preview deploys are a regular
   part of the workflow.

---

## Debugging a failed build

### `convex deploy: Not logged in` or `Could not resolve deploy key`

The `CONVEX_DEPLOY_KEY` env var is missing, malformed, or pointing at
the wrong deployment.

- Re-check the value in Vercel. The key's prefix is the deployment
  it binds to. For prod it should be `prod:determined-finch-765|…`.
  A `dev:…` key is the common mistake; it will push to dev and bake
  the dev URL into the Next bundle.
- If you regenerated the key recently, make sure the one in Vercel
  matches. Convex deploy keys can't be viewed again after creation
  — if in doubt, delete and generate a new one.

### `Schema validation failed`

A `v.*` type on a new or renamed field doesn't match data already in
the database.

- `v.optional(v.string())` is almost always safe to add.
- Dropping or re-typing an existing required field needs a migration
  — usually a one-off `internalMutation` that rewrites every row,
  then the schema change, then a cleanup pass.
- In a pinch, `.filter(…).collect()` from the Convex dashboard
  "Data" view is the fastest way to inspect the rows that fail
  validation.

### Build succeeds but the site serves demo data

Symptom: 11 Skills, all with `github.com/example/…`, authored by
`orion` / `nova` / `atlas` / etc. This is the dev deployment's seed
data. The build pushed Convex to dev and set the dev URL as
`NEXT_PUBLIC_CONVEX_URL` in the bundle.

Fix: the `CONVEX_DEPLOY_KEY` in Vercel is a dev key. Replace it with
a prod key and redeploy with build cache cleared. The live prod
data is still intact in the prod Convex deployment.

### `next build` failures after a working `convex deploy`

Normal Next.js troubleshooting applies — TypeScript errors, missing
env vars, etc. The `convex deploy` step having already succeeded
means the Convex side has the new functions and the build is now
blocked purely on the Next bundle.

If you need to roll back the Convex side too, redeploy the previous
commit — the paired `convex deploy` will undo the push.

---

## Rolling back

Because the build is atomic, rolling back is atomic too: revert the
offending commit on `main`, push. Vercel will kick off a new build
that first re-pushes the older Convex functions, then builds the
older Next bundle. Both land together.

For a hotfix without a revert, cherry-pick the fix on top of `main`
and push the result — same pipeline, same atomicity guarantee.

---

## Observability

- **Build logs** — Vercel → Deployments → the row → open the Build
  logs tab. Look for the `convex deploy` output first; schema diff
  and function list print there.
- **Runtime logs** — Vercel → Logs tab, and the Convex dashboard →
  Logs. The Convex side has per-function timings and the error
  stacks; the Vercel side has HTTP status + latency.
- **Analytics** — Umami dashboard. Pageviews and custom events show
  up within seconds of a real browser load.
