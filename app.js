/* ──────────────────────────────────────────────────────────
   Aquafire Enclosure Guide – app.js
   ────────────────────────────────────────────────────────── */

// ── Model Data ──
const MODELS = {
  original: {
    name: 'Aquafire Original',
    frontAngle: 58,
    backAngle: 68,
    lightOffset: 5.3,       // front of insert → front edge of LED opening
    lightOffsetBack: 4.6,   // back of insert → back edge of LED opening
    lightWidth: 3,          // depth of LED opening (front-to-back)
    sizes: {
      20: { w: 20.25, d: 12.25, h: 12 },
      40: { w: 40.25, d: 12.25, h: 12 },
      60: { w: 60.25, d: 12.25, h: 12 },
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
      20: { w: 20.25, d: 12.25, h: 14 },
      40: { w: 40.25, d: 12.25, h: 14 },
      60: { w: 60.25, d: 12.25, h: 14 },
    },
  },
  lite: {
    name: 'Aquafire Lite',
    frontAngle: 58,
    backAngle: 68,
    lightOffset: 4.0,
    lightOffsetBack: 3.75,
    lightWidth: 3,
    sizes: {
      20: { w: 20.25, d: 9.625, h: 11 },
      40: { w: 40.25, d: 9.625, h: 11 },
      60: { w: 60.25, d: 9.625, h: 11 },
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
const cutoutD           = document.getElementById('cutout-d');
const cutoutH           = document.getElementById('cutout-h');
const maxOpeningEl      = document.getElementById('max-opening');
const maxOpeningSub     = document.getElementById('max-opening-sub');
const backMaxCard       = document.getElementById('back-max-card');
const backMaxOpeningEl  = document.getElementById('back-max-opening');
const hearthHint        = document.getElementById('hearth-hint');
const hearthBtns        = document.querySelectorAll('.hearth-btn');
const canvas            = document.getElementById('light-diagram');
const ctx               = canvas.getContext('2d');

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

  // Scale: map inches → SVG px, fit widest model (60.25"+8") into ~420px
  const scale = 420 / (60.25 + clearance * 2);
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

  // ── Insert (floating above enclosure) ──
  const gap = 70;
  const insCx = encCx;
  const insBot = eFTL.y - gap;

  const iFL = { x: insCx - w/2, y: insBot };
  const iFR = { x: insCx + w/2, y: insBot };
  const iBL = { x: iFL.x + d*isoX, y: iFL.y - d*isoY };
  const iBR = { x: iFR.x + d*isoX, y: iFR.y - d*isoY };
  const iFTL = { x: iFL.x, y: iFL.y - h };
  const iFTR = { x: iFR.x, y: iFR.y - h };
  const iBTL = { x: iBL.x, y: iBL.y - h };
  const iBTR = { x: iBR.x, y: iBR.y - h };

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
    const col = '#e8a838';
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
      s += `<text x="${mx}" y="${my+22+off}" fill="${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="middle" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx}" y="${my+38+off}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="middle" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'right') {
      s += `<text x="${mx+16+off}" y="${my-4}" fill="${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="start" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx+16+off}" y="${my+12}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="start" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'left') {
      s += `<text x="${mx-16-off}" y="${my-4}" fill="${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="end" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx-16-off}" y="${my+12}" fill="${mutedCol}" font-family="Figtree,sans-serif" font-size="11" text-anchor="end" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'along') {
      const angle = Math.atan2(dy,dx) * 180 / Math.PI;
      const tOff = 7; // perpendicular offset multiplier to clear the line
      s += `<text x="${mx+nx*tOff}" y="${my+ny*tOff-6}" fill="${col}" font-family="Figtree,sans-serif" font-size="16" text-anchor="middle" font-weight="700" transform="rotate(${angle},${mx+nx*tOff},${my+ny*tOff-6})">${label}</text>`;
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
      <stop offset="0%" stop-color="#e8a838" stop-opacity="0.12"/><stop offset="100%" stop-color="#e8a838" stop-opacity="0.03"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="cutout-shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#e8a838" flood-opacity="0.25"/>
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
    fill="url(#cutout-glow)" stroke="#e8a838" stroke-width="2.5" filter="url(#cutout-shadow)"/>`;
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
  out += `<text x="${cutLabelX}" y="${cutLabelY + 2}" fill="#e8a838" font-family="Figtree,sans-serif"
    font-size="11" text-anchor="middle" font-weight="700" letter-spacing="3">CUTOUT</text>`;


  // ── Drop-in arrows (purely vertical, manual arrowheads) ──
  const arrowCount = 3;
  for (let i = 0; i < arrowCount; i++) {
    const t = (i + 1) / (arrowCount + 1);
    const ax = cFL.x + t * (cFR.x - cFL.x);
    const topY = iFL.y + 12;
    const botY = cFL.y - 8;
    // Dashed line (stop short for arrowhead)
    out += `<line x1="${ax}" y1="${topY}" x2="${ax}" y2="${botY - 10}"
      stroke="#e8a838" stroke-width="1.8" stroke-dasharray="5,5" opacity="0.55"/>`;
    // Arrowhead pointing down
    out += `<polygon points="${ax},${botY} ${ax-5},${botY-12} ${ax+5},${botY-12}"
      fill="#e8a838" opacity="0.7"/>`;
  }

  // ── Insert box ──
  // Hidden faces (dashed)
  out += `<polygon points="${iFL.x},${iFL.y} ${iBL.x},${iBL.y} ${iBTL.x},${iBTL.y} ${iFTL.x},${iFTL.y}"
    fill="none" stroke="#4a4f5c" stroke-width="1" stroke-dasharray="5,4" opacity="0.3"/>`;
  out += `<polygon points="${iBL.x},${iBL.y} ${iBR.x},${iBR.y} ${iBTR.x},${iBTR.y} ${iBTL.x},${iBTL.y}"
    fill="none" stroke="#4a4f5c" stroke-width="1" stroke-dasharray="5,4" opacity="0.3"/>`;
  // Visible faces
  out += `<polygon points="${iFL.x},${iFL.y} ${iFR.x},${iFR.y} ${iFTR.x},${iFTR.y} ${iFTL.x},${iFTL.y}"
    fill="url(#ins-front)" stroke="#5a5e68" stroke-width="1.5"/>`;
  out += `<polygon points="${iFR.x},${iFR.y} ${iBR.x},${iBR.y} ${iBTR.x},${iBTR.y} ${iFTR.x},${iFTR.y}"
    fill="url(#ins-side)" stroke="#5a5e68" stroke-width="1.5"/>`;
  out += `<polygon points="${iFTL.x},${iFTL.y} ${iFTR.x},${iFTR.y} ${iBTR.x},${iBTR.y} ${iBTL.x},${iBTL.y}"
    fill="url(#ins-top)" stroke="#5a5e68" stroke-width="1.5"/>`;

  // ── Flame / light source on top of insert ──
  // LED strip centered on the top face (runs front-to-back in the middle)
  const ledInsetSide = 12;
  // Center strip: 30% of depth, centered at 50% depth
  const ledDepthFrac = 0.30;
  const ledStartFrac = 0.5 - ledDepthFrac / 2;  // 0.35
  const ledEndFrac = 0.5 + ledDepthFrac / 2;     // 0.65
  const ledFL = {
    x: iFTL.x + ledInsetSide + d * isoX * ledStartFrac,
    y: iFTL.y - d * isoY * ledStartFrac
  };
  const ledFR = {
    x: iFTR.x - ledInsetSide + d * isoX * ledStartFrac,
    y: iFTR.y - d * isoY * ledStartFrac
  };
  const ledBL = {
    x: iFTL.x + ledInsetSide + d * isoX * ledEndFrac,
    y: iFTL.y - d * isoY * ledEndFrac
  };
  const ledBR = {
    x: iFTR.x - ledInsetSide + d * isoX * ledEndFrac,
    y: iFTR.y - d * isoY * ledEndFrac
  };
  // LED strip
  out += `<polygon points="${ledFL.x},${ledFL.y} ${ledFR.x},${ledFR.y} ${ledBR.x},${ledBR.y} ${ledBL.x},${ledBL.y}"
    fill="#e8a838" opacity="0.25" filter="url(#glow)"/>`;
  out += `<polygon points="${ledFL.x},${ledFL.y} ${ledFR.x},${ledFR.y} ${ledBR.x},${ledBR.y} ${ledBL.x},${ledBL.y}"
    fill="none" stroke="#e8a838" stroke-width="1" opacity="0.5"/>`;
  // Flame wisps rising from top
  const flameCx = (iFTL.x + iBTR.x) / 2;
  const flameCy = (iFTL.y + iBTR.y) / 2;
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

  // ── Model name on insert front face ──
  const insLabelX = (iFL.x + iFR.x) / 2;
  const insLabelY = (iFL.y + iFTL.y) / 2 + 4;
  out += `<text x="${insLabelX}" y="${insLabelY}" fill="#b0b4be" font-family="Figtree,sans-serif"
    font-size="12" text-anchor="middle" font-weight="600" letter-spacing="2">${modelName.toUpperCase()}</text>`;

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
    // dimension endpoints
    { x: hDimX - 40, y: eFL.y }, { x: hDimX - 40, y: eFTL.y },
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

// ── Interactive Light Path Diagram (Canvas) ──
//
// Physical layout (cross-section / side view):
//   - The insert sits at the BOTTOM of the enclosure, 2" above the floor.
//   - The LED light source is at the TOP of the insert.
//   - Light projects UPWARD from the LED.
//   - BOTH front and back light paths go UPWARD.
//   - The "light trap" is a soffit at the top of the front viewing opening
//     that catches the upward light before it escapes into the room.
//   - The "max opening" = floor((SB+OS)*tan(angle) - 1).
//
// Diagram orientation:
//   LEFT  = FRONT (room side, viewing opening)
//   RIGHT = BACK  (wall side)
//   y increases UPWARD (floor at bottom, ceiling at top)
//
function drawLightDiagram() {
  const { modelKey, model, dims, setback, backSetback, openingHeight, hearthType } = getState();
  const isDouble = hearthType === 'double';
  const dpr = window.devicePixelRatio || 1;
  const isMobile = window.innerWidth <= 800;
  const W = 700, H = isMobile ? 700 : 650;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = '';
  canvas.style.height = '';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = '#121417';
  ctx.fillRect(0, 0, W, H);

  // ── Geometry (inches) ──
  const insertDepth = dims.d;
  const insertH     = dims.h;
  const cordSpace   = 2;

  // Enclosure dimensions
  const encDepth      = setback + insertDepth + backSetback;
  const frontAngleRad = model.frontAngle * Math.PI / 180;
  const backAngleRad  = model.backAngle  * Math.PI / 180;
  const maxOpening    = Math.round((setback + model.lightOffset) * Math.tan(frontAngleRad) - 1);

  // Back ray rise
  const backHorizDist = model.lightOffsetBack + backSetback;
  const backRise      = backHorizDist * Math.tan(backAngleRad);
  const backMaxOpening = Math.round((backSetback + model.lightOffsetBack) * Math.tan(backAngleRad) - 1);

  // Insert position — 2" above the floor for cord/wiring space
  const insertFrontX = setback;
  const insertBackX  = setback + insertDepth;
  const insertBotY   = cordSpace;
  const insertTopY   = cordSpace + insertH;

  // LED position (at the top of the insert)
  const ledFrontX = insertFrontX + model.lightOffset;
  const ledBackX  = ledFrontX + model.lightWidth;
  const ledY      = insertTopY;

  // Front light ray: from LED front edge, going LEFT (forward) and UP
  const frontRayEndX = 0;
  const frontRayEndY = ledY + maxOpening;

  // Back light ray: from LED back edge, going RIGHT (backward) and UP
  const backRayEndX = encDepth;
  const backRayEndY = ledY + backRise;

  // Actual opening position (user-controlled via slider)
  const actualOpeningTopY = insertTopY + openingHeight;

  // Enclosure height: dynamic, tall enough to show everything
  const encHeight = Math.max(actualOpeningTopY, backRayEndY, frontRayEndY) + 4;

  // ── 3D Isometric parameters ──
  const depth3D = isMobile ? 35 : 55;
  const offX = Math.round(depth3D * 0.65);
  const offY = Math.round(depth3D * 0.32);

  // ── Pixel mapping (adjusted for 3D offset) ──
  const marginL = 70, marginR = isDouble ? 190 : 170, marginT = 50 + offY, marginB = 65;
  const drawW = W - marginL - marginR - offX;
  const drawH = H - marginT - marginB;
  const pxPerInch = Math.min(drawW / (encDepth + 2), drawH / (encHeight + 2));

  const usedW = (encDepth + 2) * pxPerInch;
  const centerOffset = (drawW - usedW) / 2;

  const floorPx = H - marginB;
  const frontPx = marginL + centerOffset;

  function px(x) { return frontPx + x * pxPerInch; }
  function py(y) { return floorPx - y * pxPerInch; }
  function pxB(x) { return px(x) + offX; }
  function pyB(y) { return py(y) - offY; }

  const wallThick = 8;

  // ════════════════════════════════════════════════════════
  // 3D Isometric depth layer (drawn behind the cross-section)
  // ════════════════════════════════════════════════════════

  // -- Back face: enclosure interior --
  ctx.fillStyle = '#14171c';
  ctx.fillRect(pxB(0), pyB(encHeight), encDepth * pxPerInch, encHeight * pxPerInch);

  // -- Back face: insert --
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(pxB(insertFrontX), pyB(insertTopY), insertDepth * pxPerInch, insertH * pxPerInch);
  ctx.strokeStyle = '#333740';
  ctx.lineWidth = 1;
  ctx.strokeRect(pxB(insertFrontX), pyB(insertTopY), insertDepth * pxPerInch, insertH * pxPerInch);

  // -- Back face: walls --
  ctx.fillStyle = '#22262e';
  // Floor
  ctx.fillRect(pxB(0) - wallThick, pyB(0), encDepth * pxPerInch + wallThick * 2, wallThick);
  // Ceiling
  ctx.fillRect(pxB(0) - wallThick, pyB(encHeight) - wallThick, encDepth * pxPerInch + wallThick * 2, wallThick);
  // Back wall
  if (isDouble) {
    const bltBot = Math.min(actualOpeningTopY, encHeight);
    const bwU1 = pyB(encHeight) - wallThick, bwU2 = pyB(bltBot);
    if (bwU2 > bwU1) ctx.fillRect(pxB(encDepth), bwU1, wallThick, bwU2 - bwU1);
    const bwL1 = pyB(insertTopY), bwL2 = pyB(0);
    if (bwL2 > bwL1) ctx.fillRect(pxB(encDepth), bwL1, wallThick, bwL2 - bwL1);
  } else {
    ctx.fillRect(pxB(encDepth), pyB(encHeight) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);
  }
  // Front wall segments (back face)
  const bltBotY = Math.min(actualOpeningTopY, encHeight);
  const bfU1 = pyB(encHeight) - wallThick, bfU2 = pyB(bltBotY);
  if (bfU2 > bfU1) ctx.fillRect(pxB(0) - wallThick, bfU1, wallThick, bfU2 - bfU1);
  const bfL1 = pyB(insertTopY), bfL2 = pyB(0);
  if (bfL2 > bfL1) ctx.fillRect(pxB(0) - wallThick, bfL1, wallThick, bfL2 - bfL1);

  // Back face: installation surface line
  ctx.strokeStyle = '#555960';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(pxB(0) - wallThick, pyB(insertTopY));
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(insertTopY));
  ctx.stroke();

  // -- Connecting isometric surfaces --

  // Interior ceiling surface
  ctx.fillStyle = '#1e2228';
  ctx.beginPath();
  ctx.moveTo(px(0), py(encHeight)); ctx.lineTo(px(encDepth), py(encHeight));
  ctx.lineTo(pxB(encDepth), pyB(encHeight)); ctx.lineTo(pxB(0), pyB(encHeight));
  ctx.closePath(); ctx.fill();

  // Interior right wall surface
  ctx.fillStyle = '#191c22';
  ctx.beginPath();
  ctx.moveTo(px(encDepth), py(0)); ctx.lineTo(px(encDepth), py(encHeight));
  ctx.lineTo(pxB(encDepth), pyB(encHeight)); ctx.lineTo(pxB(encDepth), pyB(0));
  ctx.closePath(); ctx.fill();

  // Interior floor surface
  ctx.fillStyle = '#181b22';
  ctx.beginPath();
  ctx.moveTo(px(0), py(0)); ctx.lineTo(px(encDepth), py(0));
  ctx.lineTo(pxB(encDepth), pyB(0)); ctx.lineTo(pxB(0), pyB(0));
  ctx.closePath(); ctx.fill();

  // Insert top surface (with gradient)
  const iTopGrad = ctx.createLinearGradient(px(insertFrontX), py(insertTopY), pxB(insertFrontX), pyB(insertTopY));
  iTopGrad.addColorStop(0, '#2a2e38'); iTopGrad.addColorStop(1, '#22262e');
  ctx.fillStyle = iTopGrad;
  ctx.beginPath();
  ctx.moveTo(px(insertFrontX), py(insertTopY)); ctx.lineTo(px(insertBackX), py(insertTopY));
  ctx.lineTo(pxB(insertBackX), pyB(insertTopY)); ctx.lineTo(pxB(insertFrontX), pyB(insertTopY));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 1; ctx.stroke();

  // LED glow on insert top surface
  ctx.fillStyle = 'rgba(232, 168, 56, 0.08)';
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), py(ledY)); ctx.lineTo(px(ledBackX), py(ledY));
  ctx.lineTo(pxB(ledBackX), pyB(ledY)); ctx.lineTo(pxB(ledFrontX), pyB(ledY));
  ctx.closePath(); ctx.fill();

  // Insert right side surface
  ctx.fillStyle = '#1e222a';
  ctx.beginPath();
  ctx.moveTo(px(insertBackX), py(insertBotY)); ctx.lineTo(px(insertBackX), py(insertTopY));
  ctx.lineTo(pxB(insertBackX), pyB(insertTopY)); ctx.lineTo(pxB(insertBackX), pyB(insertBotY));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 1; ctx.stroke();

  // Floor slab top surface
  ctx.fillStyle = '#2f333c';
  ctx.beginPath();
  ctx.moveTo(px(0) - wallThick, py(0)); ctx.lineTo(px(encDepth) + wallThick, py(0));
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(0)); ctx.lineTo(pxB(0) - wallThick, pyB(0));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a3e48'; ctx.lineWidth = 0.5; ctx.stroke();

  // Ceiling slab top surface
  ctx.fillStyle = '#353a45';
  ctx.beginPath();
  ctx.moveTo(px(0) - wallThick, py(encHeight) - wallThick);
  ctx.lineTo(px(encDepth) + wallThick, py(encHeight) - wallThick);
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(encHeight) - wallThick);
  ctx.lineTo(pxB(0) - wallThick, pyB(encHeight) - wallThick);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a3e48'; ctx.lineWidth = 0.5; ctx.stroke();

  // Back wall right surface (single mode)
  if (!isDouble) {
    ctx.fillStyle = '#282c35';
    ctx.beginPath();
    ctx.moveTo(px(encDepth) + wallThick, py(0));
    ctx.lineTo(px(encDepth) + wallThick, py(encHeight) - wallThick);
    ctx.lineTo(pxB(encDepth) + wallThick, pyB(encHeight) - wallThick);
    ctx.lineTo(pxB(encDepth) + wallThick, pyB(0));
    ctx.closePath(); ctx.fill();
  } else {
    // Double-side: back wall right surfaces for the solid segments
    const dblLtBot = Math.min(actualOpeningTopY, encHeight);
    // Upper segment (light trap to ceiling)
    const dblUpperTop = py(encHeight) - wallThick;
    const dblUpperBot = py(dblLtBot);
    if (dblUpperBot > dblUpperTop) {
      ctx.fillStyle = '#282c35';
      ctx.beginPath();
      ctx.moveTo(px(encDepth) + wallThick, dblUpperTop);
      ctx.lineTo(px(encDepth) + wallThick, dblUpperBot);
      ctx.lineTo(pxB(encDepth) + wallThick, dblUpperBot - offY);
      ctx.lineTo(pxB(encDepth) + wallThick, dblUpperTop - offY);
      ctx.closePath(); ctx.fill();
    }
    // Lower segment (floor to installation surface)
    const dblLowerTop = py(insertTopY);
    const dblLowerBot = py(0);
    if (dblLowerBot > dblLowerTop) {
      ctx.fillStyle = '#282c35';
      ctx.beginPath();
      ctx.moveTo(px(encDepth) + wallThick, dblLowerTop);
      ctx.lineTo(px(encDepth) + wallThick, dblLowerBot);
      ctx.lineTo(pxB(encDepth) + wallThick, dblLowerBot - offY);
      ctx.lineTo(pxB(encDepth) + wallThick, dblLowerTop - offY);
      ctx.closePath(); ctx.fill();
    }
  }

  // -- Isometric edge outlines --
  ctx.strokeStyle = '#3a3e48';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // Depth lines at outer corners
  ctx.beginPath();
  ctx.moveTo(px(0) - wallThick, py(encHeight) - wallThick);
  ctx.lineTo(pxB(0) - wallThick, pyB(encHeight) - wallThick);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(encDepth) + wallThick, py(encHeight) - wallThick);
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(encHeight) - wallThick);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(encDepth) + wallThick, py(0));
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(0));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(0) - wallThick, py(0));
  ctx.lineTo(pxB(0) - wallThick, pyB(0));
  ctx.stroke();

  // Back face outline
  ctx.strokeStyle = '#2c3038';
  ctx.beginPath();
  ctx.moveTo(pxB(0) - wallThick, pyB(0));
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(0));
  ctx.lineTo(pxB(encDepth) + wallThick, pyB(encHeight) - wallThick);
  ctx.lineTo(pxB(0) - wallThick, pyB(encHeight) - wallThick);
  ctx.closePath(); ctx.stroke();

  // ── "Room" label(s) ──
  ctx.fillStyle = '#4a4f5c';
  ctx.font = '13px Figtree, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(marginL - 60, py(encHeight / 2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ROOM', 0, 0);
  ctx.restore();
  if (isDouble) {
    ctx.fillStyle = '#4a4f5c';
    ctx.font = '13px Figtree, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(px(encDepth) + wallThick + 50, py(encHeight / 2));
    ctx.rotate(Math.PI / 2);
    ctx.fillText('ROOM', 0, 0);
    ctx.restore();
  }

  // ── Enclosure interior background ──
  ctx.fillStyle = '#1b1e24';
  ctx.fillRect(px(0), py(encHeight), encDepth * pxPerInch, encHeight * pxPerInch);

  // ── Draw the insert body ──
  ctx.fillStyle = '#22262e';
  ctx.strokeStyle = '#4a4f5c';
  ctx.lineWidth = 2;
  const ixPx = px(insertFrontX);
  const iyPx = py(insertTopY);
  const iwPx = insertDepth * pxPerInch;
  const ihPx = insertH * pxPerInch;
  ctx.fillRect(ixPx, iyPx, iwPx, ihPx);
  ctx.strokeRect(ixPx, iyPx, iwPx, ihPx);

  // Insert label
  ctx.fillStyle = '#878c99';
  ctx.font = 'bold 11px Figtree, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(model.name, ixPx + iwPx / 2, py(cordSpace + insertH / 2) + 5);

  // ── Installation surface line ──
  ctx.strokeStyle = '#878c99';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(px(0) - wallThick, py(insertTopY));
  ctx.lineTo(px(encDepth) + wallThick, py(insertTopY));
  ctx.stroke();

  // Installation surface label — two lines to fit on mobile
  ctx.fillStyle = '#878c99';
  ctx.font = '10px Figtree, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Installation', px(encDepth) + wallThick + 4, py(insertTopY) - 2);
  ctx.fillText('Surface', px(encDepth) + wallThick + 4, py(insertTopY) + 10);

  // ── Cord space label ──
  if (cordSpace > 0) {
    ctx.fillStyle = '#4a4f5c';
    ctx.font = '9px Figtree, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cord / wiring space', ixPx + iwPx / 2, py(cordSpace / 2) + 3);
  }

  // ── LED light source strip ──
  ctx.fillStyle = '#e8a838';
  ctx.shadowColor = '#e8a838';
  ctx.shadowBlur = 14;
  ctx.fillRect(px(ledFrontX), py(ledY) - 2, model.lightWidth * pxPerInch, 5);
  ctx.shadowBlur = 0;

  // Light path label (above LED strip, raised to avoid angle arc overlap)
  ctx.fillStyle = '#e8a838';
  ctx.font = 'bold 10px Figtree, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIGHT PATH', px((ledFrontX + ledBackX) / 2), py(ledY) - 28);

  // ── Back ray clamping (needed by both cone fill and back ray line) ──
  const backClampY = Math.min(backRayEndY, encHeight);
  const backClampX = backRayEndY <= encHeight
    ? backRayEndX
    : ledBackX + (encHeight - ledY) / Math.tan(backAngleRad);

  // ── Light cone fill (clipped to enclosure interior) ──
  // Use actual ray line directions so shading aligns perfectly with drawn rays
  const riseToTop = encHeight - ledY;

  ctx.save();
  // Clip to enclosure bounds so light doesn't bleed through walls/ceiling
  ctx.beginPath();
  ctx.rect(px(0), py(encHeight), encDepth * pxPerInch, encHeight * pxPerInch);
  ctx.clip();

  if (maxOpening > 0) {
    // Front cone edge: extend front ray line (ledFrontX,ledY)->(0,frontRayEndY) to ceiling
    const frontRayRise = frontRayEndY - ledY; // = maxOpening
    const frontT = riseToTop / frontRayRise;
    const frontConeX = ledFrontX + frontT * (frontRayEndX - ledFrontX);

    // Back cone edge: extend back ray line (ledBackX,ledY)->(backClampX,backClampY) to ceiling
    const backRayRise = backClampY - ledY;
    const backT = backRayRise > 0 ? riseToTop / backRayRise : 1;
    const backConeX = ledBackX + backT * (backClampX - ledBackX);

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#e8a838';
    ctx.beginPath();
    ctx.moveTo(px(ledFrontX), py(ledY));
    ctx.lineTo(px(frontConeX), py(encHeight));
    ctx.lineTo(px(backConeX), py(encHeight));
    ctx.lineTo(px(ledBackX), py(ledY));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── Front light ray line ──
  ctx.strokeStyle = '#e8a838';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), py(ledY));
  ctx.lineTo(px(frontRayEndX), py(frontRayEndY));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Back light ray line ──
  ctx.strokeStyle = '#d45a20';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(px(ledBackX), py(ledY));
  ctx.lineTo(px(backClampX), py(backClampY));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Enclosure walls ──
  ctx.fillStyle = '#2c3038';

  // Floor
  ctx.fillRect(px(0) - wallThick, py(0), encDepth * pxPerInch + wallThick * 2, wallThick);

  // Ceiling
  ctx.fillRect(px(0) - wallThick, py(encHeight) - wallThick, encDepth * pxPerInch + wallThick * 2, wallThick);

  // Back wall
  if (isDouble) {
    // Double-side: back wall has an opening matching the front
    const backLightTrapBotY = Math.min(actualOpeningTopY, encHeight);
    const backWallTopPx = py(encHeight) - wallThick;
    const backWallBotPx = py(backLightTrapBotY);
    const backWallH = backWallBotPx - backWallTopPx;
    if (backWallH > 0) {
      ctx.fillRect(px(encDepth), backWallTopPx, wallThick, backWallH);
    }
    // Back wall — solid lower portion (floor to installation surface)
    const backLowerTopPx = py(insertTopY);
    const backLowerBotPx = py(0);
    const backLowerH = backLowerBotPx - backLowerTopPx;
    if (backLowerH > 0) {
      ctx.fillRect(px(encDepth), backLowerTopPx, wallThick, backLowerH);
    }
  } else {
    ctx.fillRect(px(encDepth), py(encHeight) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);
  }

  // Front wall — light trap portion (from user-specified opening top to ceiling)
  const lightTrapBotY = Math.min(actualOpeningTopY, encHeight);
  const frontWallTopPx = py(encHeight) - wallThick;
  const frontWallBotPx = py(lightTrapBotY);
  const frontWallH = frontWallBotPx - frontWallTopPx;
  if (frontWallH > 0) {
    ctx.fillRect(px(0) - wallThick, frontWallTopPx, wallThick, frontWallH);
  }

  // Front wall — solid lower portion (floor to installation surface)
  const frontLowerTopPx = py(insertTopY);
  const frontLowerBotPx = py(0);
  const frontLowerH = frontLowerBotPx - frontLowerTopPx;
  if (frontLowerH > 0) {
    ctx.fillRect(px(0) - wallThick, frontLowerTopPx, wallThick, frontLowerH);
  }

  // ── Light trap soffit ──
  if (setback > 0 && lightTrapBotY < encHeight) {
    ctx.fillStyle = '#2c3038';
    const soffitH = 4;
    ctx.fillRect(px(0), py(lightTrapBotY) - soffitH / 2, Math.min(setback, setback + 0.3) * pxPerInch, soffitH);

    ctx.fillStyle = '#78b8f0';
    ctx.font = 'bold 9px Figtree, sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.8) {
      ctx.fillText('LIGHT TRAP', px(setback / 2), py(lightTrapBotY) - soffitH / 2 - 6);
    }
  }

  // ── Back light trap soffit (double-side only) ──
  if (isDouble && backSetback > 0 && lightTrapBotY < encHeight) {
    ctx.fillStyle = '#2c3038';
    const soffitH = 4;
    ctx.fillRect(px(encDepth - backSetback), py(lightTrapBotY) - soffitH / 2, backSetback * pxPerInch, soffitH);

    ctx.fillStyle = '#5bc0de';
    ctx.font = 'bold 9px Figtree, sans-serif';
    ctx.textAlign = 'center';
    if (backSetback > 0.8) {
      ctx.fillText('LIGHT TRAP', px(encDepth - backSetback / 2), py(lightTrapBotY) - soffitH / 2 - 6);
    }
  }

  // ── Viewing opening gap ──
  // The opening is the gap between the lower front wall (floor to install surface)
  // and the upper front wall (light trap to ceiling). No line needed here.

  // ── Front angle arc (from installation surface horizontal to front light path) ──
  const arcR = Math.min(24, Math.max(14, (setback + model.lightOffset) * pxPerInch * 0.15));
  if (arcR > 10) {
    ctx.strokeStyle = '#e8a838';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px(ledFrontX), py(ledY), arcR, frontAngleRad - Math.PI, Math.PI, true);
    ctx.stroke();

    ctx.fillStyle = '#e8a838';
    ctx.font = '10px Figtree, sans-serif';
    ctx.textAlign = 'right';
    const labelAngle = frontAngleRad / 2 - Math.PI;
    ctx.fillText(
      model.frontAngle + '°',
      px(ledFrontX) + Math.cos(labelAngle) * (arcR + 14),
      py(ledY) + Math.sin(labelAngle) * (arcR + 14) + 4
    );
  }

  // ── Back angle arc ──
  const backArcR = Math.min(25, backHorizDist * pxPerInch * 0.2);
  if (backArcR > 10 && backHorizDist > 0.5) {
    ctx.strokeStyle = '#d45a20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px(ledBackX), py(ledY), backArcR, -backAngleRad, 0, false);
    ctx.stroke();

    ctx.fillStyle = '#d45a20';
    ctx.font = '10px Figtree, sans-serif';
    ctx.textAlign = 'left';
    const bLabelAngle = -backAngleRad / 2;
    ctx.fillText(
      model.backAngle + '°',
      px(ledBackX) + Math.cos(bLabelAngle) * (backArcR + 12),
      py(ledY) + Math.sin(bLabelAngle) * (backArcR + 12) + 4
    );
  }

  // ── Redraw walls on top for clean edges ──
  ctx.fillStyle = '#2c3038';
  ctx.fillRect(px(0) - wallThick, py(0), encDepth * pxPerInch + wallThick * 2, wallThick);
  ctx.fillRect(px(0) - wallThick, py(encHeight) - wallThick, encDepth * pxPerInch + wallThick * 2, wallThick);
  if (isDouble) {
    // Redraw back wall with opening
    const backLightTrapBotY = Math.min(actualOpeningTopY, encHeight);
    const bwTopPx = py(encHeight) - wallThick;
    const bwBotPx = py(backLightTrapBotY);
    const bwH = bwBotPx - bwTopPx;
    if (bwH > 0) ctx.fillRect(px(encDepth), bwTopPx, wallThick, bwH);
    const blTopPx = py(insertTopY);
    const blBotPx = py(0);
    const blH = blBotPx - blTopPx;
    if (blH > 0) ctx.fillRect(px(encDepth), blTopPx, wallThick, blH);
  } else {
    ctx.fillRect(px(encDepth), py(encHeight) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);
  }
  if (frontWallH > 0) {
    ctx.fillRect(px(0) - wallThick, frontWallTopPx, wallThick, frontWallH);
  }
  if (frontLowerH > 0) {
    ctx.fillRect(px(0) - wallThick, frontLowerTopPx, wallThick, frontLowerH);
  }

  // ── Recommended max opening reference line (front) ──
  const isFrontOverMax = openingHeight > maxOpening;
  const isBackOverMax = isDouble && openingHeight > backMaxOpening;
  const isOverMax = isFrontOverMax || isBackOverMax;
  if (frontRayEndY > ledY && frontRayEndY < encHeight) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(px(0) - wallThick, py(frontRayEndY));
    ctx.lineTo(px(Math.min(setback + 2, encDepth * 0.5)), py(frontRayEndY));
    ctx.stroke();
    ctx.setLineDash([]);

    // Check if Rec. Max label would overlap with Light Trap label
    const lightTrapLabelPy = py(lightTrapBotY) - 8;
    const recMaxDefaultPy = py(frontRayEndY) - 5;
    const recMaxLabelPy = Math.abs(recMaxDefaultPy - lightTrapLabelPy) < 16
      ? py(frontRayEndY) + 14   // move below the line if overlapping
      : recMaxDefaultPy;

    ctx.fillStyle = '#4ade80';
    ctx.font = '9px Figtree, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((isDouble ? 'Front Max: ' : 'Rec. Max: ') + maxOpening + '"', px(0) + 4, recMaxLabelPy);
  }

  // ── Recommended max opening reference line (back, double-side only) ──
  if (isDouble) {
    const backRecY = ledY + backMaxOpening;
    if (backRecY > ledY && backRecY < encHeight) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(px(encDepth) + wallThick, py(backRecY));
      ctx.lineTo(px(Math.max(encDepth - backSetback - 2, encDepth * 0.5)), py(backRecY));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#4ade80';
      ctx.font = '9px Figtree, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Back Max: ' + backMaxOpening + '"', px(encDepth) - 4, py(backRecY) - 5);
    }
  }

  // ── Front light escape visualization ──
  if (isFrontOverMax) {
    // Warning zone between recommended max and actual opening on the front face
    const gapTopPy = py(Math.min(actualOpeningTopY, encHeight));
    const gapBotPy = py(frontRayEndY);
    if (gapBotPy > gapTopPy) {
      ctx.fillStyle = 'rgba(255, 85, 85, 0.15)';
      ctx.fillRect(px(0) - wallThick - 2, gapTopPy, wallThick + 4, gapBotPy - gapTopPy);
    }

    // Front ray extending into the room past the front face
    const escExtent = 5;
    const frontSlope = maxOpening / (setback + model.lightOffset);
    const escY = frontRayEndY + frontSlope * escExtent;

    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px(0), py(frontRayEndY));
    ctx.lineTo(px(-escExtent), py(escY));
    ctx.stroke();
    ctx.setLineDash([]);

    // Warning label (outside the enclosure, next to escape ray)
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 9px Figtree, sans-serif';
    ctx.textAlign = 'right';
    const escLabelX = px(0) - wallThick - 50;
    const escLabelY = (gapTopPy + gapBotPy) / 2 - 50;
    ctx.fillText('LIGHT', escLabelX, escLabelY - 2);
    ctx.fillText('ESCAPE', escLabelX, escLabelY + 10);
  }

  // ── Back light escape visualization (double-side only) ──
  if (isBackOverMax) {
    const backRecY = ledY + backMaxOpening;
    const gapTopPy = py(Math.min(actualOpeningTopY, encHeight));
    const gapBotPy = py(backRecY);
    if (gapBotPy > gapTopPy) {
      ctx.fillStyle = 'rgba(255, 85, 85, 0.15)';
      ctx.fillRect(px(encDepth) - 2, gapTopPy, wallThick + 4, gapBotPy - gapTopPy);
    }

    // Back ray extending out past the back face
    const escExtent = 5;
    const backSlope = backMaxOpening / (backSetback + model.lightOffsetBack);
    const escY = backRecY + backSlope * escExtent;

    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px(encDepth), py(backRecY));
    ctx.lineTo(px(encDepth + escExtent), py(escY));
    ctx.stroke();
    ctx.setLineDash([]);

    // Warning label (outside the enclosure, next to escape ray)
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 9px Figtree, sans-serif';
    ctx.textAlign = 'left';
    const escLabelX = px(encDepth) + wallThick + 50;
    const escLabelY = (gapTopPy + gapBotPy) / 2 - 50;
    ctx.fillText('LIGHT', escLabelX, escLabelY - 2);
    ctx.fillText('ESCAPE', escLabelX, escLabelY + 10);
  }

  // ── Opening dimension arrow ──
  const arrowX = px(0) - wallThick - 18;
  const moArrowBotPy = py(ledY);
  const moArrowTopPy = py(Math.min(actualOpeningTopY, encHeight));
  const arrowColor = isOverMax ? '#ff5555' : '#e8a838';

  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arrowX, moArrowBotPy);
  ctx.lineTo(arrowX, moArrowTopPy);
  ctx.stroke();

  // Arrow heads
  ctx.fillStyle = arrowColor;
  ctx.beginPath();
  ctx.moveTo(arrowX, moArrowBotPy);
  ctx.lineTo(arrowX - 4, moArrowBotPy - 8);
  ctx.lineTo(arrowX + 4, moArrowBotPy - 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(arrowX, moArrowTopPy);
  ctx.lineTo(arrowX - 4, moArrowTopPy + 8);
  ctx.lineTo(arrowX + 4, moArrowTopPy + 8);
  ctx.closePath();
  ctx.fill();

  // Tick lines
  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(arrowX - 6, moArrowBotPy);
  ctx.lineTo(px(0), moArrowBotPy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX - 6, moArrowTopPy);
  ctx.lineTo(px(0), moArrowTopPy);
  ctx.stroke();

  // Opening label (rotated)
  ctx.save();
  ctx.fillStyle = arrowColor;
  ctx.font = 'bold 11px Figtree, sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(arrowX - 14, (moArrowBotPy + moArrowTopPy) / 2);
  ctx.rotate(-Math.PI / 2);
  const openLabel = isOverMax
    ? 'Opening: ' + openingHeight.toFixed(1) + '" (OVER MAX)'
    : 'Opening: ' + openingHeight.toFixed(1) + '"';
  ctx.fillText(openLabel, 0, 0);
  ctx.restore();

  // ── Front Setback dimension (near installation surface) ──
  const sbDimPy = py(insertTopY) + 14;
  if (setback > 0) {
    ctx.strokeStyle = '#78b8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(0), sbDimPy);
    ctx.lineTo(px(setback), sbDimPy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px(0), sbDimPy - 4);
    ctx.lineTo(px(0), sbDimPy + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(setback), sbDimPy - 4);
    ctx.lineTo(px(setback), sbDimPy + 4);
    ctx.stroke();

    ctx.fillStyle = '#78b8f0';
    ctx.font = '10px Figtree, sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.5) {
      ctx.fillText('Front SB: ' + setback.toFixed(1) + '"', px(setback / 2), sbDimPy + 13);
    }
  }

  // ── Back Setback dimension ──
  if (backSetback > 0) {
    ctx.strokeStyle = '#5bc0de';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(insertBackX), sbDimPy);
    ctx.lineTo(px(encDepth), sbDimPy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px(insertBackX), sbDimPy - 4);
    ctx.lineTo(px(insertBackX), sbDimPy + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(encDepth), sbDimPy - 4);
    ctx.lineTo(px(encDepth), sbDimPy + 4);
    ctx.stroke();

    ctx.fillStyle = '#5bc0de';
    ctx.font = '10px Figtree, sans-serif';
    ctx.textAlign = 'center';
    if (backSetback > 0.5) {
      ctx.fillText('Back SB: ' + backSetback.toFixed(1) + '"', px((insertBackX + encDepth) / 2), sbDimPy + 13);
    }
  }

  // ── FRONT / BACK labels (below floor) ──
  const frontBackPy = py(0) + wallThick + 22;
  ctx.fillStyle = '#878c99';
  ctx.font = '12px Figtree, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRONT', px(0), frontBackPy);
  ctx.fillText('BACK', px(encDepth), frontBackPy);

  // ── Total Depth dimension (above ceiling) ──
  const totalDepthInsert = modelKey === 'lite' ? 9.375 : 12;
  const totalDepth = setback + totalDepthInsert + backSetback;
  const tdY = pyB(encHeight) - wallThick - 18;

  // Extension lines from walls up to arrow
  ctx.strokeStyle = '#878c99';
  ctx.lineWidth = 0.7;
  ctx.setLineDash([3, 3]);
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(px(0), py(encHeight) - wallThick);
  ctx.lineTo(px(0), tdY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(encDepth), py(encHeight) - wallThick);
  ctx.lineTo(px(encDepth), tdY + 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Arrow line
  ctx.strokeStyle = '#e8a838';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px(0), tdY);
  ctx.lineTo(px(encDepth), tdY);
  ctx.stroke();

  // Tick marks
  ctx.beginPath();
  ctx.moveTo(px(0), tdY - 5);
  ctx.lineTo(px(0), tdY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(encDepth), tdY - 5);
  ctx.lineTo(px(encDepth), tdY + 5);
  ctx.stroke();

  // Arrowheads
  ctx.fillStyle = '#e8a838';
  ctx.beginPath();
  ctx.moveTo(px(0), tdY);
  ctx.lineTo(px(0) + 8, tdY - 4);
  ctx.lineTo(px(0) + 8, tdY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px(encDepth), tdY);
  ctx.lineTo(px(encDepth) - 8, tdY - 4);
  ctx.lineTo(px(encDepth) - 8, tdY + 4);
  ctx.closePath();
  ctx.fill();

  // Total depth label
  ctx.fillStyle = '#e8a838';
  ctx.font = 'bold 14px Figtree, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(frac(totalDepth), (px(0) + px(encDepth)) / 2, tdY - 8);
  ctx.font = '9px Figtree, sans-serif';
  ctx.fillStyle = '#878c99';
  ctx.fillText('TOTAL DEPTH', (px(0) + px(encDepth)) / 2, tdY - 24);

  // ── Legend ──
  const legendX = px(encDepth) + wallThick + 116;
  const legendY = 16;
  ctx.font = '10px Figtree, sans-serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#e8a838';
  ctx.fillRect(legendX, legendY, 12, 3);
  ctx.fillText('Front light path', legendX + 18, legendY + 4);

  ctx.fillStyle = '#d45a20';
  ctx.fillRect(legendX, legendY + 18, 12, 3);
  ctx.fillText('Back light path', legendX + 18, legendY + 22);

  ctx.fillStyle = '#78b8f0';
  ctx.fillRect(legendX, legendY + 36, 12, 3);
  ctx.fillText('Front setback (SB)', legendX + 18, legendY + 40);

  ctx.fillStyle = '#5bc0de';
  ctx.fillRect(legendX, legendY + 54, 12, 3);
  ctx.fillText('Back setback', legendX + 18, legendY + 58);

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(legendX, legendY + 72, 12, 3);
  ctx.fillText('Recommended max', legendX + 18, legendY + 76);

  // Cross-section label
  ctx.fillStyle = '#4a4f5c';
  ctx.font = '10px Figtree, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(isDouble ? '3D cutaway / double side' : '3D cutaway / side view', 14, 16);
}

// ── Reference Table ──
function buildTable() {
  const tbody = document.getElementById('ref-table-body');
  let html = '';
  for (const [key, m] of Object.entries(MODELS)) {
    for (const size of [20, 40, 60]) {
      const d = m.sizes[size];
      html += `<tr>
        <td>${m.name}</td>
        <td>${size}"</td>
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
modelSelect.addEventListener('change', resetOpeningToMax);
sizeSelect.addEventListener('change', resetOpeningToMax);
setbackSlider.addEventListener('input', update);
backSetbackSlider.addEventListener('input', update);
openingSlider.addEventListener('input', update);
window.addEventListener('resize', update);

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

// ── Pre-select model from URL query param (?model=pro) ──
(function() {
  var params = new URLSearchParams(window.location.search);
  var m = params.get('model');
  if (m && modelSelect.querySelector('option[value="' + m + '"]')) {
    modelSelect.value = m;
  }
})();

// ── Init ──
buildTable();
resetOpeningToMax();
