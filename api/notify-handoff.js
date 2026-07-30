/* ──────────────────────────────────────────────────────────────────────────
   /api/notify-handoff — team notification when Ember hands off to a human.

   The widget POSTs { mode, page, model, recent } (recent = the customer's
   last few messages, emails already masked) the first time a conversation
   shows a contact card. We forward a short summary to the webhook in
   HANDOFF_WEBHOOK_URL — a Slack "incoming webhook" URL works out of the box
   (the payload is the standard { text } shape most chat webhooks accept).

   Setup: Slack → apps → Incoming Webhooks → pick the channel (#ember-chat
   or similar) → copy the webhook URL → save it as HANDOFF_WEBHOOK_URL in
   the Vercel project's environment variables → redeploy. Until it's set
   this returns 503 and the widget silently stops trying for the page load.

   Zero dependencies on purpose (repo convention): global fetch only.
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

// CORS/origin enforcement + rate limiting live in api/_guard.js (shared).
const { cors, throttle } = require('./_guard');

// Endpoint-wide daily ceiling — keeps the team's Slack channel from being
// flooded (only enforced once Upstash is configured; see api/_guard.js).
const DAILY_CAP = Number(process.env.HANDOFF_DAILY_CAP || 300);

const INSIGHTS_URL = 'https://aquafire.app/chat-insights.html';
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const clean = (s, max) =>
  String(s || '')
    .replace(EMAIL_RE, (m) => (/@(aquafire|luminabrands)\.com$/i.test(m) ? m : '[email]'))
    .replace(/\s+/g, ' ').trim().slice(0, max);

module.exports = async (req, res) => {
  if (!cors(req, res)) return;

  const webhook = process.env.HANDOFF_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({
      error: 'handoff notifications not configured — set HANDOFF_WEBHOOK_URL in the Vercel project settings'
    });
  }

  if (await throttle(req, 'handoff', 4, DAILY_CAP)) {
    return res.status(429).json({ error: 'slow down' });
  }

  const body = req.body || {};
  const mode = clean(body.mode, 20) || 'support';
  const page = clean(body.page, 120);
  const host = clean(body.host, 60);
  const model = clean(body.model, 20);
  const recent = (Array.isArray(body.recent) ? body.recent : [])
    .slice(-3)
    .map((m) => clean(m, 200))
    .filter(Boolean);

  const device = clean(body.device, 10);
  const product = clean(body.product, 60);
  const cart = clean(body.cart, 200);
  const journey = clean(body.journey, 250);

  const lines = [
    ':fire: *Ember handed a customer to the team* (' + mode + ')',
    (host || page) ? 'Where: ' + host + page + (device ? ' (' + device + ')' : '') : null,
    model ? 'Their model: Aquafire ' + model : null,
    product ? 'Viewing product: ' + product : null,
    cart ? 'Cart: ' + cart : null,
    journey ? 'Journey: ' + journey : null,
    recent.length ? 'They asked:\n' + recent.map((m) => '> ' + m).join('\n') : null,
    'Full transcript: ' + INSIGHTS_URL
  ].filter(Boolean);

  let upstream;
  try {
    upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    return res.status(502).json({ error: 'webhook unreachable' });
  }
  if (!upstream.ok) return res.status(502).json({ error: 'webhook ' + upstream.status });
  return res.status(200).json({ ok: true });
};
