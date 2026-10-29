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

// ==================== INITIALIZE CORE SYSTEMS ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const sound = new SoundEngine();
const vfx = new VfxSystem(sound);
const renderer = new WorldRenderer();

// ==================== DOM ELEMENTS ====================
const introOverlay = document.getElementById('intro-overlay');
const btnStartGame = document.getElementById('btn-start-game');

const topContextHud = document.getElementById('top-context-hud');
const contextPeriod = document.getElementById('context-period');
const contextLocation = document.getElementById('context-location');
const contextTitle = document.getElementById('context-title');
const contextSubtitle = document.getElementById('context-subtitle');

const cinematicCaption = document.getElementById('cinematic-caption');

const btnChapterToggle = document.getElementById('btn-chapter-toggle');
const chapterDrawer = document.getElementById('chapter-drawer');
const drawerItems = Array.from(document.querySelectorAll('.drawer-item'));
const btnAudio = document.getElementById('btn-audio');
const audioLabel = document.getElementById('audio-label');

const qteOverlay = document.getElementById('qte-overlay');
const qteTitleEl = document.getElementById('qte-title');
const qtePromptEl = document.getElementById('qte-prompt');
const qteRingStage = document.getElementById('qte-ring-stage');
const qteTargetZone = document.getElementById('qte-target-zone');
const qteShrinkingRing = document.getElementById('qte-shrinking-ring');
const qteMashSvg = document.querySelector('.qte-mash-svg');
const qteMashProgress = document.getElementById('qte-mash-progress');
const qteKeyCap = document.getElementById('qte-key-cap');
const qteSubstatus = document.getElementById('qte-substatus');

const failsafeOverlay = document.getElementById('failsafe-overlay');
const failsafeText = document.getElementById('failsafe-text');

const incenseHud = document.getElementById('incense-hud');
const incensePrompt = document.getElementById('incense-prompt');
const incenseBarFill = document.getElementById('incense-bar-fill');
const incensePercent = document.getElementById('incense-percent');
const btnHoldIncense = document.getElementById('btn-hold-incense');

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

// Static text bindings from storyData.js
incensePrompt.textContent = FINALE_EVENT.promptText;
failsafeText.textContent = FINALE_EVENT.failSafeMessage;
finaleQuoteText.textContent = FINALE_EVENT.quoteText;
finaleQuoteAuthor.textContent = FINALE_EVENT.quoteAuthor;
finaleLessonTitle.textContent = FINALE_EVENT.lessonTitle;
finaleLessonText.textContent = FINALE_EVENT.lessonText;
btnReplay.querySelector('span').textContent = FINALE_EVENT.replayButtonLabel;

// ==================== GAME & PHYSICS STATE ====================
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let baseGroundY = Math.round(viewportHeight * 0.8);

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
};

let cameraX = 0;
let cameraZoom = 1.0;
let targetCameraZoom = 1.0;

const keysDown = new Set();
let mouseHoldingIncense = false;

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

// Active QTE runtime state
let activeQte = null;
let pendingMilestoneTimer = null;
let failSafeActive = false;
let failSafeTimer = null;
let tankProgress = 0;

// Cinematic Auto-Walk & Generational Handoff State Machine
const transitionState = {
  active: false,
  subPhase: null, // 'ENTER_LEFT' | 'WALK_OFF_RIGHT' | 'APPROACH_SUCCESSOR' | 'HANDOFF_CEREMONY' | 'SUCCESSOR_WALK_OFF' | 'WALK_OFF_LEFT' | 'ENTER_FROM_RIGHT' | 'TELEPORT_FADEOUT'
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

// ==================== TERRAIN & VIEWPORT HELPERS ====================
function getGroundYForAct(actId, localX) {
  return baseGroundY + sampleGroundOffset(actId, localX);
}

function getGroundY(localX) {
  return getGroundYForAct(currentAct, localX);
}

function updateCanvasSize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  baseGroundY = Math.round(viewportHeight * 0.8);

  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  player.y = baseGroundY + player.dy;
}
window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();

