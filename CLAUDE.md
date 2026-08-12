# CLAUDE.md — Aquafire Portal

## Project Overview

The **Interactive Aquafire Guide** (`aquafire.app`) — static documentation and tools portal for **Aquafire** fireplace products (by Lumina Brands). Vanilla HTML5 + CSS3 + JavaScript, dual dark/light theme, mobile-responsive. **No build step, no package.json, no bundler** — the repo root is served flat by Vercel; edit files directly and deploy. Serverless functions in `api/` are the only server-side code (zero npm deps, raw `fetch`).

How the site evolved and why settled decisions went the way they did: `docs/history.md`. Don't re-litigate decisions recorded there (retired AR visualizer, nav grouping, the beam `rim` size, `getting-started.html`) without reading it.

## File Map

### Customer pages

| File | Purpose |
|------|---------|
| `index.html` | Landing hub — hero photo + inline Ember chat, rewards band, three intent routes, fleet row. **Token source of truth for the redesign** |
| `aquafire-pro.html` / `aquafire-original.html` | Model guides (specs, wiring, troubleshooting, video). Pro is the **largest page (~1,400 lines, self-contained inline CSS/JS)**; both use the committed `tour-*.svg` diagrams |
| `quick-start.html` | Model selection — the site's "getting started" entry point |
| `enclosure-guide.html` | Dimension calculator + isometric cutout diagram + Installer Field Notes accordion (`#field-notes`). "Print spec sheet" = `@media print` in `styles.css`; app.js fills `#print-summary` and swaps to light theme on `beforeprint` (guarded restore on `afterprint`) — browser save-as-PDF is the PDF path |
| `water-care.html` | Water hardness lookup (ZIP DB) + softener replacement calculator |
| `maintenance.html` | Preventative-maintenance checklists (quarterly mist-maker clean, six-month flush) — see Conventions |
| `troubleshoot.html` | Interactive model-aware decision-tree Troubleshooter |
| `help.html` | Help Center — article library (`help.js` engine + `help-articles.js` data + Firestore merge). Docs: `docs/help-center.md` |
| `rewards.html` | Rewards programme page — tiers and earning modules |
| `dealer-locator.html` | Find a Dealer map (Leaflet + Carto/OSM tiles), powered by the public `dealers.js` |
| `share-install.html` | Photo submission → Firebase Storage (`installs/<uid>/`), awards the 500-pt `share-install` reward. Needs `docs/storage-rules.md` published |
| `support.html` | Support hub — links Troubleshooter + storefront warranty (awards `register-warranty` on click-through); claims/FAQs cards are still `#` stubs |
| `builder.html` | **Parked** configurator (`builder.css`/`builder.js`) — placeholder pricing, unlinked, noindexed. Keep its `MODELS` table in step with `app.js`, but don't build features here without a decision to revive (`docs/history.md`) |

### Internal pages (noindexed, not in nav)

| File | Purpose |
|------|---------|
| `admin.html` | Admin homepage — launcher cards for the three gated tools (no gate of its own; holds no data) |
| `chat-insights.html` | Chat-log dashboard for Ember (Firebase-gated) — transcripts, unanswered questions, 👍/👎, "Teach Ember" flow. Its Test Chat button mounts the real widget in test trim: telemetry/Slack/Mailchimp/nudge off, AI endpoint live |
| `dealer-admin.html` | Dealer editor (Firebase-gated) — Save & Publish via `/api/publish-dealers`. Runbook: `docs/dealer-admin.md` |
| `help-admin.html` | Help-article editor (Firebase-gated) — markdown-lite editor writing to the `helpArticles` collection |
| `beam-demo.html` | Border Beam showcase/playground (`docs/border-beam.md`) |
| `compare.html`, `ember-icon-lab.html`, `image-options.html` + `v1/–v5/`, `v4a/–v4e/`, `mix1/–mix6/`, `b1/–b3/`, `tools/shoot/` | Redesign exploration comps, icon/imagery pickers, comp gallery, screenshot harness. Icon lab is delete-when-decided |

