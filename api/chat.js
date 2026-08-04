/* ──────────────────────────────────────────────────────────────────────────
   /api/chat — Claude-powered answers for the Ember widget (Vercel function).

   The widget POSTs { message, history, context } here for questions the local
   knowledge base can't match; we answer with the Claude API, grounded in the
   product facts below plus team-added knowledge from the `chatKnowledge`
   Firestore collection (managed in chat-insights.html — "Teach Ember").

   Setup: set ANTHROPIC_API_KEY in the Vercel project's environment variables.
   Until it's set, this returns 503 and the widget silently falls back to its
   local knowledge base — customers always get an answer.

   Zero dependencies on purpose (repo convention: no package.json / no build):
   Node 18+'s global fetch talks to the Claude API and Firestore REST directly.
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

const MODEL = 'claude-opus-4-8';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Public Firebase web config (same project as rewards.js / assistant.js);
// chatKnowledge is world-readable by rule, team-writable via chat-insights.html.
const FS_PROJECT = 'aquafire-portal';
const FS_KEY = 'AIzaSyAAeoOt4NJxh_ITaWNMBV-Ed-mM5Ac5a7Q';

const ALLOWED_ORIGIN =
  /^https:\/\/((www\.)?aquafire\.(app|com)|[a-z0-9-]+-luminabrands-projects\.vercel\.app)$/;

const BASE_FACTS = `You are Ember, the friendly AI assistant for Aquafire water
vapor fireplaces (by Lumina Brands), chatting on aquafire.com / aquafire.app.
Answer customer-service and pre-sale questions concisely (2-5 sentences), warmly,
and only from the facts below. Simple markdown is supported: **bold**, [links](url),
line breaks. If you don't know something, say so and point the customer to
support@aquafire.com or (877) 888-4260 — never invent prices, policies, or specs —
and end that reply with [[UNRESOLVED]] on its own last line so the team gets alerted
and can follow up. Use that marker only when you genuinely could not answer the
question; never add it to a reply that did answer, and never mention it to the
customer. Politely decline anything unrelated to Aquafire and steer back to fireplaces.

FACTS:
- Aquafire creates a realistic flame illusion from cool water vapor (ultrasonic
  mist + LED light). No real fire, no heat, no fumes; safe to touch, safe around
  kids/pets; no venting or gas line needed. TVs/art directly above are fine.
- Models: Pro (AWPR, from $3,995: 30+ flame colors, AFIRE phone app, UV-C
  sanitizing, direct-plumb ready, 20 hr runtime); Original (AWA, from $2,990:
  amber flame, remote, 20 hr runtime, optional Direct Plumb Kit); Lite (AWL,
  from $1,699: amber flame, manual fill, 8-10 hr runtime, bottom drain plug);
  Gatsby ($2,400, freestanding, plug-and-play). Exact size pricing on
  https://www.aquafire.com.
- Sizes 20"/40"/60" (Lite adds 16"); ~12" deep; gang units for up to 20 ft of
  flame on one remote. Power: 60/120/180 W standard outlet (under 2 cents/hr).
  Optional 1/4" water line like a fridge ice maker.
- Cutout dimensions are critical (insert hangs from flanges). Enclosures need a
  matte-black light trap, 50 sq in air intake per 20" of insert, sealed wall
  cavities, 6" side clearance. Free design review: sales@aquafire.com.
- Water: ideal hardness 3.5-8.5 gpg (7 ideal). No RO/distilled water (kills the
  flame effect). The included Vapor Pure softener must stay installed for
  warranty. Descale every ~3 months. Mist makers are wear parts (2,000-3,000
  hrs, $81 at https://www.aquafire.com/collections/replacement-parts).
- Warranty: 2 yr residential / 1 yr commercial; register within 30 days at
  https://www.aquafire.com/warranty; claims via ces@aquafire.com or
  https://www.aquafire.com/pages/service-request.
- Beep codes: 2 quick = low water; 3 long = overflow/stuck float sensor;
  1 short every 2 s = voltage/power adapter; light flashing ~30 s with no beeps
  = maintenance reminder (reset: hold middle + left buttons).
- Helpful tools: https://aquafire.app/troubleshoot.html (guided fixes),
  https://aquafire.app/enclosure-guide.html (cutout calculator),
  https://aquafire.app/water-care.html (water hardness by ZIP).`;

/* ── Team-added knowledge (Firestore, cached ~5 min per instance) ───────── */
let kbCache = { at: 0, text: '' };

async function teamKnowledge() {
  if (Date.now() - kbCache.at < 5 * 60 * 1000) return kbCache.text;
  try {
    const r = await fetch(
      'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT +
      '/databases/(default)/documents/chatKnowledge?pageSize=200&key=' + FS_KEY,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) throw new Error('firestore ' + r.status);
    const data = await r.json();
    const lines = (data.documents || []).map((d) => {
      const f = d.fields || {};
      const q = f.q && f.q.stringValue ? f.q.stringValue : '';
      const a = f.a && f.a.stringValue ? f.a.stringValue : '';
      return a ? (q ? 'Q: ' + q + '\nA: ' + a : '- ' + a) : '';
    }).filter(Boolean);
    kbCache = { at: Date.now(), text: lines.join('\n\n') };
  } catch (e) {
    if (!kbCache.text) kbCache = { at: Date.now(), text: '' }; // retry in 5 min
  }
  return kbCache.text;
}

/* ── Best-effort per-instance rate limit ────────────────────────────────── */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 12;
}

/* ── Handler ────────────────────────────────────────────────────────────── */
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'AI mode not configured — set ANTHROPIC_API_KEY in the Vercel project settings'
    });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'slow down' });

  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 1000) {
    return res.status(400).json({ error: 'bad request' });
  }
  const context = body.context || {};
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-10)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' && m.content.length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  const kb = await teamKnowledge();
  const systemText = BASE_FACTS + (kb
    ? '\n\nTEAM-ADDED KNOWLEDGE (authoritative, added by Aquafire staff):\n' + kb
    : '');

  const userContent =
    (context.model ? '[Customer owns: Aquafire ' + context.model + '] ' : '') + message;

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: 'adaptive' },
        system: [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }],
        messages: [...history, { role: 'user', content: userContent }]
      }),
      signal: AbortSignal.timeout(25000)
    });
  } catch (e) {
    return res.status(502).json({ error: 'upstream unreachable' });
  }

  if (!upstream.ok) return res.status(502).json({ error: 'upstream ' + upstream.status });
  const data = await upstream.json();

  if (data.stop_reason === 'refusal') {
    return res.status(200).json({
      reply: "I can't help with that one, but I'm happy to answer anything about " +
        'Aquafire fireplaces — or reach the team at support@aquafire.com.'
    });
  }

  const raw = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  // The model marks answers it couldn't give; strip the marker from what the
  // customer sees and flag it so the widget can alert the team in Slack.
  const unresolved = /\[\[\s*UNRESOLVED\s*\]\]/i.test(raw);
  const reply = raw.replace(/\[\[\s*UNRESOLVED\s*\]\]/gi, '').trim();
  if (!reply) return res.status(502).json({ error: 'empty reply' });

  return res.status(200).json({ reply, unresolved });
};
