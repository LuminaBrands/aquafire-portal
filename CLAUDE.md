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
| `beam-demo.html` | **Internal** showcase for the Border Beam effect (`beam.css`/`beam.js`) — live playground, all sizes/variants, usage snippet (noindex; not in nav) |

### Stylesheets

| File | Scope |
|------|-------|
| `hub.css` | **Shared** — site nav, footer, page headers, bento tiles, common components |
| `styles.css` | Enclosure guide — forms, SVG diagram, cards, step layout |
| `water-care-styles.css` | Water care — hardness scale, map tiles, calculator UI |
| `troubleshoot.css` | Troubleshooter — wizard cards, option buttons, breadcrumb, outcome/escalation styling |
| `beam.css` | **Border Beam** — animated border-glow effect (`.af-beam`); opt-in, loaded by `index.html` + `beam-demo.html` |

### JavaScript

| File | Scope |
|------|-------|
| `app.js` | Enclosure guide — model data, dimension math, SVG/Canvas rendering, slider controls |
| `water-care-app.js` | Water care — 2,000+ ZIP code hardness DB, autocomplete, US map, replacement timeline |
| `troubleshoot.js` | Troubleshooter — `TREE` decision-tree data + wizard render/nav engine; `LINKS`/`VIDEOS` maps |
| `embed.js` | Strips nav/footer when page loaded in iframe (`?embed` query param) |
| `assistant.js` | **"Ember" AI chat widget** — self-contained (injects own CSS), embeddable on Shopify via one script tag; `INTENTS` knowledge base + Claude-API backend (`/api/chat` by default). See `docs/chat-assistant.md` |
| `beam.js` | **Border Beam** controller — injects the bloom layer, auto-detects the wrapped child's radius, drives activate/deactivate; pairs with `beam.css` |
| `api/chat.js` | **Vercel serverless function** for Ember's AI answers — Claude API (`claude-opus-4-8`), zero npm deps (raw fetch, keeps the repo build-free); grounded in `BASE_FACTS` + the `chatKnowledge` Firestore collection; needs `ANTHROPIC_API_KEY` env var in Vercel |

### Docs

| Path | Contents |
|------|----------|
| `docs/source-material/` | Plain-text extracts of the Aquafire help-center articles, install/spec guides, warranty, and manuals the Troubleshooter tree is built from (+ `README.md` index) |
| `docs/chat-assistant.md` | Chat widget docs — Shopify install, config options, optional Claude-API proxy example, KB maintenance rules |

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

All pages share the same nav bar (defined inline in each HTML file). Since the redesign it is one glass capsule of seven links plus two end chips, identical on all 13 pages:

```
[brand] │ Getting Started · Quick Start · Enclosure · Water Care · Maintenance · Troubleshoot · Support │ Find a Dealer · Rewards · ☰ · ☀
```

