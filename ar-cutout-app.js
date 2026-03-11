/* ──────────────────────────────────────────────────────────
   Aquafire AR Cutout Visualizer – ar-cutout-app.js
   v3 — Viewfinder mode (screen-fixed overlay)
   ────────────────────────────────────────────────────────── */

// ── Model Data (mirrored from app.js) ──
const MODELS = {
  original: {
    name: 'Aquafire Original',
    sizes: {
      20: { w: 20.25, d: 12.25, h: 12 },
      40: { w: 40.25, d: 12.25, h: 12 },
      60: { w: 60.25, d: 12.25, h: 12 },
    },
  },
  pro: {
    name: 'Aquafire Pro',
    sizes: {
      20: { w: 20.25, d: 12.25, h: 14 },
      40: { w: 40.25, d: 12.25, h: 14 },
      60: { w: 60.25, d: 12.25, h: 14 },
    },
  },
  lite: {
    name: 'Aquafire Lite',
    sizes: {
      20: { w: 20.25, d: 9.625, h: 11 },
      40: { w: 40.25, d: 9.625, h: 11 },
      60: { w: 60.25, d: 9.625, h: 11 },
    },
  },
};

// Credit card dimensions (inches)
const CARD_WIDTH = 3.375;
const CARD_HEIGHT = 2.125;


// ── DOM Refs ──
const modelSelect = document.getElementById('ar-model');
const sizeSelect = document.getElementById('ar-size');
const sumW = document.getElementById('sum-w');
const sumD = document.getElementById('sum-d');
const sumH = document.getElementById('sum-h');
const btnLaunch = document.getElementById('btn-launch');
const noCameraNotice = document.getElementById('no-camera-notice');
const overlay = document.getElementById('ar-overlay');
const video = document.getElementById('ar-video');
const canvas = document.getElementById('ar-canvas');
const calibrateUI = document.getElementById('ar-calibrate-ui');
const calTitle = document.getElementById('cal-title');
const calInstruction = document.getElementById('cal-instruction');
const calDot1 = document.getElementById('cal-dot-1');
const calDot2 = document.getElementById('cal-dot-2');
const hudEl = document.getElementById('ar-hud');
const hudDims = document.getElementById('hud-dims');
const hudRecalibrate = document.getElementById('hud-recalibrate');
const hudClose = document.getElementById('hud-close');
const touchHint = document.getElementById('ar-touch-hint');
const btnCard = document.getElementById('btn-card');
const btnManual = document.getElementById('btn-manual');
const manualInput = document.getElementById('manual-input');
const knownDistInput = document.getElementById('known-distance');
const pageHeader = document.getElementById('page-header');
const mainContent = document.getElementById('main-content');

const ctx = canvas.getContext('2d');

// ── State ──
let calibMethod = 'card';
let calPoints = [];
let pxPerInch = 0;
let cutout = { w: 0, d: 0, h: 0 };

// The cutout's position on screen (viewfinder-fixed)
let anchorPos = { x: 0, y: 0 };
let rectAngle = 0;
let rectScale = 1;
let isCalibrated = false;
let stream = null;
let animFrame = null;

// Touch gesture state
let activeTouches = {};
let lastPinchDist = 0;
let lastPinchAngle = 0;
let dragStart = null;
let dragOffset = { x: 0, y: 0 };

// ── Helpers ──
function frac(n) {
  const whole = Math.floor(n);
  const rem = n - whole;
  const fracs = [
    [1/8, '\u215B'], [1/4, '\u00BC'], [3/8, '\u215C'], [1/2, '\u00BD'],
    [5/8, '\u215D'], [3/4, '\u00BE'], [7/8, '\u215E'],
  ];
  if (rem < 0.01) return whole + '\u2033';
  for (const [val, sym] of fracs) {
    if (Math.abs(rem - val) < 0.02) {
      return (whole > 0 ? whole + ' ' : '') + sym + '\u2033';
    }
  }
  return n.toFixed(2) + '\u2033';
}

function getDims() {
  const modelKey = modelSelect.value;
  const sizeKey = sizeSelect.value;
  const model = MODELS[modelKey];
  const dims = model.sizes[sizeKey];
  return {
    w: dims.w,
    d: dims.d,
    h: dims.h,
    modelName: model.name,
    size: sizeKey,
  };
}

function updateSummary() {
  const d = getDims();
  cutout = { w: d.w, d: d.d, h: d.h };
  sumW.textContent = frac(d.w);
  sumD.textContent = frac(d.d);
  sumH.textContent = frac(d.h);
  if (isCalibrated) updateHUD();
}

