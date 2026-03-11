/* ──────────────────────────────────────────────────────────
   Aquafire AR Cutout Visualizer – ar-cutout-app.js
   v2 — Gyroscope-stabilized overlay
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
const CARD_DIAGONAL = Math.sqrt(CARD_WIDTH * CARD_WIDTH + CARD_HEIGHT * CARD_HEIGHT);

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
const hudLock = document.getElementById('hud-lock');
const hudClose = document.getElementById('hud-close');
const touchHint = document.getElementById('ar-touch-hint');
const btnCard = document.getElementById('btn-card');
const btnManual = document.getElementById('btn-manual');
const manualInput = document.getElementById('manual-input');
const knownDistInput = document.getElementById('known-distance');
const pageHeader = document.getElementById('page-header');
const mainContent = document.getElementById('main-content');
const gyroStatus = document.getElementById('gyro-status');

const ctx = canvas.getContext('2d');

// ── State ──
let calibMethod = 'card';
let calPoints = [];
let pxPerInch = 0;
let cutout = { w: 0, d: 0, h: 0 };

// The cutout's "anchor" position — where the user placed it in screen coords
let anchorPos = { x: 0, y: 0 };
let rectAngle = 0;
let rectScale = 1;
let isLocked = false;
let isCalibrated = false;
let stream = null;
let animFrame = null;

// ── Gyroscope / Device Orientation ──
let gyroAvailable = false;
let gyroPermission = 'unknown'; // 'unknown' | 'granted' | 'denied'
// Orientation at the moment the user places/anchors the cutout
let anchorOrientation = null; // { alpha, beta, gamma }
// Current live orientation from the device
let currentOrientation = { alpha: 0, beta: 0, gamma: 0 };
// Smoothed offset applied to the rendered position
let gyroOffset = { x: 0, y: 0 };
// Smoothing factor (0 = no smoothing, 1 = frozen). Higher = smoother but laggier
const GYRO_SMOOTH = 0.55;
// Pixels of screen shift per degree of device rotation (tunable)
const PX_PER_DEG = 12;
// Deadzone in degrees — ignore tiny jitters below this threshold
const GYRO_DEADZONE = 0.4;

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

/** Normalize angle difference to [-180, 180] */
function angleDiff(a, b) {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/** Get the effective render position: anchor + gyro offset */
function getRenderPos() {
  return {
    x: anchorPos.x + gyroOffset.x,
    y: anchorPos.y + gyroOffset.y,
  };
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

// ── Gyroscope Setup ──
function onDeviceOrientation(e) {
  if (e.alpha == null) return;
  currentOrientation = {
    alpha: e.alpha, // compass heading (0-360)
    beta: e.beta,   // front-back tilt (-180 to 180)
    gamma: e.gamma, // left-right tilt (-90 to 90)
  };
  gyroAvailable = true;
}

async function requestGyroPermission() {
  // iOS 13+ requires explicit permission
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      gyroPermission = result; // 'granted' or 'denied'
      if (result === 'granted') {
        window.addEventListener('deviceorientation', onDeviceOrientation, true);
      }
    } catch {
      gyroPermission = 'denied';
    }
  } else {
    // Android / desktop — just listen, no permission needed
    window.addEventListener('deviceorientation', onDeviceOrientation, true);
    gyroPermission = 'granted';
    // Check if events actually fire after a short delay
    setTimeout(() => {
      if (!gyroAvailable) {
        gyroPermission = 'denied';
      }
    }, 1000);
  }
}

/** Snapshot the current orientation as the anchor reference */
function setAnchorOrientation() {
  if (gyroAvailable) {
    anchorOrientation = { ...currentOrientation };
  } else {
    anchorOrientation = null;
  }
  gyroOffset = { x: 0, y: 0 };
}