The page's own link carries `class="is-here" aria-current="page"` (guide pages point at Quick Start, `builder.html` at Enclosure; `rewards.html` / `dealer-locator.html` mark their end chip instead). `.in-menu` links (Find a Dealer, Rewards) are hidden on desktop — they only appear inside the burger panel, where the end chips aren't. Widths are tight: the full bar clears the 1152px content column by ~28px, so **re-measure before adding a link** (see the breakpoint comment in `redesign.css`). Breakpoints: capsule and burger swap at 1080px, the dealer chip appears at 1200px, the points chip at 920px.

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
- **Chat AI mode** — unmatched questions POST to `/api/chat` (`api/chat.js`, the repo's only serverless function — deployed by Vercel automatically, no package.json). Team-editable knowledge lives in the `chatKnowledge` Firestore collection, managed via the "Teach Ember" flow in `chat-insights.html`; the function caches it ~5 min. The widget falls back to the local `INTENTS` KB whenever the endpoint errors (`llmDown` per page load).
- **Troubleshooter decision tree lives in `troubleshoot.js`** as the `TREE` object — a map of `nodeId → node`. Nodes are either `question` (prompt + options/quickPicks) or `outcome` (steps, caution, video, article links, escalation). Model-specific copy uses functions that receive the model id (`'pro' | 'original' | 'lite' | 'unknown'`). `app_entry` is a `router` node that resolves Pro → `app_connect`, others → `app_not_pro`. URL params: `?model=pro|original|lite` pre-selects the model; `?node=<id>` deep-links a node (useful for support emails). Resource URLs are in the `LINKS` map; **how-to video URLs are TODO placeholders in the `VIDEOS` map** — until filled in, the tool shows a "video coming soon" chip. When the underlying help articles change, update the tree and the matching file in `docs/source-material/`.
- **Ember can mount inline.** `AQUAFIRE_ASSISTANT_CONFIG.mount = '<selector>'` renders the panel into that container instead of the corner launcher (launcher, nudge and mobile takeover all switch off), and `window.AquafireAssistant` (`open` / `ask` / `close` / `reset` / `isOpen` / `root`) drives it; calls before load are queued. Closing from the panel's own header or Escape fires a bubbling `aquafire:close` so the host can collapse its container. `index.html` is the first consumer: its hero composer is a real `<form>` that expands in place into `#heroChatMount` (`.greet.is-chatting` folds the orb/greeting/chips away and grows `.hero-chat`), the murmur chips seed the conversation via `data-ask` instead of navigating, and without JS the form still submits to `support.html`. Ember owns the conversation; the page owns only the expand/collapse. Note `.afa-head`'s gradient is hardcoded, not tokenised, so an inline host must override it.
- **Border Beam lives in `beam.css` + `beam.js`** — a vanilla port of the `border-beam` npm package (MIT), rebuilt as plain CSS because the portal has no React/build step. Wrap anything in `<div class="af-beam" data-beam-size="md" data-beam-variant="colorful">`; children render untouched, so the effect is purely additive and degrades to a plain container without JS. Sizes `sm | md | line | pulse-inner | pulse-outside`, variants `ember | colorful | ocean | sunset | mono` (`colorful` is the default; `ember` is the on-brand fire palette and tightens the hue cycle to 10deg so reds don't drift magenta). **Beam colour priority (standing rule for any future palette work): red/orange dominant, then blue/magenta, then green.** It is enforced by weight, not by count — colours are assigned to blobs by area, so moving a colour to a different `--afb-*` index changes its weight; the split is documented in `beam.css` and currently splits 49/35/16 by blob area. Note `sm`/`md` sweep a conic gradient, which parameterises by angle rather than arc length, so on a very wide element the beam crawls the long edges and moves fast across the short ends. An `offset-path` `rim` size that travelled by arc length was tried and removed — the even travel was correct but the look wasn't what the effect is after; the diffuse conic glow is the wanted character. The orbit runs at a deliberate 4s — the package's stock 1.96s pulls the eye off the content the beam is meant to frame. Needs `@property` + `mask-composite`; `beam.js` feature-gates and no-ops on older browsers. Beams pause when scrolled offscreen, and `prefers-reduced-motion` freezes them lit rather than hiding them. **`beam.css`/`beam.js` are opt-in.** Loaded by `beam-demo.html` and by `index.html`, where the hero composer is wrapped in `.composer-beam.af-beam` at `size="md"` (the composer spends both its own pseudo-elements on the glass rim and hover underline, so the beam needs the wrapper) and `data-beam-theme` is synced to the page theme by the existing toggle script. The Ember chat widget is the one live consumer, but it does *not* use these files: `assistant.js` inlines its own trimmed copy under the `afa-` namespace (it ships as a single script tag on Shopify and can't link a stylesheet), applied to the composer field and brightened while Ember is generating. Toggle with `AQUAFIRE_ASSISTANT_CONFIG.beam` = `'input' | 'panel' | false` and `.beamVariant` = `'colorful' | 'ember'`. **`index.html` sets `beam = false`** in a head script: its hero composer already beams and is the page's primary action, so the widget must not beam there too. That page does not load `assistant.js` yet — the config is pre-set so the widget is correct the day the rollout adds it. **Don't drop that script when rolling the redesign out.** **Changing the beam look means editing both places.** Note `assistant.js` declares its own `var CSS` (the stylesheet string), which shadows the global `CSS` object — feature detection there must use `window.CSS`. The `#fff` literals in the CSS are mask stencils (alpha channels), not palette colors — impeccable's `design-system-color` rule flags them as false positives.
- **Impeccable design skill** — `.claude/skills/impeccable/` (compiled bundle from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)) gives Claude Code the `/impeccable` design commands (`craft`, `shape`, `audit`, `critique`, `polish`, `init`, …). `.claude/settings.json` wires its hook: deterministic design-quality checks after UI file edits + a deep pass on Stop. Run `/impeccable init` once before a big design pass so it generates project design context; update the skill with `npx impeccable update`. Personal overrides go in `.claude/settings.local.json` (gitignored).
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

## Gotchas

- **Nav duplication:** There's no shared template. Changing navigation means editing ~13 HTML files (and several have a footer "Guides" column too).
- **aquafire-pro.html is large** (~1,400 lines with inline CSS/JS). Read specific sections rather than the whole file. It still has its own in-page category-accordion troubleshooting section (`TS_DATA` / `ALERTS_DATA`) — that's separate from the standalone Troubleshooter; the new tool didn't replace it.
- **styles.css is enclosure-specific** despite the generic name. Shared styles are in `hub.css`.
- **troubleshoot.css uses theme tokens with fallbacks** (e.g. `var(--blue, #4da6e8)`) — the per-page inline `:root` blocks only define a subset of the tokens listed in the Design System section, so the CSS can't rely on `--blue`/`--amber`/`--surface-alt` being present everywhere.
- **No local dev server configured.** Open files directly or use any static server (`python -m http.server`, etc.).
- **Images are all on Shopify CDN** — no local image assets in the repo.
