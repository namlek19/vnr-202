/**
 * Hệ thống VFX & "Game Juice" trên HTML5 Canvas:
 * - Điều khiển timeScale (Slow-motion 0.15x mượt mà khi vào QTE)
 * - Screen Shake (rung chấn camera) & White/Golden Flash (chớp sáng màn hình)
 * - Hệ thống hạt (Mưa rơi, Đom đóm Trường Sơn, Tàn lửa chiến trường, Lúa vàng bay, Hoa nắng hiện đại, Khói hương tri ân)
 * - Đèn pha tuần tra quét (Searchlight Cone) & Máy bay ném bom + Vệt đỏ cảnh báo điểm rơi
 */

export class VfxSystem {
  constructor(soundEngine) {
    this.sound = soundEngine;

    // Time dilation
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
    this.slowMoBlend = 0; // 0 = normal, 1 = full slow-mo

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
    this.bomberCooldown = 1.5;

    // Searchlight state (QTE 1A around x = 2300)
    this.searchlightPhase = 0;
    this.granaryLiberated = false;

    this.clock = 0;
  }

  setSlowMotion(active) {
    this.targetTimeScale = active ? 0.15 : 1.0;
  }

  triggerShake(intensity = 14, duration = 0.45) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(0.05, duration);
    this.shakeTime = duration;
  }

  triggerFlash(alpha = 0.85, color = '#ffffff', decay = 2.0) {
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
    this.flashColor = color;
    this.flashDecay = decay;
  }

  setGranaryLiberated(liberated) {
    this.granaryLiberated = liberated;
  }

  resetAll() {
    this.timeScale = 1.0;
    this.targetTimeScale = 1.0;
    this.slowMoBlend = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;
    this.worldParticles = [];
    this.shockwaves = [];
    this.bombers = [];
    this.fallingBombs = [];
    this.granaryLiberated = false;
  }

  /**
   * Trả về dt đã nhân với timeScale (dùng cho chuyển động thế giới),
   * đồng thời cập nhật toàn bộ hiệu ứng theo rawDt & scaledDt.
   */
  update(rawDt, gameState) {
    // Smooth interpolation of timeScale
    const lerpRate = Math.min(1, rawDt * 10);
    this.timeScale += (this.targetTimeScale - this.timeScale) * lerpRate;
    this.slowMoBlend += ((this.targetTimeScale < 0.5 ? 1 : 0) - this.slowMoBlend) * Math.min(1, rawDt * 8);

    const scaledDt = rawDt * this.timeScale;
    this.clock += scaledDt;

    // Update Screen Shake (runs on rawDt so impact feels punchy even exiting slow-mo)
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - rawDt);
      const progress = this.shakeTime / this.shakeDuration;
      const mag = this.shakeIntensity * progress * progress;
      const t = performance.now() * 0.055;
      this.shakeX = (Math.sin(t * 1.7) + (Math.random() - 0.5) * 0.8) * mag;
      this.shakeY = (Math.cos(t * 2.3) + (Math.random() - 0.5) * 0.8) * mag;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update Flash
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - rawDt * this.flashDecay);
    }

    // Searchlight sweep
    this.searchlightPhase += scaledDt * 1.65;

    // Ambient zone particles (screen-relative & camera-relative)
    this.updateAmbientParticles(scaledDt, gameState);

    // World burst particles (sparks, rice grains, incense smoke, debris)
    this.updateWorldParticles(scaledDt, gameState.groundY);

    // Shockwave rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += rawDt * (0.45 + 0.55 * this.timeScale);
      if (sw.age >= sw.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Bomber flybys in war zones (Act 2 Dien Bien & Act 3 Truong Son bombing zone)
    this.updateBombers(scaledDt, gameState);

    return scaledDt;
  }

  updateAmbientParticles(dt, { playerX, cameraX, width, height, groundY }) {
    // Determine active zone particle profile based on playerX
    const isRainZone = playerX < 2680;
    const isWarEmberZone =
      (playerX >= 3000 && playerX < 6000) || (playerX >= 7750 && playerX < 8600);
    const isFireflyZone = playerX >= 6000 && playerX < 7850;
    const isAscendZone = playerX >= 8750 && playerX < 9450;
    const isModernSunZone = playerX >= 9000;

    // Update rain audio smoothly
    if (this.sound) {
      let rainVol = 0;
      if (playerX < 2500) rainVol = 0.85;
      else if (playerX < 2900) rainVol = Math.max(0, 1 - (playerX - 2500) / 400) * 0.85;
      this.sound.updateRain(rainVol);
    }

    // Spawn ambient particles up to target cap
    const maxCount = 135;
    if (this.ambientParticles.length < maxCount) {
      if (isRainZone) {
        for (let k = 0; k < 5 && this.ambientParticles.length < maxCount; k++) {
          this.ambientParticles.push({
            type: 'rain',
            x: cameraX - 100 + Math.random() * (width + 320),
            y: -30 - Math.random() * height * 0.5,
            vx: -150 - Math.random() * 60,
            vy: 680 + Math.random() * 240,
            len: 14 + Math.random() * 14,
            alpha: 0.22 + Math.random() * 0.3,
          });
        }
      }

      if (isWarEmberZone && Math.random() < 0.65) {
        for (let k = 0; k < 2 && this.ambientParticles.length < maxCount; k++) {
          const isGold = Math.random() < 0.35;
          this.ambientParticles.push({
            type: 'ember',
            x: cameraX - 60 + Math.random() * (width + 180),
            y: groundY + 10 - Math.random() * (height * 0.35),
            vx: -35 + Math.random() * 75,
            vy: -45 - Math.random() * 85,
            size: 1.6 + Math.random() * 2.8,
            seed: Math.random() * Math.PI * 2,
            color: isGold ? '#fbbf24' : '#f97316',
            alpha: 0.55 + Math.random() * 0.4,
            life: 2.2 + Math.random() * 2.5,
            age: 0,
          });
        }
      }

      if (isFireflyZone && Math.random() < 0.55) {
        this.ambientParticles.push({
          type: 'firefly',
          x: cameraX - 80 + Math.random() * (width + 200),
          y: groundY - 30 - Math.random() * (height * 0.58),
          vx: -16 + Math.random() * 32,
          vy: -12 + Math.random() * 24,
          size: 2.2 + Math.random() * 2.4,
          seed: Math.random() * 10,
          color: Math.random() < 0.6 ? '#fde047' : '#6ee7b7',
          life: 4.0 + Math.random() * 3.5,
          age: 0,
        });
      }

      if (isAscendZone && Math.random() < 0.7) {
        this.ambientParticles.push({
          type: 'ascend_light',
          x: cameraX + Math.random() * width,
          y: groundY - Math.random() * (height * 0.5),
          vx: 10 + Math.random() * 25,
          vy: -55 - Math.random() * 65,
          size: 2.0 + Math.random() * 3.2,
          seed: Math.random() * 6.28,
          life: 3.0 + Math.random() * 2.0,
          age: 0,
        });
      }

      if (isModernSunZone && Math.random() < 0.5) {
        this.ambientParticles.push({
          type: 'sun_mote',
          x: cameraX - 60 + Math.random() * (width + 160),
          y: Math.random() * (groundY - 20),
          vx: 18 + Math.random() * 26,
          vy: 10 + Math.random() * 18,
          size: 3 + Math.random() * 7,
          seed: Math.random() * 6.28,
          life: 4.5 + Math.random() * 3.0,
          age: 0,
        });
      }

      // After liberating the Japanese granary in Act 1, gentle golden rice motes float around x = 2200..2600
      if (this.granaryLiberated && playerX > 2050 && playerX < 2700 && Math.random() < 0.45) {
        this.ambientParticles.push({
          type: 'golden_leaf',
          x: 2150 + Math.random() * 450,
          y: groundY - 20 - Math.random() * 260,
          vx: 25 + Math.random() * 45,
          vy: -18 - Math.random() * 25,
          size: 3.2,
          seed: Math.random() * 6.28,
          life: 3.0,
          age: 0,
        });
      }
    }

    // Advance ambient particles
    for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
      const p = this.ambientParticles[i];
      if (p.type === 'rain') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y >= groundY) {
          // Spawn tiny splash droplet occasionally
          if (Math.random() < 0.22 && this.worldParticles.length < 220) {
            this.worldParticles.push({
              kind: 'rain_splash',
              x: p.x,
              y: groundY,
              vx: (Math.random() - 0.5) * 35,
              vy: -40 - Math.random() * 35,
              gravity: 240,
              size: 1.5,
              color: 'rgba(186, 210, 240, 0.55)',
              age: 0,
              life: 0.22,
            });
          }
          this.ambientParticles.splice(i, 1);
        } else if (p.x < cameraX - 260 || p.x > cameraX + width + 360) {
          this.ambientParticles.splice(i, 1);
        }
      } else {
        p.age += dt;
        p.x += (p.vx + Math.sin(this.clock * 2.1 + p.seed) * 16) * dt;
        p.y += p.vy * dt;
        if (p.age >= p.life || p.y < -80 || p.y > height + 60) {
          this.ambientParticles.splice(i, 1);
        }
      }
    }
  }

  updateWorldParticles(dt, groundY) {
    for (let i = this.worldParticles.length - 1; i >= 0; i--) {
      const p = this.worldParticles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.worldParticles.splice(i, 1);
        continue;
      }

      if (p.kind === 'incense_smoke') {
        p.x += (p.vx + Math.sin(this.clock * 2.2 + p.seed) * 18) * dt;
        p.y += p.vy * dt;
        p.size += dt * 7.5;
      } else {
        p.vy += (p.gravity || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rotSpeed) p.rot = (p.rot || 0) + p.rotSpeed * dt;

        // Bounce softly on ground for rice grains & sparks
        if (p.bounce && p.y >= groundY - 2) {
          p.y = groundY - 2;
          p.vy = -Math.abs(p.vy) * 0.42;
          p.vx *= 0.78;
        }
      }
    }
  }

  updateBombers(dt, { playerX, cameraX, width, groundY, activeQteId }) {
    const inDienBienZone = playerX >= 4980 && playerX <= 5620;
    const inTruongSonBombZone = playerX >= 7760 && playerX <= 8420;

    if (inDienBienZone || inTruongSonBombZone) {
      this.bomberCooldown -= dt;
      if (this.bomberCooldown <= 0 && this.bombers.length < 2) {
        this.bomberCooldown = 2.6 + Math.random() * 1.8;
        const dir = Math.random() < 0.7 ? -1 : 1;
        const startX = dir < 0 ? cameraX + width + 220 : cameraX - 220;
        const altitude = 75 + Math.random() * 75;
        this.bombers.push({
          x: startX,
          y: altitude,
          vx: dir * (320 + Math.random() * 90),
          dir,
          dropped: false,
          dropTargetX:
            activeQteId === 'qte_2a'
              ? 5350
              : activeQteId === 'qte_3a'
              ? 8100
              : playerX + (Math.random() * 340 - 120),
        });
      }
    }

    for (let i = this.bombers.length - 1; i >= 0; i--) {
      const b = this.bombers[i];
      b.x += b.vx * dt;

      if (!b.dropped && Math.abs(b.x - b.dropTargetX) < 65) {
        b.dropped = true;
        // Avoid dropping directly on player outside QTE so background bombs feel cinematic & safe
        let targetX = b.dropTargetX;
        if (!activeQteId && Math.abs(targetX - playerX) < 130) {
          targetX = playerX + 185;
        }
        this.fallingBombs.push({
          x: b.x,
          y: b.y + 14,
          targetX,
          vx: (targetX - b.x) * 0.85,
          vy: 90,
          gravity: 460,
        });
      }

      if (b.x < cameraX - 450 || b.x > cameraX + width + 450) {
        this.bombers.splice(i, 1);
      }
    }

    for (let i = this.fallingBombs.length - 1; i >= 0; i--) {
      const bomb = this.fallingBombs[i];
      bomb.vy += bomb.gravity * dt;
      bomb.x += bomb.vx * dt;
      bomb.y += bomb.vy * dt;

      if (bomb.y >= groundY - 4) {
        this.spawnExplosion(bomb.x, groundY, 0.75);
        if (Math.abs(bomb.x - playerX) < 650 && this.sound) {
          this.sound.playExplosion(0.65);
        }
        this.triggerShake(6, 0.25);
        this.fallingBombs.splice(i, 1);
      }
    }
  }

  // ==================== SPECIAL SPAWNERS ====================

  /** Phun trào hạt lúa vàng khi phá cổng kho thóc Nhật (QTE 1A) */
  spawnGrainBurst(worldX, groundY) {
    this.granaryLiberated = true;
    for (let i = 0; i < 110; i++) {
      const angle = -Math.PI * (0.12 + Math.random() * 0.76);
      const speed = 150 + Math.random() * 420;
      this.worldParticles.push({
        kind: 'rice_grain',
        x: worldX + (Math.random() - 0.5) * 50,
        y: groundY - 55 - Math.random() * 65,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 70,
        gravity: 360,
        bounce: true,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 9,
        size: 4.5 + Math.random() * 3.0,
        color: i % 3 === 0 ? '#fef08a' : '#f59e0b',
        age: 0,
        life: 2.4 + Math.random() * 1.6,
      });
    }
    this.spawnShockwave(worldX, groundY - 60, '#fbbf24', 240);
  }

  /** Hiệu ứng nổ pháo kích / bộc phá */
  spawnExplosion(worldX, groundY, scale = 1.0) {
    const count = Math.floor(42 * scale);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * (0.06 + Math.random() * 0.88);
      const speed = (110 + Math.random() * 340) * scale;
      const isSmoke = i % 3 === 0;
      this.worldParticles.push({
        kind: isSmoke ? 'smoke' : 'spark',
        x: worldX + (Math.random() - 0.5) * 26,
        y: groundY - 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: isSmoke ? -35 : 420,
        bounce: !isSmoke,
        size: isSmoke ? 12 + Math.random() * 18 : 2.5 + Math.random() * 4.2,
        color: isSmoke
          ? 'rgba(40, 36, 34, 0.65)'
          : i % 2 === 0
          ? '#fde047'
          : '#ef4444',
        age: 0,
        life: isSmoke ? 1.1 + Math.random() * 0.8 : 0.75 + Math.random() * 0.7,
      });
    }
    this.spawnShockwave(worldX, groundY - 18, '#fb923c', 190 * scale);
  }

  /** Hạt pháo hoa / tia sáng vàng-đỏ khi QTE thành công */
  spawnCelebrationBurst(worldX, worldY, count = 65) {
    const palette = ['#fde047', '#f59e0b', '#ef4444', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 330;
      this.worldParticles.push({
        kind: 'spark',
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        gravity: 210,
        bounce: false,
        size: 2.4 + Math.random() * 3.8,
        color: palette[i % palette.length],
        age: 0,
        life: 1.0 + Math.random() * 0.9,
      });
    }
    this.spawnShockwave(worldX, worldY, '#fde047', 230);
  }

  spawnShockwave(worldX, worldY, color = '#fde047', maxRadius = 200, duration = 0.65) {
    this.shockwaves.push({
      x: worldX,
      y: worldY,
      color,
      maxRadius,
      duration,
      age: 0,
    });
  }

  /** Khói hương vàng ấm bay lên tại Đài tưởng niệm (x = 11400) */
  spawnIncenseSmoke(worldX, altarY, intensity = 1.0) {
    if (Math.random() < 0.68 * intensity) {
      this.worldParticles.push({
        kind: 'incense_smoke',
        x: worldX + (Math.random() - 0.5) * 14,
        y: altarY,
        vx: (Math.random() - 0.5) * 10,
        vy: -36 - Math.random() * 28,
        size: 5 + Math.random() * 7,
        seed: Math.random() * 6.28,
        color: 'rgba(253, 224, 132, 0.34)',
        age: 0,
        life: 2.8 + Math.random() * 1.4,
      });
    }
    if (Math.random() < 0.45 * intensity) {
      this.worldParticles.push({
        kind: 'spark',
        x: worldX + (Math.random() - 0.5) * 40,
        y: altarY - Math.random() * 25,
        vx: (Math.random() - 0.5) * 26,
        vy: -48 - Math.random() * 44,
        gravity: -12,
        size: 2 + Math.random() * 2.6,
        color: '#fef08a',
        age: 0,
        life: 2.1 + Math.random() * 1.2,
      });
    }
  }

  // ==================== RENDERING ====================

  /** Vẽ máy bay ném bom, bom rơi, đèn pha quét và cảnh báo vệt đỏ dưới chân */
  renderHazards(ctx, cameraX, width, groundY, activeQte) {
    // 1. Searchlight Cone near Japanese Granary (x = 2300)
    if (!this.granaryLiberated && cameraX + width > 1950 && cameraX < 2650) {
      const towerX = 2425 - cameraX;
      const towerY = groundY - 235;
      const sweepCenterX = 2295 + Math.sin(this.searchlightPhase) * 105 - cameraX;

      ctx.save();
      const grad = ctx.createLinearGradient(towerX, towerY, sweepCenterX, groundY);
      grad.addColorStop(0, 'rgba(255, 246, 195, 0.58)');
      grad.addColorStop(0.6, 'rgba(254, 240, 138, 0.20)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0.03)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(towerX, towerY);
      ctx.lineTo(sweepCenterX - 78, groundY);
      ctx.lineTo(sweepCenterX + 78, groundY);
      ctx.closePath();
      ctx.fill();

      // Ground light pool
      const poolGrad = ctx.createRadialGradient(
        sweepCenterX,
        groundY,
        6,
        sweepCenterX,
        groundY,
        85
      );
      poolGrad.addColorStop(0, 'rgba(254, 240, 138, 0.46)');
      poolGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.ellipse(sweepCenterX, groundY, 85, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lamp source glow
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(towerX, towerY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Bomber silhouettes in sky
    ctx.save();
    for (const b of this.bombers) {
      const sx = b.x - cameraX;
      const sy = b.y;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(b.dir < 0 ? -1 : 1, 1);

      // Dark sinister bomber silhouette
      ctx.fillStyle = 'rgba(12, 10, 12, 0.88)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 7, 0, 0, Math.PI * 2); // fuselage
      ctx.fill();

      // Swept wing & tail fin
      ctx.beginPath();
      ctx.moveTo(-8, -3);
      ctx.lineTo(-24, -20);
      ctx.lineTo(8, -3);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-36, -2);
      ctx.lineTo(-46, -18);
      ctx.lineTo(-28, -2);
      ctx.closePath();
      ctx.fill();

      // Engine exhaust glint
      ctx.fillStyle = 'rgba(251, 146, 60, 0.65)';
      ctx.beginPath();
      ctx.arc(-44, 1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. Falling bombs + red target indicators
    for (const bomb of this.fallingBombs) {
      const bx = bomb.x - cameraX;
      const tx = bomb.targetX - cameraX;

      // Red warning ring on ground
      this.drawRedDangerZone(ctx, tx, groundY, 52, 0.65);

      // Falling bomb body
      ctx.save();
      ctx.translate(bx, bomb.y);
      ctx.rotate(Math.atan2(bomb.vy, bomb.vx) - Math.PI / 2);
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, -28);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Explicit glowing red danger marker during QTE 2A (x=5350) & QTE 3A (x=8100)
    if (activeQte && (activeQte.id === 'qte_2a' || activeQte.id === 'qte_3a')) {
      const pulse = 0.72 + Math.sin(performance.now() * 0.015) * 0.28;
      this.drawRedDangerZone(ctx, activeQte.x - cameraX, groundY, 92, pulse);
    }

    ctx.restore();
  }

  drawRedDangerZone(ctx, screenX, groundY, radius, alpha) {
    ctx.save();
    const grad = ctx.createRadialGradient(screenX, groundY, 6, screenX, groundY, radius);
    grad.addColorStop(0, `rgba(239, 68, 68, ${0.65 * alpha})`);
    grad.addColorStop(0.65, `rgba(220, 38, 38, ${0.32 * alpha})`);
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, radius, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vertical laser-like danger beacon haze
    const beamGrad = ctx.createLinearGradient(screenX, groundY - 140, screenX, groundY);
    beamGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    beamGrad.addColorStop(1, `rgba(239, 68, 68, ${0.28 * alpha})`);
    ctx.fillStyle = beamGrad;
    ctx.fillRect(screenX - radius * 0.55, groundY - 140, radius * 1.1, 140);
    ctx.restore();
  }

  /** Vẽ toàn bộ hạt môi trường, hạt thế giới, sóng xung kích, viền Slow-mo & Flash */
  renderForeground(ctx, cameraX, width, height) {
    ctx.save();

    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      const t = sw.age / sw.duration;
      const radius = sw.maxRadius * (1 - Math.pow(1 - t, 3));
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, (1 - t) * 0.85);
      ctx.lineWidth = Math.max(1.5, (1 - t) * 6);
      ctx.beginPath();
      ctx.arc(sw.x - cameraX, sw.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Ambient particles
    for (const p of this.ambientParticles) {
      const sx = p.x - cameraX;
      if (sx < -60 || sx > width + 60) continue;

      if (p.type === 'rain') {
        ctx.strokeStyle = `rgba(186, 208, 238, ${p.alpha})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(sx, p.y);
        ctx.lineTo(sx + p.vx * 0.022, p.y + p.len);
        ctx.stroke();
      } else if (p.type === 'ember') {
        const fade = Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = Math.max(0, fade * p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'firefly') {
        const pulse = (Math.sin(this.clock * 4.2 + p.seed) * 0.5 + 0.5) * Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = Math.max(0, pulse * 0.9);
        const g = ctx.createRadialGradient(sx, p.y, 0.5, sx, p.y, p.size * 4.2);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.3, p.color);
        g.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size * 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ascend_light') {
        const fade = Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sun_mote') {
        const fade = Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = fade * 0.26;
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'golden_leaf') {
        const fade = Math.sin((p.age / p.life) * Math.PI);
        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(sx, p.y, p.size * 1.4, p.size * 0.7, this.clock + p.seed, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 3. World burst particles
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
        ctx.ellipse(0, 0, p.size, p.size * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'incense_smoke') {
        const smokeAlpha = Math.sin((1 - ratio) * Math.PI) * 0.35;
        ctx.globalAlpha = Math.max(0, smokeAlpha);
        const sg = ctx.createRadialGradient(sx, p.y, 1, sx, p.y, p.size * 2.1);
        sg.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
        sg.addColorStop(0.55, 'rgba(245, 196, 81, 0.3)');
        sg.addColorStop(1, 'rgba(245, 196, 81, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size * 2.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Cinematic Slow-Motion Focus Vignette
    if (this.slowMoBlend > 0.02) {
      const vGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.55,
        width * 0.18,
        width * 0.5,
        height * 0.5,
        width * 0.68
      );
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(0.72, `rgba(8, 12, 24, ${0.42 * this.slowMoBlend})`);
      vGrad.addColorStop(1, `rgba(217, 165, 68, ${0.28 * this.slowMoBlend})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. Screen Flash Overlay
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

