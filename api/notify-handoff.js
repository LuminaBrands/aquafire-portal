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

const ALLOWED_ORIGIN =
  /^https:\/\/((www\.)?aquafire\.(app|com)|[a-z0-9-]+-luminabrands-projects\.vercel\.app)$/;

const INSIGHTS_URL = 'https://aquafire.app/chat-insights.html';
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 4;
}

const clean = (s, max) =>
  String(s || '').replace(EMAIL_RE, '[email]').replace(/\s+/g, ' ').trim().slice(0, max);

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGIN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const webhook = process.env.HANDOFF_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({
      error: 'handoff notifications not configured — set HANDOFF_WEBHOOK_URL in the Vercel project settings'
    });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'slow down' });

  const body = req.body || {};
  const mode = clean(body.mode, 20) || 'support';
  const page = clean(body.page, 120);
  const host = clean(body.host, 60);
  const model = clean(body.model, 20);
  const recent = (Array.isArray(body.recent) ? body.recent : [])
    .slice(-3)
    .map((m) => clean(m, 200))
    .filter(Boolean);

  const lines = [
    ':fire: *Ember handed a customer to the team* (' + mode + ')',
    (host || page) ? 'Where: ' + host + page : null,
    model ? 'Their model: Aquafire ' + model : null,
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