### Stylesheets

| File | Scope |
|------|-------|
| `redesign.css` | **Shared design system** — dual-theme token bindings (`:root[data-theme]`), glass primitives (`.cap`, `.orb`, conic rim), nav bar/capsule, page frame, `.row`/`.rows`/`.minis`. Loaded by **every customer page** |
| `hub.css` | **Pre-redesign shared layer (2025 palette)** — now loaded only by the four admin pages |
| `admin-theme.css` | Admin light theme — rebinds the admin pages' 2025 tokens for `data-theme="light"`, patches hub.css literals. Toggle + persistence live in `admin-nav.js`; the `aquafire-theme` storage key is shared with the customer portal |
| `styles.css` | **Enclosure guide only**, despite the generic name |
| `water-care-styles.css` / `troubleshoot.css` / `help.css` / `builder.css` | Per-tool styles (help is `ha-` prefixed) |
| `rewards.css` | Auth modal, profile dropdown, points toast, badges — runs on redesign tokens (`docs/history.md` for the retoning) |
| `beam.css` | Border Beam (`.af-beam`) — opt-in; loaded by `index.html` + `beam-demo.html` (`docs/border-beam.md`) |

### JavaScript

| File | Scope |
|------|-------|
| `app.js` | Enclosure guide — `MODELS` data, dimension math, SVG/Canvas rendering, sliders |
| `water-care-app.js` | Water care — `WATER_HARDNESS_DB` (2,000+ `[zip_prefix, city, state, ppm]` tuples), autocomplete, US map, timeline |
| `troubleshoot.js` | Troubleshooter — `TREE` decision-tree data + wizard engine; `LINKS`/`VIDEOS` maps |
| `help.js` / `help-articles.js` | Help Center engine + static catalogue (`HELP_CATEGORIES` ×6, `HELP_ARTICLES` ×29); published `helpArticles` Firestore docs merge over it at load, same-slug docs override |
| `nav.js` | **Shared** nav group disclosures (Guides/Support) for all nav-bearing pages; each page's inline script still owns theme toggle + burger |
| `rewards.js` | Firebase Auth + Firestore points engine; injects reward badges as first child of `[data-reward]` |
| `dealers.js` | **Public** dealer database + `COLORS` — powers the customer locator; rebuilt server-side by `/api/publish-dealers` |
| `assistant.js` | **"Ember" chat widget** — self-contained single file (CSS injected, `afa-` prefixed), embeddable on Shopify with one script tag. Docs: `docs/chat-assistant.md` |
| `admin-nav.js` | Shared admin header (deliberately pre-redesign look, so admin reads as a different surface) — nav links, per-page frontend action, auth-aware sign in/out, light/dark toggle. One `<script defer>` per admin page; each page keeps its own sign-in gate |
| `embed.js` | Strips chrome when a page loads in an iframe (`?embed`) — see Gotchas |
| `beam.js` | Border Beam controller — `docs/border-beam.md` |

### API (Vercel serverless, `api/`)

