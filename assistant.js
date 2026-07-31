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
     apiEndpoint  — POST endpoint for LLM replies (optional)
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
            { t: 'text', html: '<strong>Pro (AWPR)</strong> is the flagship \u2014 30+ preset flame colors, AFIRE phone app, internal UV-C sanitizing, and it can be plumbed straight to a water line. <strong>Original (AWA)</strong> gives you the classic amber flame with a remote; a Direct Plumb Kit is optional. <strong>Lite (AWL)</strong> is the value pick \u2014 amber flame, manual fill, 8\u201310\u00a0hr per tank. <strong>Gatsby</strong> is freestanding, so there\u2019s no enclosure to build at all.' },
            { t: 'chips', items: [{ label: 'Sizes & dimensions', send: 'What sizes are available?' }, { label: 'Pricing', send: 'How much do they cost?' }, { label: 'Installation basics', send: 'How is it installed?' }] }
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
            { t: 'text', html: 'Cutout dimensions are critical \u2014 the insert hangs from its flanges, so the opening must be exact (e.g. a 40\u2033 unit needs a 40\u00bc\u2033 \u00d7 12\u00bc\u2033 opening with 12\u201314\u2033 of depth below, depending on model). Our Enclosure Guide calculates the exact cutout for your model and size:' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Enclosure dimension calculator', href: pURL('enclosure-guide.html') }] },
            { t: 'chips', items: [{ label: 'Can I make a longer flame?', send: 'Can I combine multiple units?' }, { label: 'Installation basics', send: 'How is it installed?' }] }
          ]
        };
      }
    },
    {
      id: 'ganging',
      kw: [['gang', 5], ['combine', 4], ['multiple units', 6], ['longer', 3], ['ribbon', 5], ['continuous', 4], ['side by side', 5], ['80', 2], ['100 inch', 4], ['120', 2]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Yes! Inserts gang together seamlessly to create up to <strong>20 feet (240\u2033) of continuous flame</strong>, all controlled from a single remote. Common combos: two 40\u2033 units for 80\u2033, a 40\u2033 + 60\u2033 for 100\u2033, or two 60\u2033 units for 120\u2033.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Plan the enclosure for ganged units', href: pURL('enclosure-guide.html') }] }
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
      kw: [['enclosure', 6], ['light trap', 7], ['ceiling', 4], ['light bleed', 6], ['hearth', 4], ['surround', 4], ['cabinet', 3], ['design tips', 5], ['viewing height', 6], ['airflow', 4], ['air flow', 4], ['vent', 3], ['toe kick', 6]],
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
            { t: 'text', html: 'The Enclosure Guide calculates all of this for your exact model and size \u2014 and you can email drawings to <a href="mailto:' + SALES_EMAIL + '">' + SALES_EMAIL + '</a> for a free design review.' },
            { t: 'links', items: [{ label: '\ud83d\udcd0 Open the Enclosure Guide', href: pURL('enclosure-guide.html') }] }
          ]
        };
      }
    },
    {
      id: 'plumbing',
      kw: [['plumb', 6], ['plumbed', 6], ['plumbing', 6], ['water line', 7], ['waterline', 7], ['direct plumb', 8], ['hook up to water', 7], ['fill', 2], ['refill', 3], ['manual fill', 5], ['tap water', 4], ['distilled', 4]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'Two ways to keep the tank full:' },
            { t: 'steps', items: [
              '<strong>Direct plumb</strong> \u2014 connect a \u00bc\u2033 water line (like a fridge ice-maker) and the unit refills itself automatically. The Pro is direct-plumb ready; the Original uses an optional Direct Plumb Kit; the Lite 40\u2033/60\u2033 are manual-fill only.',
              '<strong>Manual fill</strong> \u2014 every unit has an integrated pump: connect the fill tube, hold <strong>B1</strong> for 5 seconds, and it fills itself and stops automatically.'
            ]},
            { t: 'text', html: 'Regular tap water is what you want \u2014 ideally moderately hard (around 7 grains/gallon). Avoid reverse-osmosis or distilled water: with no minerals, the flame effect is greatly diminished. The included Vapor Pure\u2122 softener handles hard-water areas.' },
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
      kw: [['order status', 8], ['my order', 6], ['where is my order', 9], ['wheres my order', 9], ['order number', 5], ['track my', 6], ['hasn\u2019t arrived', 6], ['hasnt arrived', 6], ['not arrived', 5]],
      answer: function () {
        return {
          feedback: true,
          blocks: [
            { t: 'text', html: 'I can\u2019t look up individual orders from here yet, but two quick options:' },
            { t: 'steps', items: [
              'Log in to <a href="' + STORE + '/account" target="_blank" rel="noopener">your aquafire.com account</a> \u2014 every order shows live status and tracking.',
              'Or email <a href="mailto:' + ORDERS_EMAIL + '">' + ORDERS_EMAIL + '</a> with your order number and the team will check right away.'
            ]},
            contactBlock('orders')
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
            { t: 'text', html: 'Yes \u2014 since Aquafire produces <strong>no heat</strong>, mounting a TV or artwork directly above it is completely fine. One design tip: add a recessed <strong>light trap</strong> above the flame so LED light doesn\u2019t wash onto the screen or ceiling. The Enclosure Guide shows exactly how.' },
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
            { t: 'text', html: 'Water quality is the #1 factor in Aquafire longevity. The sweet spot is <strong>3.5\u20138.5 grains per gallon (ideal \u22487)</strong> \u2014 too hard causes scaling and shortens mist-maker life; too soft (or RO/distilled water) weakens the flame. The included <strong>Vapor Pure\u2122 softener</strong> conditions your water automatically, and keeping it installed is required for warranty coverage.' },
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
      kw: [['flame low', 8], ['low flame', 8], ['weak flame', 8], ['flame short', 7], ['no flame', 8], ['flame uneven', 8], ['uneven', 5], ['flame height', 7], ['barely visible', 6], ['flame is small', 7], ['one section', 5]],
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
      kw: [['human', 8], ['agent', 6], ['real person', 9], ['speak to someone', 9], ['talk to someone', 9], ['customer service', 7], ['support team', 7], ['contact', 5], ['call', 4], ['email', 4], ['phone number', 7], ['representative', 7]],
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
      { label: '\ud83d\udcb2 Pricing', send: 'How much do they cost?' },
      { label: '\ud83d\udee0\ufe0f Fix an issue', send: 'Help me troubleshoot an issue' },
      { label: '\ud83d\udcd0 Plan an install', send: 'How is it installed?' },
      { label: '\ud83d\udee1\ufe0f Warranty', send: 'Tell me about the warranty' },
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
    if (saved) { var p = JSON.parse(saved); state.msgs = p.msgs || []; state.ctx = p.ctx || state.ctx; state.nudged = !!p.nudged; state.open = !!p.open; state.cid = p.cid; }
  } catch (e) { /* private mode etc. */ }

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        msgs: state.msgs.slice(-40), ctx: state.ctx, nudged: state.nudged, open: state.open, cid: state.cid
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
  var FLAME_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c.5 3.5-1.5 5-3 7-1.6 2.1-2.5 4-2.5 6A7.5 7.5 0 0 0 14 22.4 7.5 7.5 0 0 0 17.5 15c0-1.8-.7-3.4-1.6-4.8C14.6 8.2 13 6.5 12 2z" fill="currentColor"/><path d="M12.2 22.5c-2 0-3.7-1.6-3.7-3.7 0-1.5.8-2.6 1.7-3.7.7-.8 1.4-1.7 1.7-2.9.9 1.4 2 2.6 2.6 3.7.5.9.9 1.8.9 2.9 0 2.1-1.7 3.7-3.2 3.7z" fill="#ffd9a0"/></svg>';
  var SEND_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.4 20.4 21.8 12 3.4 3.6l2.5 7L14 12l-8.1 1.4-2.5 7z" fill="currentColor"/></svg>';
  var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var CSS = [
    '.afa-root{--afa-bg:#15171c;--afa-surface:#1e2128;--afa-surface2:#262a33;--afa-border:#2f333d;--afa-text:#e6e7eb;--afa-muted:#8c91a0;--afa-red:#c0392b;--afa-red2:#d45a20;--afa-amber:#e8a838;--afa-radius:16px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;}',
    '.afa-root,.afa-root *{box-sizing:border-box;margin:0;padding:0;}',
    '.afa-root button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}',
    '.afa-root a{color:#e8a838;text-decoration:none;}.afa-root a:hover{text-decoration:underline;}',

    /* Launcher */
    '.afa-launcher{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#c0392b 0%,#d45a20 100%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(192,57,43,.45),0 2px 8px rgba(0,0,0,.35);transition:transform .2s,box-shadow .2s;}',
    '.afa-launcher svg{width:30px;height:30px;transition:transform .25s;}',
    '.afa-launcher:hover{transform:scale(1.07);box-shadow:0 8px 30px rgba(192,57,43,.6),0 3px 10px rgba(0,0,0,.4);}',
    '.afa-launcher .afa-ico-close{display:none;}',
    '.afa-launcher.afa-open .afa-ico-flame{display:none;}.afa-launcher.afa-open .afa-ico-close{display:block;}',
    '.afa-badge{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#e8a838;border:2px solid #15171c;display:none;}',
    '.afa-launcher.afa-unread .afa-badge{display:block;}',

    /* Nudge teaser */
    '.afa-nudge{position:fixed;right:20px;bottom:92px;z-index:2147483000;max-width:270px;background:#1e2128;color:#e6e7eb;border:1px solid #2f333d;border-radius:14px;padding:12px 34px 12px 14px;box-shadow:0 10px 32px rgba(0,0,0,.45);font-size:13.5px;animation:afaPop .35s ease;cursor:pointer;}',
    '.afa-nudge-x{position:absolute;top:6px;right:8px;color:#8c91a0;font-size:15px;line-height:1;padding:4px;}',
    '@keyframes afaPop{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}',

    /* Panel */
    '.afa-panel{position:fixed;right:20px;bottom:92px;z-index:2147483001;width:382px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 120px));display:none;flex-direction:column;background:var(--afa-bg);color:var(--afa-text);border:1px solid var(--afa-border);border-radius:var(--afa-radius);box-shadow:0 24px 64px rgba(0,0,0,.55);overflow:hidden;}',
    '.afa-panel.afa-open{display:flex;animation:afaPop .28s ease;}',

    /* Header */
    '.afa-head{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#2a1a17 0%,#1a1c22 70%);border-bottom:1px solid var(--afa-border);flex-shrink:0;}',
    '.afa-avatar{position:relative;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#c0392b,#d45a20);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}',
    '.afa-avatar svg{width:22px;height:22px;}',
    '.afa-dot{position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#3ecf6f;border:2px solid #1a1c22;}',
    '.afa-head-txt{flex:1;min-width:0;}',
    '.afa-head-txt h3{font-size:15px;font-weight:700;font-family:Poppins,Inter,sans-serif;letter-spacing:.2px;}',
    '.afa-head-txt p{font-size:11.5px;color:var(--afa-muted);}',
    '.afa-head-btn{color:var(--afa-muted);padding:6px;border-radius:8px;font-size:16px;line-height:1;transition:color .15s,background .15s;}',
    '.afa-head-btn:hover{color:var(--afa-text);background:rgba(255,255,255,.06);}',

    /* Messages */
    '.afa-msgs{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:#2f333d transparent;}',
    '.afa-row{display:flex;gap:8px;max-width:100%;}',
    '.afa-row.afa-user{justify-content:flex-end;}',
    '.afa-mini-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#c0392b,#d45a20);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;margin-top:2px;}',
    '.afa-mini-avatar svg{width:15px;height:15px;}',
    '.afa-bubble{max-width:82%;padding:10px 13px;border-radius:14px;font-size:13.8px;overflow-wrap:break-word;}',
    '.afa-row.afa-bot .afa-bubble{background:var(--afa-surface);border:1px solid var(--afa-border);border-top-left-radius:4px;}',
    '.afa-row.afa-user .afa-bubble{background:linear-gradient(135deg,#c0392b,#b13322);color:#fff;border-top-right-radius:4px;}',
    '.afa-col{display:flex;flex-direction:column;gap:8px;min-width:0;max-width:calc(100% - 34px);}',
    '.afa-col .afa-bubble{max-width:100%;}',

    /* Steps */
    '.afa-steps{margin:2px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:13.4px;}',

    /* Chips */
    '.afa-chips{display:flex;flex-wrap:wrap;gap:6px;}',
    '.afa-chip{padding:7px 12px;border:1px solid rgba(192,57,43,.55);border-radius:999px;color:#f0a08f;font-size:12.6px;font-weight:500;transition:background .15s,color .15s;text-decoration:none!important;display:inline-block;}',
    '.afa-chip:hover{background:rgba(192,57,43,.18);color:#fff;}',
    '.afa-chips.afa-spent .afa-chip{opacity:.45;pointer-events:none;}',

    /* Cards */
    '.afa-cards{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:#2f333d transparent;}',
    '.afa-card{scroll-snap-align:start;flex:0 0 172px;background:var(--afa-surface);border:1px solid var(--afa-border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;}',
    '.afa-card img{width:100%;height:96px;object-fit:cover;background:#0e0f12;}',
    '.afa-card-b{padding:9px 10px 10px;display:flex;flex-direction:column;gap:3px;flex:1;}',
    '.afa-card-b h4{font-size:13px;font-weight:600;}',
    '.afa-card-b .afa-price{font-size:12.5px;color:var(--afa-amber);font-weight:600;}',
    '.afa-card-b p{font-size:11.3px;color:var(--afa-muted);line-height:1.4;flex:1;}',
    '.afa-card-b a{margin-top:6px;text-align:center;font-size:12px;font-weight:600;padding:6px 0;border-radius:8px;background:rgba(192,57,43,.16);color:#f0a08f;text-decoration:none!important;transition:background .15s,color .15s;}',
    '.afa-card-b a:hover{background:var(--afa-red);color:#fff;}',

    /* Link & video lists */
    '.afa-links{display:flex;flex-direction:column;gap:6px;}',
    '.afa-link{display:block;padding:9px 12px;background:var(--afa-surface2);border:1px solid var(--afa-border);border-radius:10px;font-size:12.8px;color:var(--afa-text)!important;text-decoration:none!important;transition:border-color .15s,background .15s;}',
    '.afa-link:hover{border-color:rgba(192,57,43,.5);background:#2b2f3a;}',
    '.afa-videos{display:flex;flex-wrap:wrap;gap:6px;}',
    '.afa-video{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;background:var(--afa-surface2);border:1px solid var(--afa-border);border-radius:999px;font-size:12.2px;color:var(--afa-text)!important;text-decoration:none!important;transition:border-color .15s;}',
    '.afa-video:hover{border-color:var(--afa-amber);}',
    '.afa-video::before{content:"\u25b6";color:var(--afa-red2);font-size:10px;}',

    /* Contact card */
    '.afa-contact{display:flex;flex-direction:column;gap:6px;background:var(--afa-surface);border:1px solid rgba(232,168,56,.35);border-radius:12px;padding:12px;}',
    '.afa-contact h5{font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:var(--afa-amber);font-family:Poppins,Inter,sans-serif;}',
    '.afa-contact a{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--afa-surface2);border-radius:8px;font-size:13px;color:var(--afa-text)!important;text-decoration:none!important;transition:background .15s;}',
    '.afa-contact a:hover{background:#2b2f3a;}',

    /* Feedback */
    '.afa-fb{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--afa-muted);}',
    '.afa-fb button{font-size:13px;padding:3px 7px;border-radius:7px;border:1px solid var(--afa-border);transition:background .15s;}',
    '.afa-fb button:hover{background:var(--afa-surface2);}',
    '.afa-fb{flex-wrap:wrap;}',
    '.afa-fb-form{display:flex;gap:6px;flex:1;min-width:180px;}',
    '.afa-fb-form input{flex:1;background:var(--afa-surface2);border:1px solid var(--afa-border);border-radius:8px;padding:6px 10px;color:var(--afa-text);font-size:12px;font-family:inherit;outline:none;}',
    '.afa-fb-form input:focus{border-color:rgba(192,57,43,.6);}',
    '.afa-fb-form button{flex-shrink:0;}',

    /* Typing */
    '.afa-typing{display:inline-flex;gap:4px;padding:12px 14px;}',
    '.afa-typing span{width:7px;height:7px;border-radius:50%;background:#8c91a0;animation:afaBlink 1.2s infinite;}',
    '.afa-typing span:nth-child(2){animation-delay:.18s;}.afa-typing span:nth-child(3){animation-delay:.36s;}',
    '@keyframes afaBlink{0%,80%,100%{opacity:.25;transform:translateY(0);}40%{opacity:1;transform:translateY(-3px);}}',

    /* Composer */
    '.afa-foot{flex-shrink:0;border-top:1px solid var(--afa-border);background:var(--afa-bg);}',
    '.afa-inputrow{display:flex;align-items:center;gap:8px;padding:10px 12px 6px;}',
    '.afa-input{flex:1;background:var(--afa-surface);border:1px solid var(--afa-border);border-radius:12px;padding:10px 14px;color:var(--afa-text);font-size:13.8px;font-family:inherit;outline:none;transition:border-color .15s;}',
    '.afa-input:focus{border-color:rgba(192,57,43,.6);}',
    '.afa-input::placeholder{color:#6a6f7d;}',
    '.afa-send{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#c0392b,#d45a20);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s,transform .15s;}',
    '.afa-send svg{width:18px;height:18px;}',
    '.afa-send:disabled{opacity:.4;cursor:default;}',
    '.afa-send:not(:disabled):hover{transform:scale(1.06);}',

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
    '.afa-beam-input{position:relative;flex:1;min-width:0;border-radius:12px;}',
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

    '.afa-legal{text-align:center;font-size:10.5px;color:#6a6f7d;padding:0 12px 8px;}',
    '.afa-legal a{color:#8c91a0;}',

    /* Mobile */
    '@media (max-width:520px){',
    '.afa-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0;border:none;}',
    '.afa-nudge{right:16px;bottom:88px;}',
    '}'
  ].join('\n');

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
    // Fonts (skip if the page already loads Inter/Poppins)
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      var pre = el('link'); pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = '';
      var f = el('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap';
      document.head.appendChild(pre); document.head.appendChild(f);
    }

    var style = el('style'); style.textContent = CSS;
    document.head.appendChild(style);

    root = el('div', 'afa-root');
    root.setAttribute('data-aquafire-assistant', '');

    launcher = el('button', 'afa-launcher');
    launcher.setAttribute('aria-label', 'Chat with Aquafire assistant');
    launcher.innerHTML = '<span class="afa-ico-flame">' + FLAME_SVG + '</span><span class="afa-ico-close">' + CLOSE_SVG + '</span><span class="afa-badge"></span>';
    launcher.classList.add('afa-unread');
    launcher.addEventListener('click', function () { toggle(); });

    panel = el('div', 'afa-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Aquafire assistant chat');

    var head = el('div', 'afa-head');
    var av = el('div', 'afa-avatar', FLAME_SVG + '<span class="afa-dot"></span>');
    var ht = el('div', 'afa-head-txt', '<h3>Ember</h3><p>Aquafire AI assistant \u00b7 online</p>');
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

    root.appendChild(panel); root.appendChild(launcher);
    document.body.appendChild(root);

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

    // Nudge teaser
    if (!state.nudged && !state.open) {
      setTimeout(function () {
        if (state.open || state.nudged) return;
        nudge = el('div', 'afa-nudge', '\ud83d\udc4b Questions about Aquafire? I\u2019m here to help.<button class="afa-nudge-x" aria-label="Dismiss">\u2715</button>');
        nudge.addEventListener('click', function (e) {
          if (e.target.classList.contains('afa-nudge-x')) { killNudge(); return; }
          toggle(true);
        });
        root.appendChild(nudge);
        state.nudged = true; persist();
      }, 4000);
    }
  }

  function killNudge() { if (nudge) { nudge.remove(); nudge = null; } }

  function toggle(force, silent) {
    state.open = force != null ? force : !state.open;
    panel.classList.toggle('afa-open', state.open);
    launcher.classList.toggle('afa-open', state.open);
    if (state.open) {
      launcher.classList.remove('afa-unread');
      killNudge();
      if (!state.msgs.length) greet();
      if (!silent) inputEl.focus();
      scrollToEnd(true);
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

  function greet() {
    logEvent('convo_start', {});
    pushBot({
      blocks: [
        { t: 'text', html: 'Hi, I\u2019m <strong>Ember</strong> \ud83d\udd25 \u2014 the Aquafire assistant. I can compare models, plan your install, check water care, or walk you through a fix. How can I help?' },
        mainChips()
      ]
    });
  }

  /* ── Rendering ────────────────────────────────────────────────────────── */
  function scrollToEnd(instant) {
    msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
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
              handleUserText(c.send);
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
        if (!spent) logEvent('handoff', { mode: b.mode || 'support' });
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
      row.appendChild(el('div', 'afa-mini-avatar', FLAME_SVG));
      var col = el('div', 'afa-col');
      renderBlocks(col, m.blocks, restoring);
      if (m.feedback && !restoring) col.appendChild(feedbackEl());
      row.appendChild(col);
    }
    msgsEl.appendChild(row);
    if (!restoring) scrollToEnd();
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
        fb.innerHTML = '<span>Thanks \u2014 this helps us improve Ember.</span>';
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

  function pushBot(res) {
    var m = { who: 'bot', blocks: res.blocks, feedback: !!res.feedback };
    state.msgs.push(m); persist();
    renderMessage(m);
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
    typingRow.appendChild(el('div', 'afa-mini-avatar', FLAME_SVG));
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

  function handleUserText(text) {
    pushUser(text);
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

    var intent = matchIntent(text);
    var llmAvailable = API_ENDPOINT && !llmDown;
    lastIntentId = intent ? intent.id : (llmAvailable ? 'llm' : 'fallback');
    logEvent('user_message', { text: text.slice(0, 300), intent: lastIntentId });

    if (intent) {
      reply(function () { return intent.answer(norm); });
    } else if (llmAvailable) {
      remoteReply(text);
    } else {
      reply(FALLBACK);
    }
  }

  function reply(produce) {
    showTyping();
    setTimeout(function () {
      hideTyping();
      pushBot(produce());
    }, 450 + Math.random() * 400);
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
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({
        message: text,
        history: historyForApi().slice(0, -1),
        context: { model: state.ctx.model, page: location.href }
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      return r.json();
    }).then(function (d) {
      clearTimeout(timer);
      hideTyping();
      if (!d || !d.reply) throw new Error('empty');
      logEvent('llm_reply', { text: String(d.reply).slice(0, 500) });
      pushBot({
        feedback: true,
        blocks: [{ t: 'text', html: mdLite(d.reply) }, { t: 'chips', items: [CHIP_HUMAN] }]
      });
    }).catch(function () {
      clearTimeout(timer);
      hideTyping();
      llmDown = true; // don't retry this page load — go straight to local KB
      logEvent('llm_error', {});
      pushBot(FALLBACK());
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

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }
})();