function updateHUD() {
  hudDims.innerHTML =
    `<div class="hud-dim-item"><span class="hud-dim-label">W</span><span class="hud-dim-val">${frac(cutout.w)}</span></div>` +
    `<div class="hud-dim-item"><span class="hud-dim-label">D</span><span class="hud-dim-val">${frac(cutout.d)}</span></div>` +
    `<div class="hud-dim-item"><span class="hud-dim-label">H</span><span class="hud-dim-val">${frac(cutout.h)}</span></div>`;
}

// ── Config listeners ──
modelSelect.addEventListener('change', updateSummary);
sizeSelect.addEventListener('change', updateSummary);
updateSummary();

// ── Calibration method toggle ──
btnCard.addEventListener('click', () => {
  calibMethod = 'card';
  btnCard.classList.add('active');
  btnManual.classList.remove('active');
  manualInput.style.display = 'none';
});
btnManual.addEventListener('click', () => {
  calibMethod = 'manual';
  btnManual.classList.add('active');
  btnCard.classList.remove('active');
  manualInput.style.display = 'block';
});

// ── Camera check ──
const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
if (!hasCamera) {
  btnLaunch.style.display = 'none';
  noCameraNotice.style.display = 'block';
}

// ── Launch AR ──
btnLaunch.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    overlay.style.display = 'block';
    pageHeader.style.display = 'none';
    mainContent.style.display = 'none';
    document.body.style.overflow = 'hidden';

    startCalibration();
  } catch {
    alert('Could not access camera. Please allow camera permissions and try again.');
  }
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ── Card guide dimensions (pixels) ──
// The guide is drawn at a fixed pixel size; the user moves their phone until
// the physical card lines up, then taps to confirm.  At that moment, the
// guide's pixel width equals CARD_WIDTH real inches, giving us pxPerInch.
function getCardGuide() {
  const guideW = Math.round(canvas.width * 0.55);
  const guideH = Math.round(guideW * (CARD_HEIGHT / CARD_WIDTH));
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  return { x: cx - guideW / 2, y: cy - guideH / 2, w: guideW, h: guideH };
}

// ── Calibration flow ──
function startCalibration() {
  isCalibrated = false;
  calPoints = [];
  calibrateUI.style.display = 'flex';
  hudEl.style.display = 'none';
  touchHint.style.display = 'none';

  if (calibMethod === 'card') {
    calTitle.textContent = 'Align Your Credit Card';
    calInstruction.textContent =
      'Hold a card against the wall or surface where your fireplace will go. Step back until the card fits the guide, then tap to confirm.';
    // Hide the two-dot progress for card mode (single tap now)
    calDot1.style.display = 'none';
    calDot2.style.display = 'none';
  } else {
    const dist = parseFloat(knownDistInput.value) || 12;
    calTitle.textContent = `Mark a ${dist}\u2033 Distance`;
    calInstruction.textContent = 'Tap the start and end points of the known distance.';
    calDot1.style.display = '';
    calDot2.style.display = '';
    calDot1.className = 'cal-dot active';
    calDot2.className = 'cal-dot';
  }

  if (animFrame) cancelAnimationFrame(animFrame);
  renderLoop();
}

function finishCalibration(centerX, centerY) {
  isCalibrated = true;
  calibrateUI.style.display = 'none';
  hudEl.style.display = 'flex';
  touchHint.style.display = 'block';
  updateHUD();

  anchorPos = { x: centerX, y: centerY };
  rectAngle = 0;
  rectScale = 1;
}

function handleCalibrationTap(x, y) {
  if (calibMethod === 'card') {
    // Single tap — guide overlay sets the scale
    const guide = getCardGuide();
    pxPerInch = guide.w / CARD_WIDTH;
    finishCalibration(canvas.width / 2, canvas.height / 2);
    return;
  }

  // Manual two-tap flow (unchanged)
  calPoints.push({ x, y });

  if (calPoints.length === 1) {
    calDot1.className = 'cal-dot done';
    calDot2.className = 'cal-dot active';
    calInstruction.textContent = 'Now tap the second point.';
  }

  if (calPoints.length === 2) {
    const dx = calPoints[1].x - calPoints[0].x;
    const dy = calPoints[1].y - calPoints[0].y;
    const pxDist = Math.sqrt(dx * dx + dy * dy);
    const realDist = parseFloat(knownDistInput.value) || 12;

    pxPerInch = pxDist / realDist;
    calDot2.className = 'cal-dot done';

    setTimeout(() => {
      finishCalibration(
        (calPoints[0].x + calPoints[1].x) / 2,
        (calPoints[0].y + calPoints[1].y) / 2,
      );
    }, 400);
  }
}

