# Deploy Skill Evo Marketplace to Vercel

Step-by-step guide. You're deploying the **`marketplace/`** folder as its own
GitHub repo (it already has its own `.git`).

Four moving pieces:
1. **GitHub repo** — Vercel deploys from here
2. **Convex production deployment** — your DB + functions
3. **GitHub OAuth App** (production) — sign-in
4. **Vercel project** — the Next.js host

---

## Step 1 — Push `marketplace/` to GitHub

From `marketplace/`:

```bash
cd marketplace
git status         # see what's modified/untracked
git add .
git commit -m "Production-ready Skill Evo Marketplace"
```

Create a new empty repo on GitHub (https://github.com/new) — name it
`skill-evo-marketplace`. **Do not** initialize with a README.

Connect and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/skill-evo-marketplace.git
git branch -M main
git push -u origin main
```

Confirm on GitHub that `.env.local` is **not** in the repo (it's gitignored
via `.env*`). Only `.env.example` should be visible.

---

## Step 2 — Deploy Convex to production

Your current Convex deployment is **dev** (`dev:fearless-rooster-482`). You need
a **prod** one for the live site.

From `marketplace/`:

```bash
npx convex deploy
```

This pushes your schema + functions to a new `prod:` deployment. Save these
three values from the output — you'll need them in Vercel:

- `CONVEX_DEPLOYMENT` (looks like `prod:something-name`)
- `NEXT_PUBLIC_CONVEX_URL` (https://something.convex.cloud)
- `CONVEX_SITE_URL` (https://something.convex.site)

### Generate prod auth keys for Convex

`@convex-dev/auth` needs an RS256 keypair on the prod deployment:

```bash
# Generate a fresh keypair
node -e "
import('jose').then(async ({generateKeyPair, exportPKCS8, exportJWK}) => {
  const {privateKey, publicKey} = await generateKeyPair('RS256');
  const pkcs8 = await exportPKCS8(privateKey);
  const jwk = await exportJWK(publicKey);
  jwk.use = 'sig';
  require('fs').writeFileSync('/tmp/pk.pem', pkcs8);
  require('fs').writeFileSync('/tmp/jwks.json', JSON.stringify({keys:[jwk]}));
  console.log('Wrote /tmp/pk.pem and /tmp/jwks.json');
});
"

# Push to prod Convex
npx convex env set --prod -- JWT_PRIVATE_KEY "$(cat /tmp/pk.pem)"
npx convex env set --prod -- JWKS "$(cat /tmp/jwks.json)"

# Clean up
rm /tmp/pk.pem /tmp/jwks.json
```

The `--` separator is critical — the PEM starts with `-----BEGIN`, which the
CLI parser would otherwise treat as flags.

You'll set `SITE_URL`, `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET` on Convex
**after** steps 3 and 4 once you have those values.

---

## Step 3 — Create a production GitHub OAuth App

Your dev OAuth app points to localhost. Create a separate one for production.

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `Skill Evo Marketplace`
   - **Homepage URL**: `https://your-vercel-url.vercel.app` (you'll know it after step 4 — leave a placeholder for now)
   - **Authorization callback URL**: `https://YOUR_CONVEX_SITE_URL/api/auth/callback/github`
     (use the `CONVEX_SITE_URL` from step 2 — e.g. `https://something.convex.site/api/auth/callback/github`)
4. Click **Register application**
5. **Copy Client ID** → this is `AUTH_GITHUB_ID`
6. Click **Generate a new client secret** → **copy immediately** → this is `AUTH_GITHUB_SECRET`

---

## Step 4 — Deploy to Vercel

1. Go to https://vercel.com/new
2. **Import Git Repository** → select your `skill-evo-marketplace` repo
3. **Framework Preset**: Next.js (auto-detected)
4. **Root Directory**: leave as `./` (the repo root IS the marketplace)
5. **Environment Variables** — add these:

   | Name | Value |
   |---|---|
   | `CONVEX_DEPLOYMENT` | from step 2 (prod:...) |
   | `NEXT_PUBLIC_CONVEX_URL` | from step 2 (.convex.cloud) |
   | `CONVEX_SITE_URL` | from step 2 (.convex.site) |
   | `AUTH_GITHUB_ID` | from step 3 |
   | `AUTH_GITHUB_SECRET` | from step 3 |
   | `SITE_URL` | leave blank or placeholder — you'll fill after first deploy |

6. Click **Deploy**

First deploy takes ~2–3 minutes. Vercel will show you the live URL when done.

---

## Step 5 — Close the loop

After your first deploy succeeds:

1. **Copy your Vercel URL** (e.g. `https://skill-evo-marketplace-abc123.vercel.app`)

2. **Update Convex `SITE_URL`**:
   ```bash
   npx convex env set --prod SITE_URL https://your-vercel-url.vercel.app
   npx convex env set --prod AUTH_GITHUB_ID <your value>
   npx convex env set --prod AUTH_GITHUB_SECRET <your value>
   ```

3. **Update Vercel `SITE_URL`** env var: Vercel dashboard → project → Settings → Environment Variables → edit `SITE_URL`

4. **Update GitHub OAuth App Homepage URL** to your Vercel URL
   (https://github.com/settings/developers → your app → Edit)

5. **Redeploy on Vercel** so the new env vars take effect:
   Deployments tab → click ⋯ on latest → **Redeploy**

---

## Step 6 — Verify

Visit your Vercel URL and check:

- [ ] Home page loads with featured Skills
- [ ] `/skills` shows skills with pagination
- [ ] Sign in with GitHub → redirects to GitHub → back to site, signed in
- [ ] `/me` redirects to your profile page
- [ ] You can rate / favorite / comment a Skill
- [ ] `/publish` form lets you submit a new Skill
- [ ] `/points/cashout` page renders the form

If sign-in fails, double-check:
- GitHub OAuth callback URL exactly matches `${CONVEX_SITE_URL}/api/auth/callback/github`
- `SITE_URL` on Convex matches your Vercel URL (no trailing slash)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` are set on **both** Vercel AND Convex

---

## Custom domain (optional)

Vercel → project → Settings → Domains → Add your domain.

When you switch to a custom domain, also update:
- Convex `SITE_URL` env var → your custom domain
- GitHub OAuth App **Homepage URL** → your custom domain
- Redeploy on Vercel

---

## Future deploys

- Push to `main` → Vercel auto-deploys
- Schema or Convex function changes → run `npx convex deploy` from `marketplace/`
  (Vercel doesn't deploy Convex — they're separate)

---

## Notes

- **Seeded skills**: the prod Convex won't have the 10 mock skills until you run the seed. From `marketplace/`:
  ```bash
  npx convex run --prod seed:seedSkills
  ```

- **Payouts** are still manual — open the Convex prod dashboard to mark `payoutRequests` as paid.

- **Stripe Connect / PayPal Payouts API** are listed as future work in `improvement.md`.