// ==================== TOP HUD & CAPTION HELPERS ====================
function triggerActTopHudIntro(actId, initialX = 180) {
  const act = ACTS.find((a) => a.id === actId) || ACTS[0];
  contextPeriod.textContent = act.period;
  contextLocation.textContent = getZoneName(actId, initialX);
  contextTitle.textContent = `MÀN ${act.id} — ${act.title}`;
  contextSubtitle.textContent = act.subtitle;

  topContextHud.classList.remove('hidden', 'docked');

  if (topHudDockTimer) clearTimeout(topHudDockTimer);
  // Sau 3.5 giây: tiêu đề lớn mờ dần, mốc thời gian & địa điểm thu nhỏ scale(0.85) và opacity 0.55 cố định góc trên
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

// ==================== STORY MODAL (TYPEWRITER) ====================
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

  modalHint.innerHTML = 'Ấn <kbd>SPACE</kbd> hiện toàn bộ • Ấn <kbd>E</kbd> để đóng và đi tiếp';

  canvas.classList.add('canvas-blurred');
  storyModal.classList.remove('hidden');
  sound.playModalOpen();

  modalState.timerId = setInterval(() => {
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
  modalHint.innerHTML = 'Ấn <kbd>E</kbd> hoặc <kbd>SPACE</kbd> để đóng và đi tiếp';
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
}

// ==================== QTE SLOW-MOTION ENGINE ====================
function startQte(zone) {
  activeQte = {
    id: zone.id,
    x: zone.x,
    zone,
    stepIndex: 0,
    stepElapsed: 0,
    mashCount: 0,
  };

  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  if (zone.id === 'qte_3b') {
    tankProgress = 0;
  }

  vfx.setSlowMotion(true);
  targetCameraZoom = 1.1;
  sound.playSlowMoEnter();

  qteOverlay.classList.remove('hidden');
  setupCurrentQteStep();
}

function setupCurrentQteStep() {
  if (!activeQte) return;
  const step = activeQte.zone.steps[activeQte.stepIndex];
  activeQte.stepElapsed = 0;
  activeQte.mashCount = 0;

  qteTitleEl.textContent = activeQte.zone.title;
  qtePromptEl.textContent = step.prompt;
  qteKeyCap.textContent = step.keyLabel;

  if (step.mode === 'timing') {
    qteShrinkingRing.classList.remove('hidden');
    qteTargetZone.classList.remove('hidden', 'in-sweet-spot');
    qteMashSvg.classList.add('hidden');
    qteShrinkingRing.style.transform = 'scale(1.22)';
    qteSubstatus.textContent = 'Chờ vòng trắng thu vào vùng sáng...';
  } else {
    qteShrinkingRing.classList.add('hidden');
    qteTargetZone.classList.add('hidden');
    qteMashSvg.classList.remove('hidden');
    updateMashRingVisual(0, step.targetCount);
    qteSubstatus.textContent = `Tiến độ: 0 / ${step.targetCount}`;
  }
}

function updateMashRingVisual(count, target) {
  const circumference = 415;
  const ratio = Math.max(0, Math.min(1, count / target));
  qteMashProgress.style.strokeDashoffset = String(circumference * (1 - ratio));
}

function updateActiveQte(rawDt) {
  if (!activeQte) return;
  const step = activeQte.zone.steps[activeQte.stepIndex];
  activeQte.stepElapsed += rawDt;

  if (step.mode === 'timing') {
    const progress = activeQte.stepElapsed / step.duration;
    if (progress >= 1.0) {
      triggerQteFailSafe();
      return;
    }

    const ringScale = 1.22 - progress * 0.86;
    qteShrinkingRing.style.transform = `scale(${ringScale.toFixed(3)})`;

    const inSweet = progress >= step.sweetSpotStart && progress <= step.sweetSpotEnd;
    qteTargetZone.classList.toggle('in-sweet-spot', inSweet);
    qteSubstatus.textContent = inSweet
      ? `Bấm [${step.keyLabel}] ngay!`
      : 'Canh vòng sáng chạm viền vàng...';
  } else if (step.mode === 'mash') {
    const remaining = Math.max(0, step.duration - activeQte.stepElapsed);
    qteSubstatus.textContent = `Nhấp [${step.keyLabel}]: ${activeQte.mashCount} / ${step.targetCount} (${remaining.toFixed(1)}s)`;
    if (activeQte.stepElapsed >= step.duration) {
      triggerQteFailSafe();
    }
  }
}

function handleQteActionInput(inputCode) {
  if (!activeQte) return;
  const step = activeQte.zone.steps[activeQte.stepIndex];

  const matchesKey =
    inputCode === 'CLICK' ||
    (step.key === 'SPACE' && inputCode === 'Space') ||
    (step.key === 'KeyF' && inputCode === 'KeyF');

  if (!matchesKey) return;

  if (step.mode === 'timing') {
    const progress = activeQte.stepElapsed / step.duration;
    if (progress >= step.sweetSpotStart * 0.78 && progress <= step.sweetSpotEnd + 0.05) {
      sound.playQteHit(activeQte.stepIndex);
      vfx.triggerShake(11, 0.26);
      vfx.triggerFlash(0.38, '#fef08a', 2.8);
      vfx.spawnCelebrationBurst(player.x + 16, player.y - 54, 24);

      player.pose = step.actionPose;
      player.poseTimer = 0;
      player.poseHoldDuration = 1.1;

      if (activeQte.stepIndex + 1 < activeQte.zone.steps.length) {
        activeQte.stepIndex++;
        setupCurrentQteStep();
      } else {
        completeActiveQte();
      }
    } else {
      triggerQteFailSafe();
    }
  } else if (step.mode === 'mash') {
    activeQte.mashCount++;
    player.pose = step.actionPose;
    player.poseTimer = 0;
    player.poseHoldDuration = 1.15;

    updateMashRingVisual(activeQte.mashCount, step.targetCount);

    if (activeQte.id === 'qte_1a') {
      sound.playHammerHit(activeQte.mashCount);
      vfx.triggerShake(9, 0.2);
      vfx.spawnCelebrationBurst(2325, getGroundY(2325) - 60, 16);
    } else if (activeQte.id === 'qte_3b') {
      tankProgress = activeQte.mashCount / step.targetCount;
      sound.playQteHit(activeQte.mashCount);
      vfx.triggerShake(10, 0.22);
      vfx.spawnCelebrationBurst(2520 + tankProgress * 115, getGroundY(2600) - 48, 18);
    } else {
      sound.playQteHit(activeQte.mashCount);
    }

    if (activeQte.mashCount >= step.targetCount) {
      completeActiveQte();
    }
  }
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

function completeActiveQte() {
  if (!activeQte) return;
  const finishedZone = activeQte.zone;
  completedQtes.add(finishedZone.id);

  activeQte = null;
  qteOverlay.classList.add('hidden');
  vfx.setSlowMotion(false);
  targetCameraZoom = 1.0;

  switch (finishedZone.rewardEffect) {
    case 'grain_burst': {
      vfx.setGranaryLiberated(true);
      sound.playQteVictory();
      sound.playExplosion(0.7);
      vfx.spawnGrainBurst(2325, getGroundY(2325));
      vfx.triggerFlash(0.82, '#fef08a', 1.7);
      vfx.triggerShake(18, 0.5);
      snapPlayerToSurface(2375);
      break;
    }
    case 'independence_dawn': {
      sound.playQteVictory();
      vfx.spawnCelebrationBurst(2710, getGroundY(2710) - 105, 80);
      vfx.triggerFlash(0.88, '#fffbeb', 1.4);
      vfx.triggerShake(15, 0.45);
      snapPlayerToSurface(2690);
      player.pose = 'flag_raise';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.6;
      break;
    }
    case 'trench_blast': {
      sound.playExplosion(1.2);
      sound.playQteVictory();
      vfx.spawnExplosion(2350, getGroundY(2350), 1.3);
      vfx.triggerFlash(0.78, '#fed7aa', 1.85);
      vfx.triggerShake(20, 0.52);
      snapPlayerToSurface(2450, 'p2_trench_plank2');
      player.pose = 'leap_trench';
      player.poseTimer = 0;
      player.poseHoldDuration = 0.85;
      break;
    }
    case 'dien_bien_victory': {
      sound.playExplosion(1.1);
      sound.playQteVictory();
      vfx.spawnExplosion(2680, baseGroundY - 56, 1.2);
      vfx.spawnCelebrationBurst(2690, baseGroundY - 145, 95);
      vfx.triggerFlash(0.9, '#fef08a', 1.35);
      vfx.triggerShake(22, 0.58);
      snapPlayerToSurface(2685, 'p2_bunker_roof');
      player.pose = 'bunker_flag';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.8;
      break;
    }
    case 'shockwave_guard': {
      sound.playExplosion(1.0);
      sound.playQteVictory();
      vfx.spawnExplosion(2040, getGroundY(2040), 1.15);
      vfx.spawnShockwave(2095, getGroundY(2095) - 46, '#fde047', 260, 0.8);
      vfx.triggerFlash(0.75, '#fef3c7', 1.85);
      vfx.triggerShake(17, 0.48);
      snapPlayerToSurface(2165);
      break;
    }
    case 'reunification_victory': {
      tankProgress = 1;
      sound.playQteVictory();
      sound.playExplosion(0.8);
      vfx.spawnCelebrationBurst(2645, getGroundY(2645) - 82, 100);
      vfx.triggerFlash(0.92, '#fffbeb', 1.3);
      vfx.triggerShake(20, 0.55);
      snapPlayerToSurface(2655);
      player.pose = 'tank_charge';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.8;
      break;
    }
  }

  if (finishedZone.banner) {
    if (pendingMilestoneTimer) clearTimeout(pendingMilestoneTimer);
    pendingMilestoneTimer = setTimeout(() => {
      pendingMilestoneTimer = null;
      openStoryModal({
        tag: finishedZone.banner.badge,
        title: finishedZone.banner.title,
        content: finishedZone.banner.quote,
        note: finishedZone.banner.note,
      });
    }, 900);
  }
}

function triggerQteFailSafe() {
  if (!activeQte) return;
  const retryZone = activeQte.zone;

  activeQte = null;
  qteOverlay.classList.add('hidden');
  vfx.setSlowMotion(false);
  targetCameraZoom = 1.0;

  if (retryZone.id === 'qte_3b') {
    tankProgress = 0;
  }

  sound.playQteRetry();
  player.pose = null;
  snapPlayerToSurface(Math.max(95, retryZone.x - 145));

  failSafeActive = true;
  failsafeOverlay.classList.remove('hidden');

  if (failSafeTimer) clearTimeout(failSafeTimer);
  failSafeTimer = setTimeout(() => {
    failSafeActive = false;
    failsafeOverlay.classList.add('hidden');
  }, 1500);
}

// ==================== CINEMATIC TRANSITION & AUTO-WALK ENGINE ====================
function clearTransientOverlays() {
  if (pendingMilestoneTimer) {
    clearTimeout(pendingMilestoneTimer);
    pendingMilestoneTimer = null;
  }
  if (failSafeTimer) {
    clearTimeout(failSafeTimer);
    failSafeTimer = null;
  }
  failSafeActive = false;
  failsafeOverlay.classList.add('hidden');

  activeQte = null;
  qteOverlay.classList.add('hidden');
  vfx.setSlowMotion(false);
  targetCameraZoom = 1.0;

  closeStoryModal();
  closeChapterDrawer();
  hideCinematicCaption();
  incenseHud.classList.add('hidden');
  finaleOverlay.classList.add('hidden');
  sound.updateIncenseCharge(0, false);
}

/** Khởi tạo Màn mới và cho nhân vật Auto-Walk từ rìa trái (-45 -> 180) */
function beginActFromLeft(actId) {
  currentAct = actId;
  updateDrawerActiveState(actId);
  vfx.clearSceneParticles();
  renderer.resetScarfTrail();
  sound.setAct(actId);

  player.costumeOverride = null;
  player.wearingHat = true;
  player.pose = null;
  player.facing = 1;
  snapPlayerToSurface(WORLD_CONFIG.enterStartX);

  cameraX = 0;

  transitionState.active = true;
  transitionState.subPhase = 'ENTER_LEFT';
  transitionState.targetAct = actId;

  triggerActTopHudIntro(actId, WORLD_CONFIG.enterTargetX);
}

/** Khởi tạo cuối Màn trước khi đi lùi và Auto-Walk từ rìa phải (3040 -> 2750) */
function beginActFromRight(actId) {
  currentAct = actId;
  updateDrawerActiveState(actId);
  vfx.clearSceneParticles();
  renderer.resetScarfTrail();
  sound.setAct(actId);

  player.costumeOverride = null;
  player.wearingHat = true;
  player.pose = null;
  player.facing = -1;
  snapPlayerToSurface(WORLD_CONFIG.backReturnStartX);

  cameraX = Math.max(0, WORLD_CONFIG.actWidth - viewportWidth);

  transitionState.active = true;
  transitionState.subPhase = 'ENTER_FROM_RIGHT';
  transitionState.targetAct = actId;

  triggerActTopHudIntro(actId, WORLD_CONFIG.backReturnTargetX);
}

/** Bắt đầu chuỗi chuyển màn tiến về phía phải (khi người chơi ấn D qua localX >= 2820) */
function startForwardActTransition() {
  const actCfg = ACTS.find((a) => a.id === currentAct);
  if (!actCfg || currentAct >= 4) return;

  // Put player cleanly on terrain floor for smooth cinematic walk
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
}

/** Bắt đầu chuỗi chuyển màn lùi về phía trái (khi ấn A lùi qua localX < 80 ở Màn 2, 3, 4) */
function startBackwardActTransition() {
  if (currentAct <= 1) return;

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
}

/** Chọn nhảy nhanh tới Màn từ Pop-up Menu [ ☰ Chương / Màn ] */
function jumpToChapterFromMenu(actNumber) {
  sound.init();
  clearTransientOverlays();

  // Đánh dấu hoàn thành các màn trước đó và làm mới các QTE từ màn được chọn trở đi để thuyết trình mượt mà
  QTE_ZONES.forEach((q) => {
    if (q.act < actNumber) {
      completedQtes.add(q.id);
      if (q.id === 'qte_1a') vfx.setGranaryLiberated(true);
      if (q.id === 'qte_3b') tankProgress = 1;
    } else {
      completedQtes.delete(q.id);
      if (q.id === 'qte_1a') vfx.setGranaryLiberated(false);
      if (q.id === 'qte_3b') tankProgress = 0;
    }
  });

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
}

function advanceAutoWalk(dt, dir, speed = AUTO_WALK_SPEED) {
  player.facing = dir;
  player.vx = dir * speed;
  player.x += player.vx * dt;
  player.dy = sampleGroundOffset(currentAct, Math.max(0, Math.min(WORLD_CONFIG.actWidth, player.x)));
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
        // Người Ông trao chiếc mũ cho Người Cha trong 2.5 giây
        player.pose = 'handoff_give';
        player.poseTimer = transitionState.ceremonyProgress;
        if (transitionState.ceremonyProgress >= 0.55 && !transitionState.hatSparkSpawned) {
          transitionState.hatSparkSpawned = true;
          player.wearingHat = false;
          vfx.spawnCelebrationBurst(2842, player.y - 72, 22);
        }
      } else if (currentAct === 3) {
        // Khói lửa chiến trường tan thành hạt sáng bình minh bên cạnh Người Cháu
        vfx.spawnDawnTransformation(2840, player.y);
      }

      if (transitionState.ceremonyTimer >= transitionState.ceremonyDuration) {
        hideCinematicCaption();
        // Thế hệ kế tiếp bước tiếp qua rìa phải màn hình (localX > 3050)
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
  tankProgress = 0;
  jumpToChapterFromMenu(1);
}

// ==================== INPUT LISTENERS ====================
async function startGameExperience() {
  if (gameStarted) return;
  gameStarted = true;
  await sound.init();

  introOverlay.classList.add('fade-out');
  setTimeout(() => {
    introOverlay.classList.add('hidden');
  }, 600);

  transitionState.fadeAlpha = 1;
  beginActFromLeft(1);
}

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
        beginActFromLeft(actId);
      });
    } else {
      jumpToChapterFromMenu(actId);
    }
  });
});

