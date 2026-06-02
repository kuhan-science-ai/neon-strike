# NEON STRIKE: 2.5D Tag-Team Fighting Game

Neon Strike is a high-performance, browser-based 2v2 assist-based fighting game built using pure HTML5 Canvas and the Web Audio API. It features procedural skeletal vector-based neon characters, dynamic 2.5D camera systems, full combo juggling physics, and a loop-scheduled synthesizer soundtrack.

---

## 🎮 Game Controls

### Player 1 (Left Side Default)
- **A** : Move Left
- **D** : Move Right
- **W** : Jump
- **S** : Crouch
- **J** : Light Attack (Quick jabs)
- **K** : Medium Attack (Standard sweeps)
- **L** : Heavy Attack (Launcher - launches opponent in the air for air combos!)
- **U** : Special Attack 1 (Character-specific move)
- **I** : Special Attack 2 (Character-specific utility)
- **O** : Tag Switch (Tap to swap active/reserve, or hold **Down (S) + Tag (O)** to summon an **Assist Attack**)
- **P** : Ultimate Attack (Consumes 100% Super Meter)

### Player 2 (Local Versus Mode)
- **ArrowLeft** : Move Left
- **ArrowRight** : Move Right
- **ArrowUp** : Jump
- **ArrowDown** : Crouch
- **V** (or **Numpad 4**) : Light Attack
- **B** (or **Numpad 5**) : Medium Attack
- **N** (or **Numpad 6**) : Heavy Attack
- **G** (or **Numpad 7**) : Special 1
- **H** (or **Numpad 8**) : Special 2
- **M** (or **Numpad 9**) : Tag Switch (Hold **ArrowDown + Tag** for **Assist Attack**)
- **Comma (,)** (or **Numpad 0**) : Ultimate Attack

---

## ⚡ Character Roster & Movesets

### 1. Blaze (Rushdown)
- **Special 1 (Flame Dash)**: Swaps to a flaming particle state and dashes horizontally across the screen, striking the opponent.
- **Special 2 (Fire Uppercut)**: Leaps vertically into the air with a fiery trail, launching the opponent high into the air.
- **Ultimate (Inferno Rush)**: Smashes forward with a massive punch combination, dealing heavy damage.

### 2. Frost (Zoner)
- **Special 1 (Ice Shot)**: Launches a slow-moving glowing projectile across the screen to keep opponents at distance.
- **Special 2 (Freeze Trap)**: Drops an icy trap at their feet. Opponents stepping on this trap are frozen (hitstunned) for 60 frames.
- **Ultimate (Absolute Zero)**: Triggers a massive burst of ice spikes dealing horizontal damage across the floor.

### 3. Volt (Speed)
- **Special 1 (Lightning Dash)**: Instantly teleports forward through the opponent, striking them from behind.
- **Special 2 (Blink Strike)**: Teleports above the opponent's coordinates and falls down.
- **Ultimate (Thunder Storm)**: Creates an electric strike vortex, trapping and electrocuting the opponent.

### 4. Titan (Tank)
- **Special 1 (Ground Slam)**: Smashes the ground, launching a shockwave along the floor that knocks opponents upward.
- **Special 2 (Armor Charge)**: Dashes forward with heavy shoulder plating, ignoring minor hitstun to smash through attacks.
- **Ultimate (Earth Breaker)**: Jumps into the air and crashes down with a massive ground explosion.

---

## 🛠️ Combat Systems

1. **Procedural Neon Skeletal System**: Drawn entirely via Joint coordinates and line meshes. Characters feature visual energy indicators and motion blur trails when moving quickly.
2. **Pushboxes**: Dynamic character body collision circles that prevent fighters from clipping or passing through one another.
3. **Hitbox & Hurtbox Checks**: Axis-aligned rectangles mapped relative to the active frame's state (startup, active, recovery) checking contact coordinates.
4. **Combo Damage Scaling**: Successive hits scale damage by 88% per hit to prevent infinite-combo K.O.s ($Scaled = Base \times 0.88^{hits}$).
5. **Air Juggling**: Heavy attacks launch players in the air. Hits on airborne targets reset gravity velocity slightly, letting you chain attacks.
6. **Procedural Synthesizer**: Uses browser Web Audio nodes to synthesize punches, laser project tiles, pings, and dynamic retro synth loops.

---

## 🚀 How to Run the Game Locally

1. **Prerequisites**: Make sure you have **Node.js** (v16+) installed.
2. **Start the Local Development Server**:
   ```bash
   npm run dev
   ```
3. **Open the Game Link in your browser**:
   - URL: [http://localhost:5173](http://localhost:5173)
