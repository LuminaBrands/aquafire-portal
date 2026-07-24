# Fix: page jump when selecting a product variation (Shopify store)

**Where the code lives:** the live Impact theme on `tryaquafire.myshopify.com`
(`Updated copy of Updated copy of…`, theme ID `185926418752`), file
`layout/theme.liquid`. The previous adjustment is the `variant:change`
`<script>` block near the bottom of that file (right above the
`assistant.js` tag), commented *"Product gallery: show the selected
variant's image as soon as the customer interacts with the options."*

This is not part of the portal site in this repo — the repo only archives the
fix so it can be reviewed and pasted into the theme editor
(**Online Store → Themes → Edit code → `layout/theme.liquid`**).

## Why the page still jumps

The current script switches the gallery to the variant image and then tries to
cancel the resulting scroll shift with one `window.scrollBy(...)` call, measured
immediately after it re-orders the gallery. Three things defeat that:

1. **The theme keeps moving the page after the script is done.** Impact's own
   variant handler runs after this capture-phase listener and re-selects the
   gallery media itself, and the `media-carousel` element has `adaptive-height`
   — it *animates* its height to match the newly selected slide over several
   hundred milliseconds. A single immediate `scrollBy` measures a shift of
   ~0px and then the layout drifts for the rest of the animation, so everything
   below the gallery visibly slides.
2. **The compensation scroll itself animates.** If smooth scrolling is active
   (CSS `scroll-behavior: smooth` or browser setting), `window.scrollBy(0, x)`
   glides instead of snapping, which reads as a jump of its own.
3. **In grid layout the swap is a huge reflow with no height guard.** Promoting
   the variant slide with `order: -1` / `grid-column: span 2` (and demoting the
   first slide to `span 1`) changes the gallery column's height in one frame,
   and the promoted image may still be lazy-loading — when it arrives, layout
   shifts again, after the one-shot compensation already ran.

## The fix

Replace the whole existing `variant:change` `<script>` block in
`layout/theme.liquid` with the version below. Same behavior (variant image is
promoted/selected on any option change), but it eliminates the jump by:

- **Freezing the gallery height** (`min-height` on the media-list wrapper)
  before the swap, releasing it after the new media has settled;
- **Pinning the option picker the shopper just clicked** to its on-screen
  position for ~600 ms: every animation frame it measures how far the picker
  moved and counter-scrolls **instantly** (forcing `scroll-behavior: auto`
  during the correction), which absorbs the theme's own late re-selection and
  the adaptive-height animation;
- keeping both existing paths (mobile/desktop carousel via
  `carousel.select(index, { animate: false })`, desktop grid via slide
  promotion) unchanged otherwise.

```html
{%- comment -%}
  Product gallery: show the selected variant's image as soon as the customer
  interacts with the options, without the page jumping. variant:change only
  fires on user interaction (never on first load), so the gallery keeps showing
  the first gallery image on load (set in snippets/product-gallery.liquid via
  product.selected_variant), then switches to the variant image once options
  are chosen — even when the theme's own logic would skip the switch (e.g.
  changing only the Cutout Size).

  Anti-jump strategy: freeze the gallery's height during the swap, and for
  ~600ms pin the option picker the shopper just used to its on-screen position
  (instant counter-scroll each frame) so the theme's adaptive-height carousel
  animation and late variant handling can't shift the page under their finger.
{%- endcomment -%}
<script>
  (() => {
    const PIN_DURATION = 600; // ms — covers Impact's adaptive-height transition

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

      // Freeze the gallery column so the media swap can't collapse it mid-switch.
      const wrapper = gallery.querySelector('.product-gallery__media-list-wrapper') || gallery;
      wrapper.style.minHeight = wrapper.getBoundingClientRect().height + 'px';

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

      // Pin the picker the shopper just used: counter-scroll instantly on every
      // frame while the theme's own handlers and height animation settle.
      const anchor = (event.target && event.target.getBoundingClientRect) ? event.target : null;
      if (anchor) {
        let anchorTop = anchor.getBoundingClientRect().top;
        const startedAt = performance.now();

        const pin = (now) => {
          const currentTop = anchor.getBoundingClientRect().top;
          instantScrollBy(currentTop - anchorTop);
          anchorTop = anchor.getBoundingClientRect().top;

          if (now - startedAt < PIN_DURATION) {
            requestAnimationFrame(pin);
          } else {
            wrapper.style.minHeight = '';
            instantScrollBy(anchor.getBoundingClientRect().top - anchorTop);
          }
        };

        requestAnimationFrame(pin);
      } else {
        setTimeout(() => { wrapper.style.minHeight = ''; }, PIN_DURATION);
      }
    }, true);
  })();
</script>
```

## Install

1. Shopify admin → **Online Store → Themes** → live theme → **Edit code**.
2. Open `layout/theme.liquid`.
3. Delete the existing block: the `{%- comment -%} Product gallery: … {%- endcomment -%}`
   comment plus the `<script>…</script>` right after it (just above the
   `<script src="https://aquafire.app/assistant.js" defer></script>` line).
4. Paste the block above in its place and save.
5. Test on a product page: switch Cutout Size / model options on desktop
   (grid gallery) and on a phone (carousel). The image should swap with the
   option list staying put under the cursor/finger.

If any jump remains on mobile only, the leftover motion is the theme's
`adaptive-height` carousel resizing between photos of different aspect ratios —
cropping the variant images to a consistent aspect ratio (or setting the
gallery's mobile media size to the non-expanded option) removes that entirely.
