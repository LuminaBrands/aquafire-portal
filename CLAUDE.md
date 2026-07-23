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
| `assistant.js` | **"Ember" AI chat widget** — self-contained (injects own CSS), embeddable on Shopify via one script tag; `INTENTS` knowledge base + optional Claude-API backend hook. See `docs/chat-assistant.md` |

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

All pages share the same nav bar (defined inline in each HTML file):

```
Home → Getting Started → Quick Start → Enclosure Guide → Water Care → Troubleshoot → Find a Dealer → Support
```

(A few pages also slot **Maintenance** before Find a Dealer; `builder.html` adds **Build Yours**. The exact list varies slightly per page — match the page you're editing.)

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
- **Troubleshooter decision tree lives in `troubleshoot.js`** as the `TREE` object — a map of `nodeId → node`. Nodes are either `question` (prompt + options/quickPicks) or `outcome` (steps, caution, video, article links, escalation). Model-specific copy uses functions that receive the model id (`'pro' | 'original' | 'lite' | 'unknown'`). `app_entry` is a `router` node that resolves Pro → `app_connect`, others → `app_not_pro`. URL params: `?model=pro|original|lite` pre-selects the model; `?node=<id>` deep-links a node (useful for support emails). Resource URLs are in the `LINKS` map; **how-to video URLs are TODO placeholders in the `VIDEOS` map** — until filled in, the tool shows a "video coming soon" chip. When the underlying help articles change, update the tree and the matching file in `docs/source-material/`.

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
