/* ──────────────────────────────────────────────────────────
   Aquafire Enclosure Guide – app.js
   ────────────────────────────────────────────────────────── */

// ── Model Data ──
const MODELS = {
  original: {
    name: 'Aquafire Original',
    frontAngle: 53,
    backAngle: 68,
    lightOffset: 5.3,       // distance from front of insert to front edge of LED opening
    lightOffsetBack: 4.6,   // distance from back of insert to back edge of LED opening
    lightWidth: 3,          // depth of LED opening (front-to-back)
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

  cutoutW.textContent = frac(dims.w);
  cutoutD.textContent = frac(dims.d);
  cutoutH.textContent = frac(dims.h);

  setbackDisp.textContent = setback.toFixed(3) + '"';

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

  const scale = 12;
  const w = dims.w / scale * 40;
  const d = dims.d / scale * 40;
  const h = dims.h / scale * 40;

  const isoX = 0.7;
  const isoY = 0.35;

  const cx = vbW / 2 - 20;
  const cy = vbH / 2 + 20;

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
// Cross-section / side view of the enclosure.
//
// Physical layout:
//   - The insert HANGS from the top of the enclosure via flanges.
//   - The LED light source is at the TOP of the insert, projecting light DOWNWARD.
//   - The "light trap" is the ceiling overhang between the front face and the
//     insert — it blocks LED light from escaping upward into the room.
//   - The "max opening" is the maximum viewing window height, measured from
//     the top of the enclosure downward.  It equals (SB + OS) * tan(angle).
//
// Diagram orientation:
//   LEFT  = FRONT (room side, viewing opening)
//   RIGHT = BACK  (wall side)
//
function drawLightDiagram() {
  const { model, dims, setback } = getState();
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
  const encDepth  = dims.d;               // enclosure depth = cutout depth
  const insertH   = dims.h;               // insert height = cutout height
  // Make enclosure taller than the insert to show the viewing area below
  const encHeight = insertH + 6;          // extra space below insert for viewing

  const frontAngleRad = model.frontAngle * Math.PI / 180;
  const backAngleRad  = model.backAngle * Math.PI / 180;
  const maxOpening    = (setback + model.lightOffset) * Math.tan(frontAngleRad);

  // ── Pixel mapping ──
  // Leave margins for labels and room label on left
  const marginL = 110, marginR = 40, marginT = 50, marginB = 60;
  const drawW = W - marginL - marginR;
  const drawH = H - marginT - marginB;
  const pxPerInch = Math.min(drawW / (encDepth + 2), drawH / (encHeight + 2));

  // Origin: top-left of enclosure interior, in pixel coords
  const ox = marginL + 1 * pxPerInch; // 1" margin from left edge
  const oy = marginT + 1 * pxPerInch; // 1" margin from top

  // Enclosure coordinate → pixel
  // x: 0 = front face (left), positive = toward back (right)
  // y: 0 = ceiling (top), positive = downward
  function px(x) { return ox + x * pxPerInch; }
  function py(y) { return oy + y * pxPerInch; }

  const wallThick = 8; // pixels for wall rendering

  // ── Draw "Room" label on the left ──
  ctx.fillStyle = '#555d78';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(marginL - 50, py(encHeight / 2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ROOM', 0, 0);
  ctx.restore();

  // ── Draw enclosure structure ──
  // Ceiling
  ctx.fillStyle = '#363c52';
  ctx.fillRect(px(0) - wallThick, py(0) - wallThick, encDepth * pxPerInch + wallThick * 2, wallThick);

  // Floor
  ctx.fillRect(px(0) - wallThick, py(encHeight), encDepth * pxPerInch + wallThick * 2, wallThick);

  // Back wall
  ctx.fillRect(px(encDepth), py(0) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);

  // Front wall — upper portion (light trap area) and nothing below (viewing opening)
  // The light trap is the front wall material from the ceiling down.
  // We draw the front wall above the max opening line.
  // The inner edge of the light trap is at x = SB (setback from front face, directly below insert front)
  // Actually the light trap depth (how far the soffit extends inward) = setback
  const lightTrapBottomY = maxOpening; // from ceiling, the light trap's bottom edge
  // Front wall from ceiling to lightTrapBottomY
  ctx.fillStyle = '#363c52';
  ctx.fillRect(px(0) - wallThick, py(0) - wallThick, wallThick, Math.min(lightTrapBottomY, encHeight) * pxPerInch + wallThick);

  // ── Enclosure interior background ──
  ctx.fillStyle = '#1e2230';
  ctx.fillRect(px(0), py(0), encDepth * pxPerInch, encHeight * pxPerInch);

  // ── Light trap soffit (ceiling overhang) ──
  // The light trap is the horizontal ceiling material that extends from the front face
  // inward by the setback distance.  It's at the top of the enclosure.
  if (setback > 0) {
    ctx.fillStyle = '#3a4160';
    ctx.fillRect(px(0), py(0), setback * pxPerInch, wallThick * 0.8);

    // Label
    ctx.fillStyle = '#78b8f0';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.8) {
      ctx.fillText('LIGHT TRAP', px(setback / 2), py(0) - 4);
    }
  }

  // ── Draw the insert body ──
  // Insert hangs from ceiling (y=0), front edge at x = setback
  const insertFrontX = setback;
  const insertBackX  = encDepth; // insert fills to the back
  const insertTopY   = 0;       // hangs from ceiling
  const insertBotY   = insertH; // insert height

  ctx.fillStyle = '#2a2f42';
  ctx.strokeStyle = '#555d78';
  ctx.lineWidth = 2;
  ctx.fillRect(px(insertFrontX), py(insertTopY), (insertBackX - insertFrontX) * pxPerInch, insertH * pxPerInch);
  ctx.strokeRect(px(insertFrontX), py(insertTopY), (insertBackX - insertFrontX) * pxPerInch, insertH * pxPerInch);

  // Flanges at the top (small tabs extending past the insert on each side)
  ctx.fillStyle = '#555d78';
  const flangeW = 6;
  ctx.fillRect(px(insertFrontX) - flangeW, py(0), flangeW, 4);
  ctx.fillRect(px(insertBackX), py(0), flangeW, 4);

  // Insert label
  ctx.fillStyle = '#8b90a0';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(model.name, px((insertFrontX + insertBackX) / 2), py(insertH / 2) + 4);
  ctx.font = '10px sans-serif';
  ctx.fillText('(cross-section)', px((insertFrontX + insertBackX) / 2), py(insertH / 2) + 18);

  // ── LED light source strip ──
  // At the top of the insert, offset from the insert's front edge
  const ledFrontX = insertFrontX + model.lightOffset;
  const ledBackX  = ledFrontX + model.lightWidth;
  const ledY      = insertTopY; // top of insert = ceiling

  ctx.fillStyle = '#f4a535';
  ctx.shadowColor = '#f4a535';
  ctx.shadowBlur = 12;
  ctx.fillRect(px(ledFrontX), py(ledY) + 2, (ledBackX - ledFrontX) * pxPerInch, 5);
  ctx.shadowBlur = 0;

  // LED label
  ctx.fillStyle = '#f4a535';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LED LIGHT SOURCE', px((ledFrontX + ledBackX) / 2), py(ledY) + 20);

  // ── Front light path ──
  // From the front edge of the LED opening, going LEFT (forward) and DOWN
  // at frontAngle degrees from horizontal.
  // Start: (ledFrontX, 0)
  // End: at the front face x=0, the ray has dropped by maxOpening
  const frontRayEndX = 0;
  const frontRayEndY = maxOpening;  // dropped from ceiling

  // Light cone fill (front)
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#f4a535';
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), py(ledY));
  ctx.lineTo(px(frontRayEndX), py(frontRayEndY));
  ctx.lineTo(px(frontRayEndX), py(ledY));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Front ray line
  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), py(ledY));
  ctx.lineTo(px(frontRayEndX), py(frontRayEndY));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Back light path ──
  // From the back edge of the LED opening, going RIGHT (backward) and DOWN
  // at backAngle degrees from horizontal.
  const backHorizDist = encDepth - ledBackX;
  const backDrop      = backHorizDist * Math.tan(backAngleRad);
  const backRayEndY   = Math.min(backDrop, encHeight);
  const backRayEndX   = backDrop <= encHeight
    ? encDepth
    : ledBackX + encHeight / Math.tan(backAngleRad);

  // Light cone fill (back)
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#e8611a';
  ctx.beginPath();
  ctx.moveTo(px(ledBackX), py(ledY));
  ctx.lineTo(px(backRayEndX), py(backRayEndY));
  ctx.lineTo(px(backRayEndX), py(ledY));
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back ray line
  ctx.strokeStyle = '#e8611a';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(px(ledBackX), py(ledY));
  ctx.lineTo(px(backRayEndX), py(backRayEndY));
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Redraw front wall over the light paths ──
  // Top portion (light trap material) — solid to show it blocks light
  ctx.fillStyle = '#363c52';
  ctx.fillRect(px(0) - wallThick, py(0) - wallThick, wallThick, Math.min(lightTrapBottomY, encHeight) * pxPerInch + wallThick);

  // ── Viewing opening indication ──
  // The opening goes from y = lightTrapBottomY down to y = encHeight
  const openingTopPx  = py(Math.min(lightTrapBottomY, encHeight));
  const openingBotPx  = py(encHeight);
  if (lightTrapBottomY < encHeight) {
    // Opening bracket on the front face
    ctx.strokeStyle = '#4a5068';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(px(0), openingTopPx);
    ctx.lineTo(px(0), openingBotPx);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Max Opening dimension arrow (left of front face) ──
  const arrowX = px(0) - wallThick - 18;
  const arrowTopPy = py(0);
  const arrowBotPy = py(Math.min(maxOpening, encHeight));

  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowTopPy);
  ctx.lineTo(arrowX, arrowBotPy);
  ctx.stroke();

  // Arrow heads
  ctx.fillStyle = '#f4a535';
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowTopPy);
  ctx.lineTo(arrowX - 4, arrowTopPy + 8);
  ctx.lineTo(arrowX + 4, arrowTopPy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowBotPy);
  ctx.lineTo(arrowX - 4, arrowBotPy - 8);
  ctx.lineTo(arrowX + 4, arrowBotPy - 8);
  ctx.closePath();
  ctx.fill();

  // Tick lines
  ctx.strokeStyle = '#f4a535';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(arrowX - 6, arrowTopPy);
  ctx.lineTo(px(0) - wallThick, arrowTopPy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX - 6, arrowBotPy);
  ctx.lineTo(px(0), arrowBotPy);
  ctx.stroke();

  // Max opening label (rotated, left of arrow)
  ctx.save();
  ctx.fillStyle = '#f4a535';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(arrowX - 16, (arrowTopPy + arrowBotPy) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Max Opening: ' + maxOpening.toFixed(2) + '"', 0, 0);
  ctx.restore();

  // ── Setback dimension (horizontal, at top) ──
  const sbDimY = py(0) - wallThick - 16;
  if (setback > 0) {
    ctx.strokeStyle = '#78b8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(0), sbDimY);
    ctx.lineTo(px(setback), sbDimY);
    ctx.stroke();

    // Tick marks
    ctx.beginPath();
    ctx.moveTo(px(0), sbDimY - 5);
    ctx.lineTo(px(0), sbDimY + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(setback), sbDimY - 5);
    ctx.lineTo(px(setback), sbDimY + 5);
    ctx.stroke();

    ctx.fillStyle = '#78b8f0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    if (setback > 0.5) {
      ctx.fillText('SB: ' + setback.toFixed(3) + '"', px(setback / 2), sbDimY - 6);
    }
  }

  // ── Offset dimension (horizontal, from insert front to LED front) ──
  const osDimY = py(0) + insertH * pxPerInch + 18;
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px(insertFrontX), osDimY);
  ctx.lineTo(px(ledFrontX), osDimY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(px(insertFrontX), osDimY - 5);
  ctx.lineTo(px(insertFrontX), osDimY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px(ledFrontX), osDimY - 5);
  ctx.lineTo(px(ledFrontX), osDimY + 5);
  ctx.stroke();

  ctx.fillStyle = '#a78bfa';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OS: ' + model.lightOffset + '"', px((insertFrontX + ledFrontX) / 2), osDimY + 16);

  // ── Angle arc at the LED source ──
  // The front ray goes left and down at frontAngle from horizontal.
  // In canvas: horizontal-left = PI, downward-left at angle = PI + frontAngle
  // But we want the arc between horizontal-left and the ray direction.
  const arcR = Math.min(35, (setback + model.lightOffset) * pxPerInch * 0.4);
  if (arcR > 12) {
    ctx.strokeStyle = '#f4a535';
    ctx.lineWidth = 1;
    // In canvas coords from the LED source point:
    // Horizontal-left direction = PI
    // The front ray goes left-and-down. The angle below horizontal = frontAngle.
    // Canvas angle for the ray = PI + frontAngle (below horizontal-left)
    const arcStartAngle = Math.PI;                  // horizontal left
    const arcEndAngle   = Math.PI + frontAngleRad;  // ray direction (below horiz-left)
    ctx.beginPath();
    ctx.arc(px(ledFrontX), py(ledY), arcR, arcStartAngle, arcEndAngle, false);
    ctx.stroke();

    // Angle label
    ctx.fillStyle = '#f4a535';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const angleLabelAngle = arcStartAngle + frontAngleRad / 2;
    const labelR = arcR + 14;
    ctx.fillText(
      model.frontAngle + '°',
      px(ledFrontX) + Math.cos(angleLabelAngle) * labelR,
      py(ledY) + Math.sin(angleLabelAngle) * labelR + 4
    );
  }

  // ── Back angle arc ──
  if (backHorizDist > 0.5) {
    const arcRBack = Math.min(30, backHorizDist * pxPerInch * 0.3);
    if (arcRBack > 10) {
      ctx.strokeStyle = '#e8611a';
      ctx.lineWidth = 1;
      // Horizontal-right = 0
      // Back ray goes right-and-down at backAngle below horizontal
      ctx.beginPath();
      ctx.arc(px(ledBackX), py(ledY), arcRBack, 0, backAngleRad, false);
      ctx.stroke();

      ctx.fillStyle = '#e8611a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      const bLabelAngle = backAngleRad / 2;
      const bLabelR = arcRBack + 14;
      ctx.fillText(
        model.backAngle + '°',
        px(ledBackX) + Math.cos(bLabelAngle) * bLabelR,
        py(ledY) + Math.sin(bLabelAngle) * bLabelR + 4
      );
    }
  }

  // ── Redraw enclosure walls on top for clean edges ──
  // Ceiling
  ctx.fillStyle = '#363c52';
  ctx.fillRect(px(0) - wallThick, py(0) - wallThick, encDepth * pxPerInch + wallThick * 2, wallThick);
  // Floor
  ctx.fillRect(px(0) - wallThick, py(encHeight), encDepth * pxPerInch + wallThick * 2, wallThick);
  // Back wall
  ctx.fillRect(px(encDepth), py(0) - wallThick, wallThick, encHeight * pxPerInch + wallThick * 2);
  // Front wall top (light trap)
  ctx.fillRect(px(0) - wallThick, py(0) - wallThick, wallThick, Math.min(lightTrapBottomY, encHeight) * pxPerInch + wallThick);

  // ── Wall labels ──
  ctx.fillStyle = '#555d78';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';

  // Front / Back at bottom
  ctx.fillStyle = '#8b90a0';
  ctx.font = '12px sans-serif';
  ctx.fillText('FRONT', px(0), py(encHeight) + wallThick + 20);
  ctx.fillText('BACK', px(encDepth), py(encHeight) + wallThick + 20);

  // ── Legend ──
  const legendX = W - 190;
  const legendY = 22;
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
  ctx.fillText('Setback (SB)', legendX + 20, legendY + 45);

  ctx.fillStyle = '#a78bfa';
  ctx.fillRect(legendX, legendY + 60, 14, 3);
  ctx.fillText('Light offset (OS)', legendX + 20, legendY + 65);

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
window.addEventListener('resize', update);

// ── Init ──
buildTable();
update();
