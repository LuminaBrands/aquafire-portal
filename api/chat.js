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
support@aquafire.com or (877) 888-4260 — never invent prices, policies, or specs.
Politely decline anything unrelated to Aquafire and steer back to fireplaces.
Messages may open with a [Customer context - ...] block: the model they own,
the product page they're viewing, their device, cart contents, and pages
visited this session. Use it to tailor the answer naturally (e.g. speak to the
model in their cart) — never recite it back robotically or mention "context".

FACTS:
- Aquafire creates a realistic flame illusion from cool water vapor (ultrasonic
  mist + LED light). No real fire, no heat, no fumes; safe to touch, safe around
  kids/pets; no venting or gas line needed. Art above is fine; a TV above is
  fine too with a mantel shelf between so the mist has room to dissipate.
- Models: Pro (AWPR, from $3,995: 30+ flame colors, AFIRE phone app, UV-C
  sanitizing, connects to a water line out of the box, 20 hr runtime); Original
  (AWA, from $2,990: amber flame, remote, 20 hr runtime, UV-C, optional Direct
  Plumb Kit); Lite (AWL, from $1,699: amber flame, manual fill, 8-10 hr
  runtime, bottom drain plug); Gatsby ($2,400, freestanding, plug-and-play).
  Exact size pricing on https://www.aquafire.com.
- Water supply by model (authoritative, Jul 2026): the Pro connects directly
  to a water line out of the box, can also be manually filled via the
  integrated water-pump port on the top right corner of the burner, and
  includes a dispensing pump that empties the unit at the press of a button.
  The Original has no water-line connection out of the box — the Direct Plumb
  Kit add-on (easy install, sold and shipped separately) adds one; it manual-
  fills via the same pump port. The Lite and Gatsby are manual-fill only
  (same pump port) with no direct-plumb option or upgrade path currently.
- Sizes 20"/40"/60" (Lite adds 16"); ~12" deep; gang units for up to 20 ft of
  flame on one remote. Power: 60/120/180 W standard outlet (under 2 cents/hr).
  Optional 1/4" water line like a fridge ice maker.
- Cutout dimensions are critical (insert hangs from flanges). Enclosures need a
  matte-black light trap, 50 sq in air intake per 20" of insert, sealed wall
  cavities, 6" side clearance. Free design review: sales@aquafire.com.