// ── Canvas tap/touch handling ──
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();

  if (!isCalibrated) {
    handleCalibrationTap(e.clientX, e.clientY);
    return;
  }

  activeTouches[e.pointerId] = { x: e.clientX, y: e.clientY };
  const ids = Object.keys(activeTouches);

  if (ids.length === 1) {
    dragStart = { x: e.clientX, y: e.clientY };
    dragOffset = { x: anchorPos.x, y: anchorPos.y };
  } else if (ids.length === 2) {
    const [a, b] = ids.map(id => activeTouches[id]);
    lastPinchDist = Math.hypot(b.x - a.x, b.y - a.y);
    lastPinchAngle = Math.atan2(b.y - a.y, b.x - a.x);
    dragStart = null;
  }
});

canvas.addEventListener('pointermove', (e) => {
  e.preventDefault();
  if (!isCalibrated) return;

  if (activeTouches[e.pointerId]) {
    activeTouches[e.pointerId] = { x: e.clientX, y: e.clientY };
  }

  const ids = Object.keys(activeTouches);

  // Single finger drag — reposition
  if (ids.length === 1 && dragStart) {
    anchorPos.x = dragOffset.x + (e.clientX - dragStart.x);
    anchorPos.y = dragOffset.y + (e.clientY - dragStart.y);
  }

  // Two finger: pinch + rotate
  if (ids.length === 2) {
    const [a, b] = ids.map(id => activeTouches[id]);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);

    if (lastPinchDist > 0) {
      const scaleDelta = dist / lastPinchDist;
      rectScale *= scaleDelta;
      rectScale = Math.max(0.2, Math.min(rectScale, 5));
    }

    rectAngle += angle - lastPinchAngle;
    lastPinchDist = dist;
    lastPinchAngle = angle;

    anchorPos.x = (a.x + b.x) / 2;
    anchorPos.y = (a.y + b.y) / 2;
  }
});

function onPointerEnd(e) {
  delete activeTouches[e.pointerId];
  if (Object.keys(activeTouches).length === 0) {
    dragStart = null;
    lastPinchDist = 0;
    lastPinchAngle = 0;
  }
}
canvas.addEventListener('pointerup', onPointerEnd);
canvas.addEventListener('pointercancel', onPointerEnd);

// ── HUD Controls ──
hudRecalibrate.addEventListener('click', () => startCalibration());

hudClose.addEventListener('click', () => closeAR());

function closeAR() {
  overlay.style.display = 'none';
  pageHeader.style.display = '';
  mainContent.style.display = '';
  document.body.style.overflow = '';
  window.removeEventListener('resize', resizeCanvas);

  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  video.srcObject = null;
}

// ── Render Loop ──
function renderLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isCalibrated) {
    drawCalibrationMarkers();
  } else {
    drawCutoutOverlay();
  }

  animFrame = requestAnimationFrame(renderLoop);
}

