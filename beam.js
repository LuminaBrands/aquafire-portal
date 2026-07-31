/* ── Border Beam controller ───────────────────────────────────────────────────
   Companion to beam.css. Vanilla port of the `border-beam` React package's
   runtime behaviour: injects the bloom layer, auto-detects the wrapped child's
   border-radius, and drives activate/deactivate.

   Usage — markup only, auto-initialised on DOMContentLoaded:

     <link rel="stylesheet" href="beam.css">
     <div class="af-beam" data-beam-size="md" data-beam-variant="colorful">
       <div class="card">...</div>
     </div>
     <script src="beam.js" defer></script>

   Options are data attributes on the wrapper (all optional):
     data-beam-size       sm | md | rim | line | pulse-inner |
                          pulse-outside                                 (md)
                          rim travels the outline at constant speed --
                          use it for wide elements, where the conic
                          sweep used by sm/md maps unevenly
     data-beam-variant    colorful | ember | ocean | sunset | mono  (colorful)
     data-beam-theme      dark | light | auto                            (dark)
     data-beam-radius     px override; otherwise read from the first child
     data-beam-duration   seconds (rotate/travel period)
     data-beam-strength   0-1 overall effect opacity
     data-beam-brightness / data-beam-saturation / data-beam-hue-range
     data-beam-static     present = no hue cycling
     data-beam-trigger    load | hover | visible                         (load)

   Script API:
     AquafireBeam.init(root)        scan + attach within root
     AquafireBeam.attach(el, opts)  attach one element
     AquafireBeam.activate(el)      turn the beam on
     AquafireBeam.deactivate(el)    fade the beam out

   Elements are only ever decorated - children render untouched if this script
   never runs, so the effect degrades to a plain container.
   ─────────────────────────────────────────────────────────────────────────── */

