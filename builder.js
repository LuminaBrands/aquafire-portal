/* ──────────────────────────────────────────────────────────
   Aquafire Fireplace Builder — builder.js
   Step-by-step configurator for Aquafire water vapor fireplaces
   ────────────────────────────────────────────────────────── */

// ── Model Data (mirrors app.js MODELS) ──
// Cutout widths carry 3/8" of clearance per side — nominal + 3/4" overall, the
// install-crew recommendation. See the note above MODELS in app.js. Keep the
// two tables in step.
const MODELS = {
  original: {
    name: 'Aquafire Original',
    tagline: 'The classic water vapor fireplace',
    features: ['Single LED bar', 'Classic flame effect', '12" insert height'],
    frontAngle: 58, backAngle: 68,
    lightOffset: 5.3, lightOffsetBack: 4.6, lightWidth: 3,
    sizes: {
      20: { w: 20.75, d: 12.25, h: 12 },
      40: { w: 40.75, d: 12.25, h: 12 },
      60: { w: 60.75, d: 12.25, h: 12 },
      80:  { w: 80.75,  d: 12.25, h: 12, units: [40, 40] },
      100: { w: 100.75, d: 12.25, h: 12, units: [60, 40] },
      120: { w: 120.75, d: 12.25, h: 12, units: [60, 60] },
    },
  },
  pro: {
    name: 'Aquafire Pro',
    tagline: 'Premium dual LED flame realism',
    features: ['Dual LED bars', 'Enhanced flame realism', '14" insert height'],
    frontAngle: 53, backAngle: 68,
    lightOffset: 5.3, lightOffsetBack: 4.6, lightWidth: 3,
    sizes: {
      20: { w: 20.75, d: 12.25, h: 14 },
      40: { w: 40.75, d: 12.25, h: 14 },
      60: { w: 60.75, d: 12.25, h: 14 },
      80:  { w: 80.75,  d: 12.25, h: 14, units: [40, 40] },
      100: { w: 100.75, d: 12.25, h: 14, units: [60, 40] },
      120: { w: 120.75, d: 12.25, h: 14, units: [60, 60] },
    },
  },
  lite: {
    name: 'Aquafire Lite',
    tagline: 'Compact and versatile',
    features: ['Single LED bar', 'Shallow 9.6" depth', '11" insert height'],
    frontAngle: 58, backAngle: 68,
    lightOffset: 4.0, lightOffsetBack: 3.75, lightWidth: 3,
    sizes: {
      20: { w: 20.75, d: 9.625, h: 11 },
      40: { w: 40.75, d: 9.625, h: 11 },
      60: { w: 60.75, d: 9.625, h: 11 },
    },
  },
};

// ── CDN & Assets ──
const CDN = 'https://cdn.shopify.com/s/files/1/0671/5562/4256/files/';
const MODEL_IMAGES = {
  pro: CDN + 'PRO.png?v=1768251750',
  original: CDN + 'ORIGINAL.png?v=1768251742',
  lite: CDN + 'LITE.png?v=1768251746',
};

// ── Pricing Placeholders (update when real pricing is available) ──
const PRICING = {
  original: { 20: '$X,XXX', 40: '$X,XXX', 60: '$X,XXX' },
  pro:      { 20: '$X,XXX', 40: '$X,XXX', 60: '$X,XXX' },
  lite:     { 20: '$X,XXX', 40: '$X,XXX', 60: '$X,XXX' },
  firebox:  '$X,XXX',
};

// ── Shopify URL Placeholders (update with real product URLs) ──
const SHOPIFY_URLS = {
  original: { 20: '#', 40: '#', 60: '#' },
  pro:      { 20: '#', 40: '#', 60: '#' },
  lite:     { 20: '#', 40: '#', 60: '#' },
};

// ── Accessories ──
const ACCESSORIES = [
  {
    id: 'clearshield', name: 'ClearShield',
    desc: 'Water treatment for crystal-clear vapor',
    image: CDN + 'all_clearshirlds_972897a2-c366-453b-b658-258e86a282ea.png?v=1761142736',
    price: '$XX', shopifyUrl: '#',
  },
  {
    id: 'vapor-pure', name: 'Vapor Pure Softener',
    desc: 'Prevents mineral buildup in your unit',
    image: CDN + '2_b168e3d1-f78d-473d-aa8e-9e047c4a2cb2.png?v=1772220296',
    price: '$XX', shopifyUrl: '#',
  },
  {
    id: 'scent-diffuser', name: 'Scent Diffuser',
    desc: 'Add aromatic fragrance to your flame',
    image: CDN + 'scent_main.jpg?v=1756829244',
    price: '$XX', shopifyUrl: '#',
  },
  {
    id: 'tank-guard', name: 'Tank Guard',
    desc: 'Reservoir protection system',
    image: CDN + '5A378C65-4102-4BFE-AD88-05D186CA4746.png?v=1772986051',
    price: '$XX', shopifyUrl: '#',
  },
];

