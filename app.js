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
const lightAngleEl      = document.getElementById('light-angle-display');
const offsetEl          = document.getElementById('offset-display');
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
  const maxOpening = (setback + model.lightOffset) * Math.tan(angleRad) - 1;

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
  const scale = 12;
  const w = dims.w / scale * 40;
  const d = dims.d / scale * 40;
  const h = dims.h / scale * 40;
  const isoX = 0.7, isoY = 0.35;
  const cx = vbW / 2 - 20, cy = vbH / 2 + 20;

  const fl  = { x: cx - w/2, y: cy };
  const fr  = { x: cx + w/2, y: cy };
  const bl  = { x: fl.x + d*isoX, y: fl.y - d*isoY };
  const br  = { x: fr.x + d*isoX, y: fr.y - d*isoY };
  const ftl = { x: fl.x, y: fl.y - h };
  const ftr = { x: fr.x, y: fr.y - h };
  const btl = { x: bl.x, y: bl.y - h };
  const btr = { x: br.x, y: br.y - h };

  svg.innerHTML = `
    <polygon points="${fl.x},${fl.y} ${fr.x},${fr.y} ${br.x},${br.y} ${bl.x},${bl.y}"
      fill="#1e2230" stroke="#f4a535" stroke-width="1.5"/>
    <polygon points="${bl.x},${bl.y} ${br.x},${br.y} ${btr.x},${btr.y} ${btl.x},${btl.y}"
      fill="#262b3a" stroke="#f4a535" stroke-width="1.5"/>
    <polygon points="${fr.x},${fr.y} ${br.x},${br.y} ${btr.x},${btr.y} ${ftr.x},${ftr.y}"
      fill="#2a3044" stroke="#f4a535" stroke-width="1.5"/>
    <polygon points="${fl.x},${fl.y} ${bl.x},${bl.y} ${btl.x},${btl.y} ${ftl.x},${ftl.y}"
      fill="#222838" stroke="#f4a535" stroke-width="1.5" stroke-dasharray="6,3"/>
    <polygon points="${fl.x},${fl.y} ${fr.x},${fr.y} ${ftr.x},${ftr.y} ${ftl.x},${ftl.y}"
      fill="none" stroke="#f4a535" stroke-width="2" stroke-dasharray="8,4"/>
    <polygon points="${ftl.x},${ftl.y} ${ftr.x},${ftr.y} ${btr.x},${btr.y} ${btl.x},${btl.y}"
      fill="#2e3550" stroke="#f4a535" stroke-width="1.5"/>
    <line x1="${fl.x}" y1="${fl.y+22}" x2="${fr.x}" y2="${fr.y+22}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fl.x}" y1="${fl.y+10}" x2="${fl.x}" y2="${fl.y+26}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fr.x}" y1="${fr.y+10}" x2="${fr.x}" y2="${fr.y+26}" stroke="#8b90a0" stroke-width="1"/>
    <text x="${(fl.x+fr.x)/2}" y="${fl.y+40}" fill="#f4a535" font-size="13" text-anchor="middle" font-weight="600">${frac(dims.w)} W</text>
    <line x1="${fr.x+18}" y1="${fr.y}" x2="${fr.x+18}" y2="${ftr.y}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fr.x+10}" y1="${fr.y}" x2="${fr.x+24}" y2="${fr.y}" stroke="#8b90a0" stroke-width="1"/>
    <line x1="${fr.x+10}" y1="${ftr.y}" x2="${fr.x+24}" y2="${ftr.y}" stroke="#8b90a0" stroke-width="1"/>
    <text x="${fr.x+32}" y="${(fr.y+ftr.y)/2+4}" fill="#f4a535" font-size="13" text-anchor="start" font-weight="600">${frac(dims.h)} H</text>
    <line x1="${br.x+16}" y1="${br.y+8}" x2="${fr.x+16}" y2="${fr.y+8}" stroke="#8b90a0" stroke-width="1"/>
    <text x="${(fr.x+br.x)/2+24}" y="${(fr.y+br.y)/2+24}" fill="#f4a535" font-size="13" text-anchor="middle" font-weight="600" transform="rotate(-25,${(fr.x+br.x)/2+24},${(fr.y+br.y)/2+24})">${frac(dims.d)} D</text>
  `;
}

