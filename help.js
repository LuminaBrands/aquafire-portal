/* ──────────────────────────────────────────────────────────────────────────
   Aquafire Help Center — render + search engine.
   Vanilla JS, no dependencies. Renders into #help-app.

   How it works:
     • Data comes from help-articles.js (HELP_CATEGORIES / HELP_ARTICLES), and
       is optionally merged with team-authored docs from the Firestore
       `helpArticles` collection (published only). Firestore being absent,
       empty or broken is silent — the static catalogue always works.
     • Three views: home (search + category grid + popular), category
       (article list), article (breadcrumb + body + related). Search results
       replace the home/category content in place.
     • URLs: help.html · help.html?category=<id> · help.html?article=<slug>.
       Navigation uses pushState; popstate re-renders; a direct load of any of
       those URLs works. An unknown id/slug renders the home view.
     • The search index is built once from title + keywords + teaser +
       tag-stripped body. The body is stripped with a regex into a string that
       is never put back into the DOM as markup — only escaped text.

   Everything lives inside <main>, so ?embed keeps working. When embed.js has
   removed .phead (and with it the search form), the engine mounts its own
   search field at the top of the app instead.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var APP = document.getElementById('help-app');
  if (!APP) return;

  var CATS = window.HELP_CATEGORIES || [];
  var ARTICLES = (window.HELP_ARTICLES || []).slice();

  /* Hand-picked for the home view. Slugs that do not exist are skipped, and
     the list is topped up from the catalogue so the section never looks
     half-built while the article set is still growing. */
  var POPULAR = [
    'my-aquafire-is-beeping', 'flame-low-or-uneven', 'general-cleaning',
    'mist-maker-cleaning-replacement', 'pro-phone-app-not-connecting',
    'aquafire-limited-warranty'
  ];

  var MODEL_LABEL = { original: 'Original', pro: 'Pro', lite: 'Lite' };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  /* ── Icons (inline SVG, matching the .t-ico stroke style) ─────────────── */
  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICONS = {
    spark:  S + '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/><circle cx="12" cy="12" r="2.6"/></svg>',
    hammer: S + '<path d="M14.5 3.5 21 10l-2.5 2.5-6.5-6.5z"/><path d="m12.5 8.5-9 9L6 20l9-9"/><path d="m10 6-2 2"/></svg>',
    flame:  S + '<path d="M12 3s5 4.2 5 8.5a5 5 0 0 1-10 0C7 9 9 7.4 9 7.4S9.6 9 11 9c0-2.4 1-4.6 1-6z"/></svg>',
    wrench: S + '<path d="M20 6.5a4.6 4.6 0 0 1-6 5.9l-6.3 6.3a2.1 2.1 0 0 1-3-3l6.3-6.3A4.6 4.6 0 0 1 17.5 4z"/></svg>',
    drop:   S + '<path d="M12 3.5c3 3.6 5.5 6.4 5.5 9.4a5.5 5.5 0 0 1-11 0c0-3 2.5-5.8 5.5-9.4z"/></svg>',
    shield: S + '<path d="M12 3l7.5 3.5v5c0 4.5-3 8.3-7.5 9.5-4.5-1.2-7.5-5-7.5-9.5v-5z"/><path d="m9.2 11.8 2 2 3.6-3.8"/></svg>',
    doc:    S + '<path d="M6 3.5h7L18.5 9v11.5h-12z"/><path d="M13 3.5V9h5.5"/><path d="M9 13h6M9 16.5h4"/></svg>',
    cart:   S + '<path d="M3.5 4.5h2.4l2.2 11h10.4l2-8H7.1"/><circle cx="9.5" cy="19.3" r="1.5"/><circle cx="16.9" cy="19.3" r="1.5"/></svg>',
    brief:  S + '<rect x="3.5" y="7.5" width="17" height="12" rx="1.8"/><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M3.5 12.5h17"/></svg>',
    arrow:  '<svg class="arr" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
  };
  function icon(name) { return ICONS[name] || ICONS.doc; }

  /* ── Text helpers ─────────────────────────────────────────────────────── */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  /* Tag-strip for the search index. Regex, not innerHTML: nothing from an
     article body (or from Firestore) is ever parsed into a live element here,
     and what comes out is treated as plain text everywhere it is used. */
  function stripTags(html) {
    return String(html || '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&(?:quot|#34);/g, '"').replace(/&(?:#39|apos);/g, "'")
      .replace(/&[a-z]+;|&#\d+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function rxEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function updatedLabel(u) {
    var m = /^(\d{4})-(\d{2})$/.exec(u || '');
    return m ? MONTHS[Number(m[2]) - 1] + ' ' + m[1] : '';
  }

  /* ── Index ────────────────────────────────────────────────────────────── */
  var BY_SLUG = {}, INDEX = [];

  function rebuild() {
    BY_SLUG = {}; INDEX = [];
    ARTICLES.forEach(function (a) {
      if (!a || !a.slug) return;
      BY_SLUG[a.slug] = a;
      var text = stripTags(a.html);
      INDEX.push({
        slug: a.slug,
        title: String(a.title || '').toLowerCase(),
        keys: (a.keywords || []).join(' ').toLowerCase(),
        teaser: String(a.teaser || '').toLowerCase(),
        text: text,
        textLC: text.toLowerCase()
      });
    });
  }

  function catById(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return null;
  }
  function inCategory(id) {
    return ARTICLES.filter(function (a) { return a && a.category === id; });
  }
  function slugIndex(slug) {
    for (var i = 0; i < ARTICLES.length; i++) if (ARTICLES[i] && ARTICLES[i].slug === slug) return i;
    return -1;
  }

  /* ── Search ───────────────────────────────────────────────────────────── */
  function terms(q) {
    return q.toLowerCase().split(/[^a-z0-9]+/i)
      .filter(function (t) { return t.length > 1 || /^\d$/.test(t); });
  }

  function score(entry, ts, phrase, requireAll) {
    var total = 0, hits = 0;
    if (phrase.length > 2 && entry.title.indexOf(phrase) >= 0) total += 120;
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i], hit = false;
      if (entry.title.indexOf(t) >= 0) { total += 45; hit = true; }
      if (entry.keys.indexOf(t) >= 0) { total += 22; hit = true; }
      if (entry.teaser.indexOf(t) >= 0) { total += 10; hit = true; }
      if (entry.textLC.indexOf(t) >= 0) { total += 5; hit = true; }
      if (hit) hits++;
    }
    if (!hits) return 0;
    if (requireAll && hits < ts.length) return 0;
    return total;
  }

  function runQuery(q) {
    var ts = terms(q);
    if (!ts.length) return [];
    var phrase = q.toLowerCase().trim();

    function pass(requireAll) {
      var out = [];
      INDEX.forEach(function (e) {
        var s = score(e, ts, phrase, requireAll);
        if (s > 0) out.push({ entry: e, score: s });
      });
      out.sort(function (a, b) {
        return b.score - a.score || a.entry.title.localeCompare(b.entry.title);
      });
      return out;
    }
    /* All terms first (precise); fall back to any-term so a stray word does
       not empty the page. */
    var hits = pass(true);
    return (hits.length || ts.length < 2) ? hits : pass(false);
  }

  function snippet(entry, ts) {
    var text = entry.text, at = -1;
    for (var i = 0; i < ts.length && at < 0; i++) at = entry.textLC.indexOf(ts[i]);
    if (at < 0) return esc(text.slice(0, 150)) + (text.length > 150 ? '…' : '');
    var start = Math.max(0, at - 60), end = Math.min(text.length, start + 170);
    if (start > 0) start = text.indexOf(' ', start) + 1 || start;
    var cut = text.slice(start, end);
    return (start > 0 ? '…' : '') + mark(cut, ts) + (end < text.length ? '…' : '');
  }

  /* One combined pass so inserted <mark> tags are never rescanned, and entity
     names are excluded so a term cannot land inside an escape sequence. */
  function mark(text, ts) {
    var safe = ts.filter(function (t) { return !/^(amp|lt|gt|quot|apos)$/.test(t); });
    var out = esc(text);
    if (!safe.length) return out;
    var re = new RegExp('(' + safe.map(rxEsc).join('|') + ')', 'gi');
    return out.replace(re, '<mark>$1</mark>');
  }

  /* ── Shared partials ──────────────────────────────────────────────────── */
  function hrefFor(kind, id) {
    var p = new URLSearchParams(location.search), out = new URLSearchParams();
    ['embed', 'theme'].forEach(function (k) { if (p.has(k)) out.set(k, p.get(k)); });
    if (kind) out.set(kind, id);
    var qs = out.toString();
    return 'help.html' + (qs ? '?' + qs : '');
  }

  function articleRow(a, extra) {
    return '<a class="row" href="' + esc(hrefFor('article', a.slug)) + '">' +
      '<span class="r-ico">' + icon('doc') + '</span>' +
      '<span><b>' + esc(a.title) + '</b><span>' + (extra || esc(a.teaser || '')) + '</span></span>' +
      ICONS.arrow + '</a>';
  }

  function modelChips(models) {
    var m = models || [];
    var all = ['original', 'pro', 'lite'].every(function (k) { return m.indexOf(k) >= 0; });
    var list = all ? ['All models'] : m.map(function (k) { return MODEL_LABEL[k] || k; });
    return list.map(function (l) { return '<span class="ha-chip">' + esc(l) + '</span>'; }).join('');
  }

  function stuckBlock() {
    return '<div class="ha-stuck">' +
      '<b>Still stuck?</b>' +
      '<p>Walk your symptom through the guided <a href="troubleshoot.html">Troubleshooter</a>, ' +
      'or head to the <a href="support.html">Support hub</a> to reach a person. The chat at the ' +
      'corner of the page knows these articles too.</p>' +
      '</div>';
  }

  function countLabel(n) { return n === 1 ? '1 article' : n + ' articles'; }

  /* ── Views ────────────────────────────────────────────────────────────── */
  function viewHome() {
    var cards = CATS.map(function (c) {
      var n = inCategory(c.id).length;
      return '<a class="tile" href="' + esc(hrefFor('category', c.id)) + '">' +
        '<span class="t-ico">' + icon(c.icon) + '</span>' +
        '<b>' + esc(c.title) + '</b>' +
        '<p>' + esc(c.blurb) + '</p>' +
        '<span class="ha-count">' + (n ? countLabel(n) : 'Coming soon') + '</span>' +
        '</a>';
    }).join('');

    var picked = [];
    POPULAR.forEach(function (s) { if (BY_SLUG[s]) picked.push(BY_SLUG[s]); });
    ARTICLES.forEach(function (a) {
      if (picked.length >= 6 || picked.indexOf(a) >= 0) return;
      if (picked.length < 3) picked.push(a);
    });

    return '<h2 class="ha-h" id="ha-top" tabindex="-1">Browse by topic</h2>' +
      '<div class="tiles">' + cards + '</div>' +
      (picked.length
        ? '<h2 class="ha-h ha-h-sub">Popular articles</h2><div class="rows">' +
          picked.map(function (a) { return articleRow(a); }).join('') + '</div>'
        : '') +
      stuckBlock();
  }

  function viewCategory() {
    var c = catById(state.id);
    if (!c) return viewHome();
    var list = inCategory(c.id);
    return crumbs([{ label: c.title }]) +
      '<h2 class="ha-title" id="ha-top" tabindex="-1">' + esc(c.title) + '</h2>' +
      '<p class="ha-lede">' + esc(c.blurb) + '</p>' +
      (list.length
        ? '<p class="ha-count-line">' + countLabel(list.length) + '</p><div class="rows">' +
          list.map(function (a) { return articleRow(a); }).join('') + '</div>'
        : '<div class="ha-empty"><p>There are no articles in this section yet.</p></div>') +
      stuckBlock();
  }

  function viewArticle() {
    var a = BY_SLUG[state.id];
    if (!a) return viewHome();
    var c = catById(a.category);
    var trail = c ? [{ label: c.title, kind: 'category', id: c.id }, { label: a.title }]
                  : [{ label: a.title }];
    var when = updatedLabel(a.updated);

    var rel = (a.related || []).map(function (s) { return BY_SLUG[s]; })
      .filter(function (r) { return r && r.slug !== a.slug; });

    return '<article class="ha-article">' +
      crumbs(trail) +
      '<h2 class="ha-title" id="ha-top" tabindex="-1">' + esc(a.title) + '</h2>' +
      '<div class="ha-meta">' + modelChips(a.models) +
        (when ? '<span class="ha-updated">Updated ' + esc(when) + '</span>' : '') +
      '</div>' +
      '<div class="ha-body">' + (a.html || '') + '</div>' +
      (rel.length
        ? '<h3 class="ha-h ha-h-sub">Related articles</h3><div class="rows">' +
          rel.map(function (r) { return articleRow(r); }).join('') + '</div>'
        : '') +
      stuckBlock() +
      '</article>';
  }

  function viewSearch() {
    var q = state.q.trim();
    var ts = terms(q);
    var hits = runQuery(q);
    var head = '<h2 class="ha-title" id="ha-top" tabindex="-1">' +
      (hits.length ? countLabel(hits.length) + ' for “' + esc(q) + '”'
                   : 'No results for “' + esc(q) + '”') + '</h2>';

    if (!hits.length) {
      return head +
        '<div class="ha-empty">' +
        '<p>Try a shorter phrase, or the word you would see on the fireplace itself &mdash; ' +
        '“beeping”, “float sensor”, “cutout”.</p>' +
        '<p>Otherwise the guided <a href="troubleshoot.html">Troubleshooter</a> narrows a symptom ' +
        'down in a few taps, and the <a href="support.html">Support hub</a> gets you to a person.</p>' +
        '</div>' +
        '<p class="ha-back-line"><a href="' + esc(hrefFor(null)) + '">Back to all topics</a></p>';
    }

    return head + '<div class="rows">' +
      hits.map(function (h) {
        return articleRow(BY_SLUG[h.entry.slug], snippet(h.entry, ts));
      }).join('') + '</div>' +
      '<p class="ha-back-line"><a href="' + esc(hrefFor(null)) + '">Back to all topics</a></p>';
  }

  function crumbs(trail) {
    var parts = ['<a href="' + esc(hrefFor(null)) + '">Help Center</a>'];
    trail.forEach(function (t) {
      parts.push(t.kind
        ? '<a href="' + esc(hrefFor(t.kind, t.id)) + '">' + esc(t.label) + '</a>'
        : '<span aria-current="page">' + esc(t.label) + '</span>');
    });
    return '<nav class="ha-crumbs" aria-label="Breadcrumb">' +
      parts.join('<span class="ha-crumb-sep" aria-hidden="true">›</span>') + '</nav>';
  }

  /* ── State + rendering ────────────────────────────────────────────────── */
  var state = { view: 'home', id: null, q: '', base: { view: 'home', id: null } };
  var VIEW = document.createElement('div');
  VIEW.className = 'ha-view';

  function titleFor() {
    if (state.view === 'article' && BY_SLUG[state.id]) return BY_SLUG[state.id].title + ' | Aquafire Help Center';
    if (state.view === 'category' && catById(state.id)) return catById(state.id).title + ' | Aquafire Help Center';
    if (state.view === 'search') return 'Search: ' + state.q.trim() + ' | Aquafire Help Center';
    return 'Help Center | Interactive Aquafire Guide';
  }

  function render(focus) {
    VIEW.innerHTML =
      state.view === 'search' ? viewSearch() :
      state.view === 'article' ? viewArticle() :
      state.view === 'category' ? viewCategory() : viewHome();

    /* Authors just write <table>; the scroll container is the engine's job. */
    var tables = VIEW.querySelectorAll('.ha-body table');
    [].forEach.call(tables, function (t) {
      var wrap = document.createElement('div');
      wrap.className = 'ha-table-wrap';
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    document.title = titleFor();
    if (focus) {
      var top = document.getElementById('ha-top');
      if (top) { try { top.focus({ preventScroll: true }); } catch (e) { top.focus(); } }
    }
  }

  function routeFromURL() {
    var p = new URLSearchParams(location.search);
    var a = p.get('article'), c = p.get('category');
    if (a && BY_SLUG[a]) return { view: 'article', id: a };
    if (c && catById(c)) return { view: 'category', id: c };
    return { view: 'home', id: null };
  }

  function go(view, id, push) {
    state.view = view; state.id = id; state.q = '';
    state.base = { view: view, id: id };
    if (input) { input.value = ''; syncClear(); }
    if (push) {
      history.pushState({ v: view, id: id }, '', hrefFor(view === 'home' ? null : view, id));
    }
    window.scrollTo(0, 0);
    render(true);
  }

  /* Internal links are handled in place. Anything pointing at another page —
     or at a slug/category we do not have — falls through to the browser. */
  function internalRoute(href) {
    if (!href) return null;
    var q = href.indexOf('?');
    var path = q < 0 ? href : href.slice(0, q);
    if (path && path !== 'help.html' && path !== './help.html' && path !== '/help.html') return null;
    var p = new URLSearchParams(q < 0 ? '' : href.slice(q + 1));
    var a = p.get('article'), c = p.get('category');
    if (a) return BY_SLUG[a] ? { view: 'article', id: a } : null;
    if (c) return catById(c) ? { view: 'category', id: c } : null;
    return { view: 'home', id: null };
  }

  APP.addEventListener('click', function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !APP.contains(a) || a.target === '_blank') return;
    var r = internalRoute(a.getAttribute('href'));
    if (!r) return;
    e.preventDefault();
    go(r.view, r.id, true);
  });

  window.addEventListener('popstate', function () {
    var r = routeFromURL();
    state.q = '';
    if (input) { input.value = ''; syncClear(); }
    state.view = r.view; state.id = r.id;
    state.base = { view: r.view, id: r.id };
    render(true);
  });

  /* ── Search box ───────────────────────────────────────────────────────── */
  var form = document.getElementById('ha-search-form');
  var input = document.getElementById('ha-search-input');
  var clearBtn = document.getElementById('ha-search-clear');

  /* embed.js removes .phead, and with it the form — mount a compact one in the
     app so the embedded browser is still searchable. */
  function mountFallbackSearch() {
    var host = document.createElement('form');
    host.className = 'ha-search ha-search-inline';
    host.setAttribute('role', 'search');
    host.innerHTML =
      '<label class="ha-vh" for="ha-search-input">Search the help center</label>' +
      '<span class="ha-search-field">' +
      '<svg class="ha-search-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input class="ha-search-input" id="ha-search-input" name="q" type="search" autocomplete="off" ' +
      'spellcheck="false" placeholder="Search help articles…">' +
      '<button class="ha-search-clear" id="ha-search-clear" type="button" hidden aria-label="Clear search">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '</span>';
    APP.appendChild(host);
    form = host;
    input = host.querySelector('#ha-search-input');
    clearBtn = host.querySelector('#ha-search-clear');
  }

  function syncClear() {
    if (clearBtn) clearBtn.hidden = !(input && input.value);
  }

  function applyQuery(q) {
    state.q = q;
    if (q.trim()) {
      state.view = 'search'; state.id = null;
    } else {
      state.view = state.base.view; state.id = state.base.id;
    }
    render(false);
  }

  function bindSearch() {
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function () {
      syncClear();
      var v = input.value;
      clearTimeout(timer);
      timer = setTimeout(function () { applyQuery(v); }, 120);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !input.value) return;
      input.value = ''; syncClear(); applyQuery('');
    });
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearTimeout(timer);
        applyQuery(input.value);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = ''; syncClear(); applyQuery(''); input.focus();
      });
    }
  }

  /* ── Team-authored articles (Firestore, optional) ─────────────────────── */
  function mergeTeamArticles() {
    var fb = window.firebase;
    if (!fb || !fb.apps || !fb.apps.length || !fb.firestore) return;
    var db;
    try { db = fb.firestore(); } catch (e) { return; }

    /* The where-clause is required by the security rules: an unfiltered list
       query on helpArticles is denied. */
    db.collection('helpArticles').where('published', '==', true).get().then(function (snap) {
      var touched = {}, changed = false;
      var replacements = [], hides = [];
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        if (!d.slug) return;
        /* A doc flagged hidden is an instruction, not an article: it retires
           that slug from the Help Center (help-admin's "Hide" on a built-in
           article, the only way to drop one without a deploy). It carries
           published: true so this query — and the security rules — can see
           it; the flag, not the field, is what it means. */
        if (d.hidden) { hides.push(String(d.slug)); return; }
        if (!d.html) return;
        replacements.push({
          slug: String(d.slug), title: d.title || String(d.slug), category: d.category || '',
          models: d.models || ['original', 'pro', 'lite'], updated: d.updated || '',
          teaser: d.teaser || '', keywords: d.keywords || [], related: d.related || [],
          html: d.html
        });
      });
      replacements.forEach(function (a) {
        var i = slugIndex(a.slug);
        if (i >= 0) ARTICLES[i] = a; else ARTICLES.push(a);
        touched[a.slug] = a.category;
        changed = true;
      });
      /* Hides are applied after the replacements so a hide always wins for a
         given slug, whatever order Firestore returned the docs in. */
      hides.forEach(function (slug) {
        var i = slugIndex(slug);
        if (i < 0) return;
        touched[slug] = ARTICLES[i].category;
        ARTICLES.splice(i, 1);
        changed = true;
      });
      if (!changed) return;
      rebuild();

      /* Quietly: only redraw when what is on screen actually changed. */
      if (state.view === 'article' && !touched[state.id]) return;
      if (state.view === 'category') {
        var relevant = Object.keys(touched).some(function (s) { return touched[s] === state.id; });
        if (!relevant) return;
      }
      render(false);
    }).catch(function () { /* static catalogue stands on its own */ });
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  rebuild();
  APP.innerHTML = '';           // drops the <noscript> fallback
  if (!input) mountFallbackSearch();
  APP.appendChild(VIEW);
  bindSearch();

  var start = routeFromURL();
  state.view = start.view; state.id = start.id;
  state.base = { view: start.view, id: start.id };
  history.replaceState({ v: state.view, id: state.id }, '');

  /* A ?q= landing (the no-JS form target) opens straight onto results. */
  var q0 = new URLSearchParams(location.search).get('q');
  if (q0 && input) { input.value = q0; syncClear(); state.q = q0; state.view = 'search'; }

  render(false);

  if (document.readyState === 'complete') mergeTeamArticles();
  else window.addEventListener('load', mergeTeamArticles);
})();
