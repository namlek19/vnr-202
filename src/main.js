import {
  WORLD_CONFIG,
  ACTS,
  INTERACTABLES,
  QTE_ZONES,
  HANDOFF_EVENT,
  FINALE_EVENT,
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

const actButtons = Array.from(document.querySelectorAll('.act-btn'));
const roleIndicator = document.getElementById('role-indicator');
const journeyProgressFill = document.getElementById('journey-progress-fill');
const btnAudio = document.getElementById('btn-audio');
const audioIcon = document.getElementById('audio-icon');
const audioLabel = document.getElementById('audio-label');

const actBanner = document.getElementById('act-banner');
const bannerPeriod = document.getElementById('banner-period');
const bannerTitle = document.getElementById('banner-title');
const bannerSub = document.getElementById('banner-sub');

const handoffToast = document.getElementById('handoff-toast');
const handoffText = document.getElementById('handoff-text');

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

// Populate static Finale content from storyData.js
incensePrompt.textContent = FINALE_EVENT.promptText;
failsafeText.textContent = FINALE_EVENT.failSafeMessage;
handoffText.textContent = HANDOFF_EVENT.captionText;
finaleQuoteText.textContent = FINALE_EVENT.quoteText;
finaleQuoteAuthor.textContent = FINALE_EVENT.quoteAuthor;
finaleLessonTitle.textContent = FINALE_EVENT.lessonTitle;
finaleLessonText.textContent = FINALE_EVENT.lessonText;
btnReplay.querySelector('span').textContent = `✦ ${FINALE_EVENT.replayButtonLabel} ✦`;

// ==================== GAME STATE ====================
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let groundY = Math.round(viewportHeight * 0.78);

const interactablesState = INTERACTABLES.map((item) => ({
  ...item,
  visited: false,
}));

const completedQtes = new Set();

const player = {
  x: WORLD_CONFIG.startX,
  vx: 0,
  maxSpeed: 325,
  accel: 1850,
  friction: 1600,
  facing: 1,
  walkCycle: 0,
  nextStepCycle: Math.PI,
  pose: null,
  poseTimer: 0,
  poseHoldDuration: 0,
};

let cameraX = 0;
let cameraZoom = 1.0;
let targetCameraZoom = 1.0;

let gameStarted = false;
let currentAct = 1;
let bannerTimeout = null;

// Input state
const keysDown = new Set();
let mouseHoldingIncense = false;

// Nearby interactable
let nearbyInteractable = null;

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
let activeQte = null; // { zone, stepIndex, stepElapsed, mashCount }
let pendingMilestoneTimer = null;
let failSafeActive = false;
let failSafeTimer = null;
let tankProgress = 0;

// Act 3 Generational Handoff state (x = 6100)
let handoffGlow = 0;
let handoffShown = false;
let handoffHideTimer = null;

// Act 4 Finale Monument state (x = 11400)
const finaleState = {
  holdProgress: 0,
  completed: false,
  spiritsAlpha: 0,
  postTimer: 0,
  overlayShown: false,
};

// ==================== VIEWPORT RESIZE ====================
function updateCanvasSize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  groundY = Math.round(viewportHeight * 0.78);

  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', updateCanvasSize);
updateCanvasSize();

// ==================== UI & CHAPTER HELPERS ====================
function showActBanner(actId) {
  const act = ACTS.find((a) => a.id === actId) || ACTS[0];
  bannerPeriod.textContent = `MÀN ${act.id} • ${act.period}`;
  bannerTitle.textContent = act.title;
  bannerSub.textContent = act.subtitle;

  actBanner.classList.add('visible');
  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => {
    actBanner.classList.remove('visible');
  }, 3800);
}

function syncActUi(actId, announce = true) {
  currentAct = actId;
  const act = ACTS.find((a) => a.id === actId) || ACTS[0];

  actButtons.forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.act) === actId);
  });
  roleIndicator.textContent = act.roleLabel;

  sound.setAct(actId);
  if (announce) {
    showActBanner(actId);
  }
}

