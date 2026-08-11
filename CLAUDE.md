# CLAUDE.md — Aquafire Portal

## Project Overview

The **Interactive Aquafire Guide** (`aquafire.app`) — static documentation and tools portal for **Aquafire** fireplace products (by Lumina Brands). Dark-themed, mobile-responsive site with interactive calculators — no frameworks, no build tools, no runtime dependencies.

**Stack:** Vanilla HTML5 + CSS3 + JavaScript. Static files served directly from root.

## File Map

### Pages

| File | Purpose |
|------|---------|
| `index.html` | Landing hub — hero photo + inline Ember chat, rewards status band, three swipeable intent routes (Explore / Set up / Fix), then an "explore by model" fleet row |
| `aquafire-pro.html` | Comprehensive Pro model guide (specs, wiring, troubleshooting, video guide) — **largest page (~1,400 lines)** |
| `enclosure-guide.html` | Interactive enclosure dimension calculator with 3D isometric diagram, plus the **Installer Field Notes** accordion (`#field-notes`) — exclusive `<details>` panels covering framing, downdrafts, venting, the light trap, ganged runs, the tape-seal method and design review. "Print spec sheet" produces an installer hand-off via `@media print` in `styles.css`: app.js fills `#print-summary` and swaps to the light theme on `beforeprint` (guarded restore on `afterprint`), so the browser's save-as-PDF is the PDF path — no dependency |
| `water-care.html` | Water hardness lookup (ZIP code DB) and softener replacement calculator |
| `maintenance.html` | Preventative maintenance — the quarterly mist-maker clean and the six-month full system flush, each a persisted step checklist that stamps a completion date, derives the next due date from it, and awards the `mist-maker` / `system-cleaning` rewards |
| `quick-start.html` | Model selection page linking to individual guides — also the site's "getting started" entry point since the placeholder page was retired |
| `share-install.html` | Photo submission — uploads one install shot to Firebase Storage (`installs/<uid>/`) and awards the 500-point `share-install` reward. Needs Storage enabled + the rules in `docs/storage-rules.md` |
| `support.html` | Support hub — cards link to the Troubleshooter and the storefront warranty page (which awards the 300-point `register-warranty` reward on click-through); the claims and FAQs cards are still `#` stubs |
| `troubleshoot.html` | **Interactive Troubleshooter** — model-aware guided decision-tree wizard |
| `help.html` | **Help Center** — browsable/searchable help-article library (`help.css` + `help.js` engine + `help-articles.js` data; published `helpArticles` Firestore docs merge over the static catalogue at load). See `docs/help-center.md` |
| `help-admin.html` | **Internal** article editor for the Help Center (Firebase-gated, verified `@luminabrands.com` only; not in nav) — markdown-lite editor + preview writing to the `helpArticles` collection; drafts, publish, and same-slug overrides of built-in articles |
| `chat-insights.html` | **Internal** chat-log dashboard for the Ember widget (Firebase-gated; not in nav) — transcripts, unanswered questions, 👍/👎 rates |
| `builder.html` | **Parked** (`builder.css` / `builder.js`) — seven-step "Build Your Fireplace" configurator: model, size, AquafireBox-or-site-built enclosure, setbacks, accessories, then a summary card, with state in the URL hash. Arrived in the 2026-06-01 bulk upload and was never finished: `PRICING` is `$X,XXX` placeholders and `SHOPIFY_URLS` are `#`. Unlinked, `Disallow`ed in `robots.txt` and `noindex`ed in `vercel.json` (Aug 2026) so the placeholder pricing can't be indexed |
| `beam-demo.html` | **Internal** showcase for the Border Beam effect (`beam.css`/`beam.js`) — live playground, all sizes/variants, usage snippet (noindex; not in nav) |

### Stylesheets

| File | Scope |
|------|-------|
| `hub.css` | **Shared** — site nav, footer, page headers, bento tiles, common components |
| `styles.css` | Enclosure guide — forms, SVG diagram, cards, step layout |
| `water-care-styles.css` | Water care — hardness scale, map tiles, calculator UI |
| `troubleshoot.css` | Troubleshooter — wizard cards, option buttons, breadcrumb, outcome/escalation styling |
| `help.css` | Help Center — search capsule, category tiles, article prose/tables/callouts (`ha-` prefixed, redesign tokens with fallbacks) |
| `beam.css` | **Border Beam** — animated border-glow effect (`.af-beam`); opt-in, loaded by `index.html` + `beam-demo.html` |

