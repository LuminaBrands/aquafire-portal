# Aquafire Assistant ("Ember") — chat widget

`assistant.js` is a self-contained, embeddable AI chat widget for customer-service and
pre-sale questions — a Gorgias-style floating chat bubble, restyled for the Aquafire
dark theme. It ships with a built-in knowledge base (models, pricing, sizing, install,
water care, warranty, and guided troubleshooting, all sourced from
`docs/source-material/`) and answers instantly with no backend. Optionally, it can be
wired to a Claude-powered endpoint for free-form AI answers (see below).

It is already included on every customer-facing portal page. This doc covers putting it
on **aquafire.com (Shopify)** and configuring it.

---

## What it does

| Capability | How |
|---|---|
| Pre-sale Q&A | Model comparison, live-store product cards (Pro/Original/Lite/Gatsby), pricing, sizes & cutouts, run cost, ganging, colors/app, TV-above, humidity, safety |
| Install planning | Install steps, enclosure/light-trap/airflow guidance, water-line options, deep links into the Enclosure Guide + Water Care tools |
| Support | Guided troubleshooting flow (model → symptom), beep-code decoding, flame/leak/power/remote/app/light fixes, how-to video links, help-article links, deep links into the Troubleshooter (`?node=` / `?model=`) |
| Service | Warranty terms & registration, serial-number lookup help, replacement parts cards, order-status pointers |
| Human handoff | "Talk to a human" → support/sales/orders contact cards (email, phone, service request), plus 👎-feedback escalation |
| Memory | Remembers the visitor's model and the conversation across page navigation (sessionStorage) |

The widget hides itself automatically on pages loaded with `?embed` (the Shopify
iframe convention), so a Shopify page embedding a portal tool never shows two bubbles.

---

## Install on Shopify (aquafire.com)

The widget is one `<script>` tag. Two hosting options:

### Option A — host the script on the portal (recommended)

If this portal is deployed at, say, `https://portal.aquafire.com/`, add this to
`theme.liquid` right before `</body>` (Online Store → Themes → Edit code →
`layout/theme.liquid`):

```html
<script src="https://portal.aquafire.com/assistant.js" defer></script>
```

That's it. The widget derives the portal base URL from its own `src`, so all deep
links (Troubleshooter, Enclosure Guide, Water Care) resolve to the portal
automatically. Updating the portal updates the widget everywhere.

### Option B — host the script on Shopify itself

1. In Shopify admin: **Content → Files → Upload** `assistant.js`. Copy the
   `cdn.shopify.com/…/assistant.js` URL it gives you.
2. In `theme.liquid`, before `</body>`:

```html
<script>
  window.AQUAFIRE_ASSISTANT_CONFIG = {
    portalBase: 'https://portal.aquafire.com/'   // where the portal tools live
  };
</script>
<script src="https://cdn.shopify.com/s/files/.../assistant.js" defer></script>
```

With this option you must set `portalBase` explicitly (the script can't infer the
portal location from a Shopify CDN URL), and you re-upload the file to update it.

### Notes

- The widget uses a `2147483000` z-index and namespaced `afa-` classes, so it won't
  clash with theme styles or other apps.
- If a page shouldn't show the widget (e.g. checkout is already excluded — Shopify
  doesn't run theme scripts there), wrap the tag in a Liquid conditional:
  `{% unless template contains 'cart' %} … {% endunless %}`.

---

## Configuration

Via `window.AQUAFIRE_ASSISTANT_CONFIG` (before the script tag) or `data-*` attributes
on the tag itself:

| Option | Attribute | Default | Purpose |
|---|---|---|---|
| `portalBase` | `data-portal-base` | script's own directory | Absolute base URL used for portal deep links |
| `apiEndpoint` | — | *(unset)* | POST endpoint for Claude-powered replies (below) |
| `showInEmbed` | `data-embed="show"` | hidden | Show the widget inside `?embed` iframes |

---

## Optional: Claude-powered answers

Out of the box, unrecognized questions get a graceful "here's what I can help with"
fallback. Point `apiEndpoint` at a small proxy and those questions go to Claude
instead, with the local KB still handling instant answers and outages. The API key
lives only on the server — never in the browser.

**Widget → endpoint request** (`POST`, JSON):

```json
{
  "message": "Can I put the 60 inch in a coffee table?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }],
  "context": { "model": "pro", "page": "https://www.aquafire.com/products/aquafire-pro" }
}
```

