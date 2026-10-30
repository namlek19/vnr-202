import { ACTS, QTE_ZONES, sampleGroundOffset } from '../data/storyData.js';
import {
  fillRoundedRect,
  drawStar,
  drawPropellerFighter,
  drawFrenchTank,
  drawAntiAircraft37mmBattery,
  drawFollowerComrade,
  drawEnemyGunBunker,
  drawJetFighterEnemy,
} from './artAssets.js';

/**
 * Hệ thống Gameplay Trực Tiếp Trên Bản Đồ (In-World Minigames),
 * Cổng Kiểm Tra Tiến Độ ("Đọc văn kiện mở đường" — Progression Gates)
 * và Đoàn NPC Quần Chúng / Đồng Đội Đi Theo (Followers Squad).
 *
 * Hoàn toàn theo thời gian thực trên Canvas — KHÔNG dùng bảng QTE popup làm dừng game!
 */

const PROGRESSION_GATES = {
  1: 1885, // Trước cụm 3 ụ rơm & Kho thóc Nhật
  2: 2045, // Trước khu Giao thông hào & Cứ điểm Điện Biên Phủ
  3: 1600, // Trước Đồi Pháo cao xạ 37mm & Đại lộ Sài Gòn
  4: 1965, // Trước Đồi Tùng Bách & Đài tưởng niệm Tổ quốc ghi công
};

const ACT1_HAYSTACKS = [
  { x1: 1920, x2: 2005 },
  { x1: 2050, x2: 2135 },
  { x1: 2175, x2: 2260 },
];

const ACT4_LIGHT_PILLARS = [860, 1280, 1640, 1900];

export class InWorldCombatSystem {
  constructor({ sound, vfx, onVictoryBanner }) {
    this.sound = sound;
    this.vfx = vfx;
    this.onVictoryBanner = onVictoryBanner;

    this.clock = 0;
    this.actionCooldown = 0;

    // Đoàn NPC quần chúng / đồng đội nối đuôi nhân vật chính (Màn 1, 2, 3)
    this.followers = [];

    // Thông báo nổi trên đầu nhân vật (ẩn nấp, cảnh báo trúng đạn, nhắc đọc văn kiện...)
    this.playerHeadNotice = null; // { text, tone: 'stealth' | 'warn' | 'gate' | 'info', timer }

    // Đạn, bom xăng parabol, pháo cao xạ, bom rơi có vòng tròn đỏ cảnh báo
    this.projectiles = [];
    this.fallingBombs = [];
    this.tracerLines = [];
    this.airPlanesAct2 = [];

    this.gateUnlockedCelebrated = new Set();

    this.resetAll();
  }

  createFreshStates() {
    this.act1 = {
      granaryHp: 100,
      granaryMaxHp: 100,
      granaryDisplayHp: 100,
      granaryShake: 0,
      beam1X: 2040,
      beam1State: 'normal',
      beam2X: 2490,
      beam2State: 'normal',
      beam2Cycle: 0,
      isHidden: false,
      exposureTimer: 0,
      hitCooldown: 0,
      flagWaves: 0,
      flagTarget: 3,
    };

    this.act2 = {
      // Phase 2A: Phố cổ Hà Nội (localX = 1395)
      tankHp: 60,
      tankMaxHp: 60,
      tankDisplayHp: 60,
      tankDestroyed: false,
      tankFireTimer: 1.2,
      tankMuzzleWarn: false,
      tankHitFlash: 0,

      // Phase 2B: Cứ điểm Điện Biên Phủ (localX = 2080..2780)
      pillboxHp: 150,
      pillboxMaxHp: 150,
      pillboxDisplayHp: 150,
      pillboxShake: 0,
      mgCycleTimer: 0.4,
      mgWarning: false,
      mgFiring: false,
      mgShotAccum: 0,
      bomberTimer: 1.8,
      hitCooldown: 0,
    };

    this.act3 = {
      // Phase 3A: Đồi Pháo cao xạ 37mm (2 khẩu ở 1662 & 1796; 3 máy bay địch 40 HP)
      guns: [
        { x: 1662, recoil: 0, aimAngle: -0.82 },
        { x: 1796, recoil: 0, aimAngle: -0.78 },
      ],
      planes: [
        { id: 0, x: 1640, baseX: 1650, amp: 115, speed: 1.15, phase: 0.2, altOffset: -278, hp: 40, maxHp: 40, displayHp: 40, dir: 1, hitFlash: 0, alive: true },
        { id: 1, x: 1760, baseX: 1745, amp: 135, speed: 0.96, phase: 2.3, altOffset: -242, hp: 40, maxHp: 40, displayHp: 40, dir: -1, hitFlash: 0, alive: true },
        { id: 2, x: 1850, baseX: 1810, amp: 105, speed: 1.32, phase: 4.1, altOffset: -306, hp: 40, maxHp: 40, displayHp: 40, dir: 1, hitFlash: 0, alive: true },
      ],
      aaBombTimer: 1.7,

      // Phase 3B: Đại lộ Sài Gòn & Xe tăng 390 húc cổng Dinh Độc Lập
      bunkers: [
        { id: 1, label: 'Ụ SÚNG ĐỊCH 1', x: 2410, hp: 50, maxHp: 50, displayHp: 50, hitFlash: 0, fireTimer: 0.9, firingAnim: 0 },
        { id: 2, label: 'Ụ SÚNG ĐỊCH 2', x: 2545, hp: 50, maxHp: 50, displayHp: 50, hitFlash: 0, fireTimer: 1.5, firingAnim: 0 },
      ],
      tankX: 2250,
      tankTargetX: 2250,
      tankChargingGate: false,
      tankMoving: false,
      gateCrushRatio: 0,
      hitCooldown: 0,
    };

    this.act4 = {
      activatedPillars: new Set(),
    };
  }

  resetAll() {
    this.followers = [];
    this.projectiles = [];
    this.fallingBombs = [];
    this.tracerLines = [];
    this.airPlanesAct2 = [];
    this.playerHeadNotice = null;
    this.gateUnlockedCelebrated.clear();
    this.createFreshStates();
  }

  clearTransientProjectiles() {
    this.projectiles = [];
    this.fallingBombs = [];
    this.tracerLines = [];
    this.airPlanesAct2 = [];
    this.playerHeadNotice = null;
  }

  /**
   * Đồng bộ trạng thái minigames & đoàn NPC đi theo mỗi khi bước sang màn mới hoặc nhảy Chương
   */
  enterAct(actId, completedQtes, interactablesState, spawnX, getGroundY) {
    this.clearTransientProjectiles();

    // Sync Act 1 state with completedQtes
    if (completedQtes.has('qte_1a')) {
      this.act1.granaryHp = 0;
      this.act1.granaryDisplayHp = 0;
      this.vfx.setGranaryLiberated(true);
    }
    if (completedQtes.has('qte_1b')) {
      this.act1.flagWaves = this.act1.flagTarget;
    }

    // Sync Act 2 state
    if (completedQtes.has('qte_2a')) {
      this.act2.tankHp = 0;
      this.act2.tankDisplayHp = 0;
      this.act2.tankDestroyed = true;
      this.act2.pillboxHp = 0;
      this.act2.pillboxDisplayHp = 0;
    }

    // Sync Act 3 state
    if (completedQtes.has('qte_3a')) {
      this.act3.planes.forEach((p) => {
        p.hp = 0;
        p.displayHp = 0;
        p.alive = false;
      });
    }
    if (completedQtes.has('qte_3b')) {
      this.act3.bunkers.forEach((b) => {
        b.hp = 0;
        b.displayHp = 0;
      });
      this.act3.tankX = 2690;
      this.act3.tankTargetX = 2690;
      this.act3.tankChargingGate = false;
      this.act3.tankMoving = false;
      this.act3.gateCrushRatio = 1;
    }

    this.syncFollowersForAct(actId, interactablesState, spawnX, getGroundY);
  }

  resetForChapterJump(targetActId) {
    this.createFreshStates();
    this.clearTransientProjectiles();
    if (targetActId > 1) {
      this.act1.granaryHp = 0;
      this.act1.granaryDisplayHp = 0;
      this.act1.flagWaves = 3;
    }
    if (targetActId > 2) {
      this.act2.tankHp = 0;
      this.act2.tankDisplayHp = 0;
      this.act2.tankDestroyed = true;
      this.act2.pillboxHp = 0;
      this.act2.pillboxDisplayHp = 0;
    }
    if (targetActId > 3) {
      this.act3.planes.forEach((p) => {
        p.hp = 0;
        p.displayHp = 0;
        p.alive = false;
      });
      this.act3.bunkers.forEach((b) => {
        b.hp = 0;
        b.displayHp = 0;
      });
      this.act3.tankX = 2690;
      this.act3.tankTargetX = 2690;
      this.act3.gateCrushRatio = 1;
    }
  }

  syncFollowersForAct(actId, interactablesState, anchorX, getGroundY) {
    this.followers = [];
    if (actId < 1 || actId > 3) return;

    const visitedInAct = interactablesState.filter(
      (it) => it.act === actId && it.visited
    ).length;
    const desiredCount = visitedInAct * 2;

    for (let i = 0; i < desiredCount; i++) {
      const fx = Math.max(24, anchorX - 34 - i * 26);
      this.followers.push({
        index: i,
        x: fx,
        y: getGroundY(fx),
        vx: 0,
        vy: 0,
        onGround: true,
        facing: 1,
        walkCycle: i * 0.9,
        attackPose: null,
        attackTimer: 0,
      });
    }
  }

