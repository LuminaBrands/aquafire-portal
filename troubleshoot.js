/* ──────────────────────────────────────────────────────────────────────────
   Aquafire Troubleshooter — guided decision-tree wizard.
   Vanilla JS, no dependencies. Renders into #ts-app.

   How it works:
     • TREE is a map of nodeId -> node. A node is either a `question`
       (prompt + options) or an `outcome` (steps, caution, video, article,
       escalation block).
     • State holds the chosen model + a nav stack (for Back / breadcrumb).
     • Model-specific copy: `steps`/`caution`/`note` may be a function that
       receives the model id ('pro' | 'original' | 'lite' | 'unknown').
     • Deep links: ?model=pro|original|lite preselects the model;
       ?node=<id> jumps straight to a node (handy for support emails).

   ⚠️ Editing the tree: keep step text short and action-first. Source docs
   live in docs/source-material/.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── Resource links ─────────────────────────────────────────────────── */
  var LINKS = {
    pmGuide:         { label: 'Preventative Maintenance Guide', url: 'https://www.aquafire.com/pages/maintenance' },
    generalClean:    { label: 'General Cleaning (mist makers & full system)', url: 'https://aquafire.gorgias.help/en-US/general-cleaning-for-aquafire-and-aquafire-pro-340453' },
    serviceRequest:  { label: 'Submit a service request', url: 'https://www.aquafire.com/pages/service-request' },
    replacementParts:{ label: 'Replacement parts', url: 'https://www.aquafire.com/collections/replacement-parts' },
    warrantyReg:     { label: 'Register your warranty', url: 'https://www.aquafire.com/warranty' },
    waterCare:       { label: 'Water Care tool (hardness lookup)', url: 'water-care.html' },
    enclosureGuide:  { label: 'Enclosure Guide', url: 'enclosure-guide.html' },
    aPower:          { label: 'Help article: Power Issues', url: 'https://aquafire.gorgias.help/en-US/power-issues-227728' },
    aWater:          { label: 'Help article: Water Issues', url: 'https://aquafire.gorgias.help/en-US/water-issues-232520' },
    aRemote:         { label: 'Help article: Remote Control Issues', url: 'https://aquafire.gorgias.help/en-US/remote-control-issues-232524' },
    aLightAWA:       { label: 'Help article: Light Issues — Aquafire', url: 'https://aquafire.gorgias.help/en-US/light-issues---aquafire-232523' },
    aLightAWPR:      { label: 'Help article: Light Issues — Aquafire Pro', url: 'https://aquafire.gorgias.help/en-US/light-issues---aquafire-pro-232522' },
    aLightsOff:      { label: 'Help article: My Lights Won’t Turn On', url: 'https://aquafire.gorgias.help/en-US/my-lights-wont-turn-on-981511' },
    aFlameApp:       { label: 'Help article: Flame Appearance Troubleshooting', url: 'https://aquafire.gorgias.help/en-US/flame-appearance-troubleshooting-232521' },
    aFlameLow:       { label: 'Help article: Flame Issues — Low or Uneven', url: 'https://aquafire.gorgias.help/en-US/flame-issues---low-or-uneven-%22flame%22-271574' },
    aFlameSmoky:     { label: 'Help article: Flame Issues — Smoky / Foggy', url: 'https://aquafire.gorgias.help/en-US/flame-issues---smoky--foggy-appearance-841252' },
    aAdjustFlame:    { label: 'Help article: Adjusting the Aquafire Flame', url: 'https://aquafire.gorgias.help/en-US/adjusting-the-aquafire-flame-483763' },
    aApp:            { label: 'Help article: Aquafire Pro — Phone App not connecting', url: 'https://aquafire.gorgias.help/en-US/aquafire-pro---phone-app-not-connecting-272087' },
    aBeep:           { label: 'Help article: My Aquafire is beeping!', url: 'https://aquafire.gorgias.help/en-US/my-aquafire-is-beeping-608536' },
    aSerial:         { label: 'Help article: Identifying your serial number', url: 'https://aquafire.gorgias.help/en-US/identifying-serial-number-275552' }
  };
  var SUPPORT_EMAIL = 'support@aquafire.com';
  var SUPPORT_PHONE = '(877) 888-4260';
  var SUPPORT_PHONE_TEL = '+18778884260';

  /* ── How-to videos ──────────────────────────────────────────────────────
     ⚠️ TODO: paste the Aquafire YouTube URLs here. While `url` is empty the
     tool shows a "video coming soon" placeholder so the slot stays visible. */
  var VIDEOS = {
    appConnect:      { label: 'How to connect the AFIRE app to your Aquafire', url: 'https://youtu.be/exr4qep4cyA' },
    locateMistMaker: { label: 'How to locate & remove the mist maker', url: 'https://youtu.be/cJ1LZDUxzu4' },
    cleanMM1:        { label: 'Mist maker cleaning — Part 1 (the disc)', url: 'https://youtu.be/gQx12sy2Npg' },
    cleanMM2:        { label: 'Mist maker cleaning — Part 2 (lower tank & float sensor)', url: 'https://youtu.be/8Jaj3N2YUKI' },
    agitateFloat:    { label: 'Freeing a stuck float sensor (agitating the mist rack)', url: 'https://youtu.be/Y_caX56hz-k' },
    spongeTest:      { label: 'Sponge-filter thickness test for a foggy flame', url: '' },
    beepLowWater:    { label: 'What the Beep? — Low / No Water', url: 'https://youtu.be/elCwmtnKpZo?si=xVhTzZ5bV6DjF4I1' },
    beepOverflow:    { label: 'What the Beep? — Overflow / High Water', url: 'https://youtu.be/FqJP-wLYBhY?si=sNnv205TiLkWmEr3' },
    beepVoltage:     { label: 'What the Beep? — Voltage / Power Adapter', url: 'https://youtu.be/Dk-9FRpVdzk?si=VTLzYbgCEtqRskjJ' }
  };

  /* ── Models ─────────────────────────────────────────────────────────── */
  var MODELS = {
    pro:      { name: 'Aquafire Pro',      sku: 'AWPR', blurb: 'Amber + RGB color LEDs, phone app, direct-plumb ready' },
    original: { name: 'Aquafire Original', sku: 'AWA',  blurb: 'Amber LEDs, remote control, Direct Plumb Kit optional' },
    lite:     { name: 'Aquafire Lite',     sku: 'AWL',  blurb: 'Amber LEDs, remote control, manual fill, bottom drain plug' },
    unknown:  { name: 'your Aquafire',     sku: '',     blurb: '' }
  };
  function modelName(m) { return (MODELS[m] || MODELS.unknown).name; }
  function modelNameThe(m) { return (m && m !== 'unknown') ? 'the ' + MODELS[m].name : 'your Aquafire'; }
  function isPro(m)  { return m === 'pro'; }
  function isLite(m) { return m === 'lite'; }

  /* Re-usable snippet helpers (model-aware) */
  function drainHowTo(m) {
    return isLite(m)
      ? 'On the Lite, drain it with the bottom drain plug — put a bucket underneath, pull the plug, let it run empty.'
      : 'Drain it with the included hose on the drain port (front on AWA/AWP, top on the AWPR series) into a 3–5&nbsp;gal bucket while you hold the <strong>B2</strong> button.';
  }
  function doubleFillNote(m) {
    return (m === 'pro' || m === 'original' || m === 'unknown')
      ? 'On the two-tank models (Original & Pro), the <em>first</em> fill — or the first fill after a drain — usually takes a few top-offs to fill all the way: fill, wait ~2&nbsp;minutes, fill again. That’s normal; later fills go in one shot.'
      : '';
  }
  function mushroomCapNote() {
    return 'The water in each mist tube should just reach the top of the black mushroom cap on the mist maker — if it’s higher, siphon off the excess.';
  }

  /* ── Decision tree ──────────────────────────────────────────────────────
     node.type: 'question' | 'outcome'
     question: { prompt, help?, quickPicks?:[{label,next}], options:[{label,desc?,icon?,next,setModel?}] }
     outcome:  { title, severity:'fix'|'maintenance'|'support'|'info',
                 lead?, steps:[..]|fn(m), caution?:str|fn(m), note?:str|fn(m),
                 video?:videoKey|[keys], links?:[LINK keys],
                 escalate?:'soft'|'firm', related?:[{label,next}] }            */
  var TREE = {

    /* ── 1. Which model? ──────────────────────────────────────────────── */
    start: {
      type: 'question',
      prompt: 'Which Aquafire do you have?',
      help: 'The model name is on the spec sheet that shipped with it — or check the SKU on the label (under the top lid and on the plate on the back): <strong>AWPR</strong>&nbsp;=&nbsp;Pro, <strong>AWA</strong>&nbsp;=&nbsp;Original, <strong>AWL</strong>&nbsp;=&nbsp;Lite.',
      options: [
        { label: 'Aquafire Pro', icon: '🔥', desc: MODELS.pro.blurb, setModel: 'pro', next: 'category' },
        { label: 'Aquafire Original', icon: '🔥', desc: MODELS.original.blurb, setModel: 'original', next: 'category' },
        { label: 'Aquafire Lite', icon: '🔥', desc: MODELS.lite.blurb, setModel: 'lite', next: 'category' },
        { label: 'I’m not sure', icon: '❓', desc: 'See how to identify your model', setModel: 'unknown', next: 'which_model' }
      ]
    },

    which_model: {
      type: 'outcome', severity: 'info', title: 'Which Aquafire is this?',
      lead: 'No problem — here’s how to tell, and you can keep going either way.',
      steps: [
        'Look for the model/SKU on the silver info plate on the <strong>back</strong> of the insert (you may need to slide the insert out of its enclosure), or on a label <strong>under the top lid</strong>.',
        'The SKU starts with the model code: <strong>AWPR</strong> = Aquafire <strong>Pro</strong> (amber + color LEDs, phone app), <strong>AWA</strong> = Aquafire <strong>Original</strong> (amber LEDs, remote), <strong>AWL</strong> = Aquafire <strong>Lite</strong> (amber LEDs, remote, bottom drain plug). An older "Premium" generation shows up as <strong>AWP</strong>.',
        'Still unsure? Pick "Just show me general help" below — we’ll skip the model-specific bits.'
      ],
      links: ['aSerial'],
      related: [
        { label: 'It’s a Pro', next: 'category', setModel: 'pro' },
        { label: 'It’s an Original', next: 'category', setModel: 'original' },
        { label: 'It’s a Lite', next: 'category', setModel: 'lite' },
        { label: 'Just show me general help', next: 'category', setModel: 'unknown' }
      ]
    },

    /* ── 2. What's wrong? (categories + common-issue quick picks) ──────── */
    category: {
      type: 'question',
      prompt: 'What’s going on with %model%?',
      help: 'Pick a common issue below, or choose the area that fits best.',
      quickPicks: [
        { label: 'Flame is short or uneven', next: 'flame_short_one' },
        { label: 'Beeps, then shuts off', next: 'water_lowbeep' },
        { label: 'Leaking after sitting unused', next: 'water_leak' },
        { label: 'Remote not responding', next: 'remote_dead' },
        { label: 'Phone app won’t connect', next: 'app_entry' },
        { label: 'Flame looks smoky / foggy', next: 'flame_smoky' },
        { label: 'Won’t power on', next: 'power_dead' }
      ],
      options: [
        { label: 'Flame / vapor looks wrong', icon: '🔥', desc: 'Too short, uneven, smoky, foggy, too fast/slow, or no flame', next: 'flame' },
        { label: 'Water, leaks, or filling', icon: '💧', desc: 'Leaks, musty smell, won’t fill, low-water shutoff, water quality', next: 'water' },
        { label: 'Won’t turn on / power', icon: '🔌', desc: 'Dead, flashing power button, buzzing, power-brick light', next: 'power' },
        { label: 'Beeping or warning lights', icon: '🔊', desc: 'Decode the beep pattern and indicator lights', next: 'beep' },
        { label: 'Remote or phone app', icon: '🎛️', desc: 'Remote not working, won’t sync, app won’t connect', next: 'remote' },
        { label: 'LED lights', icon: '💡', desc: 'Lights off, color/amber off, dead cells, flickering', next: 'led' },
        { label: 'Maintenance & cleaning', icon: '🧰', desc: 'How/when to clean, post-clean mist issues, reminder reset, water hardness', next: 'maint' },
        { label: 'Something else', icon: '…', desc: 'Not listed above', next: 'other' }
      ]
    },

    /* ── 3A. Flame ────────────────────────────────────────────────────── */
    flame: {
      type: 'question',
      prompt: 'What’s the flame doing?',
      help: 'Heads-up: most flame problems trace back to scale build-up — if you haven’t cleaned the insert in 3+ months, the <a href="' + LINKS.pmGuide.url + '" target="_blank" rel="noopener">Preventative Maintenance clean</a> is the first thing to try.',
      options: [
        { label: 'Too short — low everywhere', desc: 'Under ~6" tall across all sections', next: 'flame_short_all' },
        { label: 'Short / uneven in one section only', desc: 'One area weak while the rest looks fine', next: 'flame_short_one' },
        { label: 'Smoky or foggy', desc: 'Hazy, low-hanging "cloud" instead of a crisp flame', next: 'flame_smoky' },
        { label: 'No flame at all', desc: 'Unit seems on but no vapor', next: 'flame_none' },
        { label: 'I want to change the flame speed', desc: 'Make the flames move faster or slower', next: 'flame_speed' },
        { label: 'I want to fine-tune it for my room', desc: 'Dial in density, speed, airflow', next: 'flame_tune' }
      ]
    },

    flame_short_all: {
      type: 'outcome', severity: 'fix',
      lead: 'Low flame across the whole unit is almost always airflow or a low setting — work through these:',
      steps: [
        'Check the airflow around the insert: no AC vents, fans, or open doors blowing across it. Air currents stop the vapor from rising and flatten the flame.',
        'Make sure the enclosure has enough air <em>in</em>: Aquafire needs at least <strong>50&nbsp;sq&nbsp;in of intake per 20"</strong> of unit length — through the top vents or, if those are covered, a toe-kick underneath.',
        'Seal any open wall cavities behind or beneath the enclosure — those let the HVAC pull the vapor down (“down-drafting”), which kills flame height and can drown internal parts over time.',
        'On the remote (or phone app on the Pro), press <strong>"+"</strong> on the flame <strong>density / volume</strong> icon to raise the mist output.',
        'If it’s been 3+ months since a cleaning, run the Preventative Maintenance clean — scale on the transducers is the #1 cause of weak flame.'
      ],
      caution: 'Don’t lift the front-fan ring covers more than ~¼" at a time — too much vapor escaping can short the LED strips and internal electronics.',
      links: ['pmGuide', 'aAdjustFlame', 'aFlameApp'],
      escalate: 'soft'
    },

    flame_short_one: {
      type: 'outcome', severity: 'fix',
      lead: 'One weak section usually means high water (a stuck float sensor) or a mist maker that needs cleaning in that tank.',
      steps: function (m) {
        return [
          'Take off the top lid and open the mist-maker tank for the weak section. (There’s <strong>1 tank per 20"</strong> — a 20" has 1, a 40" has 2, a 60" has 3.)',
          mushroomCapNote() + ' Compare it to a section that’s working — the weak one is often higher.',
          'Agitate that mist maker: lift and plunge the rack vigorously <strong>10–15 times</strong> so you hear it splashing — that frees a float sensor stuck in the up position.',
          'Run the unit and re-check that the level holds at the mushroom-cap height.',
          'Still weak? The mist-maker disc may need cleaning — a few drops of white vinegar on the white disc for a few minutes, or a 10–20&nbsp;min vinegar soak for heavier scale (soft brush only, never a Scotch-brite pad). Clean all of them while you’re in there. See the cleaning guide.'
        ];
      },
      note: 'For a few days after a deep clean, mild mist issues are normal — leftover debris keeps sloughing off. If it persists, flush the tank and re-agitate the rack.',
      video: ['locateMistMaker', 'cleanMM1', 'cleanMM2'],
      links: ['pmGuide', 'generalClean', 'aFlameLow'],
      escalate: 'soft'
    },

    flame_smoky: {
      type: 'outcome', severity: 'fix',
      lead: 'A hazy / "cloudy" flame comes from too much vapor for the room — humidity, airflow, or the front-fan sponge filters. Try these in order:',
      steps: function (m) {
        var s = [
          'If it’s just a touch too "smoky", press <strong>"−"</strong> on the flame <strong>density / volume</strong> icon to generate less mist.',
          'Lower the room humidity — close doors, adjust the HVAC. High humidity makes the vapor hang as fog instead of rising.',
          'Check the front-fan sponge filters are fully seated in their holders. Even ¼" too high pushes out too much vapor (and can damage internals). There’s <strong>1 filter per 20"</strong>.'
        ];
        if (m === 'pro' || m === 'original' || m === 'unknown') {
          s.push('Newer Aquafire / Aquafire Pro units shipped with a <em>thinner</em> sponge filter to boost flame height — it’s not a universal fit and can cause the foggy look. Email <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a> with your serial number and size (20"/40"/60") to request thicker filters (free under warranty). As a quick test, tape a small piece of paper or painter’s tape over the bottom half of the sponge — if the fog clears, that’s your culprit.');
        } else {
          s.push('As a quick test, tape a small piece of paper or painter’s tape over the bottom half of the front sponge — if the fog clears, the filter’s the culprit; contact support about a replacement.');
        }
        s.push('Fine-tune density and speed for your space — set both to the lowest (press "−" until the beeping stops), then nudge each up separately until it looks right.');
        return s;
      },
      caution: 'Never lift the sponge-filter ring more than ~¼" — a flood of extra vapor can damage the light strips and electrical connections.',
      video: ['spongeTest'],
      links: ['aFlameSmoky', 'aAdjustFlame'],
      escalate: 'soft'
    },

    flame_none: {
      type: 'question',
      prompt: 'No flame at all — is the unit otherwise running (lights on, fans humming)?',
      options: [
        { label: 'No — it seems dead / won’t power on', next: 'power_dead' },
        { label: 'It’s beeping', next: 'beep' },
        { label: 'Yes — powered and quiet, just no vapor', next: 'flame_none_powered' }
      ]
    },

    flame_none_powered: {
      type: 'outcome', severity: 'fix',
      lead: 'Powered, quiet, but no mist — the mist makers aren’t producing. Usual causes: water level too high (stuck float), a dirty mist maker, or no water at all.',
      steps: function (m) {
        return [
          'First, confirm there’s water in the tank. If it’s low/empty, refill it. ' + doubleFillNote(m),
          'Take off the top lid and open each mist-maker tank (1 per 20"). ' + mushroomCapNote(),
          'Agitate each mist maker — lift and plunge the rack <strong>10–15 times</strong> — to free a stuck float sensor.',
          'Check each mist maker disc for scale/sludge; clean with white vinegar if it’s coated (soft brush only). Reconnect the power feed firmly and push the wire all the way down the slot before re-capping.',
          'Run the unit and watch for vapor. If it just came back from a clean, give it a couple days — debris can keep clearing.'
        ];
      },
      video: ['locateMistMaker', 'cleanMM1', 'cleanMM2', 'agitateFloat'],
      links: ['pmGuide', 'generalClean', 'aFlameLow'],
      escalate: 'soft'
    },

    flame_speed: {
      type: 'outcome', severity: 'fix',
      lead: 'Flame speed is a separate control from flame density — here’s how to change it:',
      steps: [
        'On the remote (or the phone app on the Pro), find the flame <strong>speed</strong> icon — the curved-arrow/swoosh, separate from the flame (density) icon.',
        'Press <strong>"−"</strong> to slow the flames down, <strong>"+"</strong> to speed them up.',
        'To reset to the slowest setting, press "−" until the beeping stops — that’s the floor — then nudge up from there.'
      ],
      links: ['aAdjustFlame'],
      escalate: false
    },

    flame_tune: {
      type: 'outcome', severity: 'fix',
      lead: 'Every room has its own airflow and humidity, so the Aquafire is meant to be tuned to your space. Work through these:',
      steps: [
        'Set <strong>density</strong> and <strong>speed</strong> to their lowest — press "−" until the beeping stops on each — then raise them <em>separately</em> until it looks right.',
        'Check room humidity: high humidity makes a foggy effect. Lower it via the HVAC if needed.',
        'Check airflow: is an HVAC vent pointed at the unit? A door opening and closing nearby? Does the vapor get sucked down when the HVAC kicks on (down-drafting)? Redirect air currents and seal open wall cavities behind/under the enclosure — stray vapor pushed onto the insert can cause electrical shorts over time.',
        'Check the ring-lift covers over the front fans: make sure they’re fully seated. You <em>can</em> lift them a centimeter at a time to tweak the flame — but go slowly.'
      ],
      caution: 'Lifting the front-fan ring covers even ¼" can release an excess of vapor and cause internal damage — adjust with caution.',
      links: ['aAdjustFlame', 'aFlameSmoky'],
      escalate: false
    },

    /* ── 3B. Water ────────────────────────────────────────────────────── */
    water: {
      type: 'question',
      prompt: 'What’s the water issue?',
      options: [
        { label: 'It’s leaking', desc: 'Water escaping or pooling', next: 'water_leak' },
        { label: 'Beeps, then shuts off', desc: 'Two quick beeps and it powers down', next: 'water_lowbeep' },
        { label: 'Musty or stale smell', desc: 'Off smell while running', next: 'water_smell' },
        { label: 'Won’t fill / pump not working', desc: 'Manual fill or direct-plumb trouble', next: 'water_fill' },
        { label: 'What water should I use / how much?', desc: 'Tap vs. distilled, hardness, draining', next: 'water_quality' }
      ]
    },

    water_leak: {
      type: 'outcome', severity: 'fix',
      lead: 'A leak is usually water level creeping too high in a mist tube — most often a stuck float sensor, sometimes over-filling or vapor escaping past a lifted fan cover.',
      steps: function (m) {
        return [
          'Power the unit off and dry up any pooled water before doing anything else — standing water can reach the LED connections and electronics.',
          'Take off the top lid and open each mist-maker tank (1 per 20"). ' + mushroomCapNote(),
          'Siphon off any excess down to the mushroom-cap level (a ¼" siphon hose, turkey baster, or sponge works — nothing that flakes off).',
          'Agitate each mist maker — lift and plunge the rack <strong>10–15 times</strong> — to free a float sensor stuck in the up position.',
          'Run the unit and watch that the level holds. Also reseat the front-fan covers — a cover lifted too high lets vapor escape and condense.',
          'When manually filling, stop at the auto-cutoff and don’t top it off past that — over-filling pushes water out the front fans.'
        ];
      },
      caution: 'A persistent leak can drip onto the LED connections and short them. If it keeps leaking, drain the unit fully and submit a service request before running it again.',
      video: ['agitateFloat'],
      links: ['aWater', 'aFlameLow', 'pmGuide'],
      escalate: 'firm'
    },

    water_lowbeep: {
      type: 'outcome', severity: 'fix',
      lead: 'Two quick beeps every couple seconds, then it shuts off = low / no water. (If yours has indicator lights, it’s the "Low / No Water" alert.)',
      steps: function (m) {
        var s = [
          'Refill the tank. ' + doubleFillNote(m),
          'If it’s direct-plumbed, check the water feed / shutoff valve is actually open' + (m === 'original' ? ' and the Direct Plumb Kit is connected correctly' : '') + '.',
          'Still beeping "low" after a full fill? A float sensor may be stuck — take off the top lid, open the mist tanks, and agitate each rack <strong>10–15 times</strong>.'
        ];
        if (isLite(m)) s.push('Note: the 40" and 60" Lite are manual-fill only — there’s no direct-plumb option on those.');
        return s;
      },
      video: ['beepLowWater'],
      links: ['aBeep', 'aWater'],
      escalate: 'soft'
    },

    water_smell: {
      type: 'outcome', severity: 'maintenance',
      lead: 'A musty/stale smell is almost always old water — common after the unit’s sat unused.',
      steps: [
        'Drain the tank completely and refill with fresh water.',
        'If the smell lingers, run a Preventative Maintenance clean — a vinegar soak of the mist makers and lower tanks (see the guide). A Vapor Pure softener also helps with chlorine and odors.',
        'Going forward: don’t leave water sitting in an idle unit — drain it if you won’t run it for more than about a week (stagnant water also clogs the level sensors).'
      ],
      links: ['pmGuide', 'generalClean', 'aWater'],
      escalate: false
    },

    water_fill: {
      type: 'outcome', severity: 'fix',
      lead: 'Filling trouble — here’s the manual-fill procedure and the things that trip people up:',
      steps: function (m) {
        var s = [
          'Manual fill: put the filter end of the fill tube into your water source, connect the other end to the water inlet port, and <strong>press and hold the B1 button for 5 seconds</strong> (or the "fill" button on the remote / phone app). The pump runs and stops automatically when the tank is full.',
          doubleFillNote(m) || 'If the pump stops almost immediately on the first fill after a drain, just run it again — it may take a couple cycles to prime.',
          'Pump runs but no water moves? Make sure the tube isn’t kinked and the filter end stays fully submerged.'
        ];
        if (m === 'original') s.push('Direct-plumbed: check the shutoff valve is open and the Direct Plumb Kit is installed per its instructions (a bad install can leak and voids the warranty).');
        else if (m === 'pro') s.push('Direct-plumbed: check the 1/4" line and shutoff valve — filling starts automatically when the unit is turned on.');
        else if (isLite(m)) s.push('The Lite 40" and 60" are manual-fill only — there’s no direct-plumb option; the 20" can take a Direct Plumb Kit.');
        return s;
      },
      links: ['aWater'],
      escalate: 'soft'
    },

    water_quality: {
      type: 'outcome', severity: 'info',
      lead: 'Quick water rules:',
      steps: [
        'Use clean tap water — and the <strong>softer, the better</strong>. Hard water’s minerals scale up the mist makers and shorten their life; the Vapor Pure softener conditions the water automatically.',
        'Have <strong>reverse-osmosis water or a whole-house softener</strong>? Ideal — that’s the softest water you can feed it. (Using a whole-house system <em>instead of</em> Vapor Pure? Have it approved in writing by Aquafire to keep the warranty valid.)',
        '<strong>Don’t</strong> use well, rain, or cistern water, or anything scented or with additives.',
        'Hard water leaves scale on the transducers and tank walls — descale roughly every 3 months and consider the Vapor Pure softener (it’s included free with the Pro and with the Original’s Direct Plumb Kit, and must be installed and running to keep the warranty valid).',
        'If you won’t run the unit for more than about a week, drain it — stagnant water clogs the level sensors and causes leaks.'
      ],
      links: ['waterCare', 'generalClean', 'pmGuide'],
      escalate: false
    },

    /* ── 3C. Power ────────────────────────────────────────────────────── */
    power: {
      type: 'question',
      prompt: 'When you press the power button, what happens?',
      options: [
        { label: 'Nothing at all — totally dead', next: 'power_dead' },
        { label: 'It comes on, then the power button flashes and it shuts right off', next: 'power_flash_off' },
        { label: 'It seems to have power but there’s a buzzing sound', next: 'power_buzz' },
        { label: 'The light on the power brick is RED', next: 'power_red' },
        { label: 'The light on the power brick is GREEN, but it still won’t turn on', next: 'power_green_no_on' }
      ]
    },

    power_dead: {
      type: 'outcome', severity: 'fix',
      lead: 'Totally dead — start with the power chain:',
      steps: [
        'Check the power supply is fully plugged in at all three points: the wall outlet, the back of the unit (the 90° fitting), and the power brick itself.',
        'Look for a green LED on the power brick — that confirms it’s getting power.',
        'No green LED? Test that outlet with another device, and check your breaker panel for a tripped breaker.',
        'Plug straight into a grounded wall outlet — no power strips, extension cords, or dimmers.',
        'Green LED is on but the unit still won’t turn on → that’s likely a blown internal fuse. Contact support.'
      ],
      links: ['aPower'],
      escalate: 'firm'
    },

    power_flash_off: {
      type: 'outcome', severity: 'support',
      lead: 'Power button flashing then shutting off usually means an internal component was knocked loose or damaged — often during shipping.',
      steps: [
        'Try a different known-good grounded outlet first, just to rule out the outlet.',
        'If it still flashes and shuts off, this isn’t a field-adjustable fix — contact Technical Support so they can diagnose it. They’ll walk you through it remotely, and if it’s covered they’ll ship the part with a how-to video.'
      ],
      links: ['aPower'],
      escalate: 'firm'
    },

    power_buzz: {
      type: 'outcome', severity: 'fix',
      lead: 'A buzzing sound is usually a connection issue at the power input.',
      steps: [
        'Check the 90° power fitting on the <strong>back of the unit</strong> is pushed in securely.',
        'If it’s seated and the buzz continues, the wall outlet may be loose — try a different known-good grounded outlet.',
        'Still buzzing? That points to the power adapter or wiring — contact support.'
      ],
      links: ['aPower'],
      escalate: 'firm'
    },

    power_red: {
      type: 'outcome', severity: 'support',
      lead: 'A red light on the power brick means the power supply has been damaged.',
      steps: [
        'Stop using it — don’t keep running the unit on a damaged adapter.',
        'Contact support for a replacement adapter (email <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a> or call ' + SUPPORT_PHONE + ').'
      ],
      links: ['aPower'],
      escalate: 'firm'
    },

    power_green_no_on: {
      type: 'outcome', severity: 'support',
      lead: 'Green light on the brick (so it’s powered) but the unit won’t come on usually means the internal fuse has blown.',
      steps: [
        'Double-check the 90° fitting at the back of the unit is fully seated.',
        'If it is and it still won’t turn on, contact Technical Support — they’ll diagnose it and, if it’s covered, send the part.'
      ],
      links: ['aPower'],
      escalate: 'firm'
    },

    /* ── 3D. Beeping / lights ─────────────────────────────────────────── */
    beep: {
      type: 'question',
      prompt: 'Don’t worry — the beeps mean it’s telling you something. What’s the pattern (and what are the lights doing)?',
      help: isLiteHelp(),
      options: [
        { label: 'Two quick beeps every couple seconds, then it shuts off', desc: 'Low / No Water', next: 'water_lowbeep' },
        { label: 'Three long beeps every second + lights cycling/flashing, then it shuts off', desc: 'Overflow / High Water', next: 'beep_overflow' },
        { label: 'One short beep every couple seconds', desc: 'Voltage / power adapter', next: 'beep_voltage' },
        { label: 'Lights flash for ~30 seconds, no beeping', desc: 'Maintenance reminder', next: 'beep_maintenance' },
        { label: 'It beeps while I’m turning a setting down', desc: 'You’ve hit the minimum', next: 'beep_min_setting' },
        { label: 'Some other pattern / not sure', next: 'beep_other' }
      ]
    },

    beep_overflow: {
      type: 'outcome', severity: 'fix',
      lead: 'Three long beeps + cycling/flashing lights then shutoff is the overflow / high-water protection (on the AWA2 / AWPR2 generations). If it isn’t actually overflowing, it’s almost always a stuck float sensor reading the level too high.',
      steps: function (m) {
        return [
          'Take off the top lid and open each mist-maker tank (1 per 20"). ' + mushroomCapNote(),
          'Siphon off any excess down to the mushroom-cap level.',
          'Agitate each mist maker — lift and plunge the rack <strong>10–15 times</strong> — to unstick the float sensor.',
          'Run the unit and confirm the level holds.',
          'If it just came back from a deep clean, expect this for a couple days while debris finishes sloughing off — flush the tank and re-agitate. If it keeps tripping, submit a service request.'
        ];
      },
      video: ['beepOverflow', 'agitateFloat'],
      links: ['aBeep', 'aFlameLow', 'pmGuide'],
      escalate: 'firm'
    },

    beep_voltage: {
      type: 'outcome', severity: 'fix',
      lead: 'One short beep every couple seconds is a voltage alert — usually the AC power adapter.',
      steps: [
        'Check the adapter is fully plugged in: at the wall outlet, at the back of the unit, and at the power block.',
        'Use a grounded wall outlet — no power strips, extension cords, or dimmers.',
        'If everything’s tight and it keeps beeping, the adapter is likely faulty — contact <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a> for a replacement.'
      ],
      video: ['beepVoltage'],
      links: ['aBeep', 'aPower'],
      escalate: 'firm'
    },

    beep_maintenance: {
      type: 'outcome', severity: 'maintenance',
      lead: function (m) {
        return isLite(m)
          ? 'The Aquafire Lite doesn’t use light-indicator codes or a maintenance reminder — so flashing lights with no beep is unexpected on a Lite. Try a power-cycle (unplug ~30&nbsp;s); if it keeps flashing oddly, contact support. (If you actually meant a different model, jump back and re-pick.)'
          : 'Lights flashing for ~30 seconds with no beep is the maintenance reminder — it’s due for a preventative cleaning.';
      },
      steps: function (m) {
        if (isLite(m)) return ['Unplug the unit for ~30 seconds, then plug it back in.', 'If the odd flashing continues, contact support — they can help diagnose it.'];
        return [
          'Run the Preventative Maintenance clean: mist makers every 3 months (vinegar on the disc, or a 10–20&nbsp;min soak for heavier scale), and a whole-system vinegar flush every 6 months. See the Maintenance Guide.',
          'Reset the reminder: press and hold the <strong>middle and left buttons together</strong> on the unit.'
        ];
      },
      links: ['pmGuide', 'generalClean'],
      escalate: false
    },

    beep_min_setting: {
      type: 'outcome', severity: 'info',
      lead: 'That’s normal — not a fault.',
      steps: [
        'When you press <strong>"−"</strong> on the flame density or speed and you’ve reached the lowest setting, the unit beeps to tell you it can’t go any lower.',
        'Just stop pressing "−". To tune from there, nudge it back up with "+".'
      ],
      links: ['aAdjustFlame'],
      escalate: false
    },

    beep_other: {
      type: 'outcome', severity: 'support',
      lead: 'If the pattern doesn’t match one of the standard alerts, it’s worth getting eyes on it.',
      steps: [
        'Try a power-cycle first: unplug the unit for ~30 seconds, then plug it back in.',
        'Note exactly what the beeps and lights are doing (timing, how many, which lights) — that helps a lot.',
        'Then contact Technical Support — they can decode it and walk you through next steps.'
      ],
      links: ['aBeep'],
      escalate: 'firm'
    },

    /* ── 3E. Remote / app ─────────────────────────────────────────────── */
    remote: {
      type: 'question',
      prompt: 'Remote control, or the phone app?',
      options: [
        { label: 'The remote control', next: 'remote_q' },
        { label: 'The phone app', desc: 'AFIRE / AFIREWATER Prestige app', next: 'app_entry' }
      ]
    },

    /* app_entry is a routing node — resolveNext() sends Pro -> app_connect, others -> app_not_pro */
    app_entry: { type: 'router', resolve: function (m) { return isPro(m) || m === 'unknown' ? 'app_connect' : 'app_not_pro'; } },

    remote_q: {
      type: 'question',
      prompt: 'What’s the remote doing?',
      options: [
        { label: 'Won’t turn the fireplace on or off at all', next: 'remote_dead' },
        { label: 'Turns it on/off, but flame/color buttons don’t do anything', next: 'remote_partial' },
        { label: 'Tried everything — still nothing', next: 'remote_broken' }
      ]
    },

    remote_dead: {
      type: 'outcome', severity: 'fix',
      lead: 'Remote not controlling the unit — it’s almost always the battery or a lost pairing.',
      steps: [
        'Swap in a fresh <strong>CR-2032 lithium</strong> coin battery.',
        'Re-pair the remote: press and hold the <strong>On/Off button on the unit</strong> for about 5 seconds until it starts flashing, then press any button on the remote — you’ll hear a beep confirming it’s paired. (The same trick pairs one remote to multiple units.)',
        'Still nothing after a fresh battery and re-pair → the remote may be faulty; contact support.'
      ],
      links: ['aRemote'],
      escalate: 'soft'
    },

    remote_partial: {
      type: 'outcome', severity: 'fix',
      lead: 'On/off works but the other buttons don’t — usually a weak battery or, on the Pro, a light mode that’s switched off.',
      steps: function (m) {
        var s = [
          'Even if on/off still works, a low battery can be too weak for the other commands — put in a fresh <strong>CR-2032 lithium</strong>.',
          'Re-pair: hold the unit’s On/Off button ~5&nbsp;s until it flashes, then press any remote button (wait for the beep).'
        ];
        if (isPro(m) || m === 'unknown') {
          s.push('On the Pro, the light buttons only do what’s currently "on": the <strong>RGB lights button must be on</strong> to change colors, and the <strong>orange/amber lights button</strong> controls the warm strip. Toggle those on first.');
        }
        s.push('Still unresponsive after that → contact support.');
        return s;
      },
      links: function (m) { return (isPro(m) || m === 'unknown') ? ['aRemote', 'aLightAWPR'] : ['aRemote']; },
      escalate: 'soft'
    },

    remote_broken: {
      type: 'outcome', severity: 'support',
      lead: 'If you’ve replaced the battery and re-paired and it still won’t work, the remote is likely malfunctioning.',
      steps: [
        'One last check: confirm the new battery is a CR-2032 and is seated the right way up.',
        'Then contact support — replacement remotes are available. (Heads-up: remotes are a wear item, so warranty coverage on them is limited to the first 90 days.)'
      ],
      links: ['aRemote', 'replacementParts'],
      escalate: 'firm'
    },

    app_connect: {
      type: 'outcome', severity: 'fix',
      lead: 'The phone app is the Pro’s AFIRE / AFIREWATER Prestige app. Two things matter most: the right Wi-Fi band, and doing the setup in exact order.',
      steps: [
        'The Pro only joins a <strong>2.4 GHz</strong> Wi-Fi network (it uses a 3G/2.4 GHz card). On a combined 2.4/5 GHz router, split out the 2.4 GHz band or connect to the 2.4 GHz network name — not the 5 GHz one.',
        'Follow the app setup <strong>in exact order</strong>: download the app first, <em>then</em> connect. Doing steps out of sequence is the #1 cause of failed connections — the step-by-step is in the Owner’s Manual (pages 9–10) and the "How to Connect the AFIRE App" video.',
        'If it still won’t connect after that, contact support.'
      ],
      video: ['appConnect'],
      links: ['aApp'],
      escalate: 'soft'
    },

    app_not_pro: {
      type: 'outcome', severity: 'info',
      lead: 'The smartphone app is a Pro-only feature.',
      steps: [
        'The Aquafire Original and Aquafire Lite are controlled with the included remote and the buttons on the unit — there’s no app for those models.',
        'If your remote isn’t working, here’s remote troubleshooting instead.'
      ],
      related: [{ label: 'Troubleshoot the remote', next: 'remote_q' }],
      links: ['aRemote'],
      escalate: false
    },

    /* ── 3F. LED lights ───────────────────────────────────────────────── */
    led: {
      type: 'question',
      prompt: 'What are the LED lights doing?',
      help: function (m) {
        return isPro(m)
          ? 'The Pro has two strips: a warm/amber one and an RGB color one, each with its own on/off on the remote and app.'
          : (isLite(m) || m === 'original')
            ? 'The ' + modelName(m) + ' has a single warm/amber light strip — there’s no color control on this model.'
            : '';
      },
      options: [
        { label: 'No lights at all when the unit is on', next: 'led_none' },
        { label: 'Just the warm / amber lights are off', next: 'led_amber' },
        { label: 'Just the colored (RGB) lights are off', next: 'led_rgb' },
        { label: 'A few individual LED cells are dead on a strip', next: 'led_cells' },
        { label: 'They worked before — now they’re dead or flickering', next: 'led_shorted' }
      ]
    },

    led_none: {
      type: 'outcome', severity: 'fix',
      lead: 'No lights at all — start with the connections.',
      steps: function (m) {
        var s = [
          'Open the top and check the light-strip connections — especially the connector on the <strong>right end of each strip</strong> — and push it firmly home.'
        ];
        if (isPro(m) || m === 'unknown') s.push('Make sure the lights are actually switched on — on the Pro the orange/amber and RGB light buttons (remote or app) toggle them.');
        s.push('Still dark after reseating the connectors → the light strip or LED driver card may have failed; contact support.');
        return s;
      },
      links: function (m) { return isPro(m) ? ['aLightsOff', 'aLightAWPR'] : ['aLightsOff', 'aLightAWA']; },
      escalate: 'firm'
    },

    led_amber: {
      type: 'outcome', severity: 'fix',
      lead: function (m) {
        return (isPro(m) || m === 'unknown')
          ? 'On the Pro the warm/amber strip has its own on/off.'
          : 'On ' + modelNameThe(m) + ', the warm/amber strip is the only light strip.';
      },
      steps: function (m) {
        var s = [];
        if (isPro(m) || m === 'unknown') s.push('Make sure the <strong>orange/amber lights button</strong> on the remote (or in the app) is switched on.');
        s.push('Reseat the connector on the <strong>right end</strong> of the amber strip — push it all the way in.');
        s.push('If it still won’t light, the strip or LED driver card may have failed — contact support.');
        return s;
      },
      links: function (m) { return isPro(m) ? ['aLightAWPR'] : ['aLightAWA', 'aLightsOff']; },
      escalate: 'firm'
    },

    led_rgb: {
      type: 'outcome',
      severity: function (m) { return (isPro(m) || m === 'unknown') ? 'fix' : 'info'; },
      lead: function (m) {
        return (isPro(m) || m === 'unknown')
          ? 'The Pro’s RGB color strip has its own on/off, separate from the amber strip.'
          : 'Color LEDs are a Pro feature — ' + modelNameThe(m) + ' has a fixed warm/amber light strip and no color control.';
      },
      steps: function (m) {
        if (!isPro(m) && m !== 'unknown') return ['There’s nothing to switch on — this model doesn’t have colored LEDs.', 'If your <em>amber</em> lights aren’t coming on, use the amber-light troubleshooting instead.'];
        return [
          'The <strong>RGB lights button</strong> has to be on to use the color LEDs (and to pick colors) — turn it on via the remote or app.',
          'Reseat the connector on the <strong>right end</strong> of the RGB strip.',
          'If RGB is on and the colored strip still won’t light, the strip or LED driver card may have failed — contact support.'
        ];
      },
      related: function (m) { return (!isPro(m) && m !== 'unknown') ? [{ label: 'Amber lights won’t turn on', next: 'led_amber' }] : null; },
      links: function (m) { return (isPro(m) || m === 'unknown') ? ['aLightAWPR'] : ['aLightAWA']; },
      escalate: function (m) { return (isPro(m) || m === 'unknown') ? 'firm' : false; }
    },

    led_cells: {
      type: 'outcome', severity: 'support',
      lead: 'If just a few cells on an otherwise-working strip are out, that strip has a fault — it isn’t field-adjustable.',
      steps: [
        'Reseat the connector on the right end of that strip first, just in case.',
        'If the dead cells stay dead, contact support. LED strips are a wear item — replacements are sold on the parts page, and in a vapor environment they do degrade over time (warranty coverage on LEDs is limited to setup / the first 90 days).'
      ],
      links: ['aLightsOff', 'replacementParts'],
      escalate: 'firm'
    },

    led_shorted: {
      type: 'outcome', severity: 'support',
      lead: 'A strip that used to work and has now died has most likely shorted out — LEDs are a wear item in a vapor environment.',
      steps: [
        'Reseat the right-end connector first — occasionally it’s just a loose connection.',
        'If it’s genuinely dead, the strip needs replacing (sold on the replacement-parts page).',
        'To stop it happening again, fix what’s drowning the connection: <em>excess vapor settling on it</em> — redirect strong air currents, seal open wall cavities behind/under the enclosure to stop down-drafting, don’t run the unit 24/7, lower the density/speed, and tune the flame for your room; <em>scale buildup</em> — clean regularly and consider a Vapor Pure softener; and <em>water leaking onto it</em> from over-filling.'
      ],
      links: ['aLightsOff', 'replacementParts', 'pmGuide'],
      escalate: 'firm'
    },

    /* ── 3G. Maintenance ──────────────────────────────────────────────── */
    maint: {
      type: 'question',
      prompt: 'What do you need?',
      options: [
        { label: 'How / how often do I clean it?', next: 'maint_how' },
        { label: 'Mist got worse right after I cleaned it', next: 'maint_post_clean' },
        { label: 'How do I reset the maintenance reminder?', next: 'maint_reset' },
        { label: 'Water hardness / softener questions', next: 'water_quality' }
      ]
    },

    maint_how: {
      type: 'outcome', severity: 'maintenance',
      lead: 'Two routines — a quick mist-maker clean every 3 months, and a full vinegar flush every 6 months. (Run roughly 20&nbsp;hrs/week with moderately hard water; do it more often with harder water or heavy use.)',
      steps: function (m) {
        return [
          '<strong>Mist makers (every 3 months):</strong> turn the unit off, unplug the mist-maker wire at each large round mist-tube housing, lift out the racks. Light scale → a few drops of white vinegar on the white disc, wait a few minutes, rinse. Heavier scale → unscrew the 4 screws holding the mist maker to the rack and soak the mist maker (not the power cord) in white vinegar for 10–20&nbsp;min, then rinse. Use a soft toothbrush only — <strong>never a stiff brush or Scotch-brite pad</strong>. Reattach, drop the rack back in, and push the power wire all the way down the slot before re-capping.',
          '<strong>Whole system (every 6 months):</strong> turn off the water feed if direct-plumbed. ' + drainHowTo(m) + ' After draining there’ll still be a little water in the lower tanks — remove it with a small siphon, turkey baster, or sponge (nothing that flakes).',
          'Add about ½&nbsp;gallon of white vinegar (via the fill hose + B1, or pour it straight into the mist tubes) until it sits ~2" above the mist maker. Don’t overfill — it’ll leak out the front fans. Let it soak 10–20&nbsp;min. <strong>Don’t run the unit during the soak.</strong>',
          'Before draining the vinegar, agitate each lower tank — raise and lower the mist rack vigorously <strong>10–15 times</strong> to break up residue on the float sensors. Then drain the vinegar (hose + B2).',
          'Refill with fresh water, then <strong>fill and drain the whole system twice more</strong> to flush out all the vinegar. On the third fill, run it normally.',
          'Heads-up: for 2–3 days after a deep clean, mild mist issues are normal — debris keeps sloughing off. Cleaning more regularly prevents it.'
        ];
      },
      video: ['cleanMM1', 'cleanMM2', 'locateMistMaker'],
      links: ['pmGuide', 'generalClean'],
      escalate: false
    },

    maint_post_clean: {
      type: 'outcome', severity: 'info',
      lead: 'That’s expected — not a new problem.',
      steps: [
        'For 2–3 days (sometimes longer) after a deep vinegar clean, leftover debris keeps breaking loose, which can make the mist look off.',
        'If it persists: open the mist tubes, check for debris, and re-agitate the mist rack and float sensor (raise/lower it 10–15 times).',
        'If it’s still cloudy after that, flush the water out to clear the debris, or run another full clean.',
        'The more regularly you clean, the less delayed debris you’ll get — it settles down once you’re on a schedule.'
      ],
      links: ['pmGuide', 'generalClean'],
      escalate: false
    },

    maint_reset: {
      type: 'outcome',
      severity: function (m) { return isLite(m) ? 'info' : 'maintenance'; },
      lead: function (m) {
        return isLite(m)
          ? 'The Aquafire Lite doesn’t have a maintenance-reminder indicator, so there’s nothing to reset on a Lite.'
          : 'The reminder is the lights flashing for ~30 seconds with no beep.';
      },
      steps: function (m) {
        if (isLite(m)) return ['Just keep up the cleaning schedule — mist makers every 3 months, full flush every 6.', 'If your Lite is flashing oddly, it isn’t the maintenance reminder — try a power-cycle and contact support if it continues.'];
        return [
          'Press and hold the <strong>middle and left buttons together</strong> on the unit to clear the reminder.',
          'If it’s due, do the cleaning first (see the Maintenance Guide), then reset.'
        ];
      },
      links: ['pmGuide'],
      escalate: false
    },

    /* ── 3H. Something else ───────────────────────────────────────────── */
    other: {
      type: 'outcome', severity: 'support',
      lead: 'Didn’t see it above? A few catch-all things worth trying:',
      steps: [
        'Power-cycle the unit — unplug it for ~30 seconds, then plug it back in.',
        'Make sure it’s getting enough air (≥50&nbsp;sq&nbsp;in of intake per 20" of length) and isn’t being hit by drafts from HVAC vents, fans, or doors.',
        'If it hasn’t been cleaned in 3+ months, run a Preventative Maintenance clean — a surprising number of issues trace back to scale.',
        'Operating conditions: indoor only, 50–100°F, 30–60% humidity, grounded outlet (no power strips/extensions/dimmers), and drain it if you won’t use it for more than ~7 days.',
        'Still stuck? Aquafire Technical Support will walk you through it.'
      ],
      links: ['pmGuide', 'enclosureGuide', 'aPower'],
      escalate: 'firm'
    }
  };

  function isLiteHelp() {
    return 'On the Aquafire <strong>Lite</strong> the beeps are the same, but it has no indicator-light codes and no maintenance reminder. The Original and Pro have both lights and beeps.';
  }

  /* ── State + nav ────────────────────────────────────────────────────── */
  var state = { model: null };
  var nav = []; // [{ node: 'id', choice: 'label shown in breadcrumb' | null }]
  var root, contentEl;

  function val(v, m) { return typeof v === 'function' ? v(m) : v; }

  function resolveNext(id) {
    var n = TREE[id];
    if (n && n.type === 'router') return resolveNext(n.resolve(state.model || 'unknown'));
    return id;
  }

  function go(nodeId, choiceLabel, setModel) {
    if (setModel) state.model = setModel;
    var id = resolveNext(nodeId);
    nav.push({ node: id, choice: choiceLabel || null });
    render();
    scrollAppIntoView();
  }

  function back() { if (nav.length > 1) { nav.pop(); render(); scrollAppIntoView(); } }

  function jumpToCrumb(i) { nav = nav.slice(0, i + 1); render(); scrollAppIntoView(); }

  function restart() {
    state.model = null;
    nav = [{ node: 'start', choice: null }];
    // strip query params so a refresh starts clean
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    render();
    scrollAppIntoView();
  }

  function scrollAppIntoView() {
    if (!root) return;
    var top = root.getBoundingClientRect().top + window.pageYOffset - 72;
    if (window.pageYOffset > top + 4 || root.getBoundingClientRect().top < 0) {
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function modelTag() {
    return state.model && state.model !== 'unknown'
      ? '<span class="ts-model-tag">' + esc(MODELS[state.model].name) + '</span>'
      : '';
  }

  function fillModel(str) {
    return String(str).replace(/%model%/g, state.model && state.model !== 'unknown' ? esc(MODELS[state.model].name) : 'your Aquafire');
  }

  function breadcrumbHTML() {
    var crumbs = [];
    for (var i = 0; i < nav.length; i++) {
      if (nav[i].choice) crumbs.push({ i: i, label: nav[i].choice });
    }
    if (!crumbs.length) return '';
    var html = '<nav class="ts-crumbs" aria-label="Your answers so far">';
    html += '<button type="button" class="ts-crumb" data-crumb="0">Start over</button>';
    for (var j = 0; j < crumbs.length; j++) {
      var last = j === crumbs.length - 1;
      html += '<span class="ts-crumb-sep">›</span>';
      html += last
        ? '<span class="ts-crumb ts-crumb-current">' + esc(crumbs[j].label) + '</span>'
        : '<button type="button" class="ts-crumb" data-crumb="' + crumbs[j].i + '">' + esc(crumbs[j].label) + '</button>';
    }
    html += '</nav>';
    return html;
  }

  function controlsHTML() {
    var html = '<div class="ts-controls">';
    if (nav.length > 1) html += '<button type="button" class="ts-btn ts-btn-ghost" data-act="back">← Back</button>';
    if (nav.length > 1) html += '<button type="button" class="ts-btn ts-btn-ghost" data-act="restart">↺ Start over</button>';
    html += '</div>';
    return html;
  }

  function optionsHTML(opts, attr) {
    var html = '<div class="ts-options">';
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      html += '<button type="button" class="ts-option" ' + attr + '="' + i + '">'
        + (o.icon ? '<span class="ts-option-icon" aria-hidden="true">' + o.icon + '</span>' : '')
        + '<span class="ts-option-text"><span class="ts-option-label">' + fillModel(o.label) + '</span>'
        + (o.desc ? '<span class="ts-option-desc">' + fillModel(o.desc) + '</span>' : '')
        + '</span><span class="ts-option-arrow" aria-hidden="true">→</span></button>';
    }
    html += '</div>';
    return html;
  }

  function quickPicksHTML(picks) {
    var html = '<div class="ts-quick"><span class="ts-quick-label">Common issues:</span><div class="ts-quick-chips">';
    for (var i = 0; i < picks.length; i++) {
      html += '<button type="button" class="ts-chip" data-quick="' + i + '">' + fillModel(picks[i].label) + '</button>';
    }
    html += '</div></div>';
    return html;
  }

  function renderQuestion(node) {
    var html = '';
    html += breadcrumbHTML();
    html += '<div class="ts-card ts-question">';
    html += '<h2 class="ts-q-prompt">' + fillModel(node.prompt) + '</h2>';
    var help = val(node.help, state.model);
    if (help) html += '<p class="ts-q-help">' + fillModel(help) + '</p>';
    if (node.quickPicks) html += quickPicksHTML(node.quickPicks);
    html += optionsHTML(node.options, 'data-opt');
    html += '</div>';
    html += controlsHTML();
    return html;
  }

  function videoChip(v) {
    if (!v) return '';
    if (v.url) {
      return '<a class="ts-resource ts-resource-video" href="' + esc(v.url) + '" target="_blank" rel="noopener">'
        + '<span class="ts-resource-ic" aria-hidden="true">▶</span><span>Watch: ' + esc(v.label) + '</span></a>';
    }
    // placeholder slot — URL not filled in yet (see VIDEOS map in troubleshoot.js)
    return '<span class="ts-resource ts-resource-video ts-resource-pending" title="Video link coming soon">'
      + '<span class="ts-resource-ic" aria-hidden="true">🎬</span><span>Video: ' + esc(v.label) + ' — coming soon</span></span>';
  }

  function articleChip(link) {
    return '<a class="ts-resource ts-resource-doc" href="' + esc(link.url) + '"'
      + (/^https?:/.test(link.url) ? ' target="_blank" rel="noopener"' : '')
      + '><span class="ts-resource-ic" aria-hidden="true">📄</span><span>' + esc(link.label) + '</span></a>';
  }

  function escalationHTML(level) {
    if (!level) return '';
    var firm = level === 'firm';
    var html = '<div class="ts-escalate' + (firm ? ' ts-escalate-firm' : '') + '">';
    html += '<h3 class="ts-escalate-h">' + (firm ? 'Needs a closer look — contact Aquafire support' : 'Still not fixed?') + '</h3>';
    html += '<p class="ts-escalate-p">'
      + (firm
          ? 'This one usually needs Technical Support. They’ll diagnose it remotely first — and if a part is needed and your unit is covered, they ship it with a step-by-step guide and video.'
          : 'If none of the above did it, reach out and Technical Support will pick up where this left off. They’ll troubleshoot remotely first; if a covered part is needed, they ship it with a how-to guide.')
      + '</p>';
    html += '<div class="ts-escalate-actions">';
    html += '<a class="ts-btn ts-btn-primary" href="' + esc(LINKS.serviceRequest.url) + '" target="_blank" rel="noopener">Submit a service request</a>';
    html += '<a class="ts-btn ts-btn-outline" href="mailto:' + SUPPORT_EMAIL + '">Email ' + SUPPORT_EMAIL + '</a>';
    html += '<a class="ts-btn ts-btn-outline" href="tel:' + SUPPORT_PHONE_TEL + '">Call ' + SUPPORT_PHONE + '</a>';
    html += '</div>';
    html += '<p class="ts-escalate-note">Have your <strong>model number and serial</strong> handy — the serial is on a label under the top lid and on the plate on the back of the unit. New to Aquafire? You must <a href="' + esc(LINKS.warrantyReg.url) + '" target="_blank" rel="noopener">register your warranty</a> within 30 days of delivery to be able to file claims.</p>';
    html += '</div>';
    return html;
  }

  function renderOutcome(node) {
    var m = state.model;
    var sev = val(node.severity, m) || 'fix';
    var badge = { fix: 'Try this', maintenance: 'Maintenance', support: 'Likely needs support', info: 'Good to know' }[sev] || 'Try this';
    var html = '';
    html += breadcrumbHTML();
    html += '<div class="ts-card ts-outcome ts-sev-' + sev + '">';
    html += '<div class="ts-outcome-head"><span class="ts-sev-badge">' + badge + '</span>' + modelTag() + '</div>';
    html += '<h2 class="ts-outcome-title">' + fillModel(val(node.title, m) || nodeTitleFromCrumb()) + '</h2>';
    var lead = val(node.lead, m);
    if (lead) html += '<p class="ts-outcome-lead">' + fillModel(lead) + '</p>';

    var steps = val(node.steps, m);
    if (steps && steps.length) {
      html += '<ol class="ts-steps">';
      for (var i = 0; i < steps.length; i++) html += '<li>' + fillModel(steps[i]) + '</li>';
      html += '</ol>';
    }
    var caution = val(node.caution, m);
    if (caution) html += '<div class="ts-caution"><span class="ts-caution-ic" aria-hidden="true">⚠</span><p>' + fillModel(caution) + '</p></div>';
    var note = val(node.note, m);
    if (note) html += '<div class="ts-note"><span class="ts-note-ic" aria-hidden="true">ℹ</span><p>' + fillModel(note) + '</p></div>';

    // resources: videos + articles
    var vids = node.video ? (Array.isArray(node.video) ? node.video : [node.video]) : [];
    var linkKeys = val(node.links, m) || [];
    if (vids.length || linkKeys.length) {
      html += '<div class="ts-resources">';
      for (var v = 0; v < vids.length; v++) html += videoChip(VIDEOS[vids[v]]);
      for (var k = 0; k < linkKeys.length; k++) if (LINKS[linkKeys[k]]) html += articleChip(LINKS[linkKeys[k]]);
      html += '</div>';
    }

    // related "also try" links
    var related = val(node.related, m);
    if (related && related.length) {
      html += '<div class="ts-related"><span class="ts-related-label">Also:</span>';
      for (var r = 0; r < related.length; r++) {
        html += '<button type="button" class="ts-chip ts-chip-related" data-rel="' + r + '">' + fillModel(related[r].label) + '</button>';
      }
      html += '</div>';
    }

    var didFix = sev !== 'support';
    html += '<div class="ts-outcome-foot">';
    if (didFix) html += '<button type="button" class="ts-btn ts-btn-ghost" data-act="restart">✓ That fixed it — done</button>';
    html += '<button type="button" class="ts-btn ts-btn-ghost" data-act="back">← Back</button>';
    html += '<button type="button" class="ts-btn ts-btn-ghost" data-act="restart2">↺ Start a new diagnosis</button>';
    html += '</div>';

    html += escalationHTML(val(node.escalate, m));
    html += '</div>';
    return html;
  }

  function nodeTitleFromCrumb() {
    var modelNames = ['Aquafire Pro', 'Aquafire Original', 'Aquafire Lite'];
    for (var i = nav.length - 1; i >= 0; i--) {
      var c = nav[i].choice;
      if (c && c !== '(shared link)' && modelNames.indexOf(c) === -1) return c;
    }
    return 'Here’s what to do';
  }

  function currentNode() { return TREE[nav[nav.length - 1].node]; }

  function render() {
    var node = currentNode();
    if (!node) { restart(); return; }
    if (node.type === 'router') { // shouldn't land here, but be safe
      nav[nav.length - 1].node = resolveNext(nav[nav.length - 1].node);
      node = currentNode();
    }
    contentEl.innerHTML = node.type === 'outcome' ? renderOutcome(node) : renderQuestion(node);
    bindHandlers(node);
  }

  function bindHandlers(node) {
    // single delegated handler is simpler given the small DOM
    contentEl.querySelectorAll('[data-opt]').forEach(function (b) {
      b.addEventListener('click', function () {
        var o = node.options[+b.getAttribute('data-opt')];
        go(o.next, o.label.replace(/<[^>]+>/g, ''), o.setModel);
      });
    });
    contentEl.querySelectorAll('[data-quick]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = node.quickPicks[+b.getAttribute('data-quick')];
        go(p.next, p.label, p.setModel);
      });
    });
    var related = node.type === 'outcome' ? val(node.related, state.model) : null;
    if (related) contentEl.querySelectorAll('[data-rel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = related[+b.getAttribute('data-rel')];
        go(r.next, r.label, r.setModel);
      });
    });
    contentEl.querySelectorAll('[data-crumb]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-crumb');
        if (i === 0) restart(); else jumpToCrumb(i);
      });
    });
    contentEl.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-act');
        if (a === 'back') back();
        else restart(); // 'restart' or 'restart2'
      });
    });
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */
  function boot() {
    root = document.getElementById('ts-app');
    if (!root) return;
    root.innerHTML = '<div id="ts-content" class="ts-content"></div>';
    contentEl = document.getElementById('ts-content');

    var params = new URLSearchParams(window.location.search);
    var qModel = (params.get('model') || '').toLowerCase();
    var modelMap = { pro: 'pro', awpr: 'pro', original: 'original', awa: 'original', og: 'original', lite: 'lite', awl: 'lite' };
    var qNode = params.get('node');

    nav = [{ node: 'start', choice: null }];

    if (modelMap[qModel]) {
      state.model = modelMap[qModel];
      nav.push({ node: 'category', choice: MODELS[state.model].name });
    }
    if (qNode && TREE[qNode] && TREE[qNode].type !== 'router' && qNode !== 'start') {
      // deep-link straight to a node (e.g. from a support email)
      var resolved = resolveNext(qNode);
      nav.push({ node: resolved, choice: '(shared link)' });
    } else if (qNode && TREE[qNode] && TREE[qNode].type === 'router') {
      nav.push({ node: resolveNext(qNode), choice: '(shared link)' });
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
