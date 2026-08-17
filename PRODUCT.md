# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two co-primary audiences (user-confirmed 2026-07-24):

- **Fireplace owners** — people who already bought an Aquafire water-vapor fireplace. They arrive mid-task: unboxing and first fill, building or verifying an enclosure, setting up water supply/softening, decoding light and beep codes, cleaning the mist maker, or troubleshooting a weak/foggy "flame." Often on a phone, next to the unit.
- **Trade professionals** — builders, interior designers, and dealers who spec enclosures, plan installs, look up dimensional/electrical requirements, and use the dealer locator/management tools. They need precise, citable numbers and documents they can hand to a client or crew.

Secondary, not a design priority: pre-purchase shoppers who reach the Build Yours configurator or the Ember chat widget before buying on aquafire.com.

## Product Purpose

The Interactive Aquafire Guide — a self-serve documentation and tools portal for Aquafire fireplaces (by Lumina Brands). It turns the official help articles, spec guides, warranty, and manuals into interactive, model-aware tools.

Success (user-confirmed): **fewer support tickets** (owners resolve issues themselves via the Troubleshooter, guides, and Ember instead of emailing support) and **dealer enablement** (trade partners rely on the portal as their working reference).

The **rewards journey is a deliberate engagement mechanic** (user-confirmed 2026-07-31): gamification (17 guide modules, points, +500 setup / +300 warranty bonuses) should visibly encourage users deep into the guide journey, not sit as an afterthought.

## Positioning

The only interactive, model-aware companion for Aquafire water-vapor fireplaces: guided decision-tree troubleshooting, an enclosure dimension calculator with cutout diagrams, and a ZIP-code water-hardness tool — all grounded in Aquafire's official documentation with a traceable source archive, and embeddable directly into aquafire.com.

## Operating Context

- Companion to the **aquafire.com Shopify store**; product imagery and logo come from the Shopify CDN. Live help center is `aquafire.gorgias.help` — the portal's `docs/source-material/` holds traceable extracts, but the live docs are the source of truth.
- Any page can be embedded in Shopify via `?embed` (nav/footer stripped); the **Ember chat widget** (`assistant.js`) is designed for one-script-tag embedding on aquafire.com.
- **Firebase** (`aquafire-portal` project) backs chat telemetry (`chatEvents`), team-editable chat knowledge (`chatKnowledge`), and the rewards system; `chat-insights.html` is the internal dashboard. **Vercel** serves the single serverless function `api/chat.js` (Claude API) for Ember's AI answers.
- Owners typically use the portal in the field: during install (tape measure in hand), or in front of a beeping unit.

## Capabilities and Constraints

- **Product line:** Aquafire Original (**AWA** — amber LEDs, remote, optional Direct Plumb Kit), Aquafire Pro (**AWPR** — amber + RGB LEDs, phone app, direct-plumb ready), Aquafire Lite (**AWL** — amber LEDs, manual fill, no light-indicator codes). Each in 3 sizes; `AWA2/AWA3/AWPR2/AWPR3` are generations; `AWP` is the older "Premium." Model data lives in `app.js` (`MODELS`).
- **Tools:** interactive Troubleshooter (model-aware decision tree, `?model=` / `?node=` deep links), enclosure calculator with SVG cutout/isometric diagrams, water hardness lookup (2,000+ ZIP prefixes) + softener replacement calculator, Build Yours configurator, dealer locator/admin, rewards program, Ember chat (local intent KB + Claude fallback).
- **Tech constraints:** static vanilla HTML/CSS/JS, flat root, **no build step, no frameworks, no npm dependencies** — files deploy as-is. Nav and footer are duplicated per page (~14 files, no templating). `api/chat.js` must stay dependency-free. `assistant.js` string literals must stay pure-ASCII (Shopify charset safety).
- **Content rule:** customer-facing facts must trace to `docs/source-material/`; when the underlying Aquafire docs change, both the tool and the extract get updated.
- **Mobile-first (user-confirmed 2026-07-30):** the portal is designed phone-first — owners typically arrive on a phone standing next to the unit — and must scale up gracefully to desktop, where a denser dashboard-style layout is welcome. Composition decisions start at phone width; desktop is the enhancement, not the default.
- **Undecided / pending:** official how-to video URLs (the `VIDEOS` map in `troubleshoot.js` holds TODO placeholders; tools show "video coming soon" — do not fabricate links). Parts of `support.html` are stubs. The `getting-started.html` placeholder was removed — Quick Start covers that ground.

## Brand Commitments

- **Binding (user-confirmed 2026-07-24):** the Aquafire name, logo, and official product imagery (Shopify CDN) only.
- **Explicitly not binding:** the current dark theme, Aquafire red `#c0392b` palette, Poppins/Inter typography, and existing component language. The user opened the entire visual world for replacement in a redesign; the incumbent look is evidence, not authority.
- **Vibrant color mixing is a differentiator (user-confirmed 2026-07-31):** Aquafire's dual LED light bars enable rich color mixing beyond standard RGB presets (front + back LED bars per the install specs). The redesign should carry subtle color elements drawn from a color-mixing palette — red/orange, frosty blue, greenish yellow, magenta — as brand expression.
- Incumbent copy voice (plainspoken, owner-friendly) is current practice, not a confirmed commitment. The portal is the **Interactive Aquafire Guide**; it dropped "Owner's" because roughly half of it -- the Explore route, the dealer locator, the model comparison -- serves people who have not bought one yet.

## Evidence on Hand

- `docs/source-material/` — plain-text extracts (May 2026) of 15 help-center articles, the 2026 spec & installation guides for all three models, the Aquafire Inc. Limited Warranty (Jan 2026), the Vapor Pure™ softener manual, the A|Fire user manual, and the AWPR/AWA "Lights & Beeps Key" stickers. `AWPR 40-100.pdf` in root.
- `water-care-app.js` — 2,000+ ZIP-prefix water-hardness database. `assistant.js` — Shopify product/pricing snapshots (cards link to live store pages).
- **Absent — must not be fabricated:** how-to video links, testimonials, case studies, review counts, press.

## Product Principles

1. **Resolve, don't deflect.** Every symptom path ends in a fix the user can perform, or a clean, context-carrying handoff to human support — never a dead end.
2. **Model-aware everywhere.** AWA, AWPR, and AWL differ materially (codes, plumbing, apps). Tools ask for or carry the model rather than averaging across models.
3. **Facts trace to the source archive.** Nothing customer-facing is invented; gaps (like missing videos) stay visibly pending rather than faked.
4. **One truth, two jobs.** Owners need the fast answer mid-task; trade needs the precise, citable spec. Serve both from the same underlying content without dumbing down either.
5. **Embeddable by design.** Every surface must survive as an iframe or widget inside aquafire.com — self-contained, dependency-free, charset-safe.
