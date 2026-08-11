/* ──────────────────────────────────────────────────────────────────────────
   /api/notify-slack — Slack alerts for Ember's dead ends (Vercel function).

   The widget POSTs here whenever Ember can't answer a question or hands the
   customer off to a human, and we relay a card to the Slack channel behind
   SLACK_WEBHOOK_URL (#chat-insights-feeback). Four kinds:

     unanswered  no knowledge-base match and AI mode unavailable
     unresolved  the AI answered but told the customer it couldn't help
     llm_error   /api/chat errored or timed out; local fallback was used
     handoff     a contact card was shown (support / sales / orders)
     callback    the customer left their email for a follow-up (the one
                 alert that carries a customer address unmasked — it's
                 deliberate, consented contact info, not transcript PII)

   Setup: Slack -> apps -> Incoming Webhooks -> pick the channel -> copy the
   webhook URL -> save it as SLACK_WEBHOOK_URL in the Vercel project's
   environment variables (all environments, so previews can be tested too) ->
   redeploy. Until it's set this returns 503 and the widget silently stops
   trying for the page load — the chat itself is never affected.

   Zero dependencies on purpose (repo convention: no package.json / no build).
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

// CORS/origin enforcement + rate limiting live in api/_guard.js (shared).
const { cors, throttle } = require('./_guard');

// Endpoint-wide daily ceiling — keeps the team's channel from being flooded
// (only enforced once Upstash is configured; see api/_guard.js).
const DAILY_CAP = Number(process.env.ALERT_DAILY_CAP || 300);

const INSIGHTS_URL = 'https://aquafire.app/chat-insights.html';

// What each alert kind looks like in Slack.
const KINDS = {
  unanswered: {
    emoji: ':grey_question:',
    title: 'Ember had no answer',
    note: 'No knowledge-base match and AI mode was unavailable — the customer got the generic "try one of these" reply.'
  },
  unresolved: {
    emoji: ':grey_question:',
    title: "Ember didn't know the answer",
    note: 'The AI answered but told the customer it could not help — worth teaching Ember.'
  },
  llm_error: {
    emoji: ':warning:',
    title: "Ember's AI backend failed",
    note: '/api/chat errored or timed out — the customer got the local fallback reply.'
  },
  handoff: {
    emoji: ':raising_hand:',
    title: 'Handoff to a human',
    note: ''
  },
  callback: {
    emoji: ':email:',
    title: 'Customer left their email',
    note: 'They asked for a human follow-up — reply to the address above.'
  }
};

const MODEL_NAMES = {
  pro: 'Aquafire Pro', original: 'Aquafire Original',
  lite: 'Aquafire Lite', gatsby: 'Gatsby', unknown: 'model unknown'
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Slack mrkdwn escaping — also neutralizes <!channel>/<!here> style pings —
// plus customer email masking (our own addresses are kept, they're public).
function clean(s, max) {
  return String(s == null ? '' : s)
    .replace(EMAIL_RE, (m) => (/@(aquafire|luminabrands)\.com$/i.test(m) ? m : '[email]'))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\s+/g, ' ').trim().slice(0, max);
}

function field(body, key, max) {
  return typeof body[key] === 'string' ? clean(body[key], max) : '';
}

/* ── Dedupe ─────────────────────────────────────────────────────────────────
   Swallow the same alert repeating inside a conversation (a re-render, or the
   customer rephrasing the identical question). Per-instance and best effort —
   the widget already caps handoffs at one per conversation. */
const seen = new Map();
function duplicate(key) {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > 10 * 60 * 1000) seen.delete(k);
  if (seen.has(key)) return true;
  seen.set(key, now);
  if (seen.size > 2000) seen.clear();
  return false;
}

/* ── Config diagnostics ─────────────────────────────────────────────────
   A missing webhook is silent by design (the chat must never break), which
   makes it look identical to "no alerts happened". Say so once per instance
   so the runtime log explains the 503 instead of just recording it. */
let warnedUnset = false;
function warnUnset(webhook) {
  if (warnedUnset) return;
  warnedUnset = true;
  console.warn('[notify-slack] SLACK_WEBHOOK_URL is ' +
    (webhook ? 'set but is not a https://hooks.slack.com/ URL' : 'not set') +
    ' in this deployment\'s environment, so alerts are being dropped. Check the ' +
    'variable is scoped to the environment this deployment runs in — a ' +
    'Production-only variable is NOT visible to Preview deployments — and ' +
    'redeploy afterwards, since env values are bound at build time.');
}

