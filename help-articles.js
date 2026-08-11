/* ──────────────────────────────────────────────────────────────────────────
   Aquafire Help Center — article data.

   The full 29-article catalogue: converted from the archived help-center
   extracts in docs/source-material/ and from verified live help-center
   content (aquafire.gorgias.help), per docs/help-center.md. Team-authored
   articles in the helpArticles Firestore collection (help-admin.html) merge
   over this file at load — a matching slug overrides the built-in article.

   Schema:
     HELP_CATEGORIES: { id, title, blurb, icon }
       icon — key into the ICONS map in help.js
              ('spark' | 'hammer' | 'flame' | 'wrench' | 'drop' | 'shield')

     HELP_ARTICLES:   { slug, title, category, models, updated, teaser,
                        keywords, related, html }
       slug     — kebab-case, stable, used in ?article=<slug>
       category — a HELP_CATEGORIES id
       models   — ['original','pro','lite']; all three = applies to everything
       updated  — 'YYYY-MM'
       teaser   — one plain-text sentence for list cards
       keywords — lowercase search boosters beyond the title words
       related  — 2–4 slugs, must exist (unknown slugs are dropped silently)
       html     — body HTML. Allowed tags: h2 h3 p ul ol li table thead tbody
                  tr th td a strong em code, plus <div class="ha-note"> and
                  <div class="ha-caution">. Tables are wrapped in a scroll
                  container by the engine — just write <table>.

   Copy rules (see docs/help-center.md): never name the chat anything but
   “the chat”; cutout clearance is nominal + ⅜″ IN TOTAL across the outside
   edges and should link to enclosure-guide.html rather than restate numbers;
   no prices, no invented specs — facts trace to docs/source-material/ or the
   live help center.
   ────────────────────────────────────────────────────────────────────────── */

var HELP_CATEGORIES = [
  {
    id: 'learn',
    title: 'Learn Before You Buy',
    blurb: 'How the water vapor flame works, what the model codes mean, and where every guide and tool lives.',
    icon: 'spark'
  },
  {
    id: 'install',
    title: 'Installation & Enclosures',
    blurb: 'Framing and cutouts, glass, airflow, side-light reflections and outdoor installs — everything before the first fill.',
    icon: 'hammer'
  },
  {
    id: 'using',
    title: 'Using Your Aquafire',
    blurb: 'Day-to-day operation: shaping the flame, pairing remotes, and smart-home or app control.',
    icon: 'flame'
  },
  {
    id: 'fix',
    title: 'Troubleshooting',
    blurb: 'Symptom-by-symptom fixes for power, water, flame appearance, lights, remotes and beeps.',
    icon: 'wrench'
  },
  {
    id: 'care',
    title: 'Care & Maintenance',
    blurb: 'Cleaning schedules, mist-maker service, and keeping your water gentle on the insert.',
    icon: 'drop'
  },
  {
    id: 'warranty',
    title: 'Warranty & Support',
    blurb: 'What your coverage includes, how to register it, finding your serial number, and reaching a person.',
    icon: 'shield'
  }
];

