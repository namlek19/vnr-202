import {
  WORLD_CONFIG,
  ACTS,
  INTERACTABLES,
  QTE_ZONES,
  FINALE_EVENT,
  sampleGroundOffset,
  getZoneName,
} from './data/storyData.js';
import { SoundEngine } from './audio/soundEngine.js';
import { VfxSystem } from './game/vfx.js';
import { WorldRenderer } from './game/renderer.js';
import { InWorldCombatSystem } from './game/combatSystem.js';

// ==================== INITIALIZE CORE SYSTEMS ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const sound = new SoundEngine();
const vfx = new VfxSystem(sound);
const renderer = new WorldRenderer();

// ==================== DOM ELEMENTS ====================
const orientationOverlay = document.getElementById('orientation-overlay');
const introOverlay = document.getElementById('intro-overlay');
const introControlsLine = document.getElementById('intro-controls-line');
const btnStartGame = document.getElementById('btn-start-game');

const topContextHud = document.getElementById('top-context-hud');
const contextPeriod = document.getElementById('context-period');
const contextLocation = document.getElementById('context-location');
const contextTitle = document.getElementById('context-title');
const contextSubtitle = document.getElementById('context-subtitle');
const contextActionBanner = document.getElementById('context-action-banner');
const actionBannerIcon = document.getElementById('action-banner-icon');
const actionBannerText = document.getElementById('action-banner-text');

const cinematicCaption = document.getElementById('cinematic-caption');

const touchControls = document.getElementById('touch-controls');
const virtualJoystick = document.getElementById('virtual-joystick');
const joystickKnob = document.getElementById('joystick-knob');
const btnTouchAttack = document.getElementById('btn-touch-attack');
const btnTouchJump = document.getElementById('btn-touch-jump');
const btnTouchDrop = document.getElementById('btn-touch-drop');

const btnChapterToggle = document.getElementById('btn-chapter-toggle');
const chapterDrawer = document.getElementById('chapter-drawer');
const drawerItems = Array.from(document.querySelectorAll('.drawer-item'));
const btnAudio = document.getElementById('btn-audio');
const audioLabel = document.getElementById('audio-label');

const incenseHud = document.getElementById('incense-hud');
const incenseCard = document.getElementById('incense-card');
const incensePrompt = document.getElementById('incense-prompt');
const incenseBarFill = document.getElementById('incense-bar-fill');
const incensePercent = document.getElementById('incense-percent');
const btnHoldIncense = document.getElementById('btn-hold-incense');
const incenseBtnLabel = document.getElementById('incense-btn-label');

const storyModal = document.getElementById('story-modal');
const modalTag = document.getElementById('modal-tag');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalNote = document.getElementById('modal-note');
const modalHint = document.getElementById('modal-hint');
const btnCloseModal = document.getElementById('btn-close-modal');

const finaleOverlay = document.getElementById('finale-overlay');
const finaleQuoteText = document.getElementById('finale-quote-text');
const finaleQuoteAuthor = document.getElementById('finale-quote-author');
const finaleLessonTitle = document.getElementById('finale-lesson-title');
const finaleLessonText = document.getElementById('finale-lesson-text');
const btnReplay = document.getElementById('btn-replay');

// Objective Checklist HUD
const objectiveChecklist = document.getElementById('objective-checklist');
const objectiveCounter = document.getElementById('objective-counter');
const objectiveList = document.getElementById('objective-list');

// Mini-map HUD
const minimapHud = document.getElementById('minimap-hud');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
const minimapActLabel = document.getElementById('minimap-act-label');

// VOV Broadcast HUD (Lời kêu gọi toàn quốc kháng chiến 19/12/1946)
const vovHud = document.getElementById('vov-broadcast-hud');
const vovToggleBtn = document.getElementById('vov-toggle-btn');
const vovBars = Array.from(document.querySelectorAll('.vov-bar'));
const vovBarHeights = new Float32Array(18);

// Static text bindings from storyData.js
incensePrompt.textContent = isMobileMode ? 'Chạm & Giữ để thắp nén tâm hương' : 'Giữ [F] để thắp nén tâm hương';
if (finaleQuoteText) finaleQuoteText.textContent = FINALE_EVENT.quoteText;
if (finaleQuoteAuthor) finaleQuoteAuthor.textContent = FINALE_EVENT.quoteAuthor;
if (finaleLessonTitle) finaleLessonTitle.textContent = FINALE_EVENT.lessonTitle;
if (finaleLessonText) finaleLessonText.textContent = FINALE_EVENT.lessonText;
if (btnReplay) {
  const replaySpan = btnReplay.querySelector('span');
  if (replaySpan) replaySpan.textContent = FINALE_EVENT.replayButtonLabel;
}

// ==================== DEVICE, VIEWPORT & PHYSICS STATE ====================
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let worldScale = 1.0; // Responsive world zoom scale for low-height mobile landscape screens
let baseGroundY = Math.round(viewportHeight * 0.8);

let isTouchDevice = false;
let isMobileMode = false;
let isPortraitPaused = false;

const GRAVITY = 1580;
const JUMP_VELOCITY = -625;
const AUTO_WALK_SPEED = 205;

const interactablesState = INTERACTABLES.map((item) => ({
  ...item,
  visited: false,
}));

const completedQtes = new Set();

let gameStarted = false;
let currentAct = 1;
let topHudDockTimer = null;
let captionHideTimer = null;
let pendingMilestoneTimer = null;

// Player 2D Platformer state (dy = offset relative to baseGroundY; y = baseGroundY + dy)
const player = {
  x: WORLD_CONFIG.enterStartX,
  dy: 0,
  y: baseGroundY,
  vx: 0,
  vy: 0,
  maxSpeed: 310,
  accel: 1850,
  friction: 1650,
  facing: 1,
  onGround: true,
  currentPlatformId: null,
  dropThroughTimer: 0,
  ignoredPlatformId: null,
  coyoteTimer: 0,
  jumpBufferTimer: 0,
  landingSquash: 0,
  walkCycle: 0,
  nextStepCycle: Math.PI * 0.7,
  pose: null,
  poseTimer: 0,
  poseHoldDuration: 0,
  costumeOverride: null,
  wearingHat: true,
  isCrouching: false,
};

let cameraX = 0;
let cameraY = 0;
let cameraZoom = 1.0;
let targetCameraZoom = 1.0;

const keysDown = new Set();
const incenseHoldPointers = new Set();

// 360-degree Virtual Analog Joystick state (multi-touch safe via pointerId)
const joystickState = {
  active: false,
  pointerId: null,
  normX: 0,
  normY: 0,
  upLatched: false,
  downLatched: false,
  lastJumpAt: 0,
};

// Auto-run-to-item when player taps a visible artifact slightly farther away on Canvas
let autoSeekItem = null;
let autoSeekElapsed = 0;
let autoSeekJumpCooldown = 0;

let nearbyInteractable = null;
let nearbyObstacleHint = null;

// Modal & Typewriter state
const modalState = {
  open: false,
  openedAt: 0,
  fullText: '',
  charIndex: 0,
  typingDone: false,
  timerId: null,
};

// Cinematic Auto-Walk & Generational Handoff State Machine
const transitionState = {
  active: false,
  subPhase: null,
  targetAct: 1,
  fadeAlpha: 0,
  ceremonyTimer: 0,
  ceremonyDuration: 2.5,
  ceremonyProgress: 0,
  hatSparkSpawned: false,
};

// Act 4 Finale Monument state
const finaleState = {
  holdProgress: 0,
  completed: false,
  spiritsAlpha: 0,
  postTimer: 0,
  overlayShown: false,
};

// Act 4 Multi-Generational Living Companions (Người Ông tuổi già & Người Cha cựu chiến binh)
const companionsState = {
  joined: false,
  captionShown: false,
  alpha: 0,
  elderX: 1930,
  elderY: baseGroundY,
  elderFacing: 1,
  elderSpeedRatio: 0,
  elderWalkCycle: 0,
  fatherX: 1965,
  fatherY: baseGroundY,
  fatherFacing: 1,
  fatherSpeedRatio: 0,
  fatherWalkCycle: 0,
  sharedPose: null,
};

function scheduleVictoryBannerModal(banner) {
  if (!banner) return;
  if (pendingMilestoneTimer) clearTimeout(pendingMilestoneTimer);
  pendingMilestoneTimer = setTimeout(() => {
    pendingMilestoneTimer = null;
    openStoryModal({
      tag: banner.badge,
      title: banner.title,
      content: banner.quote,
      note: banner.note,
    });
  }, 900);
}

const combatSystem = new InWorldCombatSystem({
  sound,
  vfx,
  onVictoryBanner: scheduleVictoryBannerModal,
});

function resetCompanionsState() {
  companionsState.joined = false;
  companionsState.captionShown = false;
  companionsState.alpha = 0;
  companionsState.elderX = 1930;
  companionsState.elderY = baseGroundY;
  companionsState.elderFacing = 1;
  companionsState.elderSpeedRatio = 0;
  companionsState.elderWalkCycle = 0;
  companionsState.fatherX = 1965;
  companionsState.fatherY = baseGroundY;
  companionsState.fatherFacing = 1;
  companionsState.fatherSpeedRatio = 0;
  companionsState.fatherWalkCycle = 0;
  companionsState.sharedPose = null;
}

// ==================== RESPONSIVE DEVICE, ORIENTATION & CAMERA SCALE ====================
function detectTouchCapability() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  );
}

function syncTouchControlsVisibility() {
  const showCluster =
    isMobileMode &&
    gameStarted &&
    !finaleState.overlayShown &&
    !isPortraitPaused;

  touchControls.classList.toggle('hidden', !showCluster);

  if (showCluster) {
    const shouldDim = modalState.open || transitionState.active;
    touchControls.classList.toggle('soft-dim', shouldDim);
  }
}

function resetJoystickVisualAndState() {
  joystickState.active = false;
  joystickState.pointerId = null;
  joystickState.normX = 0;
  joystickState.normY = 0;
  joystickState.upLatched = false;
  joystickState.downLatched = false;
  joystickKnob.style.transform = 'translate3d(0px, 0px, 0)';
  virtualJoystick.classList.remove(
    'active',
    'tilt-up',
    'tilt-down',
    'tilt-left',
    'tilt-right'
  );
}

