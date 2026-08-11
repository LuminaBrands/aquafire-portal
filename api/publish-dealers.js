/* ──────────────────────────────────────────────────────────────────────────
   /api/publish-dealers — one-click dealer publishing for dealer-admin.html.

   The admin page POSTs { idToken, dealers, baseHash, summary, dryRun }; we
   verify the Firebase ID token belongs to a verified @luminabrands.com
   account, validate every dealer record, rebuild dealers.js server-side, and
   commit it to the repository's default branch with the GitHub Contents API.
   Vercel redeploys on the commit, so the change is live in about a minute —
   no more downloading the file and committing it by hand.

   The server rebuilds the file itself rather than accepting client-built
   text: dealers.js executes on customer pages, so an authenticated-but-
   compromised admin browser must only ever be able to inject *validated
   dealer field values*, never arbitrary file content. For the same reason
   COLORS is pinned here as a constant — hand-editing COLORS in dealers.js
   means updating the copy below too, or the next publish reverts it.

   Setup: create a GitHub fine-grained personal access token scoped to ONLY
   this repository with Contents: Read and write, and set it in the Vercel
   project env as GITHUB_DEALERS_TOKEN (distinct name on purpose — Vercel's
   GitHub integration can inject its own GITHUB_TOKEN). Optional env:
   DEALER_PUBLISH_DAILY_CAP (default 50), DEALERS_REPO, DEALERS_BRANCH
   (defaults to the repository's default branch, resolved via the API).
   Until the token is configured this returns 503 and the admin page's
   "Download .js" fallback still works. Full runbook: docs/dealer-admin.md.

   This is the repo's first endpoint that verifies a Firebase ID token
   server-side (identitytoolkit accounts:lookup with the public web API key —
   the key only identifies the project; Google validates the token). Copy
   this pattern for future privileged endpoints.

   Zero dependencies on purpose (repo convention): global fetch + node:crypto.
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

const crypto = require('node:crypto');

// CORS/origin enforcement + rate limiting live in api/_guard.js (shared).
const { cors, throttle } = require('./_guard');

// Same public web API key the browser pages and api/chat.js use — it scopes
// the lookup to the aquafire-portal project, so tokens minted by any other
// Firebase project are rejected automatically.
const FS_KEY = 'AIzaSyAAeoOt4NJxh_ITaWNMBV-Ed-mM5Ac5a7Q';

// Must match the gate in dealer-admin.html and the Firestore isTeam() rule.
const TEAM_EMAIL = /@luminabrands\.com$/i;

const GH_REPO = process.env.DEALERS_REPO || 'LuminaBrands/aquafire-portal';
const GH_PATH = 'dealers.js';

// Endpoint-wide daily ceiling — publishes are rare, so keep this tight.
const DAILY_CAP = Number(process.env.DEALER_PUBLISH_DAILY_CAP || 50);

// Pinned server-side (see header). Verified against dealers.js — keep in step.
const COLORS = {
  'Dealer': '#c0392b',
  'Regional Dealer': '#e8a838',
  'Sales Rep': '#4da6e8',
  'Online Dealer': '#27ae60',
  'Temporary Dealer': '#878c99'
};
const TYPES = Object.keys(COLORS);
const COUNTRIES = ['US', 'CA'];

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

/* ── Auth ────────────────────────────────────────────────────────────────── */
// Returns the verified team email, or null for any token that isn't a live,
// verified, enabled @luminabrands.com account. Throws only on network failure.
async function verifyTeamEmail(idToken) {
  const r = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FS_KEY,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(5000)
    }
  );
  if (!r.ok) return null; // invalid/expired token → 400 from Google
  const user = (((await r.json()).users) || [])[0];
  if (!user || !user.email || !user.emailVerified || user.disabled) return null;
  return TEAM_EMAIL.test(user.email) ? user.email : null;
}

/* ── Validation ──────────────────────────────────────────────────────────── */
const DEALER_KEYS = ['name', 'type', 'address', 'lat', 'lng', 'phone', 'email', 'website', 'appt', 'country'];
const CTRL_CHARS = /[\u0000-\u001f\u007f]/;