  /**
   * Khi người chơi đọc xong 1 văn kiện mới ở Màn 1, 2, 3 -> Triệu hồi 2 NPC đồng đội đi theo!
   */
  onInteractableFirstVisited(item, interactablesState, player, getGroundY) {
    const actItems = interactablesState.filter((it) => it.act === item.act);
    const visitedCount = actItems.filter((it) => it.visited).length;
    const totalCount = actItems.length;

    if (item.act >= 1 && item.act <= 3) {
      for (let k = 0; k < 2; k++) {
        const idx = this.followers.length;
        const spawnX = Math.max(30, item.x - 24 - k * 28);
        const spawnY = getGroundY(spawnX);
        this.followers.push({
          index: idx,
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: -180 - k * 40,
          onGround: false,
          facing: player.facing || 1,
          walkCycle: idx * 0.85,
          attackPose: null,
          attackTimer: 0,
        });
        this.vfx.spawnCelebrationBurst(spawnX, spawnY - 42, 16);
      }

      if (visitedCount >= totalCount) {
        this.gateUnlockedCelebrated.add(item.act);
        this.setHeadNotice(
          `Đã tìm hiểu đủ ${visitedCount}/${totalCount} cột mốc lịch sử — Lực lượng đã sẵn sàng tổng tiến công!`,
          'info',
          3.4
        );
      } else {
        this.setHeadNotice(
          `+2 Đồng đội giác ngộ cùng sát cánh! (Đã đọc ${visitedCount}/${totalCount} văn kiện)`,
          'info',
          2.6
        );
      }
    } else if (item.act === 4 && visitedCount >= totalCount) {
      this.gateUnlockedCelebrated.add(4);
      this.setHeadNotice(
        `Đã hoàn thành ${visitedCount}/${totalCount} cột mốc Đổi mới — Bấm [F] thắp pháo hoa Bình minh & tiến lên Đài tưởng niệm!`,
        'info',
        3.5
      );
    }
  }

  setHeadNotice(text, tone = 'info', duration = 2.4) {
    this.playerHeadNotice = {
      text,
      tone,
      timer: duration,
    };
  }

  triggerFollowersAttack(poseName, facingDir = 1) {
    for (const f of this.followers) {
      f.attackPose = poseName;
      f.attackTimer = 0;
      f.facing = facingDir;
    }
  }

  getActDocProgress(act, interactablesState) {
    const items = interactablesState.filter((it) => it.act === act);
    const visited = items.filter((it) => it.visited).length;
    return { visited, total: items.length };
  }

  getGranaryCombatRenderState() {
    return {
      shakeX:
        this.act1.granaryShake > 0
          ? Math.sin(this.clock * 55) * this.act1.granaryShake
          : 0,
      beam1X: this.act1.beam1X,
      beam1State: this.act1.beam1State,
      beam2X: this.act1.beam2X,
      beam2State: this.act1.beam2State,
    };
  }

  getDienBienCombatRenderState() {
    return {
      shakeX:
        this.act2.pillboxShake > 0
          ? Math.sin(this.clock * 52) * this.act2.pillboxShake
          : 0,
      pillboxDestroyed: this.act2.pillboxHp <= 0,
      mgWarning: this.act2.mgWarning,
      mgFiring: this.act2.mgFiring,
    };
  }

  getTank390RenderState(completedQtes) {
    if (completedQtes.has('qte_3b')) {
      return {
        x: 2690,
        isMoving: false,
        gateCrushRatio: 1,
      };
    }
    return {
      x: this.act3.tankX,
      isMoving: this.act3.tankMoving,
      gateCrushRatio: this.act3.gateCrushRatio,
    };
  }

  // ============================================================================
  // XỬ LÝ NÚT HÀNH ĐỘNG TRỰC TIẾP ([F] / [J] TRÊN PC, TẤN CÔNG [F] TRÊN MOBILE)
  // ============================================================================

  triggerPlayerAction({
    act,
    player,
    baseGroundY,
    getGroundY,
    completedQtes,
    interactablesState,
  }) {
    if (this.actionCooldown > 0) return false;
    this.actionCooldown = 0.24;

    if (act === 1) {
      return this.handleAct1Action(player, getGroundY, completedQtes);
    }
    if (act === 2) {
      return this.handleAct2Action(player, baseGroundY, getGroundY, completedQtes);
    }
    if (act === 3) {
      return this.handleAct3Action(player, baseGroundY, getGroundY, completedQtes);
    }
    if (act === 4) {
      return this.handleAct4Action(player, baseGroundY, interactablesState);
    }
    return false;
  }

  handleAct1Action(player, getGroundY, completedQtes) {
    // 1. Tại Lễ đài Ba Đình (sau khi đã phá Kho thóc Nhật) -> Phất cờ Độc lập 3 lần!
    if (
      completedQtes.has('qte_1a') &&
      !completedQtes.has('qte_1b') &&
      player.x >= 2560 &&
      player.x <= 2815
    ) {
      player.facing = 1;
      player.pose = 'flag_raise';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.05;
      this.triggerFollowersAttack('flag_raise', 1);

      this.act1.flagWaves++;
      this.sound.playQteHit(this.act1.flagWaves);
      this.vfx.spawnCelebrationBurst(2720, getGroundY(2720) - 115, 28);
      this.vfx.triggerShake(8, 0.2);

      if (this.act1.flagWaves >= this.act1.flagTarget) {
        completedQtes.add('qte_1b');
        this.sound.playQteVictory();
        this.vfx.spawnCelebrationBurst(2720, getGroundY(2720) - 140, 85);
        this.vfx.triggerFlash(0.85, '#fffbeb', 1.45);
        this.vfx.triggerShake(15, 0.45);
        const zone1b = QTE_ZONES.find((q) => q.id === 'qte_1b');
        if (zone1b && zone1b.banner && this.onVictoryBanner) {
          this.onVictoryBanner(zone1b.banner);
        }
      } else {
        this.setHeadNotice(
          `Phất cao Cờ Đỏ Sao Vàng! (${this.act1.flagWaves}/${this.act1.flagTarget})`,
          'info',
          1.6
        );
      }
      return true;
    }

    // 2. Vung búa / đuốc đập phá Kho thóc Nhật
    player.pose = 'hammer';
    player.poseTimer = 0;
    player.poseHoldDuration = 0.42;
    this.sound.playMeleeSwing();
    this.triggerFollowersAttack('hammer', player.facing || 1);

    if (
      this.act1.granaryHp > 0 &&
      player.x >= 2245 &&
      player.x <= 2395
    ) {
      player.facing = 1;
      const dmg = 14;
      this.act1.granaryHp = Math.max(0, this.act1.granaryHp - dmg);
      this.act1.granaryShake = 9.5;

      this.sound.playHammerHit(Math.ceil((100 - this.act1.granaryHp) / 14));
      this.vfx.triggerShake(9, 0.2);
      this.vfx.spawnRiceHitSpray(2335, getGroundY(2335), 16);

      if (this.act1.granaryHp <= 0) {
        completedQtes.add('qte_1a');
        this.vfx.setGranaryLiberated(true);
        this.sound.playExplosion(0.95);
        this.sound.playQteVictory();
        this.vfx.spawnGrainBurst(2335, getGroundY(2335));
        // Cả 2 tháp canh Nhật sụp đổ!
        this.vfx.spawnExplosion(2155, getGroundY(2155) - 40, 1.05);
        this.vfx.spawnExplosion(2445, getGroundY(2445) - 40, 1.05);
        this.vfx.triggerFlash(0.8, '#fef08a', 1.75);
        this.vfx.triggerShake(18, 0.5);
        this.setHeadNotice(
          'Kho thóc Nhật đã bị phá tung! Tiến về Quảng trường Ba Đình phất cờ Độc lập!',
          'info',
          3.4
        );
      }
    }
    return true;
  }

  handleAct2Action(player, baseGroundY, getGroundY, completedQtes) {
    // 1. Nóc hầm Đờ Cátơri (sau khi đã đánh sập Lô cốt Điện Biên) -> Phất cờ Quyết chiến Quyết thắng!
    if (
      this.act2.pillboxHp <= 0 &&
      !completedQtes.has('qte_2b') &&
      player.x >= 2595 &&
      player.x <= 2790
    ) {
      player.facing = 1;
      player.pose = 'bunker_flag';
      player.poseTimer = 0;
      player.poseHoldDuration = 1.6;
      this.triggerFollowersAttack('bunker_flag', 1);

      completedQtes.add('qte_2b');
      this.sound.playQteVictory();
      this.vfx.spawnCelebrationBurst(2695, baseGroundY - 148, 95);
      this.vfx.triggerFlash(0.88, '#fef08a', 1.4);
      this.vfx.triggerShake(18, 0.5);

      const zone2b = QTE_ZONES.find((q) => q.id === 'qte_2b');
      if (zone2b && zone2b.banner && this.onVictoryBanner) {
        this.onVictoryBanner(zone2b.banner);
      }
      return true;
    }

    // 2. Giai đoạn 2B: Áp sát Lô cốt Điện Biên (x = 2500..2585) -> Đánh khối bộc phá (-50 HP)!
    if (
      this.act2.pillboxHp > 0 &&
      player.x >= 2498 &&
      player.x <= 2585
    ) {
      player.facing = 1;
      player.pose = 'plant_charge';
      player.poseTimer = 0;
      player.poseHoldDuration = 0.52;
      this.triggerFollowersAttack('plant_charge', 1);

      this.act2.pillboxHp = Math.max(0, this.act2.pillboxHp - 50);
      this.act2.pillboxShake = 11;

      this.sound.playExplosion(1.1);
      this.sound.playQteHit(3 - Math.ceil(this.act2.pillboxHp / 50));
      this.vfx.spawnExplosion(2582, getGroundY(2582) - 12, 1.15);
      this.vfx.triggerShake(16, 0.36);
      this.vfx.triggerFlash(0.45, '#fed7aa', 2.4);

      if (this.act2.pillboxHp <= 0) {
        completedQtes.add('qte_2a');
        this.airPlanesAct2 = [];
        this.fallingBombs = [];
        this.projectiles = [];
        this.sound.playExplosion(1.35);
        this.sound.playQteVictory();
        this.vfx.spawnExplosion(2592, getGroundY(2592) - 18, 1.45);
        this.vfx.triggerShake(22, 0.55);
        this.setHeadNotice(
          'Lô cốt Điện Biên đã sập! Hãy nhảy lên nóc hầm Đờ Cátơri bấm [F] phất cờ toàn thắng!',
          'info',
          3.6
        );
      }
      return true;
    }

    // 3. Giai đoạn 2A: Phố cổ Hà Nội -> Ném bom xăng / lựu đạn theo quỹ đạo parabol xuống Thiết giáp Pháp!
    player.pose = 'throw_grenade';
    player.poseTimer = 0;
    player.poseHoldDuration = 0.45;
    this.sound.playGrenadeThrow();
    this.triggerFollowersAttack('throw_grenade', player.facing || 1);

    const startX = player.x + (player.facing || 1) * 18;
    const startY = player.y - 54;

    let vx = (player.facing || 1) * 285;
    let vy = -330;

    // Nếu đứng trên ban công / mái phố cổ gần xe tăng Pháp (1395), tự căn parabol chuẩn xác xuống nóc xe tăng!
    if (!this.act2.tankDestroyed && player.x >= 980 && player.x <= 1455) {
      if (player.dy > -42) {
        this.setHeadNotice(
          'Hãy nhảy lên mái tàu điện / ban công tầng 2 để tránh đạn pháo và ném bom xăng trúng nóc Thiết giáp!',
          'warn',
          2.6
        );
      } else {
        player.facing = player.x <= 1405 ? 1 : -1;
        const targetX = 1395;
        const targetY = getGroundY(1395) - 34;
        const flightT = 0.56;
        const grav = 920;
        vx = (targetX - startX) / flightT;
        vy = (targetY - startY - 0.5 * grav * flightT * flightT) / flightT;
      }
    }

    this.projectiles.push({
      kind: 'molotov',
      act: 2,
      fromPlayer: true,
      x: startX,
      y: startY,
      vx,
      vy,
      gravity: 920,
      damage: player.dy <= -42 ? 20 : 10,
      age: 0,
      life: 1.8,
    });

    return true;
  }