function updateViewportAndDeviceMode() {
  const rawW = Math.max(1, window.innerWidth);
  const rawH = Math.max(1, window.innerHeight);

  isTouchDevice = detectTouchCapability();
  isMobileMode = isTouchDevice || rawW <= 920 || rawH <= 500;
  document.body.classList.toggle('touch-mode', isMobileMode);

  // Portrait Lock check: portrait aspect on touch devices or <= 1024px viewports
  const isPortrait = rawW < rawH;
  const shouldLockPortrait = isPortrait && (isTouchDevice || rawW <= 1024);

  if (shouldLockPortrait && !isPortraitPaused) {
    keysDown.clear();
    incenseHoldPointers.clear();
    btnHoldIncense.classList.remove('holding');
    btnTouchAttack.classList.remove('pressed');
    resetJoystickVisualAndState();
  }
  isPortraitPaused = shouldLockPortrait;
  orientationOverlay.classList.toggle('force-visible', isPortraitPaused);

  // Adaptive UI labels for Touch vs PC
  if (isMobileMode) {
    introControlsLine.innerHTML =
      'Xoay cần gạt <span>Trái / Phải</span> • <span>▲ / ▼</span> Nhảy / Tụt tầng • Nút đỏ <span>TẤN CÔNG [F]</span> hành động • <span>Chạm</span> vật phẩm để khám phá';
    incensePrompt.textContent = 'Chạm & Giữ để thắp nén tâm hương';
    incenseBtnLabel.innerHTML = 'Chạm &amp; Giữ dâng hương';
  } else {
    introControlsLine.innerHTML =
      'Di chuyển <span>A / D</span> • Nhảy <span>W</span> • Xuống tầng <span>S</span> • Tương tác <span>E</span> • Tấn công / Hành động <span>F / J</span>';
    incensePrompt.textContent = 'Giữ [F] để thắp nén tâm hương';
    incenseBtnLabel.innerHTML = 'Giữ <kbd>F</kbd> dâng hương';
  }

  // Responsive Camera Scale: auto-fit vertical world headroom on low-height mobile landscape (<= 450px..560px)
  worldScale = rawH < 560 ? Math.max(0.62, Math.min(1.0, rawH / 560)) : 1.0;
  viewportWidth = Math.ceil(rawW / worldScale);
  viewportHeight = Math.ceil(rawH / worldScale);
  baseGroundY = Math.round(viewportHeight * 0.8);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rawW * dpr);
  canvas.height = Math.floor(rawH * dpr);
  ctx.setTransform(dpr * worldScale, 0, 0, dpr * worldScale, 0, 0);

  player.y = baseGroundY + player.dy;
  syncTouchControlsVisibility();
}

window.addEventListener('resize', updateViewportAndDeviceMode);
window.addEventListener('orientationchange', () => {
  updateViewportAndDeviceMode();
  setTimeout(updateViewportAndDeviceMode, 60);
  setTimeout(updateViewportAndDeviceMode, 200);
  setTimeout(updateViewportAndDeviceMode, 400);
});
if (window.screen && window.screen.orientation) {
  window.screen.orientation.addEventListener('change', () => {
    updateViewportAndDeviceMode();
    setTimeout(updateViewportAndDeviceMode, 60);
    setTimeout(updateViewportAndDeviceMode, 200);
  });
}
// Prevent accidental iOS Safari multi-finger pinch zoom
document.addEventListener(
  'gesturestart',
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

updateViewportAndDeviceMode();

// ==================== TERRAIN & COORDINATE HELPERS ====================
function getGroundYForAct(actId, localX) {
  return baseGroundY + sampleGroundOffset(actId, localX);
}

function getGroundY(localX) {
  return getGroundYForAct(currentAct, localX);
}

function getInteractableWorldY(item) {
  const actCfg = ACTS.find((a) => a.id === item.act) || ACTS[0];
  if (item.platformId) {
    const plat = actCfg.platforms.find((p) => p.id === item.platformId);
    if (plat) return baseGroundY + plat.dy;
  }
  return getGroundYForAct(item.act, item.x);
}

/** Quy đổi tọa độ chạm trên màn hình (clientX, clientY) sang tọa độ thế giới (worldX, worldY) */
function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const lx = (clientX - rect.left) / worldScale;
  const ly = (clientY - rect.top) / worldScale;
  const cx = viewportWidth * 0.5;
  const cy = baseGroundY - 65;
  const unzoomX = (lx - cx) / cameraZoom + cx;
  const unzoomY = (ly - cy) / cameraZoom + cy;
  return {
    worldX: unzoomX + cameraX,
    worldY: unzoomY + cameraY,
  };
}

function snapPlayerToSurface(localX, platformId = null) {
  player.x = localX;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;

  if (platformId) {
    const actCfg = ACTS.find((a) => a.id === currentAct) || ACTS[0];
    const plat = actCfg.platforms.find((p) => p.id === platformId);
    if (plat) {
      player.dy = plat.dy;
      player.currentPlatformId = plat.id;
      player.y = baseGroundY + player.dy;
      return;
    }
  }
  player.currentPlatformId = null;
  player.dy = sampleGroundOffset(currentAct, localX);
  player.y = baseGroundY + player.dy;
}

function triggerPlayerJump() {
  const isCeremonyBowing = finaleState.completed && finaleState.postTimer < 2.5;
  if (!gameStarted || modalState.open || transitionState.active || isCeremonyBowing) {
    return;
  }
  player.jumpBufferTimer = 0.14;
}

function triggerPlayerDropThrough() {
  const isCeremonyBowing = finaleState.completed && finaleState.postTimer < 2.5;
  if (!gameStarted || modalState.open || transitionState.active || isCeremonyBowing) {
    return;
  }
  if (player.onGround && player.currentPlatformId !== null) {
    player.ignoredPlatformId = player.currentPlatformId;
    player.dropThroughTimer = 0.28;
    player.currentPlatformId = null;
    player.onGround = false;
    player.vy = 115;
  } else if (player.onGround) {
    player.landingSquash = Math.max(player.landingSquash, 0.42);
  }
}

function triggerDirectCombatAction() {
  const isCeremonyBowing = finaleState.completed && finaleState.postTimer < 2.5;
  if (
    !gameStarted ||
    isPortraitPaused ||
    modalState.open ||
    transitionState.active ||
    isCeremonyBowing
  ) {
    return;
  }
  // Tại Đài tưởng niệm cuối Màn 4 (localX = 2560), phím [F] được giữ 2.5s để dâng hương
  if (
    currentAct === 4 &&
    Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius
  ) {
    return;
  }

  autoSeekItem = null;
  combatSystem.triggerPlayerAction({
    act: currentAct,
    player,
    baseGroundY,
    getGroundY,
    completedQtes,
    interactablesState,
  });
}

// ==================== TOP HUD & CAPTION HELPERS ====================
function triggerActTopHudIntro(actId, initialX = 180) {
  const act = ACTS.find((a) => a.id === actId) || ACTS[0];
  contextPeriod.textContent = act.period;
  contextLocation.textContent = getZoneName(actId, initialX);
  contextTitle.textContent = `MÀN ${act.id} — ${act.title}`;
  contextSubtitle.textContent = act.subtitle;

  topContextHud.classList.remove('hidden', 'docked');

  if (topHudDockTimer) clearTimeout(topHudDockTimer);
  topHudDockTimer = setTimeout(() => {
    topContextHud.classList.add('docked');
  }, 3500);
}

function updateDrawerActiveState(actId) {
  drawerItems.forEach((item) => {
    item.classList.toggle('active', Number(item.dataset.act) === actId);
  });
}

function closeChapterDrawer() {
  chapterDrawer.classList.add('hidden');
  btnChapterToggle.setAttribute('aria-expanded', 'false');
}

function showTemporaryCaption(text, durationMs = 2800) {
  cinematicCaption.textContent = text;
  cinematicCaption.classList.remove('hidden');
  if (captionHideTimer) clearTimeout(captionHideTimer);
  if (durationMs > 0) {
    captionHideTimer = setTimeout(() => {
      cinematicCaption.classList.add('hidden');
    }, durationMs);
  }
}

function hideCinematicCaption() {
  if (captionHideTimer) {
    clearTimeout(captionHideTimer);
    captionHideTimer = null;
  }
  cinematicCaption.classList.add('hidden');
}

// ==================== HUD: OBJECTIVE CHECKLIST, MINI-MAP & VOV BROADCAST ====================
function updateObjectiveChecklist() {
  if (!objectiveCounter || !objectiveList) return;
  const items = interactablesState.filter((it) => it.act === currentAct);
  const visitedCount = items.filter((it) => it.visited).length;

  if (currentAct === 4 && finaleState.completed) {
    objectiveCounter.textContent = `${visitedCount}/${items.length} (Đã hoàn thành)`;
  } else {
    objectiveCounter.textContent = `${visitedCount}/${items.length}`;
  }

  objectiveList.innerHTML = '';

  for (const it of items) {
    const li = document.createElement('li');
    li.className = `objective-item ${it.visited ? 'completed' : 'pending'}`;
    const statusText = it.visited ? '[✓]' : '[ ]';
    const nameText = it.checklistLabel || it.title;
    const hintHtml =
      !it.visited && it.locationHint
        ? `<span class="objective-hint">${it.locationHint}</span>`
        : '';
    li.innerHTML = `
      <span class="objective-status">${statusText}</span>
      <span class="objective-name">${nameText}</span>
      ${hintHtml}
    `;
    objectiveList.appendChild(li);
  }

  if (currentAct === 4) {
    const liFinale = document.createElement('li');
    liFinale.className = `objective-item ${finaleState.completed ? 'completed' : 'pending'}`;
    const statusText = finaleState.completed ? '[✓]' : '[ ]';
    liFinale.innerHTML = `
      <span class="objective-status">${statusText}</span>
      <span class="objective-name">Dâng nén tâm hương tri ân</span>
      ${
        finaleState.completed
          ? '<span class="objective-hint" style="color: #4ade80;">✓ Hoàn thành</span>'
          : '<span class="objective-hint">Đỉnh đồi (x=2560)</span>'
      }
    `;
    objectiveList.appendChild(liFinale);
  }
}

