/* ──────────────────────────────────────────────────────────
   Aquafire Enclosure Guide – app.js
   ────────────────────────────────────────────────────────── */

// ── Model Data ──
// Cutout widths carry 3/8" of clearance on EACH SIDE — nominal + 3/4" overall,
// against the published nominal + 1/4". That is the install crews' figure
// (Aug 2026, confirmed per-side Aug 2026): the insert seats without being
// forced, air keeps moving around the internals, and light strips and fans
// aren't compressed during install. Depth and height are the published
// figures. Both this and builder.js carry the same table; move them together.
// See docs/source-material/note-installer-field-tips.txt
const MODELS = {
  original: {
    name: 'Aquafire Original',
    frontAngle: 58,
    backAngle: 68,
    lightOffset: 5.3,       // front of insert → front edge of LED opening
    lightOffsetBack: 4.6,   // back of insert → back edge of LED opening
    lightWidth: 3,          // depth of LED opening (front-to-back)
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
    frontAngle: 53,
    backAngle: 68,
    lightOffset: 5.3,
    lightOffsetBack: 4.6,
    lightWidth: 3,
    sizes: {
      20: { w: 20.75, d: 12.25, h: 14 },
      40: { w: 40.75, d: 12.25, h: 14 },
      60: { w: 60.75, d: 12.25, h: 14 },
      80:  { w: 80.75,  d: 12.25, h: 14, units: [40, 40] },
      100: { w: 100.75, d: 12.25, h: 14, units: [60, 40] },
      120: { w: 120.75, d: 12.25, h: 14, units: [60, 60] },
    },
  },
  // The Lite carries no ganged sizes on purpose — it is the one model that
  // can't be ganged (docs/source-material/page-compare-vs-aquafire.txt), so
  // the size list is built from this table rather than hard-coded.
  lite: {
    name: 'Aquafire Lite',
    frontAngle: 58,
    backAngle: 68,
    lightOffset: 4.0,
    lightOffsetBack: 3.75,
    lightWidth: 3,
    sizes: {
      20: { w: 20.75, d: 9.625, h: 11 },
      40: { w: 40.75, d: 9.625, h: 11 },
      60: { w: 60.75, d: 9.625, h: 11 },
    },
  },
};

// ── DOM refs ──
const modelSelect       = document.getElementById('model');
const sizeSelect        = document.getElementById('size');
const setbackSlider     = document.getElementById('setback-slider');
const setbackDisp       = document.getElementById('setback-display');
const backSetbackSlider = document.getElementById('back-setback-slider');
const backSetbackDisp   = document.getElementById('back-setback-display');
const openingSlider     = document.getElementById('opening-slider');
const openingDisp       = document.getElementById('opening-display');
const cutoutW           = document.getElementById('cutout-w');
const publishedW        = document.getElementById('published-w');
const gangNote          = document.getElementById('gang-note');
const cutoutD           = document.getElementById('cutout-d');
const cutoutH           = document.getElementById('cutout-h');
const maxOpeningEl      = document.getElementById('max-opening');
const maxOpeningSub     = document.getElementById('max-opening-sub');
const backMaxCard       = document.getElementById('back-max-card');
const backMaxOpeningEl  = document.getElementById('back-max-opening');
const hearthHint        = document.getElementById('hearth-hint');
const hearthBtns        = document.querySelectorAll('.hearth-btn');
const lightSvg          = document.getElementById('light-diagram');

let hearthType = 'single'; // 'single' or 'double'

// ── Helpers ──
function frac(n) {
  const whole = Math.floor(n);
  const rem = n - whole;
  const fracs = [
    [1/8, '⅛'], [1/4, '¼'], [3/8, '⅜'], [1/2, '½'],
    [5/8, '⅝'], [3/4, '¾'], [7/8, '⅞'],
  ];
  if (rem < 0.01) return whole + '"';
  for (const [val, sym] of fracs) {
    if (Math.abs(rem - val) < 0.02) {
      return whole === 0 ? sym + '"' : whole + ' ' + sym + '"';
    }
  }
  return n.toFixed(3) + '"';
}

// ── Size options (model-aware) ──
// Ganged runs are two inserts butted together in one continuous opening, so
// they are sizes like any other — but only the Pro and Original can gang, and
// the list has to follow the model.
function comboLabel(units) {
  return units[0] === units[1]
    ? `two ${units[0]}" units`
    : `${units[0]}" + ${units[1]}"`;
}

function renderSizeOptions() {
  const model = MODELS[modelSelect.value];
  const prev = sizeSelect.value;
  const singles = [];
  const ganged = [];

  for (const [key, dims] of Object.entries(model.sizes)) {
    (dims.units ? ganged : singles).push([key, dims]);
  }

  sizeSelect.innerHTML = '';
  for (const [key] of singles) {
    sizeSelect.appendChild(new Option(`${key}"`, key));
  }
  if (ganged.length) {
    const group = document.createElement('optgroup');
    group.label = 'Ganged — two inserts, one opening';
    for (const [key, dims] of ganged) {
      group.appendChild(new Option(`${key}" (${comboLabel(dims.units)})`, key));
    }
    sizeSelect.appendChild(group);
  }

  // Keep the chosen size across a model change where it still exists —
  // switching to the Lite from a ganged run has to fall back to a single.
  sizeSelect.value = model.sizes[prev] ? prev : '60';
}

function getState() {
  const modelKey      = modelSelect.value;
  const sizeKey       = sizeSelect.value;
  const model         = MODELS[modelKey];
  const dims          = model.sizes[sizeKey];
  const setback       = parseFloat(setbackSlider.value);
  const backSetback   = parseFloat(backSetbackSlider.value);
  const openingHeight = parseFloat(openingSlider.value);
  return { modelKey, model, dims, setback, backSetback, openingHeight, hearthType };
}

// ── Update all displays ──
function update() {
  const { model, dims, setback, backSetback, openingHeight } = getState();

  cutoutW.textContent = frac(dims.w);
  cutoutD.textContent = frac(dims.d);
  cutoutH.textContent = frac(dims.h);

  // The width above carries 3/8" per side. This is the published + 1/4"
  // overall minimum it sits above (so 1/2" narrower), for anyone checking the
  // number against a spec sheet.
  if (publishedW) publishedW.textContent = frac(dims.w - 0.5);

  if (gangNote) {
    if (dims.units) {
      const sizeKey = sizeSelect.value;
      gangNote.innerHTML = `<strong>${sizeKey}" run — ${dims.units.length} inserts, one opening.</strong> `
        + `Order ${comboLabel(dims.units).replace('units', 'inserts')} of the ${model.name}. `
        + `They butt together into a continuous ribbon of flame on a single remote, so the cutout is one `
        + `${frac(dims.w)} opening, not two. The ⅜" clearance is on the two outside edges only — nothing between the units, they meet flush.`;
      gangNote.hidden = false;
    } else {
      gangNote.hidden = true;
    }
  }

  setbackDisp.textContent     = setback.toFixed(1) + '"';
  backSetbackDisp.textContent = backSetback.toFixed(1) + '"';
  openingDisp.textContent     = openingHeight.toFixed(1) + '"';

  const angleRad   = model.frontAngle * Math.PI / 180;
  const frontMax   = Math.round((setback + model.lightOffset) * Math.tan(angleRad) - 1);

  const isDouble = hearthType === 'double';
  if (isDouble) {
    const backAngleRad = model.backAngle * Math.PI / 180;
    const backMax = Math.round((backSetback + model.lightOffsetBack) * Math.tan(backAngleRad) - 1);
    const effectiveMax = Math.min(frontMax, backMax);
    maxOpeningEl.textContent = effectiveMax + '"';
    maxOpeningSub.textContent = 'limited by ' + (backMax <= frontMax ? 'back' : 'front') + ' opening';
    backMaxOpeningEl.textContent = backMax + '"';
    backMaxCard.style.display = '';
  } else {
    maxOpeningEl.textContent = frontMax + '"';
    maxOpeningSub.textContent = 'maximum before light escape';
    backMaxCard.style.display = 'none';
  }

  drawCutoutDiagram(dims);
  drawLightDiagram();
}

