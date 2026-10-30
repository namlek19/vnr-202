/* global __BGM_AVAILABLE__ */

/**
 * Hệ thống Âm thanh Hybrid (Web Audio API Synthesizer + Historical Broadcast MP3 + Optional MP3 BGM)
 * - Tự sinh toàn bộ SFX, Nhạc nền Ambient 4 Màn & Nhạc Chiến đấu 135 BPM bằng Web Audio API.
 * - Tích hợp bản thu lịch sử "Lời kêu gọi toàn quốc kháng chiến" (19/12/1946) với bộ phân tích sóng âm thực.
 * - Tự động kiểm tra public/audio/bgm_act1..4.mp3 mà KHÔNG gây lỗi 404 trên Console.
 */

const LOI_KEU_GOI_MP3_URL = new URL(
  './loi_keu_goi_toan_quoc_khang_chien.mp3',
  import.meta.url
).href;

const COMBAT_BASS_PATTERNS = {
  // Màn 1: D minor urgent uprising bass (D2 - D2 - F2 - G2 - A2 - Bb2 - A2 - G2)
  1: [73.42, 73.42, 87.31, 98.0, 110.0, 116.54, 110.0, 98.0],
  // Màn 2: C minor heroic resistance bass (C2 - C2 - Eb2 - F2 - G2 - Ab2 - G2 - F2)
  2: [65.41, 65.41, 77.78, 87.31, 98.0, 103.83, 98.0, 87.31],
  // Màn 3: E minor Trường Sơn & Saigon offensive bass (E2 - E2 - G2 - A2 - B2 - C3 - B2 - A2)
  3: [82.41, 82.41, 98.0, 110.0, 123.47, 130.81, 123.47, 110.0],
};

