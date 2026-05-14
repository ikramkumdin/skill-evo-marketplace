# Skill Evo Marketplace — v2 setup

The code for v2 is fully written. To switch from mock data to real persistence + GitHub sign-in, do the two manual steps below. Total time: **~5 minutes**.

Until you complete step 1, the site keeps running with mock data — submissions, the install counter, and Sign in are placeholders. After step 1 it talks to a real Convex DB. After step 2, GitHub OAuth works.

## Step 1 — Provision Convex (≈ 2 min)

This creates a free Convex deployment, generates real `convex/_generated/` types, and gives you a deployment URL.

```bash
cd marketplace
npx convex dev
```

The CLI prompts:

1. **"Sign up or log in"** → choose "with GitHub" (or email)
2. **"What would you like to call your project?"** → `skill-evo-marketplace` (or any name)
3. **"Which team?"** → pick or create
4. The CLI starts a watcher and writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local` automatically.

Leave `npx convex dev` running in this terminal — it watches `convex/` and pushes changes.

## Step 2 — Set up GitHub OAuth (≈ 3 min)

### 2a. Find your Convex SITE URL

In your `.env.local` you'll see something like:
```
NEXT_PUBLIC_CONVEX_URL=https://abc-defg-123.convex.cloud
```
Your **SITE URL** is the same domain but with `.site` instead of `.cloud`:
```
https://abc-defg-123.convex.site
```

Add it to `.env.local`:
```
CONVEX_SITE_URL=https://abc-defg-123.convex.site
```

### 2b. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `Skill Evo Marketplace (dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://<your-convex-site-url>/api/auth/callback/github`
     (paste the SITE URL from 2a + `/api/auth/callback/github`)
4. Click **"Register application"**
5. On the next page click **"Generate a new client secret"**
6. Copy the **Client ID** and **Client secret**

### 2c. Add the credentials to `.env.local`

```
AUTH_GITHUB_ID=Iv1.your_client_id_here
AUTH_GITHUB_SECRET=your_client_secret_here
```

### 2d. Push the secrets to Convex

Convex Auth reads these env vars from your Convex deployment, not from Next.js. Push them:

```bash
npx convex env set AUTH_GITHUB_ID "Iv1.your_client_id_here"
npx convex env set AUTH_GITHUB_SECRET "your_client_secret_here"
npx convex env set SITE_URL "http://localhost:3000"
```

`npx convex dev` (still running from step 1) will pick up the changes automatically.

### 2e. Generate JWT signing keys for sessions

Convex Auth signs session tokens with RS256. It needs a `JWT_PRIVATE_KEY` and a public `JWKS`. Run this from the `marketplace/` folder:

```bash
node -e "
const { generateKeyPair, exportPKCS8, exportJWK } = require('jose');
const fs = require('fs');
(async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const pem = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, ' ');
  const jwk = await exportJWK(publicKey); jwk.use = 'sig';
  fs.writeFileSync('/tmp/jwt_pem', pem);
  fs.writeFileSync('/tmp/jwks', JSON.stringify({ keys: [jwk] }));
})();
"

npx convex env set -- JWT_PRIVATE_KEY "$(cat /tmp/jwt_pem)"
npx convex env set -- JWKS "$(cat /tmp/jwks)"
rm /tmp/jwt_pem /tmp/jwks
```

Note the `--` between `set` and the var name — the PEM starts with `-----` and the CLI would otherwise treat it as a flag. The `\n → ' '` substitution is what Convex Auth expects (PKCS8 with whitespace separators).

## Step 3 — Seed the mock Skills

In a fresh terminal:

```bash
npx convex run seed:seedSkills
```

You should see `{ inserted: 10, skipped: 0 }`. The browse page now shows the same 10 Skills, but they're real DB rows — installs increment, you can submit new ones, etc.

## Step 4 — Run the app

```bash
npm run dev
```

Open http://localhost:3000.

- Click **Sign in** (top right) → GitHub OAuth flow
- Click **Install** on a Skill detail page → counter increments live
- Click **Publish** → form submits to Convex; you're redirected to your new Skill's detail page

## Verify everything is wired

| Test | Expected |
|---|---|
| Hit `/` while signed out | Hero loads, Sign in button (no SOON badge), 10 featured Skills shown |
| Click Sign in | GitHub OAuth → redirects back signed in; button now reads "Sign out" |
| Visit `/skills/github-pr-reviewer`, click Install | Button briefly shows "Installing...", then "✓ Installed (12,481)" |
| Submit a Skill via `/publish` | New Skill appears in `/skills` browse instantly |
| `/publish` while signed out | Middleware redirects to `/?signin=required` |

## Reset everything

If you want a clean slate:

```bash
# Wipe all DB rows
npx convex dashboard         # opens Convex dashboard, delete tables there
# OR re-run the seeder (it's idempotent — won't re-insert existing slugs)
npx convex run seed:seedSkills
```

## Going to production

When you're ready to deploy to Vercel:

1. Run `npx convex deploy` to provision a production deployment
2. Set Vercel env vars: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`
3. Set Convex prod env vars: `npx convex env set AUTH_GITHUB_ID --prod ...` and `AUTH_GITHUB_SECRET`, `SITE_URL` (production hostname)
4. Update your GitHub OAuth App callback URL to use the **production** Convex SITE URL
5. Deploy: `vercel deploy`

## Troubleshooting

**"Cannot find module '@/convex/_generated/api'"**
You haven't run `npx convex dev` yet. The repo ships with stub types so TypeScript compiles before setup, but you need real types to query the DB. Run step 1.

**Sign in button still says "SOON"**
`NEXT_PUBLIC_CONVEX_URL` isn't set. Check `.env.local` exists and was written by `npx convex dev`.

**GitHub OAuth returns "redirect_uri mismatch"**
Your GitHub OAuth App's callback URL must exactly match `<CONVEX_SITE_URL>/api/auth/callback/github`. Note `.site` vs `.cloud` — easy to mix up.

**Install button works but count doesn't change after refresh**
Make sure `npx convex dev` is still running. It pushes mutation code to the deployment.
