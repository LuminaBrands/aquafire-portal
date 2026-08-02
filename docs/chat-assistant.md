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
| `apiEndpoint` | — | `portalBase + 'api/chat'` | POST endpoint for Claude-powered replies (below). Set `null` to disable AI mode |
| `orderEndpoint` | — | `portalBase + 'api/order-status'` | POST endpoint for order & tracking lookup (below). Set `null` to disable the lookup flow |
| `notifyEndpoint` | — | `portalBase + 'api/notify-handoff'` | POST endpoint for team handoff notifications (below). Set `null` to disable |
| `showInEmbed` | `data-embed="show"` | hidden | Show the widget inside `?embed` iframes |
| `beam` | `data-beam` | `'input'` | Border Beam target: `'input'` (composer field), `'panel'` (whole window), or `false` to disable |
| `beamVariant` | `data-beam-variant` | `'colorful'` | Beam palette: `'colorful'` (full spectrum) or `'ember'` (Aquafire fire palette) |
| `mount` | `data-mount` | unset | CSS selector (or element) to render the panel into, instead of the corner launcher |

### Inline mount

Set `mount` to a selector and the widget renders its panel inside that
container instead of floating in the corner. The launcher bubble, the nudge
teaser and the mobile full-screen takeover all switch off; the host owns
showing and sizing the container.

```js
window.AQUAFIRE_ASSISTANT_CONFIG = { mount: '#heroChatMount', beam: false };
```

Drive it through `window.AquafireAssistant`:

| Call | Does |
|---|---|
| `.open()` | Open the panel (greets if the transcript is empty) |
| `.ask(text)` | Open and send `text` as if the visitor typed it |
| `.close()` | Close it |
| `.reset()` | Clear the conversation |
| `.isOpen()` / `.root()` | State, and the mounted element for styling/measuring |

Calls made before the widget finishes loading are queued, so a host never has
to wait for it. When the visitor closes the panel from its own header or with
Escape, the widget fires a bubbling `aquafire:close` event so the host can
collapse its container.

The panel drops its own background and chrome when inline and inherits the
host's `--afa-*` tokens, so restyling it is a matter of rebinding those on the
container. One exception: `.afa-head` has a hardcoded gradient rather than a
token, so override it directly if the host's surface is not dark.

`index.html` is the first consumer &mdash; its hero composer expands in
place into this panel.

### Border Beam

The composer field carries an animated full-spectrum beam (a trimmed inline
port of `beam.css` — the widget ships as one script tag, so it can't link an
external stylesheet). It brightens and spins faster while Ember is generating a
reply, so it doubles as a live activity indicator alongside the typing dots.

Set `beam: 'panel'` to rim the whole chat window instead, or `beam: false` to
turn it off. `beamVariant: 'ember'` narrows the palette to the brand reds and
ambers. The orbit runs at a deliberate 4s so it stays ambient rather than
pulling the eye off the conversation.

The effect needs `@property` + `mask-composite`; where either is missing it
is skipped entirely and the widget is unaffected. `prefers-reduced-motion`
holds the beam lit but static.

---

## Claude-powered answers (`api/chat.js`)

Questions the local KB can't match are sent to the portal's own serverless function,
**`/api/chat`** (`api/chat.js` — deployed automatically by Vercel with the rest of the
repo; zero dependencies, so no package.json/build step is introduced). It answers with
the Claude API (`claude-opus-4-8`), grounded in the product facts baked into the
function **plus team-added knowledge from the `chatKnowledge` Firestore collection**
(see "Teach Ember" below). The local KB still answers common questions instantly and
is the automatic fallback if the function errors, times out, or isn't configured.

**To activate AI mode (one-time):**