const ACT_CHORDS = {
  // Màn 1: Đêm đen & Ngọn lửa (D minor melancholic & resolute)
  1: {
    padFilterHz: 520,
    tempoMs: 4400,
    chords: [
      [146.83, 220.0, 261.63, 349.23], // Dm7
      [116.54, 174.61, 233.08, 293.66], // BbMaj
      [98.0, 146.83, 196.0, 293.66], // Gm9
      [110.0, 164.81, 220.0, 277.18], // A
    ],
    melody: [587.33, 523.25, 440.0, 349.23, 392.0, 440.0],
    melodyWave: 'sine',
  },
  // Màn 2: Kháng chiến hào hùng (C minor -> Eb major -> G)
  2: {
    padFilterHz: 680,
    tempoMs: 4000,
    chords: [
      [130.81, 196.0, 261.63, 311.13], // Cm
      [103.83, 155.56, 207.65, 311.13], // Ab
      [116.54, 174.61, 233.08, 349.23], // Bb
      [98.0, 146.83, 196.0, 293.66], // G5
    ],
    melody: [392.0, 466.16, 523.25, 587.33, 523.25, 392.0],
    melodyWave: 'triangle',
  },
  // Màn 3: Đêm Trường Sơn & Mùa Xuân toàn thắng (E minor pentatonic)
  3: {
    padFilterHz: 640,
    tempoMs: 4200,
    chords: [
      [164.81, 246.94, 329.63, 392.0], // Em
      [130.81, 196.0, 246.94, 329.63], // Cmaj7
      [110.0, 164.81, 220.0, 329.63], // Am9
      [146.83, 220.0, 293.66, 369.99], // D
    ],
    melody: [659.25, 587.33, 493.88, 392.0, 440.0, 493.88],
    melodyWave: 'sine',
  },
  // Màn 4: Bình minh Hòa bình & Cơ đồ hôm nay (F major / C major ấm sáng)
  4: {
    padFilterHz: 950,
    tempoMs: 4600,
    chords: [
      [174.61, 261.63, 349.23, 440.0], // Fmaj
      [130.81, 196.0, 261.63, 392.0], // C
      [146.83, 220.0, 293.66, 440.0], // Dm7
      [116.54, 174.61, 261.63, 349.23], // Bbadd9
    ],
    melody: [523.25, 659.25, 698.46, 880.0, 783.99, 659.25],
    melodyWave: 'sine',
  },
};

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmBus = null;
    this.sfxBus = null;
    this.reverbBus = null;

    this.rainNode = null;
    this.rainGain = null;
    this.noiseBuffer = null;

    this.muted = false;
    this.initialized = false;
    this.currentAct = 1;

    // Hybrid MP3 state
    this.bgmManifest =
      typeof __BGM_AVAILABLE__ !== 'undefined' && __BGM_AVAILABLE__
        ? { ...__BGM_AVAILABLE__ }
        : { 1: false, 2: false, 3: false, 4: false };
    this.manifestCheckedDev = false;
    this.mp3Players = {};
    this.activeMp3Act = null;
    this.usingMp3ForCurrentAct = false;

    // Ambient synthesizer scheduler
    this.chordIndex = 0;
    this.ambientTimer = null;

    // 135 BPM Combat Drum & Bass synth scheduler
    this.combatMusicActive = false;
    this.combatStepIndex = 0;
    this.combatTimer = null;

    // Historical Broadcast ("Lời kêu gọi toàn quốc kháng chiến" 19/12/1946)
    this.broadcastAudio = null;
    this.broadcastAnalyser = null;
    this.broadcastFreqData = null;
    this.broadcastWebAudioLinked = false;
    this.broadcastActive = false;

    // Incense hold drone state
    this.incenseOscs = null;
    this.incenseGain = null;

    // Throttles
    this.lastTypewriterAt = 0;
    this.lastSirenAt = 0;
    this.lastBombWhistleAt = 0;
  }

  async init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Master limiter + gain
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0.0001 : 0.82;

    this.bgmBus = this.ctx.createGain();
    this.bgmBus.gain.value = 0.42;

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.78;

    // Lush stereo feedback delay as lightweight reverb
    this.reverbBus = this.createDelayReverb();

    this.bgmBus.connect(compressor);
    this.sfxBus.connect(compressor);
    this.reverbBus.output.connect(compressor);

    compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseBuffer = this.createPinkNoiseBuffer(3.0);
    this.setupRainGenerator();

    this.initialized = true;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // In Vite dev mode, refresh manifest once so newly added MP3s are picked up live
    if (import.meta.env && import.meta.env.DEV && !this.manifestCheckedDev) {
      this.manifestCheckedDev = true;
      try {
        const res = await fetch('/__bgm-manifest');
        if (res.ok) {
          const data = await res.json();
          this.bgmManifest = { ...this.bgmManifest, ...data };
        }
      } catch {
        // Ignore silently
      }
    }

    this.startAmbientLoop();
    this.setAct(this.currentAct, true);
  }

  createDelayReverb() {
    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    output.gain.value = 0.34;

    const delayL = this.ctx.createDelay(1.0);
    const delayR = this.ctx.createDelay(1.0);
    delayL.delayTime.value = 0.27;
    delayR.delayTime.value = 0.39;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1900;

    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.38;

    input.connect(delayL);
    delayL.connect(delayR);
    delayR.connect(filter);
    filter.connect(feedback);
    feedback.connect(delayL);

    delayL.connect(output);
    filter.connect(output);

    return { input, output };
  }

  createPinkNoiseBuffer(seconds = 2.5) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  setupRainGenerator() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1150;
    bandpass.Q.value = 0.65;

    const highshelf = this.ctx.createBiquadFilter();
    highshelf.type = 'lowpass';
    highshelf.frequency.value = 2800;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0001;

    src.connect(bandpass);
    bandpass.connect(highshelf);
    highshelf.connect(this.rainGain);
    this.rainGain.connect(this.sfxBus);

    src.start();
    this.rainNode = src;
  }

  updateRain(intensity = 0) {
    if (!this.initialized || !this.rainGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const target = clamped * 0.24;
    this.rainGain.gain.setTargetAtTime(Math.max(0.0001, target), this.ctx.currentTime, 0.25);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.initialized && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.muted ? 0.0001 : 0.82, now, 0.06);
    }
    Object.values(this.mp3Players).forEach((audio) => {
      if (audio) audio.muted = this.muted;
    });
    if (this.broadcastAudio && !this.broadcastWebAudioLinked) {
      this.broadcastAudio.muted = this.muted;
    }
    return this.muted;
  }

  _syncBgmDucking() {
    if (!this.initialized || !this.bgmBus || !this.ctx) return;
    const isPlayingBroadcast =
      this.broadcastActive && this.broadcastAudio && !this.broadcastAudio.paused;
    const targetBgmGain = isPlayingBroadcast ? 0.038 : 0.42;
    const now = this.ctx.currentTime;
    this.bgmBus.gain.cancelScheduledValues(now);
    this.bgmBus.gain.setTargetAtTime(targetBgmGain, now, 0.16);

    if (this.activeMp3Act && this.mp3Players[this.activeMp3Act]) {
      const mp3 = this.mp3Players[this.activeMp3Act];
      if (!mp3.paused) {
        mp3.volume = isPlayingBroadcast ? 0.05 : 0.48;
      }
    }
  }

  /**
   * Phát bản thu lịch sử "Lời kêu gọi toàn quốc kháng chiến" (19/12/1946)
   * Tự động hạ nhỏ BGM xuống mức tối thiểu và phân tích sóng âm thực qua AnalyserNode.
   */
  async playLoiKeuGoiBroadcast() {
    await this.init();

    if (!this.broadcastAudio) {
      const audio = new Audio(LOI_KEU_GOI_MP3_URL);
      audio.preload = 'auto';
      audio.loop = false;
      this.broadcastAudio = audio;

      audio.addEventListener('ended', () => {
        this.broadcastActive = false;
        this._syncBgmDucking();
      });

      // Kết nối vào Web Audio AnalyserNode để vẽ sóng âm Đài Tiếng nói Việt Nam theo giọng đọc thực
      if (this.ctx && this.masterGain) {
        try {
          const mediaSource = this.ctx.createMediaElementSource(audio);
          const analyser = this.ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.78;

          const voiceGain = this.ctx.createGain();
          voiceGain.gain.value = 1.05;

          mediaSource.connect(analyser);
          analyser.connect(voiceGain);
          voiceGain.connect(this.masterGain);

          this.broadcastAnalyser = analyser;
          this.broadcastFreqData = new Uint8Array(analyser.frequencyBinCount);
          this.broadcastWebAudioLinked = true;
        } catch {
          this.broadcastWebAudioLinked = false;
          audio.muted = this.muted;
          audio.volume = 0.95;
        }
      }
    }

    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      if (!this.broadcastWebAudioLinked) {
        this.broadcastAudio.muted = this.muted;
      }
      // Nếu bản thu đã chạy hết hoặc chưa phát -> phát từ đầu; nếu đang phát dở -> giữ mạch phát tự nhiên
      if (this.broadcastAudio.ended || !this.broadcastActive) {
        this.broadcastAudio.currentTime = 0;
      }
      this.broadcastActive = true;
      await this.broadcastAudio.play();
      this._syncBgmDucking();
    } catch {
      // Tránh crash nếu trình duyệt chặn autoplay tạm thời
    }
  }

  toggleBroadcastPause() {
    if (!this.broadcastAudio || !this.broadcastActive) return false;
    if (this.broadcastAudio.paused) {
      this.broadcastAudio.play().catch(() => {});
      this._syncBgmDucking();
      return false; // not paused (playing)
    } else {
      this.broadcastAudio.pause();
      this._syncBgmDucking();
      return true; // paused
    }
  }

  stopBroadcast() {
    if (!this.broadcastAudio) {
      this.broadcastActive = false;
      return;
    }
    this.broadcastActive = false;
    try {
      this.broadcastAudio.pause();
      this.broadcastAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    this._syncBgmDucking();
  }

  getBroadcastState() {
    if (!this.broadcastActive || !this.broadcastAudio) {
      return {
        active: false,
        paused: true,
        currentTime: 0,
        duration: 0,
        progress: 0,
      };
    }
    const dur = Number.isFinite(this.broadcastAudio.duration)
      ? this.broadcastAudio.duration
      : 0;
    const cur = this.broadcastAudio.currentTime || 0;
    return {
      active: true,
      paused: this.broadcastAudio.paused,
      currentTime: cur,
      duration: dur,
      progress: dur > 0 ? Math.min(1, cur / dur) : 0,
    };
  }

  /**
   * Trả về biên độ sóng âm 0..1 cho thanh Audio Visualizer Đài Tiếng nói Việt Nam
   */
  fillBroadcastBars(targetArray, clockSec = 0) {
    const count = targetArray.length;
    if (!this.broadcastActive || !this.broadcastAudio || this.broadcastAudio.paused) {
      for (let i = 0; i < count; i++) {
        targetArray[i] = 0.12;
      }
      return;
    }

    if (this.broadcastAnalyser && this.broadcastFreqData) {
      this.broadcastAnalyser.getByteFrequencyData(this.broadcastFreqData);
      const binCount = this.broadcastFreqData.length;
      let energySum = 0;
      for (let i = 0; i < count; i++) {
        const binIdx = Math.min(
          binCount - 1,
          Math.floor((i / count) * (binCount * 0.72)) + 1
        );
        const norm = this.broadcastFreqData[binIdx] / 255;
        energySum += norm;
        targetArray[i] = Math.max(0.14, Math.min(1, norm * 1.25));
      }
      if (energySum > 0.05) return;
    }

    // Fallback biểu diễn sóng giọng đọc tự nhiên nếu trình duyệt hạn chế CORS MediaElementSource
    for (let i = 0; i < count; i++) {
      const centerWeight = 1 - Math.abs(i - (count - 1) * 0.5) / (count * 0.55);
      const syllable =
        0.45 +
        Math.sin(clockSec * 9.5 + i * 0.65) * 0.28 +
        Math.cos(clockSec * 16.2 - i * 0.9) * 0.22;
      targetArray[i] = Math.max(0.14, Math.min(1, syllable * (0.45 + centerWeight * 0.65)));
    }
  }

  /**
   * Bật / Tắt Nhạc Chiến Đấu Dồn Dập 135 BPM (Drum & Bass Synth hành khúc kịch tính)
   */
  setCombatMusicMode(active) {
    const nextState = Boolean(active && this.currentAct >= 1 && this.currentAct <= 3);
    if (this.combatMusicActive === nextState) return;
    this.combatMusicActive = nextState;

    if (this.combatTimer) {
      clearInterval(this.combatTimer);
      this.combatTimer = null;
    }

    if (!this.initialized || !this.ctx) return;

    if (this.combatMusicActive) {
      this.combatStepIndex = 0;
      const sixteenthMs = Math.round((60 / 135 / 4) * 1000); // ~111ms ở 135 BPM!
      this._triggerCombatStep();
      this.combatTimer = setInterval(() => {
        if (!this.initialized || !this.combatMusicActive) return;
        this._triggerCombatStep();
      }, sixteenthMs);
    } else if (!this.usingMp3ForCurrentAct) {
      this.triggerAmbientChord();
    }
  }

  _triggerCombatStep() {
    if (!this.initialized || !this.ctx || this.usingMp3ForCurrentAct) return;
    if (this.ctx.state === 'suspended') return;

    const step = this.combatStepIndex % 16;
    const barCount = Math.floor(this.combatStepIndex / 16);
    this.combatStepIndex++;

    const now = this.ctx.currentTime;
    const act = this.currentAct;
    const bassNotes = COMBAT_BASS_PATTERNS[act] || COMBAT_BASS_PATTERNS[1];

    // 1. Trống trận / Kick dồn dập (Steps 0, 3, 6, 8, 10, 14)
    if (step === 0 || step === 3 || step === 6 || step === 8 || step === 10 || step === 14) {
      const kOsc = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kOsc.type = 'sine';
      const accent = step === 0 || step === 8 ? 1.0 : 0.78;
      kOsc.frequency.setValueAtTime(124, now);
      kOsc.frequency.exponentialRampToValueAtTime(34, now + 0.11);

      kGain.gain.setValueAtTime(0.32 * accent, now);
      kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      kOsc.connect(kGain);
      kGain.connect(this.bgmBus);
      kOsc.start(now);
      kOsc.stop(now + 0.14);
    }

    // 2. Snare quân hành đanh gọn (Steps 4, 12 + dồn trống hành quân ở cuối nhịp chẵn 13, 15)
    const isSnareMain = step === 4 || step === 12;
    const isSnareRoll = barCount % 2 === 1 && (step === 13 || step === 15);
    if ((isSnareMain || isSnareRoll) && this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = isSnareMain ? 1850 : 2200;
      bp.Q.value = 1.1;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(isSnareMain ? 0.2 : 0.11, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + (isSnareMain ? 0.11 : 0.065));

      nSrc.connect(bp);
      bp.connect(nGain);
      nGain.connect(this.bgmBus);
      nSrc.start(now, Math.random() * 1.2, 0.12);

      if (isSnareMain) {
        const bodyOsc = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(195, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(92, now + 0.06);
        bodyGain.gain.setValueAtTime(0.14, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.bgmBus);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.08);
      }
    }

    // 3. Hi-hat kim loại giữ nhịp tốc độ 135 BPM mỗi nốt móc đơn / móc kép
    if (step % 2 === 0 && this.noiseBuffer) {
      const hSrc = this.ctx.createBufferSource();
      hSrc.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5400;
      const hGain = this.ctx.createGain();
      hGain.gain.setValueAtTime(step % 4 === 2 ? 0.075 : 0.04, now);
      hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
      hSrc.connect(hp);
      hp.connect(hGain);
      hGain.connect(this.bgmBus);
      hSrc.start(now, Math.random(), 0.042);
    }

    // 4. Driving Drum & Bass Synth Bassline (mỗi nửa phách móc đơn)
    if (step % 2 === 0) {
      const bassFreq = bassNotes[(step / 2) % bassNotes.length];
      const bOsc = this.ctx.createOscillator();
      const bFilter = this.ctx.createBiquadFilter();
      const bGain = this.ctx.createGain();

      bOsc.type = 'sawtooth';
      bOsc.frequency.setValueAtTime(bassFreq, now);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(520, now);
      bFilter.frequency.exponentialRampToValueAtTime(165, now + 0.16);
      bFilter.Q.value = 2.4;

      bGain.gain.setValueAtTime(0.17, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.bgmBus);
      bOsc.start(now);
      bOsc.stop(now + 0.19);
    }

    // 5. Hợp âm Brass / String kịch tính nhấn đầu mỗi ô nhịp (step === 0)
    if (step === 0) {
      const cfg = ACT_CHORDS[act] || ACT_CHORDS[1];
      const stabChord = cfg.chords[barCount % cfg.chords.length];
      stabChord.slice(0, 3).forEach((freq) => {
        const sOsc = this.ctx.createOscillator();
        const sFilter = this.ctx.createBiquadFilter();
        const sGain = this.ctx.createGain();
        sOsc.type = 'sawtooth';
        sOsc.frequency.setValueAtTime(freq * 2, now);
        sFilter.type = 'lowpass';
        sFilter.frequency.setValueAtTime(1350, now);
        sFilter.frequency.exponentialRampToValueAtTime(420, now + 0.32);

        sGain.gain.setValueAtTime(0.055, now);
        sGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.36);

        sOsc.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.bgmBus);
        sGain.connect(this.reverbBus.input);
        sOsc.start(now);
        sOsc.stop(now + 0.38);
      });
    }
  }

  async setAct(actNumber, force = false) {
    if (!force && this.currentAct === actNumber) return;
    if (actNumber !== 2 && this.broadcastActive) {
      this.stopBroadcast();
    }
    this.setCombatMusicMode(false);
    this.currentAct = actNumber;
    this.chordIndex = 0;

    if (!this.initialized) return;

    this._syncBgmDucking();

    const hasMp3 = Boolean(this.bgmManifest && this.bgmManifest[actNumber]);
    if (hasMp3) {
      const ok = await this.tryCrossfadeToMp3(actNumber);
      this.usingMp3ForCurrentAct = ok;
      if (ok) return;
    }

    // Fallback smoothly to procedural Web Audio Ambient BGM
    this.usingMp3ForCurrentAct = false;
    this.fadeOutAllMp3();
    this.triggerAmbientChord();
  }

  async tryCrossfadeToMp3(actNumber) {
    const url = `/audio/bgm_act${actNumber}.mp3`;
    try {
      if (!this.mp3Players[actNumber]) {
        const head = await fetch(url, { method: 'HEAD' });
        const contentType = head.headers.get('content-type') || '';
        if (!head.ok || !contentType.includes('audio')) {
          this.bgmManifest[actNumber] = false;
          return false;
        }
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0;
        audio.muted = this.muted;
        this.mp3Players[actNumber] = audio;
      }

      const targetAudio = this.mp3Players[actNumber];
      await targetAudio.play();

      // Crossfade volumes
      Object.entries(this.mp3Players).forEach(([id, audio]) => {
        if (!audio) return;
        const isTarget = Number(id) === actNumber;
        this.fadeHtmlAudio(audio, isTarget ? 0.48 : 0, 900, !isTarget);
      });
      this.activeMp3Act = actNumber;
      return true;
    } catch {
      this.bgmManifest[actNumber] = false;
      return false;
    }
  }

  fadeOutAllMp3() {
    Object.values(this.mp3Players).forEach((audio) => {
      if (audio && !audio.paused) {
        this.fadeHtmlAudio(audio, 0, 800, true);
      }
    });
    this.activeMp3Act = null;
  }

  fadeHtmlAudio(audio, targetVolume, durationMs = 800, pauseOnZero = false) {
    const startVol = audio.volume;
    const steps = 16;
    const stepTime = durationMs / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const t = step / steps;
      audio.volume = Math.max(0, Math.min(1, startVol + (targetVolume - startVol) * t));
      if (step >= steps) {
        clearInterval(interval);
        if (pauseOnZero && targetVolume === 0) {
          audio.pause();
        }
      }
    }, stepTime);
  }

  startAmbientLoop() {
    if (this.ambientTimer) clearInterval(this.ambientTimer);
    this.triggerAmbientChord();
    this.ambientTimer = setInterval(() => {
      if (!this.initialized || this.usingMp3ForCurrentAct || this.combatMusicActive) return;
      this.triggerAmbientChord();
    }, 4200);
  }

  triggerAmbientChord() {
    if (!this.initialized || !this.ctx || this.usingMp3ForCurrentAct || this.combatMusicActive) {
      return;
    }

    const cfg = ACT_CHORDS[this.currentAct] || ACT_CHORDS[1];
    const chord = cfg.chords[this.chordIndex % cfg.chords.length];
    this.chordIndex++;

    const now = this.ctx.currentTime;
    const dur = 4.8;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cfg.padFilterHz, now);

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(0.16, now + 1.35);
    chordGain.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    filter.connect(chordGain);
    chordGain.connect(this.bgmBus);
    chordGain.connect(this.reverbBus.input);

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx % 2 === 0 ? 1 : -1) * 4.5, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + dur + 0.1);
    });

    // Gentle melodic note on top
    if (cfg.melody && cfg.melody.length > 0) {
      const noteFreq = cfg.melody[(this.chordIndex + Math.floor(Math.random() * 2)) % cfg.melody.length];
      const noteDelay = 0.65 + Math.random() * 1.1;
      const mOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      mOsc.type = cfg.melodyWave || 'sine';
      mOsc.frequency.setValueAtTime(noteFreq, now + noteDelay);

      mGain.gain.setValueAtTime(0.0001, now + noteDelay);
      mGain.gain.linearRampToValueAtTime(0.065, now + noteDelay + 0.12);
      mGain.gain.exponentialRampToValueAtTime(0.0005, now + noteDelay + 2.1);

      mOsc.connect(mGain);
      mGain.connect(this.bgmBus);
      mGain.connect(this.reverbBus.input);

      mOsc.start(now + noteDelay);
      mOsc.stop(now + noteDelay + 2.2);
    }
  }

  // ==================== PROCEDURAL SFX ====================

  /** Tiếng bước chân trầm thay đổi nhẹ theo địa hình 4 màn */
  playFootstep(act = 1) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    // Sub thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const basePitch = act === 4 ? 128 : 96 + (Math.random() * 14 - 7);
    osc.frequency.setValueAtTime(basePitch, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.11);

    // Subtle surface texture brush
    if (this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = act === 1 ? 1500 : act === 2 ? 950 : act === 3 ? 720 : 1900;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.06, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      nSrc.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxBus);
      nSrc.start(now, Math.random() * 1.5, 0.07);
    }
  }

  /** Tiếng bật nhảy êm nhẹ (cloth/breath impulse phong cách Limbo/Gris) */
  playJump() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(215, now + 0.11);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.14);

    if (this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 920;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.045, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      nSrc.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxBus);
      nSrc.start(now, Math.random(), 0.1);
    }
  }

  /** Tiếng tiếp đất đằm chắc */
  playLand(act = 1) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(act === 4 ? 108 : 84, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.14);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** Giai điệu ngân ấm khi chuyển giao thế hệ cuối Màn 2 & Màn 3 */
  playHandoffChime() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [392.0, 493.88, 587.33, 783.99].forEach((freq, idx) => {
      const t = now + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 2.4);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(t);
      osc.stop(t + 2.5);
    });
  }

  /** Tiếng gõ chữ typewriter thanh nhẹ phong cách kể chuyện */
  playTypewriter() {
    if (!this.initialized) return;
    const nowMs = performance.now();
    if (nowMs - this.lastTypewriterAt < 42) return;
    this.lastTypewriterAt = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const pitch = 780 + Math.random() * 180;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.028);

    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.036);
  }

  /** Tiếng mở tư liệu lịch sử [E] */
  playModalOpen() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.001, now + i * 0.055);
      gain.gain.linearRampToValueAtTime(0.11, now + i * 0.055 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.055 + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.6);
    });
  }

  /** Tiếng còi báo động tuần tra / không kích */
  playSiren() {
    if (!this.initialized) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSirenAt < 2600) return;
    this.lastSirenAt = nowMs;

    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 680;
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.35);
    gain.gain.setValueAtTime(0.13, now + 1.25);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.95);

    filter.connect(gain);
    gain.connect(this.sfxBus);
    gain.connect(this.reverbBus.input);

    [0, 5].forEach((detuneHz) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340 + detuneHz, now);
      osc.frequency.linearRampToValueAtTime(610 + detuneHz, now + 0.85);
      osc.frequency.linearRampToValueAtTime(370 + detuneHz, now + 1.9);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + 2.0);
    });
  }

  /** Tiếng bass trầm khi bước vào Slow-motion QTE */
  playSlowMoEnter() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.55);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  /** Tiếng "keng" vang sáng khi bấm trúng QTE */
  playQteHit(stepIndex = 0) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const root = 880 * Math.pow(1.12246, stepIndex); // Steps up pleasingly per hit

    const ratios = [1, 1.5, 2, 2.99];
    ratios.forEach((ratio, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(root * ratio, now);

      const peak = idx === 0 ? 0.22 : 0.11 / idx;
      gain.gain.setValueAtTime(peak, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  /** Tiếng búa nện phá cổng kho thóc */
  playHammerHit(hitNumber = 1) {
    this.playQteHit(hitNumber);
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190 + hitNumber * 22, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.2);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  /** Âm thanh chiến thắng hào sảng khi hoàn thành trọn vẹn cụm QTE */
  playQteVictory() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const t = now + i * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 1.35);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(t);
      osc.stop(t + 1.4);
    });
  }

  /** Âm thanh khích lệ êm nhẹ khi lỡ nhịp QTE (Fail-safe) */
  playQteRetry() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [329.63, 261.63].forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /** Tiếng nổ pháo kích / bom nổ trầm hùng */
  playExplosion(power = 1.0) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const scale = Math.max(0.4, Math.min(1.5, power));

    // Sub boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(92, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.75 * scale);

    subGain.gain.setValueAtTime(0.42 * scale, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85 * scale);

    sub.connect(subGain);
    subGain.connect(this.sfxBus);
    sub.start(now);
    sub.stop(now + 0.9 * scale);

    // Filtered roar noise
    if (this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1100, now);
      lowpass.frequency.exponentialRampToValueAtTime(140, now + 1.15 * scale);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.45 * scale, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25 * scale);

      nSrc.connect(lowpass);
      lowpass.connect(nGain);
      nGain.connect(this.sfxBus);
      nGain.connect(this.reverbBus.input);

      nSrc.start(now, 0, 1.35 * scale);
    }
  }

  /** Âm thanh dâng trào khi giữ phím [F] thắp nén tâm hương ở Đài tưởng niệm */
  updateIncenseCharge(progress = 0, active = false) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    if (active && progress > 0) {
      if (!this.incenseOscs) {
        this.incenseGain = this.ctx.createGain();
        this.incenseGain.gain.setValueAtTime(0.001, now);
        this.incenseGain.connect(this.sfxBus);
        this.incenseGain.connect(this.reverbBus.input);

        const freqs = [261.63, 392.0, 523.25];
        this.incenseOscs = freqs.map((f, idx) => {
          const osc = this.ctx.createOscillator();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(f, now);
          osc.connect(this.incenseGain);
          osc.start(now);
          return { osc, base: f };
        });
      }
      const targetVol = 0.04 + progress * 0.2;
      this.incenseGain.gain.setTargetAtTime(targetVol, now, 0.08);
      this.incenseOscs.forEach(({ osc, base }) => {
        osc.frequency.setTargetAtTime(base * (1 + progress * 0.25), now, 0.08);
      });
    } else if (this.incenseOscs) {
      const oscs = this.incenseOscs;
      const gain = this.incenseGain;
      this.incenseOscs = null;
      this.incenseGain = null;
      gain.gain.setTargetAtTime(0.0001, now, 0.12);
      setTimeout(() => {
        oscs.forEach(({ osc }) => {
          try {
            osc.stop();
          } catch {
            // Ignore
          }
        });
      }, 300);
    }
  }

  /** Giai điệu thiêng liêng bừng nở khi thắp hương hoàn tất & bóng Ông - Cha hiện lên */
  playIncenseComplete() {
    this.updateIncenseCharge(0, false);
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    const sacredChord = [261.63, 329.63, 392.0, 493.88, 523.25, 659.25, 783.99, 1046.5];
    sacredChord.forEach((freq, idx) => {
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx < 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0005, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 4.2);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(t);
      osc.stop(t + 4.35);
    });
  }

  /** Tiếng vung búa / đuốc chém gió mạnh mẽ (Màn 1) */
  playMeleeSwing() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    if (this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.16);
      filter.Q.value = 1.4;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      nSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxBus);
      nSrc.start(now, Math.random(), 0.18);
    }
  }

  /** Tiếng ném bom xăng / lựu đạn vút theo đường cong parabol (Màn 2) */
  playGrenadeThrow() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(590, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.34);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  /** Tiếng súng tiểu liên AK-47 / Hỏa lực súng máy giòn đanh (Màn 2 & 3) */
  playMachineGunBurst(shots = 3, pitchBase = 175) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    for (let i = 0; i < shots; i++) {
      const t = now + i * 0.058;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitchBase + (Math.random() * 24 - 12), t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.048);

      gain.gain.setValueAtTime(0.19, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.052);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.056);

      if (this.noiseBuffer) {
        const nSrc = this.ctx.createBufferSource();
        nSrc.buffer = this.noiseBuffer;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1200;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.12, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        nSrc.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.sfxBus);
        nSrc.start(t, Math.random(), 0.045);
      }
    }
  }

  /** Tiếng Khẩu đội Pháo cao xạ 37mm nòng đôi điểm xạ uy lực ("PÙNG - PÙNG!") */
  playAntiAircraftFire() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;

    for (let b = 0; b < 2; b++) {
      const t = now + b * 0.095;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165 - b * 12, t);
      osc.frequency.exponentialRampToValueAtTime(36, t + 0.19);

      gain.gain.setValueAtTime(0.34, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.21);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(t);
      osc.stop(t + 0.23);
    }
  }

  /** Tiếng cảnh báo bị đèn pha / đạn địch đẩy lùi nhẹ (không dừng game) */
  playAlertHit() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    [440, 311.13].forEach((freq, idx) => {
      const t = now + idx * 0.075;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  /** Tiếng pháo hoa ánh sáng Đổi mới lung linh trên bầu trời đô thị (Màn 4) */
  playDawnFirework() {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const sparkle = [587.33, 783.99, 987.77, 1174.66, 1567.98];
    sparkle.forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.95);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbBus.input);
      osc.start(t);
      osc.stop(t + 1.0);
    });
  }

  /** Tiếng còi bom rít dài từ bầu trời lao xuống khẩu pháo cao xạ (Màn 3A) */
  playBombWhistle() {
    if (!this.initialized) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBombWhistleAt < 500) return;
    this.lastBombWhistleAt = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1080, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.95);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    gain.connect(this.reverbBus.input);
    osc.start(now);
    osc.stop(now + 1.04);
  }

  /** Tiếng bíp hẹn giờ khối bộc phá 2.0s sát Lô cốt Điện Biên Phủ (Màn 2B) */
  playChargeBeep(urgent = false) {
    if (!this.initialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(urgent ? 1240 : 880, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(now);
    osc.stop(now + 0.09);
  }
}