  handleAct3Action(player, baseGroundY, getGroundY, completedQtes) {
    // 1. Giai đoạn 3A: Đứng cạnh 1 trong 2 Khẩu pháo cao xạ 37mm (1662 hoặc 1796) bắn máy bay địch!
    const alivePlanes = this.act3.planes.filter((p) => p.alive);
    if (alivePlanes.length > 0 && player.x >= 1595 && player.x <= 1915) {
      let nearestGun = null;
      let bestGunDist = 66;
      for (const g of this.act3.guns) {
        const d = Math.abs(player.x - g.x);
        if (d <= bestGunDist) {
          bestGunDist = d;
          nearestGun = g;
        }
      }

      if (nearestGun) {
        // Chọn mục tiêu máy bay địch gần khẩu cao xạ nhất
        let targetPlane = alivePlanes[0];
        let bestDist = Infinity;
        for (const p of alivePlanes) {
          const d = Math.abs(p.x - nearestGun.x);
          if (d < bestDist) {
            bestDist = d;
            targetPlane = p;
          }
        }

        const gunY = getGroundY(nearestGun.x) - 32;
        const planeY = baseGroundY + targetPlane.altOffset;
        const aimAng = Math.atan2(planeY - gunY, targetPlane.x - nearestGun.x);

        nearestGun.aimAngle = aimAng;
        nearestGun.recoil = 1.0;

        player.facing = targetPlane.x >= nearestGun.x ? 1 : -1;
        player.pose = 'aa_fire';
        player.poseTimer = 0;
        player.poseHoldDuration = 0.36;
        this.triggerFollowersAttack('shoot_ak', player.facing);

        this.sound.playAntiAircraftFire();
        this.vfx.triggerShake(7.5, 0.16);

        const speed = 920;
        this.projectiles.push({
          kind: 'aa_flak',
          act: 3,
          fromPlayer: true,
          targetPlaneId: targetPlane.id,
          x: nearestGun.x + Math.cos(aimAng) * 52,
          y: gunY + Math.sin(aimAng) * 52,
          vx: Math.cos(aimAng) * speed,
          vy: Math.sin(aimAng) * speed,
          gravity: 0,
          damage: 20,
          age: 0,
          life: 0.9,
        });
        return true;
      }
    }

    // 2. Giai đoạn 3B (hoặc trên đường Trường Sơn): Bắn loạt đạn súng tiểu liên AK-47!
    const dir =
      player.x >= 2190 && this.act3.bunkers.some((b) => b.hp > 0)
        ? 1
        : player.facing || 1;
    player.facing = dir;
    player.pose = 'shoot_ak';
    player.poseTimer = 0;
    player.poseHoldDuration = 0.34;
    this.triggerFollowersAttack('shoot_ak', dir);

    this.sound.playMachineGunBurst(3, 185);
    this.vfx.triggerShake(4.5, 0.12);

    const muzzleX = player.x + dir * 32;
    const muzzleY = player.y - 48;
    this.projectiles.push({
      kind: 'ak_burst',
      act: 3,
      fromPlayer: true,
      x: muzzleX,
      y: muzzleY,
      vx: dir * 860,
      vy: 0,
      gravity: 0,
      damage: 17, // 3 loạt đạn tiêu diệt gọn 1 ụ súng 50 HP!
      age: 0,
      life: 0.48,
    });

    // Đoàn đồng đội Giải phóng quân phía sau cùng nhả đạn yểm trợ!
    this.followers.slice(0, 2).forEach((f, idx) => {
      this.projectiles.push({
        kind: 'ak_tracer_visual',
        act: 3,
        fromPlayer: true,
        x: f.x + dir * 24,
        y: f.y - 44 - idx * 3,
        vx: dir * 840,
        vy: 0,
        gravity: 0,
        damage: 0,
        age: 0,
        life: 0.36,
      });
    });

    return true;
  }

  handleAct4Action(player, baseGroundY, interactablesState) {
    // Cuối Màn 4 gần Đài tưởng niệm (2560) dành phím [F] cho nghi thức Giữ 2.5s dâng hương
    if (player.x >= 2410) return false;

    const { visited } = this.getActDocProgress(4, interactablesState);
    if (visited === 0) {
      this.setHeadNotice(
        'Hãy khám phá Bảng tin Lịch sử & Biểu tượng Đổi mới để thắp sáng pháo hoa Bình minh!',
        'info',
        2.3
      );
      return false;
    }

    player.pose = 'dawn_light';
    player.poseTimer = 0;
    player.poseHoldDuration = 0.55;
    this.sound.playDawnFirework();

    // Kiểm tra cột mốc ánh sáng gần nhất để thắp sáng vĩnh viễn
    for (const px of ACT4_LIGHT_PILLARS) {
      if (Math.abs(player.x - px) <= 130) {
        this.act4.activatedPillars.add(px);
      }
    }

    const burstX = player.x + (player.facing || 1) * 55;
    const skyY = baseGroundY - 195 - Math.random() * 65;
    this.vfx.spawnDawnFirework(burstX, skyY);
    this.vfx.spawnDawnFirework(burstX + (Math.random() - 0.5) * 140, skyY - 35);
    this.vfx.triggerFlash(0.22, '#fef9c3', 2.6);
    return true;
  }

  // ============================================================================
  // CẬP NHẬT VÒNG LẶP THỜI GIAN THỰC 60FPS
  // ============================================================================

  update(dt, context) {
    const {
      act,
      player,
      baseGroundY,
      getGroundY,
      completedQtes,
      interactablesState,
      canControl,
    } = context;

    this.clock += dt;
    this.actionCooldown = Math.max(0, this.actionCooldown - dt);

    if (this.playerHeadNotice) {
      this.playerHeadNotice.timer -= dt;
      if (this.playerHeadNotice.timer <= 0) {
        this.playerHeadNotice = null;
      }
    }

    for (let i = this.tracerLines.length - 1; i >= 0; i--) {
      this.tracerLines[i].age += dt;
      if (this.tracerLines[i].age >= this.tracerLines[i].life) {
        this.tracerLines.splice(i, 1);
      }
    }

    // 1. Cổng kiểm tra tiến độ "Đọc văn kiện mở đường" (Progression Gate) ở cả 4 Màn!
    this.enforceProgressionGate(act, player, interactablesState);

    // 2. Cập nhật đoàn NPC đồng đội nối đuôi theo sau nhân vật chính (Màn 1, 2, 3)
    this.updateFollowers(dt, act, player, baseGroundY, getGroundY);

    if (!canControl) return;

    // 3. Cập nhật Minigame riêng của từng Màn
    if (act === 1) {
      this.updateAct1StealthAndGranary(dt, player, getGroundY, completedQtes);
    } else if (act === 2) {
      this.updateAct2HanoiAndDienBien(dt, player, baseGroundY, getGroundY, completedQtes);
    } else if (act === 3) {
      this.updateAct3AirDefenseAndSaigon(dt, player, baseGroundY, getGroundY, completedQtes);
    }

    // 4. Cập nhật đạn bay & bom rơi có vòng tròn đỏ cảnh báo
    this.updateProjectiles(dt, act, player, baseGroundY, getGroundY, completedQtes);
    this.updateFallingBombs(dt, act, player, getGroundY);
  }

  enforceProgressionGate(act, player, interactablesState) {
    const gateX = PROGRESSION_GATES[act];
    if (!gateX) return;

    const { visited, total } = this.getActDocProgress(act, interactablesState);
    if (visited >= total) return;

    const clampX = gateX - 18;
    if (player.x > clampX) {
      player.x = clampX;
      player.vx = 0;
    }

    if (player.x >= gateX - 96) {
      this.setHeadNotice(
        `Cần tìm hiểu đủ các cột mốc lịch sử phía trước (đã đọc ${visited}/${total}) để giác ngộ lực lượng trước khi tổng tiến công!`,
        'gate',
        0.35
      );
    }
  }