document.addEventListener('click', (e) => {
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

btnCloseModal.addEventListener('click', closeStoryModal);
storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) closeStoryModal();
});

qteRingStage.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handleQteActionInput('CLICK');
});

btnHoldIncense.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  mouseHoldingIncense = true;
});
window.addEventListener('pointerup', () => {
  mouseHoldingIncense = false;
});
window.addEventListener('pointercancel', () => {
  mouseHoldingIncense = false;
});

btnReplay.addEventListener('click', replayFromBeginning);

// Click on nearby artifact on canvas
canvas.addEventListener('click', (e) => {
  if (!gameStarted || modalState.open || activeQte || failSafeActive || transitionState.active) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const clickWorldX = e.clientX - rect.left + cameraX;
  const clickedItem = interactablesState.find(
    (it) =>
      it.act === currentAct &&
      Math.abs(it.x - clickWorldX) < 52 &&
      nearbyInteractable &&
      nearbyInteractable.id === it.id
  );
  if (clickedItem) {
    clickedItem.visited = true;
    openStoryModal({
      tag: `${ACTS[clickedItem.act - 1].period} • ${clickedItem.tag}`,
      title: clickedItem.title,
      content: clickedItem.content,
    });
  }
});

window.addEventListener('keydown', (e) => {
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

  // Modal controls
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

  // Finale screen
  if (finaleState.overlayShown) {
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
      e.preventDefault();
      replayFromBeginning();
    }
    return;
  }

  // Active QTE
  if (activeQte) {
    if ((e.code === 'Space' || e.code === 'KeyF') && !e.repeat) {
      e.preventDefault();
      handleQteActionInput(e.code);
    }
    return;
  }

  // Block gameplay keys during cinematic auto-walk transition
  if (transitionState.active) return;

  // Interactable [E]
  if (e.code === 'KeyE' && !e.repeat && !failSafeActive && nearbyInteractable) {
    e.preventDefault();
    nearbyInteractable.visited = true;
    openStoryModal({
      tag: `${ACTS[nearbyInteractable.act - 1].period} • ${nearbyInteractable.tag}`,
      title: nearbyInteractable.title,
      content: nearbyInteractable.content,
    });
    return;
  }

  // Jump [W] or [ArrowUp]
  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !e.repeat) {
    e.preventDefault();
    player.jumpBufferTimer = 0.13;
  }

  // Drop-through platform [S] or [ArrowDown]
  if ((e.code === 'KeyS' || e.code === 'ArrowDown') && !e.repeat) {
    e.preventDefault();
    if (player.onGround && player.currentPlatformId !== null) {
      player.ignoredPlatformId = player.currentPlatformId;
      player.dropThroughTimer = 0.28;
      player.currentPlatformId = null;
      player.onGround = false;
      player.vy = 115;
    }
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
    e.code === 'KeyF'
  ) {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    keysDown.add(e.code);
  }
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.code);
});