/** Apply deadzone — zero out small rotations to suppress jitter */
function applyDeadzone(val) {
  if (Math.abs(val) < GYRO_DEADZONE) return 0;
  // Subtract deadzone so response starts from 0 at the edge
  return val - Math.sign(val) * GYRO_DEADZONE;
}

/** Update gyroOffset based on orientation change since anchor was set.
 *  Called every frame in the render loop.
 *
 *  The phone is pointed DOWN at a horizontal surface (beta ≈ 90°).
 *  In this posture:
 *    - alpha (yaw / compass) maps to horizontal screen shift
 *    - gamma (left-right tilt) maps to vertical screen shift (phone tilted
 *      toward/away from user moves the view up/down on the surface)
 *  Beta changes near 90° mostly mean moving closer/further from surface,
 *  which doesn't translate to useful lateral shift, so we ignore it.
 */
function updateGyroOffset() {
  if (!anchorOrientation || !gyroAvailable) return;

  const dAlpha = applyDeadzone(angleDiff(currentOrientation.alpha, anchorOrientation.alpha));
  const dGamma = applyDeadzone(angleDiff(currentOrientation.gamma, anchorOrientation.gamma));

  // Yaw rotation → horizontal shift (rotate right = scene shifts left)
  const targetX = -dAlpha * PX_PER_DEG;
  // Left-right tilt when pointing down → vertical shift
  const targetY = dGamma * PX_PER_DEG;

  // Smooth toward target (exponential moving average)
  gyroOffset.x += (targetX - gyroOffset.x) * (1 - GYRO_SMOOTH);
  gyroOffset.y += (targetY - gyroOffset.y) * (1 - GYRO_SMOOTH);
}

// ── Launch AR ──
btnLaunch.addEventListener('click', async () => {
  // Request gyro permission FIRST (must be user-gesture-triggered on iOS)
  await requestGyroPermission();

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

    // Update gyro status indicator
    updateGyroStatus();

    startCalibration();
  } catch {
    alert('Could not access camera. Please allow camera permissions and try again.');
  }
});