// ── State ──
const state = {
  step: 1,
  model: null,
  size: null,
  enclosureType: null,
  hearth: 'single',
  setback: 6,
  backSetback: 2,
  openingHeight: 15,
  accessories: [],
};

const TOTAL_STEPS = 7;

// ── Helpers ──
function frac(n) {
  const whole = Math.floor(n);
  const rem = n - whole;
  const fracs = [
    [1/8, '\u215B'], [1/4, '\u00BC'], [3/8, '\u215C'], [1/2, '\u00BD'],
    [5/8, '\u215D'], [3/4, '\u00BE'], [7/8, '\u215E'],
  ];
  if (rem < 0.01) return whole + '"';
  for (const [val, sym] of fracs) {
    if (Math.abs(rem - val) < 0.02) {
      return whole === 0 ? sym + '"' : whole + ' ' + sym + '"';
    }
  }
  return n.toFixed(3) + '"';
}

function getDims() {
  if (!state.model || !state.size) return null;
  return MODELS[state.model].sizes[state.size];
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  renderStep1();
  renderStep3();
  renderStep5();
  renderStep6();
  initSliders();
  initNavButtons();
  initProgressClicks();
  initMobilePreview();
  initNavToggle();
  loadFromHash();
  updateProgress();
  updatePreview();
});

// ── Step Rendering ──

function renderStep1() {
  const container = document.getElementById('step-1-content');
  if (!container) return;
  let html = '';
  for (const [key, model] of Object.entries(MODELS)) {
    html += `
      <div class="selection-card" data-model="${key}" onclick="selectModel('${key}')">
        <img src="${MODEL_IMAGES[key]}" alt="${model.name}" loading="lazy">
        <h3>${model.name}</h3>
        <p class="card-subtitle">${model.tagline}</p>
        <div class="card-features">
          ${model.features.map(f => `<span class="card-feature">${f}</span>`).join('')}
        </div>
        <div class="card-price">${PRICING[key][40]} <span class="card-price-placeholder">starting</span></div>
      </div>`;
  }
  container.innerHTML = html;
}

function renderStep2() {
  const container = document.getElementById('step-2-content');
  if (!container || !state.model) return;
  const model = MODELS[state.model];
  let html = '';
  // Singles only — the ganged sizes in MODELS are carried here to keep the two
  // tables identical, but the builder's surround plan, pricing and materials
  // are single-insert. The Enclosure Guide is where a ganged run gets sized.
  for (const size of [20, 40, 60]) {
    const dims = model.sizes[size];
    const barWidth = Math.round((size / 60) * 100);
    html += `
      <div class="selection-card" data-size="${size}" onclick="selectSize(${size})">
        <h3>${size}"</h3>
        <div class="size-bar-container">
          <div class="size-bar" style="width: ${barWidth}%"></div>
        </div>
        <div class="size-dims">
          <span><span class="dim-value">${frac(dims.w)}</span><span class="dim-label">Width</span></span>
          <span><span class="dim-value">${frac(dims.d)}</span><span class="dim-label">Depth</span></span>
          <span><span class="dim-value">${frac(dims.h)}</span><span class="dim-label">Height</span></span>
        </div>
        <div class="card-price">${PRICING[state.model][size]}</div>
      </div>`;
  }
  container.innerHTML = html;
  // Restore selection if exists
  if (state.size) {
    const card = container.querySelector(`[data-size="${state.size}"]`);
    if (card) card.classList.add('selected');
  }
}

function renderStep3() {
  const container = document.getElementById('step-3-content');
  if (!container) return;
  container.innerHTML = `
    <div class="selection-card" data-enclosure="firebox" onclick="selectEnclosure('firebox')">
      <h3>AquafireBox</h3>
      <p class="card-subtitle">Pre-made insert liner with fixed dimensions. Drop your fireplace in and go — simplest installation path.</p>
      <div class="card-features">
        <span class="card-feature">Pre-built insert/liner</span>
        <span class="card-feature">Fixed dimensions</span>
        <span class="card-feature">Fastest installation</span>
      </div>
      <div class="card-price">${PRICING.firebox} <span class="card-price-placeholder">add-on</span></div>
    </div>
    <div class="selection-card" data-enclosure="site-built" onclick="selectEnclosure('site-built')">
      <h3>Site-Built Enclosure</h3>
      <p class="card-subtitle">Build your own custom enclosure from scratch. Full control over dimensions and materials.</p>
      <div class="card-features">
        <span class="card-feature">Custom framing</span>
        <span class="card-feature">Adjustable dimensions</span>
        <span class="card-feature">Maximum flexibility</span>
      </div>
    </div>`;
}

