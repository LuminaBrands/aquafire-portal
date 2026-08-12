# Border Beam — `beam.css` + `beam.js`

The animated border-glow effect. A vanilla port of the `border-beam` npm
package (MIT), rebuilt as plain CSS because the portal has no React/build
step. This is the deep dive; the hard rules (two implementations move
together, colour priority) are in `CLAUDE.md`.

## Usage

Wrap anything:

```html
<div class="af-beam" data-beam-size="md" data-beam-variant="colorful">
  <!-- children render untouched -->
</div>
```

The effect is purely additive and degrades to a plain container without JS.
`beam.js` injects the bloom layer, auto-detects the wrapped child's radius,
and drives activate/deactivate.

- **Sizes:** `sm | md | line | pulse-inner | pulse-outside`
- **Variants:** `ember | colorful | ocean | sunset | mono` — `colorful` is
  the default; `ember` is the on-brand fire palette and tightens the hue
  cycle to 10deg so reds don't drift magenta.
- **Theme:** sync `data-beam-theme` to the page theme (see the toggle script
  in `index.html`).

## Colour priority (standing rule)

For any future palette work: **red/orange dominant, then blue/magenta, then
green.** It is enforced by *weight*, not by count — colours are assigned to
blobs by area, so moving a colour to a different `--afb-*` index changes its
weight. The split is documented in `beam.css` and currently lands 49/35/16 by
blob area.

## Behaviour & implementation notes

- `sm`/`md` sweep a **conic gradient**, which parameterises by angle rather
  than arc length — on a very wide element the beam crawls the long edges and
  moves fast across the short ends. An `offset-path` `rim` size that
  travelled by arc length was tried and removed: the even travel was correct
  but the diffuse conic glow is the wanted character (`docs/history.md`).
- The orbit runs at a deliberate **4s** — the package's stock 1.96s pulls the
  eye off the content the beam is meant to frame.
- Needs `@property` + `mask-composite`; `beam.js` feature-gates and no-ops on
  older browsers.
- Beams **pause when scrolled offscreen**, and `prefers-reduced-motion`
  freezes them lit rather than hiding them.
- The `#fff` literals in `beam.css` are **mask stencils** (alpha channels),
  not palette colors — impeccable's `design-system-color` rule flags them as
  false positives.

## Who loads it

`beam.css`/`beam.js` are **opt-in** — loaded by `beam-demo.html` (the
internal showcase/playground) and by `index.html`, where the hero composer is
wrapped in `.composer-beam.af-beam` at `size="md"`. The composer spends both
its own pseudo-elements on the glass rim and hover underline, so the beam
needs the wrapper element.

## The second implementation: inside `assistant.js`

The Ember chat widget is the one live consumer of the beam *look*, but it
does **not** use these files: `assistant.js` inlines its own trimmed copy
under the `afa-` namespace (it ships as a single script tag on Shopify and
can't link a stylesheet), applied to the composer field and brightened while
Ember is generating.

- Toggle with `AQUAFIRE_ASSISTANT_CONFIG.beam` = `'input' | 'panel' | false`
  and `.beamVariant` = `'colorful' | 'ember'`.
- **`index.html` sets `beam = false`** in a head script: its hero composer
  already beams and is the page's primary action, so the widget must not beam
  there too. `index.html` mounts Ember inline in the hero, so that head
  script is load-bearing — don't drop it.
- **Changing the beam look means editing both places** — `beam.css` and the
  inlined copy in `assistant.js`.
- `assistant.js` declares its own `var CSS` (the stylesheet string), which
  shadows the global `CSS` object — feature detection there must use
  `window.CSS`.
