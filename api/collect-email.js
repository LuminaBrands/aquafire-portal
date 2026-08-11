/* ──────────────────────────────────────────────────────────────────────────
   /api/collect-email — store a chat follow-up email in Mailchimp (Vercel
   function).

   The widget POSTs { email, convo } here when a customer fills in the
   follow-up form. The address is upserted into the Mailchimp audience and
   tagged so the team can segment chat leads. The Slack 'callback' alert and
   the 'contact_left' telemetry event fire independently of this — Mailchimp
   is the durable store, not the notification path.

   Consent note: the customer typed this address to get a support follow-up.
   The upsert uses status_if_new, so an existing member's subscription status
   is never changed — someone who unsubscribed from marketing stays
   unsubscribed; the tag still lands so support can find them. Change the
   default for brand-new members with MAILCHIMP_STATUS if 'subscribed' is too
   strong for your compliance posture ('pending' double-opts them in).

   Setup: Mailchimp -> profile -> Extras -> API keys -> create a key (its
   suffix names the data-center, e.g. "-us21") -> save it as
   MAILCHIMP_API_KEY in the Vercel env, plus MAILCHIMP_LIST_ID (Audience ->
   Settings -> Audience name and defaults -> Audience ID). Optional:
   MAILCHIMP_TAG (default "chat-follow-up"), MAILCHIMP_STATUS (default
   "subscribed"), EMAIL_DAILY_CAP (default 200). Until the key and list are
   set this returns 503 and the widget carries on — the address still
   reaches Slack and Chat Insights.

   Zero dependencies on purpose (repo convention: no package.json / no build).
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

const crypto = require('crypto');

// CORS/origin enforcement + rate limiting live in api/_guard.js (shared).
const { cors, throttle } = require('./_guard');

const DAILY_CAP = Number(process.env.EMAIL_DAILY_CAP || 200);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/* Same "say why once" pattern as notify-slack: an unset key is silent by
   design, so the runtime log should explain the 503s. */
let warnedUnset = false;
function warnUnset() {
  if (warnedUnset) return;
  warnedUnset = true;
  console.warn('[collect-email] MAILCHIMP_API_KEY / MAILCHIMP_LIST_ID are not ' +
    'both set in this deployment\'s environment, so follow-up emails are not ' +
    'being stored in Mailchimp (they still reach Slack and chatEvents). ' +
    'Remember env values bind at build time — redeploy after setting them.');
}

module.exports = async (req, res) => {
  if (!cors(req, res)) return;

  const key = process.env.MAILCHIMP_API_KEY || '';
  const list = process.env.MAILCHIMP_LIST_ID || '';
  // The key's suffix names the data-center the API lives on (…-us21).
  const dc = key.indexOf('-') !== -1 ? key.split('-').pop() : '';
  if (!key || !list || !dc) {
    warnUnset();
    return res.status(503).json({
      error: 'Mailchimp not configured — set MAILCHIMP_API_KEY and MAILCHIMP_LIST_ID in the Vercel project settings'
    });
  }

  if (await throttle(req, 'collect', 5, DAILY_CAP)) {
    return res.status(429).json({ error: 'slow down' });
  }

  const body = req.body || {};
  const m = typeof body.email === 'string' ? body.email.slice(0, 120).match(EMAIL_RE) : null;
  if (!m) return res.status(400).json({ error: 'bad request' });
  const email = m[0];

  const base = 'https://' + dc + '.api.mailchimp.com/3.0/lists/' + list;
  const auth = 'Basic ' + Buffer.from('anystring:' + key).toString('base64');
  // Members are addressed by the md5 of the lowercased email, which makes
  // PUT an idempotent upsert — a repeat submit is a no-op, not a duplicate.
  const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  let upsert;
  try {
    upsert = await fetch(base + '/members/' + hash, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: auth },
      body: JSON.stringify({
        email_address: email,
        status_if_new: process.env.MAILCHIMP_STATUS || 'subscribed'
      }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    return res.status(502).json({ error: 'mailchimp unreachable' });
  }
  if (!upsert.ok) {
    // Surface the reason in the runtime log (bad list id, revoked key, a
    // cleaned/bouncing address) without echoing Mailchimp's body to clients.
    try { console.warn('[collect-email] upsert ' + upsert.status + ': ' + (await upsert.text()).slice(0, 300)); } catch (e) { /* ignore */ }
    return res.status(502).json({ error: 'mailchimp ' + upsert.status });
  }

  // Tag best-effort — the member is stored either way.
  try {
    await fetch(base + '/members/' + hash + '/tags', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: auth },
      body: JSON.stringify({
        tags: [{ name: process.env.MAILCHIMP_TAG || 'chat-follow-up', status: 'active' }]
      }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) { /* ignore */ }

  return res.status(200).json({ ok: true });
};