(function (global) {
  'use strict';

  var SIZES = ['sm', 'md', 'rim', 'line', 'pulse-inner', 'pulse-outside'];
  var VARIANTS = ['ember', 'colorful', 'ocean', 'sunset', 'mono'];
  var DEFAULT_RADIUS = { sm: 32, md: 16, rim: 16, line: 16, 'pulse-inner': 16, 'pulse-outside': 16 };

  var FADE_OUT_MS = 500;

  /* Feature gate: the effect needs registered custom properties (to animate an
     <angle>) and mask-composite. Without them the wrapper stays inert rather
     than rendering a broken half-effect. */
  var SUPPORTED = (function () {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    var hasProperty = typeof CSS.registerProperty === 'function';
    var hasMask =
      CSS.supports('mask-composite', 'exclude') ||
      CSS.supports('-webkit-mask-composite', 'xor');
    return hasProperty && hasMask;
  })();

  /* 'rim' rides the outline with offset-path. Without it there is no way to
     travel by arc length, so those wrappers fall back to the conic md beam. */
  var HAS_OFFSET_PATH = (function () {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('offset-path', 'path("M 0 0 L 10 10")') ||
      CSS.supports('offset-path', 'inset(0 round 8px)');
  })();

  function pick(value, allowed, fallback) {
    return allowed.indexOf(value) === -1 ? fallback : value;
  }

  function resolveTheme(el, requested) {
    if (requested !== 'auto') return requested;
    var dark =
      typeof global.matchMedia !== 'function' ||
      !global.matchMedia('(prefers-color-scheme: light)').matches;
    return dark ? 'dark' : 'light';
  }

  /* The beam ring must trace the wrapped card's own corner radius, otherwise
     the stroke floats off the edge. Read it from the first element child and
     fall back to the size preset. */
  function detectRadius(el, size) {
    var explicit = parseFloat(el.getAttribute('data-beam-radius'));
    if (!isNaN(explicit)) return explicit;

    var child = el.firstElementChild;
    while (child &&
           (child.classList.contains('af-beam-bloom') ||
            child.classList.contains('af-beam-rim'))) {
      child = child.nextElementSibling;
    }
    if (child) {
      var radius = parseFloat(global.getComputedStyle(child).borderTopLeftRadius);
      if (!isNaN(radius) && radius > 0) return radius;
    }
    return DEFAULT_RADIUS[size] || 16;
  }

  function setVar(el, name, attr, suffix) {
    var raw = el.getAttribute(attr);
    if (raw === null || raw === '') return;
    var value = parseFloat(raw);
    if (isNaN(value)) return;
    el.style.setProperty(name, value + (suffix || ''));
  }

  function ensureBloom(el) {
    var existing = el.querySelector(':scope > .af-beam-bloom');
    if (existing) return existing;
    var bloom = document.createElement('span');
    bloom.className = 'af-beam-bloom';
    bloom.setAttribute('aria-hidden', 'true');
    el.insertBefore(bloom, el.firstChild);
    return bloom;
  }

  /* offset-path: path() has years more browser support than the inset()/rect()
     coord-box forms Safari only shipped recently -- and a silent fallback to
     the conic md beam on older iOS is exactly the case we cannot see from
     here. So generate the rounded-rect outline instead of naming a shape.
     Coordinates are the rim's PADDING box (its own containing block), so the
     radius loses the border width. */
  function rimOutline(el) {
    var rim = el.querySelector(':scope > .af-beam-rim');
    if (!rim) return '';
    /* Measure the WRAPPER, not the rim: the rim is display:none until the
       beam activates, so its own box would read 0x0 here and we would fall
       back to inset() forever. The rim sits inset:0 inside the wrapper, so
       its padding box is the wrapper's box less one border width each side. */
    var bw = parseFloat(global.getComputedStyle(rim).borderTopWidth) || 0;
    var w = el.clientWidth - bw * 2;
    var h = el.clientHeight - bw * 2;
    if (w <= 0 || h <= 0) return '';
    var r = parseFloat(el.style.getPropertyValue('--af-beam-radius')) ||
      DEFAULT_RADIUS.rim;
    r = Math.max(0, Math.min(r - bw, w / 2, h / 2));
    var n = function (v) { return Math.round(v * 100) / 100; };
    var arc = ' A ' + n(r) + ' ' + n(r) + ' 0 0 1 ';
    return 'path("M ' + n(r) + ' 0' +
      ' H ' + n(w - r) + arc + n(w) + ' ' + n(r) +
      ' V ' + n(h - r) + arc + n(w - r) + ' ' + n(h) +
      ' H ' + n(r) + arc + '0 ' + n(h - r) +
      ' V ' + n(r) + arc + n(r) + ' 0 Z")';
  }

  function syncRimPath(el) {
    var path = rimOutline(el);
    if (path) el.style.setProperty('--af-comet-path', path);
  }

  function ensureRim(el) {
    var existing = el.querySelector(':scope > .af-beam-rim');
    if (existing) return existing;
    var rim = document.createElement('span');
    rim.className = 'af-beam-rim';
    rim.setAttribute('aria-hidden', 'true');
    el.insertBefore(rim, el.firstChild);
    return rim;
  }

  function activate(el) {
    if (!el || el.getAttribute('data-beam-ready') !== 'true') return;
    if (el._afBeamFadeTimer) {
      clearTimeout(el._afBeamFadeTimer);
      el._afBeamFadeTimer = null;
    }
    el.removeAttribute('data-beam-fading');
    el.setAttribute('data-beam-active', '');
  }

  function deactivate(el) {
    if (!el || !el.hasAttribute('data-beam-active')) return;
    el.setAttribute('data-beam-fading', '');
    el._afBeamFadeTimer = setTimeout(function () {
      el.removeAttribute('data-beam-active');
      el.removeAttribute('data-beam-fading');
      el._afBeamFadeTimer = null;
    }, FADE_OUT_MS);
  }

  /* Rotating conic gradients are not free; stop paying for beams that have
     scrolled out of view. */
  function observeVisibility(el, onEnter, onLeave) {
    if (typeof IntersectionObserver !== 'function') {
      onEnter();
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) onEnter();
          else onLeave();
        }
      },
      { rootMargin: '64px' }
    );
    observer.observe(el);
  }

  function attach(el, options) {
    if (!el || el.getAttribute('data-beam-ready') === 'true') return el;
    if (!SUPPORTED) return el;

    var opts = options || {};

    var size = pick(opts.size || el.getAttribute('data-beam-size'), SIZES, 'md');
    if (size === 'rim' && !HAS_OFFSET_PATH) size = 'md';
    var variant = pick(
      opts.variant || el.getAttribute('data-beam-variant'),
      VARIANTS,
      'colorful'
    );
    var theme = resolveTheme(
      el,
      pick(opts.theme || el.getAttribute('data-beam-theme'), ['dark', 'light', 'auto'], 'dark')
    );

    el.classList.add('af-beam');
    el.setAttribute('data-beam-size', size);
    el.setAttribute('data-beam-variant', variant);
    el.setAttribute('data-beam-theme', theme);

    el.style.setProperty('--af-beam-radius', detectRadius(el, size) + 'px');
    setVar(el, '--af-beam-duration', 'data-beam-duration', 's');
    setVar(el, '--af-beam-strength', 'data-beam-strength');
    setVar(el, '--af-beam-brightness', 'data-beam-brightness');
    setVar(el, '--af-beam-saturation', 'data-beam-saturation');
    setVar(el, '--af-beam-hue-range', 'data-beam-hue-range', 'deg');

    if (el.hasAttribute('data-beam-static')) el.setAttribute('data-beam-static', '');

    ensureBloom(el);
    if (size === 'rim') {
      ensureRim(el);
      syncRimPath(el);
      if (typeof ResizeObserver === 'function') {
        new ResizeObserver(function () { syncRimPath(el); }).observe(el);
      }
    }
    el.setAttribute('data-beam-ready', 'true');

    var trigger = el.getAttribute('data-beam-trigger') || opts.trigger || 'load';
    if (trigger === 'hover') {
      el.addEventListener('mouseenter', function () { activate(el); });
      el.addEventListener('mouseleave', function () { deactivate(el); });
      el.addEventListener('focusin', function () { activate(el); });
      el.addEventListener('focusout', function () { deactivate(el); });
    } else if (trigger === 'visible') {
      observeVisibility(el, function () { activate(el); }, function () { deactivate(el); });
    } else {
      observeVisibility(
        el,
        function () { activate(el); },
        function () { el.removeAttribute('data-beam-active'); }
      );
    }

    return el;
  }

  function init(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('.af-beam, [data-beam-size]');
    for (var i = 0; i < nodes.length; i++) attach(nodes[i]);
    return nodes.length;
  }

  var AquafireBeam = {
    init: init,
    attach: attach,
    activate: activate,
    deactivate: deactivate,
    supported: SUPPORTED,
    sizes: SIZES,
    variants: VARIANTS
  };

  global.AquafireBeam = AquafireBeam;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})(window);