**Expected response:** `{ "reply": "…markdown-lite text…" }`

### Example: Cloudflare Worker

```bash
npm create cloudflare@latest aquafire-chat -- --type hello-world
cd aquafire-chat && npm install @anthropic-ai/sdk
npx wrangler secret put ANTHROPIC_API_KEY
```

`src/index.js`:

```js
import Anthropic from '@anthropic-ai/sdk';

const ALLOWED_ORIGINS = [
  'https://www.aquafire.com',
  'https://portal.aquafire.com',
];

const SYSTEM_PROMPT = `You are Ember, the friendly AI assistant for Aquafire water
vapor fireplaces (by Lumina Brands). Answer customer-service and pre-sale questions
concisely (2-5 sentences), warmly, and only from the facts below. If you don't know,
say so and point the customer to support@aquafire.com or (877) 888-4260. Never invent
prices, policies, or specs.

FACTS:
- Aquafire creates a realistic flame illusion from cool water vapor (ultrasonic mist
  + LED light). No real fire, no heat, no fumes; safe to touch, safe around kids/pets.
- Models: Pro (AWPR, from $3,995: 30+ flame colors, AFIRE phone app, UV-C sanitizing,
  direct-plumb ready, 20 hr runtime); Original (AWA, from $2,990: amber flame, remote,
  20 hr runtime, optional Direct Plumb Kit); Lite (AWL, from $1,699: amber flame,
  manual fill, 8-10 hr runtime, bottom drain plug); Gatsby ($2,400, freestanding).
- Sizes 20"/40"/60" (Lite adds 16"); ~12" deep; gang up to 20 ft of flame on one
  remote. Power: 60/120/180 W standard outlet. Optional 1/4" water line (like a
  fridge ice maker).
- Cutout dimensions are critical (insert hangs from flanges). Enclosure needs a light
  trap, matte black interior, 50 sq in air intake per 20" of insert, sealed wall
  cavities, 6" side clearance. Free design review: sales@aquafire.com.
- Water: ideal hardness 3.5-8.5 gpg (7 ideal). No RO/distilled (kills the flame
  effect). Vapor Pure softener must stay installed for warranty. Descale every ~3
  months. Mist makers are wear parts (2,000-3,000 hrs, $81).
- Warranty: 2 yr residential / 1 yr commercial; register within 30 days at
  aquafire.com/warranty; claims via ces@aquafire.com or aquafire.com/pages/service-request.
- Beep codes: 2 quick = low water; 3 long = overflow/stuck float; 1 short every 2 s =
  voltage/adapter; light flashing 30 s = maintenance reminder (reset: hold middle+left).
- Useful links: https://portal.aquafire.com/troubleshoot.html (guided fixes),
  https://portal.aquafire.com/enclosure-guide.html (cutout calculator),
  https://portal.aquafire.com/water-care.html (hardness by ZIP),
  https://www.aquafire.com/collections/replacement-parts.`;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const headers = cors(request.headers.get('Origin') || '');
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });

    const { message, history = [], context = {} } = await request.json();
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return Response.json({ error: 'bad request' }, { status: 400, headers });
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        ...history.slice(-10),
        {
          role: 'user',
          content: (context.model ? `[Customer owns: Aquafire ${context.model}] ` : '') + message,
        },
      ],
    });

    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return Response.json({ reply }, { headers });
  },
};
```

Deploy with `npx wrangler deploy`, then point the widget at it:

```html
<script>
  window.AQUAFIRE_ASSISTANT_CONFIG = {
    apiEndpoint: 'https://aquafire-chat.<your-subdomain>.workers.dev'
  };