// ── Cutout 3D Isometric Diagram ──
function drawCutoutDiagram(dims) {
  const svg = document.getElementById('cutout-diagram');
  const modelKey = modelSelect.value;
  const modelName = MODELS[modelKey].name;
  // ── Physical sizing ──
  // 4" clearance on every side of the cutout
  const clearance = 4;
  const minEncHInches = 14;
  const encHInches = Math.max(minEncHInches, dims.h + clearance);

  // Scale: map inches → SVG px, fitting a 60" cutout (+8" clearance) into
  // ~420px. Smaller sizes stay proportionally smaller, as they should; a
  // ganged run is wider than that reference, so it scales down to fit.
  const scale = 420 / (Math.max(dims.w, 60.75) + clearance * 2);
  const w = dims.w * scale;
  const d = dims.d * scale;
  const h = dims.h * scale;
  const encW = (dims.w + clearance * 2) * scale;  // 4" each side
  const encD = (dims.d + clearance * 2) * scale;  // 4" front and back
  const encH = encHInches * scale;

  // Isometric projection
  const isoX = 0.65, isoY = 0.32;

  // ── Layout anchors — place relative to (0,0), viewBox computed later ──
  const encCx = 0;
  const encCy = 0;  // front-bottom of enclosure at origin

  // ── Enclosure corners ──
  const eFL = { x: encCx - encW/2, y: encCy };
  const eFR = { x: encCx + encW/2, y: encCy };
  const eBL = { x: eFL.x + encD*isoX, y: eFL.y - encD*isoY };
  const eBR = { x: eFR.x + encD*isoX, y: eFR.y - encD*isoY };
  const eFTL = { x: eFL.x, y: eFL.y - encH };
  const eFTR = { x: eFR.x, y: eFR.y - encH };
  const eBTL = { x: eBL.x, y: eBL.y - encH };
  const eBTR = { x: eBR.x, y: eBR.y - encH };

  // ── Inserts (floating above enclosure) ──
  // A ganged run is two inserts butted together into one continuous ribbon, so
  // the row is drawn unit by unit. A single size is a run of one. These are the
  // inserts' nominal widths, not the cutout's — the 3/8" per side is the room
  // they drop into, a hairline at this scale.
  const unitSizes = dims.units || [Math.round(dims.w)];
  const gap = 70;
  const insCx = encCx;
  const insBot = eFTL.y - gap;
  const insW = unitSizes.reduce((sum, s) => sum + s, 0) * scale;

  const iFL = { x: insCx - insW/2, y: insBot };
  const iFR = { x: insCx + insW/2, y: insBot };
  const iBL = { x: iFL.x + d*isoX, y: iFL.y - d*isoY };
  const iBR = { x: iFR.x + d*isoX, y: iFR.y - d*isoY };
  const iFTL = { x: iFL.x, y: iFL.y - h };
  const iFTR = { x: iFR.x, y: iFR.y - h };
  const iBTL = { x: iBL.x, y: iBL.y - h };
  const iBTR = { x: iBR.x, y: iBR.y - h };

  // Per-unit boxes, left to right across that row.
  const units = [];
  let unitX = iFL.x;
  for (const size of unitSizes) {
    const uw = size * scale;
    const fl = { x: unitX,      y: insBot };
    const fr = { x: unitX + uw, y: insBot };
    units.push({
      size,
      fl, fr,
      ftl: { x: fl.x, y: fl.y - h },
      ftr: { x: fr.x, y: fr.y - h },
      btl: { x: fl.x + d*isoX, y: fl.y - d*isoY - h },
      btr: { x: fr.x + d*isoX, y: fr.y - d*isoY - h },
    });
    unitX += uw;
  }

  // ── Cutout on enclosure top ──
  // Centered in the top face with equal clearance on all sides
  const cutPadX = (encW - w) / 2;  // side clearance in px
  const cutPadD = (encD - d) / 2;  // front/back clearance in px
  // Offset cutout inward from front edge along isometric depth axis
  const cFL = { x: eFTL.x + cutPadX + cutPadD * isoX, y: eFTL.y - cutPadD * isoY };
  const cFR = { x: eFTR.x - cutPadX + cutPadD * isoX, y: eFTR.y - cutPadD * isoY };
  const cBL = { x: cFL.x + d*isoX, y: cFL.y - d*isoY };
  const cBR = { x: cFR.x + d*isoX, y: cFR.y - d*isoY };

  // ── Helper: dimension arrow with ticks + arrowheads ──
  function dimLine(x1,y1, x2,y2, label, sublabel, side, offset) {
    // side: 'below'|'right'|'along' — where to place the label
    let s = '';
    // Style attr, not a presentation attr: var() only resolves in CSS.
    const col = 'var(--ember-t, #f05a5e)';
    const mutedCol = '#878c99';
    const off = offset || 0;
    // Main line
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${mutedCol}" stroke-width="1.2"/>`;
    // Tick at start
    const dx = x2-x1, dy = y2-y1;
    const len = Math.sqrt(dx*dx+dy*dy);
    const nx = -dy/len * 5, ny = dx/len * 5; // perpendicular
    s += `<line x1="${x1+nx}" y1="${y1+ny}" x2="${x1-nx}" y2="${y1-ny}" stroke="${mutedCol}" stroke-width="1.5"/>`;
    // Tick at end
    s += `<line x1="${x2+nx}" y1="${y2+ny}" x2="${x2-nx}" y2="${y2-ny}" stroke="${mutedCol}" stroke-width="1.5"/>`;
    // Arrowhead at start
    const adx = dx/len*8, ady = dy/len*8;
    s += `<polygon points="${x1},${y1} ${x1+adx+nx*0.6},${y1+ady+ny*0.6} ${x1+adx-nx*0.6},${y1+ady-ny*0.6}" fill="${mutedCol}"/>`;
    // Arrowhead at end
    s += `<polygon points="${x2},${y2} ${x2-adx+nx*0.6},${y2-ady+ny*0.6} ${x2-adx-nx*0.6},${y2-ady-ny*0.6}" fill="${mutedCol}"/>`;

    const mx = (x1+x2)/2, my = (y1+y2)/2;
    if (side === 'below') {
      s += `<text x="${mx}" y="${my+22+off}" style="fill:${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="middle" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx}" y="${my+38+off}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'right') {
      s += `<text x="${mx+16+off}" y="${my-4}" style="fill:${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="start" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx+16+off}" y="${my+12}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="start" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'left') {
      s += `<text x="${mx-16-off}" y="${my-4}" style="fill:${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="end" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx-16-off}" y="${my+12}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="end" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'along') {
      const angle = Math.atan2(dy,dx) * 180 / Math.PI;
      const tOff = 7; // perpendicular offset multiplier to clear the line
      s += `<text x="${mx+nx*tOff}" y="${my+ny*tOff-6}" style="fill:${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="middle" font-weight="700" transform="rotate(${angle},${mx+nx*tOff},${my+ny*tOff-6})">${label}</text>`;
      if (sublabel) s += `<text x="${mx+nx*tOff}" y="${my+ny*tOff+10}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle" letter-spacing="2" transform="rotate(${angle},${mx+nx*tOff},${my+ny*tOff+10})">${sublabel}</text>`;
    }
    return s;
  }

  // ── Helper: extension line (thin guide from geometry to dimension) ──
  function extLine(x1,y1,x2,y2) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#878c99" stroke-width="0.7" stroke-dasharray="3,3" opacity="0.4"/>`;
  }

  // ── SVG defs ──
  let out = `<defs>
    <linearGradient id="enc-front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#282c35"/><stop offset="100%" stop-color="#1b1e24"/>
    </linearGradient>
    <linearGradient id="enc-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22262e"/><stop offset="100%" stop-color="#1b1e24"/>
    </linearGradient>
    <linearGradient id="enc-top" x1="0" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#2a2e38"/><stop offset="100%" stop-color="#353a45"/>
    </linearGradient>
    <linearGradient id="ins-front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3e48"/><stop offset="100%" stop-color="#2c3038"/>
    </linearGradient>
    <linearGradient id="ins-side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#353940"/><stop offset="100%" stop-color="#2a2e35"/>
    </linearGradient>
    <linearGradient id="ins-top" x1="0" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#3e424c"/><stop offset="100%" stop-color="#484d58"/>
    </linearGradient>
    <linearGradient id="flame-grad" x1="0.5" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#e8a838" stop-opacity="0.8"/><stop offset="40%" stop-color="#d45a20" stop-opacity="0.5"/><stop offset="100%" stop-color="#e8a838" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cutout-glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style="stop-color:var(--ember-t, #f05a5e)" stop-opacity="0.12"/><stop offset="100%" style="stop-color:var(--ember-t, #f05a5e)" stop-opacity="0.03"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="cutout-shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" style="flood-color:var(--ember-t, #f05a5e)" flood-opacity="0.25"/>
    </filter>
  </defs>`;

  // ── Enclosure box ──
  // Front face
  out += `<polygon points="${eFL.x},${eFL.y} ${eFR.x},${eFR.y} ${eFTR.x},${eFTR.y} ${eFTL.x},${eFTL.y}"
    fill="url(#enc-front)" stroke="#3a3e48" stroke-width="1.5"/>`;
  // Right side face
  out += `<polygon points="${eFR.x},${eFR.y} ${eBR.x},${eBR.y} ${eBTR.x},${eBTR.y} ${eFTR.x},${eFTR.y}"
    fill="url(#enc-side)" stroke="#3a3e48" stroke-width="1.5"/>`;
  // Top face
  out += `<polygon points="${eFTL.x},${eFTL.y} ${eFTR.x},${eFTR.y} ${eBTR.x},${eBTR.y} ${eBTL.x},${eBTL.y}"
    fill="url(#enc-top)" stroke="#3a3e48" stroke-width="1.5"/>`;

  // ── Cutout hole (prominent) ──
  // Outer glow
  out += `<polygon points="${cFL.x},${cFL.y} ${cFR.x},${cFR.y} ${cBR.x},${cBR.y} ${cBL.x},${cBL.y}"
    fill="url(#cutout-glow)" style="stroke:var(--ember-t, #f05a5e)" stroke-width="2.5" filter="url(#cutout-shadow)"/>`;
  // Inner dark fill
  out += `<polygon points="${cFL.x+3},${cFL.y+1} ${cFR.x-3},${cFR.y+1} ${cBR.x-3},${cBR.y+1} ${cBL.x+3},${cBL.y+1}"
    fill="#0c0e11" stroke="none"/>`;


  // ── "ENCLOSURE" label ──
  const encLabelX = (eFL.x + eFR.x) / 2;
  const encLabelY = (eFL.y + eFTL.y) / 2 + 6;
  out += `<text x="${encLabelX}" y="${encLabelY}" fill="#878c99" font-family="Figtree,sans-serif"
    font-size="14" text-anchor="middle" font-weight="600" letter-spacing="4" opacity="0.6">ENCLOSURE</text>`;

  // ── "CUTOUT" label — below the cutout front edge, between cutout and enclosure front ──
  const cutLabelX = (cFL.x + cFR.x) / 2;
  const cutLabelY = cFL.y + (eFTL.y - cFL.y) / 2 + cutPadD * isoY / 2;
  out += `<text x="${cutLabelX}" y="${cutLabelY + 2}" style="fill:var(--ember-t, #f05a5e)" font-family="Figtree,sans-serif"
    font-size="11" text-anchor="middle" font-weight="700" letter-spacing="3">CUTOUT</text>`;


  // ── Drop-in arrows (purely vertical, manual arrowheads) ──
  const arrowCount = 3 * unitSizes.length;
  for (let i = 0; i < arrowCount; i++) {
    const t = (i + 1) / (arrowCount + 1);
    const ax = cFL.x + t * (cFR.x - cFL.x);
    const topY = iFL.y + 12;
    const botY = cFL.y - 8;
    // Dashed line (stop short for arrowhead)
    out += `<line x1="${ax}" y1="${topY}" x2="${ax}" y2="${botY - 10}"
      style="stroke:var(--ember-t, #f05a5e)" stroke-width="1.8" stroke-dasharray="5,5" opacity="0.55"/>`;
    // Arrowhead pointing down
    out += `<polygon points="${ax},${botY} ${ax-5},${botY-12} ${ax+5},${botY-12}"
      style="fill:var(--ember-t, #f05a5e)" opacity="0.7"/>`;
  }

  // ── Insert boxes ──
  // Hidden faces (dashed) — the row's far left and back, not each unit's:
  // butted inserts have no side faces between them.
  out += `<polygon points="${iFL.x},${iFL.y} ${iBL.x},${iBL.y} ${iBTL.x},${iBTL.y} ${iFTL.x},${iFTL.y}"
    fill="none" stroke="#4a4f5c" stroke-width="1" stroke-dasharray="5,4" opacity="0.3"/>`;
  out += `<polygon points="${iBL.x},${iBL.y} ${iBR.x},${iBR.y} ${iBTR.x},${iBTR.y} ${iBTL.x},${iBTL.y}"
    fill="none" stroke="#4a4f5c" stroke-width="1" stroke-dasharray="5,4" opacity="0.3"/>`;

  // Visible faces, one unit at a time so the seam between ganged inserts reads
  // as an edge rather than disappearing into one long box.
  for (const u of units) {
    out += `<polygon points="${u.fl.x},${u.fl.y} ${u.fr.x},${u.fr.y} ${u.ftr.x},${u.ftr.y} ${u.ftl.x},${u.ftl.y}"
      fill="url(#ins-front)" stroke="#5a5e68" stroke-width="1.5"/>`;
    out += `<polygon points="${u.ftl.x},${u.ftl.y} ${u.ftr.x},${u.ftr.y} ${u.btr.x},${u.btr.y} ${u.btl.x},${u.btl.y}"
      fill="url(#ins-top)" stroke="#5a5e68" stroke-width="1.5"/>`;
  }
  // Right side face belongs to the row, not to a unit.
  out += `<polygon points="${iFR.x},${iFR.y} ${iBR.x},${iBR.y} ${iBTR.x},${iBTR.y} ${iFTR.x},${iFTR.y}"
    fill="url(#ins-side)" stroke="#5a5e68" stroke-width="1.5"/>`;

  // ── Flame / light source on top of each insert ──
  const ledInsetSide = 12;
  // Center strip: 30% of depth, centered at 50% depth
  const ledDepthFrac = 0.30;
  const ledStartFrac = 0.5 - ledDepthFrac / 2;  // 0.35
  const ledEndFrac = 0.5 + ledDepthFrac / 2;     // 0.65
  for (const u of units) {
    const ledFL = {
      x: u.ftl.x + ledInsetSide + d * isoX * ledStartFrac,
      y: u.ftl.y - d * isoY * ledStartFrac
    };
    const ledFR = {
      x: u.ftr.x - ledInsetSide + d * isoX * ledStartFrac,
      y: u.ftr.y - d * isoY * ledStartFrac
    };
    const ledBL = {
      x: u.ftl.x + ledInsetSide + d * isoX * ledEndFrac,
      y: u.ftl.y - d * isoY * ledEndFrac
    };
    const ledBR = {
      x: u.ftr.x - ledInsetSide + d * isoX * ledEndFrac,
      y: u.ftr.y - d * isoY * ledEndFrac
    };
    // LED strip
    out += `<polygon points="${ledFL.x},${ledFL.y} ${ledFR.x},${ledFR.y} ${ledBR.x},${ledBR.y} ${ledBL.x},${ledBL.y}"
      fill="#e8a838" opacity="0.25" filter="url(#glow)"/>`;
    out += `<polygon points="${ledFL.x},${ledFL.y} ${ledFR.x},${ledFR.y} ${ledBR.x},${ledBR.y} ${ledBL.x},${ledBL.y}"
      fill="none" stroke="#e8a838" stroke-width="1" opacity="0.5"/>`;
    // Flame wisps rising from top
    const flameCx = (u.ftl.x + u.btr.x) / 2;
    const flameCy = (u.ftl.y + u.btr.y) / 2;
    const flameW = (ledFR.x - ledFL.x) * 0.4;
    out += `<ellipse cx="${flameCx}" cy="${flameCy - 8}"
      rx="${flameW / 2}" ry="14"
      fill="url(#flame-grad)" filter="url(#glow)" opacity="0.5"/>`;
    // Smaller secondary wisps
    out += `<ellipse cx="${flameCx - flameW * 0.4}" cy="${flameCy - 5}"
      rx="${flameW / 4}" ry="10"
      fill="url(#flame-grad)" filter="url(#glow)" opacity="0.3"/>`;
    out += `<ellipse cx="${flameCx + flameW * 0.4}" cy="${flameCy - 5}"
      rx="${flameW / 4}" ry="10"
      fill="url(#flame-grad)" filter="url(#glow)" opacity="0.3"/>`;
  }

  // ── Labels on the insert front faces ──
  // One insert carries the model name; a ganged run labels each unit with its
  // own size and puts the model name above the row, where it has the width.
  const insLabelY = (iFL.y + iFTL.y) / 2 + 4;
  if (units.length === 1) {
    out += `<text x="${(iFL.x + iFR.x) / 2}" y="${insLabelY}" fill="#b0b4be" font-family="Figtree,sans-serif"
      font-size="12" text-anchor="middle" font-weight="600" letter-spacing="2">${modelName.toUpperCase()}</text>`;
  } else {
    for (const u of units) {
      out += `<text x="${(u.fl.x + u.fr.x) / 2}" y="${insLabelY}" fill="#b0b4be" font-family="Figtree,sans-serif"
        font-size="12" text-anchor="middle" font-weight="600" letter-spacing="2">${u.size}"</text>`;
    }
    const runLabel = `${modelName.toUpperCase()} · ${units.map(u => u.size + '"').join(' + ')} GANGED`;
    out += `<text x="${insCx + d * isoX / 2}" y="${iBTL.y - 14}" fill="#878c99" font-family="Figtree,sans-serif"
      font-size="11" text-anchor="middle" font-weight="600" letter-spacing="3">${runLabel}</text>`;
    // Seam where the units butt. Drawn across the top face only — it needs to
    // read as a joint, and the caption above already names the run.
    for (let i = 1; i < units.length; i++) {
      const sTop = units[i].ftl, sBack = units[i].btl;
      out += `<line x1="${sTop.x}" y1="${sTop.y}" x2="${sBack.x}" y2="${sBack.y}"
        stroke="#6f7480" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.8"/>`;
    }
  }

  // ════════════════════════════════════════════════
  // ── CUTOUT DIMENSIONS (primary focus) ──
  // ════════════════════════════════════════════════

  // ── Width: horizontal below the enclosure front face ──
  const wDimY = eFL.y + 36;
  // Extension lines from cutout front corners down
  out += extLine(cFL.x, cFL.y+8, cFL.x, wDimY+6);
  out += extLine(cFR.x, cFR.y+8, cFR.x, wDimY+6);
  out += dimLine(cFL.x, wDimY, cFR.x, wDimY, frac(dims.w), 'WIDTH', 'below', 0);

  // ── Depth: along right side of cutout (isometric diagonal) ──
  const depthOff = 90;
  const dS = { x: cFR.x + depthOff, y: cFR.y };
  const dE = { x: cBR.x + depthOff, y: cBR.y };
  out += extLine(cFR.x+6, cFR.y, dS.x+4, dS.y);
  out += extLine(cBR.x+6, cBR.y, dE.x+4, dE.y);
  out += dimLine(dS.x, dS.y, dE.x, dE.y, frac(dims.d), 'DEPTH', 'along', 0);

  // ── Height: vertical on left side of enclosure ──
  const hDimX = eFL.x - 36;
  out += extLine(eFL.x-6, eFL.y, hDimX-6, eFL.y);
  out += extLine(eFTL.x-6, eFTL.y, hDimX-6, eFTL.y);
  out += dimLine(hDimX, eFL.y, hDimX, eFTL.y, frac(dims.h), 'Min. HEIGHT', 'left', 0);

  // ── Compute tight viewBox from all significant points ──
  const allPts = [
    eFL, eFR, eBL, eBR, eFTL, eFTR, eBTL, eBTR,
    iFL, iFR, iBL, iBR, iFTL, iFTR, iBTL, iBTR,
    cFL, cFR, cBL, cBR,
    // the ganged-run caption sits above the back-top edge
    { x: insCx, y: iBTL.y - 30 },
    // Dimension endpoints. The left reserve carries "Min. HEIGHT", which is
    // the longest label in the drawing — 40 units cut it off on narrow
    // screens, where the browser floors SVG text at its minimum font size and
    // the glyphs stop scaling down with the viewBox.
    { x: hDimX - 96, y: eFL.y }, { x: hDimX - 96, y: eFTL.y },
    { x: dS.x + 40, y: dS.y }, { x: dE.x + 40, y: dE.y },
    { x: cFL.x, y: wDimY + 50 },
  ];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of allPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const pad = 24;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);

  svg.innerHTML = out;
}

