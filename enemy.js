// Enemy System (P2 team manager)
import { input } from './input.js';
import { Fighter, SPECIAL_DATA } from './player.js';
import { checkHitboxCollision } from './collision.js';
import { registerHit } from './combat.js';
import { fx } from './animation.js';

class EnemyTeamManager {
  constructor() {
    this.activeFighter = null;
    this.reserveFighter = null;
    this.assistCooldown = 0;
    this.wins = 0;
    
    this.controlMode = 'AI'; // 'PLAYER' (local P2) or 'AI' (computer)
    this.aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'

    // Assist summons parameters
    this.assistFighter = null;
    this.assistTimer = 0;
  }

  setupTeam(char1, char2, floorY, controlMode = 'AI', difficulty = 'medium') {
    this.activeFighter = new Fighter(1450, floorY, char1, 'p2');
    this.reserveFighter = new Fighter(1620, floorY, char2, 'p2');
    this.assistCooldown = 0;
    this.controlMode = controlMode;
    this.aiDifficulty = difficulty;
    this.assistFighter = null;
  }

  update(playerActive, aiController) {
    if (!this.activeFighter) return;

    let p2Input = null;

    if (this.controlMode === 'PLAYER') {
      // Local P2 Keyboard input (index 1)
      p2Input = input.states[1];
    } else {
      // AI logic: update using decisions from ai.js
      if (aiController) {
        p2Input = aiController.getInputs(this.activeFighter, playerActive, this.aiDifficulty);
      } else {
        // Fallback: stay idle
        p2Input = { left: false, right: false, up: false, down: false, light: false, medium: false, heavy: false, sp1: false, sp2: false, tag: false, ultimate: false };
      }
    }

    // Call update for active fighter
    this.activeFighter.update(p2Input, playerActive);

    // Assist summons trigger check (taps Tag button or AI chooses tag)
    if (this.controlMode === 'PLAYER') {
      if (input.consumePress(1, 'tag')) {
        if (p2Input.down) {
          this.summonAssist(playerActive);
        } else {
          this.tagSwitch();
        }
      }
    } else {
      // AI chooses tag or assist trigger
      if (p2Input.tag) {
        if (Math.random() < 0.6) {
          this.summonAssist(playerActive);
        } else {
          this.tagSwitch();
        }
      }
    }

    // Cooldown update
    if (this.assistCooldown > 0) this.assistCooldown--;

    // Update active assist instance if on-screen
    this.updateAssist(playerActive);
  }

  summonAssist(playerActive) {
    if (this.assistCooldown > 0 || this.assistFighter || this.reserveFighter.health <= 0) return;

    // Summon reserve fighter to run on screen, perform Special 1, and run off
    const direction = this.activeFighter.direction;
    const startX = this.activeFighter.x - direction * 150;
    
    this.assistFighter = new Fighter(startX, this.activeFighter.y, this.reserveFighter.characterType, 'p2');
    this.assistFighter.direction = direction;
    
    // Trigger Special 1 immediately
    this.assistFighter.state = 'ATTACK';
    this.assistFighter.activeAttackType = 'sp1';
    this.assistFighter.attackTimer = 0;
    this.assistFighter.vx = direction * 5; // running forward
    
    this.assistTimer = 0;
    this.assistCooldown = 240; // 4 seconds cooldown
  }

  updateAssist(playerActive) {
    if (!this.assistFighter) return;

    this.assistTimer++;

    // Let assist execute their attack updates
    this.assistFighter.updateAttackCycle(playerActive);
    
    // Move assist forward
    this.assistFighter.x += this.assistFighter.vx;

    // Check hitboxes collision for assist
    const hitContact = checkAssistHit(this.assistFighter, playerActive);
    if (hitContact) {
      // Connects!
      const data = SPECIAL_DATA[this.assistFighter.characterType].sp1;
      registerHit(this.assistFighter, playerActive, data);
      this.assistFighter.hasHitOpponent = true;
    }

    // Run off screen after attack cycle finishes
    if (this.assistFighter.state !== 'ATTACK') {
      this.assistFighter.vx = -this.assistFighter.direction * 6; // running back
      
      // Destroy once offscreen or timer expires
      if (this.assistTimer > 110 || Math.abs(this.assistFighter.x - this.activeFighter.x) > 500) {
        this.assistFighter = null;
      }
    }
  }

  draw(ctx, tick) {
    if (this.activeFighter) {
      this.activeFighter.draw(ctx, tick);
    }
    // Draw assist partner if active
    if (this.assistFighter) {
      this.assistFighter.draw(ctx, tick);
    }
  }

  tagSwitch() {
    if (this.assistCooldown > 0 || this.reserveFighter.health <= 0) return;

    // Upgraded tag transition visual effect
    fx.spawnTagBurst(this.activeFighter.x, this.activeFighter.y - 50, this.activeFighter.color);

    const temp = this.activeFighter;
    this.activeFighter = this.reserveFighter;
    this.reserveFighter = temp;

    // Tag-in active fighter inheriting positioning
    this.activeFighter.x = temp.x;
    this.activeFighter.y = temp.y;
    this.activeFighter.vx = 0;
    this.activeFighter.vy = 0;
    this.activeFighter.isGrounded = temp.isGrounded;
    this.activeFighter.state = 'IDLE';

    this.assistCooldown = 180; // 3 seconds tag block
  }
}

function checkAssistHit(assist, defender) {
  if (assist.hasHitOpponent) return null;
  const hitbox = assist.getHitbox();
  const hurtbox = defender.getHurtbox();

  if (!hitbox || !hurtbox) return null;

  // AABB check overlap
  const overlap = (
    hitbox.x < hurtbox.x + hurtbox.width &&
    hitbox.x + hitbox.width > hurtbox.x &&
    hitbox.y < hurtbox.y + hurtbox.height &&
    hitbox.y + hitbox.height > hurtbox.y
  );

  if (overlap) {
    return { x: assist.x, y: assist.y };
  }
  return null;
}

export const enemyTeam = new EnemyTeamManager();
export default enemyTeam;
