# Fix: page jump when selecting a product variation (Shopify store)

**Where the code lives:** the live Impact theme on `tryaquafire.myshopify.com`
(theme ID `185926418752`), file `layout/theme.liquid` — the `variant:change`
`<script>` block near the bottom (right above the `assistant.js` tag).

This is not part of the portal site in this repo — the repo archives the fix
so it can be reviewed and pasted into the theme editor
(**Online Store → Themes → Edit code → `layout/theme.liquid`**).

## Root cause (verified against the theme's `assets/theme.js`)

The theme's variant → gallery path never scrolls the page vertically. What
scrolls it is the **rerender stage**: on every option click, Impact fetches
the section HTML, swaps the product-info blocks in place, and then restores
focus to the re-rendered option input with `element.focus()` — **without
`preventScroll: true`**. The browser's default focus behavior scrolls the
page to that visually-hidden input near the buy buttons. This runs *before*
the `variant:change` event fires.

That focus scroll was very likely the original "strange page jump" all along.
Earlier revisions of this fix added compensation machinery on the gallery side
(per-frame scroll pinning → jitter; height freeze + delayed release +
scroll corrections → new jumps of their own). Rev 4 removes all of it.

## The fix (rev 4 — minimal)

Two well-understood pieces, nothing else:

1. **Focus guard** — programmatic `focus()` on elements inside
   `<product-rerender>` is forced to `preventScroll: true`. This kills the
   theme's rerender focus scroll. Native Tab-key focus and focus calls
   elsewhere on the page are unaffected.
2. **Gallery switch** — unchanged from the original adjustment: on
   `variant:change`, select the variant's image (instant horizontal move in
   carousel layouts; promote-to-highlight in desktop grid layout, with a
   single instant scroll correction so the reflow doesn't move the options
   under the cursor).

There are **no timers, no frozen heights, no delayed releases, no
scrollIntoView patches** — nothing that can move the page later or fight the
theme.

It also has a **debug mode**: load any product page with `?jumpdebug` in the
URL (e.g. `…/products/aquafire-pro?jumpdebug`), open the browser console
(F12 → Console), click a variation, and every programmatic scroll/focus call
is logged with a stack trace, plus any sudden change in scroll position or
page height. If any jump remains, a screenshot of that console output
identifies the culprit definitively — no more guessing.

