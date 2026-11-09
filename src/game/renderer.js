import {
  ACTS,
  WORLD_CONFIG,
  FINALE_EVENT,
  sampleGroundOffset,
} from '../data/storyData.js';
import {
  fillRoundedRect,
  drawStar,
  drawWavingFlag,
  drawBambooCluster,
  drawDetailedCharacter,
  drawVillageDinhAndBanyan,
  drawSecretCellarAndHut,
  drawPacBoKarstAndStream,
  drawJapaneseGranaryAndTowers,
  drawBaDinhTribune,
  drawPropellerFighter,
  drawOldHanoiStreetscape,
  drawDienBienFortress,
  drawRockCaveLiaisonPost,
  drawTruongSonTruckConvoy,
  drawAntiAircraft37mmBattery,
  drawIndependencePalaceDetailed,
  drawModernSkylineAndBridge,
  drawElevatedMetroLine,
  drawModernUniversityGate,
  drawMonumentHillAndMemorial,
  drawWavingVietnamSkyFlag,
  drawFallenComradesSalute,
  drawDetailedPlatformSurface,
} from './artAssets.js';

/**
 * Clean & Atmospheric 2D Silhouette + Multi-Tier Platformer Renderer
 * Phong cách tối giản, chiều sâu sương mù đa lớp của Limbo / Gris
 * kết hợp Đồ họa Vector Chi tiết & Rim-lighting từ artAssets.js.
 */

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(hexA, hexB, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const c1 = hexToRgb(hexA);
  const c2 = hexToRgb(hexB);
  return `rgb(${Math.round(lerp(c1.r, c2.r, clamped))}, ${Math.round(
    lerp(c1.g, c2.g, clamped)
  )}, ${Math.round(lerp(c1.b, c2.b, clamped))})`;
}

export class WorldRenderer {
  constructor() {
    this.time = 0;
    this.scarfTrail = [];
    this.lastTrailAct = 1;
  }

  resetScarfTrail() {
    this.scarfTrail = [];
  }

  computeActPalette(actId, localX, completedQtes) {
    const actCfg = ACTS.find((a) => a.id === actId) || ACTS[0];
    const p = { ...actCfg.palette };

    // Subtle intra-Act mood shifts (STRICTLY PRESERVED)
    if (actId === 1 && localX > 2420) {
      const t = Math.min(1, (localX - 2420) / 480) * (completedQtes.has('qte_1b') ? 0.92 : 0.42);
      p.skyMid = lerpColor(p.skyMid, '#541816', t);
      p.skyBot = lerpColor(p.skyBot, '#b85324', t);
    } else if (actId === 3) {
      if (localX > 1700 && localX < 2380) {
        const flareT = Math.sin(((localX - 1700) / 680) * Math.PI) * 0.85;
        p.skyTop = lerpColor(p.skyTop, '#210a0d', flareT);
        p.skyMid = lerpColor(p.skyMid, '#61191c', flareT);
        p.skyBot = lerpColor(p.skyBot, '#b83d0d', flareT);
      } else if (localX >= 2340) {
        const springT = Math.min(1, (localX - 2340) / 480);
        p.skyTop = lerpColor(p.skyTop, '#1e4273', springT * 0.65);
        p.skyMid = lerpColor(p.skyMid, '#b88328', springT * 0.68);
        p.skyBot = lerpColor(p.skyBot, '#f5d27a', springT * 0.75);
      }
    }
    return p;
  }

  render(ctx, state, vfx) {
    const {
      act,
      width,
      height,
      baseGroundY,
      getGroundY,
      cameraX,
      cameraY = 0,
      cameraZoom,
      player,
      companionsState = null,
      combatSystem = null,
      interactables,
      nearbyInteractable,
      nearbyObstacleHint,
      completedQtes,
      activeQte,
      tankProgress,
      transitionState,
      finaleState,
      isTouchMode = false,
      autoSeekItem = null,
      dt,
    } = state;

    this.time += dt;
    if (this.lastTrailAct !== act) {
      this.lastTrailAct = act;
      this.scarfTrail = [];
    }

    const palette = this.computeActPalette(act, player.x, completedQtes);

    ctx.save();

    if (cameraZoom !== 1 || vfx.shakeX !== 0 || vfx.shakeY !== 0 || cameraY !== 0) {
      const cx = width * 0.5;
      const cy = baseGroundY - 65;
      ctx.translate(cx + vfx.shakeX, cy + vfx.shakeY);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-cx, -cy);
      ctx.translate(0, -cameraY);
    }

    // 1. Atmospheric Sky + Moon / Dawn Sun (STRICTLY PRESERVED)
    this.drawSky(ctx, act, width, height, baseGroundY, player.x, palette, cameraY);

    // 2. Far Horizon Parallax (0.16x): Mountain Ridges / Modern Skyline & Multi-Span Cable Bridge
    this.drawFarLayer(ctx, act, width, baseGroundY, cameraX, palette);

    // 3. Mid-Far Parallax (0.35x): Old Quarter Roofs, Tây Bắc Convoys, Trường Sơn Trucks, Metro
    this.drawMidFarLayer(ctx, act, width, baseGroundY, cameraX, palette);

    // 4. Mid-Near Detailed Architecture & Nature (Banyan, Đình làng, Power webs, Jungle, Uni Gate)
    this.drawMidNearLayer(ctx, act, width, baseGroundY, getGroundY, cameraX, palette);

    // 5. Hazards (Searchlight, Propeller Fighters / Bombers, Falling Bombs)
    vfx.renderHazards(ctx, act, cameraX, width, getGroundY, activeQte);

    // 6. Detailed Stage Landmarks & Multi-Tier Platforms (1.0x)
    this.drawPlatformsAndLandmarks(
      ctx,
      act,
      width,
      baseGroundY,
      getGroundY,
      cameraX,
      completedQtes,
      activeQte,
      tankProgress,
      finaleState,
      nearbyObstacleHint,
      isTouchMode,
      combatSystem
    );

    // 7. Grounded Historical Interactables (Clean silhouettes; [E] / [Chạm] hint ONLY when nearby)
    this.drawInteractables(
      ctx,
      act,
      baseGroundY,
      getGroundY,
      cameraX,
      width,
      interactables,
      nearbyInteractable,
      isTouchMode,
      autoSeekItem
    );

    // 8. In-World Combat Entities, Progression Gates & Trailing NPC Follower Squad
    if (combatSystem) {
      combatSystem.renderWorldEntities(ctx, state);
    }

    // 9. Waiting Successor at End of Act 2 & Act 3 (localX = 2860)
    this.drawWaitingSuccessor(ctx, act, getGroundY, cameraX, transitionState);

    // 10. Waving Vietnam Flag in the Left 2/3 Sky & Six Fallen Comrades Saluting Around the Monument (Act 4 Finale)
    if (act === 4) {
      const flagSyncProgress = Math.max(
        finaleState.spiritsAlpha || 0,
        finaleState.holdProgress || 0
      );
      if (flagSyncProgress > 0.01) {
        drawWavingVietnamSkyFlag(
          ctx,
          cameraX,
          width,
          baseGroundY,
          FINALE_EVENT.x,
          flagSyncProgress,
          this.time
        );
      }

      const saluteAlpha = Math.max(
        finaleState.spiritsAlpha,
        finaleState.holdProgress > 0.35 ? (finaleState.holdProgress - 0.35) * 0.65 : 0
      );
      if (saluteAlpha > 0.01) {
        drawFallenComradesSalute(
          ctx,
          cameraX,
          getGroundY,
          FINALE_EVENT.x,
          saluteAlpha,
          this.time
        );
      }
    }

    // 11. Act 4 Living Multi-Generational Companions (Người Ông tuổi già & Người Cha cựu chiến binh)
    if (act === 4 && companionsState && companionsState.alpha > 0.01) {
      this.drawAct4Companions(ctx, cameraX, companionsState);
    }

    // 12. Player Character (Multi-generational detailed costumes & articulated poses)
    const playerHiddenInHay = Boolean(act === 1 && combatSystem && combatSystem.act1.isHidden);
    const hasFollowers = Boolean(
      combatSystem &&
      ((combatSystem.followers && combatSystem.followers.length > 0) ||
       (combatSystem.rallyUnits && combatSystem.rallyUnits.length > 0))
    );
    this.drawPlayer(ctx, act, cameraX, player, dt, playerHiddenInHay, hasFollowers);

    // 13. Continuous Sloped / Sunken Terrain Contour & Limbo Foreground Grass (1.2x)
    this.drawTerrainContourAndForeground(
      ctx,
      act,
      width,
      height,
      baseGroundY,
      getGroundY,
      cameraX,
      palette,
      cameraY
    );

    // 14. In-World Projectiles, Red Bomb Warning Circles, HP Bars & Floating Head Notices
    if (combatSystem) {
      combatSystem.renderCombatHudAndProjectiles(ctx, state);
    }

    // 15. Atmospheric Guiding System (Genshin-style Bezier Light Trail & Minimalist ❖ Compass)
    this.drawAtmosphericGuidingSystem(ctx, state);

    // 16. Floating PC Mechanical Keycap Prompts ([E], [S], [W], [F]) with smooth proximity fade
    if (!isTouchMode) {
      this.drawFloatingPcKeycapPrompts(ctx, state);
    }

    ctx.restore();

    // 13. Weather Particles, Shockwaves, Slow-mo Vignette & Flash (STRICTLY PRESERVED)
    vfx.renderForeground(ctx, cameraX, width, height);

