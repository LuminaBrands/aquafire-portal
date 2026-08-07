/**
 * Embed mode — strips navigation, headers, and footers when ?embed is present.
 * Usage: <script src="embed.js"></script> (before </body>)
 * Embed:  <iframe src="page.html?embed" ...></iframe>
 *         <iframe src="page.html?embed&theme=light" ...>  (light lighting)
 *
 * The list below is the portal's chrome, by class name, so it has to be kept in
 * step with the chrome itself. It was not: the redesign renamed the nav, page
 * header and footer (.site-nav -> .bar, .page-header -> .phead,
 * .site-footer -> .pfoot) and this file kept asking for the old names, so from
 * the rollout until now `?embed` matched nothing and quietly stripped nothing on
 * every redesigned page. If you rename a chrome element, rename it here too.
 */
(function () {
  if (!new URLSearchParams(window.location.search).has('embed')) return;

  var selectors = [
    // Redesign chrome (redesign.css) — every customer-facing page.
    '.bar',    // nav capsule + the dealer/rewards/theme chips
    '.phead',  // page header: h1 and its intro line
    '.pfoot',  // inner-page footer
    '.foot',   // the homepage's one-line footer

    // Pre-redesign chrome. dealer-admin.html still runs on it, and these cost
    // nothing on pages that no longer have them.
    '.site-nav',
    '.site-footer',
    '.page-header',
    '.wc-header',
    '.pro-hero',
  ];

  // querySelectorAll, not querySelector: the old code removed only the first
  // match of each kind, so a page carrying two would have kept one.
  selectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.remove(); });
  });

  // Add embed class for any page-specific CSS overrides
  document.body.classList.add('is-embed');
})();