// ── Interactive Light Path Diagram (Canvas) ──
//
// Physical layout (cross-section / side view):
//   - The insert sits at the BOTTOM of the enclosure.
//   - The LED light source is at the TOP of the insert.
//   - Light projects UPWARD from the LED, illuminating the water vapor.
//   - BOTH front and back light paths go UPWARD.
//   - The "light trap" is a soffit at the top of the front viewing opening
//     that catches the upward light before it escapes into the room.
//   - The "max opening" is the maximum viewing window height = (SB+OS)*tan(angle) - 1.
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

  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, W, H);

  // ── Geometry (inches) ──
  const insertDepth = dims.d;
  const insertH     = dims.h;
  const cordSpace   = 2;

  // Enclosure dimensions
  const encDepth      = setback + insertDepth + backSetback;
  const frontAngleRad = model.frontAngle * Math.PI / 180;
  const backAngleRad  = model.backAngle  * Math.PI / 180;
  const maxOpening    = (setback + model.lightOffset) * Math.tan(frontAngleRad) - 1;

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
  const marginL = 75, marginR = 50, marginT = 40, marginB = 50;
  const drawW = W - marginL - marginR;
  const drawH = H - marginT - marginB;
  const pxPerInch = Math.min(drawW / (encDepth + 2), drawH / (encHeight + 2));

  const floorPx = H - marginB;
  const frontPx = marginL;

  function px(x) { return frontPx + x * pxPerInch; }
  function py(y) { return floorPx - y * pxPerInch; }

  const wallThick = 8;

  // ── "Room" label ──
  ctx.fillStyle = '#555d78';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(marginL - 55, py(encHeight / 2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ROOM', 0, 0);
  ctx.restore();

  // ── Enclosure interior background ──
  ctx.fillStyle = '#1e2230';
  ctx.fillRect(px(0), py(encHeight), encDepth * pxPerInch, encHeight * pxPerInch);

  // ── Draw the insert body ──
  ctx.fillStyle = '#2a2f42';
  ctx.strokeStyle = '#555d78';
  ctx.lineWidth = 2;
  const ixPx = px(insertFrontX);
  const iyPx = py(insertTopY);
  const iwPx = insertDepth * pxPerInch;
  const ihPx = insertH * pxPerInch;
  ctx.fillRect(ixPx, iyPx, iwPx, ihPx);
  ctx.strokeRect(ixPx, iyPx, iwPx, ihPx);

  // Insert label
  ctx.fillStyle = '#8b90a0';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(model.name, ixPx + iwPx / 2, py(cordSpace + insertH / 2) + 4);
  ctx.font = '10px sans-serif';
  ctx.fillText('(cross-section)', ixPx + iwPx / 2, py(cordSpace + insertH / 2) + 18);

  // ── Installation surface line ──
  ctx.strokeStyle = '#8b90a0';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(px(0) - wallThick, py(insertTopY));
  ctx.lineTo(px(encDepth) + wallThick, py(insertTopY));
  ctx.stroke();

  // Installation surface label
  ctx.fillStyle = '#8b90a0';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Installation Surface', px(0) - wallThick - 4, py(insertTopY) - 4);

  // ── Cord space label ──
  if (cordSpace > 0) {
    ctx.fillStyle = '#555d78';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cord / wiring space', ixPx + iwPx / 2, py(cordSpace / 2) + 3);
  }

  // ── LED light source strip ──
  ctx.fillStyle = '#f4a535';
  ctx.shadowColor = '#f4a535';
  ctx.shadowBlur = 14;
  ctx.fillRect(px(ledFrontX), py(ledY) - 2, model.lightWidth * pxPerInch, 5);
  ctx.shadowBlur = 0;

  // LED label
  ctx.fillStyle = '#f4a535';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LED LIGHT SOURCE', px((ledFrontX + ledBackX) / 2), py(ledY) - 10);

  // ── Light cone fill (all vertical space between angles up to ceiling) ──
  const riseToTop = encHeight - ledY;
  const frontRayCeilingX = ledFrontX - riseToTop / Math.tan(frontAngleRad);
  const backRayCeilingX  = ledBackX + riseToTop / Math.tan(backAngleRad);

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#f4a535';
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), py(ledY));
  ctx.lineTo(px(frontRayCeilingX), py(encHeight));
  ctx.lineTo(px(backRayCeilingX), py(encHeight));
  ctx.lineTo(px(ledBackX), py(ledY));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Front light ray line ──
  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), py(ledY));
  ctx.lineTo(px(frontRayEndX), py(frontRayEndY));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Back light ray line ──
  const backClampY = Math.min(backRayEndY, encHeight);
  const backClampX = backRayEndY <= encHeight
    ? backRayEndX
    : ledBackX + (encHeight - ledY) / Math.tan(backAngleRad);

  ctx.strokeStyle = '#e8611a';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(px(ledBackX), py(ledY));
  ctx.lineTo(px(backClampX), py(backClampY));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Enclosure walls ──
  ctx.fillStyle = '#363c52';

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

  // ── Light trap soffit ──
  if (setback > 0 && lightTrapBotY < encHeight) {
    ctx.fillStyle = '#3a4160';
    const soffitH = 4;
    ctx.fillRect(px(0), py(lightTrapBotY) - soffitH / 2, Math.min(setback, setback + 0.3) * pxPerInch, soffitH);

    ctx.fillStyle = '#78b8f0';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.8) {
      ctx.fillText('LIGHT TRAP', px(setback / 2), py(lightTrapBotY) - soffitH / 2 - 5);
    }
  }

  // ── Viewing opening bracket ──
  if (lightTrapBotY < encHeight) {
    ctx.strokeStyle = '#4a5068';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(0), py(lightTrapBotY));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Front Setback dimension ──
  const sbDimPy = py(0) + wallThick + 16;
  if (setback > 0) {
    ctx.strokeStyle = '#78b8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(0), sbDimPy);
    ctx.lineTo(px(setback), sbDimPy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px(0), sbDimPy - 5);
    ctx.lineTo(px(0), sbDimPy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(setback), sbDimPy - 5);
    ctx.lineTo(px(setback), sbDimPy + 5);
    ctx.stroke();

    ctx.fillStyle = '#78b8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.5) {
      ctx.fillText('Front SB: ' + setback.toFixed(1) + '"', px(setback / 2), sbDimPy + 14);
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
    ctx.moveTo(px(insertBackX), sbDimPy - 5);
    ctx.lineTo(px(insertBackX), sbDimPy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(encDepth), sbDimPy - 5);
    ctx.lineTo(px(encDepth), sbDimPy + 5);
    ctx.stroke();

    ctx.fillStyle = '#5bc0de';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    if (backSetback > 0.5) {
      ctx.fillText('Back SB: ' + backSetback.toFixed(1) + '"', px((insertBackX + encDepth) / 2), sbDimPy + 14);
    }
  }

  // ── Offset dimension (OS: insert front to LED front) ──
  const osDimPy = py(insertTopY) + 16;
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px(insertFrontX), osDimPy);
  ctx.lineTo(px(ledFrontX), osDimPy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(px(insertFrontX), osDimPy - 5);
  ctx.lineTo(px(insertFrontX), osDimPy + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), osDimPy - 5);
  ctx.lineTo(px(ledFrontX), osDimPy + 5);
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OS: ' + model.lightOffset + '"', px((insertFrontX + ledFrontX) / 2), osDimPy + 14);

  // ── Front angle arc ──
  const arcR = Math.min(35, (setback + model.lightOffset) * pxPerInch * 0.35);
  if (arcR > 12) {
    ctx.strokeStyle = '#f4a535';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px(ledFrontX), py(ledY), arcR, Math.PI - frontAngleRad, Math.PI, true);
    ctx.stroke();

    ctx.fillStyle = '#f4a535';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const labelAngle = Math.PI - frontAngleRad / 2;
    ctx.fillText(
      model.frontAngle + '°',
      px(ledFrontX) + Math.cos(labelAngle) * (arcR + 16),
      py(ledY) + Math.sin(labelAngle) * (arcR + 16) + 4
    );
  }

  // ── Back angle arc ──
  const backArcR = Math.min(30, backHorizDist * pxPerInch * 0.25);
  if (backArcR > 10 && backHorizDist > 0.5) {
    ctx.strokeStyle = '#e8611a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px(ledBackX), py(ledY), backArcR, -backAngleRad, 0, false);
    ctx.stroke();

    ctx.fillStyle = '#e8611a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    const bLabelAngle = -backAngleRad / 2;
    ctx.fillText(
      model.backAngle + '°',
      px(ledBackX) + Math.cos(bLabelAngle) * (backArcR + 14),
      py(ledY) + Math.sin(bLabelAngle) * (backArcR + 14) + 4
    );
  }

  // ── Redraw walls on top for clean edges ──
  ctx.fillStyle = '#363c52';
  ctx.fillRect(px(0) - wallThick, py(0), encDepth * pxPerInch + wallThick * 2, wallThick);
  ctx.fillRect(px(0) - wallThick, py(encHeight) - wallThick, encDepth * pxPerInch + wallThick * 2, wallThick);
  ctx.fillRect(px(encDepth), py(encHeight) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);
  if (frontWallH > 0) {
    ctx.fillRect(px(0) - wallThick, frontWallTopPx, wallThick, frontWallH);
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

    ctx.fillStyle = '#4ade80';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Rec. Max: ' + maxOpening.toFixed(1) + '"', px(0) + 4, py(frontRayEndY) - 4);
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

    // Warning label
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LIGHT ESCAPE', px(0) - wallThick - 6, (gapTopPy + gapBotPy) / 2 + 4);
  }

  // ── Opening dimension arrow ──
  const arrowX = px(0) - wallThick - 18;
  const moArrowBotPy = py(ledY);
  const moArrowTopPy = py(Math.min(actualOpeningTopY, encHeight));
  const arrowColor = isOverMax ? '#ff5555' : '#f4a535';

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
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(arrowX - 16, (moArrowBotPy + moArrowTopPy) / 2);
  ctx.rotate(-Math.PI / 2);
  const openLabel = isOverMax
    ? 'Opening: ' + openingHeight.toFixed(1) + '" (OVER MAX)'
    : 'Opening: ' + openingHeight.toFixed(1) + '"';
  ctx.fillText(openLabel, 0, 0);
  ctx.restore();

  // ── FRONT / BACK labels ──
  ctx.fillStyle = '#8b90a0';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRONT', px(0), py(0) + wallThick + 36);
  ctx.fillText('BACK', px(encDepth), py(0) + wallThick + 36);

  // ── Legend ──
  const legendX = W - 190;
  const legendY = 18;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f4a535';
  ctx.fillRect(legendX, legendY, 14, 3);
  ctx.fillText('Front light path', legendX + 20, legendY + 5);

  ctx.fillStyle = '#e8611a';
  ctx.fillRect(legendX, legendY + 20, 14, 3);
  ctx.fillText('Back light path', legendX + 20, legendY + 25);

  ctx.fillStyle = '#78b8f0';
  ctx.fillRect(legendX, legendY + 40, 14, 3);
  ctx.fillText('Front setback (SB)', legendX + 20, legendY + 45);

  ctx.fillStyle = '#5bc0de';
  ctx.fillRect(legendX, legendY + 60, 14, 3);
  ctx.fillText('Back setback', legendX + 20, legendY + 65);

  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(legendX, legendY + 80, 14, 3);
  ctx.fillText('Light offset (OS)', legendX + 20, legendY + 85);

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(legendX, legendY + 100, 14, 3);
  ctx.fillText('Recommended max', legendX + 20, legendY + 105);

  // Cross-section label
  ctx.fillStyle = '#555d78';
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
backSetbackSlider.addEventListener('input', update);
openingSlider.addEventListener('input', update);
window.addEventListener('resize', update);

// ── Init ──
buildTable();
// Set opening slider to recommended max for initial state
const initModel = MODELS[modelSelect.value];
const initAngleRad = initModel.frontAngle * Math.PI / 180;
const initSetback = parseFloat(setbackSlider.value);
const initMaxOpening = (initSetback + initModel.lightOffset) * Math.tan(initAngleRad) - 1;
openingSlider.value = Math.round(initMaxOpening * 2) / 2; // round to nearest 0.5
update();
