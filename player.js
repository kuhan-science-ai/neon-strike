// Player System (Complete Fighter and Player Team Manager)
import { input } from './input.js';
import { ATTACK_DATA, registerHit, isFighterBlocking } from './combat.js';
import { fx } from './animation.js';
import { audio } from './audio.js';

// Special Attack Move Data
export const SPECIAL_DATA = {
  blaze: {
    sp1: { name: 'Flame Dash', damage: 70, startup: 10, active: 12, recovery: 15, hitstun: 25, blockstun: 10, knockbackX: 9, knockbackY: 0, hitboxOffset: { x: 35, y: -70 }, hitboxSize: { w: 70, h: 45 }, meterGain: 10 },
    sp2: { name: 'Fire Uppercut', damage: 90, startup: 6, active: 8, recovery: 22, hitstun: 30, blockstun: 8, knockbackX: 4, knockbackY: -10, hitboxOffset: { x: 25, y: -120 }, hitboxSize: { w: 60, h: 90 }, meterGain: 12 },
    ult: { name: 'Inferno Rush', damage: 250, startup: 15, active: 20, recovery: 30, hitstun: 50, blockstun: 20, knockbackX: 12, knockbackY: -8, hitboxOffset: { x: 40, y: -80 }, hitboxSize: { w: 100, h: 60 }, meterGain: 0 }
  },
  frost: {
    sp1: { name: 'Ice Shot', damage: 50, startup: 12, active: 4, recovery: 18, hitstun: 20, blockstun: 15, knockbackX: 3, knockbackY: 0, hitboxOffset: { x: 40, y: -75 }, hitboxSize: { w: 30, h: 30 }, meterGain: 10 },
    sp2: { name: 'Freeze Trap', damage: 40, startup: 8, active: 6, recovery: 16, hitstun: 45, blockstun: 12, knockbackX: 0, knockbackY: 0, hitboxOffset: { x: 35, y: -15 }, hitboxSize: { w: 40, h: 20 }, meterGain: 8 },
    ult: { name: 'Absolute Zero', damage: 220, startup: 10, active: 30, recovery: 25, hitstun: 40, blockstun: 25, knockbackX: 4, knockbackY: -7, hitboxOffset: { x: -60, y: -90 }, hitboxSize: { w: 190, h: 100 }, meterGain: 0 }
  },
  volt: {
    sp1: { name: 'Lightning Dash', damage: 60, startup: 8, active: 8, recovery: 12, hitstun: 22, blockstun: 8, knockbackX: 7, knockbackY: 0, hitboxOffset: { x: 50, y: -70 }, hitboxSize: { w: 80, h: 40 }, meterGain: 10 },
    sp2: { name: 'Blink Strike', damage: 80, startup: 14, active: 6, recovery: 16, hitstun: 28, blockstun: 10, knockbackX: 5, knockbackY: -4, hitboxOffset: { x: 10, y: -100 }, hitboxSize: { w: 60, h: 70 }, meterGain: 12 },
    ult: { name: 'Thunder Storm', damage: 240, startup: 12, active: 25, recovery: 28, hitstun: 48, blockstun: 15, knockbackX: 10, knockbackY: -5, hitboxOffset: { x: 20, y: -80 }, hitboxSize: { w: 120, h: 80 }, meterGain: 0 }
  },
  titan: {
    sp1: { name: 'Ground Slam', damage: 85, startup: 16, active: 8, recovery: 20, hitstun: 30, blockstun: 12, knockbackX: 6, knockbackY: -7, hitboxOffset: { x: 45, y: -30 }, hitboxSize: { w: 85, h: 40 }, meterGain: 12 },
    sp2: { name: 'Armor Charge', damage: 75, startup: 10, active: 10, recovery: 18, hitstun: 26, blockstun: 15, knockbackX: 10, knockbackY: 0, hitboxOffset: { x: 30, y: -70 }, hitboxSize: { w: 75, h: 50 }, meterGain: 10 },
    ult: { name: 'Earth Breaker', damage: 280, startup: 20, active: 12, recovery: 35, hitstun: 55, blockstun: 20, knockbackX: 15, knockbackY: -10, hitboxOffset: { x: 50, y: -50 }, hitboxSize: { w: 130, h: 70 }, meterGain: 0 }
  }
};

export class Fighter {
  constructor(x, y, characterType, side) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 70;
    this.height = 110;
    this.pushboxWidth = 50;

    this.characterType = characterType; // blaze, frost, volt, titan
    this.side = side; // p1, p2
    this.direction = side === 'p1' ? 1 : -1;

    // Movement Parameters
    this.isGrounded = false;
    this.gravity = 0.55;
    this.jumpForce = -13.5;
    this.walkSpeed = characterType === 'volt' ? 5.2 : (characterType === 'titan' ? 3.3 : 4.2);
    this.crouchSpeed = this.walkSpeed * 0.45;