function renderStep5() {
  const container = document.getElementById('step-5-content');
  if (!container) return;
  container.innerHTML = `
    <div class="selection-card" data-hearth="single" onclick="selectHearth('single')">
      <svg viewBox="0 0 200 120" style="width:100%;max-width:180px;margin:0 auto 12px;display:block;">
        <rect x="20" y="10" width="160" height="100" rx="6" fill="#1b1e24" stroke="#3a3e48" stroke-width="2"/>
        <rect x="50" y="30" width="100" height="60" rx="4" fill="#22262e" stroke="#e8a838" stroke-width="1.5"/>
        <ellipse cx="100" cy="55" rx="30" ry="12" fill="url(#flame-g1)" opacity="0.6"/>
        <defs><linearGradient id="flame-g1" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stop-color="#e8a838" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#e8a838" stop-opacity="0"/>
        </linearGradient></defs>
      </svg>
      <h3>Single Opening</h3>
      <p class="card-subtitle">Standard hearth — viewed from one side. Most common installation.</p>
    </div>
    <div class="selection-card" data-hearth="double" onclick="selectHearth('double')">
      <svg viewBox="0 0 200 120" style="width:100%;max-width:180px;margin:0 auto 12px;display:block;">
        <rect x="20" y="10" width="160" height="100" rx="6" fill="#1b1e24" stroke="#3a3e48" stroke-width="2"/>
        <rect x="50" y="20" width="100" height="80" rx="4" fill="#22262e" stroke="#e8a838" stroke-width="1.5"/>
        <line x1="50" y1="60" x2="150" y2="60" stroke="#3a3e48" stroke-width="1" stroke-dasharray="4,3"/>
        <ellipse cx="100" cy="45" rx="30" ry="10" fill="url(#flame-g2)" opacity="0.5"/>
        <ellipse cx="100" cy="75" rx="30" ry="10" fill="url(#flame-g2)" opacity="0.5"/>
        <defs><linearGradient id="flame-g2" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stop-color="#e8a838" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#e8a838" stop-opacity="0"/>
        </linearGradient></defs>
      </svg>
      <h3>Double-Sided</h3>
      <p class="card-subtitle">See-through hearth — viewed from both sides. Great for room dividers.</p>
    </div>`;
  // Restore selection
  if (state.hearth) {
    const card = container.querySelector(`[data-hearth="${state.hearth}"]`);
    if (card) card.classList.add('selected');
  }
}

function renderStep6() {
  const container = document.getElementById('step-6-content');
  if (!container) return;
  let html = '';
  for (const acc of ACCESSORIES) {
    html += `
      <div class="accessory-card" data-accessory="${acc.id}" onclick="toggleAccessory('${acc.id}')">
        <img src="${acc.image}" alt="${acc.name}" loading="lazy">
        <div class="accessory-info">
          <h4>${acc.name}</h4>
          <p>${acc.desc}</p>
          <span class="accessory-price">${acc.price}</span>
        </div>
        <div class="accessory-check"></div>
      </div>`;
  }
  container.innerHTML = html;
}

