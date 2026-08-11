# Dealer publishing — setup & runbook

`dealer-admin.html` publishes dealer changes with one click: **Save & Publish**
POSTs the working list to `/api/publish-dealers`, which verifies the signed-in
account is a verified `@luminabrands.com` address (Firebase ID token, checked
server-side via identitytoolkit `accounts:lookup`), validates every record,
rebuilds `dealers.js` server-side, and commits it to this repository's default
branch through the GitHub Contents API. Vercel deploys the commit
automatically — a dealer change is live in about a minute, and every publish is
one commit in git history (one line per changed dealer).

The old flow — download `dealers.js`, replace it in the repo by hand — still
exists as the **Download .js** button and is the fallback whenever the API is
down or unconfigured.

## One-time setup

1. **Create the GitHub token.** GitHub → Settings → Developer settings →
   Personal access tokens → **Fine-grained tokens** → Generate new token.
   - Resource owner: `LuminaBrands` (org tokens may need an admin's approval).
   - Repository access: **Only select repositories** → `aquafire-portal`.
   - Permissions: **Contents: Read and write**. Nothing else.
   - Set an expiry you can live with and put the renewal date in a calendar —
     when it lapses, publishes fail with "github auth failed" (see below).
2. **Set the Vercel env vars** (Project → Settings → Environment Variables,
   Production):
   - `GITHUB_DEALERS_TOKEN` (required) — the token from step 1. The name is
     deliberately not `GITHUB_TOKEN`, which Vercel's GitHub integration can
     inject with its own meaning.
   - `DEALER_PUBLISH_DAILY_CAP` (optional, default 50) — endpoint-wide daily
     ceiling, enforced through `api/_guard.js` once Upstash is configured
     (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, shared with the
     chat endpoints).
   - `DEALERS_REPO` / `DEALERS_BRANCH` (optional) — override the target repo
     (`LuminaBrands/aquafire-portal`) and branch (defaults to the repo's
     default branch, resolved live so a branch rename can't strand publishing).
3. Redeploy (env changes need one) and run the smoke test below.

## Smoke test (safe — commits nothing)

Firebase sign-in only works on `aquafire.app` (preview `*.vercel.app` domains
are not Firebase-authorized and sit behind Vercel SSO), so test on production:

1. Open `https://aquafire.app/dealer-admin.html`, sign in with a team account.
2. Without editing anything, run in the DevTools console:

   ```js
   firebase.auth().currentUser.getIdToken().then(t =>
     fetch('/api/publish-dealers', {
       method: 'POST',
       headers: { 'content-type': 'application/json' },
       body: JSON.stringify({ idToken: t, dealers: DEALERS, dryRun: true })
     }).then(r => r.json()).then(console.log));
   ```

   Expect `{ ok: true, dryRun: true, count: <n>, ... }`. Repeat without
   `dryRun: true` and expect `{ ok: true, noChange: true }` — the rebuilt file
   matches the repo copy, so nothing is committed. That exercises the full
   path: origin check, rate limit, token verification, validation, GitHub read.
3. First real publish: edit one dealer in the UI, Save & Publish, follow the
   "view commit" link — the diff should be a single line — and check the
   locator (`dealer-locator.html`) after the deploy finishes.

## When something goes wrong

| Symptom (admin UI) | Meaning | Fix |
|---|---|---|
| "publishing not configured" | `GITHUB_DEALERS_TOKEN` unset | Do the setup above; Download .js works meanwhile |
| "github auth failed" | Token expired, revoked, or lost repo access | Rotate the fine-grained token, update the env var, redeploy |
| "Someone else published changes since you loaded this page" | Another admin (or a direct commit) changed `dealers.js` after this tab loaded | Download .js as a backup of your work, reload, re-apply |
| "Session expired" | Firebase token could not be refreshed | Sign out and back in |
| "Rate limited" | >3 publishes/min from one IP, or the daily cap | Wait a minute; raise `DEALER_PUBLISH_DAILY_CAP` if it's ever genuinely hit |
| Commit exists but the site didn't update | Vercel deploy failed after the commit landed | The commit on the default branch is the source of truth — check the Vercel dashboard and redeploy; nothing needs re-publishing |
| "github unreachable" | GitHub API outage or timeout | Nothing (or possibly the commit) landed — check the repo's recent commits before retrying, or fall back to Download .js |

Publishing failures never lose work: the working list stays on the page and in
the browser's localStorage draft until a publish succeeds.

## Things to know

- **The server rebuilds `dealers.js` itself** from the posted JSON — it never
  commits client-built file text. `dealers.js` executes on a customer page, so
  the only thing a publish can inject is validated dealer field values.
- **`COLORS` is pinned in `api/publish-dealers.js`**, not taken from the
  client. If you hand-edit the `COLORS` block in `dealers.js`, update the
  constant in the function too, or the next publish will quietly revert it.
- **Deleting every dealer is deliberately not publishable** (the API requires
  at least one record). Emptying the list is a manual-commit operation.
- **Switching to PR-mode later** (publish opens a pull request instead of
  committing): replace the single Contents `PUT` in `api/publish-dealers.js`
  with create-branch + `PUT`-to-branch + open-PR calls, and grant the token
  **Pull requests: Read and write** as well. The staleness/validation logic
  is unchanged.
- This function is the repo's first server-side Firebase ID-token check — copy
  its `verifyTeamEmail()` pattern for future privileged endpoints (e.g. the
  `/api/award-points` idea in `docs/firestore-rules.md`).