// ==================== STORYTELLING MODAL (TYPEWRITER) ====================
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

  modalHint.innerHTML =
    'Ấn <kbd>SPACE</kbd> hiện toàn bộ • Ấn <kbd>E</kbd> để đóng và đi tiếp';

  canvas.classList.add('canvas-blurred');
  storyModal.classList.remove('hidden');
  sound.playModalOpen();

  modalState.timerId = setInterval(() => {
    if (modalState.charIndex < modalState.fullText.length) {
      // Advance 2 chars per tick (~18ms) for smooth readable cadence
      modalState.charIndex = Math.min(
        modalState.fullText.length,
        modalState.charIndex + 2
      );
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
  player.facing = 1;
  if (zone.id === 'qte_3b') {
    tankProgress = 0;
  }

  vfx.setSlowMotion(true);
  targetCameraZoom = 1.12;
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
    qteSubstatus.textContent = 'Chờ vòng trắng thu vào vùng sáng vàng...';
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

    // Map progress [0..1] to ring scale [1.22 .. 0.36]
    // At progress ~0.62, scale is ~0.68 -> aligns right with the 104px target ring
    const ringScale = 1.22 - progress * 0.86;
    qteShrinkingRing.style.transform = `scale(${ringScale.toFixed(3)})`;

    const inSweet =
      progress >= step.sweetSpotStart && progress <= step.sweetSpotEnd;
    qteTargetZone.classList.toggle('in-sweet-spot', inSweet);
    qteSubstatus.textContent = inSweet
      ? `✦ BẤM [${step.keyLabel}] NGAY! ✦`
      : 'Canh vòng sáng chạm viền vàng...';
  } else if (step.mode === 'mash') {
    const remaining = Math.max(0, step.duration - activeQte.stepElapsed);
    qteSubstatus.textContent = `Nhấp liên tiếp [${step.keyLabel}]: ${activeQte.mashCount} / ${step.targetCount} (${remaining.toFixed(1)}s)`;
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
    // Generous presentation-friendly window with early-press guard
    if (progress >= step.sweetSpotStart * 0.78 && progress <= step.sweetSpotEnd + 0.05) {
      // Hit!
      sound.playQteHit(activeQte.stepIndex);
      vfx.triggerShake(12, 0.28);
      vfx.triggerFlash(0.42, '#fef08a', 2.8);
      vfx.spawnCelebrationBurst(player.x + 18, groundY - 58, 28);

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
      // Pressed way too early -> Fail-safe retry
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
      vfx.triggerShake(10, 0.2);
      vfx.spawnCelebrationBurst(2335, groundY - 62, 18);
    } else if (activeQte.id === 'qte_3b') {
      tankProgress = activeQte.mashCount / step.targetCount;
      sound.playQteHit(activeQte.mashCount);
      vfx.triggerShake(11, 0.22);
      vfx.spawnCelebrationBurst(8640 + tankProgress * 95, groundY - 48, 20);
    } else {
      sound.playQteHit(activeQte.mashCount);
    }

    if (activeQte.mashCount >= step.targetCount) {
      completeActiveQte();
    }
  }
}

function completeActiveQte() {
  if (!activeQte) return;
  const finishedZone = activeQte.zone;
  completedQtes.add(finishedZone.id);

  activeQte = null;
  qteOverlay.classList.add('hidden');
  vfx.setSlowMotion(false);
  targetCameraZoom = 1.0;

  // Execute signature climax payoff for each QTE
  switch (finishedZone.rewardEffect) {
    case 'grain_burst': {
      sound.playQteVictory();
      sound.playExplosion(0.75);
      vfx.spawnGrainBurst(2335, groundY);
      vfx.triggerFlash(0.88, '#fef08a', 1.7);
      vfx.triggerShake(20, 0.55);
      player.x = 2385;
      break;
    }
    case 'independence_dawn': {
      sound.playQteVictory();
      vfx.spawnCelebrationBurst(2780, groundY - 110, 95);
      vfx.triggerFlash(0.92, '#fffbeb', 1.35);
      vfx.triggerShake(16, 0.48);
      player.x = 2765;
      player.pose = 'flag_raise';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.6;
      break;
    }
    case 'trench_blast': {
      sound.playExplosion(1.25);
      sound.playQteVictory();
      vfx.spawnExplosion(5350, groundY, 1.35);
      vfx.triggerFlash(0.82, '#fed7aa', 1.85);
      vfx.triggerShake(22, 0.55);
      player.x = 5435;
      player.pose = 'leap_trench';
      player.poseTimer = 0;
      player.poseHoldDuration = 0.85;
      break;
    }
    case 'dien_bien_victory': {
      sound.playExplosion(1.15);
      sound.playQteVictory();
      vfx.spawnExplosion(5775, groundY - 35, 1.25);
      vfx.spawnCelebrationBurst(5785, groundY - 155, 105);
      vfx.triggerFlash(0.94, '#fef08a', 1.35);
      vfx.triggerShake(24, 0.62);
      player.x = 5785;
      player.pose = 'bunker_flag';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.8;
      break;
    }
    case 'shockwave_guard': {
      sound.playExplosion(1.05);
      sound.playQteVictory();
      vfx.spawnExplosion(8085, groundY, 1.2);
      vfx.spawnShockwave(8145, groundY - 48, '#fde047', 280, 0.85);
      vfx.triggerFlash(0.78, '#fef3c7', 1.85);
      vfx.triggerShake(18, 0.5);
      player.x = 8195;
      break;
    }
    case 'reunification_victory': {
      tankProgress = 1;
      sound.playQteVictory();
      sound.playExplosion(0.85);
      vfx.spawnCelebrationBurst(8735, groundY - 85, 115);
      vfx.triggerFlash(0.95, '#fffbeb', 1.3);
      vfx.triggerShake(22, 0.6);
      player.x = 8745;
      player.pose = 'tank_charge';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.8;
      break;
    }
  }

  // If QTE has a historical proclamation / transition banner, show after brief dramatic beat
  if (finishedZone.banner) {
    if (pendingMilestoneTimer) clearTimeout(pendingMilestoneTimer);
    pendingMilestoneTimer = setTimeout(() => {
      openStoryModal({
        tag: finishedZone.banner.badge,
        title: finishedZone.banner.title,
        content: finishedZone.banner.quote,
        note: finishedZone.banner.note,
      });
    }, 950);
  }
}

/**
 * Cơ chế Fail-safe thuyết trình (KHÔNG BAO GIỜ CHẾT):
 * Làm mờ 1.5s kèm thông điệp khích lệ, lùi nhẹ nhân vật để thực hiện lại ngay.
 */
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
  player.vx = 0;
  player.pose = null;
  player.x = Math.max(WORLD_CONFIG.minX, retryZone.x - 155);

  failSafeActive = true;
  failsafeOverlay.classList.remove('hidden');

  if (failSafeTimer) clearTimeout(failSafeTimer);
  failSafeTimer = setTimeout(() => {
    failSafeActive = false;
    failsafeOverlay.classList.add('hidden');
  }, 1500);
}

