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
const canvas            = document.getElementById('light-diagram');
const ctx               = canvas.getContext('2d');

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
  return { modelKey, model, dims, setback, backSetback, openingHeight };
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
  const maxOpening = Math.floor((setback + model.lightOffset) * Math.tan(angleRad) - 1);

  maxOpeningEl.textContent = maxOpening + '"';

  drawCutoutDiagram(dims);
  drawLightDiagram();
}

// ── Cutout 3D Isometric Diagram ──
function drawCutoutDiagram(dims) {
  const svg = document.getElementById('cutout-diagram');
  const modelKey = modelSelect.value;
  const modelName = MODELS[modelKey].name;
  const vbW = 960, vbH = 800;
  svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);

  // ── Physical sizing ──
  // The enclosure must be deep enough to contain the insert (min ~14" tall)
  const minEncHInches = 14;
  const encHInches = Math.max(minEncHInches, dims.h + 4); // at least 4" taller than insert

  // Scale: map inches → SVG px, fit the widest model (60.25") into ~420px
  const scale = 420 / 60.25;
  const w = dims.w * scale;        // insert width
  const d = dims.d * scale;        // insert depth
  const h = dims.h * scale;        // insert height
  const encW = (dims.w + 3) * scale;  // enclosure ~3" wider
  const encD = (dims.d + 4) * scale;  // enclosure ~4" deeper
  const encH = encHInches * scale;     // enclosure height (min 14")

  // Isometric projection
  const isoX = 0.65, isoY = 0.32;

  // ── Layout anchors ──
  // Enclosure sits in lower portion, offset left so depth lines have room on right
  const encCx = vbW / 2 - 60;
  const encCy = vbH - 110;   // front-bottom of enclosure

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
  // Centered in the top face, matching insert footprint
  const cutPadX = (encW - w) / 2;
  const cutPadD = (encD - d) / 2;
  const cFL = { x: eFTL.x + cutPadX, y: eFTL.y };
  const cFR = { x: eFTR.x - cutPadX, y: eFTR.y };
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
      s += `<text x="${mx}" y="${my+22+off}" fill="${col}" font-family="Inter,sans-serif" font-size="16" text-anchor="middle" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx}" y="${my+38+off}" fill="${mutedCol}" font-family="Inter,sans-serif" font-size="11" text-anchor="middle" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'right') {
      s += `<text x="${mx+16+off}" y="${my-4}" fill="${col}" font-family="Inter,sans-serif" font-size="16" text-anchor="start" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx+16+off}" y="${my+12}" fill="${mutedCol}" font-family="Inter,sans-serif" font-size="11" text-anchor="start" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'left') {
      s += `<text x="${mx-16-off}" y="${my-4}" fill="${col}" font-family="Inter,sans-serif" font-size="16" text-anchor="end" font-weight="700">${label}</text>`;
      if (sublabel) s += `<text x="${mx-16-off}" y="${my+12}" fill="${mutedCol}" font-family="Inter,sans-serif" font-size="11" text-anchor="end" letter-spacing="2">${sublabel}</text>`;
    } else if (side === 'along') {
      const angle = Math.atan2(dy,dx) * 180 / Math.PI;
      s += `<text x="${mx+nx*3}" y="${my+ny*3-6}" fill="${col}" font-family="Inter,sans-serif" font-size="16" text-anchor="middle" font-weight="700" transform="rotate(${angle},${mx+nx*3},${my+ny*3-6})">${label}</text>`;
      if (sublabel) s += `<text x="${mx+nx*3}" y="${my+ny*3+10}" fill="${mutedCol}" font-family="Inter,sans-serif" font-size="11" text-anchor="middle" letter-spacing="2" transform="rotate(${angle},${mx+nx*3},${my+ny*3+10})">${sublabel}</text>`;
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
    <linearGradient id="glass-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a2a40"/><stop offset="40%" stop-color="#0e1925"/><stop offset="100%" stop-color="#162438"/>
    </linearGradient>
    <linearGradient id="flame-grad" x1="0.5" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#e8a838" stop-opacity="0.9"/><stop offset="50%" stop-color="#d45a20" stop-opacity="0.6"/><stop offset="100%" stop-color="#e8a838" stop-opacity="0"/>
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
    <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="10" markerHeight="10" orient="auto">
      <path d="M1,0 L5,10 L9,0" fill="#e8a838" opacity="0.8"/>
    </marker>
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
  // Corner marks for emphasis
  const cm = 10;
  out += `<polyline points="${cFL.x},${cFL.y+cm} ${cFL.x},${cFL.y} ${cFL.x+cm},${cFL.y}" fill="none" stroke="#e8a838" stroke-width="3"/>`;
  out += `<polyline points="${cFR.x},${cFR.y+cm} ${cFR.x},${cFR.y} ${cFR.x-cm},${cFR.y}" fill="none" stroke="#e8a838" stroke-width="3"/>`;
  out += `<polyline points="${cBL.x-cm*isoX},${cBL.y+cm*isoY} ${cBL.x},${cBL.y} ${cBL.x+cm},${cBL.y}" fill="none" stroke="#e8a838" stroke-width="3" opacity="0.6"/>`;
  out += `<polyline points="${cBR.x+cm*isoX},${cBR.y+cm*isoY} ${cBR.x},${cBR.y} ${cBR.x-cm},${cBR.y}" fill="none" stroke="#e8a838" stroke-width="3" opacity="0.6"/>`;

  // ── "ENCLOSURE" label ──
  const encLabelX = (eFL.x + eFR.x) / 2;
  const encLabelY = (eFL.y + eFTL.y) / 2 + 6;
  out += `<text x="${encLabelX}" y="${encLabelY}" fill="#878c99" font-family="Inter,sans-serif"
    font-size="14" text-anchor="middle" font-weight="600" letter-spacing="4" opacity="0.6">ENCLOSURE</text>`;

  // ── "CUTOUT" label centered in the cutout ──
  const cutCx = (cFL.x + cBR.x) / 2;
  const cutCy = (cFL.y + cBR.y) / 2;
  out += `<text x="${cutCx}" y="${cutCy - 2}" fill="#e8a838" font-family="Inter,sans-serif"
    font-size="13" text-anchor="middle" font-weight="700" letter-spacing="3">CUTOUT</text>`;
  out += `<text x="${cutCx}" y="${cutCy + 14}" fill="#e8a838" font-family="Inter,sans-serif"
    font-size="10" text-anchor="middle" font-weight="400" letter-spacing="1" opacity="0.7">Installation Surface</text>`;

  // ── Drop-in arrows ──
  const arrowCount = 3;
  for (let i = 0; i < arrowCount; i++) {
    const t = (i + 1) / (arrowCount + 1);
    const topX = iFL.x + t * (iFR.x - iFL.x);
    const topY = iFL.y + 12;
    const botX = cFL.x + t * (cFR.x - cFL.x);
    const botY = cFL.y - 8;
    out += `<line x1="${topX}" y1="${topY}" x2="${botX}" y2="${botY}"
      stroke="#e8a838" stroke-width="1.8" stroke-dasharray="5,5" opacity="0.55"
      marker-end="url(#arrow-down)"/>`;
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

  // ── Glass panel ──
  const gi = 8, gti = 10, gbi = 14;
  const gFL = { x: iFL.x + gi, y: iFL.y - gbi };
  const gFR = { x: iFR.x - gi, y: iFR.y - gbi };
  const gFTL = { x: iFTL.x + gi, y: iFTL.y + gti };
  const gFTR = { x: iFTR.x - gi, y: iFTR.y + gti };

  out += `<polygon points="${gFL.x},${gFL.y} ${gFR.x},${gFR.y} ${gFTR.x},${gFTR.y} ${gFTL.x},${gFTL.y}"
    fill="url(#glass-grad)" stroke="#4a6080" stroke-width="1" opacity="0.9"/>`;
  // Glass reflection highlights
  out += `<line x1="${gFTL.x+10}" y1="${gFTL.y+5}" x2="${gFL.x+16}" y2="${gFL.y-5}"
    stroke="rgba(150,180,220,0.12)" stroke-width="4" stroke-linecap="round"/>`;
  out += `<line x1="${gFTL.x+22}" y1="${gFTL.y+5}" x2="${gFL.x+28}" y2="${gFL.y-5}"
    stroke="rgba(150,180,220,0.06)" stroke-width="2" stroke-linecap="round"/>`;

  // ── Flame glow ──
  const flameW = (gFR.x - gFL.x) * 0.55;
  const flameCx = (gFL.x + gFR.x) / 2;
  const flameBot = gFL.y - 4;
  const flameTop = (gFTL.y + gFL.y) / 2;
  out += `<ellipse cx="${flameCx}" cy="${(flameBot+flameTop)/2+4}"
    rx="${flameW/2}" ry="${(flameBot-flameTop)/2}"
    fill="url(#flame-grad)" filter="url(#glow)" opacity="0.45"/>`;

  // ── Model name on insert top ──
  const insLabelX = (iFTL.x + iBTR.x) / 2;
  const insLabelY = (iFTL.y + iBTR.y) / 2 + 4;
  out += `<text x="${insLabelX}" y="${insLabelY}" fill="#b0b4be" font-family="Inter,sans-serif"
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
  const depthOff = 32;
  const dS = { x: cFR.x + depthOff, y: cFR.y };
  const dE = { x: cBR.x + depthOff, y: cBR.y };
  out += extLine(cFR.x+6, cFR.y, dS.x+4, dS.y);
  out += extLine(cBR.x+6, cBR.y, dE.x+4, dE.y);
  out += dimLine(dS.x, dS.y, dE.x, dE.y, frac(dims.d), 'DEPTH', 'along', 0);

  // ── Height: vertical on left side of enclosure ──
  const hDimX = eFL.x - 36;
  out += extLine(eFL.x-6, eFL.y, hDimX-6, eFL.y);
  out += extLine(eFTL.x-6, eFTL.y, hDimX-6, eFTL.y);
  out += dimLine(hDimX, eFL.y, hDimX, eFTL.y, frac(dims.h), 'HEIGHT', 'left', 0);

  // ── Enclosure min height annotation (right side of enclosure) ──
  const ehDimX = eFR.x + 28;
  out += extLine(eFR.x+6, eFR.y, ehDimX+6, eFR.y);
  out += extLine(eFTR.x+6, eFTR.y, ehDimX+6, eFTR.y);
  const encHLabel = encHInches + '"';
  out += dimLine(ehDimX, eFR.y, ehDimX, eFTR.y, encHLabel, 'MIN. ENCL.', 'right', 0);

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
  const { model, dims, setback, backSetback, openingHeight } = getState();
  const dpr = window.devicePixelRatio || 1;
  const W = 700, H = 500;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
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
  const maxOpening    = Math.floor((setback + model.lightOffset) * Math.tan(frontAngleRad) - 1);

  // Back ray rise
  const backHorizDist = model.lightOffsetBack + backSetback;
  const backRise      = backHorizDist * Math.tan(backAngleRad);

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

  // ── Pixel mapping ──
  const marginL = 70, marginR = 50, marginT = 30, marginB = 65;
  const drawW = W - marginL - marginR;
  const drawH = H - marginT - marginB;
  const pxPerInch = Math.min(drawW / (encDepth + 2), drawH / (encHeight + 2));

  const floorPx = H - marginB;
  const frontPx = marginL;

  function px(x) { return frontPx + x * pxPerInch; }
  function py(y) { return floorPx - y * pxPerInch; }

  const wallThick = 8;

  // ── "Room" label ──
  ctx.fillStyle = '#4a4f5c';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(marginL - 60, py(encHeight / 2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ROOM', 0, 0);
  ctx.restore();

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
  ctx.font = 'bold 11px sans-serif';
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
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Installation', px(encDepth) + wallThick + 4, py(insertTopY) - 2);
  ctx.fillText('Surface', px(encDepth) + wallThick + 4, py(insertTopY) + 10);

  // ── Cord space label ──
  if (cordSpace > 0) {
    ctx.fillStyle = '#4a4f5c';
    ctx.font = '9px sans-serif';
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
  ctx.font = 'bold 10px sans-serif';
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
  ctx.fillRect(px(encDepth), py(encHeight) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);

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
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.8) {
      ctx.fillText('LIGHT TRAP', px(setback / 2), py(lightTrapBotY) - soffitH / 2 - 6);
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
    ctx.font = '10px sans-serif';
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
    ctx.font = '10px sans-serif';
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
  ctx.fillRect(px(encDepth), py(encHeight) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);
  if (frontWallH > 0) {
    ctx.fillRect(px(0) - wallThick, frontWallTopPx, wallThick, frontWallH);
  }
  if (frontLowerH > 0) {
    ctx.fillRect(px(0) - wallThick, frontLowerTopPx, wallThick, frontLowerH);
  }

  // ── Recommended max opening reference line ──
  const isOverMax = openingHeight > maxOpening;
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
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Rec. Max: ' + maxOpening + '"', px(0) + 4, recMaxLabelPy);
  }

  // ── Light escape visualization ──
  if (isOverMax) {
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

    // Warning label — two lines, positioned inside the opening to fit on mobile
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    const escLabelX = px(0) + 4;
    const escLabelY = (gapTopPy + gapBotPy) / 2;
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
  ctx.font = 'bold 11px sans-serif';
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
    ctx.font = '10px sans-serif';
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
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    if (backSetback > 0.5) {
      ctx.fillText('Back SB: ' + backSetback.toFixed(1) + '"', px((insertBackX + encDepth) / 2), sbDimPy + 13);
    }
  }

  // ── FRONT / BACK labels (below floor) ──
  const frontBackPy = py(0) + wallThick + 22;
  ctx.fillStyle = '#878c99';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRONT', px(0), frontBackPy);
  ctx.fillText('BACK', px(encDepth), frontBackPy);

  // ── Legend ──
  const legendX = W - 180;
  const legendY = 16;
  ctx.font = '10px sans-serif';
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
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Cross-section / side view', 14, 16);
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
  const maxOpening = Math.floor((setback + model.lightOffset) * Math.tan(angleRad) - 1);
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

// ── Init ──
buildTable();
resetOpeningToMax();
