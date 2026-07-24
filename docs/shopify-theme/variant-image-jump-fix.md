# Fix: page jump when selecting a product variation (Shopify store)

**Where the code lives:** the live Impact theme on `tryaquafire.myshopify.com`
(`Updated copy of Updated copy of…`, theme ID `185926418752`), file
`layout/theme.liquid`. The adjustment is the `variant:change`
`<script>` block near the bottom of that file (right above the
`assistant.js` tag), commented *"Product gallery: show the selected
variant's image as soon as the customer interacts with the options."*

This is not part of the portal site in this repo — the repo only archives the
fix so it can be reviewed and pasted into the theme editor
(**Online Store → Themes → Edit code → `layout/theme.liquid`**).

> **Rev 2.** The first revision of this fix pinned the clicked option button by
> counter-scrolling on every animation frame. That fights the theme's own
> smooth scroll-to-media (and the sticky header, which resizes as the page
> scrolls), producing a violent jitter — the browser's smooth-scroll animation
> pulls toward its target each frame and the pin loop pushes back. Rev 2 never
> scrolls in a loop: it *prevents* the theme's page scroll instead of
> correcting it after the fact.

## Why the page jumped originally

The original script switched the gallery to the variant image and then tried to
cancel the resulting scroll shift with one immediate `window.scrollBy` call.
Three things defeated that:

1. **The theme keeps moving the page after the script is done.** Impact's own
   variant handler runs later and scrolls the selected media into view, and the
   `media-carousel`'s `adaptive-height` behavior *animates* the gallery height
   over several hundred milliseconds — long after the one-shot compensation ran.
2. **The compensation scroll itself animates** when smooth scrolling is active
   (`scroll-behavior: smooth`), reading as a jump of its own.
3. **In grid layout the swap is a large reflow with no height guard**, and the
   promoted image may still be lazy-loading, shifting layout again when it
   arrives.

## The fix (rev 2)

Replace the whole existing `variant:change` `<script>` block in
`layout/theme.liquid` (including the `{%- comment -%}` above it) with the
version below. Same behavior — the variant image is promoted/selected on any
option change — but with no scroll tug-of-war:

- **The gallery box is frozen** (`height` + `overflow: hidden` on the
  media-list wrapper) for ~450 ms, so neither the swap, the adaptive-height
  animation, nor a lazy-loading image can change the page height mid-switch;
- **The theme's scroll-to-gallery is suppressed** during that window
  (`scrollIntoView` becomes a no-op for elements inside this gallery only) —
  that scroll *was* the original jump, so it's blocked rather than corrected;
- **Exactly two instant corrections** (never a loop): one right after the swap
  for whatever the reflow shifted, one when the frozen height is released;
- rapid re-selections are safe: a new selection finishes the previous settle
  window first.

```html
{%- comment -%}
  Product gallery: show the selected variant's image as soon as the customer
  interacts with the options, without the page jumping. variant:change only
  fires on user interaction (never on first load), so the gallery keeps showing
  the first gallery image on load (set in snippets/product-gallery.liquid via
  product.selected_variant), then switches to the variant image once options
  are chosen — even when the theme's own logic would skip the switch (e.g.
  changing only the Cutout Size).

  Anti-jump strategy (rev 2): freeze the gallery box while the media swap and
  the theme's adaptive-height animation settle, and make scrollIntoView a
  no-op for this gallery during that window so the theme cannot scroll the
  page to the selected media (that scroll was the original jump). No per-frame
  counter-scrolling — a correction loop fights the browser's smooth-scroll
  animation and jitters.
{%- endcomment -%}
<script>
  (() => {
    const SETTLE_MS = 450;
    let cleanup = null;

    const instantScrollBy = (delta) => {
      if (!delta) return;
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollBy(0, delta);
      root.style.scrollBehavior = previous;
    };

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

      // If a previous selection is still settling, finish it first.
      if (cleanup) cleanup();

      const anchor = (event.target && event.target.getBoundingClientRect) ? event.target : null;
      const beforeTop = anchor ? anchor.getBoundingClientRect().top : 0;

      // Freeze the gallery box so neither the swap, the theme's adaptive-height
      // animation, nor a late-loading image can change the page height.
      const wrapper = gallery.querySelector('.product-gallery__media-list-wrapper') || gallery;
      wrapper.style.height = wrapper.getBoundingClientRect().height + 'px';
      wrapper.style.overflow = 'hidden';

      // While things settle, stop the theme from scrolling the page to the
      // gallery — its scroll-to-selected-media is the original "jump".
      const realScrollIntoView = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function () {
        if (!gallery.contains(this)) realScrollIntoView.apply(this, arguments);
      };

      const isScrollableCarousel = carousel.offsetParent && (carousel.scrollWidth - carousel.clientWidth > 5);

      slides.forEach((s) => { s.style.order = ''; s.style.gridColumn = ''; });

      if (isScrollableCarousel && typeof carousel.select === 'function') {
        carousel.select(index, { animate: false });
      } else if (slide !== carousel.firstElementChild) {
        // Grid layout: promote the variant image to the top highlight slot.
        slide.style.order = '-1';
        slide.style.gridColumn = 'span 2';
        carousel.firstElementChild.style.gridColumn = 'span 1';
      }

      // Single instant correction for whatever the swap itself shifted.
      if (anchor) instantScrollBy(anchor.getBoundingClientRect().top - beforeTop);

      let timer = null;
      cleanup = () => {
        clearTimeout(timer);
        Element.prototype.scrollIntoView = realScrollIntoView;
        const releaseTop = anchor ? anchor.getBoundingClientRect().top : 0;
        wrapper.style.height = '';
        wrapper.style.overflow = '';
        if (anchor) instantScrollBy(anchor.getBoundingClientRect().top - releaseTop);
        cleanup = null;
      };
      timer = setTimeout(cleanup, SETTLE_MS);
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
5. Test on a product page: switch Cutout Size / model options on desktop
   (grid gallery) and on a phone (carousel), including several selections in
   quick succession. The image should swap with the option list staying put
   under the cursor/finger and no oscillation.

If any jump remains on mobile only, the leftover motion is the theme's
carousel resizing between photos of different aspect ratios — cropping the
variant images to a consistent aspect ratio (or setting the gallery's mobile
media size to the non-expanded option) removes that entirely.