// A strict superset of saveDealer()'s checks in dealer-admin.html. Returns
// { ok: [...] } with records rebuilt key-by-key in canonical order, or
// { error } naming the record and field so the admin can find it.
function validateDealers(input) {
  if (!Array.isArray(input)) return { error: 'dealers must be an array' };
  // A floor of 1 makes wiping the list a deliberate manual-commit operation.
  if (input.length < 1 || input.length > 500) {
    return { error: 'dealers must contain between 1 and 500 records' };
  }

  const out = [];
  for (let i = 0; i < input.length; i++) {
    const d = input[i];
    const label = 'record ' + (i + 1) +
      (d && typeof d.name === 'string' && d.name ? ' ("' + d.name.slice(0, 40) + '")' : '');
    const bad = (msg) => ({ error: label + ': ' + msg });

    if (!d || typeof d !== 'object' || Array.isArray(d)) return bad('not an object');
    const unknown = Object.keys(d).find((k) => !DEALER_KEYS.includes(k));
    if (unknown) return bad('unknown field "' + String(unknown).slice(0, 40) + '"');

    const str = (v) => (typeof v === 'string' ? v.trim() : null);
    const name = str(d.name);
    const address = d.address == null ? '' : str(d.address);
    const phone = str(d.phone);
    const email = d.email == null ? '' : str(d.email);
    const website = d.website == null ? '' : str(d.website);

    if (!name || name.length > 120) return bad('name is required (max 120 chars)');
    if (!phone || phone.length > 40) return bad('phone is required (max 40 chars)');
    if (address === null || address.length > 200) return bad('address must be a string (max 200 chars)');
    if (!TYPES.includes(d.type)) return bad('type must be one of: ' + TYPES.join(', '));
    if (!COUNTRIES.includes(d.country)) return bad('country must be US or CA');
    if (d.appt !== true && d.appt !== false) return bad('appt must be true or false');

    const lat = d.lat == null ? null : d.lat;
    const lng = d.lng == null ? null : d.lng;
    if ((lat === null) !== (lng === null)) return bad('lat and lng must be set together');
    if (lat !== null) {
      if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < 24 || lat > 72) {
        return bad('lat must be a number between 24 and 72');
      }
      if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -170 || lng > -50) {
        return bad('lng must be a number between -170 and -50');
      }
    }

    if (email === null || email.length > 120 ||
        (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return bad('email must be empty or a valid address (max 120 chars)');
    }
    if (website === null || website.length > 200 ||
        (website && !/^https?:\/\/.+/.test(website))) {
      return bad('website must be empty or start with http:// or https:// (max 200 chars)');
    }

    // dealers.js executes on a customer page — never let control characters
    // (or anything the emitter doesn't escape) through, belt and braces.
    for (const [field, value] of [['name', name], ['address', address], ['phone', phone], ['email', email], ['website', website]]) {
      if (CTRL_CHARS.test(value)) return bad(field + ' contains control characters');
    }

    out.push({
      name: name, type: d.type, address: address, lat: lat, lng: lng,
      phone: phone, email: email, website: website, appt: d.appt, country: d.country
    });
  }
  return { ok: out };
}

/* ── Emitter ─────────────────────────────────────────────────────────────────
   Server-side port of downloadDealersJS() in dealer-admin.html — the output
   format must stay byte-identical (one dealer per line, fixed key order) so
   every publish diffs as one line per changed dealer. */
function jsStr(s) {
  // JSON.stringify covers \ and " like the client escaper, plus control
  // chars; the extra escapes keep the emitted file safe as inline-able JS
  // even though validation already bans anything that would need them.
  return JSON.stringify(String(s == null ? '' : s))
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\u003c');
}