    // 14. Cinematic Fade-to-Black Curtain during Act Transitions
    if (transitionState && transitionState.fadeAlpha > 0.005) {
      ctx.save();
      ctx.fillStyle = `rgba(4, 6, 10, ${Math.min(1, transitionState.fadeAlpha)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  drawSky(ctx, act, width, height, baseGroundY, localX, palette, cameraY = 0) {
    const grad = ctx.createLinearGradient(0, -cameraY - 120, 0, baseGroundY + 80);
    grad.addColorStop(0, palette.skyTop);
    grad.addColorStop(0.56, palette.skyMid);
    grad.addColorStop(1, palette.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(-120, -cameraY - 260, width + 240, height + cameraY + 460);

    // Act 1 Pale Crescent Moon in misty night sky
    if (act === 1) {
      const mx = width * 0.78;
      const my = baseGroundY * 0.22;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(mx, my, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.skyTop;
      ctx.beginPath();
      ctx.arc(mx - 8, my - 4, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Act 3 Luminous Full Moon over Trường Sơn
    if (act === 3 && localX < 2100) {
      const alpha = localX > 1650 ? Math.max(0, 1 - (localX - 1650) / 450) : 0.85;
      ctx.save();
      ctx.globalAlpha = alpha;
      const mx = width * 0.74;
      const my = baseGroundY * 0.24;
      const glow = ctx.createRadialGradient(mx, my, 12, mx, my, 130);
      glow.addColorStop(0, 'rgba(236, 253, 245, 0.75)');
      glow.addColorStop(0.35, 'rgba(167, 243, 208, 0.2)');
      glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, 130, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.arc(mx, my, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Act 4 Gris-style Soft Morning Sun & Diagonal Sunbeams
    if (act === 4) {
      const sx = width * 0.72;
      const sy = baseGroundY * 0.3;
      ctx.save();
      const sunGlow = ctx.createRadialGradient(sx, sy, 12, sx, sy, 260);
      sunGlow.addColorStop(0, 'rgba(255, 251, 235, 0.88)');
      sunGlow.addColorStop(0.3, 'rgba(253, 224, 71, 0.32)');
      sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 260, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = 'rgba(255, 250, 230, 0.045)';
        ctx.beginPath();
        ctx.moveTo(sx - 10 + i * 40, sy);
        ctx.lineTo(sx - 240 + i * 140, baseGroundY + 40);
        ctx.lineTo(sx - 150 + i * 140, baseGroundY + 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawFarLayer(ctx, act, width, baseGroundY, cameraX, palette) {
    const offset = cameraX * 0.16;
    ctx.save();
    ctx.fillStyle = palette.farHill;

    // Layered Mountain Ridgeline
    ctx.beginPath();
    ctx.moveTo(-60, baseGroundY + 80);
    for (let sx = -60; sx <= width + 80; sx += 24) {
      const wx = sx + offset + act * 700;
      const ridge =
        Math.sin(wx * 0.0042) * 62 +
        Math.cos(wx * 0.0095) * 32 +
        Math.sin(wx * 0.0021) * 44;
      const heightScale = act === 2 || act === 3 ? 1.28 : act === 1 ? 1.05 : 0.45;
      ctx.lineTo(sx, baseGroundY - 82 - Math.abs(ridge) * heightScale);
    }
    ctx.lineTo(width + 80, baseGroundY + 80);
    ctx.closePath();
    ctx.fill();

    // Act 2: Distant patrol propeller aircraft silhouettes in smoky sky
    if (act === 2) {
      const planeX = width - ((this.time * 48) % (width + 420)) + 160;
      const planeY = baseGroundY * 0.25 + Math.sin(this.time * 1.4) * 8;
      ctx.save();
      ctx.globalAlpha = 0.52;
      drawPropellerFighter(ctx, planeX, planeY, -1, 0.56, this.time);
      ctx.restore();
    }

    // Act 4: High-rise Skyscrapers with glowing lit windows & Multi-span Cable-Stayed Bridge
    if (act === 4) {
      drawModernSkylineAndBridge(ctx, cameraX, width, baseGroundY, this.time, palette);
    }

    // Atmospheric fog separator (Limbo/Gris signature depth mist)
    const fog = ctx.createLinearGradient(0, baseGroundY - 150, 0, baseGroundY + 30);
    fog.addColorStop(0, 'rgba(255,255,255,0)');
    fog.addColorStop(1, palette.mist);
    ctx.fillStyle = fog;
    ctx.fillRect(0, baseGroundY - 150, width, 180);
    ctx.restore();
  }

  drawMidFarLayer(ctx, act, width, baseGroundY, cameraX, palette) {
    ctx.save();
    ctx.fillStyle = palette.midHill;

    // Secondary ridgeline
    ctx.beginPath();
    ctx.moveTo(-60, baseGroundY + 80);
    for (let sx = -60; sx <= width + 80; sx += 22) {
      const wx = sx + cameraX * 0.35 + act * 410;
      const wave = Math.sin(wx * 0.0062) * 34 + Math.cos(wx * 0.013) * 16;
      const baseH = act === 4 ? 32 : 54;
      ctx.lineTo(sx, baseGroundY - baseH - Math.abs(wave));
    }
    ctx.lineTo(width + 80, baseGroundY + 80);
    ctx.closePath();
    ctx.fill();

    // Act 2: Distant Hanoi skyline & Đoàn dân công xe đạp thồ Tây Bắc vượt đèo
    if (act === 2) {
      for (let hx = 40; hx <= 1380; hx += 116) {
        const sx = hx - cameraX * 0.55;
        if (sx < -130 || sx > width + 130) continue;
        const h = 110 + ((hx * 17) % 58);
        ctx.fillStyle = palette.midHill;
        ctx.fillRect(sx, baseGroundY - h, 92, h + 40);
        ctx.beginPath();
        ctx.moveTo(sx - 5, baseGroundY - h);
        ctx.lineTo(sx + 46, baseGroundY - h - 24);
        ctx.lineTo(sx + 97, baseGroundY - h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(251, 146, 60, 0.14)';
        ctx.fillRect(sx + 20, baseGroundY - h + 26, 14, 22);
        ctx.fillRect(sx + 54, baseGroundY - h + 26, 14, 22);
      }

      // Đoàn xe đạp thồ Điện Biên tiến lên đèo Tây Bắc (1540..2150)
      for (let i = 0; i < 4; i++) {
        const wx = 1580 + i * 135 + ((this.time * 16) % 135);
        const sx = wx - cameraX;
        if (sx < -80 || sx > width + 80) continue;
        const ridgeY = baseGroundY - 98 - Math.sin((wx - 1500) * 0.0045) * 34;
        ctx.save();
        ctx.translate(sx, ridgeY);
        ctx.scale(0.6, 0.6);
        ctx.fillStyle = palette.nearSil;
        ctx.strokeStyle = palette.nearSil;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(-15, -11, 10, 0, Math.PI * 2);
        ctx.arc(15, -11, 10, 0, Math.PI * 2);
        ctx.stroke();
        fillRoundedRect(ctx, -19, -34, 38, 19, 4);
        ctx.beginPath();
        ctx.arc(-26, -39, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-30, -33, 9, 21);
        ctx.restore();
      }
    }

    // Act 3: Đoàn xe tải quân sự Trường Sơn vượt dốc núi xa
    if (act === 3) {
      drawTruongSonTruckConvoy(ctx, cameraX, width, baseGroundY, this.time, palette);
    }

    // Act 4: Đoàn tàu Metro 3 toa chạy êm trên đường ray cầu cạn trên cao
    if (act === 4) {
      drawElevatedMetroLine(ctx, cameraX, width, baseGroundY, this.time);
    }

    ctx.restore();
  }

  drawMidNearLayer(ctx, act, width, baseGroundY, getGroundY, cameraX, palette) {
    ctx.save();

    if (act === 1) {
      // Cây đa cổ thụ rễ phụ rủ xuống (x = 125) & Mái đình làng đầu đao uốn cong (x = 265)
      drawVillageDinhAndBanyan(
        ctx,
        265 - cameraX,
        125 - cameraX,
        getGroundY(265),
        getGroundY(125),
        this.time,
        palette
      );

      // Bụi tre làng Việt Nam mềm mại có lá tre & viền sáng ánh trăng
      const bambooSpots = [
        { x: 392, s: 1.04 },
        { x: 755, s: 0.94 },
        { x: 1645, s: 1.06 },
        { x: 1765, s: 0.88 },
      ];
      for (const b of bambooSpots) {
        const sx = b.x - cameraX;
        if (sx < -140 || sx > width + 140) continue;
        drawBambooCluster(
          ctx,
          sx,
          getGroundY(b.x) + 4,
          b.s,
          this.time,
          palette.nearSil,
          'rgba(203, 213, 225, 0.14)'
        );
      }

      // Vách đá vôi Pác Bó nhiều tầng rêu phong, Cửa hang Cốc Bó & Suối Lê-nin (x = 930..1635)
      drawPacBoKarstAndStream(ctx, cameraX, width, baseGroundY, this.time);
    }

    if (act === 2) {
      // Dãy nhà phố cổ Hà Nội 2 tầng sát nhau, cửa sổ chớp gỗ, mái ngói nghiêng, toa tàu điện cũ & xe tăng Pháp
      drawOldHanoiStreetscape(ctx, cameraX, width, getGroundY, this.time);

      // Cột điện sắt & Dây điện phố cổ Hà Nội chằng chịt nhiều tầng (0 - 1520)
      const poles = [130, 440, 760, 1085, 1435];
      for (let i = 0; i < poles.length; i++) {
        const px = poles[i] - cameraX;
        const gy = getGroundY(poles[i]);
        if (px > -120 && px < width + 120) {
          ctx.strokeStyle = palette.nearSil;
          ctx.fillStyle = palette.nearSil;
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(px, gy + 5);
          ctx.lineTo(px + (i % 2 === 0 ? 3 : -3), gy - 208);
          ctx.stroke();

          // 3 Crossbars with porcelain insulators
          ctx.lineWidth = 3;
          for (const cy of [-198, -184, -170]) {
            ctx.beginPath();
            ctx.moveTo(px - 18, gy + cy);
            ctx.lineTo(px + 18, gy + cy);
            ctx.stroke();
            for (const ix of [-14, -6, 6, 14]) {
              ctx.fillRect(px + ix - 1.5, gy + cy - 4, 3, 4);
            }
          }
        }

        // Tangled multi-strand catenary wires sagging across Hanoi sky
        if (i < poles.length - 1) {
          const nextPx = poles[i + 1] - cameraX;
          const nextGy = getGroundY(poles[i + 1]);
          if (nextPx > -60 && px < width + 60) {
            ctx.strokeStyle = 'rgba(15, 10, 10, 0.78)';
            const wireOffsets = [
              { dy1: -198, dy2: -198, sag: 22, w: 1.4 },
              { dy1: -198, dy2: -184, sag: 29, w: 1.1 },
              { dy1: -184, dy2: -184, sag: 25, w: 1.3 },
              { dy1: -170, dy2: -170, sag: 34, w: 1.2 },
              { dy1: -170, dy2: -184, sag: 38, w: 1.0 },
            ];
            for (const wf of wireOffsets) {
              ctx.lineWidth = wf.w;
              ctx.beginPath();
              ctx.moveTo(px, gy + wf.dy1);
              ctx.quadraticCurveTo(
                (px + nextPx) * 0.5,
                (gy + nextGy) * 0.5 +
                  (wf.dy1 + wf.dy2) * 0.5 +
                  wf.sag +
                  Math.sin(this.time * 1.5 + i + wf.sag) * 2,
                nextPx,
                nextGy + wf.dy2
              );
              ctx.stroke();
            }
          }
        }
      }
    }

    if (act === 3) {
      // Tán rừng già Trường Sơn hữu cơ & dây leo rủ bóng (tránh vùng Cầu treo & Đồi cao xạ)
      for (let jx = 110; jx <= 2260; jx += 205) {
        if ((jx > 1000 && jx < 1440) || (jx > 1610 && jx < 1850)) continue;
        const sx = jx - cameraX;
        if (sx < -160 || sx > width + 160) continue;
        const gy = getGroundY(jx);
        const isScorched = jx > 1860;
        const treeH = 212 + ((jx * 13) % 72);

        ctx.fillStyle = palette.nearSil;
        ctx.beginPath();
        ctx.moveTo(sx - 18, gy + 12);
        ctx.quadraticCurveTo(sx - 8, gy - treeH * 0.35, sx - 6, gy - treeH);
        ctx.lineTo(sx + 7, gy - treeH);
        ctx.quadraticCurveTo(sx + 9, gy - treeH * 0.35, sx + 19, gy + 12);
        ctx.closePath();
        ctx.fill();

        if (!isScorched) {
          ctx.beginPath();
          ctx.arc(sx, gy - treeH, 62, 0, Math.PI * 2);
          ctx.arc(sx - 42, gy - treeH + 18, 44, 0, Math.PI * 2);
          ctx.arc(sx + 44, gy - treeH + 16, 46, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(6, 24, 32, 0.65)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx + 26, gy - treeH + 34);
          ctx.quadraticCurveTo(
            sx + 26 + Math.sin(this.time * 1.3 + jx) * 6,
            gy - treeH + 92,
            sx + 23,
            gy - treeH + 138
          );
          ctx.stroke();
        }
      }
    }

    if (act === 4) {
      // Cổng trường Đại học hiện đại (x = 340) & Hàng cây xanh đô thị
      drawModernUniversityGate(ctx, cameraX, width, getGroundY);

      const treePositions = [125, 560, 895, 1935];
      for (const tx of treePositions) {
        const sx = tx - cameraX;
        if (sx < -90 || sx > width + 90) continue;
        const gy = getGroundY(tx);
        ctx.fillStyle = '#1c3144';
        ctx.fillRect(sx - 4, gy - 76, 8, 78);
        ctx.fillStyle = '#1f4959';
        ctx.beginPath();
        ctx.arc(sx, gy - 94, 34, 0, Math.PI * 2);
        ctx.arc(sx - 22, gy - 80, 24, 0, Math.PI * 2);
        ctx.arc(sx + 22, gy - 80, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawPlatformsAndLandmarks(
    ctx,
    act,
    width,
    baseGroundY,
    getGroundY,
    cameraX,
    completedQtes,
    activeQte,
    tankProgress,
    finaleState,
    nearbyObstacleHint,
    isTouchMode = false,
    combatSystem = null
  ) {
    const actCfg = ACTS.find((a) => a.id === act) || ACTS[0];
    ctx.save();

    // ==================== STAGE LANDMARKS BEHIND PLATFORMS ====================
    if (act === 1) {
      // Căn hầm bí mật trũng xuống dưới nền nhà tranh đầu Màn 1 (x = 600, hầm x = 450..750, dy = +180)
      const hutCenterSx = 600 - cameraX;
      if (hutCenterSx > -260 && hutCenterSx < width + 260) {
        drawSecretCellarAndHut(ctx, hutCenterSx, baseGroundY, baseGroundY + 180, this.time);
      }

      // Kho thóc Nhật xây gạch mái tôn, cửa sắt lớn & 2 Tháp canh gỗ có lính Nhật đứng gác + đèn pha xoay
      drawJapaneseGranaryAndTowers(
        ctx,
        cameraX,
        width,
        getGroundY,
        this.time,
        completedQtes.has('qte_1a'),
        combatSystem ? combatSystem.getGranaryCombatRenderState() : null
      );

      // Lễ đài Độc lập Quảng trường Ba Đình (x = 2720)
      drawBaDinhTribune(
        ctx,
        cameraX,
        width,
        getGroundY,
        completedQtes.has('qte_1b'),
        this.time
      );
    }

    if (act === 2) {
      // Cụm cứ điểm Điện Biên Phủ: 3 giao thông hào sâu, hàng rào thép gai chữ A, lô cốt bê tông & Hầm Đờ Cátơri
      drawDienBienFortress(
        ctx,
        cameraX,
        width,
        baseGroundY,
        getGroundY,
        completedQtes,
        this.time,
        combatSystem ? combatSystem.getDienBienCombatRenderState() : null
      );
    }

    if (act === 3) {
      // Trạm giao liên Trường Sơn trong hốc đá có bếp lửa bập bùng (x = 580)
      drawRockCaveLiaisonPost(ctx, cameraX, width, getGroundY, this.time);

      // Nếu không có combatSystem (fallback), vẽ khẩu cao xạ mặc định; khi có combatSystem, vẽ 2 khẩu cao xạ ở 1662 & 1796!
      if (!combatSystem) {
        drawAntiAircraft37mmBattery(ctx, cameraX, width, getGroundY, this.time);
      }

      // Đồng đội Quân Giải phóng bên miệng hố bom (x = 2095)
      const comSx = 2095 - cameraX;
      if (comSx > -90 && comSx < width + 90) {
        drawDetailedCharacter(
          ctx,
          comSx,
          getGroundY(2095),
          'act3',
          {
            facing: -1,
            walkCycle: 0,
            speedRatio: 0,
            onGround: true,
            vy: 0,
            landingSquash: 0.25,
            pose: null,
            poseTimer: 0,
            wearingHat: true,
          },
          this.time
        );
      }

      // Tòa nhà Dinh Độc Lập hàng cột dọc đặc trưng, Cổng sắt lớn & Xe tăng T-54 số hiệu 390
      drawIndependencePalaceDetailed(
        ctx,
        cameraX,
        width,
        getGroundY,
        completedQtes.has('qte_3b'),
        activeQte,
        tankProgress,
        this.time,
        combatSystem ? combatSystem.getTank390RenderState(completedQtes) : null
      );
    }

    if (act === 4) {
      // Đồi cao 5 bậc tam cấp đá, hai hàng cây tùng bách, lư hương đồng lớn & Đài tưởng niệm Tổ quốc ghi công
      drawMonumentHillAndMemorial(
        ctx,
        cameraX,
        width,
        baseGroundY,
        getGroundY,
        finaleState,
        FINALE_EVENT.x,
        this.time
      );
    }

    // ==================== ONE-WAY PLATFORMS ====================
    for (const p of actCfg.platforms) {
      const sx1 = p.x1 - cameraX;
      const sx2 = p.x2 - cameraX;
      const py = baseGroundY + p.dy;
      if (sx2 < -90 || sx1 > width + 90) continue;

      drawDetailedPlatformSurface(ctx, p, sx1, sx2, py, getGroundY, act, this.time);
    }

    // Minimal contextual jump prompt if player touches a solid obstacle
    if (nearbyObstacleHint) {
      const ox = (nearbyObstacleHint.x1 + nearbyObstacleHint.x2) * 0.5 - cameraX;
      const oy = baseGroundY + nearbyObstacleHint.dy - 26;
      const hintText = isTouchMode
        ? nearbyObstacleHint.hint.replace('[W]', '[▲]')
        : nearbyObstacleHint.hint;
      this.drawMinimalFloatingHint(ctx, ox, oy, hintText, false);
    }

    ctx.restore();
  }

  /**
   * Vẽ các vật phẩm lịch sử đặt vững chãi trên địa hình/platform.
   * CHỈ hiển thị nhãn gợi ý nhỏ [E] Khám phá (hoặc [Chạm] Khám phá trên cảm ứng) KHI nhân vật lại gần!
   */
  drawInteractables(
    ctx,
    act,
    baseGroundY,
    getGroundY,
    cameraX,
    width,
    interactables,
    nearbyInteractable,
    isTouchMode = false,
    autoSeekItem = null
  ) {
    const actCfg = ACTS.find((a) => a.id === act) || ACTS[0];

    for (const item of interactables) {
      if (item.act !== act) continue;
      const sx = item.x - cameraX;
      if (sx < -120 || sx > width + 120) continue;

      let itemY = getGroundY(item.x);
      if (item.platformId) {
        const plat = actCfg.platforms.find((p) => p.id === item.platformId);
        if (plat) itemY = baseGroundY + plat.dy;
      }

      const isNear = nearbyInteractable && nearbyInteractable.id === item.id;
      const isSeeking = autoSeekItem && autoSeekItem.id === item.id;

      ctx.save();
      ctx.translate(sx, itemY);

      const isUnvisited = !item.visited;

      if (isUnvisited) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.6);
        // Vertical golden light pillar
        const beamGrad = ctx.createLinearGradient(0, -96, 0, 0);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0)');
        beamGrad.addColorStop(0.5, `rgba(253, 224, 71, ${0.16 + pulse * 0.16})`);
        beamGrad.addColorStop(1, `rgba(245, 158, 11, ${0.32 + pulse * 0.22})`);
        ctx.fillStyle = beamGrad;
        ctx.fillRect(-14, -92, 28, 92);

        // Ground golden expanding ripple ring
        const ringGrad = (this.time * 1.4) % 1;
        ctx.save();
        ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - ringGrad) * 0.72})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12 + ringGrad * 26, 4 + ringGrad * 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Radial golden aura
        const auraRadius = (isNear ? 64 : 46) + pulse * 12;
        const g = ctx.createRadialGradient(0, -24, 2, 0, -24, auraRadius);
        g.addColorStop(0, `rgba(254, 243, 199, ${0.52 + pulse * 0.25})`);
        g.addColorStop(0.45, `rgba(251, 191, 36, ${0.28 + pulse * 0.16})`);
        g.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, -24, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle floating 4-pointed golden starlight mote above unvisited item (replacing bulky arrow)
        if (!isNear) {
          const moteY = -62 + Math.sin(this.time * 3.4) * 3.5;
          ctx.save();
          ctx.translate(0, moteY);
          ctx.fillStyle = `rgba(254, 240, 138, ${0.65 + pulse * 0.3})`;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.quadraticCurveTo(1.2, -1.2, 5, 0);
          ctx.quadraticCurveTo(1.2, 1.2, 0, 5);
          ctx.quadraticCurveTo(-1.2, 1.2, -5, 0);
          ctx.quadraticCurveTo(-1.2, -1.2, 0, -5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Visited item subtle ambient glow
        const subtleAlpha = isNear ? 0.35 : isSeeking ? 0.25 : 0.12;
        const g = ctx.createRadialGradient(0, -24, 2, 0, -24, isNear ? 52 : 36);
        g.addColorStop(0, `rgba(253, 230, 138, ${subtleAlpha})`);
        g.addColorStop(1, 'rgba(253, 230, 138, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, -24, isNear ? 52 : 36, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSeeking) {
        const pulse = (this.time * 1.9) % 1;
        ctx.save();
        ctx.strokeStyle = `rgba(253, 230, 138, ${(1 - pulse) * 0.75})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, -2, 16 + pulse * 26, 4 + pulse * 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      this.drawArtifactVector(ctx, item.iconType, isNear || isSeeking, isUnvisited);

      if (isNear && isTouchMode) {
        const floatY = -74 + Math.sin(this.time * 3.2) * 3;
        const label = item.visited ? '[Chạm] Xem lại' : '[Chạm] Khám phá';
        this.drawMinimalFloatingHint(ctx, 0, floatY, label, true);
      }

      ctx.restore();
    }
  }

  drawMinimalFloatingHint(ctx, x, y, text, elevatedTouchPill = false) {
    ctx.save();
    const pulseScale = elevatedTouchPill ? 1 + Math.sin(this.time * 4.2) * 0.032 : 1;
    ctx.translate(x, y);
    ctx.scale(pulseScale, pulseScale);

    ctx.font = elevatedTouchPill
      ? '600 12.5px "Be Vietnam Pro", sans-serif'
      : '500 12px "Be Vietnam Pro", sans-serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + (elevatedTouchPill ? 26 : 22);
    const ph = elevatedTouchPill ? 28 : 25;

    if (elevatedTouchPill) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
    }

    ctx.fillStyle = elevatedTouchPill
      ? 'rgba(15, 21, 34, 0.92)'
      : 'rgba(10, 14, 22, 0.86)';
    fillRoundedRect(ctx, -pw * 0.5, -ph * 0.5, pw, ph, ph * 0.5);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = elevatedTouchPill
      ? 'rgba(253, 224, 71, 0.9)'
      : 'rgba(253, 230, 138, 0.62)';
    ctx.lineWidth = elevatedTouchPill ? 1.4 : 1.1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-pw * 0.5, -ph * 0.5, pw, ph, ph * 0.5);
    } else {
      ctx.rect(-pw * 0.5, -ph * 0.5, pw, ph);
    }
    ctx.stroke();

    ctx.fillStyle = '#fef9c3';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0.5);
    ctx.restore();
  }

  drawArtifactVector(ctx, iconType, isNear, isUnvisited = false) {
    ctx.save();
    ctx.strokeStyle = isNear ? '#fef08a' : 'rgba(253, 230, 138, 0.78)';
    ctx.fillStyle = '#141312';
    ctx.lineWidth = 1.8;

    if (isUnvisited) {
      ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
      ctx.shadowBlur = isNear ? 14 : 9;
    }

    switch (iconType) {
      case 'manifesto_table': {
        // Bàn gỗ thấp trong hầm bí mật + bản Cương lĩnh tháng 2/1930 & ngọn đèn dầu ấm
        ctx.fillStyle = '#3f2718';
        ctx.fillRect(-30, -30, 60, 5);
        ctx.fillRect(-23, -25, 5, 25);
        ctx.fillRect(18, -25, 5, 25);
        ctx.strokeRect(-30, -30, 60, 5);
        // Open Manifesto pages
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-19, -35, 22, 5);
        // Glass oil lamp + glowing flame
        ctx.fillStyle = '#92400e';
        ctx.fillRect(10, -36, 9, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(12, -36);
        ctx.quadraticCurveTo(14.5, -48 - Math.sin(this.time * 10) * 2, 17, -36);
        ctx.fill();
        break;
      }
      case 'viet_minh_flag': {
        // Bàn đá Pác Bó & Lá cờ đỏ sao vàng Mặt trận Việt Minh (5/1941)
        ctx.fillStyle = '#1e293b';
        fillRoundedRect(ctx, -24, -22, 48, 22, 6);
        ctx.strokeRect(-24, -22, 48, 22);
        drawWavingFlag(ctx, -4, -66, 36, 22, this.time, 46, 'national');
        break;
      }
      case 'ox_cart_granary': {
        // Chiếc xe bò gỗ chở thóc & gánh thúng bên ngoài sân Kho thóc Nhật
        ctx.fillStyle = '#291c12';
        ctx.fillRect(-28, -26, 50, 8);
        ctx.strokeRect(-28, -26, 50, 8);
        ctx.beginPath();
        ctx.arc(-6, -15, 14, 0, Math.PI * 2);
        ctx.stroke();
        for (let s = 0; s < 4; s++) {
          const a = (s * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(-6 - Math.cos(a) * 13, -15 - Math.sin(a) * 13);
          ctx.lineTo(-6 + Math.cos(a) * 13, -15 + Math.sin(a) * 13);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(22, -21);
        ctx.lineTo(44, -31);
        ctx.stroke();
        break;
      }
      case 'rice_jar_blackboard': {
        // Cụm Hũ gạo tiết kiệm đặt trên bàn gỗ thấp & Bảng đen khung gỗ trên giá đỡ 3 chân (easel)
        // Căn chỉnh đối xứng hoàn hảo ngay tâm luồng sáng tương tác (x = -32 .. +32)
        const rimCol = isNear ? '#fef08a' : 'rgba(253, 230, 138, 0.82)';

        // 1. BÊN TRÁI (x = -31 .. -3, tâm x = -17): Bàn gỗ thấp & Hũ gạo tiết kiệm bằng sành nâu đất
        // Mặt bàn gỗ thấp và 2 chân bàn có thanh giằng ngang
        ctx.fillStyle = '#452715';
        fillRoundedRect(ctx, -31, -17, 28, 3.8, 1.5);
        ctx.fillRect(-27.5, -13.5, 3.5, 13.5);
        ctx.fillRect(-10, -13.5, 3.5, 13.5);
        ctx.fillRect(-25, -6.5, 16, 2.2);
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-30.5, -16.8, 27, 3.4);

        // Thân hũ sành màu nâu đất đặt ngay ngắn trên mặt bàn gỗ (tâm x = -17, y = -29)
        const jarGrad = ctx.createRadialGradient(-19, -31, 2, -17, -28, 13);
        jarGrad.addColorStop(0, '#9a3412');
        jarGrad.addColorStop(0.65, '#7c2d12');
        jarGrad.addColorStop(1, '#431407');
        ctx.fillStyle = jarGrad;
        ctx.beginPath();
        ctx.ellipse(-17, -28.5, 10.5, 11.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Cổ hũ sành & Nắp vải đỏ buộc dây vàng ("Hũ gạo cứu đói")
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-23.5, -38.5);
        ctx.quadraticCurveTo(-17, -44.5, -10.5, -38.5);
        ctx.lineTo(-11.5, -36.2);
        ctx.quadraticCurveTo(-17, -37.8, -22.5, -36.2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-22, -37.5);
        ctx.lineTo(-12, -37.5);
        ctx.stroke();

        // Nhãn đỏ hình thoi dán trước bụng hũ sành
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-17, -34.5);
        ctx.lineTo(-11.5, -28.5);
        ctx.lineTo(-17, -22.5);
        ctx.lineTo(-22.5, -28.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        drawStar(ctx, -17, -28.5, 5, 2.6, 1.1, '#fef08a');

        // 2. BÊN PHẢI (x = -1 .. +33, tâm x = +16): Giá đỡ 3 chân (Easel) & Bảng đen khung gỗ
        // 3 chân gỗ giá đỡ bảng (trái, phải, chân trụ giữa) + chốt đỉnh giá đỡ
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Chân trái
        ctx.moveTo(10, -56);
        ctx.lineTo(2, 0);
        // Chân phải
        ctx.moveTo(22, -56);
        ctx.lineTo(30, 0);
        // Chân chống thứ 3 ở giữa phía sau
        ctx.moveTo(16, -54);
        ctx.lineTo(16, 0);
        // Đỉnh giá đỡ nhô trên bảng
        ctx.moveTo(16, -61);
        ctx.lineTo(16, -55);
        ctx.stroke();

        // Khung gỗ của Bảng đen (x = -1 .. +33, y = -55 .. -22)
        ctx.fillStyle = '#92400e';
        fillRoundedRect(ctx, -1, -55, 34, 33, 2.5);
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-0.5, -54.5, 33, 32);

        // Mặt bảng đá đen bên trong khung gỗ
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(1.8, -52.2, 28.4, 27.4);

        // Thanh gỗ đỡ bảng và để viên phấn trắng bên dưới
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-3, -22.5, 38, 3.2);
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1.0;
        ctx.strokeRect(-3, -22.5, 38, 3.2);
        // Viên phấn trắng đặt trên máng bảng
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(21, -24.2, 6, 1.8);

        // Tiêu đề nhỏ "BÌNH DÂN HỌC VỤ" phía trên mặt bảng
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fde68a';
        ctx.font = '700 3.7px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BÌNH DÂN HỌC VỤ', 16, -47.5);

        // Đường gạch phấn mảnh dưới tiêu đề
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(4.5, -44.2);
        ctx.lineTo(27.5, -44.2);
        ctx.stroke();

        // Chữ phấn trắng "i - t" (Easter Egg lịch sử "i ngắn có chấm, tờ dài có ngang")
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11.5px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('i - t', 16, -34.5);
        ctx.restore();
        break;
      }
      case 'barricade_speaker': {
        // Loa phóng thanh kháng chiến trên ban công sắt phố cổ Hà Nội
        ctx.fillRect(-3, -46, 5, 46);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(-1, -40);
        ctx.lineTo(24, -53);
        ctx.lineTo(24, -27);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'pack_bike_map': {
        // Xe đạp thồ thồ hàng tạ gạo đèo Tây Bắc
        ctx.beginPath();
        ctx.arc(-16, -13, 11, 0, Math.PI * 2);
        ctx.arc(14, -13, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#713f12';
        fillRoundedRect(ctx, -20, -36, 36, 18, 4);
        ctx.strokeRect(-20, -36, 36, 18);
        break;
      }
      case 'campfire_letter': {
        // Bức thư hậu phương & sổ tay chiến trường bên bếp lửa hốc đá Trường Sơn
        ctx.fillStyle = '#3f2718';
        ctx.fillRect(-20, -14, 40, 14);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-12, -25, 22, 13);
        ctx.strokeRect(-12, -25, 22, 13);
        drawStar(ctx, -1, -18.5, 5, 3.5, 1.5, '#dc2626');
        break;
      }
      case 'radio_milestone': {
        // Cột mốc Trường Sơn & Chiếc đài bán dẫn nghe tin thắng trận trên đồi cao xạ
        ctx.fillStyle = '#e2e8f0';
        fillRoundedRect(ctx, -23, -42, 20, 42, [9, 9, 0, 0]);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-23, -42, 20, 10);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(4, -21, 21, 15);
        ctx.strokeRect(4, -21, 21, 15);
        ctx.beginPath();
        ctx.moveTo(20, -21);
        ctx.lineTo(27, -42);
        ctx.stroke();
        break;
      }
      case 'history_board': {
        // Bảng tin lịch sử sân trường Đại học hiện đại
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(-28, -56, 56, 34);
        ctx.strokeRect(-28, -56, 56, 34);
        ctx.fillRect(-21, -22, 4, 22);
        ctx.fillRect(17, -22, 4, 22);
        drawStar(ctx, 0, -39, 5, 7.5, 3.2, '#fde047');
        break;
      }
      case 'modern_emblem': {
        // Biểu tượng Đổi mới, Khoa học Công nghệ & Hội nhập quốc tế trên cầu vượt
        ctx.beginPath();
        ctx.arc(0, -34, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -34, 25, 8, 0.5, 0, Math.PI * 2);
        ctx.ellipse(0, -34, 25, 8, -0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(-10, -14, 20, 14);
        ctx.strokeRect(-10, -14, 20, 14);
        break;
      }
    }
    ctx.restore();
  }

  /**
   * Vẽ nhân vật thế hệ tiếp theo đứng đợi sẵn ở localX = 2860 (cuối Màn 2 & cuối Màn 3)
   * và hoạt cảnh chuyển giao thế hệ 2.5s.
   */
  drawWaitingSuccessor(ctx, act, getGroundY, cameraX, transitionState) {
    if (act !== 2 && act !== 3) return;
    if (transitionState && transitionState.subPhase === 'SUCCESSOR_WALK_OFF') {
      const elderX = 2834;
      const elderY = getGroundY(elderX);
      drawDetailedCharacter(
        ctx,
        elderX - cameraX,
        elderY,
        act,
        {
          facing: 1,
          walkCycle: 0,
          speedRatio: 0,
          onGround: true,
          vy: 0,
          landingSquash: 0,
          pose: 'salute_farewell',
          poseTimer: this.time,
          wearingHat: act === 2 ? false : true,
        },
        this.time
      );
      return;
    }

    const waitX = WORLD_CONFIG.successorWaitX;
    const waitY = getGroundY(waitX);
    const nextCostumeAct = act === 2 ? 3 : 4;
    const inCeremony =
      transitionState && transitionState.subPhase === 'HANDOFF_CEREMONY';
    const ceremonyProgress = inCeremony ? transitionState.ceremonyProgress || 0 : 0;

    ctx.save();
    const g = ctx.createRadialGradient(
      waitX - cameraX,
      waitY - 40,
      4,
      waitX - cameraX,
      waitY - 40,
      58 + ceremonyProgress * 30
    );
    g.addColorStop(0, `rgba(253, 230, 138, ${0.18 + ceremonyProgress * 0.28})`);
    g.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(waitX - cameraX, waitY - 40, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawDetailedCharacter(
      ctx,
      waitX - cameraX,
      waitY,
      nextCostumeAct,
      {
        facing: -1,
        walkCycle: 0,
        speedRatio: 0,
        onGround: true,
        vy: 0,
        landingSquash: 0,
        pose: inCeremony ? 'handoff_receive' : null,
        poseTimer: ceremonyProgress,
        wearingHat: act === 2 ? ceremonyProgress > 0.55 : true,
      },
      this.time
    );
  }

  /**
   * Vẽ Người Ông tuổi già (tóc bạc chống gậy gỗ) & Người Cha tuổi trung niên (cựu chiến binh cài huân chương đỏ)
   * cùng sánh bước sống động bên cạnh Người Cháu bước lên 5 bậc tam cấp đá và cúi đầu dâng hương!
   */
  drawAct4Companions(ctx, cameraX, companionsState) {
    const {
      alpha,
      elderX,
      elderY,
      elderFacing,
      elderSpeedRatio,
      elderWalkCycle,
      fatherX,
      fatherY,
      fatherFacing,
      fatherSpeedRatio,
      fatherWalkCycle,
      sharedPose,
    } = companionsState;

    // Subtle warm golden kinship glow beneath Grandfather & Father
    ctx.save();
    for (const [cx, cy] of [
      [elderX - cameraX, elderY],
      [fatherX - cameraX, fatherY],
    ]) {
      const aura = ctx.createRadialGradient(cx, cy - 34, 4, cx, cy - 34, 52);
      aura.addColorStop(0, `rgba(254, 243, 199, ${0.24 * alpha})`);
      aura.addColorStop(1, 'rgba(254, 243, 199, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy - 34, 52, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 1. Người Ông tuổi già (tóc bạc trắng, lưng hơi còng, tay chống gậy gỗ)
    drawDetailedCharacter(
      ctx,
      elderX - cameraX,
      elderY,
      'elder_grandfather',
      {
        facing: elderFacing,
        walkCycle: elderWalkCycle,
        speedRatio: elderSpeedRatio,
        onGround: true,
        vy: 0,
        landingSquash: 0,
        pose: sharedPose,
        poseTimer: this.time,
        wearingHat: false,
        alpha,
      },
      this.time
    );

    // 2. Người Cha tuổi trung niên (quân phục cựu chiến binh cài huân chương đỏ trên ngực)
    drawDetailedCharacter(
      ctx,
      fatherX - cameraX,
      fatherY,
      'veteran_father',
      {
        facing: fatherFacing,
        walkCycle: fatherWalkCycle,
        speedRatio: fatherSpeedRatio,
        onGround: true,
        vy: 0,
        landingSquash: 0,
        pose: sharedPose,
        poseTimer: this.time,
        wearingHat: false,
        alpha,
      },
      this.time
    );
  }

  drawPlayer(ctx, act, cameraX, player, dt, isStealthHidden = false, hasFollowers = false) {
    const costumeAct = player.costumeOverride || act;
    const sx = player.x - cameraX;
    const speedRatio = Math.min(1, Math.abs(player.vx) / player.maxSpeed);
    const dir = player.facing || 1;

    let actionJumpOffset = 0;
    if (player.pose === 'leap_trench' || player.pose === 'leap_crater') {
      actionJumpOffset = -Math.sin(Math.min(1, player.poseTimer * 1.4) * Math.PI) * 52;
    }

    const footY = player.y + actionJumpOffset;
    const walkBob =
      player.onGround && speedRatio > 0.05
        ? Math.abs(Math.sin(player.walkCycle * 2)) * 3.8
        : Math.sin(this.time * 2.4) * 0.9;

    // Flowing scarf / headband streamer in world space (prominent crimson scarf in Act 2 Vệ quốc đoàn!)
    const shoulderWorldX = player.x - dir * 5;
    const shoulderWorldY = footY - 68 - walkBob;
    this.scarfTrail.unshift({ x: shoulderWorldX, y: shoulderWorldY });
    if (this.scarfTrail.length > 10) this.scarfTrail.pop();
    for (let i = 1; i < this.scarfTrail.length; i++) {
      this.scarfTrail[i].x -= dir * dt * 54;
      this.scarfTrail[i].y +=
        (Math.sin(this.time * 8.8 + i * 0.8) * 25 - (player.vy || 0) * 0.06) * dt;
    }

    if (this.scarfTrail.length > 2 && costumeAct !== 4 && !isStealthHidden) {
      ctx.save();
      ctx.beginPath();
      this.scarfTrail.forEach((pt, idx) => {
        const px = pt.x - cameraX - idx * dir * 2.3;
        const py = pt.y + idx * 0.65;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle =
        costumeAct === 2
          ? '#dc2626' // Khăn đỏ quàng cổ Vệ quốc đoàn bay theo gió!
          : costumeAct === 1
          ? '#991b1b' // Dải khăn vấn đầu
          : '#d6d3d1'; // Khăn rằn Trường Sơn
      ctx.lineWidth = costumeAct === 2 ? 4.8 : 3.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    drawDetailedCharacter(
      ctx,
      sx,
      footY,
      costumeAct,
      {
        facing: dir,
        walkCycle: player.walkCycle,
        speedRatio,
        onGround: player.onGround,
        vy: player.vy || 0,
        landingSquash: isStealthHidden
          ? Math.max(0.45, player.landingSquash || 0)
          : player.landingSquash || 0,
        pose: player.pose,
        poseTimer: player.poseTimer || 0,
        wearingHat: player.wearingHat !== false,
        isCrouching: Boolean(player.isCrouching),
        alpha: isStealthHidden ? 0.56 : 1,
      },
      this.time
    );

    // Inverted Triangle Squad Leader Indicator (Tam giác ngược ▼ trên đầu nhân vật chính khi có NPC đồng đội)
    if (hasFollowers && !isStealthHidden) {
      const isCrouching = Boolean(player.isCrouching);
      const headTopY = footY - (isCrouching ? 56 : 94);
      const triY = headTopY - 16 + Math.sin(this.time * 4.2) * 3.2;
      this.drawSquadLeaderIndicator(ctx, sx, triY);
    }
  }

  /**
   * Vẽ biểu tượng tam giác ngược [▼] phát sáng tinh tế trên đầu nhân vật chính
   * để phân biệt rõ ràng vị trí người chơi khi có đoàn NPC quần chúng/đồng đội chạy cùng.
   */
  drawSquadLeaderIndicator(ctx, sx, triY) {
    ctx.save();
    ctx.translate(sx, triY);

    // Warm golden aura
    const aura = ctx.createRadialGradient(0, 0, 1, 0, 0, 13);
    aura.addColorStop(0, 'rgba(253, 230, 138, 0.7)');
    aura.addColorStop(0.55, 'rgba(245, 158, 11, 0.3)');
    aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Inverted Triangle (Tam giác ngược ▼ pointing down)
    ctx.beginPath();
    ctx.moveTo(-6.5, -4.5);
    ctx.lineTo(6.5, -4.5);
    ctx.lineTo(0, 5.5);
    ctx.closePath();

    const triGrad = ctx.createLinearGradient(0, -4.5, 0, 5.5);
    triGrad.addColorStop(0, '#fef08a');
    triGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = triGrad;
    ctx.fill();

    // Crisp white rim stroke
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Center bright spark
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -1.2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawTerrainContourAndForeground(
    ctx,
    act,
    width,
    height,
    baseGroundY,
    getGroundY,
    cameraX,
    palette,
    cameraY = 0
  ) {
    ctx.save();

    // Continuous Sloped / Sunken Terrain Polygon matching physics 100%
    ctx.fillStyle = palette.ground;
    ctx.beginPath();
    const bottomY = height + cameraY + 300;
    ctx.moveTo(-60, bottomY);
    for (let sx = -60; sx <= width + 60; sx += 8) {
      const wx = sx + cameraX;
      ctx.lineTo(sx, getGroundY(wx));
    }
    ctx.lineTo(width + 60, bottomY);
    ctx.closePath();
    ctx.fill();

    // Subtle crisp top-soil rim line along the terrain contour
    ctx.strokeStyle =
      act === 4 ? 'rgba(253, 230, 138, 0.36)' : 'rgba(203, 213, 225, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let sx = -60; sx <= width + 60; sx += 8) {
      const gy = getGroundY(sx + cameraX);
      if (sx === -60) ctx.moveTo(sx, gy);
      else ctx.lineTo(sx, gy);
    }
    ctx.stroke();

    // Limbo-style Out-of-Focus Foreground Blades along bottom viewport edge (1.2x parallax)
    const fgOffset = cameraX * 1.2;
    ctx.fillStyle = '#020407';
    const fgBottom = height + cameraY;
    for (let sx = -40; sx <= width + 60; sx += 52) {
      const wx = sx + fgOffset;
      const bladeH = 10 + Math.abs(Math.sin(wx * 0.037)) * 15;
      const sway = Math.sin(this.time * 2.1 + wx * 0.02) * 4;
      ctx.beginPath();
      ctx.moveTo(sx - 6, fgBottom);
      ctx.quadraticCurveTo(sx + sway, fgBottom - bladeH - 8, sx + 6, fgBottom);
      ctx.fill();
    }

    ctx.restore();
  }

  // ============================================================================
  // HỆ THỐNG DẪN ĐƯỜNG NGHỆ THUẬT CHO TÂN THỦ (ATMOSPHERIC GUIDING SYSTEM)
  // ============================================================================

  /**
   * Tìm mục tiêu tiếp theo (getNextTarget):
   * - Ưu tiên 1: Vật phẩm lịch sử (interactable) đầu tiên chưa đọc trong Màn.
   *   Nếu vật phẩm ở dưới hầm ngầm hoặc trên tầng cao mà người chơi đang ở ngoài,
   *   trỏ tới Cửa hầm / Bậc thang đầu tiên trước; khi đã vào hầm/lên cầu thang thì trỏ thẳng vào Vật phẩm.
   * - Ưu tiên 2: Khi đã đọc đủ tất cả vật phẩm trong Màn, dẫn tới Vùng Mini-game Chiến đấu cuối màn
   *   (hoặc sang Màn kế tiếp nếu đã thắng).
   */
  getNextTarget(state) {
    const {
      act,
      baseGroundY,
      getGroundY,
      player,
      interactables,
      completedQtes,
      combatSystem,
      finaleState,
      transitionState,
    } = state;

    if (!player || (transitionState && transitionState.active)) return null;
    const actCfg = ACTS.find((a) => a.id === act) || ACTS[0];

    // Ưu tiên 1: Vật phẩm lịch sử đầu tiên chưa đọc trong Màn hiện tại
    const firstUnvisited = interactables
      ? interactables.find((it) => it.act === act && !it.visited)
      : null;

    if (firstUnvisited) {
      // Nếu người chơi đang ở sâu dưới hầm (Màn 1 hoặc Màn 3) mà mục tiêu kế tiếp ở trên mặt đất -> chỉ ra cầu thang lên
      if (
        (act === 1 || act === 3) &&
        player.dy >= 45 &&
        firstUnvisited.id !== 'act1_item1' &&
        firstUnvisited.id !== 'act3_item1'
      ) {
        return { x: 486, y: baseGroundY - 12, kind: 'stair_up' };
      }

      // Màn 1 - Vật phẩm 1 (Cương lĩnh 1930 dưới đáy Hầm bí mật x = 635, dy = +180)
      if (firstUnvisited.id === 'act1_item1') {
        if (player.dy < 45) {
          return { x: 508, y: baseGroundY + 12, kind: 'cellar_down' };
        }
        return { x: firstUnvisited.x, y: getGroundY(firstUnvisited.x) - 28, kind: 'item' };
      }

      // Màn 1 - Vật phẩm 2 (Mặt trận Việt Minh trên Hang Pác Bó x = 1435, dy = -146)
      if (firstUnvisited.id === 'act1_item2') {
        if (player.dy > -32) {
          return { x: 1015, y: baseGroundY - 46 - 14, kind: 'step_up' };
        }
        if (player.dy > -82) {
          return { x: 1125, y: baseGroundY - 96 - 14, kind: 'step_up' };
        }
        if (player.dy > -125) {
          return { x: 1235, y: baseGroundY - 146 - 14, kind: 'step_up' };
        }
        return { x: firstUnvisited.x, y: baseGroundY - 146 - 28, kind: 'item' };
      }

      // Màn 2 - Vật phẩm 2 (Loa truyền thanh trên Tầng 2 Nhà phố cổ Hà Nội x = 1328, dy = -142)
      if (firstUnvisited.id === 'act2_item2') {
        if (player.dy > -35) {
          if (player.x < 860) {
            return { x: 875, y: baseGroundY - 46 - 14, kind: 'step_up' };
          }
          return { x: 1110, y: baseGroundY - 50 - 14, kind: 'step_up' };
        }
        if (player.dy > -82) {
          return { x: 1205, y: baseGroundY - 98 - 14, kind: 'step_up' };
        }
        if (player.dy > -125) {
          return { x: 1280, y: baseGroundY - 142 - 14, kind: 'step_up' };
        }
        return { x: firstUnvisited.x, y: baseGroundY - 142 - 28, kind: 'item' };
      }

      // Màn 3 - Vật phẩm 1 (Nghị quyết Đại hội III dưới Hầm chữ A Trường Sơn x = 642, dy = +170)
      if (firstUnvisited.id === 'act3_item1') {
        if (player.dy < 45) {
          return { x: 508, y: baseGroundY + 12, kind: 'cellar_down' };
        }
        return { x: firstUnvisited.x, y: getGroundY(firstUnvisited.x) - 28, kind: 'item' };
      }

      // Các vật phẩm khác trên mặt đất hoặc platform
      let itemY = getGroundY(firstUnvisited.x);
      if (firstUnvisited.platformId) {
        const plat = actCfg.platforms.find((p) => p.id === firstUnvisited.platformId);
        if (plat) itemY = baseGroundY + plat.dy;
      }
      return { x: firstUnvisited.x, y: itemY - 28, kind: 'item' };
    }

    // Ưu tiên 2: Đã đọc đủ tất cả vật phẩm trong Màn -> dẫn tới Vùng Chiến đấu cuối màn hoặc lối sang Màn kế tiếp
    if ((act === 1 || act === 3) && player.dy >= 45) {
      return { x: 486, y: baseGroundY - 12, kind: 'stair_up' };
    }

    if (act === 1) {
      if (!completedQtes.has('qte_1a')) {
        return { x: 2335, y: getGroundY(2335) - 52, kind: 'combat' };
      }
      if (!completedQtes.has('qte_1b')) {
        return { x: 2720, y: getGroundY(2720) - 65, kind: 'combat' };
      }
      return { x: 2860, y: getGroundY(2860) - 42, kind: 'exit' };
    }

    if (act === 2) {
      if (combatSystem && !combatSystem.act2.tankDestroyed && player.x < 1560) {
        return { x: 1385, y: baseGroundY - 142 - 32, kind: 'combat' };
      }
      if (!completedQtes.has('qte_2a')) {
        return { x: 2565, y: getGroundY(2565) - 48, kind: 'combat' };
      }
      if (!completedQtes.has('qte_2b')) {
        return { x: 2685, y: baseGroundY - 54 - 36, kind: 'combat' };
      }
      return { x: 2850, y: getGroundY(2850) - 44, kind: 'exit' };
    }

    if (act === 3) {
      if (!completedQtes.has('qte_3a')) {
        return { x: 1730, y: getGroundY(1730) - 48, kind: 'combat' };
      }
      if (!completedQtes.has('qte_3b')) {
        return { x: 2545, y: getGroundY(2545) - 48, kind: 'combat' };
      }
      return { x: 2850, y: getGroundY(2850) - 44, kind: 'exit' };
    }

    if (act === 4) {
      if (!finaleState || !finaleState.completed) {
        return { x: FINALE_EVENT.x - 58, y: getGroundY(FINALE_EVENT.x) - 50, kind: 'finale' };
      }
      return null;
    }

    return null;
  }

  /**
   * Vẽ Hệ thống Dẫn đường Nghệ thuật trên Canvas:
   * 1) Luồng Hạt Sáng Dẫn Lối (Guiding Light Trail kiểu Genshin Impact) bay theo đường cong Bezier.
   * 2) Kim Chỉ Nam Hình Thoi Tối Giản (❖ Floating Compass) kèm mũi nhọn xoay theo góc thực tế & khoảng cách (❖ 15m).
   */
  drawAtmosphericGuidingSystem(ctx, state) {
    const target = this.getNextTarget(state);
    if (!target) return;

    const { player, cameraX, width } = state;
    const startWorldX = player.x;
    const startWorldY = player.y - (player.isCrouching ? 32 : 46);

    const rawDx = target.x - startWorldX;
    const rawDy = target.y - startWorldY;
    const fullDist = Math.hypot(rawDx, rawDy);

    // 1. LUỒNG HẠT SÁNG DẪN LỐI (GUIDING LIGHT TRAIL KIỂU GENSHIN IMPACT)
    // Khi người chơi đứng sát mục tiêu (< 90px), luồng sáng tự động mờ đi
    if (fullDist > 42) {
      const trailFade = Math.max(0, Math.min(1, (fullDist - 52) / 48));
      if (trailFade > 0.02) {
        const maxReach = Math.min(fullDist, 380);
        const dirAngle = Math.atan2(rawDy, rawDx);
        const endWorldX =
          fullDist <= 380 ? target.x : startWorldX + Math.cos(dirAngle) * maxReach;
        const endWorldY =
          fullDist <= 380 ? target.y : startWorldY + Math.sin(dirAngle) * maxReach;

        const p0x = startWorldX - cameraX;
        const p0y = startWorldY;
        const p2x = endWorldX - cameraX;
        const p2y = endWorldY;

        // Điểm điều khiển Bezier uốn lượn mềm mại (vồng lên khi nhảy bậc đá hoặc chúc xuống miệng hầm)
        const waveLift = Math.sin(this.time * 2.4) * 14;
        let archOffset = -28 + waveLift;
        if (target.kind === 'cellar_down') {
          archOffset = -34 + waveLift * 0.5;
        } else if (target.kind === 'step_up') {
          archOffset = -44 + waveLift * 0.6;
        }
        const p1x = (p0x + p2x) * 0.5;
        const p1y = Math.min(p0y, p2y) + archOffset;

        const sampleBezier = (t) => {
          const inv = 1 - t;
          const x = inv * inv * p0x + 2 * inv * t * p1x + t * t * p2x;
          const y =
            inv * inv * p0y +
            2 * inv * t * p1y +
            t * t * p2y +
            Math.sin(t * Math.PI * 2 - this.time * 4.2) * (5.5 * Math.sin(t * Math.PI));
          return { x, y };
        };

        ctx.save();

        // Dải lụa ánh sáng mảnh mai dẫn hướng
        const ribbonGrad = ctx.createLinearGradient(p0x, p0y, p2x, p2y);
        ribbonGrad.addColorStop(0, 'rgba(254, 240, 138, 0)');
        ribbonGrad.addColorStop(0.25, `rgba(253, 224, 71, ${(0.22 * trailFade).toFixed(3)})`);
        ribbonGrad.addColorStop(0.75, `rgba(251, 191, 36, ${(0.28 * trailFade).toFixed(3)})`);
        ribbonGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.strokeStyle = ribbonGrad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const curveSteps = 24;
        for (let s = 0; s <= curveSteps; s++) {
          const pt = sampleBezier(s / curveSteps);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Các hạt sáng vàng ấm bay lướt dọc theo đường cong Bezier về phía mục tiêu
        const moteCount = 14;
        for (let i = 0; i < moteCount; i++) {
          const t = (i / moteCount + this.time * 0.46) % 1;
          const pt = sampleBezier(t);
          if (pt.x < -40 || pt.x > width + 40) continue;

          const prevPt = sampleBezier(Math.max(0, t - 0.045));
          const envAlpha = Math.sin(t * Math.PI) * trailFade;
          if (envAlpha <= 0.03) continue;

          const radius = 1.4 + Math.sin(t * Math.PI) * 1.6;

          // Đuôi sao băng mảnh phía sau hạt sáng
          ctx.strokeStyle = `rgba(253, 224, 71, ${(envAlpha * 0.55).toFixed(3)})`;
          ctx.lineWidth = radius * 0.95;
          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();

          // Quầng sáng vàng ấm quanh hạt
          const glow = ctx.createRadialGradient(pt.x, pt.y, 0.4, pt.x, pt.y, radius * 3.2);
          glow.addColorStop(0, `rgba(255, 251, 235, ${(envAlpha * 0.95).toFixed(3)})`);
          glow.addColorStop(0.45, `rgba(253, 224, 71, ${(envAlpha * 0.52).toFixed(3)})`);
          glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // 2. KIM CHỈ NAM HÌNH THOI TỐI GIẢN (❖ FLOATING COMPASS KHI MỤC TIÊU > 150PX)
    if (fullDist > 150) {
      const compassAlpha = Math.max(0, Math.min(1, (fullDist - 150) / 38));
      const angle = Math.atan2(target.y - startWorldY, target.x - startWorldX);
      const dirSign = Math.cos(angle) >= 0 ? 1 : -1;

      const playerSx = startWorldX - cameraX;
      const floatBob = Math.sin(this.time * 3.1) * 3.0;
      const compassX = Math.max(
        48,
        Math.min(width - 58, playerSx + dirSign * 38)
      );
      const compassY = player.y - (player.isCrouching ? 74 : 106) + floatBob;

      const distanceMeters = Math.max(1, Math.round(fullDist / 45));

      ctx.save();
      ctx.globalAlpha = compassAlpha * 0.92;
      ctx.translate(compassX, compassY);

      // Quầng sáng dịu nhẹ quanh biểu tượng ❖
      const cGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, 14);
      cGlow.addColorStop(0, 'rgba(254, 243, 199, 0.45)');
      cGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = cGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Biểu tượng hình thoi mảnh mai màu vàng kem (❖)
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.quadraticCurveTo(1.4, -1.4, 5.5, 0);
      ctx.quadraticCurveTo(1.4, 1.4, 0, 5.5);
      ctx.quadraticCurveTo(-1.4, 1.4, -5.5, 0);
      ctx.quadraticCurveTo(-1.4, -1.4, 0, -5.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mũi nhọn nhỏ xoay theo góc thực tế Math.atan2(targetY - playerY, targetX - playerX)
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(12.5, 0);
      ctx.lineTo(7.2, -3.4);
      ctx.lineTo(8.6, 0);
      ctx.lineTo(7.2, 3.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Nhãn khoảng cách ngắn gọn (ví dụ: ❖ 15m) lơ lửng nhẹ nhàng cạnh kim chỉ nam
      const distLabel = `❖ ${distanceMeters}m`;
      ctx.font = '600 10.5px "Be Vietnam Pro", sans-serif';
      const labelOffsetX = dirSign >= 0 ? 16 : -16;
      ctx.textAlign = dirSign >= 0 ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(2, 6, 23, 0.92)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#fef3c7';
      ctx.fillText(distLabel, labelOffsetX, 0.5);

      ctx.restore();
    }
  }

  // ============================================================================
  // NÚT PHÍM BẤM NỔI BẬT TRÊN BẢN PC (FLOATING MECHANICAL KEYCAP PROMPTS)
  // ============================================================================

  /**
   * Vẽ một phím cơ thu nhỏ (28x28px, nền tối #1e293b, viền sáng vàng #fbbf24, bo góc 6px,
   * hiệu ứng nhấp nhô bounce nhẹ và tự động fade-out khi đi ra xa).
   */
  drawKeycapPrompt(ctx, sx, sy, keyChar, alpha = 1, phaseOffset = 0) {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    if (clampedAlpha <= 0.02) return;

    const bounce = Math.sin(this.time * 4.8 + phaseOffset) * 3.2;
    const isWide = keyChar.length > 2;
    const kw = isWide ? Math.max(44, keyChar.length * 8.5 + 14) : 28;
    const kh = 28;
    const radius = 6;

    ctx.save();
    ctx.globalAlpha = clampedAlpha;
    ctx.translate(sx, sy + bounce);

    // Hào quang vàng dịu phía sau phím cơ
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, kw * 0.85);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.36)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, kw * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Đế dưới phím cơ 3D (Keycap bottom bevel)
    ctx.fillStyle = '#0f172a';
    fillRoundedRect(ctx, -kw * 0.5, -kh * 0.5 + 2.5, kw, kh, radius);

    // Mặt phím tối #1e293b
    ctx.fillStyle = '#1e293b';
    fillRoundedRect(ctx, -kw * 0.5, -kh * 0.5, kw, kh, radius);

    // Viền sáng vàng #fbbf24 bo góc 6px
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.65;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-kw * 0.5, -kh * 0.5, kw, kh, radius);
    } else {
      ctx.rect(-kw * 0.5, -kh * 0.5, kw, kh);
    }
    ctx.stroke();

    // Viền highlight mảnh bên trong mặt phím cơ
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-kw * 0.5 + 2.2, -kh * 0.5 + 2, kw - 4.4, kh - 5, 4);
    } else {
      ctx.rect(-kw * 0.5 + 2.2, -kh * 0.5 + 2, kw - 4.4, kh - 5);
    }
    ctx.stroke();

    // Ký tự phím bấm sắc nét ở tâm Keycap
    ctx.fillStyle = '#fef08a';
    ctx.font = isWide
      ? '700 10.5px "Be Vietnam Pro", sans-serif'
      : '700 13px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(keyChar, 0, 0.5);

    ctx.restore();
  }

  /**
   * Tự động hiển thị các nút Keycap [E], [S], [W], [F] trên bản PC khi người chơi đến gần điểm tương tác
   * và mờ dần (fade-out) khi đi ra xa.
   */
  drawFloatingPcKeycapPrompts(ctx, state) {
    const {
      act,
      width,
      baseGroundY,
      getGroundY,
      cameraX,
      player,
      interactables,
      completedQtes,
      combatSystem,
      finaleState,
      transitionState,
    } = state;

    if (!player || (transitionState && transitionState.active)) return;
    const actCfg = ACTS.find((a) => a.id === act) || ACTS[0];

    const calcProximityAlpha = (wx, wy, fullRange = 115, fadeRange = 175) => {
      const d = Math.hypot(player.x - wx, player.y - wy);
      if (d >= fadeRange) return 0;
      if (d <= fullRange) return 1;
      return (fadeRange - d) / (fadeRange - fullRange);
    };

    // 1. Khi đứng gần Văn kiện / Vật phẩm lịch sử: Hiện nút [ E ]
    if (interactables) {
      for (const item of interactables) {
        if (item.act !== act) continue;
        const sx = item.x - cameraX;
        if (sx < -60 || sx > width + 60) continue;

        let itemY = getGroundY(item.x);
        if (item.platformId) {
          const plat = actCfg.platforms.find((p) => p.id === item.platformId);
          if (plat) itemY = baseGroundY + plat.dy;
        }

        const dx = Math.abs(player.x - item.x);
        const dy = Math.abs(player.y - itemY);
        if (dx < 165 && dy < 110) {
          const alphaX = dx <= 105 ? 1 : (165 - dx) / 60;
          const alphaY = dy <= 75 ? 1 : (110 - dy) / 35;
          const alpha = Math.min(alphaX, alphaY);
          this.drawKeycapPrompt(ctx, sx, itemY - 76, 'E', alpha, item.x * 0.02);
        }
      }
    }

    // 2. Khi đứng ở miệng hầm bí mật / lối đi xuống: Hiện nút [ S ]
    if ((act === 1 || act === 3) && player.dy < 45) {
      const hatchWorldX = 508;
      const hatchWorldY = baseGroundY;
      const alpha = calcProximityAlpha(hatchWorldX, hatchWorldY, 95, 165);
      if (alpha > 0.02) {
        this.drawKeycapPrompt(
          ctx,
          hatchWorldX - cameraX,
          hatchWorldY - 42,
          'S',
          alpha,
          1.2
        );
      }
    }

    // 3. Khi đứng ở chân bậc đá / cầu thang cần nhảy lên: Hiện nút [ W ]
    const jumpSteps = [];
    if (act === 1) {
      jumpSteps.push({ x: 985, footY: baseGroundY + 28, keyY: baseGroundY - 68 });
      if (!completedQtes.has('qte_1a')) {
        jumpSteps.push({ x: 1962, footY: baseGroundY, keyY: baseGroundY - 68 });
      }
    } else if (act === 2) {
      jumpSteps.push({ x: 845, footY: baseGroundY, keyY: baseGroundY - 68 });
      jumpSteps.push({ x: 1088, footY: baseGroundY, keyY: baseGroundY - 72 });
    } else if (act === 3) {
      if (player.dy > 20 && player.x >= 1080 && player.x <= 1410) {
        jumpSteps.push({ x: 1335, footY: baseGroundY + 62, keyY: baseGroundY - 12 });
      }
    } else if (act === 4) {
      jumpSteps.push({ x: 1030, footY: baseGroundY, keyY: baseGroundY - 76 });
    }

    for (const st of jumpSteps) {
      if (player.y > st.keyY + 25) {
        const alpha = calcProximityAlpha(st.x, st.footY, 85, 148);
        if (alpha > 0.02) {
          this.drawKeycapPrompt(ctx, st.x - cameraX, st.keyY, 'W', alpha, st.x * 0.01);
        }
      }
    }

    // 4. Khi đứng trong tầm đánh Kho thóc, đặt Bộc phá lô cốt, bắn Pháo cao xạ hoặc giữ nút dâng hương: Hiện nút [ F ]
    if (act === 1) {
      if (!completedQtes.has('qte_1a')) {
        const gx = 2335;
        const gy = getGroundY(gx);
        const alpha = calcProximityAlpha(gx, gy, 110, 185);
        if (alpha > 0.02) {
          this.drawKeycapPrompt(ctx, gx - cameraX, gy - 118, 'F', alpha, 0.5);
        }
      } else if (!completedQtes.has('qte_1b')) {
        const bx = 2720;
        const bgy = getGroundY(bx);
        const alpha = calcProximityAlpha(bx, bgy, 115, 185);
        if (alpha > 0.02) {
          this.drawKeycapPrompt(ctx, bx - cameraX, bgy - 148, 'F', alpha, 0.8);
        }
      }
    } else if (act === 2) {
      if (combatSystem && !combatSystem.act2.tankDestroyed && player.dy <= -42) {
        const tx = 1385;
        const ty = baseGroundY + player.dy;
        const alpha = calcProximityAlpha(tx, ty, 130, 195);
        if (alpha > 0.02) {
          this.drawKeycapPrompt(
            ctx,
            player.x - cameraX + 26,
            player.y - 96,
            'F',
            alpha,
            1.1
          );
        }
      }
      if (!completedQtes.has('qte_2a')) {
        const px = 2555;
        const pgy = getGroundY(px);
        const hasCharge = Boolean(combatSystem && combatSystem.act2.plantedCharge);
        if (!hasCharge) {
          const alpha = calcProximityAlpha(px, pgy, 105, 175);
          if (alpha > 0.02) {
            this.drawKeycapPrompt(ctx, px - cameraX, pgy - 92, 'F', alpha, 1.5);
          }
        }
      } else if (!completedQtes.has('qte_2b')) {
        const rx = 2685;
        const rgy = baseGroundY - 54;
        const alpha = calcProximityAlpha(rx, rgy, 115, 185);
        if (alpha > 0.02) {
          this.drawKeycapPrompt(ctx, rx - cameraX, rgy - 96, 'F', alpha, 1.8);
        }
      }
    } else if (act === 3) {
      if (!completedQtes.has('qte_3a') && combatSystem) {
        for (const g of combatSystem.act3.guns) {
          const gy = getGroundY(g.x);
          const alpha = calcProximityAlpha(g.x, gy, 72, 130);
          if (alpha > 0.02) {
            this.drawKeycapPrompt(ctx, g.x - cameraX, gy - 116, 'F', alpha, g.x * 0.01);
          }
        }
      } else if (!completedQtes.has('qte_3b') && player.x >= 2180 && player.x <= 2640) {
        this.drawKeycapPrompt(ctx, player.x - cameraX + 26, player.y - 96, 'F', 0.92, 2.1);
      }
    } else if (act === 4) {
      if (!finaleState || !finaleState.completed) {
        const altarX = FINALE_EVENT.x - 58;
        const altarY = getGroundY(FINALE_EVENT.x);
        const alpha = calcProximityAlpha(FINALE_EVENT.x - 30, altarY, 135, 210);
        if (alpha > 0.02) {
          this.drawKeycapPrompt(ctx, altarX - cameraX, altarY - 102, 'F', alpha, 2.4);
        }
      }
    }
  }
}

export { sampleGroundOffset };