function updateGyroStatus() {
  if (!gyroStatus) return;
  if (gyroAvailable || gyroPermission === 'granted') {
    gyroStatus.textContent = 'Gyro: Active';
    gyroStatus.className = 'gyro-badge active';
  } else if (gyroPermission === 'denied') {
    gyroStatus.textContent = 'Gyro: Off';
    gyroStatus.className = 'gyro-badge off';
  } else {
    gyroStatus.textContent = 'Gyro: Pending';
    gyroStatus.className = 'gyro-badge pending';
  }
  gyroStatus.style.display = 'inline-block';
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ── Calibration flow ──
function startCalibration() {
  isCalibrated = false;
  calPoints = [];
  calibrateUI.style.display = 'flex';
  hudEl.style.display = 'none';
  touchHint.style.display = 'none';

  if (calibMethod === 'card') {
    calTitle.textContent = 'Place Credit Card on Surface';
    calInstruction.textContent = 'Tap two opposite corners of the card to set the scale.';
  } else {
    const dist = parseFloat(knownDistInput.value) || 12;
    calTitle.textContent = `Mark a ${dist}\u2033 Distance`;
    calInstruction.textContent = 'Tap the start and end points of the known distance.';
  }
  calDot1.className = 'cal-dot active';
  calDot2.className = 'cal-dot';

  if (animFrame) cancelAnimationFrame(animFrame);
  renderLoop();
}

function handleCalibrationTap(x, y) {
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

    const realDist = calibMethod === 'card'
      ? CARD_DIAGONAL
      : (parseFloat(knownDistInput.value) || 12);

    pxPerInch = pxDist / realDist;
    calDot2.className = 'cal-dot done';

    setTimeout(() => {
      isCalibrated = true;
      calibrateUI.style.display = 'none';
      hudEl.style.display = 'flex';
      touchHint.style.display = 'block';
      updateHUD();

      // Place cutout centered between the two cal points
      anchorPos = {
        x: (calPoints[0].x + calPoints[1].x) / 2,
        y: (calPoints[0].y + calPoints[1].y) / 2,
      };
      rectAngle = 0;
      rectScale = 1;
      isLocked = false;
      hudLock.classList.remove('active');

      // Snapshot orientation at placement time
      setAnchorOrientation();

      // Update gyro indicator now that we know if it works
      setTimeout(updateGyroStatus, 500);
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

  if (isLocked) return;

  activeTouches[e.pointerId] = { x: e.clientX, y: e.clientY };
  const ids = Object.keys(activeTouches);

  if (ids.length === 1) {
    // Start drag — record current anchor + gyro offset as starting point
    const renderPos = getRenderPos();
    dragStart = { x: e.clientX, y: e.clientY };
    dragOffset = { x: renderPos.x, y: renderPos.y };
  } else if (ids.length === 2) {
    const [a, b] = ids.map(id => activeTouches[id]);
    lastPinchDist = Math.hypot(b.x - a.x, b.y - a.y);
    lastPinchAngle = Math.atan2(b.y - a.y, b.x - a.x);
    dragStart = null;
  }
});

canvas.addEventListener('pointermove', (e) => {
  e.preventDefault();
  if (isLocked || !isCalibrated) return;

  if (activeTouches[e.pointerId]) {
    activeTouches[e.pointerId] = { x: e.clientX, y: e.clientY };
  }

  const ids = Object.keys(activeTouches);

  // Single finger drag — move the anchor
  if (ids.length === 1 && dragStart) {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    // Move anchor so the rendered pos follows the finger
    anchorPos.x = dragOffset.x + dx - gyroOffset.x;
    anchorPos.y = dragOffset.y + dy - gyroOffset.y;
    // Re-anchor the gyro so the cutout doesn't jump when you release
    setAnchorOrientation();
    // After re-anchoring, anchorPos IS the render pos
    anchorPos.x = dragOffset.x + dx;
    anchorPos.y = dragOffset.y + dy;
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

    // Move anchor to midpoint of fingers
    anchorPos.x = (a.x + b.x) / 2;
    anchorPos.y = (a.y + b.y) / 2;
    setAnchorOrientation();
  }
});

function onPointerEnd(e) {
  delete activeTouches[e.pointerId];
  if (Object.keys(activeTouches).length === 0) {
    dragStart = null;
    lastPinchDist = 0;
    lastPinchAngle = 0;
    // Re-anchor orientation so cutout stays where user left it
    setAnchorOrientation();
    anchorPos = getRenderPos();
    gyroOffset = { x: 0, y: 0 };
  }
}
canvas.addEventListener('pointerup', onPointerEnd);
canvas.addEventListener('pointercancel', onPointerEnd);

// ── HUD Controls ──
hudRecalibrate.addEventListener('click', () => startCalibration());

hudLock.addEventListener('click', () => {
  isLocked = !isLocked;
  hudLock.classList.toggle('active', isLocked);
  if (isLocked) {
    // Bake in gyro offset and re-anchor
    anchorPos = getRenderPos();
    gyroOffset = { x: 0, y: 0 };
    setAnchorOrientation();
  }
});

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
    // Update gyro offset every frame
    updateGyroOffset();
    drawCutoutOverlay();
  }

  animFrame = requestAnimationFrame(renderLoop);
}

function drawCalibrationMarkers() {
  for (let i = 0; i < calPoints.length; i++) {
    const p = calPoints[i];
    // Pulsing ring
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

function drawCutoutOverlay() {
  const w = cutout.w * pxPerInch * rectScale;
  const d = cutout.d * pxPerInch * rectScale;
  const pos = getRenderPos();

  ctx.save();
  ctx.translate(pos.x, pos.y);
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

  // ── Anchor dot (small dot showing world-lock point) ──
  if (gyroAvailable && !isLocked) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232,168,56,0.4)';
    ctx.fill();
  }
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
