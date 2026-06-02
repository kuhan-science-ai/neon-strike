// Collision System

/**
 * Resolves standard AABB overlap detection
 */
export function checkAABBOverlap(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Keeps the fighter clamped within the stage dimensions
 * @param {object} fighter - The fighter object containing x, y, width, height, vx, vy
 * @param {number} stageWidth - Stage width limit
 * @param {number} floorY - Absolute floor Y position
 */
export function checkStageBounds(fighter, stageWidth, floorY) {
  // Left wall clamp
  if (fighter.x - fighter.width / 2 < 0) {
    fighter.x = fighter.width / 2;
    fighter.vx = 0;
  }
  // Right wall clamp
  if (fighter.x + fighter.width / 2 > stageWidth) {
    fighter.x = stageWidth - fighter.width / 2;
    fighter.vx = 0;
  }
  // Floor clamp (ground state)
  if (fighter.y >= floorY) {
    fighter.y = floorY;
    fighter.vy = 0;
    fighter.isGrounded = true;
    if (fighter.state === 'JUMPING' || fighter.state === 'JUMP_FALL') {
      fighter.land();
    }
  } else {
    fighter.isGrounded = false;
  }
}

/**
 * Resolves pushbox collisions so active fighters do not pass through each other.
 * Both fighters are pushed back equally, or if one is at a wall, the other takes the full push back.
 * @param {object} f1 - Fighter 1
 * @param {object} f2 - Fighter 2
 * @param {number} stageWidth - Stage width limit
 */
export function handlePushboxCollision(f1, f2, stageWidth) {
  // Pushbox is defined centered on fighter.x
  const f1Left = f1.x - f1.pushboxWidth / 2;
  const f1Right = f1.x + f1.pushboxWidth / 2;
  const f2Left = f2.x - f2.pushboxWidth / 2;
  const f2Right = f2.x + f2.pushboxWidth / 2;

  // Check overlap on X
  if (f1Right > f2Left && f1Left < f2Right) {
    // Determine overlap depth
    const overlap = Math.min(f1Right - f2Left, f2Right - f1Left);
    
    // Direction from f1 to f2 (positive if f2 is to the right)
    const dir = f1.x < f2.x ? 1 : -1;
    
    // Check if either player is pinned against a stage wall
    const f1AtLeftWall = (f1.x - f1.pushboxWidth / 2 <= 5);
    const f1AtRightWall = (f1.x + f1.pushboxWidth / 2 >= stageWidth - 5);
    const f2AtLeftWall = (f2.x - f2.pushboxWidth / 2 <= 5);
    const f2AtRightWall = (f2.x + f2.pushboxWidth / 2 >= stageWidth - 5);

    if ((f1AtLeftWall || f1AtRightWall) && !(f2AtLeftWall || f2AtRightWall)) {
      // f1 is at wall, push only f2
      f2.x += overlap * dir;
    } else if ((f2AtLeftWall || f2AtRightWall) && !(f1AtLeftWall || f1AtRightWall)) {
      // f2 is at wall, push only f1
      f1.x -= overlap * dir;
    } else {
      // Push both fighters equally in opposite directions
      f1.x -= (overlap / 2) * dir;
      f2.x += (overlap / 2) * dir;
    }
  }
}

/**
 * Clamps fighters relative to the active camera screen edge, keeping them close enough to interact.
 * Fighting game rules: you cannot run off-screen past the viewport borders.
 * @param {object} f1 - Active Fighter 1
 * @param {object} f2 - Active Fighter 2
 * @param {number} cameraX - Left edge of the viewport
 * @param {number} cameraWidth - Width of the viewport
 */
export function clampToScreen(f1, f2, cameraX, cameraWidth) {
  const minX = cameraX + 30; // buffer margin
  const maxX = cameraX + cameraWidth - 30;

  // Clamp Fighter 1 to camera edges
  if (f1.x < minX) f1.x = minX;
  if (f1.x > maxX) f1.x = maxX;

  // Clamp Fighter 2 to camera edges
  if (f2.x < minX) f2.x = minX;
  if (f2.x > maxX) f2.x = maxX;
}

/**
 * Checks hitbox to hurtbox collision between an attacking fighter and defending fighter.
 * Returns the intersection coordinates if a hit connects, otherwise null.
 */
export function checkHitboxCollision(attacker, defender) {
  const hitbox = attacker.getHitbox();
  const hurtbox = defender.getHurtbox();

  if (!hitbox || !hurtbox) return null;

  const overlap = checkAABBOverlap(hitbox, hurtbox);
  if (overlap) {
    // Return approximate contact coordinate for hit sparks
    const contactX = attacker.direction === 1 
      ? Math.max(hitbox.x, hurtbox.x) 
      : Math.min(hitbox.x + hitbox.width, hurtbox.x + hurtbox.width);
    const contactY = hitbox.y + hitbox.height / 2;

    return { x: contactX, y: contactY };
  }
  return null;
}