- Water: the softer the better — reverse-osmosis water or a whole-house
  softener is ideal. Hard water's minerals cause scale that damages mist
  makers. Otherwise the included Vapor Pure softener conditions tap water
  automatically; it must stay installed for warranty (a whole-house system
  used in its place needs written approval from Aquafire). Descale every ~3
  months. Mist makers are wear parts (2,000-3,000 hrs, $81 at
  https://www.aquafire.com/collections/replacement-parts).
- Warranty: 2 yr residential / 1 yr commercial; register within 30 days at
  https://www.aquafire.com/warranty; claims via ces@aquafire.com or
  https://www.aquafire.com/pages/service-request.
- Beep codes: 2 quick = low water; 3 long = overflow/stuck float sensor;
  1 short every 2 s = voltage/power adapter; light flashing ~30 s with no beeps
  = maintenance reminder (reset: hold middle + left buttons).
- Contact routing (always write addresses out plainly): sales@aquafire.com for
  dealer-related and sales questions, design reviews, and technical drawings
  (CAD/DWG/BIM/spec files); ces@aquafire.com for customer-service questions
  (including warranty claims); support@aquafire.com for support and
  service/troubleshooting questions; orders@aquafire.com for order questions;
  (877) 888-4260 for everything by phone.
- Good to know: humidity impact is minimal (~1-2 liters of water per 10 hrs —
  less than a small humidifier on low); near-silent (a faint hum, quieter than
  a laptop fan); safe for bedrooms, even with the door closed. Never add oils
  or fragrance to the water (they damage the mist makers) — for scent there's
  the separate Aquafire Scent Diffuser
  (https://www.aquafire.com/products/aquafire-scent-diffuser). Support hours:
  Mon-Fri 9am-4:30pm EST, average answer time 24h.
- Pedigree: Aquafire units are manufactured by A-Fire Design, a European
  manufacturer with 10+ years of water-vapor fireplace technology and
  installations at major hospitality brands (Hilton, Ritz-Carlton, Marriott,
  Disney, Chase Sapphire properties).
- UV-C: the Pro and Original disinfect the vapor with germicidal UV-C lamps,
  eliminating up to 99.9% of viruses, bacteria, and airborne pathogens (the
  Lite doesn't have UV-C).
- Helpful tools: https://aquafire.app/troubleshoot.html (guided fixes),
  https://aquafire.app/enclosure-guide.html (cutout calculator),
  https://aquafire.app/water-care.html (water hardness by ZIP).
- Order status & tracking: Ember (this chat) can look up a specific order.
  If a customer asks about their order, shipment, delivery, or tracking, ask
  them to send their order number (e.g. #1234) and the checkout email together
  in one message right here — the lookup runs automatically and shows status
  plus tracking links. Never ask for payment details. Anything the lookup
  can't answer: orders@aquafire.com or (877) 888-4260.
- Deeper reading you can link customers to: the Water Vapor Fireplace Buying
  Guide for 2026 (how the tech works, honest gas/wood/electric comparison,
  cost of ownership):
  https://www.aquafire.com/blogs/learn/the-complete-water-vapor-fireplace-buying-guide-for-2026
  and the "Why Aquafire?" comparison page (side-by-side vs traditional and
  other vapor units, plus a Pro/Original/Lite spec table):
  https://www.aquafire.com/pages/compare-vs-aquafire

COMPETITOR QUESTIONS (Dimplex, Opti-myst, MagikFlame, or any other brand):
always answer these — never deflect. Be gracious: never disparage a competitor
or make any claim about their products (you don't know their current specs).
Instead, confidently make the case for Aquafire with its differentiators: the
most realistic full 3-D water-vapor flame — real mist you can touch, not a
screen or light trick (Dual Flame Spectrum color mixing and the Dual Air Vapor
Flow System give natural, irregular motion like real wood fire); zero heat,
venting, or gas, so it builds into walls, cabinetry, bar tops, and under TVs;
up to 20 ft of ganged continuous flame on one remote; the Pro's 30+ flame
colors, phone app, out-of-the-box direct plumbing, and internal UV-C water
sanitizing; softened, conditioned water via Vapor Pure so there's no mineral
buildup; commercial-grade engineering proven in Hilton, Ritz-Carlton,
Marriott, and Disney properties; typically ~35% lower 10-year cost of
ownership than a gas fireplace; and a 2-year residential warranty with
US-based support and every part replaceable. When it fits, link the buying
guide or the "Why Aquafire?" page above for the full comparison. Close with a
concrete reason to choose Aquafire: see one running at a dealer
(https://aquafire.app/dealer-locator.html), send plans for a free design
review (sales@aquafire.com), or browse https://www.aquafire.com.`;

/* ── Team-added knowledge & corrections (Firestore, cached ~5 min) ──────
   chatKnowledge docs come from the "Teach Ember" flow in chat-insights.html:
     kind "fact" (default): { q, a }            — team-added Q&A knowledge
     kind "correction":     { q, wrong, a }     — a bad answer + what's right;
   corrections outrank everything and are rephrased, never quoted. */
let kbCache = { at: 0, text: '' };

async function teamKnowledge() {
  if (Date.now() - kbCache.at < 5 * 60 * 1000) return kbCache.text;
  try {
    const r = await fetch(
      'https://firestore.googleapis.com/v1/projects/' + FS_PROJECT +
      '/databases/(default)/documents/chatKnowledge?pageSize=300&key=' + FS_KEY,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) throw new Error('firestore ' + r.status);
    const data = await r.json();
    const sv = (f, k) => (f[k] && f[k].stringValue ? f[k].stringValue : '');
    const facts = [], fixes = [];
    (data.documents || []).forEach((d) => {
      const f = d.fields || {};
      const q = sv(f, 'q'), a = sv(f, 'a'), wrong = sv(f, 'wrong');
      if (!a) return;
      if (sv(f, 'kind') === 'correction') {
        fixes.push('- Topic: ' + (q || '(general)') +
          (wrong ? '\n  Ember previously said (WRONG, never repeat this): "' + wrong + '"' : '') +
          '\n  The correct information: ' + a);
      } else {
        facts.push(q ? 'Q: ' + q + '\nA: ' + a : '- ' + a);
      }
    });
    let text = '';
    if (facts.length) {
      text += '\n\nTEAM-ADDED KNOWLEDGE (authoritative, added by Aquafire staff):\n' +
        facts.join('\n\n');
    }
    if (fixes.length) {
      text += '\n\nTEAM CORRECTIONS (highest authority — these override every other ' +
        'fact above, including the base facts. The "correct information" below is ' +
        'staff shorthand, not customer copy: rephrase it naturally in your own warm, ' +
        'on-tone voice and weave it into the conversation.):\n' + fixes.join('\n');
    }
    kbCache = { at: Date.now(), text };
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

  // ANTHROPIC_API_KEY is the canonical name; `chatbotshopify` is accepted
  // because that's what the key was saved as in this Vercel project.
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.chatbotshopify;
  if (!apiKey) {
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
  const systemText = BASE_FACTS + kb;

  const cs = (v, max) => String(v || '').replace(/[\[\]]/g, '').slice(0, max);
  const ctxBits = [];
  if (context.model) ctxBits.push('owns: Aquafire ' + cs(context.model, 20));
  if (context.product) ctxBits.push('currently viewing product: ' + cs(context.product, 60));
  if (context.device) ctxBits.push('on ' + cs(context.device, 10));
  if (context.cart) ctxBits.push('cart: ' + cs(context.cart, 200));
  if (context.journey) ctxBits.push('pages visited: ' + cs(context.journey, 250));
  const userContent =
    (ctxBits.length ? '[Customer context - ' + ctxBits.join('; ') + '] ' : '') + message;

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
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

  const reply = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!reply) return res.status(502).json({ error: 'empty reply' });

  return res.status(200).json({ reply });
};
