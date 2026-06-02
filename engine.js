// Game Engine (Complete Battle Loop and Visual Matrix solver)
import { playerTeam, SPECIAL_DATA } from './player.js';
import { enemyTeam } from './enemy.js';
import { ui } from './ui.js';
import { ai } from './ai.js';
import { checkStageBounds, handlePushboxCollision, clampToScreen, checkHitboxCollision } from './collision.js';
import { ATTACK_DATA, registerHit, updateComboCounters } from './combat.js';
import { fx } from './animation.js';
import { audio } from './audio.js';

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution (Internal 16:9 viewport)
    this.virtualWidth = 960;
    this.virtualHeight = 540;

    // Stage definition
    this.stageWidth = 1850;
    this.stageHeight = 540;
    this.floorY = 450; // Ground position

    // State
    this.gameState = 'MENU'; // MENU, CHAR_SELECT, BATTLE, PAUSE, VICTORY
    this.gameMode = 'VS_AI';
    this.lastTime = 0;
    this.fps = 60;
    this.tick = 0;
    this.slowMoFrameCount = 0;

    // Camera Parameters (2.5D)
    this.camera = {
      x: 450, // Center coordinate
      y: 0,
      width: this.virtualWidth,
      height: this.virtualHeight,
      zoom: 1.0,
      targetX: 450,
      targetZoom: 1.0
    };

    // Match Rules
    this.roundTimer = 99;
    this.roundCount = 1;
    this.maxRounds = 3;
    this.roundActive = false;
    this.roundOver = false;
    this.slowMoTimer = 0;

    // Parallax details
    this.embers = [];
    this.initEmbers();

    this.initResizeListener();
    this.initPauseListener();
  }

  initResizeListener() {
    const resize = () => {
      this.canvas.width = this.virtualWidth;
      this.canvas.height = this.virtualHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  initPauseListener() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.gameState === 'BATTLE') {
        this.pauseGame();
      }
    });
  }

  initEmbers() {
    this.embers = [];
    for (let i = 0; i < 40; i++) {
      this.embers.push({
        x: Math.random() * this.stageWidth,
        y: this.floorY - Math.random() * 300,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.4 - Math.random() * 0.8,
        size: 1 + Math.random() * 2.5,
        color: Math.random() < 0.5 ? 'rgba(0, 243, 255, 0.4)' : 'rgba(255, 0, 127, 0.4)'
      });
    }
  }

  start() {
    // Setup UI Callbacks
    ui.init({
      startFight: this.startFight.bind(this),
      resumeGame: this.resumeGame.bind(this),
      restartGame: this.restartGame.bind(this),
      showMainMenu: this.showMainMenu.bind(this)
    });

    // Start loop
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  startFight(p1Char1, p1Char2, p2Char1, p2Char2, mode) {
    this.gameMode = mode;
    this.roundCount = 1;
    playerTeam.wins = 0;
    enemyTeam.wins = 0;

    const controlP2 = mode === 'VS_PLAYER' ? 'PLAYER' : 'AI';
    playerTeam.setupTeam(p1Char1, p1Char2, this.floorY);
    enemyTeam.setupTeam(p2Char1, p2Char2, this.floorY, controlP2);

    this.resetRound();
    this.gameState = 'BATTLE';
  }

  resetRound() {
    this.roundTimer = 99.9;
    this.roundOver = false;
    this.roundActive = false;
    this.slowMoTimer = 0;
    this.slowMoFrameCount = 0;
    this.camera.zoom = 1.0;
    
    // Reposition active fighters on opposite sides
    playerTeam.activeFighter.x = 450;
    playerTeam.activeFighter.y = this.floorY;
    playerTeam.activeFighter.health = playerTeam.activeFighter.maxHealth;
    playerTeam.activeFighter.vx = 0;
    playerTeam.activeFighter.vy = 0;
    playerTeam.activeFighter.state = 'IDLE';
    playerTeam.activeFighter.projectiles = [];
    playerTeam.activeFighter.meter = 0;
    if (playerTeam.reserveFighter) {
      playerTeam.reserveFighter.health = playerTeam.reserveFighter.maxHealth;
      playerTeam.reserveFighter.projectiles = [];
      playerTeam.reserveFighter.meter = 0;
    }

    enemyTeam.activeFighter.x = 1400;
    enemyTeam.activeFighter.y = this.floorY;
    enemyTeam.activeFighter.health = enemyTeam.activeFighter.maxHealth;
    enemyTeam.activeFighter.vx = 0;
    enemyTeam.activeFighter.vy = 0;
    enemyTeam.activeFighter.state = 'IDLE';
    enemyTeam.activeFighter.projectiles = [];
    enemyTeam.activeFighter.meter = 0;
    if (enemyTeam.reserveFighter) {
      enemyTeam.reserveFighter.health = enemyTeam.reserveFighter.maxHealth;
      enemyTeam.reserveFighter.projectiles = [];
      enemyTeam.reserveFighter.meter = 0;
    }

    // Face each other
    playerTeam.activeFighter.direction = 1;
    enemyTeam.activeFighter.direction = -1;

    // Camera initial position centered
    this.camera.x = 925 - this.virtualWidth / 2;
    this.camera.y = 0;

    // Trigger Announcer "ROUND X... READY... FIGHT!"
    ui.triggerAnnouncer(`ROUND ${this.roundCount}`, 1200);
    setTimeout(() => {
      ui.triggerAnnouncer('FIGHT!', 800);
      this.roundActive = true;
    }, 1500);
  }

  pauseGame() {
    this.gameState = 'PAUSE';
    ui.showScreen('pause-menu');
  }

  resumeGame() {
    this.gameState = 'BATTLE';
  }

  restartGame() {
    this.roundCount = 1;
    playerTeam.wins = 0;
    enemyTeam.wins = 0;
    this.resetRound();
    this.gameState = 'BATTLE';
  }

  showMainMenu() {
    this.gameState = 'MENU';
    ui.showScreen('main-menu');
  }

  loop(timestamp) {
    this.tick++;
    const elapsed = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.gameState === 'BATTLE') {
      if (this.roundOver) {
        // Slow-motion frame skip (update physics every 3 frames)
        this.slowMoFrameCount++;
        if (this.slowMoFrameCount % 3 === 0) {
          this.update();
        } else {
          // Increment timer to advance slow-mo finish duration
          this.slowMoTimer += 1/3;
        }
      } else {
        this.update();
      }
      this.render();
    } else {
      // Menu background loop
      this.renderMenuBackground();
    }

    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  update() {
    if (!this.roundActive && !this.roundOver) return;

    // 1. Update round timer
    if (this.roundActive && !this.roundOver) {
      if (this.gameMode !== 'TRAINING') {
        this.roundTimer -= 1 / 60;
        if (this.roundTimer <= 0) {
          this.roundTimer = 0;
          this.endRoundByTime();
        }
      } else {
        this.roundTimer = 99.9;
      }
    }

    // 2. Training parameters overrides
    if (this.gameMode === 'TRAINING') {
      const infHealth = document.getElementById('train-inf-health').checked;
      const infMeter = document.getElementById('train-inf-meter').checked;
      if (infHealth) {
        // Refill player health if not in hitstun/combo
        if (playerTeam.activeFighter.state !== 'HIT' && enemyTeam.activeFighter.comboCounter === 0) {
          playerTeam.activeFighter.health = playerTeam.activeFighter.maxHealth;
        }
        // Refill enemy health if not in hitstun/combo
        if (enemyTeam.activeFighter.state !== 'HIT' && playerTeam.activeFighter.comboCounter === 0) {
          enemyTeam.activeFighter.health = enemyTeam.activeFighter.maxHealth;
        }
      }
      if (infMeter) {
        playerTeam.activeFighter.meter = playerTeam.activeFighter.maxMeter;
        enemyTeam.activeFighter.meter = enemyTeam.activeFighter.maxMeter;
      }
    }

    // 3. Update active fighters
    playerTeam.update(enemyTeam.activeFighter);
    
    let enemyAI = ai;
    if (this.gameMode === 'TRAINING') {
      const dummyAction = document.getElementById('train-dummy-action').value;
      if (dummyAction === 'stand') {
        enemyAI = { getInputs: () => ({ left: false, right: false, up: false, down: false }) };
      } else if (dummyAction === 'crouch') {
        enemyAI = { getInputs: () => ({ left: false, right: false, up: false, down: true }) };
      } else if (dummyAction === 'jump') {
        enemyAI = { getInputs: (self) => ({ left: false, right: false, up: self.isGrounded, down: false }) };
      } else if (dummyAction === 'block') {
        enemyAI = null; // Auto blocks in registerHit
      } else if (dummyAction === 'cpu-easy') {
        enemyTeam.controlMode = 'AI';
        enemyTeam.aiDifficulty = 'easy';
      } else if (dummyAction === 'cpu-medium') {
        enemyTeam.controlMode = 'AI';
        enemyTeam.aiDifficulty = 'medium';
      }
    }
    
    enemyTeam.update(playerTeam.activeFighter, enemyAI);

    // 4. Combat / Hitbox Overlaps detection
    this.checkCombats();

    // 5. Update visual particles
    fx.update();

    // 6. Resolve boundaries and pushbox collisions
    checkStageBounds(playerTeam.activeFighter, this.stageWidth, this.floorY);
    checkStageBounds(enemyTeam.activeFighter, this.stageWidth, this.floorY);

    handlePushboxCollision(playerTeam.activeFighter, enemyTeam.activeFighter, this.stageWidth);

    // Update dynamic 2.5D camera zoom and coordinates
    this.updateCamera();

    // Clamp fighters to camera edges
    clampToScreen(playerTeam.activeFighter, enemyTeam.activeFighter, this.camera.x, this.camera.width);

    // Secondary collision check to prevent overlaps at screen edges
    handlePushboxCollision(playerTeam.activeFighter, enemyTeam.activeFighter, this.stageWidth);
    checkStageBounds(playerTeam.activeFighter, this.stageWidth, this.floorY);
    checkStageBounds(enemyTeam.activeFighter, this.stageWidth, this.floorY);

    // 7. Update HUD UI details
    ui.updateHUD(
      playerTeam.activeFighter, playerTeam.reserveFighter,
      enemyTeam.activeFighter, enemyTeam.reserveFighter,
      this.roundTimer, this.roundCount,
      { p1: playerTeam.wins, p2: enemyTeam.wins }
    );

    // Update stage parallax embers
    this.embers.forEach(ember => {
      ember.x += ember.vx;
      ember.y += ember.vy;
      if (ember.y < this.floorY - 350) {
        ember.y = this.floorY;
        ember.x = Math.random() * this.stageWidth;
      }
    });

    // 8. K.O. Check
    if (this.roundOver) {
      if (this.slowMoTimer > 40) { // 40 ticks at 1/3 speed is 120 frames (2s)
        this.transitionRound();
      }
    } else {
      this.checkKODetection();
    }
  }

  checkCombats() {
    const p1 = playerTeam.activeFighter;
    const p2 = enemyTeam.activeFighter;
    if (!p1 || !p2 || p1.health <= 0 || p2.health <= 0) return;

    // Check P1 attacking P2
    if (p1.state === 'ATTACK' && !p1.hasHitOpponent) {
      const hitContact = checkHitboxCollision(p1, p2);
      if (hitContact) {
        const attackInfo = SPECIAL_DATA[p1.characterType][p1.activeAttackType] || ATTACK_DATA[p1.activeAttackType];
        if (attackInfo) {
          registerHit(p1, p2, attackInfo);
          p1.hasHitOpponent = true;

          // Sound cues
          if (p2.state === 'BLOCK') {
            audio.playBlock();
          } else {
            audio.playHit(p1.activeAttackType === 'heavy' || p1.activeAttackType === 'ult' ? 'heavy' : (p1.activeAttackType === 'medium' ? 'medium' : 'light'));
          }
        }
      }
    }

    // Check P2 attacking P1
    if (p2.state === 'ATTACK' && !p2.hasHitOpponent) {
      const hitContact = checkHitboxCollision(p2, p1);
      if (hitContact) {
        const attackInfo = SPECIAL_DATA[p2.characterType][p2.activeAttackType] || ATTACK_DATA[p2.activeAttackType];
        if (attackInfo) {
          registerHit(p2, p1, attackInfo);
          p2.hasHitOpponent = true;

          // Sound cues
          if (p1.state === 'BLOCK') {
            audio.playBlock();
          } else {
            audio.playHit(p2.activeAttackType === 'heavy' || p2.activeAttackType === 'ult' ? 'heavy' : (p2.activeAttackType === 'medium' ? 'medium' : 'light'));
          }
        }
      }
    }

    // Decays combo chains
    updateComboCounters(p1, p2);
    ui.updateCombos(p1.comboCounter, p1.comboDamage || 0, p2.comboCounter, p2.comboDamage || 0);
  }

  updateCamera() {
    const f1 = playerTeam.activeFighter;
    const f2 = enemyTeam.activeFighter;
    if (!f1 || !f2) return;

    const midX = (f1.x + f2.x) / 2;
    const distanceX = Math.abs(f1.x - f2.x);

    const minZoom = 0.65;
    const maxZoom = 1.25;
    this.camera.targetZoom = Math.max(minZoom, Math.min(maxZoom, 620 / (distanceX + 220)));

    // Damping camera transitions
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.08;

    this.camera.width = this.virtualWidth / this.camera.zoom;
    this.camera.height = this.virtualHeight / this.camera.zoom;

    this.camera.targetX = midX - this.camera.width / 2;

    if (this.camera.targetX < 0) this.camera.targetX = 0;
    if (this.camera.targetX + this.camera.width > this.stageWidth) {
      this.camera.targetX = this.stageWidth - this.camera.width;
    }

    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y = 0;
  }

  checkKODetection() {
    if (playerTeam.activeFighter.health <= 0) {
      this.roundOver = true;
      this.roundActive = false;
      enemyTeam.wins++;
      ui.triggerAnnouncer('K.O.', 2000);
      
      // Blast ultimate explosion sound on KO
      audio.playHit('heavy');
    } else if (enemyTeam.activeFighter.health <= 0) {
      this.roundOver = true;
      this.roundActive = false;
      playerTeam.wins++;
      ui.triggerAnnouncer('K.O.', 2000);

      audio.playHit('heavy');
    }
  }

  endRoundByTime() {
    this.roundOver = true;
    this.roundActive = false;
    
    const h1 = playerTeam.activeFighter.health;
    const h2 = enemyTeam.activeFighter.health;

    if (h1 > h2) {
      playerTeam.wins++;
      ui.triggerAnnouncer('TIME UP!', 2000);
    } else if (h2 > h1) {
      enemyTeam.wins++;
      ui.triggerAnnouncer('TIME UP!', 2000);
    } else {
      ui.triggerAnnouncer('DRAW!', 2000);
    }
    audio.playHit('medium');
  }

  transitionRound() {
    const neededWins = 2; // Best of 3
    if (playerTeam.wins >= neededWins) {
      this.gameState = 'VICTORY';
      const p1Chars = [playerTeam.activeFighter.characterType, playerTeam.reserveFighter.characterType];
      ui.showVictory('Player 1', p1Chars);
    } else if (enemyTeam.wins >= neededWins) {
      this.gameState = 'VICTORY';
      const p2Chars = [enemyTeam.activeFighter.characterType, enemyTeam.reserveFighter.characterType];
      ui.showVictory('Opponent', p2Chars);
    } else {
      this.roundCount++;
      this.resetRound();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    this.ctx.save();

    // 1. Screenshake translation matrices
    if (fx.screenShakeTime > 0) {
      const shakeX = (Math.random() - 0.5) * fx.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * fx.screenShakeIntensity;
      this.ctx.translate(shakeX, shakeY);
    }
    
    // Scale and center relative to camera
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Parallax sky grid & skyscrapers
    this.drawParallaxBackground();

    // Draw active entities (pass tick counting)
    playerTeam.draw(this.ctx, this.tick);
    enemyTeam.draw(this.ctx, this.tick);

    // Draw active particle sparks / hit stars
    fx.drawEffects(this.ctx);

    this.ctx.restore();
  }

  drawParallaxBackground() {
    const camX = this.camera.x;
    
    // Layer 1: Nebula Backdrop (Far)
    let neb = this.ctx.createLinearGradient(0, 0, 0, this.stageHeight);
    neb.addColorStop(0, '#030009');
    neb.addColorStop(0.5, '#0b021a');
    neb.addColorStop(1, '#020007');
    this.ctx.fillStyle = neb;
    this.ctx.fillRect(camX, 0, this.camera.width, this.stageHeight);

    // Static stars
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(camX + 120, 30, 2, 2);
    this.ctx.fillRect(camX + 340, 75, 1.5, 1.5);
    this.ctx.fillRect(camX + 590, 45, 2.5, 2.5);
    this.ctx.fillRect(camX + 820, 85, 1, 1);

    // Layer 2: Distant Buildings (Parallax rate: 10%)
    const pOffset2 = camX * 0.1;
    this.ctx.fillStyle = '#06040c';
    for (let i = 0; i < 15; i++) {
      const w = 90 + i * 15;
      const h = 250 + Math.sin(i) * 100;
      const x = i * 140 - pOffset2;
      this.ctx.fillRect(x, this.floorY - h, w, h);
    }

    // Layer 3: Mid-ground Buildings + Neon Advertisements (Parallax rate: 30%)
    const pOffset3 = camX * 0.3;
    
    for (let i = 0; i < 10; i++) {
      const w = 110;
      const h = 180 + Math.cos(i) * 60;
      const x = i * 220 + 50 - pOffset3;
      this.ctx.fillStyle = '#0f0a1e';
      this.ctx.fillRect(x, this.floorY - h, w, h);

      // Windows
      this.ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
      for (let r = 0; r < h / 20; r++) {
        for (let col = 0; col < 3; col++) {
          this.ctx.fillRect(x + 15 + col * 30, this.floorY - h + 15 + r * 20, 12, 6);
        }
      }
    }

    // Glowing Neon Hologram / Billboard in Mid-ground
    this.ctx.save();
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ff007f';
    this.ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = 'rgba(255, 0, 127, 0.05)';
    const billX = 400 - pOffset3;
    this.ctx.beginPath();
    this.ctx.roundRect(billX, 100, 120, 60, [4]);
    this.ctx.stroke();
    this.ctx.fill();
    
    this.ctx.fillStyle = '#ff007f';
    this.ctx.font = 'bold 13px Orbitron';
    this.ctx.fillText("NEON CITY", billX + 18, 135);
    this.ctx.restore();

    // Layer 4: Stage Details & Parallax Embers (Parallax rate: 80%)
    const pOffset4 = camX * 0.8;
    this.ctx.fillStyle = '#080511';
    this.ctx.fillRect(100 - pOffset4, this.floorY - 30, 80, 30);
    this.ctx.fillRect(800 - pOffset4, this.floorY - 45, 120, 45);
    
    // Glowing fence
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0 - pOffset4, this.floorY - 15);
    this.ctx.lineTo(this.stageWidth - pOffset4, this.floorY - 15);
    this.ctx.stroke();

    // Embers
    this.embers.forEach(ember => {
      this.ctx.fillStyle = ember.color;
      this.ctx.fillRect(ember.x - camX * 0.95, ember.y, ember.size, ember.size);
    });

    // Layer 5: Stage Rooftop Concrete (Parallax rate: 100%)
    this.ctx.fillStyle = '#06030b';
    this.ctx.fillRect(0, this.floorY, this.stageWidth, 150);

    // floor perspective grid lines
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.22)';
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.floorY);
    this.ctx.lineTo(this.stageWidth, this.floorY);
    this.ctx.stroke();

    // Floor edge neon trim
    this.ctx.save();
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.strokeStyle = '#00f3ff';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.floorY + 2);
    this.ctx.lineTo(this.stageWidth, this.floorY + 2);
    this.ctx.stroke();
    this.ctx.restore();

    // Exponential perspective floor lines
    const horizonY = this.floorY;
    const vanishX = this.stageWidth / 2;
    
    for (let i = 0; i <= 8; i++) {
      const progress = i / 8;
      const y = horizonY + 90 * Math.pow(progress, 1.7);
      this.ctx.strokeStyle = `rgba(0, 243, 255, ${0.05 + 0.2 * progress})`;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.stageWidth, y);
      this.ctx.stroke();
    }

    // Radial perspective lines converging
    const count = 30;
    for (let i = 0; i <= count; i++) {
      const fraction = i / count;
      const bottomX = fraction * this.stageWidth;
      const topX = vanishX + (bottomX - vanishX) * 0.15;
      
      this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.11)';
      this.ctx.beginPath();
      this.ctx.moveTo(topX, horizonY);
      this.ctx.lineTo(bottomX, this.floorY + 90);
      this.ctx.stroke();
    }
  }

  renderMenuBackground() {
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);
    
    // Smooth automatic pan during menus
    this.camera.x = 440 + Math.sin(Date.now() * 0.00035) * 120;
    this.camera.zoom = 0.95;

    this.ctx.save();
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    this.drawParallaxBackground();
    this.ctx.restore();
  }
}

export const engine = new GameEngine();
export default engine;
