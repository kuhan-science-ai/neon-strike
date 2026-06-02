// Procedural Animation, Particle, and Visual Effects System

class VisualEffectsManager {
  constructor() {
    this.particles = [];
    this.sparks = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
  }

  /**
   * Update visual effects (particles, sparks, screen shake)
   */
  update() {
    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += spark.gravity;
      spark.life -= 1 / 60;
      if (spark.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // Update custom particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      if (p.ax) p.vx += p.ax;
      if (p.ay) p.vy += p.ay;
      p.life -= 1 / 60;
      if (p.sizeDecay) p.size = Math.max(0.1, p.size - p.sizeDecay);
      if (p.alphaDecay) p.alpha = Math.max(0, p.alpha - p.alphaDecay);
      
      if (p.type === 'ring') {
        p.radius += p.speed;
      } else if (p.type === 'lightning') {
        p.x += (Math.random() - 0.5) * 6;
        p.y += (Math.random() - 0.5) * 6;
      } else if (p.type === 'cube') {
        p.rotation += p.rotSpeed || 0.05;
      }

      if (p.life <= 0 || (p.alpha !== undefined && p.alpha <= 0)) {
        this.particles.splice(i, 1);
      }
    }

    // Update screen shake
    if (this.screenShakeTime > 0) {
      this.screenShakeTime--;
    }
  }

  /**
   * Triggers a screen shake effect
   */
  triggerScreenShake(duration = 10, intensity = 5) {
    this.screenShakeTime = duration;
    this.screenShakeIntensity = intensity;
  }

