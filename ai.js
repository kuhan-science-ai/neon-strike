// AI Opponent system (Complete AI Behavior State Machine)

class AIOpponent {
  constructor() {
    this.reactionDelay = 0;
    this.currentInputs = this.createDefaultInputs();
    
    // Combo memory tracking
    this.comboStep = 0;
    this.comboTimer = 0;
  }

  createDefaultInputs() {
    return {
      left: false, right: false, up: false, down: false,
      light: false, medium: false, heavy: false,
      sp1: false, sp2: false, tag: false, ultimate: false
    };
  }

  /**
   * Generates inputs for the AI character dynamically
   * @param {object} self - Active AI fighter
   * @param {object} opponent - Active player fighter
   * @param {string} difficulty - 'easy', 'medium', 'hard'
   * @returns {object}
   */
  getInputs(self, opponent, difficulty) {
    // Start with blank slate inputs
    this.currentInputs = this.createDefaultInputs();

    if (!self || !opponent || self.health <= 0 || opponent.health <= 0) {
      return this.currentInputs;
    }

    // Reaction speed bounds based on difficulty
    // Easy: reacts once every 45 frames (0.75s)
    // Medium: reacts once every 20 frames (0.33s)
    // Hard: reacts once every 5 frames (0.08s)
    this.reactionDelay++;
    const frameLimit = difficulty === 'easy' ? 45 : (difficulty === 'medium' ? 20 : 5);

    if (this.reactionDelay < frameLimit) {
      // Return previous movement choices, but clear single-press action triggers
      return this.clearActionTriggers(this.currentInputs);
    }

    this.reactionDelay = 0;

    // Calculate distance details
    const dx = opponent.x - self.x;
    const absDx = Math.abs(dx);
    const facingDir = dx > 0 ? 1 : -1;

    // 1. Defending state check (Reacting to opponent attack frames)
    if (opponent.state === 'ATTACK') {
      let blockChance = 0.15; // Easy
      if (difficulty === 'medium') blockChance = 0.60;
      if (difficulty === 'hard') blockChance = 0.95;

      if (Math.random() < blockChance) {
        // Block: Hold backward direction relative to opponent
        if (facingDir === 1) {
          this.currentInputs.left = true;
        } else {
          this.currentInputs.right = true;
        }
        
        // Crouch block 50% of time
        if (Math.random() < 0.5) {
          this.currentInputs.down = true;
        }
        return this.currentInputs;
      }
    }

    // 2. Escape or Tag decision if health is critically low
    if (self.health < self.maxHealth * 0.25 && difficulty !== 'easy') {
      const tagChance = difficulty === 'hard' ? 0.3 : 0.1;
      if (Math.random() < tagChance) {
        // Decide to tag out
        this.currentInputs.tag = true;
        return this.currentInputs;
      }
    }

    // 3. Chain combos if in attack state or opponent is hitstunned
    if (opponent.state === 'HIT' && difficulty !== 'easy') {
      this.executeComboSequence(self, difficulty);
      return this.currentInputs;
    }

    // Reset combo step if player is neutral
    this.comboStep = 0;

    // 4. Default spacing/approaching behavior based on range
    if (absDx > 240) {
      // Long Range: Move toward player
      this.moveTowards(facingDir);
      
      // Zoner (Frost) shoots projectile, others dash
      if (self.characterType === 'frost' && Math.random() < 0.22) {
        this.currentInputs.sp1 = true;
      } else if (self.characterType === 'blaze' && Math.random() < 0.15) {
        this.currentInputs.sp1 = true; // Flame Dash
      } else if (self.characterType === 'volt' && Math.random() < 0.18) {
        this.currentInputs.sp1 = true; // Lightning Dash
      }
    } 
    else if (absDx > 85) {
      // Mid Range: Walk and poke
      this.moveTowards(facingDir);

      if (Math.random() < 0.18) {
        this.currentInputs.medium = true;
      } else if (Math.random() < 0.08 && self.meter >= 100) {
        this.currentInputs.ultimate = true; // Fire Ultimate!
      }
    } 
    else {
      // Close Range: Attacks, jumps, blocking baits
      const choice = Math.random();

      if (choice < 0.35) {
        // Jab Light
        this.currentInputs.light = true;
      } else if (choice < 0.55) {
        // Crouch block bait
        this.currentInputs.down = true;
      } else if (choice < 0.70) {
        // Heavy launcher strike
        this.currentInputs.heavy = true;
      } else if (choice < 0.82) {
        // Special Uppercut / Slam
        this.currentInputs.sp2 = true;
      } else if (choice < 0.90 && difficulty === 'hard') {
        // Summon tag assist helper
        this.currentInputs.tag = true;
        this.currentInputs.down = true; // assist modifier
      } else {
        // Back off slightly
        this.moveAway(facingDir);
      }
    }

    return this.currentInputs;
  }

  moveTowards(facingDir) {
    if (facingDir === 1) {
      this.currentInputs.right = true;
    } else {
      this.currentInputs.left = true;
    }
  }

  moveAway(facingDir) {
    if (facingDir === 1) {
      this.currentInputs.left = true;
    } else {
      this.currentInputs.right = true;
    }
  }

  executeComboSequence(self, difficulty) {
    this.comboStep++;
    
    // Easy combos: None. Medium: Light -> Medium. Hard: Light -> Medium -> Heavy -> Special!
    if (this.comboStep === 1) {
      this.currentInputs.light = true;
    } else if (this.comboStep === 2) {
      this.currentInputs.medium = true;
    } else if (this.comboStep === 3 && difficulty === 'hard') {
      this.currentInputs.heavy = true;
    } else if (this.comboStep === 4 && difficulty === 'hard') {
      // Finish with ultimate or special uppercut
      if (self.meter >= 100) {
        this.currentInputs.ultimate = true;
      } else {
        this.currentInputs.sp2 = true;
      }
      this.comboStep = 0; // reset
    } else {
      this.comboStep = 0;
    }
  }

  clearActionTriggers(inputs) {
    const cleared = { ...inputs };
    cleared.light = false;
    cleared.medium = false;
    cleared.heavy = false;
    cleared.sp1 = false;
    cleared.sp2 = false;
    cleared.tag = false;
    cleared.ultimate = false;
    return cleared;
  }
}

export const ai = new AIOpponent();
export default ai;
