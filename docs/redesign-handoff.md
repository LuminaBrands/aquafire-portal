# Portal redesign — session handoff (2026-07-31)

State of the impeccable-driven redesign (PR #66, branch
`claude/impeccable-design-system-111xbj`) so the next session can resume
with zero re-discovery. Written at the end of the exploration phase, just
after the visual world was committed.

## Promoted to the root (2026-07-31)

The committed direction now **is** `index.html`; the `home/` folder is gone and
the old bento-grid homepage it replaced is in git history. Its rewards wiring
was ported across in the same move -- the redesign had none, and promoting it
as-is would have silently killed the points display and 12 earning hooks. The
journey band is now the rewards progress display (`#rb-home-bar-fill`,
`#rb-home-bar-label`), the nav points chip is `#rb-home-points`, and the 11
earning links carry their `data-reward` hooks again. `contact-sales` has no
equivalent link in the new design and is currently unearnable -- see below.

## Where things stand

**Committed direction: `index.html`** — "Hero Bleed × Dual Theme"
(compare id `home` / `home-light`). It is the token source of truth and
the page every rollout decision copies from. `DESIGN.md` +
`.impeccable/design.json` carbonize it. The user confirmed:

1. **Layout/world:** v4b×v4e hybrid (Ember chat front and center, three
   intent wings, journey band) in the Vapor Glass world — evolved through
   mix4 "Edge-lit".
2. **Glass:** the four-layer edged-glass recipe (flat fill, debossed top,
   directional conic rim lit from upper-left, whisper shadow) after four
   iterations — the user's words: "ever-so-slightly raised yet debossed";
   edge color on hover only; no plates behind icons/hero; Axora-style
   halo + light shaft.
3. **Imagery:** Higgsfield-generated hotel-lobby scene (their "Option B"),
   integrated as b1 "Hero Bleed" (photo bleeds from top, dissolves into
   the ground). AI flame renders were rejected as too smoky — don't
   regenerate flames; reuse this image or real brand photography.
4. **Themes:** BOTH mix4 (dark, default) and mix6 (light) via the theme
   switcher; all values tokenized dark+light.

**Exploration lineage** (all folders kept for reference, browsable in
`compare.html`): v1–v5 worlds → v4a–v4e Ember layouts → mix1–mix5 color
studies → mix6 light graft → b1–b3 imagery integrations → home.

## Rollout status

All 13 customer pages now carry the redesign chrome from `redesign.css`
(`support.html` is the reference implementation). Still in draft on
`claude/integrate-borderbeam-component-i6qga7` — nothing is live until the PR
merges.

## Rewards band on the homepage (rebuilt 2026-08-01)

The band used to be a four-node track -- "Start earning -> First guide ->
Setup done -> Warranty" -- which implied an order the program does not have.
Owners collect the 17 modules however they like, so it now reports state the
way rewards.html's score card does: standing points total, progress bar with
"N / 17 modules completed", and links to the ledger and to the explainer
(`rewards.html#how-it-works`, an anchor added for this).

It is a `<section>` rather than an `<a>` now, because it holds three of its
own controls. The sign-in button reuses `#rb-signin-cta`, the hook rewards.js
already had -- which turned out to be dead on every redesigned page:
`updateNavUI()` bailed before calling `updateBannerCTA()` whenever
`#af-rewards-btn` was missing, and that button is injected by
`injectNavButton()`, which looks for a `.nav-links` element no redesigned page
has. The CTA call moved above the early return, so the button now opens the
sign-in modal. (The modal itself is still on rewards.css's 2025 palette -- see
the open item below.)

## Nav bar (rebuilt 2026-08-01)

Modelled on the v1 "Hearth Console" bar the user picked: one glass capsule
holding **six** links (Quick Start · Enclosure · Water
Care · Maintenance · Troubleshoot · Support) with a pill only on hover or
`is-here`, plus `Find a Dealer` and a `Rewards <points>` chip in `.bar-end`.
The density is what makes six items plus two end chips fit where six separate
`.cap` pills did not. (It held seven until `getting-started.html` was retired;
the bar now clears the 1152px column by ~176px instead of ~28px.)

Widths are the binding constraint and were measured, not estimated —
`.page` caps content at **1152px** no matter how wide the window is, and the
full bar needed 1124 of it with the points chip at its ceiling (4,100 pts, the
sum of every reward) back when it held seven links; with six it needs ~976.
That was ~28px of slack and is now ~176px, so **re-measure before adding a
link or lengthening a label**. Breakpoints, widest first: dealer chip at
1200, capsule ↔ burger at 1080, points chip at 920.

Two things that were not obvious:

- The mobile disclosure panel needs its own near-opaque `--menu-bg`; the
  translucent `--row-bg` let page text read straight through it, and
  `backdrop-filter` alone did not save it.
- `.pts-chip b` reserves its width with `tabular-nums` + `min-width` so the
  bar is laid out for the maximum points total from the start instead of
  growing into an overflow as the user earns points.

`rewards.js`'s `updateHomeBanner()` used to bail early when
`#rb-home-bar-fill` was absent, which would have left the points chip stuck
at "0 pts" on all 12 non-home pages; each element is now guarded separately.

## Border Beam on the hero composer (added 2026-07-31)

`index.html` now loads `../beam.css` + `../beam.js` and wraps the hero
composer in `.composer-beam.af-beam` (`data-beam-variant="colorful"`). The
wrapper exists because `.composer` already spends both of its own
pseudo-elements — `::before` on the liquid-glass rim, `::after` on the hover
underline — so the beam has nowhere to hang its layers otherwise. The wrapper
takes over the composer's `width`/`margin-top` so the hero layout is
unchanged (verified: wrapper and composer both 620px).

