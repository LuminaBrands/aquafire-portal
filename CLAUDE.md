# CLAUDE.md — Aquafire Portal

## Project Overview

Static documentation and tools portal for **Aquafire** fireplace products (by Lumina Brands). Dark-themed, mobile-responsive site with interactive calculators — no frameworks, no build tools, no runtime dependencies.

**Stack:** Vanilla HTML5 + CSS3 + JavaScript. Static files served directly from root.

## File Map

### Pages

| File | Purpose |
|------|---------|
| `index.html` | Landing hub — bento grid nav, model cards, section links |
| `aquafire-pro.html` | Comprehensive Pro model guide (specs, wiring, troubleshooting, video guide) — **largest page (~1,400 lines)** |
| `enclosure-guide.html` | Interactive enclosure dimension calculator with 3D isometric diagram |
| `water-care.html` | Water hardness lookup (ZIP code DB) and softener replacement calculator |
| `quick-start.html` | Model selection page linking to individual guides |
| `getting-started.html` | Placeholder — "coming soon" |
| `support.html` | Support hub — cards link to Troubleshooter + (stub) warranty/claims/FAQs |
| `troubleshoot.html` | **Interactive Troubleshooter** — model-aware guided decision-tree wizard |
| `chat-insights.html` | **Internal** chat-log dashboard for the Ember widget (Firebase-gated; not in nav) — transcripts, unanswered questions, 👍/👎 rates |

### Stylesheets

| File | Scope |
|------|-------|
| `hub.css` | **Shared** — site nav, footer, page headers, bento tiles, common components |
| `styles.css` | Enclosure guide — forms, SVG diagram, cards, step layout |
| `water-care-styles.css` | Water care — hardness scale, map tiles, calculator UI |
| `troubleshoot.css` | Troubleshooter — wizard cards, option buttons, breadcrumb, outcome/escalation styling |

### JavaScript

