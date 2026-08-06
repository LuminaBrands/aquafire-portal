# Source Material — Troubleshooter & Ember

Plain-text extracts of the Aquafire help-center articles, install/spec guides, the
warranty, and the manuals that the **Troubleshooter** (`troubleshoot.html` /
`troubleshoot.js`) decision tree is built from — and that ground the **Ember**
chat widget (`assistant.js`) and its AI backend (`api/chat.js`). Kept here so
the content is traceable and can be re-checked when Aquafire updates a doc.

Extracted with `pdftotext -layout` from PDFs provided by Lumina Brands (May 2026).
These are reference snapshots — the live versions on `aquafire.gorgias.help` and
`aquafire.com` are the source of truth.

## Help-center articles (aquafire.gorgias.help)

| File | Article |
|------|---------|
| `article-power-issues.txt` | Power Issues |
| `article-water-issues.txt` | Water Issues |
| `article-remote-control-issues.txt` | Remote Control Issues |
| `article-light-issues-original.txt` | Light Issues — Aquafire (AWA) |
| `article-light-issues-pro.txt` | Light Issues — Aquafire Pro (AWPR) |
| `article-my-lights-wont-turn-on.txt` | My Lights Won't Turn On |
| `article-flame-appearance-troubleshooting.txt` | Flame Appearance Troubleshooting |
| `article-flame-low-or-uneven.txt` | Flame Issues — Low or Uneven "Flame" |
| `article-flame-smoky-foggy.txt` | Flame Issues — Smoky / Foggy Appearance |
| `article-adjusting-the-flame.txt` | Adjusting the Aquafire Flame |
| `article-phone-app-not-connecting.txt` | Aquafire Pro — Phone App not connecting |
| `article-my-aquafire-is-beeping.txt` | My Aquafire is beeping! |
| `article-general-cleaning.txt` | General Cleaning for Aquafire and Aquafire Pro |
| `article-preventative-maintenance-guide.txt` | Preventative Maintenance Guide |
| `article-identifying-serial-number.txt` | Identifying Serial Number |

## Spec & installation guides (2026 revisions)

| File | Doc |
|------|-----|
| `guide-aquafire-pro-awpr-specs-install-2026.txt` | Aquafire Pro (AWPR) — Specs & Installation Guidelines |
| `guide-aquafire-original-awa-specs-install-2026.txt` | Aquafire Original (AWA) — Specs & Installation Guidelines |
| `guide-aquafire-lite-awl-specs-install-2026.txt` | Aquafire Lite (AWL) — Specs & Installation Guidelines |

## Live marketing pages (aquafire.com, fetched Jul 2026)

Reference extracts for pre-sale / comparison questions — fetched via the
Shopify Admin API (the sandbox can't reach aquafire.com directly).

| File | Page |
|------|------|
| `article-buying-guide-2026.txt` | Blog: [The Complete Water Vapor Fireplace Buying Guide for 2026](https://www.aquafire.com/blogs/learn/the-complete-water-vapor-fireplace-buying-guide-for-2026) — tech explainer, gas/wood/electric comparison, 7 evaluation factors, candid competitor look, install costs, 10-yr TCO, buyer FAQs. **Header lists blog-vs-store discrepancies (pricing, Pro widths, direct plumb).** |
| `page-compare-vs-aquafire.txt` | ["Why Aquafire?"](https://www.aquafire.com/pages/compare-vs-aquafire) — vs-traditional and vs-other-vapor comparison tabs, model spec table, UV-C section, support hours. Content lives in theme sections (`af-vs-traditional.liquid`), not the page body. |

## Team-provided notes

| File | Note |
|------|------|
| `note-water-fill-and-plumbing-by-model.txt` | Water fill & direct-plumb capability by model (Lumina Brands, Jul 2026) — Pro direct-plumbs out of the box + dispensing-pump drain; Original needs the Direct Plumb Kit add-on; Lite/Gatsby are manual-fill only. Supersedes conflicting older copy. |
| `note-installer-field-tips.txt` | Installer field practice on framing, sealing and downdraft prevention (Lumina Brands, Aug 2026, from senior installer Brad) — cutout width at nominal + 3/8", the tape fallback when the enclosure isn't drywalled, sealing the DP kit, open-plenum HVAC, keeping the vents clear. Published as the "Installer Field Notes" section of `enclosure-guide.html`. **The + 3/8" width was adopted as the portal's own figure**, so `app.js` / `builder.js` deliberately report 1/8" wider than the + 1/4" in the 2026 spec guides below — see the DECISION block in the note. |

## Manuals, warranty & reference

| File | Doc |
|------|-----|
| `aquafire-limited-warranty.txt` | Aquafire Inc. Limited Warranty (Jan 2026) |
| `vapor-pure-installation-guide.txt` | Vapor Pure™ Water Softener — User Manual |
| `afire-multilanguage-user-manual.txt` | A\|Fire multi-language User Manual (English: pp. 9–15) |
| `sticker-awpr-lights-and-beeps-key.txt` | AWPR "Lights & Beeps Key" sticker |
| `sticker-awa-lights-and-beeps-key.txt` | AWA "Lights & Beeps Key" sticker |

## Model codes

- **AWPR** = Aquafire **Pro** — amber + RGB color LEDs, phone app, direct-plumb ready, light/beep codes incl. maintenance reminder
- **AWA** = Aquafire **Original** — amber LEDs only (no color), remote, Direct Plumb Kit optional, light/beep codes incl. maintenance reminder
- **AWL** = Aquafire **Lite** — amber LEDs only, remote, manual fill only (no direct-plumb option on any size — see `note-water-fill-and-plumbing-by-model.txt`), drains via a bottom plug, **no light-indicator codes / no maintenance reminder**
- `AWA2 / AWA3 / AWPR2 / AWPR3` are generations; `AWP` is the older "Premium" generation referenced in some articles.

## TODO — how-to videos

The troubleshooter has placeholder slots for these Aquafire YouTube videos
(see the `VIDEOS` map at the top of `troubleshoot.js`):

- How to connect the AFIRE app to your Aquafire
- How to locate & remove the mist maker
- Mist maker cleaning — Part 1 (the disc) / Part 2 (lower tank & float sensor)
- Freeing a stuck float sensor (agitating the mist rack)
- Sponge-filter thickness test for a foggy flame
- "What the Beep?" — Low/No Water · Overflow/High Water · Voltage/Power Adapter

## Corrections

| Date | What | Where |
|------|------|-------|
| Jul 2026 | Water-hardness guidance superseded per Lumina Brands: **the softer the water, the better** (no minimum hardness; "too soft reduces the flame" is wrong). Amended in all three 2026 spec/install guide extracts; the published PDFs, gorgias.help articles, and product manuals still need the fix at the source. Also superseded (confirmed Jul 2026): **reverse osmosis and whole-house softeners are ideal** (a whole-house system replacing Vapor Pure still needs written warranty approval). | `guide-aquafire-{pro-awpr,original-awa,lite-awl}-specs-install-2026.txt` |
| Jul 2026 | Direct-plumb capability clarified per Lumina Brands: **Pro connects to a water line out of the box** (no kit) and includes a push-button dispensing-pump drain; **Original needs the Direct Plumb Kit add-on** (sold/shipped separately); **Lite and Gatsby are manual-fill only, no upgrade path** (not just the 40"/60"). All models manual-fill via the integrated pump port at the top right corner of the burner. The 2026 buying-guide blog post still says "Pro and Original offer an optional Direct Plumb Kit" — needs fixing at the source. | `note-water-fill-and-plumbing-by-model.txt` |