// ── Interactive Light-Trap Diagram (2D SVG side view) ──
//
// Rebuilt 2026-08 on the install-crew reference drawings (side view, single-
// and double-sided hearth): a flat architectural cross-section in place of
// the old 3D canvas cutaway. The calculations are unchanged — only the
// drawing and its labels are new. Rendered as SVG via string concat (same
// approach as drawCutoutDiagram) with every colour bound to a CSS class in
// styles.css, so the diagram rides the theme tokens and follows the
// light/dark switch without a redraw.
//
// Orientation (matches the reference drawings — flipped from the old canvas):
//   LEFT  = BACK  (an existing interior wall in single mode)
//   RIGHT = FRONT (room side, viewing opening)
//   y increases upward — floor at the bottom.
//
// Anatomy, floor up: the hearth base (insert height + 2" of cord space, the
// insert hanging flush with the installation surface), the viewing opening
// (slider), then the recessed light trap — the non-reflective 5" band at the
// bottom of the chase — with the chase continuing past a break symbol. Light
// fans up from the media tray at the model's published angles; the back ray
// is drawn from the same offset the back-max formula uses, so the picture
// and the number always agree.

function drawLightDiagram() {
  const { modelKey, model, dims, setback, backSetback, openingHeight, hearthType } = getState();
  const isDouble = hearthType === 'double';

  // ── Light geometry — identical formulas to update() ──
  const fRad = model.frontAngle * Math.PI / 180;
  const bRad = model.backAngle * Math.PI / 180;
  const maxOpening     = Math.round((setback + model.lightOffset) * Math.tan(fRad) - 1);
  const backMaxOpening = Math.round((backSetback + model.lightOffsetBack) * Math.tan(bRad) - 1);
  const frontHit = (setback + model.lightOffset) * Math.tan(fRad);          // exact rise where the front ray meets the front plane
  const backHit  = (backSetback + model.lightOffsetBack) * Math.tan(bRad);  // …and the back ray, the back plane
  const isFrontOverMax = openingHeight > maxOpening;
  const isBackOverMax  = isDouble && openingHeight > backMaxOpening;

  // ── Inch-space layout — x = 0 at the back interior plane, +x toward the room ──
  const cordSpace  = 2;                       // wiring space under the insert
  const wallT      = 1.25;                    // chase wall material
  const partT      = 3;                       // existing partition (single mode)
  const trapH      = 5;                       // matte light-trap band height
  const chaseAbove = 8;                       // chase shown above the trap before the break
  const baseLip    = 1.5;                     // hearth base proud of the chase
  const insBack  = backSetback;
  const insFront = insBack + dims.d;
  const plane    = insFront + setback;        // front interior plane
  const surf     = cordSpace + dims.h;        // installation surface
  const openTop  = surf + openingHeight;      // bottom of the light trap
  const trapTop  = openTop + trapH;
  const breakY   = trapTop + chaseAbove;
  const ledF = insFront - model.lightOffset;      // front light origin (media-tray front edge)
  const ledB = insBack + model.lightOffsetBack;   // back light origin — the offset the back-max math uses
  const nominalD = modelKey === 'lite' ? 9.375 : 12;  // the insert depth the printed guides quote

  // ── Pixel mapping — fixed viewBox, content fitted ──
  const W = 720, H = 620;
  const marginL = 96, marginR = 208, marginT = 46, marginB = 40;
  const leftIn  = isDouble ? wallT + baseLip : partT;
  const rightIn = wallT + baseLip;
  const drawW = W - marginL - marginR, drawH = H - marginT - marginB;
  const totalIn = leftIn + plane + rightIn;
  const topIn = breakY + 1;
  const ppi = Math.min(drawW / totalIn, drawH / topIn);
  const x0 = marginL + (drawW - totalIn * ppi) / 2 + leftIn * ppi;   // px of inch-x 0
  const floorPy = H - marginB - Math.max(0, (drawH - topIn * ppi) / 2);
  const r  = n => Math.round(n * 10) / 10;
  const px = x => r(x0 + x * ppi);
  const py = y => r(floorPy - y * ppi);

  const baseL = isDouble ? -(wallT + baseLip) : 0;   // base butts the partition in single mode
  const baseR = plane + wallT + baseLip;

  const S = [];

  // ── defs: hatches (colour comes from CSS classes), flame glow ──
  S.push(`<defs>
    <pattern id="ld-hatch-wall" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line class="ld-hatchline-soft" x1="0" y1="0" x2="0" y2="9"/>
    </pattern>
    <filter id="ld-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="ld-cone-clip">
      <rect x="${px(0)}" y="${py(trapTop)}" width="${r(plane * ppi)}" height="${r((trapTop - surf) * ppi)}"/>
    </clipPath>
  </defs>`);

  // ── Helpers ──
  function zigzag(xa, xb, y) {
    // Architectural break symbol capping a wall that continues upward — a
    // compact jog at the centre, so it reads the same on a narrow partition
    // and across the full chase.
    const m = (xa + xb) / 2, j = Math.min(12, (xb - xa) * 0.25);
    return `<path class="ld-edge" stroke-width="1.1" d="M ${r(xa - 2)} ${y} L ${r(m - j)} ${y} L ${r(m - j / 2)} ${r(y - 5)} L ${r(m + j / 2)} ${r(y + 5)} L ${r(m + j)} ${y} L ${r(xb + 2)} ${y}"/>`;
  }

  function vdim(x, yTopIn, yBotIn, label, cls, size, extFromX) {
    // Vertical dimension line with ticks, arrowheads and a rotated label.
    const yT = py(yTopIn), yB = py(yBotIn);
    let s = `<line class="${cls}-line" stroke-width="1.1" x1="${x}" y1="${yT}" x2="${x}" y2="${yB}"/>`;
    s += `<line class="${cls}-line" x1="${x - 5}" y1="${yT}" x2="${x + 5}" y2="${yT}"/>`;
    s += `<line class="${cls}-line" x1="${x - 5}" y1="${yB}" x2="${x + 5}" y2="${yB}"/>`;
    s += `<polygon class="${cls}-fill" points="${x},${yT} ${x - 3.2},${r(yT + 7)} ${x + 3.2},${r(yT + 7)}"/>`;
    s += `<polygon class="${cls}-fill" points="${x},${yB} ${x - 3.2},${r(yB - 7)} ${x + 3.2},${r(yB - 7)}"/>`;
    if (extFromX != null) {
      s += `<line class="ld-leader" stroke-dasharray="3,3" x1="${extFromX}" y1="${yT}" x2="${x + 5}" y2="${yT}"/>`;
      s += `<line class="ld-leader" stroke-dasharray="3,3" x1="${extFromX}" y1="${yB}" x2="${x + 5}" y2="${yB}"/>`;
    }
    const my = r((yT + yB) / 2);
    const lx = r(x + size + 5);  // label rides the outside of the line
    s += `<text class="${cls}-ink" font-size="${size}" font-weight="700" letter-spacing="0.5" text-anchor="middle"
      x="${lx}" y="${my}" transform="rotate(-90 ${lx} ${my})">${label}</text>`;
    return s;
  }

  function hticks(x1, x2, y, cls) {
    let s = `<line class="${cls}-line" stroke-width="1.1" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
    s += `<line class="${cls}-line" x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}"/>`;
    s += `<line class="${cls}-line" x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}"/>`;
    if (x2 - x1 > 26) {
      s += `<polygon class="${cls}-fill" points="${x1},${y} ${r(x1 + 7)},${y - 3.2} ${r(x1 + 7)},${y + 3.2}"/>`;
      s += `<polygon class="${cls}-fill" points="${x2},${y} ${r(x2 - 7)},${y - 3.2} ${r(x2 - 7)},${y + 3.2}"/>`;
    }
    return s;
  }

  // ── Caption (top-left) ──
  S.push(`<text class="ld-ink" font-size="12" font-weight="700" letter-spacing="2" x="14" y="24">SIDE VIEW</text>`);
  S.push(`<text class="ld-muted-ink" font-size="9.5" letter-spacing="1.5" x="14" y="40">${isDouble ? 'DOUBLE-SIDED HEARTH' : 'SINGLE-SIDED HEARTH'}</text>`);

  // ── Existing partition (single mode) ──
  if (!isDouble) {
    const pxa = px(-partT), pxb = px(0);
    S.push(`<rect class="ld-wall" x="${pxa}" y="${py(breakY)}" width="${r(partT * ppi)}" height="${r(breakY * ppi)}"/>`);
    S.push(`<rect fill="url(#ld-hatch-wall)" x="${pxa}" y="${py(breakY)}" width="${r(partT * ppi)}" height="${r(breakY * ppi)}"/>`);
    S.push(`<path class="ld-edge" d="M ${pxa} ${py(breakY)} V ${py(0)} M ${pxb} ${py(breakY)} V ${py(0)}"/>`);
    const wy = r((py(surf) + py(breakY)) / 2);
    S.push(`<text class="ld-muted-ink" font-size="8.5" font-weight="600" letter-spacing="1" text-anchor="middle"
      x="${r((pxa + pxb) / 2)}" y="${wy}" transform="rotate(-90 ${r((pxa + pxb) / 2)} ${wy})">EXISTING INTERIOR WALL</text>`);

    // Potential downdrafts — cool air falling inside the wall cavity (see
    // the "Avoiding downdrafts" field note). Arrows and label live in the
    // wall band itself.
    const wx = r((pxa + pxb) / 2);
    const arrowTop = py(surf + 6);
    for (let i = 0; i < 2; i++) {
      const x = wx + (i === 0 ? -6 : 7), yTop = arrowTop + i * 12;
      S.push(`<path class="ld-frost-line" fill="none" stroke-width="1.6" stroke-linecap="round"
        d="M ${x} ${yTop} q 5 7 0 14 q -5 7 0 14 q 5 7 0 14"/>`);
      S.push(`<polygon class="ld-frost-fill" points="${x},${r(yTop + 49)} ${x - 3.4},${r(yTop + 41)} ${x + 3.4},${r(yTop + 41)}"/>`);
    }
    const dly = Math.min(r(arrowTop + 137), r(py(0) - 72));
    S.push(`<text class="ld-frost-ink" font-size="8.5" font-weight="600" letter-spacing="1" text-anchor="middle"
      x="${wx}" y="${dly}" transform="rotate(-90 ${wx} ${dly})">POTENTIAL DOWNDRAFTS</text>`);
  }

  // ── Hearth base ──
  S.push(`<rect class="ld-wall" x="${px(baseL)}" y="${py(surf)}" width="${r((baseR - baseL) * ppi)}" height="${r(surf * ppi)}"/>`);
  S.push(`<path class="ld-edge" d="M ${px(baseL)} ${py(surf)} V ${py(0)} H ${px(baseR)} V ${py(surf)}"/>`);
  // Toe-kick vent — a hole through the face at the floor, drawn as a
  // hidden-line dashed cutout (each open face; both in double mode).
  const nD = 1.6, nH = 2;  // toe-kick hole depth and height
  const kick = (faceIn, dir) =>
    `<path class="ld-edge" stroke-dasharray="3,3" d="M ${px(faceIn)} ${py(nH)} H ${px(faceIn - dir * nD)} V ${py(0)}"/>`;
  S.push(kick(baseR, 1));
  if (isDouble) S.push(kick(baseL, -1));
  // Room floor, running on forward past the enclosure.
  const floorExt = 5.5;
  S.push(`<line class="ld-edge" stroke-width="1.3" x1="${px(isDouble ? baseL - floorExt : -partT)}" y1="${py(0)}" x2="${px(baseR + floorExt)}" y2="${py(0)}"/>`);
  // Installation surface — the emphasized top edge the insert hangs from.
  S.push(`<line class="ld-surface" stroke-width="1.6" x1="${px(baseL)}" y1="${py(surf)}" x2="${px(baseR)}" y2="${py(surf)}"/>`);
  // (The toe-kick airflow callout names the base's bottom edge directly —
  // an accent line under it was tried and cut in design review.)

  // ── Insert (hangs from the installation surface; cord space below) ──
  const iX = px(insBack), iW = r(dims.d * ppi), iY = py(surf), iH = r(dims.h * ppi);
  S.push(`<rect class="ld-insert" stroke-width="1.2" x="${iX}" y="${iY}" width="${iW}" height="${iH}"/>`);
  S.push(`<text class="ld-insert-ink" font-size="10" font-weight="600" letter-spacing="1.2" text-anchor="middle"
    x="${r(iX + iW / 2)}" y="${r(iY + iH * 0.52)}">${model.name.toUpperCase()}</text>`);
  // Nominal insert depth, dimensioned inside the box like the reference drawing.
  if (iH > 52) {
    const dy = r(py(cordSpace + 1.3));
    S.push(hticks(iX + 4, iX + iW - 4, dy, 'ld-insert'));
    S.push(`<text class="ld-insert-ink" font-size="8.5" font-weight="600" text-anchor="middle"
      x="${r(iX + iW / 2)}" y="${dy - 5}">${frac(nominalD)}</text>`);
  }

  // ── Light cone (clipped to the recess: between the planes, up to the trap ceiling) ──
  const reach = trapTop; // extend edge rays well past the clip
  const coneF = { x: ledF + reach / Math.tan(fRad), y: surf + reach };
  const coneB = { x: ledB - reach / Math.tan(bRad), y: surf + reach };
  S.push(`<polygon class="ld-cone" clip-path="url(#ld-cone-clip)"
    points="${px(ledF)},${py(surf)} ${px(coneF.x)},${py(coneF.y)} ${px(coneB.x)},${py(coneB.y)} ${px(ledB)},${py(surf)}"/>`);

  // Edge rays, dashed — stopped where they meet a wall or the trap ceiling.
  const fRise = Math.min(frontHit, trapTop - surf);
  const bRise = Math.min(backHit, trapTop - surf);
  S.push(`<line class="ld-amber-line" stroke-width="1.6" stroke-dasharray="7,5" opacity="0.9"
    x1="${px(ledF)}" y1="${py(surf)}" x2="${px(ledF + fRise / Math.tan(fRad))}" y2="${py(surf + fRise)}"/>`);
  S.push(`<line class="ld-amber-line" stroke-width="1.6" stroke-dasharray="7,5" opacity="0.9"
    x1="${px(ledB)}" y1="${py(surf)}" x2="${px(ledB - bRise / Math.tan(bRad))}" y2="${py(surf + bRise)}"/>`);

  // ── Angle arcs at the media tray ──
  const arcR = Math.min(30, Math.max(16, 2.2 * ppi));
  {
    const cx = px(ledF), cy = py(surf);
    const ex = r(cx + arcR * Math.cos(fRad)), ey = r(cy - arcR * Math.sin(fRad));
    S.push(`<path class="ld-dim-line" fill="none" stroke-width="1.3" d="M ${r(cx + arcR)} ${cy} A ${arcR} ${arcR} 0 0 0 ${ex} ${ey}"/>`);
    S.push(`<text class="ld-dim-ink" font-size="10.5" font-weight="700" text-anchor="start"
      x="${r(cx + (arcR + 6) * Math.cos(fRad / 2))}" y="${r(cy - (arcR + 6) * Math.sin(fRad / 2) + 3)}">${model.frontAngle}&#176;</text>`);
  }
  {
    const cx = px(ledB), cy = py(surf);
    const ex = r(cx - arcR * Math.cos(bRad)), ey = r(cy - arcR * Math.sin(bRad));
    S.push(`<path class="ld-dim-line" fill="none" stroke-width="1.3" d="M ${r(cx - arcR)} ${cy} A ${arcR} ${arcR} 0 0 1 ${ex} ${ey}"/>`);
    S.push(`<text class="ld-dim-ink" font-size="10.5" font-weight="700" text-anchor="end"
      x="${r(cx - (arcR + 6) * Math.cos(bRad / 2))}" y="${r(cy - (arcR + 6) * Math.sin(bRad / 2) + 3)}">${model.backAngle}&#176;</text>`);
  }

  // ── Media tray (LED source) and flame ──
  S.push(`<rect class="ld-amber-fill" filter="url(#ld-glow)" rx="1.5"
    x="${px(ledB)}" y="${py(surf) - 2}" width="${r((ledF - ledB) * ppi)}" height="4"/>`);
  {
    const cx = px((ledF + ledB) / 2), yb = py(surf) - 1;
    const h = Math.max(26, Math.min(44, 3.2 * ppi)), w = h * 0.4;
    const flame = (hh, ww) => `M ${cx} ${r(yb - hh)}
      C ${r(cx + ww * 0.5)} ${r(yb - hh * 0.72)} ${r(cx + ww)} ${r(yb - hh * 0.48)} ${r(cx + ww)} ${r(yb - hh * 0.26)}
      C ${r(cx + ww)} ${r(yb - hh * 0.07)} ${r(cx + ww * 0.55)} ${yb} ${cx} ${yb}
      C ${r(cx - ww * 0.55)} ${yb} ${r(cx - ww)} ${r(yb - hh * 0.07)} ${r(cx - ww)} ${r(yb - hh * 0.26)}
      C ${r(cx - ww)} ${r(yb - hh * 0.48)} ${r(cx - ww * 0.5)} ${r(yb - hh * 0.72)} ${cx} ${r(yb - hh)} Z`;
    S.push(`<path class="ld-flame-outer" filter="url(#ld-glow)" d="${flame(h, w)}"/>`);
    S.push(`<path class="ld-flame-inner" d="${flame(h * 0.55, w * 0.52)}"/>`);
  }

  // ── Light escaping past the trap (wedge + ray drawn before the walls, so
  // the beam reads as passing under them; the label lands after) ──
  function escapeWedge(atPlane, hitIn, tanA, mirror) {
    const dir = mirror ? -1 : 1;
    const ext = 4.2;
    const y0 = surf + hitIn, y1 = openTop;
    if (y1 <= y0) return '';
    const xa = px(atPlane), xb = r(px(atPlane) + dir * ext * ppi);
    let s = `<polygon class="ld-danger-fill" opacity="0.14"
      points="${xa},${py(y0)} ${xa},${py(y1)} ${xb},${py(y1 + ext * tanA)} ${xb},${py(y0 + ext * tanA)}"/>`;
    s += `<line class="ld-danger-line" stroke-width="1.6" stroke-dasharray="5,3"
      x1="${xa}" y1="${py(y0)}" x2="${xb}" y2="${py(y0 + ext * tanA)}"/>`;
    return s;
  }
  if (isFrontOverMax) S.push(escapeWedge(plane, frontHit, Math.tan(fRad), false));
  if (isBackOverMax)  S.push(escapeWedge(0, backHit, Math.tan(bRad), true));

  // ── Chase above the recess — solid up to the break, like the printed
  // drawings — with the matte trap band on each supporting leg ──
  function trapLeg(innerIn, outerIn) {
    const lo = Math.min(innerIn, outerIn);
    let s = `<rect class="ld-wall" x="${px(lo)}" y="${py(trapTop)}" width="${r(wallT * ppi)}" height="${r(trapH * ppi)}"/>`;
    s += `<path class="ld-edge" d="M ${px(innerIn)} ${py(trapTop)} V ${py(openTop)} H ${px(outerIn)}"/>`;
    return s;
  }
  const slabL = isDouble ? -wallT : 0, slabR = plane + wallT;
  S.push(`<rect class="ld-wall" x="${px(slabL)}" y="${py(breakY)}" width="${r((slabR - slabL) * ppi)}" height="${r(chaseAbove * ppi)}"/>`);
  S.push(trapLeg(plane, plane + wallT));                 // front
  if (isDouble) S.push(trapLeg(0, -wallT));              // back mirror
  // Recess ceiling, the outer faces up to the break, and one break across.
  S.push(`<line class="ld-edge" x1="${px(0)}" y1="${py(trapTop)}" x2="${px(plane)}" y2="${py(trapTop)}"/>`);
  S.push(`<path class="ld-edge" d="M ${px(slabR)} ${py(breakY)} V ${py(openTop)}${isDouble ? ` M ${px(slabL)} ${py(breakY)} V ${py(openTop)}` : ''}"/>`);
  S.push(zigzag(px(isDouble ? slabL : -partT), px(slabR), py(breakY)));

  // The opening plane — a faint dotted line from the trap's inner corner
  // down to the installation surface (both faces in double mode).
  const openPlane = xIn => `<line class="ld-muted-line" stroke-width="1" stroke-dasharray="2,4" opacity="0.65"
    x1="${px(xIn)}" y1="${py(openTop)}" x2="${px(xIn)}" y2="${py(surf)}"/>`;
  S.push(openPlane(plane));
  if (isDouble) S.push(openPlane(0));
  // …and the wall's hidden inner face carrying on up through the solid
  // chase, hidden-line dashed.
  const hiddenFace = xIn => `<line class="ld-edge" stroke-dasharray="3,3"
    x1="${px(xIn)}" y1="${py(breakY)}" x2="${px(xIn)}" y2="${py(trapTop)}"/>`;
  S.push(hiddenFace(plane));
  if (isDouble) S.push(hiddenFace(0));

  // ── Labels inside the recess ──
  S.push(`<text class="ld-ink" font-size="10" font-weight="700" letter-spacing="1.5" text-anchor="middle"
    x="${px(plane / 2)}" y="${py(trapTop) + 14}">RECESSED LIGHT TRAP</text>`);
  {
    // Keep the label clear of the front max marker (or the escaping ray),
    // which sits at the same height when the setback is small.
    let hMid = Math.min(openingHeight * 0.55, openingHeight - 2.5);
    const markY = isFrontOverMax ? frontHit : maxOpening;
    if (Math.abs(hMid - markY) < 1.8) hMid = Math.max(3.6, markY - 2.4);
    const xf = ledF + hMid / Math.tan(fRad), xb = ledB - hMid / Math.tan(bRad);
    S.push(`<text class="ld-dim-ink" font-size="10" font-weight="700" letter-spacing="1.5" text-anchor="middle"
      x="${px(Math.max(0, xb) / 2 + Math.min(plane, xf) / 2)}" y="${py(surf + hMid)}">LIGHT PATH</text>`);
  }

  // ── Recommended-max markers — over max, the escape wedge already marks
  // the limit, so its label carries the number instead ──
  function maxLine(atPlane, yIn, label, anchorStart) {
    if (yIn <= surf + 0.5 || yIn >= trapTop - 0.3) return '';
    const dir = anchorStart ? 1 : -1;
    const xEnd = r(px(atPlane) + dir * 3.6 * ppi);
    // A max marker well above the built opening sits in the trap-band zone;
    // its label drops below the line there so it can't strike through the
    // RECESSED LIGHT TRAP label under the ceiling.
    const labelY = yIn > openTop + 1.5 ? py(yIn) + 12 : py(yIn) - 5;
    let s = `<line class="ld-dim-line" stroke-width="1.3" stroke-dasharray="5,3"
      x1="${px(atPlane)}" y1="${py(yIn)}" x2="${xEnd}" y2="${py(yIn)}"/>`;
    s += `<text class="ld-dim-ink" font-size="9" font-weight="700" letter-spacing="0.5" text-anchor="${anchorStart ? 'start' : 'end'}"
      x="${r(px(atPlane) + dir * 5)}" y="${labelY}">${label}</text>`;
    return s;
  }
  function escapeLabel(atPlane, hitIn, maxIn, mirror) {
    return `<text class="ld-danger-ink" font-size="9.5" font-weight="700" letter-spacing="1" text-anchor="${mirror ? 'start' : 'end'}"
      x="${r(px(atPlane) + (mirror ? 6 : -6))}" y="${py(surf + hitIn) + 15}">LIGHT ESCAPE &#8212; MAX ${maxIn}"</text>`;
  }
  if (isFrontOverMax) S.push(escapeLabel(plane, frontHit, maxOpening, false));
  else S.push(maxLine(plane, surf + maxOpening, (isDouble ? 'FRONT MAX ' : 'MAX ') + maxOpening + '"', false));
  if (isDouble) {
    if (isBackOverMax) S.push(escapeLabel(0, backHit, backMaxOpening, true));
    else S.push(maxLine(0, surf + backMaxOpening, 'BACK MAX ' + backMaxOpening + '"', true));
  }

  // ── Dimensions ──
  // Total depth, inside the chase above the trap. The label quotes the
  // nominal insert depth (12" / 9 3/8"), matching the printed guides.
  {
    const y = py(trapTop + 3);
    S.push(hticks(px(0), px(plane), y, 'ld-muted'));
    S.push(`<text class="ld-muted-ink" font-size="8.5" letter-spacing="1.5" text-anchor="middle" x="${px(plane / 2)}" y="${y - 20}">TOTAL DEPTH</text>`);
    S.push(`<text class="ld-ink" font-size="11.5" font-weight="700" text-anchor="middle" x="${px(plane / 2)}" y="${y - 7}">${frac(setback + nominalD + backSetback)} + material</text>`);
  }
  // Setbacks, at the installation surface — tag spelled out on two lines.
  function sbDim(x1In, x2In, value, tagTop) {
    if (x2In - x1In < 0.45) return '';
    const y = py(surf + 1), mx = px((x1In + x2In) / 2);
    let s = hticks(px(x1In), px(x2In), y, 'ld-dim');
    s += `<text class="ld-dim-ink" font-size="10.5" font-weight="700" text-anchor="middle" x="${mx}" y="${y - 6}">${value}</text>`;
    s += `<text class="ld-muted-ink" font-size="8" letter-spacing="1" text-anchor="middle" x="${mx}" y="${y - 27}">${tagTop}</text>`;
    s += `<text class="ld-muted-ink" font-size="8" letter-spacing="1" text-anchor="middle" x="${mx}" y="${y - 18}">SETBACK</text>`;
    return s;
  }
  S.push(sbDim(0, insBack, frac(backSetback), 'BACK'));
  S.push(sbDim(insFront, plane, frac(setback), 'FRONT'));

  // Vertical stack outside the front wall: opening (slider), trap band, base height.
  // The whole stack sits outside the base's front face so nothing reads as
  // being inside the drawing.
  const vdimX = r(px(baseR) + 16);
  const openCls = isFrontOverMax || isBackOverMax ? 'ld-danger' : 'ld-dim';
  const openLbl = 'OPENING ' + frac(openingHeight) + (isFrontOverMax || isBackOverMax ? ' — OVER MAX' : '');
  S.push(vdim(vdimX, openTop, surf, openLbl, openCls, 10.5, px(plane + wallT)));
  S.push(vdim(vdimX, trapTop, openTop, frac(trapH), 'ld-muted', 9, px(plane + wallT)));
  S.push(vdim(vdimX, surf, 0, frac(surf) + ' MIN', 'ld-muted', 9, px(baseR)));

  // ── Ground labels ──
  S.push(`<text class="ld-muted-ink" font-size="9.5" letter-spacing="2" text-anchor="middle" x="${px(isDouble ? -wallT / 2 : -partT / 2)}" y="${py(0) + 22}">BACK</text>`);
  S.push(`<text class="ld-muted-ink" font-size="9.5" letter-spacing="2" text-anchor="middle" x="${px(plane + wallT / 2)}" y="${py(0) + 22}">FRONT</text>`);

  // ── Right-rail callouts with leader lines ──
  const railX = Math.max(W - marginR + 18, vdimX + 30);
  const callouts = [
    // Matte finish points at the recess ceiling; its label rides well above
    // the target so the leader drops in at a steep, legible angle. The
    // light trap points at the band's inner bottom corner, where the max
    // line lands.
    { lines: ['NON-REFLECTIVE,', 'MATTE FINISH'], tx: px(plane * 0.68), ty: py(trapTop), ly0: Math.max(py(trapTop) - 46, 58) },
    { lines: ['LIGHT TRAP'],                      tx: px(plane),        ty: py(openTop), ly0: py(openTop) + 3 },
    { lines: ['INSTALLATION SURFACE'],            tx: px(baseR) - 6,    ty: py(surf) },
    { lines: ['TOE KICK AIR FLOW', 'IF TOP VENTS COVERED'], tx: r(px(baseR - nD * 0.35)), ty: py(nH * 0.45) },
  ];
  // Nudge overlapping labels apart, top to bottom.
  let lastBottom = -Infinity;
  for (const c of callouts) {
    c.ly = Math.max(c.ly0 || c.ty, lastBottom + 14);
    lastBottom = c.ly + (c.lines.length - 1) * 11;
  }
  for (const c of callouts) {
    S.push(`<line class="ld-leader" x1="${r(railX - 5)}" y1="${r(c.ly - 3)}" x2="${c.tx}" y2="${c.ty}"/>`);
    S.push(`<circle class="ld-leader-dot" cx="${c.tx}" cy="${c.ty}" r="1.6"/>`);
    c.lines.forEach((ln, i) => {
      S.push(`<text class="ld-muted-ink" font-size="9" font-weight="600" letter-spacing="0.8" x="${railX}" y="${r(c.ly + i * 11)}">${ln}</text>`);
    });
  }

  // ── Flush ──
  lightSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  lightSvg.setAttribute('aria-label',
    `Side cross-section of a ${isDouble ? 'double' : 'single'}-sided hearth. ` +
    `Front setback ${setback}", back setback ${backSetback}", viewing opening ${openingHeight}". ` +
    (isDouble
      ? `Recommended max opening ${Math.min(maxOpening, backMaxOpening)}" (front ${maxOpening}", back ${backMaxOpening}").`
      : `Recommended max opening ${maxOpening}".`) +
    (isFrontOverMax || isBackOverMax ? ' Warning: the opening exceeds the recommended maximum, so light will escape.' : ''));
  lightSvg.innerHTML = S.join('\n');
}

