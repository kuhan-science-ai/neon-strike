// Combat System (Hit registration, combos, and hitstun solver)
import { fx } from './animation.js';

// Base damage values
export const ATTACK_DATA = {
  light: {
    damage: 30,
    startup: 5,
    active: 4,
    recovery: 7,
    hitstun: 15,
    blockstun: 8,
    knockbackX: 3.5,
    knockbackY: 0,
    hitboxOffset: { x: 30, y: -78 },
    hitboxSize: { w: 45, h: 18 },
    meterGain: 4
  },
  medium: {
    damage: 60,
    startup: 8,
    active: 5,
    recovery: 10,
    hitstun: 22,
    blockstun: 12,
    knockbackX: 5.5,
    knockbackY: -2.5, // slightly lifts opponent
    hitboxOffset: { x: 35, y: -75 },
    hitboxSize: { w: 55, h: 22 },
    meterGain: 7
  },
  heavy: {
    damage: 100,
    startup: 12,
    active: 6,
    recovery: 14,
    hitstun: 32,
    blockstun: 18,
    knockbackX: 8.0,
    knockbackY: -6.5, // launcher!
    hitboxOffset: { x: 40, y: -50 },
    hitboxSize: { w: 65, h: 32 },
    meterGain: 12
  }
};

/**
 * Checks if a fighter is holding the block direction.
 * Block input is backward movement (opposite of facing direction).
 */
export function isFighterBlocking(fighter, opponent) {
  if (fighter.state === 'HIT' || fighter.state === 'KO' || fighter.state === 'ATTACK') {
    return false;
  }

  // Auto block toggle check in training mode
  if (fighter.side === 'p2' && opponent.side === 'p1') {
    const dummyAction = document.getElementById('train-dummy-action')?.value;
    if (dummyAction === 'block') return true;
  }

  const inputs = fighter.lastInputs || { left: false, right: false };
  const dirToOpponent = fighter.x < opponent.x ? 1 : -1;
  const isHoldingBack = (dirToOpponent === 1 && inputs.left) || (dirToOpponent === -1 && inputs.right);

  return fighter.isGrounded && isHoldingBack;
}

/**
 * Resolves a hit between attacker and defender
 * @param {object} attacker 
 * @param {object} defender 
 * @param {object} attackInfo - Info from ATTACK_DATA
 */
export function registerHit(attacker, defender, attackInfo) {
  // 1. Check if defending character is blocking
  const isBlocking = defender.state === 'BLOCK' || defender.isBlocking;
  
  // Calculate damage scaling: further hits in a combo scale down to 10% min
  const scaling = Math.max(0.1, Math.pow(0.88, attacker.comboCounter));
  
  if (isBlocking) {
    // Blocked: take minimal chip damage, minimal pushback
    const chipDmg = attackInfo.damage * 0.08 * scaling;
    defender.health = Math.max(1, defender.health - chipDmg);
    
    // Apply block stun and slide
    defender.state = 'BLOCK';
    defender.isHitStunned = true;
    defender.hitStunTimer = attackInfo.blockstun;
    defender.vx = -defender.direction * (attackInfo.knockbackX * 0.4);
    
    // Meter gains
    attacker.meter = Math.min(attacker.maxMeter, attacker.meter + attackInfo.meterGain * 0.5);
    defender.meter = Math.min(defender.maxMeter, defender.meter + attackInfo.meterGain * 0.35);

    // Spawn green block sparks
    const sparkX = defender.x - defender.direction * 18;
    const sparkY = defender.y - defender.height * 0.7;
    fx.spawnHitSparks(sparkX, sparkY, '#00f3ff', 5);
    fx.spawnImpactShockwave(sparkX, sparkY, '#00f3ff');
    fx.triggerScreenShake(3, 1.5);
  } else {
    // Clean Hit!
    attacker.comboCounter++;
    const fullDmg = attackInfo.damage * scaling;
    defender.health = Math.max(0, defender.health - fullDmg);
    
    // Trigger hitstun and state
    defender.state = 'HIT';
    defender.isHitStunned = true;
    defender.hitStunTimer = attackInfo.hitstun;

    // Frame data viewer triggers
    updateFrameDataDisplay(attackInfo);

    // Apply Knockback forces
    defender.vx = -defender.direction * attackInfo.knockbackX;
    if (attackInfo.knockbackY < 0) {
      // Launch into air
      defender.vy = attackInfo.knockbackY;
      defender.isGrounded = false;
    }

    // Accumulate super meter
    attacker.meter = Math.min(attacker.maxMeter, attacker.meter + attackInfo.meterGain);
    defender.meter = Math.min(defender.maxMeter, defender.meter + attackInfo.meterGain * 0.6);

    // Dynamic camera screenshake and slow-motion freeze for heavy hits
    const hitY = defender.y - defender.height * 0.6;
    if (attackInfo === ATTACK_DATA.heavy) {
      fx.triggerScreenShake(12, 6.0);
      fx.spawnHitSparks(defender.x, hitY, '#ff007f', 16);
      fx.spawnImpactShockwave(defender.x, hitY, '#ff007f');
    } else {
      fx.triggerScreenShake(5, 2.5);
      fx.spawnHitSparks(defender.x, hitY, '#ffea00', 8);
      fx.spawnImpactShockwave(defender.x, hitY, '#ffea00');
    }

    // Accumulate combo damage tracked in player manager
    attacker.comboDamage = (attacker.comboDamage || 0) + fullDmg;
  }
}

function updateFrameDataDisplay(attackInfo) {
  const startupEl = document.getElementById('frame-startup');
  const activeEl = document.getElementById('frame-active');
  const recoveryEl = document.getElementById('frame-recovery');

  if (startupEl && activeEl && recoveryEl) {
    startupEl.textContent = attackInfo.startup;
    activeEl.textContent = attackInfo.active;
    recoveryEl.textContent = attackInfo.recovery;
  }
}

/**
 * Manages active fighter combos and stun decays
 */
export function updateComboCounters(p1, p2) {
  // If defender is not hitstunned anymore, reset combo counter
  if (p1.state !== 'HIT' && p1.state !== 'BLOCK') {
    p2.comboCounter = 0;
    p2.comboDamage = 0;
  }
  if (p2.state !== 'HIT' && p2.state !== 'BLOCK') {
    p1.comboCounter = 0;
    p1.comboDamage = 0;
  }
}
