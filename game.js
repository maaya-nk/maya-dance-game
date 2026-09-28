/**
 * MAYA DANCE CHALLENGE - GAME ENGINE
 * Pure Vanilla JavaScript & HTML5 Web Audio API
 */

(function () {
  'use strict';

  /* ==========================================================
     1. CONSTANTS & MOVE DEFINITIONS
     ========================================================== */
  const MOVES = {
    left: {
      id: 'left',
      name: 'Left Step',
      emoji: '⬅️',
      color: '#ff6b8b',
      keys: ['ArrowLeft', 'KeyA', 'a', 'A'],
      animation: 'dance-left',
      audioNote: 261.63 // C4
    },
    up: {
      id: 'up',
      name: 'Jump High',
      emoji: '⬆️',
      color: '#4d80e4',
      keys: ['ArrowUp', 'KeyW', 'w', 'W'],
      animation: 'dance-up',
      audioNote: 329.63 // E4
    },
    down: {
      id: 'down',
      name: 'Shimmy Down',
      emoji: '⬇️',
      color: '#ffd166',
      keys: ['ArrowDown', 'KeyS', 's', 'S'],
      animation: 'dance-down',
      audioNote: 220.00 // A3
    },
    right: {
      id: 'right',
      name: 'Right Step',
      emoji: '➡️',
      color: '#06d6a0',
      keys: ['ArrowRight', 'KeyD', 'd', 'D'],
      animation: 'dance-right',
      audioNote: 392.00 // G4
    },
    spin: {
      id: 'spin',
      name: 'Star Twirl',
      emoji: '🌀',
      color: '#9b51e0',
      keys: ['Space', ' ', 'Enter'],
      animation: 'dance-spin',
      audioNote: 523.25 // C5
    }
  };

  const MOVE_KEYS = Object.keys(MOVES);

  /* ==========================================================
     2. AUDIO SYNTHESIZER (WEB AUDIO API)
     ========================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.masterGain = null;
      this.musicEnabled = true;
      this.sfxEnabled = true;
      this.isPlayingMusic = false;
      this.musicTimer = null;
      this.currentBeat = 0;
      this.tempoBPM = 100;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.42 : 0, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.75 : 0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      } catch (e) {
        console.warn('Web Audio API not supported or blocked:', e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMusic() {
      this.musicEnabled = !this.musicEnabled;
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.42 : 0, this.ctx.currentTime);
      }
      return this.musicEnabled;
    }

    toggleSfx() {
      this.sfxEnabled = !this.sfxEnabled;
      if (this.sfxGain && this.ctx) {
        this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.75 : 0, this.ctx.currentTime);
      }
      return this.sfxEnabled;
    }

    /* Sound Effects */
    playMoveSound(moveId) {
      if (!this.sfxEnabled || !this.ctx) return;
      this.resume();
      const move = MOVES[moveId];
      if (!move) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(move.audioNote, now);
      osc.frequency.exponentialRampToValueAtTime(move.audioNote * 1.45, now + 0.14);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.2);
    }

    playJudgmentSound(quality) {
      if (!this.sfxEnabled || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;

      if (quality === 'perfect') {
        // High sparkling dual chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.04);
          gain.gain.setValueAtTime(0.25, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.28);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.28);
        });
      } else if (quality === 'great') {
        [440, 554.37, 659.25].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.25);
        });
      } else if (quality === 'nice') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        // Miss / Oops sound: gentle soft boing
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    }

    playCountdownSound(isFinal) {
      if (!this.sfxEnabled || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.35 : 0.15));
    }

    playVictoryFanfare() {
      if (!this.sfxEnabled || !this.ctx) return;
      this.resume();
      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.50, d: 0.35 } // C6
      ];
      let t = this.ctx.currentTime;
      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);
        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + n.d);
        t += n.d * 0.9;
      });
    }

    /* Dynamic Pop Beat Synthesizer */
    startMusic(tempoBPM = 105) {
      this.init();
      this.resume();
      this.stopMusic();

      this.tempoBPM = tempoBPM;
      this.isPlayingMusic = true;
      this.currentBeat = 0;

      const scheduleLoop = () => {
        if (!this.isPlayingMusic) return;
        this.playBeatSlice(this.currentBeat);
        this.currentBeat = (this.currentBeat + 1) % 16;
        const intervalMs = (60 / this.tempoBPM / 2) * 1000;
        this.musicTimer = setTimeout(scheduleLoop, intervalMs);
      };

      scheduleLoop();
    }

    stopMusic() {
      this.isPlayingMusic = false;
      if (this.musicTimer) {
        clearTimeout(this.musicTimer);
        this.musicTimer = null;
      }
    }

    playBeatSlice(beatIndex) {
      if (!this.ctx || !this.musicEnabled) return;
      const now = this.ctx.currentTime;

      // 1. Kick drum on beats 0, 4, 8, 12 (Quarter notes)
      if (beatIndex % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
        kickGain.gain.setValueAtTime(0.38, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // 2. Snare / Clap on beats 4, 12
      if (beatIndex === 4 || beatIndex === 12) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, now);
        snareGain.gain.setValueAtTime(0.18, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.1);
      }

      // 3. Hi-hat on every off-beat
      if (beatIndex % 2 === 1) {
        const hihatOsc = this.ctx.createOscillator();
        const hihatGain = this.ctx.createGain();
        hihatOsc.type = 'sawtooth';
        hihatOsc.frequency.setValueAtTime(5800, now);
        hihatGain.gain.setValueAtTime(0.035, now);
        hihatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        hihatOsc.connect(hihatGain);
        hihatGain.connect(this.musicGain);
        hihatOsc.start(now);
        hihatOsc.stop(now + 0.04);
      }

      // 4. Bassline (Cute bouncy walking bass)
      const bassNotes = [130.81, 130.81, 164.81, 196.00, 174.61, 174.61, 196.00, 220.00];
      if (beatIndex % 2 === 0) {
        const bassFreq = bassNotes[(beatIndex / 2) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.16, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.18);
      }

      // 5. Cheerful Melody Lead
      const melodyPattern = [
        523.25, 0, 587.33, 0, 659.25, 0, 587.33, 523.25,
        659.25, 0, 783.99, 0, 880.00, 783.99, 659.25, 0
      ];
      const melodyFreq = melodyPattern[beatIndex];
      if (melodyFreq > 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melodyFreq, now);
        melGain.gain.setValueAtTime(0.12, now);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        melOsc.connect(melGain);
        melGain.connect(this.musicGain);
        melOsc.start(now);
        melOsc.stop(now + 0.14);
      }
    }
  }

  /* ==========================================================
     3. MAYA CHARACTER SVG COMPONENT
     ========================================================== */
  function createMayaSvg(p = 'm') {
    return `
      <svg class="maya-svg" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Unique Gradients for this instance -->
          <linearGradient id="${p}Skin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffeaa7" />
            <stop offset="100%" stop-color="#ffd599" />
          </linearGradient>
          <linearGradient id="${p}Hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4a2511" />
            <stop offset="100%" stop-color="#2d1508" />
          </linearGradient>
          <linearGradient id="${p}Hoodie" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff758c" />
            <stop offset="100%" stop-color="#ff7eb3" />
          </linearGradient>
          <linearGradient id="${p}Skirt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#a29bfe" />
            <stop offset="100%" stop-color="#6c5ce7" />
          </linearGradient>
        </defs>

        <!-- Entire Character Body Group -->
        <g class="maya-body">
          <!-- Legs & Cute Sneakers -->
          <g class="maya-legs">
            <!-- Left Leg -->
            <rect x="38" y="90" width="8" height="18" rx="4" fill="url(#${p}Skin)" />
            <!-- Left Sneaker -->
            <path d="M 36 106 Q 38 102 46 102 L 48 108 L 34 108 Z" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.8"/>
            <rect x="34" y="107" width="14" height="2" rx="1" fill="#ff758c" />

            <!-- Right Leg -->
            <rect x="54" y="90" width="8" height="18" rx="4" fill="url(#${p}Skin)" />
            <!-- Right Sneaker -->
            <path d="M 52 106 Q 54 102 62 102 L 64 108 L 50 108 Z" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.8"/>
            <rect x="50" y="107" width="14" height="2" rx="1" fill="#ff758c" />
          </g>

          <!-- Pleated Skirt -->
          <path d="M 33 80 L 67 80 L 73 92 L 27 92 Z" fill="url(#${p}Skirt)" rx="2" />
          <line x1="43" y1="80" x2="40" y2="92" stroke="#5b48d8" stroke-width="1.2" />
          <line x1="50" y1="80" x2="50" y2="92" stroke="#5b48d8" stroke-width="1.2" />
          <line x1="57" y1="80" x2="60" y2="92" stroke="#5b48d8" stroke-width="1.2" />

          <!-- Torso / Pastel Dance Hoodie -->
          <path d="M 35 60 L 65 60 L 67 81 L 33 81 Z" fill="url(#${p}Hoodie)" rx="4" />
          <!-- Star Decal on Hoodie -->
          <polygon points="50,65 52,70 57,70 53,73 55,78 50,75 45,78 47,73 43,70 48,70" fill="#ffd166" />
          <!-- Cute Collar -->
          <path d="M 42 60 Q 50 66 58 60" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />

          <!-- Left Arm & Hand -->
          <g class="maya-arm maya-arm-left">
            <rect x="23" y="60" width="10" height="22" rx="5" fill="url(#${p}Hoodie)" />
            <circle cx="28" cy="84" r="4.5" fill="url(#${p}Skin)" />
          </g>

          <!-- Right Arm & Hand -->
          <g class="maya-arm maya-arm-right">
            <rect x="67" y="60" width="10" height="22" rx="5" fill="url(#${p}Hoodie)" />
            <circle cx="72" cy="84" r="4.5" fill="url(#${p}Skin)" />
          </g>

          <!-- Head & Hair -->
          <g class="maya-head">
            <!-- Left Bun + Bow -->
            <circle cx="26" cy="22" r="11" fill="url(#${p}Hair)" />
            <polygon points="26,22 21,17 21,27" fill="#ff7eb3" />
            <polygon points="26,22 31,17 31,27" fill="#ff7eb3" />
            <circle cx="26" cy="22" r="2.5" fill="#ffeaa7" />

            <!-- Right Bun + Bow -->
            <circle cx="74" cy="22" r="11" fill="url(#${p}Hair)" />
            <polygon points="74,22 69,17 69,27" fill="#ff7eb3" />
            <polygon points="74,22 79,17 79,27" fill="#ff7eb3" />
            <circle cx="74" cy="22" r="2.5" fill="#ffeaa7" />

            <!-- Main Hair Backing -->
            <circle cx="50" cy="38" r="24" fill="url(#${p}Hair)" />

            <!-- Neck -->
            <rect x="46" y="52" width="8" height="9" rx="2" fill="url(#${p}Skin)" />

            <!-- Face -->
            <circle cx="50" cy="40" r="20" fill="url(#${p}Skin)" />

            <!-- Cheerful Eyes -->
            <ellipse cx="42" cy="39" rx="3.5" ry="4.5" fill="#2d1508" />
            <circle cx="41" cy="37" r="1.5" fill="#ffffff" />
            <circle cx="43" cy="41" r="0.7" fill="#ffffff" />

            <ellipse cx="58" cy="39" rx="3.5" ry="4.5" fill="#2d1508" />
            <circle cx="57" cy="37" r="1.5" fill="#ffffff" />
            <circle cx="59" cy="41" r="0.7" fill="#ffffff" />

            <!-- Eyebrows -->
            <path d="M 39 32 Q 42 30 45 32" fill="none" stroke="#2d1508" stroke-width="1.2" stroke-linecap="round" />
            <path d="M 55 32 Q 58 30 61 32" fill="none" stroke="#2d1508" stroke-width="1.2" stroke-linecap="round" />

            <!-- Sweet Rosy Cheeks -->
            <ellipse cx="37" cy="45" rx="3.5" ry="2" fill="#ff7675" opacity="0.6" />
            <ellipse cx="63" cy="45" rx="3.5" ry="2" fill="#ff7675" opacity="0.6" />

            <!-- Happy Smile (Standard) -->
            <path class="maya-mouth-smile" d="M 46 46 Q 50 51 54 46" fill="none" stroke="#b33939" stroke-width="1.8" stroke-linecap="round" />
            <!-- Joyous Open Grin (Hidden by default) -->
            <path class="maya-mouth-laugh" d="M 45 46 Q 50 54 55 46 Z" fill="#b33939" opacity="0" />

            <!-- Hair Bangs & Locks -->
            <path d="M 30 35 Q 50 24 70 35 Q 65 24 50 23 Q 35 24 30 35 Z" fill="url(#${p}Hair)" />
            <path d="M 45 25 Q 50 36 53 26" fill="url(#${p}Hair)" />
            <path d="M 31 35 Q 28 46 32 50 Q 30 43 33 38 Z" fill="url(#${p}Hair)" />
            <path d="M 69 35 Q 72 46 68 50 Q 70 43 67 38 Z" fill="url(#${p}Hair)" />
          </g>
        </g>
      </svg>
    `;
  }

  /* ==========================================================
     4. GAME MANAGER & CHALLENGE CONTROLLER
     ========================================================== */
  class MayaDanceGame {
    constructor() {
      this.sound = new SoundEngine();

      // UI References
      this.screens = {
        start: document.getElementById('screen-start'),
        game: document.getElementById('screen-game'),
        result: document.getElementById('screen-result')
      };

      // Character DOM targets
      this.previewMaya = document.getElementById('maya-preview');
      this.stageMaya = document.getElementById('maya-stage');
      this.resultMaya = document.getElementById('maya-result');

      // Stage HUD & Elements
      this.hudChallengeName = document.getElementById('hud-challenge-name');
      this.hudProgressText = document.getElementById('hud-progress-text');
      this.hudScoreVal = document.getElementById('hud-score-val');
      this.hudComboVal = document.getElementById('hud-combo-val');
      this.hudStars = [
        document.getElementById('star-1'),
        document.getElementById('star-2'),
        document.getElementById('star-3')
      ];

      this.stageStatusMsg = document.getElementById('stage-status-msg');
      this.targetCueBox = document.getElementById('target-cue-box');
      this.beatRing = document.getElementById('beat-ring');
      this.cueIcon = document.getElementById('cue-icon');
      this.cueLabel = document.getElementById('cue-label');

      this.rhythmRunway = document.getElementById('rhythm-runway');
      this.runwayNotesLayer = document.getElementById('runway-notes-layer');

      this.sequenceDisplay = document.getElementById('sequence-display');
      this.sequenceStepsRow = document.getElementById('sequence-steps-row');

      this.judgmentText = document.getElementById('judgment-text');
      this.sparklesContainer = document.getElementById('dance-sparkles-container');

      // Result Elements
      this.resScore = document.getElementById('res-score');
      this.resCombo = document.getElementById('res-combo');
      this.resPerfects = document.getElementById('res-perfects');
      this.resAccuracy = document.getElementById('res-accuracy');
      this.resStars = [
        document.getElementById('res-star-1'),
        document.getElementById('res-star-2'),
        document.getElementById('res-star-3')
      ];
      this.resultTitle = document.getElementById('result-title');
      this.resultSubtitle = document.getElementById('result-subtitle');
      this.resultRankText = document.getElementById('result-rank-text');

      // Buttons
      this.btnStartGame = document.getElementById('btn-start-game');
      this.btnQuitGame = document.getElementById('btn-quit-game');
      this.btnReplay = document.getElementById('btn-replay');
      this.btnMenu = document.getElementById('btn-menu');
      this.btnMusic = document.getElementById('btn-music');
      this.btnSound = document.getElementById('btn-sound');
      this.danceButtons = document.querySelectorAll('.dance-btn');
      this.modeCards = document.querySelectorAll('.mode-card');

      // Game State
      this.currentMode = 'full';
      this.stageList = [];
      this.currentStageIndex = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.perfectCount = 0;
      this.greatCount = 0;
      this.niceCount = 0;
      this.missCount = 0;
      this.totalMoves = 0;

      this.isAcceptingInput = false;
      this.expectedMove = null;
      this.activeTimers = [];
      this.inputWindowStart = 0;
      this.inputWindowDuration = 1000;
      this.hasHitCurrentPrompt = false;

      // Confetti instance
      this.confetti = new ConfettiRenderer(document.getElementById('confetti-canvas'));

      this.init();
    }

    init() {
      // Inject Maya SVG with unique gradient prefixes
      this.previewMaya.innerHTML = createMayaSvg('prev');
      this.stageMaya.innerHTML = createMayaSvg('stg');
      this.resultMaya.innerHTML = createMayaSvg('res');

      this.bindEvents();
      this.setMode('full');
    }

    bindEvents() {
      // Start Game
      this.btnStartGame.addEventListener('click', () => {
        this.sound.init();
        this.startChallengeFlow();
      });

      // Quit Stage / Back
      this.btnQuitGame.addEventListener('click', () => {
        this.stopAllGameLoops();
        this.sound.stopMusic();
        this.showScreen('start');
      });

      // Replay / Menu
      this.btnReplay.addEventListener('click', () => {
        this.startChallengeFlow();
      });
      this.btnMenu.addEventListener('click', () => {
        this.showScreen('start');
      });

      // Audio Toggles
      this.btnMusic.addEventListener('click', () => {
        const on = this.sound.toggleMusic();
        this.btnMusic.classList.toggle('muted', !on);
        this.btnMusic.querySelector('.btn-text').textContent = on ? 'Music: On' : 'Music: Off';
      });

      this.btnSound.addEventListener('click', () => {
        const on = this.sound.toggleSfx();
        this.btnSound.classList.toggle('muted', !on);
        this.btnSound.querySelector('.btn-text').textContent = on ? 'SFX: On' : 'SFX: Off';
      });

      // Mode Selection
      this.modeCards.forEach((card) => {
        card.addEventListener('click', () => {
          this.modeCards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          this.setMode(card.dataset.mode);
        });
      });

      // Interactive Dance Buttons (Mouse / Touch)
      this.danceButtons.forEach((btn) => {
        const move = btn.dataset.move;
        const trigger = (e) => {
          e.preventDefault();
          this.handlePlayerMove(move);
          btn.classList.add('active');
          setTimeout(() => btn.classList.remove('active'), 180);
        };
        btn.addEventListener('mousedown', trigger);
        btn.addEventListener('touchstart', trigger, { passive: false });
      });

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (!this.screens.game.classList.contains('active')) return;

        for (const moveId of MOVE_KEYS) {
          const move = MOVES[moveId];
          if (move.keys.includes(e.code) || move.keys.includes(e.key)) {
            e.preventDefault();
            this.handlePlayerMove(moveId);

            const btn = document.querySelector(`.dance-btn[data-move="${moveId}"]`);
            if (btn) {
              btn.classList.add('active');
              setTimeout(() => btn.classList.remove('active'), 180);
            }
            break;
          }
        }
      });
    }

    setMode(mode) {
      this.currentMode = mode;
    }

    showScreen(screenKey) {
      Object.keys(this.screens).forEach((key) => {
        this.screens[key].classList.toggle('active', key === screenKey);
      });
      if (screenKey !== 'result') {
        this.confetti.stop();
      }
    }

    /* ==========================================================
       STAGE FLOW & CHALLENGE LOGIC
       ========================================================== */
    startChallengeFlow() {
      if (this.currentMode === 'full') {
        this.stageList = ['warmup', 'memory', 'rhythm', 'finale'];
      } else {
        this.stageList = [this.currentMode];
      }

      this.currentStageIndex = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.perfectCount = 0;
      this.greatCount = 0;
      this.niceCount = 0;
      this.missCount = 0;
      this.totalMoves = 0;

      this.updateHud();
      this.showScreen('game');
      this.runCurrentStage();
    }

    runCurrentStage() {
      this.stopAllGameLoops();
      const stage = this.stageList[this.currentStageIndex];

      this.setMayaPose('idle');
      this.rhythmRunway.classList.add('hidden');
      this.sequenceDisplay.classList.add('hidden');
      this.targetCueBox.style.display = 'flex';

      if (stage === 'warmup') {
        this.runWarmupChallenge();
      } else if (stage === 'memory') {
        this.runMemoryChallenge();
      } else if (stage === 'rhythm') {
        this.runRhythmChallenge();
      } else if (stage === 'finale') {
        this.runFinaleChallenge();
      }
    }

    /* ==========================================================
       CHALLENGE 1: WARM-UP GROOVE (Single Prompts)
       ========================================================== */
    runWarmupChallenge() {
      this.hudChallengeName.textContent = '1. Warm-Up Groove';
      this.sound.startMusic(95);

      const warmupMoves = ['left', 'right', 'up', 'down', 'left', 'right', 'up', 'spin'];
      let stepIndex = 0;

      this.showStatusCountdown('Get Ready!', 3, () => {
        const nextStep = () => {
          if (stepIndex >= warmupMoves.length) {
            this.onStageComplete();
            return;
          }

          const moveId = warmupMoves[stepIndex];
          const move = MOVES[moveId];
          stepIndex++;

          this.hudProgressText.textContent = `Move ${stepIndex} / ${warmupMoves.length}`;
          this.stageStatusMsg.textContent = `Maya says: ${move.name}!`;

          this.cueIcon.textContent = move.emoji;
          this.cueLabel.textContent = move.name;
          this.targetCueBox.style.borderColor = move.color;
          this.beatRing.classList.remove('pulsing');
          void this.beatRing.offsetWidth;
          this.beatRing.classList.add('pulsing');

          this.setMayaPose(move.animation);

          this.expectedMove = moveId;
          this.isAcceptingInput = true;
          this.hasHitCurrentPrompt = false;
          this.inputWindowStart = performance.now();
          this.inputWindowDuration = 1100;

          const timer = setTimeout(() => {
            if (this.isAcceptingInput && !this.hasHitCurrentPrompt) {
              this.evaluateMove(null);
            }
            this.isAcceptingInput = false;
            this.setMayaPose('idle');

            const delayTimer = setTimeout(nextStep, 600);
            this.activeTimers.push(delayTimer);
          }, this.inputWindowDuration);

          this.activeTimers.push(timer);
        };

        nextStep();
      });
    }

    /* ==========================================================
       CHALLENGE 2: MEMORY DANCE (Routine Copy)
       ========================================================== */
    runMemoryChallenge() {
      this.hudChallengeName.textContent = '2. Memory Dance';
      this.sound.startMusic(105);

      const routines = [
        ['left', 'right'],
        ['up', 'down', 'spin'],
        ['left', 'up', 'right', 'down']
      ];

      let roundIndex = 0;

      const playRound = () => {
        if (roundIndex >= routines.length) {
          this.onStageComplete();
          return;
        }

        const routine = routines[roundIndex];
        roundIndex++;
        this.hudProgressText.textContent = `Routine ${roundIndex} / ${routines.length}`;

        this.sequenceDisplay.classList.remove('hidden');
        this.sequenceStepsRow.innerHTML = '';
        routine.forEach((m) => {
          const item = document.createElement('div');
          item.className = 'seq-item';
          item.textContent = MOVES[m].emoji;
          this.sequenceStepsRow.appendChild(item);
        });

        // 1. Maya Demonstrates Routine
        this.stageStatusMsg.textContent = "👀 Watch Maya's Routine!";
        this.cueIcon.textContent = '👀';
        this.cueLabel.textContent = 'WATCH!';
        this.isAcceptingInput = false;

        let demoIndex = 0;
        const demoInterval = setInterval(() => {
          if (demoIndex >= routine.length) {
            clearInterval(demoInterval);
            const waitTimer = setTimeout(() => {
              this.setMayaPose('idle');
              this.startPlayerRoutineTurn(routine, playRound);
            }, 600);
            this.activeTimers.push(waitTimer);
            return;
          }

          const moveId = routine[demoIndex];
          const move = MOVES[moveId];

          const items = this.sequenceStepsRow.querySelectorAll('.seq-item');
          items.forEach((it, i) => it.classList.toggle('active', i === demoIndex));

          this.cueIcon.textContent = move.emoji;
          this.cueLabel.textContent = move.name;
          this.setMayaPose(move.animation);
          this.sound.playMoveSound(moveId);

          demoIndex++;
        }, 900);

        this.activeTimers.push(demoInterval);
      };

      this.showStatusCountdown('Watch closely!', 3, playRound);
    }

    startPlayerRoutineTurn(routine, onRoundComplete) {
      this.stageStatusMsg.textContent = '👉 YOUR TURN! Repeat the moves!';
      this.cueIcon.textContent = '✨';
      this.cueLabel.textContent = 'REPEAT!';

      let playerStep = 0;
      const items = this.sequenceStepsRow.querySelectorAll('.seq-item');
      items.forEach((it) => it.classList.remove('active', 'done'));
      if (items[0]) items[0].classList.add('active');

      this.isAcceptingInput = true;
      this.expectedMove = routine[playerStep];

      this.onRoutineMoveInput = (inputMove) => {
        if (!this.isAcceptingInput) return;

        if (inputMove === routine[playerStep]) {
          if (items[playerStep]) {
            items[playerStep].classList.remove('active');
            items[playerStep].classList.add('done');
          }

          this.triggerJudgment('perfect', 120);
          this.createSparkleBurst();
          this.setMayaPose(MOVES[inputMove].animation);

          playerStep++;

          if (playerStep >= routine.length) {
            this.isAcceptingInput = false;
            this.onRoutineMoveInput = null;
            this.stageStatusMsg.textContent = '🎉 Wonderful Routine!';
            this.sound.playJudgmentSound('perfect');

            const timer = setTimeout(() => {
              this.setMayaPose('idle');
              onRoundComplete();
            }, 900);
            this.activeTimers.push(timer);
          } else {
            this.expectedMove = routine[playerStep];
            if (items[playerStep]) items[playerStep].classList.add('active');
          }
        } else {
          this.triggerJudgment('miss', 0);
          this.stageStatusMsg.textContent = 'Oops! Try the routine again!';
          playerStep = 0;
          items.forEach((it) => it.classList.remove('active', 'done'));
          if (items[0]) items[0].classList.add('active');
          this.expectedMove = routine[0];
        }
      };
    }

    /* ==========================================================
       CHALLENGE 3: RHYTHM RUSH (Flowing Runway Beats)
       ========================================================== */
    runRhythmChallenge() {
      this.hudChallengeName.textContent = '3. Rhythm Rush';
      this.sound.startMusic(115);

      this.rhythmRunway.classList.remove('hidden');
      this.targetCueBox.style.display = 'none';

      const rushNotes = [
        { move: 'left', delay: 400 },
        { move: 'right', delay: 1200 },
        { move: 'up', delay: 2000 },
        { move: 'down', delay: 2800 },
        { move: 'left', delay: 3600 },
        { move: 'right', delay: 4400 },
        { move: 'spin', delay: 5200 },
        { move: 'up', delay: 6000 },
        { move: 'spin', delay: 6800 },
        { move: 'down', delay: 7600 }
      ];

      let notesCompleted = 0;
      this.showStatusCountdown('Catch the Beats!', 3, () => {
        this.stageStatusMsg.textContent = 'Hit the buttons when notes reach the target!';
        this.hudProgressText.textContent = `Notes 0 / ${rushNotes.length}`;

        const runwayWidth = this.rhythmRunway.offsetWidth || 400;
        const targetX = runwayWidth - 52;
        const travelDuration = 1800;

        rushNotes.forEach((item) => {
          const spawnTimer = setTimeout(() => {
            const noteEl = document.createElement('div');
            noteEl.className = 'runway-note';
            noteEl.style.backgroundColor = MOVES[item.move].color;
            noteEl.textContent = MOVES[item.move].emoji;
            noteEl.style.left = '0px';
            this.runwayNotesLayer.appendChild(noteEl);

            const startTime = performance.now();
            let noteHit = false;

            const animFrame = () => {
              const elapsed = performance.now() - startTime;
              const progress = elapsed / travelDuration;
              const currentX = progress * targetX;
              noteEl.style.left = `${currentX}px`;

              if (progress >= 0.82 && progress <= 1.18 && !noteHit) {
                this.expectedMove = item.move;
                this.isAcceptingInput = true;
                this.currentRunwayNote = {
                  el: noteEl,
                  targetProgress: 1.0,
                  currentProgress: progress,
                  move: item.move,
                  onHit: () => {
                    noteHit = true;
                    this.isAcceptingInput = false;
                    noteEl.remove();
                    notesCompleted++;
                    this.hudProgressText.textContent = `Notes ${notesCompleted} / ${rushNotes.length}`;
                    if (notesCompleted >= rushNotes.length) {
                      const completeTimer = setTimeout(() => this.onStageComplete(), 800);
                      this.activeTimers.push(completeTimer);
                    }
                  }
                };
              }

              if (progress > 1.25) {
                if (!noteHit) {
                  noteHit = true;
                  noteEl.remove();
                  this.triggerJudgment('miss', 0);
                  notesCompleted++;
                  this.hudProgressText.textContent = `Notes ${notesCompleted} / ${rushNotes.length}`;
                  if (notesCompleted >= rushNotes.length) {
                    const completeTimer = setTimeout(() => this.onStageComplete(), 800);
                    this.activeTimers.push(completeTimer);
                  }
                }
                return;
              }

              if (!noteHit && this.screens.game.classList.contains('active')) {
                requestAnimationFrame(animFrame);
              }
            };

            requestAnimationFrame(animFrame);
          }, item.delay);

          this.activeTimers.push(spawnTimer);
        });
      });
    }

    /* ==========================================================
       CHALLENGE 4: GRAND FINALE (Choreography Mashup)
       ========================================================== */
    runFinaleChallenge() {
      this.hudChallengeName.textContent = '4. Grand Finale';
      this.sound.startMusic(125);

      const finaleMoves = [
        'left', 'right', 'left', 'spin',
        'up', 'down', 'up', 'spin',
        'left', 'up', 'right', 'down', 'spin'
      ];
      let stepIndex = 0;

      this.showStatusCountdown('Grand Finale Party!', 3, () => {
        const nextStep = () => {
          if (stepIndex >= finaleMoves.length) {
            this.onStageComplete();
            return;
          }

          const moveId = finaleMoves[stepIndex];
          const move = MOVES[moveId];
          stepIndex++;

          this.hudProgressText.textContent = `Move ${stepIndex} / ${finaleMoves.length}`;
          this.stageStatusMsg.textContent = `Grand Move: ${move.name}!`;

          this.cueIcon.textContent = move.emoji;
          this.cueLabel.textContent = move.name;
          this.targetCueBox.style.borderColor = move.color;
          this.beatRing.classList.remove('pulsing');
          void this.beatRing.offsetWidth;
          this.beatRing.classList.add('pulsing');

          this.setMayaPose(move.animation);

          this.expectedMove = moveId;
          this.isAcceptingInput = true;
          this.hasHitCurrentPrompt = false;
          this.inputWindowStart = performance.now();
          this.inputWindowDuration = 880;

          const timer = setTimeout(() => {
            if (this.isAcceptingInput && !this.hasHitCurrentPrompt) {
              this.evaluateMove(null);
            }
            this.isAcceptingInput = false;
            this.setMayaPose('idle');

            const delayTimer = setTimeout(nextStep, 380);
            this.activeTimers.push(delayTimer);
          }, this.inputWindowDuration);

          this.activeTimers.push(timer);
        };

        nextStep();
      });
    }

    /* ==========================================================
       MOVE INPUT & JUDGMENT EVALUATION
       ========================================================== */
    handlePlayerMove(moveId) {
      this.sound.playMoveSound(moveId);

      // Memory Challenge input routing
      if (this.onRoutineMoveInput) {
        this.onRoutineMoveInput(moveId);
        return;
      }

      // Rhythm Rush runway input
      if (this.currentRunwayNote && this.isAcceptingInput) {
        if (moveId === this.currentRunwayNote.move) {
          const diff = Math.abs(this.currentRunwayNote.currentProgress - 1.0);
          let quality = 'perfect';
          let pts = 120;
          if (diff > 0.08) {
            quality = 'great';
            pts = 80;
          } else if (diff > 0.14) {
            quality = 'nice';
            pts = 50;
          }
          this.currentRunwayNote.onHit(quality);
          this.currentRunwayNote = null;
          this.triggerJudgment(quality, pts);
          this.createSparkleBurst();
          this.setMayaPose(MOVES[moveId].animation);
        } else {
          this.currentRunwayNote.onHit('miss');
          this.currentRunwayNote = null;
          this.triggerJudgment('miss', 0);
        }
        return;
      }

      // Single prompt evaluation (Warmup & Finale)
      if (!this.isAcceptingInput || this.hasHitCurrentPrompt) return;

      this.hasHitCurrentPrompt = true;
      this.evaluateMove(moveId);
    }

    evaluateMove(playerMove) {
      this.totalMoves++;

      if (!playerMove || playerMove !== this.expectedMove) {
        this.triggerJudgment('miss', 0);
        return;
      }

      const elapsed = performance.now() - this.inputWindowStart;
      const targetTime = this.inputWindowDuration * 0.55;
      const delta = Math.abs(elapsed - targetTime);

      let quality = 'perfect';
      let pts = 100;

      if (delta < 220) {
        quality = 'perfect';
        pts = 100;
      } else if (delta < 420) {
        quality = 'great';
        pts = 70;
      } else {
        quality = 'nice';
        pts = 45;
      }

      if (playerMove === 'spin') pts += 30;

      this.triggerJudgment(quality, pts);
      this.createSparkleBurst();
      this.setMayaPose(MOVES[playerMove].animation);
    }

    triggerJudgment(quality, basePoints) {
      this.judgmentText.className = 'judgment-text';
      void this.judgmentText.offsetWidth;

      if (quality === 'perfect') {
        this.perfectCount++;
        this.combo++;
        this.judgmentText.textContent = `PERFECT! +${basePoints}`;
        this.judgmentText.classList.add('animate-perfect');
        this.sound.playJudgmentSound('perfect');
        this.triggerSmileSmile();
      } else if (quality === 'great') {
        this.greatCount++;
        this.combo++;
        this.judgmentText.textContent = `GREAT! +${basePoints}`;
        this.judgmentText.classList.add('animate-great');
        this.sound.playJudgmentSound('great');
        this.triggerSmileSmile();
      } else if (quality === 'nice') {
        this.niceCount++;
        this.combo++;
        this.judgmentText.textContent = `NICE! +${basePoints}`;
        this.judgmentText.classList.add('animate-nice');
        this.sound.playJudgmentSound('nice');
      } else {
        this.missCount++;
        this.combo = 0;
        this.judgmentText.textContent = 'OOPS!';
        this.judgmentText.classList.add('animate-miss');
        this.sound.playJudgmentSound('miss');
      }

      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      let multiplier = 1.0;
      if (this.combo >= 10) multiplier = 2.5;
      else if (this.combo >= 6) multiplier = 2.0;
      else if (this.combo >= 3) multiplier = 1.5;

      this.score += Math.round(basePoints * multiplier);
      this.updateHud();
    }

    triggerSmileSmile() {
      const laughMouth = this.stageMaya.querySelector('.maya-mouth-laugh');
      const regularSmile = this.stageMaya.querySelector('.maya-mouth-smile');
      if (laughMouth && regularSmile) {
        laughMouth.style.opacity = '1';
        regularSmile.style.opacity = '0';
        setTimeout(() => {
          laughMouth.style.opacity = '0';
          regularSmile.style.opacity = '1';
        }, 320);
      }
    }

    updateHud() {
      this.hudScoreVal.textContent = this.score;
      this.hudComboVal.textContent = `${this.combo}x`;

      if (this.combo > 1) {
        this.hudComboVal.classList.add('bump');
        setTimeout(() => this.hudComboVal.classList.remove('bump'), 180);
      }

      const star1 = this.score >= 300;
      const star2 = this.score >= 800;
      const star3 = this.score >= 1400;

      this.hudStars[0].classList.toggle('active', star1);
      this.hudStars[1].classList.toggle('active', star2);
      this.hudStars[2].classList.toggle('active', star3);
    }

    setMayaPose(poseClass) {
      const poses = ['idle', 'dance-left', 'dance-right', 'dance-up', 'dance-down', 'dance-spin'];
      poses.forEach((p) => this.stageMaya.classList.remove(p));
      this.stageMaya.classList.add(poseClass);
    }

    createSparkleBurst() {
      for (let i = 0; i < 7; i++) {
        const p = document.createElement('div');
        p.className = 'sparkle-particle';
        p.textContent = ['✨', '⭐', '💖', '🎵'][Math.floor(Math.random() * 4)];
        p.style.left = `${45 + (Math.random() * 20 - 10)}%`;
        p.style.top = `${55 + (Math.random() * 20 - 10)}%`;
        p.style.fontSize = `${16 + Math.random() * 14}px`;

        const tx = `${(Math.random() - 0.5) * 160}px`;
        const ty = `${-40 - Math.random() * 120}px`;
        p.style.setProperty('--tx', tx);
        p.style.setProperty('--ty', ty);

        this.sparklesContainer.appendChild(p);
        setTimeout(() => p.remove(), 800);
      }
    }

    showStatusCountdown(message, seconds, onComplete) {
      let count = seconds;
      this.stageStatusMsg.textContent = `${message} (${count})`;
      this.sound.playCountdownSound(false);

      const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
          this.stageStatusMsg.textContent = `${message} (${count})`;
          this.sound.playCountdownSound(false);
        } else {
          clearInterval(countInterval);
          this.stageStatusMsg.textContent = '💃 DANCE!';
          this.sound.playCountdownSound(true);
          const t = setTimeout(onComplete, 400);
          this.activeTimers.push(t);
        }
      }, 700);

      this.activeTimers.push(countInterval);
    }

    onStageComplete() {
      this.stopAllGameLoops();
      this.currentStageIndex++;

      if (this.currentStageIndex < this.stageList.length) {
        this.stageStatusMsg.textContent = '🌟 STAGE CLEAR! Next Challenge coming up!';
        this.sound.playVictoryFanfare();
        const t = setTimeout(() => this.runCurrentStage(), 1600);
        this.activeTimers.push(t);
      } else {
        this.showFinalScoreScreen();
      }
    }

    showFinalScoreScreen() {
      this.sound.stopMusic();
      this.sound.playVictoryFanfare();
      this.showScreen('result');

      this.resScore.textContent = this.score;
      this.resCombo.textContent = `${this.maxCombo}x`;
      this.resPerfects.textContent = this.perfectCount;

      const totalAttempted = this.perfectCount + this.greatCount + this.niceCount + this.missCount;
      const accuracy = totalAttempted > 0
        ? Math.round(((this.perfectCount + this.greatCount * 0.7 + this.niceCount * 0.4) / totalAttempted) * 100)
        : 100;
      this.resAccuracy.textContent = `${accuracy}%`;

      let stars = 1;
      let title = 'Great Dancing!';
      let rank = '🌟 Rising Dance Star 🌟';

      if (this.score >= 1400 || (totalAttempted > 0 && accuracy >= 88)) {
        stars = 3;
        title = 'Spectacular Performance!';
        rank = '👑 Grand Dance Royalty 👑';
      } else if (this.score >= 700 || (totalAttempted > 0 && accuracy >= 68)) {
        stars = 2;
        title = 'Super Groovy!';
        rank = '⭐ Sparkle Rhythm Star ⭐';
      }

      this.resultTitle.textContent = title;
      this.resultRankText.textContent = rank;

      this.resStars.forEach((starEl, index) => {
        starEl.classList.remove('earned');
        if (index < stars) {
          setTimeout(() => starEl.classList.add('earned'), 300 * (index + 1));
        }
      });

      this.confetti.start();
    }

    stopAllGameLoops() {
      this.activeTimers.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
      this.activeTimers = [];
      this.isAcceptingInput = false;
      this.onRoutineMoveInput = null;
      this.currentRunwayNote = null;
      this.runwayNotesLayer.innerHTML = '';
      this.beatRing.classList.remove('pulsing');
    }
  }

  /* ==========================================================
     5. CONFETTI PARTICLE SYSTEM
     ========================================================== */
  class ConfettiRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animationId = null;
      this.colors = ['#ff6b8b', '#ffd166', '#06d6a0', '#4d80e4', '#a29bfe', '#ff9671'];

      window.addEventListener('resize', () => this.resize());
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    start() {
      this.resize();
      this.stop();
      this.particles = [];
      for (let i = 0; i < 90; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * -this.canvas.height * 0.5,
          size: Math.random() * 8 + 6,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2.5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8
        });
      }
      this.loop();
    }

    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    loop() {
      if (!this.canvas || !this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.y > this.canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * this.canvas.width;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      });

      this.animationId = requestAnimationFrame(() => this.loop());
    }
  }

  /* ==========================================================
     6. INITIALIZE ON DOM READY
     ========================================================== */
  window.addEventListener('DOMContentLoaded', () => {
    new MayaDanceGame();
  });
})();
