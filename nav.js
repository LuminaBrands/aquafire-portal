/**
 * Nav group disclosures (Guides / Support) in the bar capsule.
 *
 * Shared rather than inlined per page: the nav markup is already duplicated
 * across 13 files with no template, and 13 copies of identical behaviour is
 * how the copies drift. The theme toggle and burger stay in each page's own
 * script -- this file only owns the groups.
 *
 * Click to open, not hover: hover menus are unreachable on touch, and the
 * capsule is the same markup on both.
 *
 * Inside the burger panel the groups are static labelled sections (see
 * redesign.css), so everything here is a no-op there -- the buttons take
 * pointer-events: none and the menus are always shown.
 */
(function () {
  var groups = [].slice.call(document.querySelectorAll('.navgroup'));
  if (!groups.length) return;

  function close(g) {
    g.classList.remove('is-open');
    var btn = g.querySelector('.navgroup-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function closeAll(except) {
    groups.forEach(function (g) { if (g !== except) close(g); });
  }

  groups.forEach(function (g) {
    var btn = g.querySelector('.navgroup-btn');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !g.classList.contains('is-open');
      closeAll(g);
      g.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });

    // Leaving the group by keyboard closes it, so tabbing through the bar does
    // not trail open menus behind it.
    g.addEventListener('focusout', function (e) {
      if (!g.contains(e.relatedTarget)) close(g);
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.navgroup')) closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.navgroup.is-open');
    if (!open) return;
    var btn = open.querySelector('.navgroup-btn');
    closeAll();
    if (btn) btn.focus();
  });
})();
