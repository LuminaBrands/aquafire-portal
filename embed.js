/**
 * Embed mode — strips navigation, headers, and footers when ?embed is present.
 * Usage: <script src="embed.js"></script> (before </body>)
 * Embed:  <iframe src="page.html?embed" ...></iframe>
 */
(function () {
  if (!new URLSearchParams(window.location.search).has('embed')) return;

  // Elements to remove in embed mode
  var selectors = [
    '.site-nav',
    '.site-footer',
    '.page-header',
    '.wc-header',
    '.hero',
    '.pro-hero',
  ];

  selectors.forEach(function (sel) {
    var el = document.querySelector(sel);
    if (el) el.remove();
  });

  // Add embed class for any page-specific CSS overrides
  document.body.classList.add('is-embed');
})();