```html
{%- comment -%}
  Product gallery: show the selected variant's image as soon as the customer
  interacts with the options, and stop the page from jumping when they do.

  The jump: Impact's ProductRerender swaps the product-info blocks on every
  option click and then restores focus with element.focus() WITHOUT
  preventScroll — the browser scrolls the page to the sr-only option input.
  We force preventScroll for focus() calls inside <product-rerender> only.

  The gallery switch: variant:change only fires on user interaction (never on
  first load), so the gallery keeps showing the first image on load, then
  switches to the variant image once options are chosen — even when the
  theme's own logic would skip the switch (e.g. changing only Cutout Size).

  Debug: append ?jumpdebug to a product URL and watch the console — all
  programmatic scroll/focus calls are logged with stack traces, plus any
  sudden scroll-position or page-height change.
{%- endcomment -%}
<script>
  (() => {
    const DEBUG = new URLSearchParams(location.search).has('jumpdebug');
    const log = (...args) => DEBUG && console.log('[jumpdebug]', ...args);

    // 1. Focus guard — the actual jump fix.
    const realFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (options) {
      if (this.closest && this.closest('product-rerender')) {
        options = Object.assign({}, options, { preventScroll: true });
        log('focus() inside product-rerender (preventScroll forced)', this);
      } else if (DEBUG) {
        log('focus() outside product-rerender (may scroll)', this, new Error().stack);
      }
      realFocus.call(this, options);
    };

    if (DEBUG) {
      const wrap = (obj, name, label) => {
        const real = obj[name];
        obj[name] = function () {
          console.log('[jumpdebug]', label, 'on', this, 'args:', arguments, new Error().stack);
          return real.apply(this, arguments);
        };
      };
      wrap(Element.prototype, 'scrollIntoView', 'scrollIntoView');
      wrap(Element.prototype, 'scrollTo', 'Element.scrollTo');
      wrap(window, 'scrollTo', 'window.scrollTo');
      wrap(window, 'scrollBy', 'window.scrollBy');

      let lastY = window.scrollY;
      let lastH = document.documentElement.scrollHeight;
      setInterval(() => {
        if (Math.abs(window.scrollY - lastY) > 40) {
          console.log('[jumpdebug] scrollY jumped:', lastY, '->', window.scrollY);
        }
        if (Math.abs(document.documentElement.scrollHeight - lastH) > 40) {
          console.log('[jumpdebug] page height changed:', lastH, '->', document.documentElement.scrollHeight);
        }
        lastY = window.scrollY;
        lastH = document.documentElement.scrollHeight;
      }, 100);
    }

    const instantScrollBy = (delta) => {
      if (!delta) return;
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollBy(0, delta);
      root.style.scrollBehavior = previous;
    };

    // 2. Gallery switch on variant change.
    document.addEventListener('variant:change', (event) => {
      const variant = event.detail && event.detail.variant;
      const media = variant && variant.featured_media;
      if (!media) return;

      const scope = (event.target.closest && event.target.closest('.shopify-section')) || document;
      const gallery = scope.querySelector('product-gallery') || document.querySelector('product-gallery');
      const carousel = gallery && gallery.querySelector('media-carousel');
      if (!carousel) return;

      const slides = Array.from(carousel.children);
      let index = slides.findIndex((s) => s.getAttribute('data-media-id') === String(media.id));
      if (index < 0) index = media.position - 1;
      const slide = slides[index];
      if (!slide) return;

      const anchor = (event.target && event.target.getBoundingClientRect) ? event.target : null;
      const beforeTop = anchor ? anchor.getBoundingClientRect().top : 0;

      const isScrollableCarousel = carousel.offsetParent && (carousel.scrollWidth - carousel.clientWidth > 5);

      slides.forEach((s) => { s.style.order = ''; s.style.gridColumn = ''; });

      if (isScrollableCarousel && typeof carousel.select === 'function') {
        log('carousel select', index);
        carousel.select(index, { animate: false });
      } else if (slide !== carousel.firstElementChild) {
        // Grid layout: promote the variant image to the top highlight slot.
        log('grid promote', index);
        slide.style.order = '-1';
        slide.style.gridColumn = 'span 2';
        carousel.firstElementChild.style.gridColumn = 'span 1';
      }

      // Single instant correction for whatever the reflow shifted (measured
      // synchronously; nothing runs later).
      if (anchor) instantScrollBy(anchor.getBoundingClientRect().top - beforeTop);
    }, true);
  })();
</script>
```

## Install

1. Shopify admin → **Online Store → Themes** → live theme → **Edit code**.
2. Open `layout/theme.liquid`.
3. Delete the currently installed block: the `{%- comment -%} Product gallery: … {%- endcomment -%}`
   comment plus the `<script>…</script>` right after it (just above the
   `<script src="https://aquafire.app/assistant.js" defer></script>` line).
4. Paste the block above in its place and save.
5. Hard-reload a product page and click through the variations, desktop and
   mobile, including the first click of each combination in a fresh tab.

## If a jump remains

Open the same product page with `?jumpdebug` appended to the URL, open the
browser console (F12 → Console), click the variation that jumps, and
screenshot the console output. The log lines pinpoint whether the movement is
a scroll call (and from whose code, via the stack trace), a focus call, or a
page-height change (layout reflow) — which is everything needed to fix it in
one step.

## Revision history

- **Rev 1** — gallery switch + one-shot `scrollBy` compensation, then a
  per-frame scroll "pin". The pin loop fought smooth scrolling and the sticky
  header → violent jitter. Removed.
- **Rev 2** — height freeze + 450 ms delayed release + gallery-scoped
  `scrollIntoView` no-op + two-stage corrections. Stopped the jitter but the
  delayed release/corrections could themselves move the page after the fact.
  Removed.
- **Rev 3** — added the `preventScroll` focus guard (correct, kept) on top of
  the rev 2 machinery (removed).
- **Rev 4** — focus guard + plain gallery switch with one synchronous
  correction, plus `?jumpdebug` diagnostics. Nothing runs on a timer.