### JavaScript

| File | Scope |
|------|-------|
| `app.js` | Enclosure guide — model data, dimension math, SVG/Canvas rendering, slider controls |
| `water-care-app.js` | Water care — 2,000+ ZIP code hardness DB, autocomplete, US map, replacement timeline |
| `troubleshoot.js` | Troubleshooter — `TREE` decision-tree data + wizard render/nav engine; `LINKS`/`VIDEOS` maps |
| `help.js` | Help Center engine — home/category/article views, `?category=`/`?article=` deep links, client-side search, and the published-`helpArticles` Firestore merge (same-slug docs override the static catalogue) |
| `help-articles.js` | Help Center data — `HELP_CATEGORIES` (6) + `HELP_ARTICLES` (29); schema + copy rules in its header and `docs/help-center.md` |
| `embed.js` | Strips nav/footer when page loaded in iframe (`?embed` query param) |
| `assistant.js` | **"Ember" AI chat widget** — self-contained (injects own CSS), embeddable on Shopify via one script tag; `INTENTS` knowledge base + Claude-API backend (`/api/chat` by default). See `docs/chat-assistant.md` |
| `beam.js` | **Border Beam** controller — injects the bloom layer, auto-detects the wrapped child's radius, drives activate/deactivate; pairs with `beam.css` |
| `api/chat.js` | **Vercel serverless function** for Ember's AI answers — Claude API (`claude-opus-4-8`), zero npm deps (raw fetch, keeps the repo build-free); grounded in `BASE_FACTS` + the `chatKnowledge` Firestore collection; needs `ANTHROPIC_API_KEY` env var in Vercel |
| `api/notify-slack.js` | **Vercel serverless function** that Slack-alerts Ember's dead ends to `#chat-insights-feeback` — unanswered questions, AI "I don't know" replies, AI outages, human handoffs, and follow-up email capture; handoffs once per conversation, emails masked (except the `callback` alert's consented address); needs `SLACK_WEBHOOK_URL` env var, 503s gracefully until set |
| `api/collect-email.js` | **Vercel serverless function** that stores chat follow-up emails in Mailchimp — idempotent upsert (md5-keyed) + `chat-follow-up` tag; `status_if_new` only, so an unsubscribed member is never re-subscribed; needs `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` env vars, 503s gracefully until set |
| `api/publish-dealers.js` | **Vercel serverless function** behind dealer-admin's Save & Publish — verifies the caller's Firebase ID token server-side (identitytoolkit `accounts:lookup`, verified `@luminabrands.com` only), validates every dealer record, rebuilds `dealers.js` itself (never commits client-built text; `COLORS` is pinned in the function) and commits it to the repo's default branch via the GitHub Contents API, so Vercel redeploys it live. Needs a fine-grained PAT in `GITHUB_DEALERS_TOKEN`; 503s (and the admin page falls back to download) until set. Setup/runbook: `docs/dealer-admin.md` |
| `api/_guard.js` | **Shared library** for the API functions above (underscore = not a route) — CORS **and** origin enforcement (403 on a missing/foreign `Origin`), plus rate limiting that survives cold starts via Upstash Redis REST (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`), falling back to the old per-instance counter when unset |

### Config

| File | Purpose |
|------|---------|
| `vercel.json` | Security headers only (no routing/build config) — CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`; plus `noindex` + `X-Frame-Options: DENY` + `no-store` on the three internal pages (`chat-insights` + `help-admin` share a block; dealer-admin's own block additionally allows `nominatim.openstreetmap.org` in `connect-src` for its geocode helper), `noindex` on the parked `builder.html`, and `noindex` + `no-store` on `/api/*` |
| `robots.txt` | Keeps `chat-insights.html`, `dealer-admin.html`, `help-admin.html`, the parked `builder.html`, and `/api/` out of search indexes |

### Docs

| Path | Contents |
|------|----------|
| `docs/source-material/` | Plain-text extracts of the Aquafire help-center articles, install/spec guides, warranty, and manuals the Troubleshooter tree is built from (+ `README.md` index) |
| `docs/help-center.md` | **Help Center docs** — architecture, where each article's content came from, the `helpArticles` Firestore merge/override rules, team-authoring flow, and the copy guardrails |
| `docs/chat-assistant.md` | Chat widget docs — Shopify install, config options, optional Claude-API proxy example, KB maintenance rules |
| `docs/embedding.md` | Putting a portal page in an iframe on the store — the `?embed` / `?theme=` params, measured page heights, the allowed `frame-ancestors` origins, and why third-party storage means the theme must be passed explicitly (and why rewards pages should not be embedded) |
| `docs/storage-rules.md` | **Source of truth for the Firebase Storage rules** — same hand-published arrangement as the Firestore ones; covers the `installs/` path, the size and content-type limits, and what must be switched on before `share-install.html` works |
| `docs/firestore-rules.md` | **Source of truth for the Firestore security rules** (`users` / `chatEvents` / `chatKnowledge`) — they're published by hand in the Firebase console, so update this file in the same PR; also covers App Check and the rewards-points limitation |
| `docs/dealer-admin.md` | Dealer publishing setup & runbook — the fine-grained GitHub PAT (`GITHUB_DEALERS_TOKEN`), the smoke test that commits nothing, the failure-mode table, the pinned-`COLORS` caveat, and how to switch publishing to PR-mode later |

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
└── Stubs: support.html (partial)
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

All pages share the same nav bar (defined inline in each HTML file). It is one
glass capsule holding a link and two group disclosures, plus a single end chip,
identical on all 13 nav-bearing pages:

```
[brand] │ Set Up · Guides ▾ · Support ▾ │ Rewards <pts> · ☰ · ☀
```

```
Guides                        Support
  Product Guide                 Troubleshoot
  Enclosure Guide               Help Center
  Water Care                    Find a Dealer
  Preventative Maintenance      Warranty / Register  (storefront)
                                Rewards
                                Service Request      (storefront)
                                Contact Us           (storefront)
```

Grouping was tried and dropped once (#82, #91) when the bar held its
destinations flat and dropdowns only added a click. It earns its place now that
Support alone holds six items, four of them off-site — a flat bar cannot carry
eleven destinations.

`nav.js` owns the group disclosures and is **shared, not inlined**: the nav
markup is already duplicated across 13 files with no template, and 13 copies of
the same behaviour is how copies drift. Each page's own inline script still owns
the theme toggle and the burger. Groups open on click, not hover — hover menus
are unreachable on touch and the capsule is the same markup on both.

The current page carries `class="is-here" aria-current="page"`, and its group
button takes `is-here` too so the collapsed bar still says where you are.
`support.html` and `share-install.html` have no nav entry of their own and mark
nothing.

**Inside the burger panel the groups are not popovers** — they are labelled,
always-open sections (`.links.open .navgroup-btn` becomes a section heading and
loses pointer events). A disclosure nested in a disclosure is two taps to reach
a link that has room to simply be there.

Breakpoints: the capsule and burger swap at **760px** (down from 1080 — the
capsule is 256px wide now against 653 for the old six flat links, so iPad
portrait gets the real nav), and the points chip appears at 920px. The dealer
chip is gone; Find a Dealer is a Support item. **Adding an item inside a group
costs no bar width** — that is the point of grouping. Adding a *group* costs
~85px; re-measure then (see the breakpoint comment in `redesign.css`).

`getting-started.html` no longer exists. It was a permanent "coming soon" that
dead-ended the setup route; Quick Start covers that ground, and "Set Up" now
points there.

On the `aquafire-pro.html` / `aquafire-original.html` guide pages, the in-page
Enclosure Guide link carries a `?model=pro` / `?model=original` param so the
tool pre-selects that model. (This has never applied to the nav, despite an
earlier note here claiming the Troubleshoot nav link carried it too.)

Footer "Guides" columns (most pages) and the homepage bento grid also link to
the Troubleshooter.

## Key Conventions

- **No build step.** All changes are live immediately in source files.
- **Dark theme only.** No light mode toggle — everything uses the dark palette.
- **Inline styles in aquafire-pro.html.** That page has its own `<style>` block (~400 lines) since it was built as a self-contained guide. The other tools use separate CSS files.
- **Nav is duplicated** across all HTML files (no templating). When changing nav links, update every page.
- **Model data lives in `app.js`** as the `MODELS` object — Original, Pro, Lite each with the three single sizes (20"/40"/60"), plus the ganged runs on the Pro and Original. Update there for spec changes.
- **Ganged runs are sizes, not a mode.** 80" (two 40"), 100" (60" + 40") and 120" (two 60") sit in `MODELS[...].sizes` alongside the singles, carrying a `units: [40, 40]` array; everything downstream (cutout numbers, Quick Reference, the isometric) reads `dims.w` as before. **The Lite has no ganged entries on purpose** — it is the one model that can't be ganged (`docs/source-material/page-compare-vs-aquafire.txt`), which is why the Enclosure Guide's size `<select>` is rebuilt per model by `renderSizeOptions()` rather than being static markup; the three options in the HTML are only the no-JS fallback. A run is **one continuous cutout** — the ⅜″ of total clearance is split across the two outside edges, nothing between the butted units, so a run is the same nominal + ⅜″ as a single — and `drawCutoutDiagram` draws one box per unit above it with the seam marked. `builder.js` mirrors the same table for parity but its own size step is singles-only — and the Builder is parked (see the File Map), so keep the tables in step but don't build features there without a decision to revive it.
- **Water hardness DB is in `water-care-app.js`** — `WATER_HARDNESS_DB` array of `[zip_prefix, city, state, ppm]` tuples.
- **Embed mode:** Append `?embed` to any page URL to hide nav/footer (for Shopify iframe embedding). The Troubleshooter wizard lives in `<main>` so it survives embed mode.
- **SVG diagrams** are generated in JS via string concatenation (app.js — `drawCutoutDiagram`'s isometric cutout and `drawLightDiagram`'s 2D light-trap cross-section). The light-trap drawing carries no colors of its own: every fill/stroke resolves through the `.ld-*` classes in `styles.css` (scoped `--ld-*` tokens, dual-bound dark/light), so it follows the theme switch without a redraw — keep new diagram elements on classes, not inline colors.
- **Fractions** are displayed as proper fractions (e.g., 14 1/8") via `toFrac()` in app.js.
- **Chat widget lives in `assistant.js`** — one file, no separate CSS (styles are injected, `afa-` prefixed, so it can be dropped into the Shopify theme with a single script tag). Answers come from the `INTENTS` array; product cards/prices from the `PRODUCTS` map (Shopify snapshots — cards link to live pages); video links mirror `VIDEOS` in `troubleshoot.js`. It's included before `</body>` on every customer-facing page (not `dealer-admin.html`), hides itself under `?embed`, and facts must trace to `docs/source-material/`. Optional Claude backend via `AQUAFIRE_ASSISTANT_CONFIG.apiEndpoint` (`docs/chat-assistant.md`).
- **assistant.js must stay pure-ASCII in string literals** (`\uXXXX` escapes for emoji/typography) — it's served to third-party pages (Shopify) whose charset headers we don't control; raw UTF-8 strings mojibake there. Comments may be UTF-8.
- **Ember's face is `ember-mark.png`, in two places.** The mark (white twin-flame glyph on an orange-to-red disc, 256×256) replaced the hand-rolled `radial-gradient` orb + inline `FLAME_SVG` everywhere Ember appears. `redesign.css` `.orb` covers the portal (hero greeting + the three `.tip` orbs on `index.html`); `assistant.js` covers the widget (`.afa-avatar`, `.afa-mini-avatar`, `.afa-nudge-avatar`, `.afa-launcher .afa-ico-flame`). **Both have to move together** — same standing rule as the beam. In `assistant.js` the URL is built with `pURL()` off `PORTAL_BASE` (the script's own directory) and overridable via `cfg.markUrl` / `data-mark-url`: a bare relative path there would resolve against the Shopify store's origin and 404. The artwork carries its own modelling, so nothing is layered inside it and `--orb-shadow` is an outer lift only — the old inset would double-darken the disc. It reads cleanly down to 26px and softens at the 22px `.tip` size, which is `aria-hidden` decoration.
- **Chat telemetry** — the widget logs anonymous events (messages + matched intent, fallbacks, 👍/👎 + comments, handoffs) to the `chatEvents` Firestore collection in the same `aquafire-portal` Firebase project the rewards system uses; reviewed in `chat-insights.html`. Requires the Firestore rule in `docs/chat-assistant.md`; disable with `AQUAFIRE_ASSISTANT_CONFIG.telemetry = false`.
- **Chat follow-up email capture** — on a handoff the widget asks for an email **before** showing the contact card (`renderEmailAsk` in `assistant.js` holds the card message back until the customer submits or hits the "No thanks" skip link); after a dead end the form renders under the reply instead. Once per conversation, gated by `state.emailAsked`; disable with `AQUAFIRE_ASSISTANT_CONFIG.collectEmail = false`. Submitting fires the `callback` Slack alert (the address rides a dedicated field, unmasked), logs a `contact_left` telemetry event — **the one consented exception to the "no customer emails in telemetry" rule**; the incidental-email masks on `text`/`comment` and on all other alert kinds stay in force — and stores the address in **Mailchimp** via `/api/collect-email` (`cfg.emailEndpoint`, `null` to disable storage alone). Chat Insights tags identified conversations with the address. The `email` field must stay in the `chatEvents` allowlist in `docs/firestore-rules.md` (hand-published — republish in the console when it changes).
- **The maintenance checklists are the page's state, and its reward hook.** `maintenance.html` keeps one `aquafire-maint` localStorage record — per-procedure ticks plus the timestamp of the last completed run — and everything visible is derived from it: the progress bar, the completion stamp, and the "Next due / Due now" pill on the schedule cards (cadence is 3 and 6 months). Finishing a checklist is what awards `mist-maker` (250) and `system-cleaning` (300); both sat in `REWARDS` with nothing on the site awarding them, the same way `contact-sales` still does. A procedure that has come due clears its own ticks on load but keeps the date, so the card can still report the last clean. `rewards.js` injects its badge as the first child of `[data-reward]`, which here is the disclosure button — the header orders it explicitly.
- **"Ember" is an internal name only — it must never reach a customer.** The widget presents itself as **Chat** (`<h3>Chat</h3>` / "Aquafire support · online"), the launcher says "Chat with us", and nothing in customer-facing copy names a persona or says "Hi, I'm …". The code, the CSS tokens (`--ember`), `ember-mark.png`, `chat-insights.html`'s "Teach Ember" flow and these docs all keep the name; it is the product's internal identity, not its voice. `api/chat.js`'s `BASE_FACTS` opens by telling the model it has no name and no persona and must not introduce itself — **that instruction is load-bearing**, because the LLM path will otherwise invent an identity when a customer asks who it is.
- **The chat greets by time of day.** "How can I help you this morning / this afternoon / this evening / tonight?" — bands are <5 and >=21 tonight, 5-11 morning, 12-16 afternoon, 17-20 evening. It exists **twice on purpose**: `dayPart()` in `assistant.js` and an inline copy in `index.html` for the hero heading. `assistant.js` ships to Shopify as a single script tag and cannot share a helper with the portal. The hero's static `<h1>` is the no-JS fallback and must stay readable on its own.
- **Ember knows the portal.** `INTENTS` carries a `rewards` intent (the programme: 18 modules, 4,600 points, six tiers from 600), a `share_install` intent, a `downdraft` intent (enclosure sealing / the tape fallback / Direct Plumb Kit installs, mirrored in `BASE_FACTS`), and a `portal_tools` intent that lists every customer-facing page with links. `api/chat.js`'s `BASE_FACTS` carries the same page map and rewards facts, so the LLM path answers them too rather than falling back. **Both copies have to move together** -- the local KB answers matched questions and the API answers the rest, and a fact in only one of them is a fact the customer gets half the time. The rewards numbers must track `rewards.js` `REWARDS` and the tiers on `rewards.html`.
- **Cutout widths carry ⅜″ of clearance in total — nominal + ⅜″, not the published + ¼″.** On the install crews' recommendation (Aug 2026, `docs/source-material/note-installer-field-tips.txt`), the portal's own figure is ⅛″ wider overall than the 2026 spec sheets: the insert seats without being forced, air keeps moving around the internals, and light strips/fans aren't compressed during install. **The ⅜″ is the total across the opening — always including the two (all) outside edges — and that distinction is load-bearing.** The figure has flip-flopped: first published as ⅜″ overall, then rewritten as ⅜″ *per side* (nominal + ¾″) on a misreading, then corrected back to ⅜″ total by Stefan (Aug 2026) — so copy must say "in total" or "⅜″ over nominal", and warn against the per-side reading, never a bare "+ ⅜″" with no convention stated. **It is also a deliberate divergence from the source material** — `docs/source-material/guide-aquafire-*-specs-install-2026.txt` still says + ¼″, and that is not an error to "fix". It lives in `MODELS` in **both `app.js` and `builder.js`** (same table, move them together), so the Enclosure Guide, its Quick Reference table and the Fireplace Builder all agree. Depth and height are the published figures. The guide shows the published minimum alongside (`#published-w`, `dims.w - 0.125`) so a spec-sheet reader can see why the numbers differ, the `#faq-framing` panel explains it, and the chat says so in the `sizes` + `enclosure` intents and `BASE_FACTS`.
- **Chat Slack alerts** — whenever Ember can't answer (no intent match + AI unavailable, an AI reply flagged `unresolved`, or `/api/chat` failing), shows a contact card, or collects a follow-up email (the `callback` kind), the widget POSTs to `/api/notify-slack` (`api/notify-slack.js`), which relays a Block Kit card to `#chat-insights-feeback` via the `SLACK_WEBHOOK_URL` incoming webhook (shared `api/_guard.js` for CORS + rate limiting, customer emails masked everywhere except the `callback` alert's consented address field, handoffs capped at one per conversation). Unset webhook → 503 → the widget stops trying for that page load; disable client-side with `AQUAFIRE_ASSISTANT_CONFIG.notifyEndpoint = null`. `api/chat.js` detects "I don't know" replies by asking the model to append an `[[UNRESOLVED]]` marker, which it strips before returning `{ reply, unresolved }`. Docs: `docs/chat-assistant.md`.
- **Chat AI mode** — unmatched questions POST to `/api/chat` (`api/chat.js` — deployed by Vercel automatically, no package.json). Team-editable knowledge lives in the `chatKnowledge` Firestore collection, managed via the "Teach Ember" flow in `chat-insights.html`; the function caches it ~5 min. The widget falls back to the local `INTENTS` KB whenever the endpoint errors (`llmDown` per page load).
- **Chat order lookup** — the `order_status` intent runs a guided flow (order # + checkout email → POST `/api/order-status` → status card with tracking links). Both values must match the order server-side; telemetry logs outcomes only and masks emails out of all logged text. Falls back to the account-page/orders@ answer when the endpoint 503s (`orderDown` per page load) or `orderEndpoint` is null.
- **Help articles live in `help-articles.js` plus the `helpArticles` Firestore collection.** The static catalogue ships in the repo; team-authored docs saved as published in `help-admin.html` merge over it at load, and a doc with a built-in slug overrides that article without a deploy. Article copy follows the same guardrails as the chat ("Ember" never customer-facing, ⅜″-total cutout language, prices only as store links, facts traceable to `docs/source-material/` or the live help center) — `docs/help-center.md` is the maintenance doc. The `helpArticles` rules live in `docs/firestore-rules.md` and must be hand-published in the console.
- **Troubleshooter decision tree lives in `troubleshoot.js`** as the `TREE` object — a map of `nodeId → node`. Nodes are either `question` (prompt + options/quickPicks) or `outcome` (steps, caution, video, article links, escalation). Model-specific copy uses functions that receive the model id (`'pro' | 'original' | 'lite' | 'unknown'`). `app_entry` is a `router` node that resolves Pro → `app_connect`, others → `app_not_pro`. URL params: `?model=pro|original|lite` pre-selects the model; `?node=<id>` deep-links a node (useful for support emails). Resource URLs are in the `LINKS` map; **how-to video URLs are TODO placeholders in the `VIDEOS` map** — until filled in, the tool shows a "video coming soon" chip. When the underlying help articles change, update the tree and the matching file in `docs/source-material/`.
- **Ember can mount inline.** `AQUAFIRE_ASSISTANT_CONFIG.mount = '<selector>'` renders the panel into that container instead of the corner launcher (launcher, nudge and mobile takeover all switch off), and `window.AquafireAssistant` (`open` / `ask` / `close` / `reset` / `isOpen` / `root`) drives it; calls before load are queued. Closing from the panel's own header or Escape fires a bubbling `aquafire:close` so the host can collapse its container. `index.html` is the first consumer: its hero composer is a real `<form>` that expands in place into `#heroChatMount` (`.greet.is-chatting` folds the orb/greeting/chips away and grows `.hero-chat`), the murmur chips seed the conversation via `data-ask` instead of navigating, and without JS the form still submits to `support.html`. Ember owns the conversation; the page owns only the expand/collapse. `assistant.js` now runs on the same tokens as `redesign.css` (`--afa-*`, dark by default with a `:root[data-theme="light"] .afa-root` binding), so an inline host only has to rebind what its own container provides -- `--afa-bg` and `--afa-head-bg`. Note the light block out-specifies a plain `.host .afa-root` override, so a host must list a `:root[data-theme="light"]` selector too or the panel turns opaque when the page switches (see `index.html`).
- **Border Beam lives in `beam.css` + `beam.js`** — a vanilla port of the `border-beam` npm package (MIT), rebuilt as plain CSS because the portal has no React/build step. Wrap anything in `<div class="af-beam" data-beam-size="md" data-beam-variant="colorful">`; children render untouched, so the effect is purely additive and degrades to a plain container without JS. Sizes `sm | md | line | pulse-inner | pulse-outside`, variants `ember | colorful | ocean | sunset | mono` (`colorful` is the default; `ember` is the on-brand fire palette and tightens the hue cycle to 10deg so reds don't drift magenta). **Beam colour priority (standing rule for any future palette work): red/orange dominant, then blue/magenta, then green.** It is enforced by weight, not by count — colours are assigned to blobs by area, so moving a colour to a different `--afb-*` index changes its weight; the split is documented in `beam.css` and currently splits 49/35/16 by blob area. Note `sm`/`md` sweep a conic gradient, which parameterises by angle rather than arc length, so on a very wide element the beam crawls the long edges and moves fast across the short ends. An `offset-path` `rim` size that travelled by arc length was tried and removed — the even travel was correct but the look wasn't what the effect is after; the diffuse conic glow is the wanted character. The orbit runs at a deliberate 4s — the package's stock 1.96s pulls the eye off the content the beam is meant to frame. Needs `@property` + `mask-composite`; `beam.js` feature-gates and no-ops on older browsers. Beams pause when scrolled offscreen, and `prefers-reduced-motion` freezes them lit rather than hiding them. **`beam.css`/`beam.js` are opt-in.** Loaded by `beam-demo.html` and by `index.html`, where the hero composer is wrapped in `.composer-beam.af-beam` at `size="md"` (the composer spends both its own pseudo-elements on the glass rim and hover underline, so the beam needs the wrapper) and `data-beam-theme` is synced to the page theme by the existing toggle script. The Ember chat widget is the one live consumer, but it does *not* use these files: `assistant.js` inlines its own trimmed copy under the `afa-` namespace (it ships as a single script tag on Shopify and can't link a stylesheet), applied to the composer field and brightened while Ember is generating. Toggle with `AQUAFIRE_ASSISTANT_CONFIG.beam` = `'input' | 'panel' | false` and `.beamVariant` = `'colorful' | 'ember'`. **`index.html` sets `beam = false`** in a head script: its hero composer already beams and is the page's primary action, so the widget must not beam there too. `index.html` now loads `assistant.js` and mounts Ember inline in the hero, so that head script is load-bearing — **don't drop it.** **Changing the beam look means editing both places.** Note `assistant.js` declares its own `var CSS` (the stylesheet string), which shadows the global `CSS` object — feature detection there must use `window.CSS`. The `#fff` literals in the CSS are mask stencils (alpha channels), not palette colors — impeccable's `design-system-color` rule flags them as false positives.
- **Impeccable design skill** — `.claude/skills/impeccable/` (compiled bundle from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)) gives Claude Code the `/impeccable` design commands (`craft`, `shape`, `audit`, `critique`, `polish`, `init`, …). `.claude/settings.json` wires its hook: deterministic design-quality checks after UI file edits + a deep pass on Stop. Run `/impeccable init` once before a big design pass so it generates project design context; update the skill with `npx impeccable update`. Personal overrides go in `.claude/settings.local.json` (gitignored).
- **`rewards.css` runs on the redesign tokens.** The auth modal, profile dropdown, points toast and reward badges were hard-pinned to the 2025 palette (Poppins, `#1b1e24`, `#e8a838`, `#c0392b`) with no theme binding, so the sign-in dialog rendered dark over a light page. All of it is tokenised now. Three tokens were added to `redesign.css` for it: `--scrim` (the only token that stays dark in light theme -- it is a dimmer, not a surface), `--modal-shadow`/`--dropdown-shadow` (neutral elevation), and `--danger` (form errors, deliberately not ember). Overlay surfaces take the near-opaque `--menu-bg`, not a glass fill. Reward-badge ink is `--amber`, the one 2025 colour kept on purpose -- identical in dark, and it finally darkens in light.
- **Portal redesign (in progress, PR #66)** — the committed direction is `index.html` ("Hero Bleed × Dual Theme": liquid glass over a lobby photograph, dark/light theme switcher). It is the token source of truth, locked into `DESIGN.md` + `.impeccable/design.json`. Exploration comps live in `v1/–v5/`, `v4a/–v4e/`, `mix1/–mix6/`, `b1/–b3/` with the `compare.html` gallery (internal, noindex); screenshot harness in `tools/shoot/`. **Status, pending work, and environment learnings: `docs/redesign-handoff.md`** — read it before resuming redesign work. `index.html` is still the live homepage; rollout to the other pages has not started.

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

- **The three internal pages are gated in the browser** (`chat-insights.html`,
  `dealer-admin.html`, `help-admin.html`): Firebase Auth, verified `@luminabrands.com` only. Rewards
  customers hold accounts in the same Firebase project, so `request.auth != null` /
  "is signed in" is never a sufficient check — always test the email domain.
  `dealer-admin.html` gates the *editing tool*; `dealers.js` itself is public data that
  powers the customer-facing locator. Its Save & Publish flow, though, is enforced
  server-side: `/api/publish-dealers` re-verifies the Firebase ID token and the email
  domain before committing anything — the browser gate is UX, the API check is the
  boundary. It's the repo's first server-side ID-token check
  (identitytoolkit `accounts:lookup`); copy that pattern for future privileged
  endpoints instead of trusting the page gate.
- **Firestore rules are the real access control** for anything in Firebase, and they
  live in the console, not the repo — `docs/firestore-rules.md` is the source of truth.
- **The `api/*` functions enforce their origin and rate-limit through `api/_guard.js`.**
  Use `cors(req, res)` + `throttle(req, bucket, perIpPerMin, dailyCap)` in any new
  function rather than rolling per-file copies. Origin headers are spoofable, so the
  rate limits (and the daily caps: `CHAT_DAILY_CAP`, `ORDER_LOOKUP_DAILY_CAP`,
  `ALERT_DAILY_CAP`, `DEALER_PUBLISH_DAILY_CAP`) are what actually bound cost and abuse.
- **Customer-supplied text must be escaped before `innerHTML`** — `mdLite()` in
  `assistant.js` (escape-then-linkify, so AI/LLM output can't inject markup) and `esc()`
  in `chat-insights.html` (transcripts are attacker-controlled input to an admin page).

## Gotchas

- **CSP will block new external resources.** `vercel.json` pins the allowlist
  (`www.gstatic.com` + `apis.google.com` for Firebase, `unpkg.com` for Leaflet,
  `fonts.googleapis.com`/`fonts.gstatic.com`, `cdn.shopify.com`, Carto/OSM tiles,
  `nominatim.openstreetmap.org`). Adding a CDN script, font, image host, or `fetch()`
  target means adding it there too, or it silently fails in production only.
- **Nav duplication:** There's no shared template. Changing navigation means editing ~12 HTML files (and several have a footer "Guides" column too).
- **`embed.js` names the chrome by class, so renaming chrome breaks it silently.** It removes `.bar` / `.phead` / `.pfoot` (plus the pre-redesign `.site-nav` / `.page-header` / `.site-footer` that `dealer-admin.html` still uses). The redesign renamed all three and left this file on the old names, so `?embed` matched nothing and stripped nothing on every customer page from the rollout until 2026-08-05 — invisible unless you actually load `?embed`, which is why it survived a full rollout. Rename a chrome element, rename it here. Embeds take the light theme with `?embed&theme=light`.
- **aquafire-pro.html is large** (~1,400 lines with inline CSS/JS). Read specific sections rather than the whole file. It still has its own in-page category-accordion troubleshooting section (`TS_DATA` / `ALERTS_DATA`) — that's separate from the standalone Troubleshooter; the new tool didn't replace it.
- **styles.css is enclosure-specific** despite the generic name. Shared styles are in `hub.css`.
- **troubleshoot.css uses theme tokens with fallbacks** (e.g. `var(--blue, #4da6e8)`) — the per-page inline `:root` blocks only define a subset of the tokens listed in the Design System section, so the CSS can't rely on `--blue`/`--amber`/`--surface-alt` being present everywhere.
- **No local dev server configured.** Open files directly or use any static server (`python -m http.server`, etc.).
- **Most images are on the Shopify CDN; five are committed here.** `install-example.jpg` (homepage share module + `share-install.html`), `model-pro.jpg` / `model-original.jpg` / `model-lite.jpg` (the fleet cards on `index.html`, the tiles on `quick-start.html`, and the hero thumb on each guide page), and `ember-mark.png` (Ember's avatar — see the Ember mark note below). All five were supplied directly rather than uploaded to the store, and all were re-encoded on the way in — 8.0 MB of source PNG/JPEG became 1.0 MB, and the mark's own 1.7 MB 16-bit export became 42 KB. `img-src` allows `'self'`, so local files work, but the repo is not an asset pipeline: put new imagery on the CDN unless there's a reason not to. **The model shots are lifestyle photographs, not the old transparent cutouts** — anything showing them wants `object-fit: cover` and a radius, not `contain` with a drop-shadow.