function drawCalibrationMarkers() {
  if (calibMethod === 'card') {
    drawCardGuide();
    return;
  }

  // Manual mode: draw tapped points
  for (let i = 0; i < calPoints.length; i++) {
    const p = calPoints[i];
    const pulse = 1 + 0.15 * Math.sin(Date.now() / 300);
    ctx.strokeStyle = '#e8a838';
    ctx.lineWidth = 2;

    // Crosshair
    ctx.beginPath();
    ctx.moveTo(p.x - 16, p.y);
    ctx.lineTo(p.x + 16, p.y);
    ctx.moveTo(p.x, p.y - 16);
    ctx.lineTo(p.x, p.y + 16);
    ctx.stroke();

    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#e8a838';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Point ${i + 1}`, p.x, p.y - 24);
  }

  // Dashed line between points
  if (calPoints.length === 2) {
    ctx.beginPath();
    ctx.moveTo(calPoints[0].x, calPoints[0].y);
    ctx.lineTo(calPoints[1].x, calPoints[1].y);
    ctx.strokeStyle = 'rgba(232,168,56,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawCardGuide() {
  const g = getCardGuide();
  const pulse = 1 + 0.08 * Math.sin(Date.now() / 400);

  // Subtle animated glow
  ctx.shadowColor = 'rgba(232, 168, 56, 0.25)';
  ctx.shadowBlur = 12 * pulse;

  // Card outline — rounded rectangle
  ctx.strokeStyle = `rgba(232, 168, 56, ${0.6 + 0.15 * Math.sin(Date.now() / 400)})`;
  ctx.lineWidth = 2.5;
  roundRect(ctx, g.x, g.y, g.w, g.h, 10);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Light fill so user can see the target area
  ctx.fillStyle = 'rgba(232, 168, 56, 0.06)';
  roundRect(ctx, g.x, g.y, g.w, g.h, 10);
  ctx.fill();

  // Corner brackets for alignment
  const bLen = 24;
  ctx.strokeStyle = '#e8a838';
  ctx.lineWidth = 3;
  const corners = [
    [g.x, g.y, 1, 1],
    [g.x + g.w, g.y, -1, 1],
    [g.x + g.w, g.y + g.h, -1, -1],
    [g.x, g.y + g.h, 1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + bLen * dx, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + bLen * dy);
    ctx.stroke();
  }

  // Label above the guide
  ctx.fillStyle = '#e8a838';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Align card to this outline', g.x + g.w / 2, g.y - 14);

  // Dimension hint below
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = 'rgba(232, 168, 56, 0.6)';
  ctx.textBaseline = 'top';
  ctx.fillText('3\u215C\u2033 \u00D7 2\u215B\u2033', g.x + g.w / 2, g.y + g.h + 12);
}

function drawCutoutOverlay() {
  const w = cutout.w * pxPerInch * rectScale;
  const d = cutout.d * pxPerInch * rectScale;

  ctx.save();
  ctx.translate(anchorPos.x, anchorPos.y);
  ctx.rotate(rectAngle);

  // ── Glow / shadow behind the cutout ──
  ctx.shadowColor = 'rgba(192, 57, 43, 0.35)';
  ctx.shadowBlur = 24;

  // Semi-transparent fill
  ctx.fillStyle = 'rgba(192, 57, 43, 0.10)';
  ctx.fillRect(-w / 2, -d / 2, w, d);
  ctx.shadowBlur = 0;

  // Border
  ctx.strokeStyle = 'rgba(192, 57, 43, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-w / 2, -d / 2, w, d);

  // Corner brackets
  const bracketLen = Math.min(20, w * 0.15, d * 0.15);
  ctx.strokeStyle = '#e8a838';
  ctx.lineWidth = 3;
  const corners = [
    [-w / 2, -d / 2, 1, 1],
    [w / 2, -d / 2, -1, 1],
    [w / 2, d / 2, -1, -1],
    [-w / 2, d / 2, 1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + bracketLen * dx, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + bracketLen * dy);
    ctx.stroke();
  }

  // Dashed center crosshair
  ctx.strokeStyle = 'rgba(228,229,233,0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.moveTo(0, -d / 2);
  ctx.lineTo(0, d / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Dimension labels ──
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width (top)
  drawDimLabel(0, -d / 2 - 18, frac(cutout.w), w);

  // Depth (right side, rotated)
  ctx.save();
  ctx.translate(w / 2 + 18, 0);
  ctx.rotate(Math.PI / 2);
  drawDimLabel(0, 0, frac(cutout.d), d);
  ctx.restore();

  // Center label
  ctx.fillStyle = 'rgba(228,229,233,0.45)';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('Insert cutout', 0, -10);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = 'rgba(228,229,233,0.3)';
  const dims = getDims();
  ctx.fillText(dims.modelName + ' ' + dims.size + '\u2033', 0, 8);

  ctx.restore();
}

function drawDimLabel(x, y, text, lineW) {
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 16;
  const ph = 22;

  // Background pill
  ctx.fillStyle = 'rgba(18,20,23,0.82)';
  roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, 5);
  ctx.fill();
  // Subtle border
  ctx.strokeStyle = 'rgba(232,168,56,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, 5);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#e8a838';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);

  // Dimension arrows
  const half = lineW / 2;
  const gap = pw / 2 + 4;
  ctx.strokeStyle = 'rgba(232,168,56,0.5)';
  ctx.lineWidth = 1;
  if (half > gap + 10) {
    ctx.beginPath();
    ctx.moveTo(x - gap, y);
    ctx.lineTo(x - half, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + half, y);
    ctx.stroke();
    // Ticks
    ctx.beginPath();
    ctx.moveTo(x - half, y - 5);
    ctx.lineTo(x - half, y + 5);
    ctx.moveTo(x + half, y - 5);
    ctx.lineTo(x + half, y + 5);
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Also update overlay when config changes during AR session
modelSelect.addEventListener('change', () => { if (isCalibrated) updateHUD(); });
sizeSelect.addEventListener('change', () => { if (isCalibrated) updateHUD(); });
