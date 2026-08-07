# Fix: page jump when selecting a product variation (Shopify store)

**Where the code lives:** the live Impact theme on `tryaquafire.myshopify.com`
(theme ID `185926418752`), file `layout/theme.liquid` — the `variant:change`
`<script>` block near the bottom (right above the `assistant.js` tag).

This is not part of the portal site in this repo — the repo archives the fix
so it can be reviewed and pasted into the theme editor
(**Online Store → Themes → Edit code → `layout/theme.liquid`**).

## Desired behavior (per Stefan, 2026-07-24)

- On page load the gallery shows the product's first backend gallery image.
- Variant options render as image-thumbnail swatches (already the case —
  that's the theme's `option-value.liquid` thumbnail type, driven by liquid,
  untouched here).
- Clicking a swatch selects the variant and **nothing else happens**: no
  gallery image swap, no carousel movement, no page jump. Price/buy-button
  updates still work (they're part of the theme's section rerender).

## What causes each unwanted behavior

1. **Gallery image swap:** built into the theme. `ProductGallery` listens for
   `variant:change` and calls `carousel.select(newPosition, { animate: false })`
   whenever the new variant's featured image differs from the previous one.
   To make selection do nothing visually, that call must be suppressed.
2. **Page jump:** the theme's rerender stage. On every option click Impact
   re-fetches the section HTML, swaps the product-info blocks, and restores
   focus to the re-rendered option input via `element.focus()` **without
   `preventScroll: true`** — the browser scrolls the page to that hidden
   input. (Both verified against the theme's `assets/theme.js` source.)

## The fix (rev 5)

Two small, independent guards — no gallery manipulation of our own at all:

1. **Focus guard:** programmatic `focus()` on elements inside
   `<product-rerender>` gets `preventScroll: true` forced. Kills the jump.
   Native Tab-key focus and focus calls elsewhere are unaffected.
2. **Gallery mute:** during a `variant:change` dispatch (and only then),
   `media-carousel.select()` is a no-op — so the theme's variant-driven image
   switch does nothing. Manual gallery use (thumbnails, arrows, swiping,
   dots) happens outside that dispatch and works exactly as before.

Debug mode: load a product page with `?jumpdebug` in the URL, open the
browser console (F12 → Console), click a swatch — every programmatic
scroll/focus call is logged with a stack trace, plus any sudden change in
scroll position or page height. A screenshot of that output pinpoints any
remaining movement definitively.

```html
{%- comment -%}
  Variant selection UX: selecting a variant swatch should do nothing visually
  — no gallery image swap (the theme's ProductGallery switches the carousel
  to the variant's featured image on variant:change; we mute media-carousel
  .select() during that dispatch only), and no page jump (the theme's
  ProductRerender restores focus after swapping the product-info blocks via
  focus() without preventScroll, which scrolls the page to the sr-only option
  input; we force preventScroll inside <product-rerender>). Manual gallery
  navigation (thumbnails, arrows, swipe) is untouched.

  Debug: append ?jumpdebug to a product URL and watch the console.
{%- endcomment -%}
<script>
  (() => {
    const DEBUG = new URLSearchParams(location.search).has('jumpdebug');
    const log = (...args) => DEBUG && console.log('[jumpdebug]', ...args);

    // 1. Focus guard — stops the rerender focus scroll (the page jump).
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

    // 2. Gallery mute — the theme's variant-driven carousel switch becomes a
    // no-op. The flag is only true during the variant:change dispatch itself
    // (all theme listeners run synchronously within it), so any other
    // select() call — thumbnail clicks, arrows, swipe settling — runs
    // normally.
    let mutingGallery = false;
    document.addEventListener('variant:change', () => {
      mutingGallery = true;
      queueMicrotask(() => { mutingGallery = false; });
    }, true);

    customElements.whenDefined('media-carousel').then(() => {
      const proto = customElements.get('media-carousel').prototype;
      const realSelect = proto.select;
      proto.select = function () {
        if (mutingGallery) {
          log('muted variant-driven gallery select', arguments[0]);
          return;
        }
        return realSelect.apply(this, arguments);
      };
    });

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
  })();
</script>
```

## Install

1. Shopify admin → **Online Store → Themes** → live theme → **Edit code**.
2. Open `layout/theme.liquid`.
3. Delete the currently installed block: the `{%- comment -%} … {%- endcomment -%}`
   comment plus the `<script>…</script>` right after it (just above the
   `<script src="https://aquafire.app/assistant.js" defer></script>` line).
4. Paste the block above in its place and save.
5. Hard-reload a product page. Clicking swatches should change only the
   selection state, price, and buy button — the gallery must not move and the
   page must not scroll. Then verify manual gallery navigation (thumbnail
   clicks, arrows, mobile swipe) still works.

Note on initial load: the gallery snippet initializes to
`product.selected_variant.featured_media | default: product.featured_media` —
with a plain product URL that is the first backend gallery image, as desired.
Only a URL carrying `?variant=…` (e.g. a shared link) starts on that
variant's image instead.

## If any movement remains

Open the product page with `?jumpdebug` appended to the URL, open the console
(F12 → Console), click the swatch, and screenshot the output — it identifies
the exact scroll/focus/height-change source with stack traces.

## Revision history

- **Rev 1-2** — gallery switch + scroll compensation machinery (pin loop →
  jitter; height freeze + delayed release → new jumps). Removed.
- **Rev 3** — added the `preventScroll` focus guard (correct, kept).
- **Rev 4** — minimal gallery switch + focus guard + `?jumpdebug` mode.
- **Rev 5** — requirement changed: variant selection should not touch the
  gallery at all. Removed all gallery-switch code; added the gallery mute so
  the theme's own variant-driven switch is a no-op. Focus guard and debug
  mode kept.