  updateFollowers(dt, act, player, baseGroundY, getGroundY) {
    if (act < 1 || act > 3 || this.followers.length === 0) return;

    const actCfg = ACTS.find((a) => a.id === act) || ACTS[0];
    const dir = player.facing || 1;

    for (let i = 0; i < this.followers.length; i++) {
      const f = this.followers[i];
      if (f.attackPose) {
        f.attackTimer += dt;
        if (f.attackTimer >= 0.46) {
          f.attackPose = null;
          f.attackTimer = 0;
        }
      }

      const desiredX = Math.max(20, player.x - dir * (36 + i * 27));
      const dx = desiredX - f.x;

      if (Math.abs(dx) > 6) {
        const targetVx = Math.max(-305, Math.min(305, dx * 5.2));
        f.vx += (targetVx - f.vx) * Math.min(1, dt * 11);
        if (!f.attackPose) {
          f.facing = dx >= 0 ? 1 : -1;
        }
        f.walkCycle += dt * (3.5 + (Math.abs(f.vx) / 305) * 7.2);
      } else {
        f.vx *= Math.max(0, 1 - dt * 12);
        if (!f.attackPose) f.facing = dir;
      }

      f.x += f.vx * dt;

      // Nhảy theo nhân vật chính nếu nhân vật đang ở trên bậc đá / ban công cao
      let targetFloorY = getGroundY(f.x);
      if (player.currentPlatformId && Math.abs(f.x - player.x) < 175) {
        const pPlat = actCfg.platforms.find((p) => p.id === player.currentPlatformId);
        if (pPlat && f.x >= pPlat.x1 - 24 && f.x <= pPlat.x2 + 24) {
          targetFloorY = baseGroundY + pPlat.dy;
        }
      }

      if (targetFloorY < f.y - 16 && f.onGround) {
        f.vy = -520;
        f.onGround = false;
      }

      if (!f.onGround) {
        f.vy += 1500 * dt;
        f.y += f.vy * dt;
        if (f.y >= targetFloorY) {
          f.y = targetFloorY;
          f.vy = 0;
          f.onGround = true;
        }
      } else {
        f.y += (targetFloorY - f.y) * Math.min(1, dt * 16);
      }
    }
  }

  // -------------------- MÀN 1: LÁCH ĐÈN PHA & ĐẬP KHO THÓC --------------------
  updateAct1StealthAndGranary(dt, player, getGroundY, completedQtes) {
    const s = this.act1;
    s.granaryDisplayHp += (s.granaryHp - s.granaryDisplayHp) * Math.min(1, dt * 10);
    s.granaryShake = Math.max(0, s.granaryShake - dt * 24);
    s.hitCooldown = Math.max(0, s.hitCooldown - dt);

    if (completedQtes.has('qte_1a') || s.granaryHp <= 0) {
      s.isHidden = false;
      s.exposureTimer = 0;
      return;
    }

    // Chặn không cho đi xuyên qua Kho thóc Nhật khi chưa đập vỡ cửa (HP > 0)
    if (player.x > 2376) {
      player.x = 2376;
      player.vx = 0;
    }

    // Luồng đèn số 1 (từ Tháp canh trái 2155): quét qua lại vùng 3 ụ rơm (1935..2215)
    s.beam1X = 2075 + Math.sin(this.clock * 1.18) * 140;
    s.beam1State = 'normal';

    // Luồng đèn số 2 (từ Tháp canh phải 2445):
    // Chu kỳ 7.6s:
    // - 0.0 -> 4.3s: Quét an toàn bên phải kho thóc (2465..2535) để người chơi đập cửa kho thóc
    // - 4.3 -> 5.5s (1.2s): DỪNG LẠI ở 2428 & ĐỔI MÀU CAM/ĐỎ cảnh báo rõ nét để lùi về ụ rơm số 3!
    // - 5.5 -> 7.6s: Quét đỏ rực qua cửa Kho thóc (2428 -> 2272 -> 2465)
    s.beam2Cycle = (s.beam2Cycle + dt) % 7.6;
    const c = s.beam2Cycle;
    if (c < 4.3) {
      s.beam2State = 'normal';
      s.beam2X = 2498 + Math.sin((c / 4.3) * Math.PI * 2) * 34;
    } else if (c < 5.5) {
      s.beam2State = 'warning';
      s.beam2X = 2428;
    } else {
      s.beam2State = 'sweep_door';
      const u = (c - 5.5) / 2.1; // 0..1
      s.beam2X = u < 0.55
        ? 2428 - (u / 0.55) * 156 // 2428 -> 2272
        : 2272 + ((u - 0.55) / 0.45) * 196; // 2272 -> 2468
    }

    // Kiểm tra người chơi đang nấp tại 1 trong 3 ụ rơm lớn
    s.isHidden =
      player.dy >= -56 &&
      ACT1_HAYSTACKS.some(
        (h) => player.x >= h.x1 - 10 && player.x <= h.x2 + 10
      );

    if (s.isHidden) {
      s.exposureTimer = Math.max(0, s.exposureTimer - dt * 3.2);
      if (!this.playerHeadNotice || this.playerHeadNotice.tone === 'stealth') {
        this.setHeadNotice('Đang ẩn nấp', 'stealth', 0.22);
      }
      return;
    }

    // Kiểm tra lộ sáng ngoài ụ rơm > 0.4 giây
    if (player.x >= 1895 && player.x <= 2555 && s.hitCooldown <= 0) {
      const inBeam1 = Math.abs(player.x - s.beam1X) < 48;
      const inBeam2 = Math.abs(player.x - s.beam2X) < 50;

      if (inBeam1 || inBeam2) {
        s.exposureTimer += dt;
        if (s.exposureTimer > 0.4) {
          s.exposureTimer = 0;
          s.hitCooldown = 1.15;

          const towerX = inBeam2 ? 2445 : 2155;
          const towerTopY = getGroundY(towerX) - 236;
          this.tracerLines.push({
            x1: towerX - 14,
            y1: towerTopY,
            x2: player.x,
            y2: player.y - 36,
            color: '#fca5a5',
            age: 0,
            life: 0.28,
          });

          this.sound.playSiren();
          this.sound.playAlertHit();
          this.vfx.triggerFlash(0.45, 'rgba(239, 68, 68, 0.78)', 2.6);
          this.vfx.triggerShake(12, 0.28);

          player.x = Math.max(1900, player.x - 180);
          player.vx = -210;
          player.dy = sampleGroundOffset(1, player.x);
          player.y = getGroundY(player.x);

          this.setHeadNotice(
            'Bị đèn tuần tra phát hiện! Hãy nấp vào ụ rơm khi đèn quét tới!',
            'warn',
            2.9
          );
        }
      } else {
        s.exposureTimer = Math.max(0, s.exposureTimer - dt * 2.4);
      }
    }
  }

  // -------------------- MÀN 2: XE TĂNG HÀ NỘI & CỨ ĐIỂM ĐIỆN BIÊN --------------------
  updateAct2HanoiAndDienBien(dt, player, baseGroundY, getGroundY, completedQtes) {
    const s = this.act2;
    s.tankDisplayHp += (s.tankHp - s.tankDisplayHp) * Math.min(1, dt * 10);
    s.pillboxDisplayHp += (s.pillboxHp - s.pillboxDisplayHp) * Math.min(1, dt * 10);
    s.tankHitFlash = Math.max(0, s.tankHitFlash - dt * 4);
    s.pillboxShake = Math.max(0, s.pillboxShake - dt * 24);
    s.hitCooldown = Math.max(0, s.hitCooldown - dt);

    // --- GIAI ĐOẠN 2A: XE TĂNG PHÁP Ở PHỐ CỔ HÀ NỘI (x = 1395) ---
    if (!s.tankDestroyed) {
      // Chặn không cho đi qua Thiết giáp Pháp khi chưa tiêu diệt!
      if (player.dy > -42 && player.x > 1338) {
        player.x = 1338;
        player.vx = 0;
      } else if (player.x > 1425) {
        player.x = 1425;
        player.vx = 0;
        this.setHeadNotice(
          'Hãy bấm [F] từ ban công tầng 2 ném bom xăng tiêu diệt Thiết giáp địch bên dưới để mở đường!',
          'warn',
          2.2
        );
      }

      if (player.x >= 760 && player.x <= 1460) {
        s.tankFireTimer -= dt;
        s.tankMuzzleWarn = s.tankFireTimer <= 0.6 && s.tankFireTimer > 0;
        if (s.tankFireTimer <= 0) {
          s.tankFireTimer = 2.35;
          s.tankMuzzleWarn = false;
          this.sound.playExplosion(0.45);
          this.projectiles.push({
            kind: 'tank_shell',
            act: 2,
            fromPlayer: false,
            x: 1322,
            y: baseGroundY - 36,
            vx: -480,
            vy: 0,
            gravity: 0,
            age: 0,
            life: 1.05,
          });
        }
      }
    }

    // --- GIAI ĐOẠN 2B: LÔ CỐT SÚNG MÁY & MÁY BAY NÉM BOM ĐIỆN BIÊN PHỦ ---
    if (s.pillboxHp > 0 && !completedQtes.has('qte_2a')) {
      if (player.x > 2574) {
        player.x = 2574;
        player.vx = 0;
      }

      if (player.x >= 2050 && player.x <= 2610) {
        // Chu kỳ đại liên lỗ châu mai 4.5s (tương đương ~3.5s nghỉ + 1.0s xả đạn):
        // - 0.0 -> 2.5s: Nghỉ nạp đạn (cơ hội nhảy khỏi hào lao lên đánh bộc phá!)
        // - 2.5 -> 3.5s (1.0s): NHÁY ĐÈN ĐỎ CẢNH BÁO ở lỗ châu mai!
        // - 3.5 -> 4.5s (1.0s): Xả tràng đạn đỏ rực bay ngang mặt đất phẳng (y = baseGroundY - 34)
        s.mgCycleTimer = (s.mgCycleTimer + dt) % 4.5;
        const mc = s.mgCycleTimer;
        const wasFiring = s.mgFiring;

        s.mgWarning = mc >= 2.5 && mc < 3.5;
        s.mgFiring = mc >= 3.5;

        if (s.mgFiring && !wasFiring) {
          this.sound.playMachineGunBurst(6, 128);
          s.mgShotAccum = 0;
        }

        if (s.mgFiring) {
          s.mgShotAccum += dt;
          while (s.mgShotAccum >= 0.12) {
            s.mgShotAccum -= 0.12;
            this.projectiles.push({
              kind: 'pillbox_mg',
              act: 2,
              fromPlayer: false,
              x: 2566,
              y: baseGroundY - 34, // Bay ngang trên mặt đất phẳng — sượt qua đầu nếu đứng dưới hào sâu (dy >= 22)!
              vx: -760,
              vy: 0,
              gravity: 0,
              age: 0,
              life: 0.72,
            });
          }
        }

        // Máy bay khu trục cánh quạt Pháp thả bom vào vòng tròn đỏ cảnh báo dưới đất
        s.bomberTimer -= dt;
        if (s.bomberTimer <= 0 && this.airPlanesAct2.length < 2) {
          s.bomberTimer = 3.5;
          const targetX = Math.max(
            2120,
            Math.min(2545, player.x + (Math.random() - 0.35) * 140)
          );
          this.airPlanesAct2.push({
            x: 2780,
            y: baseGroundY - 255,
            vx: -310,
            dir: -1,
            dropX: targetX,
            dropped: false,
          });
        }
      }
    }

    for (let i = this.airPlanesAct2.length - 1; i >= 0; i--) {
      const pl = this.airPlanesAct2[i];
      pl.x += pl.vx * dt;
      if (!pl.dropped && Math.abs(pl.x - pl.dropX) < 42) {
        pl.dropped = true;
        this.spawnTelegraphedBomb(pl.x, pl.y + 12, pl.dropX, getGroundY(pl.dropX));
      }
      if (pl.x < 1750) {
        this.airPlanesAct2.splice(i, 1);
      }
    }
  }