    // Health, Meter, Combos
    this.maxHealth = characterType === 'titan' ? 1200 : 1000;
    this.health = this.maxHealth;
    this.meter = 0;
    this.maxMeter = 100;
    this.comboCounter = 0;
    this.comboDamage = 0;

    // Attack States
    this.state = 'IDLE'; // IDLE, MOVE, CROUCH, JUMPING, JUMP_FALL, ATTACK, HIT, BLOCK, KO
    this.isCrouching = false;
    this.isBlocking = false;
    this.isHitStunned = false;
    this.hitStunTimer = 0;

    // Active Attack Frame locks
    this.activeAttackType = null; // 'light', 'medium', 'heavy', 'sp1', 'sp2', 'ult'
    this.attackTimer = 0;
    this.hasHitOpponent = false;

    // Ghost trails for visual aesthetic
    this.ghostHistory = [];
    this.maxGhosts = 5;

    // Projectiles system
    this.projectiles = [];

    // Armor parameters (Titan specific)
    this.hasArmor = false;

    // Visual attributes
    this.color = this.getColorScheme();
  }

  getColorScheme() {
    switch (this.characterType) {
      case 'blaze': return '#ff3b30'; // Flame Red
      case 'frost': return '#00f3ff'; // Ice Cyan
      case 'volt': return '#ffcc00'; // Electric Yellow
      case 'titan': return '#af52de'; // Armor Purple
      default: return '#ffffff';
    }
  }

  getHurtbox() {
    let h = this.isCrouching ? this.height * 0.65 : this.height;
    return {
      x: this.x - this.width / 2,
      y: this.y - h,
      width: this.width,
      height: h
    };
  }

  getHitbox() {
    if (this.state !== 'ATTACK' || !this.activeAttackType) return null;

    let attack = null;
    if (SPECIAL_DATA[this.characterType][this.activeAttackType]) {
      attack = SPECIAL_DATA[this.characterType][this.activeAttackType];
    } else {
      attack = ATTACK_DATA[this.activeAttackType];
    }

    if (!attack) return null;

    // Check if within active frames
    const frame = Math.floor(this.attackTimer);
    if (frame < attack.startup || frame >= attack.startup + attack.active) {
      return null;
    }

    // Offset based on direction
    const offset = attack.hitboxOffset;
    const size = attack.hitboxSize;

    const hitboxX = this.direction === 1 
      ? this.x + offset.x 
      : this.x - offset.x - size.w;
    
    // Adjust height if crouching
    let hitboxY = this.y + offset.y;
    if (this.isCrouching && this.activeAttackType !== 'heavy') {
      hitboxY += 25; // drop hitbox slightly
    }

    return {
      x: hitboxX,
      y: hitboxY,
      width: size.w,
      height: size.h
    };
  }

  land() {
    this.isGrounded = true;
    this.vy = 0;
    this.state = 'IDLE';
  }

  update(inputState, opponent) {
    // Save current frame inputs for external calls (e.g. hit solver checking defense)
    this.lastInputs = inputState;

    // 1. Maintain ghost coordinates
    this.ghostHistory.push({ x: this.x, y: this.y });
    if (this.ghostHistory.length > this.maxGhosts) {
      this.ghostHistory.shift();
    }

    // 2. Dead/KO check
    if (this.health <= 0) {
      this.state = 'KO';
      this.vx = 0;
      if (!this.isGrounded) {
        this.vy += this.gravity;
        this.y += this.vy;
      }
      this.updateProjectiles(opponent);
      return;
    }

    // 3. Update projectiles
    this.updateProjectiles(opponent);

    // 4. Hit Stun / Block Stun Handler
    if (this.isHitStunned) {
      this.hitStunTimer--;
      
      // Decelerate slide
      this.vx *= 0.88;
      this.x += this.vx;

      if (!this.isGrounded) {
        this.vy += this.gravity;
        this.y += this.vy;
      }

      if (this.hitStunTimer <= 0) {
        this.isHitStunned = false;
        this.state = 'IDLE';
      }
      return;
    }

    // 5. Normal facing direction update (always lock direction toward active foe)
    if (opponent && opponent.health > 0) {
      this.direction = this.x < opponent.x ? 1 : -1;
    }

    // 6. Blocking input check
    this.isBlocking = isFighterBlocking(this, opponent);

    // 7. Attack state check
    if (this.state === 'ATTACK') {
      this.updateAttackCycle(opponent);
      return;
    }

    // 8. Normal Movement & Crouching inputs
    if (inputState.down && this.isGrounded) {
      this.isCrouching = true;
      this.state = 'CROUCH';
      this.vx = 0;
    } else {
      this.isCrouching = false;
    }

    // Jump Input
    if (inputState.up && this.isGrounded && !this.isCrouching) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.state = 'JUMPING';
    }

    // Horizontal moving
    if (!this.isCrouching) {
      let speed = this.walkSpeed;
      this.vx = 0;
      if (inputState.left) {
        this.vx = -speed;
        if (this.isGrounded) this.state = this.isBlocking ? 'BLOCK' : 'MOVE';
      } else if (inputState.right) {
        this.vx = speed;
        if (this.isGrounded) this.state = this.isBlocking ? 'BLOCK' : 'MOVE';
      }

      // If no moving input and grounded, go IDLE / BLOCK
      if (this.vx === 0 && this.isGrounded) {
        this.state = this.isBlocking ? 'BLOCK' : 'IDLE';
      }
    }

    // Apply movements
    this.x += this.vx;

    // Apply vertical physics
    if (!this.isGrounded) {
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.vy > 0) {
        this.state = 'JUMP_FALL';
      }
    }

    // 9. Command Attack Buttons
    this.processAttackButtons(inputState);
  }

  processAttackButtons(inputState) {
    // Only execute if not in recovery or hitstun
    let attackType = null;

    if (inputState.light) attackType = 'light';
    else if (inputState.medium) attackType = 'medium';
    else if (inputState.heavy) attackType = 'heavy';
    else if (inputState.sp1) attackType = 'sp1';
    else if (inputState.sp2) attackType = 'sp2';
    else if (inputState.ultimate && this.meter >= 100) {
      attackType = 'ult';
      this.meter = Math.max(0, this.meter - 100);
    }

    if (attackType) {
      this.state = 'ATTACK';
      this.activeAttackType = attackType;
      this.attackTimer = 0;
      this.hasHitOpponent = false;
      this.vx = 0;

      // Special action movements on activation
      this.triggerMoveImpulses(attackType);
    }
  }

  triggerMoveImpulses(attackType) {
    if (attackType === 'sp1') {
      if (this.characterType === 'blaze') {
        // Flame Dash: burst forward horizontal speed!
        this.vx = this.direction * 12;
      } else if (this.characterType === 'volt') {
        // Lightning Dash: teleport forward
        this.x += this.direction * 180;
        fx.spawnHitSparks(this.x, this.y - 50, '#ffea00', 8);
      }
    } else if (attackType === 'sp2') {
      if (this.characterType === 'blaze') {
        // Fire Uppercut: jump vertically!
        this.vy = -12;
        this.isGrounded = false;
      } else if (this.characterType === 'volt') {
        // Blink Strike: teleport above opponent
        this.vy = -9;
        this.vx = this.direction * 4;
        this.isGrounded = false;
      } else if (this.characterType === 'frost') {
        // Freeze Trap: drop trap at feet
        this.spawnFreezeTrap();
      }
    } else if (attackType === 'ult') {
      fx.triggerScreenShake(20, 8);
      if (this.characterType === 'titan') {
        this.vy = -11; // jumps up to smash down
        this.isGrounded = false;
      }
    }
  }

  updateAttackCycle(opponent) {
    this.attackTimer += 1.0;
    
    let data = SPECIAL_DATA[this.characterType][this.activeAttackType] || ATTACK_DATA[this.activeAttackType];
    const totalFrames = data.startup + data.active + data.recovery;

    // Progress percentage for animation joints updates
    this.attackFrameProgress = this.attackTimer / totalFrames;

    // Movement updates for flying/dash moves
    if (this.activeAttackType === 'sp1' && this.characterType === 'blaze') {
      // Keep moving during dash
      this.x += this.vx;
      this.vx *= 0.92;
      
      // Spawn fire sparks trail
      if (Math.random() < 0.3) {
        fx.spawnHitSparks(this.x - this.direction * 30, this.y - 45, '#ff3b30', 2);
      }
    }
    
    // Jump upper velocity updates
    if (!this.isGrounded) {
      this.vy += this.gravity;
      this.y += this.vy;
    }

    // Launch projectile at start of active frame for Frost Ice Shot
    if (this.activeAttackType === 'sp1' && this.characterType === 'frost' && Math.floor(this.attackTimer) === data.startup) {
      if (!this.hasLaunchedProjectile) {
        this.launchIceShot();
        this.hasLaunchedProjectile = true;
      }
    }

    // Complete strike cycle
    if (this.attackTimer >= totalFrames) {
      this.state = 'IDLE';
      this.activeAttackType = null;
      this.hasHitOpponent = false;
      this.hasLaunchedProjectile = false;
    }
  }

  launchIceShot() {
    this.projectiles.push({
      x: this.x + this.direction * 45,
      y: this.y - 75,
      vx: this.direction * 7.5,
      width: 25,
      height: 25,
      damage: 50,
      hitstun: 20,
      blockstun: 15,
      knockbackX: 3,
      knockbackY: 0,
      meterGain: 10,
      active: true,
      color: '#00f3ff'
    });
  }

  spawnFreezeTrap() {
    this.projectiles.push({
      x: this.x + this.direction * 90,
      y: this.y - 2, // floor level
      vx: 0,
      width: 40,
      height: 10,
      damage: 30,
      hitstun: 60, // freezing stun!
      blockstun: 10,
      knockbackX: 0,
      knockbackY: 0,
      meterGain: 8,
      active: true,
      color: '#a5f3fc',
      isTrap: true
    });
  }

  updateProjectiles(opponent) {
    if (!opponent || opponent.health <= 0) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.active) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Move normal projectile
      proj.x += proj.vx;

      // Draw bounding box check
      const projBox = { x: proj.x, y: proj.y, width: proj.width, height: proj.height };
      const oppHurt = opponent.getHurtbox();

      // Check overlap
      const hit = (
        projBox.x < oppHurt.x + oppHurt.width &&
        projBox.x + projBox.width > oppHurt.x &&
        projBox.y < oppHurt.y + oppHurt.height &&
        projBox.y + projBox.height > oppHurt.y
      );

      if (hit) {
        proj.active = false;
        // Trigger register hit with projectile details
        registerHit(this, opponent, proj);
      }

      // Destroy if offstage
      if (proj.x < 0 || proj.x > 1850) {
        proj.active = false;
      }
    }
  }

  draw(ctx, tick) {
    // Call procedural mesh renderer from animation.js
    fx.drawSkeletalFighter(ctx, this, tick, this.ghostHistory);

    // Draw active projectiles/traps
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      
      if (p.isTrap) {
        // Draw low flat ice trap
        ctx.fillRect(p.x, p.y - p.height, p.width, p.height);
      } else {
        // Draw round ice sphere
        ctx.beginPath();
        ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}

// Player 1 Team State Manager
class PlayerTeamManager {
  constructor() {
    this.activeFighter = null;
    this.reserveFighter = null;
    this.assistCooldown = 0;
    this.wins = 0;

    // Assist summons parameters
    this.assistFighter = null;
    this.assistTimer = 0;
  }

  setupTeam(char1, char2, floorY) {
    this.activeFighter = new Fighter(350, floorY, char1, 'p1');
    this.reserveFighter = new Fighter(180, floorY, char2, 'p1');
    this.assistCooldown = 0;
    this.assistFighter = null;
  }

  update(opponentActive) {
    if (!this.activeFighter) return;
    
    // Poll input for Player 1 (index 0)
    const p1Input = input.states[0];
    this.activeFighter.update(p1Input, opponentActive);

    // Handle tag button press
    if (input.consumePress(0, 'tag')) {
      if (p1Input.down) {
        // Summon assist attack
        this.summonAssist(opponentActive);
      } else {
        // Switch main fighter
        this.tagSwitch();
      }
    }

    // Cooldown update
    if (this.assistCooldown > 0) this.assistCooldown--;

    // Update active assist instance if on-screen
    this.updateAssist(opponentActive);
  }

  summonAssist(opponentActive) {
    if (this.assistCooldown > 0 || this.assistFighter) return;

    // Summon reserve fighter to run on screen, perform Special 1, and run off
    const direction = this.activeFighter.direction;
    const startX = this.activeFighter.x - direction * 150;
    
    this.assistFighter = new Fighter(startX, this.activeFighter.y, this.reserveFighter.characterType, 'p1');
    this.assistFighter.direction = direction;
    
    // Trigger Special 1 immediately
    this.assistFighter.state = 'ATTACK';
    this.assistFighter.activeAttackType = 'sp1';
    this.assistFighter.attackTimer = 0;
    this.assistFighter.vx = direction * 5; // running forward
    
    this.assistTimer = 0;
    this.assistCooldown = 240; // 4 seconds cooldown
  }

  updateAssist(opponentActive) {
    if (!this.assistFighter) return;

    this.assistTimer++;

    // Let assist execute their attack updates
    this.assistFighter.updateAttackCycle(opponentActive);
    
    // Move assist forward
    this.assistFighter.x += this.assistFighter.vx;

    // Check hitboxes collision for assist
    const hitContact = checkAssistHit(this.assistFighter, opponentActive);
    if (hitContact) {
      // Connects!
      const data = SPECIAL_DATA[this.assistFighter.characterType].sp1;
      registerHit(this.assistFighter, opponentActive, data);
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

    // Tag transition visual effect
    fx.spawnHitSparks(this.activeFighter.x, this.activeFighter.y - 50, '#fff', 8);

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

export const playerTeam = new PlayerTeamManager();
