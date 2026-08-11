/* ── Shared admin header ─────────────────────────────────────────────────────
   One header for the three internal pages (chat-insights.html, dealer-admin.html,
   help-admin.html), injected so there is exactly one copy of the markup. Rides on
   hub.css's .site-nav styling on purpose: the pre-redesign look is what visually
   separates the admin portal from the customer-facing site. All three pages load
   hub.css + Firebase compat, so this file only needs a <script defer> tag.

   Auth: the button reflects the page's own Firebase session. "Sign out" calls
   auth.signOut() (each page's gate then re-appears via its onAuthStateChanged);
   "Sign in" just focuses the page's gate — every admin page already renders its
   sign-in card when signed out. The gate stays the page's job; this header only
   reports and releases the session. */

(function () {
  'use strict';

  var PAGES = [
    { href: 'admin.html', label: 'Home' },
    { href: 'chat-insights.html', label: 'Chat Admin' },
    { href: 'dealer-admin.html', label: 'Dealer Portal' },
    { href: 'help-admin.html', label: 'Help Center' }
  ];

  // Per-page "see it live" action, rendered beside the auth button. Links open
  // the customer-facing counterpart in a new tab; chat-insights instead pops
  // the actual chat widget on the dashboard (the page mounts assistant.js in
  // test trim -- telemetry/alerts off -- and this drives its public API).
  var FRONTEND = {
    'chat-insights.html': { label: 'Test Chat', chat: true },
    'dealer-admin.html': { label: 'View Dealer Map', href: 'dealer-locator.html' },
    'help-admin.html': { label: 'View Help Center', href: 'help.html' }
  };
  var LOGO = 'https://cdn.shopify.com/s/files/1/0671/5562/4256/files/' +
    'Primary-White2_6e02bdc0-bca1-4414-b4be-f79c24dbb7e0.png?v=1772644031';

  var CSS =
    /* Own width class on purpose: every admin page redefines .container in its
       inline styles (padding, width), which would warp the nav's 56px row. */
    '.admin-nav .nav-inner { max-width: 1240px; margin: 0 auto; padding: 0 20px; gap: 12px; }' +
    '.admin-nav .nav-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }' +
    '.admin-tag {' +
    '  padding: 2px 8px; border: 1px solid var(--border-warm, #3a3229); border-radius: 999px;' +
    '  color: var(--amber, #e8a838); font-size: 0.68rem; font-weight: 600;' +
    '  letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;' +
    '}' +
    '.admin-auth-btn {' +
    '  margin-left: 8px; padding: 6px 14px; font-family: inherit; font-size: 0.82rem;' +
    '  font-weight: 500; color: var(--text-muted, #878c99); background: none;' +
    '  border: 1px solid var(--border, #2c3038); border-radius: 6px; cursor: pointer;' +
    '  white-space: nowrap; transition: color 0.15s, background 0.15s;' +
    '}' +
    '.admin-auth-btn:hover { color: var(--text, #e4e5e9); background: rgba(255,255,255,0.04); }' +
    /* The link variant needs the .site-nav .nav-links a qualifier to out-rank
       hub.css's own display:block on that same selector. */
    '.admin-view-btn, .site-nav .nav-links a.admin-view-btn {' +
    '  display: flex; align-items: center; gap: 6px; margin-left: 8px; padding: 6px 14px;' +
    '  font-size: 0.82rem; font-weight: 500; color: var(--amber, #e8a838);' +
    '  border: 1px solid var(--border-warm, #3a3229); border-radius: 6px;' +
    '  background: none; font-family: inherit; cursor: pointer; text-decoration: none;' +
    '  white-space: nowrap; transition: color 0.15s, background 0.15s;' +
    '}' +
    '.admin-view-btn:hover { color: var(--text, #e4e5e9); background: rgba(255,255,255,0.04); }' +
    '.admin-view-btn svg { display: block; }' +
    '.admin-theme-btn {' +
    '  margin-left: 8px; padding: 6px 10px; font-family: inherit; color: var(--text-muted, #878c99);' +
    '  background: none; border: 1px solid var(--border, #2c3038); border-radius: 6px; cursor: pointer;' +
    '  transition: color 0.15s, background 0.15s;' +
    '}' +
    '.admin-theme-btn:hover { color: var(--text, #e4e5e9); background: rgba(255,255,255,0.04); }' +
    '.admin-theme-btn svg { display: block; }' +
    '.admin-theme-btn .ico-moon { display: none; }' +
    '[data-theme="light"] .admin-theme-btn .ico-sun { display: none; }' +
    '[data-theme="light"] .admin-theme-btn .ico-moon { display: block; }' +
    '@media (max-width: 800px) { .admin-auth-btn, .admin-view-btn, .admin-theme-btn { margin-left: 0; } }';

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    for (var k in attrs) {
      if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { el.appendChild(c); });
    return el;
  }

  function here() {
    var path = location.pathname.split('/').pop() || '';
    return path;
  }

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var logoImg = h('img', { src: LOGO, alt: 'Aquafire' });
    var brand = h('div', { 'class': 'nav-brand' }, [
      h('a', { href: 'index.html', 'class': 'nav-logo', 'aria-label': 'Aquafire portal home' }, [logoImg]),
      h('span', { 'class': 'admin-tag', text: 'Admin' })
    ]);

    var toggle = h('button', {
      'class': 'nav-toggle', 'aria-label': 'Toggle menu', 'aria-expanded': 'false', type: 'button'
    }, [h('span', {}), h('span', {}), h('span', {})]);

    var links = h('ul', { 'class': 'nav-links' }, PAGES.map(function (p) {
      var a = h('a', { href: p.href, text: p.label });
      if (p.href === here()) {
        a.className = 'active';
        a.setAttribute('aria-current', 'page');
      }
      return h('li', {}, [a]);
    }));
    var fe = FRONTEND[here()];
    if (fe) {
      var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('width', '12');
      arrow.setAttribute('height', '12');
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', 'currentColor');
      arrow.setAttribute('stroke-width', '2.2');
      arrow.setAttribute('stroke-linecap', 'round');
      arrow.setAttribute('stroke-linejoin', 'round');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = fe.chat
        ? '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.9-.9L3 20l1-4.1a8.4 8.4 0 1 1 17-4.4z"/>'
        : '<path d="M7 17 17 7M9 7h8v8"/>';
      var viewEl;
      if (fe.chat) {
        viewEl = h('button', { 'class': 'admin-view-btn', type: 'button', text: fe.label });
        viewEl.appendChild(arrow);
        viewEl.addEventListener('click', function () {
          if (window.AquafireAssistant) AquafireAssistant.open();
        });
      } else {
        viewEl = h('a', {
          'class': 'admin-view-btn', href: fe.href, target: '_blank', rel: 'noopener', text: fe.label
        });
        viewEl.appendChild(arrow);
      }
      links.appendChild(h('li', {}, [viewEl]));
    }

    var authBtn = h('button', { 'class': 'admin-auth-btn', type: 'button', hidden: '', text: 'Sign in' });
    links.appendChild(h('li', {}, [authBtn]));

    // Theme toggle — same attribute + storage key as the customer portal, so
    // the choice follows the team between the two surfaces. Each page's head
    // script restores it before first paint; this button only flips it.
    var themeBtn = h('button', { 'class': 'admin-theme-btn', type: 'button' });
    themeBtn.innerHTML =
      '<svg class="ico-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="ico-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    function themeLabel() {
      themeBtn.setAttribute('aria-label', document.documentElement.dataset.theme === 'light'
        ? 'Switch to dark theme' : 'Switch to light theme');
    }
    themeBtn.addEventListener('click', function () {
      var root = document.documentElement;
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('aquafire-theme', root.dataset.theme); } catch (e) {}
      themeLabel();
    });
    themeLabel();
    links.appendChild(h('li', {}, [themeBtn]));

    var nav = h('nav', { 'class': 'site-nav admin-nav', 'aria-label': 'Admin' }, [
      h('div', { 'class': 'nav-inner' }, [brand, toggle, links])
    ]);
    document.body.insertBefore(nav, document.body.firstChild);

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    wireAuth(authBtn);
  }

  function wireAuth(btn) {
    // The page initializes Firebase itself; poll briefly until its app exists.
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var ready = window.firebase && firebase.apps && firebase.apps.length;
      if (!ready) { if (tries > 50) clearInterval(timer); return; }
      clearInterval(timer);
      var auth = firebase.auth();
      auth.onAuthStateChanged(function (user) {
        btn.hidden = false;
        btn.textContent = user ? 'Sign out' : 'Sign in';
        btn.title = user && user.email ? user.email : '';
      });
      btn.addEventListener('click', function () {
        if (auth.currentUser) { auth.signOut(); return; }
        // Signed out: the page is already showing its gate — hand focus to it.
        var field = document.querySelector(
          '#authGate input, #gate input, .auth-card input, .gate-card input');
        if (field) field.focus();
      });
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
