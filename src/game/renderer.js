import { ACTS, HANDOFF_EVENT, FINALE_EVENT } from '../data/storyData.js';

/**
 * Procedural 2D Silhouette & Multi-Layer Parallax Vector Renderer
 * Lấy cảm hứng từ nghệ thuật bóng đổ đa lớp của Limbo / Gris kết hợp sự kiện kể chuyện Genshin Impact.
 * Hoàn toàn vẽ bằng HTML5 Canvas Vector Art, không phụ thuộc ảnh PNG bên ngoài.
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(hexA, hexB, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const c1 = hexToRgb(hexA);
  const c2 = hexToRgb(hexB);
  const r = Math.round(lerp(c1.r, c2.r, clamped));
  const g = Math.round(lerp(c1.g, c2.g, clamped));
  const b = Math.round(lerp(c1.b, c2.b, clamped));
  return `rgb(${r}, ${g}, ${b})`;
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
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(poleX, poleTopY);
    ctx.lineTo(poleX, poleTopY + poleHeight);
    ctx.stroke();
  }

  // Waving cloth polygon
  const segs = 10;
  ctx.beginPath();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const x = poleX + u * width;
    const wave = Math.sin(time * 5.2 - u * 4.2) * (5 * u);
    const y = poleTopY + wave;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i--) {
    const u = i / segs;
    const x = poleX + u * width;
    const wave = Math.sin(time * 5.2 - u * 4.2) * (5 * u);
    const y = poleTopY + height + wave;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.shadowColor = 'rgba(220, 38, 38, 0.55)';
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Golden 5-pointed star in center
  const centerWave = Math.sin(time * 5.2 - 0.5 * 4.2) * 2.5;
  drawStar(
    ctx,
    poleX + width * 0.48,
    poleTopY + height * 0.5 + centerWave,
    5,
    height * 0.28,
    height * 0.12,
    '#facc15'
  );
  ctx.restore();
}

export class WorldRenderer {
  constructor() {
    this.time = 0;
    this.scarfTrail = [];
  }

  /** Tính bảng màu chuyển mượt theo tọa độ thế giới x = 0..12000 */
  computeBlendedPalette(playerX, completedQtes) {
    // Base Act interpolation across boundaries (+/- 350px crossfade zone)
    let baseIdx = Math.min(3, Math.max(0, Math.floor(playerX / 3000)));
    let p = { ...ACTS[baseIdx].palette };

    // Smooth boundary crossfade between Act i and Act i+1
    for (let b = 1; b <= 3; b++) {
      const borderX = b * 3000;
      if (playerX >= borderX - 360 && playerX <= borderX + 360) {
        const t = (playerX - (borderX - 360)) / 720;
        const leftP = ACTS[b - 1].palette;
        const rightP = ACTS[b].palette;
        p = {
          skyTop: lerpColor(leftP.skyTop, rightP.skyTop, t),
          skyMid: lerpColor(leftP.skyMid, rightP.skyMid, t),
          skyBot: lerpColor(leftP.skyBot, rightP.skyBot, t),
          farHill: lerpColor(leftP.farHill, rightP.farHill, t),
          midHill: lerpColor(leftP.midHill, rightP.midHill, t),
          nearSil: lerpColor(leftP.nearSil, rightP.nearSil, t),
          ground: lerpColor(leftP.ground, rightP.ground, t),
          accent: lerpColor(leftP.accent, rightP.accent, t),
          gold: lerpColor(leftP.gold, rightP.gold, t),
        };
      }
    }

    // Sub-zone atmospheric overrides:
    // 1. Ba Đình Independence glow (x = 2580..2980)
    if (playerX > 2550 && playerX < 3020) {
      const baDinhFactor =
        Math.sin(Math.min(1, Math.max(0, (playerX - 2550) / 470)) * Math.PI) *
        (completedQtes.has('qte_1b') ? 0.9 : 0.45);
      p.skyMid = lerpColor(p.skyMid, '#5c1916', baDinhFactor);
      p.skyBot = lerpColor(p.skyBot, '#c25927', baDinhFactor);
    }

    // 2. Trường Sơn Bombing Flare Zone (x = 7700..8420)
    if (playerX > 7700 && playerX < 8420) {
      const flareT = Math.sin(((playerX - 7700) / 720) * Math.PI) * 0.85;
      p.skyTop = lerpColor(p.skyTop, '#240b0e', flareT);
      p.skyMid = lerpColor(p.skyMid, '#691b1e', flareT);
      p.skyBot = lerpColor(p.skyBot, '#c2410c', flareT);
    }

    // 3. Mùa Xuân 1975 Sunny Saigon Climax (x = 8400..9050)
    if (playerX >= 8400 && playerX <= 9050) {
      const springT = Math.min(1, (playerX - 8400) / 420);
      p.skyTop = lerpColor(p.skyTop, '#1d4ed8', springT * 0.55);
      p.skyMid = lerpColor(p.skyMid, '#ca8a04', springT * 0.65);
      p.skyBot = lerpColor(p.skyBot, '#fde047', springT * 0.72);
    }

    return p;
  }

  render(ctx, state, vfx) {
    const {
      width,
      height,
      groundY,
      cameraX,
      cameraZoom,
      player,
      interactables,
      nearbyInteractable,
      completedQtes,
      activeQte,
      tankProgress,
      handoffGlow,
      finaleState,
      dt,
    } = state;

    this.time += dt;
    const palette = this.computeBlendedPalette(player.x, completedQtes);

    ctx.save();

    // Camera zoom & screen shake transform
    if (cameraZoom !== 1 || vfx.shakeX !== 0 || vfx.shakeY !== 0) {
      const cx = width * 0.5;
      const cy = groundY - 70;
      ctx.translate(cx + vfx.shakeX, cy + vfx.shakeY);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-cx, -cy);
    }

    // 1. Sky Gradient + Moon / Sun
    this.drawSky(ctx, width, height, groundY, player.x, palette);

    // 2. Parallax Layer 1 (0.12x): Distant Mountain Ranges & Modern Skyline
    this.drawFarHorizonLayer(ctx, width, groundY, cameraX, palette);

    // 3. Parallax Layer 2 (0.28x): Mid-Far Historical Structures, Xe đạp thồ, Metro Viaduct
    this.drawMidFarLayer(ctx, width, groundY, cameraX, palette);

    // 4. Parallax Layer 3 (0.55x): Trees, Streetlights, Torches, Red Leaflets, University Gate
    this.drawMidNearLayer(ctx, width, groundY, cameraX, palette);

    // 5. Hazards behind foreground stage (Searchlights, Bombers, Bombs)
    vfx.renderHazards(ctx, cameraX, width, groundY, activeQte);

    // 6. Layer 4 (1.0x): Ground Stage + Iconic Landmarks & Set-pieces
    this.drawStageLandmarks(
      ctx,
      width,
      height,
      groundY,
      cameraX,
      completedQtes,
      activeQte,
      tankProgress,
      handoffGlow,
      finaleState
    );

    // 7. Interactable Historical Artifacts + Golden Halo + [E] Khám phá label
    this.drawInteractables(ctx, groundY, cameraX, width, interactables, nearbyInteractable);

    // 8. Ancestral Spirits (Grandfather & Father) at Finale Monument when awakened
    if (finaleState.spiritsAlpha > 0.01) {
      this.drawAncestralSpirits(ctx, groundY, cameraX, finaleState.spiritsAlpha);
    }

    // 9. Player Character (Procedural Skeletal Silhouette + 4 Costumes + Wind Scarf)
    this.drawPlayer(ctx, groundY, cameraX, player, dt);

    // 10. Ground silhouette & Limbo-style Foreground Parallax (1.22x)
    this.drawGroundAndForeground(ctx, width, height, groundY, cameraX, palette, player.x);

    ctx.restore();

    // 11. Screen-space / World-space Foreground Particles, Shockwaves, Slow-mo Vignette & Flash
    vfx.renderForeground(ctx, cameraX, width, height);
  }

  drawSky(ctx, width, height, groundY, playerX, palette) {
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, palette.skyTop);
    grad.addColorStop(0.55, palette.skyMid);
    grad.addColorStop(1, palette.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(-80, -80, width + 160, height + 160);

    // Act 3 Moonlit Trường Sơn Moon (6000..7800)
    if (playerX > 5700 && playerX < 8100) {
      const alpha =
        playerX < 6100
          ? (playerX - 5700) / 400
          : playerX > 7600
          ? 1 - (playerX - 7600) / 500
          : 1;
      if (alpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        const mx = width * 0.76;
        const my = groundY * 0.24;
        const moonGlow = ctx.createRadialGradient(mx, my, 12, mx, my, 145);
        moonGlow.addColorStop(0, 'rgba(236, 253, 245, 0.95)');
        moonGlow.addColorStop(0.28, 'rgba(167, 243, 208, 0.32)');
        moonGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(mx, my, 145, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ecfdf5';
        ctx.beginPath();
        ctx.arc(mx, my, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Act 4 Warm Dawn Sun & God-Rays (playerX > 8800)
    if (playerX > 8750) {
      const sunAlpha = Math.min(1, (playerX - 8750) / 550);
      ctx.save();
      ctx.globalAlpha = sunAlpha;
      const sx = width * 0.72;
      const sy = groundY * 0.34;
      const sunGlow = ctx.createRadialGradient(sx, sy, 15, sx, sy, 290);
      sunGlow.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
      sunGlow.addColorStop(0.25, 'rgba(253, 224, 71, 0.45)');
      sunGlow.addColorStop(0.65, 'rgba(251, 191, 36, 0.14)');
      sunGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 290, 0, Math.PI * 2);
      ctx.fill();

      // Soft Gris-like diagonal sunbeams
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(255, 248, 220, 0.055)';
        ctx.beginPath();
        ctx.moveTo(sx - 20 + i * 35, sy);
        ctx.lineTo(sx - 260 + i * 130, groundY);
        ctx.lineTo(sx - 165 + i * 130, groundY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawFarHorizonLayer(ctx, width, groundY, cameraX, palette) {
    const parallax = 0.14;
    const offset = cameraX * parallax;

    ctx.save();
    ctx.fillStyle = palette.farHill;
    ctx.beginPath();
    ctx.moveTo(-60, groundY);

    for (let sx = -60; sx <= width + 80; sx += 28) {
      const wx = sx + offset;
      // Mountain height modulated by zone
      const karst =
        Math.sin(wx * 0.0038) * 68 +
        Math.cos(wx * 0.0085) * 36 +
        Math.sin(wx * 0.0017) * 52;
      const mountainBoost = wx > 450 && wx < 1300 ? 1.25 : 0.72;
      const y = groundY - 95 - Math.abs(karst) * mountainBoost;
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(width + 80, groundY);
    ctx.closePath();
    ctx.fill();

    // Modern Vietnam Skyline silhouettes in Act 4 (worldX > 9000)
    const cameraCenter = cameraX + width * 0.5;
    if (cameraCenter > 8750) {
      const cityAlpha = Math.min(1, (cameraCenter - 8750) / 500);
      ctx.save();
      ctx.globalAlpha = cityAlpha;
      ctx.fillStyle = palette.farHill;
      const buildings = [
        { x: 9120, w: 62, h: 175, spire: false },
        { x: 9320, w: 54, h: 225, spire: false },
        { x: 9540, w: 72, h: 315, spire: true }, // Landmark-inspired tower
        { x: 9740, w: 58, h: 195, spire: false },
        { x: 9980, w: 66, h: 255, spire: false },
        { x: 10220, w: 80, h: 210, spire: false },
        { x: 10500, w: 64, h: 285, spire: true },
        { x: 10760, w: 74, h: 220, spire: false },
        { x: 11050, w: 60, h: 190, spire: false },
      ];
      for (const b of buildings) {
        const bx = width * 0.5 + (b.x - cameraCenter) * 0.34 - b.w * 0.5;
        if (bx < -160 || bx > width + 160) continue;
        ctx.fillRect(bx, groundY - b.h, b.w, b.h);
        if (b.spire) {
          ctx.beginPath();
          ctx.moveTo(bx + b.w * 0.2, groundY - b.h);
          ctx.lineTo(bx + b.w * 0.5, groundY - b.h - 68);
          ctx.lineTo(bx + b.w * 0.8, groundY - b.h);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Soft atmospheric mist band between Far and Mid layers
    const mistGrad = ctx.createLinearGradient(0, groundY - 140, 0, groundY);
    mistGrad.addColorStop(0, 'rgba(255,255,255,0)');
    mistGrad.addColorStop(1, 'rgba(200, 215, 235, 0.09)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, groundY - 140, width, 140);
    ctx.restore();
  }

  drawMidFarLayer(ctx, width, groundY, cameraX, palette) {
    ctx.save();
    ctx.fillStyle = palette.midHill;
    const cameraCenter = cameraX + width * 0.5;

    // Rolling mid hills
    ctx.beginPath();
    ctx.moveTo(-60, groundY);
    for (let sx = -60; sx <= width + 80; sx += 24) {
      const wx = sx + cameraX * 0.32;
      const wave = Math.sin(wx * 0.0055) * 38 + Math.cos(wx * 0.012) * 18;
      ctx.lineTo(sx, groundY - 58 - Math.abs(wave));
    }
    ctx.lineTo(width + 80, groundY);
    ctx.closePath();
    ctx.fill();

    // Act 2a (3000 - 4550): Hanoi 1946 Old Quarter Rooftops in smoky distance
    if (cameraCenter > 2820 && cameraCenter < 4820) {
      const hanoiAlpha =
        cameraCenter < 3120
          ? (cameraCenter - 2820) / 300
          : cameraCenter > 4520
          ? 1 - (cameraCenter - 4520) / 300
          : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, hanoiAlpha));
      for (let houseWorldX = 3060; houseWorldX <= 4520; houseWorldX += 135) {
        const sx = width * 0.5 + (houseWorldX - cameraCenter) * 0.55 - 44;
        if (sx < -140 || sx > width + 140) continue;
        const h = 95 + ((houseWorldX * 17) % 65);
        ctx.fillStyle = palette.midHill;
        ctx.fillRect(sx, groundY - h, 88, h);
        // Gabled tiled roof
        ctx.beginPath();
        ctx.moveTo(sx - 6, groundY - h);
        ctx.lineTo(sx + 44, groundY - h - 26);
        ctx.lineTo(sx + 94, groundY - h);
        ctx.closePath();
        ctx.fill();
        // Warm fire glow in some windows
        if (houseWorldX % 270 === 0) {
          ctx.fillStyle = 'rgba(251, 146, 60, 0.38)';
          ctx.fillRect(sx + 22, groundY - h + 24, 14, 20);
          ctx.fillRect(sx + 48, groundY - h + 24, 14, 20);
        }
      }
      ctx.restore();
    }

    // Act 2b (4650 - 5350): Đoàn dân công xe đạp thồ Tây Bắc trên sườn đồi xa
    for (let i = 0; i < 4; i++) {
      const baseWx = 4720 + i * 145 + ((this.time * 18) % 145);
      const sx = baseWx - cameraX;
      if (sx < -100 || sx > width + 100) continue;
      const hillY = groundY - 76 - Math.sin(baseWx * 0.006) * 18;
      ctx.save();
      ctx.translate(sx, hillY);
      ctx.scale(0.62, 0.62);
      ctx.fillStyle = 'rgba(18, 10, 10, 0.85)';
      ctx.strokeStyle = 'rgba(18, 10, 10, 0.85)';
      ctx.lineWidth = 2.5;
      // Wheels
      ctx.beginPath();
      ctx.arc(-16, -12, 11, 0, Math.PI * 2);
      ctx.arc(16, -12, 11, 0, Math.PI * 2);
      ctx.stroke();
      // Supply packs on bike
      ctx.fillRect(-20, -36, 40, 20);
      // Person pushing
      ctx.beginPath();
      ctx.arc(-28, -42, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-33, -35, 10, 22);
      ctx.restore();
    }

    // Act 4 (9100 - 11100): Cầu vượt Metro & Tàu điện hiện đại lướt êm
    if (cameraX + width > 8900 && cameraX < 11400) {
      const bridgeTopY = groundY - 158;
      const startSx = Math.max(-80, 9020 - cameraX);
      const endSx = Math.min(width + 80, 11050 - cameraX);
      if (endSx > startSx) {
        ctx.fillStyle = 'rgba(35, 62, 88, 0.55)';
        ctx.fillRect(startSx, bridgeTopY, endSx - startSx, 12);
        for (let px = 9080; px <= 11000; px += 220) {
          const psx = px - cameraX;
          if (psx >= -40 && psx <= width + 40) {
            ctx.fillRect(psx - 9, bridgeTopY + 12, 18, groundY - bridgeTopY - 12);
          }
        }
        // Moving sleek metro train
        const trainWorldX = 9150 + ((this.time * 135) % 1750);
        const tsx = trainWorldX - cameraX;
        if (tsx > -240 && tsx < width + 120) {
          ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
          fillRoundedRect(ctx, tsx, bridgeTopY - 22, 190, 20, 8);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
          for (let w = 16; w < 170; w += 28) {
            ctx.fillRect(tsx + w, bridgeTopY - 17, 18, 8);
          }
        }
      }
    }

    ctx.restore();
  }

  drawMidNearLayer(ctx, width, groundY, cameraX, palette) {
    ctx.save();

    // Act 1 (0 - 2950): Night trees, streetlamps, red leaflets (truyền đơn đỏ) & torches (ngọn đuốc)
    if (cameraX < 3100) {
      // Bare atmospheric trees & bamboo
      for (let tx = 180; tx < 2900; tx += 290) {
        const sx = tx - cameraX * 0.78;
        if (sx < -120 || sx > width + 120) continue;
        ctx.strokeStyle = palette.nearSil;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(sx, groundY);
        ctx.quadraticCurveTo(sx - 8, groundY - 95, sx + 12, groundY - 185);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx + 2, groundY - 115);
        ctx.lineTo(sx - 38, groundY - 165);
        ctx.moveTo(sx + 6, groundY - 140);
        ctx.lineTo(sx + 48, groundY - 180);
        ctx.stroke();
      }

      // Glowing red torches along revolutionary path
      const torchPositions = [420, 880, 1520, 2080, 2560, 2860];
      for (const tx of torchPositions) {
        const sx = tx - cameraX;
        if (sx < -80 || sx > width + 80) continue;
        // Post
        ctx.fillStyle = '#090b10';
        ctx.fillRect(sx - 3, groundY - 88, 6, 88);
        // Flame halo
        const flicker = Math.sin(this.time * 11 + tx) * 4;
        const glow = ctx.createRadialGradient(sx, groundY - 96, 2, sx, groundY - 96, 54 + flicker);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        glow.addColorStop(0.35, 'rgba(239, 68, 68, 0.55)');
        glow.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, groundY - 96, 54 + flicker, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(sx - 7, groundY - 88);
        ctx.quadraticCurveTo(sx, groundY - 118 - flicker, sx + 7, groundY - 88);
        ctx.fill();
      }

      // Red leaflets (truyền đơn cách mạng) fluttering in the night wind
      for (let i = 0; i < 14; i++) {
        const baseX = 280 + i * 175;
        const lx = baseX + Math.sin(this.time * 1.4 + i) * 38 - cameraX;
        const ly = groundY - 45 - ((i * 37 + this.time * 24) % 165);
        if (lx < -40 || lx > width + 40) continue;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(Math.sin(this.time * 3 + i) * 0.55);
        ctx.fillStyle = '#dc2626';
        ctx.shadowColor = 'rgba(220, 38, 38, 0.65)';
        ctx.shadowBlur = 8;
        ctx.fillRect(-6, -4, 12, 8);
        ctx.restore();
      }
    }

    // Act 3 (6000 - 8450): Towering Trường Sơn Jungle Canopy Silhouettes
    if (cameraX + width > 5900 && cameraX < 8600) {
      for (let jx = 6020; jx <= 8420; jx += 175) {
        const sx = jx - cameraX * 0.85 - (jx - 6000) * 0.15;
        const realSx = jx - cameraX;
        if (realSx < -160 || realSx > width + 160) continue;
        const isScorched = jx > 7850;
        const treeH = 220 + ((jx * 13) % 90);
        ctx.fillStyle = palette.nearSil;
        ctx.fillRect(realSx - 12, groundY - treeH, 24, treeH);

        if (!isScorched) {
          // Lush jungle canopy crown + hanging lianas
          ctx.beginPath();
          ctx.arc(realSx, groundY - treeH, 68, 0, Math.PI * 2);
          ctx.arc(realSx - 44, groundY - treeH + 22, 48, 0, Math.PI * 2);
          ctx.arc(realSx + 44, groundY - treeH + 20, 50, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(6, 28, 36, 0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(realSx - 28, groundY - treeH + 35);
          ctx.quadraticCurveTo(
            realSx - 22 + Math.sin(this.time * 1.6 + sx) * 6,
            groundY - treeH + 95,
            realSx - 26,
            groundY - treeH + 145
          );
          ctx.stroke();
        } else {
          // Bomb-shattered branches in tọa độ lửa
          ctx.strokeStyle = palette.nearSil;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(realSx, groundY - treeH + 35);
          ctx.lineTo(realSx - 34, groundY - treeH - 12);
          ctx.moveTo(realSx, groundY - treeH + 55);
          ctx.lineTo(realSx + 30, groundY - treeH + 18);
          ctx.stroke();
        }
      }
    }

    // Act 4 (9050 - 11800): Lush Green Boulevard Trees & Modern University Gate
    if (cameraX + width > 9000) {
      // Cổng trường Đại học hiện đại (x = 9360)
      const uniX = 9360 - cameraX;
      if (uniX > -280 && uniX < width + 280) {
        ctx.save();
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(uniX - 110, groundY - 165, 22, 165);
        ctx.fillRect(uniX + 88, groundY - 165, 22, 165);
        // Sleek arch beam
        ctx.fillStyle = '#0f2942';
        ctx.beginPath();
        ctx.roundRect(uniX - 128, groundY - 188, 256, 34, 8);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.font = '600 12px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ĐẠI HỌC VIỆT NAM — TRI THỨC & TƯƠNG LAI', uniX, groundY - 167);
        ctx.restore();
      }

      // Peaceful green trees along avenue
      for (let gx = 9160; gx <= 11180; gx += 230) {
        if (Math.abs(gx - 9360) < 150 || Math.abs(gx - 9700) < 95 || Math.abs(gx - 10500) < 95) {
          continue;
        }
        const sx = gx - cameraX;
        if (sx < -100 || sx > width + 100) continue;
        ctx.fillStyle = '#1e3346';
        ctx.fillRect(sx - 5, groundY - 78, 10, 78);
        ctx.fillStyle = '#1f4e5f';
        ctx.beginPath();
        ctx.arc(sx, groundY - 96, 38, 0, Math.PI * 2);
        ctx.arc(sx - 24, groundY - 82, 26, 0, Math.PI * 2);
        ctx.arc(sx + 24, groundY - 82, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawStageLandmarks(
    ctx,
    width,
    _height,
    groundY,
    cameraX,
    completedQtes,
    activeQte,
    tankProgress,
    handoffGlow,
    finaleState
  ) {
    ctx.save();

    // ==================== 1. KHO THÓC NHẬT (x = 2300) ====================
    if (cameraX + width > 2050 && cameraX < 2620) {
      const gx = 2335 - cameraX;
      const liberated = completedQtes.has('qte_1a');

      // Warehouse structure
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(gx - 95, groundY - 165, 190, 165);
      // Roof
      ctx.beginPath();
      ctx.moveTo(gx - 112, groundY - 165);
      ctx.lineTo(gx, groundY - 215);
      ctx.lineTo(gx + 112, groundY - 165);
      ctx.closePath();
      ctx.fill();

      // Watchtower at x = 2425
      const twX = 2425 - cameraX;
      ctx.strokeStyle = '#111622';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(twX - 22, groundY);
      ctx.lineTo(twX - 12, groundY - 225);
      ctx.moveTo(twX + 22, groundY);
      ctx.lineTo(twX + 12, groundY - 225);
      ctx.stroke();
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(twX - 24, groundY - 245, 48, 22);

      // Granary doors (closed vs burst open with glowing golden rice mound!)
      if (liberated) {
        const riceGlow = ctx.createRadialGradient(gx, groundY - 40, 10, gx, groundY - 40, 110);
        riceGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        riceGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
        riceGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = riceGlow;
        ctx.beginPath();
        ctx.arc(gx, groundY - 45, 110, 0, Math.PI * 2);
        ctx.fill();

        // Mound of golden rice
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(gx - 68, groundY);
        ctx.quadraticCurveTo(gx, groundY - 92, gx + 68, groundY);
        ctx.fill();
      } else {
        // Heavy locked wooden gate + iron bars
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(gx - 46, groundY - 110, 92, 110);
        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 4;
        ctx.strokeRect(gx - 46, groundY - 110, 92, 110);
        ctx.beginPath();
        ctx.moveTo(gx, groundY - 110);
        ctx.lineTo(gx, groundY);
        ctx.stroke();
      }
    }

    // ==================== 2. QUẢNG TRƯỜNG BA ĐÌNH (x = 2750) ====================
    if (cameraX + width > 2520 && cameraX < 3060) {
      const bx = 2790 - cameraX;
      const won1B = completedQtes.has('qte_1b');

      // Ba Dinh Tribune silhouette
      ctx.fillStyle = '#11131a';
      ctx.fillRect(bx - 120, groundY - 145, 240, 145);
      ctx.fillRect(bx - 65, groundY - 185, 130, 40);

      // Tall red banners on tribune columns
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(bx - 92, groundY - 132, 18, 95);
      ctx.fillRect(bx + 74, groundY - 132, 18, 95);

      // Flag atop Ba Dinh Tribune
      drawWavingRedFlag(ctx, bx, groundY - 260, 74, 46, this.time, 75);

      // Crowd of cheering patriots silhouettes
      for (let i = -5; i <= 5; i++) {
        if (i === 0 || i === -1) continue;
        const cx = bx + i * 38;
        const cheerBob = won1B ? Math.abs(Math.sin(this.time * 7 + i)) * 9 : 0;
        ctx.fillStyle = 'rgba(10, 10, 14, 0.92)';
        ctx.beginPath();
        ctx.arc(cx, groundY - 56 - cheerBob, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 8, groundY - 46 - cheerBob, 16, 46 + cheerBob);
        if (won1B || i % 2 === 0) {
          drawWavingRedFlag(ctx, cx + 6, groundY - 94 - cheerBob, 26, 16, this.time + i, 44);
        }
      }
    }

    // ==================== 3. CHIẾN LŨY HÀ NỘI 1946 (x = 4200) ====================
    if (cameraX + width > 3950 && cameraX < 4480) {
      const lx = 4255 - cameraX;
      ctx.fillStyle = '#140c0c';
      // Stacked sandbags & wooden barricade furniture
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4 - r; c++) {
          ctx.beginPath();
          ctx.roundRect(lx - 65 + c * 36 + r * 16, groundY - 18 - r * 17, 34, 16, 6);
          ctx.fill();
        }
      }
      drawWavingRedFlag(ctx, lx + 12, groundY - 148, 48, 30, this.time, 82);
    }

    // ==================== 4. GIAO THÔNG HÀO & HẦM ĐỜ CÁTƠRI (x = 5350 & 5750) ====================
    if (cameraX + width > 5150 && cameraX < 6020) {
      // Trench gap visual at x = 5350
      const trenchX = 5350 - cameraX;
      ctx.fillStyle = '#291512';
      ctx.fillRect(trenchX - 52, groundY - 18, 22, 18);
      ctx.fillRect(trenchX + 30, groundY - 18, 22, 18);

      // Barbed wire X-frames (hàng rào dây thép gai Mường Thanh)
      for (const wx of [5230, 5560, 5650]) {
        const sx = wx - cameraX;
        ctx.strokeStyle = '#1c1412';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx - 15, groundY);
        ctx.lineTo(sx + 15, groundY - 34);
        ctx.moveTo(sx + 15, groundY);
        ctx.lineTo(sx - 15, groundY - 34);
        ctx.stroke();
      }

      // Hầm tướng Đờ Cátơri (x = 5780)
      const bkX = 5785 - cameraX;
      const won2B = completedQtes.has('qte_2b');

      // Curved corrugated iron bunker dome + sandbags
      ctx.fillStyle = '#1a1210';
      ctx.beginPath();
      ctx.arc(bkX, groundY, 108, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = '#3f2e26';
      ctx.lineWidth = 3;
      for (let a = Math.PI + 0.25; a < Math.PI * 2 - 0.25; a += 0.24) {
        ctx.beginPath();
        ctx.moveTo(bkX + Math.cos(a) * 92, groundY + Math.sin(a) * 92);
        ctx.lineTo(bkX + Math.cos(a) * 108, groundY + Math.sin(a) * 108);
        ctx.stroke();
      }

      if (won2B) {
        // Lá cờ Quyết chiến Quyết thắng tung bay trên nóc hầm Đờ Cátơri!
        const g = ctx.createRadialGradient(bkX, groundY - 145, 8, bkX, groundY - 145, 130);
        g.addColorStop(0, 'rgba(253, 224, 71, 0.65)');
        g.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bkX, groundY - 145, 130, 0, Math.PI * 2);
        ctx.fill();

        drawWavingRedFlag(ctx, bkX, groundY - 198, 76, 48, this.time, 94);
      }
    }

    // ==================== 5. NGƯỜI ÔNG TRAO MŨ CHO NGƯỜI CHA (x = 6100) ====================
    if (cameraX + width > 5940 && cameraX < 6380) {
      const hx = HANDOFF_EVENT.x - cameraX;

      // Warm golden memory halo around Grandfather silhouette
      const aura = ctx.createRadialGradient(
        hx,
        groundY - 62,
        8,
        hx,
        groundY - 62,
        95 + handoffGlow * 45
      );
      aura.addColorStop(0, `rgba(253, 224, 71, ${0.38 + handoffGlow * 0.35})`);
      aura.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(hx, groundY - 62, 130, 0, Math.PI * 2);
      ctx.fill();

      // Grandfather (Vệ quốc đoàn) standing proudly extending helmet/blessing
      this.drawGrandfatherHandoffFigure(ctx, hx, groundY, handoffGlow);
    }

    // ==================== 6. HỐ BOM & ĐỒNG ĐỘI TRƯỜNG SƠN (x = 8100) ====================
    if (cameraX + width > 7920 && cameraX < 8320) {
      const craterX = 8085 - cameraX;
      // Glowing bomb crater
      const cGrad = ctx.createRadialGradient(craterX, groundY, 4, craterX, groundY, 55);
      cGrad.addColorStop(0, 'rgba(251, 146, 60, 0.9)');
      cGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(craterX, groundY, 52, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Comrade silhouette standing ready to brace with player at x = 8145
      const comX = 8148 - cameraX;
      ctx.fillStyle = '#071318';
      ctx.beginPath();
      ctx.arc(comX, groundY - 64, 9, 0, Math.PI * 2);
      ctx.fill();
      // Mũ tai bèo on comrade
      ctx.beginPath();
      ctx.ellipse(comX, groundY - 69, 16, 4.5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(comX - 9, groundY - 54, 18, 54);
    }

    // ==================== 7. XE TĂNG 390 & DINH ĐỘC LẬP (x = 8650) ====================
    if (cameraX + width > 8380 && cameraX < 9050) {
      const gateX = 8735 - cameraX;
      const palaceX = 8835 - cameraX;
      const won3B = completedQtes.has('qte_3b');

      // Dinh Độc Lập iconic modernist facade in background
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(palaceX - 150, groundY - 195, 300, 195);
      ctx.fillRect(palaceX - 75, groundY - 235, 150, 40);
      // Iconic vertical louvers
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.26)';
      ctx.lineWidth = 2;
      for (let lx = -135; lx <= 135; lx += 14) {
        ctx.beginPath();
        ctx.moveTo(palaceX + lx, groundY - 180);
        ctx.lineTo(palaceX + lx, groundY - 50);
        ctx.stroke();
      }
      if (won3B) {
        // Cờ Giải phóng tung bay trên nóc Dinh Độc Lập!
        drawWavingRedFlag(ctx, palaceX, groundY - 305, 76, 46, this.time, 72);
      }

      // Main Iron Gate Pillars of Dinh Độc Lập
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(gateX - 14, groundY - 148, 22, 148);

      ctx.save();
      ctx.translate(gateX, groundY);
      if (won3B) {
        // Gate smashed flat/tilted open on ground!
        ctx.rotate(1.28);
      } else if (activeQte && activeQte.id === 'qte_3b') {
        ctx.rotate(tankProgress * 0.45);
      }
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(-4, -132, 48, 132);
      for (let b = 6; b < 44; b += 9) {
        ctx.beginPath();
        ctx.moveTo(b, -132);
        ctx.lineTo(b, 0);
        ctx.stroke();
      }
      ctx.restore();

      // Xe tăng 390 tiến lên!
      const tankWorldX = won3B
        ? 8775
        : 8565 + tankProgress * 165;
      this.drawTank390(ctx, tankWorldX - cameraX, groundY);
    }

    // ==================== 8. ĐÀI TƯỞNG NIỆM TỔ QUỐC GHI CÔNG (x = 11400) ====================
    if (cameraX + width > 11050) {
      const mx = FINALE_EVENT.x - cameraX;

      // Sacred sun-gold halo behind Monument
      const halo = ctx.createRadialGradient(mx, groundY - 150, 18, mx, groundY - 150, 260);
      halo.addColorStop(0, 'rgba(254, 240, 138, 0.62)');
      halo.addColorStop(0.55, 'rgba(251, 191, 36, 0.18)');
      halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(mx, groundY - 150, 260, 0, Math.PI * 2);
      ctx.fill();

      // Stepped stone pedestal
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(mx - 145, groundY - 18, 290, 18);
      ctx.fillRect(mx - 110, groundY - 36, 220, 18);
      ctx.fillRect(mx - 76, groundY - 54, 152, 18);

      // Towering Monument Obelisk ("Đài tưởng niệm Tổ quốc ghi công")
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(mx - 44, groundY - 54);
      ctx.lineTo(mx - 28, groundY - 295);
      ctx.lineTo(mx, groundY - 332);
      ctx.lineTo(mx + 28, groundY - 295);
      ctx.lineTo(mx + 44, groundY - 54);
      ctx.closePath();
      ctx.fill();

      // Golden border trim & Star & Vertical inscription
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx - 18, groundY - 245, 36, 165);
      drawStar(ctx, mx, groundY - 275, 5, 16, 7, '#facc15');

      ctx.fillStyle = '#fde68a';
      ctx.font = '700 11px "Playfair Display", serif';
      ctx.textAlign = 'center';
      const words = ['TỔ', 'QUỐC', 'GHI', 'CÔNG'];
      words.forEach((w, idx) => {
        ctx.fillText(w, mx, groundY - 215 + idx * 34);
      });

      // Traditional bronze incense altar (Bàn thờ & Lư hương) in front at mx - 58
      const altarX = mx - 62;
      ctx.fillStyle = '#292524';
      ctx.fillRect(altarX - 24, groundY - 68, 48, 32);
      // Bronze censer (lư hương)
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(altarX, groundY - 76, 13, 0, Math.PI * 2);
      ctx.fill();

      // Glowing lit incense sticks once held or completed
      if (finaleState.holdProgress > 0.05 || finaleState.completed) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        for (let s = -4; s <= 4; s += 4) {
          ctx.beginPath();
          ctx.moveTo(altarX + s, groundY - 86);
          ctx.lineTo(altarX + s, groundY - 104);
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(altarX + s, groundY - 105, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  drawGrandfatherHandoffFigure(ctx, sx, groundY, glow) {
    ctx.save();
    ctx.translate(sx, groundY);
    ctx.fillStyle = '#09151d';
    ctx.strokeStyle = '#fde68a';

    // Legs
    ctx.fillRect(-9, -36, 7, 36);
    ctx.fillRect(2, -36, 7, 36);
    // Quilted vest (áo trấn thủ)
    ctx.beginPath();
    ctx.roundRect(-12, -70, 24, 36, 5);
    ctx.fill();
    // Head + Mũ nan
    ctx.beginPath();
    ctx.arc(0, -80, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -83, 13, Math.PI, 0);
    ctx.fill();
    drawStar(ctx, 4, -87, 5, 3.5, 1.5, '#ef4444');

    // Outstretched arm offering helmet / salute
    const armLift = glow * 8;
    ctx.strokeStyle = '#09151d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, -64);
    ctx.lineTo(28, -68 - armLift);
    ctx.stroke();

    // Glowing symbolic mũ tai bèo / flame of resolve when handoff active
    if (glow > 0.05) {
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(32, -72 - armLift, 12, 5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  drawTank390(ctx, sx, groundY) {
    ctx.save();
    ctx.translate(sx, groundY);

    // Tracks
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-78, -28, 156, 28, 13);
    ctx.fill();

    // Road wheels
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    for (let w = -58; w <= 58; w += 29) {
      ctx.beginPath();
      ctx.arc(w, -13, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hull
    ctx.fillStyle = '#14332b';
    ctx.beginPath();
    ctx.moveTo(-84, -26);
    ctx.lineTo(-66, -46);
    ctx.lineTo(68, -46);
    ctx.lineTo(86, -26);
    ctx.closePath();
    ctx.fill();

    // Turret
    ctx.fillStyle = '#193f35';
    ctx.beginPath();
    ctx.arc(-4, -46, 34, Math.PI, 0);
    ctx.fill();

    // Main cannon barrel pointing forward
    ctx.strokeStyle = '#14332b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(24, -58);
    ctx.lineTo(112, -63);
    ctx.stroke();

    // Iconic number "390" & Red Star on turret
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 13px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('390', -8, -53);
    drawStar(ctx, 15, -58, 5, 6, 2.5, '#facc15');

    // Fluttering Liberation Flag on tank antenna
    drawWavingRedFlag(ctx, -18, -118, 44, 28, this.time, 42);

    ctx.restore();
  }

  /** Vẽ hai bóng hình phát sáng của Người Ông (1946) và Người Cha (1975) mỉm cười đứng sau Người Cháu */
  drawAncestralSpirits(ctx, groundY, cameraX, alpha) {
    const spirits = [
      {
        worldX: FINALE_EVENT.x - 165,
        label: 'Người Ông (1946)',
        hat: 'mu_nan',
      },
      {
        worldX: FINALE_EVENT.x - 122,
        label: 'Người Cha (1975)',
        hat: 'tai_beo',
      },
    ];

    for (const sp of spirits) {
      const sx = sp.worldX - cameraX;
      ctx.save();
      ctx.translate(sx, groundY);
      ctx.globalAlpha = Math.min(1, alpha);

      // Radiant warm golden aura
      const glow = ctx.createRadialGradient(0, -52, 6, 0, -52, 68);
      glow.addColorStop(0, 'rgba(254, 249, 195, 0.92)');
      glow.addColorStop(0.45, 'rgba(253, 224, 71, 0.42)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -52, 68, 0, Math.PI * 2);
      ctx.fill();

      // Luminous golden-ivory silhouette body
      ctx.fillStyle = 'rgba(254, 249, 195, 0.92)';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 18;

      // Legs & torso
      ctx.fillRect(-9, -38, 7.5, 38);
      ctx.fillRect(1.5, -38, 7.5, 38);
      ctx.beginPath();
      ctx.roundRect(-12, -74, 24, 38, 6);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, -85, 9, 0, Math.PI * 2);
      ctx.fill();

      // Distinct historical headgear
      if (sp.hat === 'mu_nan') {
        ctx.beginPath();
        ctx.arc(0, -88, 13.5, Math.PI, 0);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, -91, 16, 4.5, -0.05, 0, Math.PI * 2);
        ctx.arc(0, -92, 9.5, Math.PI, 0);
        ctx.fill();
      }

      // Warm proud smile facing Người Cháu on the right
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(3.5, -83.5, 3.2, 0.15, Math.PI * 0.85);
      ctx.stroke();
      // Gentle closed smiling eye
      ctx.beginPath();
      ctx.arc(4, -87, 1.8, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      ctx.restore();
    }
  }

  /** Vẽ toàn bộ vật phẩm tương tác [E] bằng icon Vector riêng biệt + hào quang vàng + nhãn [E] Khám phá */
  drawInteractables(ctx, groundY, cameraX, width, interactables, nearbyInteractable) {
    for (const item of interactables) {
      const sx = item.x - cameraX;
      if (sx < -140 || sx > width + 140) continue;

      const isNear = nearbyInteractable && nearbyInteractable.id === item.id;
      const pulse = 0.8 + Math.sin(this.time * 3.8 + item.x) * 0.2;

      ctx.save();
      ctx.translate(sx, groundY);

      // Soft golden halo
      const haloRadius = isNear ? 76 : 56;
      const halo = ctx.createRadialGradient(0, -38, 4, 0, -38, haloRadius);
      halo.addColorStop(0, `rgba(253, 224, 71, ${(isNear ? 0.52 : 0.3) * pulse})`);
      halo.addColorStop(0.55, `rgba(245, 158, 11, ${(isNear ? 0.24 : 0.12) * pulse})`);
      halo.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -38, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // Custom bespoke Vector Illustration per historical artifact
      this.drawArtifactVector(ctx, item.iconType);

      // Floating diamond star above artifact
      const floatY = -78 + Math.sin(this.time * 3.2 + item.x * 0.01) * 5;
      ctx.fillStyle = item.visited ? '#86efac' : '#fde047';
      ctx.beginPath();
      ctx.moveTo(0, floatY - 7);
      ctx.lineTo(5, floatY);
      ctx.lineTo(0, floatY + 7);
      ctx.lineTo(-5, floatY);
      ctx.closePath();
      ctx.fill();

      // Label "[E] Khám phá"
      const badgeScale = isNear ? 1.08 : 0.92;
      const badgeAlpha = isNear ? 1.0 : 0.72;
      ctx.save();
      ctx.translate(0, floatY - 26);
      ctx.scale(badgeScale, badgeScale);
      ctx.globalAlpha = badgeAlpha;

      const labelText = item.visited ? '[E] Xem lại' : '[E] Khám phá';
      ctx.font = '600 12.5px "Be Vietnam Pro", sans-serif';
      const textW = ctx.measureText(labelText).width;
      const pillW = textW + 24;
      const pillH = 26;

      ctx.fillStyle = isNear ? 'rgba(20, 16, 12, 0.92)' : 'rgba(15, 23, 42, 0.78)';
      ctx.strokeStyle = isNear ? '#fde047' : 'rgba(253, 224, 71, 0.55)';
      ctx.lineWidth = isNear ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isNear ? '#fef08a' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, 0, 1);
      ctx.restore();

      ctx.restore();
    }
  }

  drawArtifactVector(ctx, iconType) {
    ctx.save();
    ctx.strokeStyle = '#fde68a';
    ctx.fillStyle = '#1c1917';
    ctx.lineWidth = 2;

    switch (iconType) {
      case 'manifesto_table': {
        // Wooden table + glowing oil lamp + Manifesto scroll (3/2/1930)
        ctx.fillRect(-30, -34, 60, 6);
        ctx.fillRect(-24, -28, 6, 28);
        ctx.fillRect(18, -28, 6, 28);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-18, -40, 22, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(14, -43, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'viet_minh_flag': {
        // Stone table & glowing Viet Minh Flag (5/1941)
        ctx.fillRect(-22, -22, 44, 22);
        drawWavingRedFlag(ctx, -4, -68, 36, 22, this.time, 48);
        break;
      }
      case 'ox_cart_granary': {
        // Wooden ox-cart (Chiếc xe bò)
        ctx.fillRect(-28, -28, 52, 10);
        ctx.beginPath();
        ctx.arc(-6, -16, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(24, -22);
        ctx.lineTo(44, -32);
        ctx.stroke();
        break;
      }
      case 'rice_jar_blackboard': {
        // Hũ gạo tiết kiệm & Bảng đen Bình dân học vụ
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(-18, -16, 13, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Blackboard on easel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, -52, 34, 26);
        ctx.strokeRect(2, -52, 34, 26);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 10px sans-serif';
        ctx.fillText('i - t', 9, -35);
        break;
      }
      case 'barricade_speaker': {
        // Chiếc loa truyền thanh trên chiến lũy Hà Nội
        ctx.fillRect(-4, -56, 6, 56);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(24, -62);
        ctx.lineTo(24, -38);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'pack_bike_map': {
        // Xe đạp thồ & Sơ đồ tác chiến Điện Biên Phủ
        ctx.beginPath();
        ctx.arc(-18, -14, 12, 0, Math.PI * 2);
        ctx.arc(14, -14, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#a16207';
        ctx.fillRect(-20, -38, 34, 18);
        ctx.strokeRect(-20, -38, 34, 18);
        break;
      }
      case 'campfire_letter': {
        // Bếp lửa Trường Sơn & Bức thư nhà
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.quadraticCurveTo(-4, -34 - Math.sin(this.time * 9) * 5, 6, -4);
        ctx.fill();
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(10, -24, 18, 13);
        ctx.strokeRect(10, -24, 18, 13);
        break;
      }
      case 'radio_milestone': {
        // Cột mốc Trường Sơn & Radio bán dẫn
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(-24, -42, 22, 42, [10, 10, 0, 0]);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-24, -42, 22, 10);
        // Radio
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, -22, 22, 16);
        ctx.strokeRect(4, -22, 22, 16);
        ctx.beginPath();
        ctx.moveTo(22, -22);
        ctx.lineTo(28, -44);
        ctx.stroke();
        break;
      }
      case 'history_board': {
        // Bảng tin lịch sử Đổi mới 1986
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(-28, -56, 56, 34);
        ctx.strokeRect(-28, -56, 56, 34);
        ctx.fillRect(-22, -22, 5, 22);
        ctx.fillRect(17, -22, 5, 22);
        drawStar(ctx, 0, -39, 5, 8, 3.5, '#fde047');
        break;
      }
      case 'modern_emblem': {
        // Biểu tượng Công nghiệp hóa - Hiện đại hóa - Hội nhập
        ctx.strokeStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -34, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -34, 26, 9, 0.5, 0, Math.PI * 2);
        ctx.ellipse(0, -34, 26, 9, -0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(-10, -14, 20, 14);
        break;
      }
    }
    ctx.restore();
  }

  /**
   * Vẽ nhân vật chính với chuyển động khớp xương mượt mà, khăn/áo bay theo gió,
   * tự động đổi 4 trang phục lịch sử qua 4 Màn.
   */
  drawPlayer(ctx, groundY, cameraX, player, dt) {
    const sx = player.x - cameraX;
    const act = Math.min(4, Math.max(1, Math.floor(player.x / 3000) + 1));
    const speedRatio = Math.min(1, Math.abs(player.vx) / player.maxSpeed);
    const dir = player.facing || 1;
    const pose = player.pose; // null | 'dash' | 'hammer' | 'flag_raise' | 'leap_trench' | 'bunker_flag' | 'leap_crater' | 'shield_comrade' | 'tank_charge' | 'bow_incense'

    // Jump / Leap arc offset during action poses
    let jumpY = 0;
    if (pose === 'leap_trench' || pose === 'leap_crater') {
      jumpY = -Math.sin(Math.min(1, player.poseTimer * 1.4) * Math.PI) * 58;
    } else if (pose === 'bunker_flag') {
      jumpY = -88; // Standing high on De Castries bunker!
    }

    const baseY = groundY + jumpY;
    const walkBob = speedRatio > 0.05 ? Math.abs(Math.sin(player.walkCycle * 2)) * 4.5 : Math.sin(this.time * 2.6) * 1.2;
    const hipY = baseY - 38 - walkBob;

    // Update flowing scarf/ribbon trail in world space
    const shoulderWorldX = player.x - dir * 5;
    const shoulderWorldY = hipY - 28;
    this.scarfTrail.unshift({ x: shoulderWorldX, y: shoulderWorldY });
    if (this.scarfTrail.length > 10) this.scarfTrail.pop();
    for (let i = 1; i < this.scarfTrail.length; i++) {
      this.scarfTrail[i].x -= dir * dt * 55;
      this.scarfTrail[i].y += Math.sin(this.time * 9 + i * 0.8) * dt * 28;
    }

    ctx.save();

    // Subtle rim-light halo so silhouette always stands out crisply against dark backgrounds
    const rim = ctx.createRadialGradient(sx, hipY - 12, 4, sx, hipY - 12, 54);
    rim.addColorStop(0, act === 4 ? 'rgba(255, 251, 235, 0.35)' : 'rgba(253, 224, 71, 0.22)');
    rim.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(sx, hipY - 12, 54, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Scarf / Khăn quàng đỏ (Act 1), Khăn rằn (Act 3), Dải ruy-băng ba lô (Act 4)
    if (this.scarfTrail.length > 2) {
      ctx.save();
      ctx.beginPath();
      this.scarfTrail.forEach((pt, idx) => {
        const px = pt.x - cameraX - idx * dir * 2.4;
        const py = pt.y + idx * 0.8;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle =
        act === 1
          ? '#dc2626'
          : act === 2
          ? '#b45309'
          : act === 3
          ? '#e2e8f0'
          : '#ef4444';
      ctx.lineWidth = act === 1 ? 5.5 : 4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    ctx.translate(sx, hipY);
    ctx.scale(dir, 1);

    // Torso lean angle
    let lean = speedRatio * 0.14;
    if (pose === 'dash') lean = 0.42;
    else if (pose === 'bow_incense') lean = 0.28;
    else if (pose === 'shield_comrade') lean = 0.22;

    const bodyColor = act === 4 ? '#172554' : '#090d14';
    const trimColor =
      act === 1 ? '#dc2626' : act === 2 ? '#d97706' : act === 3 ? '#34d399' : '#f8fafc';

    // ---- LEGS (Articulated thigh + shin) ----
    const stride = speedRatio > 0.05 ? Math.sin(player.walkCycle) * 0.65 : 0;
    const drawLeg = (phaseAngle, isBack) => {
      ctx.save();
      ctx.strokeStyle = isBack ? '#05070b' : bodyColor;
      ctx.lineWidth = 7.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const thighAng = pose === 'leap_trench' || pose === 'leap_crater' ? (isBack ? -0.6 : 0.65) : phaseAngle;
      const kneeX = Math.sin(thighAng) * 19;
      const kneeY = Math.cos(thighAng) * 19;
      const shinAng = thighAng - Math.max(0, Math.sin(player.walkCycle + (isBack ? Math.PI : 0))) * 0.45;
      const footX = kneeX + Math.sin(shinAng) * 19;
      const footY = kneeY + Math.cos(shinAng) * 19;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
      ctx.restore();
    };

    drawLeg(-stride, true);
    drawLeg(stride, false);

    // ---- TORSO, BACKPACK & COSTUME ----
    ctx.save();
    ctx.rotate(lean);

    // Backpack per Act:
    // Act 2: Rifle slung on back; Act 3: Ba lô con cóc + lá ngụy trang; Act 4: Ba lô sinh viên
    if (act === 2) {
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-15, -44);
      ctx.stroke();
    } else if (act === 3) {
      ctx.fillStyle = '#112620';
      ctx.beginPath();
      ctx.roundRect(-20, -32, 13, 24, 4);
      ctx.fill();
      // Camouflage leaf twig on backpack
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-16, -32);
      ctx.lineTo(-22, -40);
      ctx.stroke();
    } else if (act === 4) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-19, -30, 12, 23, 5);
      ctx.fill();
    }

    // Main Torso
    ctx.fillStyle = act === 4 ? '#f8fafc' : bodyColor;
    ctx.beginPath();
    ctx.roundRect(-10, -34, 20, 35, 6);
    ctx.fill();

    // Act 2 Áo trấn thủ horizontal quilted lines & strap
    if (act === 2) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)';
      ctx.lineWidth = 1.4;
      for (let y = -28; y <= -8; y += 7) {
        ctx.beginPath();
        ctx.moveTo(-8, y);
        ctx.lineTo(8, y);
        ctx.stroke();
      }
    }

    // ---- HEAD & ICONIC HEADGEAR ----
    ctx.fillStyle = act === 4 ? '#1e293b' : bodyColor;
    ctx.beginPath();
    ctx.arc(1, -44, 8.8, 0, Math.PI * 2);
    ctx.fill();

    if (act === 1) {
      // Youthful windswept hair
      ctx.beginPath();
      ctx.moveTo(-7, -48);
      ctx.lineTo(-14, -46);
      ctx.lineTo(-5, -53);
      ctx.closePath();
      ctx.fill();
    } else if (act === 2) {
      // Mũ nan Vệ quốc đoàn + Sao vàng nền đỏ
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(1, -46, 13, Math.PI * 1.02, -0.02);
      ctx.fill();
      drawStar(ctx, 7, -50, 5, 3.6, 1.5, '#facc15');
    } else if (act === 3) {
      // Mũ tai bèo Quân Giải phóng
      ctx.fillStyle = '#0d261f';
      ctx.beginPath();
      ctx.ellipse(1, -49, 16.5, 4.5, -0.06, 0, Math.PI * 2);
      ctx.arc(1, -50, 9.5, Math.PI, 0);
      ctx.fill();
    } else if (act === 4) {
      // Sinh viên hiện đại: neat youthful hair silhouette
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0.5, -46.5, 9.2, Math.PI * 0.95, Math.PI * 2.08);
      ctx.fill();
    }

    // ---- ARMS & ACTION PROPS ----
    const armSwing = speedRatio > 0.05 ? -Math.sin(player.walkCycle) * 0.65 : 0.08;
    ctx.strokeStyle = act === 4 ? '#334155' : bodyColor;
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';

    if (pose === 'hammer') {
      const smashAngle = -1.6 + Math.sin(player.poseTimer * 18) * 1.35;
      ctx.save();
      ctx.translate(4, -28);
      ctx.rotate(smashAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(18, -6);
      ctx.stroke();
      // Heavy iron hammer
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(36, -18);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(30, -26, 12, 16);
      ctx.restore();
    } else if (pose === 'flag_raise' || pose === 'bunker_flag' || pose === 'tank_charge') {
      ctx.beginPath();
      ctx.moveTo(3, -28);
      ctx.lineTo(14, -48);
      ctx.stroke();
      drawWavingRedFlag(ctx, 14, -108, 60, 38, this.time, 70);
    } else if (pose === 'bow_incense') {
      ctx.beginPath();
      ctx.moveTo(4, -26);
      ctx.lineTo(18, -22);
      ctx.stroke();
      // Glowing incense stick in clasped hands
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(19, -22);
      ctx.lineTo(27, -38);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(27, -39, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const handX = Math.sin(armSwing) * 16;
      const handY = -28 + Math.cos(armSwing) * 17;
      ctx.beginPath();
      ctx.moveTo(2, -28);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      // Accent wristband / collar highlight
      ctx.fillStyle = trimColor;
      ctx.beginPath();
      ctx.arc(handX, handY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  drawGroundAndForeground(ctx, width, height, groundY, cameraX, palette, playerX) {
    ctx.save();

    // Solid ground floor
    ctx.fillStyle = palette.ground;
    ctx.fillRect(-80, groundY, width + 160, height - groundY + 120);

    // Subtle glowing horizon rim line on ground surface
    const rimGrad = ctx.createLinearGradient(0, groundY - 2, 0, groundY + 8);
    rimGrad.addColorStop(
      0,
      playerX >= 9000 ? 'rgba(253, 230, 138, 0.45)' : 'rgba(255, 255, 255, 0.14)'
    );
    rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, groundY - 1, width, 9);

    // Limbo-style Foreground Parallax Silhouettes (1.24x speed) at bottom screen edge
    const fgOffset = cameraX * 1.24;
    ctx.fillStyle = '#030508';
    for (let sx = -60; sx <= width + 80; sx += 46) {
      const wx = sx + fgOffset;
      const tuftH = 12 + Math.abs(Math.sin(wx * 0.04)) * 18;
      const sway = Math.sin(this.time * 2.4 + wx * 0.02) * 5;
      ctx.beginPath();
      ctx.moveTo(sx - 8, height);
      ctx.quadraticCurveTo(sx + sway, height - tuftH - 12, sx + 8, height);
      ctx.fill();
    }

    ctx.restore();
  }
}