1. Get an Anthropic API key at platform.claude.com (Settings → API keys).
2. Vercel → `luminabrands-projects/aquafire-portal` → **Settings → Environment
   Variables** → add `ANTHROPIC_API_KEY` (Production), then **Redeploy** the latest
   deployment so the function picks it up. (The legacy name `chatbotshopify` is
   also accepted — that's what the key was originally saved as in this project.)

Until the key is set, `/api/chat` returns 503 and the widget silently uses the local
KB — nothing breaks. The key lives only in Vercel; never put it in client code.

Function behavior: CORS-restricted to aquafire.app / aquafire.com / the project's
Vercel previews; basic per-instance rate limiting (12 req/min/IP); 10-turn history
window; refusal-safe; prompt caching on the system prompt (typical reply costs a few
cents). For heavier abuse protection, enable Vercel's WAF/rate limiting.

## Order & tracking lookup (`api/order-status.js`)

When a customer asks "where's my order?", Ember collects their **order number and
the email used at checkout**, POSTs them to **`/api/order-status`**
(`api/order-status.js` — a second zero-dependency Vercel function), and shows a
status card: fulfillment state, items, ship-to city, and a tracking button per
shipment. The function queries the Shopify Admin GraphQL API server-side; the
Shopify token never reaches the browser.

**To activate (one-time):**

1. In the Shopify **Dev Dashboard**, create an app (choose **"Start from Dev
   Dashboard"** — not the CLI, which scaffolds a full hosted app you don't
   need). Name it e.g. *Ember AI Chat*.
2. Scopes: **`read_orders,read_all_orders`** — `read_all_orders` (lookups on
   orders older than 60 days) is only valid *alongside* `read_orders`, never
   alone (the scope box shows red otherwise). `read_orders` by itself is fine
   for a 60-day window. **Release** the version.
3. **Install the app on the store**, then open the app's **Settings** page and
   copy its **Client ID** and **Client secret**. (Dev Dashboard apps don't
   show a static "Admin API access token" — the function exchanges these
   credentials for short-lived tokens itself and renews them automatically.)
4. Vercel → `luminabrands-projects/aquafire-portal` → **Settings → Environment
   Variables** → add `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`
   (Production + Preview), then **Redeploy**. The secret lives only in
   Vercel — never in client code or chat.

(A static token from a legacy admin custom app also works, as
`SHOPIFY_ORDERS_TOKEN` — it takes precedence when set.)

Until credentials are set, the endpoint returns 503 and Ember falls back to the
"check your account / email orders@" answer — nothing breaks.

**Security & privacy:**

- Data is returned **only when both the order number and email match** the order
  (order numbers are sequential — number alone would allow enumeration). A
  mismatch is indistinguishable from "not found".
- The response contains only customer-safe fields: status, items, tracking,
  city/state. No payment details, no full address.
- Stricter rate limit than chat (6 lookups/min/IP), same CORS allowlist.
- Chat telemetry logs the lookup **outcome only** (`found` / `not_found` /
  `error`) — and the widget masks email addresses out of every logged message,
  so no order numbers or emails ever land in `chatEvents`.

## Team handoff notifications (`api/notify-handoff.js`)

The first time a conversation shows a contact card (customer asked for a human,
hit a 👎 flow, or reached an escalation), the widget pings
**`/api/notify-handoff`**, which forwards a short summary to a chat webhook:
where they were, their model, their last few messages (emails masked), and a
link to Chat Insights for the full transcript. At most one notification per
conversation.

**To activate (one-time):**

1. In Slack: **Apps → Incoming Webhooks → Add** (or api.slack.com → Create app
   → Incoming Webhooks), pick the channel (e.g. `#ember-chat`), copy the
   webhook URL. (Any service accepting a `{ "text": ... }` POST works too.)
2. Vercel → **Settings → Environment Variables** → add `HANDOFF_WEBHOOK_URL`
   (Production + Preview) → **Redeploy**.

Until it's set, the endpoint 503s and the widget silently stops trying for the
page load — customers never see any of this.

## Abuse & cost controls (`api/_guard.js`)

All three functions share one guard. Two things it does:

**Origin enforcement.** A request whose `Origin` isn't one of ours —
`aquafire.app`, `aquafire.com`, a `*-luminabrands-projects.vercel.app` preview, or a
`*.myshopify.com` store domain — gets a `403`. Preflights are still answered
normally, so a browser on some other site sees a clean CORS failure and the
widget falls back to its local knowledge base. Set `ALLOW_DEV_ORIGINS=1` in a
preview environment to also accept `http://localhost:*` while developing.

Origin headers are trivially forged by anything that isn't a browser, so this is
a speed bump, not a boundary. The rate limits are the real control.

**Rate limits that survive cold starts.** Per-IP, per minute: 12 for
`/api/chat`, 6 for `/api/order-status`, 4 for `/api/notify-handoff`. Plus a
per-endpoint daily ceiling so that rotating IPs can't run up a Claude bill or
flood Slack: `CHAT_DAILY_CAP` (default 3000), `ORDER_LOOKUP_DAILY_CAP` (500),
`HANDOFF_DAILY_CAP` (300).

Counters live in Upstash Redis when configured, which is what makes them
meaningful across the several lambda instances Vercel runs concurrently:

1. [console.upstash.com](https://console.upstash.com) → create a free Redis
   database (pick a region near the functions).
2. Copy the **REST** URL and token into Vercel → **Settings → Environment
   Variables** as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   (Production + Preview) → **Redeploy**.

Without those variables the guard falls back to the original per-instance
in-memory counter — limits still apply, they're just weaker (each instance
counts separately, and the count resets on every cold start). The daily caps are
skipped entirely in that mode, since a per-instance global counter would be
meaningless. Redis errors fail open to the same fallback: a rate-limiter outage
must never take the customer-facing chat down with it.

### Alternative: self-hosted proxy

If you ever move the widget somewhere without the Vercel function, point
`AQUAFIRE_ASSISTANT_CONFIG.apiEndpoint` at any endpoint that speaks the same
contract — the original Cloudflare Worker example below still works.

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
- Water: the softer the better -- RO water or a whole-house softener is ideal
  (hard water's minerals scale up the mist makers). Vapor Pure softener must stay installed for warranty.
  Descale every ~3 months. Mist makers are wear parts (2,000-3,000 hrs, $81).
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
| `convo_start` | page, host, device, journey, product, cart | Logged with a visitor's **first message** (not on panel open, so browsing visitors don't create empty conversations; the insights list and CSV export also only include conversations with at least one `user_message`). Carries anonymous browsing context: device class, pages visited this session, the product page being viewed, and (on the Shopify storefront) cart contents — also fed to the AI and to handoff notifications. No PII. |
| `user_message` | text, intent (`fallback` = unanswered, `llm` = sent to AI) | Every customer message |
| `bot_reply` | text, intent | Every local-KB answer (so transcripts show both sides) |
| `feedback` | vote (`up`/`down`), intent | 👍/👎 tapped on an answer |
| `feedback_comment` | comment, intent | Optional "what went wrong" text after a 👎 |
| `handoff` | mode (support/sales/orders) | A contact card is shown |
| `llm_reply` / `llm_error` | text | AI-mode reply / endpoint failure |

Every event also carries a random per-session conversation id, timestamp, page, host,
and the customer's model (if known). No accounts, no cookies, no fingerprinting — the
only personal data is whatever the customer types.

### One-time setup: Firestore rules

The full ruleset for this project — `chatEvents`, `chatKnowledge`, and the rewards
`users` collection — lives in **[`docs/firestore-rules.md`](firestore-rules.md)**.
Copy it into the Firebase console (**aquafire-portal → Firestore → Rules**) and
**Publish**. In short: the widget writes anonymously (create-only, field-allowlisted,
size-capped); reads are limited to verified `@luminabrands.com` sign-ins — **not** just
any signed-in account, since rewards customers hold Firebase accounts in this project
too.

Until the rules are published, writes are silently rejected — the chat itself is never
affected (all telemetry is fire-and-forget). That doc also covers **App Check**, which
is what actually restricts telemetry writes to our own pages, and the retention note:
transcripts can contain customer-typed details, so treat logs as customer data and set a
Firestore TTL on the `ts` field (e.g. 180 days).

### Config

| Option | Default | Purpose |
|---|---|---|
| `telemetry: false` | on | Kill switch — nothing is logged |
| `firestore: {projectId, apiKey}` | portal's project | Log to a different Firebase project (`firestore: null` disables Firestore logging) |
| `logEndpoint: 'https://…'` | unset | Also POST each event (JSON) to any webhook — Zapier, a Worker, Gorgias, your warehouse |

### The improvement loop

Ember doesn't self-modify (by design — a brand voice shouldn't drift unsupervised).
It improves through a short human-in-the-loop cycle; 15 minutes a week is plenty:

