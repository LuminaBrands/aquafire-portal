---
name: Aquafire Owner's Portal
description: Liquid-glass owner's guide lit by the fireplace it explains — one room, two lightings
colors:
  smoke: "#101216"
  vapor-white: "#f3f4f6"
  mist-gray: "#b9bec8"
  faded-gray: "#8d939f"
  ember: "#ff8a4a"
  frost: "#6fc3ff"
  chartreuse: "#c9e85c"
  magenta: "#ff5fa8"
  showroom: "#e9ebef"
  showroom-deep: "#e2e5ea"
  ink: "#171a1f"
  ink-mid: "#4c525c"
  ink-dim: "#6a7280"
  ember-day: "#ff6a3d"
  frost-day: "#4aa8ef"
  chartreuse-day: "#aacc33"
  magenta-day: "#ff4d9e"
  ember-ink: "#cf4e16"
  frost-ink: "#1c76c9"
  chartreuse-ink: "#6f8f0a"
  magenta-ink: "#d9317f"
  orb-glow: "#ffd9ae"
  orb-body: "#e0641e"
  orb-shade: "#6e2a08"
  photo-ink: "#f3f4f6"
  photo-ink-dim: "#c9cdd5"
typography:
  display:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 6vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
  page-title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 5vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 600
  nav:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.83rem"
    fontWeight: 500
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.93rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 500
  labelSmall:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
rounded:
  pill: "999px"
  pane: "26px"
  band: "24px"
  card: "15px"
  bubble: "13px"
spacing:
  xs: "8px"
  sm: "13px"
  md: "18px"
  lg: "26px"
  xl: "38px"
components:
  cap-chip:
    backgroundColor: "rgba(255,255,255,0.045)"
    textColor: "{colors.mist-gray}"
    rounded: "{rounded.pill}"
    padding: "8px 15px"
  composer:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "{colors.faded-gray}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 20px"
  send-button:
    backgroundColor: "rgba(255,255,255,0.12)"
    textColor: "{colors.vapor-white}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  row-card:
    backgroundColor: "rgba(13,15,19,0.4)"
    textColor: "{colors.vapor-white}"
    rounded: "{rounded.card}"
    padding: "11px 13px 13px"
  journey-band:
    backgroundColor: "rgba(255,255,255,0.035)"
    textColor: "{colors.vapor-white}"
    rounded: "{rounded.band}"
    padding: "18px 20px"
---

# Design System: Aquafire Owner's Portal

## Overview

**Creative North Star: "The Glass Hearth"**

The portal is a room lit by the product it explains. A photographed hotel
lobby — the fireplace glowing in marble — bleeds down from the top of the
page and dissolves into the atmosphere; everything the visitor touches is
liquid glass floating in front of that scene. Ember, the AI concierge (a
warm orb), greets from inside the room, and the page is organized as a
conversation first, three intent wings second. The product's one flamboyant
trait — dual-LED color mixing — appears only as thin light bars along the
edges of surfaces, the way the fireplace itself wears its color.

The same room exists in two lightings, switched live by a theme button:
**dark "smoke"** (default — evening, `#101216` ground, white-alpha glass)
and **light "showroom"** (daylight, `#e9ebef` ground, white glass with ink
type). Every visual decision is a semantic token with a binding in each
theme; nothing is styled for only one lighting. The reference
implementation and token source of truth is `index.html`.

The old portal look (flat dark cards, red-primary branding, Poppins/Inter)
is the anti-reference: it read as a SaaS dashboard. This world is a
lifestyle brand's room.

**Key Characteristics:**
- Mobile-first single column that fans out at one desktop breakpoint (920px)
- Photography as atmosphere, never as a framed illustration
- Monochrome glass at rest; LED spectrum color only on interaction edges
- Conversation (composer + murmur chips) is the primary action everywhere
- Rewards are always visible, ember-flagged, never modal

## Colors

A monochrome glass world where color is reserved for the product's LED
palette and arrives mostly on interaction.