| File | Scope |
|------|-------|
| `app.js` | Enclosure guide — model data, dimension math, SVG/Canvas rendering, slider controls |
| `water-care-app.js` | Water care — 2,000+ ZIP code hardness DB, autocomplete, US map, replacement timeline |
| `troubleshoot.js` | Troubleshooter — `TREE` decision-tree data + wizard render/nav engine; `LINKS`/`VIDEOS` maps |
| `embed.js` | Strips nav/footer when page loaded in iframe (`?embed` query param) |
| `assistant.js` | **"Ember" AI chat widget** — self-contained (injects own CSS), embeddable on Shopify via one script tag; `INTENTS` knowledge base + Claude-API backend (`/api/chat` by default). See `docs/chat-assistant.md` |
| `api/chat.js` | **Vercel serverless function** for Ember's AI answers — Claude API (`claude-opus-4-8`), zero npm deps (raw fetch, keeps the repo build-free); grounded in `BASE_FACTS` + the `chatKnowledge` Firestore collection; needs `ANTHROPIC_API_KEY` env var in Vercel |
| `api/notify-handoff.js` | **Vercel serverless function** — relays Ember human-handoff alerts to a chat webhook (Slack incoming-webhook `{text}` shape); once per conversation, emails masked; needs `HANDOFF_WEBHOOK_URL` env var, 503s gracefully until set |
| `api/order-status.js` | **Vercel serverless function** for Ember's order & tracking lookup — Shopify Admin GraphQL proxy (`tryaquafire.myshopify.com`), zero npm deps; verifies order number + checkout email together, returns minimal safe fields; needs `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` env vars (Dev Dashboard app "Ember AI Chat", `read_orders` scope; tokens fetched via client-credentials grant and auto-renewed; legacy static `SHOPIFY_ORDERS_TOKEN` also accepted) — 503s gracefully until set (see `docs/chat-assistant.md`) |
| `api/_guard.js` | **Shared library** for the three functions above (underscore = not a route) — CORS **and** origin enforcement (403 on a missing/foreign `Origin`), plus rate limiting that survives cold starts via Upstash Redis REST (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`), falling back to the old per-instance counter when unset |

### Config

| File | Purpose |
|------|---------|
| `vercel.json` | Security headers only (no routing/build config) — CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`; plus `noindex` + `X-Frame-Options: DENY` + `no-store` on the two internal pages and `/api/*` |
| `robots.txt` | Keeps `chat-insights.html`, `dealer-admin.html`, and `/api/` out of search indexes |

### Docs

| Path | Contents |
|------|----------|
| `docs/source-material/` | Plain-text extracts of the Aquafire help-center articles, install/spec guides, warranty, and manuals the Troubleshooter tree is built from (+ `README.md` index) |
| `docs/chat-assistant.md` | Chat widget docs — Shopify install, config options, optional Claude-API proxy example, KB maintenance rules |
| `docs/firestore-rules.md` | **Source of truth for the Firestore security rules** (`users` / `chatEvents` / `chatKnowledge`) — they're published by hand in the Firebase console, so update this file in the same PR; also covers App Check and the rewards-points limitation |

## Architecture

```
Root (flat — no subdirectories)
├── Shared: hub.css, embed.js
├── Landing: index.html
├── Product Guide: aquafire-pro.html (self-contained CSS/JS inline)
├── Enclosure Tool: enclosure-guide.html + styles.css + app.js
├── Water Care Tool: water-care.html + water-care-styles.css + water-care-app.js
├── Troubleshooter: troubleshoot.html + troubleshoot.css + troubleshoot.js
├── Chat widget: assistant.js (self-contained — CSS injected; on all customer pages + embeddable on Shopify)
├── Source docs: docs/source-material/ (help-article / manual extracts)
└── Stubs: quick-start.html, getting-started.html, support.html
```

No build process. No package.json. No bundler. Edit files directly and deploy.

## Design System

### Colors (CSS custom properties in hub.css)

```
Backgrounds:   --bg: #121417 | --surface: #1b1e24 | --surface-alt: #22262e
Borders:        --border: #2c3038 | --border-warm: #3a3229
Text:           --text: #e4e5e9 | --text-muted: #878c99
Red (primary):  --red: #c0392b | --red-dark: #a93226 | --red-glow: rgba(192,57,43,0.15)
Amber:          --amber: #e8a838 | --amber-dim: #c78820
Blue:           --blue: #4da6e8 | --blue-dim: #2980b9
Ember:          --ember: #d45a20
Radius:         --radius: 14px | --radius-sm: 8px
```

### Typography

- **Headings:** Poppins (600, 700) via Google Fonts
- **Body:** Inter (400, 500, 600, 700) via Google Fonts

### Component Patterns

- **Bento tiles** (`.bento-tile`) — colored accent bar, hover glow, CTA arrow
- **Cards** (`.card`, `.hub-card`, `.model-card`, `.support-card`) — surface bg, border, radius
- **Site nav** (`.site-nav`) — sticky, backdrop-blur, hamburger on mobile
- **Buttons** (`.btn-primary`) — red with glow shadow
- **Accordions** — in aquafire-pro.html troubleshooting section (toggle via JS)

### Responsive Breakpoints

- `800px` — nav collapses to hamburger
- `700px` — grid shifts (2-col → 1-col)
- `600px` — compact mobile layout

## External Dependencies

- **Google Fonts** — Inter + Poppins (preconnected)
- **Shopify CDN** — product images and logo (`cdn.shopify.com/s/files/1/0671/5562/4256/`)
- **No JS libraries.** No analytics. No polyfills.

## Navigation Structure

All pages share the same nav bar (defined inline in each HTML file). Items are grouped into dropdowns (`.nav-drop` / `.nav-drop-btn` / `.nav-drop-menu`, styled in `hub.css` — CSS-only: hover/`:focus-within` on desktop, flattened into labeled groups in the mobile hamburger panel):

```
Home → Guides ▾ (Quick Start, Build Yours, Enclosure Guide) → Care ▾ (Water Care, Maintenance, Troubleshoot) → Find a Dealer → Support → Retail Site → Get Started (CTA)
```

The nav logo links to the portal homepage (`/`). **The prominent `.nav-cta` button is "Get Started" → `quick-start.html`** — the portal's job is to get customers reading, so the highlighted CTA points inward at the Quick Start guides, not at the store or the rewards programme (rewards is promoted by its homepage banner and the injected "Sign In" nav item instead). Selling is the secondary goal: the storefront (`https://www.aquafire.com`) is a plain nav item labelled **"Retail Site"**, sitting with the others just before the CTA. When a page inside a dropdown is active, its link gets `.active` and the parent `.nav-drop-btn` gets `.active` too.

`getting-started.html` is deliberately **not** in the nav — it's still a "coming soon" placeholder, and a "Getting Started" item next to the "Get Started" CTA reads as a duplicate. Don't re-add it until the page has real content.

On the `aquafire-pro.html` / `aquafire-original.html` guide pages, the Troubleshoot nav link carries a `?model=pro` / `?model=original` param so the wizard pre-selects that model (same pattern as the Enclosure Guide link there).

Footer "Guides" columns (most pages) and the homepage bento grid also link to the Troubleshooter.

## Key Conventions

- **No build step.** All changes are live immediately in source files.
- **Dark theme only.** No light mode toggle — everything uses the dark palette.
- **Inline styles in aquafire-pro.html.** That page has its own `<style>` block (~400 lines) since it was built as a self-contained guide. The other tools use separate CSS files.
- **Nav is duplicated** across all HTML files (no templating). When changing nav links, update every page.
- **Model data lives in `app.js`** as the `MODELS` object — Original, Pro, Lite each with 3 sizes (18", 24", 30"/36"). Update there for spec changes.
- **Water hardness DB is in `water-care-app.js`** — `WATER_HARDNESS_DB` array of `[zip_prefix, city, state, ppm]` tuples.
- **Embed mode:** Append `?embed` to any page URL to hide nav/footer (for Shopify iframe embedding). The Troubleshooter wizard lives in `<main>` so it survives embed mode.
- **SVG diagrams** are generated in JS via string concatenation (app.js `drawCutoutDiagram` and isometric renderer).
- **Fractions** are displayed as proper fractions (e.g., 14 1/8") via `toFrac()` in app.js.
- **Chat widget lives in `assistant.js`** — one file, no separate CSS (styles are injected, `afa-` prefixed, so it can be dropped into the Shopify theme with a single script tag). Answers come from the `INTENTS` array; product cards/prices from the `PRODUCTS` map (Shopify snapshots — cards link to live pages); video links mirror `VIDEOS` in `troubleshoot.js`. It's included before `</body>` on every customer-facing page (not `dealer-admin.html`), hides itself under `?embed`, and facts must trace to `docs/source-material/`. Optional Claude backend via `AQUAFIRE_ASSISTANT_CONFIG.apiEndpoint` (`docs/chat-assistant.md`).
- **assistant.js must stay pure-ASCII in string literals** (`\uXXXX` escapes for emoji/typography) — it's served to third-party pages (Shopify) whose charset headers we don't control; raw UTF-8 strings mojibake there. Comments may be UTF-8.
- **Chat telemetry** — the widget logs anonymous events (messages + matched intent, fallbacks, 👍/👎 + comments, handoffs) to the `chatEvents` Firestore collection in the same `aquafire-portal` Firebase project the rewards system uses; reviewed in `chat-insights.html`. Requires the Firestore rule in `docs/chat-assistant.md`; disable with `AQUAFIRE_ASSISTANT_CONFIG.telemetry = false`.
- **Chat AI mode** — unmatched questions POST to `/api/chat` (`api/chat.js` — deployed by Vercel automatically, no package.json). Team-editable knowledge lives in the `chatKnowledge` Firestore collection, managed via the "Teach Ember" flow in `chat-insights.html`; the function caches it ~5 min. The widget falls back to the local `INTENTS` KB whenever the endpoint errors (`llmDown` per page load).
- **Chat order lookup** — the `order_status` intent runs a guided flow (order # + checkout email → POST `/api/order-status` → status card with tracking links). Both values must match the order server-side; telemetry logs outcomes only and masks emails out of all logged text. Falls back to the account-page/orders@ answer when the endpoint 503s (`orderDown` per page load) or `orderEndpoint` is null.
- **Troubleshooter decision tree lives in `troubleshoot.js`** as the `TREE` object — a map of `nodeId → node`. Nodes are either `question` (prompt + options/quickPicks) or `outcome` (steps, caution, video, article links, escalation). Model-specific copy uses functions that receive the model id (`'pro' | 'original' | 'lite' | 'unknown'`). `app_entry` is a `router` node that resolves Pro → `app_connect`, others → `app_not_pro`. URL params: `?model=pro|original|lite` pre-selects the model; `?node=<id>` deep-links a node (useful for support emails). Resource URLs are in the `LINKS` map; **how-to video URLs are TODO placeholders in the `VIDEOS` map** — until filled in, the tool shows a "video coming soon" chip. When the underlying help articles change, update the tree and the matching file in `docs/source-material/`.
- **Impeccable design skill** — `.claude/skills/impeccable/` (compiled bundle from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)) gives Claude Code the `/impeccable` design commands (`craft`, `shape`, `audit`, `critique`, `polish`, `init`, …). `.claude/settings.json` wires its hook: deterministic design-quality checks after UI file edits + a deep pass on Stop. Run `/impeccable init` once before a big design pass so it generates project design context; update the skill with `npx impeccable update`. Personal overrides go in `.claude/settings.local.json` (gitignored).

## Development History

This portal evolved through iterative Claude Code sessions:

1. **Foundation** — Enclosure dimension calculator with SVG cutout diagrams, later restyled with Aquafire red branding
2. **Water care tool** — ZIP code hardness database, US map visualization, replacement timeline calculator
3. **Hub & navigation** — Bento grid homepage, model cards, shared nav/footer across all pages
4. **Aquafire Pro guide** — Comprehensive product page with specs, video guide, troubleshooting accordions, hub dashboard redesign
5. **Embed support** — iframe-friendly mode for Shopify integration
6. **Product images** — Shopify CDN integration for model cards and accessories
7. **AR Cutout Visualizer** — Camera overlay tool (built → iterated → removed; browser-based AR without depth sensing was unreliable)
8. **Interactive Troubleshooter** — Model-aware guided decision-tree wizard (`troubleshoot.html`), built from the Aquafire help-center articles + 2026 install/spec guides + warranty + manuals (extracts archived in `docs/source-material/`). Endpoints offer inline step-by-step fixes, how-to-video slots (TODO URLs), help-article links, and an escalate-to-support block.
9. **"Ember" AI chat widget** — Gorgias-style customer-service + pre-sale chat bubble (`assistant.js`), self-contained for one-tag embedding on aquafire.com (Shopify). Local intent-matching KB (models/pricing/install/water care/warranty/troubleshooting with guided model→symptom flow, product cards from live store data, human handoff) + optional Claude-API proxy mode (`docs/chat-assistant.md`).

## Security

Everything in the repo root is publicly served at `https://aquafire.app/<filename>` —
Vercel serves the tree flat, and the custom domain is exempt from the project's Vercel
SSO protection (which only covers `*.vercel.app` preview URLs). **A file committed here
is a published file, whether or not anything links to it.** Never commit business
exports, dashboards, snapshots, or customer data.

- **The two internal pages are gated in the browser** (`chat-insights.html`,
  `dealer-admin.html`): Firebase Auth, verified `@luminabrands.com` only. Rewards
  customers hold accounts in the same Firebase project, so `request.auth != null` /
  "is signed in" is never a sufficient check — always test the email domain.
  `dealer-admin.html` gates the *editing tool*; `dealers.js` itself is public data that
  powers the customer-facing locator.
- **Firestore rules are the real access control** for anything in Firebase, and they
  live in the console, not the repo — `docs/firestore-rules.md` is the source of truth.
- **The `api/*` functions enforce their origin and rate-limit through `api/_guard.js`.**
  Use `cors(req, res)` + `throttle(req, bucket, perIpPerMin, dailyCap)` in any new
  function rather than rolling per-file copies. Origin headers are spoofable, so the
  rate limits (and the daily caps: `CHAT_DAILY_CAP`, `ORDER_LOOKUP_DAILY_CAP`,
  `HANDOFF_DAILY_CAP`) are what actually bound cost and abuse.
- **Customer-supplied text must be escaped before `innerHTML`** — `mdLite()` in
  `assistant.js` (escape-then-linkify, so AI/LLM output can't inject markup) and `esc()`
  in `chat-insights.html` (transcripts are attacker-controlled input to an admin page).

## Gotchas

- **CSP will block new external resources.** `vercel.json` pins the allowlist
  (`www.gstatic.com` + `apis.google.com` for Firebase, `unpkg.com` for Leaflet,
  `fonts.googleapis.com`/`fonts.gstatic.com`, `cdn.shopify.com`, Carto/OSM tiles,
  `nominatim.openstreetmap.org`). Adding a CDN script, font, image host, or `fetch()`
  target means adding it there too, or it silently fails in production only.
- **Nav duplication:** There's no shared template. Changing navigation means editing ~13 HTML files (and several have a footer "Guides" column too).
- **aquafire-pro.html is large** (~1,400 lines with inline CSS/JS). Read specific sections rather than the whole file. It still has its own in-page category-accordion troubleshooting section (`TS_DATA` / `ALERTS_DATA`) — that's separate from the standalone Troubleshooter; the new tool didn't replace it.
- **styles.css is enclosure-specific** despite the generic name. Shared styles are in `hub.css`.
- **troubleshoot.css uses theme tokens with fallbacks** (e.g. `var(--blue, #4da6e8)`) — the per-page inline `:root` blocks only define a subset of the tokens listed in the Design System section, so the CSS can't rely on `--blue`/`--amber`/`--surface-alt` being present everywhere.
- **No local dev server configured.** Open files directly or use any static server (`python -m http.server`, etc.).
- **Images are all on Shopify CDN** — no local image assets in the repo.