  // -------------------- MÀN 3: ĐỒI CAO XẠ 37MM & XE TĂNG 390 --------------------
  updateAct3AirDefenseAndSaigon(dt, player, baseGroundY, getGroundY, completedQtes) {
    const s = this.act3;
    s.hitCooldown = Math.max(0, s.hitCooldown - dt);

    for (const g of s.guns) {
      g.recoil = Math.max(0, g.recoil - dt * 4.2);
    }

    // --- GIAI ĐOẠN 3A: 3 MÁY BAY ĐỊCH (40 HP) TRÊN ĐỒI CAO XẠ ---
    let anyPlaneAlive = false;
    for (const p of s.planes) {
      p.displayHp += (p.hp - p.displayHp) * Math.min(1, dt * 10);
      p.hitFlash = Math.max(0, p.hitFlash - dt * 4.5);
      if (!p.alive) continue;
      anyPlaneAlive = true;

      const prevX = p.x;
      p.x = p.baseX + Math.sin(this.clock * p.speed + p.phase) * p.amp;
      p.dir = p.x >= prevX ? 1 : -1;
    }

    if (anyPlaneAlive && !completedQtes.has('qte_3a')) {
      if (player.x > 1905) {
        player.x = 1905;
        player.vx = 0;
        this.setHeadNotice(
          'Hãy điều khiển Khẩu đội Pháo cao xạ 37mm bấm [F] bắn hạ đủ 3 máy bay địch để thông đường ra tiền tuyến!',
          'warn',
          2.4
        );
      }

      if (player.x >= 1590 && player.x <= 1920) {
        s.aaBombTimer -= dt;
        if (s.aaBombTimer <= 0) {
          s.aaBombTimer = 2.65;
          const living = s.planes.filter((pl) => pl.alive);
          const bomber = living[Math.floor(Math.random() * living.length)];
          if (bomber) {
            // Ưu tiên thả bom vào vị trí người chơi đang đứng để buộc người chơi di chuyển giữa 2 khẩu pháo!
            const dropTargetX = Math.max(
              1635,
              Math.min(1835, player.x + (Math.random() - 0.5) * 44)
            );
            this.spawnTelegraphedBomb(
              bomber.x,
              baseGroundY + bomber.altOffset + 12,
              dropTargetX,
              getGroundY(dropTargetX)
            );
          }
        }
      }
    }

    // --- GIAI ĐOẠN 3B: DIỆT 2 Ụ SÚNG ĐỊCH MỞ ĐƯỜNG CHO XE TĂNG 390 HÚC CỔNG DINH ---
    for (const b of s.bunkers) {
      b.displayHp += (b.hp - b.displayHp) * Math.min(1, dt * 10);
      b.hitFlash = Math.max(0, b.hitFlash - dt * 4.5);
      b.firingAnim = Math.max(0, b.firingAnim - dt);
    }

    const b1Alive = s.bunkers[0].hp > 0;
    const b2Alive = s.bunkers[1].hp > 0;

    if (!completedQtes.has('qte_3b')) {
      if (b1Alive && player.x > 2380) {
        player.x = 2380;
        player.vx = 0;
      } else if (!b1Alive && b2Alive && player.x > 2515) {
        player.x = 2515;
        player.vx = 0;
      } else if (!b1Alive && !b2Alive && player.x > 2635) {
        player.x = 2635;
        player.vx = 0;
      }

      // Ụ súng tiền tiêu đang còn sống sẽ bắn đạn ngang tầm thấp (nhảy W qua được!)
      const activeBunker = b1Alive ? s.bunkers[0] : b2Alive ? s.bunkers[1] : null;
      if (activeBunker && player.x >= 2180) {
        activeBunker.fireTimer -= dt;
        if (activeBunker.fireTimer <= 0) {
          activeBunker.fireTimer = 1.72;
          activeBunker.firingAnim = 0.28;
          this.sound.playMachineGunBurst(2, 145);
          this.projectiles.push({
            kind: 'bunker_bullet',
            act: 3,
            fromPlayer: false,
            x: activeBunker.x - 44,
            y: getGroundY(activeBunker.x) - 26, // Tầm thấp để người chơi bấm W / ▲ nhảy vọt qua!
            vx: -385,
            vy: 0,
            gravity: 0,
            age: 0,
            life: 1.15,
          });
        }
      }

      // Điều khiển vị trí tiến quân của Xe tăng T-54 số hiệu 390
      if (b1Alive) {
        s.tankTargetX = 2250;
      } else if (b2Alive) {
        s.tankTargetX = 2375;
      } else {
        s.tankChargingGate = true;
        s.tankTargetX = 2690;
      }

      if (s.tankX < s.tankTargetX - 1.5) {
        const speed = s.tankChargingGate ? 205 : 135;
        s.tankX = Math.min(s.tankTargetX, s.tankX + speed * dt);
        s.tankMoving = true;

        if (s.tankChargingGate && s.tankX >= 2610) {
          s.gateCrushRatio = Math.min(1, (s.tankX - 2610) / 55);
        }

        // Khoảnh khắc Xe tăng 390 húc tung cánh cổng sắt Dinh Độc Lập (x = 2645 -> 2690)!
        if (s.tankChargingGate && s.tankX >= 2688) {
          s.tankMoving = false;
          s.gateCrushRatio = 1;
          completedQtes.add('qte_3b');

          this.sound.playExplosion(0.95);
          this.sound.playQteVictory();
          this.vfx.spawnCelebrationBurst(2645, getGroundY(2645) - 86, 105);
          this.vfx.triggerFlash(0.9, '#fffbeb', 1.35);
          this.vfx.triggerShake(20, 0.55);

          player.pose = 'tank_charge';
          player.poseTimer = 0;
          player.poseHoldDuration = 1.8;
          this.triggerFollowersAttack('tank_charge', 1);

          const zone3b = QTE_ZONES.find((q) => q.id === 'qte_3b');
          if (zone3b && zone3b.banner && this.onVictoryBanner) {
            this.onVictoryBanner(zone3b.banner);
          }
        }
      } else {
        s.tankMoving = false;
      }
    }
  }

  // -------------------- ĐẠN BAY & BOM RƠI CÓ VÒNG ĐỎ CẢNH BÁO --------------------
  spawnTelegraphedBomb(startX, startY, targetX, targetGroundY) {
    const fallDuration = 1.35;
    const gravity = 380;
    const vx = (targetX - startX) / fallDuration;
    const vy = (targetGroundY - startY - 0.5 * gravity * fallDuration * fallDuration) / fallDuration;

    this.fallingBombs.push({
      x: startX,
      y: startY,
      targetX,
      targetGroundY,
      vx,
      vy,
      gravity,
      age: 0,
      duration: fallDuration,
    });
  }

  updateFallingBombs(dt, act, player, getGroundY) {
    for (let i = this.fallingBombs.length - 1; i >= 0; i--) {
      const b = this.fallingBombs[i];
      b.age += dt;
      b.vy += b.gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const floorY = getGroundY(b.targetX);
      if (b.y >= floorY - 3 || b.age >= b.duration + 0.15) {
        this.vfx.spawnExplosion(b.targetX, floorY, 0.85);
        this.sound.playExplosion(0.68);
        this.vfx.triggerShake(7.5, 0.22);

        // Kiểm tra trúng người chơi trong bán kính vòng đỏ cảnh báo (44px)
        const hitCooldown = act === 2 ? this.act2.hitCooldown : this.act3.hitCooldown;
        if (Math.abs(player.x - b.targetX) < 42 && hitCooldown <= 0) {
          if (act === 2) this.act2.hitCooldown = 1.0;
          if (act === 3) this.act3.hitCooldown = 1.0;

          this.sound.playAlertHit();
          this.vfx.triggerFlash(0.42, 'rgba(239, 68, 68, 0.72)', 2.8);
          const pushDir = player.x <= b.targetX ? -1 : 1;
          player.x = Math.max(1620, player.x + pushDir * 58);
          player.vx = pushDir * 190;
          if (player.onGround && !player.currentPlatformId) {
            player.dy = sampleGroundOffset(act, player.x);
            player.y = getGroundY(player.x);
          }
          this.setHeadNotice(
            'Trúng mảnh bom! Hãy di chuyển khỏi vòng tròn đỏ cảnh báo dưới đất!',
            'warn',
            2.2
          );
        }

        this.fallingBombs.splice(i, 1);
      }
    }
  }

  updateProjectiles(dt, act, player, baseGroundY, getGroundY, completedQtes) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      if (pr.act !== act) {
        this.projectiles.splice(i, 1);
        continue;
      }

      pr.age += dt;
      if (pr.age >= pr.life) {
        this.projectiles.splice(i, 1);
        continue;
      }