function renderStep7() {
  const container = document.getElementById('step-7-content');
  if (!container) return;
  const model = state.model ? MODELS[state.model] : null;
  const dims = getDims();
  const selectedAccessories = ACCESSORIES.filter(a => state.accessories.includes(a.id));
  const shopUrl = state.model && state.size ? SHOPIFY_URLS[state.model][state.size] : '#';

  let accessoryRows = '';
  if (selectedAccessories.length > 0) {
    accessoryRows = selectedAccessories.map(a =>
      `<div class="summary-row"><span class="label">${a.name}</span><span class="value">${a.price}</span></div>`
    ).join('');
  } else {
    accessoryRows = '<div class="summary-row"><span class="label">None selected</span><span class="value">-</span></div>';
  }

  let enclosureInfo = '';
  if (state.enclosureType === 'firebox') {
    enclosureInfo = `
      <div class="summary-row"><span class="label">Enclosure</span><span class="value">AquafireBox</span></div>
      <div class="summary-row"><span class="label">Price</span><span class="value">${PRICING.firebox}</span></div>`;
  } else if (state.enclosureType === 'site-built') {
    enclosureInfo = `
      <div class="summary-row"><span class="label">Enclosure</span><span class="value">Site-Built</span></div>
      <div class="summary-row"><span class="label">Front Setback</span><span class="value">${state.setback.toFixed(1)}"</span></div>
      <div class="summary-row"><span class="label">Back Setback</span><span class="value">${state.backSetback.toFixed(1)}"</span></div>
      <div class="summary-row"><span class="label">Opening Height</span><span class="value">${state.openingHeight.toFixed(1)}"</span></div>`;
  }

  container.innerHTML = `
    <div class="summary-card">
      <div class="summary-header">
        <h3>Your Aquafire Configuration</h3>
        <p>Review your selections below</p>
      </div>
      <div class="summary-body">
        <div class="summary-section">
          <h4>Fireplace</h4>
          <div class="summary-row"><span class="label">Model</span><span class="value">${model ? model.name : '--'}</span></div>
          <div class="summary-row"><span class="label">Size</span><span class="value">${state.size ? state.size + '"' : '--'}</span></div>
          ${dims ? `
          <div class="summary-row"><span class="label">Dimensions</span><span class="value">${frac(dims.w)} W x ${frac(dims.d)} D x ${frac(dims.h)} H</span></div>` : ''}
          <div class="summary-row"><span class="label">Price</span><span class="value">${state.model && state.size ? PRICING[state.model][state.size] : '--'}</span></div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-section">
          <h4>Installation</h4>
          ${enclosureInfo}
          <div class="summary-row"><span class="label">Hearth Type</span><span class="value">${state.hearth === 'double' ? 'Double-Sided' : 'Single Opening'}</span></div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-section">
          <h4>Accessories</h4>
          ${accessoryRows}
        </div>
      </div>
      <div class="summary-total">
        <span class="label">Estimated Total</span>
        <span class="value">Contact for pricing</span>
      </div>
    </div>
    <div class="summary-actions">
      <a href="${shopUrl}" class="btn-primary" target="_blank" rel="noopener">Shop Now</a>
      <button class="btn-secondary" onclick="shareConfig()">Share Link</button>
      <button class="btn-secondary" onclick="printConfig()">Print</button>
    </div>`;
}

// ── Selection Handlers ──