var HELP_ARTICLES = [
  {
    slug: 'is-aquafire-humidifying',
    title: 'Is Aquafire Humidifying?',
    category: 'learn',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'No — the mist is too fine and too dry to raise room humidity the way a humidifier does.',
    keywords: ['humidifier', 'humidity', 'moisture', 'wet', 'mist', 'damp'],
    related: ['product-resources', 'room-air-flow-considerations', 'general-cleaning', 'mist-maker-cleaning-replacement'],
    html: '<p>' +
      'Aquafire is not a humidifier. It releases water vapor to create the flame effect, but not enough of it to noticeably raise the humidity in a room.</p>' +
      '<p>' +
      'The mist itself is different from what a traditional humidifier puts out. It is fine, almost dry to the touch — not the wet mist or steam you would get from a humidifying appliance. You can run your Aquafire in a normal room without expecting it to change how humid the air feels.</p>' +
      '<div class="ha-note">' +
      'If you are weighing Aquafire against a real fireplace or a humidifier for a specific room, our team can help — reach out from <a href="support.html">' +
      'Support</a>.</div>'
  },
  {
    slug: 'decoding-aquafire-skus',
    title: 'Decoding Aquafire SKUs',
    category: 'learn',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'A quick key to what the letters and numbers in an Aquafire model number mean.',
    keywords: ['sku', 'model number', 'part number', 'awa', 'awpr', 'awl', 'which model'],
    related: ['product-resources', 'is-aquafire-humidifying', 'installation-without-direct-plumb-kits'],
    html: '<p>' +
      'Every Aquafire insert has a model number (SKU) that tells you the series, size, and specific variant at a glance. Here is how to read one.</p>' +
      '<h2>Series prefix</h2><table><thead><tr><th>Prefix</th><th>Series</th></tr></thead><tbody><tr>' +
      '<td><code>AWPR</code></td><td>Aquafire Pro</td></tr><tr><td><code>AWA</code></td><td>' +
      'Aquafire (Original)</td></tr><tr><td><code>AWL</code></td><td>Aquafire Lite</td></tr></tbody>' +
      '</table><p>A digit right after the prefix (for example the <code>2</code> in <code>' +
      'AWPR2-20-50</code> or the <code>3</code> in <code>AWA3-40-100</code>' +
      ') marks a generation of that series. A Lite SKU can also carry a <code>-GAT</code>' +
      ' suffix for the Gatsby freestanding variant.</p><h2>Size</h2><p>' +
      'The number after the series/generation is the nominal insert width in inches — <code>20</code>' +
      ', <code>40</code>, or <code>60</code> (Lite also offers a <code>16</code>' +
      '). This is the size you will see throughout the guides and in the <a href="enclosure-guide.html">' +
      'Enclosure Guide</a>.</p><p>The final number in the SKU (for example the <code>50</code>/<code>' +
      '100</code>/<code>150</code>' +
      ' you will see following the size) is a model-specific code tied to that particular size and series — you will see it consistently paired with the same width across a series\' SKUs.</p>' +
      '<div class="ha-note">' +
      'Not sure which SKU matches the unit in front of you? The serial plate carries the full model number — see <a href="help.html?article=identifying-serial-number">' +
      'Identifying Your Serial Number</a>' +
      '. For size and cutout math for any model, use the <a href="enclosure-guide.html">' +
      'Enclosure Guide</a>.</div>'
  },
  {
    slug: 'product-resources',
    title: 'Product Resources',
    category: 'learn',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Every interactive tool and guide on the Aquafire portal, in one place.',
    keywords: ['resources', 'tools', 'guides', 'links', 'where do i find'],
    related: ['decoding-aquafire-skus', 'glass-enclosure-options', 'preventative-maintenance'],
    html: '<p>' +
      'The Interactive Aquafire Guide has a tool or guide for every stage of owning an Aquafire — from picking a model to keeping it running for years. Here is the full set.</p>' +
      '<h2>Getting started</h2><ul><li><a href="quick-start.html">Quick Start</a>' +
      ' — pick your model and jump straight to its full guide.</li><li><a href="aquafire-pro.html">' +
      'Aquafire Pro Guide</a> — specs, wiring, and troubleshooting for the Pro.</li><li>' +
      '<a href="aquafire-original.html">Aquafire Original Guide</a>' +
      ' — the same, for the classic model.</li></ul><h2>Planning your install</h2><ul><li>' +
      '<a href="enclosure-guide.html">Enclosure Guide</a>' +
      ' — cutout dimensions, the light trap calculator, and the Installer Field Notes accordion.</li>' +
      '</ul><h2>Keeping it running</h2><ul><li><a href="water-care.html">Water Care</a>' +
      ' — look up your local water hardness by ZIP code and get a softener replacement timeline.</li>' +
      '<li><a href="maintenance.html">Maintenance</a>' +
      ' — step-by-step, checkbox-tracked mist maker and full system cleaning schedules.</li><li>' +
      '<a href="troubleshoot.html">Troubleshooter</a>' +
      ' — a guided, model-aware wizard for fixing an issue.</li></ul><h2>Buying and support</h2><ul>' +
      '<li><a href="dealer-locator.html">Find a Dealer</a> — authorized Aquafire dealers near you.</li>' +
      '<li><a href="rewards.html">Rewards</a>' +
      ' — earn points for exploring guides, using the tools, and completing setup.</li></ul>'
  },
  {
    slug: 'delivery-inspection',
    title: 'Delivery Inspection',
    category: 'install',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Check your Aquafire before you sign for it — a few minutes now protects any damage claim later.',
    keywords: ['delivery', 'shipping', 'damage', 'freight', 'unboxing', 'received damaged'],
    related: ['product-resources', 'aquafire-limited-warranty', 'identifying-serial-number'],
    html: '<p>' +
      'Take a few minutes with your Aquafire at the door before you accept the delivery — it makes all the difference if anything needs to be claimed later.</p>' +
      '<ol><li>Inspect the exterior of the box and crate before you sign the carrier\'s receipt.</li>' +
      '<li>' +
      'If you see any visible damage, note it with the driver before you sign — this is required to file a damage claim afterward.</li>' +
      '<li>' +
      'Photograph any damage to the packaging before you unpack the unit. Proof of the packaging condition is required for a claim.</li>' +
      '</ol><div class="ha-caution">' +
      'Signing for the delivery without noting visible damage can make a freight claim difficult later — inspect first, then sign.</div>' +
      '<p>' +
      'If you find damage after unpacking, or have questions about a claim, reach out through <a href="support.html">' +
      'Support</a>.</p>'
  },
  {
    slug: 'installation-without-direct-plumb-kits',
    title: 'Installation Without a Direct Plumb Kit',
    category: 'install',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'What manual-fill installs look like, and which models can add a direct water-line connection.',
    keywords: ['direct plumb kit', 'manual fill', 'water line', 'no plumbing', 'fill pump'],
    related: ['product-resources', 'mist-maker-cleaning-replacement', 'vapor-pure-water-softener'],
    html: '<p>' +
      'Not every Aquafire installation connects to a water line, and that is completely normal — every model can be filled manually. Direct water-line capability differs by model, so here is what to expect for each.</p>' +
      '<h2>Aquafire Pro</h2><p>' +
      'The Pro connects directly to a water line right out of the box — no add-on kit needed. It can also be filled manually using its integrated water pump, and it includes a dispensing pump so the unit can be emptied at the press of a button.</p>' +
      '<h2>Aquafire Original</h2><p>' +
      'The Original does not connect to a water line out of the box. The Direct Plumb Kit is an easy-install add-on, sold and shipped separately, that enables a direct connection. Without it — or before it is installed — the Original is filled manually using its integrated water pump, the same way as the Pro.</p>' +
      '<h2>Aquafire Lite / Gatsby</h2><p>' +
      'The Lite and Gatsby do not connect to a water line out of the box, and there is currently no upgrade path to add one. These units are filled manually using their integrated water pump.</p>' +
      '<div class="ha-note">' +
      'Whether or not your install is direct-plumbed, sealing the enclosure against downdrafts still matters — see <a href="help.html?article=room-air-flow-considerations">' +
      'Room Air Flow Considerations</a>.</div>'
  },
  {
    slug: 'glass-enclosure-options',
    title: 'Glass Enclosure Options',
    category: 'install',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'A fully sealed glass front causes condensation — here is how to design one that works.',
    keywords: ['glass', 'enclosure', 'condensation', 'sealed', 'vented glass'],
    related: ['room-air-flow-considerations', 'avoid-side-light-reflections', 'product-resources'],
    html: '<p>' +
      'Because Aquafire has no heat or flame, there is no restriction on the materials you can use to build the enclosure — including glass. There is one design rule worth planning around, though: never seal it completely.</p>' +
      '<ul><li>A <strong>removable half glass wall</strong> is one recommended approach.</li><li>' +
      'If you want a full glass front, build it as a <strong>top- or bottom-vented structure</strong>' +
      ' rather than fully sealed, so the vents can bring in fresh air and let the vapor dissipate.</li>' +
      '<li>A fully sealed glass enclosure will cause <strong>condensation</strong>' +
      ' to build up on the inside of the glass.</li><li>' +
      'Whatever design you use, make sure the glass is <strong>' +
      'removable for cleaning and service</strong>.</li></ul><div class="ha-note">' +
      'For the cutout dimensions and venting your enclosure needs behind the glass, use the <a href="enclosure-guide.html">' +
      'Enclosure Guide</a> — its Installer Field Notes cover venting and sealing in more depth.</div>'
  },
  {
    slug: 'room-air-flow-considerations',
    title: 'Room Air Flow Considerations',
    category: 'install',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Air currents are the most common cause of a flame that will not rise properly — here is how to keep them out.',
    keywords: ['downdraft', 'air flow', 'hvac', 'flame low', 'flame won\'t rise', 'sealing'],
    related: ['glass-enclosure-options', 'flame-low-or-uneven', 'installation-without-direct-plumb-kits'],
    html: '<p>' +
      'Aquafire\'s flame is water vapor rising and catching light — which means air currents around the enclosure can pull it down or keep it from rising at all. Getting the air flow right is one of the most important parts of a good install.</p>' +
      '<ul><li>' +
      'Air currents and suction near the enclosure can pull the flame down into the fireplace.</li><li>' +
      'Seal any open wall cavities in the enclosure and beneath the insert — an open cavity behind or below the unit can create airflow that drags the flame downward and drives excess vapor onto the components over time.</li>' +
      '<li>' +
      'Keep HVAC supply vents from blowing directly at the insert. Direct air currents stop the vapor from rising vertically and limit how tall the flame can get.</li>' +
      '<li>' +
      'Many newer homes run positive-pressure ("open plenum") HVAC, which pushes air into an unsealed enclosure. On a new build, seal proactively rather than waiting for a problem to show up.</li>' +
      '</ul><p>' +
      'The enclosure still needs its own air intake to breathe — allow at least 50 square inches of intake per 20" of unit length, through the top lid or, if the top is covered by decorative media, through a toe kick beneath the enclosure.</p>' +
      '<div class="ha-note">The <a href="enclosure-guide.html#field-notes">Installer Field Notes</a>' +
      ' on the Enclosure Guide cover downdraft sealing and venting step by step, including a fallback sealing method for enclosures that are already framed.</div>' +
      '<p>' +
      'If your flame already looks low or uneven, see <a href="help.html?article=flame-low-or-uneven">' +
      'Flame Issues — Low or Uneven "Flame"</a>.</p>'
  },
  {
    slug: 'avoid-side-light-reflections',
    title: 'How to Avoid Side-Light Reflections',
    category: 'install',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Keep the flame\'s color off the hearth walls and ceiling with the right clearance and finish.',
    keywords: ['light reflection', 'side light', 'rgb', 'orange light on wall', 'hearth glow'],
    related: ['glass-enclosure-options', 'room-air-flow-considerations', 'product-resources'],
    html: '<p>' +
      'The orange (or RGB, on Pro) light from Aquafire\'s flame can reflect off the sides of the hearth and onto the ceiling if the enclosure is built too tight around the insert. A few design choices keep the light where it belongs.</p>' +
      '<ul><li>Keep at least <strong>6" of clearance</strong>' +
      ' from the edge of the insert to the hearth wall on each side. For example, a 60" opening with a 40" insert leaves that clearance built in.</li>' +
      '<li>Paint the interior of the hearth in a <strong>dark, matte finish</strong>' +
      ' — a reflective surface will carry more light onto the ceiling and walls.</li><li>A <strong>' +
      'blind corner</strong>' +
      ' design hides the side light from a viewer looking at the fireplace head-on.</li></ul>' +
      '<div class="ha-note">The <a href="enclosure-guide.html">Enclosure Guide</a>' +
      ' sizes your cutout and light trap for you, and its Installer Field Notes go into side clearance and light trap planning in more depth.</div>'
  },
  {
    slug: 'outdoor-installation-guidelines',
    title: 'Outdoor Installation Guidelines',
    category: 'install',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Aquafire can go outdoors under cover, but it needs protection from wind, rain, and freezing weather.',
    keywords: ['outdoor', 'patio', 'porch', 'weather', 'freeze', 'wind', 'outside'],
    related: ['glass-enclosure-options', 'room-air-flow-considerations', 'general-cleaning'],
    html: '<p>' +
      'Aquafire is not rated for full outdoor exposure, but it can be installed outside if the location is protected. Keep these in mind when planning an outdoor spot:</p>' +
      '<ul><li><strong>Covered or roofed locations only.</strong>' +
      ' A covered porch keeps rain and debris out of the enclosure — an exposed installation risks water and debris getting into the unit.</li>' +
      '<li><strong>Use a wind screen.</strong>' +
      ' Wind and cross-breezes affect the flame the same way indoor air currents do, so shield the insert from open-air wind.</li>' +
      '<li><strong>Drain before freezing weather.</strong>' +
      ' Water left in the tank can freeze and damage the unit, so drain it ahead of cold snaps.</li>' +
      '</ul><p>' +
      'The Pro\'s flexible fill/drain hose can be used for outdoor cleanings, but a wet/dry vac is preferred when there is debris to remove, since it will not clog the drain lines the way a hose can.</p>' +
      '<div class="ha-note">' +
      'For general cleaning steps and schedule, see <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a> and the interactive checklists on <a href="maintenance.html">' +
      'Maintenance</a>.</div>'
  },
  {
    slug: 'adjusting-the-flame',
    title: 'Adjusting the Aquafire Flame',
    category: 'using',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Your Aquafire’s flame needs a bit of tuning for your room — here is how to dial in density, speed, humidity, airflow, and the front fan ring lift.',
    keywords: ['flame adjustment', 'density', 'speed', 'remote control', 'airflow', 'humidity', 'fan filter', 'fine-tune'],
    related: ['flame-appearance-troubleshooting', 'flame-smoky-foggy', 'room-air-flow-considerations', 'remotes-and-smart-home-control'],
    html: '<h2>Every room is different</h2><p>' +
      'Your Aquafire’s flame needs to be customized to your specific space. Every home has its own airflow and humidity levels, and both affect how the vapor flame looks. A few small tweaks are usually all it takes to get it looking right.</p>' +
      '<ol><li><strong>Adjust the flame density and speed on the remote control.</strong>' +
      ' We suggest setting both to their lowest settings first, then adjusting density and speed separately from there. Press the &ldquo;&minus;&rdquo; button until the beeping stops — that means you have reached the lowest setting. The Aquafire Pro remote has a few extra features, but the density and speed icons work the same way.</li>' +
      '<li><strong>Check and adjust the humidity levels in your room.</strong>' +
      ' You may need to adjust the room’s HVAC to bring humidity down, since high humidity can produce a foggy-looking flame. If your flame looks smoky or foggy, see <a href="help.html?article=flame-smoky-foggy">' +
      'Flame Issues &mdash; Smoky or Foggy Appearance</a>.</li><li><strong>' +
      'Note and adjust the airflow in your room.</strong>' +
      ' Is an HVAC vent pointed directly at the Aquafire? Does a door near the flame open and close often? Does the vapor seem to get pulled down every time the HVAC turns on (this is called down-drafting)? Any of these airflow situations can affect the vapor flame and should be corrected — excess vapor pushed back onto the insert can cause electrical shorts and internal damage over time.</li>' +
      '<li><strong>Check the ring lift covering the front fans.</strong>' +
      ' First make sure it is fully seated in its holder. From there, you can lift it up a small amount at a time to adjust the flame.</li>' +
      '</ol><div class="ha-caution"><strong>Go slow on the ring lift.</strong>' +
      ' Lifting it even a quarter inch can release an excess of vapor. Adjust it in small increments and watch how the flame responds before lifting it further.</div>'
  },
  {
    slug: 'remotes-and-smart-home-control',
    title: 'Remotes, Pairing & Smart-Home Control',
    category: 'using',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'How the remote pairs to your Aquafire, controlling multiple inserts together, and connecting a smart-home switch.',
    keywords: ['remote', 'pairing', 'smart home', 'dry contact', 'sync remote', 'multiple fireplaces one remote'],
    related: ['remote-control-issues', 'pro-phone-app-not-connecting', 'my-aquafire-is-beeping'],
    html: '<p>' +
      'Every Aquafire insert can be controlled by its included remote, and also carries a Dry Contact Port for integrating with a smart-home system or a remote switch.</p>' +
      '<h2>Pairing a remote</h2><ol><li>' +
      'Press and hold the power button on the fireplace until it flashes.</li><li>' +
      'Press any button on the remote — you\'ll hear a beep confirming the pairing.</li></ol><p>' +
      'If the remote turns the fireplace on/off but does not respond to flame or color adjustments, the battery may be low, or it may need to be re-synced with the same steps above.</p>' +
      '<p>Remotes take a <strong>CR-2032 lithium battery</strong>.</p><h2>' +
      'Controlling multiple inserts on one remote</h2><p>' +
      'Multiple inserts can be paired to a single remote — following the same pairing steps on each unit syncs them together. From one remote, on/off and flame height/speed are controlled together across all paired inserts; color is controlled together only on Aquafire Pro.</p>' +
      '<h2>Smart-home and remote-switch integration</h2><p>' +
      'Every Aquafire insert includes a Dry Contact Port, which is the connection point for wiring in a smart-home controller or a remote switch alongside the included remote.</p>' +
      '<div class="ha-note">' +
      'Remote not responding at all after trying the steps above? See <a href="help.html?article=remote-control-issues">' +
      'Remote Control Issues</a>.</div>'
  },
  {
    slug: 'pro-phone-app-not-connecting',
    title: 'Aquafire Pro — Phone App Not Connecting',
    category: 'using',
    models: ['pro'],
    updated: '2026-08',
    teaser: 'The AFIREWATER Prestige App only pairs with 2.4 GHz Wi-Fi networks — here is why, and the latest update on a broader connectivity fix.',
    keywords: ['wifi', 'app', 'won\'t connect', '2.4ghz', 'afirewater', 'prestige app', 'pairing', 'pro'],
    related: ['remotes-and-smart-home-control', 'product-resources', 'decoding-aquafire-skus'],
    html: '<h2>Before you connect</h2><p>' +
      'Congratulations on installing your new Aquafire Pro! If you plan to operate it through the AFIREWATER Prestige App, there are a couple of details to sort out before you pair it.</p>' +
      '<h3>2.4 GHz networks only</h3><p>' +
      'The Aquafire Pro will only connect to a 2.4 GHz router network. Many home routers can create a 2.4 GHz network alongside their faster 4G/5G networks. Aquafire water vapor fireplace inserts are sold worldwide, and not every country has access to the faster networks common in the US, so the international manufacturer of the Wi-Fi module still uses a 2.4 GHz-only chip. Connect your phone to your router’s 2.4 GHz network before you try to pair.</p>' +
      '<h3>Follow the pairing steps in order</h3><p>' +
      'Once you are on the correct network, follow the app’s download and connection instructions precisely and in sequence. Customers who try to connect out of order run into far more issues than those who follow the step-by-step guidelines in the Owner’s Manual (pages 9–10).</p>' +
      '<div class="ha-note"><strong>Update, May 29, 2026:</strong>' +
      ' Wi-Fi chip changes, router security protocols, and phone operating-system updates have all been breaking connectivity for some customers even on a correct 2.4 GHz network. Our team is actively working on a broader fix. If you are still unable to connect after confirming you are on a 2.4 GHz network and following the manual step by step, check back here or watch your email for updates.</div>'
  },
  {
    slug: 'power-issues',
    title: 'Power Issues',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Is your Aquafire not turning on? Work through this problem-and-solution chart to find a fix.',
    keywords: ['power', 'won\'t turn on', 'power supply', 'breaker', 'fuse', 'buzzing sound', 'dead'],
    related: ['my-aquafire-is-beeping', 'lights-and-beeps-reference', 'water-issues'],
    html: '<h2>Not turning on?</h2><p>Review the chart below to find a solution.</p><div class="ha-note">' +
      'Most common power issues can be prevented with a whole-insert cleaning. We recommend cleaning your insert 2&ndash;3 times a year depending on frequency of use and water quality. Start with <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a> or the <a href="maintenance.html">maintenance checklists</a>' +
      ' to see if that solves your problem first.</div><table><thead><tr><th>Problem</th><th>' +
      'Possible cause</th><th>Solution</th></tr></thead><tbody><tr><td>' +
      'Unit fails to turn on when using the power button on the fireplace</td><td>' +
      'Power supply not properly plugged in</td><td>' +
      'Check the power supply connections and look for a green LED on the power supply indicating it is powered.</td>' +
      '</tr><tr><td>&nbsp;</td><td>Wall outlet may not be powered</td><td>' +
      'Check the breaker main panel in the building to see if a breaker has been tripped or turned off.</td>' +
      '</tr><tr><td>Power supply indicator light is green, but unit still will not turn on</td><td>' +
      'Main fuse inside the fireplace may be blown</td><td>Contact <a href="support.html">support</a>' +
      ' for assistance.</td></tr><tr><td>Power supply indicator light is red</td><td>' +
      'Power supply has somehow been damaged</td><td>Contact <a href="support.html">support</a>' +
      ' for assistance.</td></tr><tr><td>' +
      'Unit turns on, but power button flashes and immediately shuts off</td><td>' +
      'Possible internal component failure due to rough handling during shipping</td><td>' +
      'Contact <a href="support.html">support</a> for assistance.</td></tr><tr><td>' +
      'Unit appears to have power, but a buzzing sound is heard</td><td>' +
      'Power supply may not be fully plugged in on the back of the unit</td><td>' +
      'Check that the 90&deg; fitting is securely plugged in on the back of the unit. If it is and the buzzing continues, contact <a href="support.html">' +
      'support</a>.</td></tr><tr><td>&nbsp;</td><td>' +
      'Power supply is fully plugged in on the back of the unit, but buzzing persists</td><td>' +
      'The main power outlet may be loose. Contact <a href="support.html">support</a>' +
      ' for assistance.</td></tr></tbody></table>'
  },
  {
    slug: 'water-issues',
    title: 'Water Issues',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Got water problems — a musty smell, a leak, or a beep-and-shutoff? Review the chart below to find a solution.',
    keywords: ['water', 'leak', 'musty smell', 'stale water', 'float sensor', 'low water', 'beep and shut off'],
    related: ['my-aquafire-is-beeping', 'general-cleaning', 'flame-low-or-uneven'],
    html: '<h2>Got water problems?</h2><p>Review the chart below to find a solution.</p>' +
      '<div class="ha-note">' +
      'Most common water issues can be prevented with a whole-insert cleaning. We recommend cleaning your insert 2&ndash;3 times a year depending on frequency of use and water quality. Start with <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a> or the <a href="maintenance.html">maintenance checklists</a>' +
      ' to see if that solves your problem first.</div><table><thead><tr><th>Problem</th><th>' +
      'Possible cause</th><th>Solution</th></tr></thead><tbody><tr><td>' +
      'Musty or stale smell when unit is running</td><td>' +
      'Old or stale water, generally from lack of use</td><td>' +
      'Drain and refill with fresh water. Consider cleaning per the <a href="maintenance.html">' +
      'preventative maintenance</a> guidelines.</td></tr><tr><td>' +
      'Leak detected after the unit has been unused for an extended period of time</td><td>' +
      'Float sensor in the mist tank may be stuck, creating an above-normal water level in the mist tube</td>' +
      '<td>' +
      'Drain excess water to the proper level, then lift and plunge the mist maker rack vigorously 10&ndash;15 times to free up the float sensor in the mist tank. Let the unit run and recheck that the correct water level is maintained.</td>' +
      '</tr><tr><td>Unit beeps then turns off</td><td>Low water level</td><td>' +
      'Refill the unit manually, or verify that the water feed is on if the unit is permanently plumbed.</td>' +
      '</tr></tbody></table>'
  },
  {
    slug: 'remote-control-issues',
    title: 'Remote Control Issues',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Remote not turning the fireplace on or off, or not responding to flame changes? Try these fixes before contacting support.',
    keywords: ['remote', 'battery', 'cr-2032', 'sync', 'won\'t respond', 'flame adjustment', 'color'],
    related: ['remotes-and-smart-home-control', 'power-issues', 'flame-appearance-troubleshooting'],
    html: '<h2>Common remote fixes</h2><p>' +
      'The chart below covers easy solutions for common issues with the remote control for your Aquafire and Aquafire Pro.</p>' +
      '<table><thead><tr><th>Problem</th><th>Possible cause</th><th>Solution</th></tr></thead><tbody>' +
      '<tr><td>Remote control does not turn the fireplace on or off</td><td>Possible dead battery</td>' +
      '<td>Install a new CR-2032 (lithium) battery.</td></tr><tr><td>&nbsp;</td><td>' +
      'Remote may not be synced to this particular fireplace</td><td>' +
      'Push and hold the power button on the fireplace until it flashes, then press any button on the remote. Use this same process to sync multiple fireplaces to a single remote.</td>' +
      '</tr><tr><td>' +
      'Remote powers the fireplace on/off, but does not seem to respond to flame adjustments or color changes</td>' +
      '<td>Possible low battery</td><td>Install a new CR-2032 (lithium) battery.</td></tr><tr><td>' +
      '&nbsp;</td><td>Possible sync issue</td><td>' +
      'Push and hold the power button on the fireplace until it flashes, then press any button on the remote. Use this same process to sync multiple fireplaces to a single remote.</td>' +
      '</tr><tr><td>Remote does not work despite trying all steps above</td><td>' +
      'Remote may be malfunctioning</td><td>Contact <a href="support.html">support</a>' +
      ' for assistance.</td></tr></tbody></table>'
  },
  {
    slug: 'light-issues-aquafire',
    title: 'Light Issues — Aquafire (AWA)',
    category: 'fix',
    models: ['original'],
    updated: '2026-08',
    teaser: 'Lights not coming on, or a dead cell in your Aquafire’s light strip? Here are the easy fixes to check first.',
    keywords: ['lights', 'light strip', 'won\'t turn on', 'led', 'light cell', 'connection', 'awa', 'original'],
    related: ['my-lights-wont-turn-on', 'lights-and-beeps-reference', 'general-cleaning'],
    html: '<h2>Light issues on your Aquafire</h2><p>' +
      'The chart below covers easy solutions for common light issues on your Aquafire (AWA).</p><table>' +
      '<thead><tr><th>Problem</th><th>Possible cause</th><th>Solution</th></tr></thead><tbody><tr><td>' +
      'Lights are not on when the unit is on</td><td>Loose connection on the light strip(s)</td><td>' +
      'Check the connection on the right end of the light strip to make sure it is securely connected.</td>' +
      '</tr><tr><td>&nbsp;</td><td>Possible problem with the light strip or LED driver card</td><td>' +
      'Contact <a href="support.html">support</a> for further assistance.</td></tr><tr><td>' +
      'One or more light cells are not working on an individual light strip</td><td>' +
      'There is a problem with the light strip</td><td>Contact <a href="support.html">support</a>' +
      ' for further assistance.</td></tr></tbody></table><p>' +
      'If your lights are not turning on at all, see <a href="help.html?article=my-lights-wont-turn-on">' +
      'My Lights Won’t Turn On</a> for the most common root causes and how to prevent them.</p>'
  },
  {
    slug: 'light-issues-aquafire-pro',
    title: 'Light Issues — Aquafire Pro (AWPR)',
    category: 'fix',
    models: ['pro'],
    updated: '2026-08',
    teaser: 'Amber or RGB lights not coming on in your Aquafire Pro? Check remote buttons and connections before contacting support.',
    keywords: ['lights', 'rgb', 'orange lights', 'color', 'light strip', 'won\'t turn on', 'led', 'awpr'],
    related: ['my-lights-wont-turn-on', 'lights-and-beeps-reference', 'remotes-and-smart-home-control'],
    html: '<h2>Light issues on your Aquafire Pro</h2><p>' +
      'The chart below covers easy solutions for common light issues on your Aquafire Pro (AWPR).</p>' +
      '<table><thead><tr><th>Problem</th><th>Possible cause</th><th>Solution</th></tr></thead><tbody>' +
      '<tr><td>Lights are not on when the unit is on</td><td>' +
      'Loose connection on the light strip(s)</td><td>' +
      'Check the connection on the right end of the light strip to make sure it is securely connected.</td>' +
      '</tr><tr><td>&nbsp;</td><td>Possible problem with the light strip or LED driver card</td><td>' +
      'Contact <a href="support.html">support</a> for further assistance.</td></tr><tr><td>' +
      'Orange lights are not on when the unit is on</td><td>' +
      'Orange button on the remote may be turned off</td><td>' +
      'Use the remote or phone app to turn the light strips on/off for the desired effect.</td></tr>' +
      '<tr><td>Colored lights are not on when the unit is on</td><td>' +
      'RGB button on the remote may be turned off</td><td>' +
      'The RGB button must be on to select RGB colors.</td></tr><tr><td>' +
      'One or more light cells are not working on an individual light strip</td><td>' +
      'There is a problem with the light strip or LED driver card</td><td>' +
      'Contact <a href="support.html">support</a> for assistance.</td></tr></tbody></table><p>' +
      'If your lights are not turning on at all, see <a href="help.html?article=my-lights-wont-turn-on">' +
      'My Lights Won’t Turn On</a> for the most common root causes and how to prevent them.</p>'
  },
  {
    slug: 'my-lights-wont-turn-on',
    title: 'My Lights Won’t Turn On',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Checked the connections and remote buttons and your lights still will not turn on? They may have shorted out — here is why, and how to prevent it going forward.',
    keywords: ['lights', 'led', 'shorted', 'wear item', 'downdraft', 'scaling', 'replacement lights'],
    related: ['light-issues-aquafire', 'light-issues-aquafire-pro', 'room-air-flow-considerations', 'general-cleaning'],
    html: '<h2>Start with the basics</h2><p>' +
      'First, check that the light connections are tight and that the proper buttons on the remote control are activated. See the light-issues article for your model: <a href="help.html?article=light-issues-aquafire">' +
      'Aquafire (AWA)</a> or <a href="help.html?article=light-issues-aquafire-pro">' +
      'Aquafire Pro (AWPR)</a>.</p><p>' +
      'If your lights are still not turning on, the most likely answer is that they have shorted out and need to be replaced. LED lights in a wet environment have a shorter lifespan and do need periodic replacement, which is why we consider them a wear item. We sell replacement LED lights directly through our website: <a href="https://www.aquafire.com/collections/replacement-parts" target="_blank" rel="noopener">' +
      'aquafire.com/collections/replacement-parts</a>.</p><h2>What causes lights to short out</h2><p>' +
      'If you feel the lights have shorted prematurely, the top three causes are:</p><ul><li>' +
      'Excess mist falling back onto the light connection — most commonly from strong air currents in the room pushing vapor onto the lighting connections, or from down-drafting (vapor pulled down into the interior of the Aquafire when the HVAC turns on, caused by openings in the walls behind or beneath the enclosure). See <a href="help.html?article=room-air-flow-considerations">' +
      'Room Air Flow Considerations</a>.</li><li>Scaling accumulating on the light connection.</li><li>' +
      'Water leaking onto the light connection from improper manual filling or other customer interaction.</li>' +
      '</ul><p>' +
      'Once lights have shorted, it is hard to bring them back to life. You can prevent excess vapor and scaling going forward with:</p>' +
      '<ul><li>Regular cleaning — see <a href="help.html?article=general-cleaning">General Cleaning</a>' +
      ' and the <a href="maintenance.html">maintenance checklists</a>.</li><li>' +
      'A water softener, such as the <a href="help.html?article=vapor-pure-water-softener">' +
      'Vapor Pure</a>.</li><li>' +
      'Redirecting any strong air currents in the room so vapor is not pushed back onto the lights.</li>' +
      '<li>' +
      'Insulating or installing a barrier in the open wall space underneath and behind your Aquafire enclosure.</li>' +
      '<li>' +
      'Avoiding running the Aquafire 24/7 — constant operation causes excess vapor to settle on the lighting connections.</li>' +
      '<li>' +
      'Setting the flame density and speed to a lower setting. See <a href="help.html?article=adjusting-the-flame">' +
      'Adjusting the Aquafire Flame</a>.</li></ul>'
  },
  {
    slug: 'flame-appearance-troubleshooting',
    title: 'Flame Appearance Troubleshooting',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Flame too short, too smoky, or moving at the wrong speed? Review the chart below to find a fix.',
    keywords: ['flame height', 'smoky flame', 'flame speed', 'mist volume', 'short flame', 'uneven'],
    related: ['flame-low-or-uneven', 'flame-smoky-foggy', 'adjusting-the-flame'],
    html: '<h2>Is your vapor flame not behaving as it should?</h2><p>' +
      'Review the chart below to find a solution.</p><div class="ha-note">' +
      'Most common flame issues can be prevented with a whole-insert cleaning. We recommend cleaning your insert 2&ndash;3 times a year depending on frequency of use and water quality. Start with <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a> or the <a href="maintenance.html">maintenance checklists</a>' +
      ' to see if that solves your problem first.</div><table><thead><tr><th>Problem</th><th>' +
      'Possible cause</th><th>Solution</th></tr></thead><tbody><tr><td>' +
      'Flame height is less than 6&Prime; in all sections</td><td>' +
      'Possible airflow issue due to enclosure design or ambient room currents</td><td>' +
      'Verify the fireplace is getting sufficient air and that no AC vents, fans, or air currents are preventing the mist from rising vertically.</td>' +
      '</tr><tr><td>&nbsp;</td><td>Flame volume may be low</td><td>' +
      'Use the remote (or phone app) to increase the volume of mist by pressing &ldquo;+&rdquo;.</td>' +
      '</tr><tr><td>Flame height is less than 6&Prime; in one section only</td><td>' +
      'Mist maker may need to be cleaned</td><td>Follow <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a> for the mist maker. Consider cleaning all mist makers at once.</td></tr>' +
      '<tr><td>&nbsp;</td><td>Water level in the mist tube may be too high</td><td>' +
      'Remove excess water to the proper level (the height of the black mushroom cap). See <a href="help.html?article=flame-low-or-uneven">' +
      'Flame Issues &mdash; Low or Uneven Flame</a>.</td></tr><tr><td>' +
      'Flames appear more &ldquo;smoky&rdquo; than desired</td><td>Excess mist is being generated</td>' +
      '<td>' +
      'Use the remote (or phone app) to decrease the volume of mist by pressing &ldquo;&minus;&rdquo;.</td>' +
      '</tr><tr><td>Slower flame movement is desired</td><td>Flame speed setting is too high</td><td>' +
      'Use the remote (or phone app) to decrease the speed of mist by pressing &ldquo;&minus;&rdquo;.</td>' +
      '</tr><tr><td>Faster flame movement is desired</td><td>Flame speed setting is too low</td><td>' +
      'Use the remote (or phone app) to increase the speed of mist by pressing &ldquo;+&rdquo;.</td>' +
      '</tr></tbody></table>'
  },
  {
    slug: 'flame-low-or-uneven',
    title: 'Flame Issues — Low or Uneven “Flame”',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Flames uneven, missing, or shorter than usual? Start with the float sensor and mist maker — the two most common culprits.',
    keywords: ['low flame', 'uneven flame', 'float sensor', 'mist maker', 'high water', 'no flame', 'buildup'],
    related: ['general-cleaning', 'mist-maker-cleaning-replacement', 'flame-appearance-troubleshooting'],
    html: '<h2>Flames uneven, low, or missing?</h2><p>' +
      'If you have ever turned on your Aquafire or Aquafire Pro and the flames did not look quite right, this article is for you.</p>' +
      '<p>' +
      'The common culprit for uneven or low mist is high water in the mist tanks. First and foremost, your insert needs to be cleaned multiple times a year and run regularly to turn over fresh water &mdash; follow the <a href="maintenance.html">' +
      'preventative maintenance checklists</a>' +
      ' to keep your insert running optimally. If that does not solve the issue, or your insert is within its first 90 days, high water is usually caused by a stuck float sensor or a mist maker that needs cleaning or replacement.</p>' +
      '<h2>Step 1: check the float sensor</h2><ol><li>Take off the top lid.</li><li>' +
      'Open the mist maker tanks. There is one tank per 20&Prime; — a 20&Prime; insert has one mist maker tank, a 40&Prime; has two, and a 60&Prime; has three.</li>' +
      '<li>' +
      'Compare the water levels. Ideally the water should just barely reach the top of the black mushroom cap. Does the water look higher in the section with uneven mist?</li>' +
      '<li>' +
      'If it looks high, remove some of that water. Then agitate the mist maker by lifting it up and down to create an internal wave that frees the stuck float sensor in the lower mist maker tank.</li>' +
      '</ol><h2>Step 2: check the condition of the mist maker</h2><p>' +
      'If the float sensor check did not solve the issue, check the mist maker itself:</p><ol><li>' +
      'Take off the top lid and open the mist maker tanks.</li><li>' +
      'Unplug the mist maker and carefully remove the interior rack. When you are close to the top, tip the rack into the mist maker tank to empty excess water and avoid spillage.</li>' +
      '<li>' +
      'Examine the mist maker. It should be free of debris, with visible space between the bottom of the mist maker and the rack it is attached to.</li>' +
      '<li>' +
      'If it has buildup or sediment attached, the mist maker cannot operate properly, which results in low or uneven mist. Follow <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a>' +
      ' for the mist maker cleaning steps and then try turning your insert on again.</li></ol><p>' +
      'If none of these steps solve the issue, reach out to our Technical Support team by completing a <a href="https://www.aquafire.com/pages/service-request" target="_blank" rel="noopener">' +
      'service request</a>. They will be happy to go over additional troubleshooting techniques.</p>'
  },
  {
    slug: 'flame-smoky-foggy',
    title: 'Flame Issues — Smoky or Foggy Appearance',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'A smoky or foggy-looking flame usually comes down to room humidity, flame settings, or the front fan sponge filters.',
    keywords: ['smoky flame', 'foggy flame', 'humidity', 'sponge filter', 'fan filter', 'overproduction'],
    related: ['adjusting-the-flame', 'flame-appearance-troubleshooting', 'room-air-flow-considerations'],
    html: '<h2>What causes a smoky or foggy flame?</h2><p>' +
      'A smoky or foggy flame effect can be caused by a few factors:</p><ol><li>' +
      'High humidity in the room.</li><li>' +
      'Flame settings that have not been customized to your environment.</li><li>' +
      'Sponge filters covering the front fans are seated too high.</li><li>' +
      'Sponge filters covering the front fans are too thin for your environment.</li></ol><h2>' +
      'Solutions</h2><ol><li><strong>High humidity in the room</strong>' +
      ' &mdash; lower the humidity by closing doors near the unit and adjusting the room’s HVAC.</li>' +
      '<li><strong>Customize your flame settings</strong>' +
      ' &mdash; see <a href="help.html?article=adjusting-the-flame">Adjusting the Aquafire Flame</a>' +
      '.</li><li><strong>Sponge filter seating</strong>' +
      ' &mdash; check that the filters covering your front fans are fully seated. Moving the front fan filters up by even a quarter inch can push out too much mist and create a foggy effect, and can potentially cause mist overproduction that damages internal electrical connections and light strips. There is one filter per 20&Prime; — a 20&Prime; has one fan filter, a 40&Prime; has two, and a 60&Prime; has three.</li>' +
      '<li><strong>Thin sponge filter</strong>' +
      ' &mdash; newer Aquafire and Aquafire Pro units shipped with a thinner front fan filter to increase flame height and density. It is not a universal fit for every installation, and the thinner filter has been known to cause a foggy look in some rooms. If you would like to request new fan filter covers, email <a href="mailto:ces@aquafire.com">' +
      'ces@aquafire.com</a>' +
      '. We provide free front fan filters to any Aquafire or Aquafire Pro still under warranty &mdash; have your serial number and size (20&Prime;, 40&Prime;, or 60&Prime;) ready. See <a href="help.html?article=identifying-serial-number">' +
      'Identifying Your Serial Number</a>.</li><li><strong>Quick test</strong>' +
      ' &mdash; to check whether a thin sponge filter is the issue, cut a thin piece of paper (about a quarter the size of the front sponge) or a strip of painter’s tape and place it over the bottom half of the sponge. This should noticeably reduce a foggy flame appearance if filter thickness is the cause.</li>' +
      '</ol>'
  },
  {
    slug: 'my-aquafire-is-beeping',
    title: 'My Aquafire Is Beeping!',
    category: 'fix',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Do not stress — your Aquafire is trying to tell you about its water level or power supply. Here is what each beep pattern means.',
    keywords: ['beeping', 'beeps', 'low water', 'overflow', 'power adaptor', 'alarm', 'flashing lights'],
    related: ['lights-and-beeps-reference', 'water-issues', 'power-issues'],
    html: '<h2>What the beep means</h2><p>' +
      'Do not stress — your Aquafire is trying to communicate a water level or power issue with you. Beeping can signal a few things:</p>' +
      '<ol><li><strong>2 quick beeps &mdash; low or no water.</strong>' +
      ' The unit will beep and turn off when it is low or out of water. Refill your Aquafire and turn it back on. It can take multiple fills to completely fill your Aquafire the first time &mdash; this is completely normal, and it will fill correctly and completely on subsequent refills.</li>' +
      '<li><strong>3 long beeps &mdash; overflow protection or high water in the mist tube.</strong>' +
      ' On newer models (AWA2/AWA3, AWPR2/AWPR3), high water detected in the mist tube triggers a series of alarm beeping and flashing lights before the insert shuts off. This is a protection feature to prevent water overflow, and is usually caused by a stuck float sensor. See <a href="help.html?article=flame-low-or-uneven">' +
      'Flame Issues &mdash; Low or Uneven Flame</a> to remedy a stuck float sensor.</li><li><strong>' +
      '1 short beep &mdash; power adaptor issue.</strong>' +
      ' Short, quick beeps can signal a problem with the AC power adaptor. First check that the power adaptor is fully plugged in at the wall outlet, the back of the Aquafire, and the power block itself. If everything is tightly connected and the beeping continues, there may be an issue with the power adaptor itself — contact our Customer Experience Team at <a href="mailto:ces@aquafire.com">' +
      'ces@aquafire.com</a> for further instructions.</li></ol><p>' +
      'For a quick-reference table of every light and beep pattern side by side, see <a href="help.html?article=lights-and-beeps-reference">' +
      'Lights &amp; Beeps Reference</a>.</p>'
  },
  {
    slug: 'lights-and-beeps-reference',
    title: 'Lights & Beeps Reference',
    category: 'fix',
    models: ['original', 'pro'],
    updated: '2026-08',
    teaser: 'The quick-reference key printed on your unit’s sticker — every light and beep pattern, its alert, and its probable cause, for both the Aquafire and Aquafire Pro.',
    keywords: ['lights and beeps', 'sticker', 'alert codes', 'beep pattern', 'logo flashing', 'reference key'],
    related: ['my-aquafire-is-beeping', 'power-issues', 'water-issues', 'preventative-maintenance'],
    html: '<h2>How to read this table</h2><p>' +
      'This mirrors the Lights &amp; Beeps Key sticker on your unit. Match what you are seeing and hearing to the rows below to identify the alert and its probable cause. For step-by-step fixes, see <a href="help.html?article=my-aquafire-is-beeping">' +
      'My Aquafire Is Beeping!</a>.</p><h3>Aquafire (AWA)</h3><table><thead><tr><th>Lights</th><th>' +
      'Beeps</th><th>Alert</th><th>Probable cause</th></tr></thead><tbody><tr><td>&nbsp;</td><td>' +
      'Two quick beeps, every two seconds</td><td>Low / No Water</td><td>' +
      'The water supply has not been turned on, or water needs to be added.</td></tr><tr><td>' +
      'Logo flashes for 30 sec</td><td>None</td><td>Maintenance Reminder</td><td>' +
      'Due for preventative maintenance cleaning &mdash; press and hold the middle and left buttons together to reset.</td>' +
      '</tr><tr><td>Logo, lights cycling</td><td>Three long beeps, every second</td><td>' +
      'Overflow / High Water Alert</td><td>' +
      'If not overflowing, this alert typically indicates a stuck float sensor.</td></tr><tr><td>' +
      'Logo flashing together</td><td>One short beep, every two seconds</td><td>Voltage Alert</td><td>' +
      'Possible shortage or a problem with the power adapter.</td></tr></tbody></table><h3>' +
      'Aquafire Pro (AWPR)</h3><table><thead><tr><th>Lights</th><th>Beeps</th><th>Alert</th><th>' +
      'Probable cause</th></tr></thead><tbody><tr><td>&nbsp;</td><td>' +
      'Two quick beeps, every two seconds</td><td>Low / No Water</td><td>' +
      'The water supply has not been turned on, or water needs to be added.</td></tr><tr><td>' +
      'Flashes for 30 sec</td><td>None</td><td>Maintenance Reminder</td><td>' +
      'Due for preventative maintenance cleaning &mdash; press and hold the middle and left buttons together to reset.</td>' +
      '</tr><tr><td>Lights cycling</td><td>Three long beeps, every second</td><td>' +
      'Overflow / High Water Alert</td><td>' +
      'If not overflowing, this alert typically indicates a stuck float sensor.</td></tr><tr><td>' +
      'Flashing together</td><td>One short beep, every two seconds</td><td>Voltage Alert</td><td>' +
      'Possible shortage or a problem with the power adapter.</td></tr></tbody></table>'
  },
  {
    slug: 'general-cleaning',
    title: 'General Cleaning for Aquafire and Aquafire Pro',
    category: 'care',
    models: ['original', 'pro'],
    updated: '2026-08',
    teaser: 'Descaling and cleaning your insert regularly keeps it running well — here is the mist maker routine and the full-system deep clean, step by step.',
    keywords: ['cleaning', 'descale', 'vinegar', 'mist maker cleaning', 'whole system clean', 'drain'],
    related: ['preventative-maintenance', 'mist-maker-cleaning-replacement', 'vapor-pure-water-softener'],
    html: '<h2>Why regular cleaning matters</h2><p>' +
      'For your fireplace insert to operate properly and have a long, healthy life, it needs to be descaled and cleaned regularly. How often depends on your water quality, how often the insert runs, and whether you have a <a href="help.html?article=vapor-pure-water-softener">' +
      'Vapor Pure water softener</a>' +
      ' installed. Without a softener, minerals in hard water can cling to electrical components and interior tank walls, increasing maintenance needs, decreasing performance, and shortening the life of your Aquafire.</p>' +
      '<p>' +
      'Cleaning your mist makers and insert is not a daunting task — once you have practiced it, it is a quick 10&ndash;15 minute process.</p>' +
      '<h2>Recommended cleaning schedule</h2><p>' +
      'For an Aquafire or Aquafire Pro running an average of 20 hours a week with moderate water hardness:</p>' +
      '<ul><li><strong>Mist maker cleaning:</strong> every 3 months</li><li><strong>' +
      'Whole insert cleaning:</strong> every 6 months</li></ul><p>The <a href="maintenance.html">' +
      'maintenance checklists</a>' +
      ' track both of these for you and stamp a completion date each time you finish one.</p><h2>' +
      'Cleaning just the mist makers</h2><ol><li>' +
      'Turn your fireplace off, then unplug the mist maker wire from the power port at each of the large round mist tube housings.</li>' +
      '<li>' +
      'Remove the mist maker racks from the mist tubes. For small to moderate scale or buildup, apply a few drops of white vinegar directly onto the white disc at the center of the mist maker. Let it sit for 3 minutes, rinse it off, and return the rack to the mist tube. Do not forget to reattach the power cord.</li>' +
      '<li>' +
      'For heavier buildup or visible calcification, remove the mist maker from the tube, remove the 4 screws attaching it to the rack, and soak it directly in white vinegar for 10&ndash;20 minutes. A soft small brush (toothbrush, paint brush, etc.) can loosen stubborn deposits &mdash; including the bottom of the mist maker. Keep the power cord out of the vinegar.</li>' +
      '<li>' +
      'When soaking is complete, rinse thoroughly with water, using a soft brush if needed on the white surface, metal casing, and bottom. Do not use a stiff-bristle brush or a Scotch-Brite pad on the mist makers &mdash; it can cause permanent damage.</li>' +
      '<li>Reattach the mist maker to the rack and place the rack back in the mist tube.</li><li>' +
      'Reconnect the mist maker power feed to the power port, pushing the wire all the way down the slot in the side of the mist tube before replacing the cap.</li>' +
      '</ol><h2>Cleaning the entire system</h2><ol><li>' +
      'Connect the flexible hose that came with your fireplace to the drain port on the front of the unit (AWA/AWP models) or on the top (AWPR series).</li>' +
      '<li>' +
      'Put the other end of the hose in a 3&ndash;5 gallon bucket and press and hold the left button (B2) to start draining. When the drain cycle stops, some water will remain in the lower tank reservoirs — this is normal. Remove the remaining cups of water from each mist tube with a small 1/4&Prime; siphon hose, a large turkey baster, or a small sponge. Avoid anything that could flake off or leave debris.</li>' +
      '<li>' +
      'Add approximately 1/2 gallon of vinegar via the fill/drain hose (running the manual fill cycle with B1), or pour equal amounts directly into the mist tubes without overfilling. The system has enough vinegar when the level in the mist tube is just above the top of the mist maker (about 2&Prime;). Overfilling may cause excess vinegar to leak from the front fans.</li>' +
      '<li>' +
      'Let the vinegar sit for 10&ndash;20 minutes to loosen hard water scaling on the float sensors.</li>' +
      '<li>' +
      'After soaking (before draining), agitate the vinegar in each lower tank by raising and lowering the mist maker rack vigorously 10&ndash;15 times per tube, to help break up residue on the float sensors.</li>' +
      '<li>' +
      'Drain the vinegar the same way you drained the water, using the drain hose and B2 button.</li>' +
      '<li>' +
      'Once the vinegar is out, fill the unit with fresh water &mdash; either by turning the water back on (if permanently plumbed) or using the hose and fill cycle (B1).</li>' +
      '<li>' +
      'Fill and drain the entire system twice more to make sure all vinegar and contaminants are cleared. After the third fill, run the unit as you normally would.</li>' +
      '</ol><div class="ha-caution">Do not operate the fireplace during the vinegar soak.</div>' +
      '<div class="ha-note">' +
      'Prefer a wet/dry vac over the fill/drain hose when draining for a cleaning — it handles loosened debris without risking a clog in the drain lines or pump.</div>' +
      '<div class="ha-note">' +
      'It is normal to see mist issues for 2&ndash;3 days after a deep clean while leftover debris continues to slough off. If issues persist, open the mist tubes, check for debris, and re-agitate the mist rack and float sensor. The more frequently you clean the insert, the less likely you are to see this delayed debris.</div>'
  },
  {
    slug: 'preventative-maintenance',
    title: 'Preventative Maintenance Schedule',
    category: 'care',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'The recommended cleaning cadence for your Aquafire, tracked with an interactive checklist.',
    keywords: ['maintenance schedule', 'how often clean', 'cleaning schedule', 'pm', 'checklist'],
    related: ['mist-maker-cleaning-replacement', 'general-cleaning', 'vapor-pure-water-softener'],
    html: '<p>' +
      'A quick recurring clean keeps your Aquafire\'s flame full and even, and extends the life of its mist makers and internal components. The recommended cadence, for a fireplace running an average of 20 hours a week with moderately hard water, is:</p>' +
      '<table><thead><tr><th>Procedure</th><th>Cadence</th></tr></thead><tbody><tr><td>' +
      'Mist Maker Cleaning</td><td>Every 3 months</td></tr><tr><td>Full System Cleaning</td><td>' +
      'Every 6 months</td></tr></tbody></table><p>' +
      'How often you actually need to clean depends on your water quality, how much the fireplace runs, and whether a Vapor Pure water softener is installed — harder water and more run time both call for more frequent cleaning.</p>' +
      '<div class="ha-note">The <a href="maintenance.html">Maintenance</a>' +
      ' page walks through both procedures as step-by-step checklists, tracks your progress, and works out your next due date from the last time you completed one.</div>' +
      '<p>For the individual steps, see <a href="help.html?article=mist-maker-cleaning-replacement">' +
      'Mist Maker Cleaning or Replacement</a> and <a href="help.html?article=general-cleaning">' +
      'General Cleaning</a>.</p>'
  },
  {
    slug: 'mist-maker-cleaning-replacement',
    title: 'Mist Maker Cleaning or Replacement',
    category: 'care',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'How to clean a mist maker, when to replace one as a wear item, and how to tell which one has failed.',
    keywords: ['mist maker', 'flame low', 'flame uneven', 'replace mist maker', 'vinegar clean', 'float sensor'],
    related: ['preventative-maintenance', 'flame-low-or-uneven', 'general-cleaning'],
    html: '<p>' +
      'The mist maker is what turns water into the vapor your Aquafire\'s flame is made of. It is a wear item, and cleaning it regularly is the single best thing you can do to keep the flame full and even.</p>' +
      '<h2>Cleaning</h2><p>' +
      'Put a few drops of white vinegar directly on the white disc at the center of the mist maker. Let it sit for 3 minutes, then rinse it off before returning it to the mist tube.</p>' +
      '<h2>Diagnosing a low or uneven flame</h2><p>' +
      'High water level in the mist tank is the most common cause of a low or uneven flame. Check that the water sits just at the top of the black mushroom cap — if it looks high, the float sensor may be stuck. Agitate the mist maker rack up and down to unstick it, then recheck the level.</p>' +
      '<p>' +
      'If that does not fix it, take a look at the mist maker itself: it should be free of debris, with visible space between the bottom of the mist maker and the rack it sits on. Buildup or sediment on it will produce a low or uneven mist.</p>' +
      '<h2>Testing for a dead mist maker</h2><p>' +
      'If one section is misting less than the others, swap its mist maker rack with a working one from a different section. If the weak mist follows the rack you moved, that mist maker has failed and needs to be replaced.</p>' +
      '<h2>Replacement</h2><p>Mist makers are a wear item and typically last <strong>' +
      '2,000–3,000 operating hours</strong>' +
      ' before they need replacing. A warranty replacement ships with its own installation instructions.</p>' +
      '<div class="ha-note">The <a href="maintenance.html">Maintenance</a>' +
      ' page has the full mist maker cleaning checklist, tracks your progress, and reminds you when the next clean is due.</div>'
  },
  {
    slug: 'vapor-pure-water-softener',
    title: 'Vapor Pure Water Softener — Installation & Use',
    category: 'care',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'How to plumb in and set up your Vapor Pure water softener, and how to test water hardness to know when the cartridge needs replacing.',
    keywords: ['vapor pure', 'water softener', 'hardness test', 'cartridge', 'install', 'hard water', 'af300', 'af700'],
    related: ['general-cleaning', 'water-issues', 'mist-maker-cleaning-replacement'],
    html: '<h2>Before you start</h2><p>' +
      'The Vapor Pure system connects to a cold water supply only, ahead of your Aquafire. A licensed plumber should confirm water pressure will not exceed 100 PSI, and should be consulted on local plumbing codes.</p>' +
      '<div class="ha-caution">' +
      'Horseshoe clips must be used on every tubing connection, and only the fittings provided with the system should be used. Use Teflon tape only on threaded fittings. Skipping either of these voids the warranty.</div>' +
      '<div class="ha-caution">' +
      'Do not use with water that is microbiologically unsafe or of unknown quality without adequate disinfection before or after the unit.</div>' +
      '<h2>Space requirements</h2><p>' +
      'Mount components in a vertical, upright position only — under a kitchen sink or on a beam/wall in the basement both work, as long as there is room on both sides of the head for the water connections.</p>' +
      '<table><thead><tr><th>Cartridge</th><th>Total install space</th><th>' +
      'Minimum clearance under the head</th></tr></thead><tbody><tr><td>AF300</td><td>' +
      '13&Prime; H x 6&Prime; W x 5&Prime; D</td><td>' +
      '9&Prime;, so the cartridge can be lowered for removal</td></tr><tr><td>AF700</td><td>' +
      '21&Prime; H x 6&Prime; W x 5&Prime; D</td><td>' +
      '17&Prime;, so the cartridge can be lowered for removal</td></tr></tbody></table><h2>' +
      'Installation steps</h2><ol><li>' +
      'Attach the bracket to the head using the 4 short 1/2&Prime; screws provided.</li><li>' +
      'Using the bracket as a template, mark and screw in the 2 long 1&Prime; screws to mount the head in a position that lets you conveniently run tubing from the cold water supply to the head’s inlet, and from the head’s outlet to the Aquafire unit (or filtered-water dispenser).</li>' +
      '<li>Turn off the cold water shutoff.</li><li>' +
      'If installing an Aquafire Pro unit or an Aquafire with a Direct Plumb Kit, do so using the instructions included with it, but do not run tubing to it yet.</li>' +
      '<li>' +
      'Cut a length of tubing (each section at least 2&Prime; long, cut square) to connect the cold water supply attachment to the head, and insert it into the collet until it meets the tube stop (a full 3/4&Prime;). Secure it with a horseshoe locking clip between the collet and the connector body.</li>' +
      '<li>' +
      'Cut and connect a second length of tubing from the head’s outlet fitting to the shutoff on the Aquafire unit or Direct Plumb Kit.</li>' +
      '<li>' +
      'Align the unlock icon on the cartridge label with the head’s inlet fitting, push the cartridge up into the head, then turn it to the right until it stops (about a quarter turn).</li>' +
      '<li>' +
      'Confirm the Aquafire shutoff valve lever is turned clockwise until it stops (off), then slowly turn the cold water supply lever counterclockwise just enough to start water flowing. Check for leaks as the cartridge fills.</li>' +
      '<li>' +
      'Slowly turn the Aquafire shutoff lever counterclockwise until it stops (on), then turn the cold water supply lever fully to the on position. Check for leaks over the next 24 hours.</li>' +
      '</ol><div class="ha-note">' +
      'Filtered water may look cloudy for 1&ndash;3 days as the cartridge purges air. Fill a glass and let it stand — if the cloudiness is just air bubbles, it will clear as they rise. If cloudiness persists, contact your dealer.</div>' +
      '<h2>Testing water hardness and replacing the cartridge</h2><ol><li>' +
      'Lift the Aquafire lid to access the water tanks, then unscrew the top tank cap labeled &ldquo;WATER&rdquo; to test the water in the top tank.</li>' +
      '<li>' +
      'Follow the instructions on the foil test-strip wrapper, then match the strip’s color to the color chart on the wrapper and note the result.</li>' +
      '</ol><p>' +
      'Replace the cartridge when the Total Hardness strip shows any shade different from 50, or the Iron strip shows any shade different from 0 &mdash; whichever comes first, or at least annually.</p>' +
      '<p>' +
      'You can look up your local water hardness and get a personalized softener replacement timeline on the <a href="water-care.html">' +
      'Water Care</a> page.</p>'
  },
  {
    slug: 'aquafire-limited-warranty',
    title: 'Aquafire Limited Warranty',
    category: 'warranty',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Two years residential, one year commercial, repair-first — the full terms of Aquafire’s limited warranty, and how to file a claim.',
    keywords: ['warranty', 'coverage', 'claim', 'rma', 'wear items', 'exclusions', 'register'],
    related: ['identifying-serial-number', 'general-cleaning', 'preventative-maintenance'],
    html: '<div class="ha-caution"><strong>Register within 30 days.</strong>' +
      ' To validate your warranty, you must complete warranty registration within thirty (30) days of receiving your vapor appliance at <a href="https://www.aquafire.com/pages/warranty" target="_blank" rel="noopener">' +
      'aquafire.com/pages/warranty</a>' +
      '. Failure to register within this period will prevent you from submitting any warranty claims for your Aquafire product.</div>' +
      '<h2>Coverage</h2><p>' +
      'Aquafire Inc. warrants to the original end-user purchaser that its water vapor fireplaces and fire feature products shall be free from defects in materials and workmanship under normal use and service for:</p>' +
      '<ul><li><strong>Residential applications:</strong> two (2) years from the date of purchase</li>' +
      '<li><strong>Commercial applications:</strong> one (1) year from the date of purchase</li></ul>' +
      '<p>' +
      'This warranty applies only to products purchased through an authorized Aquafire dealer, and is non-transferable except where required by law.</p>' +
      '<h2>Repair-first policy</h2><p>' +
      'Repair is the primary and preferred remedy. Before any replacement is considered, the dealer and/or customer must:</p>' +
      '<ul><li>Complete all required troubleshooting steps.</li><li>' +
      'Participate in remote diagnostics with Aquafire Technical Support.</li><li>' +
      'Install replacement components when directed by Aquafire Technical Support.</li><li>' +
      'Make reasonable efforts to perform field repair as instructed.</li></ul><p>' +
      'Only if an Aquafire Technical Support technician determines, in their sole professional judgment, that the product cannot be effectively repaired in the field will replacement be considered.</p>' +
      '<h2>Replacement authorization</h2><p>' +
      'Replacement is not automatic and will only be authorized if all of the following are met:</p>' +
      '<ol><li>The product is within the applicable warranty period.</li><li>' +
      'Required troubleshooting and diagnostics have been completed in good faith.</li><li>' +
      'Aquafire Technical Support determines that field repair cannot reasonably be completed.</li><li>' +
      'Written replacement authorization is issued by Aquafire Inc. (email authorization is sufficient).</li>' +
      '</ol><p>Verbal statements do not constitute authorization.</p><p>' +
      'Aquafire does not authorize advance replacement, cross-shipment, or shipment of a replacement unit prior to receipt and inspection of the original unit, unless expressly authorized in writing.</p>' +
      '<h2>Returns (RMA)</h2><p>' +
      'If a replacement is approved, Aquafire will issue a Return Material Authorization (RMA). No product may be returned without one; unauthorized returns are refused and returned at the sender’s expense. Returned products must be prepared for shipment following Aquafire’s packaging and drainage instructions &mdash; failing to do so may void warranty coverage.</p>' +
      '<h2>What is not covered</h2><p>' +
      'This warranty does not apply to products damaged or adversely affected by:</p><ul><li>' +
      'Modification, alteration, tampering, or unauthorized repair.</li><li>' +
      'Failure to follow installation instructions.</li><li>' +
      'Improper maintenance, including use of dirty or contaminated water, mineral scaling, or component failure from accumulated dirt, dust, or debris.</li>' +
      '<li>Failure to maintain recommended water treatment or filtration.</li><li>' +
      'Abuse, negligence, accidental damage, or misuse.</li><li>Normal wear and tear.</li><li>' +
      'Acts of God (floods, fires, lightning, natural disasters).</li><li>' +
      'Damage caused during transportation by third-party carriers. If shipping damage is evident at delivery, report it to the carrier immediately and document it with photographs.</li>' +
      '</ul><p>Cosmetic issues that do not affect functional performance are not covered.</p><h2>' +
      'Wear items</h2><p>' +
      'Transducer mist makers and LED lighting components are considered normal wear items. They are covered only during initial installation testing, or if found defective during setup or within ninety (90) days of purchase.</p>' +
      '<h2>Costs not covered</h2><p>' +
      'Unless expressly authorized in writing, this warranty does not cover labor costs, installation or reinstallation costs, removal of installed units, on-site service calls, travel time or technician expenses, shipping costs, loss of use, loss of profits, property damage, or incidental/consequential damages.</p>' +
      '<h2>Water quality requirement</h2><p>' +
      'Operating the product requires proper water quality and maintenance. Failure to maintain water quality per the Owner’s Manual &mdash; including recommended filtration or water softening &mdash; may cause scaling or component damage and may void coverage. The included <a href="help.html?article=vapor-pure-water-softener">' +
      'Vapor Pure water softening system</a>' +
      ' must be installed and in operation prior to using your Aquafire for this warranty to remain valid. You can check your local water hardness on the <a href="water-care.html">' +
      'Water Care</a>' +
      ' page. If you use an existing whole-house softener instead of the supplied Vapor Pure system, its brand, model, and specifications must be submitted to Aquafire for written approval prior to operation, or coverage may be voided.</p>' +
      '<h2>Filing a claim</h2><p>' +
      'Contact Aquafire Customer Service by phone at 877-888-4260 or email at <a href="mailto:ces@aquafire.com">' +
      'ces@aquafire.com</a>' +
      ', or submit a <a href="https://www.aquafire.com/pages/service-request" target="_blank" rel="noopener">' +
      'service request</a>' +
      '. Have ready: product model number, serial number (see <a href="help.html?article=identifying-serial-number">' +
      'Identifying Your Serial Number</a>' +
      '), your name, address, and a contact phone number. Technical Support will guide the troubleshooting and repair process.</p>' +
      '<p>' +
      'For consumers covered by consumer protection laws in their country or jurisdiction of residence, the benefits of this warranty are in addition to any rights and remedies provided under those laws.</p>'
  },
  {
    slug: 'identifying-serial-number',
    title: 'Identifying Your Serial Number',
    category: 'warranty',
    models: ['original', 'pro', 'lite'],
    updated: '2026-08',
    teaser: 'Your serial number is needed for any service request — here are the two places to find it on your unit.',
    keywords: ['serial number', 'service request', 'info plate', 'top lid', 'rear plate', 'warranty claim'],
    related: ['aquafire-limited-warranty', 'power-issues', 'product-resources'],
    html: '<h2>Two places to look</h2><p>' +
      'When you submit a request for service, we need a handful of details to locate your sale and your fireplace in our system. Your serial number is one of the most important, and it is typically found in two places:</p>' +
      '<ol><li><strong>Under the top lid.</strong>' +
      ' Common on AWA and AWPR models, but not commonly found on the AWP model.</li><li><strong>' +
      'The rear information plate.</strong>' +
      ' Located on the back of all models. If the unit is installed into an enclosure, you will need to fully remove the insert to access it.</li>' +
      '</ol><div class="ha-note">' +
      'Have your serial number handy any time you contact Aquafire for a service request. See <a href="help.html?article=aquafire-limited-warranty">' +
      'Aquafire Limited Warranty</a>' +
      ' for what else to have ready, or start a <a href="https://www.aquafire.com/pages/service-request" target="_blank" rel="noopener">' +
      'service request</a> directly.</div>'
  }
];