`data-beam-theme` is kept in sync with the page theme by the existing toggle
script, since the beam ships separate dark/light sweeps. Beam radius is
auto-detected from the composer's `999px` pill.

The composer uses `data-beam-size="md"` — the same conic beam the Ember
widget uses. An `offset-path` `rim` size that travelled the outline by arc
length was built and then removed: it fixed the uneven travel on this ~10:1
pill, but read as a hard traveling line rather than the soft diffuse glow the
effect is meant to have. If the angular sweep becomes a problem again, that
history is in the branch — the mechanism worked, the look did not.

**Rollout note:** the page's head sets `AQUAFIRE_ASSISTANT_CONFIG.beam =
false`. Every other customer page loads `assistant.js`, and when this one
does, that flag is what stops the widget from beaming on top of the hero
composer — two animated glows for the same action. Keep the script when
adding the widget here; verified by injecting `assistant.js` at runtime
(hero beams, widget renders with zero `.afa-beam` elements).

## Open items / decisions awaiting the user

- **single-font hook finding**: Figtree-only is deliberate (now written
  into DESIGN.md as The One Family Rule) but the recurring hook finding
  was never config-suppressed — the user hasn't explicitly confirmed
  suppression. Next session: ask once, then
  `/impeccable hooks ignore-rule single-font --shared` if confirmed.
- **design-system-font/-color findings on the study folders**: once
  DESIGN.md landed, the hook began flagging every exploration comp
  (v1–v5, v4a–v4e, mix1–mix6, b1–b3, image-options.html — ~500 findings)
  for using fonts/colors outside the committed system. That's
  definitional: they are archived studies of *other* worlds, kept as
  history. Classified as fixtures, not drift; nothing was changed or
  suppressed. Next session: confirm with the user, then
  `/impeccable hooks ignore-file` each study folder's index.html (or
  exclude them in `.impeccable/config.json`) so audits only police
  `index.html` and rolled-out pages. The ~26 findings on `index.html`
  itself are extractor literal-matching noise (glass rgba fills, scrims,
  orb gradient stops live in DESIGN.md prose/sidecar, not frontmatter) —
  also intentional.
- **Imagery hosting**: the lobby photo is hot-linked from Higgsfield's CDN
  (`d8j0ntlcm91z4.cloudfront.net/user_32F7tD19jlevIep1EHCmpFuKJOX/hf_20260731_035654_66231451-0a23-45de-b19a-c56621d49d24.png`).
  That URL is outside our control — before production, upload it to the
  Shopify CDN (the repo's convention for all imagery) and swap the URL in
  `index.html` (3 places: preload, .scene img) and `image-options.html`.
  Shopify MCP needed approval in the original session.
- **`rewards.css` and `assistant.js` are still on the 2025 palette**: Inter,
  `#c0392b`, `#e8a838`, `#2c3038` and friends -- the redesign never reached
  either, and the design hook reports ~40 findings on the first and ~71 on the
  second (all inside the widget's injected CSS block). Being self-contained is
  a real constraint for `assistant.js` -- it ships to Shopify as one script tag
  and cannot link a stylesheet -- but that argues for inlining the *new* token
  values, not for keeping the old ones. Both need a retone pass of their own;
  the badge styling the row/tile work touched was restated in place rather than
  retoned for exactly that reason.
- **`contact-sales` reward is unearnable**: no link in the new design points
  at the contact page, and `setupAutoTracking` only awards it on such a click.
  Needs either a link somewhere or removal from `REWARDS`.
- Rewards/journey numbers on `home` (0/17 modules, +500, +300) mirror the
  real rewards system — keep in sync if rewards change.

## Environment learnings (Claude Code remote container)

- **Network policy** — blocked from the sandbox: impeccable.style,
  cdn.shopify.com, aquafire.com, api.github.com, codeload.github.com,
  d8j0ntlcm91z4.cloudfront.net (Higgsfield CDN), d2ol7oe51mr4n9.cloudfront.net
  (Higgsfield media), *.vercel.app. Allowed: registry.npmjs.org,
  raw.githubusercontent.com, fonts.googleapis.com/gstatic (curl only, not
  Chromium), git smart-HTTP to public github.com repos.
- **Screenshots** happen with `tools/shoot/` (see its README): local
  static server + Playwright route interception serving SVG stand-ins and
  locally downloaded fonts.
- **Real-image renders**: the Higgsfield MCP `sandbox_exec` sandbox has
  unrestricted network + Playwright. Recipe: clone the public repo there
  (`git clone -b <branch> https://github.com/LuminaBrands/aquafire-portal`),
  `npx playwright screenshot ... "file:///home/user/s/index.html?theme=light"`,
  then `media_upload` (presigned PUT from inside the sandbox) +
  `media_confirm` to deliver. Gotchas: the sandbox dies ~10s after each
  call (chain everything in one command); don't guard the static server
  with `pgrep -f` (it matches the sandbox's own bash) — prefer `file://`
  URLs; query strings work on `file://`.
- **Vercel previews** need SSO (curl gets a login redirect) — the user's
  browser works; automation can't fetch them. Branch preview:
  `https://aquafire-portal-git-claude-impecca-24f265-luminabrands-projects.vercel.app`.
- **Hook/linter may rewrite files between your edits** — always re-grep
  anchors before scripted replacements and make batch replacements
  fail loudly.
- Final real-photo renders of `home` (dark/light × desktop/mobile) are in
  the user's Higgsfield media library (media ids `1f13e7cf…`, `8c99198a…`,
  `110899b3…`, `ca5d2cc8…`).