function renderMinimap() {
  if (!minimapCtx) return;
  const w = 260;
  const h = 32;
  const actCfg = ACTS.find((a) => a.id === currentAct) || ACTS[0];
  const scale = w / WORLD_CONFIG.actWidth;

  minimapCtx.clearRect(0, 0, w, h);

  // Background track
  minimapCtx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  minimapCtx.fillRect(0, 0, w, h);

  // Ground baseline
  const groundY = 22;
  minimapCtx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  minimapCtx.lineWidth = 1.5;
  minimapCtx.beginPath();
  minimapCtx.moveTo(0, groundY);
  minimapCtx.lineTo(w, groundY);
  minimapCtx.stroke();

  // Subrooms (bunker / cave / cellar)
  if (actCfg.subrooms) {
    minimapCtx.fillStyle = 'rgba(251, 146, 60, 0.45)';
    for (const sub of actCfg.subrooms) {
      const sx1 = sub.x1 * scale;
      const sx2 = sub.x2 * scale;
      minimapCtx.fillRect(sx1, groundY, Math.max(3, sx2 - sx1), 7);
      // Small inverted triangle
      minimapCtx.fillStyle = '#fb923c';
      const mid = (sx1 + sx2) * 0.5;
      minimapCtx.beginPath();
      minimapCtx.moveTo(mid - 3, groundY - 2);
      minimapCtx.lineTo(mid + 3, groundY - 2);
      minimapCtx.lineTo(mid, groundY + 3);
      minimapCtx.fill();
    }
  }

  // Combat Star / Finale objective zone
  const combatX = (actCfg.combatStarX || 2500) * scale;
  minimapCtx.fillStyle = '#ef4444';
  minimapCtx.font = 'bold 9px sans-serif';
  minimapCtx.textAlign = 'center';
  minimapCtx.fillText('★', combatX, groundY - 5);

  // Interactables (Historical Documents)
  for (const it of interactablesState) {
    if (it.act !== currentAct) continue;
    const ix = it.x * scale;
    if (it.visited) {
      minimapCtx.fillStyle = '#4ade80';
      minimapCtx.font = 'bold 8px sans-serif';
      minimapCtx.textAlign = 'center';
      minimapCtx.fillText('✓', ix, groundY - 4);
    } else {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008 + it.x);
      minimapCtx.fillStyle = `rgba(251, 191, 36, ${0.4 + 0.6 * pulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(ix, groundY - 6, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }
  }

  // Camera Viewport Box
  const camStart = Math.max(0, cameraX * scale);
  const camWidth = Math.min(w - camStart, viewportWidth * scale);
  minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  minimapCtx.lineWidth = 1;
  minimapCtx.fillRect(camStart, 2, camWidth, h - 4);
  minimapCtx.strokeRect(camStart, 2, camWidth, h - 4);

  // Player Marker
  const px = Math.max(4, Math.min(w - 4, player.x * scale));
  minimapCtx.fillStyle = '#38bdf8';
  minimapCtx.beginPath();
  minimapCtx.arc(px, groundY - 6, 3.5, 0, Math.PI * 2);
  minimapCtx.fill();
  minimapCtx.strokeStyle = '#ffffff';
  minimapCtx.lineWidth = 1;
  minimapCtx.stroke();

  // Label
  if (minimapActLabel) {
    minimapActLabel.textContent = `MÀN ${currentAct}`;
  }
}

// VOV Broadcast controller
if (vovToggleBtn) {
  vovToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isPaused = sound.toggleBroadcastPause();
    vovToggleBtn.textContent = isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng';
  });
}

function updateVovBroadcastHud() {
  const bState = sound.getBroadcastState();
  if (bState.active && currentAct === 2) {
    if (vovHud && vovHud.classList.contains('hidden')) {
      vovHud.classList.remove('hidden');
    }
    if (vovToggleBtn) {
      vovToggleBtn.textContent = bState.paused ? '▶ Tiếp tục' : '⏸ Tạm dừng';
    }
    sound.fillBroadcastBars(vovBarHeights, performance.now() / 1000);
    for (let i = 0; i < vovBars.length; i++) {
      const h = Math.round(vovBarHeights[i] * 22);
      vovBars[i].style.height = `${Math.max(3, h)}px`;
    }
  } else {
    if (vovHud && !vovHud.classList.contains('hidden')) {
      vovHud.classList.add('hidden');
    }
  }
}

// ==================== STORY MODAL (TYPEWRITER & FOLLOWER RECRUITMENT) ====================
function openInteractableModal(item) {
  const firstVisit = !item.visited;
  item.visited = true;
  autoSeekItem = null;

  if (firstVisit) {
    combatSystem.onInteractableFirstVisited(
      item,
      interactablesState,
      player,
      getGroundY
    );
  }

  // Historical Audio Broadcast "Lời kêu gọi toàn quốc kháng chiến" for Act 2 Item 2!
  if (item.id === 'act2_item2') {
    sound.playLoiKeuGoiBroadcast();
    combatSystem.triggerHanoiBroadcastRally(getGroundY);
  }

  openStoryModal({
    tag: `${ACTS[item.act - 1].period} • ${item.tag}`,
    title: item.title,
    content: item.content,
  });

  updateObjectiveChecklist();
}

function openStoryModal({ tag, title, content, note = null }) {
  if (modalState.timerId) clearInterval(modalState.timerId);

  modalState.open = true;
  modalState.openedAt = performance.now();
  modalState.fullText = content;
  modalState.charIndex = 0;
  modalState.typingDone = false;

  modalTag.textContent = tag;
  modalTitle.textContent = title;
  modalText.textContent = '';
  modalText.classList.add('typing');

  if (note) {
    modalNote.textContent = note;
    modalNote.classList.remove('hidden');
  } else {
    modalNote.textContent = '';
    modalNote.classList.add('hidden');
  }

  modalHint.innerHTML = isMobileMode
    ? 'Chạm vào hộp thoại để hiện nhanh toàn bộ nội dung'
    : 'Ấn <kbd>SPACE</kbd> hiện toàn bộ • Ấn <kbd>E</kbd> để đóng và đi tiếp';

  canvas.classList.add('canvas-blurred');
  storyModal.classList.remove('hidden');
  syncTouchControlsVisibility();
  sound.playModalOpen();

  modalState.timerId = setInterval(() => {
    if (isPortraitPaused) return;
    if (modalState.charIndex < modalState.fullText.length) {
      modalState.charIndex = Math.min(modalState.fullText.length, modalState.charIndex + 2);
      modalText.textContent = modalState.fullText.slice(0, modalState.charIndex);
      sound.playTypewriter();
    } else {
      finishTypewriterImmediately();
    }
  }, 20);
}

function finishTypewriterImmediately() {
  if (modalState.timerId) {
    clearInterval(modalState.timerId);
    modalState.timerId = null;
  }
  modalState.charIndex = modalState.fullText.length;
  modalState.typingDone = true;
  modalText.textContent = modalState.fullText;
  modalText.classList.remove('typing');
  modalHint.innerHTML = isMobileMode
    ? 'Chạm lần nữa hoặc ấn "Tiếp tục hành trình" để đi tiếp'
    : 'Ấn <kbd>E</kbd> hoặc <kbd>SPACE</kbd> để đóng và đi tiếp';
}

function closeStoryModal() {
  if (!modalState.open) return;
  if (modalState.timerId) {
    clearInterval(modalState.timerId);
    modalState.timerId = null;
  }
  modalState.open = false;
  storyModal.classList.add('hidden');
  canvas.classList.remove('canvas-blurred');
  syncTouchControlsVisibility();
}

// ==================== CINEMATIC TRANSITION & AUTO-WALK ENGINE ====================
function clearTransientOverlays() {
  if (pendingMilestoneTimer) {
    clearTimeout(pendingMilestoneTimer);
    pendingMilestoneTimer = null;
  }

  autoSeekItem = null;
  vfx.setSlowMotion(false);
  targetCameraZoom = 1.0;

  incenseHoldPointers.clear();
  btnHoldIncense.classList.remove('holding');
  btnTouchAttack.classList.remove('pressed');

  closeStoryModal();
  closeChapterDrawer();
  hideCinematicCaption();
  incenseHud.classList.add('hidden');
  finaleOverlay.classList.add('hidden');
  sound.updateIncenseCharge(0, false);
  syncTouchControlsVisibility();
}

/** Khởi tạo Màn mới và cho nhân vật Auto-Walk từ rìa trái (-40 -> 180) */
function beginActFromLeft(actId) {
  currentAct = actId;
  autoSeekItem = null;
  resetCompanionsState();
  updateDrawerActiveState(actId);
  vfx.clearSceneParticles();
  renderer.resetScarfTrail();
  sound.setAct(actId);

  player.costumeOverride = null;
  player.wearingHat = true;
  player.pose = null;
  player.facing = 1;
  snapPlayerToSurface(WORLD_CONFIG.enterStartX);

  combatSystem.enterAct(
    actId,
    completedQtes,
    interactablesState,
    WORLD_CONFIG.enterTargetX,
    getGroundY
  );

  cameraX = 0;
  cameraY = 0;
  if (actId !== 2) {
    sound.stopBroadcast();
  }
  updateObjectiveChecklist();

  transitionState.active = true;
  transitionState.subPhase = 'ENTER_LEFT';
  transitionState.targetAct = actId;

  syncTouchControlsVisibility();
  triggerActTopHudIntro(actId, WORLD_CONFIG.enterTargetX);
}

/** Khởi tạo cuối Màn trước khi đi lùi và Auto-Walk từ rìa phải (3040 -> 2750) */
function beginActFromRight(actId) {
  currentAct = actId;
  autoSeekItem = null;
  resetCompanionsState();
  updateDrawerActiveState(actId);
  vfx.clearSceneParticles();
  renderer.resetScarfTrail();
  sound.setAct(actId);

  player.costumeOverride = null;
  player.wearingHat = true;
  player.pose = null;
  player.facing = -1;
  snapPlayerToSurface(WORLD_CONFIG.backReturnStartX);

  combatSystem.enterAct(
    actId,
    completedQtes,
    interactablesState,
    WORLD_CONFIG.backReturnTargetX,
    getGroundY
  );

  cameraX = Math.max(0, WORLD_CONFIG.actWidth - viewportWidth);
  cameraY = 0;
  if (actId !== 2) {
    sound.stopBroadcast();
  }
  updateObjectiveChecklist();

  transitionState.active = true;
  transitionState.subPhase = 'ENTER_FROM_RIGHT';
  transitionState.targetAct = actId;

  syncTouchControlsVisibility();
  triggerActTopHudIntro(actId, WORLD_CONFIG.backReturnTargetX);
}

/** Bắt đầu chuỗi chuyển màn tiến về phía phải (khi người chơi đi qua localX >= 2820) */
function startForwardActTransition() {
  const actCfg = ACTS.find((a) => a.id === currentAct);
  if (!actCfg || currentAct >= 4) return;

  autoSeekItem = null;
  player.currentPlatformId = null;
  player.onGround = true;
  player.vy = 0;
  player.dy = sampleGroundOffset(currentAct, player.x);
  player.y = baseGroundY + player.dy;
  player.pose = null;
  player.facing = 1;

  transitionState.active = true;
  transitionState.targetAct = currentAct + 1;
  transitionState.ceremonyTimer = 0;
  transitionState.ceremonyProgress = 0;
  transitionState.hatSparkSpawned = false;

  if (actCfg.handoffAtEnd) {
    transitionState.subPhase = 'APPROACH_SUCCESSOR';
  } else {
    transitionState.subPhase = 'WALK_OFF_RIGHT';
  }
  syncTouchControlsVisibility();
}

/** Bắt đầu chuỗi chuyển màn lùi về phía trái (khi lùi qua localX < 80 ở Màn 2, 3, 4) */
function startBackwardActTransition() {
  if (currentAct <= 1) return;

  autoSeekItem = null;
  player.currentPlatformId = null;
  player.onGround = true;
  player.vy = 0;
  player.dy = sampleGroundOffset(currentAct, player.x);
  player.y = baseGroundY + player.dy;
  player.pose = null;
  player.facing = -1;

  transitionState.active = true;
  transitionState.subPhase = 'WALK_OFF_LEFT';
  transitionState.targetAct = currentAct - 1;
  syncTouchControlsVisibility();
}

/** Chọn nhảy nhanh tới Màn từ Pop-up Menu [ ☰ Chương / Màn ] */
function jumpToChapterFromMenu(actNumber) {
  sound.init();
  clearTransientOverlays();

  QTE_ZONES.forEach((q) => {
    if (q.act < actNumber) {
      completedQtes.add(q.id);
      if (q.id === 'qte_1a') vfx.setGranaryLiberated(true);
    } else {
      completedQtes.delete(q.id);
      if (q.id === 'qte_1a') vfx.setGranaryLiberated(false);
    }
  });

  combatSystem.resetForChapterJump(actNumber);

  if (actNumber <= 4) {
    finaleState.holdProgress = 0;
    finaleState.completed = false;
    finaleState.spiritsAlpha = 0;
    finaleState.postTimer = 0;
    finaleState.overlayShown = false;
  }

  transitionState.active = true;
  transitionState.subPhase = 'TELEPORT_FADEOUT';
  transitionState.targetAct = actNumber;
  syncTouchControlsVisibility();
}

function advanceAutoWalk(dt, dir, speed = AUTO_WALK_SPEED) {
  player.facing = dir;
  player.vx = dir * speed;
  player.x += player.vx * dt;
  player.dy = sampleGroundOffset(
    currentAct,
    Math.max(0, Math.min(WORLD_CONFIG.actWidth, player.x))
  );
  player.y = baseGroundY + player.dy;
  player.onGround = true;

  player.walkCycle += dt * 7.4;
  if (player.walkCycle >= player.nextStepCycle) {
    player.nextStepCycle += Math.PI;
    sound.playFootstep(player.costumeOverride || currentAct);
  }
}

function updateCinematicTransition(rawDt) {
  switch (transitionState.subPhase) {
    case 'ENTER_LEFT': {
      transitionState.fadeAlpha = Math.max(0, transitionState.fadeAlpha - rawDt * 1.8);
      if (player.x < WORLD_CONFIG.enterTargetX) {
        advanceAutoWalk(rawDt, 1, AUTO_WALK_SPEED);
      } else {
        player.x = WORLD_CONFIG.enterTargetX;
        player.vx = 0;
        player.walkCycle = 0;
        if (transitionState.fadeAlpha <= 0.01) {
          transitionState.fadeAlpha = 0;
          transitionState.active = false;
          transitionState.subPhase = null;
          syncTouchControlsVisibility();
        }
      }
      break;
    }

    case 'WALK_OFF_RIGHT': {
      advanceAutoWalk(rawDt, 1, AUTO_WALK_SPEED);
      if (player.x > 2940) {
        transitionState.fadeAlpha = Math.min(1, transitionState.fadeAlpha + rawDt * 1.9);
      }
      if (player.x > WORLD_CONFIG.exitOffscreenX && transitionState.fadeAlpha >= 1) {
        beginActFromLeft(transitionState.targetAct);
      }
      break;
    }

    case 'APPROACH_SUCCESSOR': {
      const stopBeforeSuccessorX = 2834;
      if (player.x < stopBeforeSuccessorX) {
        advanceAutoWalk(rawDt, 1, 150);
      } else {
        player.x = stopBeforeSuccessorX;
        player.vx = 0;
        player.walkCycle = 0;
        transitionState.subPhase = 'HANDOFF_CEREMONY';
        transitionState.ceremonyTimer = 0;
        transitionState.ceremonyProgress = 0;

        const actCfg = ACTS.find((a) => a.id === currentAct);
        if (actCfg && actCfg.handoffAtEnd) {
          showTemporaryCaption(actCfg.handoffAtEnd.caption, 0);
        }
        sound.playHandoffChime();
      }
      break;
    }

    case 'HANDOFF_CEREMONY': {
      transitionState.ceremonyTimer += rawDt;
      transitionState.ceremonyProgress = Math.min(
        1,
        transitionState.ceremonyTimer / transitionState.ceremonyDuration
      );

      if (currentAct === 2) {
        player.pose = 'handoff_give';
        player.poseTimer = transitionState.ceremonyProgress;
        if (transitionState.ceremonyProgress >= 0.55 && !transitionState.hatSparkSpawned) {
          transitionState.hatSparkSpawned = true;
          player.wearingHat = false;
          vfx.spawnCelebrationBurst(2842, player.y - 72, 22);
        }
      } else if (currentAct === 3) {
        vfx.spawnDawnTransformation(2840, player.y);
      }

      if (transitionState.ceremonyTimer >= transitionState.ceremonyDuration) {
        hideCinematicCaption();
        player.x = WORLD_CONFIG.successorWaitX;
        player.costumeOverride = currentAct + 1;
        player.wearingHat = true;
        player.pose = null;
        renderer.resetScarfTrail();
        transitionState.subPhase = 'SUCCESSOR_WALK_OFF';
      }
      break;
    }

    case 'SUCCESSOR_WALK_OFF': {
      advanceAutoWalk(rawDt, 1, AUTO_WALK_SPEED);
      if (currentAct === 3) {
        vfx.spawnDawnTransformation(2840, getGroundY(2840));
      }
      if (player.x > 2945) {
        transitionState.fadeAlpha = Math.min(1, transitionState.fadeAlpha + rawDt * 1.9);
      }
      if (player.x > WORLD_CONFIG.exitOffscreenX && transitionState.fadeAlpha >= 1) {
        beginActFromLeft(transitionState.targetAct);
      }
      break;
    }

    case 'WALK_OFF_LEFT': {
      advanceAutoWalk(rawDt, -1, AUTO_WALK_SPEED);
      if (player.x < 35) {
        transitionState.fadeAlpha = Math.min(1, transitionState.fadeAlpha + rawDt * 2.0);
      }
      if (player.x < WORLD_CONFIG.backOffscreenX && transitionState.fadeAlpha >= 1) {
        beginActFromRight(transitionState.targetAct);
      }
      break;
    }

    case 'ENTER_FROM_RIGHT': {
      transitionState.fadeAlpha = Math.max(0, transitionState.fadeAlpha - rawDt * 1.8);
      if (player.x > WORLD_CONFIG.backReturnTargetX) {
        advanceAutoWalk(rawDt, -1, AUTO_WALK_SPEED);
      } else {
        player.x = WORLD_CONFIG.backReturnTargetX;
        player.vx = 0;
        player.walkCycle = 0;
        if (transitionState.fadeAlpha <= 0.01) {
          transitionState.fadeAlpha = 0;
          transitionState.active = false;
          transitionState.subPhase = null;
          syncTouchControlsVisibility();
        }
      }
      break;
    }

    case 'TELEPORT_FADEOUT': {
      transitionState.fadeAlpha = Math.min(1, transitionState.fadeAlpha + rawDt * 3.2);
      if (transitionState.fadeAlpha >= 1) {
        beginActFromLeft(transitionState.targetAct);
      }
      break;
    }
  }
}

function replayFromBeginning() {
  interactablesState.forEach((item) => {
    item.visited = false;
  });
  completedQtes.clear();
  vfx.resetAll();
  combatSystem.resetAll();
  jumpToChapterFromMenu(1);
}

// ==================== MULTI-TOUCH VIRTUAL JOYSTICK & ACTION BUTTONS ====================
function updateJoystickFromPointer(clientX, clientY) {
  const rect = virtualJoystick.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const maxRadius = Math.max(28, rect.width * 0.37);

  const rawDx = clientX - centerX;
  const rawDy = clientY - centerY;
  const dist = Math.hypot(rawDx, rawDy);
  const clampedDist = Math.min(dist, maxRadius);
  const angle = Math.atan2(rawDy, rawDx);

  const dx = dist > 0.001 ? Math.cos(angle) * clampedDist : 0;
  const dy = dist > 0.001 ? Math.sin(angle) * clampedDist : 0;

  joystickKnob.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;

  const nx = dx / maxRadius;
  const ny = dy / maxRadius;
  joystickState.normX = nx;
  joystickState.normY = ny;

  virtualJoystick.classList.toggle('tilt-left', nx < -0.24);
  virtualJoystick.classList.toggle('tilt-right', nx > 0.24);
  virtualJoystick.classList.toggle('tilt-up', ny < -0.48);
  virtualJoystick.classList.toggle('tilt-down', ny > 0.48);

  if (Math.abs(nx) > 0.2 || Math.abs(ny) > 0.2) {
    autoSeekItem = null;
  }

  // Flick Up -> Jump
  if (ny < -0.52) {
    if (!joystickState.upLatched) {
      joystickState.upLatched = true;
      const now = performance.now();
      if (now - joystickState.lastJumpAt > 200) {
        joystickState.lastJumpAt = now;
        triggerPlayerJump();
      }
    }
  } else if (ny > -0.26) {
    joystickState.upLatched = false;
  }

  // Flick Down -> Drop-through Platform
  if (ny > 0.54) {
    if (!joystickState.downLatched) {
      joystickState.downLatched = true;
      triggerPlayerDropThrough();
    }
  } else if (ny < 0.26) {
    joystickState.downLatched = false;
  }
}

virtualJoystick.addEventListener('pointerdown', (e) => {
  if (joystickState.active || isPortraitPaused) return;
  e.preventDefault();
  e.stopPropagation();
  sound.init();

  joystickState.active = true;
  joystickState.pointerId = e.pointerId;
  virtualJoystick.classList.add('active');
  try {
    virtualJoystick.setPointerCapture(e.pointerId);
  } catch {
    // Ignore if synthetic event does not support pointer capture
  }
  updateJoystickFromPointer(e.clientX, e.clientY);
});

virtualJoystick.addEventListener('pointermove', (e) => {
  if (!joystickState.active || e.pointerId !== joystickState.pointerId) return;
  e.preventDefault();
  updateJoystickFromPointer(e.clientX, e.clientY);
});

function handleJoystickPointerEnd(e) {
  if (!joystickState.active || e.pointerId !== joystickState.pointerId) return;
  resetJoystickVisualAndState();
}

virtualJoystick.addEventListener('pointerup', handleJoystickPointerEnd);
virtualJoystick.addEventListener('pointercancel', handleJoystickPointerEnd);

// Finale Monument Touch & Hold (2.5s) helper
function startHoldingIncensePointer(pointerId) {
  incenseHoldPointers.add(pointerId);
  btnHoldIncense.classList.add('holding');
}

function stopHoldingIncensePointer(pointerId) {
  incenseHoldPointers.delete(pointerId);
  if (incenseHoldPointers.size === 0) {
    btnHoldIncense.classList.remove('holding');
  }
}

// Right-hand Prominent Red/Gold Action Button: TẤN CÔNG [F]
btnTouchAttack.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sound.init();
  btnTouchAttack.classList.add('pressed');
  autoSeekItem = null;

  if (
    currentAct === 4 &&
    !finaleState.completed &&
    Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius + 45
  ) {
    startHoldingIncensePointer(e.pointerId);
    return;
  }
  triggerDirectCombatAction();
});

btnTouchAttack.addEventListener('pointerup', (e) => {
  btnTouchAttack.classList.remove('pressed');
  stopHoldingIncensePointer(e.pointerId);
});
btnTouchAttack.addEventListener('pointercancel', (e) => {
  btnTouchAttack.classList.remove('pressed');
  stopHoldingIncensePointer(e.pointerId);
});
btnTouchAttack.addEventListener('pointerleave', (e) => {
  btnTouchAttack.classList.remove('pressed');
  stopHoldingIncensePointer(e.pointerId);
});

// Right-hand Quick Jump (▲) & Quick Drop-through (▼) buttons
btnTouchJump.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sound.init();
  btnTouchJump.classList.add('pressed');
  autoSeekItem = null;
  triggerPlayerJump();
});

btnTouchJump.addEventListener('pointerup', () => btnTouchJump.classList.remove('pressed'));
btnTouchJump.addEventListener('pointercancel', () => btnTouchJump.classList.remove('pressed'));
btnTouchJump.addEventListener('pointerleave', () => btnTouchJump.classList.remove('pressed'));

btnTouchDrop.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sound.init();
  btnTouchDrop.classList.add('pressed');
  autoSeekItem = null;
  triggerPlayerDropThrough();
});

btnTouchDrop.addEventListener('pointerup', () => btnTouchDrop.classList.remove('pressed'));
btnTouchDrop.addEventListener('pointercancel', () => btnTouchDrop.classList.remove('pressed'));
btnTouchDrop.addEventListener('pointerleave', () => btnTouchDrop.classList.remove('pressed'));

// ==================== UI & DIRECT CANVAS TOUCH LISTENERS ====================
async function startGameExperience(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (gameStarted) return;
  gameStarted = true;
  updateViewportAndDeviceMode();
  try {
    await sound.init();
  } catch (err) {
    console.warn('Audio init warning on start:', err);
  }

  introOverlay.classList.add('fade-out');
  setTimeout(() => {
    introOverlay.classList.add('hidden');
  }, 600);

  transitionState.fadeAlpha = 1;
  beginActFromLeft(1);
  syncTouchControlsVisibility();
}

btnStartGame.addEventListener('pointerup', startGameExperience);
btnStartGame.addEventListener('touchend', startGameExperience);
btnStartGame.addEventListener('click', startGameExperience);

btnChapterToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const willOpen = chapterDrawer.classList.contains('hidden');
  chapterDrawer.classList.toggle('hidden', !willOpen);
  btnChapterToggle.setAttribute('aria-expanded', String(willOpen));
});

drawerItems.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const actId = Number(btn.dataset.act);
    closeChapterDrawer();
    if (!gameStarted) {
      gameStarted = true;
      sound.init().then(() => {
        introOverlay.classList.add('fade-out');
        setTimeout(() => introOverlay.classList.add('hidden'), 600);
        transitionState.fadeAlpha = 1;
        combatSystem.resetForChapterJump(actId);
        beginActFromLeft(actId);
      });
    } else {
      jumpToChapterFromMenu(actId);
    }
  });
});

document.addEventListener('pointerdown', (e) => {
  if (!chapterDrawer.classList.contains('hidden')) {
    if (!chapterDrawer.contains(e.target) && e.target !== btnChapterToggle) {
      closeChapterDrawer();
    }
  }
});

btnAudio.addEventListener('click', async () => {
  await sound.init();
  const isMuted = sound.toggleMute();
  audioLabel.textContent = isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật';
});

// Story Modal Touch & Click: Tap anywhere on card to Skip Typewriter -> Tap again (or button) to Close
let modalPointerDownPos = null;

btnCloseModal.addEventListener('click', (e) => {
  e.stopPropagation();
  closeStoryModal();
});

storyModal.addEventListener('pointerdown', (e) => {
  if (btnCloseModal.contains(e.target)) return;
  modalPointerDownPos = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
});

storyModal.addEventListener('pointerup', (e) => {
  if (!modalState.open || btnCloseModal.contains(e.target)) return;
  if (!modalPointerDownPos || modalPointerDownPos.pointerId !== e.pointerId) return;

  const movedDist = Math.hypot(
    e.clientX - modalPointerDownPos.x,
    e.clientY - modalPointerDownPos.y
  );
  modalPointerDownPos = null;

  if (movedDist > 14 || performance.now() - modalState.openedAt < 180) return;

  if (!modalState.typingDone) {
    finishTypewriterImmediately();
  } else {
    closeStoryModal();
  }
});

incenseCard.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  sound.init();
  startHoldingIncensePointer(e.pointerId);
});

window.addEventListener('pointerup', (e) => {
  stopHoldingIncensePointer(e.pointerId);
  if (joystickState.active && e.pointerId === joystickState.pointerId) {
    resetJoystickVisualAndState();
  }
});

window.addEventListener('pointercancel', (e) => {
  stopHoldingIncensePointer(e.pointerId);
  if (joystickState.active && e.pointerId === joystickState.pointerId) {
    resetJoystickVisualAndState();
  }
});

if (btnReplay) {
  btnReplay.addEventListener('click', replayFromBeginning);
}

// Collapsible Objective Checklist Toggle on Mobile
if (objectiveChecklist) {
  objectiveChecklist.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMobileMode || window.innerHeight <= 540 || window.innerWidth <= 900) {
      objectiveChecklist.classList.toggle('expanded');
    }
  });
}

// Direct Canvas Touch:
// 1) At Act 4 Monument -> Touch & Hold directly on Incense Altar / Monument charges incense
// 2) Tapping an Interactable / [Chạm] Khám phá -> opens immediately if < 120px, or auto-runs to item & opens!
canvas.addEventListener('pointerdown', (e) => {
  if (!gameStarted || isPortraitPaused) return;
  sound.init();

  if (modalState.open || transitionState.active) {
    return;
  }

  const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);

  // Check Direct Touch & Hold on Act 4 Monument / Incense Burner
  if (currentAct === 4 && !finaleState.completed) {
    const altarWorldX = FINALE_EVENT.x - 45;
    const monumentGroundY = getGroundY(FINALE_EVENT.x);
    if (
      Math.abs(worldX - altarWorldX) <= 135 &&
      worldY >= monumentGroundY - 280 &&
      worldY <= monumentGroundY + 35
    ) {
      e.preventDefault();
      autoSeekItem = null;
      startHoldingIncensePointer(e.pointerId);
      return;
    }
  }

  // Check Direct Touch on visible Interactables & floating [Chạm] Khám phá label
  let tappedItem = null;
  let bestDist = Infinity;

  for (const it of interactablesState) {
    if (it.act !== currentAct) continue;
    const screenX = it.x - cameraX;
    if (screenX < -60 || screenX > viewportWidth + 60) continue;

    const itemY = getInteractableWorldY(it);
    const isCurrentlyNearby = nearbyInteractable && nearbyInteractable.id === it.id;
    const halfWidth = isCurrentlyNearby ? 86 : 64;
    const topBound = isCurrentlyNearby ? itemY - 112 : itemY - 82;
    const botBound = itemY + 32;

    if (
      Math.abs(worldX - it.x) <= halfWidth &&
      worldY >= topBound &&
      worldY <= botBound
    ) {
      const d = Math.hypot(worldX - it.x, worldY - (itemY - 34));
      if (d < bestDist) {
        bestDist = d;
        tappedItem = it;
      }
    }
  }

  if (tappedItem) {
    e.preventDefault();
    const itemY = getInteractableWorldY(tappedItem);
    const dxToPlayer = Math.abs(player.x - tappedItem.x);
    const dyToPlayer = Math.abs(player.y - itemY);

    if (dxToPlayer < 120 && dyToPlayer < 96) {
      openInteractableModal(tappedItem);
    } else {
      autoSeekItem = tappedItem;
      autoSeekElapsed = 0;
      autoSeekJumpCooldown = 0;
    }
  }
});

// ==================== KEYBOARD LISTENERS (PC) ====================
window.addEventListener('keydown', (e) => {
  if (isPortraitPaused) return;

  if (!gameStarted) {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      startGameExperience();
    }
    return;
  }

  if (e.code === 'Escape') {
    closeChapterDrawer();
    if (modalState.open) {
      e.preventDefault();
      closeStoryModal();
    }
    return;
  }

  if (e.code === 'KeyM' && !e.repeat) {
    btnAudio.click();
    return;
  }

  if (modalState.open) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!modalState.typingDone) finishTypewriterImmediately();
      else closeStoryModal();
      return;
    }
    if (e.code === 'KeyE' && !e.repeat) {
      e.preventDefault();
      if (performance.now() - modalState.openedAt > 180) {
        closeStoryModal();
      }
      return;
    }
    return;
  }

  if (transitionState.active) return;

  if (e.code === 'KeyE' && !e.repeat && nearbyInteractable) {
    e.preventDefault();
    openInteractableModal(nearbyInteractable);
    return;
  }

  if ((e.code === 'KeyF' || e.code === 'KeyJ') && !e.repeat) {
    e.preventDefault();
    triggerDirectCombatAction();
  }

  if ((e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') && !e.repeat) {
    e.preventDefault();
    autoSeekItem = null;
    triggerPlayerJump();
  }

  if ((e.code === 'KeyS' || e.code === 'ArrowDown') && !e.repeat) {
    e.preventDefault();
    autoSeekItem = null;
    triggerPlayerDropThrough();
  }

  if (
    e.code === 'ArrowLeft' ||
    e.code === 'ArrowRight' ||
    e.code === 'ArrowUp' ||
    e.code === 'ArrowDown' ||
    e.code === 'Space' ||
    e.code === 'KeyA' ||
    e.code === 'KeyD' ||
    e.code === 'KeyW' ||
    e.code === 'KeyS' ||
    e.code === 'KeyF' ||
    e.code === 'KeyJ'
  ) {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (
      e.code === 'KeyA' ||
      e.code === 'KeyD' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight'
    ) {
      autoSeekItem = null;
    }
    keysDown.add(e.code);
  }
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.code);
});

window.addEventListener('blur', () => {
  keysDown.clear();
  incenseHoldPointers.clear();
  btnHoldIncense.classList.remove('holding');
  btnTouchAttack.classList.remove('pressed');
  resetJoystickVisualAndState();
});

// ==================== 2D PLATFORMER PHYSICS STEP ====================
function updatePlatformerPhysics(rawDt) {
  const actCfg = ACTS.find((a) => a.id === currentAct) || ACTS[0];

  if (player.dropThroughTimer > 0) {
    player.dropThroughTimer = Math.max(0, player.dropThroughTimer - rawDt);
    if (player.dropThroughTimer <= 0) {
      player.ignoredPlatformId = null;
    }
  }

  if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - rawDt);
  }

  if (player.onGround) {
    player.coyoteTimer = 0.1;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - rawDt);
  }

  if (player.landingSquash > 0) {
    player.landingSquash = Math.max(0, player.landingSquash - rawDt * 5.8);
  }

  const holdingIncenseNow =
    currentAct === 4 &&
    Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius &&
    (keysDown.has('KeyF') || keysDown.has('KeyJ') || incenseHoldPointers.size > 0);

  // Horizontal movement: Keyboard (A/D) + Virtual Analog Joystick (dx) + Auto-Seek Item
  const keyLeft = keysDown.has('KeyA') || keysDown.has('ArrowLeft');
  const keyRight = keysDown.has('KeyD') || keysDown.has('ArrowRight');
  const joyX = joystickState.active ? joystickState.normX : 0;

  let moveLeft = keyLeft || joyX < -0.22;
  let moveRight = keyRight || joyX > 0.22;
  let analogScale = 1.0;

  if (!keyLeft && !keyRight && Math.abs(joyX) > 0.22) {
    analogScale = Math.min(1.0, (Math.abs(joyX) - 0.18) / 0.55);
  }

  // If user touches & holds Monument Altar from slightly farther away in Act 4, auto-walk into incense range
  if (
    currentAct === 4 &&
    !finaleState.completed &&
    incenseHoldPointers.size > 0 &&
    !holdingIncenseNow
  ) {
    const dxAltar = FINALE_EVENT.x - 65 - player.x;
    moveLeft = dxAltar < -8;
    moveRight = dxAltar > 8;
    analogScale = 1.0;
  }

  // Handle Auto-Run toward a tapped distant visible Interactable
  if (autoSeekItem) {
    if (autoSeekItem.act !== currentAct || holdingIncenseNow) {
      autoSeekItem = null;
    } else {
      autoSeekElapsed += rawDt;
      autoSeekJumpCooldown = Math.max(0, autoSeekJumpCooldown - rawDt);

      const targetY = getInteractableWorldY(autoSeekItem);
      const dx = autoSeekItem.x - player.x;
      const dy = player.y - targetY;

      if (Math.abs(dx) < 88 && Math.abs(dy) < 90) {
        const reached = autoSeekItem;
        autoSeekItem = null;
        player.vx = 0;
        openInteractableModal(reached);
        return;
      } else if (autoSeekElapsed > 4.6) {
        autoSeekItem = null;
      } else {
        moveLeft = dx < -10;
        moveRight = dx > 10;
        analogScale = 1.0;

        if (player.onGround && autoSeekJumpCooldown <= 0) {
          const dir = dx >= 0 ? 1 : -1;
          const blockedByObstacle = actCfg.obstacles.some(
            (obs) =>
              player.dy > obs.dy + 8 &&
              ((dir > 0 && player.x >= obs.x1 - 42 && player.x <= obs.x1) ||
                (dir < 0 && player.x <= obs.x2 + 42 && player.x >= obs.x2))
          );

          const nextStepPlatform =
            dy > 26 &&
            actCfg.platforms.some(
              (p) =>
                p.dy < player.dy - 14 &&
                p.dy >= player.dy - 125 &&
                ((dir > 0 && player.x >= p.x1 - 55 && player.x <= p.x2) ||
                  (dir < 0 && player.x <= p.x2 + 55 && player.x >= p.x1))
            );

          if (blockedByObstacle || nextStepPlatform) {
            player.jumpBufferTimer = 0.12;
            autoSeekJumpCooldown = 0.42;
          } else if (dy < -32 && player.currentPlatformId !== null && Math.abs(dx) < 120) {
            triggerPlayerDropThrough();
            autoSeekJumpCooldown = 0.35;
          }
        }
      }
    }
  }

  // Trench crouching & Tactical sneak posture
  const crouchingInput =
    keysDown.has('KeyS') ||
    keysDown.has('ArrowDown') ||
    (joystickState.active && joystickState.normY > 0.45);
  const autoTrenchCrouch =
    currentAct === 2 &&
    player.x >= 2095 &&
    player.x <= 2518 &&
    player.dy >= 22;

  player.isCrouching = Boolean(player.onGround && (crouchingInput || autoTrenchCrouch));

  // Execute Jump if buffered & within coyote ground grace
  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0 && !holdingIncenseNow) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.currentPlatformId = null;
    player.jumpBufferTimer = 0;
    player.coyoteTimer = 0;
    sound.playJump();
  }

  const inputDir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
  let effectiveMaxSpeed = player.maxSpeed * analogScale;
  if (player.isCrouching) {
    effectiveMaxSpeed *= 0.55;
  }

  if (inputDir !== 0 && !holdingIncenseNow) {
    player.facing = inputDir;
    player.vx += inputDir * player.accel * rawDt;
    player.vx = Math.max(-effectiveMaxSpeed, Math.min(effectiveMaxSpeed, player.vx));
  } else {
    if (Math.abs(player.vx) <= player.friction * rawDt) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * player.friction * rawDt;
    }
  }

  const prevX = player.x;
  const prevDy = player.dy;
  player.x += player.vx * rawDt;

  // Solid black earth & karst sub-room enclosure clamping
  // When deep underground (dy > 65), player cannot walk through solid rock/earth walls
  // Must use stairs to walk back up!
  if (currentAct === 1 && player.dy > 65) {
    if (player.x < 466) {
      player.x = 466;
      player.vx = 0;
    } else if (player.x > 734) {
      player.x = 734;
      player.vx = 0;
    }
  } else if (currentAct === 3 && player.dy > 65) {
    if (player.x < 466) {
      player.x = 466;
      player.vx = 0;
    } else if (player.x > 734) {
      player.x = 734;
      player.vx = 0;
    }
  }

  // Solid low obstacles check
  nearbyObstacleHint = null;
  for (const obs of actCfg.obstacles) {
    if (Math.abs(player.x - (obs.x1 + obs.x2) * 0.5) < 95 && player.dy > obs.dy + 8) {
      nearbyObstacleHint = obs;
    }
    if (player.dy > obs.dy + 8) {
      if (prevX <= obs.x1 - 12 && player.x > obs.x1 - 12) {
        player.x = obs.x1 - 12;
        player.vx = 0;
      } else if (prevX >= obs.x2 + 12 && player.x < obs.x2 + 12) {
        player.x = obs.x2 + 12;
        player.vx = 0;
      }
    }
  }

  // Vertical integration & One-way Platform / Terrain Slope resolution
  if (player.onGround) {
    if (player.currentPlatformId) {
      const plat = actCfg.platforms.find((p) => p.id === player.currentPlatformId);
      if (!plat || player.x < plat.x1 - 11 || player.x > plat.x2 + 11) {
        player.onGround = false;
        player.currentPlatformId = null;
        // Check if stepping directly onto an adjacent stair / ledge platform
        for (const nextPlat of actCfg.platforms) {
          if (player.x >= nextPlat.x1 - 8 && player.x <= nextPlat.x2 + 8) {
            if (Math.abs(nextPlat.dy - prevDy) <= 32) {
              player.dy = nextPlat.dy;
              player.currentPlatformId = nextPlat.id;
              player.onGround = true;
              break;
            }
          }
        }
      } else {
        player.dy = plat.dy;
      }
    } else {
      const floorDy = sampleGroundOffset(currentAct, player.x);
      // Check if stepping onto an adjacent platform (like stair entry)
      let steppedOntoPlatform = false;
      for (const plat of actCfg.platforms) {
        if (player.x >= plat.x1 - 8 && player.x <= plat.x2 + 8) {
          if (Math.abs(plat.dy - prevDy) <= 24) {
            player.dy = plat.dy;
            player.currentPlatformId = plat.id;
            steppedOntoPlatform = true;
            break;
          }
        }
      }
      if (!steppedOntoPlatform) {
        player.dy = floorDy;
      }
    }
  }

  if (!player.onGround) {
    player.vy += GRAVITY * rawDt;
    player.dy += player.vy * rawDt;

    if (player.vy >= 0) {
      // 1. Check landing on One-Way Platforms
      for (const plat of actCfg.platforms) {
        if (player.dropThroughTimer > 0 && plat.id === player.ignoredPlatformId) {
          continue;
        }
        if (player.x >= plat.x1 - 10 && player.x <= plat.x2 + 10) {
          if (prevDy <= plat.dy + 10 && player.dy >= plat.dy) {
            const impactVy = player.vy;
            player.dy = plat.dy;
            player.vy = 0;
            player.onGround = true;
            player.currentPlatformId = plat.id;
            if (impactVy > 190) {
              player.landingSquash = Math.min(1, impactVy / 650);
              sound.playLand(currentAct);
              vfx.spawnLandDust(player.x, baseGroundY + player.dy);
            }
            break;
          }
        }
      }

      // 2. Check landing on Terrain Floor
      if (!player.onGround) {
        const floorDy = sampleGroundOffset(currentAct, player.x);
        if (player.dy >= floorDy) {
          const impactVy = player.vy;
          player.dy = floorDy;
          player.vy = 0;
          player.onGround = true;
          player.currentPlatformId = null;
          if (impactVy > 190) {
            player.landingSquash = Math.min(1, impactVy / 650);
            sound.playLand(currentAct);
            vfx.spawnLandDust(player.x, baseGroundY + player.dy);
          }
        }
      }
    }
  }

  // Stage Boundary & Act Transition Checks
  if (currentAct === 1 && player.x < 42) {
    player.x = 42;
    player.vx = 0;
  } else if (currentAct > 1 && player.x < WORLD_CONFIG.backTriggerX) {
    if ((moveLeft || player.vx < -15) && !modalState.open && !pendingMilestoneTimer) {
      startBackwardActTransition();
      return;
    }
    player.x = WORLD_CONFIG.backTriggerX;
    player.vx = 0;
  }

  if (currentAct < 4 && player.x >= WORLD_CONFIG.exitTriggerX) {
    const actQtes = QTE_ZONES.filter((q) => q.act === currentAct);
    const allCompleted = actQtes.every((q) => completedQtes.has(q.id));
    if (!allCompleted) {
      player.x = WORLD_CONFIG.exitTriggerX - 4;
      player.vx = 0;
      combatSystem.setHeadNotice(
        'Hãy hoàn thành sự kiện lịch sử phía trước ([F] / TẤN CÔNG) để bước sang màn tiếp theo!',
        'warn',
        2.2
      );
    } else if (pendingMilestoneTimer || modalState.open) {
      player.x = WORLD_CONFIG.exitTriggerX - 4;
      player.vx = 0;
    } else if (moveRight || player.vx > 15) {
      startForwardActTransition();
      return;
    } else {
      player.x = WORLD_CONFIG.exitTriggerX - 2;
      player.vx = 0;
    }
  } else if (currentAct === 4 && player.x > 2900) {
    player.x = 2900;
    player.vx = 0;
  }

  player.y = baseGroundY + player.dy;

  // Walk cycle & footsteps (only when grounded)
  if (player.onGround && Math.abs(player.vx) > 22) {
    const cycleSpeed = (Math.abs(player.vx) / player.maxSpeed) * 10.2;
    player.walkCycle += rawDt * cycleSpeed;
    if (player.walkCycle >= player.nextStepCycle) {
      player.nextStepCycle += Math.PI;
      sound.playFootstep(currentAct);
    }
  } else if (player.onGround) {
    player.walkCycle = 0;
    player.nextStepCycle = Math.PI * 0.6;
  }
}

/**
 * Tự động tính toán mức độ phóng to của Camera khi nhân vật đến gần mốc nhiệm vụ chưa làm hoặc vào các không gian đặc biệt:
 * - Đến gần mốc/văn kiện CHƯA làm -> zoom sớm để thu hút sự chú ý
 * - Căn hầm bí mật (Màn 1): zoom 1.22
 * - Hang Pác Bó (Màn 1): zoom 1.18
 * - Kho thóc Nhật (Màn 1): zoom 1.18
 * - Chiến lũy & Nhà phố cổ Hà Nội (Màn 2): zoom 1.18
 * - Giao thông hào Điện Biên Phủ (Màn 2): zoom 1.20
 * - Hầm chỉ huy chữ A Trường Sơn (Màn 3): zoom 1.22
 * - Ụ pháo 37mm & Dinh Độc Lập (Màn 3): zoom 1.18 - 1.20
 * - Đài tưởng niệm dâng hương (Màn 4): zoom 1.16
 * - Khi ra khỏi/hoàn thành: trả mượt mà về 1.0
 */
function computeTargetCameraZoom() {
  if (!gameStarted || isPortraitPaused || transitionState.active) {
    return 1.0;
  }

  // Act 1 Special Sub-rooms & Milestones:
  if (currentAct === 1) {
    const item1 = interactablesState.find((it) => it.id === 'act1_item1');
    const item2 = interactablesState.find((it) => it.id === 'act1_item2');
    const qte1aDone = completedQtes.has('qte_1a');

    // 1. Căn hầm bí mật (x = 520, hầm 450..750, dy = +180)
    if ((item1 && !item1.visited && player.x >= 360 && player.x <= 780) ||
        (player.x >= 440 && player.x <= 760 && player.dy > 35)) {
      return 1.22;
    }

    // 2. Hang Pác Bó (x = 1365, vách đá 1200..1560)
    if ((item2 && !item2.visited && player.x >= 1120 && player.x <= 1600) ||
        (player.x >= 1220 && player.x <= 1560)) {
      return 1.18;
    }

    // 3. Phá kho thóc Nhật (x = 2240..2500)
    if (!qte1aDone && player.x >= 2050 && player.x <= 2520) {
      return 1.18;
    }
  }

  // Act 2 Special Locations:
  if (currentAct === 2) {
    const item1 = interactablesState.find((it) => it.id === 'act2_item1');
    const item2 = interactablesState.find((it) => it.id === 'act2_item2');
    const qte2bDone = completedQtes.has('qte_2b');

    // 1. Chiến lũy Bắc Bộ Phủ (x = 520)
    if (item1 && !item1.visited && player.x >= 380 && player.x <= 680) {
      return 1.16;
    }

    // 2. Nhà phố cổ Hà Nội 2 tầng (x = 1050..1360, item2 x = 1220)
    if ((item2 && !item2.visited && player.x >= 960 && player.x <= 1400) ||
        (player.x >= 1050 && player.x <= 1360)) {
      return 1.18;
    }

    // 3. Chiến trường Điện Biên Phủ (x = 2040..2650)
    if ((!qte2bDone && player.x >= 1960 && player.x <= 2650) ||
        (player.x >= 2085 && player.x <= 2530 && (player.dy > 18 || player.isCrouching))) {
      return 1.20;
    }
  }

  // Act 3 Special Locations:
  if (currentAct === 3) {
    const item1 = interactablesState.find((it) => it.id === 'act3_item1');
    const item2 = interactablesState.find((it) => it.id === 'act3_item2');
    const qte3aDone = completedQtes.has('qte_3a');
    const qte3bDone = completedQtes.has('qte_3b');

    // 1. Hầm chỉ huy chữ A Trường Sơn (x = 520, hầm 450..750, dy = +170)
    if ((item1 && !item1.visited && player.x >= 360 && player.x <= 780) ||
        (player.x >= 440 && player.x <= 760 && player.dy > 35)) {
      return 1.22;
    }

    // 2. Binh trạm giao liên (x = 1260)
    if (item2 && !item2.visited && player.x >= 1120 && player.x <= 1400) {
      return 1.16;
    }

    // 3. Pháo cao xạ 37mm (x = 1600..1880)
    if (!qte3aDone && player.x >= 1500 && player.x <= 1920) {
      return 1.18;
    }

    // 4. Dinh Độc Lập / Cổng sắt (x = 2360..2700)
    if (!qte3bDone && player.x >= 2250 && player.x <= 2750) {
      return 1.20;
    }
  }

  // Act 4 Special Locations:
  if (currentAct === 4) {
    const unvisitedNear = interactablesState.some(
      (it) => it.act === 4 && !it.visited && Math.abs(player.x - it.x) < 170
    );
    if (unvisitedNear) {
      return 1.16;
    }
    if (player.x >= 2380 && player.x <= 2680) {
      return 1.16;
    }
  }

  return 1.0;
}

function setActionBanner(icon, htmlContent, isDanger = false) {
  if (!contextActionBanner || !actionBannerIcon || !actionBannerText) return;
  actionBannerIcon.textContent = icon;
  actionBannerText.innerHTML = htmlContent;
  contextActionBanner.classList.remove('hidden');
  contextActionBanner.classList.toggle('action-key-danger', isDanger);
}

function hideActionBanner() {
  if (contextActionBanner && !contextActionBanner.classList.contains('hidden')) {
    contextActionBanner.classList.add('hidden');
  }
}

/**
 * Cập nhật thanh hướng dẫn hành động & chiến đấu trực tiếp (Contextual Action Banner)
 * đặt trang trọng ngay dưới Thời gian & Địa điểm ở Top HUD.
 */
function updateActionGuidanceBanner() {
  if (
    !gameStarted ||
    isPortraitPaused ||
    transitionState.active ||
    modalState.open
  ) {
    hideActionBanner();
    return;
  }

  const isTouch = isMobileMode;
  const attackKey = isTouch
    ? '<span class="action-key-pill">[Tấn công]</span>'
    : '<span class="action-key-pill">[F]</span>';
  const interactKey = isTouch
    ? '<span class="action-key-pill">[Chạm]</span>'
    : '<span class="action-key-pill">[E]</span>';
  const crouchKey = isTouch
    ? '<span class="action-key-pill">[Gạt cần xuống]</span>'
    : '<span class="action-key-pill">[S / ↓]</span>';

  // 1. Nearby Historical Interactable Document
  if (nearbyInteractable) {
    const actionVerb = nearbyInteractable.visited ? 'đọc lại' : 'khám phá';
    const docName = isTouch
      ? (nearbyInteractable.checklistLabel || nearbyInteractable.title)
      : nearbyInteractable.title;
    setActionBanner(
      '📜',
      `Nhấn ${interactKey} để ${actionVerb}: <strong>${docName}</strong>`
    );
    return;
  }

  // 2. Combat & Tactical Zones
  if (currentAct === 1) {
    if (player.x >= 2080 && player.x <= 2520 && !completedQtes.has('qte_1a')) {
      if (player.x >= 2320 && player.x <= 2385) {
        setActionBanner('🔨', `Nhấn ${attackKey} liên tục phá tung cửa kho thóc Nhật!`);
      } else {
        setActionBanner(
          '🌾',
          isTouch
            ? `Tiến sát Kho thóc, nhấn ${attackKey} phá khóa; né đèn pha!`
            : `Tiến sát Cửa kho thóc, nhấn ${attackKey} phá khóa lấy thóc gạo; né đèn pha lính gác!`
        );
      }
      return;
    }
    if (player.x >= 2620 && player.x <= 2880 && !completedQtes.has('qte_1b')) {
      setActionBanner('⭐', `Bước lên Lễ đài Độc lập, nhấn ${attackKey} giương cao cờ đỏ sao vàng!`);
      return;
    }
  }

  if (currentAct === 2) {
    if (player.x >= 2040 && player.x <= 2650 && !completedQtes.has('qte_2b')) {
      const charge = combatSystem.act2.plantedCharge;
      if (charge && charge.timer > 0) {
        setActionBanner(
          '⚠️',
          `BỘC PHÁ ĐẾM NGƯỢC (${charge.timer.toFixed(1)}s)! LÙI GẤP về Hào số 3 và ${crouchKey} cúi thấp!`,
          true
        );
      } else if (player.x >= 2440 && player.x <= 2600) {
        setActionBanner(
          '💣',
          `Đến Lô cốt nhấn ${attackKey} gài bộc phá, sau đó LÙI GẤP về Hào số 3!`
        );
      } else {
        setActionBanner(
          '🛡️',
          isTouch
            ? `Ẩn nấp trong 3 chiến hào, ${crouchKey} cúi rạp né làn đạn Pháp!`
            : `Ẩn nấp trong 3 chiến hào, nhấn ${crouchKey} cúi rạp né làn đạn đại liên Pháp!`
        );
      }
      return;
    }
  }

  if (currentAct === 3) {
    if (player.x >= 1540 && player.x <= 1920 && !completedQtes.has('qte_3a')) {
      setActionBanner(
        '✈️',
        isTouch
          ? `Đến Ụ pháo nhấn ${attackKey} bắn tiêm kích Mỹ; đổi ụ khi có còi bom!`
          : `Đến Ụ pháo 37mm nhấn ${attackKey} bắn hạ tiêm kích Mỹ; đổi ụ pháo ngay khi có còi báo bom!`
      );
      return;
    }
    if (player.x >= 2360 && player.x <= 2680 && !completedQtes.has('qte_3b')) {
      setActionBanner(
        '⚔️',
        isTouch
          ? `Áp sát Cổng Dinh, nhấn ${attackKey} bắn yểm trợ Xe tăng 390; né đạn!`
          : `Áp sát Cổng Dinh Độc Lập, nhấn ${attackKey} bắn AK yểm trợ Xe tăng 390; nhảy hoặc cúi né đạn!`
      );
      return;
    }
  }

  if (currentAct === 4) {
    if (!finaleState.completed && player.x >= 2420 && player.x <= 2700) {
      const holdPrompt = isTouch
        ? `Chạm & GIỮ Lư hương (hoặc ${attackKey}) 2.5s`
        : `GIỮ phím ${attackKey} 2.5s`;
      setActionBanner('🕯️', `Bước lên tam cấp, ${holdPrompt} để thắp nén tâm hương!`);
      return;
    }
    if (finaleState.completed) {
      if (Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius + 40) {
        setActionBanner(
          '🕊️',
          isTouch
            ? '<strong>ĐÀI TƯỞNG NIỆM:</strong> Nén tâm hương đã thắp — Đời đời ghi ơn Liệt sĩ!'
            : '<strong>ĐÀI TƯỞNG NIỆM LIỆT SĨ:</strong> Nén tâm hương đã thắp — Đời đời ghi nhớ công ơn các Anh hùng Liệt sĩ!'
        );
      } else {
        setActionBanner(
          '✨',
          isTouch
            ? '<strong>HÀNH TRÌNH HOÀN THÀNH:</strong> Đã thắp nén tâm hương tri ân Liệt sĩ!'
            : '<strong>HÀNH TRÌNH HOÀN THÀNH:</strong> Đã thắp nén tâm hương tri ân — Đời đời ghi nhớ công ơn các Anh hùng Liệt sĩ!'
        );
      }
      return;
    }
  }

  // 3. Proximity to upcoming unvisited document
  const upcomingUnvisited = interactablesState.find(
    (it) => it.act === currentAct && !it.visited && Math.abs(player.x - it.x) < 280
  );
  if (upcomingUnvisited) {
    setActionBanner(
      '📍',
      `Phía trước có cột mốc: <strong>"${upcomingUnvisited.checklistLabel || upcomingUnvisited.title}"</strong>. Hãy tiếp cận!`
    );
    return;
  }

  hideActionBanner();
}

// ==================== MAIN 60FPS GAME LOOP ====================
let lastFrameTime = performance.now();

function gameLoop(now) {
  const rawDt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  // Pause game update loop cleanly when mobile device is held in Portrait orientation
  if (isPortraitPaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const scaledDt = vfx.update(rawDt, {
    act: currentAct,
    playerX: player.x,
    cameraX,
    width: viewportWidth,
    height: viewportHeight,
    getGroundY,
    activeQteId: null,
  });

  if (player.pose && player.pose !== 'bow_incense' && player.pose !== 'handoff_give') {
    player.poseTimer += rawDt;
    if (player.poseTimer >= player.poseHoldDuration) {
      player.pose = null;
    }
  }

  let canControl = false;

  if (transitionState.active) {
    nearbyInteractable = null;
    nearbyObstacleHint = null;
    updateCinematicTransition(rawDt);
  } else {
    const isCeremonyBowing = finaleState.completed && finaleState.postTimer < 2.5;
    canControl =
      gameStarted &&
      !modalState.open &&
      !isCeremonyBowing;

    if (canControl) {
      updatePlatformerPhysics(rawDt);
    } else {
      player.vx = 0;
      player.y = baseGroundY + player.dy;
    }
  }

  // Update Real-Time In-World Minigames, Progression Gates & Follower Squad!
  if (gameStarted && !transitionState.active) {
    combatSystem.update(rawDt, {
      act: currentAct,
      player,
      baseGroundY,
      getGroundY,
      completedQtes,
      interactablesState,
      canControl,
    });
    player.y = baseGroundY + player.dy;
  }

  // Update dynamic Sub-Location Name in Top HUD
  if (gameStarted) {
    const liveZone = getZoneName(currentAct, player.x);
    if (contextLocation.textContent !== liveZone) {
      contextLocation.textContent = liveZone;
    }
  }

  // Check nearby Interactable ([E] on PC / [Chạm] on Mobile)
  nearbyInteractable = null;
  if (gameStarted && !transitionState.active && !modalState.open) {
    let bestDist = WORLD_CONFIG.interactRadiusX;
    for (const item of interactablesState) {
      if (item.act !== currentAct) continue;
      const itemY = getInteractableWorldY(item);
      const dx = Math.abs(player.x - item.x);
      const dy = Math.abs(player.y - itemY);
      if (dx < bestDist && dy < WORLD_CONFIG.interactRadiusY) {
        bestDist = dx;
        nearbyInteractable = item;
      }
    }
  }

  // Act 1 Blazing Torch trailing embers along footsteps
  if (
    gameStarted &&
    (player.costumeOverride || currentAct) === 1 &&
    player.pose !== 'hammer' &&
    player.pose !== 'flag_raise' &&
    !combatSystem.act1.isHidden
  ) {
    const movingFast = Math.abs(player.vx) > 35;
    if (Math.random() < (movingFast ? 0.58 : 0.14)) {
      const dir = player.facing || 1;
      vfx.spawnTorchEmber(player.x + dir * 24, player.y - 78, dir);
    }
  }

  // Act 4 Multi-Generational Companions (x >= 2000) & Finale Monument (localX = 2560) — STRICTLY PRESERVED!
  if (gameStarted && currentAct === 4 && !transitionState.active) {
    if (player.x >= 2000) {
      if (!companionsState.joined) {
        companionsState.joined = true;
        if (companionsState.alpha <= 0.02) {
          companionsState.elderX = player.x - 68;
          companionsState.fatherX = player.x - 34;
        }
        if (!companionsState.captionShown) {
          companionsState.captionShown = true;
          sound.playHandoffChime();
          showTemporaryCaption(
            'Dưới chân đồi Tùng Bách, Ông và Cha cùng sánh bước bên Cháu tiến lên Đài tưởng niệm...',
            4000
          );
        }
      }
      companionsState.alpha = Math.min(1, companionsState.alpha + rawDt * 1.15);
    } else if (player.x < 1920) {
      companionsState.joined = false;
      companionsState.alpha = Math.max(0, companionsState.alpha - rawDt * 1.4);
    }

    if (companionsState.alpha > 0.01) {
      const targetFatherX = Math.min(FINALE_EVENT.x - 94, player.x - 34);
      const targetElderX = Math.min(FINALE_EVENT.x - 130, player.x - 68);

      const prevFatherX = companionsState.fatherX;
      const prevElderX = companionsState.elderX;

      const followRate = Math.min(1, rawDt * 7.5);
      companionsState.fatherX += (targetFatherX - companionsState.fatherX) * followRate;
      companionsState.elderX += (targetElderX - companionsState.elderX) * (followRate * 0.92);

      const fatherVx = (companionsState.fatherX - prevFatherX) / Math.max(0.001, rawDt);
      const elderVx = (companionsState.elderX - prevElderX) / Math.max(0.001, rawDt);

      companionsState.fatherSpeedRatio = Math.min(1, Math.abs(fatherVx) / 260);
      companionsState.elderSpeedRatio = Math.min(1, Math.abs(elderVx) / 230);

      if (companionsState.fatherSpeedRatio > 0.05) {
        companionsState.fatherFacing = fatherVx >= 0 ? 1 : -1;
        companionsState.fatherWalkCycle += rawDt * (3.5 + companionsState.fatherSpeedRatio * 6.8);
      } else {
        companionsState.fatherWalkCycle = 0;
        if (player.x >= FINALE_EVENT.x - 180) companionsState.fatherFacing = 1;
      }

      if (companionsState.elderSpeedRatio > 0.05) {
        companionsState.elderFacing = elderVx >= 0 ? 1 : -1;
        companionsState.elderWalkCycle += rawDt * (3.2 + companionsState.elderSpeedRatio * 5.8);
      } else {
        companionsState.elderWalkCycle = 0;
        if (player.x >= FINALE_EVENT.x - 180) companionsState.elderFacing = 1;
      }

      companionsState.fatherY = getGroundY(companionsState.fatherX);
      companionsState.elderY = getGroundY(companionsState.elderX);
      companionsState.sharedPose = player.pose === 'bow_incense' ? 'bow_incense' : null;
      if (companionsState.sharedPose === 'bow_incense') {
        companionsState.fatherFacing = 1;
        companionsState.elderFacing = 1;
      }
    }

    // 2. Incense Offering & 6 Fallen Comrades Military Salute at Monument (localX = 2560)
    if (!finaleState.completed) {
      const nearMonument = Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius;
      incenseHud.classList.toggle('hidden', !nearMonument || modalState.open);

      if (nearMonument && !modalState.open) {
        const isHoldingIncense =
          keysDown.has('KeyF') || keysDown.has('KeyJ') || incenseHoldPointers.size > 0;
        const altarX = FINALE_EVENT.x - 58;
        const altarTopY = getGroundY(FINALE_EVENT.x) - 78;

        if (isHoldingIncense) {
          player.pose = 'bow_incense';
          player.facing = 1;
          companionsState.sharedPose = 'bow_incense';
          companionsState.fatherFacing = 1;
          companionsState.elderFacing = 1;
          finaleState.holdProgress = Math.min(
            1,
            finaleState.holdProgress + rawDt / FINALE_EVENT.holdDuration
          );
          vfx.spawnIncenseSmoke(altarX, altarTopY, 0.55 + finaleState.holdProgress * 0.95);
          sound.updateIncenseCharge(finaleState.holdProgress, true);

          if (finaleState.holdProgress >= 1) {
            finaleState.completed = true;
            finaleState.postTimer = 0;
            incenseHoldPointers.clear();
            btnHoldIncense.classList.remove('holding');
            btnTouchAttack.classList.remove('pressed');
            incenseHud.classList.add('hidden');
            sound.playIncenseComplete();
            vfx.triggerFlash(0.62, '#fef9c3', 1.2);
            vfx.spawnCelebrationBurst(altarX, altarTopY - 12, 48);
            updateObjectiveChecklist();
            showTemporaryCaption(
              'Đã hoàn thành toàn bộ hành trình lịch sử! Đời đời nhớ ơn các Anh hùng Liệt sĩ.',
              6000
            );
          }
        } else {
          if (player.pose === 'bow_incense') player.pose = null;
          finaleState.holdProgress = Math.max(0, finaleState.holdProgress - rawDt * 0.6);
          sound.updateIncenseCharge(finaleState.holdProgress, false);
        }

        const pct = Math.round(finaleState.holdProgress * 100);
        incenseBarFill.style.width = `${pct}%`;
        incensePercent.textContent = `${pct}%`;
      } else if (finaleState.holdProgress > 0) {
        finaleState.holdProgress = Math.max(0, finaleState.holdProgress - rawDt * 0.8);
        sound.updateIncenseCharge(0, false);
      }
    } else {
      const altarX = FINALE_EVENT.x - 58;
      const altarTopY = getGroundY(FINALE_EVENT.x) - 78;
      vfx.spawnIncenseSmoke(altarX, altarTopY, 0.45);
      finaleState.spiritsAlpha = Math.min(1, finaleState.spiritsAlpha + rawDt * 0.72);
      finaleState.postTimer += rawDt;

      if (finaleState.postTimer < 2.5) {
        player.pose = 'bow_incense';
        player.facing = 1;
        companionsState.sharedPose = 'bow_incense';
        companionsState.fatherFacing = 1;
        companionsState.elderFacing = 1;
      } else {
        if (player.pose === 'bow_incense') {
          player.pose = null;
        }
        if (companionsState.sharedPose === 'bow_incense') {
          companionsState.sharedPose = null;
        }
      }
    }
  } else {
    incenseHud.classList.add('hidden');
  }

  // Strictly Clamped Camera within [0 .. 3000 - viewportWidth]
  const maxCamX = Math.max(0, WORLD_CONFIG.actWidth - viewportWidth);
  const lookAhead = transitionState.active ? 0 : player.facing * 85;
  const desiredCamX = Math.max(
    0,
    Math.min(maxCamX, player.x + lookAhead - viewportWidth * 0.43)
  );
  cameraX += (desiredCamX - cameraX) * Math.min(1, rawDt * 6.5);

  // Dynamic smooth camera zoom when entering/leaving caves, cellars, trenches & monuments
  targetCameraZoom = computeTargetCameraZoom();
  cameraZoom += (targetCameraZoom - cameraZoom) * Math.min(1, rawDt * 3.8);

  // Camera vertical tracking for underground subrooms (Act 1 cellar dy = +180, Act 3 bunker dy = +170)
  const desiredCamY = player.dy > 20 ? (player.dy - 15) * 0.94 : 0;
  cameraY += (desiredCamY - cameraY) * Math.min(1, rawDt * 5.2);

  renderer.render(
    ctx,
    {
      act: currentAct,
      width: viewportWidth,
      height: viewportHeight,
      baseGroundY,
      getGroundY,
      cameraX,
      cameraY,
      cameraZoom,
      player,
      companionsState,
      combatSystem,
      interactables: interactablesState,
      nearbyInteractable,
      nearbyObstacleHint,
      completedQtes,
      activeQte: null,
      tankProgress: completedQtes.has('qte_3b') ? 1 : 0,
      transitionState,
      finaleState,
      isTouchMode: isMobileMode,
      autoSeekItem,
      dt: scaledDt,
    },
    vfx
  );

  // Render Horizontal Mini-map, VOV Broadcast Waveform & Action Guidance Banner
  if (gameStarted && !isPortraitPaused) {
    renderMinimap();
    updateVovBroadcastHud();
    updateActionGuidanceBanner();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
