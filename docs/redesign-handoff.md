# Portal redesign — session handoff (2026-07-31)

State of the impeccable-driven redesign (PR #66, branch
`claude/impeccable-design-system-111xbj`) so the next session can resume
with zero re-discovery. Written at the end of the exploration phase, just
after the visual world was committed.

## Where things stand

**Committed direction: `home/index.html`** — "Hero Bleed × Dual Theme"
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

## Immediately pending (user's explicit next asks)

- **Copy pass on `home/`**: the user wants to change "specifics like
  phrasing and which prompt cards show" (murmur chips, row cards) before
  anything else. Do this first next session.
- Then: `/impeccable` finish review of `home`, and roll the design across
  the portal's ~13 pages (nav is duplicated per page — see CLAUDE.md
  gotchas). Suggested order: support/troubleshoot hub pages first (highest
  traffic per PRODUCT.md), then tools, then guides.

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
  `home/` and rolled-out pages. The ~26 findings on `home/index.html`
  itself are extractor literal-matching noise (glass rgba fills, scrims,
  orb gradient stops live in DESIGN.md prose/sidecar, not frontmatter) —
  also intentional.
- **Imagery hosting**: the lobby photo is hot-linked from Higgsfield's CDN
  (`d8j0ntlcm91z4.cloudfront.net/user_32F7tD19jlevIep1EHCmpFuKJOX/hf_20260731_035654_66231451-0a23-45de-b19a-c56621d49d24.png`).
  That URL is outside our control — before production, upload it to the
  Shopify CDN (the repo's convention for all imagery) and swap the URL in
  `home/index.html` (3 places: preload, .scene img) and `image-options.html`.
  Shopify MCP needed approval in the original session.
- **Old homepage**: `index.html` still is the live bento homepage; `home/`
  replaces it only when the user says so.
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
  `npx playwright screenshot ... "file:///home/user/s/home/index.html?theme=light"`,
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
