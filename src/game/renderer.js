import {
  ACTS,
  WORLD_CONFIG,
  FINALE_EVENT,
  sampleGroundOffset,
} from '../data/storyData.js';

/**
 * Clean & Atmospheric 2D Silhouette + Multi-Tier Platformer Renderer
 * Phong cách tối giản, chiều sâu sương mù đa lớp của Limbo / Gris.
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

function fillRoundedRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    return;
  }
  const radius = Array.isArray(r) ? r[0] : r;
  const cr = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.arcTo(x + w, y, x + w, y + h, cr);
  ctx.arcTo(x + w, y + h, x, y + h, cr);
  ctx.arcTo(x, y + h, x, y, cr);
  ctx.arcTo(x, y, x + w, y, cr);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR, fillStyle) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function drawWavingRedFlag(ctx, poleX, poleTopY, width, height, time, poleHeight = 0) {
  ctx.save();
  if (poleHeight > 0) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(poleX, poleTopY);
    ctx.lineTo(poleX, poleTopY + poleHeight);
    ctx.stroke();
  }

  const segs = 10;
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = poleX + u * width;
    const wave = Math.sin(time * 5.0 - u * 4.0) * (4.5 * u);
    const y = poleTopY + wave;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i--) {
    const u = i / segs;
    const x = poleX + u * width;
    const wave = Math.sin(time * 5.0 - u * 4.0) * (4.5 * u);
    ctx.lineTo(x, poleTopY + height + wave);
  }
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  const centerWave = Math.sin(time * 5.0 - 2.0) * 2.2;
  drawStar(
    ctx,
    poleX + width * 0.48,
    poleTopY + height * 0.5 + centerWave,
    5,
    height * 0.27,
    height * 0.115,
    '#facc15'
  );
  ctx.restore();
}

/** Vẽ bụi tre làng Việt Nam mềm mại bằng đường cong Bezier & lá tre mảnh */
function drawBambooCluster(ctx, baseX, baseY, scale, windTime, color) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';

  const stalks = [
    { dx: -14, h: 175, bend: -28, w: 3.6 },
    { dx: -4, h: 205, bend: -16, w: 4.2 },
    { dx: 6, h: 190, bend: 24, w: 3.8 },
    { dx: 15, h: 155, bend: 36, w: 3.1 },
    { dx: -22, h: 135, bend: -42, w: 2.8 },
  ];

  stalks.forEach((st, idx) => {
    const sway = Math.sin(windTime * 1.6 + idx * 0.9) * 7;
    const tipX = st.dx + st.bend + sway;
    const tipY = -st.h;

    ctx.lineWidth = st.w;
    ctx.beginPath();
    ctx.moveTo(st.dx, 0);
    ctx.quadraticCurveTo(st.dx + st.bend * 0.35, -st.h * 0.55, tipX, tipY);
    ctx.stroke();

    // Delicate lance-shaped leaf clusters near upper half
    for (let t = 0.52; t <= 0.98; t += 0.2) {
      const lx = st.dx + (st.bend + sway) * t * t;
      const ly = -st.h * t;
      const dir = st.bend >= 0 ? 1 : -1;
      for (let leaf = -1; leaf <= 1; leaf++) {
        const ang = dir * (0.35 + leaf * 0.28) + sway * 0.012;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(dir * 11, -2.6, dir * 22, 0);
        ctx.quadraticCurveTo(dir * 11, 2.2, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }
  });

  ctx.restore();
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

    // Subtle intra-Act mood shifts
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
      cameraZoom,
      player,
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

    if (cameraZoom !== 1 || vfx.shakeX !== 0 || vfx.shakeY !== 0) {
      const cx = width * 0.5;
      const cy = baseGroundY - 65;
      ctx.translate(cx + vfx.shakeX, cy + vfx.shakeY);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-cx, -cy);
    }

    // 1. Atmospheric Sky + Moon / Dawn Sun
    this.drawSky(ctx, act, width, height, baseGroundY, player.x, palette);

    // 2. Far Horizon Parallax (0.16x): Mountain Ridges / Modern City & Cable Bridge
    this.drawFarLayer(ctx, act, width, baseGroundY, cameraX, palette);

    // 3. Mid-Far Parallax (0.35x): Old Quarter Roofs, Tây Bắc Convoys, Trường Sơn Ridge, Metro
    this.drawMidFarLayer(ctx, act, width, baseGroundY, cameraX, palette);

    // 4. Mid-Near Atmospheric Silhouettes (0.65x): Bamboo Groves, Power Lines, Rainforest Canopy
    this.drawMidNearLayer(ctx, act, width, baseGroundY, getGroundY, cameraX, palette);

    // 5. Hazards (Searchlight, Bombers, Falling Bombs)
    vfx.renderHazards(ctx, act, cameraX, width, getGroundY, activeQte);

    // 6. Stage Landmarks & One-Way Platforms (1.0x)
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
      isTouchMode
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

    // 8. Waiting Successor at End of Act 2 & Act 3 (localX = 2860)
    this.drawWaitingSuccessor(ctx, act, getGroundY, cameraX, transitionState);

    // 9. Ancestral Spirits (Grandfather & Father) at Act 4 Finale Monument
    if (act === 4 && finaleState.spiritsAlpha > 0.01) {
      this.drawAncestralSpirits(ctx, getGroundY, cameraX, finaleState.spiritsAlpha);
    }

    // 10. Player Character (Articulated Jump, Drop, Walk & Action Poses)
    this.drawPlayer(ctx, act, cameraX, player, dt);

    // 11. Continuous Sloped / Sunken Terrain Contour & Limbo Foreground Grass (1.2x)
    this.drawTerrainContourAndForeground(
      ctx,
      act,
      width,
      height,
      getGroundY,
      cameraX,
      palette
    );

    ctx.restore();

    // 12. Particles, Shockwaves, Slow-mo Vignette & Flash
    vfx.renderForeground(ctx, cameraX, width, height);

    // 13. Cinematic Fade-to-Black Curtain during Act Transitions
    if (transitionState && transitionState.fadeAlpha > 0.005) {
      ctx.save();
      ctx.fillStyle = `rgba(4, 6, 10, ${Math.min(1, transitionState.fadeAlpha)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  drawSky(ctx, act, width, height, baseGroundY, localX, palette) {
    const grad = ctx.createLinearGradient(0, 0, 0, baseGroundY + 60);
    grad.addColorStop(0, palette.skyTop);
    grad.addColorStop(0.56, palette.skyMid);
    grad.addColorStop(1, palette.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(-80, -80, width + 160, height + 160);

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

    // Act 4 Modern Skyline & Cable-Stayed Bridge Silhouette
    if (act === 4) {
      ctx.fillStyle = palette.farHill;
      const towers = [
        { x: 180, w: 56, h: 165, spire: false },
        { x: 340, w: 48, h: 215, spire: false },
        { x: 520, w: 68, h: 305, spire: true },
        { x: 690, w: 54, h: 185, spire: false },
        { x: 920, w: 62, h: 240, spire: false },
        { x: 1460, w: 60, h: 265, spire: true },
        { x: 1640, w: 70, h: 195, spire: false },
      ];
      for (const b of towers) {
        const bx = b.x - cameraX * 0.2;
        if (bx < -120 || bx > width + 120) continue;
        ctx.fillRect(bx, baseGroundY - b.h, b.w, b.h + 40);
        if (b.spire) {
          ctx.beginPath();
          ctx.moveTo(bx + b.w * 0.22, baseGroundY - b.h);
          ctx.lineTo(bx + b.w * 0.5, baseGroundY - b.h - 62);
          ctx.lineTo(bx + b.w * 0.78, baseGroundY - b.h);
          ctx.fill();
        }
      }

      // Sleek Cable-Stayed Bridge in far distance
      const pylonX = 1160 - cameraX * 0.2;
      if (pylonX > -280 && pylonX < width + 280) {
        ctx.fillRect(pylonX - 6, baseGroundY - 235, 12, 160);
        ctx.fillRect(pylonX - 220, baseGroundY - 98, 440, 6);
        ctx.strokeStyle = palette.farHill;
        ctx.lineWidth = 1.3;
        for (let c = 1; c <= 6; c++) {
          ctx.beginPath();
          ctx.moveTo(pylonX, baseGroundY - 225 + c * 10);
          ctx.lineTo(pylonX - c * 32, baseGroundY - 98);
          ctx.moveTo(pylonX, baseGroundY - 225 + c * 10);
          ctx.lineTo(pylonX + c * 32, baseGroundY - 98);
          ctx.stroke();
        }
      }
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

    // Act 2 (0 - 1500): Old Hanoi Shophouse Silhouettes
    if (act === 2) {
      for (let hx = 60; hx <= 1460; hx += 108) {
        const sx = hx - cameraX * 0.65;
        if (sx < -130 || sx > width + 130) continue;
        const h = 105 + ((hx * 19) % 62);
        ctx.fillStyle = palette.midHill;
        ctx.fillRect(sx, baseGroundY - h, 86, h + 40);
        // Traditional stepped gable / tiled roof
        ctx.beginPath();
        ctx.moveTo(sx - 5, baseGroundY - h);
        ctx.lineTo(sx + 43, baseGroundY - h - 22);
        ctx.lineTo(sx + 91, baseGroundY - h);
        ctx.closePath();
        ctx.fill();
        // Subtle dim shuttered windows
        ctx.fillStyle = 'rgba(251, 146, 60, 0.16)';
        ctx.fillRect(sx + 20, baseGroundY - h + 24, 13, 22);
        ctx.fillRect(sx + 50, baseGroundY - h + 24, 13, 22);
      }

      // Act 2 (1600 - 2200): Đoàn xe đạp thồ Tây Bắc lặng lẽ tiến lên sườn núi xa
      for (let i = 0; i < 4; i++) {
        const wx = 1620 + i * 135 + ((this.time * 16) % 135);
        const sx = wx - cameraX;
        if (sx < -80 || sx > width + 80) continue;
        const ridgeY = baseGroundY - 96 - Math.sin((wx - 1500) * 0.0045) * 32;
        ctx.save();
        ctx.translate(sx, ridgeY);
        ctx.scale(0.58, 0.58);
        ctx.fillStyle = palette.nearSil;
        ctx.strokeStyle = palette.nearSil;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(-15, -11, 10, 0, Math.PI * 2);
        ctx.arc(15, -11, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(-18, -33, 36, 18);
        ctx.beginPath();
        ctx.arc(-26, -39, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-30, -33, 9, 21);
        ctx.restore();
      }
    }

    // Act 4: Elevated Metro Viaduct & Sleek Train Gliding Smoothly
    if (act === 4) {
      const bridgeY = baseGroundY - 168;
      ctx.fillStyle = 'rgba(36, 64, 92, 0.45)';
      ctx.fillRect(-40, bridgeY, width + 80, 10);
      for (let px = 120; px <= 2900; px += 240) {
        const psx = px - cameraX * 0.55;
        if (psx >= -30 && psx <= width + 30) {
          ctx.fillRect(psx - 7, bridgeY + 10, 14, 180);
        }
      }
      const trainX = ((this.time * 115) % (width + 460)) - 230;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.8)';
      fillRoundedRect(ctx, trainX, bridgeY - 20, 178, 18, 7);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      for (let w = 16; w < 158; w += 26) {
        ctx.fillRect(trainX + w, bridgeY - 15, 16, 7);
      }
    }

    ctx.restore();
  }

  drawMidNearLayer(ctx, act, width, baseGroundY, getGroundY, cameraX, palette) {
    ctx.save();

    if (act === 1) {
      // Bụi tre làng Việt Nam mềm mại (thay thế hoàn toàn cây chữ Y cứng nhắc)
      const bambooSpots = [
        { x: 130, s: 0.95 },
        { x: 390, s: 1.08 },
        { x: 770, s: 0.92 },
        { x: 1620, s: 1.04 },
        { x: 1770, s: 0.86 },
      ];
      for (const b of bambooSpots) {
        const sx = b.x - cameraX;
        if (sx < -140 || sx > width + 140) continue;
        drawBambooCluster(ctx, sx, getGroundY(b.x) + 4, b.s, this.time, palette.nearSil);
      }

      // Mái đình làng cổ Việt Nam (đao đình cong vút) che bên trên bàn Cương lĩnh ở x = 560
      const dinhX = 560 - cameraX;
      if (dinhX > -220 && dinhX < width + 220) {
        const gy = getGroundY(560);
        ctx.fillStyle = palette.nearSil;
        // Wooden pillars
        ctx.fillRect(dinhX - 78, gy - 118, 9, 122);
        ctx.fillRect(dinhX + 69, gy - 118, 9, 122);
        ctx.fillRect(dinhX - 42, gy - 118, 6, 122);
        ctx.fillRect(dinhX + 36, gy - 118, 6, 122);
        // Sweeping curved communal roof with upturned eaves (đao đình)
        ctx.beginPath();
        ctx.moveTo(dinhX - 122, gy - 126);
        ctx.quadraticCurveTo(dinhX - 96, gy - 108, dinhX - 65, gy - 114);
        ctx.lineTo(dinhX + 65, gy - 114);
        ctx.quadraticCurveTo(dinhX + 96, gy - 108, dinhX + 122, gy - 126);
        ctx.quadraticCurveTo(dinhX + 78, gy - 134, dinhX, gy - 168);
        ctx.quadraticCurveTo(dinhX - 78, gy - 134, dinhX - 122, gy - 126);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (act === 2) {
      // Cột điện & Dây điện phố cổ Hà Nội võng xuống tự nhiên (0 - 1520)
      const poles = [140, 460, 790, 1140, 1460];
      ctx.strokeStyle = palette.nearSil;
      ctx.fillStyle = palette.nearSil;
      for (let i = 0; i < poles.length; i++) {
        const px = poles[i] - cameraX;
        const gy = getGroundY(poles[i]);
        if (px > -120 && px < width + 120) {
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(px, gy + 5);
          ctx.lineTo(px + (i % 2 === 0 ? 4 : -3), gy - 195);
          ctx.stroke();
          // Crossbars
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px - 16, gy - 182);
          ctx.lineTo(px + 18, gy - 182);
          ctx.moveTo(px - 12, gy - 168);
          ctx.lineTo(px + 14, gy - 168);
          ctx.stroke();
        }
        // Sagging catenary power lines to next pole
        if (i < poles.length - 1) {
          const nextPx = poles[i + 1] - cameraX;
          const nextGy = getGroundY(poles[i + 1]);
          if (nextPx > -60 && px < width + 60) {
            ctx.lineWidth = 1.3;
            ctx.strokeStyle = 'rgba(15, 10, 10, 0.72)';
            for (const dyWire of [-182, -168]) {
              ctx.beginPath();
              ctx.moveTo(px, gy + dyWire);
              ctx.quadraticCurveTo(
                (px + nextPx) * 0.5,
                (gy + nextGy) * 0.5 + dyWire + 26 + Math.sin(this.time * 1.4 + i) * 2,
                nextPx,
                nextGy + dyWire
              );
              ctx.stroke();
            }
          }
        }
      }
    }

    if (act === 3) {
      // Tán rừng già Trường Sơn hữu cơ & dây leo rủ bóng (0 - 2320)
      for (let jx = 120; jx <= 2280; jx += 210) {
        if (jx > 1030 && jx < 1390) continue; // Keep suspension bridge vista open
        const sx = jx - cameraX;
        if (sx < -160 || sx > width + 160) continue;
        const gy = getGroundY(jx);
        const isScorched = jx > 1800;
        const treeH = 215 + ((jx * 13) % 75);

        ctx.fillStyle = palette.nearSil;
        // Organic tapered trunk with root flare
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

          // Soft swaying vine
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
      // Cổng trường Đại học hiện đại (x = 350) & Hàng cây xanh đô thị
      const uniX = 350 - cameraX;
      if (uniX > -240 && uniX < width + 240) {
        const gy = getGroundY(350);
        ctx.fillStyle = '#1b3554';
        ctx.fillRect(uniX - 104, gy - 155, 18, 158);
        ctx.fillRect(uniX + 86, gy - 155, 18, 158);
        ctx.fillStyle = '#10253d';
        fillRoundedRect(ctx, uniX - 122, gy - 178, 244, 30, 6);
        ctx.fillStyle = '#fde68a';
        ctx.font = '600 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ĐẠI HỌC VIỆT NAM', uniX, gy - 159);
      }

      const treePositions = [130, 560, 890, 1940, 2140];
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
    isTouchMode = false
  ) {
    const actCfg = ACTS.find((a) => a.id === act) || ACTS[0];
    ctx.save();

    // ==================== ONE-WAY PLATFORMS ====================
    for (const p of actCfg.platforms) {
      const sx1 = p.x1 - cameraX;
      const sx2 = p.x2 - cameraX;
      const pw = sx2 - sx1;
      const py = baseGroundY + p.dy;
      if (sx2 < -80 || sx1 > width + 80) continue;

      switch (p.style) {
        case 'stone_ledge': {
          // Craggy limestone cliff ledge (Cao Bằng / Suối Trường Sơn)
          ctx.fillStyle = act === 1 ? '#0d121c' : '#081822';
          ctx.beginPath();
          ctx.moveTo(sx1, py);
          ctx.lineTo(sx2, py);
          ctx.lineTo(sx2 - 12, py + 22);
          ctx.lineTo(sx1 + pw * 0.55, py + 32);
          ctx.lineTo(sx1 + 10, py + 20);
          ctx.closePath();
          ctx.fill();
          // Subtle top rim highlight so jumpable surface reads immediately
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.28)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx1 + 2, py + 1);
          ctx.lineTo(sx2 - 2, py + 1);
          ctx.stroke();
          break;
        }
        case 'wood_crate': {
          const groundHere = getGroundY((p.x1 + p.x2) * 0.5);
          ctx.fillStyle = '#181512';
          ctx.fillRect(sx1 + 4, py, pw - 8, groundHere - py + 4);
          ctx.strokeStyle = 'rgba(214, 211, 209, 0.22)';
          ctx.lineWidth = 1.6;
          ctx.strokeRect(sx1 + 4, py, pw - 8, groundHere - py);
          break;
        }
        case 'roof_eave': {
          ctx.fillStyle = '#0e1118';
          ctx.beginPath();
          ctx.moveTo(sx1 - 6, py + 8);
          ctx.lineTo(sx1 + 10, py);
          ctx.lineTo(sx2 - 10, py);
          ctx.lineTo(sx2 + 6, py + 8);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(sx1 + 12, py + 8, 7, getGroundY(p.x1 + 15) - py);
          ctx.fillRect(sx2 - 19, py + 8, 7, getGroundY(p.x2 - 15) - py);
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(sx1, py + 1);
          ctx.lineTo(sx2, py + 1);
          ctx.stroke();
          break;
        }
        case 'barricade': {
          // Chiến lũy Hà Nội: bao cát chồng & bánh xe gỗ, bàn ghế
          const gy = getGroundY((p.x1 + p.x2) * 0.5);
          ctx.fillStyle = '#160d0d';
          const h = gy - py;
          fillRoundedRect(ctx, sx1, py, pw, h + 4, 6);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.24)';
          ctx.lineWidth = 1.6;
          for (let row = py + 14; row < gy - 4; row += 15) {
            ctx.beginPath();
            ctx.moveTo(sx1 + 6, row);
            ctx.lineTo(sx2 - 6, row);
            ctx.stroke();
          }
          break;
        }
        case 'tram_roof': {
          // Toa tàu điện cũ Hà Nội chắn ngang phố cổ
          const gy = getGroundY((p.x1 + p.x2) * 0.5);
          ctx.fillStyle = '#1a0f0e';
          fillRoundedRect(ctx, sx1, py, pw, gy - py + 2, [10, 10, 2, 2]);
          // Tram windows
          ctx.fillStyle = 'rgba(253, 224, 71, 0.12)';
          for (let wx = sx1 + 18; wx < sx2 - 28; wx += 36) {
            ctx.fillRect(wx, py + 20, 24, 30);
          }
          // Overhead tram bow collector silhouette
          ctx.strokeStyle = '#291d1b';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(sx1 + pw * 0.5 - 16, py);
          ctx.lineTo(sx1 + pw * 0.5, py - 24);
          ctx.lineTo(sx1 + pw * 0.5 + 16, py);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(253, 230, 138, 0.3)';
          ctx.beginPath();
          ctx.moveTo(sx1 + 4, py + 1);
          ctx.lineTo(sx2 - 4, py + 1);
          ctx.stroke();
          break;
        }
        case 'trench_plank': {
          // Cầu ván gỗ & ụ pháo trên miệng giao thông hào / hố bom
          ctx.fillStyle = '#1f1411';
          ctx.fillRect(sx1, py, pw, 8);
          ctx.fillRect(sx1 + 8, py + 8, 6, getGroundY(p.x1 + 8) - py);
          ctx.fillRect(sx2 - 14, py + 8, 6, getGroundY(p.x2 - 8) - py);
          ctx.strokeStyle = 'rgba(245, 208, 125, 0.28)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx1, py + 1);
          ctx.lineTo(sx2, py + 1);
          ctx.stroke();
          break;
        }
        case 'bunker_roof': {
          // Nắp hầm tướng Đờ Cátơri (mái vòm tôn uốn cong & bao cát)
          const cx = (sx1 + sx2) * 0.5;
          const gy = getGroundY((p.x1 + p.x2) * 0.5);
          ctx.fillStyle = '#170f0d';
          ctx.beginPath();
          ctx.moveTo(sx1 - 18, gy + 4);
          ctx.quadraticCurveTo(cx, py - 48, sx2 + 18, gy + 4);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx1 + 8, py + 2);
          ctx.lineTo(sx2 - 8, py + 2);
          ctx.stroke();
          break;
        }
        case 'fallen_log': {
          // Thân cây cổ thụ đổ ngang đường Trường Sơn
          const gy = getGroundY((p.x1 + p.x2) * 0.5);
          ctx.fillStyle = '#07161e';
          fillRoundedRect(ctx, sx1, py, pw, gy - py + 6, 14);
          ctx.strokeStyle = 'rgba(110, 231, 183, 0.24)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(sx1 + 8, py + 1);
          ctx.lineTo(sx2 - 8, py + 1);
          ctx.stroke();
          break;
        }
        case 'wood_bridge': {
          // Cầu treo gỗ bắc qua vực suối Trường Sơn
          const postH = 44;
          ctx.fillStyle = '#081923';
          ctx.fillRect(sx1 - 4, py - postH, 8, postH + 18);
          ctx.fillRect(sx2 - 4, py - postH, 8, postH + 18);
          // Main suspension cable
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx1, py - postH + 4);
          ctx.quadraticCurveTo((sx1 + sx2) * 0.5, py - 6, sx2, py - postH + 4);
          ctx.stroke();
          // Vertical rope hangers & wooden planks
          ctx.lineWidth = 1;
          for (let x = sx1 + 14; x < sx2 - 8; x += 18) {
            const u = (x - sx1) / pw;
            const cableY =
              (1 - u) * (1 - u) * (py - postH + 4) +
              2 * (1 - u) * u * (py - 6) +
              u * u * (py - postH + 4);
            ctx.beginPath();
            ctx.moveTo(x + 5, cableY);
            ctx.lineTo(x + 5, py);
            ctx.stroke();

            ctx.fillStyle = '#0e2430';
            ctx.fillRect(x, py, 12, 6);
          }
          break;
        }
        case 'modern_walkway': {
          // Cầu vượt đi bộ đa tầng hiện đại
          const gy = getGroundY((p.x1 + p.x2) * 0.5);
          ctx.fillStyle = '#1b354f';
          ctx.fillRect(sx1, py, pw, 9);
          // Slender architectural support column
          ctx.fillStyle = '#14283d';
          ctx.fillRect(sx1 + pw * 0.5 - 7, py + 9, 14, gy - py);
          // Sleek glass railing above walkway
          ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
          ctx.fillRect(sx1 + 2, py - 24, pw - 4, 24);
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.48)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx1 + 2, py - 24);
          ctx.lineTo(sx2 - 2, py - 24);
          ctx.stroke();
          break;
        }
      }
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

    // ==================== ICONIC STAGE LANDMARKS PER ACT ====================
    if (act === 1) {
      // Kho thóc Nhật (x = 2325) & Chòi gác (x = 2415)
      const gx = 2325 - cameraX;
      const gy = getGroundY(2325);
      if (gx > -220 && gx < width + 220) {
        const liberated = completedQtes.has('qte_1a');
        ctx.fillStyle = '#0b0f17';
        ctx.fillRect(gx - 90, gy - 158, 180, 162);
        ctx.beginPath();
        ctx.moveTo(gx - 106, gy - 158);
        ctx.lineTo(gx, gy - 204);
        ctx.lineTo(gx + 106, gy - 158);
        ctx.closePath();
        ctx.fill();

        const twX = 2415 - cameraX;
        ctx.strokeStyle = '#0f1520';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(twX - 20, gy);
        ctx.lineTo(twX - 11, gy - 218);
        ctx.moveTo(twX + 20, gy);
        ctx.lineTo(twX + 11, gy - 218);
        ctx.stroke();
        ctx.fillRect(twX - 22, gy - 238, 44, 20);

        if (liberated) {
          const glow = ctx.createRadialGradient(gx, gy - 38, 8, gx, gy - 38, 95);
          glow.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
          glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(gx, gy - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.moveTo(gx - 62, gy);
          ctx.quadraticCurveTo(gx, gy - 84, gx + 62, gy);
          ctx.fill();
        } else {
          ctx.fillStyle = '#181512';
          ctx.fillRect(gx - 42, gy - 104, 84, 104);
          ctx.strokeStyle = '#44403c';
          ctx.lineWidth = 3;
          ctx.strokeRect(gx - 42, gy - 104, 84, 104);
        }
      }

      // Lễ đài Quảng trường Ba Đình (x = 2720)
      const bx = 2720 - cameraX;
      const bgy = getGroundY(2720);
      if (bx > -240 && bx < width + 240) {
        const won1B = completedQtes.has('qte_1b');
        ctx.fillStyle = '#0e1118';
        ctx.fillRect(bx - 110, bgy - 138, 220, 142);
        ctx.fillRect(bx - 60, bgy - 175, 120, 38);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(bx - 84, bgy - 126, 16, 88);
        ctx.fillRect(bx + 68, bgy - 126, 16, 88);
        drawWavingRedFlag(ctx, bx, bgy - 246, 68, 42, this.time, 72);

        // Clean silhouette crowd
        for (let i = -4; i <= 4; i++) {
          if (i === 0 || i === -1) continue;
          const cx = bx + i * 36;
          const bob = won1B ? Math.abs(Math.sin(this.time * 6.5 + i)) * 7 : 0;
          ctx.fillStyle = '#080a0f';
          ctx.beginPath();
          ctx.arc(cx, bgy - 52 - bob, 7.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(cx - 7, bgy - 43 - bob, 14, 45 + bob);
        }
      }
    }

    if (act === 2) {
      // Cờ Quyết chiến Quyết thắng trên nóc hầm Đờ Cátơri khi hoàn thành QTE 2B
      if (completedQtes.has('qte_2b')) {
        const bkX = 2690 - cameraX;
        const bkTopY = baseGroundY - 56;
        drawWavingRedFlag(ctx, bkX, bkTopY - 96, 70, 44, this.time, 96);
      }
    }

    if (act === 3) {
      // Đồng đội Quân Giải phóng bên miệng hố bom (x = 2095)
      const comX = 2095 - cameraX;
      if (comX > -80 && comX < width + 80) {
        const cgy = getGroundY(2095);
        ctx.fillStyle = '#061116';
        ctx.beginPath();
        ctx.arc(comX, cgy - 60, 8.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(comX, cgy - 65, 15, 4, -0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(comX - 8, cgy - 50, 16, 52);
      }

      // Cổng Dinh Độc Lập & Xe tăng 390 (x = 2650..2780)
      const gateX = 2645 - cameraX;
      const palaceX = 2745 - cameraX;
      const pgy = getGroundY(2700);
      if (palaceX > -280 && gateX < width + 280) {
        const won3B = completedQtes.has('qte_3b');

        ctx.fillStyle = 'rgba(24, 35, 52, 0.86)';
        ctx.fillRect(palaceX - 140, pgy - 188, 280, 192);
        ctx.fillRect(palaceX - 70, pgy - 226, 140, 38);
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
        ctx.lineWidth = 1.8;
        for (let lx = -124; lx <= 124; lx += 14) {
          ctx.beginPath();
          ctx.moveTo(palaceX + lx, pgy - 172);
          ctx.lineTo(palaceX + lx, pgy - 46);
          ctx.stroke();
        }
        if (won3B) {
          drawWavingRedFlag(ctx, palaceX, pgy - 294, 72, 44, this.time, 68);
        }

        // Gate pillar & toppling wrought-iron gate
        ctx.fillStyle = '#172130';
        ctx.fillRect(gateX - 12, pgy - 140, 20, 142);
        ctx.save();
        ctx.translate(gateX, pgy);
        if (won3B) ctx.rotate(1.28);
        else if (activeQte && activeQte.id === 'qte_3b') ctx.rotate(tankProgress * 0.45);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.6;
        ctx.strokeRect(-4, -126, 46, 126);
        for (let b = 6; b < 42; b += 9) {
          ctx.beginPath();
          ctx.moveTo(b, -126);
          ctx.lineTo(b, 0);
          ctx.stroke();
        }
        ctx.restore();

        const tankWorldX = won3B ? 2685 : 2480 + tankProgress * 160;
        this.drawTank390(ctx, tankWorldX - cameraX, getGroundY(tankWorldX));
      }
    }

    if (act === 4) {
      // Đài tưởng niệm Tổ quốc ghi công (x = 2560)
      const mx = FINALE_EVENT.x - cameraX;
      const mgy = getGroundY(FINALE_EVENT.x);
      if (mx > -260 && mx < width + 260) {
        const halo = ctx.createRadialGradient(mx, mgy - 145, 16, mx, mgy - 145, 220);
        halo.addColorStop(0, 'rgba(254, 240, 138, 0.48)');
        halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(mx, mgy - 145, 220, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#172638';
        ctx.fillRect(mx - 120, mgy - 16, 240, 20);
        ctx.fillRect(mx - 88, mgy - 32, 176, 16);

        ctx.fillStyle = '#0e1926';
        ctx.beginPath();
        ctx.moveTo(mx - 42, mgy - 32);
        ctx.lineTo(mx - 26, mgy - 275);
        ctx.lineTo(mx, mgy - 310);
        ctx.lineTo(mx + 26, mgy - 275);
        ctx.lineTo(mx + 42, mgy - 32);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(mx - 17, mgy - 230, 34, 160);
        drawStar(ctx, mx, mgy - 258, 5, 14, 6, '#facc15');

        ctx.fillStyle = '#fde68a';
        ctx.font = '700 10.5px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ['TỔ', 'QUỐC', 'GHI', 'CÔNG'].forEach((w, idx) => {
          ctx.fillText(w, mx, mgy - 202 + idx * 33);
        });

        // Bàn thờ & Lư hương đồng phía trước
        const altarX = mx - 60;
        ctx.fillStyle = '#24201e';
        ctx.fillRect(altarX - 22, mgy - 46, 44, 30);
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(altarX, mgy - 54, 11.5, 0, Math.PI * 2);
        ctx.fill();

        if (finaleState.holdProgress > 0.05 || finaleState.completed) {
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.8;
          for (let s = -4; s <= 4; s += 4) {
            ctx.beginPath();
            ctx.moveTo(altarX + s, mgy - 64);
            ctx.lineTo(altarX + s, mgy - 82);
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(altarX + s, mgy - 83, 2.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  }

  drawTank390(ctx, sx, groundY) {
    ctx.save();
    ctx.translate(sx, groundY);

    ctx.fillStyle = '#0f172a';
    fillRoundedRect(ctx, -74, -26, 148, 26, 12);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.2;
    for (let w = -54; w <= 54; w += 27) {
      ctx.beginPath();
      ctx.arc(w, -12, 9.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#133028';
    ctx.beginPath();
    ctx.moveTo(-80, -24);
    ctx.lineTo(-62, -44);
    ctx.lineTo(64, -44);
    ctx.lineTo(82, -24);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#183b31';
    ctx.beginPath();
    ctx.arc(-4, -44, 32, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = '#133028';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(22, -55);
    ctx.lineTo(106, -60);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 12px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('390', -8, -50);
    drawStar(ctx, 14, -55, 5, 5.5, 2.2, '#facc15');

    drawWavingRedFlag(ctx, -16, -112, 42, 26, this.time, 40);
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

      // Subtle localized rim glow ONLY so the prop reads cleanly against dark silhouettes (no floating orbs!)
      const subtleAlpha = isNear ? 0.36 : isSeeking ? 0.28 : 0.14;
      const g = ctx.createRadialGradient(0, -24, 2, 0, -24, isNear ? 54 : 36);
      g.addColorStop(0, `rgba(253, 230, 138, ${subtleAlpha})`);
      g.addColorStop(1, 'rgba(253, 230, 138, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -24, isNear ? 54 : 36, 0, Math.PI * 2);
      ctx.fill();

      // Subtle ground ripple when player tapped a distant visible artifact to auto-run toward it
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

      this.drawArtifactVector(ctx, item.iconType, isNear || isSeeking);

      // ONLY display compact floating prompt when player is nearby!
      if (isNear) {
        const floatY = -74 + Math.sin(this.time * 3.2) * 3;
        const label = isTouchMode
          ? item.visited
            ? '[Chạm] Xem lại'
            : '[Chạm] Khám phá'
          : item.visited
          ? '[E] Xem lại'
          : '[E] Khám phá';
        this.drawMinimalFloatingHint(ctx, 0, floatY, label, isTouchMode);
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

  drawArtifactVector(ctx, iconType, isNear) {
    ctx.save();
    ctx.strokeStyle = isNear ? '#fef08a' : 'rgba(253, 230, 138, 0.72)';
    ctx.fillStyle = '#141312';
    ctx.lineWidth = 1.8;

    switch (iconType) {
      case 'manifesto_table': {
        ctx.fillRect(-28, -32, 56, 5);
        ctx.fillRect(-22, -27, 5, 27);
        ctx.fillRect(17, -27, 5, 27);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-17, -37, 20, 5);
        // Tiny warm oil lamp wick
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(11, -33);
        ctx.quadraticCurveTo(14, -44, 17, -33);
        ctx.fill();
        break;
      }
      case 'viet_minh_flag': {
        ctx.fillRect(-20, -20, 40, 20);
        drawWavingRedFlag(ctx, -4, -64, 34, 21, this.time, 46);
        break;
      }
      case 'ox_cart_granary': {
        ctx.fillRect(-26, -26, 48, 8);
        ctx.beginPath();
        ctx.arc(-6, -15, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(22, -20);
        ctx.lineTo(42, -30);
        ctx.stroke();
        break;
      }
      case 'rice_jar_blackboard': {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(-17, -15, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, -50, 32, 24);
        ctx.strokeRect(2, -50, 32, 24);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 9.5px sans-serif';
        ctx.fillText('i - t', 8, -34);
        break;
      }
      case 'barricade_speaker': {
        ctx.fillRect(-3, -46, 5, 46);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(22, -52);
        ctx.lineTo(22, -28);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'pack_bike_map': {
        ctx.beginPath();
        ctx.arc(-16, -13, 11, 0, Math.PI * 2);
        ctx.arc(14, -13, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#713f12';
        ctx.fillRect(-18, -35, 32, 16);
        ctx.strokeRect(-18, -35, 32, 16);
        break;
      }
      case 'campfire_letter': {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.quadraticCurveTo(-3, -28 - Math.sin(this.time * 8) * 4, 5, -3);
        ctx.fill();
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(9, -20, 16, 11);
        ctx.strokeRect(9, -20, 16, 11);
        break;
      }
      case 'radio_milestone': {
        ctx.fillStyle = '#cbd5e1';
        fillRoundedRect(ctx, -22, -40, 20, 40, [9, 9, 0, 0]);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-22, -40, 20, 9);
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, -20, 20, 14);
        ctx.strokeRect(4, -20, 20, 14);
        ctx.beginPath();
        ctx.moveTo(20, -20);
        ctx.lineTo(26, -40);
        ctx.stroke();
        break;
      }
      case 'history_board': {
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(-26, -54, 52, 32);
        ctx.strokeRect(-26, -54, 52, 32);
        ctx.fillRect(-20, -22, 4, 22);
        ctx.fillRect(16, -22, 4, 22);
        drawStar(ctx, 0, -38, 5, 7, 3, '#fde047');
        break;
      }
      case 'modern_emblem': {
        ctx.beginPath();
        ctx.arc(0, -32, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -32, 24, 8, 0.5, 0, Math.PI * 2);
        ctx.ellipse(0, -32, 24, 8, -0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(-9, -14, 18, 14);
        break;
      }
    }
    ctx.restore();
  }

  /**
   * Vẽ nhân vật thế hệ tiếp theo đứng đợi sẵn ở localX = 2860 (cuối Màn 2 & cuối Màn 3)
   * và hoạt cảnh chuyển giao thế hệ 2.5s trước khi bước tiếp qua rìa phải.
   */
  drawWaitingSuccessor(ctx, act, getGroundY, cameraX, transitionState) {
    if (act !== 2 && act !== 3) return;
    // Once successor takes over walking past 2860 in WALK_OFF_AFTER_HANDOFF, player figure renders them
    if (transitionState && transitionState.subPhase === 'SUCCESSOR_WALK_OFF') {
      // Render the elder staying at 2834 in a proud farewell salute!
      const elderX = 2834;
      const elderY = getGroundY(elderX);
      this.drawSilhouetteBody(ctx, elderX - cameraX, elderY, act, {
        facing: 1,
        walkCycle: 0,
        speedRatio: 0,
        onGround: true,
        vy: 0,
        landingSquash: 0,
        pose: 'salute_farewell',
        poseTimer: this.time,
        wearingHat: act === 2 ? false : true, // Grandfather already passed his helmet!
      });
      return;
    }

    const waitX = WORLD_CONFIG.successorWaitX;
    const waitY = getGroundY(waitX);
    const nextCostumeAct = act === 2 ? 3 : 4;
    const inCeremony =
      transitionState && transitionState.subPhase === 'HANDOFF_CEREMONY';
    const ceremonyProgress = inCeremony ? transitionState.ceremonyProgress || 0 : 0;

    // Subtle ground rim glow beneath waiting successor
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

    this.drawSilhouetteBody(ctx, waitX - cameraX, waitY, nextCostumeAct, {
      facing: -1, // Facing left toward approaching elder
      walkCycle: 0,
      speedRatio: 0,
      onGround: true,
      vy: 0,
      landingSquash: 0,
      pose: inCeremony ? 'handoff_receive' : null,
      poseTimer: ceremonyProgress,
      // In Act 2 handoff, Người Cha puts on the helmet halfway through the 2.5s ceremony
      wearingHat: act === 2 ? ceremonyProgress > 0.55 : true,
    });
  }

  drawAncestralSpirits(ctx, getGroundY, cameraX, alpha) {
    const spirits = [
      { worldX: FINALE_EVENT.x - 160, hat: 'mu_nan' },
      { worldX: FINALE_EVENT.x - 118, hat: 'tai_beo' },
    ];

    for (const sp of spirits) {
      const sx = sp.worldX - cameraX;
      const gy = getGroundY(sp.worldX);
      ctx.save();
      ctx.translate(sx, gy);
      ctx.globalAlpha = Math.min(1, alpha);

      const glow = ctx.createRadialGradient(0, -50, 6, 0, -50, 62);
      glow.addColorStop(0, 'rgba(254, 249, 195, 0.85)');
      glow.addColorStop(0.5, 'rgba(253, 224, 71, 0.32)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -50, 62, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 249, 195, 0.92)';
      ctx.fillRect(-8.5, -38, 7, 38);
      ctx.fillRect(1.5, -38, 7, 38);
      fillRoundedRect(ctx, -11.5, -73, 23, 37, 6);

      ctx.beginPath();
      ctx.arc(0, -84, 8.8, 0, Math.PI * 2);
      ctx.fill();

      if (sp.hat === 'mu_nan') {
        ctx.beginPath();
        ctx.arc(0, -87, 13, Math.PI, 0);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, -90, 15.5, 4.2, -0.05, 0, Math.PI * 2);
        ctx.arc(0, -91, 9, Math.PI, 0);
        ctx.fill();
      }

      // Gentle proud smile
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(3.5, -82.5, 3.0, 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -86, 1.7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      ctx.restore();
    }
  }

  drawPlayer(ctx, act, cameraX, player, dt) {
    const costumeAct = player.costumeOverride || act;
    const sx = player.x - cameraX;
    const speedRatio = Math.min(1, Math.abs(player.vx) / player.maxSpeed);
    const dir = player.facing || 1;

    // Action pose vertical boost (for QTE vaulting)
    let actionJumpOffset = 0;
    if (player.pose === 'leap_trench' || player.pose === 'leap_crater') {
      actionJumpOffset = -Math.sin(Math.min(1, player.poseTimer * 1.4) * Math.PI) * 52;
    }

    const footY = player.y + actionJumpOffset;
    const walkBob =
      player.onGround && speedRatio > 0.05
        ? Math.abs(Math.sin(player.walkCycle * 2)) * 4.0
        : Math.sin(this.time * 2.5) * 1.0;

    // Flowing scarf trail in world space
    const shoulderWorldX = player.x - dir * 5;
    const shoulderWorldY = footY - 64 - walkBob;
    this.scarfTrail.unshift({ x: shoulderWorldX, y: shoulderWorldY });
    if (this.scarfTrail.length > 9) this.scarfTrail.pop();
    for (let i = 1; i < this.scarfTrail.length; i++) {
      this.scarfTrail[i].x -= dir * dt * 50;
      this.scarfTrail[i].y +=
        (Math.sin(this.time * 8.5 + i * 0.8) * 24 - (player.vy || 0) * 0.06) * dt;
    }

    if (this.scarfTrail.length > 2) {
      ctx.save();
      ctx.beginPath();
      this.scarfTrail.forEach((pt, idx) => {
        const px = pt.x - cameraX - idx * dir * 2.2;
        const py = pt.y + idx * 0.7;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle =
        costumeAct === 1
          ? '#dc2626'
          : costumeAct === 2
          ? '#b45309'
          : costumeAct === 3
          ? '#cbd5e1'
          : '#ef4444';
      ctx.lineWidth = costumeAct === 1 ? 5 : 3.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    this.drawSilhouetteBody(ctx, sx, footY, costumeAct, {
      facing: dir,
      walkCycle: player.walkCycle,
      speedRatio,
      onGround: player.onGround,
      vy: player.vy || 0,
      landingSquash: player.landingSquash || 0,
      pose: player.pose,
      poseTimer: player.poseTimer || 0,
      wearingHat: player.wearingHat !== false,
    });
  }

  drawSilhouetteBody(ctx, sx, footY, act, anim) {
    const {
      facing,
      walkCycle,
      speedRatio,
      onGround,
      vy,
      landingSquash,
      pose,
      poseTimer,
      wearingHat,
    } = anim;

    const walkBob =
      onGround && speedRatio > 0.05
        ? Math.abs(Math.sin(walkCycle * 2)) * 4.0
        : Math.sin(this.time * 2.5) * 1.0;
    const squashDrop = landingSquash * 6;
    const hipY = footY - 37 - walkBob + squashDrop;

    ctx.save();
    ctx.translate(sx, hipY);
    ctx.scale(facing * (1 + landingSquash * 0.06), 1 - landingSquash * 0.08);

    const bodyColor = act === 4 ? '#172554' : '#080c13';

    // ---- ARTICULATED LEGS (Walk + Airborne Jump Tuck + Fall Stride) ----
    const stride = onGround ? (speedRatio > 0.05 ? Math.sin(walkCycle) * 0.64 : 0) : 0;
    const drawLeg = (phaseAngle, isBack) => {
      ctx.save();
      ctx.strokeStyle = isBack ? '#04060a' : bodyColor;
      ctx.lineWidth = 7.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let thighAng = phaseAngle;
      let kneeBend = Math.max(0, Math.sin(walkCycle + (isBack ? Math.PI : 0))) * 0.45;

      if (!onGround) {
        if (vy < -40) {
          // Rising jump tuck
          thighAng = isBack ? -0.35 : 0.78;
          kneeBend = isBack ? 0.55 : 0.95;
        } else {
          // Graceful falling stride
          thighAng = isBack ? -0.42 : 0.48;
          kneeBend = 0.35;
        }
      } else if (pose === 'leap_trench' || pose === 'leap_crater') {
        thighAng = isBack ? -0.58 : 0.68;
        kneeBend = 0.4;
      }

      const kneeX = Math.sin(thighAng) * 18.5;
      const kneeY = Math.cos(thighAng) * 18.5;
      const shinAng = thighAng - kneeBend;
      const fx = kneeX + Math.sin(shinAng) * 18.5;
      const fy = kneeY + Math.cos(shinAng) * 18.5;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.restore();
    };

    drawLeg(-stride, true);
    drawLeg(stride, false);

    // ---- TORSO & COSTUME ----
    let lean = speedRatio * 0.13;
    if (!onGround) lean = vy < 0 ? 0.18 : 0.08;
    if (pose === 'dash') lean = 0.4;
    else if (pose === 'bow_incense') lean = 0.28;
    else if (pose === 'shield_comrade') lean = 0.22;

    ctx.save();
    ctx.rotate(lean);

    if (act === 2) {
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-14, -43);
      ctx.stroke();
    } else if (act === 3) {
      ctx.fillStyle = '#0f241e';
      fillRoundedRect(ctx, -19, -31, 12, 23, 4);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-15, -31);
      ctx.lineTo(-21, -39);
      ctx.stroke();
    } else if (act === 4) {
      ctx.fillStyle = '#1e293b';
      fillRoundedRect(ctx, -18, -29, 11.5, 22, 4.5);
    }

    ctx.fillStyle = act === 4 ? '#f8fafc' : bodyColor;
    fillRoundedRect(ctx, -9.5, -33, 19, 34, 5.5);

    if (act === 2) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
      ctx.lineWidth = 1.3;
      for (let y = -27; y <= -8; y += 7) {
        ctx.beginPath();
        ctx.moveTo(-7.5, y);
        ctx.lineTo(7.5, y);
        ctx.stroke();
      }
    }

    // ---- HEAD & HEADGEAR ----
    ctx.fillStyle = act === 4 ? '#1e293b' : bodyColor;
    ctx.beginPath();
    ctx.arc(1, -43, 8.5, 0, Math.PI * 2);
    ctx.fill();

    if (act === 1) {
      ctx.beginPath();
      ctx.moveTo(-7, -47);
      ctx.lineTo(-13, -45);
      ctx.lineTo(-5, -52);
      ctx.closePath();
      ctx.fill();
    } else if (act === 2 && wearingHat) {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(1, -45, 12.5, Math.PI * 1.02, -0.02);
      ctx.fill();
      drawStar(ctx, 6.5, -49, 5, 3.3, 1.4, '#facc15');
    } else if (act === 3 && wearingHat) {
      ctx.fillStyle = '#0c231c';
      ctx.beginPath();
      ctx.ellipse(1, -48, 16, 4.2, -0.06, 0, Math.PI * 2);
      ctx.arc(1, -49, 9.2, Math.PI, 0);
      ctx.fill();
    } else if (act === 4) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0.5, -45.5, 8.9, Math.PI * 0.95, Math.PI * 2.08);
      ctx.fill();
    }

    // ---- ARMS & GESTURES ----
    ctx.strokeStyle = act === 4 ? '#334155' : bodyColor;
    ctx.lineWidth = 5.8;
    ctx.lineCap = 'round';

    if (pose === 'hammer') {
      const smashAngle = -1.55 + Math.sin(poseTimer * 18) * 1.3;
      ctx.save();
      ctx.translate(4, -27);
      ctx.rotate(smashAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(17, -6);
      ctx.stroke();
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(15, -6);
      ctx.lineTo(34, -17);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(28, -24, 11, 15);
      ctx.restore();
    } else if (pose === 'flag_raise' || pose === 'bunker_flag' || pose === 'tank_charge') {
      ctx.beginPath();
      ctx.moveTo(3, -27);
      ctx.lineTo(13, -46);
      ctx.stroke();
      drawWavingRedFlag(ctx, 13, -104, 56, 36, this.time, 66);
    } else if (pose === 'bow_incense') {
      ctx.beginPath();
      ctx.moveTo(4, -25);
      ctx.lineTo(17, -21);
      ctx.stroke();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(18, -21);
      ctx.lineTo(25, -36);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(25, -37, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (pose === 'handoff_give') {
      // Extending helmet forward to successor
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(24, -33);
      ctx.stroke();
      if (poseTimer < 0.55) {
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.ellipse(27, -36, 11, 4.2, -0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pose === 'handoff_receive') {
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(18, -31);
      ctx.stroke();
    } else if (pose === 'salute_farewell') {
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(14, -44);
      ctx.lineTo(6, -48);
      ctx.stroke();
    } else {
      const armSwing = !onGround
        ? -0.45
        : speedRatio > 0.05
        ? -Math.sin(walkCycle) * 0.62
        : 0.08;
      ctx.beginPath();
      ctx.moveTo(2, -27);
      ctx.lineTo(Math.sin(armSwing) * 15, -27 + Math.cos(armSwing) * 16);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  drawTerrainContourAndForeground(ctx, act, width, height, getGroundY, cameraX, palette) {
    ctx.save();

    // Continuous Sloped / Sunken Terrain Polygon matching physics 100%
    ctx.fillStyle = palette.ground;
    ctx.beginPath();
    ctx.moveTo(-60, height + 80);
    for (let sx = -60; sx <= width + 60; sx += 10) {
      const wx = sx + cameraX;
      ctx.lineTo(sx, getGroundY(wx));
    }
    ctx.lineTo(width + 60, height + 80);
    ctx.closePath();
    ctx.fill();

    // Subtle crisp top-soil rim line along the terrain contour
    ctx.strokeStyle =
      act === 4 ? 'rgba(253, 230, 138, 0.35)' : 'rgba(203, 213, 225, 0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let sx = -60; sx <= width + 60; sx += 10) {
      const gy = getGroundY(sx + cameraX);
      if (sx === -60) ctx.moveTo(sx, gy);
      else ctx.lineTo(sx, gy);
    }
    ctx.stroke();

    // Limbo-style Out-of-Focus Foreground Blades along bottom viewport edge (1.2x parallax)
    const fgOffset = cameraX * 1.2;
    ctx.fillStyle = '#020407';
    for (let sx = -40; sx <= width + 60; sx += 52) {
      const wx = sx + fgOffset;
      const bladeH = 10 + Math.abs(Math.sin(wx * 0.037)) * 15;
      const sway = Math.sin(this.time * 2.1 + wx * 0.02) * 4;
      ctx.beginPath();
      ctx.moveTo(sx - 6, height);
      ctx.quadraticCurveTo(sx + sway, height - bladeH - 8, sx + 6, height);
      ctx.fill();
    }

    ctx.restore();
  }
}

export { sampleGroundOffset };