// ==================== TELEPORT & REPLAY ====================
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
  incenseHud.classList.add('hidden');
  finaleOverlay.classList.add('hidden');
  sound.updateIncenseCharge(0, false);
}

function teleportToAct(actNumber) {
  sound.init();
  clearTransientOverlays();

  const targetAct = ACTS.find((a) => a.id === actNumber) || ACTS[0];
  player.x = targetAct.spawnX;
  player.vx = 0;
  player.facing = 1;
  player.pose = null;

  // Reset QTEs belonging to this Act (and subsequent Acts) so presenters can always demo live!
  QTE_ZONES.forEach((q) => {
    if (q.act >= actNumber) {
      completedQtes.delete(q.id);
      if (q.id === 'qte_1a') vfx.setGranaryLiberated(false);
      if (q.id === 'qte_3b') tankProgress = 0;
    }
  });

  if (actNumber <= 3) {
    handoffShown = false;
  }

  if (actNumber <= 4) {
    finaleState.holdProgress = 0;
    finaleState.completed = false;
    finaleState.spiritsAlpha = 0;
    finaleState.postTimer = 0;
    finaleState.overlayShown = false;
  }

  cameraX = Math.max(
    0,
    Math.min(WORLD_CONFIG.totalWidth - viewportWidth, player.x - viewportWidth * 0.36)
  );

  vfx.spawnCelebrationBurst(player.x, groundY - 48, 26);
  syncActUi(actNumber, true);
}

