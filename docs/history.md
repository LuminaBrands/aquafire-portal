# Development history & decision record

How the portal evolved and why settled decisions went the way they did. Moved
out of `CLAUDE.md` (2026-08-12) so sessions load it only when a decision is
actually being revisited. The hard rules these stories produced live in
`CLAUDE.md`; this file is the *why*.

## Build phases

The portal evolved through iterative Claude Code sessions:

1. **Foundation** — Enclosure dimension calculator with SVG cutout diagrams,
   later restyled with Aquafire red branding.
2. **Water care tool** — ZIP code hardness database, US map visualization,
   replacement timeline calculator.
3. **Hub & navigation** — Bento grid homepage, model cards, shared nav/footer
   across all pages.
4. **Aquafire Pro guide** — Comprehensive product page with specs, video
   guide, troubleshooting accordions, hub dashboard redesign.
5. **Embed support** — iframe-friendly mode for Shopify integration.
6. **Product images** — Shopify CDN integration for model cards and
   accessories.
7. **AR Cutout Visualizer** — Camera overlay tool (built → iterated →
   **removed**; browser-based AR without depth sensing was unreliable — don't
   rebuild it without new depth APIs).
8. **Interactive Troubleshooter** — Model-aware guided decision-tree wizard
   (`troubleshoot.html`), built from the Aquafire help-center articles + 2026
   install/spec guides + warranty + manuals (extracts archived in
   `docs/source-material/`).
9. **"Ember" AI chat widget** — Gorgias-style customer-service + pre-sale
   chat bubble (`assistant.js`), self-contained for one-tag embedding on
   aquafire.com (Shopify). Local intent-matching KB + optional Claude-API
   proxy mode (`docs/chat-assistant.md`).
10. **Portal redesign** — "Hero Bleed × Dual Theme" (PR #66 onward):
    liquid glass over a lobby photograph, dark/light theme switcher,
    `redesign.css` shared layer rolled out to every customer page.
    Contract and environment learnings: `docs/redesign-handoff.md`.

## Decision record

### Nav grouping: dropped once, reinstated deliberately

Dropdown groups were tried and dropped (#82, #91) when the bar held its
destinations flat and dropdowns only added a click. Grouping earned its place
back once Support alone held six items, four of them off-site — a flat bar
cannot carry eleven destinations. Adding an item inside a group costs no bar
width (that is the point of grouping); adding a *group* costs ~85px —
re-measure the 760px breakpoint then (see the breakpoint comment in
`redesign.css`). Groups open on click, not hover — hover menus are unreachable
on touch and the capsule is the same markup on both.

The capsule/burger swap moved from 1080px to **760px** during the redesign:
the capsule is 256px wide against 653px for the old six flat links, so iPad
portrait now gets the real nav. The dealer chip was removed; Find a Dealer
became a Support item.

### getting-started.html: retired

It was a permanent "coming soon" that dead-ended the setup route; Quick Start
covers that ground, and "Set Up" now points there. Don't recreate it.

### The ⅜″ cutout clearance: how the figure flip-flopped

The portal's cutout widths are nominal + ⅜″ **in total** — ⅛″ wider overall
than the 2026 spec sheets' + ¼″ — on the install crews' recommendation
(Aug 2026, `docs/source-material/note-installer-field-tips.txt`): the insert
seats without being forced, air keeps moving around the internals, and light
strips/fans aren't compressed during install.

The figure's history is why the wording rule in `CLAUDE.md` is strict: it was
first published as ⅜″ overall, then rewritten as ⅜″ *per side* (nominal + ¾″)
on a misreading, then corrected back to ⅜″ total by Stefan (Aug 2026). Copy
must say "in total" or "⅜″ over nominal" and warn against the per-side
reading — never a bare "+ ⅜″" with no convention stated. The divergence from
`docs/source-material/guide-aquafire-*-specs-install-2026.txt` (still + ¼″)
is deliberate, not an error to "fix".

### Border Beam: the `rim` size that was removed

An `offset-path` `rim` size that travelled by arc length was tried and
removed — the even travel was correct but the look wasn't what the effect is
after; the diffuse conic glow is the wanted character. Related: the orbit
runs at a deliberate 4s — the npm package's stock 1.96s pulls the eye off the
content the beam is meant to frame. Full architecture: `docs/border-beam.md`.

### embed.js: silently broken by the redesign for weeks

`embed.js` names the page chrome by class. The redesign renamed the chrome
(`.site-nav`/`.page-header`/`.site-footer` → `.bar`/`.phead`/`.pfoot`) and
left this file on the old names, so `?embed` matched nothing and stripped
nothing on every customer page from the rollout until 2026-08-05 — invisible
unless you actually load `?embed`, which is why it survived a full rollout.
The standing rule ("rename a chrome element, rename it here") is in
`CLAUDE.md` Gotchas.

### Committed images: re-encoded on the way in

Five images are committed locally (the rest live on the Shopify CDN). All
were supplied directly rather than uploaded to the store, and all were
re-encoded on intake — 8.0 MB of source PNG/JPEG became 1.0 MB, and
`ember-mark.png`'s own 1.7 MB 16-bit export became 42 KB. The repo is not an
asset pipeline: put new imagery on the CDN unless there's a reason not to.

### rewards.css: retoned onto the redesign tokens

The auth modal, profile dropdown, points toast and reward badges were
hard-pinned to the 2025 palette (Poppins, `#1b1e24`, `#e8a838`, `#c0392b`)
with no theme binding, so the sign-in dialog rendered dark over a light page.
All of it is tokenised now. Three tokens were added to `redesign.css` for it:
`--scrim` (the only token that stays dark in light theme — it is a dimmer,
not a surface), `--modal-shadow`/`--dropdown-shadow` (neutral elevation), and
`--danger` (form errors, deliberately not ember). Overlay surfaces take the
near-opaque `--menu-bg`, not a glass fill. Reward-badge ink is `--amber`, the
one 2025 colour kept on purpose — identical in dark, and it finally darkens
in light.

### builder.html: parked, not deleted

Arrived in the 2026-06-01 bulk upload and was never finished: `PRICING` is
`$X,XXX` placeholders and `SHOPIFY_URLS` are `#`. Unlinked, `Disallow`ed in
`robots.txt` and `noindex`ed in `vercel.json` (Aug 2026) so the placeholder
pricing can't be indexed. Its `MODELS` table mirrors `app.js` for parity and
must stay in step, but don't build features there without a decision to
revive it.
