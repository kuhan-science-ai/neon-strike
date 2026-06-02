// UI System (Complete Screen Manager & HUD)
import { playerTeam } from './player.js';
import { enemyTeam } from './enemy.js';
import { input } from './input.js';
import { audio } from './audio.js';

class UIManager {
  constructor() {
    this.currentScreen = 'main-menu';
    this.selectedP1 = [];
    this.selectedP2 = [];
    this.gameMode = 'VS_AI'; // 'VS_AI', 'VS_PLAYER', 'TRAINING'
    this.onFightStartCallback = null;
    this.onResumeCallback = null;
    this.onRestartCallback = null;
    this.onMainMenuCallback = null;
  }

  init(engineCallbacks) {
    this.onFightStartCallback = engineCallbacks.startFight;
    this.onResumeCallback = engineCallbacks.resumeGame;
    this.onRestartCallback = engineCallbacks.restartGame;
    this.onMainMenuCallback = engineCallbacks.showMainMenu;

    this.bindEvents();
    this.updateDifficultySettings();
  }

  showScreen(screenId) {
    // Hide all overlays
    const overlays = document.querySelectorAll('.menu-overlay');
    overlays.forEach(overlay => {
      overlay.classList.add('hidden');
      overlay.classList.remove('active');
    });

    // Show selected overlay
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
    
    this.currentScreen = screenId;

    // Toggle Hud based on state
    const hud = document.getElementById('battle-hud');
    const trainPanel = document.getElementById('training-panel');
    const mobilePanel = document.getElementById('mobile-controller');

    if (screenId === 'battle-hud') {
      hud.classList.remove('hidden');
      if (this.gameMode === 'TRAINING') {
        trainPanel.classList.remove('hidden');
      } else {
        trainPanel.classList.add('hidden');
      }
      
      // Determine if coarse touch is present or mobile is active
      const isMobile = window.innerWidth <= 900 || window.matchMedia("(pointer: coarse)").matches;
      if (isMobile) {
        mobilePanel.classList.remove('hidden');
      } else {
        mobilePanel.classList.add('hidden');
      }
    } else {
      hud.classList.add('hidden');
      trainPanel.classList.add('hidden');
      mobilePanel.classList.add('hidden');
    }
  }

