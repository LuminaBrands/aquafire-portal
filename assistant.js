/* ──────────────────────────────────────────────────────────────────────────
   Aquafire Assistant — "Ember" · embeddable AI support & pre-sale chat widget.
   Vanilla JS, no dependencies, self-contained (injects its own CSS).

   Install anywhere (portal page or Shopify theme.liquid) with one tag:
     <script src="https://<host>/assistant.js" defer></script>

   How it works:
     • Renders a floating launcher + chat panel (Gorgias-style).
     • Answers come from the built-in INTENTS knowledge base (specs, pricing,
       install, warranty, troubleshooting — sourced from docs/source-material/).
     • Optional LLM mode: set window.AQUAFIRE_ASSISTANT_CONFIG.apiEndpoint to a
       Claude-API proxy (see docs/chat-assistant.md) and free-form questions are
       answered by the model, with the local KB as instant fallback.
     • Portal links resolve against the script's own origin, so deep links into
       the troubleshooter/enclosure/water tools work when embedded on
       aquafire.com.

   Config (window.AQUAFIRE_ASSISTANT_CONFIG or data-* on the script tag):
     portalBase   — absolute base URL of the portal (default: script's own dir)
     markUrl      — Ember's avatar artwork (default: portalBase + ember-mark.png)
     apiEndpoint  — POST endpoint for LLM replies (optional)
     notifyEndpoint — POST endpoint that Slack-alerts dead ends (optional)
     showInEmbed  — set true to show inside ?embed iframes (default hidden, so
                    a Shopify page embedding a portal tool doesn't get 2 widgets)

   ⚠️ Editing answers: keep copy short and action-first. Facts must trace to
   docs/source-material/ — update both when Aquafire revises a doc.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  if (window.__aquafireAssistant) return;
  window.__aquafireAssistant = true;

  var script = document.currentScript;
  var cfg = window.AQUAFIRE_ASSISTANT_CONFIG || {};
  function dataAttr(name) { return script ? script.getAttribute('data-' + name) : null; }

  // Hide inside ?embed iframes (host page carries its own widget)
  var qs = new URLSearchParams(window.location.search);
  if (qs.has('embed') && !cfg.showInEmbed && dataAttr('embed') !== 'show') return;

  /* ── Bases & contacts ─────────────────────────────────────────────────── */
  var PORTAL_BASE = cfg.portalBase || dataAttr('portal-base') ||
    (script && script.src ? script.src.replace(/[^\/]*(\?.*)?$/, '') : '');
  var STORE = 'https://www.aquafire.com';
  var HELP = 'https://aquafire.gorgias.help/en-US';

  function pURL(path) { return PORTAL_BASE + path; }

  // AI answers: unmatched questions go to the portal's /api/chat function
  // (api/chat.js on Vercel). Override with cfg.apiEndpoint, or set it to null
  // to disable. If the endpoint fails once (e.g. no API key configured yet),
  // we stop trying for this page load and use the local KB fallback.
  var API_ENDPOINT = cfg.apiEndpoint !== undefined
    ? cfg.apiEndpoint
    : (PORTAL_BASE ? PORTAL_BASE + 'api/chat' : '');
  var llmDown = false;

  // Border Beam (beam.css / beam.js) applied to the widget. Because this file
  // ships as a single script tag on Shopify it cannot link beam.css, so a
  // trimmed subset is inlined below under the afa- namespace.
  //   cfg.beam = 'input'  beam the composer field (default)
  //            = 'panel'  beam the whole chat window
  //            = false    off
  var BEAM = cfg.beam !== undefined ? cfg.beam : (dataAttr('beam') || 'input');
  if (BEAM === 'off' || BEAM === 'false') BEAM = false;
  //   cfg.beamVariant = 'colorful' full spectrum (default) | 'ember' fire palette
  var BEAM_VARIANT = cfg.beamVariant || dataAttr('beam-variant') || 'colorful';

  // Inline mount: render the panel inside a host container instead of the
  // corner launcher. The host owns showing/hiding it and drives the widget
  // through window.AquafireAssistant. Used by the redesign hero composer,
  // which expands in place into this panel rather than opening a bubble.
  var MOUNT = cfg.mount || dataAttr('mount') || null;
  // Order & tracking lookup: the order_status flow POSTs { order, email } to
  // the portal's /api/order-status function (a Shopify Admin API proxy —
  // api/order-status.js). Override with cfg.orderEndpoint, or set it to null
  // to disable. Until that function has its Shopify token it 503s, and the
  // flow falls back to the email-the-orders-team answer for this page load.
  var ORDER_ENDPOINT = cfg.orderEndpoint !== undefined
    ? cfg.orderEndpoint
    : (PORTAL_BASE ? PORTAL_BASE + 'api/order-status' : '');
  var orderDown = false;

  // Team alerts on Ember's dead ends: fire-and-forget POST to the portal's
  // /api/notify-slack function (Slack webhook relay). Five kinds —
  //   'unanswered' no KB match and AI unavailable
  //   'unresolved' the AI answered but said it couldn't help
  //   'llm_error'  /api/chat errored, customer got the local fallback
  //   'handoff'    a contact card was shown
  //   'callback'   the customer left their email for a follow-up
  // Handoffs fire at most once per conversation (a second contact card is not
  // new information); the others fire per occurrence and the function dedupes
  // repeats. Override with cfg.notifyEndpoint, or null to disable; a 503
  // (webhook not configured yet) stops attempts for this page load.
  var NOTIFY_ENDPOINT = cfg.notifyEndpoint !== undefined
    ? cfg.notifyEndpoint
    : (PORTAL_BASE ? PORTAL_BASE + 'api/notify-slack' : '');
  var notifyDown = false;
  var lastUserText = '';

  // Offer to collect the customer's email for a human follow-up — asked
  // before a contact card is shown, and after dead-end replies (once per
  // conversation). Disable with cfg.collectEmail = false. The address rides
  // the 'callback' Slack alert, is logged as a 'contact_left' event — the one
  // deliberate, consented exception to the "no customer emails in telemetry"
  // rule; the incidental-email masks below stay in force for everything
  // else — and is stored in Mailchimp via /api/collect-email
  // (api/collect-email.js). Override the store with cfg.emailEndpoint, or
  // null to disable storage while keeping the Slack alert.
  var COLLECT_EMAIL = cfg.collectEmail !== false;
  var EMAIL_ENDPOINT = cfg.emailEndpoint !== undefined
    ? cfg.emailEndpoint
    : (PORTAL_BASE ? PORTAL_BASE + 'api/collect-email' : '');

  function storeEmail(email) {
    if (!EMAIL_ENDPOINT) return;
    try {
      fetch(EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ email: email, convo: state.cid })
      }).catch(function () { /* Slack alert + telemetry still carry it */ });
    } catch (e) { /* ignore */ }
  }

  function maskEmails(s) {
    return String(s || '').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, function (e) {
      return /@(aquafire|luminabrands)\.com$/i.test(e) ? e : '[email]';
    });
  }

  function notify(kind, data) {
    if (!NOTIFY_ENDPOINT || notifyDown) return;
    if (kind === 'handoff') {
      if (state.notified) return;
      state.notified = true;
      persist();
    }
    try {
      var recent = state.msgs.filter(function (m) { return m.who === 'user'; })
        .slice(-3).map(function (m) { return maskEmails(m.text).slice(0, 200); });
      // Quote the last question the customer actually typed — "Talk to a human"
      // is a chip, and tells the team nothing about what they were stuck on.
      var question = (data && data.question) || lastUserText ||
        (recent.length ? recent[recent.length - 1] : '');
      fetch(NOTIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(Object.assign({
          kind: kind, convo: state.cid,
          page: location.pathname, host: location.hostname,
          model: state.ctx.model || '',
          mode: (data && data.mode) || '',
          // The customer's consented follow-up address — the one field the
          // masks don't touch, and only on the 'callback' kind.
          email: kind === 'callback' ? String((data && data.email) || '') : undefined,
          question: maskEmails(question).slice(0, 400),
          reply: maskEmails(data && data.reply).slice(0, 700),
          recent: recent
        }, visitorCtx()))
      }).then(function (r) {
        // Not configured / refused — stop trying for this page load.
        if (!r.ok && r.status !== 429) notifyDown = true;
      }).catch(function () { /* never bother the customer over this */ });
    } catch (e) { /* ignore */ }
  }

  var SUPPORT_EMAIL = 'support@aquafire.com';
  var SALES_EMAIL = 'sales@aquafire.com';
  var ORDERS_EMAIL = 'orders@aquafire.com';
  var PHONE = '(877) 888-4260';
  var PHONE_TEL = '+18778884260';

  /* ── Product catalog (live store data — prices may drift; cards link out) */
  var CDN = 'https://cdn.shopify.com/s/files/1/0671/5562/4256/files/';
  var PRODUCTS = {
    pro: {
      name: 'Aquafire Pro', sku: 'AWPR',
      img: CDN + 'IMG-2502.jpg?v=1782248702&width=400',
      url: STORE + '/products/aquafire-pro',
      price: 'From $3,995',
      blurb: '30+ flame colors \u00b7 phone app \u00b7 direct-plumb ready \u00b7 20\u00a0hr runtime'
    },
    original: {
      name: 'Aquafire Original', sku: 'AWA',
      img: CDN + 'Aquafire_water_vapor_fireplace.png?v=1767715553&width=400',
      url: STORE + '/products/aquafire-water-vapor-electric-fireplace',
      price: 'From $2,990',
      blurb: 'Classic amber flame \u00b7 remote \u00b7 20\u00a0hr runtime \u00b7 plumb kit optional'
    },
    lite: {
      name: 'Aquafire Lite', sku: 'AWL',
      img: CDN + '1-DSC01662.jpg?v=1756822140&width=400',
      url: STORE + '/products/aquafire-lite',
      price: 'From $1,699',
      blurb: 'Entry level \u00b7 amber flame \u00b7 manual fill \u00b7 8\u201310\u00a0hr runtime'
    },
    gatsby: {
      name: 'Aquafire Gatsby', sku: 'AWL-GAT',
      img: CDN + 'gatsby_single_black_flame.jpg?v=1754486986&width=400',
      url: STORE + '/products/aquafire-gatsby-water-vapor-electric-fireplace',
      price: '$2,400',
      blurb: 'Freestanding display \u00b7 plug-and-play \u00b7 no enclosure needed'
    },
    mistMaker: {
      name: 'Ultrasonic Mist Maker', sku: 'SP-W-U-MM',
      img: CDN + 'SP-W-U-MM_MistMaker.jpg?v=1708031626&width=400',
      url: STORE + '/products/ultrasonic-mist-maker',
      price: '$81',
      blurb: 'Replace every 2,000\u20133,000 operating hours'
    }
  };

  /* ── Help-article & video links (mirrors troubleshoot.js) ─────────────── */
  var VIDEOS = {
    appConnect: { label: 'Connect the AFIRE app', url: 'https://youtu.be/exr4qep4cyA' },
    locateMistMaker: { label: 'Locate & remove the mist maker', url: 'https://youtu.be/cJ1LZDUxzu4' },
    cleanMM1: { label: 'Mist maker cleaning \u2014 Part 1', url: 'https://youtu.be/gQx12sy2Npg' },
    cleanMM2: { label: 'Mist maker cleaning \u2014 Part 2', url: 'https://youtu.be/8Jaj3N2YUKI' },
    agitateFloat: { label: 'Freeing a stuck float sensor', url: 'https://youtu.be/Y_caX56hz-k' },
    beepLowWater: { label: 'What the Beep? \u2014 Low / No Water', url: 'https://youtu.be/elCwmtnKpZo' },
    beepOverflow: { label: 'What the Beep? \u2014 Overflow / High Water', url: 'https://youtu.be/FqJP-wLYBhY' },
    beepVoltage: { label: 'What the Beep? \u2014 Voltage / Power Adapter', url: 'https://youtu.be/Dk-9FRpVdzk' }
  };

  /* ── Small helpers ────────────────────────────────────────────────────── */
  var MODEL_NAMES = { pro: 'Aquafire Pro', original: 'Aquafire Original', lite: 'Aquafire Lite', gatsby: 'Aquafire Gatsby', unknown: 'your Aquafire' };
  function modelName(m) { return MODEL_NAMES[m] || MODEL_NAMES.unknown; }

  function detectModel(text) {
    if (/\b(pro|awpr)\b/.test(text)) return 'pro';
    if (/\b(original|awa\d?)\b/.test(text)) return 'original';
    if (/\b(lite|awl)\b/.test(text)) return 'lite';
    if (/\bgatsby\b/.test(text)) return 'gatsby';
    return null;
  }

  function tsLink(node, label) {
    var url = pURL('troubleshoot.html' + (node ? '?node=' + node : '') +
      (state.ctx.model && state.ctx.model !== 'unknown' && state.ctx.model !== 'gatsby'
        ? (node ? '&' : '?') + 'model=' + state.ctx.model : ''));
    return { label: label || 'Open the guided Troubleshooter', href: url };
  }

  /* ══════════════════════════════════════════════════════════════════════
     KNOWLEDGE BASE — intents
     Each: { id, kw: [[phrase, weight], …], test?: regex, answer(q) → blocks }
     Blocks: {t:'text',html} {t:'steps',items} {t:'cards',items} {t:'links',items}
             {t:'videos',keys} {t:'chips',items} {t:'contact',mode} — plus
             optional response-level {feedback:true}
     ══════════════════════════════════════════════════════════════════════ */

  function contactBlock(mode) { return { t: 'contact', mode: mode || 'support' }; }

  function productCards(keys) {
    return { t: 'cards', items: keys.map(function (k) { return PRODUCTS[k]; }) };
  }

  var CHIP_HUMAN = { label: '\ud83d\udcac Talk to a human', send: 'Talk to a human' };

  var INTENTS = [

    /* ── Small talk ─────────────────────────────────────────────────── */
    {
      id: 'greet',
      test: /^(hi|hello|hey|howdy|good (morning|afternoon|evening)|yo|sup)[\s!,.]*$/,
      kw: [],
      answer: function () {
        return {
          blocks: [
            { t: 'text', html: 'Hi! \ud83d\udc4b I can help with anything Aquafire \u2014 picking a model, planning an install, or fixing an issue with one you own. What can I do for you?' },
            mainChips()
          ]
        };
      }
    },
    {
      id: 'thanks',
      test: /^(thanks|thank you|thx|ty|great|awesome|perfect|cool)[\s!,.]*$/,
      kw: [],
      answer: function () {
        return { blocks: [{ t: 'text', html: 'You\u2019re welcome! Anything else I can help with? \ud83d\udd25' }, mainChips()] };
      }
    },

    /* ── Pre-sale: product & buying ─────────────────────────────────── */
    {
      id: 'how_it_works',
      kw: [['how does it work', 6], ['how do they work', 6], ['what is aquafire', 6], ['what is a water vapor', 6], ['real fire', 4], ['real flame', 4], ['vapor', 2], ['mist', 2], ['ultrasonic', 3], ['is it a real', 4], ['fake fire', 4], ['illusion', 3]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Aquafire is a <strong>water vapor fireplace</strong>: ultrasonic mist makers turn ordinary tap water into a fine, cool mist, and LED lighting makes it dance like real flames \u2014 no gas, no combustion, no real fire. Because there\u2019s no heat, you can build it into walls, furniture, even bar tops, and it runs safely every day of the year.' },
            { t: 'chips', items: [{ label: 'Is it safe to touch?', send: 'Is the flame safe to touch?' }, { label: 'Compare models', send: 'Compare the models' }, { label: 'What does it cost to run?', send: 'What does it cost to run?' }] }
          ]
        };
      }
    },
    {
      id: 'safety',
      kw: [['safe', 3], ['safety', 4], ['kids', 4], ['children', 4], ['child', 3], ['pets', 4], ['dog', 3], ['cat', 3], ['touch', 3], ['hot', 2], ['burn', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Yes \u2014 the \u201cflame\u201d is just cool water vapor lit by LEDs, so there\u2019s <strong>no real fire, no heat, and nothing to burn</strong>. It\u2019s safe around kids and pets, and safe to touch. There are also no fumes or emissions, so no venting or gas line is required.' },
            { t: 'chips', items: [{ label: 'Does it give off heat?', send: 'Does it produce heat?' }, { label: 'Compare models', send: 'Compare the models' }] }
          ]
        };
      }
    },
    {
      id: 'heat',
      kw: [['heat', 4], ['heater', 4], ['warm', 3], ['warmth', 4], ['temperature', 2], ['heat output', 6], ['btu', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Aquafire produces <strong>no heat</strong> \u2014 it\u2019s a pure ambiance fireplace. The upside: zero clearance worries, no venting, and you can enjoy the flames in summer too. If you need room heating, plan a separate heat source; the insert itself stays cool.' }
          ]
        };
      }
    },
    {
      id: 'compare',
      kw: [['compare', 5], ['difference', 5], ['differences', 5], ['which model', 6], ['what model', 5], ['models', 3], ['vs', 3], ['versus', 3], ['best model', 5], ['recommend', 3], ['lineup', 4], ['options', 2]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Here\u2019s the lineup at a glance:' },
            productCards(['pro', 'original', 'lite', 'gatsby']),
            { t: 'text', html: '<strong>Pro (AWPR)</strong> is the flagship \u2014 30+ preset flame colors, AFIRE phone app, internal UV-C sanitizing, and it connects straight to a water line out of the box. <strong>Original (AWA)</strong> gives you the classic amber flame with a remote; the Direct Plumb Kit add-on (sold separately) enables a water-line connection. <strong>Lite (AWL)</strong> is the value pick \u2014 amber flame, manual fill, 8\u201310\u00a0hr per tank. <strong>Gatsby</strong> is freestanding, so there\u2019s no enclosure to build at all.' },
            { t: 'links', items: [{ label: '\u2696\ufe0f Full spec table \u2014 Why Aquafire?', href: STORE + '/pages/compare-vs-aquafire' }] },
            { t: 'chips', items: [{ label: 'Sizes & dimensions', send: 'What sizes are available?' }, { label: 'Pricing', send: 'How much do they cost?' }, { label: 'Installation basics', send: 'How is it installed?' }] }
          ]
        };
      }
    },
    {
      id: 'competitors',
      kw: [['dimplex', 9], ['opti-myst', 9], ['optimyst', 9], ['opti myst', 9], ['magikflame', 9], ['magik flame', 9], ['modern flames', 8], ['better than', 5], ['competitor', 7], ['competitors', 7], ['other brands', 7], ['alternatives', 5], ['why aquafire', 8], ['why choose', 5], ['best water vapor', 6], ['best electric fireplace', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Great question \u2014 there are some well-known names in flame effects, and we\u2019re glad you\u2019re comparing. Here\u2019s why we believe Aquafire is the one to beat:' },
            { t: 'steps', items: [
              '<strong>The most realistic flame, period</strong> \u2014 ultrasonic mist and LED light create a full 3-D flame made of real vapor. You can wave your hand through it.',
              '<strong>Zero constraints</strong> \u2014 no heat, no venting, no gas. Build it into walls, cabinetry, bar tops, even a coffee table \u2014 or under a TV (just add a mantel shelf between).',
              '<strong>Room to dream big</strong> \u2014 gang units into up to <strong>20 feet</strong> of continuous flame on one remote; the Pro adds 30+ colors, a phone app, out-of-the-box direct plumbing, and UV-C water sanitizing.',
              '<strong>Proven where it counts</strong> \u2014 built by A-Fire Design, whose water-vapor technology runs in Hilton, Ritz-Carlton, Marriott, and Disney properties.',
              '<strong>Backed properly</strong> \u2014 2-year residential warranty, US-based support, every part replaceable, and a free design review of your plans.'
            ]},
            { t: 'text', html: 'We\u2019d rather show you than tell you \u2014 see one running in person, or send your plans to <a href="mailto:' + SALES_EMAIL + '">' + SALES_EMAIL + '</a> for a free design review.' },
            { t: 'links', items: [{ label: '\u2696\ufe0f Why Aquafire? Side-by-side comparisons', href: STORE + '/pages/compare-vs-aquafire' }, { label: '\ud83d\udcd6 The 2026 Water Vapor Fireplace Buying Guide', href: STORE + '/blogs/learn/the-complete-water-vapor-fireplace-buying-guide-for-2026' }, { label: '\ud83d\udccd See one at a dealer near you', href: pURL('dealer-locator.html') }, { label: '\ud83d\uded2 Explore the lineup', href: STORE }] },
            { t: 'chips', items: [{ label: '\ud83d\udd25 Compare Aquafire models', send: 'Compare the models' }, { label: '\ud83d\udcb2 Pricing', send: 'How much do they cost?' }, { label: '\ud83c\udfa5 How it works', send: 'How does it work?' }] }
          ]
        };
      }
    },
    {
      id: 'pricing',
      kw: [['price', 6], ['pricing', 6], ['cost', 4], ['how much', 6], ['expensive', 4], ['cheap', 3], ['budget', 3], ['msrp', 5], ['buy', 2], ['sale', 3], ['discount', 4], ['financing', 4]],
      answer: function (q) {
        var blocks = [
          { t: 'text', html: 'Current pricing on aquafire.com (tap a card for live pricing on every size):' },
          productCards(['lite', 'original', 'pro', 'gatsby']),
          { t: 'text', html: 'Each model comes in multiple widths (16\u201360 inches), and price scales with size \u2014 e.g. the Pro runs from $3,995 (20\u2033) to $10,995 (60\u2033). For quotes on multi-unit or commercial projects, our sales team is happy to help.' },
          { t: 'chips', items: [{ label: 'Compare models', send: 'Compare the models' }, { label: '\ud83d\udce7 Ask sales', send: 'Talk to sales' }] }
        ];
        if (/financ/.test(q)) {
          blocks.splice(3, 0, { t: 'text', html: 'For financing options, check the product page at checkout or ask our sales team directly.' });
        }
        return { feedback: true, blocks: blocks };
      }
    },
    {
      id: 'sizes',
      kw: [['size', 4], ['sizes', 5], ['dimensions', 6], ['width', 4], ['wide', 3], ['inches', 3], ['cutout', 6], ['opening', 4], ['how big', 5], ['measurements', 5], ['depth', 4], ['fit', 2]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Inserts come in <strong>20\u2033, 40\u2033 and 60\u2033</strong> widths (the Lite adds a 16\u2033 Mini). All are about 12\u2033 deep and 11\u215c\u2033 tall, designed for a flush, drop-in install.' },
            { t: 'text', html: 'Cutout dimensions are critical \u2014 the insert hangs from its flanges, so the opening has to be right (e.g. a 40\u2033 unit needs a 40\u215c\u2033 \u00d7 12\u00bc\u2033 opening with 12\u201314\u2033 of depth below, depending on model). That width carries \u215c\u2033 of clearance in total \u2014 \u215c\u2033 over nominal, split across the two outside edges, against the \u00bc\u2033 in the spec sheets \u2014 which our install crews recommend so the insert seats without being forced. Two inserts can also be ganged into an 80\u2033, 100\u2033 or 120\u2033 run sharing one opening. Our Enclosure Guide calculates it for your exact model and size:' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Enclosure dimension calculator', href: pURL('enclosure-guide.html') }] },
            { t: 'chips', items: [{ label: 'Can I make a longer flame?', send: 'Can I combine multiple units?' }, { label: 'Installation basics', send: 'How is it installed?' }] }
          ]
        };
      }
    },
    {
      id: 'ganging',
      kw: [['gang', 5], ['ganged', 6], ['ganging', 6], ['combine', 4], ['multiple units', 6], ['longer', 3], ['ribbon', 5], ['continuous', 4], ['side by side', 5], ['80', 2], ['100 inch', 6], ['120', 2], ['two fireplaces', 8], ['two units', 8], ['two inserts', 8], ['2 units', 6], ['second unit', 6], ['connect two', 7], ['80 inch', 6], ['120 inch', 6], ['80"', 5], ['100"', 5], ['120"', 5], ['run', 2]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Yes! Pro and Original inserts gang together seamlessly to create up to <strong>20 feet (240\u2033) of continuous flame</strong>, all controlled from a single remote. Common combos: two 40\u2033 units for 80\u2033, a 60\u2033 + 40\u2033 for 100\u2033, or two 60\u2033 units for 120\u2033. (The Lite is the one model that can\u2019t be ganged.)' },
            { t: 'text', html: 'A ganged run drops into <strong>one continuous cutout</strong>, not two: 80\u215c\u2033, 100\u215c\u2033 or 120\u215c\u2033 wide, with depth and height the same as a single insert. The \u215c\u2033 of clearance is split across the two outside edges \u2014 the units meet flush, so nothing is added in the middle.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Size a ganged cutout in the Enclosure Guide', href: pURL('enclosure-guide.html') }] }
          ]
        };
      }
    },
    {
      id: 'run_cost',
      kw: [['cost to run', 8], ['running cost', 7], ['electricity', 5], ['power consumption', 6], ['watts', 5], ['wattage', 6], ['energy', 4], ['electric bill', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Very little \u2014 Aquafire plugs into a standard wall outlet and draws <strong>60\u00a0W (20\u2033), 120\u00a0W (40\u2033) or 180\u00a0W (60\u2033)</strong>. At a typical $0.15/kWh, a 40\u2033 unit costs under 2\u00a2 an hour to run. The only other input is tap water.' }
          ]
        };
      }
    },
    {
      id: 'install',
      kw: [['install', 5], ['installation', 6], ['installed', 5], ['installer', 4], ['mount', 3], ['build in', 4], ['built in', 4], ['recess', 4], ['setup', 3], ['set up', 3], ['diy', 4], ['electrician', 4], ['plumber', 3]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Installation is genuinely simple \u2014 most owners DIY it. You need a cutout with the exact specified dimensions, power nearby, and (optionally) a \u00bc\u2033 water line like a fridge ice-maker uses. Then:' },
            { t: 'steps', items: [
              'Prepare the enclosure cutout (sharp corners, exact dimensions).',
              'Connect the 24V power adapter and, if direct-plumbing, the \u00bc\u2033 water line.',
              'Lower the insert into the cutout using its built-in lifting loops \u2014 it rests on support flanges.',
              'Fill with tap water (integrated pump or water line), pair the remote, and enjoy.'
            ]},
            { t: 'text', html: 'No venting, no gas, no heat clearances. Our design team will even review your plans for free \u2014 send drawings to <a href="mailto:' + SALES_EMAIL + '">' + SALES_EMAIL + '</a>.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Enclosure Guide (cutout calculator)', href: pURL('enclosure-guide.html') }, { label: '\ud83d\ude80 Quick Start guides by model', href: pURL('quick-start.html') }] },
            { t: 'chips', items: [{ label: 'Enclosure design tips', send: 'Enclosure design tips' }, { label: 'Water line details', send: 'Tell me about the water line' }] }
          ]
        };
      }
    },
    {
      id: 'enclosure',
      kw: [['enclosure', 6], ['light trap', 7], ['ceiling', 4], ['light bleed', 6], ['hearth', 4], ['surround', 4], ['cabinet', 3], ['design tips', 5], ['viewing height', 6], ['airflow', 4], ['air flow', 4], ['vent', 3], ['toe kick', 6], ['cutout', 5], ['cut out', 4], ['rough opening', 6], ['framing', 5], ['frame the opening', 7]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'The keys to a great-looking enclosure:' },
            { t: 'steps', items: [
              '<strong>Light trap</strong> \u2014 recess the insert and add a matte-black light trap so light doesn\u2019t wash onto the ceiling.',
              '<strong>Setback</strong> \u2014 pair viewing height with the right setback (e.g. 14\u2033 viewing area \u2192 4\u20136\u2033 setback depending on model).',
              '<strong>Airflow</strong> \u2014 allow at least 50\u00a0sq\u00a0in of air intake per 20\u2033 of insert (top vents or a toe kick).',
              '<strong>Seal wall cavities</strong> \u2014 open cavities cause downdrafts that flatten the flame.',
              '<strong>Side clearance</strong> \u2014 keep 6\u2033 from side walls to avoid light reflecting on them.'
            ]},
            { t: 'text', html: 'On the <strong>width</strong>: leave <strong>\u215c\u2033 of clearance in total</strong> \u2014 \u215c\u2033 over nominal, split across the two outside edges, against the + \u00bc\u2033 minimum in the spec sheets. Our senior install crews recommend it so the insert seats without being forced and air keeps moving around the internals, and it\u2019s what the Enclosure Guide now calculates. Depth and height are unchanged. Watch the convention on someone else\u2019s drawing: \u215c\u2033 here is the total across the opening, not per side.' },
            { t: 'text', html: 'The Enclosure Guide calculates all of this for your exact model and size \u2014 and you can email drawings to <a href="mailto:' + SALES_EMAIL + '">' + SALES_EMAIL + '</a> for a free design review.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Open the Enclosure Guide', href: pURL('enclosure-guide.html') }, { label: '\ud83d\udd28 Enclosure best practices', href: pURL('enclosure-guide.html#field-notes') }] },
            { t: 'chips', items: [{ label: 'Downdrafts & sealing', send: 'How do I stop downdrafts in the enclosure?' }] }
          ]
        };
      }
    },
    {
      /* Field practice from the install crews \u2014 sealing the enclosure against
         downdrafts. Mirrored in api/chat.js BASE_FACTS; both move together.
         Source: docs/source-material/note-installer-field-tips.txt */
      id: 'downdraft',
      kw: [['downdraft', 9], ['downdrafts', 9], ['down draft', 9], ['dp kit', 9], ['direct plumb kit', 7], ['seal the enclosure', 8], ['sealing the enclosure', 8], ['seal the unit', 7], ['open plenum', 8], ['plenum', 6], ['wall cavity', 7], ['wall cavities', 7], ['open framing', 7], ['gorilla tape', 8], ['tape the unit', 8], ['high rise', 5], ['high-rise', 5], ['condo', 4], ['positive pressure', 7], ['air moving', 5], ['drafty', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Downdrafts are the most common cause of installation trouble \u2014 air moving through an open enclosure pulls the flame down and drives vapor onto the components, which shortens the life of light strips, fans and sensors. A lot of current construction runs \u201copen plenum\u201d positive-pressure HVAC, so this is worth handling up front on any new build.' },
            { t: 'steps', items: [
              '<strong>Best case</strong> \u2014 have the builder frame the opening to spec and drywall and seal the entire bottom enclosure. No open cavities behind or beneath the fireplace.',
              '<strong>Fallback</strong> \u2014 if you find open framing, or can feel air moving around the enclosure, seal the unit that day: flip it to expose the underside and use 3\u2033-wide black high-quality tape (Gorilla tape or equivalent) on all the open edges underneath, plus the air vents along the front and back sides. The width matters \u2014 it has to cover the edge properly.',
              '<strong>Not with media on top</strong> \u2014 taping the front and back vents leaves the top vents as the unit\u2019s air intake, so don\u2019t use this method if logs, rocks or other media will cover the top. Frame and seal the enclosure properly there instead, and vent through a toe kick.',
              '<strong>Direct Plumb Kit installs</strong> \u2014 on an Aquafire Original with a Direct Plumb Kit, the tape seal only works if it\u2019s sealed against the surrounding structure. In high-rise condos, where the wall assemblies breathe, an unsealed DP kit has caused installation issues.',
              '<strong>Keep the top clear</strong> \u2014 the unit still needs 50\u00a0sq\u00a0in of air intake per 20\u2033 of length, through the top lid or a toe kick if the lid is covered. Keep heavy items off the top.'
            ]},
            { t: 'text', html: 'Do it during the initial install while the enclosure is still open \u2014 sealing after symptoms appear means pulling an installed unit back out of a finished wall.' },
            { t: 'links', items: [{ label: '\ud83d\udd28 Enclosure best practices', href: pURL('enclosure-guide.html#field-notes') }] },
            { t: 'chips', items: [CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'plumbing',
      kw: [['plumb', 6], ['plumbed', 6], ['plumbing', 6], ['plumb kit', 9], ['water line', 7], ['waterline', 7], ['direct plumb', 8], ['hook up to water', 7], ['connect', 3], ['connected', 3], ['fill', 2], ['refill', 3], ['manual fill', 5], ['tap water', 4], ['distilled', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'It depends on the model \u2014 here\u2019s the water-line rundown:' },
            { t: 'steps', items: [
              '<strong>Pro</strong> \u2014 connects directly to a water line right out of the box (a \u00bc\u2033 line, like a fridge ice-maker, and it refills itself). It also includes a dispensing pump, so you can empty the unit at the press of a button.',
              '<strong>Original</strong> \u2014 no water-line connection out of the box; the <strong>Direct Plumb Kit</strong> add-on enables one \u2014 an easy install, sold and shipped separately.',
              '<strong>Lite &amp; Gatsby</strong> \u2014 manual fill only; there\u2019s currently no direct-plumb option or upgrade for these.'
            ]},
            { t: 'text', html: 'Every model can also be filled manually via the integrated water pump port on the top right corner of the burner: connect the fill tube, hold <strong>B1</strong> for 5 seconds, and it fills itself and stops automatically.' },
            { t: 'text', html: 'Regular tap water works \u2014 and when it comes to water quality, <strong>the softer the better</strong>. Reverse-osmosis water or a whole-house softener is ideal; otherwise the included Vapor Pure\u2122 softener conditions your tap water automatically. (Using a whole-house system instead of Vapor Pure? Have it approved in writing to keep the warranty valid.)' },
            { t: 'links', items: [{ label: '\ud83d\udca7 Check your water hardness by ZIP', href: pURL('water-care.html') }] }
          ]
        };
      }
    },
    {
      id: 'colors_app',
      kw: [['color', 4], ['colors', 5], ['rgb', 5], ['app', 3], ['phone app', 5], ['afire app', 6], ['smart home', 5], ['alexa', 4], ['automation', 4], ['blue flame', 5], ['preset', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'The <strong>Aquafire Pro</strong> has dual LED bars (amber + RGB) with <strong>30+ preset flame colors</strong>, plus the AFIRE phone app for adjusting color, brightness, density and speed \u2014 and home-automation integration. The Original and Lite produce the classic amber flame with remote control for height and speed.' },
            { t: 'cards', items: [PRODUCTS.pro] },
            { t: 'videos', keys: ['appConnect'] }
          ]
        };
      }
    },
    {
      id: 'where_buy',
      kw: [['where to buy', 7], ['where can i buy', 7], ['dealer', 5], ['showroom', 5], ['see one in person', 7], ['near me', 5], ['retailer', 5], ['purchase', 3], ['order', 2], ['in stock', 4], ['availability', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'You can order factory-direct at <a href="' + STORE + '" target="_blank" rel="noopener">aquafire.com</a>, or see one running in person at an authorized dealer:' },
            { t: 'links', items: [{ label: '\ud83d\udccd Find a dealer near you', href: pURL('dealer-locator.html') }, { label: '\ud83d\uded2 Shop all models', href: STORE }] },
            { t: 'text', html: 'Questions about ordering or stock? Email <a href="mailto:' + ORDERS_EMAIL + '">' + ORDERS_EMAIL + '</a> or call ' + PHONE + '.' }
          ]
        };
      }
    },
    {
      id: 'shipping',
      kw: [['shipping', 6], ['ship', 4], ['delivery', 5], ['deliver', 4], ['freight', 5], ['how long to arrive', 7], ['lead time', 6], ['when will it arrive', 7], ['tracking', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Aquafire units ship fully crated for protection (e.g. a 40\u2033 unit is 90\u00a0lbs crated). For current lead times, freight questions, or tracking on an order, the orders team has the live answer:' },
            { t: 'links', items: [{ label: '\ud83d\udc64 Check your order in your account', href: STORE + '/account' }] },
            { t: 'text', html: '\ud83d\udce7 <a href="mailto:' + ORDERS_EMAIL + '">' + ORDERS_EMAIL + '</a> &nbsp;\u00b7&nbsp; \ud83d\udcde <a href="tel:' + PHONE_TEL + '">' + PHONE + '</a>' }
          ]
        };
      }
    },
    {
      id: 'order_status',
      kw: [['order status', 8], ['my order', 6], ['where is my order', 9], ['wheres my order', 9], ['order number', 5], ['track my', 6], ['tracking', 6], ['tracking number', 9], ['status of my order', 9], ['shipped yet', 7], ['hasn\u2019t arrived', 6], ['hasnt arrived', 6], ['not arrived', 5]],
      answer: function () {
        if (!ORDER_ENDPOINT || orderDown) return orderFallback();
        // fresh flow start \u2014 drop leftovers from an abandoned lookup, then
        // keep whatever this message already contained
        state.ctx.orderNum = lastSeenOrderNum || null;
        state.ctx.orderEmail = lastSeenEmail || null;
        state.ctx.awaiting = 'order_lookup';
        persist();
        var need = [];
        if (!state.ctx.orderNum) need.push('your <strong>order number</strong> (e.g. #1234, from your confirmation email)');
        if (!state.ctx.orderEmail) need.push('the <strong>email address</strong> you used at checkout');
        return {
          blocks: [
            { t: 'text', html: 'I can check on that right here \u2014 just send me ' + need.join(' and ') + '.' }
          ]
        };
      }
    },
    {
      id: 'returns',
      kw: [['return', 5], ['refund', 6], ['cancel my order', 7], ['exchange', 4], ['money back', 6], ['send it back', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'For returns, exchanges, or order changes, our team handles those case-by-case \u2014 reach out with your order number and they\u2019ll take care of you. Note that any warranty return needs an RMA first (units sent back without one can\u2019t be accepted).' },
            contactBlock('support')
          ]
        };
      }
    },
    {
      id: 'outdoor_commercial',
      kw: [['outdoor', 6], ['outside', 4], ['patio', 5], ['commercial', 5], ['restaurant', 5], ['hotel', 4], ['office', 3], ['lobby', 4], ['custom project', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Aquafire inserts are designed for indoor installations \u2014 restaurants, hotel lobbies, offices and residences are all common (commercial warranty is 1 year vs 2 for residential). For outdoor, marine, or otherwise unusual projects, talk to our design team first \u2014 they review plans for free and will tell you honestly what works.' },
            contactBlock('sales')
          ]
        };
      }
    },
    {
      id: 'tv_above',
      kw: [['tv', 4], ['television', 5], ['tv above', 8], ['artwork', 4], ['art above', 6], ['mantel', 4], ['mantle', 4], ['above the fireplace', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Yes \u2014 Aquafire produces <strong>no heat</strong>, so artwork above is completely fine, and a TV works great too: just put a <strong>mantel shelf</strong> between the flame and the screen so the light mist has room to dissipate. Design tip: add a recessed <strong>light trap</strong> above the flame so LED light doesn\u2019t wash onto the screen or ceiling. The Enclosure Guide shows exactly how.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Light trap design in the Enclosure Guide', href: pURL('enclosure-guide.html') }] }
          ]
        };
      }
    },
    {
      id: 'humidity',
      kw: [['humidity', 6], ['humid', 5], ['moisture', 5], ['damp', 4], ['condensation', 5], ['mold', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'The visible \u201cflame\u201d is a fine mist that evaporates into the room, so it adds a small amount of humidity \u2014 similar to a small humidifier. Good enclosure airflow (and avoiding downdrafts that trap vapor inside the cabinet) keeps everything condensation-free; the Enclosure Guide covers the airflow requirements. For specific climate concerns, our design team can advise on your plans.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Airflow guidelines', href: pURL('enclosure-guide.html') }] }
          ]
        };
      }
    },

    /* ── Ownership: care & service ──────────────────────────────────── */
    {
      id: 'warranty',
      kw: [['warranty', 8], ['guarantee', 5], ['covered', 4], ['coverage', 5], ['register', 5], ['registration', 6], ['claim', 4], ['rma', 6], ['replacement unit', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Aquafire\u2019s limited warranty covers defects in materials & workmanship for <strong>2 years residential / 1 year commercial</strong> from purchase. Three things to know:' },
            { t: 'steps', items: [
              '<strong>Register within 30 days</strong> of receiving your unit at <a href="' + STORE + '/warranty" target="_blank" rel="noopener">aquafire.com/warranty</a> \u2014 unregistered units can\u2019t submit claims.',
              'The included <strong>Vapor Pure\u2122 water softener must be installed</strong> (or your whole-house softener approved in writing) for coverage to remain valid.',
              'Claims start with troubleshooting + remote diagnostics with Aquafire support; repair is the primary remedy, and returns need an RMA first.'
            ]},
            { t: 'text', html: 'To start a claim: <a href="' + STORE + '/pages/service-request" target="_blank" rel="noopener">submit a service request</a>, or contact <a href="mailto:ces@aquafire.com">ces@aquafire.com</a> / ' + PHONE + ' with your model, serial number and contact details.' },
            { t: 'chips', items: [{ label: 'Where\u2019s my serial number?', send: 'Where is my serial number?' }, CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'serial',
      kw: [['serial', 8], ['serial number', 9], ['model number', 6], ['sku', 5], ['which model do i have', 8], ['identify my', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Look for the silver info plate on the <strong>back of the insert</strong> (you may need to slide it out of the enclosure) or the label <strong>under the top lid</strong>. The SKU tells you the model: <strong>AWPR</strong>\u00a0=\u00a0Pro, <strong>AWA</strong>\u00a0=\u00a0Original, <strong>AWL</strong>\u00a0=\u00a0Lite.' },
            { t: 'links', items: [{ label: '\ud83d\udcc4 Help article: Identifying your serial number', href: HELP + '/identifying-serial-number-275552' }] }
          ]
        };
      }
    },
    {
      id: 'water_quality',
      kw: [['hard water', 8], ['water hardness', 8], ['softener', 6], ['vapor pure', 8], ['cartridge', 6], ['scale', 4], ['scaling', 5], ['descale', 6], ['limescale', 6], ['water quality', 7], ['reverse osmosis', 7], ['ro water', 6], ['zip code', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Water quality is the #1 factor in Aquafire longevity, and the rule is simple: <strong>the softer the water, the better</strong>. Reverse-osmosis water or a whole-house softener is ideal. Otherwise, the included <strong>Vapor Pure\u2122 softener</strong> conditions your tap water automatically \u2014 keep it installed for warranty coverage (a whole-house system used in its place needs written approval from Aquafire).' },
            { t: 'links', items: [
              { label: '\ud83d\udca7 Water Care tool \u2014 hardness by ZIP + cartridge timeline', href: pURL('water-care.html') },
              { label: '\ud83d\udcc4 Vapor Pure installation guide', href: STORE + '/vaporpure' }
            ]},
            { t: 'chips', items: [{ label: 'Cleaning schedule', send: 'How often should I clean it?' }] }
          ]
        };
      }
    },
    {
      id: 'cleaning',
      kw: [['clean', 5], ['cleaning', 6], ['maintenance', 6], ['maintain', 5], ['how often', 4], ['descaling', 6], ['vinegar', 5], ['service schedule', 6], ['preventative', 6], ['pm guide', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'The routine that keeps the flame perfect:' },
            { t: 'steps', items: [
              '<strong>Every ~3 months</strong> (more often with hard water): descale and clean the mist makers and tanks.',
              '<strong>With every clean:</strong> wipe the mist-maker discs, rinse the tanks, and refill with fresh water.',
              '<strong>If unused for a while:</strong> drain and refill \u2014 stale water causes musty smells.',
              '<strong>Mist makers are wear parts</strong> \u2014 plan to replace them every 2,000\u20133,000 operating hours.'
            ]},
            { t: 'videos', keys: ['locateMistMaker', 'cleanMM1', 'cleanMM2'] },
            { t: 'links', items: [
              { label: '\ud83e\uddf0 Maintenance guide', href: pURL('maintenance.html') },
              { label: '\ud83d\udcc4 General cleaning help article', href: HELP + '/general-cleaning-for-aquafire-and-aquafire-pro-340453' }
            ]},
            { t: 'chips', items: [{ label: 'Maintenance light is on', send: 'My maintenance reminder light is flashing' }, { label: 'Order parts', send: 'I need replacement parts' }] }
          ]
        };
      }
    },
    {
      id: 'maint_reminder',
      kw: [['maintenance reminder', 9], ['maintenance light', 8], ['reminder light', 7], ['reset the light', 7], ['flashing for 30', 6], ['flashes for 30', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'A light that flashes for ~30 seconds at power-on (with no beeps) is the <strong>preventative-maintenance reminder</strong> \u2014 the unit is due for a cleaning. After cleaning, reset it by <strong>pressing and holding the middle and left buttons together</strong> until the light stops.' },
            { t: 'links', items: [tsLink('beep_maintenance', '\ud83e\udded Walk through it in the Troubleshooter')] }
          ]
        };
      }
    },
    {
      id: 'parts',
      kw: [['replacement part', 8], ['replacement parts', 8], ['spare', 5], ['parts', 4], ['mist maker replacement', 8], ['new remote', 5], ['light strip', 5], ['water pump', 5], ['float sensor', 5], ['buy a part', 7]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'All replacement parts are on aquafire.com \u2014 mist makers, remotes, light strips, pumps, sensors, caps and more. The most common one:' },
            { t: 'cards', items: [PRODUCTS.mistMaker] },
            { t: 'links', items: [{ label: '\ud83d\uded2 Browse all replacement parts', href: STORE + '/collections/replacement-parts' }] },
            { t: 'text', html: 'Not sure which part you need? Tell me what\u2019s happening and I\u2019ll help you diagnose it first.' }
          ]
        };
      }
    },

    /* -- The portal itself: rewards + the tools ----------------------------
       Ember lives on the same site as these tools, and used to fall back on
       anything about them. The programme facts here must track rewards.js
       REWARDS (18 modules, 4,600 points) and the tiers on rewards.html. */
    {
      id: 'rewards',
      kw: [['rewards program', 10], ['reward program', 10], ['rewards programme', 10],
           ['reward points', 9], ['aquafire rewards', 9], ['earn points', 8],
           ['loyalty', 8], ['redeem', 7], ['rewards', 6], ['my points', 7],
           ['how do points work', 8], ['point tiers', 7], ['tier', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: '<strong>Aquafire Rewards</strong> is free \u2014 sign in with Google or an email address and your points follow you across devices. You earn them for using the guide: there are <strong>18 modules worth 4,600 points</strong> in total, collected in any order.' },
            { t: 'steps', items: [
              'Biggest earners: share a photo of your install (+500), complete your setup (+500), read a model guide (+500), write a review (+500).',
              'Tools pay too: check your water hardness (+250), use the enclosure builder (+200), clean the mist maker (+250), register your warranty (+300).',
              'Redemption starts at 600 points and runs through six tiers, the top one at 2,800+.'
            ]},
            { t: 'links', items: [
              { label: '\ud83c\udfc6 Rewards \u2014 your points, the full list and the tiers', href: pURL('rewards.html') },
              { label: '\ud83d\udcf7 Share your install for +500', href: pURL('share-install.html') }
            ]},
            { t: 'chips', items: [
              { label: 'How do I earn the most?', send: 'Which rewards are worth the most points?' },
              { label: 'Share my install', send: 'How do I submit a photo of my install?' }
            ]}
          ]
        };
      }
    },
    {
      id: 'share_install',
      kw: [['submit a photo', 9], ['submit photo', 9], ['share my install', 10],
           ['share install', 9], ['send you a picture', 8], ['upload a photo', 9],
           ['upload picture', 8], ['photo of my install', 10], ['install photo', 9]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Send us one photo of your finished Aquafire and it is worth <strong>500 points</strong> \u2014 the largest single reward we have. Any model, any phone camera; flame on with the lights down reads best, and it helps to get the whole surround in frame.' },
            { t: 'links', items: [
              { label: '\ud83d\udcf7 Share your install (+500 points)', href: pURL('share-install.html') }
            ]},
            { t: 'chips', items: [{ label: 'About the rewards', send: 'Tell me about the rewards program' }]}
          ]
        };
      }
    },
    {
      id: 'portal_tools',
      kw: [['what tools', 9], ['what can you help', 6], ['what is on the site', 8],
           ['what guides', 7], ['calculators', 8], ['interactive guide', 8],
           ['owners guide', 7], ['resources', 5], ['help center', 6], ['portal', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'The <strong>Interactive Aquafire Guide</strong> has a tool for most things \u2014 here is the whole set:' },
            { t: 'links', items: [
              { label: '\ud83d\ude80 Quick Start \u2014 pick your model, then its full guide', href: pURL('quick-start.html') },
              { label: '\ud83d\udcd0 Enclosure Guide \u2014 cutout dimensions and light trap', href: pURL('enclosure-guide.html') },
              { label: '\ud83d\udca7 Water Care \u2014 hardness by ZIP and cartridge timing', href: pURL('water-care.html') },
              { label: '\ud83e\uddf9 Maintenance \u2014 the cleaning and flush schedule', href: pURL('maintenance.html') },
              { label: '\ud83e\udded Troubleshooter \u2014 guided fixes for your model', href: pURL('troubleshoot.html') },
              { label: '\ud83d\udccd Find a Dealer \u2014 see one in person', href: pURL('dealer-locator.html') },
              { label: '\ud83c\udfc6 Rewards \u2014 earn points as you go', href: pURL('rewards.html') },
              { label: '\ud83d\udee1\ufe0f Support \u2014 warranty, claims and contact', href: pURL('support.html') }
            ]}
          ]
        };
      }
    },

    /* ── Troubleshooting ─────────────────────────────────────────────── */
    {
      id: 'ts_start',
      kw: [['troubleshoot', 8], ['not working', 6], ['broken', 5], ['problem', 4], ['issue', 4], ['something wrong', 6], ['help me fix', 7], ['fix my', 5], ['diagnose', 6], ['stopped working', 7]],
      answer: function () {
        if (!state.ctx.model) {
          state.ctx.awaiting = 'ts_model';
          return {
            blocks: [
              { t: 'text', html: 'Let\u2019s get it fixed. First \u2014 which Aquafire do you have? (Check the label under the top lid: AWPR\u00a0=\u00a0Pro, AWA\u00a0=\u00a0Original, AWL\u00a0=\u00a0Lite.)' },
              { t: 'chips', items: [
                { label: '\ud83d\udd25 Aquafire Pro', send: 'Aquafire Pro' },
                { label: '\ud83d\udd25 Aquafire Original', send: 'Aquafire Original' },
                { label: '\ud83d\udd25 Aquafire Lite', send: 'Aquafire Lite' },
                { label: '\u2753 Not sure', send: 'Not sure which model' }
              ]}
            ]
          };
        }
        return tsMenu();
      }
    },
    {
      id: 'beeping',
      kw: [['beep', 8], ['beeping', 9], ['beeps', 8], ['alarm', 5], ['chirping', 6], ['noise and lights', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Beeps are ' + modelName(state.ctx.model) + '\u2019s way of telling you what\u2019s wrong \u2014 count them:' },
            { t: 'steps', items: [
              '<strong>Two quick beeps every 2s</strong> \u2192 Low/no water. Refill the tank, or check that the water supply valve is on if plumbed.',
              '<strong>Three long beeps every second</strong> \u2192 Overflow / high water \u2014 usually a stuck float sensor. Drain to the proper level and agitate the mist rack to free it.',
              '<strong>One short beep every 2s</strong> \u2192 Voltage alert \u2014 check the power adapter connection; the adapter may be faulty.',
              '<strong>Light flashing ~30s, no beeps</strong> \u2192 Maintenance reminder \u2014 time for a cleaning.'
            ]},
            { t: 'videos', keys: ['beepLowWater', 'beepOverflow', 'beepVoltage'] },
            { t: 'links', items: [tsLink('beep', '\ud83e\udded Step-by-step in the Troubleshooter'), { label: '\ud83d\udcc4 Help article: My Aquafire is beeping!', href: HELP + '/my-aquafire-is-beeping-608536' }] },
            { t: 'chips', items: [CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'flame_low',
      kw: [['flame low', 8], ['low flame', 8], ['flame is low', 8], ['weak flame', 8], ['flame short', 7], ['no flame', 8], ['flame uneven', 8], ['uneven', 5], ['flame height', 7], ['barely visible', 6], ['flame is small', 7], ['one section', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'A low or uneven flame usually comes down to one of three things:' },
            { t: 'steps', items: [
              '<strong>Flame volume setting</strong> \u2014 press \u201c+\u201d on the remote (or app on the Pro) to increase mist density.',
              '<strong>Airflow</strong> \u2014 HVAC vents, fans or open wall cavities blowing at the unit flatten the vapor. Redirect air currents and seal cavities.',
              '<strong>Dirty mist makers</strong> \u2014 mineral buildup is the #1 cause, especially if only one section is weak. Clean the discs (5-minute job).',
              'Also check water level in the mist tubes \u2014 it should just reach the top of the black mushroom cap.'
            ]},
            { t: 'videos', keys: ['locateMistMaker', 'cleanMM1'] },
            { t: 'links', items: [tsLink('flame', '\ud83e\udded Guided flame diagnosis'), { label: '\ud83d\udcc4 Help article: Flame low or uneven', href: HELP + '/flame-issues---low-or-uneven-%22flame%22-271574' }] },
            { t: 'chips', items: [CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'flame_smoky',
      kw: [['smoky', 8], ['smokey', 8], ['foggy', 8], ['too much mist', 7], ['misty', 6], ['cloud', 4], ['steam', 4], ['smoke', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'A smoky or foggy look means <strong>too much mist</strong> is being generated. Press \u201c\u2212\u201d on the remote (or lower density in the app on a Pro) to dial it back. If it stays foggy, check that the water level in the mist tubes isn\u2019t above the black mushroom cap, and inspect the sponge filters.' },
            { t: 'links', items: [tsLink('flame_smoky', '\ud83e\udded Step-by-step fix'), { label: '\ud83d\udcc4 Help article: Smoky / foggy appearance', href: HELP + '/flame-issues---smoky--foggy-appearance-841252' }] }
          ]
        };
      }
    },
    {
      id: 'leak',
      kw: [['leak', 8], ['leaking', 9], ['water on the floor', 8], ['puddle', 7], ['dripping', 6], ['overflow', 6]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'A leak after the unit sat unused is almost always a <strong>stuck float sensor</strong> letting the mist-tank level climb too high. The fix:' },
            { t: 'steps', items: [
              'Turn the unit off and drain excess water to the proper level (top of the black mushroom cap).',
              'Lift and plunge the mist-maker rack vigorously 10\u201315 times \u2014 this frees the float sensor.',
              'Run the unit and re-check that the level holds.'
            ]},
            { t: 'videos', keys: ['agitateFloat'] },
            { t: 'links', items: [tsLink('water_leak', '\ud83e\udded Guided leak diagnosis')] },
            { t: 'chips', items: [CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'smell',
      kw: [['smell', 8], ['smells', 8], ['musty', 8], ['odor', 7], ['odour', 7], ['stale', 6], ['stinks', 7]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'A musty or stale smell = old water, usually from the unit sitting unused. <strong>Drain it, rinse the tanks, and refill with fresh tap water.</strong> If the smell lingers, do a full clean per the maintenance guide \u2014 and going forward, drain the unit before any long idle period.' },
            { t: 'links', items: [tsLink('water_smell', '\ud83e\udded Walk through it'), { label: '\ud83e\uddf0 Cleaning guide', href: pURL('maintenance.html') }] }
          ]
        };
      }
    },
    {
      id: 'power_issue',
      kw: [['wont turn on', 9], ["won't turn on", 9], ['not turning on', 9], ['no power', 8], ['dead', 5], ['turns off', 6], ['shuts off', 7], ['buzzing', 7], ['power supply', 6], ['red light on adapter', 8], ['tripped', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Quick power checklist:' },
            { t: 'steps', items: [
              'Check the power-supply LED: <strong>green</strong> means it has power; <strong>red</strong> means the adapter is damaged \u2014 contact support.',
              'Make sure the 90\u00b0 connector on the back of the unit is fully seated (a loose one also causes buzzing).',
              'Check the wall outlet and your breaker panel.',
              'If it beeps then shuts off, that\u2019s low water \u2014 refill or check the water feed.',
              'Green adapter light but still no power? The internal fuse may be blown \u2014 that\u2019s one for support.'
            ]},
            { t: 'links', items: [tsLink('power', '\ud83e\udded Guided power diagnosis'), { label: '\ud83d\udcc4 Help article: Power issues', href: HELP + '/power-issues-227728' }] },
            { t: 'chips', items: [CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'remote_issue',
      kw: [['remote', 6], ['remote not working', 9], ['pair the remote', 8], ['sync the remote', 8], ['pairing', 6], ['cr-2032', 7], ['remote battery', 7]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Two fixes solve nearly every remote problem:' },
            { t: 'steps', items: [
              '<strong>Fresh battery</strong> \u2014 it takes a CR-2032 lithium coin cell.',
              '<strong>Re-sync</strong> \u2014 press and hold the power button on the fireplace until it flashes, then press any button on the remote. A beep confirms pairing. (Same process syncs multiple ganged units to one remote.)'
            ]},
            { t: 'links', items: [tsLink('remote', '\ud83e\udded Guided remote fix'), { label: '\ud83d\udcc4 Help article: Remote control issues', href: HELP + '/remote-control-issues-232524' }] },
            { t: 'chips', items: [{ label: 'Buy a new remote', send: 'I need replacement parts' }, CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'app_issue',
      kw: [['app not connecting', 9], ['app wont connect', 9], ["app won't connect", 9], ['cant connect the app', 9], ['bluetooth', 5], ['wifi', 4], ['afire', 5], ['connect my phone', 8]],
      answer: function () {
        var isPro = state.ctx.model === 'pro' || !state.ctx.model;
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: (isPro
              ? 'For the AFIRE app on the Pro: make sure Bluetooth is on, you\u2019re within range, and the unit is powered. Force-close and reopen the app, then re-run the pairing flow. This video walks through it:'
              : 'Heads up \u2014 the phone app is a <strong>Pro (AWPR)</strong> feature; the Original and Lite are controlled by remote. If you have a Pro:') },
            { t: 'videos', keys: ['appConnect'] },
            { t: 'links', items: [tsLink('app_entry', '\ud83e\udded Guided app connection'), { label: '\ud83d\udcc4 Help article: Phone app not connecting', href: HELP + '/aquafire-pro---phone-app-not-connecting-272087' }] }
          ]
        };
      }
    },
    {
      id: 'lights_issue',
      kw: [['lights not', 7], ['light not working', 8], ['lights wont', 8], ['led', 5], ['light strip out', 8], ['dark section', 6], ['lights off', 6], ['no lights', 7]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'If some or all LEDs are out while the unit runs:' },
            { t: 'steps', items: [
              'Check the connector on the <strong>right end of the light strip</strong> \u2014 a loose plug is the most common cause.',
              'On a Pro, check both the amber and RGB strips (they connect separately), and try toggling each from the remote/app.',
              'Individual dead cells on a strip mean the strip needs replacement \u2014 contact support or grab one from the parts store.'
            ]},
            { t: 'links', items: [tsLink('led', '\ud83e\udded Guided light diagnosis'), { label: '\ud83d\uded2 Replacement light strips', href: STORE + '/collections/replacement-parts' }] },
            { t: 'chips', items: [CHIP_HUMAN] }
          ]
        };
      }
    },
    {
      id: 'drain',
      kw: [['drain', 7], ['draining', 7], ['empty the tank', 8], ['empty it', 5], ['winterize', 6], ['storage', 4], ['moving', 3]],
      answer: function () {
        var lite = state.ctx.model === 'lite';
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: lite
              ? 'On the Lite: put a bucket under the unit, pull the <strong>bottom drain plug</strong>, and let it run empty.'
              : 'Connect the included hose to the drain port (front on the Original, top on the Pro series), point it into a 3\u20135 gallon bucket, and <strong>hold the B2 button</strong> until the tanks are empty.' },
            { t: 'text', html: 'Always drain before moving, storing, or shipping the unit \u2014 and note the first fill after a drain usually takes a couple of top-offs on the two-tank models.' },
            { t: 'links', items: [tsLink('water_fill', '\ud83e\udded Fill & drain walkthrough')] }
          ]
        };
      }
    },

    /* ── Escalation ─────────────────────────────────────────────────── */
    {
      id: 'human',
      kw: [['human', 8], ['agent', 6], ['real person', 9], ['speak to someone', 9], ['talk to someone', 9], ['talk to a person', 9], ['speak to a person', 9], ['talk to a human', 9], ['customer service', 7], ['support team', 7], ['contact', 5], ['call', 4], ['email', 4], ['phone number', 7], ['representative', 7]],
      answer: function () {
        return {
          blocks: [
            { t: 'text', html: 'Of course \u2014 here\u2019s the fastest way to reach the team:' },
            contactBlock('support'),
            { t: 'text', html: 'Tip: including your <strong>model, serial number</strong> (back plate or under the top lid) and a short video of the issue gets you a faster answer.' }
          ]
        };
      }
    },
    {
      id: 'sales_human',
      kw: [['talk to sales', 9], ['sales team', 8], ['quote', 6], ['design review', 8], ['review my plans', 8], ['designer', 5], ['architect', 5], ['spec sheet', 6]],
      answer: function () {
        return {
          blocks: [
            { t: 'text', html: 'Our sales & design team helps with quotes, spec sheets, and free reviews of your enclosure drawings:' },
            contactBlock('sales')
          ]
        };
      }
    }
  ];

  /* ── Guided troubleshooting menu (after model selection) ─────────────── */
  function tsMenu() {
    return {
      blocks: [
        { t: 'text', html: 'Got it \u2014 ' + modelName(state.ctx.model) + '. What\u2019s going on?' },
        { t: 'chips', items: [
          { label: '\ud83d\udd0a It\u2019s beeping', send: 'It is beeping' },
          { label: '\ud83d\udd25 Flame is low / uneven', send: 'The flame is low' },
          { label: '\ud83c\udf2b\ufe0f Flame looks smoky', send: 'The flame looks smoky' },
          { label: '\ud83d\udca7 Leak or water issue', send: 'It is leaking water' },
          { label: '\u26a1 Won\u2019t turn on', send: 'It will not turn on' },
          { label: '\ud83c\udf9b\ufe0f Remote or app', send: 'The remote is not working' },
          { label: '\ud83d\udca1 Lights', send: 'The lights are not working' },
          { label: '\ud83e\udded Full troubleshooter', href: pURL('troubleshoot.html' + (state.ctx.model && state.ctx.model !== 'unknown' ? '?model=' + state.ctx.model : '')) }
        ]}
      ]
    };
  }

  function mainChips() {
    return { t: 'chips', items: [
      { label: '\ud83d\udd25 Compare models', send: 'Compare the models' },
      // Money bag, not the heavy dollar sign: U+1F4B2 is a thin unfilled
      // outline that all but disappears on the dark panel. Pick chip emoji
      // with mass -- the panel is dark by default.
      { label: '\ud83d\udcb0 Pricing', send: 'How much do they cost?' },
      { label: '\ud83d\udce6 Order status', send: 'Where is my order?' },
      { label: '\ud83d\udee0\ufe0f Fix an issue', send: 'Help me troubleshoot an issue' },
      { label: '\ud83d\udcd0 Plan an install', send: 'How is it installed?' },
      { label: '\ud83d\udee1\ufe0f Warranty', send: 'Tell me about the warranty' },
      { label: '\ud83c\udfc6 Rewards', send: 'Tell me about the rewards program' },
      CHIP_HUMAN
    ]};
  }

  var FALLBACK = function () {
    return {
      blocks: [
        { t: 'text', html: 'Hmm, I\u2019m not sure I caught that. I\u2019m best at Aquafire questions \u2014 models, pricing, installation, water care, and fixing issues. Try one of these, or rephrase?' },
        mainChips()
      ]
    };
  };

  /* ── Intent matching ──────────────────────────────────────────────────── */
  function normalize(text) {
    return ' ' + text.toLowerCase().replace(/[\u2019\x27]/g, '\u2019').replace(/[^a-z0-9\u2019\-\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  function matchIntent(raw) {
    var text = normalize(raw);
    var bare = text.trim();

    // regex intents (exact-ish short phrases) first
    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].test && INTENTS[i].test.test(bare)) return INTENTS[i];
    }

    var best = null, bestScore = 0;
    INTENTS.forEach(function (intent) {
      if (!intent.kw || !intent.kw.length) return;
      var score = 0;
      intent.kw.forEach(function (pair) {
        var phrase = pair[0], w = pair[1];
        if (phrase.indexOf(' ') !== -1) {
          if (text.indexOf(phrase) !== -1) score += w;
        } else {
          if (new RegExp('\\b' + phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b').test(text)) score += w;
        }
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    return bestScore >= 4 ? best : null;
  }

  /* ── State & persistence ──────────────────────────────────────────────── */
  var STORAGE_KEY = 'afaState.v1';
  var state = { open: false, nudged: false, msgs: [], ctx: { model: null, awaiting: null } };
  try {
    var saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) { var p = JSON.parse(saved); state.msgs = p.msgs || []; state.ctx = p.ctx || state.ctx; state.nudged = !!p.nudged; state.open = !!p.open; state.cid = p.cid; state.started = !!p.started; state.notified = !!p.notified; state.emailAsked = !!p.emailAsked; state.contactEmail = p.contactEmail || null; state.journey = p.journey || []; }
  } catch (e) { /* private mode etc. */ }

  /* ── Visitor context — anonymous browsing signals (no PII) ─────────────
     Journey (pages this session), device class, current product page, and
     on the Shopify storefront the cart contents. Fed to the AI so answers
     fit what the customer is looking at, logged with convo_start for the
     insights dashboard, and attached to handoff notifications. */
  state.journey = state.journey || [];
  if (state.journey[state.journey.length - 1] !== location.pathname) {
    state.journey.push(location.pathname);
    if (state.journey.length > 10) state.journey = state.journey.slice(-10);
    persist(); // journey accrues while browsing, before any chat interaction
  }

  var cartCache = '';
  function loadCart() {
    // /cart.js exists only on the Shopify storefront — skip on the portal
    try {
      if (!PORTAL_BASE || location.origin === new URL(PORTAL_BASE).origin) return;
    } catch (e) { return; }
    fetch('/cart.js', { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('no cart');
      return r.json();
    }).then(function (c) {
      if (!c || !c.items || !c.items.length) return;
      cartCache = c.items.slice(0, 5).map(function (i) {
        return i.quantity + 'x ' + String(i.product_title || i.title || '').slice(0, 60);
      }).join(', ');
      if (typeof c.total_price === 'number') {
        cartCache += ' ($' + Math.round(c.total_price / 100) + ')';
      }
    }).catch(function () { /* empty cart or non-Shopify host */ });
  }
  loadCart();

  function visitorCtx() {
    var m = location.pathname.match(/\/products\/([^\/?#]+)/);
    return {
      device: Math.min(window.innerWidth, window.innerHeight) < 700 ? 'mobile' : 'desktop',
      journey: state.journey.join(' > ').slice(0, 300),
      product: m ? m[1] : '',
      cart: cartCache
    };
  }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        msgs: state.msgs.slice(-40), ctx: state.ctx, nudged: state.nudged, open: state.open, cid: state.cid, started: state.started, notified: state.notified, emailAsked: state.emailAsked, contactEmail: state.contactEmail, journey: state.journey
      }));
    } catch (e) { /* ignore */ }
  }

  /* ── Telemetry (chat monitoring) ──────────────────────────────────────
     Anonymous usage events — user messages + matched intent, fallbacks,
     feedback votes/comments, handoffs — reviewed in chat-insights.html.
     Fire-and-forget: failures never affect the chat. Requires the Firestore
     rule documented in docs/chat-assistant.md; disable with config
     telemetry:false, or point logEndpoint at any JSON webhook instead. */
  var WIDGET_VERSION = '1.1.0';
  var TELEMETRY = cfg.telemetry !== false;
  var FS = cfg.firestore !== undefined ? cfg.firestore : {
    projectId: 'aquafire-portal',
    apiKey: 'AIzaSyAAeoOt4NJxh_ITaWNMBV-Ed-mM5Ac5a7Q' // public web config, same as rewards.js
  };
  var lastIntentId = '';

  if (!state.cid) state.cid = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function fsFields(obj) {
    var f = {};
    Object.keys(obj).forEach(function (k) {
      f[k] = { stringValue: String(obj[k] == null ? '' : obj[k]) };
    });
    return f;
  }

  function logEvent(type, data) {
    if (!TELEMETRY) return;
    try {
      var ev = {
        v: WIDGET_VERSION, type: type, convo: state.cid,
        ts: new Date().toISOString(),
        page: location.pathname, host: location.hostname,
        model: state.ctx.model || ''
      };
      Object.keys(data || {}).forEach(function (k) { ev[k] = data[k]; });
      // Privacy: never let customer email addresses reach the telemetry
      // store (they type theirs during the order-lookup flow). Aquafire's
      // own contact addresses pass through so transcripts stay readable.
      ['text', 'comment'].forEach(function (k) {
        if (typeof ev[k] === 'string') {
          ev[k] = ev[k].replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, function (m) {
            return /@(aquafire|luminabrands)\.com$/i.test(m) ? m : '[email]';
          });
        }
      });
      if (cfg.logEndpoint) {
        fetch(cfg.logEndpoint, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ev)
        }).catch(function () {});
      }
      if (FS && FS.projectId && FS.apiKey) {
        fetch('https://firestore.googleapis.com/v1/projects/' + FS.projectId +
          '/databases/(default)/documents/chatEvents?key=' + FS.apiKey, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: fsFields(ev) })
        }).catch(function () {});
      }
    } catch (e) { /* never break the chat */ }
  }

  /* ── Styles ───────────────────────────────────────────────────────────── */
  /* Ember's mark. Resolved against PORTAL_BASE (the script's own directory)
     rather than written relative, because this file is served to the Shopify
     storefront -- a bare "ember-mark.png" there would resolve against the
     store's origin and 404. Override with cfg.markUrl / data-mark-url. */
  var MARK_URL = cfg.markUrl || dataAttr('mark-url') || pURL('ember-mark.png');
  var MARK_BG = 'background:url("' + MARK_URL + '") center/100% 100% no-repeat;';
  var SEND_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.4 20.4 21.8 12 3.4 3.6l2.5 7L14 12l-8.1 1.4-2.5 7z" fill="currentColor"/></svg>';
  var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var CSS = [
    /* Tokens mirror redesign.css so the widget is the same material as the
       portal. Two bindings each: the dark set is the default (and what
       Shopify gets, since the storefront sets no data-theme), the light set
       activates from the portal's theme switch.
       Sizes stay in px, not rem, on purpose -- this panel renders inside a
       merchant's document and must not inherit their root font-size. That is
       why it cannot sit on DESIGN.md's rem type ramp. */
    '.afa-root{' +
      '--afa-bg:#101216;--afa-head-bg:linear-gradient(135deg,rgba(211,51,55,.16) 0%,rgba(16,18,22,0) 62%);' +
      '--afa-surface:rgba(255,255,255,.045);--afa-surface2:rgba(255,255,255,.07);' +
      '--afa-border:rgba(255,255,255,.12);--afa-border-soft:rgba(255,255,255,.07);' +
      '--afa-text:#f3f4f6;--afa-mid:#b9bec8;--afa-muted:#8d939f;' +
      '--afa-ember:#d33337;--afa-ember-t:#f05a5e;--afa-live:#c9e85c;' +
      '--afa-send-bg:rgba(255,255,255,.12);--afa-send-ink:#f3f4f6;--afa-send-bg-hover:rgba(255,255,255,.18);' +
      '--afa-hover:rgba(255,255,255,.08);' +
      '--afa-shadow:0 24px 64px rgba(0,0,0,.55);--afa-shadow-sm:0 10px 32px rgba(0,0,0,.45);' +
      /* The documented rounded scale: pane / card / bubble / pill. */
      '--afa-radius:26px;--afa-radius-card:15px;--afa-radius-bubble:13px;' +
      'font-family:Figtree,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
      'font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;}',
    /* buildUI() pulls Figtree from Google Fonts where the host loads no font
       of its own; the stack below is what renders until then, and on hosts we
       defer to. */
    ':root[data-theme="light"] .afa-root{' +
      '--afa-bg:#ffffff;--afa-head-bg:linear-gradient(135deg,rgba(255,106,61,.14) 0%,rgba(255,255,255,0) 62%);' +
      '--afa-surface:#f5f6f8;--afa-surface2:#eef0f4;' +
      '--afa-border:rgba(23,26,31,.10);--afa-border-soft:rgba(23,26,31,.07);' +
      '--afa-text:#171a1f;--afa-mid:#4c525c;--afa-muted:#6a7280;' +
      '--afa-ember:#d33337;--afa-ember-t:#b02427;--afa-live:#6f8f0a;' +
      '--afa-send-bg:#171a1f;--afa-send-ink:#ffffff;--afa-send-bg-hover:#262b33;' +
      '--afa-hover:rgba(23,26,31,.06);' +
      '--afa-shadow:0 24px 64px rgba(23,26,31,.18);--afa-shadow-sm:0 10px 32px rgba(23,26,31,.14);}',
    '.afa-root,.afa-root *{box-sizing:border-box;margin:0;padding:0;}',
    /* :where() holds these resets at zero specificity so component rules
       always win, while the injected !important still shields against host
       theme globals. Supersedes the .afa-root prefixing this branch used
       for the same bug -- zero specificity is the better fix. */
    /* :where() keeps these resets at zero specificity so component rules always
       win, while the injected !important still shields against theme globals */
    ':where(.afa-root) button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;margin:0;padding:0;appearance:none;-webkit-appearance:none;text-transform:none;letter-spacing:normal;line-height:inherit;font-size:inherit;opacity:1;box-shadow:none;border-radius:0;}',
    ':where(.afa-root) input{margin:0;appearance:none;-webkit-appearance:none;box-shadow:none;text-transform:none;letter-spacing:normal;opacity:1;}',
    ':where(.afa-root) a{color:var(--afa-ember-t);text-decoration:none;}',
    ':where(.afa-root) a:hover{text-decoration:underline;}',

    /* Launcher */
    /* Liquid-glass launcher: translucent dark base + backdrop blur/saturation,
       specular top highlight, hairline light border. Browsers without
       backdrop-filter just get the translucent dark pill. */
    '.afa-launcher{position:fixed;right:20px;bottom:20px;top:auto;left:auto;z-index:2147483000;height:56px;min-height:56px;width:auto;min-width:0;margin:0;display:flex;align-items:center;justify-content:center;gap:9px;padding:0 22px 0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(180deg,rgba(255,255,255,.14) 0%,rgba(255,255,255,.04) 40%,rgba(255,255,255,0) 100%),rgba(21,24,30,.68);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);color:#fff;opacity:1;filter:none;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:.2px;line-height:1;text-transform:none;text-decoration:none;box-shadow:0 10px 32px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 1px rgba(255,255,255,.05);transition:transform .2s,box-shadow .2s,border-color .2s,width .3s cubic-bezier(.16,1,.3,1),padding .3s cubic-bezier(.16,1,.3,1);}',
    '.afa-launcher svg{width:24px;height:24px;transition:transform .25s;}',
    '.afa-launcher .afa-ico-flame{width:26px;height:26px;flex:none;border-radius:50%;' + MARK_BG + '}',
    '.afa-launcher:hover{transform:scale(1.04);border-color:rgba(255,255,255,.34);background:linear-gradient(180deg,rgba(255,255,255,.2) 0%,rgba(255,255,255,.06) 40%,rgba(255,255,255,0) 100%),rgba(26,29,36,.74);box-shadow:0 12px 38px rgba(0,0,0,.5),0 3px 10px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.3),inset 0 -1px 1px rgba(255,255,255,.05);}',
    '.afa-launcher-label{white-space:nowrap;max-width:170px;opacity:1;overflow:hidden;transition:max-width .3s cubic-bezier(.16,1,.3,1),opacity .18s;}',
    /* Collapsed: the label folds away and the pill becomes the flame disc.
       The wordmark earns its width on arrival, not for the whole visit --
       parked over a page it covers whatever sits bottom-right, which on
       the guides is the chapter pager. */
    '.afa-launcher.afa-mini{width:56px;padding:0;gap:0;}',
    '.afa-launcher.afa-mini .afa-launcher-label{max-width:0;opacity:0;}',
    '.afa-launcher .afa-ico-close{display:none;}',
    '.afa-launcher.afa-open{width:56px;padding:0;}',
    '.afa-launcher.afa-open .afa-ico-flame,.afa-launcher.afa-open .afa-launcher-label{display:none;}',
    '.afa-launcher.afa-open .afa-ico-close{display:block;}',
    '.afa-badge{position:absolute;top:0;right:8px;width:12px;height:12px;border-radius:50%;background:var(--afa-ember);border:2px solid var(--afa-bg);display:none;}',
    '.afa-launcher.afa-open .afa-badge{right:2px;}',
    '.afa-launcher.afa-unread .afa-badge{display:block;}',

    /* Proactive teaser (chat-style invitation card) */
    '.afa-nudge{position:fixed;right:20px;bottom:92px;z-index:2147483000;width:300px;max-width:calc(100vw - 40px);background:var(--afa-bg);color:var(--afa-text);border:1px solid var(--afa-border);border-radius:var(--afa-radius-card);padding:14px;box-shadow:0 14px 44px rgba(0,0,0,.5);font-size:13.5px;animation:afaPop .35s ease;cursor:pointer;}',
    '.afa-nudge-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;}',
    '.afa-nudge-avatar{width:26px;height:26px;border-radius:50%;' + MARK_BG + 'flex-shrink:0;}',
    '.afa-nudge-name{font-weight:600;font-family:inherit;font-size:13.5px;}',
    '.afa-nudge-x{margin-left:auto;color:var(--afa-muted);font-size:14px;line-height:1;padding:4px 6px;border-radius:6px;}',
    '.afa-nudge-x:hover{color:var(--afa-text);background:rgba(255,255,255,.06);}',
    '.afa-nudge-msg{line-height:1.5;margin-bottom:10px;}',
    '.afa-nudge-reply{background:var(--afa-surface2);border:1px solid var(--afa-border);border-radius:var(--afa-radius-bubble);padding:9px 12px;color:var(--afa-muted);font-size:12.8px;}',
    '@keyframes afaPop{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}',

    /* Panel. Opaque ground rather than glass: this floats over a storefront we
       do not control, and a translucent panel there is unreadable. */
    '.afa-panel{position:fixed;right:20px;bottom:92px;z-index:2147483001;width:382px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 120px));display:none;flex-direction:column;background:var(--afa-bg);color:var(--afa-text);border:1px solid var(--afa-border);border-radius:var(--afa-radius);box-shadow:var(--afa-shadow);overflow:hidden;}',
    '.afa-panel.afa-open{display:flex;animation:afaPop .28s cubic-bezier(.16,1,.3,1);}',

    /* Header */
    '.afa-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--afa-head-bg);border-bottom:1px solid var(--afa-border-soft);flex-shrink:0;}',
    '.afa-avatar{position:relative;width:40px;height:40px;border-radius:50%;' + MARK_BG + 'flex-shrink:0;}',
    '.afa-dot{position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:var(--afa-live);border:2px solid var(--afa-bg);}',
    '.afa-head-txt{flex:1;min-width:0;}',
    '.afa-head-txt h3{font-size:15px;font-weight:700;letter-spacing:-.01em;}',
    '.afa-head-txt p{font-size:11.5px;color:var(--afa-muted);}',
    '.afa-head-btn{color:var(--afa-muted);padding:6px;border-radius:999px;font-size:16px;line-height:1;transition:color .15s,background .15s;}',
    '.afa-head-btn:hover{color:var(--afa-text);background:var(--afa-hover);}',

    /* Messages */
    '.afa-msgs{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--afa-border) transparent;}',
    '.afa-row{display:flex;gap:8px;max-width:100%;}',
    '.afa-row.afa-user{justify-content:flex-end;}',
    '.afa-mini-avatar{width:26px;height:26px;border-radius:50%;' + MARK_BG + 'flex-shrink:0;margin-top:2px;}',
    /* Bubble radius with the pinched corner on the speaker's side, per the
       design system's tip-bubble shape. */
    '.afa-bubble{max-width:82%;padding:10px 13px;border-radius:var(--afa-radius-bubble);font-size:13.8px;overflow-wrap:break-word;}',
    '.afa-row.afa-bot .afa-bubble{background:var(--afa-surface);border:1px solid var(--afa-border-soft);border-top-left-radius:4px;}',
    /* The visitor speaks in the send colour -- the same high-contrast neutral
       the portal uses for its primary action -- not in the accent. Ember owns
       the accent; painting whole bubbles with it would drown the room. */
    '.afa-row.afa-user .afa-bubble{background:var(--afa-send-bg);color:var(--afa-send-ink);border-top-right-radius:4px;}',
    '.afa-col{display:flex;flex-direction:column;gap:8px;min-width:0;max-width:calc(100% - 34px);}',
    '.afa-col .afa-bubble{max-width:100%;}',

    /* Steps */
    '.afa-steps{margin:2px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:13.4px;}',

    /* Chips: the portal's glass cap. */
    '.afa-chips{display:flex;flex-wrap:wrap;gap:6px;}',
    '.afa-root .afa-chip{padding:7px 12px;background:var(--afa-surface);border:1px solid var(--afa-border);border-radius:999px;color:var(--afa-mid);font-size:12.6px;font-weight:500;transition:background .22s,color .22s,border-color .22s;text-decoration:none!important;display:inline-block;}',
    '.afa-root .afa-chip:hover{background:var(--afa-hover);border-color:var(--afa-border);color:var(--afa-text);}',
    '.afa-chips.afa-spent .afa-chip{opacity:.45;pointer-events:none;}',

    /* Cards */
    '.afa-cards{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--afa-border) transparent;}',
    '.afa-card{scroll-snap-align:start;flex:0 0 172px;background:var(--afa-surface);border:1px solid var(--afa-border-soft);border-radius:var(--afa-radius-card);overflow:hidden;display:flex;flex-direction:column;}',
    '.afa-card img{width:100%;height:96px;object-fit:cover;background:var(--afa-surface2);}',
    '.afa-card-b{padding:9px 10px 10px;display:flex;flex-direction:column;gap:3px;flex:1;}',
    '.afa-card-b h4{font-size:13px;font-weight:600;}',
    '.afa-card-b .afa-price{font-size:12.5px;color:var(--afa-ember-t);font-weight:600;}',
    '.afa-card-b p{font-size:11.3px;color:var(--afa-muted);line-height:1.5;flex:1;}',
    '.afa-card-b a{margin-top:6px;text-align:center;font-size:12px;font-weight:600;padding:7px 0;border-radius:999px;background:var(--afa-send-bg);color:var(--afa-send-ink)!important;text-decoration:none!important;transition:background .22s;}',
    '.afa-card-b a:hover{background:var(--afa-send-bg-hover);}',

    /* Link & video lists */
    '.afa-links{display:flex;flex-direction:column;gap:6px;}',
    '.afa-link{display:block;padding:10px 13px;background:var(--afa-surface);border:1px solid var(--afa-border-soft);border-radius:var(--afa-radius-card);font-size:12.8px;color:var(--afa-text)!important;text-decoration:none!important;transition:border-color .22s,background .22s;}',
    '.afa-link:hover{border-color:var(--afa-border);background:var(--afa-hover);}',
    '.afa-videos{display:flex;flex-wrap:wrap;gap:6px;}',
    '.afa-video{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;background:var(--afa-surface);border:1px solid var(--afa-border-soft);border-radius:999px;font-size:12.2px;color:var(--afa-text)!important;text-decoration:none!important;transition:border-color .22s;}',
    '.afa-video:hover{border-color:var(--afa-border);}',
    '.afa-video::before{content:"\u25b6";color:var(--afa-ember-t);font-size:10px;}',

    /* Contact card */
    '.afa-contact{display:flex;flex-direction:column;gap:6px;background:var(--afa-surface);border:1px solid var(--afa-border);border-radius:var(--afa-radius-card);padding:12px;}',
    '.afa-contact h5{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--afa-ember-t);font-weight:700;}',
    '.afa-contact a{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--afa-surface2);border-radius:var(--afa-radius-bubble);font-size:13px;color:var(--afa-text)!important;text-decoration:none!important;transition:background .22s;}',
    '.afa-contact a:hover{background:var(--afa-hover);}',

    /* Feedback */
    '.afa-fb{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--afa-muted);}',
    '.afa-fb button{font-size:13px;padding:3px 7px;border-radius:999px;border:1px solid var(--afa-border-soft);transition:background .22s;}',
    '.afa-fb button:hover{background:var(--afa-hover);}',
    '.afa-fb{flex-wrap:wrap;}',
    '.afa-fb-form{display:flex;gap:6px;flex:1;min-width:180px;}',
    '.afa-fb-form input{flex:1;background:var(--afa-surface2);border:1px solid var(--afa-border-soft);border-radius:999px;padding:6px 12px;color:var(--afa-text);font-size:12px;font-family:inherit;outline:none;}',
    '.afa-fb-form input:focus{border-color:var(--afa-ember);}',
    '.afa-fb-form button{flex-shrink:0;}',
    '.afa-email{display:flex;flex-direction:column;gap:7px;margin-top:2px;font-size:11.5px;color:var(--afa-muted);}',
    '.afa-email button{font-size:12px;padding:6px 12px;border-radius:999px;border:1px solid var(--afa-border-soft);transition:background .22s;white-space:nowrap;}',
    '.afa-email button:hover{background:var(--afa-hover);}',
    '.afa-email input.afa-email-bad{border-color:var(--afa-ember);}',
    '.afa-email-done{color:var(--afa-text);}',
    '.afa-email-skip{align-self:flex-start;font-size:11.5px;color:var(--afa-muted);text-decoration:underline;text-underline-offset:2px;padding:2px 0;}',
    '.afa-email-skip:hover{color:var(--afa-text);}',

    /* Typing */
    '.afa-typing{display:inline-flex;gap:4px;padding:12px 14px;}',
    '.afa-typing span{width:7px;height:7px;border-radius:50%;background:var(--afa-muted);animation:afaBlink 1.2s infinite;}',
    '.afa-typing span:nth-child(2){animation-delay:.18s;}.afa-typing span:nth-child(3){animation-delay:.36s;}',
    '@keyframes afaBlink{0%,80%,100%{opacity:.25;transform:translateY(0);}40%{opacity:1;transform:translateY(-3px);}}',

    /* Composer. Pill field + pill send, matching the portal's hero composer. */
    '.afa-foot{flex-shrink:0;border-top:1px solid var(--afa-border-soft);background:var(--afa-bg);}',
    '.afa-inputrow{display:flex;align-items:center;gap:8px;padding:10px 12px 6px;}',
    '.afa-input{flex:1;background:var(--afa-surface);border:1px solid var(--afa-border);border-radius:999px;padding:11px 16px;color:var(--afa-text);font-size:13.8px;font-family:inherit;outline:none;transition:border-color .22s;}',
    '.afa-input:focus{border-color:var(--afa-ember);}',
    '.afa-input::placeholder{color:var(--afa-muted);}',
    '.afa-root .afa-send{width:40px;height:40px;border-radius:999px;background:var(--afa-send-bg);color:var(--afa-send-ink);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .22s,transform .3s cubic-bezier(.16,1,.3,1);}',
    '.afa-send svg{width:18px;height:18px;}',
    '.afa-send:disabled{opacity:.4;cursor:default;}',
    '.afa-root .afa-send:not(:disabled):hover{background:var(--afa-send-bg-hover);transform:translateX(2px);}',

    /* ── Border Beam ──
       Trimmed port of beam.css (ring + inner glow; no bloom layer, which is
       imperceptible at this size). Inlined rather than linked because this
       widget ships as a single script tag on Shopify, where an external
       stylesheet is not available. Namespaced afa- so it cannot collide with
       beam.css when both load on a portal page. Position is set per target,
       never on .afa-beam itself -- .afa-panel must keep position:fixed. */
    '@property --afa-beam-angle{syntax:"<angle>";initial-value:0deg;inherits:true;}',
    '@property --afa-beam-opacity{syntax:"<number>";initial-value:0;inherits:true;}',
    /* Colours live in custom properties so a variant only overrides nine
       values instead of restating every gradient. Default is the full
       spectrum; data-beam-variant="ember" narrows it to the fire palette. */
    '.afa-beam{--afa-beam-w:1px;--afa-beam-dur:4s;--afa-beam-strength:1;--afa-beam-hue:30deg;' +
      /* Colour priority (mirrors beam.css): red/orange dominant, then
         blue/magenta, then green. Weighted by blob area, not by count --
         b5 is the largest blob, b4 the smallest. */
      '--afa-b5:rgb(255,90,40);--afa-b1:rgb(255,60,60);--afa-b7:rgb(255,140,40);' +
      '--afa-b9:rgb(150,60,240);--afa-b6:rgb(90,80,255);--afa-b2:rgb(40,140,255);' +
      '--afa-b8:rgb(240,50,180);--afa-b3:rgb(50,200,80);--afa-b4:rgb(30,185,170);' +
      '--afa-i5:rgba(255,90,40,.45);--afa-i1:rgba(255,60,60,.45);--afa-i7:rgba(255,140,40,.45);' +
      '--afa-i9:rgba(150,60,240,.45);--afa-i6:rgba(90,80,255,.45);--afa-i2:rgba(40,140,255,.45);' +
      '--afa-i8:rgba(240,50,180,.45);--afa-i3:rgba(50,200,80,.45);--afa-i4:rgba(30,185,170,.45);}',
    /* Fire palette. Hue cycle tightened to 10deg -- at 30deg the reds swing
       into magenta and the ambers into olive, which reads off-brand. */
    '.afa-beam[data-beam-variant="ember"]{--afa-beam-hue:10deg;' +
      '--afa-b1:rgb(192,57,43);--afa-b2:rgb(212,90,32);--afa-b3:rgb(232,168,56);' +
      '--afa-b4:rgb(255,176,92);--afa-b5:rgb(169,50,38);--afa-b6:rgb(212,90,32);' +
      '--afa-b7:rgb(255,140,60);--afa-b8:rgb(232,168,56);--afa-b9:rgb(199,136,32);' +
      '--afa-i1:rgba(192,57,43,.45);--afa-i2:rgba(212,90,32,.45);--afa-i3:rgba(232,168,56,.45);' +
      '--afa-i4:rgba(255,176,92,.45);--afa-i5:rgba(169,50,38,.45);--afa-i6:rgba(212,90,32,.45);' +
      '--afa-i7:rgba(255,140,60,.45);--afa-i8:rgba(232,168,56,.45);--afa-i9:rgba(199,136,32,.45);}',
    '.afa-beam.afa-beam-on{animation:afaBeamSpin var(--afa-beam-dur) linear infinite,afaBeamIn .6s ease forwards;}',
    '.afa-beam.afa-beam-on::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:var(--afa-beam-w);background:conic-gradient(from var(--afa-beam-angle),transparent 0%,transparent 54%,rgba(255,255,255,.1) 57%,rgba(255,255,255,.3) 60%,rgba(255,255,255,.6) 63%,rgba(255,255,255,.75) 66%,rgba(255,255,255,.6) 69%,rgba(255,255,255,.3) 72%,rgba(255,255,255,.1) 75%,transparent 78%),radial-gradient(ellipse 70px 40px at 33% -7%,var(--afa-b1),transparent),radial-gradient(ellipse 60px 35px at 12% -5%,var(--afa-b2),transparent),radial-gradient(ellipse 40px 70px at 2% 68%,var(--afa-b3),transparent),radial-gradient(ellipse 180px 32px at 74% 100%,var(--afa-b5),transparent),radial-gradient(ellipse 85px 26px at 55% 100%,var(--afa-b6),transparent),radial-gradient(ellipse 74px 32px at 94% 0%,var(--afa-b7),transparent),radial-gradient(ellipse 52px 48px at 100% 27%,var(--afa-b9),transparent);-webkit-mask:conic-gradient(from var(--afa-beam-angle),transparent 0%,transparent 30%,rgba(255,255,255,.1) 36%,rgba(255,255,255,.35) 44%,#fff 52%,#fff 80%,rgba(255,255,255,.35) 86%,rgba(255,255,255,.1) 92%,transparent 95%),linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:source-in,xor;mask:conic-gradient(from var(--afa-beam-angle),transparent 0%,transparent 30%,rgba(255,255,255,.1) 36%,rgba(255,255,255,.35) 44%,#fff 52%,#fff 80%,rgba(255,255,255,.35) 86%,rgba(255,255,255,.1) 92%,transparent 95%),linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:intersect,exclude;pointer-events:none;z-index:3;opacity:calc(var(--afa-beam-opacity) * .55 * var(--afa-beam-strength));animation:afaBeamHue 12s ease-in-out infinite;}',
    '.afa-beam.afa-beam-on::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(ellipse 63px 36px at 33% -7%,var(--afa-i1),transparent),radial-gradient(ellipse 54px 32px at 12% -5%,var(--afa-i2),transparent),radial-gradient(ellipse 36px 63px at 2% 68%,var(--afa-i3),transparent),radial-gradient(ellipse 162px 29px at 74% 100%,var(--afa-i5),transparent),radial-gradient(ellipse 67px 29px at 94% 0%,var(--afa-i7),transparent),radial-gradient(ellipse 47px 43px at 100% 27%,var(--afa-i9),transparent);-webkit-mask-image:conic-gradient(from var(--afa-beam-angle),transparent 0%,transparent 22%,rgba(255,255,255,.12) 28%,rgba(255,255,255,.4) 36%,#fff 46%,#fff 82%,rgba(255,255,255,.4) 88%,rgba(255,255,255,.12) 94%,transparent 97%);mask-image:conic-gradient(from var(--afa-beam-angle),transparent 0%,transparent 22%,rgba(255,255,255,.12) 28%,rgba(255,255,255,.4) 36%,#fff 46%,#fff 82%,rgba(255,255,255,.4) 88%,rgba(255,255,255,.12) 94%,transparent 97%);pointer-events:none;z-index:2;opacity:calc(var(--afa-beam-opacity) * .4 * var(--afa-beam-strength));animation:afaBeamHue 12s ease-in-out infinite;}',
    /* Targets. The composer wrapper takes over flex:1 from the input it wraps
       (pseudo-elements do not render on <input>, hence the wrapper). */
    '.afa-beam-input{position:relative;flex:1;min-width:0;border-radius:999px;}',
    '.afa-beam-input .afa-input{width:100%;flex:none;}',
    /* Panel target: ring only. The inner-glow blobs are sized in absolute px
       for a card-height element, so on a 620px-tall panel they land mid-
       transcript as a stray colour blotch instead of an edge glow. A clean
       traveling rim is the right read at this size. */
    '.afa-panel.afa-beam{--afa-beam-strength:1;}',
    '.afa-panel.afa-beam.afa-beam-on::before{display:none;}',
    /* Ember is thinking: spin faster and brighter, so the beam reads as a
       live activity indicator rather than pure decoration. */
    '.afa-beam.afa-beam-busy{--afa-beam-dur:1.8s;--afa-beam-strength:1.9;}',
    '@keyframes afaBeamSpin{to{--afa-beam-angle:360deg;}}',
    '@keyframes afaBeamIn{to{--afa-beam-opacity:1;}}',
    '@keyframes afaBeamHue{0%,100%{filter:hue-rotate(calc(var(--afa-beam-hue) * -1)) brightness(1.3) saturate(1.2);}50%{filter:hue-rotate(var(--afa-beam-hue)) brightness(1.3) saturate(1.2);}}',
    '@media (prefers-reduced-motion:reduce){',
    '.afa-beam.afa-beam-on,.afa-beam.afa-beam-on::before,.afa-beam.afa-beam-on::after{animation:none !important;--afa-beam-opacity:1;}',
    '}',

    /* Inline mount. The panel is normally position:fixed in the corner; here
       it fills whatever box the host gives it and drops its own chrome so the
       host's container provides the surface. */
    '.afa-root.afa-inline{position:relative;display:block;width:100%;height:100%;}',
    '.afa-inline .afa-panel{position:relative;right:auto;bottom:auto;z-index:auto;width:100%;max-width:none;height:100%;border:none;border-radius:0;box-shadow:none;background:transparent;}',
    '.afa-inline .afa-panel.afa-open{animation:none;}',
    '.afa-inline .afa-launcher,.afa-inline .afa-nudge{display:none!important;}',

    '.afa-legal{text-align:center;font-size:10.5px;color:var(--afa-muted);padding:0 12px 8px;}',
    '.afa-legal a{color:var(--afa-mid);}',

    /* Mobile */
    '@media (max-width:520px){',
    '.afa-root:not(.afa-inline) .afa-panel{right:0;left:0;top:0;bottom:auto;width:100vw;max-width:100vw;height:var(--afa-vvh,100dvh);transform:translateY(var(--afa-vvt,0px));border-radius:0;border:none;}',
    '.afa-nudge{right:16px;bottom:88px;}',
    '}'
  ];

  // Host pages (Shopify themes especially) style <button>/<input>/<a> globally,
  // often with !important — which washes out the launcher and inputs. Every
  // declaration gets !important; with our class specificity that wins against
  // any theme rule. Keyframe bodies are skipped (!important is invalid there).
  function hardenedCSS() {
    return CSS.map(function (rule) {
      if (rule.indexOf('@keyframes') === 0) return rule;
      return rule
        .replace(/\s*!important/g, '')
        .replace(/([a-zA-Z-]+):([^;{}]+);/g, '$1:$2 !important;');
    }).join('\n');
  }

  /* ── DOM construction ─────────────────────────────────────────────────── */
  // The beam needs a registered @property (to animate an <angle>) and
  // mask-composite. Where either is missing we skip it entirely rather than
  // render a broken half-effect -- the widget is unaffected either way.
  var beamEl = null;
  function beamSupported() {
    // NB: window.CSS, not CSS -- this file declares its own `var CSS` (the
    // stylesheet string) above, which shadows the global CSS object.
    var C = window.CSS;
    if (!BEAM || !C || !C.supports) return false;
    return typeof C.registerProperty === 'function' &&
      (C.supports('mask-composite', 'exclude') ||
       C.supports('-webkit-mask-composite', 'xor'));
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var root, panel, msgsEl, inputEl, sendBtn, launcher, nudge;

  function buildUI() {
    // Figtree, the portal's one family. Skipped where the host already pulls
    // from Google Fonts -- on the portal that is Figtree already, and on a
    // storefront that loads its own we defer to the merchant rather than
    // fetch a second family over theirs.
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      var pre = el('link'); pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = '';
      var f = el('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap';
      document.head.appendChild(pre); document.head.appendChild(f);
    }

    var style = el('style'); style.textContent = hardenedCSS();
    document.head.appendChild(style);

    root = el('div', 'afa-root');
    root.setAttribute('data-aquafire-assistant', '');

    launcher = el('button', 'afa-launcher');
    launcher.setAttribute('aria-label', 'Chat with Aquafire');
    launcher.innerHTML = '<span class="afa-ico-flame"></span><span class="afa-launcher-label">Chat with us</span><span class="afa-ico-close">' + CLOSE_SVG + '</span><span class="afa-badge"></span>';
    launcher.classList.add('afa-unread');
    launcher.addEventListener('click', function () { toggle(); });

    panel = el('div', 'afa-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Aquafire chat');

    var head = el('div', 'afa-head');
    var av = el('div', 'afa-avatar', '<span class="afa-dot"></span>');
    var ht = el('div', 'afa-head-txt', '<h3>Chat</h3><p>Aquafire support \u00b7 online</p>');
    var restart = el('button', 'afa-head-btn', '&#x21bb;');
    restart.title = 'Restart conversation';
    restart.setAttribute('aria-label', 'Restart conversation');
    restart.addEventListener('click', resetConversation);
    var closeB = el('button', 'afa-head-btn', '&#x2715;');
    closeB.title = 'Close';
    closeB.setAttribute('aria-label', 'Close chat');
    closeB.addEventListener('click', function () { toggle(false); });
    head.appendChild(av); head.appendChild(ht); head.appendChild(restart); head.appendChild(closeB);

    msgsEl = el('div', 'afa-msgs');
    msgsEl.setAttribute('aria-live', 'polite');

    var foot = el('div', 'afa-foot');
    var row = el('div', 'afa-inputrow');
    inputEl = el('input', 'afa-input');
    inputEl.type = 'text';
    inputEl.placeholder = 'Ask about models, install, fixes\u2026';
    inputEl.setAttribute('aria-label', 'Type your message');
    inputEl.maxLength = 500;
    sendBtn = el('button', 'afa-send', SEND_SVG);
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.disabled = true;
    // Pseudo-elements do not render on <input>, so the composer beam needs a
    // wrapper element to hang its layers on.
    if (BEAM === 'input' && beamSupported()) {
      beamEl = el('div', 'afa-beam afa-beam-input afa-beam-on');
      beamEl.setAttribute('data-beam-variant', BEAM_VARIANT);
      beamEl.appendChild(inputEl);
      row.appendChild(beamEl);
    } else {
      row.appendChild(inputEl);
    }
    row.appendChild(sendBtn);
    var legal = el('div', 'afa-legal', 'AI assistant \u2014 answers can be imperfect. <a href="mailto:' + SUPPORT_EMAIL + '">Talk to a human</a> anytime.');
    foot.appendChild(row); foot.appendChild(legal);

    panel.appendChild(head); panel.appendChild(msgsEl); panel.appendChild(foot);
    if (BEAM === 'panel' && beamSupported()) {
      panel.classList.add('afa-beam', 'afa-beam-on');
      panel.setAttribute('data-beam-variant', BEAM_VARIANT);
      beamEl = panel;
    }

    root.appendChild(panel);
    var host = MOUNT
      ? (typeof MOUNT === 'string' ? document.querySelector(MOUNT) : MOUNT)
      : null;
    if (host) {
      root.classList.add('afa-inline');
      host.appendChild(root);
      // The host decides when the chat is showing, so never restore an open
      // panel or fire the corner nudge here.
      state.open = false;
    } else {
      root.appendChild(launcher);
      document.body.appendChild(root);
    }

    inputEl.addEventListener('input', function () { sendBtn.disabled = !inputEl.value.trim(); });
    inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' && inputEl.value.trim()) submit(); });
    sendBtn.addEventListener('click', submit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.open) toggle(false); });

    // Restore transcript or greet
    if (state.msgs.length) {
      state.msgs.forEach(function (m) { renderMessage(m, true); });
      scrollToEnd(true);
    }
    if (state.open) toggle(true, true);

    // Proactive teaser \u2014 fires once the visitor shows engagement (scrolling
    // around or a few clicks), with a 30s dwell fallback. Once per session,
    // never over an open or previously-used chat.
    if (!host && !state.nudged && !state.open && !state.msgs.length) {
      var armedAt = Date.now(), scrolled = 0, lastY = window.pageYOffset || 0, clicks = 0, fallbackTimer;
      var onScroll = function () {
        var y = window.pageYOffset || 0;
        scrolled += Math.abs(y - lastY);
        lastY = y;
        maybeTease();
      };
      var onClick = function (e) {
        if (root.contains(e.target)) return; // interacting with the widget itself
        clicks++;
        maybeTease();
      };
      var stopWatching = function () {
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('click', onClick, true);
        clearTimeout(fallbackTimer);
      };
      var fireTease = function () {
        stopWatching();
        if (!state.open && !state.nudged) showTeaser();
      };
      var maybeTease = function () {
        if (state.open || state.nudged) { stopWatching(); return; }
        if (Date.now() - armedAt < 5000) return; // let them land first
        if (scrolled > 700 || clicks >= 3) fireTease();
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('click', onClick, true);
      fallbackTimer = setTimeout(fireTease, 30000);
    }
  }

  function showTeaser() {
    state.nudged = true; persist();
    logEvent('teaser_shown', {});
    nudge = el('div', 'afa-nudge');
    nudge.setAttribute('role', 'complementary');
    nudge.setAttribute('aria-label', 'Chat invitation');
    nudge.innerHTML =
      '<div class="afa-nudge-head">' +
        '<span class="afa-nudge-avatar"></span>' +
        '<span class="afa-nudge-name">Chat</span>' +
        '<button class="afa-nudge-x" aria-label="Dismiss">\u2715</button>' +
      '</div>' +
      '<div class="afa-nudge-msg">Hi! \ud83d\udc4b Looking at Aquafire? I can help you compare models, plan your install, or fix an issue \u2014 just ask.</div>' +
      '<div class="afa-nudge-reply">Click to reply\u2026</div>';
    nudge.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.afa-nudge-x')) { killNudge(); return; }
      toggle(true);
    });
    root.appendChild(nudge);
  }

  function killNudge() { if (nudge) { nudge.remove(); nudge = null; } }

  /* ── Keyboard fit (iOS) ────────────────────────────────────────────────
     On the phone takeover the panel filled 100dvh. dvh follows the URL bar but
     NOT the software keyboard, so opening the keyboard left the panel its full
     height with the bottom half underneath it -- Safari then scrolled the
     focused input into view, carrying the header and the whole message list
     off the top of the screen. Only visualViewport reports the keyboard, so
     the takeover is sized and offset from it. Desktop, the inline hero mount
     and browsers without the API keep the CSS default. */
  var vvBound = false;
  function fitViewport() {
    if (!root || !window.visualViewport) return;
    var takeover = !MOUNT && window.matchMedia('(max-width:520px)').matches;
    if (!takeover || !state.open) {
      root.style.removeProperty('--afa-vvh');
      root.style.removeProperty('--afa-vvt');
      return;
    }
    var vv = window.visualViewport;
    root.style.setProperty('--afa-vvh', Math.round(vv.height) + 'px');
    root.style.setProperty('--afa-vvt', Math.round(vv.offsetTop) + 'px');
  }
  /* The launcher introduces itself as "Chat with us", then gets out of the way:
     it folds to the flame disc on the first real scroll, or after a short dwell
     if the visitor never scrolls. Once collapsed it stays collapsed -- a pill
     that reappears would be the same obstruction twice. Inline hosts have no
     launcher, and an open panel already renders the compact close state. */
  function armLauncherCollapse() {
    if (MOUNT || !launcher) return;
    var done = false;
    function collapse() {
      if (done) return;
      done = true;
      launcher.classList.add('afa-mini');
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    }
    function onScroll() { if ((window.pageYOffset || 0) > 60) collapse(); }
    var timer = setTimeout(collapse, 6000);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Deep links and restored positions can start the page mid-scroll.
    onScroll();
  }

  function bindViewport() {
    if (vvBound || !window.visualViewport) return;
    vvBound = true;
    window.visualViewport.addEventListener('resize', fitViewport);
    window.visualViewport.addEventListener('scroll', fitViewport);
  }

  function toggle(force, silent) {
    var was = state.open;
    state.open = force != null ? force : !state.open;
    panel.classList.toggle('afa-open', state.open);
    launcher.classList.toggle('afa-open', state.open);
    // Inline hosts render their own container, so they need to know when the
    // widget closed itself (header X, Escape) in order to collapse it.
    if (MOUNT && was && !state.open && root) {
      root.dispatchEvent(new CustomEvent('aquafire:close', { bubbles: true }));
    }
    if (state.open) {
      launcher.classList.remove('afa-unread');
      killNudge();
      if (!state.msgs.length) greet();
      bindViewport();
      fitViewport();
      if (!silent) inputEl.focus();
      // The keyboard animates in after focus, so the first resize event can
      // land a frame or two later; re-fit rather than trusting the first read.
      setTimeout(fitViewport, 250);
      setTimeout(fitViewport, 600);
      scrollToEnd(true);
    } else {
      fitViewport();
    }
    persist();
  }

  function resetConversation() {
    state.msgs = [];
    state.ctx = { model: null, awaiting: null };
    msgsEl.innerHTML = '';
    persist();
    greet();
  }

  // convo_start is logged lazily on the first user message (not on panel
  // open) so browsing visitors don't create empty conversations in insights
  /* "this morning" / "this afternoon" / "this evening" / "tonight".
     index.html carries its own copy for the hero greeting: this file ships to
     third-party pages as one script tag and cannot share a helper with them. */
  function dayPart() {
    var h = new Date().getHours();
    if (h < 5) return 'tonight';
    if (h < 12) return 'this morning';
    if (h < 17) return 'this afternoon';
    if (h < 21) return 'this evening';
    return 'tonight';
  }

  function greet() {
    pushBot({
      blocks: [
        { t: 'text', html: 'How can I help you ' + dayPart() + '? I can compare models, plan your install, check water care, track your order, or walk you through a fix.' },
        mainChips()
      ]
    });
  }

  /* ── Rendering ────────────────────────────────────────────────────────── */
  function scrollToEnd(instant) {
    msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
  }

  // Scroll a newly added message into view. Scrolling to the bottom is right
  // for anything that fits, but a step-by-step answer is taller than the pane
  // on a phone -- the hero panel gives the message list about 300px -- and
  // jumping to its end lands the reader past the instructions they asked for.
  // Taller-than-the-pane messages align their top instead, so the answer reads
  // from its first line.
  function scrollToMsg(row, instant) {
    if (!row || !msgsEl) return;
    if (row.offsetHeight <= msgsEl.clientHeight) { scrollToEnd(instant); return; }
    var top = msgsEl.scrollTop
      + (row.getBoundingClientRect().top - msgsEl.getBoundingClientRect().top);
    msgsEl.scrollTo({ top: Math.max(0, top - 8), behavior: instant ? 'auto' : 'smooth' });
  }

  function renderBlocks(container, blocks, spent) {
    blocks.forEach(function (b) {
      if (b.t === 'text') {
        container.appendChild(el('div', 'afa-bubble', b.html));
      } else if (b.t === 'steps') {
        var wrap = el('div', 'afa-bubble');
        var ol = el('ol', 'afa-steps');
        b.items.forEach(function (s) { ol.appendChild(el('li', null, s)); });
        wrap.appendChild(ol);
        container.appendChild(wrap);
      } else if (b.t === 'chips') {
        var chips = el('div', 'afa-chips' + (spent ? ' afa-spent' : ''));
        b.items.forEach(function (c) {
          if (c.href) {
            var a = el('a', 'afa-chip', c.label);
            a.href = c.href; a.target = '_blank'; a.rel = 'noopener';
            chips.appendChild(a);
          } else {
            var btn = el('button', 'afa-chip', c.label);
            btn.addEventListener('click', function () {
              chips.classList.add('afa-spent');
              handleUserText(c.send, true);
            });
            chips.appendChild(btn);
          }
        });
        container.appendChild(chips);
      } else if (b.t === 'cards') {
        var cards = el('div', 'afa-cards');
        b.items.forEach(function (p) {
          var card = el('div', 'afa-card');
          card.innerHTML = '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            '<div class="afa-card-b"><h4>' + p.name + '</h4><span class="afa-price">' + p.price + '</span><p>' + p.blurb + '</p>' +
            '<a href="' + p.url + '" target="_blank" rel="noopener">View \u2192</a></div>';
          cards.appendChild(card);
        });
        container.appendChild(cards);
      } else if (b.t === 'links') {
        var links = el('div', 'afa-links');
        b.items.forEach(function (l) {
          var a = el('a', 'afa-link', l.label);
          a.href = l.href; a.target = '_blank'; a.rel = 'noopener';
          links.appendChild(a);
        });
        container.appendChild(links);
      } else if (b.t === 'videos') {
        var vids = el('div', 'afa-videos');
        b.keys.forEach(function (k) {
          var v = VIDEOS[k]; if (!v || !v.url) return;
          var a = el('a', 'afa-video', v.label);
          a.href = v.url; a.target = '_blank'; a.rel = 'noopener';
          vids.appendChild(a);
        });
        if (vids.children.length) container.appendChild(vids);
      } else if (b.t === 'contact') {
        if (!spent) {
          logEvent('handoff', { mode: b.mode || 'support' });
          notify('handoff', { mode: b.mode || 'support' });
        }
        var email = b.mode === 'sales' ? SALES_EMAIL : b.mode === 'orders' ? ORDERS_EMAIL : SUPPORT_EMAIL;
        var c = el('div', 'afa-contact');
        c.innerHTML = '<h5>' + (b.mode === 'sales' ? 'Sales & design' : b.mode === 'orders' ? 'Orders' : 'Aquafire support') + '</h5>' +
          '<a href="mailto:' + email + '">\ud83d\udce7 ' + email + '</a>' +
          '<a href="tel:' + PHONE_TEL + '">\ud83d\udcde ' + PHONE + '</a>' +
          '<a href="' + STORE + '/pages/service-request" target="_blank" rel="noopener">\ud83d\udee0\ufe0f Submit a service request</a>';
        container.appendChild(c);
      }
    });
  }

  function renderMessage(m, restoring) {
    var row = el('div', 'afa-row ' + (m.who === 'user' ? 'afa-user' : 'afa-bot'));
    if (m.who === 'user') {
      var bub = el('div', 'afa-bubble');
      bub.textContent = m.text;
      row.appendChild(bub);
    } else {
      row.appendChild(el('div', 'afa-mini-avatar'));
      var col = el('div', 'afa-col');
      renderBlocks(col, m.blocks, restoring);
      if (m.feedback && !restoring) col.appendChild(feedbackEl());
      // Dead-end replies offer the follow-up form underneath; contact-card
      // messages are handled ask-first in pushBot instead.
      if (!restoring && COLLECT_EMAIL && !state.emailAsked && !state.contactEmail && m.emailAsk)
        col.appendChild(emailCaptureEl());
      row.appendChild(col);
    }
    msgsEl.appendChild(row);
    if (!restoring) scrollToMsg(row);
    return row;
  }

  function feedbackEl() {
    var srcIntent = lastIntentId;
    var fb = el('div', 'afa-fb');
    fb.innerHTML = '<span>Was this helpful?</span>';
    var yes = el('button', null, '\ud83d\udc4d'), no = el('button', null, '\ud83d\udc4e');
    yes.setAttribute('aria-label', 'Helpful'); no.setAttribute('aria-label', 'Not helpful');
    yes.addEventListener('click', function () {
      logEvent('feedback', { vote: 'up', intent: srcIntent });
      fb.innerHTML = '<span>Thanks for the feedback! \ud83d\udd25</span>';
    });
    no.addEventListener('click', function () {
      logEvent('feedback', { vote: 'down', intent: srcIntent });
      fb.innerHTML = '';
      var form = el('div', 'afa-fb-form');
      var inp = el('input');
      inp.type = 'text'; inp.maxLength = 300;
      inp.placeholder = 'What went wrong? (optional)';
      inp.setAttribute('aria-label', 'What went wrong?');
      var send = el('button', null, 'Send');
      function submitComment() {
        var val = inp.value.trim();
        if (val) logEvent('feedback_comment', { intent: srcIntent, comment: val.slice(0, 300) });
        fb.innerHTML = '<span>Thanks \u2014 this helps us improve these answers.</span>';
      }
      send.addEventListener('click', submitComment);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitComment(); });
      form.appendChild(inp); form.appendChild(send);
      fb.appendChild(el('span', null, 'Sorry about that.'));
      fb.appendChild(form);
      pushBot({ blocks: [contactBlock('support')] });
      inp.focus();
    });
    fb.appendChild(yes); fb.appendChild(no);
    return fb;
  }

  /* Follow-up email capture — once per conversation, so the team can reach
     out instead of waiting for the customer to email in. On a handoff it is
     asked BEFORE the contact card (renderEmailAsk below); after a dead-end
     reply it is appended underneath. Submitting fires the 'callback' Slack
     alert, logs a 'contact_left' event, and stores the address via
     /api/collect-email (Mailchimp) — the one consented exception to the
     telemetry email mask. */
  function emailCaptureEl(opts) {
    opts = opts || {};
    state.emailAsked = true; persist();
    var wrap = el('div', 'afa-email');
    var lead = opts.lead || 'Prefer we reach out? Leave your email and a real person will follow up.';
    wrap.appendChild(el('div', opts.bubble ? 'afa-bubble' : 'afa-email-lead', lead));
    var form = el('div', 'afa-fb-form afa-email-form');
    var inp = el('input');
    inp.type = 'email'; inp.maxLength = 120;
    inp.placeholder = 'you@example.com';
    inp.setAttribute('aria-label', 'Your email address for a follow-up');
    var send = el('button', null, 'Request follow-up');
    function submitEmail() {
      // Take the matched address only — the regex's character set is what
      // keeps the value safe to echo back below.
      var m = inp.value.trim().match(EMAIL_RE);
      if (!m) { inp.classList.add('afa-email-bad'); inp.focus(); return; }
      var val = m[0];
      state.contactEmail = val; persist();
      notify('callback', { email: val });
      logEvent('contact_left', { email: val });
      storeEmail(val);
      wrap.innerHTML = '<span class="afa-email-done">Thanks \u2014 the team will be in touch at <strong>' + val + '</strong>.</span>';
      if (opts.onSubmit) opts.onSubmit();
    }
    send.addEventListener('click', submitEmail);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitEmail(); });
    inp.addEventListener('input', function () { inp.classList.remove('afa-email-bad'); });
    form.appendChild(inp); form.appendChild(send);
    wrap.appendChild(form);
    if (opts.skipLabel && opts.onSkip) {
      var skip = el('button', 'afa-email-skip', opts.skipLabel);
      skip.addEventListener('click', opts.onSkip);
      wrap.appendChild(skip);
    }
    return wrap;
  }

  /* The ask-first step on a handoff: renders the email form as its own bot
     row and holds the contact-card message back until the customer answers
     or skips. Both paths call done() exactly once. */
  function renderEmailAsk(onDone) {
    var row = el('div', 'afa-row afa-bot');
    row.appendChild(el('div', 'afa-mini-avatar'));
    var col = el('div', 'afa-col');
    var fired = false;
    function done() { if (fired) return; fired = true; onDone(); }
    col.appendChild(emailCaptureEl({
      bubble: true,
      lead: 'Before I hand you over \u2014 want the team to reach out instead? Leave your email and a real person will follow up.',
      onSubmit: done,
      skipLabel: 'No thanks \u2014 just show me the contact info',
      onSkip: function () { row.remove(); done(); }
    }));
    row.appendChild(col);
    msgsEl.appendChild(row);
    scrollToMsg(row);
  }

  function pushBot(res) {
    var m = { who: 'bot', blocks: res.blocks, feedback: !!res.feedback, emailAsk: !!res.emailAsk };
    state.msgs.push(m); persist();
    // A message carrying a contact card waits behind the email ask (once per
    // conversation) — the follow-up offer converts better before the
    // customer already has the support address in front of them.
    if (COLLECT_EMAIL && !state.emailAsked && !state.contactEmail &&
        (m.blocks || []).some(function (b) { return b.t === 'contact'; })) {
      renderEmailAsk(function () { renderMessage(m); });
    } else {
      renderMessage(m);
    }
    if (!state.open) launcher.classList.add('afa-unread');
  }

  function pushUser(text) {
    var m = { who: 'user', text: text };
    state.msgs.push(m); persist();
    renderMessage(m);
  }

  var typingRow = null;
  function setBeamBusy(on) {
    if (beamEl) beamEl.classList.toggle('afa-beam-busy', on);
  }
  function showTyping() {
    setBeamBusy(true);
    if (typingRow) return;
    typingRow = el('div', 'afa-row afa-bot');
    typingRow.appendChild(el('div', 'afa-mini-avatar'));
    var bub = el('div', 'afa-bubble afa-typing', '<span></span><span></span><span></span>');
    typingRow.appendChild(bub);
    msgsEl.appendChild(typingRow);
    scrollToEnd();
  }
  function hideTyping() {
    setBeamBusy(false);
    if (typingRow) { typingRow.remove(); typingRow = null; }
  }

  /* ── Conversation flow ────────────────────────────────────────────────── */
  function submit() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    sendBtn.disabled = true;
    handleUserText(text);
  }

  function handleUserText(text, viaChip) {
    pushUser(text);
    // Alerts quote the last question the customer actually typed — "Talk to a
    // human" is a chip, and tells the team nothing about what they were stuck on.
    if (!viaChip) lastUserText = text;
    if (!state.started) {
      state.started = true;
      persist();
      logEvent('convo_start', visitorCtx());
    }
    var norm = normalize(text);

    // model mentions update context anywhere in the conversation
    var m = detectModel(norm);
    if (m) { state.ctx.model = m; persist(); }

    // pending model question from guided troubleshooting
    if (state.ctx.awaiting === 'ts_model') {
      state.ctx.awaiting = null;
      if (!m) state.ctx.model = 'unknown';
      persist();
      lastIntentId = 'ts_menu';
      logEvent('user_message', { text: text.slice(0, 300), intent: 'ts_model_select' });
      reply(function () { return tsMenu(); });
      return;
    }

    // Order lookup: parse from the RAW text (normalize strips @ and #)
    lastSeenEmail = (text.match(EMAIL_RE) || [])[0] || null;
    lastSeenOrderNum = extractOrderNum(text, state.ctx.awaiting === 'order_lookup');

    if (ORDER_ENDPOINT && !orderDown) {
      if (state.ctx.awaiting === 'order_lookup') {
        if (/\b(cancel|nevermind|never mind|stop|forget it)\b/i.test(text)) {
          state.ctx.awaiting = null; state.ctx.orderNum = null; state.ctx.orderEmail = null; persist();
          lastIntentId = 'order_lookup';
          logEvent('user_message', { text: text.slice(0, 300), intent: 'order_lookup_cancel' });
          reply(function () { return { blocks: [{ t: 'text', html: 'No problem \u2014 what else can I help with?' }] }; });
          return;
        }
        if (lastSeenEmail || lastSeenOrderNum) {
          if (lastSeenEmail) state.ctx.orderEmail = lastSeenEmail;
          if (lastSeenOrderNum) state.ctx.orderNum = lastSeenOrderNum;
          persist();
          lastIntentId = 'order_lookup';
          logEvent('user_message', { text: text.slice(0, 300), intent: 'order_lookup' });
          if (state.ctx.orderNum && state.ctx.orderEmail) {
            orderLookup();
          } else {
            reply(function () {
              return { blocks: [{ t: 'text', html: state.ctx.orderNum
                ? 'Got it \u2014 and the <strong>email address</strong> you used at checkout?'
                : 'Thanks \u2014 and your <strong>order number</strong>? It\u2019s in your confirmation email (e.g. #1234).' }] };
            });
          }
          return;
        }
        // no order info in this message — treat it as a normal question instead
        state.ctx.awaiting = null; state.ctx.orderNum = null; state.ctx.orderEmail = null; persist();
      } else if (lastSeenEmail && lastSeenOrderNum) {
        // both volunteered in one message (e.g. after an AI answer suggested it)
        state.ctx.orderEmail = lastSeenEmail; state.ctx.orderNum = lastSeenOrderNum; persist();
        lastIntentId = 'order_lookup';
        logEvent('user_message', { text: text.slice(0, 300), intent: 'order_lookup' });
        orderLookup();
        return;
      }
    }

    var intent = matchIntent(text);
    var llmAvailable = API_ENDPOINT && !llmDown;
    lastIntentId = intent ? intent.id : (llmAvailable ? 'llm' : 'fallback');
    logEvent('user_message', { text: text.slice(0, 300), intent: lastIntentId });

    if (intent) {
      reply(function () { return intent.answer(norm); });
    } else if (llmAvailable) {
      remoteReply(text);
    } else {
      notify('unanswered', { question: text });
      reply(function () { var r = FALLBACK(); r.emailAsk = true; return r; });
    }
  }

  // Plain-text extract of an answer's text/steps blocks (for transcripts)
  function blocksText(blocks) {
    var out = [];
    (blocks || []).forEach(function (b) {
      if (b.t === 'text') out.push(b.html.replace(/<[^>]+>/g, ''));
      else if (b.t === 'steps') out.push(b.items.map(function (s) { return s.replace(/<[^>]+>/g, ''); }).join(' | '));
    });
    return out.join('\n');
  }

  // "Thinking" pause before answers land (~2s) — instant replies read as canned
  var THINK_MS = 1900;
  function thinkDelay() { return THINK_MS + Math.random() * 600; }

  function reply(produce) {
    showTyping();
    setTimeout(function () {
      hideTyping();
      var res = produce();
      pushBot(res);
      logEvent('bot_reply', { intent: lastIntentId, text: blocksText(res.blocks).slice(0, 600) });
    }, thinkDelay());
  }

  /* ── Optional LLM backend ─────────────────────────────────────────────── */
  function historyForApi() {
    return state.msgs.slice(-12).map(function (m) {
      return {
        role: m.who === 'user' ? 'user' : 'assistant',
        content: m.who === 'user' ? m.text : m.blocks.filter(function (b) { return b.t === 'text'; })
          .map(function (b) { return b.html.replace(/<[^>]+>/g, ''); }).join('\n')
      };
    });
  }

  function remoteReply(text) {
    showTyping();
    var startedAt = Date.now();
    // hold the typing dots for at least the think time, even on a fast API
    function afterThink(fn) {
      setTimeout(fn, Math.max(0, THINK_MS - (Date.now() - startedAt)));
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({
        message: text,
        history: historyForApi().slice(0, -1),
        context: Object.assign({ model: state.ctx.model, page: location.href }, visitorCtx())
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(function (d) {
      clearTimeout(timer);
      if (!d || !d.reply) throw new Error('empty');
      // The function flags replies where the AI told the customer it couldn't
      // help — alert immediately, not behind the reply's typing delay.
      if (d.unresolved) notify('unresolved', { question: text, reply: String(d.reply).slice(0, 700) });
      afterThink(function () {
        hideTyping();
        logEvent('llm_reply', { text: String(d.reply).slice(0, 500) });
        pushBot({
          feedback: true,
          emailAsk: !!d.unresolved,
          blocks: [{ t: 'text', html: mdLite(d.reply) }, { t: 'chips', items: [CHIP_HUMAN] }]
        });
      });
    }).catch(function () {
      clearTimeout(timer);
      llmDown = true; // don't retry this page load — go straight to local KB
      notify('llm_error', { question: text });
      afterThink(function () {
        hideTyping();
        logEvent('llm_error', {});
        var r = FALLBACK(); r.emailAsk = true;
        pushBot(r);
      });
    });
  }

  // Minimal markdown → HTML for remote replies (links, bold, line breaks)
  function mdLite(text) {
    var esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
  }

  /* ── Order & tracking lookup (api/order-status.js) ────────────────────────
     Guided collect of order number + checkout email, verified server-side.
     Telemetry logs outcomes only — never the number or the email. */
  var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  var lastSeenEmail = null, lastSeenOrderNum = null;

  function extractOrderNum(text, loose) {
    var m = text.match(/#\s*([A-Za-z]{0,6}-?\d{1,10})\b/);
    if (m) return m[1];
    m = text.match(/\border(?:\s+number|\s+no\.?|\s*#)?\s*[:\-]?\s*([A-Za-z]{0,6}-?\d{1,10})\b/i);
    if (m) return m[1];
    if (loose) {
      // mid-collect a bare number counts (but never digits inside the email)
      m = text.replace(EMAIL_RE, ' ').match(/\b([A-Za-z]{0,6}-?\d{3,10})\b/);
      if (m) return m[1];
    }
    return null;
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }

  function orderFallback() {
    return {
      feedback: true,
      blocks: [
        { t: 'text', html: 'I can\u2019t look up individual orders right now, but two quick options:' },
        { t: 'steps', items: [
          'Log in to <a href="' + STORE + '/account" target="_blank" rel="noopener">your aquafire.com account</a> \u2014 every order shows live status and tracking.',
          'Or email <a href="mailto:' + ORDERS_EMAIL + '">' + ORDERS_EMAIL + '</a> with your order number and the team will check right away.'
        ]},
        contactBlock('orders')
      ]
    };
  }

  function orderCard(o) {
    var statusMap = {
      FULFILLED: 'Shipped', UNFULFILLED: 'Being prepared', IN_PROGRESS: 'Being prepared',
      PARTIALLY_FULFILLED: 'Partially shipped', SCHEDULED: 'Scheduled', ON_HOLD: 'On hold',
      PENDING_FULFILLMENT: 'Being prepared', OPEN: 'Being prepared'
    };
    var status = o.cancelled ? 'Cancelled' : (statusMap[o.status] || 'In progress');
    var head = '<strong>Order ' + escHtml(o.name) + '</strong> \u00b7 placed ' + fmtDate(o.placedAt) +
      '<br>Status: <strong>' + status + '</strong>';
    if (o.shipTo) head += ' \u00b7 shipping to ' + escHtml(o.shipTo);
    var blocks = [{ t: 'text', html: head }];
    if (o.items && o.items.length) {
      blocks.push({ t: 'steps', items: o.items.slice(0, 6).map(function (i) {
        return escHtml(i.title) + (i.qty > 1 ? ' \u00d7 ' + i.qty : '');
      }) });
    }
    var links = [], delivered = null, eta = null;
    (o.shipments || []).forEach(function (s) {
      if (s.deliveredAt) delivered = s.deliveredAt;
      if (s.eta) eta = s.eta;
      (s.tracking || []).forEach(function (t) {
        if (t.url) {
          links.push({
            label: '\ud83d\udce6 Track ' + (t.company ? escHtml(t.company) + ' ' : '') + 'shipment' +
              (t.number ? ' (' + escHtml(t.number) + ')' : ''),
            href: t.url
          });
        }
      });
    });
    if (delivered) blocks.push({ t: 'text', html: '\u2705 Delivered ' + fmtDate(delivered) + '.' });
    else if (eta) blocks.push({ t: 'text', html: 'Estimated delivery: <strong>' + fmtDate(eta) + '</strong>.' });
    if (links.length) blocks.push({ t: 'links', items: links });
    else if (!o.cancelled && status !== 'Shipped') {
      blocks.push({ t: 'text', html: 'Tracking will appear here as soon as it ships \u2014 you\u2019ll also get it by email.' });
    }
    if (o.cancelled) blocks.push(contactBlock('orders'));
    blocks.push({ t: 'chips', items: [{ label: '\ud83d\udd0d Check another order', send: 'Where is my order?' }, CHIP_HUMAN] });
    return { feedback: true, blocks: blocks };
  }

  function orderLookup() {
    var num = state.ctx.orderNum, email = state.ctx.orderEmail;
    state.ctx.awaiting = null;
    persist();
    showTyping();
    var startedAt = Date.now();
    function afterThink(fn) { setTimeout(fn, Math.max(0, THINK_MS - (Date.now() - startedAt))); }
    function done() { state.ctx.orderNum = null; state.ctx.orderEmail = null; persist(); }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

    fetch(ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({ order: num, email: email })
    }).then(function (r) {
      clearTimeout(timer);
      if (r.status === 404) return { notFound: true };
      if (r.status === 503) { orderDown = true; return { down: true }; }
      if (!r.ok) throw new Error('bad status');
      return r.json().then(function (d) {
        if (!d || !d.order) throw new Error('empty');
        return d;
      });
    }).then(function (d) {
      afterThink(function () {
        hideTyping();
        if (d.down) {
          logEvent('order_lookup', { outcome: 'unconfigured' });
          done();
          pushBot(orderFallback());
        } else if (d.notFound) {
          logEvent('order_lookup', { outcome: 'not_found' });
          // let them retry with corrected details
          state.ctx.orderNum = null; state.ctx.orderEmail = null;
          state.ctx.awaiting = 'order_lookup';
          persist();
          pushBot({
            feedback: true,
            blocks: [
              { t: 'text', html: 'Hmm \u2014 I couldn\u2019t find an order matching that number and email. Double-check both against your confirmation email and send them again (or type <strong>cancel</strong>), and I\u2019ll take another look.' },
              contactBlock('orders')
            ]
          });
        } else {
          logEvent('order_lookup', { outcome: 'found' });
          done();
          pushBot(orderCard(d.order));
        }
      });
    }).catch(function () {
      clearTimeout(timer);
      afterThink(function () {
        hideTyping();
        logEvent('order_lookup', { outcome: 'error' });
        done();
        pushBot({
          feedback: true,
          blocks: [
            { t: 'text', html: 'I hit a snag reaching the order system just now \u2014 sorry about that. The orders team can check right away:' },
            contactBlock('orders')
          ]
        });
      });
    });
  }
  /* ── Public API ───────────────────────────────────────────────────────────
     Mainly for inline hosts (see MOUNT): the host owns the container and the
     show/hide animation, and drives the conversation through here. Safe to
     call before the UI is built -- calls queue until it is. */
  var pending = null;
  var built = false;

  function api(fn) {
    if (built) { fn(); return; }
    pending = pending || [];
    pending.push(fn);
  }

  window.AquafireAssistant = {
    open: function () { api(function () { toggle(true); }); },
    close: function () { api(function () { toggle(false); }); },
    // Open and immediately send `text` as if the visitor had typed it.
    ask: function (text) {
      api(function () {
        toggle(true);
        if (text && String(text).trim()) handleUserText(String(text).trim());
      });
    },
    reset: function () { api(function () { resetConversation(); }); },
    isOpen: function () { return !!state.open; },
    // The element the panel lives in, so a host can style or measure it.
    root: function () { return root || null; }
  };

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  function boot() {
    buildUI();
    built = true;
    armLauncherCollapse();
    if (pending) {
      for (var i = 0; i < pending.length; i++) pending[i]();
      pending = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
