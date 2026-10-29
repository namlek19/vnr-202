import { drawPropellerFighter } from './artAssets.js';

/**
 * Hệ thống VFX & Không khí Hạt (Limbo / Gris Atmospheric Juice)
 * Hoạt động theo không gian độc lập từng Màn (act = 1..4, localX = 0..3000)
 * và tương thích hoàn toàn với địa hình đa tầng groundY(localX).
 */

export class VfxSystem {
  constructor(soundEngine) {
    this.sound = soundEngine;

    // Time dilation (0.15x khi vào QTE)
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
    this.slowMoBlend = 0;

    // Screen Shake
    this.shakeTime = 0;
    this.shakeDuration = 0.001;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    // Screen Flash
    this.flashAlpha = 0;
    this.flashColor = '#ffffff';
    this.flashDecay = 2.2;

    // Particle pools
    this.ambientParticles = [];
    this.worldParticles = [];
    this.shockwaves = [];

    // Bomber & Bombs
    this.bombers = [];
    this.fallingBombs = [];
    this.bomberCooldown = 1.4;

    // Searchlight state (Act 1 Granary around localX = 2300)
    this.searchlightPhase = 0;
    this.granaryLiberated = false;

    this.clock = 0;
  }

  setSlowMotion(active) {
    this.targetTimeScale = active ? 0.15 : 1.0;
  }

