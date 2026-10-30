/**
 * Module Đồ họa Vector & Silhouette Chi tiết Cao (src/game/artAssets.js)
 * Phong cách Nghệ thuật Silhouette đa lớp kết hợp Rim-lighting (viền sáng ngược)
 * và chi tiết kiến trúc - khí tài lịch sử Việt Nam sắc nét ở tốc độ 60fps.
 */

export function fillRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const rad = Math.min(typeof r === 'number' ? r : 4, w * 0.5, h * 0.5);
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  ctx.fill();
}

export function drawStar(ctx, cx, cy, spikes, outerR, innerR, fillStyle) {
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

/**
 * Vẽ Cờ Đỏ Sao Vàng hoặc Cờ Mặt trận Dân tộc Giải phóng miền Nam (nửa đỏ nửa xanh)
 */
export function drawWavingFlag(
  ctx,
  poleX,
  poleTopY,
  width,
  height,
  time,
  poleHeight = 0,
  variant = 'national'
) {
  ctx.save();
  if (poleHeight > 0) {
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(poleX, poleTopY);
    ctx.lineTo(poleX, poleTopY + poleHeight);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(poleX, poleTopY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const segs = 12;
  const buildBandPath = (yStartFrac, yEndFrac) => {
    ctx.beginPath();
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = poleX + u * width;
      const wave = Math.sin(time * 5.2 - u * 4.4) * (4.8 * u);
      const y = poleTopY + height * yStartFrac + wave;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = segs; i >= 0; i--) {
      const u = i / segs;
      const x = poleX + u * width;
      const wave = Math.sin(time * 5.2 - u * 4.4) * (4.8 * u);
      ctx.lineTo(x, poleTopY + height * yEndFrac + wave);
    }
    ctx.closePath();
  };

  if (variant === 'liberation') {
    // Cờ Mặt trận Dân tộc Giải phóng miền Nam: Nửa trên Đỏ, nửa dưới Xanh hòa bình
    buildBandPath(0, 0.52);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    buildBandPath(0.49, 1.0);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
  } else {
    buildBandPath(0, 1.0);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
  }

  const centerWave = Math.sin(time * 5.2 - 2.2) * 2.4;
  drawStar(
    ctx,
    poleX + width * 0.48,
    poleTopY + height * 0.5 + centerWave,
    5,
    height * 0.28,
    height * 0.115,
    '#facc15'
  );
  ctx.restore();
}

/** Vẽ bụi tre làng Việt Nam mềm mại bằng đường cong Bezier & cụm lá tre sắc nét */
export function drawBambooCluster(ctx, baseX, baseY, scale, windTime, color, rimColor = null) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';

  const stalks = [
    { dx: -15, h: 178, bend: -30, w: 3.8 },
    { dx: -4, h: 210, bend: -16, w: 4.4 },
    { dx: 6, h: 194, bend: 24, w: 4.0 },
    { dx: 16, h: 158, bend: 38, w: 3.2 },
    { dx: -24, h: 138, bend: -44, w: 2.9 },
  ];

  stalks.forEach((st, idx) => {
    const sway = Math.sin(windTime * 1.6 + idx * 0.9) * 7;
    const tipX = st.dx + st.bend + sway;
    const tipY = -st.h;

    ctx.strokeStyle = color;
    ctx.lineWidth = st.w;
    ctx.beginPath();
    ctx.moveTo(st.dx, 0);
    ctx.quadraticCurveTo(st.dx + st.bend * 0.35, -st.h * 0.55, tipX, tipY);
    ctx.stroke();

    if (rimColor && idx === 1) {
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // Bamboo nodes & lance-shaped leaves
    ctx.fillStyle = color;
    for (let t = 0.5; t <= 0.98; t += 0.19) {
      const lx = st.dx + (st.bend + sway) * t * t;
      const ly = -st.h * t;
      const dir = st.bend >= 0 ? 1 : -1;
      for (let leaf = -1; leaf <= 1; leaf++) {
        const ang = dir * (0.34 + leaf * 0.27) + sway * 0.012;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(dir * 13, -3.4, dir * 25, 0);
        ctx.quadraticCurveTo(dir * 13, 2.6, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }
  });

  ctx.restore();
}

// ============================================================================
// 1. HỆ THỐNG NHÂN VẬT ĐA THẾ HỆ CHI TIẾT CAO & CHUYỂN ĐỘNG KHỚP MƯỢT MÀ
// ============================================================================

/**
 * Vẽ nhân vật chi tiết theo vai trò lịch sử:
 * - role = 'act1' (Thanh niên áo bà ba, vấn khăn + nón lá đeo lưng, tay cầm đuốc rực lửa)
 * - role = 'act2' (Chiến sĩ Vệ quốc đoàn: mũ nan lưới ngụy trang + sao vàng phát sáng, áo trấn thủ, súng trường đeo lưng)
 * - role = 'act3' (Chiến sĩ Giải phóng quân: mũ tai bèo, ba lô con cóc cài cành lá ngụy trang, cầm súng AK)
 * - role = 'act4' (Sinh viên hiện đại: áo sơ mi trắng/thanh niên, quần sẫm, đeo ba lô năng động)
 * - role = 'elder_grandfather' (Người Ông tuổi già: tóc bạc trắng, lưng hơi còng, chống gậy gỗ)
 * - role = 'veteran_father' (Người Cha tuổi trung niên: quân phục cựu chiến binh cài huân chương đỏ trên ngực)
 */
export function drawDetailedCharacter(ctx, sx, footY, role, anim, time) {
  const {
    facing = 1,
    walkCycle = 0,
    speedRatio = 0,
    onGround = true,
    vy = 0,
    landingSquash = 0,
    pose = null,
    poseTimer = 0,
    wearingHat = true,
    alpha = 1,
    isCrouching = false,
  } = anim;

  const isElder = role === 'elder_grandfather';
  const isVeteran = role === 'veteran_father';
  const isAct1 = role === 'act1' || role === 1;
  const isAct2 = role === 'act2' || role === 2;
  const isAct3 = role === 'act3' || role === 3;
  const isAct4 = role === 'act4' || role === 4;

  const crouchActive = Boolean(isCrouching && onGround && !isElder && !isVeteran);
  const bobAmp = crouchActive ? 1.8 : isElder ? 2.2 : 3.8;
  const walkBob =
    onGround && speedRatio > 0.05
      ? Math.abs(Math.sin(walkCycle * 2)) * bobAmp
      : Math.sin(time * 2.4) * (crouchActive ? 0.5 : 0.9);
  const squashDrop = landingSquash * 5.8;
  // Khi isCrouching = true: hạ trọng tâm hông sâu xuống 19px (giảm ~45% tổng chiều cao nhân vật để lọt hẳn dưới miệng hào!)
  const hipHeight = crouchActive ? 19 : isElder ? 34 : 38;
  const hipY = footY - hipHeight - walkBob + squashDrop;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(sx, hipY);
  ctx.scale(facing * (1 + landingSquash * 0.06), 1 - landingSquash * 0.08);

  // Palette per character generation
  let trouserColor = '#080c14';
  let backLegColor = '#04060b';
  let torsoColor = '#0b101b';
  let rimStroke = 'rgba(253, 230, 138, 0.34)';

  if (isAct1) {
    trouserColor = '#0a0d14';
    torsoColor = '#171311'; // Áo bà ba nâu sẫm
    rimStroke = 'rgba(251, 146, 60, 0.52)'; // Rim-light ánh đuốc lửa ấm
  } else if (isAct2) {
    trouserColor = '#12100e';
    torsoColor = '#1c1813'; // Áo trấn thủ
    rimStroke = 'rgba(251, 191, 36, 0.42)';
  } else if (isAct3) {
    trouserColor = '#091a16';
    torsoColor = '#0e261f'; // Quân phục Giải phóng
    rimStroke = 'rgba(110, 231, 183, 0.36)';
  } else if (isAct4) {
    trouserColor = '#172554'; // Quần âu xanh đen sinh viên
    backLegColor = '#0f172a';
    torsoColor = '#f8fafc'; // Áo sơ mi trắng thanh niên
    rimStroke = 'rgba(254, 240, 138, 0.55)';
  } else if (isElder) {
    trouserColor = '#1e293b';
    backLegColor = '#0f172a';
    torsoColor = '#334155'; // Áo đại cán / áo truyền thống sẫm trang trọng
    rimStroke = 'rgba(254, 243, 199, 0.5)';
  } else if (isVeteran) {
    trouserColor = '#14291d';
    backLegColor = '#0c1a12';
    torsoColor = '#1c3b29'; // Quân phục Cựu chiến binh Việt Nam
    rimStroke = 'rgba(253, 224, 71, 0.48)';
  }

  // ---- 1. ARTICULATED 2-SEGMENT LEGS + BOOTS / XÀ CẠP ----
  const strideAmp = isElder ? 0.42 : 0.64;
  const stride = onGround ? (speedRatio > 0.04 ? Math.sin(walkCycle) * strideAmp : 0) : 0;

  const drawArticulatedLeg = (phaseAngle, isBack) => {
    ctx.save();
    ctx.strokeStyle = isBack ? backLegColor : trouserColor;
    ctx.lineWidth = isElder ? 6.4 : 7.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let thighAng = phaseAngle;
    let kneeBend = Math.max(0, Math.sin(walkCycle + (isBack ? Math.PI : 0))) * (isElder ? 0.32 : 0.48);

    if (!onGround) {
      if (vy < -40) {
        thighAng = isBack ? -0.36 : 0.8;
        kneeBend = isBack ? 0.58 : 0.96;
      } else {
        thighAng = isBack ? -0.42 : 0.48;
        kneeBend = 0.36;
      }
    } else if (crouchActive) {
      // Tư thế gập gối khom lưng thấp sát đáy giao thông hào (chân trụ vững trên mặt đất ở +19px)
      const crouchStep = speedRatio > 0.04 ? Math.sin(walkCycle + (isBack ? Math.PI : 0)) * 0.28 : 0;
      thighAng = (isBack ? 0.88 : 1.08) + crouchStep;
      kneeBend = (isBack ? 1.54 : 1.72) + crouchStep * 0.35;
    } else if (pose === 'leap_trench' || pose === 'leap_crater') {
      thighAng = isBack ? -0.58 : 0.68;
      kneeBend = 0.42;
    }

    const segLen = crouchActive ? 15.8 : isElder ? 17.2 : 18.8;
    const kneeX = Math.sin(thighAng) * segLen;
    const kneeY = Math.cos(thighAng) * segLen;
    const shinAng = thighAng - kneeBend;
    const ankleX = kneeX + Math.sin(shinAng) * segLen;
    const ankleY = kneeY + Math.cos(shinAng) * segLen;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(ankleX, ankleY);
    ctx.stroke();

    // Xà cạp quấn chân (Act 2 Vệ quốc đoàn)
    if (isAct2 && !isBack) {
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.25)';
      ctx.lineWidth = 5.2;
      ctx.beginPath();
      ctx.moveTo((kneeX + ankleX) * 0.5, (kneeY + ankleY) * 0.5);
      ctx.lineTo(ankleX, ankleY);
      ctx.stroke();
    }

    // Crisp shoe / sandal / combat boot silhouette
    ctx.fillStyle = isBack ? '#030508' : '#0f172a';
    ctx.beginPath();
    ctx.ellipse(ankleX + 2.8, ankleY + 0.5, 5.5, 2.6, shinAng * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawArticulatedLeg(-stride, true);
  drawArticulatedLeg(stride, false);

  // ---- 2. TORSO, BACKGEAR & PERIOD UNIFORM DETAILS ----
  let lean = isElder ? 0.22 : speedRatio * 0.13;
  if (!onGround) lean = vy < 0 ? 0.18 : 0.08;
  if (crouchActive) lean = 0.64; // Gập thấp lưng sát hào giảm ~45% chiều cao nhân vật!
  else if (pose === 'dash') lean = 0.42;
  else if (pose === 'bow_incense') lean = isElder ? 0.36 : 0.28;
  else if (pose === 'shield_comrade') lean = 0.22;

  ctx.save();
  if (crouchActive) {
    ctx.translate(2, 5);
    ctx.scale(0.95, 0.86);
  }
  ctx.rotate(lean);

  // --- Back-mounted gear BEFORE torso ---
  if (isAct1) {
    // Nón lá đeo sau lưng bằng quai thao của thanh niên yêu nước
    ctx.save();
    ctx.translate(-12, -20);
    ctx.rotate(-1.18);
    ctx.fillStyle = '#292218';
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-15, 6);
    ctx.lineTo(0, -8);
    ctx.lineTo(15, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (isAct2) {
    // Súng trường Vệ quốc đoàn đeo chéo sau lưng (báng gỗ + nòng thép dài + đầu ruồi)
    ctx.save();
    ctx.translate(-7, -21);
    ctx.rotate(-0.34);
    // Wooden stock
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-3, 4, 5.5, 16);
    // Steel barrel extending above shoulder
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -29);
    ctx.stroke();
    // Bayonet lug / front sight
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-2.5, -25);
    ctx.stroke();
    ctx.restore();
  } else if (isAct3) {
    // Ba lô con cóc Giải phóng quân + Cành lá ngụy trang đung đưa
    ctx.fillStyle = '#0b221a';
    fillRoundedRect(ctx, -20, -32, 13, 24, 4);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-18.5, -24, 9, 12);

    // Swaying camouflage foliage twigs tucked into backpack
    const leafSway = Math.sin(time * 4.2 + walkCycle) * 0.12;
    ctx.save();
    ctx.translate(-14, -31);
    ctx.rotate(-0.45 + leafSway);
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#059669';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-4, -9, -7, -16);
    ctx.stroke();
    for (const ly of [-5, -10, -14]) {
      ctx.beginPath();
      ctx.ellipse(-5, ly, 4.2, 1.8, 0.4, 0, Math.PI * 2);
      ctx.ellipse(-1, ly - 1, 4.0, 1.7, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (isAct4) {
    // Ba lô sinh viên hiện đại
    ctx.fillStyle = '#1e293b';
    fillRoundedRect(ctx, -19, -30, 12, 23, 4.5);
    ctx.fillStyle = '#334155';
    fillRoundedRect(ctx, -18, -22, 8, 12, 2.5);
  }

  // --- Main Torso ---
  ctx.fillStyle = torsoColor;
  if (isAct1) {
    // Áo bà ba có vạt xẻ tà mềm mại
    ctx.beginPath();
    ctx.moveTo(-9, -33);
    ctx.lineTo(9, -33);
    ctx.lineTo(10.5, 3);
    ctx.lineTo(3, 3);
    ctx.lineTo(2, -3);
    ctx.lineTo(-9.5, 3);
    ctx.closePath();
    ctx.fill();
  } else {
    fillRoundedRect(ctx, -9.5, -34, 19, 35, 5.5);
  }

  // Rim-light along chest edge
  ctx.strokeStyle = rimStroke;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(7.5, -32);
  ctx.lineTo(9.2, -4);
  ctx.stroke();

  // Specific uniform chest details
  if (isAct2) {
    // Đường chần bông áo trấn thủ + dây chéo bao xe đạn
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
    ctx.lineWidth = 1.2;
    for (let y = -28; y <= -7; y += 7) {
      ctx.beginPath();
      ctx.moveTo(-7.5, y);
      ctx.lineTo(7.5, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-7, -32);
    ctx.lineTo(7, -6);
    ctx.stroke();
  } else if (isAct4) {
    // Cổ áo sơ mi trắng & dây quai ba lô trước ngực
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(-5, -32);
    ctx.lineTo(-3, -12);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-2, -34);
    ctx.lineTo(6, -34);
    ctx.lineTo(3, -28);
    ctx.closePath();
    ctx.fill();
  } else if (isVeteran) {
    // Quân phục Cựu chiến binh: Cầu vai vàng + Thắt lưng + Huân chương Đỏ lấp lánh trên ngực!
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-5, -34, 9, 2.5);
    ctx.fillStyle = '#292524';
    ctx.fillRect(-9.5, -10, 19, 3.2);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(4, -10.5, 4, 4);
    // Red ribbon & golden star medal on chest
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(3.2, -26, 4.2, 5.2);
    drawStar(ctx, 5.3, -19, 5, 3.1, 1.3, '#fde047');
  }

  // ---- 3. HEAD, HAIR & HISTORIC HEADGEAR ----
  ctx.fillStyle = isAct4 || isElder || isVeteran ? '#1e293b' : '#0b101b';
  ctx.beginPath();
  ctx.arc(1.2, -43.5, 8.5, 0, Math.PI * 2);
  ctx.fill();

  // Subtle rim-light on face profile
  ctx.strokeStyle = rimStroke;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(1.2, -43.5, 8.5, -0.55, 0.55);
  ctx.stroke();

  if (isAct1) {
    // Đầu vấn khăn truyền thống gọn gàng với đuôi khăn sau gáy
    ctx.fillStyle = '#271c19';
    ctx.beginPath();
    ctx.ellipse(0.8, -47.5, 9.6, 3.8, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Khăn vấn đuôi nhỏ sau đầu
    ctx.beginPath();
    ctx.moveTo(-7.5, -47);
    ctx.lineTo(-14, -44);
    ctx.lineTo(-9, -49.5);
    ctx.closePath();
    ctx.fill();
  } else if (isAct2 && wearingHat) {
    // Mũ nan Vệ quốc đoàn có Lưới ngụy trang đan chéo & Ngôi sao vàng phát sáng!
    ctx.fillStyle = '#292118';
    ctx.beginPath();
    ctx.arc(1.2, -45.5, 12.8, Math.PI * 1.02, -0.02);
    ctx.fill();
    ctx.fillRect(-12.5, -46.5, 27.5, 2.4);

    // Criss-cross camouflage netting lines on helmet dome
    ctx.strokeStyle = 'rgba(214, 211, 209, 0.34)';
    ctx.lineWidth = 0.9;
    for (let dx = -7; dx <= 7; dx += 4.5) {
      ctx.beginPath();
      ctx.moveTo(dx - 2, -46);
      ctx.lineTo(dx + 3, -55);
      ctx.moveTo(dx + 3, -46);
      ctx.lineTo(dx - 2, -55);
      ctx.stroke();
    }

    // Glowing golden star on helmet front
    ctx.save();
    const starGlow = ctx.createRadialGradient(7.2, -50, 0.5, 7.2, -50, 7.5);
    starGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    starGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(7.2, -50, 7.5, 0, Math.PI * 2);
    ctx.fill();
    drawStar(ctx, 7.2, -50, 5, 3.6, 1.5, '#fef08a');
    ctx.restore();
  } else if (isAct3 && wearingHat) {
    // Mũ tai bèo Giải phóng quân vành mềm lượn sóng đặc trưng
    ctx.fillStyle = '#0c2920';
    ctx.beginPath();
    ctx.arc(1.2, -48.5, 9.5, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, -47.5);
    ctx.quadraticCurveTo(-7, -50.5, 1, -47.8);
    ctx.quadraticCurveTo(9, -45.5, 17, -48.2);
    ctx.quadraticCurveTo(8, -44.2, -15, -47.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.38)';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawStar(ctx, 6.8, -52, 5, 2.8, 1.2, '#facc15');
  } else if (isAct4) {
    // Tóc sinh viên trẻ trung gọn gàng
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0.8, -46, 9.1, Math.PI * 0.92, Math.PI * 2.08);
    ctx.lineTo(10.5, -46);
    ctx.closePath();
    ctx.fill();
  } else if (isElder) {
    // Tóc bạc trắng & chòm râu bạc phúc hậu của Người Ông tuổi già
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(0.5, -45.8, 9.1, Math.PI * 0.88, Math.PI * 2.05);
    ctx.fill();
    // Wispy silver beard
    ctx.beginPath();
    ctx.moveTo(6.5, -38);
    ctx.quadraticCurveTo(9.5, -34, 6.2, -31);
    ctx.lineTo(4.2, -36.5);
    ctx.fill();
  } else if (isVeteran) {
    // Tóc điểm sương gọn gàng của Người Cha cựu chiến binh
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0.8, -45.8, 8.9, Math.PI * 0.92, Math.PI * 2.05);
    ctx.fill();
  }

  // ---- 4. ARMS, WEAPONS, BLAZING TORCH & WALKING CANE ----
  ctx.strokeStyle = isAct4 ? '#e2e8f0' : torsoColor;
  ctx.lineWidth = 5.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

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
    ctx.lineTo(35, -18);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.fillRect(29, -25, 12, 16);
    ctx.restore();
  } else if (pose === 'flag_raise' || pose === 'bunker_flag' || pose === 'tank_charge') {
    ctx.beginPath();
    ctx.moveTo(3, -27);
    ctx.lineTo(13, -46);
    ctx.stroke();
    drawWavingFlag(
      ctx,
      13,
      -106,
      58,
      36,
      time,
      68,
      pose === 'tank_charge' ? 'liberation' : 'national'
    );
  } else if (pose === 'bow_incense') {
    // Trang nghiêm chắp tay / dâng nén tâm hương đỏ rực đầu nhang
    ctx.beginPath();
    ctx.moveTo(3, -26);
    ctx.lineTo(15, -20);
    ctx.lineTo(19, -25);
    ctx.stroke();
    if (!isElder && !isVeteran) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(19, -25);
      ctx.lineTo(26, -40);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(26, -41, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isElder) {
      // Elder Grandfather still rests wooden cane vertically while bowing
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(15, -20);
      ctx.lineTo(18, 30);
      ctx.stroke();
    }
  } else if (pose === 'handoff_give') {
    ctx.beginPath();
    ctx.moveTo(4, -26);
    ctx.lineTo(24, -33);
    ctx.stroke();
    if (poseTimer < 0.55) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(27, -36, 11.5, 4.2, -0.1, 0, Math.PI * 2);
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
    ctx.lineTo(15, -43);
    ctx.lineTo(7, -48);
    ctx.stroke();
  } else if (pose === 'throw_grenade') {
    // Vung tay ném bom xăng / lựu đạn theo quỹ đạo parabol
    const throwAngle = -1.75 + Math.min(1, poseTimer * 3.8) * 1.65;
    ctx.save();
    ctx.translate(3, -27);
    ctx.rotate(throwAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18, -8);
    ctx.stroke();
    if (poseTimer < 0.16) {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(21, -10, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (pose === 'plant_charge') {
    // Lao tới áp sát đánh bộc phá cứ điểm Điện Biên
    ctx.beginPath();
    ctx.moveTo(3, -26);
    ctx.lineTo(20, -19);
    ctx.stroke();
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(18, -24, 14, 8);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(33, -20, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pose === 'shoot_ak') {
    // Giương súng AK-47 / súng trường bắn loạt đạn thẳng kèm tia lửa đầu nòng rực sáng!
    const kick = Math.sin(poseTimer * 42) * 1.8;
    ctx.beginPath();
    ctx.moveTo(2, -26);
    ctx.lineTo(14 - kick, -23);
    ctx.stroke();

    ctx.save();
    ctx.translate(9 - kick, -24);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-10, -1.5, 9, 4.2);
    ctx.fillRect(5, -2, 8, 3.6);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-2, -3, 9, 4.5);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(13, -0.8);
    ctx.lineTo(26, -0.8);
    ctx.stroke();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(4, 1.5);
    ctx.quadraticCurveTo(6, 8, 10, 10.5);
    ctx.stroke();

    // Bright muzzle flash star
    if (poseTimer < 0.28) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(26, -0.8);
      ctx.lineTo(39, -5.5);
      ctx.lineTo(34, -0.8);
      ctx.lineTo(41, 3.8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (pose === 'aa_fire' || pose === 'dawn_light') {
    // Giơ cao tay chỉ huy bắn cao xạ / kích hoạt ánh sáng bình minh Đổi mới
    ctx.beginPath();
    ctx.moveTo(3, -27);
    ctx.lineTo(14, -46);
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(15, -49, 4.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pose === 'rally_cheer') {
    // Chiến sĩ Vệ quốc đoàn & Tự vệ Thành giơ cao súng trường / mã tấu hưởng ứng Lời kêu gọi Toàn quốc kháng chiến!
    const pump = Math.sin(time * 10.5) * 4.2;
    ctx.beginPath();
    ctx.moveTo(3, -27);
    ctx.lineTo(13, -49 + pump);
    ctx.stroke();
    // Raised rifle with gleaming bayonet
    ctx.save();
    ctx.translate(13, -49 + pump);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2.5, -2, 5, 16);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -28);
    ctx.stroke();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, -38);
    ctx.stroke();
    ctx.restore();
  } else if (isAct1) {
    // Màn 1: Cầm ngọn đuốc tre rực lửa giơ phía trước soi đường trong đêm đen!
    const torchBob = Math.sin(walkCycle * 2 + time * 3) * 2.2;
    const handX = 15;
    const handY = -31 + torchBob * 0.5;
    ctx.beginPath();
    ctx.moveTo(3, -26);
    ctx.lineTo(10, -24);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Bamboo torch handle
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(handX - 3, handY + 7);
    ctx.lineTo(handX + 8, handY - 16);
    ctx.stroke();

    // Multi-layered blazing flame + warm radial halo
    const fx = handX + 9;
    const fy = handY - 18;
    const flicker = Math.sin(time * 17) * 2.6;
    const flickerX = Math.cos(time * 13) * 2.2 - speedRatio * 5;

    ctx.save();
    const tGlow = ctx.createRadialGradient(fx, fy - 6, 2, fx, fy - 6, 46);
    tGlow.addColorStop(0, 'rgba(254, 240, 138, 0.62)');
    tGlow.addColorStop(0.45, 'rgba(249, 115, 22, 0.24)');
    tGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = tGlow;
    ctx.beginPath();
    ctx.arc(fx, fy - 6, 46, 0, Math.PI * 2);
    ctx.fill();

    // Outer crimson-orange flame tongue
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(fx - 5, fy + 2);
    ctx.quadraticCurveTo(fx - 8, fy - 12, fx + flickerX, fy - 24 + flicker);
    ctx.quadraticCurveTo(fx + 9, fy - 10, fx + 5, fy + 2);
    ctx.closePath();
    ctx.fill();

    // Inner bright yellow core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(fx - 2.8, fy + 1);
    ctx.quadraticCurveTo(fx - 4, fy - 8, fx + flickerX * 0.5, fy - 15 + flicker * 0.6);
    ctx.quadraticCurveTo(fx + 4.5, fy - 7, fx + 2.8, fy + 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (isAct3) {
    // Màn 3: Tay cầm súng tiểu liên AK-47 chắc chắn ngang ngực
    const gunBob = speedRatio > 0.05 ? Math.sin(walkCycle * 2) * 1.4 : 0;
    ctx.beginPath();
    ctx.moveTo(2, -26);
    ctx.lineTo(11, -18 + gunBob);
    ctx.stroke();

    ctx.save();
    ctx.translate(6, -20 + gunBob);
    ctx.rotate(-0.14);
    // Wooden stock & handguard
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(-10, -1.5, 9, 4.2);
    ctx.fillRect(5, -2, 8, 3.6);
    // Receiver & long barrel + front sight post
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-2, -3, 9, 4.5);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(13, -0.8);
    ctx.lineTo(25, -0.8);
    ctx.moveTo(23, -0.8);
    ctx.lineTo(23, -3.8);
    ctx.stroke();
    // Iconic curved AK banana magazine!
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(4, 1.5);
    ctx.quadraticCurveTo(6, 8, 10, 10.5);
    ctx.stroke();
    ctx.restore();
  } else if (isElder) {
    // Người Ông tuổi già: Tay chống gậy gỗ đầu cong nhịp nhàng theo bước chân!
    const caneSwing = speedRatio > 0.04 ? Math.sin(walkCycle) * 0.22 : 0;
    ctx.save();
    ctx.rotate(caneSwing);
    ctx.strokeStyle = torsoColor;
    ctx.lineWidth = 5.2;
    ctx.beginPath();
    ctx.moveTo(3, -25);
    ctx.lineTo(14, -14);
    ctx.stroke();

    // Curved wooden cane reaching down to stone steps
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(11, -15);
    ctx.quadraticCurveTo(15, -18, 16.5, -13);
    ctx.lineTo(18.5, 29);
    ctx.stroke();
    ctx.restore();
  } else {
    // Natural energetic arm swing (Act 2, Act 4 Student, Act 4 Veteran Father)
    const armSwing = !onGround
      ? -0.46
      : speedRatio > 0.05
      ? -Math.sin(walkCycle) * 0.62
      : 0.08;
    ctx.beginPath();
    ctx.moveTo(2, -27);
    ctx.lineTo(Math.sin(armSwing) * 8, -27 + Math.cos(armSwing) * 9);
    ctx.lineTo(Math.sin(armSwing * 1.15) * 15.5, -27 + Math.cos(armSwing * 1.15) * 17);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

// ============================================================================
// 2. CÔNG TRÌNH & ĐỊA HÌNH CHI TIẾT MÀN 1 (1930 – 1945)
// ============================================================================

/**
 * Mái đình làng Việt Nam đầu đao uốn cong & Cây đa cổ thụ rễ phụ rủ xuống
 */
export function drawVillageDinhAndBanyan(ctx, dinhX, banyanX, dinhGy, banyanGy, time, palette) {
  ctx.save();

  // 1. Cây đa cổ thụ đầu làng (x = banyanX) có rễ phụ rủ xuống đung đưa
  if (banyanX > -260 && banyanX < 2600) {
    ctx.save();
    ctx.translate(banyanX, banyanGy);
    ctx.fillStyle = palette.nearSil;

    // Gnarled trunk + buttress roots
    ctx.beginPath();
    ctx.moveTo(-38, 8);
    ctx.quadraticCurveTo(-20, -25, -16, -98);
    ctx.lineTo(-58, -142);
    ctx.lineTo(-46, -150);
    ctx.lineTo(-8, -110);
    ctx.lineTo(8, -115);
    ctx.lineTo(54, -148);
    ctx.lineTo(64, -138);
    ctx.lineTo(18, -95);
    ctx.quadraticCurveTo(22, -25, 42, 8);
    ctx.closePath();
    ctx.fill();

    // Multi-layered banyan foliage canopy
    const crowns = [
      [0, -172, 74],
      [-62, -150, 52],
      [64, -148, 54],
      [-32, -192, 48],
      [36, -188, 48],
    ];
    ctx.beginPath();
    for (const [cx, cy, cr] of crowns) {
      ctx.moveTo(cx + cr, cy);
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    }
    ctx.fill();

    // Hanging aerial roots (rễ phụ cây đa rủ xuống)
    ctx.strokeStyle = 'rgba(12, 17, 28, 0.88)';
    ctx.lineWidth = 1.8;
    const roots = [
      [-68, -118, 86],
      [-52, -124, 104],
      [-36, -115, 72],
      [34, -116, 78],
      [50, -122, 108],
      [66, -114, 82],
    ];
    roots.forEach(([rx, ry, rLen], idx) => {
      const sway = Math.sin(time * 1.4 + idx * 0.8) * 5;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + sway * 0.6, ry + rLen * 0.55, rx + sway, ry + rLen);
      ctx.stroke();
    });
    ctx.restore();
  }

  // 2. Mái đình làng Việt Nam với 4 đầu đao uốn cong vút & cột gỗ lim
  if (dinhX > -280 && dinhX < 2600) {
    ctx.save();
    ctx.translate(dinhX, dinhGy);
    ctx.fillStyle = palette.nearSil;

    // Stone stepped foundation
    ctx.fillRect(-108, -10, 216, 14);
    // 4 Timber pillars on stone pedestals
    for (const px of [-82, -38, 38, 82]) {
      ctx.fillRect(px - 5, -108, 10, 98);
      ctx.fillRect(px - 8, -14, 16, 6);
    }

    // Lower curved roof tier with dramatic upturned đầu đao eaves
    ctx.beginPath();
    ctx.moveTo(-142, -128); // Far left upturned dragon tip!
    ctx.quadraticCurveTo(-124, -102, -92, -106);
    ctx.lineTo(92, -106);
    ctx.quadraticCurveTo(124, -102, 142, -128); // Far right upturned dragon tip!
    ctx.quadraticCurveTo(114, -118, 92, -124);
    ctx.lineTo(0, -166);
    ctx.lineTo(-92, -124);
    ctx.quadraticCurveTo(-114, -118, -142, -128);
    ctx.closePath();
    ctx.fill();

    // Subtle moonlight rim highlight along curved roof ridge & đầu đao
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-142, -128);
    ctx.quadraticCurveTo(-96, -122, 0, -166);
    ctx.quadraticCurveTo(96, -122, 142, -128);
    ctx.stroke();

    // Ridge crest ornament
    ctx.fillStyle = palette.nearSil;
    ctx.fillRect(-18, -172, 36, 7);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Không gian cắt lớp 2D (2D Cutaway Underground):
 * Căn hầm bí mật sâu dưới lòng đất (+180px) bên dưới nền Nhà tranh vách nứa đầu Màn 1 (x = 450..750)
 */
export function drawSecretCellarAndHut(ctx, centerX, surfaceY, cellarFloorY, time) {
  ctx.save();
  const depth = Math.max(120, cellarFloorY - surfaceY);
  const leftX = centerX - 150; // world x = 450
  const rightX = centerX + 150; // world x = 750
  const innerLeft = centerX - 136; // world x = 464
  const innerRight = centerX + 136; // world x = 736

  // 1. NỀN ĐẤT ĐÁ ĐEN ĐẶC CẮT LỚP BAO QUANH CĂN HẦM (Cutaway Pitch-Black Earth Enclosure)
  ctx.fillStyle = '#030508';
  ctx.fillRect(leftX - 28, surfaceY, 356, depth + 36);

  // Khoang hầm ngầm chữ nhật cắt lớp bên trong (chừa lối cầu thang gỗ mở ở góc trái innerLeft..centerX-46)
  ctx.fillStyle = '#0b0e15';
  ctx.fillRect(innerLeft, surfaceY + 30, innerRight - innerLeft, depth - 28);
  // Hốc giếng cầu thang mở thông lên sàn nhà tranh (x = 464..554)
  ctx.fillRect(innerLeft, surfaceY + 2, 90, 32);

  // Lớp trần đất đá đen đặc dày 30px ngăn cách căn hầm với mặt đất bên trên (x = 554..746)
  ctx.fillStyle = '#04060a';
  ctx.fillRect(centerX - 46, surfaceY + 2, 190, 30);
  // Các viên sỏi đá ngầm & rễ tre ăn sâu trong lớp đất cắt ngang
  ctx.fillStyle = '#141923';
  for (const [rx, ry, rw, rh] of [
    [-24, 14, 14, 6],
    [18, 11, 18, 7],
    [68, 16, 15, 6],
    [112, 12, 16, 7],
  ]) {
    ctx.beginPath();
    ctx.ellipse(centerX + rx, surfaceY + ry, rw * 0.5, rh * 0.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. ÁNH ĐÈN DẦU HOA KỲ ẤM ÁP THẮP SÁNG RIÊNG KHÔNG GIAN TRONG HẦM (x = 635 = centerX + 35)
  const flicker = 0.88 + Math.sin(time * 10.5) * 0.12;
  const lampX = centerX + 35;
  const lampY = cellarFloorY - 46;
  const cellarGlow = ctx.createRadialGradient(lampX, lampY, 6, lampX, lampY, 165);
  cellarGlow.addColorStop(0, `rgba(254, 240, 138, ${0.52 * flicker})`);
  cellarGlow.addColorStop(0.38, `rgba(245, 158, 11, ${0.28 * flicker})`);
  cellarGlow.addColorStop(0.75, `rgba(180, 83, 9, ${0.1 * flicker})`);
  cellarGlow.addColorStop(1, 'rgba(5, 7, 12, 0)');
  ctx.fillStyle = cellarGlow;
  ctx.fillRect(innerLeft, surfaceY + 4, innerRight - innerLeft, depth - 2);

  // 3. HỆ CỘT GỖ LIM CHỐNG HẦM, XÀ NGANG & CẦU THANG GỖ ĐI XUỐNG (+60, +120, +180)
  ctx.fillStyle = '#261b13';
  ctx.strokeStyle = '#3b2819';
  ctx.lineWidth = 5.5;
  // Xà ngang chống trần hầm
  ctx.fillRect(centerX - 46, surfaceY + 30, 182, 7);
  // 4 cột gỗ chống hầm chắc chắn
  for (const px of [-44, 12, 76, 128]) {
    ctx.fillRect(centerX + px - 4, surfaceY + 32, 8, depth - 32);
  }

  // Dầm chéo cầu thang gỗ từ miệng nắp hầm (x = 472, dy = 0) xuống đáy hầm (x = 595, dy = +180)
  ctx.strokeStyle = '#452c1b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(innerLeft + 8, surfaceY + 5);
  ctx.lineTo(centerX - 4, cellarFloorY);
  ctx.moveTo(innerLeft + 22, surfaceY + 5);
  ctx.lineTo(centerX + 10, cellarFloorY);
  ctx.stroke();

  // Các bậc thang gỗ nhỏ nối liền lối xuống hầm
  ctx.fillStyle = '#5c3a21';
  for (let s = 1; s <= 7; s++) {
    const t = s / 8;
    const sxStep = innerLeft + 10 + t * 116;
    const syStep = surfaceY + 6 + t * (depth - 8);
    ctx.fillRect(sxStep - 12, syStep, 28, 4.5);
  }

  // Bàn gỗ nhỏ & cây đèn dầu Hoa Kỳ thắp sáng nơi đặt Bản Cương lĩnh (centerX + 35 = worldX 635)
  ctx.fillStyle = '#3b2313';
  ctx.fillRect(lampX - 30, cellarFloorY - 26, 60, 5);
  ctx.fillRect(lampX - 24, cellarFloorY - 21, 5, 21);
  ctx.fillRect(lampX + 19, cellarFloorY - 21, 5, 21);

  // Cây đèn dầu leo lét trên cột gỗ cạnh bàn
  ctx.fillStyle = '#92400e';
  ctx.fillRect(lampX + 34, lampY - 4, 8, 9);
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(lampX + 38, lampY - 8, 3.6 * flicker, 0, Math.PI * 2);
  ctx.fill();

  // Viền đất đá cắt lớp sắc nét quanh chu vi hầm
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(innerLeft, surfaceY + 31, innerRight - innerLeft, depth - 31);

  // 4. NGÔI NHÀ TRANH VÁCH NỨA TRÊN MẶT ĐẤT (x = 435..765, surfaceY)
  const hutFloorY = surfaceY - 2;
  // Vách phên nứa tối mờ phía sau nhà tranh
  ctx.fillStyle = '#0c1018';
  ctx.fillRect(centerX - 144, hutFloorY - 88, 288, 88);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let wx = centerX - 136; wx < centerX + 138; wx += 18) {
    ctx.beginPath();
    ctx.moveTo(wx, hutFloorY - 84);
    ctx.lineTo(wx, hutFloorY);
    ctx.stroke();
  }

  // 4 Cột tre / gỗ nhà tranh
  ctx.fillStyle = '#151b26';
  for (const cxCol of [-144, -52, 52, 136]) {
    ctx.fillRect(centerX + cxCol, hutFloorY - 92, 9, 92);
  }

  // Mái nhà tranh lợp rơm nhiều tầng truyền thống
  ctx.fillStyle = '#141924';
  ctx.beginPath();
  ctx.moveTo(centerX - 172, hutFloorY - 84);
  ctx.lineTo(centerX, hutFloorY - 154);
  ctx.lineTo(centerX + 172, hutFloorY - 84);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(203, 213, 225, 0.22)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(centerX - 172, hutFloorY - 84);
  ctx.lineTo(centerX, hutFloorY - 154);
  ctx.lineTo(centerX + 172, hutFloorY - 84);
  ctx.stroke();

  // Cửa nắp hầm gỗ đang mở hé ở góc trái sàn nhà tranh + mũi tên vàng gợi ý [S / ▼] xuống hầm!
  const hatchX = innerLeft + 44; // world x ~ 508
  ctx.save();
  ctx.translate(innerLeft + 6, hutFloorY);
  ctx.rotate(-0.95);
  ctx.fillStyle = '#452c1b';
  ctx.fillRect(0, -5, 46, 5);
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(0, -5, 46, 5);
  ctx.restore();

  const arrowBob = Math.sin(time * 4.2) * 3;
  ctx.fillStyle = 'rgba(253, 224, 71, 0.78)';
  ctx.font = '600 10.5px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▼ Hầm bí mật [S]', hatchX, hutFloorY - 16 + arrowBob);

  ctx.restore();
}

/**
 * Không gian cắt lớp 2D (2D Cutaway Karst Cave):
 * 3 Bậc đá thác nước Suối Lê-nin (965..1200) dẫn sâu vào lòng Hang đá vôi Cốc Bó — Pác Bó (x = 1200..1550, dy = -146)
 */
export function drawPacBoKarstAndStream(ctx, cameraX, width, baseGroundY, time) {
  const cliffLeft = 900 - cameraX;
  const cliffRight = 1660 - cameraX;
  if (cliffRight < -120 || cliffLeft > width + 120) return;

  ctx.save();

  // 1. KHỐI NÚI ĐÁ VÔI PÁC BÓ ĐỒ SỘ & LỚP ĐÁ ĐEN ĐẶC CẮT LỚP BAO QUANH HANG (x = 930..1640)
  ctx.fillStyle = '#060a11';
  ctx.beginPath();
  ctx.moveTo(930 - cameraX, baseGroundY + 42);
  ctx.lineTo(958 - cameraX, baseGroundY - 135);
  ctx.lineTo(1065 - cameraX, baseGroundY - 215);
  ctx.lineTo(1185 - cameraX, baseGroundY - 295);
  ctx.lineTo(1375 - cameraX, baseGroundY - 338);
  ctx.lineTo(1535 - cameraX, baseGroundY - 292);
  ctx.lineTo(1615 - cameraX, baseGroundY - 165);
  ctx.lineTo(1645 - cameraX, baseGroundY + 42);
  ctx.closePath();
  ctx.fill();

  // Khối đá đen đặc cắt lớp (Cutaway Solid Rock Mass) phía trên và bên phải lòng hang Cốc Bó (1195..1565)
  const caveLeft = 1198 - cameraX;
  const caveRight = 1546 - cameraX;
  const caveW = caveRight - caveLeft;
  const caveFloorY = baseGroundY - 146;
  const caveCeilY = caveFloorY - 112;

  ctx.fillStyle = '#030508';
  ctx.beginPath();
  ctx.moveTo(caveLeft - 14, caveFloorY + 34);
  ctx.lineTo(caveLeft - 10, caveCeilY - 38);
  ctx.lineTo(caveLeft + caveW * 0.5, caveCeilY - 58);
  ctx.lineTo(caveRight + 32, caveCeilY - 28);
  ctx.lineTo(caveRight + 38, baseGroundY + 32);
  ctx.lineTo(caveLeft - 14, baseGroundY + 32);
  ctx.closePath();
  ctx.fill();

  // 2. KHOANG NỘI THẤT HANG ĐÁ VÔI CỐC BÓ CẮT LỚP 2D (x = 1200..1546, floor = baseGroundY - 146)
  ctx.fillStyle = '#0b121e';
  ctx.beginPath();
  ctx.moveTo(caveLeft, caveFloorY + 2);
  ctx.lineTo(caveLeft + 8, caveCeilY + 18);
  ctx.quadraticCurveTo(caveLeft + caveW * 0.35, caveCeilY - 8, caveLeft + caveW * 0.68, caveCeilY + 4);
  ctx.quadraticCurveTo(caveRight - 8, caveCeilY + 18, caveRight, caveFloorY + 2);
  ctx.closePath();
  ctx.fill();

  // Ánh lửa / ánh đèn ấm áp soi sáng Bàn đá Bác Hồ làm việc sâu trong hang (x = 1435)
  const tableSx = 1435 - cameraX;
  const flicker = 0.9 + Math.sin(time * 8.5) * 0.1;
  const caveGlow = ctx.createRadialGradient(tableSx, caveFloorY - 38, 6, tableSx, caveFloorY - 38, 155);
  caveGlow.addColorStop(0, `rgba(254, 240, 138, ${0.46 * flicker})`);
  caveGlow.addColorStop(0.45, `rgba(245, 158, 11, ${0.2 * flicker})`);
  caveGlow.addColorStop(1, 'rgba(4, 7, 13, 0)');
  ctx.fillStyle = caveGlow;
  ctx.fill();

  // Viền đá cắt lớp rêu phong quanh vòm hang
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Nhũ đá vôi (Stalactites) rủ xuống từ trần hang & Măng đá (Stalagmites) mọc dưới nền hang
  ctx.fillStyle = '#04070d';
  const stalactites = [28, 68, 108, 154, 198, 246, 292, 326];
  for (let i = 0; i < stalactites.length; i++) {
    const sxSt = caveLeft + stalactites[i];
    const len = 18 + (i % 3) * 11;
    const topY = caveCeilY + (i === 0 || i === 7 ? 16 : 2);
    ctx.beginPath();
    ctx.moveTo(sxSt - 6, topY);
    ctx.lineTo(sxSt, topY + len);
    ctx.lineTo(sxSt + 6, topY);
    ctx.closePath();
    ctx.fill();
  }

  // Bàn đá chông chênh & ghế đá tự nhiên nơi Bác Hồ làm việc và sáng lập Mặt trận Việt Minh (x = 1395..1470)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(tableSx - 34, caveFloorY - 22);
  ctx.lineTo(tableSx + 28, caveFloorY - 24);
  ctx.lineTo(tableSx + 24, caveFloorY - 16);
  ctx.lineTo(tableSx - 30, caveFloorY - 15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#151e2e';
  ctx.fillRect(tableSx - 22, caveFloorY - 16, 12, 16);
  ctx.fillRect(tableSx + 8, caveFloorY - 16, 11, 16);
  // Ghế đá nhỏ bên cạnh bàn đá
  ctx.fillRect(tableSx - 48, caveFloorY - 13, 14, 13);

  // Khe suối ngầm xanh ngọc chảy từ lòng hang Cốc Bó ra miệng thác (x = 1200..1365)
  ctx.fillStyle = 'rgba(45, 212, 191, 0.38)';
  ctx.fillRect(caveLeft, caveFloorY - 3, 165, 5);

  // 3. THÁC NƯỚC 3 TẦNG TRẮNG XÓA ĐỔ TỪ CỬA HANG CỐC BÓ XUỐNG SUỐI LÊ-NIN (x = 965..1205)
  const cascadeSteps = [
    { xTop: 1196, yTop: baseGroundY - 146, xBot: 1152, yBot: baseGroundY - 96, w: 22 },
    { xTop: 1085, yTop: baseGroundY - 96, xBot: 1042, yBot: baseGroundY - 46, w: 26 },
    { xTop: 982, yTop: baseGroundY - 46, xBot: 998, yBot: baseGroundY + 20, w: 30 },
  ];
  for (let c = 0; c < cascadeSteps.length; c++) {
    const cs = cascadeSteps[c];
    const x1 = cs.xTop - cameraX;
    const x2 = cs.xBot - cameraX;
    const wfGrad = ctx.createLinearGradient(x1, cs.yTop, x2, cs.yBot);
    wfGrad.addColorStop(0, 'rgba(204, 251, 241, 0.62)');
    wfGrad.addColorStop(0.55, 'rgba(45, 212, 191, 0.42)');
    wfGrad.addColorStop(1, 'rgba(153, 246, 228, 0.22)');
    ctx.fillStyle = wfGrad;
    ctx.beginPath();
    ctx.moveTo(x1 - cs.w * 0.5, cs.yTop);
    ctx.quadraticCurveTo((x1 + x2) * 0.5 - 6, (cs.yTop + cs.yBot) * 0.5, x2 - cs.w * 0.65, cs.yBot);
    ctx.lineTo(x2 + cs.w * 0.65, cs.yBot);
    ctx.quadraticCurveTo((x1 + x2) * 0.5 + 6, (cs.yTop + cs.yBot) * 0.5, x1 + cs.w * 0.5, cs.yTop);
    ctx.closePath();
    ctx.fill();

    // Bọt nước trắng xóa tung bọt dưới chân mỗi bậc thác
    const foamR = 10 + Math.sin(time * 7 + c * 1.7) * 2.5;
    ctx.fillStyle = 'rgba(240, 253, 250, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x2, cs.yBot, foamR * 1.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. DÒNG SUỐI LÊ-NIN XANH NGỌC CHẢY DƯỚI CHÂN VÁCH ĐÁ (x = 990..1565, dy = +28)
  const sLeft = 988 - cameraX;
  const sRight = 1568 - cameraX;
  const waterY = baseGroundY + 18;
  const waterGrad = ctx.createLinearGradient(0, waterY, 0, waterY + 22);
  waterGrad.addColorStop(0, 'rgba(45, 212, 191, 0.46)');
  waterGrad.addColorStop(1, 'rgba(15, 118, 110, 0.2)');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(sLeft, waterY, sRight - sLeft, 20);

  ctx.strokeStyle = 'rgba(153, 246, 228, 0.52)';
  ctx.lineWidth = 1.4;
  for (let wx = 1010; wx < 1545; wx += 46) {
    const rx = wx - cameraX + Math.sin(time * 2.8 + wx) * 8;
    ctx.beginPath();
    ctx.moveTo(rx, waterY + 5);
    ctx.lineTo(rx + 22, waterY + 5);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Ụ rơm lớn kết hợp bụi tre đặt cách quãng trước sân Kho thóc Nhật
 */
export function drawHaystackBambooCover(ctx, sx1, sx2, topY, groundY, time) {
  const cx = (sx1 + sx2) * 0.5;
  const w = sx2 - sx1;
  const h = groundY - topY;

  ctx.save();
  // Swaying bamboo stalks behind haystack
  drawBambooCluster(ctx, cx + w * 0.28, groundY + 3, 0.58, time, '#090e17', 'rgba(253,224,71,0.18)');

  // Central wooden pole of Vietnamese haystack (cây rơm làng quê)
  ctx.fillStyle = '#3f2e1e';
  ctx.fillRect(cx - 2.5, topY - 14, 5, h + 14);

  // Layered dome of golden-brown straw
  const strawGrad = ctx.createLinearGradient(cx, topY, cx, groundY);
  strawGrad.addColorStop(0, '#422c15');
  strawGrad.addColorStop(0.5, '#291c0e');
  strawGrad.addColorStop(1, '#140e08');
  ctx.fillStyle = strawGrad;
  ctx.beginPath();
  ctx.moveTo(sx1 - 6, groundY + 2);
  ctx.quadraticCurveTo(sx1 - 4, topY + h * 0.25, cx, topY);
  ctx.quadraticCurveTo(sx2 + 4, topY + h * 0.25, sx2 + 6, groundY + 2);
  ctx.closePath();
  ctx.fill();

  // Warm rim highlight on haystack crown so player clearly sees jumpable cover surface
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.38)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(sx1 + 4, topY + 6);
  ctx.quadraticCurveTo(cx, topY - 1, sx2 - 4, topY + 6);
  ctx.stroke();

  ctx.restore();
}

/**
 * Kho thóc Nhật xây gạch kiên cố, mái tôn, cửa sắt lớn + 2 Tháp canh gỗ cao có lính Nhật gác & đèn pha xoay
 */
export function drawJapaneseGranaryAndTowers(
  ctx,
  cameraX,
  width,
  getGroundY,
  time,
  liberated,
  granaryCombat = null
) {
  const shakeX = granaryCombat && !liberated ? granaryCombat.shakeX || 0 : 0;
  const gx = 2335 - cameraX + shakeX;
  if (gx < -420 || gx > width + 420) return;

  const gy = getGroundY(2335);
  ctx.save();

  // Helper to draw a tall timber watchtower (or collapsed timber wreckage when liberated!)
  const drawWatchtower = (worldX, phaseOffset, customBeamX = null, beamState = 'normal') => {
    const tx = worldX - cameraX;
    const tgy = getGroundY(worldX);

    if (liberated) {
      // Tháp canh gỗ đã sụp đổ tan tành trên mặt đất sau khi quần chúng phá kho thóc!
      ctx.save();
      ctx.translate(tx, tgy);
      ctx.strokeStyle = '#141926';
      ctx.fillStyle = '#0c1018';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-36, 0);
      ctx.lineTo(28, -24);
      ctx.moveTo(-22, -2);
      ctx.lineTo(38, -14);
      ctx.moveTo(-14, -22);
      ctx.lineTo(18, -2);
      ctx.stroke();

      // Shattered pitched wooden roof tilted on ground
      ctx.save();
      ctx.translate(10, -14);
      ctx.rotate(worldX < 2300 ? -0.42 : 0.48);
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(0, -18);
      ctx.lineTo(28, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();
      return;
    }

    const towerH = 224;
    const deckY = tgy - towerH;

    // Cross-braced wooden legs
    ctx.strokeStyle = '#111622';
    ctx.fillStyle = '#0b0f18';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(tx - 24, tgy + 2);
    ctx.lineTo(tx - 14, deckY);
    ctx.moveTo(tx + 24, tgy + 2);
    ctx.lineTo(tx + 14, deckY);
    ctx.stroke();

    // X-braces & ladder rungs
    ctx.lineWidth = 2;
    for (let y = tgy - 36; y > deckY + 12; y -= 44) {
      ctx.beginPath();
      ctx.moveTo(tx - 20, y + 36);
      ctx.lineTo(tx + 17, y);
      ctx.moveTo(tx + 20, y + 36);
      ctx.lineTo(tx - 17, y);
      ctx.stroke();
    }

    // Guard platform, railing & pitched wooden roof
    ctx.fillRect(tx - 24, deckY, 48, 8);
    ctx.strokeRect(tx - 21, deckY - 22, 42, 22);
    ctx.fillRect(tx - 21, deckY - 52, 3, 52);
    ctx.fillRect(tx + 18, deckY - 52, 3, 52);
    ctx.beginPath();
    ctx.moveTo(tx - 30, deckY - 50);
    ctx.lineTo(tx, deckY - 68);
    ctx.lineTo(tx + 30, deckY - 50);
    ctx.closePath();
    ctx.fill();

    // Japanese soldier silhouette standing guard with bayoneted Arisaka rifle!
    ctx.fillStyle = '#06090f';
    ctx.fillRect(tx - 5, deckY - 34, 10, 26);
    ctx.beginPath();
    ctx.arc(tx, deckY - 39, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(tx, deckY - 41, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - 6, deckY - 18);
    ctx.lineTo(tx - 14, deckY - 46);
    ctx.stroke();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tx - 14, deckY - 46);
    ctx.lineTo(tx - 17, deckY - 54);
    ctx.stroke();

    // Rotating searchlight lamp housing + gameplay volumetric cone
    const lampX = tx - 16;
    const lampY = deckY - 12;
    const isWarning = beamState === 'warning';
    const isSweepRed = beamState === 'sweep_door' || beamState === 'alert';

    ctx.fillStyle = isSweepRed ? '#ef4444' : isWarning ? '#fb923c' : '#fef08a';
    ctx.beginPath();
    ctx.arc(lampX, lampY, isWarning || isSweepRed ? 6.2 : 4.8, 0, Math.PI * 2);
    ctx.fill();

    const targetWorldX =
      customBeamX !== null ? customBeamX : 2090 + Math.sin(time * 1.35 + phaseOffset) * 145;
    const targetSx = targetWorldX - cameraX;
    const targetGy = getGroundY(targetWorldX);

    const coneGrad = ctx.createLinearGradient(lampX, lampY, targetSx, targetGy);
    if (isSweepRed) {
      coneGrad.addColorStop(0, 'rgba(254, 202, 202, 0.56)');
      coneGrad.addColorStop(0.65, 'rgba(239, 68, 68, 0.22)');
      coneGrad.addColorStop(1, 'rgba(220, 38, 38, 0.03)');
    } else if (isWarning) {
      const blink = 0.42 + Math.abs(Math.sin(time * 14)) * 0.25;
      coneGrad.addColorStop(0, `rgba(254, 215, 170, ${blink})`);
      coneGrad.addColorStop(0.65, 'rgba(249, 115, 22, 0.2)');
      coneGrad.addColorStop(1, 'rgba(234, 88, 12, 0.03)');
    } else {
      coneGrad.addColorStop(0, 'rgba(254, 249, 195, 0.46)');
      coneGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.14)');
      coneGrad.addColorStop(1, 'rgba(253, 224, 71, 0.02)');
    }

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(lampX, lampY);
    ctx.lineTo(targetSx - 54, targetGy);
    ctx.lineTo(targetSx + 54, targetGy);
    ctx.closePath();
    ctx.fill();

    // Crisp ground light pool so stealth hitbox is 100% readable!
    const poolGrad = ctx.createRadialGradient(targetSx, targetGy, 4, targetSx, targetGy, 58);
    poolGrad.addColorStop(
      0,
      isSweepRed
        ? 'rgba(239, 68, 68, 0.44)'
        : isWarning
        ? 'rgba(249, 115, 22, 0.4)'
        : 'rgba(254, 240, 138, 0.36)'
    );
    poolGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.ellipse(targetSx, targetGy, 56, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Tower 1 (Left of Granary, sweeping over the 3 haystacks)
  drawWatchtower(
    2155,
    1.8,
    granaryCombat ? granaryCombat.beam1X : null,
    granaryCombat ? granaryCombat.beam1State : 'normal'
  );

  // Heavy Brick Japanese Granary (x = 2335)
  ctx.fillStyle = '#141114';
  ctx.fillRect(gx - 98, gy - 162, 196, 165);

  // Brick masonry courses & structural pilasters
  ctx.fillStyle = '#0d0b0e';
  for (const px of [-98, -58, 50, 90]) {
    ctx.fillRect(gx + px, gy - 162, 8, 164);
  }
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
  ctx.lineWidth = 1;
  for (let by = gy - 148; by < gy - 10; by += 14) {
    ctx.beginPath();
    ctx.moveTo(gx - 90, by);
    ctx.lineTo(gx + 90, by);
    ctx.stroke();
  }

  // Barred upper ventilation windows
  ctx.fillStyle = '#05070b';
  ctx.fillRect(gx - 82, gy - 142, 20, 14);
  ctx.fillRect(gx + 62, gy - 142, 20, 14);

  // Corrugated metal gable roof (mái tôn gợn sóng)
  ctx.fillStyle = '#1e2532';
  ctx.beginPath();
  ctx.moveTo(gx - 114, gy - 158);
  ctx.lineTo(gx, gy - 208);
  ctx.lineTo(gx + 114, gy - 158);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.26)';
  ctx.lineWidth = 1.6;
  for (let rx = -96; rx <= 96; rx += 16) {
    ctx.beginPath();
    ctx.moveTo(gx + rx * 0.5, gy - 204 + Math.abs(rx) * 0.22);
    ctx.lineTo(gx + rx, gy - 159);
    ctx.stroke();
  }

  // Massive Iron Double Doors (Cửa sắt lớn tán đinh / Bung mở tràn thóc vàng!)
  if (liberated) {
    const glow = ctx.createRadialGradient(gx, gy - 42, 8, gx, gy - 42, 105);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx, gy - 42, 105, 0, Math.PI * 2);
    ctx.fill();

    // Shattered open iron doors swung outward
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(gx - 72, gy - 108, 24, 108);
    ctx.fillRect(gx + 48, gy - 108, 24, 108);

    // Golden mountain of liberated grain pouring out to save the starving people
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(gx - 68, gy + 2);
    ctx.quadraticCurveTo(gx, gy - 90, gx + 68, gy + 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1c212b';
    ctx.fillRect(gx - 46, gy - 110, 92, 110);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.6;
    ctx.strokeRect(gx - 46, gy - 110, 92, 110);
    ctx.beginPath();
    ctx.moveTo(gx, gy - 110);
    ctx.lineTo(gx, gy);
    ctx.moveTo(gx - 46, gy - 56);
    ctx.lineTo(gx + 46, gy - 56);
    ctx.stroke();
    // Heavy padlock & iron crossbars
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(gx - 6, gy - 62, 12, 14);
  }

  // Tower 2 (Right of Granary, sweeping over Granary door with orange/red warning pause)
  drawWatchtower(
    2445,
    0,
    granaryCombat ? granaryCombat.beam2X : null,
    granaryCombat ? granaryCombat.beam2State : 'normal'
  );

  ctx.restore();
}

// ============================================================================
// 3. CÔNG TRÌNH & KHÍ TÀI QUÂN SỰ CHI TIẾT MÀN 2 (1945 – 1954)
// ============================================================================

/**
 * Máy bay khu trục cánh quạt Pháp (Bearcat / Spitfire silhouette có cánh quạt mũi quay tít)
 */
export function drawPropellerFighter(ctx, sx, sy, dir, scale, time) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale((dir < 0 ? -1 : 1) * scale, scale);

  // Sleek fuselage
  ctx.fillStyle = 'rgba(14, 10, 12, 0.9)';
  ctx.beginPath();
  ctx.moveTo(46, 1);
  ctx.quadraticCurveTo(18, -8, -42, -3);
  ctx.lineTo(-48, -15);
  ctx.lineTo(-34, -3);
  ctx.lineTo(-46, 4);
  ctx.quadraticCurveTo(12, 9, 46, 1);
  ctx.fill();

  // Bubble canopy
  ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
  ctx.beginPath();
  ctx.ellipse(6, -6.5, 11, 4, 0, Math.PI, 0);
  ctx.fill();

  // Swept low wing + underwing bomb rack
  ctx.fillStyle = '#090608';
  ctx.beginPath();
  ctx.moveTo(14, 2);
  ctx.lineTo(-8, 13);
  ctx.lineTo(-18, 12);
  ctx.lineTo(-4, 2);
  ctx.closePath();
  ctx.fill();

  // Spinning nose cone + blurred propeller disc
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(46, -2.5);
  ctx.lineTo(53, 1);
  ctx.lineTo(46, 4.5);
  ctx.fill();

  const propLen = 15 * Math.abs(Math.sin(time * 42));
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(52, 1 - propLen - 3);
  ctx.lineTo(52, 1 + propLen + 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Xe thiết giáp / Xe tăng Pháp (M24 Chaffee silhouette) áp sát chiến lũy Hà Nội / Điện Biên
 */
export function drawFrenchTank(ctx, sx, gy, facingDir, time) {
  ctx.save();
  ctx.translate(sx, gy);
  ctx.scale(facingDir, 1);

  // Track assembly & 5 bogie wheels
  ctx.fillStyle = '#120b0b';
  fillRoundedRect(ctx, -58, -22, 116, 22, 10);
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 2;
  for (let wx = -42; wx <= 42; wx += 21) {
    ctx.beginPath();
    ctx.arc(wx, -10, 7.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Angled armored hull
  ctx.fillStyle = '#1f1412';
  ctx.beginPath();
  ctx.moveTo(-62, -20);
  ctx.lineTo(-48, -37);
  ctx.lineTo(46, -37);
  ctx.lineTo(60, -21);
  ctx.closePath();
  ctx.fill();

  // Turret & 75mm cannon barrel
  ctx.fillStyle = '#291a17';
  ctx.beginPath();
  ctx.moveTo(-22, -37);
  ctx.lineTo(-16, -54);
  ctx.lineTo(20, -54);
  ctx.lineTo(26, -37);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#291a17';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(22, -46);
  ctx.lineTo(74, -49 + Math.sin(time * 2) * 0.8);
  ctx.stroke();

  // Subtle French tricolor roundel emblem on hull side
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -29, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Dãy nhà phố cổ Hà Nội 2 tầng sát nhau & KHÔNG GIAN CẮT LỚP 2D (2D Cutaway Interior)
 * tại ngôi nhà phố cổ 2 tầng bị bom đạn bắn vỡ mảng tường (x = 1050..1350):
 * Đi vào tầng 1 -> leo cầu thang gỗ lên gác xép -> ra ban công tầng 2 kích hoạt Loa truyền thanh 19/12/1946!
 */
export function drawOldHanoiStreetscape(ctx, cameraX, width, getGroundY, time) {
  if (cameraX > 1660) return;
  ctx.save();

  // 1. Các ngôi nhà phố cổ Hà Nội liền kề hai bên căn nhà cắt lớp (770..1050 & 1350..1485)
  const exteriorHouses = [
    { x: 770, w: 118, h: 192, roofH: 28, lit: true },
    { x: 888, w: 162, h: 204, roofH: 32, lit: false },
    { x: 1350, w: 136, h: 198, roofH: 30, lit: true },
  ];

  for (const hs of exteriorHouses) {
    const sx = hs.x - cameraX;
    if (sx + hs.w < -80 || sx > width + 80) continue;
    const gy = getGroundY(hs.x + hs.w * 0.5);

    ctx.fillStyle = '#150c0c';
    ctx.fillRect(sx, gy - hs.h, hs.w, hs.h + 4);
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.14)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(sx, gy - hs.h, hs.w, hs.h);

    ctx.fillStyle = '#241413';
    ctx.fillRect(sx - 3, gy - 102, hs.w + 6, 6);

    ctx.fillStyle = '#21100e';
    ctx.beginPath();
    ctx.moveTo(sx - 6, gy - hs.h);
    ctx.lineTo(sx + hs.w * 0.5, gy - hs.h - hs.roofH);
    ctx.lineTo(sx + hs.w + 6, gy - hs.h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.lineWidth = 1.2;
    for (let tx = 12; tx < hs.w; tx += 16) {
      ctx.beginPath();
      ctx.moveTo(sx + hs.w * 0.5, gy - hs.h - hs.roofH);
      ctx.lineTo(sx + tx, gy - hs.h);
      ctx.stroke();
    }

    const winY = gy - 166;
    for (let wx = sx + 22; wx < sx + hs.w - 34; wx += 52) {
      ctx.fillStyle = hs.lit ? 'rgba(251, 146, 60, 0.28)' : '#0b0607';
      ctx.fillRect(wx, winY, 24, 38);
      ctx.strokeStyle = '#3f231d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx, winY, 24, 38);
      ctx.lineWidth = 1;
      for (let sy = winY + 6; sy < winY + 35; sy += 5) {
        ctx.beginPath();
        ctx.moveTo(wx + 2, sy);
        ctx.lineTo(wx + 22, sy);
        ctx.stroke();
      }
    }

    for (let dx = sx + 24; dx < sx + hs.w - 40; dx += 66) {
      ctx.fillStyle = '#090506';
      fillRoundedRect(ctx, dx, gy - 68, 34, 68, [16, 16, 0, 0]);
    }
  }

  // 2. NGÔI NHÀ PHỐ CỔ 2 TẦNG CẮT LỚP 2D (x = 1050..1350, w = 300, h = 236)
  const cutSx = 1050 - cameraX;
  const cutW = 300;
  const cutH = 236;
  if (cutSx + cutW > -90 && cutSx < width + 90) {
    const gy = getGroundY(1200);
    const flicker = 0.88 + Math.sin(time * 9.8) * 0.12;

    // Viền tường gạch & mái ngói đen đặc cắt lớp bao quanh ngôi nhà 2 tầng
    ctx.fillStyle = '#070405';
    ctx.fillRect(cutSx - 8, gy - cutH, cutW + 16, cutH + 4);

    // Mái ngói âm dương phía trên căn nhà cổ bị bom xé rách một góc
    ctx.fillStyle = '#1b0c0b';
    ctx.beginPath();
    ctx.moveTo(cutSx - 12, gy - cutH);
    ctx.lineTo(cutSx + 95, gy - cutH - 36);
    ctx.lineTo(cutSx + 165, gy - cutH - 18); // Vết đạn pháo sứt mái
    ctx.lineTo(cutSx + 225, gy - cutH - 34);
    ctx.lineTo(cutSx + cutW + 12, gy - cutH);
    ctx.closePath();
    ctx.fill();

    // Không gian nội thất 2 tầng cắt lớp bên trong (ấm áp ánh đèn dầu kháng chiến)
    ctx.fillStyle = '#140b0a';
    ctx.fillRect(cutSx + 8, gy - cutH + 10, cutW - 16, cutH - 12);

    // Hai vùng sáng đèn dầu ấm ở Tầng 1 (cầu thang gỗ) & Tầng 2 (ban công loa truyền thanh)
    const glow1 = ctx.createRadialGradient(cutSx + 115, gy - 62, 6, cutSx + 115, gy - 62, 145);
    glow1.addColorStop(0, `rgba(251, 146, 60, ${0.38 * flicker})`);
    glow1.addColorStop(0.6, `rgba(180, 83, 9, ${0.14 * flicker})`);
    glow1.addColorStop(1, 'rgba(10, 5, 5, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(cutSx + 8, gy - 140, cutW - 16, 140);

    const glow2 = ctx.createRadialGradient(cutSx + 235, gy - 178, 5, cutSx + 235, gy - 178, 130);
    glow2.addColorStop(0, `rgba(254, 240, 138, ${0.42 * flicker})`);
    glow2.addColorStop(0.55, `rgba(234, 88, 12, ${0.18 * flicker})`);
    glow2.addColorStop(1, 'rgba(10, 5, 5, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(cutSx + 8, gy - cutH + 10, cutW - 16, 125);

    // Dầm sàn gỗ Tầng 2 (cao độ dy = -142 khớp với p2_tram_top) & Cột gỗ lim trong nhà
    ctx.fillStyle = '#291510';
    ctx.fillRect(cutSx + 178, gy - 142, cutW - 186, 8);
    ctx.fillRect(cutSx + 8, gy - cutH + 10, 10, cutH - 12);
    ctx.fillRect(cutSx + cutW - 16, gy - 134, 10, 134); // Tường phải tầng 1 bị chặn bởi chiến lũy, mở thông ở tầng 2 ra ban công!

    // Đồ đạc nội thất Hà Nội xưa: Tủ chè gỗ, khung tranh hoành phi & vết tường gạch vỡ
    ctx.fillStyle = '#24120d';
    ctx.fillRect(cutSx + 196, gy - 44, 62, 44);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cutSx + 202, gy - 38, 50, 26);
    // Khung bức hoành phi trên tường tầng 1 & tầng 2
    ctx.strokeRect(cutSx + 204, gy - 96, 44, 20);
    ctx.strokeRect(cutSx + 72, gy - 196, 38, 24);

    // Dầm chéo Cầu thang gỗ nội thất dẫn từ cửa Tầng 1 (1070, gy) -> Nhịp 1 (-50) -> Gác xép (-98) -> Tầng 2 (-142)!
    ctx.strokeStyle = '#5c341d';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(cutSx + 24, gy);
    ctx.lineTo(cutSx + 205, gy - 142);
    ctx.stroke();
    // Tay vịn lan can cầu thang gỗ
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.36)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cutSx + 24, gy - 24);
    ctx.lineTo(cutSx + 205, gy - 166);
    ctx.stroke();
    for (let post = 0; post <= 5; post++) {
      const t = post / 5;
      const px = cutSx + 24 + t * 181;
      const py = gy - t * 142;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - 24);
      ctx.stroke();
    }

    // Mép tường gạch nham nhở bị đạn pháo bắn vỡ tạo hiệu ứng Mặt cắt Cutaway chân thực!
    ctx.fillStyle = '#1f0e0c';
    const jaggedLeft = [
      [0, 0],
      [22, -16],
      [14, -46],
      [26, -78],
      [12, -118],
      [28, -162],
      [18, -205],
      [34, -cutH],
      [0, -cutH],
    ];
    ctx.beginPath();
    jaggedLeft.forEach(([jx, jy], idx) => {
      if (idx === 0) ctx.moveTo(cutSx + jx, gy + jy);
      else ctx.lineTo(cutSx + jx, gy + jy);
    });
    ctx.closePath();
    ctx.fill();

    // Cổng vòm mở vào tầng 1 nhà cổ (x = 1052..1094) + Gợi ý leo cầu thang gỗ lên tầng 2
    ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
    ctx.font = '600 10.5px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('▲ Cầu thang lên Tầng 2 [W]', cutSx + 28, gy - 14 + Math.sin(time * 4) * 2.5);
  }

  // 3. Toa tàu điện cũ Hà Nội lật nghiêng làm chiến lũy đầu phố (x = 875..1035, trước cửa nhà cắt lớp)
  const tramX = 875 - cameraX;
  const tramGy = getGroundY(955);
  if (tramX > -240 && tramX < width + 240) {
    ctx.save();
    ctx.translate(tramX, tramGy);
    ctx.fillStyle = '#261411';
    fillRoundedRect(ctx, 0, -62, 160, 60, [8, 8, 2, 2]);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.34)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(2, -60, 156, 56);

    ctx.fillStyle = 'rgba(253, 224, 71, 0.14)';
    for (let w = 14; w < 144; w += 28) {
      ctx.fillRect(w, -50, 18, 20);
    }
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(80, -62);
    ctx.lineTo(122, -88);
    ctx.stroke();

    ctx.fillStyle = '#312118';
    for (let sb = -22; sb <= 156; sb += 24) {
      fillRoundedRect(ctx, sb, -15, 22, 10, 4);
      fillRoundedRect(ctx, sb + 6, -24, 20, 9, 4);
    }
    ctx.restore();
  }

  // Menacing French Armored Tank halted outside the street barricade (x = 695)
  const tankSx = 695 - cameraX;
  if (tankSx > -140 && tankSx < width + 140) {
    drawFrenchTank(ctx, tankSx, getGroundY(695), 1, time);
  }

  ctx.restore();
}

/**
 * Cụm cứ điểm Điện Biên Phủ: 3 Hố giao thông hào, Hàng rào thép gai chữ A, Lô cốt bê tông & Hầm Đờ Cátơri mái vòm thép
 */
export function drawDienBienFortress(
  ctx,
  cameraX,
  width,
  baseGroundY,
  getGroundY,
  completedQtes,
  time,
  dienBienCombat = null
) {
  if (cameraX + width < 2000) return;
  ctx.save();

  // 1. Cọc gỗ gia cố vách 3 Hố giao thông hào Điện Biên Phủ (khớp 100% với groundProfile storyData.js)
  const trenchRanges = [
    [2100, 2190],
    [2276, 2366],
    [2438, 2510],
  ];
  ctx.fillStyle = '#1c110d';
  for (const [t1, t2] of trenchRanges) {
    for (let wx = t1; wx <= t2; wx += 18) {
      const sx = wx - cameraX;
      if (sx < -40 || sx > width + 40) continue;
      const floorY = getGroundY(wx);
      ctx.fillRect(sx - 2, baseGroundY + 2, 4, Math.max(8, floorY - baseGroundY));
    }
  }

  // 2. Hàng rào dây thép gai chữ A (A-frame barbed wire) trên các ụ đất giữa giao thông hào
  const wirePosts = [2080, 2232, 2404];
  for (const wx of wirePosts) {
    const sx = wx - cameraX;
    if (sx < -60 || sx > width + 60) continue;
    const gy = getGroundY(wx);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(sx - 14, gy);
    ctx.lineTo(sx + 12, gy - 28);
    ctx.moveTo(sx + 14, gy);
    ctx.lineTo(sx - 12, gy - 28);
    ctx.stroke();

    // Coiled razor/barbed wire loops
    ctx.strokeStyle = 'rgba(168, 162, 158, 0.55)';
    ctx.lineWidth = 1.2;
    for (let c = -16; c <= 16; c += 8) {
      ctx.beginPath();
      ctx.ellipse(sx + c, gy - 14, 7, 12, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 3. Lô cốt bê tông Pháp có lỗ châu mai & bao cát chất xung quanh (x = 2592)
  const pbShake = dienBienCombat ? dienBienCombat.shakeX || 0 : 0;
  const pbDestroyed =
    completedQtes.has('qte_2a') || Boolean(dienBienCombat && dienBienCombat.pillboxDestroyed);
  const pbX = 2592 - cameraX + pbShake;
  if (pbX > -180 && pbX < width + 180) {
    const gy = getGroundY(2592);
    if (pbDestroyed) {
      // Lô cốt bê tông đã bị bộc phá đánh sập thành đống gạch vụn bốc khói!
      ctx.fillStyle = '#241e1c';
      ctx.beginPath();
      ctx.moveTo(pbX - 44, gy + 2);
      ctx.lineTo(pbX - 28, gy - 16);
      ctx.lineTo(pbX - 8, gy - 10);
      ctx.lineTo(pbX + 12, gy - 20);
      ctx.lineTo(pbX + 40, gy + 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(pbX - 42, gy + 2);
      ctx.lineTo(pbX - 36, gy - 44);
      ctx.lineTo(pbX + 36, gy - 44);
      ctx.lineTo(pbX + 42, gy + 2);
      ctx.closePath();
      ctx.fill();

      // Dark firing embrasure slit (lỗ châu mai) + Red Blinking MG Warning Light!
      ctx.fillStyle = '#050404';
      ctx.fillRect(pbX - 24, gy - 32, 32, 8);

      if (dienBienCombat && (dienBienCombat.mgWarning || dienBienCombat.mgFiring)) {
        const blinkOn =
          dienBienCombat.mgFiring || Math.sin(time * 24) > -0.2;
        if (blinkOn) {
          const warnGlow = ctx.createRadialGradient(pbX - 18, gy - 28, 2, pbX - 18, gy - 28, 30);
          warnGlow.addColorStop(0, 'rgba(239, 68, 68, 0.92)');
          warnGlow.addColorStop(0.55, 'rgba(220, 38, 38, 0.38)');
          warnGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = warnGlow;
          ctx.beginPath();
          ctx.arc(pbX - 18, gy - 28, 30, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = dienBienCombat.mgFiring ? '#fef08a' : '#ef4444';
          ctx.beginPath();
          ctx.arc(pbX - 18, gy - 28, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Stacked sandbags around pillbox base
      ctx.fillStyle = '#3f2e21';
      for (let sb = -44; sb <= 26; sb += 18) {
        fillRoundedRect(ctx, pbX + sb, gy - 11, 17, 9, 3.5);
      }

      // KHỐI BỘC PHÁ HẸN GIỜ 2.0 GIÂY NHẤP NHÁY ĐỎ SÁT VÁCH LÔ CỐT!
      if (dienBienCombat && dienBienCombat.plantedCharge) {
        const pc = dienBienCombat.plantedCharge;
        const urgentBlink = Math.sin(time * (pc.timer < 0.85 ? 38 : 22)) > 0;
        const chargeSx = pbX - 34;
        const chargeSy = gy - 14;

        // Vùng bán kính nổ nguy hiểm nhấp nháy đỏ trên mặt đất phẳng trước Lô cốt (2518..2610)
        ctx.fillStyle = urgentBlink ? 'rgba(239, 68, 68, 0.28)' : 'rgba(239, 68, 68, 0.12)';
        ctx.beginPath();
        ctx.ellipse(chargeSx + 10, gy, 72, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = urgentBlink ? '#f87171' : 'rgba(248, 113, 113, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Ống bộc phá bọc vải đỏ & ngòi nổ xẹt tia lửa vàng rực
        ctx.fillStyle = urgentBlink ? '#ef4444' : '#991b1b';
        fillRoundedRect(ctx, chargeSx - 12, chargeSy - 7, 24, 11, 3);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(chargeSx - 8, chargeSy - 6, 16, 9);

        // Tia lửa dây cháy chậm
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(chargeSx - 14, chargeSy - 3, urgentBlink ? 5.2 : 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Nhãn đồng hồ đếm ngược 2.0s nổi bật giục người chơi lùi nhanh xuống Hào số 3!
        ctx.font = '700 11.5px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = urgentBlink ? '#fef08a' : '#fca5a5';
        ctx.fillText(
          `💥 BỘC PHÁ ${Math.max(0, pc.timer).toFixed(1)}s — LÙI VỀ HÀO!`,
          chargeSx - 8,
          gy - 56
        );
      }
    }
  }

  // 4. Hầm chỉ huy tướng Đờ Cátơri mái vòm thép gấp nếp (x = 2615..2775, dy = -54)
  const bkLeft = 2615 - cameraX;
  const bkRight = 2775 - cameraX;
  if (bkRight > -120 && bkLeft < width + 120) {
    const bw = bkRight - bkLeft;
    const roofY = baseGroundY - 54;
    const gy = baseGroundY;

    // Corrugated steel arch Quonset dome
    ctx.fillStyle = '#1f1917';
    ctx.beginPath();
    ctx.moveTo(bkLeft - 8, gy + 2);
    ctx.quadraticCurveTo(bkLeft - 4, roofY, bkLeft + bw * 0.25, roofY);
    ctx.lineTo(bkRight - bw * 0.25, roofY);
    ctx.quadraticCurveTo(bkRight + 4, roofY, bkRight + 8, gy + 2);
    ctx.closePath();
    ctx.fill();

    // Steel arch ribs
    ctx.strokeStyle = 'rgba(214, 211, 209, 0.28)';
    ctx.lineWidth = 2;
    for (let rx = bkLeft + 16; rx < bkRight - 12; rx += 18) {
      ctx.beginPath();
      ctx.moveTo(rx, roofY + 2);
      ctx.lineTo(rx, gy);
      ctx.stroke();
    }

    // Top sandbag breastwork & radio antenna mast
    ctx.fillStyle = '#36281e';
    for (let sx = bkLeft + 14; sx < bkRight - 22; sx += 20) {
      fillRoundedRect(ctx, sx, roofY - 7, 18, 8, 3.5);
    }
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bkRight - 24, roofY);
    ctx.lineTo(bkRight - 24, roofY - 48);
    ctx.moveTo(bkRight - 34, roofY - 38);
    ctx.lineTo(bkRight - 14, roofY - 38);
    ctx.stroke();

    // Cờ Quyết chiến Quyết thắng tung bay trên nóc hầm khi thắng QTE 2B!
    if (completedQtes.has('qte_2b')) {
      drawWavingFlag(ctx, bkLeft + bw * 0.5, roofY - 98, 72, 44, time, 98, 'national');
    }
  }

  ctx.restore();
}


/**
 * Lễ đài Độc lập Quảng trường Ba Đình (2/9/1945) — Màn 1 (x = 2720)
 */
export function drawBaDinhTribune(ctx, cameraX, width, getGroundY, won1B, time) {
  const bx = 2720 - cameraX;
  if (bx < -280 || bx > width + 280) return;
  const bgy = getGroundY(2720);

  ctx.save();

  // Warm golden-amber historic sunlight halo when QTE 1B is completed
  if (won1B) {
    const sunHalo = ctx.createRadialGradient(bx, bgy - 165, 16, bx, bgy - 165, 240);
    sunHalo.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    sunHalo.addColorStop(0.55, 'rgba(245, 158, 11, 0.16)');
    sunHalo.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunHalo;
    ctx.beginPath();
    ctx.arc(bx, bgy - 165, 240, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stepped wooden Independence Tribune (Lễ đài Độc lập Ba Đình)
  ctx.fillStyle = '#12151f';
  ctx.fillRect(bx - 118, bgy - 134, 236, 138);
  ctx.fillStyle = '#191d2b';
  ctx.fillRect(bx - 68, bgy - 176, 136, 44);
  // Balustrade trim & cornice
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.32)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(bx - 116, bgy - 132, 232, 130);
  ctx.strokeRect(bx - 66, bgy - 174, 132, 42);

  // Tall crimson revolutionary banners draped on both sides of the tribune
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(bx - 96, bgy - 124, 20, 96);
  ctx.fillRect(bx + 76, bgy - 124, 20, 96);
  drawStar(ctx, bx - 86, bgy - 96, 5, 5.5, 2.2, '#facc15');
  drawStar(ctx, bx + 86, bgy - 96, 5, 5.5, 2.2, '#facc15');

  // Historic microphone stand & podium silhouette at center top of tribune
  ctx.fillStyle = '#07090f';
  ctx.fillRect(bx - 10, bgy - 196, 20, 20);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx, bgy - 196);
  ctx.lineTo(bx, bgy - 207);
  ctx.arc(bx, bgy - 209, 2.5, 0, Math.PI * 2);
  ctx.stroke();

  // Giant Red Flag with Yellow Star flying high above Ba Đình Square
  drawWavingFlag(ctx, bx, bgy - 266, 74, 46, time, 90, 'national');

  // Sea of compatriots & militia silhouettes cheering below the tribune
  for (let i = -5; i <= 5; i++) {
    if (i === 0 || i === -1) continue;
    const cx = bx + i * 33;
    const bob = won1B ? Math.abs(Math.sin(time * 6.8 + i * 0.9)) * 7.5 : 0;
    ctx.fillStyle = '#070a10';
    ctx.beginPath();
    ctx.arc(cx, bgy - 53 - bob, 7.2, 0, Math.PI * 2);
    ctx.fill();
    fillRoundedRect(ctx, cx - 7, bgy - 44 - bob, 14, 46 + bob, 3);

    // Raised arms & small hand flags when celebrating Independence!
    if (won1B && Math.abs(i) % 2 === 1) {
      ctx.strokeStyle = '#070a10';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(cx + 4, bgy - 38 - bob);
      ctx.lineTo(cx + 10, bgy - 66 - bob);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx + 10, bgy - 74 - bob, 12, 8);
    }
  }

  ctx.restore();
}

// ============================================================================
// 4. CÔNG TRÌNH & KHÍ TÀI QUÂN SỰ CHI TIẾT MÀN 3 (1954 – 1975)
// ============================================================================

/**
 * Không gian cắt lớp 2D (2D Cutaway Underground):
 * Hầm chữ A chỉ huy Trường Sơn sâu dưới rễ cây cổ thụ rừng già (x = 450..750, dy = +170px),
 * bên trong có khung gỗ chữ A chống bom, bếp Hoàng Cầm ấm áp và bàn tác chiến đặt Bức thư Đại hội III!
 */
export function drawRockCaveLiaisonPost(ctx, cameraX, width, getGroundY, time) {
  const centerX = 600 - cameraX;
  if (centerX < -260 || centerX > width + 260) return;

  const surfaceY = getGroundY(442); // Mặt đất rừng Trường Sơn (dy = 0)
  const bunkerFloorY = getGroundY(600); // Đáy Hầm chữ A ngầm (dy = +170)
  const depth = Math.max(120, bunkerFloorY - surfaceY);
  const innerLeft = centerX - 136; // world x = 464
  const innerRight = centerX + 136; // world x = 736

  ctx.save();

  // 1. CÂY CỔ THỤ RỪNG GIÀ TRƯỜNG SƠN & BỘ RỄ BẠNH VÈ TRÊN NÓC HẦM (surfaceY)
  ctx.fillStyle = '#041017';
  // Thân cây đại ngàn vươn cao che rợp nóc hầm chữ A
  ctx.beginPath();
  ctx.moveTo(centerX - 42, surfaceY + 4);
  ctx.quadraticCurveTo(centerX - 18, surfaceY - 48, centerX - 14, surfaceY - 168);
  ctx.lineTo(centerX - 66, surfaceY - 216);
  ctx.lineTo(centerX - 50, surfaceY - 224);
  ctx.lineTo(centerX - 4, surfaceY - 178);
  ctx.lineTo(centerX + 18, surfaceY - 182);
  ctx.lineTo(centerX + 74, surfaceY - 220);
  ctx.lineTo(centerX + 86, surfaceY - 208);
  ctx.lineTo(centerX + 26, surfaceY - 162);
  ctx.quadraticCurveTo(centerX + 34, surfaceY - 46, centerX + 72, surfaceY + 4);
  ctx.closePath();
  ctx.fill();

  // Tán lá rừng già Trường Sơn rậm rạp
  ctx.fillStyle = '#061822';
  for (const [cx, cy, cr] of [
    [0, -225, 76],
    [-64, -206, 52],
    [72, -204, 56],
  ]) {
    ctx.beginPath();
    ctx.arc(centerX + cx, surfaceY + cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. NỀN ĐẤT ĐÁ ĐEN ĐẶC CẮT LỚP BAO QUANH HẦM CHỮ A (Pitch-Black Cutaway Earth)
  ctx.fillStyle = '#020609';
  ctx.fillRect(centerX - 176, surfaceY, 352, depth + 36);

  // Khoang hầm ngầm bên dưới (chừa giếng cầu thang mở bên trái x = 464..552)
  ctx.fillStyle = '#07131a';
  ctx.fillRect(innerLeft, surfaceY + 30, innerRight - innerLeft, depth - 28);
  ctx.fillRect(innerLeft, surfaceY + 2, 88, 32);

  // Trần đất đá đen đặc dày 30px phía trên nóc hầm (x = 552..744) + Rễ cây đâm xuyên lớp đất
  ctx.fillStyle = '#03080d';
  ctx.fillRect(centerX - 48, surfaceY + 2, 192, 30);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.2;
  for (const rx of [-28, 16, 62, 108]) {
    ctx.beginPath();
    ctx.moveTo(centerX + rx, surfaceY + 2);
    ctx.quadraticCurveTo(centerX + rx - 6, surfaceY + 18, centerX + rx + 5, surfaceY + 35);
    ctx.stroke();
  }

  // 3. ÁNH LỬA BẾP HOÀNG CẦM ẤM ÁP THẮP SÁNG RIÊNG TRONG HẦM CHỮ A
  const flicker = 0.87 + Math.sin(time * 11.5) * 0.13;
  const fireX = centerX - 18; // world x = 582
  const tableX = centerX + 42; // world x = 642 (nơi đặt act3_item1!)
  const fireGlow = ctx.createRadialGradient(fireX + 18, bunkerFloorY - 34, 6, fireX + 18, bunkerFloorY - 34, 168);
  fireGlow.addColorStop(0, `rgba(251, 146, 60, ${0.54 * flicker})`);
  fireGlow.addColorStop(0.42, `rgba(234, 88, 12, ${0.25 * flicker})`);
  fireGlow.addColorStop(0.78, `rgba(180, 83, 9, ${0.09 * flicker})`);
  fireGlow.addColorStop(1, 'rgba(3, 8, 12, 0)');
  ctx.fillStyle = fireGlow;
  ctx.fillRect(innerLeft, surfaceY + 4, innerRight - innerLeft, depth - 2);

  // 4. HỆ KÈO GỖ RỪNG CHỮ A ĐẶC TRƯNG TRƯỜNG SƠN (Iconic A-Frame Timber Bracing!)
  ctx.strokeStyle = '#3b2416';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const aFrames = [centerX - 8, centerX + 68];
  for (const ax of aFrames) {
    ctx.beginPath();
    ctx.moveTo(ax - 54, bunkerFloorY);
    ctx.lineTo(ax, surfaceY + 34);
    ctx.lineTo(ax + 54, bunkerFloorY);
    // Thanh giằng ngang chữ A!
    ctx.moveTo(ax - 29, surfaceY + 34 + (depth - 34) * 0.54);
    ctx.lineTo(ax + 29, surfaceY + 34 + (depth - 34) * 0.54);
    ctx.stroke();
  }
  // Lớp gỗ tròn lát trần chống mảnh bom trên đỉnh chữ A
  ctx.fillStyle = '#291910';
  for (let lx = centerX - 46; lx <= centerX + 126; lx += 14) {
    ctx.beginPath();
    ctx.arc(lx, surfaceY + 31, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cầu thang gỗ dốc từ cửa hầm (x = 468, surfaceY) xuống đáy Hầm chữ A (+56, +114, +170)
  ctx.strokeStyle = '#4a2e1b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(innerLeft + 8, surfaceY + 5);
  ctx.lineTo(centerX - 10, bunkerFloorY);
  ctx.moveTo(innerLeft + 22, surfaceY + 5);
  ctx.lineTo(centerX + 4, bunkerFloorY);
  ctx.stroke();
  ctx.fillStyle = '#623d24';
  for (let s = 1; s <= 7; s++) {
    const t = s / 8;
    const sxStep = innerLeft + 10 + t * 110;
    const syStep = surfaceY + 6 + t * (depth - 8);
    ctx.fillRect(sxStep - 12, syStep, 28, 4.5);
  }

  // Bếp Hoàng Cầm âm đất tản khói & Nồi quân dụng + Bàn tre chỉ huy (x = 642)
  ctx.fillStyle = '#1c1411';
  ctx.fillRect(fireX - 18, bunkerFloorY - 12, 36, 12);
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(fireX - 9, bunkerFloorY - 6);
  ctx.quadraticCurveTo(
    fireX + Math.sin(time * 14) * 2.5,
    bunkerFloorY - 29 * flicker,
    fireX + 9,
    bunkerFloorY - 6
  );
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(fireX - 4.5, bunkerFloorY - 6);
  ctx.quadraticCurveTo(
    fireX + Math.cos(time * 16) * 2,
    bunkerFloorY - 19 * flicker,
    fireX + 4.5,
    bunkerFloorY - 6
  );
  ctx.fill();

  // Bàn tre dã chiến nơi đặt Bức thư Đại hội III (tableX = world x 642)
  ctx.fillStyle = '#3f2a18';
  ctx.fillRect(tableX - 28, bunkerFloorY - 24, 56, 4.5);
  ctx.fillRect(tableX - 22, bunkerFloorY - 20, 4.5, 20);
  ctx.fillRect(tableX + 18, bunkerFloorY - 20, 4.5, 20);

  // Viền cắt lớp hầm chữ A & Cửa nắp hầm ngụy trang lá rừng trên mặt đất
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(innerLeft, surfaceY + 31, innerRight - innerLeft, depth - 31);

  const arrowBob = Math.sin(time * 4.2) * 3;
  ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
  ctx.font = '600 10.5px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▼ Hầm chữ A [S]', innerLeft + 44, surfaceY - 14 + arrowBob);

  ctx.restore();
}

/**
 * Cầu treo Trường Sơn có dây văng & ván gỗ đung đưa trên vực suối sâu (x = 1040..1410)
 */
export function drawTruongSonSuspensionBridge(
  ctx,
  sx1,
  sx2,
  bridgeY,
  gorgeFloorY,
  time
) {
  const pw = sx2 - sx1;
  ctx.save();

  // Rushing mountain stream foaming at the bottom of the gorge (gorgeFloorY ~ baseGroundY + 62)
  const waterY = gorgeFloorY - 12;
  const streamGrad = ctx.createLinearGradient(0, waterY, 0, gorgeFloorY + 14);
  streamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
  streamGrad.addColorStop(1, 'rgba(14, 116, 144, 0.2)');
  ctx.fillStyle = streamGrad;
  ctx.fillRect(sx1 + 24, waterY, pw - 48, 22);

  ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.lineWidth = 1.5;
  for (let wx = sx1 + 42; wx < sx2 - 52; wx += 36) {
    const shift = Math.sin(time * 3.4 + wx * 0.05) * 7;
    ctx.beginPath();
    ctx.moveTo(wx + shift, waterY + 5);
    ctx.lineTo(wx + shift + 18, waterY + 5);
    ctx.stroke();
  }

  // Twin A-frame timber suspension towers on both cliff banks
  const towerH = 64;
  ctx.strokeStyle = '#0c222e';
  ctx.fillStyle = '#071720';
  ctx.lineWidth = 5;
  for (const tx of [sx1 + 4, sx2 - 4]) {
    ctx.beginPath();
    ctx.moveTo(tx - 11, bridgeY + 16);
    ctx.lineTo(tx, bridgeY - towerH);
    ctx.lineTo(tx + 11, bridgeY + 16);
    ctx.stroke();
    ctx.fillRect(tx - 9, bridgeY - towerH + 14, 18, 5);
  }

  // Swaying catenary main cables (upper handrail cable + lower deck cable)
  const midSway = Math.sin(time * 2.2) * 3.2;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.58)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(sx1 + 4, bridgeY - towerH + 4);
  ctx.quadraticCurveTo((sx1 + sx2) * 0.5, bridgeY - 10 + midSway, sx2 - 4, bridgeY - towerH + 4);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.42)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx1 + 4, bridgeY - towerH + 22);
  ctx.quadraticCurveTo((sx1 + sx2) * 0.5, bridgeY + 2 + midSway, sx2 - 4, bridgeY - towerH + 22);
  ctx.stroke();

  // Vertical suspender ropes & individual wooden planks gently bobbing
  ctx.lineWidth = 1.1;
  for (let x = sx1 + 12; x < sx2 - 14; x += 16) {
    const u = (x - sx1) / pw;
    const archFactor = Math.sin(u * Math.PI);
    const plankBob = archFactor * midSway * 0.65;
    const cableY =
      (1 - u) * (1 - u) * (bridgeY - towerH + 4) +
      2 * (1 - u) * u * (bridgeY - 10 + midSway) +
      u * u * (bridgeY - towerH + 4);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)';
    ctx.beginPath();
    ctx.moveTo(x + 5, cableY);
    ctx.lineTo(x + 5, bridgeY + plankBob);
    ctx.stroke();

    ctx.fillStyle = '#1b2e3b';
    ctx.fillRect(x, bridgeY + plankBob, 12, 6);
    ctx.fillStyle = 'rgba(253, 230, 138, 0.24)';
    ctx.fillRect(x, bridgeY + plankBob, 12, 1.5);
  }

  ctx.restore();
}

/**
 * Đoàn xe tải quân sự Trường Sơn ("Xe không kính" Zil-130 / Giải Phóng) vượt dốc núi xa
 */
export function drawTruongSonTruckConvoy(ctx, cameraX, width, baseGroundY, time, palette) {
  ctx.save();

  // Sloped mountain supply road in mid-distance (world x ~ 420..1980)
  for (let i = 0; i < 3; i++) {
    const loopSpan = 1380;
    const progress = ((time * 34 + i * 460) % loopSpan) / loopSpan;
    const wx = 420 + progress * loopSpan;
    const sx = wx - cameraX * 0.68;
    if (sx < -120 || sx > width + 120) continue;

    // Road climbs steadily up the Trường Sơn mountain ridge
    const climbY = baseGroundY - 92 - Math.sin(progress * Math.PI) * 52 - progress * 22;
    const slopeAngle = -0.08 * Math.cos(progress * Math.PI);

    ctx.save();
    ctx.translate(sx, climbY);
    ctx.rotate(slopeAngle);
    ctx.scale(0.68, 0.68);

    // Warm hooded headlight beam piercing Trường Sơn mist
    const beam = ctx.createLinearGradient(34, -18, 108, -4);
    beam.addColorStop(0, 'rgba(254, 240, 138, 0.36)');
    beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(34, -19);
    ctx.lineTo(110, -28);
    ctx.lineTo(110, 2);
    ctx.closePath();
    ctx.fill();

    // Covered canvas cargo bed (thùng bạt quân sự)
    ctx.fillStyle = palette.nearSil;
    fillRoundedRect(ctx, -44, -44, 52, 28, [8, 8, 2, 2]);
    // Truck cab & engine hood ("Xe không kính")
    ctx.beginPath();
    ctx.moveTo(8, -40);
    ctx.lineTo(22, -40);
    ctx.lineTo(27, -27);
    ctx.lineTo(38, -24);
    ctx.lineTo(38, -14);
    ctx.lineTo(8, -14);
    ctx.closePath();
    ctx.fill();

    // Open windshield frame + camouflage branches tied on cab roof
    ctx.fillStyle = 'rgba(167, 243, 208, 0.25)';
    ctx.fillRect(12, -37, 10, 9);
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -40);
    ctx.lineTo(6, -50);
    ctx.moveTo(19, -40);
    ctx.lineTo(24, -49);
    ctx.stroke();

    // 3 heavy truck tires
    ctx.fillStyle = '#03080c';
    for (const wxWheel of [-32, -14, 26]) {
      ctx.beginPath();
      ctx.arc(wxWheel, -11, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wxWheel, -11, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Khẩu đội Pháo cao xạ phòng không 37mm đặt trên mỏm đồi cao (x = 1728, dy = -82)
 */
export function drawAntiAircraft37mmBattery(
  ctx,
  cameraX,
  width,
  getGroundY,
  time,
  worldX = 1728,
  recoil = 0,
  aimAngle = null
) {
  const sx = worldX - cameraX;
  if (sx < -220 || sx > width + 220) return;
  const gy = getGroundY(worldX); // Hilltop at baseGroundY - 82!

  ctx.save();
  ctx.translate(sx, gy);

  // Circular sandbagged AA gun emplacement revetment (công sự bao cát mỏm đồi)
  ctx.fillStyle = '#1c1815';
  for (let row = 0; row < 2; row++) {
    for (let bx = -58 + row * 6; bx <= 42 - row * 6; bx += 19) {
      fillRoundedRect(ctx, bx, -11 - row * 8, 18, 9, 3.5);
    }
  }

  // 4-wheel AA carriage frame & outriggers
  ctx.fillStyle = '#091318';
  ctx.fillRect(-38, -16, 76, 6);
  ctx.beginPath();
  ctx.arc(-24, -10, 9, 0, Math.PI * 2);
  ctx.arc(24, -10, 9, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal mount & gunners' seats
  ctx.fillStyle = '#0f2027';
  ctx.fillRect(-10, -34, 20, 20);

  // 2 Anti-Aircraft Gunners wearing steel helmets & foliage camo rings
  ctx.fillStyle = '#071116';
  ctx.fillRect(-31, -38, 12, 22);
  ctx.beginPath();
  ctx.arc(-25, -44, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(19, -38, 12, 22);
  ctx.beginPath();
  ctx.arc(25, -44, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Twin 37mm Anti-Aircraft Barrels + Sloped Armor Shield tracking skyward!
  const skyTrackAngle =
    aimAngle !== null ? aimAngle : -0.82 + Math.sin(time * 1.5 + worldX * 0.01) * 0.1;
  ctx.save();
  ctx.translate(0, -32);
  ctx.rotate(skyTrackAngle);

  // Sloped armored gun shield
  ctx.fillStyle = '#162c35';
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(8, -14);
  ctx.lineTo(6, 12);
  ctx.lineTo(-8, 12);
  ctx.closePath();
  ctx.fill();

  const kick = recoil * 11;
  // Long twin 37mm cannon barrels + conical flash suppressors
  ctx.strokeStyle = '#1e3a44';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(-kick, -4);
  ctx.lineTo(58 - kick, -4);
  ctx.moveTo(-kick, 3);
  ctx.lineTo(54 - kick, 3);
  ctx.stroke();

  // Rim highlight along upper 37mm barrel
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.42)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(6 - kick, -5.5);
  ctx.lineTo(58 - kick, -5.5);
  ctx.stroke();

  // Flash hider cone
  ctx.fillStyle = '#0f2027';
  ctx.beginPath();
  ctx.moveTo(58 - kick, -6.5);
  ctx.lineTo(65 - kick, -8.5);
  ctx.lineTo(65 - kick, -0.5);
  ctx.lineTo(58 - kick, -2);
  ctx.closePath();
  ctx.fill();

  // Blazing twin-37mm muzzle flash when firing!
  if (recoil > 0.35) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(65 - kick, -4.5);
    ctx.lineTo(92 - kick, -12);
    ctx.lineTo(82 - kick, -2);
    ctx.lineTo(94 - kick, 5);
    ctx.lineTo(65 - kick, 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Xe tăng T-54 số hiệu 390 lịch sử:
 * - Rõ 5 bánh xích lớn chuyển động + bánh dẫn hướng & bánh chủ động
 * - Tháp pháo tròn đúc, nòng pháo 100mm dài có bầu hút khói
 * - Cờ Mặt trận Dân tộc Giải phóng miền Nam (nửa đỏ nửa xanh, sao vàng) tung bay trên tháp pháo!
 */
export function drawTank390Detailed(ctx, sx, groundY, isMoving, time) {
  ctx.save();
  const engineRumble = isMoving ? Math.sin(time * 28) * 1.1 : 0;
  ctx.translate(sx, groundY + engineRumble);

  // 1. Caterpillar track assembly (băng xích thép)
  ctx.fillStyle = '#0b1118';
  fillRoundedRect(ctx, -84, -29, 168, 29, 14);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(-84, -29, 168, 29, 14);
  } else {
    ctx.rect(-84, -29, 168, 29);
  }
  ctx.stroke();

  // Animated track tread cleats along bottom & top runs
  const treadShift = isMoving ? (time * 95) % 12 : 0;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.6;
  for (let tx = -72 + treadShift; tx <= 72; tx += 12) {
    ctx.beginPath();
    ctx.moveTo(tx, -29);
    ctx.lineTo(tx + 4, -29);
    ctx.moveTo(tx, -1);
    ctx.lineTo(tx - 4, -1);
    ctx.stroke();
  }

  // Front idler wheel & rear drive sprocket
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(71, -18, 7.5, 0, Math.PI * 2);
  ctx.arc(-71, -18, 8.2, 0, Math.PI * 2);
  ctx.fill();

  // 5 DISTINCT LARGE T-54 ROADWHEELS (5 bánh xích lớn chuyển động có nan hoa!)
  const wheelPositions = [-50, -25, 0, 25, 50];
  const wheelRot = isMoving ? time * 9.5 : 0.4;
  for (let i = 0; i < 5; i++) {
    const wx = wheelPositions[i];
    const wy = -12.5;
    // Rubber-rimmed steel roadwheel
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wx, wy, 10.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(wx, wy, 8.8, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating hub spokes so motion is unmistakable!
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.3;
    for (let s = 0; s < 3; s++) {
      const ang = wheelRot + i * 0.4 + (s * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(ang) * 7.8, wy + Math.sin(ang) * 7.8);
      ctx.stroke();
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Sloped Armored T-54 Hull + External Rear Fuel Drums + Mudguards
  ctx.fillStyle = '#143328';
  ctx.beginPath();
  ctx.moveTo(-88, -26);
  ctx.lineTo(-76, -45);
  ctx.lineTo(66, -45);
  ctx.lineTo(88, -27);
  ctx.closePath();
  ctx.fill();

  // Hull top rim-light
  ctx.strokeStyle = 'rgba(167, 243, 208, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-76, -45);
  ctx.lineTo(66, -45);
  ctx.lineTo(88, -27);
  ctx.stroke();

  // Rear auxiliary fuel drums
  ctx.fillStyle = '#0e241c';
  fillRoundedRect(ctx, -86, -49, 18, 12, 4);
  // Splash guard & headlight on glacis plate
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(70, -38, 3, 0, Math.PI * 2);
  ctx.fill();

  // 3. Signature Hemispherical Cast T-54 Turret (Tháp pháo tròn đúc đặc trưng)
  ctx.fillStyle = '#193f32';
  ctx.beginPath();
  ctx.moveTo(-38, -45);
  ctx.bezierCurveTo(-36, -74, 28, -74, 34, -45);
  ctx.closePath();
  ctx.fill();

  // Commander cupola & anti-aircraft DShK 12.7mm mount on turret roof
  ctx.fillStyle = '#112b22';
  fillRoundedRect(ctx, -18, -72, 18, 7, 3);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-4, -72);
  ctx.lineTo(18, -78);
  ctx.stroke();

  // 4. Long 100mm D-10T Rifled Cannon Barrel + Bore Evacuator (Nòng pháo dài)
  ctx.strokeStyle = '#193f32';
  ctx.lineWidth = 7.2;
  ctx.beginPath();
  ctx.moveTo(28, -56);
  ctx.lineTo(122, -62);
  ctx.stroke();

  // Signature T-54 bore evacuator cylinder near muzzle
  ctx.strokeStyle = '#225443';
  ctx.lineWidth = 10.5;
  ctx.beginPath();
  ctx.moveTo(92, -60.1);
  ctx.lineTo(108, -61.1);
  ctx.stroke();

  // Crisp White Number "390" & Golden Star on Turret Side!
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 12.5px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('390', -6, -50);
  drawStar(ctx, 18, -55, 5, 5.5, 2.3, '#facc15');

  // 5. Lá cờ Mặt trận Dân tộc Giải phóng miền Nam (nửa đỏ nửa xanh, sao vàng) tung bay trên tháp pháo!
  drawWavingFlag(ctx, -16, -120, 48, 30, time, 50, 'liberation');

  ctx.restore();
}

/**
 * Tòa nhà Dinh Độc Lập (hàng cột dọc rèm hoa đá đặc trưng, lầu tứ phương) & Cổng sắt lớn
 */
export function drawIndependencePalaceDetailed(
  ctx,
  cameraX,
  width,
  getGroundY,
  won3B,
  activeQte,
  tankProgress,
  time,
  tank390Override = null
) {
  const gateX = 2645 - cameraX;
  const palaceX = 2765 - cameraX;
  const tankLeftCheck = tank390Override ? tank390Override.x - cameraX : gateX;
  if (palaceX < -320 || Math.min(gateX, tankLeftCheck) > width + 320) return;

  const pgy = getGroundY(2700);
  ctx.save();

  // 1. Tòa nhà Dinh Độc Lập (Modernist landmark by Ngô Viết Thụ)
  const bodyW = 308;
  const bodyH = 192;
  const leftX = palaceX - bodyW * 0.5;

  // Main horizontal modernist massing
  ctx.fillStyle = 'rgba(26, 38, 56, 0.92)';
  ctx.fillRect(leftX, pgy - bodyH, bodyW, bodyH + 4);

  // Overhanging horizontal sun-breakers (mái hiên ngang vươn rộng)
  ctx.fillStyle = '#334155';
  ctx.fillRect(leftX - 10, pgy - bodyH, bodyW + 20, 8);
  ctx.fillRect(leftX - 6, pgy - 116, bodyW + 12, 6);
  ctx.fillRect(leftX - 6, pgy - 54, bodyW + 12, 6);

  // Characteristic vertical white stone sun-louvre columns (hàng cột dọc rèm hoa đá đặc trưng)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.44)';
  ctx.lineWidth = 2.4;
  for (let colX = leftX + 12; colX <= leftX + bodyW - 12; colX += 11) {
    // Upper 2nd & 3rd floor vertical stone fins
    ctx.beginPath();
    ctx.moveTo(colX, pgy - bodyH + 8);
    ctx.lineTo(colX, pgy - 54);
    ctx.stroke();
  }

  // Central ceremonial portico & grand entrance ramp
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(palaceX - 48, pgy - 62, 96, 62);
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.32)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(palaceX - 48, pgy - 62, 96, 62);

  // Rooftop "Tứ phương vô sự lầu" pavilion
  ctx.fillStyle = '#1e2c42';
  ctx.fillRect(palaceX - 68, pgy - bodyH - 36, 136, 36);
  ctx.fillStyle = '#475569';
  ctx.fillRect(palaceX - 78, pgy - bodyH - 42, 156, 6);

  // Liberation Flag raised high atop Independence Palace roof at 11:30 30/4/1975!
  if (won3B) {
    drawWavingFlag(ctx, palaceX, pgy - bodyH - 114, 76, 46, time, 72, 'liberation');
  }

  // 2. Massive Stone Gate Pillars & Ornate Wrought-Iron Main Gate (Cổng sắt lớn Dinh Độc Lập)
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(gateX - 15, pgy - 146, 22, 148);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(gateX - 18, pgy - 152, 28, 7);

  ctx.save();
  ctx.translate(gateX, pgy);
  if (won3B) {
    // Crushed flat on the courtyard ground after Tank 390 rams through!
    ctx.rotate(1.36);
  } else if (tank390Override && tank390Override.gateCrushRatio > 0) {
    ctx.rotate(tank390Override.gateCrushRatio * 1.36);
  } else if (activeQte && activeQte.id === 'qte_3b') {
    ctx.rotate(tankProgress * 0.52);
  }

  // Heavy wrought-iron gate leaf with vertical spear pickets & horizontal crossbars
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.6;
  ctx.strokeRect(-2, -132, 54, 132);
  ctx.beginPath();
  ctx.moveTo(-2, -98);
  ctx.lineTo(52, -98);
  ctx.moveTo(-2, -32);
  ctx.lineTo(52, -32);
  ctx.stroke();

  ctx.lineWidth = 2.0;
  for (let bar = 6; bar < 50; bar += 7) {
    ctx.beginPath();
    ctx.moveTo(bar, -138);
    ctx.lineTo(bar, 0);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Historic Tank 390 escort / charging / triumphant through the gate!
  const tankWorldX = tank390Override
    ? tank390Override.x
    : won3B
    ? 2690
    : 2475 + tankProgress * 165;
  const isTankMoving = tank390Override
    ? Boolean(tank390Override.isMoving)
    : Boolean(activeQte && activeQte.id === 'qte_3b' && !won3B);
  drawTank390Detailed(ctx, tankWorldX - cameraX, getGroundY(tankWorldX), isTankMoving, time);

  ctx.restore();
}

// ============================================================================
// 5. ĐÔ THỊ HIỆN ĐẠI, ĐÀI TƯỞNG NIỆM ĐỒI TAM CẤP & 6 ANH LINH CHÀO QUÂN SỰ (MÀN 4)
// ============================================================================

/**
 * Các tòa cao ốc sáng đèn cửa sổ & Cầu dây văng nhiều nhịp cáp hiện đại (Far/Mid Parallax Màn 4)
 */
export function drawModernSkylineAndBridge(ctx, cameraX, width, baseGroundY, time, palette) {
  ctx.save();

  const towers = [
    { x: 160, w: 62, h: 178, spire: false },
    { x: 320, w: 54, h: 228, spire: false },
    { x: 510, w: 74, h: 318, spire: true }, // Iconic Landmark 81-inspired stepped supertall
    { x: 690, w: 58, h: 196, spire: false },
    { x: 910, w: 66, h: 248, spire: false },
    { x: 1480, w: 64, h: 274, spire: true },
    { x: 1670, w: 74, h: 205, spire: false },
  ];

  for (const b of towers) {
    const bx = b.x - cameraX * 0.22;
    if (bx < -140 || bx > width + 140) continue;

    ctx.fillStyle = palette.farHill;
    ctx.fillRect(bx, baseGroundY - b.h, b.w, b.h + 40);
    if (b.spire) {
      ctx.fillRect(bx + b.w * 0.18, baseGroundY - b.h - 32, b.w * 0.64, 32);
      ctx.beginPath();
      ctx.moveTo(bx + b.w * 0.42, baseGroundY - b.h - 32);
      ctx.lineTo(bx + b.w * 0.5, baseGroundY - b.h - 78);
      ctx.lineTo(bx + b.w * 0.58, baseGroundY - b.h - 32);
      ctx.fill();
    }

    // Glowing lit office/apartment window grid!
    ctx.fillStyle = 'rgba(254, 243, 199, 0.34)';
    for (let wy = baseGroundY - b.h + 16; wy < baseGroundY - 68; wy += 16) {
      for (let wx = bx + 9; wx < bx + b.w - 12; wx += 13) {
        if (((wx * 7 + wy * 13) % 5) !== 0) {
          ctx.fillRect(wx, wy, 7, 8);
        }
      }
    }
  }

  // Multi-span Cable-Stayed Bridge (Cầu dây văng nhiều nhịp cáp thanh thoát)
  const p1X = 1090 - cameraX * 0.22;
  const p2X = 1340 - cameraX * 0.22;
  const deckY = baseGroundY - 102;
  if (p2X > -280 && p1X < width + 280) {
    ctx.fillStyle = palette.farHill;
    ctx.fillRect(p1X - 180, deckY, p2X - p1X + 360, 7);

    for (const pyX of [p1X, p2X]) {
      // A-shaped cable pylon
      ctx.beginPath();
      ctx.moveTo(pyX - 11, baseGroundY + 10);
      ctx.lineTo(pyX - 4, baseGroundY - 246);
      ctx.lineTo(pyX + 4, baseGroundY - 246);
      ctx.lineTo(pyX + 11, baseGroundY + 10);
      ctx.closePath();
      ctx.fill();

      // Fan-harp stay cables
      ctx.strokeStyle = 'rgba(255, 251, 235, 0.38)';
      ctx.lineWidth = 1.2;
      for (let c = 1; c <= 7; c++) {
        const anchorTopY = baseGroundY - 238 + c * 11;
        ctx.beginPath();
        ctx.moveTo(pyX, anchorTopY);
        ctx.lineTo(pyX - c * 22, deckY);
        ctx.moveTo(pyX, anchorTopY);
        ctx.lineTo(pyX + c * 22, deckY);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * Đoàn tàu Metro hiện đại chạy êm trên đường ray cầu cạn trên cao (Mid-Far Parallax Màn 4)
 */
export function drawElevatedMetroLine(ctx, cameraX, width, baseGroundY, time) {
  ctx.save();
  const viaductY = baseGroundY - 172;

  // Concrete box-girder viaduct & acoustic parapet
  ctx.fillStyle = 'rgba(30, 58, 86, 0.52)';
  ctx.fillRect(-40, viaductY, width + 80, 12);
  ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
  ctx.fillRect(-40, viaductY - 4, width + 80, 4);

  // Overhead catenary masts & contact wire
  ctx.strokeStyle = 'rgba(51, 85, 118, 0.45)';
  ctx.lineWidth = 1.5;
  for (let px = 120; px <= 2950; px += 220) {
    const psx = px - cameraX * 0.52;
    if (psx >= -40 && psx <= width + 40) {
      ctx.fillStyle = 'rgba(30, 58, 86, 0.48)';
      ctx.fillRect(psx - 8, viaductY + 12, 16, 175);
      // Catenary mast above track
      ctx.beginPath();
      ctx.moveTo(psx, viaductY);
      ctx.lineTo(psx, viaductY - 38);
      ctx.lineTo(psx + 14, viaductY - 38);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(-40, viaductY - 35);
  ctx.lineTo(width + 40, viaductY - 35);
  ctx.stroke();

  // Sleek 3-car articulated Metro train gliding smoothly across the viaduct
  const trainX = ((time * 118) % (width + 580)) - 290;
  const carW = 84;
  for (let c = 0; c < 3; c++) {
    const cx = trainX + c * (carW + 5);
    const radii = c === 0 ? [8, 3, 2, 2] : c === 2 ? [3, 14, 2, 2] : 3;
    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
    fillRoundedRect(ctx, cx, viaductY - 23, carW, 21, radii);
    // Blue/cyan aerodynamic livery stripe
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx + 2, viaductY - 8, carW - 4, 3);
    // Tinted panoramic passenger windows
    ctx.fillStyle = 'rgba(56, 189, 248, 0.72)';
    for (let w = 10; w < carW - 16; w += 20) {
      fillRoundedRect(ctx, cx + w, viaductY - 19, 14, 8, 2);
    }
  }
  // Pantograph touching overhead catenary wire
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(trainX + carW + 30, viaductY - 23);
  ctx.lineTo(trainX + carW + 22, viaductY - 29);
  ctx.lineTo(trainX + carW + 32, viaductY - 35);
  ctx.stroke();

  ctx.restore();
}

/**
 * Cổng trường Đại học hiện đại (x = 340) — Màn 4
 */
export function drawModernUniversityGate(ctx, cameraX, width, getGroundY) {
  const uniX = 340 - cameraX;
  if (uniX < -280 || uniX > width + 280) return;
  const gy = getGroundY(340);

  ctx.save();
  // Twin architectural fin pillars
  ctx.fillStyle = '#17324d';
  ctx.fillRect(uniX - 118, gy - 166, 22, 170);
  ctx.fillRect(uniX + 96, gy - 166, 22, 170);
  ctx.fillStyle = '#254b73';
  ctx.fillRect(uniX - 92, gy - 148, 10, 152);
  ctx.fillRect(uniX + 82, gy - 148, 10, 152);

  // Sweeping modern cantilevered canopy arch
  ctx.fillStyle = '#0f243a';
  ctx.beginPath();
  ctx.moveTo(uniX - 144, gy - 162);
  ctx.quadraticCurveTo(uniX, gy - 198, uniX + 144, gy - 162);
  ctx.lineTo(uniX + 136, gy - 142);
  ctx.quadraticCurveTo(uniX, gy - 168, uniX - 136, gy - 142);
  ctx.closePath();
  ctx.fill();

  // Golden rim trim & university crest + title
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(uniX - 140, gy - 160);
  ctx.quadraticCurveTo(uniX, gy - 194, uniX + 140, gy - 160);
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.font = '700 11.5px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRƯỜNG ĐẠI HỌC', uniX, gy - 161);

  ctx.restore();
}

/**
 * Cây Tùng Bách trang nghiêm hai bên Đài tưởng niệm Tổ quốc ghi công
 */
function drawSolemnCypressTree(ctx, sx, gy, scale, time) {
  ctx.save();
  ctx.translate(sx, gy);
  ctx.scale(scale, scale);

  // Straight dark trunk
  ctx.fillStyle = '#13202e';
  ctx.fillRect(-5, -42, 10, 46);

  // Multi-tiered conical cypress foliage (hàng cây tùng bách uy nghiêm)
  const tiers = [
    { y: -34, w: 34, h: 44 },
    { y: -64, w: 28, h: 42 },
    { y: -94, w: 22, h: 40 },
    { y: -122, w: 14, h: 36 },
  ];
  const sway = Math.sin(time * 1.2 + sx * 0.02) * 1.8;

  ctx.fillStyle = '#13313d';
  tiers.forEach((t, idx) => {
    const tipShift = sway * (idx * 0.35);
    ctx.beginPath();
    ctx.moveTo(-t.w, t.y);
    ctx.quadraticCurveTo(-t.w * 0.45, t.y - t.h * 0.55, tipShift, t.y - t.h);
    ctx.quadraticCurveTo(t.w * 0.45, t.y - t.h * 0.55, t.w, t.y);
    ctx.closePath();
    ctx.fill();
  });

  // Warm morning sunlight rim on right edge of cypress
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.25)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(sway, -158);
  ctx.lineTo(32, -34);
  ctx.stroke();

  ctx.restore();
}

/**
 * Đồi cao 5 bậc tam cấp đá, Hàng cây tùng bách hai bên, Lư hương đồng lớn & Đài tưởng niệm Tổ quốc ghi công
 */
export function drawMonumentHillAndMemorial(
  ctx,
  cameraX,
  width,
  baseGroundY,
  getGroundY,
  finaleState,
  finaleWorldX,
  time
) {
  if (cameraX + width < 2040) return;
  ctx.save();

  // 1. Hàng cây tùng bách trang nghiêm hai bên lối lên & quảng trường Đài tưởng niệm
  const cypressSpots = [
    { x: 2110, s: 0.92 },
    { x: 2160, s: 1.04 },
    { x: 2445, s: 1.08 },
    { x: 2488, s: 0.95 },
    { x: 2645, s: 0.96 },
    { x: 2695, s: 1.08 },
    { x: 2750, s: 0.92 },
  ];
  for (const c of cypressSpots) {
    const csx = c.x - cameraX;
    if (csx < -100 || csx > width + 100) continue;
    drawSolemnCypressTree(ctx, csx, getGroundY(c.x) + 2, c.s, time);
  }

  // 2. Bậc tam cấp đá 5 bậc đi lên đồi Đài tưởng niệm (x = 2168..2430, dy = -18 -> -78)
  const stepDefs = [
    { x1: 2168, x2: 2224, dy: -30 },
    { x1: 2220, x2: 2276, dy: -42 },
    { x1: 2272, x2: 2328, dy: -54 },
    { x1: 2324, x2: 2380, dy: -66 },
    { x1: 2376, x2: 2880, dy: -78 }, // Top granite plaza!
  ];

  for (let i = 0; i < stepDefs.length; i++) {
    const st = stepDefs[i];
    const sx1 = st.x1 - cameraX;
    const sx2 = st.x2 - cameraX;
    if (sx2 < -60 || sx1 > width + 60) continue;
    const sy = baseGroundY + st.dy;

    // Dressed granite stair riser & tread
    ctx.fillStyle = i % 2 === 0 ? '#243447' : '#1e2d3d';
    ctx.fillRect(sx1, sy, sx2 - sx1, 15);
    // Warm sunlit stone nosing highlight so every one of the 5 steps pops crisply!
    ctx.fillStyle = 'rgba(254, 243, 199, 0.48)';
    ctx.fillRect(sx1, sy, sx2 - sx1, 2.5);
  }

  // Carved stone staircase balustrade & lotus posts alongside the 5 steps
  const railStartSx = 2168 - cameraX;
  const railEndSx = 2395 - cameraX;
  if (railEndSx > -80 && railStartSx < width + 80) {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.42)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(railStartSx, baseGroundY - 34);
    ctx.lineTo(railEndSx, baseGroundY - 96);
    ctx.stroke();

    // Stone lotus newel posts at bottom & top of the 5 stone steps
    ctx.fillStyle = '#334155';
    ctx.fillRect(railStartSx - 5, baseGroundY - 46, 10, 28);
    ctx.fillRect(railEndSx - 5, baseGroundY - 108, 10, 30);
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(railStartSx, baseGroundY - 49, 4.5, 0, Math.PI * 2);
    ctx.arc(railEndSx, baseGroundY - 111, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Đài tưởng niệm Tổ quốc ghi công (x = finaleWorldX = 2560, mgy = baseGroundY - 78)
  const mx = finaleWorldX - cameraX;
  const mgy = getGroundY(finaleWorldX);
  if (mx > -280 && mx < width + 280) {
    // Sacred golden dawn halo behind the Monument
    const haloRadius = 215 + finaleState.spiritsAlpha * 55;
    const halo = ctx.createRadialGradient(mx, mgy - 135, 16, mx, mgy - 135, haloRadius);
    halo.addColorStop(0, `rgba(254, 243, 199, ${0.52 + finaleState.spiritsAlpha * 0.25})`);
    halo.addColorStop(0.55, 'rgba(251, 191, 36, 0.18)');
    halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, mgy - 135, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Stepped granite pedestal & ceremonial lotus relief frieze
    ctx.fillStyle = '#18283a';
    ctx.fillRect(mx - 116, mgy - 14, 232, 16);
    ctx.fillStyle = '#1f334a';
    ctx.fillRect(mx - 86, mgy - 30, 172, 16);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(mx - 86, mgy - 30, 172, 16);

    // Towering obelisk stele (proportioned to 252px above mgy so total height fits every mobile & PC screen)
    ctx.fillStyle = '#0e1a28';
    ctx.beginPath();
    ctx.moveTo(mx - 42, mgy - 30);
    ctx.lineTo(mx - 28, mgy - 222);
    ctx.lineTo(mx, mgy - 256);
    ctx.lineTo(mx + 28, mgy - 222);
    ctx.lineTo(mx + 42, mgy - 30);
    ctx.closePath();
    ctx.fill();

    // Flanking traditional curved buttress wings
    ctx.fillStyle = '#152538';
    ctx.beginPath();
    ctx.moveTo(mx - 62, mgy - 30);
    ctx.quadraticCurveTo(mx - 48, mgy - 95, mx - 35, mgy - 128);
    ctx.lineTo(mx - 39, mgy - 30);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(mx + 62, mgy - 30);
    ctx.quadraticCurveTo(mx + 48, mgy - 95, mx + 35, mgy - 128);
    ctx.lineTo(mx + 39, mgy - 30);
    ctx.fill();

    // Golden engraved inner stele frame + Shining Golden Star + "TỔ QUỐC GHI CÔNG"
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(mx - 17, mgy - 192, 34, 136);
    drawStar(ctx, mx, mgy - 216, 5, 13, 5.5, '#facc15');

    ctx.fillStyle = '#fde68a';
    ctx.font = '700 10px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ['TỔ', 'QUỐC', 'GHI', 'CÔNG'].forEach((w, idx) => {
      ctx.fillText(w, mx, mgy - 168 + idx * 29);
    });

    // 4. Lư hương đồng lớn chạm khắc (Large Carved Bronze Incense Burner at mx - 58)
    const censerX = mx - 58;
    // Stone pedestal base
    ctx.fillStyle = '#292524';
    ctx.fillRect(censerX - 24, mgy - 18, 48, 18);
    // Tripod bronze legs
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(censerX - 12, mgy - 18);
    ctx.lineTo(censerX - 15, mgy - 36);
    ctx.moveTo(censerX, mgy - 18);
    ctx.lineTo(censerX, mgy - 36);
    ctx.moveTo(censerX + 12, mgy - 18);
    ctx.lineTo(censerX + 15, mgy - 36);
    ctx.stroke();

    // Ornate bronze cauldron body + twin dragon-ear handles (tai lư hương đồng)
    ctx.fillStyle = '#b45309';
    fillRoundedRect(ctx, censerX - 20, mgy - 58, 40, 24, 8);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(censerX - 16, mgy - 54, 32, 16);
    // Curved dragon-ear handles on left & right
    ctx.beginPath();
    ctx.arc(censerX - 22, mgy - 47, 6.5, Math.PI * 0.4, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(censerX + 22, mgy - 47, 6.5, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();

    // Glowing red-gold incense sticks burning when player offers incense!
    if (finaleState.holdProgress > 0.04 || finaleState.completed) {
      for (const offsetS of [-5, 0, 5]) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(censerX + offsetS, mgy - 58);
        ctx.lineTo(censerX + offsetS, mgy - 78);
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(censerX + offsetS, mgy - 79, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * 6 Bóng hình anh linh đồng đội & anh hùng liệt sĩ hiện lên trên bầu trời và quanh Đài tưởng niệm
 * trong làn khói hương vàng ấm, trang nghiêm GIƠ TAY CHÀO QUÂN SỰ về phía 3 thế hệ!
 */
export function drawFallenComradesSalute(
  ctx,
  cameraX,
  getGroundY,
  finaleWorldX,
  alpha,
  time
) {
  if (alpha <= 0.01) return;
  const basePlazaY = getGroundY(finaleWorldX);

  // 6 heroic figures arranged in a sacred arc in the sky & flanking the Monument
  const comrades = [
    { dx: -175, dy: -118, hat: 'mu_nan', scale: 0.94, facing: 1, hasRifle: true },
    { dx: -112, dy: -162, hat: 'tai_beo', scale: 0.96, facing: 1, hasScarf: true },
    { dx: -44, dy: -198, hat: 'mu_nan', scale: 1.0, facing: 1, holdsFlag: true },
    { dx: 52, dy: -194, hat: 'tai_beo', scale: 0.98, facing: -1, hasBackpack: true },
    { dx: 118, dy: -158, hat: 'steel_helmet', scale: 0.95, facing: -1, hasRifle: true },
    { dx: 178, dy: -114, hat: 'calo', scale: 0.92, facing: -1, hasScarf: true },
  ];

  ctx.save();

  comrades.forEach((sp, idx) => {
    const floatBob = Math.sin(time * 1.8 + idx * 1.05) * 4.5;
    const sx = finaleWorldX + sp.dx - cameraX;
    const sy = basePlazaY + sp.dy + floatBob;
    const individualAlpha = Math.max(
      0,
      Math.min(1, (alpha - idx * 0.06) / 0.72)
    );
    if (individualAlpha <= 0.01) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(sp.scale, sp.scale);
    ctx.globalAlpha = individualAlpha;

    // Sacred golden incense-smoke aura enveloping each fallen comrade
    const aura = ctx.createRadialGradient(0, -44, 4, 0, -44, 64);
    aura.addColorStop(0, 'rgba(254, 249, 195, 0.72)');
    aura.addColorStop(0.5, 'rgba(253, 224, 71, 0.26)');
    aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -44, 64, 0, Math.PI * 2);
    ctx.fill();

    // Soft incense mist wisps dissolving the lower legs into the sky
    const bodyGrad = ctx.createLinearGradient(0, -96, 0, 6);
    bodyGrad.addColorStop(0, 'rgba(255, 251, 235, 0.96)');
    bodyGrad.addColorStop(0.68, 'rgba(254, 240, 138, 0.85)');
    bodyGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

    ctx.scale(sp.facing, 1);

    // Optional slung rifle or Trường Sơn backpack silhouette
    if (sp.hasRifle) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-7, -42);
      ctx.lineTo(-14, -84);
      ctx.stroke();
    }
    if (sp.hasBackpack) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.82)';
      fillRoundedRect(ctx, -18, -68, 10, 22, 3.5);
    }
    if (sp.holdsFlag) {
      // Flagpole held in left hand billowing gently above the Monument
      drawWavingFlag(ctx, -12, -142, 46, 28, time, 96, 'national');
    }

    // Upright dignified legs fading into golden mist
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-8, -38, 6.8, 38);
    ctx.fillRect(1.2, -38, 6.8, 38);

    // Soldier tunic torso
    fillRoundedRect(ctx, -11, -72, 22, 36, 5.5);

    // Head
    ctx.fillStyle = 'rgba(255, 251, 235, 0.96)';
    ctx.beginPath();
    ctx.arc(0, -82, 8.2, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Historical Headgear per era
    if (sp.hat === 'mu_nan') {
      ctx.beginPath();
      ctx.arc(0, -84.5, 12.2, Math.PI * 1.02, -0.02);
      ctx.fill();
      ctx.fillRect(-14, -85, 28, 2.5);
      drawStar(ctx, 4.5, -89, 5, 3.0, 1.3, '#f59e0b');
    } else if (sp.hat === 'tai_beo') {
      ctx.beginPath();
      ctx.ellipse(0, -87.5, 15.5, 4, -0.04, 0, Math.PI * 2);
      ctx.arc(0, -88.5, 8.8, Math.PI, 0);
      ctx.fill();
    } else if (sp.hat === 'steel_helmet') {
      ctx.beginPath();
      ctx.arc(0, -84, 11.2, Math.PI * 1.05, 0.08);
      ctx.fill();
    } else {
      // Ca-lô Vệ quốc quân sao vàng
      ctx.beginPath();
      ctx.moveTo(-9, -86);
      ctx.lineTo(1, -93);
      ctx.lineTo(10, -86);
      ctx.closePath();
      ctx.fill();
    }

    // SOLEMN MILITARY SALUTE (Giơ tay chào quân sự trang nghiêm!)
    // Elbow raised crisply outward, forearm angled cleanly to the temple/hat brim!
    ctx.strokeStyle = 'rgba(255, 251, 235, 0.98)';
    ctx.lineWidth = 5.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(6, -66); // Right shoulder
    ctx.lineTo(21, -73); // Crisp raised elbow
    ctx.lineTo(8.5, -85.5); // Hand saluting right at temple / helmet brim!
    ctx.stroke();

    // Subtle warm golden rim outline on salute arm for unmistakable readability
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(21, -73);
    ctx.lineTo(8.5, -85.5);
    ctx.stroke();

    ctx.restore();
  });

  ctx.restore();
}

// ============================================================================
// 6. BỀ MẶT PLATFORM ĐA TẦNG & VẬT PHẨM TƯƠNG TÁC LỊCH SỬ
// ============================================================================

/**
 * Vẽ chi tiết từng loại One-Way Platform theo đúng ngữ cảnh lịch sử từng Màn
 */
export function drawDetailedPlatformSurface(ctx, p, sx1, sx2, py, getGroundY, act, time) {
  const pw = sx2 - sx1;
  ctx.save();

  switch (p.style) {
    case 'thatched_hut_floor':
    case 'jungle_bunker_roof': {
      // Sàn ván gỗ nhà tranh (Màn 1) / Nền rừng & nắp hầm ngụy trang trên nóc Hầm chữ A (Màn 3)
      const isJungle = p.style === 'jungle_bunker_roof';
      ctx.fillStyle = isJungle ? '#0e2430' : '#241b13';
      // Để hở khe nắp hầm bên trái (sx1 + 36 .. sx1 + 114) cho cầu thang đi xuống trực quan!
      ctx.fillRect(sx1, py, 36, 7);
      ctx.fillRect(sx1 + 114, py, Math.max(12, pw - 114), 7);
      // Cửa sập gỗ nắp hầm có viền vàng ấm gợi ý bấm S đi xuống
      ctx.fillStyle = '#3f2917';
      ctx.fillRect(sx1 + 36, py + 1, 78, 4.5);
      ctx.strokeStyle = isJungle ? 'rgba(52, 211, 153, 0.42)' : 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx1, py + 1);
      ctx.lineTo(sx2, py + 1);
      ctx.stroke();
      break;
    }

    case 'wood_stair_step':
    case 'hanoi_wood_stair':
    case 'hanoi_wood_mezzanine': {
      // Chiếu nghỉ / Bậc cầu thang ván gỗ trong hầm bí mật, Hầm chữ A & Nhà phố cổ 2 tầng Hà Nội
      const isMezz = p.style === 'hanoi_wood_mezzanine';
      ctx.fillStyle = isMezz ? '#3b2115' : '#4a2c1a';
      fillRoundedRect(ctx, sx1, py, pw, isMezz ? 8 : 6.5, 2.5);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.46)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx1 + 2, py + 1);
      ctx.lineTo(sx2 - 2, py + 1);
      ctx.stroke();
      if (isMezz) {
        // Lan can gỗ gác xép nhà phố cổ
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(sx1 + 4, py - 15, pw - 8, 15);
      }
      break;
    }

    case 'pacbo_waterfall_step':
    case 'pacbo_ledge':
    case 'pacbo_cave_mouth':
    case 'stone_ledge': {
      // Bậc đá thác nước Suối Lê-nin / Nền hang Cốc Bó cắt lớp / Đá suối Trường Sơn
      const isCaveTop = p.style === 'pacbo_cave_mouth';
      const isWaterfallStep = p.style === 'pacbo_waterfall_step';
      ctx.fillStyle = act === 1 ? '#111927' : '#0b1d26';
      ctx.beginPath();
      ctx.moveTo(sx1 - 4, py + 2);
      ctx.lineTo(sx2 + 4, py + 2);
      ctx.lineTo(sx2 - 8, py + (isCaveTop ? 26 : 22));
      ctx.lineTo(sx1 + pw * 0.62, py + (isCaveTop ? 32 : 28));
      ctx.lineTo(sx1 + pw * 0.28, py + 23);
      ctx.lineTo(sx1 + 8, py + 18);
      ctx.closePath();
      ctx.fill();

      // Lớp nước ngọc bích tràn qua mặt bậc đá thác nước
      if (isWaterfallStep) {
        ctx.fillStyle = 'rgba(94, 234, 212, 0.36)';
        ctx.fillRect(sx1 + 4, py - 1.5, pw - 8, 3.5);
      }

      ctx.strokeStyle = isWaterfallStep
        ? 'rgba(153, 246, 228, 0.58)'
        : act === 1
        ? 'rgba(110, 231, 183, 0.38)'
        : 'rgba(167, 243, 208, 0.32)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(sx1, py + 1);
      ctx.lineTo(sx2, py + 1);
      ctx.stroke();
      break;
    }

    case 'haystack_cover': {
      const groundHere = getGroundY((p.x1 + p.x2) * 0.5);
      drawHaystackBambooCover(ctx, sx1, sx2, py, groundHere, time);
      break;
    }

    case 'barricade': {
      // Chiến lũy đường phố Hà Nội: Bao cát xếp chồng + Bàn ghế gỗ & bánh xe bò
      const gy = getGroundY((p.x1 + p.x2) * 0.5);
      const h = Math.max(18, gy - py);
      ctx.fillStyle = '#211410';
      fillRoundedRect(ctx, sx1, py, pw, h + 3, 6);

      // Individual stacked sandbags
      ctx.fillStyle = '#362319';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.24)';
      ctx.lineWidth = 1.2;
      for (let rowY = py + 2; rowY < gy - 6; rowY += 11) {
        const shift = ((rowY - py) % 22 === 2) ? 0 : 8;
        for (let bx = sx1 + shift; bx < sx2 - 14; bx += 20) {
          fillRoundedRect(ctx, bx, rowY, 18, 9.5, 3.5);
          ctx.strokeRect(bx + 1, rowY + 1, 16, 7.5);
        }
      }
      // Wooden cartwheel wedged into barricade
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(sx1 + pw * 0.5, py + 12, 12, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'hanoi_balcony': {
      // Ban công sắt nghệ thuật tầng 2 phố cổ Hà Nội
      ctx.fillStyle = '#291714';
      ctx.fillRect(sx1, py, pw, 8);
      // Decorative wrought-iron railing above balcony slab
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.38)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx1 + 2, py - 20, pw - 4, 20);
      for (let rx = sx1 + 10; rx < sx2 - 6; rx += 10) {
        ctx.beginPath();
        ctx.moveTo(rx, py - 20);
        ctx.lineTo(rx, py);
        ctx.stroke();
      }
      // Curved iron corbel brackets underneath balcony
      ctx.beginPath();
      ctx.moveTo(sx1 + 8, py + 8);
      ctx.quadraticCurveTo(sx1 + 8, py + 22, sx1 + 2, py + 24);
      ctx.moveTo(sx2 - 8, py + 8);
      ctx.quadraticCurveTo(sx2 - 8, py + 22, sx2 - 2, py + 24);
      ctx.stroke();
      break;
    }

    case 'hanoi_tiled_roof': {
      // Mái ngói nghiêng nhà phố cổ Hà Nội có thể nhảy lên chạy băng qua!
      ctx.fillStyle = '#331612';
      ctx.beginPath();
      ctx.moveTo(sx1 - 6, py + 8);
      ctx.lineTo(sx1 + 12, py);
      ctx.lineTo(sx2 - 12, py);
      ctx.lineTo(sx2 + 6, py + 8);
      ctx.closePath();
      ctx.fill();

      // Scalloped roof tile ridges & warm firelight rim
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.44)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx1, py + 1);
      ctx.lineTo(sx2, py + 1);
      ctx.stroke();
      break;
    }

    case 'bunker_roof': {
      // Nắp hầm Đờ Cátơri được vẽ chi tiết trong drawDienBienFortress; vẽ thêm viền sáng mảnh báo mặt đứng
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.34)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx1 + 10, py + 1);
      ctx.lineTo(sx2 - 10, py + 1);
      ctx.stroke();
      break;
    }

    case 'wood_bridge': {
      // Cầu treo Trường Sơn bắc qua vực suối (x = 1040..1410)
      const gorgeFloorY = getGroundY((p.x1 + p.x2) * 0.5);
      drawTruongSonSuspensionBridge(ctx, sx1, sx2, py, gorgeFloorY, time);
      break;
    }

    case 'modern_walkway': {
      // Cầu vượt đi bộ kính cường lực hiện đại Màn 4
      const gy = getGroundY((p.x1 + p.x2) * 0.5);
      ctx.fillStyle = '#1b354f';
      ctx.fillRect(sx1, py, pw, 9);
      ctx.fillStyle = '#13273b';
      ctx.fillRect(sx1 + pw * 0.5 - 8, py + 9, 16, gy - py);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.18)';
      ctx.fillRect(sx1 + 2, py - 24, pw - 4, 24);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx1 + 2, py - 24);
      ctx.lineTo(sx2 - 2, py - 24);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

// ============================================================================
// 7. ĐOÀN NPC ĐỒNG ĐỘI & MỤC TIÊU TÁC CHIẾN IN-WORLD MINIGAMES
// ============================================================================

/**
 * Vẽ NPC quần chúng / đồng đội nối đuôi theo nhân vật chính:
 * - Màn 1: Nông dân / tự vệ cầm gậy tre ('staff'), búa sắt ('hammer'), cờ đỏ ('flag')
 * - Màn 2: Chiến sĩ Vệ quốc đoàn cùng ném bom xăng / đánh bộc phá / phất cờ
 * - Màn 3: Chiến sĩ Giải phóng quân cầm AK-47 nhả đạn cùng nhân vật chính
 */
export function drawFollowerComrade(ctx, sx, footY, act, variantIndex, anim, time) {
  const {
    facing = 1,
    walkCycle = 0,
    speedRatio = 0,
    onGround = true,
    attackPose = null,
    attackTimer = 0,
    stealthHidden = false,
    isCrouching = false,
  } = anim;

  const scale = 0.91 + (variantIndex % 3) * 0.025;
  ctx.save();
  if (stealthHidden) {
    ctx.globalAlpha = 0.42;
  }

  if (act === 2 || act === 3) {
    ctx.translate(sx, footY);
    ctx.scale(scale, scale);
    drawDetailedCharacter(
      ctx,
      0,
      0,
      act,
      {
        facing,
        walkCycle,
        speedRatio,
        onGround,
        vy: 0,
        landingSquash: stealthHidden ? 0.45 : 0,
        pose: attackPose,
        poseTimer: attackTimer,
        wearingHat: true,
        isCrouching: Boolean(isCrouching || stealthHidden),
      },
      time + variantIndex * 0.4
    );
    ctx.restore();
    return;
  }

  // Màn 1: Nông dân / Tự vệ mặc áo nâu/áo bà ba, đội nón lá hoặc vấn khăn, cầm gậy / búa / cờ đỏ!
  const weaponType = ['staff', 'hammer', 'flag'][variantIndex % 3];
  const bob = onGround && speedRatio > 0.05 ? Math.abs(Math.sin(walkCycle * 2)) * 3.2 : 0;
  const crouchDrop = stealthHidden || isCrouching ? 20 : 0;

  ctx.translate(sx, footY);
  ctx.scale(facing * scale, scale);
  ctx.translate(0, -bob + crouchDrop);

  // Legs
  const stride = speedRatio > 0.05 ? Math.sin(walkCycle) * 0.65 : 0;
  ctx.strokeStyle = '#090c14';
  ctx.lineWidth = 5.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, -26);
  ctx.lineTo(-2 - Math.sin(stride) * 11, -12);
  ctx.lineTo(-3 - Math.sin(stride) * 15, 0);
  ctx.moveTo(2, -26);
  ctx.lineTo(2 + Math.sin(stride) * 11, -12);
  ctx.lineTo(3 + Math.sin(stride) * 15, 0);
  ctx.stroke();

  // Áo bà ba / áo nâu sồng torso
  ctx.fillStyle = variantIndex % 2 === 0 ? '#121724' : '#1b1615';
  fillRoundedRect(ctx, -8.5, -52, 17, 28, 5);
  // Khăn thắt lưng vải đỏ tự vệ
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(-8.5, -33, 17, 3.5);

  // Head + Nón lá hoặc Khăn vấn đầu
  ctx.fillStyle = '#0d111a';
  ctx.beginPath();
  ctx.arc(1, -60, 6.8, 0, Math.PI * 2);
  ctx.fill();

  if (variantIndex % 2 === 0) {
    // Nón lá truyền thống Việt Nam
    ctx.fillStyle = '#785a32';
    ctx.beginPath();
    ctx.moveTo(-14, -61);
    ctx.lineTo(1, -73);
    ctx.lineTo(16, -61);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  } else {
    // Khăn vấn đầu & sao nhỏ tự vệ đỏ
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-6, -65, 14, 4);
  }

  // Front arm + Weapon (Gậy tre / Búa sắt / Cờ đỏ sao vàng)
  const isAttacking = Boolean(attackPose);
  const swing = isAttacking ? -1.45 + Math.sin(attackTimer * 20) * 1.25 : -0.35;

  ctx.save();
  ctx.translate(3, -46);
  if (weaponType === 'flag') {
    const waveLift = isAttacking ? -0.35 + Math.sin(time * 12) * 0.2 : -0.15;
    ctx.rotate(waveLift);
    ctx.strokeStyle = '#121724';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(11, -12);
    ctx.stroke();
    drawWavingFlag(ctx, 11, -54, 34, 21, time + variantIndex, 48, 'national');
  } else if (weaponType === 'hammer') {
    ctx.rotate(swing);
    ctx.strokeStyle = '#121724';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(13, -5);
    ctx.stroke();
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(11, -5);
    ctx.lineTo(28, -16);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(23, -22, 10, 13);
  } else {
    // Gậy tre tự vệ vạt nhọn
    ctx.rotate(swing * 0.85);
    ctx.strokeStyle = '#121724';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, -6);
    ctx.stroke();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-6, 12);
    ctx.lineTo(28, -24);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/**
 * Ụ súng bê tông & bao cát của địch chặn đường Xe tăng 390 trên Đại lộ Sài Gòn (Màn 3B)
 */
export function drawEnemyGunBunker(ctx, sx, gy, destroyed, hitFlash, firing, time) {
  ctx.save();
  ctx.translate(sx, gy);

  if (destroyed) {
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-36, 2);
    ctx.lineTo(-22, -14);
    ctx.lineTo(-4, -8);
    ctx.lineTo(14, -16);
    ctx.lineTo(34, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  // Concrete & sandbag bunker silhouette
  ctx.fillStyle = hitFlash > 0 ? '#7f1d1d' : '#1e293b';
  fillRoundedRect(ctx, -32, -38, 64, 38, [8, 8, 2, 2]);
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-30, -36, 60, 34);

  // Stacked sandbags in front
  ctx.fillStyle = '#44403c';
  for (let row = 0; row < 2; row++) {
    for (let bx = -36 + row * 6; bx <= 18 - row * 6; bx += 17) {
      fillRoundedRect(ctx, bx, -10 - row * 8, 16, 8, 3);
    }
  }

  // Heavy machine gun barrel pointing left
  ctx.fillStyle = '#090d16';
  ctx.fillRect(-26, -29, 24, 7);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-24, -25.5);
  ctx.lineTo(-46, -25.5);
  ctx.stroke();

  if (firing) {
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.moveTo(-46, -25.5);
    ctx.lineTo(-62, -30 + Math.sin(time * 40) * 2);
    ctx.lineTo(-56, -25.5);
    ctx.lineTo(-62, -21);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Máy bay cường kích phản lực địch lượn trên bầu trời Đồi Cao Xạ Trường Sơn (Màn 3A)
 */
export function drawJetFighterEnemy(ctx, sx, sy, dir, hitFlash, hpRatio) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(dir < 0 ? -1 : 1, 1);

  // Dark smoke plume if damaged (hpRatio < 1)
  if (hpRatio < 0.95) {
    ctx.fillStyle = 'rgba(30, 27, 26, 0.55)';
    ctx.beginPath();
    ctx.arc(-48, -2, 8, 0, Math.PI * 2);
    ctx.arc(-62, -5, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = hitFlash > 0 ? '#ef4444' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(52, 1);
  ctx.quadraticCurveTo(18, -8, -44, -3);
  ctx.lineTo(-54, -18);
  ctx.lineTo(-36, -3);
  ctx.lineTo(-48, 5);
  ctx.quadraticCurveTo(14, 8, 52, 1);
  ctx.closePath();
  ctx.fill();

  // Swept wing + cockpit canopy glint
  ctx.fillStyle = hitFlash > 0 ? '#fca5a5' : '#1e293b';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-18, -19);
  ctx.lineTo(-28, -17);
  ctx.lineTo(-8, 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
  ctx.beginPath();
  ctx.ellipse(22, -3.5, 9, 3, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