function renderDealersJS(dealers) {
  const lines = [];
  lines.push('// ─── Dealer Type Colors ───');
  lines.push('var COLORS = {');
  const colorKeys = Object.keys(COLORS);
  colorKeys.forEach((key, i) => {
    lines.push("  '" + key + "': '" + COLORS[key] + "'" + (i < colorKeys.length - 1 ? ',' : ''));
  });
  lines.push('};');
  lines.push('');
  lines.push('// ─── Dealer Database ───');
  lines.push('var DEALERS = [');
  dealers.forEach((d, i) => {
    const parts = [
      'name:' + jsStr(d.name),
      'type:' + jsStr(d.type),
      'address:' + jsStr(d.address),
      'lat:' + (d.lat != null ? String(d.lat) : 'null'),
      'lng:' + (d.lng != null ? String(d.lng) : 'null'),
      'phone:' + jsStr(d.phone),
      'email:' + jsStr(d.email || ''),
      'website:' + jsStr(d.website || ''),
      'appt:' + String(d.appt),
      'country:' + jsStr(d.country)
    ];
    lines.push('  { ' + parts.join(', ') + ' }' + (i < dealers.length - 1 ? ',' : ''));
  });
  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

/* ── GitHub ──────────────────────────────────────────────────────────────── */
function gh(method, path, body) {
  return fetch('https://api.github.com' + path, {
    method: method,
    headers: {
      authorization: 'Bearer ' + process.env.GITHUB_DEALERS_TOKEN,
      accept: 'application/vnd.github+json',
      'user-agent': 'aquafire-portal-dealer-publish',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000)
  });
}

// The deploy branch is whatever the repo calls its default branch — resolve
// it once per instance rather than hardcoding a name that can be renamed.
let branchCache = null;
async function targetBranch() {
  if (process.env.DEALERS_BRANCH) return process.env.DEALERS_BRANCH;
  if (branchCache) return branchCache;
  const r = await gh('GET', '/repos/' + GH_REPO);
  if (!r.ok) throw new Error('github ' + r.status);
  branchCache = (await r.json()).default_branch;
  return branchCache;
}

function githubErrorResponse(res, status) {
  if (status === 401 || status === 403) {
    return res.status(502).json({
      error: 'github auth failed — GITHUB_DEALERS_TOKEN may be expired or revoked (see docs/dealer-admin.md)'
    });
  }
  return res.status(502).json({ error: 'github ' + status });
}

/* ── Handler ────────────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  if (!cors(req, res)) return;

  if (!process.env.GITHUB_DEALERS_TOKEN) {
    return res.status(503).json({
      error: 'publishing not configured — set GITHUB_DEALERS_TOKEN in the Vercel project settings (see docs/dealer-admin.md)'
    });
  }

  // Before any Google/GitHub call, so the endpoint can't be used to burn
  // upstream quota. Publishes are human-paced; 3/min is generous.
  if (await throttle(req, 'publish', 3, DAILY_CAP)) {
    return res.status(429).json({ error: 'slow down' });
  }

  const body = req.body || {};
  const idToken = typeof body.idToken === 'string' && body.idToken.length <= 4096
    ? body.idToken : '';
  if (!idToken || !Array.isArray(body.dealers)) {
    return res.status(400).json({ error: 'bad request' });
  }

  let email;
  try {
    email = await verifyTeamEmail(idToken);
  } catch (e) {
    return res.status(502).json({ error: 'auth check unreachable — try again' });
  }
  if (!email) return res.status(401).json({ error: 'auth' });

  const valid = validateDealers(body.dealers);
  if (valid.error) return res.status(400).json({ error: valid.error });

  let branch, current, currentText;
  try {
    branch = await targetBranch();
    const getR = await gh('GET',
      '/repos/' + GH_REPO + '/contents/' + GH_PATH + '?ref=' + encodeURIComponent(branch));
    if (!getR.ok) return githubErrorResponse(res, getR.status);
    current = await getR.json();
    currentText = Buffer.from(current.content, 'base64').toString('utf8');
  } catch (e) {
    return res.status(502).json({ error: 'github unreachable — nothing was published' });
  }

  // Two-admins protection: the client sends the SHA-256 of the dealers.js it
  // loaded; if the repo has moved on since, make it reload rather than
  // silently overwriting someone else's publish.
  if (typeof body.baseHash === 'string' && body.baseHash &&
      body.baseHash !== sha256(currentText)) {
    return res.status(409).json({ error: 'stale' });
  }

  const newText = renderDealersJS(valid.ok);
  if (newText === currentText) {
    return res.status(200).json({ ok: true, noChange: true });
  }
  if (body.dryRun === true) {
    return res.status(200).json({
      ok: true, dryRun: true, count: valid.ok.length,
      bytes: newText.length, contentHash: sha256(newText)
    });
  }

  const summary = typeof body.summary === 'string'
    ? body.summary.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 120)
    : '';
  const message = 'dealers.js: ' + (summary || valid.ok.length + ' dealers') +
    ' — published by ' + email + ' via dealer-admin';

  const putBody = {
    message: message,
    content: Buffer.from(newText, 'utf8').toString('base64'),
    sha: current.sha,
    branch: branch
  };
  const contentsPath = '/repos/' + GH_REPO + '/contents/' + GH_PATH;

  let putR;
  try {
    putR = await gh('PUT', contentsPath, putBody);
    if (putR.status === 409) {
      // sha race: something committed between our GET and PUT. Re-read once;
      // if dealers.js itself is unchanged the race was benign (another file's
      // commit moved the branch) — retry with the fresh sha. If dealers.js
      // moved, it's a real conflict: stale.
      const againR = await gh('GET', contentsPath + '?ref=' + encodeURIComponent(branch));
      if (!againR.ok) return githubErrorResponse(res, againR.status);
      const again = await againR.json();
      const againText = Buffer.from(again.content, 'base64').toString('utf8');
      if (againText !== currentText) return res.status(409).json({ error: 'stale' });
      putR = await gh('PUT', contentsPath, { ...putBody, sha: again.sha });
    }
  } catch (e) {
    return res.status(502).json({ error: 'github unreachable — publish may not have landed, check the repo before retrying' });
  }
  if (!putR.ok) return githubErrorResponse(res, putR.status);

  const result = await putR.json();
  return res.status(200).json({
    ok: true,
    commit: {
      sha: result.commit && result.commit.sha,
      url: result.commit && result.commit.html_url
    },
    count: valid.ok.length,
    contentHash: sha256(newText)
  });
};

// For offline tests (tools/, node -e) — harmless on Vercel.
module.exports._internal = { validateDealers, renderDealersJS };
