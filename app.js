/* ──────────────────────────────────────────────────────────
   Aquafire Enclosure Guide – app.js
   ────────────────────────────────────────────────────────── */

// ── Model Data ──
const MODELS = {
  original: {
    name: 'Aquafire Original',
    frontAngle: 53,
    backAngle: 68,
    lightOffset: 5.3,       // front edge of light opening from front of unit
    lightOffsetBack: 4.6,   // back edge of light opening from back of unit
    lightWidth: 3,          // width of light opening (front-to-back)
    sizes: {
      20: { w: 20.25, d: 12.25, h: 12 },
      40: { w: 40.25, d: 12.25, h: 12 },
      60: { w: 60.25, d: 12.25, h: 12 },
    },
  },
  pro: {
    name: 'Aquafire Pro',
    frontAngle: 58,
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
    frontAngle: 53,
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
const modelSelect   = document.getElementById('model');
const sizeSelect    = document.getElementById('size');
const setbackSlider = document.getElementById('setback-slider');
const setbackDisp   = document.getElementById('setback-display');
const cutoutW       = document.getElementById('cutout-w');
const cutoutD       = document.getElementById('cutout-d');
const cutoutH       = document.getElementById('cutout-h');
const maxOpeningEl  = document.getElementById('max-opening');
const lightAngleEl  = document.getElementById('light-angle-display');
const offsetEl      = document.getElementById('offset-display');
const canvas        = document.getElementById('light-diagram');
const ctx           = canvas.getContext('2d');

// ── Helpers ──
function frac(n) {
  // Render a number as a fractional string (e.g., 12.25 → 12 1/4")
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
  const modelKey = modelSelect.value;
  const sizeKey  = sizeSelect.value;
  const model    = MODELS[modelKey];
  const dims     = model.sizes[sizeKey];
  const setback  = parseFloat(setbackSlider.value);
  return { modelKey, model, dims, setback };
}

// ── Update all displays ──
function update() {
  const { model, dims, setback } = getState();

  // Cutout dimensions
  cutoutW.textContent = frac(dims.w);
  cutoutD.textContent = frac(dims.d);
  cutoutH.textContent = frac(dims.h);

  // Setback display
  setbackDisp.textContent = setback.toFixed(3) + '"';

  // Light trap calculation
  // Max Opening = (SB + OS) * tan(angle)
  const angleRad   = model.frontAngle * Math.PI / 180;
  const maxOpening = (setback + model.lightOffset) * Math.tan(angleRad);

  maxOpeningEl.textContent = maxOpening.toFixed(2) + '"';
  lightAngleEl.textContent = model.frontAngle + '°';
  offsetEl.textContent     = model.lightOffset + '"';

  drawCutoutDiagram(dims);
  drawLightDiagram();
}

// ── Cutout 3D Isometric Diagram ──
function drawCutoutDiagram(dims) {
  const svg = document.getElementById('cutout-diagram');
  const vbW = 500, vbH = 280;

  // Normalise dims so they fit nicely
  const scale = 12;
  const w = dims.w / scale * 40;
  const d = dims.d / scale * 40;
  const h = dims.h / scale * 40;

  const isoX = 0.7;
  const isoY = 0.35;

  const cx = vbW / 2 - 20;
  const cy = vbH / 2 + 20;

  // Corner points (isometric projection)
  const fl = { x: cx - w/2, y: cy };                           // front-left
  const fr = { x: cx + w/2, y: cy };                           // front-right
  const bl = { x: fl.x + d*isoX, y: fl.y - d*isoY };          // back-left
  const br = { x: fr.x + d*isoX, y: fr.y - d*isoY };          // back-right
  const ftl = { x: fl.x, y: fl.y - h };                        // front-top-left
  const ftr = { x: fr.x, y: fr.y - h };                        // front-top-right
  const btl = { x: bl.x, y: bl.y - h };                        // back-top-left
  const btr = { x: br.x, y: br.y - h };                        // back-top-right

  svg.innerHTML = `
    <!-- Bottom face -->
    <polygon points="${fl.x},${fl.y} ${fr.x},${fr.y} ${br.x},${br.y} ${bl.x},${bl.y}"
      fill="#1e2230" stroke="#f4a535" stroke-width="1.5"/>
    <!-- Back face -->
    <polygon points="${bl.x},${bl.y} ${br.x},${br.y} ${btr.x},${btr.y} ${btl.x},${btl.y}"
      fill="#262b3a" stroke="#f4a535" stroke-width="1.5"/>
    <!-- Right face -->
    <polygon points="${fr.x},${fr.y} ${br.x},${br.y} ${btr.x},${btr.y} ${ftr.x},${ftr.y}"
      fill="#2a3044" stroke="#f4a535" stroke-width="1.5"/>
    <!-- Left face -->
    <polygon points="${fl.x},${fl.y} ${bl.x},${bl.y} ${btl.x},${btl.y} ${ftl.x},${ftl.y}"
      fill="#222838" stroke="#f4a535" stroke-width="1.5" stroke-dasharray="6,3"/>
    <!-- Front face (opening) -->
    <polygon points="${fl.x},${fl.y} ${fr.x},${fr.y} ${ftr.x},${ftr.y} ${ftl.x},${ftl.y}"
      fill="none" stroke="#f4a535" stroke-width="2" stroke-dasharray="8,4"/>
    <!-- Top face -->
    <polygon points="${ftl.x},${ftl.y} ${ftr.x},${ftr.y} ${btr.x},${btr.y} ${btl.x},${btl.y}"
      fill="#2e3550" stroke="#f4a535" stroke-width="1.5"/>

    <!-- Width dimension -->
    <line x1="${fl.x}" y1="${fl.y+22}" x2="${fr.x}" y2="${fr.y+22}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fl.x}" y1="${fl.y+10}" x2="${fl.x}" y2="${fl.y+26}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fr.x}" y1="${fr.y+10}" x2="${fr.x}" y2="${fr.y+26}" stroke="#8b90a0" stroke-width="1"/>
    <text x="${(fl.x+fr.x)/2}" y="${fl.y+40}" fill="#f4a535" font-size="13" text-anchor="middle" font-weight="600">${frac(dims.w)} W</text>

    <!-- Height dimension -->
    <line x1="${fr.x+18}" y1="${fr.y}" x2="${fr.x+18}" y2="${ftr.y}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fr.x+10}" y1="${fr.y}" x2="${fr.x+24}" y2="${fr.y}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fr.x+10}" y1="${ftr.y}" x2="${fr.x+24}" y2="${ftr.y}" stroke="#8b90a0" stroke-width="1"/>
    <text x="${fr.x+32}" y="${(fr.y+ftr.y)/2+4}" fill="#f4a535" font-size="13" text-anchor="start" font-weight="600">${frac(dims.h)} H</text>

    <!-- Depth dimension -->
    <line x1="${br.x+16}" y1="${br.y+8}" x2="${fr.x+16}" y2="${fr.y+8}" stroke="#8b90a0" stroke-width="1"/>
    <text x="${(fr.x+br.x)/2+24}" y="${(fr.y+br.y)/2+24}" fill="#f4a535" font-size="13" text-anchor="middle" font-weight="600" transform="rotate(-25,${(fr.x+br.x)/2+24},${(fr.y+br.y)/2+24})">${frac(dims.d)} D</text>
  `;
}

// ── Interactive Light Path Diagram (Canvas) ──
function drawLightDiagram() {
  const { model, dims, setback } = getState();
  const dpr = window.devicePixelRatio || 1;
  const W = 700, H = 500;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Clear
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, W, H);

  // ── Coordinate system ──
  // We draw a cross-section (side view) of the enclosure.
  // Scale: 1 inch = pxPerInch pixels
  const enclosureDepth = dims.d;
  const enclosureHeight = dims.h;
  const totalInchesW = enclosureDepth + 8; // extra margin
  const totalInchesH = enclosureHeight + 10;
  const pxPerInch = Math.min((W - 100) / totalInchesW, (H - 120) / totalInchesH);

  // Origin: bottom-left of enclosure interior
  const originX = 60;
  const originY = H - 70;

  function toX(inches) { return originX + inches * pxPerInch; }
  function toY(inches) { return originY - inches * pxPerInch; }

  const encW = enclosureDepth * pxPerInch;
  const encH = enclosureHeight * pxPerInch;

  // ── Draw enclosure box ──
  ctx.strokeStyle = '#444b60';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#1e2230';

  // Floor
  ctx.fillRect(toX(0), originY, encW, 12);
  ctx.fillStyle = '#262b3a';

  // Back wall
  ctx.fillRect(toX(enclosureDepth), toY(enclosureHeight + 2), 12, (enclosureHeight + 2) * pxPerInch + 12);

  // Ceiling / top
  ctx.fillStyle = '#262b3a';
  ctx.fillRect(toX(0), toY(enclosureHeight + 2), encW + 12, 12);

  // Labels for enclosure
  ctx.fillStyle = '#8b90a0';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  // ── Draw fireplace insert ──
  const insertDepth = enclosureDepth;  // insert fills full depth
  const insertH = enclosureHeight - 1; // slightly shorter visually
  const insertFrontX = setback;        // how far from front face

  // Insert body
  ctx.fillStyle = '#2a2f42';
  ctx.strokeStyle = '#555d78';
  ctx.lineWidth = 1.5;
  const ix = toX(insertFrontX);
  const iy = toY(0);
  const iw = (insertDepth - setback) * pxPerInch;
  const ih = insertH * pxPerInch;
  ctx.fillRect(ix, iy - ih, iw, ih);
  ctx.strokeRect(ix, iy - ih, iw, ih);

  // Insert label
  ctx.fillStyle = '#8b90a0';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(model.name, ix + iw/2, iy - ih/2 + 4);

  // ── Light source position ──
  // The light emits from a strip on top of the insert.
  // lightOffset = distance from FRONT of insert to FRONT edge of light opening
  const lightFrontX = insertFrontX + model.lightOffset;
  const lightBackX  = insertFrontX + model.lightOffset + model.lightWidth;
  const lightY      = insertH; // top of insert

  // Draw light source strip on top of insert
  const lx1 = toX(lightFrontX);
  const lx2 = toX(lightBackX);
  const ly  = toY(lightY);

  ctx.fillStyle = '#f4a535';
  ctx.fillRect(lx1, ly - 3, lx2 - lx1, 6);

  // Light source label
  ctx.fillStyle = '#f4a535';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LED Light Source', (lx1 + lx2) / 2, ly - 10);

  // ── Draw light paths ──
  const frontAngleRad = model.frontAngle * Math.PI / 180;
  const backAngleRad  = model.backAngle * Math.PI / 180;

  // Front light path: from the front edge of the light, going toward the front/up
  // This defines the MAXIMUM opening.
  // The light goes forward (toward 0) and up from lightFrontX at lightY.
  // At angle from vertical: tan(angle) = horizontal/vertical
  // Actually the angle is from center of fireplace going outward.
  // Per formula: Max Opening = (SB + OS) * tan(angle)
  // where SB = setback, OS = lightOffset from front of insert
  // This means the light ray goes from the front edge of the light source,
  // forward by (SB + OS) inches to the front face (x=0),
  // and rises by maxOpening inches.

  // The light emits from the front edge of light strip (lightFrontX, lightY).
  // At x=0 (front face / light trap edge), the ray height is:
  //   height_above_lightY = (lightFrontX - 0) * tan(frontAngle)
  // But wait: lightFrontX = insertFrontX + lightOffset = setback + lightOffset = SB + OS
  // So height_at_front = (SB + OS) * tan(frontAngle) — matches the formula!

  const maxOpening = (setback + model.lightOffset) * Math.tan(frontAngleRad);

  // Front light ray: from (lightFrontX, lightY) to (0, lightY + maxOpening)
  // Draw the cone of light from the light source
  const rayEndY_front = lightY + maxOpening;

  // Back light path: from the back edge of light, going toward back wall
  const backRayDist = enclosureDepth - lightBackX;
  const backRayH = backRayDist * Math.tan(backAngleRad);
  const rayEndY_back = lightY + backRayH;

  // ── Light cone fill ──
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#f4a535';
  ctx.beginPath();
  ctx.moveTo(lx1, ly);
  ctx.lineTo(toX(0), toY(rayEndY_front));
  ctx.lineTo(toX(0), toY(lightY));
  ctx.closePath();
  ctx.fill();

  // Back light cone
  ctx.fillStyle = '#e8611a';
  ctx.beginPath();
  ctx.moveTo(lx2, ly);
  ctx.lineTo(toX(enclosureDepth), toY(Math.min(rayEndY_back, enclosureHeight + 2)));
  ctx.lineTo(toX(enclosureDepth), toY(lightY));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Front light ray line ──
  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(lx1, ly);
  ctx.lineTo(toX(0), toY(rayEndY_front));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Back light ray line ──
  ctx.strokeStyle = '#e8611a';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(lx2, ly);
  const backRayEndClamp = Math.min(rayEndY_back, enclosureHeight + 2);
  ctx.lineTo(toX(enclosureDepth), toY(backRayEndClamp));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Draw front opening / light trap ──
  // The front wall with an opening at the bottom
  // Ceiling extends from top down to enclosure top
  // Light trap: the ceiling hangs down over the opening

  // Front wall outline (above opening)
  ctx.strokeStyle = '#8b90a0';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#262b3a';

  // Top part of front wall (light trap / header)
  const openingTop = Math.min(rayEndY_front, enclosureHeight);
  ctx.fillRect(toX(-0.5) - 6, toY(enclosureHeight + 2), 12, (enclosureHeight + 2 - openingTop) * pxPerInch);

  // ── Max Opening arrow ──
  const arrowX = toX(0) - 22;
  const arrowTop = toY(openingTop);
  const arrowBot = originY;

  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowBot);
  ctx.lineTo(arrowX, arrowTop);
  ctx.stroke();

  // Arrow heads
  ctx.fillStyle = '#f4a535';
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowBot);
  ctx.lineTo(arrowX - 4, arrowBot - 8);
  ctx.lineTo(arrowX + 4, arrowBot - 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowTop);
  ctx.lineTo(arrowX - 4, arrowTop + 8);
  ctx.lineTo(arrowX + 4, arrowTop + 8);
  ctx.closePath();
  ctx.fill();

  // Max opening label
  ctx.save();
  ctx.fillStyle = '#f4a535';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(arrowX - 14, (arrowTop + arrowBot) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Max Opening: ' + maxOpening.toFixed(2) + '"', 0, 0);
  ctx.restore();

  // ── Setback dimension ──
  const sbLineY = originY + 24;
  ctx.strokeStyle = '#78b8f0';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX(0), sbLineY);
  ctx.lineTo(toX(setback), sbLineY);
  ctx.stroke();

  // Tick marks
  ctx.beginPath();
  ctx.moveTo(toX(0), sbLineY - 5);
  ctx.lineTo(toX(0), sbLineY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX(setback), sbLineY - 5);
  ctx.lineTo(toX(setback), sbLineY + 5);
  ctx.stroke();

  ctx.fillStyle = '#78b8f0';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  if (setback > 0.3) {
    ctx.fillText('SB: ' + setback.toFixed(3) + '"', (toX(0) + toX(setback)) / 2, sbLineY + 16);
  }

  // ── Offset dimension line ──
  const osLineY = originY + 42;
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toX(insertFrontX), osLineY);
  ctx.lineTo(toX(lightFrontX), osLineY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX(insertFrontX), osLineY - 5);
  ctx.lineTo(toX(insertFrontX), osLineY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX(lightFrontX), osLineY - 5);
  ctx.lineTo(toX(lightFrontX), osLineY + 5);
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = '11px sans-serif';
  ctx.fillText('Offset: ' + model.lightOffset + '"', (toX(insertFrontX) + toX(lightFrontX)) / 2, osLineY + 16);

  // ── Angle arc ──
  // Draw front angle arc from the light source
  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 1;
  const arcR = 30;
  // The front ray goes from (lightFrontX, lightY) upward-left.
  // Angle is measured from vertical (straight up).
  // In canvas coords: straight up is -PI/2.
  // The ray angle from vertical = frontAngle degrees.
  // In canvas terms, the ray goes at angle (-PI/2 - frontAngleRad) from horizontal.
  // Actually let me think about this differently.
  // The light goes from the light source toward the front-top.
  // The horizontal distance = lightFrontX, vertical distance = maxOpening.
  // The angle from the horizontal = atan(maxOpening / lightFrontX) = frontAngle
  // So the ray makes frontAngle with horizontal.
  // In canvas: horizontal is 0 (right), PI is left.
  // The ray goes up-left, so angle from positive x-axis = PI - frontAngle
  const rayCanvasAngle = Math.PI - frontAngleRad;
  const verticalAngle = Math.PI * 1.5; // straight up in canvas
  // Draw arc from "up" to the ray direction
  ctx.beginPath();
  // Arc from the vertical (up from light source) to the ray direction
  // Up direction in canvas = -PI/2 = 3PI/2
  // Ray direction = PI - frontAngle
  ctx.arc(lx1, ly, arcR, rayCanvasAngle, -Math.PI / 2, false);
  ctx.stroke();

  ctx.fillStyle = '#f4a535';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(model.frontAngle + '°', lx1 - arcR - 22, ly - arcR/2 - 2);

  // ── Legend ──
  const legendX = W - 200;
  const legendY = 24;
  ctx.font = '11px sans-serif';

  ctx.fillStyle = '#f4a535';
  ctx.fillRect(legendX, legendY, 14, 3);
  ctx.fillText('Front light path', legendX + 20, legendY + 5);

  ctx.fillStyle = '#e8611a';
  ctx.fillRect(legendX, legendY + 18, 14, 3);
  ctx.fillText('Back light path', legendX + 20, legendY + 23);

  ctx.fillStyle = '#78b8f0';
  ctx.fillRect(legendX, legendY + 36, 14, 3);
  ctx.fillText('Setback (SB)', legendX + 20, legendY + 41);

  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(legendX, legendY + 54, 14, 3);
  ctx.fillText('Light offset (OS)', legendX + 20, legendY + 59);

  // ── Cross-section label ──
  ctx.fillStyle = '#555d78';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Cross-section / side view', 12, 18);

  // ── "Front" / "Back" labels ──
  ctx.fillStyle = '#8b90a0';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRONT', toX(0), originY + 58);
  ctx.fillText('BACK', toX(enclosureDepth), originY + 58);
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
        <td>${m.lightOffset}"</td>
      </tr>`;
    }
  }
  tbody.innerHTML = html;
}

// ── Event listeners ──
modelSelect.addEventListener('change', update);
sizeSelect.addEventListener('change', update);
setbackSlider.addEventListener('input', update);
window.addEventListener('resize', update);

// ── Init ──
buildTable();
update();