// ── Reference Table ──
function buildTable() {
  const tbody = document.getElementById('ref-table-body');
  let html = '';
  for (const [key, m] of Object.entries(MODELS)) {
    for (const [size, d] of Object.entries(m.sizes)) {
      html += `<tr>
        <td>${m.name}</td>
        <td>${size}"${d.units ? ` <span class="ref-gang">${comboLabel(d.units)}</span>` : ''}</td>
        <td>${frac(d.w)}</td>
        <td>${frac(d.d)}</td>
        <td>${frac(d.h)}</td>
        <td>${m.frontAngle}°</td>
        <td>${m.backAngle}°</td>
      </tr>`;
    }
  }
  tbody.innerHTML = html;
}

// ── Reset opening slider to recommended max ──
function resetOpeningToMax() {
  const { model, setback } = getState();
  const angleRad = model.frontAngle * Math.PI / 180;
  const maxOpening = Math.max(13, Math.round((setback + model.lightOffset) * Math.tan(angleRad) - 1));
  openingSlider.value = maxOpening;
  update();
}

// ── Event listeners ──
modelSelect.addEventListener('change', () => {
  renderSizeOptions();   // the ganged sizes belong to the Pro and Original only
  resetOpeningToMax();
});
sizeSelect.addEventListener('change', resetOpeningToMax);
setbackSlider.addEventListener('input', update);
backSetbackSlider.addEventListener('input', update);
openingSlider.addEventListener('input', update);
// (No resize listener: both diagrams are viewBox-scaled SVG now — the old
// canvas needed a redraw per breakpoint, the SVG just scales.)

hearthBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    hearthBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    hearthType = btn.dataset.hearth;
    hearthHint.textContent = hearthType === 'double'
      ? 'Double-side hearth with viewing openings on both front and back.'
      : 'Standard hearth with a single front viewing opening.';
    update();
  });
});

// ── Reset — back to the defaults the page loads with ──
document.getElementById('calc-reset').addEventListener('click', () => {
  setbackSlider.value = 6;
  backSetbackSlider.value = 2;
  hearthType = 'single';
  hearthBtns.forEach(b => b.classList.toggle('active', b.dataset.hearth === 'single'));
  hearthHint.textContent = 'Standard hearth with a single front viewing opening.';
  resetOpeningToMax();   // matches the load behaviour: opening snaps to the recommended max
});

// ── Print — a spec sheet an installer can hand to the framer ──
// The print stylesheet strips the page down to the two diagrams plus the
// summary below; printing runs in the light theme so the sheet is ink on
// white (the diagrams follow automatically — every colour is a token).
// Browsers' "Save as PDF" is the PDF path; no dependency needed.
function fillPrintSummary() {
  const { modelKey, model, dims, setback, backSetback, openingHeight, hearthType } = getState();
  const fMax = Math.round((setback + model.lightOffset) * Math.tan(model.frontAngle * Math.PI / 180) - 1);
  const bMax = Math.round((backSetback + model.lightOffsetBack) * Math.tan(model.backAngle * Math.PI / 180) - 1);
  const isDouble = hearthType === 'double';
  const rows = [
    ['Model', `${model.name} — ${sizeSelect.value}"`],
    ['Cutout (W × D × H)', `${frac(dims.w)} × ${frac(dims.d)} × ${frac(dims.h)}`],
    ['Hearth type', isDouble ? 'Double-sided' : 'Single opening'],
    ['Front setback', frac(setback)],
    ['Back setback', frac(backSetback)],
    ['Viewing opening', frac(openingHeight)],
    [isDouble ? 'Front max opening' : 'Recommended max opening', fMax + '"'],
  ];
  if (isDouble) rows.push(['Back max opening', bMax + '"']);
  rows.push(['Printed', new Date().toLocaleDateString()]);
  document.getElementById('print-summary').innerHTML =
    `<h2>Aquafire enclosure spec</h2><dl>` +
    rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('') +
    `</dl><p>Cutout width includes &frac38;" of clearance per side (&frac34;" over nominal). ` +
    `Opening heights are measured from the installation surface. aquafire.app/enclosure-guide</p>`;
}
let themeBeforePrint = null;
window.addEventListener('beforeprint', () => {
  fillPrintSummary();
  // Guarded so a doubled beforeprint (some engines fire it again around
  // the print snapshot) can't capture the already-swapped theme.
  if (themeBeforePrint === null) {
    themeBeforePrint = document.documentElement.dataset.theme || 'dark';
    document.documentElement.dataset.theme = 'light';
  }
});
window.addEventListener('afterprint', () => {
  if (themeBeforePrint) document.documentElement.dataset.theme = themeBeforePrint;
  themeBeforePrint = null;
});
document.getElementById('calc-print').addEventListener('click', () => window.print());