/* ── Slack payload ──────────────────────────────────────────────────────── */
function slackMessage(kind, d) {
  const k = KINDS[kind];

  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*' + k.emoji + ' ' + k.title + '*' + (d.question ? '\n>' + d.question : '')
    }
  }];

  if (d.email) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*Reach them at:* <mailto:' + d.email + '|' + d.email + '>' }
    });
  }

  if (d.reply) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*Ember replied:*\n' + d.reply }
    });
  }

  // What the customer was doing — the difference between "someone needs help"
  // and knowing enough to help them without opening the dashboard.
  const facts = [];
  if (d.model) facts.push('*Their model:* ' + (MODEL_NAMES[d.model] || d.model));
  if (d.product) facts.push('*Viewing:* ' + d.product);
  if (d.cart) facts.push('*Cart:* ' + d.cart);
  if (d.journey) facts.push('*Journey:* ' + d.journey);
  if (d.recent.length > 1) {
    facts.push('*Earlier:* ' + d.recent.slice(0, -1).map((m) => '"' + m + '"').join(' · '));
  }
  if (facts.length) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: facts.join('\n') } });
  }

  if (k.note) {
    blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: '_' + k.note + '_' }] });
  }

  const meta = [];
  if (kind === 'handoff' && d.mode) meta.push(d.mode + ' contact card');
  if (d.host || d.page) meta.push(d.host + d.page + (d.device ? ' (' + d.device + ')' : ''));
  if (d.convo) meta.push('convo `' + d.convo + '`');
  meta.push('<' + INSIGHTS_URL + '|Chat Insights>');
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: meta.join(' · ') }] });

  return {
    // Notification preview — already escaped, so a pasted <!channel> can't ping.
    text: k.title + (d.email ? ' — ' + d.email : '') + (d.question ? ' — "' + d.question + '"' : ''),
    blocks: blocks
  };
}

/* ── Handler ────────────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  if (!cors(req, res)) return;

  const webhook = process.env.SLACK_WEBHOOK_URL || '';
  if (!/^https:\/\/hooks\.slack\.com\//.test(webhook)) {
    warnUnset(webhook);
    // 503 tells the widget to stop trying for this page load.
    return res.status(503).json({
      error: 'Slack alerts not configured — set SLACK_WEBHOOK_URL in the Vercel project settings'
    });
  }

  if (await throttle(req, 'alert', 10, DAILY_CAP)) {
    return res.status(429).json({ error: 'slow down' });
  }

  const body = req.body || {};
  const kind = field(body, 'kind', 20);
  if (!KINDS[kind]) return res.status(400).json({ error: 'bad request' });

  const d = {
    convo: field(body, 'convo', 40),
    model: field(body, 'model', 20),
    mode: field(body, 'mode', 20),
    page: field(body, 'page', 120),
    host: field(body, 'host', 60),
    question: field(body, 'question', 400),
    reply: field(body, 'reply', 700),
    device: field(body, 'device', 10),
    product: field(body, 'product', 60),
    cart: field(body, 'cart', 200),
    journey: field(body, 'journey', 250),
    recent: (Array.isArray(body.recent) ? body.recent : [])
      .slice(-3).map((m) => clean(m, 200)).filter(Boolean)
  };

  // The customer's consented follow-up address — the one field clean()'s
  // mask must not touch, accepted only on the 'callback' kind. Re-matched
  // against EMAIL_RE, whose character set is also what makes the value safe
  // to embed in the mrkdwn below without further escaping.
  if (kind === 'callback') {
    const m = typeof body.email === 'string' ? body.email.slice(0, 120).match(EMAIL_RE) : null;
    if (!m) return res.status(400).json({ error: 'bad request' });
    d.email = m[0];
  }

  if (duplicate(kind + '|' + d.convo + '|' + d.mode + '|' + d.question)) {
    return res.status(200).json({ ok: true, deduped: true });
  }

  let upstream;
  try {
    upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(slackMessage(kind, d)),
      signal: AbortSignal.timeout(8000)
    });
  } catch (e) {
    return res.status(502).json({ error: 'webhook unreachable' });
  }
  if (!upstream.ok) return res.status(502).json({ error: 'webhook ' + upstream.status });

  return res.status(200).json({ ok: true });
};