### Primary
- **Ember** (#ff8a4a dark / #ff6a3d light): the flame and the brand's warmth.
  Ember's orb, the Resolve wing, halo glows, star ratings, and every rewards
  signal -- the band's standing total and progress fill, the nav points chip,
  reward badges. The emotional primary; the widest-used accent, so reach for a
  neutral first and let ember mean something.

### Secondary
- **Frost** (#6fc3ff dark / #4aa8ef light): the Explore wing and the cool
  end of the LED mix.
- **Chartreuse** (#c9e85c dark / #aacc33 light): the Begin wing; growth and
  setup.
- **Photo ink / photo ink dim** (#f3f4f6, #c9cdd5): the only text that does
  not follow the theme. The hero greeting and its subtitle sit on the
  photograph, which is the same photograph in both lightings, so they stay
  light and lean on text-shadow for contrast instead of a token binding.
- **Orb glow / body / shade** (#ffd9ae, #e0641e, #6e2a08): the three stops of
  Ember's radial-gradient orb, in that order from the 35%/30% highlight
  outward, over an inset `rgba(0,0,0,0.35)` shade. Not general-purpose fills --
  they exist to render Ember and appear only where Ember does (the hero orb,
  the widget launcher, the chat avatars). Identical in both themes: Ember is
  lit from within and does not change with the room.
- **Magenta** (#ff5fa8 dark / #ff4d9e light): the fourth LED hue. It closes
  the spectrum bars and takes every fourth row/tile in the hover cycle. It
  used to be the rewards flag; rewards are ember now, and magenta carries no
  meaning of its own.

### Neutral
- **Smoke** (#101216): dark-theme ground; glass fills are white at 3.5–12% alpha over it.
- **Vapor White** (#f3f4f6): dark-theme high-emphasis text; hero text in both themes.
- **Mist Gray** (#b9bec8) / **Faded Gray** (#8d939f): dark-theme mid/dim text.
- **Showroom** (#e9ebef): light-theme ground (rendered as a subtle vertical gradient #f1f2f5 → #e9ebef → #e2e5ea).
- **Ink** (#171a1f) / **Ink Mid** (#4c525c) / **Ink Dim** (#6a7280): light-theme text scale.

### Named Rules
**The Edge-on-Hover Rule.** LED spectrum color (ember→chartreuse→frost→magenta
gradient bars, 3px, along a surface's bottom edge) appears only on
hover/focus/active. At rest the room is monochrome glass; interaction is what
lights the LEDs.

**The Deepened Ink Rule.** On the light ground, colored *text* never uses the
LED bar hues — it uses the deepened variants (ember-ink #cf4e16, frost-ink
#1c76c9, chartreuse-ink #6f8f0a, magenta-ink #d9317f) for contrast. Bars and
nubs keep full hue in both themes. In dark theme the text variants equal the
bar hues.

**The Two Lightings Rule.** Never introduce a raw color into a component.
Every color, fill, stroke, rim, and shadow references a token that defines
both a dark and a light binding (see `index.html` `:root` and
`:root[data-theme="light"]`).

## Typography

**Display Font:** Figtree (with system-ui, sans-serif)
**Body Font:** Figtree (same family)

**Character:** One warm geometric sans doing everything; hierarchy comes
entirely from weight (400→700) and size, which keeps the glass surfaces
quiet. A deliberate, user-confirmed single-family system — do not add a
second face without revisiting this file.

### Hierarchy
- **Display** (700, clamp(1.6rem, 6vw, 2.25rem), 1.18, -0.025em): Ember's
  greeting only; white in both themes with a soft shadow (it sits on the photo).
  Its fixed lower bound, 1.6rem, doubles as the stat size for the rewards
  band's standing total (tabular figures, magenta).
- **Page title** (700, clamp(1.5rem, 5vw, 2rem)): the `.phead h1` on every
  inner page. A step below Display on purpose — Display is Ember greeting
  you from inside the photograph, and a section heading that shouts as loud
  as the hero flattens the whole hierarchy.
- **Headline** (700, 1.02–1.05rem): wing heads.
- **Title** (600, 0.88rem): row-card titles, send button.
- **Nav** (500, 0.83rem; 600 when current): links inside the nav capsule and
  the bar-end chips. A step below Title on purpose. The bar has to carry
  seven destinations plus two chips inside a 1152px content column, and at
  Title size that set measures ~65px too wide. Density is the point of the
  capsule -- do not "fix" this back up to 0.88rem without re-measuring the
  bar (see the breakpoint comment in redesign.css).
- **Body** (400–500, 0.8–0.93rem, 1.6): greeting subtitle, tip bubbles, descriptions.
- **Label** (500, 0.76rem): row subtitles, murmur chips, minis, the rewards
  band's caption, progress meta and links.
- **Label small** (700, 0.7rem): badges only -- the row's points chip and the
  reward badge. The floor of the ramp; nothing goes below it.

### Named Rules
**The One Family Rule.** Figtree only. If a surface feels flat, fix it with
weight, size, or spacing — not a new font.

## Layout

Mobile-first, one column, max-width 1200px, side padding 18px (24px on
desktop). A single enhancement breakpoint at **920px**: the rewards band
turns horizontal, and the three intent wings go from a swipe rail to a
3-across row with equal flex. (The nav capsule has its own wider
breakpoints — see the Nav Capsule component.) The hero (orb → greeting →
composer → murmur chips) is centered and never exceeds 620px wide.

**Swipe rails.** Where a phone would otherwise stack peers into a column you
scroll past — the murmur chips, the three wings — they become a horizontal
snap rail instead. The recipe is fixed: bleed to the viewport edges with
negative margins, restore the content column with padding, match it with
`scroll-padding-left` (or the rail loads scrolled and clips its first item),
snap, hide the scrollbar, and fade the right edge only — a left fade eats
the first item, which is where the rail always rests. **The peek is the
affordance**: size items so the next one shows past the fade. Dots sit **above** the rail --
they belong with the heading that introduces the set, and below a tall card they can fall past the fold entirely. They report position; they do not
teach the gesture. Card rails also equalise height and
pin the last block with `margin-top: auto`, or short cards trail off in dead
space. Vertical rhythm uses the spacing scale (8 /
13 / 18 / 26 / 38px); sections breathe 30–44px apart. The lobby photograph
occupies the top 540px (620px desktop) behind the hero.

## Elevation & Depth

No elevation ladder and no dome gradients. Depth is **material, not
altitude**: every surface is edged glass — a flat translucent fill you can
see the room through, pressed slightly *into* the page rather than lifted
off it. The recipe has four layers, applied together:

1. **Flat translucent fill** with `backdrop-filter: blur(14–18px)` — the fill carries no gradient.
2. **Debossed top**: an inset top shadow (e.g. `inset 0 2px 5px -2px rgba(0,0,0,0.4)` dark / `inset 0 2px 4px -1px rgba(23,26,31,0.09)` light) presses the face in.
3. **Directional conic rim**: a 1.2px border ring (padding-box mask trick) whose brightness varies around the perimeter — hot spot at ~315° (upper-left), faint counter-glint at ~135°; the light theme adds a dark refracted lower-right edge. Opacity 0.75–0.8 at rest, 1 on hover.
4. **Whisper drop shadow**, slightly bottom-biased (e.g. `0 3px 9px -5px rgba(0,0,0,0.55)` dark / `0 2px 7px -4px rgba(23,26,31,0.16)` light); light-theme wings may carry the larger showroom shadow (`0 18px 40px -18px rgba(23,26,31,0.16), 0 3px 10px -4px rgba(23,26,31,0.07)`).

### Named Rules
**The Debossed Glass Rule.** Surfaces look ever-so-slightly raised yet
pressed in: flat face, inset top, rim carrying the glass. Never a glossy
dome, never a heavy outer glow.

**The Directional Light Rule.** All rims share one implied light source,
upper-left. Do not rotate the conic hot spot per component.

## Shapes

Capsule language. Interactive chips, buttons, and the composer are full
pills (999px); containers step down through pane 26px → band 24px → card
15px → tip bubble 13px (with a 4px pinched corner on the speaker's side).
Icons are bare strokes (no plates or chips behind them), 14–30px,
stroke-width 1.8–2.2. Ember is always a radial-gradient orb with a 1px
detached ring at -5px. Hover states translate surfaces up 2px with the
spring ease; LED bars slide in at the bottom edge.

## Components

### Caps (nav chips, murmur chips, minis)
- **Shape:** full pill (999px), 1px border
- **Fill:** white 4.5% alpha dark / white 58% light; hover brightens fill and border, lifts 2px
- **Text:** mid-tone gray/ink, brightening to high-emphasis on hover
- **Rim:** directional conic (all glass surfaces carry it)

### Nav capsule (primary navigation)
- **Shape:** one full-pill glass container (999px, 4px padding, 1px border,
  the shared cap fill/rim) holding the whole link set; each link is plain
  text at the Nav step and only takes a pill (999px) on hover or when current
- **Why a container, not a chip per link:** seven destinations plus two
  bar-end chips have to fit a 1152px content column. Per-link chips fit six
  at most; the capsule fits nine with ~28px to spare
- **Degradation as the bar narrows:** the dealer chip drops below 1200, the
  whole capsule folds into a burger disclosure below 1080, the points chip
  hides below 920. Never wraps, never overflows
- **Disclosure panel:** band radius (24px), near-opaque `--menu-bg` (a
  translucent surface let page text read through it), rows at body size,
  hover/current marked with the nub fill because the capsule's
  white-on-glass highlight disappears against a white panel

### Composer (Ask Ember)
- **Shape:** pill, padding 8px (20px text inset)
- **Fill:** white 5% dark / white 78% light, blur 18px
- **Send button:** nested pill; white 12% fill with white text (dark) / solid ink with white text (light); slides 2px right on hover
- **Edge:** full LED spectrum bar (ember→chartreuse→frost→magenta) on hover/focus only
- The composer is the page's primary action; nothing may outweigh it in the hero.

### Row cards (link rows inside wings)
- **Shape:** 15px radius, 1px border, padding 11px 13px 13px
- **Fill:** near-black 40% alpha dark / near-white 72% light
- **Hue cycling:** nth-child(4n+1..4) cycles frost → chartreuse → ember → magenta for the hover edge bar and icon tint (text-safe variants for icon color in light)
- **Right edge:** arrow glyph; optional magenta points badge before it

### Rewards band (homepage)
- **Shape:** 24px band; column on mobile, row on desktop (total, progress,
  links, then the CTA at the far end)
- **Reports state, never a route.** The 17 modules are collected in any order,
  so the band shows the standing total, a pill progress bar and
  "N / 17 modules completed" -- not a sequence of steps. It replaced a 4-node
  track that implied one
- **Ember is the rewards accent** and stays scarce: the standing total, the
  progress fill and the one action (sign in / view profile) take it; the two
  navigation links stay mid-tone. The fill is flat ember, not an LED spectrum
  -- a determinate bar reads as one quantity, and a four-hue gradient implied
  segments it does not have. Matches the amber score card on rewards.html
- **The action is a text link, never a filled pill.** A bordered capsule here
  reads as another text input -- same glass rounding and fill the composer
  uses -- so it competes with the fields instead of the copy

### Wings (intent panes)
- **Shape:** 26px pane, blur 18px; contains head (bare tinted icon + headline), Ember tip bubble, rows, minis
- Head icons are neutral ink at 22px, matching the tile icons on every other
  page; the wing's own hue (Explore = frost, Begin = chartreuse,
  Resolve = ember) shows in its row hovers and underlines, not the head

### Theme toggle
- A cap-styled icon button in the bar: sun icon in dark theme, moon in light.
  Sets `data-theme` on `<html>`, persists to `localStorage("aquafire-theme")`,
  honors `?theme=light|dark`. Default is dark.

### The Scene (signature: Hero Bleed imagery)
The lifestyle photograph bleeds full-width from y=0 behind the hero,
masked vertically (`mask-image: linear-gradient(180deg, #000 0% 44%,
transparent 98%)`) and graded by a theme-bound scrim that dissolves it into
the active ground — smoke or showroom. Hero display text and subtitle stay
white with soft text shadows in both themes because they sit on the photo.

### Named Rules
**The White-on-Photo Rule.** Type that sits on the photograph is white in
both themes; the scrim, not the text color, adapts to the theme.

## Do's and Don'ts

### Do:
- **Do** reference tokens for every color, shadow, and rim — new surfaces get both theme bindings or they don't ship.
- **Do** keep LED color on edges, nubs, badges, and icon tints; surfaces and text stay monochrome glass.
- **Do** keep pages mobile-first with the single 920px enhancement breakpoint.
- **Do** use the four-layer edged-glass recipe verbatim for any new surface (flat fill, debossed top, directional rim, whisper shadow).
- **Do** keep Ember's composer the visually primary action on every page that has one.
- **Do** label synthetic lifestyle imagery as illustrative (footer note) until brand photography replaces it.

### Don't:
- **Don't** add gradient fills, glossy domes, or outer glows to glass surfaces.
- **Don't** show LED edge bars at rest — hover/focus/active only.
- **Don't** put plates, chips, or cards behind icons or behind the hero title; they float bare.
- **Don't** use full-hue LED colors for text on the light ground — use the deepened ink variants.
- **Don't** introduce a second font family or revert to the old Poppins/Inter stack.
- **Don't** frame the hero photograph in a card on the homepage hero — it bleeds and dissolves (the framed "panorama band" treatment in `b2/` is the sanctioned alternative for content pages, not the hero).