// ── Pre-select model and size from URL query params (?model=pro&size=100) ──
// The size options depend on the model, so this runs before they're built.
(function() {
  var params = new URLSearchParams(window.location.search);
  var m = params.get('model');
  if (m && modelSelect.querySelector('option[value="' + m + '"]')) {
    modelSelect.value = m;
  }
  renderSizeOptions();
  var s = params.get('size');
  if (s && MODELS[modelSelect.value].sizes[s]) {
    sizeSelect.value = s;
  }
})();

// ── Field-notes accordion ──
// One panel open at a time. `name` on <details> does that natively; the
// listener is the fallback for browsers that don't support it yet, and is
// skipped where they do so the browser keeps ownership of the behaviour.
//
// Deep links too: support emails and chat answers point straight at a topic
// (#faq-downdraft, …), and a linked panel has to be open when you land on it,
// which <details> won't do on its own.
(function () {
  var panels = document.querySelectorAll('.faq-item');
  if (!panels.length) return;

  if (!('name' in document.createElement('details'))) {
    panels.forEach(function (panel) {
      panel.addEventListener('toggle', function () {
        if (!panel.open) return;
        panels.forEach(function (other) { if (other !== panel) other.open = false; });
      });
    });
  }

  function openFromHash() {
    var el = document.querySelector(window.location.hash || '#_');
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();

// ── Init ──
buildTable();
resetOpeningToMax();