  /**
   * Adds glowing hit sparks
   */
  spawnHitSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.15,
        color: color,
        life: 0.3 + Math.random() * 0.4,
        size: 2 + Math.random() * 3
      });
    }
  }

  /**
   * Spawn attack limb trailing particles
   */
  spawnTrailParticle(x, y, characterType) {
    let color = '#ffffff';
    let type = 'circle';
    let vx = (Math.random() - 0.5) * 2;
    let vy = (Math.random() - 0.5) * 2;
    let size = 3 + Math.random() * 4;
    let life = 0.2 + Math.random() * 0.25;
    let alpha = 1.0;
    let alphaDecay = 0.04;
    let sizeDecay = 0.1;
    let rotation = 0;
    let rotSpeed = 0;

    switch (characterType) {
      case 'blaze': // Rising orange/red embers
        color = Math.random() < 0.6 ? '#ff3b30' : '#ff9500';
        vy = -1 - Math.random() * 2;
        vx = (Math.random() - 0.5) * 1.5;
        life = 0.3 + Math.random() * 0.3;
        break;
      case 'frost': // Blue spinning diamonds / frost mist
        color = Math.random() < 0.5 ? '#00f3ff' : '#a5f3fc';
        type = 'cube';
        rotation = Math.random() * Math.PI;
        rotSpeed = (Math.random() - 0.5) * 0.2;
        size = 4 + Math.random() * 3;
        life = 0.4 + Math.random() * 0.3;
        break;
      case 'volt': // Electric yellow jittery lines/dots
        color = '#ffea00';
        type = 'lightning';
        vx = (Math.random() - 0.5) * 4;
        vy = (Math.random() - 0.5) * 4;
        life = 0.15 + Math.random() * 0.15;
        break;
      case 'titan': // Heavy purple block fragments
        color = '#af52de';
        type = 'cube';
        rotation = Math.random() * Math.PI;
        rotSpeed = (Math.random() - 0.5) * 0.08;
        size = 6 + Math.random() * 5;
        vy = Math.random() * 0.5; // fall slowly
        life = 0.5 + Math.random() * 0.4;
        break;
    }

    this.particles.push({
      x, y, vx, vy, color, type, size, life, alpha, alphaDecay, sizeDecay, rotation, rotSpeed
    });
  }

  /**
   * Spawns tag-in digital portals and horizontal neon warp grids
   */
  spawnTagBurst(x, y, color) {
    // 1. Digital expanding energy ring
    this.particles.push({
      x: x,
      y: y,
      type: 'ring',
      radius: 5,
      speed: 6.5,
      color: color,
      life: 0.5,
      alpha: 1.0,
      alphaDecay: 0.035,
      lineWidth: 3.5
    });

    // 2. Vertical portal laser beams
    for (let i = 0; i < 6; i++) {
      const offsetX = (Math.random() - 0.5) * 50;
      this.particles.push({
        x: x + offsetX,
        y: y + 80,
        type: 'beam',
        length: 80 + Math.random() * 120,
        vx: 0,
        vy: -8 - Math.random() * 10,
        color: color,
        life: 0.3 + Math.random() * 0.3,
        alpha: 1.0,
        alphaDecay: 0.05,
        lineWidth: 1.5 + Math.random() * 2
      });
    }

    // 3. Digital code shards expanding
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        type: 'cube',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        size: 3 + Math.random() * 6,
        color: color,
        life: 0.4 + Math.random() * 0.4,
        alpha: 1.0,
        alphaDecay: 0.03,
        sizeDecay: 0.08
      });
    }
  }

  /**
   * Spawns impact ring expansion and cross-hatching laser sparks
   */
  spawnImpactShockwave(x, y, color) {
    // Expand ring
    this.particles.push({
      x: x,
      y: y,
      type: 'ring',
      radius: 10,
      speed: 4.5,
      color: color,
      life: 0.3,
      alpha: 1.0,
      alphaDecay: 0.05,
      lineWidth: 2.5
    });

    // Spawn specialized spark lines shooting outwards
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 15 + Math.random() * 25;
      const speed = 3 + Math.random() * 5;
      const targetX = x + Math.cos(angle) * length;
      const targetY = y + Math.sin(angle) * length;
      
      this.particles.push({
        x: x,
        y: y,
        type: 'line',
        targetX: targetX,
        targetY: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 0.25,
        alpha: 1.0,
        alphaDecay: 0.06,
        lineWidth: 1.5
      });
    }
  }

  /**
   * Draws dynamic particles (e.g. fire, ice, electric)
   */
  drawEffects(ctx) {
    ctx.save();
    
    // Draw sparks
    ctx.shadowBlur = 10;
    this.sparks.forEach(s => {
      ctx.shadowColor = s.color;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha !== undefined ? p.alpha : 1.0;
      ctx.shadowBlur = p.glow !== undefined ? p.glow : 12;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.lineWidth || 2;

      if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'cube') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.type === 'beam') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - p.length);
        ctx.stroke();
      } else if (p.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.targetX || p.x, p.targetY || p.y);
        ctx.stroke();
      } else {
        // Standard circle particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.restore();
  }

  drawElementalSlash(ctx, x, y, fighter) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = fighter.color;
    ctx.strokeStyle = fighter.color;
    ctx.lineWidth = 4.5;
    const progress = fighter.attackFrameProgress || 0.5;
    const dir = fighter.direction;
    
    if (fighter.characterType === 'blaze') {
      ctx.beginPath();
      // Draw fire crescent arc sweeping forward
      ctx.arc(x - dir * 15, y, 35, -Math.PI / 4, Math.PI / 4, dir < 0);
      ctx.stroke();
    } else if (fighter.characterType === 'frost') {
      // Draw multiple spiky ice shard triangles growing from hand/foot
      ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dir * 30, y - 10);
      ctx.lineTo(x + dir * 20, y);
      ctx.lineTo(x + dir * 35, y + 12);
      ctx.lineTo(x + dir * 15, y + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (fighter.characterType === 'volt') {
      // Draw zig-zag lightning bolts protruding forward
      ctx.beginPath();
      ctx.moveTo(x, y);
      let curX = x;
      let curY = y;
      for (let i = 0; i < 4; i++) {
        curX += dir * 8 + (Math.random() - 0.5) * 8;
        curY += (Math.random() - 0.5) * 12;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    } else if (fighter.characterType === 'titan') {
      // Draw heavy shield/impact geometric purple polygon edge
      ctx.fillStyle = 'rgba(175, 82, 222, 0.35)';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 20);
      ctx.lineTo(x + dir * 20, y - 20);
      ctx.lineTo(x + dir * 20, y + 20);
      ctx.lineTo(x - 5, y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Solves skeletal joint locations for a character procedurally based on state and timers.
   */
  getSkeleton(fighter, tick) {
    const dir = fighter.direction;
    const isCrouched = fighter.isCrouching;
    const baseHeight = fighter.height;
    
    // Joint positions relative to fighter root (fighter.x, fighter.y)
    let joints = {
      head: { x: 0, y: -baseHeight },
      chest: { x: 0, y: -baseHeight * 0.75 },
      hips: { x: 0, y: -baseHeight * 0.45 },
      shoulderFront: { x: dir * 12, y: -baseHeight * 0.72 },
      elbowFront: { x: dir * 25, y: -baseHeight * 0.60 },
      handFront: { x: dir * 35, y: -baseHeight * 0.60 },
      shoulderBack: { x: -dir * 12, y: -baseHeight * 0.72 },
      elbowBack: { x: -dir * 25, y: -baseHeight * 0.65 },
      handBack: { x: -dir * 32, y: -baseHeight * 0.65 },
      hipFront: { x: dir * 8, y: -baseHeight * 0.42 },
      kneeFront: { x: dir * 15, y: -baseHeight * 0.22 },
      footFront: { x: dir * 15, y: 0 },
      hipBack: { x: -dir * 8, y: -baseHeight * 0.42 },
      kneeBack: { x: -dir * 10, y: -baseHeight * 0.22 },
      footBack: { x: -dir * 15, y: 0 }
    };

    // Adjustments based on state:
    if (fighter.state === 'KO') {
      // Lie flat on floor
      joints.head = { x: dir * 55, y: -15 };
      joints.chest = { x: dir * 30, y: -15 };
      joints.hips = { x: 0, y: -10 };
      joints.shoulderFront = { x: dir * 25, y: -25 };
      joints.elbowFront = { x: dir * 35, y: -20 };
      joints.handFront = { x: dir * 45, y: -15 };
      joints.shoulderBack = { x: dir * 15, y: -5 };
      joints.elbowBack = { x: dir * 10, y: -5 };
      joints.handBack = { x: dir * 5, y: -5 };
      
      joints.hipFront = { x: -dir * 10, y: -10 };
      joints.kneeFront = { x: -dir * 25, y: -8 };
      joints.footFront = { x: -dir * 40, y: -5 };
      joints.hipBack = { x: -dir * 5, y: -10 };
      joints.kneeBack = { x: -dir * 18, y: -5 };
      joints.footBack = { x: -dir * 30, y: -5 };
      return joints;
    }

    if (isCrouched) {
      const scale = 0.62;
      joints.head.y = -baseHeight * scale;
      joints.chest.y = -baseHeight * scale * 0.75;
      joints.hips.y = -baseHeight * scale * 0.45;
      
      joints.shoulderFront.y = -baseHeight * scale * 0.72;
      joints.shoulderBack.y = -baseHeight * scale * 0.72;
      
      // Knees bent outwards
      joints.kneeFront = { x: dir * 25, y: -baseHeight * 0.15 };
      joints.footFront = { x: dir * 30, y: 0 };
      
      joints.kneeBack = { x: -dir * 22, y: -baseHeight * 0.15 };
      joints.footBack = { x: -dir * 25, y: 0 };
      
      // Guard stance hands
      joints.elbowFront = { x: dir * 20, y: joints.chest.y };
      joints.handFront = { x: dir * 25, y: joints.head.y + 10 };
      joints.elbowBack = { x: dir * 5, y: joints.chest.y };
      joints.handBack = { x: dir * 12, y: joints.head.y + 20 };
      return joints;
    }

    if (fighter.state === 'HIT') {
      // Jitter offset for hit reaction
      const jitterX = (Math.random() - 0.5) * 5;
      const jitterY = (Math.random() - 0.5) * 5;

      // Reeling backwards
      joints.head = { x: -dir * 18 + jitterX, y: -baseHeight + 8 + jitterY };
      joints.chest = { x: -dir * 10, y: -baseHeight * 0.72 };
      joints.hips = { x: 0, y: -baseHeight * 0.45 };

      joints.shoulderFront = { x: -dir * 5, y: -baseHeight * 0.70 };
      joints.elbowFront = { x: dir * 12, y: -baseHeight * 0.85 };
      this.flailArm(joints, 'shoulderFront', 'elbowFront', 'handFront', dir, -0.6);
      this.flailArm(joints, 'shoulderBack', 'elbowBack', 'handBack', -dir, -0.2);

      // Distorted legs
      joints.kneeFront = { x: dir * 5, y: -baseHeight * 0.15 };
      joints.footFront = { x: dir * 10, y: 0 };
      return joints;
    }

    if (fighter.state === 'BLOCK') {
      // Crossed arms in front of visor forming a shield
      joints.elbowFront = { x: dir * 20, y: -baseHeight * 0.78 };
      joints.handFront = { x: dir * 20, y: -baseHeight * 0.90 };
      joints.elbowBack = { x: dir * 18, y: -baseHeight * 0.74 };
      joints.handBack = { x: dir * 18, y: -baseHeight * 0.86 };

      // Normal legs, slightly crouched
      joints.kneeFront = { x: dir * 12, y: -baseHeight * 0.20 };
      joints.footFront = { x: dir * 15, y: 0 };
      return joints;
    }

    if (fighter.state === 'JUMPING' || fighter.state === 'JUMP_FALL') {
      // Pull legs up slightly
      joints.hips.y = -baseHeight * 0.50;
      joints.kneeFront = { x: dir * 18, y: -baseHeight * 0.35 };
      joints.footFront = { x: dir * 12, y: -baseHeight * 0.15 };
      
      joints.kneeBack = { x: -dir * 8, y: -baseHeight * 0.35 };
      joints.footBack = { x: -dir * 12, y: -baseHeight * 0.18 };

      // Float arms outwards
      joints.elbowFront = { x: dir * 25, y: -baseHeight * 0.80 };
      joints.handFront = { x: dir * 35, y: -baseHeight * 0.90 };
      joints.elbowBack = { x: -dir * 25, y: -baseHeight * 0.80 };
      joints.handBack = { x: -dir * 32, y: -baseHeight * 0.90 };
      return joints;
    }

    if (fighter.state === 'ATTACK') {
      const attackType = fighter.activeAttackType || 'light';
      const progress = fighter.attackFrameProgress || 0; // 0 to 1

      // Punch
      if (attackType === 'light' || attackType === 'medium' || attackType === 'sp1_punch') {
        // Front arm thrusts forward
        const reach = attackType === 'medium' ? 62 : 45;
        joints.shoulderFront = { x: dir * 18, y: -baseHeight * 0.75 };
        
        // Dynamic animation progress
        const thrust = Math.sin(progress * Math.PI) * reach;
        joints.elbowFront = { x: dir * 18 + thrust * 0.5, y: -baseHeight * 0.74 };
        joints.handFront = { x: dir * 18 + thrust, y: -baseHeight * 0.74 };

        // Torso tilts forward
        joints.chest.x = dir * 10 * Math.sin(progress * Math.PI);
        joints.head.x = dir * 12 * Math.sin(progress * Math.PI);
      } 
      // Kick
      else if (attackType === 'heavy' || attackType === 'sp2_kick') {
        // Front leg swings out high
        const reach = 60;
        const swing = Math.sin(progress * Math.PI) * reach;
        
        joints.hipFront = { x: dir * 10, y: -baseHeight * 0.40 };
        joints.kneeFront = { x: dir * 10 + swing * 0.7, y: -baseHeight * 0.38 - swing * 0.4 };
        joints.footFront = { x: dir * 10 + swing, y: -baseHeight * 0.38 - swing * 0.5 };

        // Back leg balances
        joints.kneeBack = { x: -dir * 18, y: -baseHeight * 0.18 };
        joints.footBack = { x: -dir * 22, y: 0 };

        // Arms swing back for balance
        joints.handFront = { x: -dir * 18, y: -baseHeight * 0.55 };
        joints.handBack = { x: -dir * 28, y: -baseHeight * 0.50 };
      }
      return joints;
    }

    // Default: IDLE bobbing & WALKING cycles
    const time = tick * 0.08;
    if (fighter.state === 'MOVE') {
      // Walking cycle
      const cycle = Math.sin(time);
      const absCycle = Math.abs(Math.sin(time));

      // Torso bounces slightly
      joints.chest.y += Math.abs(cycle) * 3;
      joints.head.y += Math.abs(cycle) * 2;

      // Arm swing
      joints.elbowFront = { x: dir * 12 + cycle * 12, y: -baseHeight * 0.60 + cycle * 5 };
      joints.handFront = { x: dir * 15 + cycle * 20, y: -baseHeight * 0.55 + cycle * 8 };
      
      joints.elbowBack = { x: -dir * 12 - cycle * 12, y: -baseHeight * 0.60 - cycle * 5 };
      joints.handBack = { x: -dir * 15 - cycle * 20, y: -baseHeight * 0.55 - cycle * 8 };

      // Leg swing
      joints.kneeFront = { x: dir * 12 + cycle * 15, y: -baseHeight * 0.20 + absCycle * 8 };
      joints.footFront = { x: dir * 15 + cycle * 25, y: cycle > 0 ? -absCycle * 10 : 0 };

      joints.kneeBack = { x: -dir * 12 - cycle * 15, y: -baseHeight * 0.20 + (1 - absCycle) * 8 };
      joints.footBack = { x: -dir * 15 - cycle * 25, y: cycle < 0 ? -absCycle * 10 : 0 };
    } else {
      // IDLE breathing
      const breathe = Math.sin(tick * 0.05) * 2.5;
      joints.head.y += breathe;
      joints.chest.y += breathe * 0.8;
      joints.shoulderFront.y += breathe * 0.5;
      joints.shoulderBack.y += breathe * 0.5;
      
      // Guard arms
      joints.elbowFront = { x: dir * 18, y: -baseHeight * 0.65 + breathe * 0.4 };
      joints.handFront = { x: dir * 24, y: -baseHeight * 0.72 + breathe };
      
      joints.elbowBack = { x: -dir * 5, y: -baseHeight * 0.65 + breathe * 0.4 };
      joints.handBack = { x: -dir * 8, y: -baseHeight * 0.68 + breathe };
    }

    return joints;
  }

  flailArm(joints, shoulder, elbow, hand, dir, factor) {
    joints[elbow] = { x: joints[shoulder].x + dir * 15, y: joints[shoulder].y + 10 };
    joints[hand] = { x: joints[shoulder].x + dir * 25, y: joints[shoulder].y + factor * 20 };
  }

  /**
   * Draws the fighter using glow shaders and custom bone lines.
   * Also overlays energy shields for blocking.
   */
  drawSkeletalFighter(ctx, fighter, tick, ghostHistory = []) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = fighter.color;
    ctx.strokeStyle = fighter.color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Draw ghost trails if moving at high speeds or attacking
    const highSpeed = Math.abs(fighter.vx) > fighter.walkSpeed || fighter.state === 'ATTACK';
    if (highSpeed && ghostHistory.length > 0) {
      ghostHistory.forEach((oldPos, index) => {
        const opacity = (index + 1) / (ghostHistory.length * 2.5);
        ctx.strokeStyle = fighter.color;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2.0;
        
        // Fetch joints at historical coordinates
        const oldJoints = this.getSkeleton(fighter, tick - (ghostHistory.length - index));
        this.renderBones(ctx, oldPos.x, oldPos.y, oldJoints, fighter.direction);
        ctx.restore();
      });
    }

    // 2. Draw active character skeleton centered at fighter coordinates
    const joints = this.getSkeleton(fighter, tick);
    
    // Draw bones pipeline
    this.renderBones(ctx, fighter.x, fighter.y, joints, fighter.direction);

    // 2.5 Spawn attacking elemental trails and render slash overlays
    if (fighter.state === 'ATTACK' && fighter.activeAttackType) {
      const isPunch = ['light', 'medium', 'sp1'].includes(fighter.activeAttackType) && 
                      (fighter.characterType === 'blaze' || fighter.characterType === 'volt');
      const attackingJoint = isPunch ? joints.handFront : joints.footFront;
      
      const worldX = fighter.x + attackingJoint.x;
      const worldY = fighter.y + attackingJoint.y;
      
      // Spawn trail particles
      this.spawnTrailParticle(worldX, worldY, fighter.characterType);
      
      // Render custom elemental energy slash shapes
      this.drawElementalSlash(ctx, worldX, worldY, fighter);
    }

    // 3. Draw a glowing shield if the fighter is blocking
    if (fighter.state === 'BLOCK') {
      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00f3ff';
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.75)';
      ctx.fillStyle = 'rgba(0, 243, 255, 0.1)';
      ctx.lineWidth = 3;
      
      const shieldX = fighter.x + fighter.direction * 35;
      const shieldY = fighter.y - fighter.height * 0.75;
      
      ctx.beginPath();
      // Draw half circle shield facing opponent
      ctx.arc(shieldX, shieldY, 45, -Math.PI / 2, Math.PI / 2, fighter.direction < 0);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderBones(ctx, rootX, rootY, joints, dir) {
    const drawLine = (j1, j2) => {
      ctx.beginPath();
      ctx.moveTo(rootX + j1.x, rootY + j1.y);
      ctx.lineTo(rootX + j2.x, rootY + j2.y);
      ctx.stroke();
    };

    // Draw spine / Torso
    drawLine(joints.hips, joints.chest);
    
    // Draw shoulders connector
    ctx.beginPath();
    ctx.moveTo(rootX + joints.shoulderFront.x, rootY + joints.shoulderFront.y);
    ctx.lineTo(rootX + joints.shoulderBack.x, rootY + joints.shoulderBack.y);
    ctx.stroke();

    // Draw Neck
    drawLine(joints.chest, joints.head);

    // Draw Head circle
    ctx.save();
    ctx.fillStyle = 'rgba(10, 20, 50, 0.8)';
    ctx.beginPath();
    ctx.arc(rootX + joints.head.x, rootY + joints.head.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw a visor glow strip
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.fillRect(rootX + joints.head.x + dir * 4 - 3, rootY + joints.head.y - 3, 6, 4);
    ctx.restore();

    // Draw Back arm (drawn behind torso)
    drawLine(joints.shoulderBack, joints.elbowBack);
    drawLine(joints.elbowBack, joints.handBack);

    // Draw Front arm (drawn in front of torso)
    drawLine(joints.shoulderFront, joints.elbowFront);
    drawLine(joints.elbowFront, joints.handFront);

    // Draw Hips connector
    ctx.beginPath();
    ctx.moveTo(rootX + joints.hipFront.x, rootY + joints.hipFront.y);
    ctx.lineTo(rootX + joints.hipBack.x, rootY + joints.hipBack.y);
    ctx.stroke();

    // Draw Back Leg
    drawLine(joints.hipBack, joints.kneeBack);
    drawLine(joints.kneeBack, joints.footBack);

    // Draw Front Leg
    drawLine(joints.hipFront, joints.kneeFront);
    drawLine(joints.kneeFront, joints.footFront);
  }
}

export const fx = new VisualEffectsManager();
export default fx;