  bindEvents() {
    // Unlock and start audio context on click
    const unlockAudio = () => {
      audio.init();
      audio.startMusic();
      // Remove listeners so it only runs once
      document.body.removeEventListener('click', unlockAudio);
      document.body.removeEventListener('keydown', unlockAudio);
    };
    document.body.addEventListener('click', unlockAudio);
    document.body.addEventListener('keydown', unlockAudio);

    // Play button clicks dynamically
    document.body.addEventListener('click', (e) => {
      if (e.target.classList.contains('menu-btn') || e.target.closest('.char-card')) {
        audio.playMenuClick();
      }
    });

    // Main Menu Buttons
    document.getElementById('btn-vs-ai').addEventListener('click', () => {
      this.gameMode = 'VS_AI';
      this.openCharacterSelect();
    });

    document.getElementById('btn-vs-player').addEventListener('click', () => {
      this.gameMode = 'VS_PLAYER';
      this.openCharacterSelect();
    });

    document.getElementById('btn-training').addEventListener('click', () => {
      this.gameMode = 'TRAINING';
      this.openCharacterSelect();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showScreen('settings-menu');
    });

    // Settings back button
    document.getElementById('btn-settings-back').addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    // Character Select back button
    document.getElementById('btn-char-back').addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    // Fight button
    document.getElementById('btn-fight').addEventListener('click', () => {
      if (this.selectedP1.length === 2 && (this.selectedP2.length === 2 || this.gameMode === 'TRAINING' || this.gameMode === 'VS_AI')) {
        this.showScreen('battle-hud');
        document.activeElement?.blur(); // Release focus so keyboard inputs work immediately
        if (this.onFightStartCallback) {
          this.onFightStartCallback(
            this.selectedP1[0], this.selectedP1[1],
            this.selectedP2[0] || 'frost', this.selectedP2[1] || 'titan', // Fallbacks
            this.gameMode
          );
        }
      }
    });

    // Character selection cards
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const char = card.getAttribute('data-char');
        this.handleCharSelection(char);
      });
    });

    // Pause Menu buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.showScreen('battle-hud');
      if (this.onResumeCallback) this.onResumeCallback();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.showScreen('battle-hud');
      if (this.onRestartCallback) this.onRestartCallback();
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.showScreen('main-menu');
      if (this.onMainMenuCallback) this.onMainMenuCallback();
    });

    // Victory Screen buttons
    document.getElementById('btn-rematch').addEventListener('click', () => {
      this.showScreen('battle-hud');
      if (this.onRestartCallback) this.onRestartCallback();
    });

    document.getElementById('btn-victory-menu').addEventListener('click', () => {
      this.showScreen('main-menu');
      if (this.onMainMenuCallback) this.onMainMenuCallback();
    });

    // Difficulty Settings listener
    document.getElementById('setting-difficulty').addEventListener('change', (e) => {
      this.updateDifficultySettings();
    });
  }

  updateDifficultySettings() {
    const diff = document.getElementById('setting-difficulty').value;
    enemyTeam.aiDifficulty = diff;
  }

  openCharacterSelect() {
    this.selectedP1 = [];
    this.selectedP2 = [];
    this.updateCharacterSlots();
    this.showScreen('char-select');

    // Reset card highlight styles
    document.querySelectorAll('.char-card').forEach(c => {
      c.classList.remove('active-p1', 'active-p2');
    });

    // If training mode, auto-fill P2
    if (this.gameMode === 'TRAINING') {
      this.selectedP2 = ['titan', 'volt'];
      this.updateCharacterSlots();
    }
  }

  handleCharSelection(char) {
    // Check if we are selecting for P1 or P2
    if (this.selectedP1.length < 2) {
      if (this.selectedP1.includes(char)) return; // No duplicates in same team
      this.selectedP1.push(char);
      
      // Update UI cards
      const card = document.querySelector(`.char-card[data-char="${char}"]`);
      if (card) card.classList.add('active-p1');

      // Auto-fill P2 selection in VS AI or Training
      if (this.gameMode === 'VS_AI' && this.selectedP1.length === 2) {
        // Auto select two remaining characters for CPU
        const pool = ['blaze', 'frost', 'volt', 'titan'];
        const remaining = pool.filter(c => !this.selectedP1.includes(c));
        this.selectedP2 = [remaining[0], remaining[1]];
      }
    } else if (this.gameMode === 'VS_PLAYER' && this.selectedP2.length < 2) {
      if (this.selectedP2.includes(char)) return;
      this.selectedP2.push(char);
      
      const card = document.querySelector(`.char-card[data-char="${char}"]`);
      if (card) card.classList.add('active-p2');
    }

    this.updateCharacterSlots();
  }

  updateCharacterSlots() {
    // P1 slots
    const p1Slot1 = document.getElementById('p1-slot-1');
    const p1Slot2 = document.getElementById('p1-slot-2');
    p1Slot1.querySelector('.slot-name').textContent = this.selectedP1[0] ? this.selectedP1[0].toUpperCase() : 'SELECT...';
    p1Slot2.querySelector('.slot-name').textContent = this.selectedP1[1] ? this.selectedP1[1].toUpperCase() : 'SELECT...';

    p1Slot1.className = 'slot slot-1' + (this.selectedP1[0] ? ' selected' : '');
    p1Slot2.className = 'slot slot-2' + (this.selectedP1[1] ? ' selected' : '');

    // P2 slots
    const p2Slot1 = document.getElementById('p2-slot-1');
    const p2Slot2 = document.getElementById('p2-slot-2');
    p2Slot1.querySelector('.slot-name').textContent = this.selectedP2[0] ? this.selectedP2[0].toUpperCase() : 'SELECT...';
    p2Slot2.querySelector('.slot-name').textContent = this.selectedP2[1] ? this.selectedP2[1].toUpperCase() : 'SELECT...';

    p2Slot1.className = 'slot slot-1' + (this.selectedP2[0] ? ' selected' : '');
    p2Slot2.className = 'slot slot-2' + (this.selectedP2[1] ? ' selected' : '');

    // Check ready state
    const btnFight = document.getElementById('btn-fight');
    const isP1Ready = this.selectedP1.length === 2;
    const isP2Ready = this.selectedP2.length === 2;

    if (isP1Ready && isP2Ready) {
      btnFight.classList.remove('disabled');
    } else {
      btnFight.classList.add('disabled');
    }
  }

  updateHUD(p1Active, p1Reserve, p2Active, p2Reserve, timer, round, wins) {
    if (!p1Active || !p2Active) return;

    // Timer
    document.getElementById('hud-timer').textContent = Math.ceil(timer);
    document.getElementById('hud-round-num').textContent = round;

    // P1 Health Bars (fill and delay red bar)
    const p1HealthPercent = Math.max(0, (p1Active.health / p1Active.maxHealth) * 100);
    document.getElementById('hud-p1-health').style.width = p1HealthPercent + '%';
    
    // Slow Red Damage catching bar (handled by CSS transition, just match widths)
    setTimeout(() => {
      const redBarP1 = document.getElementById('hud-p1-health-red');
      if (redBarP1) redBarP1.style.width = p1HealthPercent + '%';
    }, 400);

    document.getElementById('hud-p1-active-name').textContent = p1Active.characterType.toUpperCase();
    document.getElementById('hud-p1-meter').style.width = Math.min(100, p1Active.meter) + '%';
    document.getElementById('hud-p1-meter-val').textContent = Math.floor(p1Active.meter);

    // P2 Health Bars (fill and delay red bar)
    const p2HealthPercent = Math.max(0, (p2Active.health / p2Active.maxHealth) * 100);
    document.getElementById('hud-p2-health').style.width = p2HealthPercent + '%';
    
    setTimeout(() => {
      const redBarP2 = document.getElementById('hud-p2-health-red');
      if (redBarP2) redBarP2.style.width = p2HealthPercent + '%';
    }, 400);

    document.getElementById('hud-p2-active-name').textContent = p2Active.characterType.toUpperCase();
    document.getElementById('hud-p2-meter').style.width = Math.min(100, p2Active.meter) + '%';
    document.getElementById('hud-p2-meter-val').textContent = Math.floor(p2Active.meter);

    // Active fighter portrait background gradients
    this.setPortraitBg('hud-p1-active-pic', p1Active.characterType);
    this.setPortraitBg('hud-p2-active-pic', p2Active.characterType);

    // Reserve portraits & tags
    if (p1Reserve) {
      this.setPortraitBg('hud-p1-reserve-pic', p1Reserve.characterType);
      const cdBadgeP1 = document.getElementById('hud-p1-assist-cooldown');
      if (playerTeam.assistCooldown > 0) {
        cdBadgeP1.textContent = 'COOLDOWN';
        cdBadgeP1.className = 'assist-badge on-cooldown';
      } else {
        cdBadgeP1.textContent = 'READY';
        cdBadgeP1.className = 'assist-badge';
      }
    }
    if (p2Reserve) {
      this.setPortraitBg('hud-p2-reserve-pic', p2Reserve.characterType);
      const cdBadgeP2 = document.getElementById('hud-p2-assist-cooldown');
      if (enemyTeam.assistCooldown > 0) {
        cdBadgeP2.textContent = 'COOLDOWN';
        cdBadgeP2.className = 'assist-badge on-cooldown';
      } else {
        cdBadgeP2.textContent = 'READY';
        cdBadgeP2.className = 'assist-badge';
      }
    }

    // Round Wins indicator
    const p1WinDots = document.querySelectorAll('#p1-wins .dot');
    p1WinDots.forEach((dot, idx) => {
      if (idx < wins.p1) dot.classList.add('won');
      else dot.classList.remove('won');
    });

    const p2WinDots = document.querySelectorAll('#p2-wins .dot');
    p2WinDots.forEach((dot, idx) => {
      if (idx < wins.p2) dot.classList.add('won');
      else dot.classList.remove('won');
    });
  }

  setPortraitBg(elementId, charType) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let gradient = '';
    switch (charType) {
      case 'blaze': gradient = 'linear-gradient(135deg, #f59e0b, #ef4444)'; break;
      case 'frost': gradient = 'linear-gradient(135deg, #38bdf8, #0284c7)'; break;
      case 'volt': gradient = 'linear-gradient(135deg, #eab308, #a16207)'; break;
      case 'titan': gradient = 'linear-gradient(135deg, #64748b, #334155)'; break;
    }
    el.style.background = gradient;
  }

  triggerAnnouncer(text, duration = 1500) {
    const el = document.getElementById('announcer-message');
    if (!el) return;
    el.textContent = text;
    el.classList.add('active');

    setTimeout(() => {
      el.classList.remove('active');
    }, duration);
  }

  showVictory(winnerName, winningChars) {
    const title = document.getElementById('victory-title');
    title.textContent = winnerName.toUpperCase() + ' WINS';

    const container = document.getElementById('victory-portraits');
    container.innerHTML = ''; // Clear previous

    winningChars.forEach(char => {
      const portrait = document.createElement('div');
      portrait.className = 'char-avatar';
      portrait.classList.add(`${char}-avatar`);
      container.appendChild(portrait);
    });

    this.showScreen('victory-screen');
  }

  /**
   * Updates combo ui popups
   */
  updateCombos(p1Combo, p1Dmg, p2Combo, p2Dmg) {
    const p1ComboUI = document.getElementById('p1-combo-ui');
    const p2ComboUI = document.getElementById('p2-combo-ui');

    if (p1Combo > 1) {
      document.getElementById('p1-combo-count').textContent = p1Combo;
      document.getElementById('p1-combo-dmg').textContent = Math.floor(p1Dmg) + ' DMG';
      p1ComboUI.classList.add('active');
    } else {
      p1ComboUI.classList.remove('active');
    }

    if (p2Combo > 1) {
      document.getElementById('p2-combo-count').textContent = p2Combo;
      document.getElementById('p2-combo-dmg').textContent = Math.floor(p2Dmg) + ' DMG';
      p2ComboUI.classList.add('active');
    } else {
      p2ComboUI.classList.remove('active');
    }
  }
}

export const ui = new UIManager();
export default ui;