function replayFromBeginning() {
  interactablesState.forEach((item) => {
    item.visited = false;
  });
  completedQtes.clear();
  vfx.resetAll();
  tankProgress = 0;
  handoffGlow = 0;
  handoffShown = false;
  teleportToAct(1);
}

// ==================== INPUT EVENT LISTENERS ====================
async function startGameExperience() {
  if (gameStarted) return;
  gameStarted = true;
  await sound.init();
  introOverlay.classList.add('fade-out');
  setTimeout(() => {
    introOverlay.classList.add('hidden');
  }, 560);
  syncActUi(1, true);
}

btnStartGame.addEventListener('click', startGameExperience);

actButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const actId = Number(btn.dataset.act);
    if (!gameStarted) {
      startGameExperience().then(() => teleportToAct(actId));
    } else {
      teleportToAct(actId);
    }
  });
});

btnAudio.addEventListener('click', async () => {
  await sound.init();
  const isMuted = sound.toggleMute();
  audioIcon.textContent = isMuted ? '🔇' : '🔊';
  audioLabel.textContent = isMuted ? 'Tắt tiếng' : 'Bật tiếng';
});

btnCloseModal.addEventListener('click', () => {
  closeStoryModal();
});

storyModal.addEventListener('click', (e) => {
  if (e.target === storyModal) {
    closeStoryModal();
  }
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

btnReplay.addEventListener('click', () => {
  replayFromBeginning();
});

// Clickable canvas artifact support for touch/projector convenience
canvas.addEventListener('click', (e) => {
  if (!gameStarted || modalState.open || activeQte || failSafeActive) return;
  const rect = canvas.getBoundingClientRect();
  const clickWorldX = e.clientX - rect.left + cameraX;
  const clickedItem = interactablesState.find(
    (it) => Math.abs(it.x - clickWorldX) < 55 && Math.abs(player.x - it.x) < WORLD_CONFIG.interactRadius + 40
  );
  if (clickedItem) {
    clickedItem.visited = true;
    openStoryModal({
      tag: `${ACTS[clickedItem.act - 1].navLabel} • ${clickedItem.tag}`,
      title: clickedItem.title,
      content: clickedItem.content,
    });
  }
});

window.addEventListener('keydown', (e) => {
  // Unlock intro screen with Enter or Space
  if (!gameStarted) {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      startGameExperience();
    }
    return;
  }

  // Mute shortcut [M]
  if (e.code === 'KeyM' && !e.repeat) {
    btnAudio.click();
    return;
  }

  // Modal open controls
  if (modalState.open) {
    if (e.code === 'Escape') {
      e.preventDefault();
      closeStoryModal();
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (!modalState.typingDone) {
        finishTypewriterImmediately();
      } else {
        closeStoryModal();
      }
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

  // Finale screen replay with Enter/Space
  if (finaleState.overlayShown) {
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
      e.preventDefault();
      replayFromBeginning();
    }
    return;
  }

  // Active QTE inputs ([SPACE] & [F])
  if (activeQte) {
    if ((e.code === 'Space' || e.code === 'KeyF') && !e.repeat) {
      e.preventDefault();
      handleQteActionInput(e.code);
    }
    return;
  }

  // Interactable [E]
  if (e.code === 'KeyE' && !e.repeat && !failSafeActive && nearbyInteractable) {
    e.preventDefault();
    nearbyInteractable.visited = true;
    openStoryModal({
      tag: `${ACTS[nearbyInteractable.act - 1].navLabel} • ${nearbyInteractable.tag}`,
      title: nearbyInteractable.title,
      content: nearbyInteractable.content,
    });
    return;
  }

  if (
    e.code === 'ArrowLeft' ||
    e.code === 'ArrowRight' ||
    e.code === 'Space' ||
    e.code === 'KeyA' ||
    e.code === 'KeyD' ||
    e.code === 'KeyF'
  ) {
    if (e.code === 'Space') e.preventDefault();
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

// ==================== MAIN 60FPS GAME LOOP ====================
let lastFrameTime = performance.now();

function gameLoop(now) {
  const rawDt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  // Update VFX & obtain time-dilated dt
  const scaledDt = vfx.update(rawDt, {
    playerX: player.x,
    cameraX,
    width: viewportWidth,
    height: viewportHeight,
    groundY,
    activeQteId: activeQte ? activeQte.id : null,
  });

  // Update QTE state machine if active
  if (activeQte) {
    updateActiveQte(rawDt);
  }

  // Determine whether character locomotion is currently enabled
  const canWalk =
    gameStarted &&
    !modalState.open &&
    !activeQte &&
    !failSafeActive &&
    !finaleState.overlayShown &&
    !finaleState.completed;

  // Update pose timer
  if (player.pose && player.pose !== 'bow_incense') {
    player.poseTimer += rawDt;
    if (player.poseTimer >= player.poseHoldDuration) {
      player.pose = null;
    }
  }

  if (canWalk) {
    const moveLeft = keysDown.has('KeyA') || keysDown.has('ArrowLeft');
    const moveRight = keysDown.has('KeyD') || keysDown.has('ArrowRight');
    const inputDir = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);

    // Block walking while actively holding [F] at the Finale Monument
    const holdingIncenseNow =
      Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius &&
      (keysDown.has('KeyF') || mouseHoldingIncense);

    if (inputDir !== 0 && !holdingIncenseNow) {
      player.facing = inputDir;
      player.vx += inputDir * player.accel * rawDt;
      player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx));
    } else {
      // Smooth deceleration
      if (Math.abs(player.vx) <= player.friction * rawDt) {
        player.vx = 0;
      } else {
        player.vx -= Math.sign(player.vx) * player.friction * rawDt;
      }
    }

    player.x += player.vx * rawDt;
    player.x = Math.max(WORLD_CONFIG.minX, Math.min(WORLD_CONFIG.maxX, player.x));

    // Footstep cadence & skeletal walk cycle
    if (Math.abs(player.vx) > 20) {
      const cycleSpeed = (Math.abs(player.vx) / player.maxSpeed) * 10.5;
      player.walkCycle += rawDt * cycleSpeed;
      if (player.walkCycle >= player.nextStepCycle) {
        player.nextStepCycle += Math.PI;
        sound.playFootstep(currentAct);
      }
    } else {
      player.walkCycle = 0;
      player.nextStepCycle = Math.PI * 0.6;
    }
  } else {
    player.vx = 0;
  }

  // Update Act transitions smoothly
  const detectedAct = Math.min(4, Math.max(1, Math.floor(player.x / WORLD_CONFIG.actWidth) + 1));
  if (gameStarted && detectedAct !== currentAct) {
    vfx.spawnCelebrationBurst(player.x, groundY - 52, 24);
    syncActUi(detectedAct, true);
  }

  // Update Top Progress Bar
  const journeyRatio = Math.max(0.01, Math.min(1, player.x / WORLD_CONFIG.maxX));
  journeyProgressFill.style.width = `${(journeyRatio * 100).toFixed(1)}%`;

  // Check nearby Interactable [E]
  nearbyInteractable = null;
  let bestDist = WORLD_CONFIG.interactRadius;
  for (const item of interactablesState) {
    const dist = Math.abs(player.x - item.x);
    if (dist < bestDist) {
      bestDist = dist;
      nearbyInteractable = item;
    }
  }

  // Early siren tension cue approaching danger zones
  if (
    gameStarted &&
    !activeQte &&
    ((!completedQtes.has('qte_1a') && player.x > 2080 && player.x < 2240) ||
      (!completedQtes.has('qte_2a') && player.x > 5120 && player.x < 5280) ||
      (!completedQtes.has('qte_3a') && player.x > 7860 && player.x < 8020))
  ) {
    sound.playSiren();
  }

  // Check QTE Zone triggers
  if (gameStarted && !activeQte && !modalState.open && !failSafeActive) {
    for (const zone of QTE_ZONES) {
      if (!completedQtes.has(zone.id) && Math.abs(player.x - zone.x) <= zone.triggerRadius) {
        startQte(zone);
        break;
      }
    }
  }

  // Act 3 Opening Event (x = 6100): Người Ông trao chiếc mũ cho Người Cha
  const inHandoffRange =
    player.x >= HANDOFF_EVENT.triggerMinX && player.x <= HANDOFF_EVENT.triggerMaxX;
  handoffGlow += ((inHandoffRange ? 1 : 0) - handoffGlow) * Math.min(1, rawDt * 4.5);

  if (gameStarted && inHandoffRange && !handoffShown) {
    handoffShown = true;
    vfx.spawnCelebrationBurst(HANDOFF_EVENT.x + 24, groundY - 70, 26);
    handoffToast.classList.remove('hidden');
    if (handoffHideTimer) clearTimeout(handoffHideTimer);
    handoffHideTimer = setTimeout(() => {
      handoffToast.classList.add('hidden');
    }, 5200);
  }

  // Act 4 Finale Event (x = 11400): Đài tưởng niệm Tổ quốc ghi công
  if (gameStarted && !finaleState.completed) {
    const nearMonument = Math.abs(player.x - FINALE_EVENT.x) <= FINALE_EVENT.triggerRadius;
    incenseHud.classList.toggle('hidden', !nearMonument || modalState.open);

    if (nearMonument && !modalState.open) {
      const isHoldingF = keysDown.has('KeyF') || mouseHoldingIncense;
      if (isHoldingF) {
        player.pose = 'bow_incense';
        player.facing = 1;
        finaleState.holdProgress = Math.min(
          1,
          finaleState.holdProgress + rawDt / FINALE_EVENT.holdDuration
        );
        vfx.spawnIncenseSmoke(
          FINALE_EVENT.x - 62,
          groundY - 102,
          0.5 + finaleState.holdProgress * 0.9
        );
        sound.updateIncenseCharge(finaleState.holdProgress, true);

        if (finaleState.holdProgress >= 1) {
          finaleState.completed = true;
          finaleState.postTimer = 0;
          incenseHud.classList.add('hidden');
          sound.playIncenseComplete();
          vfx.triggerFlash(0.68, '#fef9c3', 1.15);
          vfx.spawnCelebrationBurst(FINALE_EVENT.x - 62, groundY - 110, 60);
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
  } else if (finaleState.completed) {
    // Sau khi thanh đầy: khói hương vàng bay lên, bóng Người Ông & Người Cha hiện lên mỉm cười,
    // sau 3 giây hiển thị màn hình Kết thúc trang trọng.
    player.pose = 'bow_incense';
    player.facing = 1;
    vfx.spawnIncenseSmoke(FINALE_EVENT.x - 62, groundY - 104, 1.15);
    finaleState.spiritsAlpha = Math.min(1, finaleState.spiritsAlpha + rawDt * 0.75);
    finaleState.postTimer += rawDt;

    if (!finaleState.overlayShown && finaleState.postTimer >= FINALE_EVENT.spiritViewingDelay) {
      finaleState.overlayShown = true;
      finaleOverlay.classList.remove('hidden');
    }
  }

  // Smooth Camera Follow with subtle lookahead
  const lookAhead = player.facing * 95;
  const desiredCamX = Math.max(
    0,
    Math.min(
      WORLD_CONFIG.totalWidth - viewportWidth,
      player.x + lookAhead - viewportWidth * 0.42
    )
  );
  cameraX += (desiredCamX - cameraX) * Math.min(1, rawDt * 6.5);
  cameraZoom += (targetCameraZoom - cameraZoom) * Math.min(1, rawDt * 5.5);

  // Render entire 4-layer Parallax world + Silhouette Character + VFX
  renderer.render(
    ctx,
    {
      width: viewportWidth,
      height: viewportHeight,
      groundY,
      cameraX,
      cameraZoom,
      player,
      interactables: interactablesState,
      nearbyInteractable,
      completedQtes,
      activeQte,
      tankProgress,
      handoffGlow,
      finaleState,
      dt: scaledDt,
    },
    vfx
  );

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