  triggerShake(intensity = 12, duration = 0.4) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(0.05, duration);
    this.shakeTime = duration;
  }

  triggerFlash(alpha = 0.8, color = '#ffffff', decay = 2.0) {
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
    this.flashColor = color;
    this.flashDecay = decay;
  }

  setGranaryLiberated(liberated) {
    this.granaryLiberated = liberated;
  }

  clearSceneParticles() {
    this.ambientParticles = [];
    this.worldParticles = [];
    this.shockwaves = [];
    this.bombers = [];
    this.fallingBombs = [];
  }

  resetAll() {
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
    this.slowMoBlend = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;
    this.granaryLiberated = false;
    this.clearSceneParticles();
  }

  update(rawDt, gameState) {
    const lerpRate = Math.min(1, rawDt * 10);
    this.timeScale += (this.targetTimeScale - this.timeScale) * lerpRate;
    this.slowMoBlend +=
      ((this.targetTimeScale < 0.5 ? 1 : 0) - this.slowMoBlend) * Math.min(1, rawDt * 8);

    const scaledDt = rawDt * this.timeScale;
    this.clock += scaledDt;

    // Update Screen Shake
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - rawDt);
      const progress = this.shakeTime / this.shakeDuration;
      const mag = this.shakeIntensity * progress * progress;
      const t = performance.now() * 0.055;
      this.shakeX = (Math.sin(t * 1.7) + (Math.random() - 0.5) * 0.7) * mag;
      this.shakeY = (Math.cos(t * 2.3) + (Math.random() - 0.5) * 0.7) * mag;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - rawDt * this.flashDecay);
    }

    this.searchlightPhase += scaledDt * 1.55;

    this.updateAmbientParticles(scaledDt, gameState);
    this.updateWorldParticles(scaledDt, gameState.getGroundY);

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += rawDt * (0.45 + 0.55 * this.timeScale);
      if (sw.age >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    this.updateBombers(scaledDt, gameState);

    return scaledDt;
  }

  updateAmbientParticles(dt, { act, playerX, cameraX, width, height, getGroundY }) {
    const isRainZone = act === 1 && playerX < 2580;
    const isWarEmberZone =
      act === 2 || (act === 3 && playerX >= 1740 && playerX < 2450);
    const isFireflyZone = act === 3 && playerX < 1780;
    const isModernSunZone = act === 4;

    // Smooth rain audio control
    if (this.sound) {
      let rainVol = 0;
      if (act === 1) {
        if (playerX < 2400) rainVol = 0.8;
        else if (playerX < 2700) rainVol = Math.max(0, 1 - (playerX - 2400) / 300) * 0.8;
      }
      this.sound.updateRain(rainVol);
    }

    const maxCount = 115;
    if (this.ambientParticles.length < maxCount) {
      if (isRainZone) {
        for (let k = 0; k < 4 && this.ambientParticles.length < maxCount; k++) {
          this.ambientParticles.push({
            type: 'rain',
            x: cameraX - 80 + Math.random() * (width + 260),
            y: -30 - Math.random() * height * 0.45,
            vx: -135 - Math.random() * 55,
            vy: 690 + Math.random() * 220,
            len: 13 + Math.random() * 12,
            alpha: 0.16 + Math.random() * 0.22,
          });
        }
      }

      if (isWarEmberZone && Math.random() < 0.55) {
        const px = cameraX - 40 + Math.random() * (width + 120);
        const gy = getGroundY(px);
        this.ambientParticles.push({
          type: 'ember',
          x: px,
          y: gy + 6 - Math.random() * (height * 0.3),
          vx: -28 + Math.random() * 58,
          vy: -38 - Math.random() * 68,
          size: 1.1 + Math.random() * 1.9,
          seed: Math.random() * Math.PI * 2,
          color: Math.random() < 0.35 ? '#fcd34d' : '#ea580c',
          alpha: 0.45 + Math.random() * 0.35,
          life: 2.2 + Math.random() * 2.2,
          age: 0,
        });
      }

      if (isFireflyZone && Math.random() < 0.42) {
        const px = cameraX - 40 + Math.random() * (width + 120);
        const gy = getGroundY(px);
        this.ambientParticles.push({
          type: 'firefly',
          x: px,
          y: gy - 28 - Math.random() * (height * 0.5),
          vx: -14 + Math.random() * 28,
          vy: -10 + Math.random() * 20,
          size: 1.5 + Math.random() * 1.4,
          seed: Math.random() * 10,
          color: Math.random() < 0.55 ? '#fef08a' : '#6ee7b7',
          life: 4.0 + Math.random() * 3.0,
          age: 0,
        });
      }

      if (isModernSunZone && Math.random() < 0.38) {
        this.ambientParticles.push({
          type: 'sun_mote',
          x: cameraX - 40 + Math.random() * (width + 120),
          y: Math.random() * (height * 0.72),
          vx: 14 + Math.random() * 20,
          vy: 8 + Math.random() * 14,
          size: 1.8 + Math.random() * 3.2,
          seed: Math.random() * 6.28,
          life: 4.5 + Math.random() * 2.8,
          age: 0,
        });
      }
    }

    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const p = this.ambientParticles[i];
      if (p.type === 'rain') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const floorY = getGroundY(p.x);
        if (p.y >= floorY) {
          if (Math.random() < 0.18 && this.worldParticles.length < 180) {
            this.worldParticles.push({
              kind: 'rain_splash',
              x: p.x,
              y: floorY,
              vx: (Math.random() - 0.5) * 32,
              vy: -36 - Math.random() * 28,
              gravity: 240,
              size: 1.2,
              color: 'rgba(186, 210, 240, 0.42)',
              age: 0,
              life: 0.2,
            });
          }
          this.ambientParticles.splice(i, 1);
        } else if (p.x < cameraX - 240 || p.x > cameraX + width + 320) {
          this.ambientParticles.splice(i, 1);
        }
      } else {
        p.age += dt;
        p.x += (p.vx + Math.sin(this.clock * 1.9 + p.seed) * 13) * dt;
        p.y += p.vy * dt;
        if (p.age >= p.life || p.y < -80 || p.y > height + 80) {
          this.ambientParticles.splice(i, 1);
        }
      }
    }
  }

  updateWorldParticles(dt, getGroundY) {
    for (let i = this.worldParticles.length - 1; i >= 0; i--) {
      const p = this.worldParticles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.worldParticles.splice(i, 1);
        continue;
      }

      if (p.kind === 'incense_smoke') {
        p.x += (p.vx + Math.sin(this.clock * 2.1 + p.seed) * 15) * dt;
        p.y += p.vy * dt;
        p.size += dt * 5.8;
      } else if (p.kind === 'dawn_transmute') {
        p.x += (p.vx + Math.sin(this.clock * 2.5 + p.seed) * 20) * dt;
        p.y += p.vy * dt;
      } else {
        p.vy += (p.gravity || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rotSpeed) p.rot = (p.rot || 0) + p.rotSpeed * dt;

        if (p.bounce) {
          const floorY = getGroundY(p.x);
          if (p.y >= floorY - 2) {
            p.y = floorY - 2;
            p.vy = -Math.abs(p.vy) * 0.4;
            p.vx *= 0.76;
          }
        }
      }
    }
  }

  updateBombers(dt, { act, playerX, cameraX, width, getGroundY, activeQteId }) {
    const inDienBienZone = act === 2 && playerX >= 2050 && playerX <= 2620;
    const inTruongSonBombZone = act === 3 && playerX >= 1750 && playerX <= 2350;

    if (inDienBienZone || inTruongSonBombZone) {
      this.bomberCooldown -= dt;
      if (this.bomberCooldown <= 0 && this.bombers.length < 2) {
        this.bomberCooldown = 2.8 + Math.random() * 1.8;
        const dir = Math.random() < 0.72 ? -1 : 1;
        const startX = dir < 0 ? cameraX + width + 200 : cameraX - 200;
        const altitude = 68 + Math.random() * 68;
        this.bombers.push({
          x: startX,
          y: altitude,
          vx: dir * (310 + Math.random() * 85),
          dir,
          dropped: false,
          dropTargetX:
            activeQteId === 'qte_2a'
              ? 2350
              : activeQteId === 'qte_3a'
              ? 2050
              : Math.max(180, Math.min(2780, playerX + (Math.random() * 320 - 110))),
        });
      }
    }

    for (let i = this.bombers.length - 1; i >= 0; i--) {
      const b = this.bombers[i];
      b.x += b.vx * dt;

      if (!b.dropped && Math.abs(b.x - b.dropTargetX) < 65) {
        b.dropped = true;
        let targetX = b.dropTargetX;
        if (!activeQteId && Math.abs(targetX - playerX) < 135) {
          targetX = Math.min(2780, playerX + 185);
        }
        this.fallingBombs.push({
          x: b.x,
          y: b.y + 12,
          targetX,
          vx: (targetX - b.x) * 0.85,
          vy: 85,
          gravity: 460,
        });
      }

      if (b.x < cameraX - 420 || b.x > cameraX + width + 420) {
        this.bombers.splice(i, 1);
      }
    }

    for (let i = this.fallingBombs.length - 1; i >= 0; i--) {
      const bomb = this.fallingBombs[i];
      bomb.vy += bomb.gravity * dt;
      bomb.x += bomb.vx * dt;
      bomb.y += bomb.vy * dt;

      const floorY = getGroundY(bomb.x);
      if (bomb.y >= floorY - 4) {
        this.spawnExplosion(bomb.x, floorY, 0.72);
        if (Math.abs(bomb.x - playerX) < 620 && this.sound) {
          this.sound.playExplosion(0.62);
        }
        this.triggerShake(5.5, 0.22);
        this.fallingBombs.splice(i, 1);
      }
    }
  }

  // ==================== SPECIAL SPAWNERS ====================

  /** Tàn lửa bay theo bước chạy từ ngọn đuốc rực lửa của Người Ông (Màn 1) */
  spawnTorchEmber(worldX, worldY, facingDir = 1) {
    if (this.worldParticles.length > 190) return;
    this.worldParticles.push({
      kind: 'spark',
      x: worldX + (Math.random() - 0.5) * 6,
      y: worldY + (Math.random() - 0.5) * 6,
      vx: -facingDir * (22 + Math.random() * 48) + (Math.random() - 0.5) * 14,
      vy: -26 - Math.random() * 44,
      gravity: -18,
      bounce: false,
      size: 1.4 + Math.random() * 1.9,
      color: Math.random() < 0.48 ? '#fef08a' : '#f97316',
      age: 0,
      life: 0.42 + Math.random() * 0.36,
    });
  }

  spawnLandDust(worldX, worldY) {
    for (let i = 0; i < 6; i++) {
      this.worldParticles.push({
        kind: 'dust',
        x: worldX + (Math.random() - 0.5) * 14,
        y: worldY - 2,
        vx: (i % 2 === 0 ? -1 : 1) * (20 + Math.random() * 42),
        vy: -12 - Math.random() * 24,
        gravity: 65,
        size: 1.8 + Math.random() * 2.2,
        color: 'rgba(203, 213, 225, 0.32)',
        age: 0,
        life: 0.35 + Math.random() * 0.18,
      });
    }
  }

  spawnGrainBurst(worldX, groundY) {
    this.granaryLiberated = true;
    for (let i = 0; i < 105; i++) {
      const angle = -Math.PI * (0.12 + Math.random() * 0.76);
      const speed = 140 + Math.random() * 400;
      this.worldParticles.push({
        kind: 'rice_grain',
        x: worldX + (Math.random() - 0.5) * 44,
        y: groundY - 52 - Math.random() * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 65,
        gravity: 360,
        bounce: true,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 9,
        size: 4.2 + Math.random() * 2.6,
        color: i % 3 === 0 ? '#fef08a' : '#eab308',
        age: 0,
        life: 2.3 + Math.random() * 1.5,
      });
    }
    this.spawnShockwave(worldX, groundY - 58, '#fbbf24', 220);
  }

  spawnExplosion(worldX, groundY, scale = 1.0) {
    const count = Math.floor(38 * scale);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * (0.06 + Math.random() * 0.88);
      const speed = (105 + Math.random() * 320) * scale;
      const isSmoke = i % 3 === 0;
      this.worldParticles.push({
        kind: isSmoke ? 'smoke' : 'spark',
        x: worldX + (Math.random() - 0.5) * 24,
        y: groundY - 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: isSmoke ? -32 : 420,
        bounce: !isSmoke,
        size: isSmoke ? 10 + Math.random() * 15 : 2.0 + Math.random() * 3.4,
        color: isSmoke
          ? 'rgba(34, 30, 28, 0.58)'
          : i % 2 === 0
          ? '#fde047'
          : '#ef4444',
        age: 0,
        life: isSmoke ? 1.05 + Math.random() * 0.7 : 0.7 + Math.random() * 0.65,
      });
    }
    this.spawnShockwave(worldX, groundY - 16, '#fb923c', 180 * scale);
  }

  spawnCelebrationBurst(worldX, worldY, count = 48) {
    const palette = ['#fde047', '#f59e0b', '#ef4444', '#f8fafc'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 290;
      this.worldParticles.push({
        kind: 'spark',
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 55,
        gravity: 210,
        bounce: false,
        size: 1.8 + Math.random() * 3.0,
        color: palette[i % palette.length],
        age: 0,
        life: 0.95 + Math.random() * 0.85,
      });
    }
    this.spawnShockwave(worldX, worldY, '#fde047', 200);
  }

  /** Khói lửa chiến trường tan thành hạt sáng bình minh (Cuối Màn 3) */
  spawnDawnTransformation(worldX, groundY) {
    if (Math.random() < 0.75) {
      this.worldParticles.push({
        kind: 'dawn_transmute',
        x: worldX + (Math.random() - 0.5) * 140,
        y: groundY - 10 - Math.random() * 55,
        vx: (Math.random() - 0.5) * 18,
        vy: -55 - Math.random() * 65,
        size: 2.2 + Math.random() * 2.6,
        seed: Math.random() * 6.28,
        age: 0,
        life: 2.0 + Math.random() * 1.1,
      });
    }
  }

  spawnShockwave(worldX, worldY, color = '#fde047', maxRadius = 190, duration = 0.62) {
    this.shockwaves.push({
      x: worldX,
      y: worldY,
      color,
      maxRadius,
      duration,
      age: 0,
    });
  }

  spawnIncenseSmoke(worldX, altarY, intensity = 1.0) {
    if (Math.random() < 0.65 * intensity) {
      this.worldParticles.push({
        kind: 'incense_smoke',
        x: worldX + (Math.random() - 0.5) * 10,
        y: altarY,
        vx: (Math.random() - 0.5) * 8,
        vy: -34 - Math.random() * 24,
        size: 4 + Math.random() * 5.5,
        seed: Math.random() * 6.28,
        age: 0,
        life: 2.6 + Math.random() * 1.3,
      });
    }
    if (Math.random() < 0.35 * intensity) {
      this.worldParticles.push({
        kind: 'spark',
        x: worldX + (Math.random() - 0.5) * 32,
        y: altarY - Math.random() * 20,
        vx: (Math.random() - 0.5) * 20,
        vy: -44 - Math.random() * 38,
        gravity: -10,
        size: 1.6 + Math.random() * 2.0,
        color: '#fef08a',
        age: 0,
        life: 2.0 + Math.random() * 1.0,
      });
    }
  }

  // ==================== RENDERING ====================

  renderHazards(ctx, act, cameraX, width, getGroundY, activeQte) {
    // 1. Primary Searchlight Cone from Japanese Granary Right Watchtower (Act 1, x = 2445)
    if (act === 1 && !this.granaryLiberated && cameraX + width > 1860 && cameraX < 2640) {
      const towerWorldX = 2445;
      const towerX = towerWorldX - cameraX - 16;
      const towerY = getGroundY(towerWorldX) - 236;
      const sweepWorldX = 2195 + Math.sin(this.searchlightPhase) * 145;
      const sweepCenterX = sweepWorldX - cameraX;
      const sweepGroundY = getGroundY(sweepWorldX);

      ctx.save();
      const grad = ctx.createLinearGradient(towerX, towerY, sweepCenterX, sweepGroundY);
      grad.addColorStop(0, 'rgba(255, 248, 205, 0.48)');
      grad.addColorStop(0.65, 'rgba(254, 240, 138, 0.14)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0.02)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(towerX, towerY);
      ctx.lineTo(sweepCenterX - 68, sweepGroundY);
      ctx.lineTo(sweepCenterX + 68, sweepGroundY);
      ctx.closePath();
      ctx.fill();

      // Subtle light pool on ground
      const poolGrad = ctx.createRadialGradient(
        sweepCenterX,
        sweepGroundY,
        4,
        sweepCenterX,
        sweepGroundY,
        74
      );
      poolGrad.addColorStop(0, 'rgba(254, 240, 138, 0.34)');
      poolGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.ellipse(sweepCenterX, sweepGroundY, 74, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Aircraft / Bomber silhouettes (Act 2: French propeller fighter-bomber; Act 3: Jet bomber)
    ctx.save();
    for (const b of this.bombers) {
      const sx = b.x - cameraX;
      if (act === 2) {
        drawPropellerFighter(ctx, sx, b.y, b.dir, 0.96, this.clock);
      } else {
        ctx.save();
        ctx.translate(sx, b.y);
        ctx.scale(b.dir < 0 ? -1 : 1, 1);

        ctx.fillStyle = 'rgba(10, 9, 12, 0.9)';
        ctx.beginPath();
        ctx.moveTo(48, 1);
        ctx.quadraticCurveTo(16, -7, -44, -2);
        ctx.lineTo(-52, -16);
        ctx.lineTo(-36, -2);
        ctx.lineTo(-46, 4);
        ctx.quadraticCurveTo(14, 7, 48, 1);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(6, -1);
        ctx.lineTo(-18, -19);
        ctx.lineTo(-26, -17);
        ctx.lineTo(-8, 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. Falling bombs + red target marker
    for (const bomb of this.fallingBombs) {
      const bx = bomb.x - cameraX;
      const tx = bomb.targetX - cameraX;
      const tgy = getGroundY(bomb.targetX);

      this.drawRedDangerZone(ctx, tx, tgy, 48, 0.55);

      ctx.save();
      ctx.translate(bx, bomb.y);
      ctx.rotate(Math.atan2(bomb.vy, bomb.vx) - Math.PI / 2);
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Explicit danger marker during QTE 2A & QTE 3A
    if (activeQte && (activeQte.id === 'qte_2a' || activeQte.id === 'qte_3a')) {
      const pulse = 0.68 + Math.sin(performance.now() * 0.014) * 0.25;
      const gy = getGroundY(activeQte.x);
      this.drawRedDangerZone(ctx, activeQte.x - cameraX, gy, 84, pulse);
    }

    ctx.restore();
  }

  drawRedDangerZone(ctx, screenX, groundY, radius, alpha) {
    ctx.save();
    const grad = ctx.createRadialGradient(screenX, groundY, 4, screenX, groundY, radius);
    grad.addColorStop(0, `rgba(239, 68, 68, ${0.58 * alpha})`);
    grad.addColorStop(0.65, `rgba(220, 38, 38, ${0.26 * alpha})`);
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, radius, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderForeground(ctx, cameraX, width, height) {
    ctx.save();

    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      const t = sw.age / sw.duration;
      const radius = sw.maxRadius * (1 - Math.pow(1 - t, 3));
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, (1 - t) * 0.78);
      ctx.lineWidth = Math.max(1.2, (1 - t) * 5);
      ctx.beginPath();
      ctx.arc(sw.x - cameraX, sw.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Ambient particles (subtle, fine-grained, zero "AI orb" clutter)
    for (const p of this.ambientParticles) {
      const sx = p.x - cameraX;
      if (sx < -40 || sx > width + 40) continue;

      if (p.type === 'rain') {
        ctx.strokeStyle = `rgba(191, 211, 238, ${p.alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(sx, p.y);
        ctx.lineTo(sx + p.vx * 0.02, p.y + p.len);
        ctx.stroke();
      } else if (p.type === 'ember') {
        const fade = Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = Math.max(0, fade * p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'firefly') {
        const pulse =
          (Math.sin(this.clock * 3.8 + p.seed) * 0.5 + 0.5) *
          Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = Math.max(0, pulse * 0.8);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sun_mote') {
        const fade = Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = fade * 0.2;
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 3. World burst & ceremonial particles
    for (const p of this.worldParticles) {
      const sx = p.x - cameraX;
      if (sx < -80 || sx > width + 80) continue;
      const ratio = 1 - p.age / p.life;

      ctx.save();
      ctx.globalAlpha = Math.max(0, ratio);
      if (p.kind === 'rice_grain') {
        ctx.translate(sx, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'incense_smoke') {
        const smokeAlpha = Math.sin((1 - ratio) * Math.PI) * 0.28;
        ctx.globalAlpha = Math.max(0, smokeAlpha);
        const sg = ctx.createRadialGradient(sx, p.y, 1, sx, p.y, p.size * 2.0);
        sg.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
        sg.addColorStop(0.55, 'rgba(245, 196, 81, 0.24)');
        sg.addColorStop(1, 'rgba(245, 196, 81, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size * 2.0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'dawn_transmute') {
        // Starts dark grey ash at bottom, turns warm golden dawn mote as it rises!
        const riseProgress = p.age / p.life;
        ctx.fillStyle = riseProgress < 0.35 ? 'rgba(148, 163, 184, 0.55)' : '#fef08a';
        ctx.globalAlpha = Math.sin(riseProgress * Math.PI) * 0.88;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Slow-Motion Vignette
    if (this.slowMoBlend > 0.02) {
      const vGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.52,
        width * 0.2,
        width * 0.5,
        height * 0.5,
        width * 0.7
      );
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(1, `rgba(6, 9, 16, ${0.52 * this.slowMoBlend})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. Screen Flash
    if (this.flashAlpha > 0.005) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.flashAlpha);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.restore();
  }
}