window.addEventListener('blur', () => {
  keysDown.clear();
  mouseHoldingIncense = false;
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

  // Execute Jump if buffered & within coyote ground grace
  const holdingIncenseNow =
    currentAct === 4 &&
    Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius &&
    (keysDown.has('KeyF') || mouseHoldingIncense);

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0 && !holdingIncenseNow) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.currentPlatformId = null;
    player.jumpBufferTimer = 0;
    player.coyoteTimer = 0;
    sound.playJump();
  }

  // Horizontal movement (A/D or Left/Right)
  const moveLeft = keysDown.has('KeyA') || keysDown.has('ArrowLeft');
  const moveRight = keysDown.has('KeyD') || keysDown.has('ArrowRight');
  const inputDir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);

  if (inputDir !== 0 && !holdingIncenseNow) {
    player.facing = inputDir;
    player.vx += inputDir * player.accel * rawDt;
    player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));
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

  // Solid low obstacles check (e.g. Hanoi barricade & Trường Sơn fallen log -> prompts [W] jump!)
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
        // Walked off platform edge
        player.onGround = false;
        player.currentPlatformId = null;
      } else {
        player.dy = plat.dy;
      }
    } else {
      // Stick smoothly to continuous sloped/sunken terrain
      player.dy = sampleGroundOffset(currentAct, player.x);
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
      // Đi ngược về Màn cũ (localX < 80 khi đang lùi trái)
      startBackwardActTransition();
      return;
    }
    player.x = WORLD_CONFIG.backTriggerX;
    player.vx = 0;
  }

  if (currentAct < 4 && player.x >= WORLD_CONFIG.exitTriggerX) {
    // Kiểm tra đã hoàn thành QTE nhiệm vụ lịch sử của màn chưa
    const actQtes = QTE_ZONES.filter((q) => q.act === currentAct);
    const allCompleted = actQtes.every((q) => completedQtes.has(q.id));
    if (!allCompleted) {
      player.x = WORLD_CONFIG.exitTriggerX - 4;
      player.vx = 0;
      showTemporaryCaption(
        'Hãy hoàn thành sự kiện lịch sử phía trước để tiếp bước sang màn tiếp theo.',
        2600
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

// ==================== MAIN 60FPS GAME LOOP ====================
let lastFrameTime = performance.now();

function gameLoop(now) {
  const rawDt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  const scaledDt = vfx.update(rawDt, {
    act: currentAct,
    playerX: player.x,
    cameraX,
    width: viewportWidth,
    height: viewportHeight,
    getGroundY,
    activeQteId: activeQte ? activeQte.id : null,
  });

  if (activeQte) {
    updateActiveQte(rawDt);
  }

  if (player.pose && player.pose !== 'bow_incense' && player.pose !== 'handoff_give') {
    player.poseTimer += rawDt;
    if (player.poseTimer >= player.poseHoldDuration) {
      player.pose = null;
    }
  }

  if (transitionState.active) {
    nearbyInteractable = null;
    nearbyObstacleHint = null;
    updateCinematicTransition(rawDt);
  } else {
    const canControl =
      gameStarted &&
      !modalState.open &&
      !activeQte &&
      !failSafeActive &&
      !finaleState.overlayShown &&
      !finaleState.completed;

    if (canControl) {
      updatePlatformerPhysics(rawDt);
    } else {
      player.vx = 0;
      player.y = baseGroundY + player.dy;
    }
  }

  // Update dynamic Sub-Location Name in Top HUD as player moves through historical zones
  if (gameStarted) {
    const liveZone = getZoneName(currentAct, player.x);
    if (contextLocation.textContent !== liveZone) {
      contextLocation.textContent = liveZone;
    }
  }

  // Check nearby Interactable [E] (both horizontal X and vertical Y platform proximity!)
  nearbyInteractable = null;
  if (gameStarted && !transitionState.active && !activeQte) {
    const actCfg = ACTS.find((a) => a.id === currentAct) || ACTS[0];
    let bestDist = WORLD_CONFIG.interactRadiusX;
    for (const item of interactablesState) {
      if (item.act !== currentAct) continue;
      let itemY = getGroundY(item.x);
      if (item.platformId) {
        const plat = actCfg.platforms.find((p) => p.id === item.platformId);
        if (plat) itemY = baseGroundY + plat.dy;
      }
      const dx = Math.abs(player.x - item.x);
      const dy = Math.abs(player.y - itemY);
      if (dx < bestDist && dy < WORLD_CONFIG.interactRadiusY) {
        bestDist = dx;
        nearbyInteractable = item;
      }
    }
  }

  // Early siren tension cue approaching danger zones
  if (
    gameStarted &&
    !activeQte &&
    !transitionState.active &&
    ((currentAct === 1 && !completedQtes.has('qte_1a') && player.x > 2080 && player.x < 2240) ||
      (currentAct === 2 && !completedQtes.has('qte_2a') && player.x > 2130 && player.x < 2280) ||
      (currentAct === 3 && !completedQtes.has('qte_3a') && player.x > 1830 && player.x < 1980))
  ) {
    sound.playSiren();
  }

  // Check QTE triggers in current Act
  if (gameStarted && !activeQte && !modalState.open && !failSafeActive && !transitionState.active) {
    for (const zone of QTE_ZONES) {
      if (
        zone.act === currentAct &&
        !completedQtes.has(zone.id) &&
        Math.abs(player.x - zone.x) <= zone.triggerRadius
      ) {
        startQte(zone);
        break;
      }
    }
  }

  // Act 4 Finale Event (localX = 2560): Đài tưởng niệm Tổ quốc ghi công
  if (gameStarted && currentAct === 4 && !transitionState.active) {
    if (!finaleState.completed) {
      const nearMonument = Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius;
      incenseHud.classList.toggle('hidden', !nearMonument || modalState.open);

      if (nearMonument && !modalState.open) {
        const isHoldingF = keysDown.has('KeyF') || mouseHoldingIncense;
        const altarX = FINALE_EVENT.x - 60;
        const altarTopY = getGroundY(FINALE_EVENT.x) - 82;

        if (isHoldingF) {
          player.pose = 'bow_incense';
          player.facing = 1;
          finaleState.holdProgress = Math.min(
            1,
            finaleState.holdProgress + rawDt / FINALE_EVENT.holdDuration
          );
          vfx.spawnIncenseSmoke(altarX, altarTopY, 0.5 + finaleState.holdProgress * 0.9);
          sound.updateIncenseCharge(finaleState.holdProgress, true);

          if (finaleState.holdProgress >= 1) {
            finaleState.completed = true;
            finaleState.postTimer = 0;
            incenseHud.classList.add('hidden');
            sound.playIncenseComplete();
            vfx.triggerFlash(0.62, '#fef9c3', 1.2);
            vfx.spawnCelebrationBurst(altarX, altarTopY - 12, 48);
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
      const altarX = FINALE_EVENT.x - 60;
      const altarTopY = getGroundY(FINALE_EVENT.x) - 82;
      player.pose = 'bow_incense';
      player.facing = 1;
      vfx.spawnIncenseSmoke(altarX, altarTopY, 1.1);
      finaleState.spiritsAlpha = Math.min(1, finaleState.spiritsAlpha + rawDt * 0.75);
      finaleState.postTimer += rawDt;

      if (!finaleState.overlayShown && finaleState.postTimer >= FINALE_EVENT.spiritViewingDelay) {
        finaleState.overlayShown = true;
        finaleOverlay.classList.remove('hidden');
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
  cameraZoom += (targetCameraZoom - cameraZoom) * Math.min(1, rawDt * 5.5);

  renderer.render(
    ctx,
    {
      act: currentAct,
      width: viewportWidth,
      height: viewportHeight,
      baseGroundY,
      getGroundY,
      cameraX,
      cameraZoom,
      player,
      interactables: interactablesState,
      nearbyInteractable,
      nearbyObstacleHint,
      completedQtes,
      activeQte,
      tankProgress,
      transitionState,
      finaleState,
      dt: scaledDt,
    },
    vfx
  );

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