function selectModel(key) {
  state.model = key;
  document.querySelectorAll('#step-1-content .selection-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`#step-1-content [data-model="${key}"]`);
  if (card) card.classList.add('selected');
  document.getElementById('next-1').disabled = false;
  renderStep2();
  updatePreview();
}

function selectSize(size) {
  state.size = size;
  document.querySelectorAll('#step-2-content .selection-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`#step-2-content [data-size="${size}"]`);
  if (card) card.classList.add('selected');
  document.getElementById('next-2').disabled = false;
  updatePreview();
}

function selectEnclosure(type) {
  state.enclosureType = type;
  document.querySelectorAll('#step-3-content .selection-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`#step-3-content [data-enclosure="${type}"]`);
  if (card) card.classList.add('selected');
  document.getElementById('next-3').disabled = false;
  updateProgress();
  updatePreview();
}

function selectHearth(type) {
  state.hearth = type;
  document.querySelectorAll('#step-5-content .selection-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`#step-5-content [data-hearth="${type}"]`);
  if (card) card.classList.add('selected');
  document.getElementById('next-5').disabled = false;
  updatePreview();
}

function toggleAccessory(id) {
  const idx = state.accessories.indexOf(id);
  if (idx >= 0) {
    state.accessories.splice(idx, 1);
  } else {
    state.accessories.push(id);
  }
  const card = document.querySelector(`#step-6-content [data-accessory="${id}"]`);
  if (card) card.classList.toggle('selected');
}

// ── Slider Init ──

function initSliders() {
  const setbackSlider = document.getElementById('setback-slider');
  const backSetbackSlider = document.getElementById('back-setback-slider');
  const openingSlider = document.getElementById('opening-slider');

  if (setbackSlider) {
    setbackSlider.addEventListener('input', () => {
      state.setback = parseFloat(setbackSlider.value);
      document.getElementById('setback-val').textContent = state.setback.toFixed(1) + '"';
      updateMaxOpening();
      updatePreview();
    });
  }
  if (backSetbackSlider) {
    backSetbackSlider.addEventListener('input', () => {
      state.backSetback = parseFloat(backSetbackSlider.value);
      document.getElementById('back-setback-val').textContent = state.backSetback.toFixed(1) + '"';
      updateMaxOpening();
      updatePreview();
    });
  }
  if (openingSlider) {
    openingSlider.addEventListener('input', () => {
      state.openingHeight = parseFloat(openingSlider.value);
      document.getElementById('opening-val').textContent = state.openingHeight.toFixed(1) + '"';
      updatePreview();
    });
  }
}

function updateMaxOpening() {
  if (!state.model) return;
  const model = MODELS[state.model];
  const angleRad = model.frontAngle * Math.PI / 180;
  const maxOpening = Math.round((state.setback + model.lightOffset) * Math.tan(angleRad) - 1);
  const el = document.getElementById('max-opening-value');
  if (el) el.textContent = maxOpening + '"';
}

// ── Navigation ──

function goToStep(n) {
  if (n < 1 || n > TOTAL_STEPS) return;
  // Skip step 4 if firebox
  if (n === 4 && state.enclosureType === 'firebox') {
    n = state.step < 4 ? 5 : 3;
  }
  state.step = n;

  document.querySelectorAll('.builder-step').forEach(s => s.classList.remove('active'));
  const stepEl = document.getElementById('step-' + n);
  if (stepEl) stepEl.classList.add('active');

  // Re-render dynamic steps
  if (n === 2) renderStep2();
  if (n === 4) updateMaxOpening();
  if (n === 7) renderStep7();

  updateProgress();
  updatePreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  let next = state.step + 1;
  if (next === 4 && state.enclosureType === 'firebox') next = 5;
  goToStep(next);
}

function prevStep() {
  let prev = state.step - 1;
  if (prev === 4 && state.enclosureType === 'firebox') prev = 3;
  goToStep(prev);
}

function initNavButtons() {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const nextBtn = document.getElementById('next-' + i);
    const backBtn = document.getElementById('back-' + i);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (backBtn) backBtn.addEventListener('click', prevStep);
  }
}

// ── Progress Bar ──

function initProgressClicks() {
  document.querySelectorAll('.progress-step').forEach(el => {
    el.querySelector('.progress-dot').addEventListener('click', () => {
      const step = parseInt(el.dataset.step);
      if (step <= state.step) goToStep(step);
    });
  });
}

function updateProgress() {
  document.querySelectorAll('.progress-step').forEach(el => {
    const step = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed', 'skipped');
    if (step === state.step) {
      el.classList.add('active');
    } else if (step < state.step) {
      el.classList.add('completed');
    }
    if (step === 4 && state.enclosureType === 'firebox') {
      el.classList.add('skipped');
    }
  });
}

// ── Preview Panel ──

function updatePreview() {
  const modelNameEl = document.getElementById('preview-model-name');
  const sizeBadge = document.getElementById('preview-size-badge');
  const widthEl = document.getElementById('preview-width');
  const depthEl = document.getElementById('preview-depth');
  const heightEl = document.getElementById('preview-height');
  const diagramEl = document.getElementById('preview-diagram');

  if (!state.model) {
    if (modelNameEl) modelNameEl.textContent = '--';
    if (sizeBadge) sizeBadge.textContent = '--';
    if (widthEl) widthEl.textContent = '--';
    if (depthEl) depthEl.textContent = '--';
    if (heightEl) heightEl.textContent = '--';
    if (diagramEl) diagramEl.innerHTML = `
      <div class="preview-placeholder">
        <span class="placeholder-icon">&#128293;</span>
        <p>Select a model to see your<br>fireplace preview</p>
      </div>`;
    return;
  }

  const model = MODELS[state.model];
  const dims = getDims();

  if (modelNameEl) modelNameEl.textContent = model.name;
  if (sizeBadge) sizeBadge.textContent = state.size ? state.size + '"' : '--';
  if (dims) {
    if (widthEl) widthEl.textContent = frac(dims.w);
    if (depthEl) depthEl.textContent = frac(dims.d);
    if (heightEl) heightEl.textContent = frac(dims.h);
  }

  if (diagramEl && dims) {
    diagramEl.innerHTML = '<svg id="preview-svg"></svg>';
    drawPreviewDiagram();
  }

  // Update mobile clone
  const mobileClone = document.getElementById('mobile-preview-clone');
  if (mobileClone) {
    const desktopPreview = document.getElementById('builder-preview');
    mobileClone.innerHTML = desktopPreview.innerHTML;
  }
}

function drawPreviewDiagram() {
  const svg = document.getElementById('preview-svg');
  if (!svg || !state.model || !state.size) return;

  const dims = getDims();
  const model = MODELS[state.model];
  const clearance = 4;
  const minEncHInches = 14;
  const encHInches = Math.max(minEncHInches, dims.h + clearance);

  const scale = 320 / (60.75 + clearance * 2);
  const w = dims.w * scale;
  const d = dims.d * scale;
  const h = dims.h * scale;
  const encW = (dims.w + clearance * 2) * scale;
  const encD = (dims.d + clearance * 2) * scale;
  const encH = encHInches * scale;

  const isoX = 0.65, isoY = 0.32;
  const encCx = 0, encCy = 0;

  // Enclosure corners
  const eFL = { x: encCx - encW/2, y: encCy };
  const eFR = { x: encCx + encW/2, y: encCy };
  const eBL = { x: eFL.x + encD*isoX, y: eFL.y - encD*isoY };
  const eBR = { x: eFR.x + encD*isoX, y: eFR.y - encD*isoY };
  const eFTL = { x: eFL.x, y: eFL.y - encH };
  const eFTR = { x: eFR.x, y: eFR.y - encH };
  const eBTL = { x: eBL.x, y: eBL.y - encH };
  const eBTR = { x: eBR.x, y: eBR.y - encH };

  // Insert above enclosure
  const gap = 50;
  const insBot = eFTL.y - gap;
  const iFL = { x: -w/2, y: insBot };
  const iFR = { x: w/2, y: insBot };
  const iBL = { x: iFL.x + d*isoX, y: iFL.y - d*isoY };
  const iBR = { x: iFR.x + d*isoX, y: iFR.y - d*isoY };
  const iFTL = { x: iFL.x, y: iFL.y - h };
  const iFTR = { x: iFR.x, y: iFR.y - h };
  const iBTL = { x: iBL.x, y: iBL.y - h };
  const iBTR = { x: iBR.x, y: iBR.y - h };

  // Cutout on top
  const cutPadX = (encW - w) / 2;
  const cutPadD = (encD - d) / 2;
  const cFL = { x: eFTL.x + cutPadX + cutPadD*isoX, y: eFTL.y - cutPadD*isoY };
  const cFR = { x: eFTR.x - cutPadX + cutPadD*isoX, y: eFTR.y - cutPadD*isoY };
  const cBL = { x: cFL.x + d*isoX, y: cFL.y - d*isoY };
  const cBR = { x: cFR.x + d*isoX, y: cFR.y - d*isoY };

  let out = `<defs>
    <linearGradient id="b-enc-front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#282c35"/><stop offset="100%" stop-color="#1b1e24"/>
    </linearGradient>
    <linearGradient id="b-enc-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22262e"/><stop offset="100%" stop-color="#1b1e24"/>
    </linearGradient>
    <linearGradient id="b-enc-top" x1="0" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#2a2e38"/><stop offset="100%" stop-color="#353a45"/>
    </linearGradient>
    <linearGradient id="b-ins-front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3e48"/><stop offset="100%" stop-color="#2c3038"/>
    </linearGradient>
    <linearGradient id="b-ins-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#353940"/><stop offset="100%" stop-color="#2a2e35"/>
    </linearGradient>
    <linearGradient id="b-ins-top" x1="0" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#3e424c"/><stop offset="100%" stop-color="#484d58"/>
    </linearGradient>
    <linearGradient id="b-flame" x1="0.5" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#e8a838" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#d45a20" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#e8a838" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="b-cutout-glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8a838" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#e8a838" stop-opacity="0.03"/>
    </linearGradient>
    <filter id="b-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

  // Enclosure
  out += `<polygon points="${eFL.x},${eFL.y} ${eFR.x},${eFR.y} ${eFTR.x},${eFTR.y} ${eFTL.x},${eFTL.y}"
    fill="url(#b-enc-front)" stroke="#3a3e48" stroke-width="1.2"/>`;
  out += `<polygon points="${eFR.x},${eFR.y} ${eBR.x},${eBR.y} ${eBTR.x},${eBTR.y} ${eFTR.x},${eFTR.y}"
    fill="url(#b-enc-side)" stroke="#3a3e48" stroke-width="1.2"/>`;
  out += `<polygon points="${eFTL.x},${eFTL.y} ${eFTR.x},${eFTR.y} ${eBTR.x},${eBTR.y} ${eBTL.x},${eBTL.y}"
    fill="url(#b-enc-top)" stroke="#3a3e48" stroke-width="1.2"/>`;

  // Cutout
  out += `<polygon points="${cFL.x},${cFL.y} ${cFR.x},${cFR.y} ${cBR.x},${cBR.y} ${cBL.x},${cBL.y}"
    fill="url(#b-cutout-glow)" stroke="#e8a838" stroke-width="2"/>`;
  out += `<polygon points="${cFL.x+2},${cFL.y+1} ${cFR.x-2},${cFR.y+1} ${cBR.x-2},${cBR.y+1} ${cBL.x+2},${cBL.y+1}"
    fill="#0c0e11"/>`;

  // Drop arrows
  for (let i = 0; i < 3; i++) {
    const t = (i + 1) / 4;
    const ax = cFL.x + t * (cFR.x - cFL.x);
    const topY = iFL.y + 10;
    const botY = cFL.y - 6;
    out += `<line x1="${ax}" y1="${topY}" x2="${ax}" y2="${botY - 8}"
      stroke="#e8a838" stroke-width="1.4" stroke-dasharray="4,4" opacity="0.45"/>`;
    out += `<polygon points="${ax},${botY} ${ax-4},${botY-9} ${ax+4},${botY-9}" fill="#e8a838" opacity="0.6"/>`;
  }

  // Insert
  out += `<polygon points="${iFL.x},${iFL.y} ${iFR.x},${iFR.y} ${iFTR.x},${iFTR.y} ${iFTL.x},${iFTL.y}"
    fill="url(#b-ins-front)" stroke="#5a5e68" stroke-width="1.2"/>`;
  out += `<polygon points="${iFR.x},${iFR.y} ${iBR.x},${iBR.y} ${iBTR.x},${iBTR.y} ${iFTR.x},${iFTR.y}"
    fill="url(#b-ins-side)" stroke="#5a5e68" stroke-width="1.2"/>`;
  out += `<polygon points="${iFTL.x},${iFTL.y} ${iFTR.x},${iFTR.y} ${iBTR.x},${iBTR.y} ${iBTL.x},${iBTL.y}"
    fill="url(#b-ins-top)" stroke="#5a5e68" stroke-width="1.2"/>`;

  // LED strip + flame
  const ledInset = 10;
  const ledStartFrac = 0.35, ledEndFrac = 0.65;
  const ledFL = { x: iFTL.x + ledInset + d*isoX*ledStartFrac, y: iFTL.y - d*isoY*ledStartFrac };
  const ledFR = { x: iFTR.x - ledInset + d*isoX*ledStartFrac, y: iFTR.y - d*isoY*ledStartFrac };
  const ledBL = { x: iFTL.x + ledInset + d*isoX*ledEndFrac, y: iFTL.y - d*isoY*ledEndFrac };
  const ledBR = { x: iFTR.x - ledInset + d*isoX*ledEndFrac, y: iFTR.y - d*isoY*ledEndFrac };

  out += `<polygon points="${ledFL.x},${ledFL.y} ${ledFR.x},${ledFR.y} ${ledBR.x},${ledBR.y} ${ledBL.x},${ledBL.y}"
    fill="#e8a838" opacity="0.2" filter="url(#b-glow)"/>`;

  // Flame wisps
  const flameCx = (iFTL.x + iBTR.x) / 2;
  const flameCy = (iFTL.y + iBTR.y) / 2;
  const flameW = (ledFR.x - ledFL.x) * 0.4;
  out += `<ellipse cx="${flameCx}" cy="${flameCy - 6}" rx="${flameW/2}" ry="11"
    fill="url(#b-flame)" filter="url(#b-glow)" opacity="0.5"/>`;
  out += `<ellipse cx="${flameCx - flameW*0.35}" cy="${flameCy - 4}" rx="${flameW/4}" ry="8"
    fill="url(#b-flame)" filter="url(#b-glow)" opacity="0.3"/>`;
  out += `<ellipse cx="${flameCx + flameW*0.35}" cy="${flameCy - 4}" rx="${flameW/4}" ry="8"
    fill="url(#b-flame)" filter="url(#b-glow)" opacity="0.3"/>`;

  // Model name label
  const insLabelX = (iFL.x + iFR.x) / 2;
  const insLabelY = (iFL.y + iFTL.y) / 2 + 4;
  out += `<text x="${insLabelX}" y="${insLabelY}" fill="#b0b4be" font-family="Inter,sans-serif"
    font-size="10" text-anchor="middle" font-weight="600" letter-spacing="2">${model.name.toUpperCase()}</text>`;

  // Enclosure label
  const encLabelX = (eFL.x + eFR.x) / 2;
  const encLabelY = (eFL.y + eFTL.y) / 2 + 4;
  out += `<text x="${encLabelX}" y="${encLabelY}" fill="#878c99" font-family="Inter,sans-serif"
    font-size="10" text-anchor="middle" font-weight="600" letter-spacing="3" opacity="0.5">ENCLOSURE</text>`;

  // Compute viewBox
  const allPts = [eFL, eFR, eBL, eBR, eFTL, eFTR, eBTL, eBTR,
    iFL, iFR, iBL, iBR, iFTL, iFTR, iBTL, iBTR, cFL, cFR, cBL, cBR];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of allPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const pad = 16;
  svg.setAttribute('viewBox', `${minX-pad} ${minY-pad} ${maxX-minX+pad*2} ${maxY-minY+pad*2}`);
  svg.innerHTML = out;
}

// ── Mobile Preview ──

function initMobilePreview() {
  const toggleBtn = document.getElementById('mobile-preview-toggle');
  const overlay = document.getElementById('mobile-preview-overlay');
  const closeBtn = document.getElementById('mobile-preview-close');

  if (toggleBtn && overlay) {
    toggleBtn.addEventListener('click', () => {
      overlay.classList.add('open');
      // Clone current preview content
      const mobileClone = document.getElementById('mobile-preview-clone');
      const desktopPreview = document.getElementById('builder-preview');
      if (mobileClone && desktopPreview) {
        mobileClone.innerHTML = desktopPreview.innerHTML;
      }
    });
  }
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }
}

// ── URL State (Share/Restore) ──

function stateToHash() {
  const params = new URLSearchParams();
  if (state.model) params.set('m', state.model);
  if (state.size) params.set('s', state.size);
  if (state.enclosureType) params.set('e', state.enclosureType);
  params.set('h', state.hearth);
  params.set('sb', state.setback);
  params.set('bsb', state.backSetback);
  params.set('oh', state.openingHeight);
  if (state.accessories.length) params.set('acc', state.accessories.join(','));
  params.set('step', state.step);
  return params.toString();
}

function hashToState(search) {
  const params = new URLSearchParams(search);
  if (params.has('m')) state.model = params.get('m');
  if (params.has('s')) state.size = parseInt(params.get('s'));
  if (params.has('e')) state.enclosureType = params.get('e');
  if (params.has('h')) state.hearth = params.get('h');
  if (params.has('sb')) state.setback = parseFloat(params.get('sb'));
  if (params.has('bsb')) state.backSetback = parseFloat(params.get('bsb'));
  if (params.has('oh')) state.openingHeight = parseFloat(params.get('oh'));
  if (params.has('acc')) state.accessories = params.get('acc').split(',').filter(Boolean);
  if (params.has('step')) state.step = parseInt(params.get('step'));
}

function loadFromHash() {
  const search = window.location.search.replace(/^\?/, '');
  if (!search || search === 'embed') return;
  hashToState(search);

  // Restore UI state
  if (state.model) {
    renderStep1();
    const mc = document.querySelector(`#step-1-content [data-model="${state.model}"]`);
    if (mc) mc.classList.add('selected');
    document.getElementById('next-1').disabled = false;
    renderStep2();
  }
  if (state.size) {
    const sc = document.querySelector(`#step-2-content [data-size="${state.size}"]`);
    if (sc) sc.classList.add('selected');
    document.getElementById('next-2').disabled = false;
  }
  if (state.enclosureType) {
    const ec = document.querySelector(`#step-3-content [data-enclosure="${state.enclosureType}"]`);
    if (ec) ec.classList.add('selected');
    document.getElementById('next-3').disabled = false;
  }
  if (state.hearth) {
    const hc = document.querySelector(`#step-5-content [data-hearth="${state.hearth}"]`);
    if (hc) hc.classList.add('selected');
    document.getElementById('next-5').disabled = false;
  }
  // Restore sliders
  const ss = document.getElementById('setback-slider');
  const bss = document.getElementById('back-setback-slider');
  const os = document.getElementById('opening-slider');
  if (ss) { ss.value = state.setback; document.getElementById('setback-val').textContent = state.setback.toFixed(1) + '"'; }
  if (bss) { bss.value = state.backSetback; document.getElementById('back-setback-val').textContent = state.backSetback.toFixed(1) + '"'; }
  if (os) { os.value = state.openingHeight; document.getElementById('opening-val').textContent = state.openingHeight.toFixed(1) + '"'; }
  // Restore accessories
  state.accessories.forEach(id => {
    const ac = document.querySelector(`#step-6-content [data-accessory="${id}"]`);
    if (ac) ac.classList.add('selected');
  });
  // Go to saved step
  goToStep(state.step);
}

function shareConfig() {
  const url = window.location.origin + window.location.pathname + '?' + stateToHash();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.summary-actions .btn-secondary');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  }).catch(() => {
    prompt('Copy this link:', url);
  });
}

function printConfig() {
  window.print();
}

// ── Nav Toggle (hamburger menu) ──

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
}