1. **Teach Ember (no code):** in Chat Insights, every entry in "Top unanswered
   questions" has an **Answer** button — type the correct answer and save. It lands
   in the `chatKnowledge` Firestore collection and the AI uses it within ~5 minutes
   (the function caches knowledge briefly). Use **+ Add knowledge** for anything
   proactive (shipping policies, promos, new products); **Remove** retires stale
   entries. Everything here is customer-visible material — never secrets.
2. **Correct a bad answer:** every bot answer in a transcript has a **🔧 Correct this**
   button — it captures the question and what Ember said, and you write plain notes on
   what's actually correct (no need to draft customer copy). Saved as a `correction`
   in `chatKnowledge`; corrections **override everything else the AI knows** and are
   rephrased in Ember's own voice, never quoted. Note: if a *KB* answer (blue
   "KB · intent" label) keeps being wrong, the correction fixes the AI path but the
   instant answer comes from `INTENTS` in `assistant.js` — fix that copy too.
3. **Filter by 👎** → read the comment, then fix via a correction (AI answers) or the
   intent's copy in `assistant.js` (instant KB answers).
4. **Watch the handoff rate** → handoffs after an *answered* question usually mean the
   answer is right but incomplete — add the missing detail.
5. **Promote hot topics to instant answers:** questions that recur constantly deserve
   a keyword-matched intent in the `INTENTS` array in `assistant.js` — instant, free,
   and works even if the AI endpoint is down. Teach Ember is the fast path; intents
   are the optimized path.
6. **Baked-in facts:** the AI's core product facts live in `BASE_FACTS` in
   `api/chat.js` — update them when specs/pricing change, and keep the exported CSV
   as a regression set to spot-check answers after changes.
7. When Aquafire revises a source doc, update `docs/source-material/` and the
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