| File | Purpose |
|------|---------|
| `chat.js` | Ember's AI answers — Claude API (`claude-opus-4-8`), grounded in `BASE_FACTS` + the `chatKnowledge` Firestore collection (~5 min cache). Needs `ANTHROPIC_API_KEY` |
| `order-status.js` | Order lookup (order # + checkout email must both match server-side) → status card with tracking links |
| `notify-slack.js` | Slack-alerts Ember's dead ends to `#chat-insights-feeback` — needs `SLACK_WEBHOOK_URL`, 503s gracefully until set |
| `collect-email.js` | Stores chat follow-up emails in Mailchimp — idempotent upsert, `status_if_new` only (never re-subscribes an unsubscribed member). Needs `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID`, 503s until set |
| `publish-dealers.js` | Dealer Save & Publish — verifies the Firebase ID token server-side (verified `@luminabrands.com` only), validates records, rebuilds `dealers.js` itself and commits via the GitHub Contents API. Needs `GITHUB_DEALERS_TOKEN` (fine-grained PAT); runbook `docs/dealer-admin.md` |
| `_guard.js` | **Shared library** (underscore = not a route) — CORS + origin enforcement (403 on missing/foreign `Origin`) + rate limiting via Upstash Redis REST (falls back to per-instance counters when unset) |

### Config & docs

- `vercel.json` — security headers only (CSP, COOP, etc.); `noindex`/`X-Frame-Options: DENY`/`no-store` on the internal pages, `noindex` on parked `builder.html` and `/api/*`. Dealer-admin's block additionally allows `nominatim.openstreetmap.org` in `connect-src`.
- `robots.txt` — keeps the internal pages, `builder.html`, and `/api/` out of indexes.
- `DESIGN.md` + `.impeccable/design.json` — the carbonized redesign contract (tokens, world, glass recipe).
- `PRODUCT.md` — impeccable product schema.
- `docs/` — `history.md` (decision record), `help-center.md`, `chat-assistant.md`, `embedding.md`, `dealer-admin.md`, `border-beam.md`, `firestore-rules.md` + `storage-rules.md` (**source of truth for the hand-published Firebase rules** — update in the same PR as any rule change), `redesign-handoff.md`, `source-material/` (plain-text extracts of the help articles, install/spec guides, warranty and manuals that the Troubleshooter, chat KB and help articles are built from).
- Committed assets: `model-pro/original/lite.jpg`, `install-example.jpg`, `ember-mark.png`, favicons, `tour-*.svg`, `AWPR 40-100.pdf`. Everything else is on the Shopify CDN — see Gotchas.

## Design System

- **Token source of truth: `redesign.css`** (with `DESIGN.md`) — "Hero Bleed × Dual Theme". Both themes bind to `:root[data-theme]`; every page carries the tiny head script that applies the persisted `aquafire-theme` localStorage choice (shared portal ↔ admin). The rollout of the shared layer is complete: all customer pages load `redesign.css`; only the four admin pages remain on `hub.css` (2025 palette: `--bg #121417`, `--surface #1b1e24`, `--red #c0392b`, `--amber #e8a838`, `--blue #4da6e8`, `--ember #d45a20`), patched by `admin-theme.css` for light. Redesign contract and remaining work: `docs/redesign-handoff.md`.
- **Typography:** Poppins (headings, 600/700) + Inter (body) via Google Fonts.
- **Breakpoints (redesigned nav):** capsule ↔ burger at **760px**; points chip appears at 920px. Legacy hub.css pages break at 800/700/600px.

## Navigation

One glass capsule, identical on all nav-bearing pages:

```
[brand] │ Set Up · Guides ▾ · Support ▾ │ Rewards <pts> · ☰ · ☀

Guides: Product Guide · Enclosure Guide · Water Care · Preventative Maintenance
Support: Troubleshoot · Help Center · Find a Dealer · Warranty/Register* · Rewards · Service Request* · Contact Us*   (* = storefront)
```

- **Nav markup is duplicated across ~13 HTML files — no template.** Changing nav links means editing every page (several have a footer "Guides" column too). `nav.js` owns only the group disclosures, shared so behaviour can't drift; theme toggle + burger stay inline per page.
- Groups open on **click, not hover** (touch). Inside the burger panel the groups are always-open labelled sections, not nested popovers (`.links.open .navgroup-btn` becomes a heading, loses pointer events).
- Current page: `class="is-here" aria-current="page"`, and its group button takes `is-here` too. `support.html` and `share-install.html` have no nav entry and mark nothing.
- Adding an item inside a group costs no bar width; adding a *group* costs ~85px — re-measure the 760px breakpoint then (comment in `redesign.css`).
- On the two guide pages, the in-page Enclosure Guide link carries `?model=pro|original` so the tool pre-selects. This has never applied to nav links.

## Key Conventions

### Enclosure math (load-bearing)

- **Model data lives in `MODELS` in both `app.js` and `builder.js` — same table, move them together.** Original, Pro, Lite × 20"/40"/60" singles, plus ganged runs on Pro and Original.
- **Ganged runs are sizes, not a mode** — 80"/100"/120" entries sit in `sizes` with a `units: [40, 40]`-style array; downstream code reads `dims.w` as usual. **The Lite cannot be ganged** (`docs/source-material/page-compare-vs-aquafire.txt`) — that's why `renderSizeOptions()` rebuilds the size `<select>` per model (static options are only the no-JS fallback). A run is **one continuous cutout**: the ⅜″ clearance is split across the two outside edges, nothing between butted units, so a run is nominal + ⅜″ like a single; `drawCutoutDiagram` draws one box per unit with the seam marked.
- **Cutout widths are nominal + ⅜″ of clearance in total — not per side, and deliberately ⅛″ wider than the 2026 spec sheets' + ¼″** (installer recommendation; full story and the per-side misreading it must guard against: `docs/history.md`). Copy must say "in total" or "⅜″ over nominal", never a bare "+ ⅜″". The source material still says + ¼″ — **that divergence is intentional, not an error to fix.** Depth and height are the published figures. The guide shows the published minimum alongside (`#published-w`, `dims.w − 0.125`), `#faq-framing` explains it, and the chat states it in the `sizes`/`enclosure` intents and `BASE_FACTS`.
- Fractions display as proper fractions (14 1/8") via `toFrac()` in app.js.
- **SVG diagrams are string-built in JS** (`drawCutoutDiagram` isometric, `drawLightDiagram` light-trap cross-section). The light-trap drawing has no inline colors — everything resolves through `.ld-*` classes in `styles.css` (scoped `--ld-*` tokens, dual-bound) so it follows theme switches without a redraw. Keep new diagram elements on classes, not inline colors.

### Ember chat widget (`assistant.js` + `api/chat.js`) — details in `docs/chat-assistant.md`

- **"Ember" is internal-only — the name must never reach a customer.** The widget presents as **Chat** ("Aquafire support · online"). `api/chat.js`'s `BASE_FACTS` opens by telling the model it has no name/persona and must not introduce itself — **that instruction is load-bearing** (the LLM will otherwise invent an identity).
- **`assistant.js` string literals must stay pure-ASCII** (`\uXXXX` escapes for emoji/typography) — it's served to Shopify pages whose charset we don't control; raw UTF-8 mojibakes. Comments may be UTF-8.
- **`INTENTS` (local KB) and `BASE_FACTS` (`api/chat.js`) must move together** — a fact in only one is a fact the customer gets half the time. Rewards numbers must track `rewards.js` `REWARDS` and the tiers on `rewards.html`. Facts must trace to `docs/source-material/` or the live help center.
- **`ember-mark.png` lives in two places — move together:** `redesign.css` `.orb` (portal) and the `afa-` avatars in `assistant.js` (widget). In `assistant.js` the URL is built with `pURL()` off `PORTAL_BASE` and overridable via `cfg.markUrl`/`data-mark-url` — a bare relative path would resolve against the Shopify origin and 404. The artwork carries its own modelling: outer lift shadow only, never an inset.
- **Greeting by time of day exists twice on purpose** — `dayPart()` in `assistant.js` and an inline copy in `index.html`'s hero (bands: <5 & ≥21 tonight, 5–11 morning, 12–16 afternoon, 17–20 evening). `assistant.js` can't share a helper with the portal (single-tag Shopify embed). The hero's static `<h1>` is the no-JS fallback.
- Included before `</body>` on every customer page (not `dealer-admin.html`); hides itself under `?embed`.
- **Telemetry** → `chatEvents` Firestore collection (rules in `docs/firestore-rules.md`); disable with `AQUAFIRE_ASSISTANT_CONFIG.telemetry = false`. Emails are masked out of all logged text — **the one consented exception** is the `callback` alert / `contact_left` event's dedicated address field, captured by the follow-up email ask (once per conversation, `state.emailAsked`). The ask is conversational: the customer types the address as their next message (`state.ctx.awaiting = 'contact_email'` in `handleUserText`), asked *before* the contact card on handoff, invited under the reply after a dead end — no form, no skip link. The `email` field must stay in the `chatEvents` allowlist. Emails are stored via `/api/collect-email` → Mailchimp.
- **Handoff routing:** contact cards are addressed by conversation topic — `support@` for help with an owned fireplace, `ces@` for existing orders, placing an order, and everything else (`ROUTE_TOPIC` / `handoffAnswer` in `assistant.js`; `BASE_FACTS` carries the same routing). A handoff with no topic on record asks which team first (four quick picks); the footer "Talk to a human" link starts this in-chat flow, not a mailto. `sales@` survives only in design-review copy (send drawings).
- **Slack alerts:** dead ends, contact cards, and follow-up emails POST to `/api/notify-slack` (handoffs once per conversation). `api/chat.js` detects "I don't know" replies via an `[[UNRESOLVED]]` marker it strips before returning `{ reply, unresolved }`. Unset webhook → 503 → widget stops trying for that page load.
- **Fallbacks:** unmatched questions go to `/api/chat`; any endpoint error falls back to the local `INTENTS` KB (`llmDown` per page load). Order lookup (`order_status` intent → `/api/order-status`) falls back to the account-page/ces@ answer (`orderDown`).
- **Inline mount:** `AQUAFIRE_ASSISTANT_CONFIG.mount = '<selector>'` renders into a container (launcher/nudge/takeover off); `window.AquafireAssistant` (`open/ask/close/reset/isOpen/root`) drives it, calls queued before load; closing fires a bubbling `aquafire:close`. Widget runs on `--afa-*` tokens; an inline host rebinds `--afa-bg`/`--afa-head-bg` **and must include a `:root[data-theme="light"]` selector** or the panel goes opaque on theme switch (see `index.html`, the first consumer — hero composer expands into `#heroChatMount`, chips seed via `data-ask`, no-JS form submits to `support.html`).
- **`index.html` sets `AQUAFIRE_ASSISTANT_CONFIG.beam = false` in a head script — load-bearing, don't drop** (the hero composer already beams; the widget must not beam there too).

### Border Beam — details in `docs/border-beam.md`

- **Two implementations move together:** `beam.css`/`beam.js` (opt-in; `index.html` + `beam-demo.html`) and the trimmed inline copy in `assistant.js`. Changing the look means editing both.
- **Colour priority (standing rule): red/orange dominant, then blue/magenta, then green** — enforced by blob *area*, not count (currently 49/35/16; documented in `beam.css`).
- In `assistant.js`, feature-detect with `window.CSS` (its `var CSS` shadows the global). The `#fff` literals in beam CSS are mask stencils, not palette colors.

### Other page systems

- **Maintenance checklists are the page's state and reward hook:** one `aquafire-maint` localStorage record (per-procedure ticks + last-completed timestamp); progress bar, stamp, and "Next due / Due now" pills all derive from it (cadence 3/6 months). Completing awards `mist-maker` (250) / `system-cleaning` (300). A due procedure clears its ticks on load but keeps the date. `rewards.js` injects badges as first child of `[data-reward]` — here the disclosure button, so the header orders it explicitly.
- **Help articles:** static catalogue in `help-articles.js`; published `helpArticles` Firestore docs merge over it at load, same-slug docs override built-ins without a deploy. Copy follows the chat guardrails (no "Ember", ⅜″-total language, prices only as store links, facts traceable). Maintenance doc: `docs/help-center.md`; rules hand-published per `docs/firestore-rules.md`.
- **Troubleshooter:** `TREE` in `troubleshoot.js` (`nodeId → node`; `question` or `outcome` nodes; model-specific copy via functions taking `'pro'|'original'|'lite'|'unknown'`; `app_entry` is a router node). URL params `?model=` pre-selects, `?node=` deep-links (useful in support emails). Resource URLs in `LINKS`; **`VIDEOS` URLs are TODO placeholders** ("video coming soon" chip until filled). When help articles change, update the tree and the matching `docs/source-material/` file.
- **Embed mode:** `?embed` hides nav/footer for Shopify iframes (`?embed&theme=light` for light); the Troubleshooter wizard lives in `<main>` so it survives. Details, measured heights, and why rewards pages must not be embedded: `docs/embedding.md`.
- **Impeccable design skill:** `.claude/skills/impeccable/` provides `/impeccable` commands; `.claude/settings.json` wires its hooks (design checks after UI edits + deep pass on Stop). Run `/impeccable init` before a big design pass; update with `npx impeccable update`. Personal overrides in `.claude/settings.local.json` (gitignored).

## Security

Everything in the repo root is publicly served at `https://aquafire.app/<filename>` — Vercel serves the tree flat, and the custom domain is exempt from Vercel SSO (which only covers `*.vercel.app` previews). **A file committed here is a published file, whether or not anything links to it.** Never commit business exports, dashboards, snapshots, or customer data.

- **The three internal tools are gated in the browser** (`chat-insights.html`, `dealer-admin.html`, `help-admin.html`): Firebase Auth, verified `@luminabrands.com` only. Rewards customers hold accounts in the **same** Firebase project, so `request.auth != null` / "is signed in" is **never** sufficient — always test the email domain. The browser gate is UX; for dealer publishing the boundary is server-side: `/api/publish-dealers` re-verifies the ID token + domain (identitytoolkit `accounts:lookup`) before committing. **Copy that pattern for future privileged endpoints** instead of trusting a page gate. (`dealers.js` itself is public data.)
- **Firestore rules are the real access control** for anything in Firebase; they live in the console, not the repo — `docs/firestore-rules.md` is the source of truth and must be updated in the same PR as any rule change.
- **New `api/` functions must use `api/_guard.js`** — `cors(req, res)` + `throttle(req, bucket, perIpPerMin, dailyCap)`, no per-file copies. Origin headers are spoofable; the rate limits and daily caps (`CHAT_DAILY_CAP`, `ORDER_LOOKUP_DAILY_CAP`, `ALERT_DAILY_CAP`, `DEALER_PUBLISH_DAILY_CAP`) are what actually bound cost and abuse.
- **Escape customer-supplied text before `innerHTML`** — `mdLite()` in `assistant.js` (escape-then-linkify, so LLM output can't inject markup) and `esc()` in `chat-insights.html` (transcripts are attacker-controlled input to an admin page).

## Gotchas

- **CSP blocks new external resources.** `vercel.json` pins the allowlist (gstatic/apis.google.com for Firebase, unpkg.com for Leaflet, Google Fonts, Shopify CDN, Carto/OSM tiles, nominatim). A new CDN script, font, image host, or `fetch()` target must be added there too, or it silently fails **in production only**.
- **`embed.js` names the chrome by class** — it removes `.bar`/`.phead`/`.pfoot` (plus the pre-redesign `.site-nav`/`.page-header`/`.site-footer` that `dealer-admin.html` still uses). Rename a chrome element → rename it here, and actually load `?embed` to verify; a mismatch is invisible otherwise and once went unnoticed through a full rollout (`docs/history.md`).
- **`aquafire-pro.html` is ~1,400 lines** — read specific sections. Its in-page category-accordion troubleshooting (`TS_DATA`/`ALERTS_DATA`) is separate from the standalone Troubleshooter; the tool didn't replace it.
- **`styles.css` is enclosure-specific** despite the name; shared styles are in `redesign.css` (customer) / `hub.css` (admin).
- **`troubleshoot.css` uses theme tokens with fallbacks** (`var(--blue, #4da6e8)`) — per-page `:root` blocks define only a subset of tokens, so CSS can't rely on every token being present.
- **No local dev server configured** — open files directly or use any static server (`python -m http.server`).
- **Committed images are lifestyle photographs, not transparent cutouts** — display with `object-fit: cover` + a radius, never `contain` + drop-shadow. The repo is not an asset pipeline: new imagery goes on the Shopify CDN unless there's a reason not to (`docs/history.md`).
