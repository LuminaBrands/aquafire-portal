/* ──────────────────────────────────────────────────────────────────────────
   /api/notify-slack — Slack alerts for Ember's dead ends (Vercel function).

   The widget POSTs here whenever Ember can't answer a question or hands the
   customer off to a human, and we relay a short card to the Slack channel
   behind SLACK_WEBHOOK_URL (#chat-insights-feeback).

   Setup: create a Slack incoming webhook for the channel and set
   SLACK_WEBHOOK_URL in the Vercel project's environment variables. Until it's
   set this returns 503 and the widget silently stops trying — the chat itself
   is never affected (alerts are fire-and-forget, like the Firestore telemetry).

   Zero dependencies on purpose (repo convention: no package.json / no build).
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

const INSIGHTS_URL = 'https://aquafire.app/chat-insights.html';

const ALLOWED_ORIGIN =
  /^https:\/\/((www\.)?aquafire\.(app|com)|[a-z0-9-]+-luminabrands-projects\.vercel\.app)$/;

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
  }
};

const MODEL_NAMES = {
  pro: 'Aquafire Pro', original: 'Aquafire Original',
  lite: 'Aquafire Lite', gatsby: 'Gatsby', unknown: 'model unknown'
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

// Slack mrkdwn escaping — also neutralizes <!channel>/<!here> style pings.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function field(body, key, max) {
  const v = body[key];
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function safeUrl(u) {
  return /^https?:\/\/[^\s<>"]{1,300}$/.test(u) ? u : '';
}

/* ── Best-effort per-instance rate limit + dedupe ───────────────────────── */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 10;
}

// Swallow the same alert repeating inside a conversation (double render,
// customer retrying the identical question, refresh restoring state).
const seen = new Map();
function duplicate(key) {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > 10 * 60 * 1000) seen.delete(k);
  if (seen.has(key)) return true;
  seen.set(key, now);
  if (seen.size > 2000) seen.clear();
  return false;
}

/* ── Slack payload ──────────────────────────────────────────────────────── */
function slackMessage(kind, d) {
  const k = KINDS[kind];
  const bits = [];
  if (d.model) bits.push(esc(MODEL_NAMES[d.model] || d.model));
  if (kind === 'handoff' && d.mode) bits.push(esc(d.mode) + ' contact card');
  const page = safeUrl(d.page);
  if (page) {
    let label = page;
    try {
      const u = new URL(page);
      label = u.hostname.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname);
    } catch (e) { /* keep raw */ }
    bits.push('<' + page + '|' + esc(label) + '>');
  }
  if (d.convo) bits.push('convo `' + esc(d.convo) + '`');
  bits.push('<' + INSIGHTS_URL + '|Chat Insights>');

  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*' + k.emoji + ' ' + k.title + '*' +
        (d.question ? '\n>' + esc(d.question) : '')
    }
  }];

  if (d.reply) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*Ember replied:*\n' + esc(d.reply) }
    });
  }
  if (k.note) {
    blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: '_' + k.note + '_' }] });
  }
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: bits.join(' · ') }] });

  return {
    // Notification preview — escaped too, so a pasted <!channel> can't ping.
    text: k.title + (d.question ? ' — "' + esc(d.question) + '"' : ''),
    blocks: blocks
  };
}

/* ── Handler ────────────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGIN.test(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // Browsers always send Origin on a cross-origin POST; same-origin calls from
  // aquafire.app may omit it. Anything else with a foreign Origin is refused.
  if (origin && !allowed) return res.status(403).json({ error: 'forbidden' });

  const webhook = process.env.SLACK_WEBHOOK_URL || '';
  if (!/^https:\/\/hooks\.slack\.com\//.test(webhook)) {
    // 503 tells the widget to stop trying for this page load.
    return res.status(503).json({
      error: 'Slack alerts not configured — set SLACK_WEBHOOK_URL in the Vercel project settings'
    });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'slow down' });

  const body = req.body || {};
  const kind = field(body, 'kind', 20);
  if (!KINDS[kind]) return res.status(400).json({ error: 'bad request' });

  const d = {
    convo: field(body, 'convo', 40),
    model: field(body, 'model', 20),
    mode: field(body, 'mode', 20),
    page: field(body, 'page', 300),
    question: field(body, 'question', 400),
    reply: field(body, 'reply', 700)
  };

  if (duplicate(kind + '|' + d.convo + '|' + d.mode + '|' + d.question)) {
    return res.status(200).json({ ok: true, deduped: true });
  }

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(slackMessage(kind, d)),
      signal: AbortSignal.timeout(6000)
    });
    if (!r.ok) return res.status(502).json({ error: 'slack ' + r.status });
  } catch (e) {
    return res.status(502).json({ error: 'slack unreachable' });
  }

  return res.status(200).json({ ok: true });
};