      pr.vy += (pr.gravity || 0) * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      // 1. Chai bom xăng / lựu đạn parabol của người chơi ở Phố cổ Hà Nội (Act 2A)
      if (pr.kind === 'molotov') {
        if (Math.random() < 0.7) {
          this.vfx.spawnTorchEmber(pr.x, pr.y, pr.vx >= 0 ? 1 : -1);
        }

        const tankGy = getGroundY(1395);
        if (
          !this.act2.tankDestroyed &&
          Math.abs(pr.x - 1395) < 58 &&
          pr.y >= tankGy - 56 &&
          pr.y <= tankGy + 12
        ) {
          this.act2.tankHp = Math.max(0, this.act2.tankHp - pr.damage);
          this.act2.tankHitFlash = 1.0;
          this.sound.playExplosion(0.95);
          this.vfx.spawnExplosion(pr.x, tankGy - 24, 1.0);
          this.vfx.triggerShake(13, 0.3);

          if (this.act2.tankHp <= 0) {
            this.act2.tankDestroyed = true;
            this.sound.playExplosion(1.3);
            this.sound.playQteVictory();
            this.vfx.spawnExplosion(1395, tankGy - 20, 1.45);
            this.vfx.triggerFlash(0.65, '#fed7aa', 1.8);
            this.vfx.triggerShake(19, 0.48);
            this.setHeadNotice(
              'Thiết giáp địch đã bốc cháy! Đường lên đèo Tây Bắc & Điện Biên Phủ đã mở!',
              'info',
              3.4
            );
          }
          this.projectiles.splice(i, 1);
          continue;
        }

        const floorY = getGroundY(pr.x);
        if (pr.y >= floorY) {
          this.vfx.spawnExplosion(pr.x, floorY, 0.55);
          this.sound.playExplosion(0.45);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 2. Đạn pháo cao xạ 37mm bắn máy bay địch (Act 3A)
      if (pr.kind === 'aa_flak') {
        const target = this.act3.planes.find((pl) => pl.id === pr.targetPlaneId && pl.alive);
        if (target) {
          const ty = baseGroundY + target.altOffset;
          if (Math.hypot(pr.x - target.x, pr.y - ty) < 42) {
            target.hp = Math.max(0, target.hp - pr.damage);
            target.hitFlash = 1.0;
            this.vfx.spawnExplosion(target.x, ty, 0.82);
            this.sound.playExplosion(0.75);

            if (target.hp <= 0) {
              target.alive = false;
              this.vfx.spawnExplosion(target.x, ty, 1.35);
              this.sound.playExplosion(1.15);
              this.vfx.triggerShake(14, 0.35);

              const remaining = this.act3.planes.filter((pl) => pl.alive).length;
              if (remaining === 0) {
                completedQtes.add('qte_3a');
                this.fallingBombs = [];
                this.sound.playQteVictory();
                this.vfx.triggerFlash(0.65, '#fef08a', 1.8);
                this.setHeadNotice(
                  'Bầu trời Trường Sơn đã sạch bóng thù! Tiến xuống Đại lộ Sài Gòn cùng Xe tăng 390!',
                  'info',
                  3.5
                );
              } else {
                this.setHeadNotice(
                  `Bắn cháy 1 máy bay địch! Còn ${remaining} chiếc trên bầu trời!`,
                  'info',
                  2.0
                );
              }
            }
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }

      // 3. Loạt đạn AK-47 của người chơi bắn ụ súng địch trên Đại lộ Sài Gòn (Act 3B)
      if (pr.kind === 'ak_burst') {
        let hitBunker = false;
        for (const bk of this.act3.bunkers) {
          if (bk.hp <= 0) continue;
          const bgy = getGroundY(bk.x);
          if (Math.abs(pr.x - bk.x) < 34 && Math.abs(pr.y - (bgy - 24)) < 42) {
            bk.hp = Math.max(0, bk.hp - pr.damage);
            bk.hitFlash = 1.0;
            this.vfx.spawnCelebrationBurst(bk.x - 16, bgy - 26, 8);
            if (bk.hp <= 0) {
              this.sound.playExplosion(1.0);
              this.vfx.spawnExplosion(bk.x, bgy - 14, 1.2);
              this.vfx.triggerShake(13, 0.3);
              if (this.act3.bunkers.every((b) => b.hp <= 0)) {
                this.setHeadNotice(
                  'Đã dọn sạch 2 ụ súng địch! Cùng Xe tăng 390 xung phong húc đổ cổng Dinh Độc Lập!',
                  'info',
                  3.5
                );
              } else {
                this.setHeadNotice(
                  'Ụ súng 1 đã bị phá hủy! Tiến lên tiêu diệt ụ súng cuối cùng!',
                  'info',
                  2.4
                );
              }
            }
            hitBunker = true;
            break;
          }
        }
        if (hitBunker) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 4. Đạn pháo ngang của Xe tăng Pháp ở Hà Nội (Act 2A)
      if (pr.kind === 'tank_shell' && this.act2.hitCooldown <= 0) {
        if (
          player.dy > -42 &&
          Math.abs(pr.x - player.x) < 22 &&
          pr.y >= player.y - 72 &&
          pr.y <= player.y - 6
        ) {
          this.act2.hitCooldown = 1.0;
          this.sound.playAlertHit();
          this.vfx.triggerFlash(0.42, 'rgba(239, 68, 68, 0.72)', 2.8);
          this.vfx.triggerShake(10, 0.24);
          player.x = Math.max(780, player.x - 95);
          player.vx = -190;
          this.setHeadNotice(
            'Trúng đạn pháo ngang! Hãy nhảy lên mái tàu điện / ban công tầng 2 để ném bom xăng!',
            'warn',
            2.8
          );
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 5. Tràng đạn đại liên đỏ rực của Lô cốt Điện Biên (Act 2B)
      if (pr.kind === 'pillbox_mg' && this.act2.hitCooldown <= 0) {
        // Nếu người chơi đang ở dưới 1 trong 3 hố giao thông hào (player.dy >= 22) -> Đạn bay sượt qua trên đầu an toàn 100%!
        if (
          player.dy < 20 &&
          Math.abs(pr.x - player.x) < 20 &&
          player.x >= 2070 &&
          player.x <= 2580
        ) {
          this.act2.hitCooldown = 1.1;
          this.sound.playAlertHit();
          this.vfx.triggerFlash(0.48, 'rgba(239, 68, 68, 0.8)', 2.6);
          this.vfx.triggerShake(12, 0.28);

          // Đẩy lùi người chơi rơi về hố giao thông hào phía sau gần nhất
          if (player.x > 2430) player.x = 2355;
          else if (player.x > 2235) player.x = 2155;
          else player.x = Math.max(2065, player.x - 90);

          player.vx = -180;
          player.dy = sampleGroundOffset(2, player.x);
          player.y = baseGroundY + player.dy;

          this.setHeadNotice(
            'Trúng đạn đại liên! Hãy nhảy xuống hố giao thông hào ẩn nấp khi lỗ châu mai nháy đỏ!',
            'warn',
            2.9
          );
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // 6. Đạn bắn ngang tầm thấp từ 2 Ụ súng Sài Gòn (Act 3B — nhảy W vượt qua!)
      if (pr.kind === 'bunker_bullet' && this.act3.hitCooldown <= 0) {
        if (
          Math.abs(pr.x - player.x) < 18 &&
          pr.y >= player.y - 54 &&
          pr.y <= player.y - 4
        ) {
          this.act3.hitCooldown = 0.85;
          this.sound.playAlertHit();
          this.vfx.triggerFlash(0.36, 'rgba(239, 68, 68, 0.65)', 3.0);
          player.x = Math.max(2195, player.x - 65);
          player.vx = -165;
          this.setHeadNotice(
            'Hãy bấm Nhảy [W / ▲] vượt qua làn đạn thấp và bấm [F] bắn hạ ụ súng địch!',
            'warn',
            2.3
          );
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  // ============================================================================
  // VẼ TRỰC TIẾP TRÊN BẢN ĐỒ (WORLD ENTITIES, ĐOÀN NPC, THANH MÁU HP & CẢNH BÁO)
  // ============================================================================

  renderWorldEntities(ctx, state) {
    const {
      act,
      width,
      baseGroundY,
      getGroundY,
      cameraX,
      interactables,
      isTouchMode,
    } = state;

    // 1. Vẽ Cổng khóa "Đọc văn kiện mở đường" nếu chưa đọc đủ văn kiện của Màn
    this.renderProgressionGate(ctx, act, cameraX, width, getGroundY, interactables);

    // 2. Vẽ các đối tượng chiến trường đặc thù theo từng Màn
    if (act === 2) {
      this.renderAct2WorldCombat(ctx, cameraX, width, getGroundY);
    } else if (act === 3) {
      this.renderAct3WorldCombat(ctx, cameraX, width, baseGroundY, getGroundY);
    } else if (act === 4) {
      this.renderAct4LightPillars(ctx, cameraX, width, getGroundY, interactables, isTouchMode);
    }

    // 3. Vẽ đoàn NPC quần chúng / đồng đội nối đuôi theo sau nhân vật chính
    if (act >= 1 && act <= 3 && this.followers.length > 0) {
      for (const f of this.followers) {
        const sx = f.x - cameraX;
        if (sx < -90 || sx > width + 90) continue;
        drawFollowerComrade(
          ctx,
          sx,
          f.y,
          act,
          f.index,
          {
            facing: f.facing,
            walkCycle: f.walkCycle,
            speedRatio: Math.min(1, Math.abs(f.vx) / 280),
            onGround: f.onGround,
            attackPose: f.attackPose,
            attackTimer: f.attackTimer,
            stealthHidden: act === 1 && this.act1.isHidden,
          },
          this.clock
        );
      }
    }
  }

  renderProgressionGate(ctx, act, cameraX, width, getGroundY, interactables) {
    const gateX = PROGRESSION_GATES[act];
    if (!gateX) return;

    const { visited, total } = this.getActDocProgress(act, interactables);
    if (visited >= total) return;

    const sx = gateX - cameraX;
    if (sx < -140 || sx > width + 140) return;
    const gy = getGroundY(gateX);

    ctx.save();
    ctx.translate(sx, gy);

    // Glowing vertical barrier curtain
    const curtainGrad = ctx.createLinearGradient(0, -170, 0, 0);
    curtainGrad.addColorStop(0, 'rgba(251, 191, 36, 0)');
    curtainGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.16)');
    curtainGrad.addColorStop(1, 'rgba(220, 38, 38, 0.34)');
    ctx.fillStyle = curtainGrad;
    ctx.fillRect(-10, -170, 20, 170);

    // Crossed barricade posts
    ctx.strokeStyle = act === 4 ? '#f59e0b' : '#78350f';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(14, -76);
    ctx.moveTo(16, 0);
    ctx.lineTo(-14, -76);
    ctx.moveTo(-20, -42);
    ctx.lineTo(20, -42);
    ctx.stroke();

    // Compact badge showing X/Y documents read
    const label = `Văn kiện: ${visited}/${total}`;
    ctx.font = '700 11.5px "Be Vietnam Pro", sans-serif';
    const tw = ctx.measureText(label).width + 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    fillRoundedRect(ctx, -tw * 0.5, -106, tw, 24, 12);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-tw * 0.5 + 1, -105, tw - 2, 22);

    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -94);

    ctx.restore();
  }

  renderAct2WorldCombat(ctx, cameraX, width, getGroundY) {
    // 1. Xe thiết giáp Pháp chắn ngang Phố cổ Hà Nội (localX = 1395)
    const tx = 1395 - cameraX;
    if (tx > -180 && tx < width + 180) {
      const tgy = getGroundY(1395);
      if (this.act2.tankDestroyed) {
        // Xác xe tăng Pháp cháy đen bốc khói sau 3 quả bom xăng!
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.translate(tx, tgy + 5);
        ctx.rotate(0.06);
        drawFrenchTank(ctx, 0, 0, -1, 0);
        ctx.fillStyle = 'rgba(234, 88, 12, 0.52)';
        ctx.beginPath();
        ctx.arc(-8, -28 + Math.sin(this.clock * 12) * 3, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        if (this.act2.tankHitFlash > 0) {
          ctx.filter = 'brightness(1.85)';
        }
        drawFrenchTank(ctx, tx, tgy, -1, this.clock);
        ctx.restore();

        if (this.act2.tankMuzzleWarn) {
          ctx.save();
          ctx.fillStyle = '#fb923c';
          ctx.beginPath();
          ctx.arc(tx - 74, tgy - 48, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // 2. Máy bay khu trục cánh quạt Pháp ném bom Điện Biên Phủ
    for (const pl of this.airPlanesAct2) {
      const sx = pl.x - cameraX;
      if (sx > -140 && sx < width + 140) {
        drawPropellerFighter(ctx, sx, pl.y, pl.dir, 0.94, this.clock);
      }
    }
  }

  renderAct3WorldCombat(ctx, cameraX, width, baseGroundY, getGroundY) {
    // 1. Hai Khẩu pháo cao xạ 37mm trên Mỏm đồi Trường Sơn (1662 & 1796)
    for (const g of this.act3.guns) {
      drawAntiAircraft37mmBattery(
        ctx,
        cameraX,
        width,
        getGroundY,
        this.clock,
        g.x,
        g.recoil,
        g.aimAngle
      );
    }

    // 2. Ba Máy bay phản lực địch lượn trên bầu trời Đồi Cao Xạ
    for (const pl of this.act3.planes) {
      if (!pl.alive) continue;
      const sx = pl.x - cameraX;
      if (sx < -140 || sx > width + 140) continue;
      const sy = baseGroundY + pl.altOffset;
      drawJetFighterEnemy(ctx, sx, sy, pl.dir, pl.hitFlash, pl.hp / pl.maxHp);
    }

    // 3. Hai Ụ súng bê tông địch chặn trước Dinh Độc Lập (2410 & 2545)
    for (const bk of this.act3.bunkers) {
      const sx = bk.x - cameraX;
      if (sx < -120 || sx > width + 120) continue;
      drawEnemyGunBunker(
        ctx,
        sx,
        getGroundY(bk.x),
        bk.hp <= 0,
        bk.hitFlash,
        bk.firingAnim > 0,
        this.clock
      );
    }
  }

  renderAct4LightPillars(ctx, cameraX, width, getGroundY, interactables, isTouchMode) {
    const { visited } = this.getActDocProgress(4, interactables);
    for (const px of ACT4_LIGHT_PILLARS) {
      const sx = px - cameraX;
      if (sx < -80 || sx > width + 80) continue;
      const gy = getGroundY(px);
      const isLit = this.act4.activatedPillars.has(px);

      ctx.save();
      ctx.translate(sx, gy);

      // Sleek modern architectural light column
      ctx.fillStyle = '#1e3a5f';
      fillRoundedRect(ctx, -5, -72, 10, 72, 4);
      ctx.strokeStyle = isLit ? '#fde047' : 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-4, -70, 8, 68);

      const orbRadius = isLit ? 38 : visited > 0 ? 24 : 14;
      const glow = ctx.createRadialGradient(0, -78, 2, 0, -78, orbRadius);
      glow.addColorStop(0, isLit ? 'rgba(254, 240, 138, 0.92)' : 'rgba(253, 230, 138, 0.5)');
      glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -78, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      drawStar(ctx, 0, -78, 5, isLit ? 8.5 : 6.5, 3.2, isLit ? '#fef08a' : '#fde68a');
      ctx.restore();
    }
  }

  /**
   * Lớp hiển thị phía trước địa hình: Đạn bay, Vòng đỏ bom rơi, Thanh máu (HP Bars) & Nhãn nổi trên đầu!
   */
  renderCombatHudAndProjectiles(ctx, state) {
    const {
      act,
      width,
      baseGroundY,
      getGroundY,
      cameraX,
      player,
      completedQtes,
      interactables,
      isTouchMode,
    } = state;

    const actBtnLabel = isTouchMode ? '[TẤN CÔNG]' : '[F]';

    ctx.save();

    // 1. Tia đạn cảnh cáo từ tháp canh Nhật
    for (const tr of this.tracerLines) {
      const alpha = 1 - tr.age / tr.life;
      ctx.strokeStyle = `rgba(254, 202, 202, ${alpha})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(tr.x1 - cameraX, tr.y1);
      ctx.lineTo(tr.x2 - cameraX, tr.y2);
      ctx.stroke();
    }

    // 2. Vòng tròn cảnh báo màu đỏ dưới đất + Quả bom đang rơi xuống
    for (const b of this.fallingBombs) {
      const tx = b.targetX - cameraX;
      const tgy = getGroundY(b.targetX);
      const progress = Math.min(1, b.age / b.duration);
      const pulse = 0.55 + Math.abs(Math.sin(this.clock * 14)) * 0.4;

      // Vòng tròn cảnh báo đỏ dưới mặt đất
      const grad = ctx.createRadialGradient(tx, tgy, 4, tx, tgy, 46);
      grad.addColorStop(0, `rgba(239, 68, 68, ${0.56 * pulse})`);
      grad.addColorStop(0.7, `rgba(220, 38, 38, ${0.28 * pulse})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(tx, tgy, 46, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(248, 113, 113, ${0.85 * pulse})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(tx, tgy, 44 * (1 - progress * 0.35), 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Thân bom đang lao xuống
      ctx.save();
      ctx.translate(b.x - cameraX, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx) - Math.PI * 0.5);
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Các loại đạn, chai bom xăng parabol & đạn cao xạ 37mm
    for (const pr of this.projectiles) {
      const sx = pr.x - cameraX;
      if (sx < -60 || sx > width + 60) continue;

      if (pr.kind === 'molotov') {
        ctx.save();
        ctx.translate(sx, pr.y);
        ctx.rotate(this.clock * 14);
        ctx.fillStyle = '#7c2d12';
        fillRoundedRect(ctx, -4, -7, 8, 14, 3);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pr.kind === 'pillbox_mg') {
        // Tràng đạn đại liên đỏ rực bay ngang từ lỗ châu mai Điện Biên
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(sx, pr.y);
        ctx.lineTo(sx + 24, pr.y);
        ctx.stroke();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx, pr.y);
        ctx.lineTo(sx + 10, pr.y);
        ctx.stroke();
      } else if (pr.kind === 'tank_shell' || pr.kind === 'bunker_bullet') {
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.ellipse(sx, pr.y, 9, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sx - 4, pr.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (pr.kind === 'aa_flak') {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(sx, pr.y);
        ctx.lineTo(sx - pr.vx * 0.024, pr.y - pr.vy * 0.024);
        ctx.stroke();
      } else if (pr.kind === 'ak_burst' || pr.kind === 'ak_tracer_visual') {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = pr.kind === 'ak_burst' ? 3.0 : 2.0;
        ctx.beginPath();
        ctx.moveTo(sx, pr.y);
        ctx.lineTo(sx - Math.sign(pr.vx) * 22, pr.y);
        ctx.stroke();
      }
    }

    // 4. THANH MÁU (HP BARS) & HƯỚNG DẪN NGỮ CẢNH TRỰC TIẾP TRÊN BẢN ĐỒ
    if (act === 1) {
      if (this.act1.granaryHp > 0 && !completedQtes.has('qte_1a')) {
        const gx = 2335 - cameraX;
        const gy = getGroundY(2335);
        if (gx > -220 && gx < width + 220) {
          this.drawWorldHealthBar(
            ctx,
            gx,
            gy - 228,
            232,
            this.act1.granaryHp,
            this.act1.granaryDisplayHp,
            this.act1.granaryMaxHp,
            `KHO THÓC NHẬT: ${Math.ceil(this.act1.granaryHp)} / 100 HP`,
            '#eab308'
          );

          if (this.act1.beam2State === 'warning') {
            this.drawCompactWorldTag(
              ctx,
              2428 - cameraX,
              gy - 128,
              'Đèn pha sắp quét qua! Lùi về ụ rơm!',
              '#fb923c'
            );
          } else if (player.x >= 2240 && player.x <= 2395) {
            this.drawCompactWorldTag(
              ctx,
              gx,
              gy - 192,
              `${actBtnLabel} Đập phá cửa Kho thóc!`,
              '#fde047'
            );
          }
        }
      } else if (!completedQtes.has('qte_1b')) {
        const bx = 2720 - cameraX;
        const bgy = getGroundY(2720);
        if (bx > -220 && bx < width + 220) {
          this.drawCompactWorldTag(
            ctx,
            bx,
            bgy - 286,
            `${actBtnLabel} Phất cao Cờ Đỏ Sao Vàng Độc Lập (${this.act1.flagWaves}/${this.act1.flagTarget})`,
            '#fde047'
          );
        }
      }
    }

    if (act === 2) {
      // Thanh máu Thiết giáp Pháp ở Phố cổ Hà Nội
      if (!this.act2.tankDestroyed) {
        const tx = 1395 - cameraX;
        const tgy = getGroundY(1395);
        if (tx > -200 && tx < width + 200) {
          this.drawWorldHealthBar(
            ctx,
            tx,
            tgy - 82,
            208,
            this.act2.tankHp,
            this.act2.tankDisplayHp,
            this.act2.tankMaxHp,
            `THIẾT GIÁP ĐỊCH: ${Math.ceil(this.act2.tankHp)} / 60 HP`,
            '#ef4444'
          );
          if (player.dy <= -42 && player.x >= 1020 && player.x <= 1435) {
            this.drawCompactWorldTag(
              ctx,
              tx,
              tgy - 114,
              `${actBtnLabel} Ném bom xăng tiêu diệt Thiết giáp!`,
              '#fde047'
            );
          }
        }
      }

      // Thanh máu Tập đoàn cứ điểm Điện Biên Phủ
      if (this.act2.pillboxHp > 0 && !completedQtes.has('qte_2a')) {
        const px = 2592 - cameraX;
        const pgy = getGroundY(2592);
        if (px > -260 && px < width + 260) {
          this.drawWorldHealthBar(
            ctx,
            px,
            pgy - 96,
            286,
            this.act2.pillboxHp,
            this.act2.pillboxDisplayHp,
            this.act2.pillboxMaxHp,
            `TẬP ĐOÀN CỨ ĐIỂM ĐIỆN BIÊN: ${Math.ceil(this.act2.pillboxHp)} / 150 HP`,
            '#ef4444'
          );

          if (this.act2.mgWarning) {
            this.drawCompactWorldTag(
              ctx,
              px - 22,
              pgy - 62,
              'Lô cốt nháy đỏ — Nấp xuống hố hào!',
              '#f87171'
            );
          } else if (player.x >= 2495 && player.x <= 2585 && !this.act2.mgFiring) {
            this.drawCompactWorldTag(
              ctx,
              px - 10,
              pgy - 62,
              `${actBtnLabel} Đánh bộc phá Lô cốt!`,
              '#fde047'
            );
          }
        }
      } else if (!completedQtes.has('qte_2b')) {
        const rx = 2695 - cameraX;
        if (rx > -220 && rx < width + 220) {
          this.drawCompactWorldTag(
            ctx,
            rx,
            baseGroundY - 122,
            `${actBtnLabel} Phất cờ Quyết chiến Quyết thắng trên nóc hầm!`,
            '#fde047'
          );
        }
      }
    }

    if (act === 3) {
      // Thanh máu 3 Máy bay địch trên Đồi Cao Xạ
      for (const pl of this.act3.planes) {
        if (!pl.alive) continue;
        const sx = pl.x - cameraX;
        if (sx < -140 || sx > width + 140) continue;
        const sy = baseGroundY + pl.altOffset;
        this.drawWorldHealthBar(
          ctx,
          sx,
          sy - 30,
          134,
          pl.hp,
          pl.displayHp,
          pl.maxHp,
          `MÁY BAY: ${Math.ceil(pl.hp)}/40`,
          '#f87171',
          true
        );
      }

      if (this.act3.planes.some((p) => p.alive)) {
        for (const g of this.act3.guns) {
          if (Math.abs(player.x - g.x) <= 64) {
            this.drawCompactWorldTag(
              ctx,
              g.x - cameraX,
              getGroundY(g.x) - 86,
              `${actBtnLabel} Bắn pháo cao xạ 37mm!`,
              '#fde047'
            );
          }
        }
      }

      // Thanh máu 2 Ụ súng địch chặn đường Xe tăng 390
      for (const bk of this.act3.bunkers) {
        if (bk.hp <= 0) continue;
        const sx = bk.x - cameraX;
        if (sx < -160 || sx > width + 160) continue;
        this.drawWorldHealthBar(
          ctx,
          sx,
          getGroundY(bk.x) - 64,
          164,
          bk.hp,
          bk.displayHp,
          bk.maxHp,
          `${bk.label}: ${Math.ceil(bk.hp)}/50`,
          '#ef4444',
          true
        );
      }

      if (
        !completedQtes.has('qte_3b') &&
        this.act3.bunkers.some((b) => b.hp > 0) &&
        player.x >= 2180 &&
        player.x <= 2530
      ) {
        const tankSx = this.act3.tankX - cameraX;
        if (tankSx > -160 && tankSx < width + 160) {
          this.drawCompactWorldTag(
            ctx,
            tankSx,
            getGroundY(this.act3.tankX) - 134,
            `Bấm ${actBtnLabel} bắn AK dọn ụ súng mở đường cho Xe tăng 390!`,
            '#6ee7b7'
          );
        }
      }
    }

    if (act === 4) {
      const { visited, total } = this.getActDocProgress(4, interactables);
      if (visited >= total && player.x < 1945) {
        for (const px of ACT4_LIGHT_PILLARS) {
          if (Math.abs(player.x - px) <= 85 && !this.act4.activatedPillars.has(px)) {
            this.drawCompactWorldTag(
              ctx,
              px - cameraX,
              getGroundY(px) - 108,
              `${actBtnLabel} Thắp sáng pháo hoa Bình minh Đổi mới`,
              '#fde047'
            );
          }
        }
      }
    }

    // 5. NHÃN NỔI TRỰC TIẾP TRÊN ĐẦU NHÂN VẬT ("Đang ẩn nấp", cảnh báo đèn pha / đạn, nhắc đọc văn kiện)
    if (this.playerHeadNotice) {
      this.drawPlayerHeadNotice(
        ctx,
        player.x - cameraX,
        player.y - 104,
        width,
        this.playerHeadNotice
      );
    }

    ctx.restore();
  }

  drawWorldHealthBar(
    ctx,
    sx,
    sy,
    barWidth,
    hp,
    displayHp,
    maxHp,
    label,
    fillColor = '#ef4444',
    compact = false
  ) {
    const barH = compact ? 8 : 10;
    const padX = compact ? 10 : 14;
    const boxW = barWidth + padX * 2;
    const boxH = compact ? 34 : 40;

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
    fillRoundedRect(ctx, -boxW * 0.5, -boxH * 0.5, boxW, boxH, 9);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-boxW * 0.5, -boxH * 0.5, boxW, boxH, 9);
    } else {
      ctx.rect(-boxW * 0.5, -boxH * 0.5, boxW, boxH);
    }
    ctx.stroke();

    // Label
    ctx.font = compact
      ? '700 10.5px "Be Vietnam Pro", sans-serif'
      : '700 11.5px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = '#fef9c3';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -7);

    // Track background
    const trackX = -barWidth * 0.5;
    const trackY = 5;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
    fillRoundedRect(ctx, trackX, trackY, barWidth, barH, barH * 0.5);

    // Delayed white damage trail
    const trailRatio = Math.max(0, Math.min(1, displayHp / maxHp));
    if (trailRatio > 0) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
      fillRoundedRect(ctx, trackX, trackY, barWidth * trailRatio, barH, barH * 0.5);
    }

    // Actual HP fill
    const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
    if (hpRatio > 0) {
      ctx.fillStyle = fillColor;
      fillRoundedRect(ctx, trackX, trackY, barWidth * hpRatio, barH, barH * 0.5);
    }

    ctx.restore();
  }

  drawCompactWorldTag(ctx, sx, sy, text, borderColor = '#fde047') {
    ctx.save();
    const bob = Math.sin(this.clock * 4) * 2.5;
    ctx.translate(sx, sy + bob);
    ctx.font = '600 11.5px "Be Vietnam Pro", sans-serif';
    const tw = ctx.measureText(text).width + 20;
    const th = 24;

    ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
    fillRoundedRect(ctx, -tw * 0.5, -th * 0.5, tw, th, 12);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-tw * 0.5, -th * 0.5, tw, th, 12);
    } else {
      ctx.rect(-tw * 0.5, -th * 0.5, tw, th);
    }
    ctx.stroke();

    ctx.fillStyle = '#fef9c3';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0.5);
    ctx.restore();
  }

  drawPlayerHeadNotice(ctx, rawSx, sy, viewportWidth, notice) {
    ctx.save();
    ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
    const text = notice.text;
    const tw = ctx.measureText(text).width;
    const pw = tw + 24;
    const ph = 27;

    // Kẹp ngang tự động để câu thông báo dài không bao giờ bị tràn rìa màn hình!
    const clampedSx = Math.max(
      pw * 0.5 + 14,
      Math.min(viewportWidth - pw * 0.5 - 14, rawSx)
    );

    ctx.translate(clampedSx, sy);

    let bg = 'rgba(10, 15, 26, 0.92)';
    let border = 'rgba(253, 224, 71, 0.8)';
    let textCol = '#fef9c3';

    if (notice.tone === 'stealth') {
      bg = 'rgba(6, 28, 22, 0.9)';
      border = 'rgba(52, 211, 153, 0.88)';
      textCol = '#a7f3d0';
    } else if (notice.tone === 'warn') {
      bg = 'rgba(42, 10, 12, 0.93)';
      border = 'rgba(248, 113, 113, 0.92)';
      textCol = '#fecaca';
    } else if (notice.tone === 'gate') {
      bg = 'rgba(28, 18, 8, 0.94)';
      border = 'rgba(251, 191, 36, 0.92)';
      textCol = '#fde68a';
    }

    ctx.fillStyle = bg;
    fillRoundedRect(ctx, -pw * 0.5, -ph * 0.5, pw, ph, ph * 0.5);

    ctx.strokeStyle = border;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-pw * 0.5, -ph * 0.5, pw, ph, ph * 0.5);
    } else {
      ctx.rect(-pw * 0.5, -ph * 0.5, pw, ph);
    }
    ctx.stroke();

    ctx.fillStyle = textCol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0.5);

    ctx.restore();
  }
}