</script>
<script src="https://portal.aquafire.com/assistant.js" defer></script>
```

If the endpoint errors or times out (15 s), the widget silently falls back to the
local knowledge base — the customer always gets an answer.

**Cost note:** with prompt caching on the system prompt, a typical reply is a few
cents. Add rate limiting (e.g. Cloudflare's built-in) before going live.

---

## Monitoring, feedback & improvement

The widget logs anonymous conversation events so the team can see what customers ask,
what Ember couldn't answer, and how answers were rated — and feed that back into the
knowledge base. Review everything at **`chat-insights.html`** (internal, sign-in
gated — same Firebase accounts as the Rewards system).

### What gets logged

One small event per action to the `chatEvents` Firestore collection (project
`aquafire-portal`, the same one the portal's rewards system already uses):

| Event | Fields | Fired when |
|---|---|---|
| `convo_start` | page, host | A visitor opens a fresh conversation |
| `user_message` | text, intent (`fallback` = unanswered, `llm` = sent to AI) | Every customer message |
| `feedback` | vote (`up`/`down`), intent | 👍/👎 tapped on an answer |
| `feedback_comment` | comment, intent | Optional "what went wrong" text after a 👎 |
| `handoff` | mode (support/sales/orders) | A contact card is shown |
| `llm_reply` / `llm_error` | text | AI-mode reply / endpoint failure |

Every event also carries a random per-session conversation id, timestamp, page, host,
and the customer's model (if known). No accounts, no cookies, no fingerprinting — the
only personal data is whatever the customer types.

### One-time setup: Firestore rules

In the Firebase console (**aquafire-portal → Firestore → Rules**), add this *inside*
the existing `match /databases/{database}/documents { ... }` block, as a sibling of
the `users` rule, then **Publish**. The widget writes anonymously (create-only,
schema-restricted); reads are limited to verified team sign-ins — **not** just any
signed-in account, since rewards customers hold Firebase accounts in this project too:

```
match /chatEvents/{id} {
  allow create: if request.resource.data.keys().hasOnly(
    ['v','type','convo','ts','page','host','model',
     'text','intent','vote','comment','mode']);
  allow read: if request.auth != null
    && request.auth.token.email_verified
    && request.auth.token.email.matches('.*@luminabrands[.]com');
  allow update, delete: if false;
}
```

Adjust the domain pattern to whatever your team signs in with (e.g.
`'.*@(luminabrands|aquafire)[.]com'`), or swap it for an explicit UID allowlist.
Until the rule is published, writes are silently rejected — the chat itself is never
affected (all telemetry is fire-and-forget). **Privacy:** transcripts can contain
customer-typed details — treat logs as customer data and set a retention policy
(Firestore TTL on the `ts` field, e.g. 180 days, does this automatically).

### Config

| Option | Default | Purpose |
|---|---|---|
| `telemetry: false` | on | Kill switch — nothing is logged |
| `firestore: {projectId, apiKey}` | portal's project | Log to a different Firebase project (`firestore: null` disables Firestore logging) |
| `logEndpoint: 'https://…'` | unset | Also POST each event (JSON) to any webhook — Zapier, a Worker, Gorgias, your warehouse |

### The improvement loop

Ember doesn't self-modify (by design — a brand voice shouldn't drift unsupervised).
It improves through a short human-in-the-loop cycle; 15 minutes a week is plenty:

1. **Open Chat Insights** → the "Top unanswered questions" panel is your work queue.
   Each recurring miss becomes a new intent (or new keywords on an existing one) in
   the `INTENTS` array in `assistant.js`.
2. **Filter by 👎** → read the comment, fix the answer's copy, steps, or links.
3. **Watch the handoff rate** → handoffs after an *answered* question usually mean the
   answer is right but incomplete — add the missing detail.
4. **In AI mode**, the same reviews improve the model: fold recurring questions and
   corrected answers into the proxy's `SYSTEM_PROMPT` facts, and keep the exported
   CSV as a regression set — after any prompt change, spot-check that previously-good
   answers still hold.
5. When Aquafire revises a source doc, update `docs/source-material/` and the
   affected intents together (see below).

`Export CSV` in the dashboard dumps everything for deeper analysis (or for building
an eval set if you later want automated answer-quality testing).

## Maintaining the knowledge base

Answers live in the `INTENTS` array in `assistant.js` — each intent has weighted
keywords and an `answer()` returning rich blocks (`text`, `steps`, `cards`, `links`,
`videos`, `chips`, `contact`). House rules:

- **Facts must trace to `docs/source-material/`.** When Aquafire revises a help
  article or spec guide, update the intent *and* the extract.
- **Prices** in the product cards are snapshots from the Shopify store (July 2026);
  cards link to live product pages, so drift is cosmetic — but refresh them when
  prices change.
- Video URLs mirror the `VIDEOS` map in `troubleshoot.js` — keep them in sync.
- Troubleshooter deep links use `troubleshoot.html?node=<id>&model=<m>`; node ids
  come from the `TREE` in `troubleshoot.js`.
