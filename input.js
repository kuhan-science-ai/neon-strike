// Input Manager
class InputManager {
  constructor() {
    // Current input state for P1 and P2
    this.states = {
      0: { // Player 1
        left: false,
        right: false,
        up: false,
        down: false,
        light: false,
        medium: false,
        heavy: false,
        sp1: false,
        sp2: false,
        tag: false,
        ultimate: false
      },
      1: { // Player 2
        left: false,
        right: false,
        up: false,
        down: false,
        light: false,
        medium: false,
        heavy: false,
        sp1: false,
        sp2: false,
        tag: false,
        ultimate: false
      }
    };

    // Keyboard Key Bindings
    this.bindings = {
      // Player 1 Keys
      'KeyA': { player: 0, action: 'left' },
      'KeyD': { player: 0, action: 'right' },
      'KeyW': { player: 0, action: 'up' },
      'KeyS': { player: 0, action: 'down' },
      'KeyJ': { player: 0, action: 'light' },
      'KeyK': { player: 0, action: 'medium' },
      'KeyL': { player: 0, action: 'heavy' },
      'KeyU': { player: 0, action: 'sp1' },
      'KeyI': { player: 0, action: 'sp2' },
      'KeyO': { player: 0, action: 'tag' },
      'KeyP': { player: 0, action: 'ultimate' },

      // Player 2 Keys (Arrow Keys + Num keys or V/B/N/G/H/M/Comma)
      'ArrowLeft': { player: 1, action: 'left' },
      'ArrowRight': { player: 1, action: 'right' },
      'ArrowUp': { player: 1, action: 'up' },
      'ArrowDown': { player: 1, action: 'down' },
      'KeyV': { player: 1, action: 'light' },
      'Numpad4': { player: 1, action: 'light' },
      'KeyB': { player: 1, action: 'medium' },
      'Numpad5': { player: 1, action: 'medium' },
      'KeyN': { player: 1, action: 'heavy' },
      'Numpad6': { player: 1, action: 'heavy' },
      'KeyG': { player: 1, action: 'sp1' },
      'Numpad7': { player: 1, action: 'sp1' },
      'KeyH': { player: 1, action: 'sp2' },
      'Numpad8': { player: 1, action: 'sp2' },
      'KeyM': { player: 1, action: 'tag' },
      'Numpad9': { player: 1, action: 'tag' },
      'Comma': { player: 1, action: 'ultimate' },
      'Numpad0': { player: 1, action: 'ultimate' }
    };

    this.initKeyboardListeners();
    this.initMobileControls();
  }

  initKeyboardListeners() {
    const getBinding = (e) => {
      let binding = this.bindings[e.code];
      if (!binding && e.key) {
        const charKey = e.key.toLowerCase();
        const keyToCodeMap = {
          'a': 'KeyA', 'd': 'KeyD', 'w': 'KeyW', 's': 'KeyS',
          'j': 'KeyJ', 'k': 'KeyK', 'l': 'KeyL',
          'u': 'KeyU', 'i': 'KeyI', 'o': 'KeyO', 'p': 'KeyP',
          'v': 'KeyV', 'b': 'KeyB', 'n': 'KeyN',
          'g': 'KeyG', 'h': 'KeyH', 'm': 'KeyM',
          ',': 'Comma',
          'arrowleft': 'ArrowLeft', 'arrowright': 'ArrowRight',
          'arrowup': 'ArrowUp', 'arrowdown': 'ArrowDown'
        };
        const mappedCode = keyToCodeMap[charKey];
        if (mappedCode) {
          binding = this.bindings[mappedCode];
        }
      }
      return binding;
    };

    window.addEventListener('keydown', (e) => {
      const isArrowKey = e.key && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase());
      // Prevent scrolling when pressing navigation keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || isArrowKey) {
        e.preventDefault();
      }

      const binding = getBinding(e);
      if (binding) {
        this.states[binding.player][binding.action] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const binding = getBinding(e);
      if (binding) {
        this.states[binding.player][binding.action] = false;
      }
    });
  }

  initMobileControls() {
    // Mapping of touch elements to active actions
    const touchButtonIds = [
      { id: 'btn-touch-left', action: 'left' },
      { id: 'btn-touch-right', action: 'right' },
      { id: 'btn-touch-up', action: 'up' },
      { id: 'btn-touch-down', action: 'down' },
      { id: 'btn-touch-light', action: 'light' },
      { id: 'btn-touch-medium', action: 'medium' },
      { id: 'btn-touch-heavy', action: 'heavy' },
      { id: 'btn-touch-sp1', action: 'sp1' },
      { id: 'btn-touch-sp2', action: 'sp2' },
      { id: 'btn-touch-tag', action: 'tag' },
      { id: 'btn-touch-ult', action: 'ultimate' }
    ];

    touchButtonIds.forEach(({ id, action }) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const triggerPress = (e) => {
        e.preventDefault();
        this.states[0][action] = true; // Mobile touches map to Player 1
      };

      const triggerRelease = (e) => {
        e.preventDefault();
        this.states[0][action] = false;
      };

      // Handle touch devices
      btn.addEventListener('touchstart', triggerPress, { passive: false });
      btn.addEventListener('touchend', triggerRelease, { passive: false });
      btn.addEventListener('touchcancel', triggerRelease, { passive: false });

      // Fallback for mouse clicks on desktop testing mobile view
      btn.addEventListener('mousedown', triggerPress);
      btn.addEventListener('mouseup', triggerRelease);
      btn.addEventListener('mouseleave', triggerRelease);
    });
  }

  /**
   * Check if an action is currently pressed
   * @param {number} playerIndex - 0 for P1, 1 for P2
   * @param {string} action - 'left', 'right', 'up', 'down', 'light', 'medium', 'heavy', 'sp1', 'sp2', 'tag', 'ultimate'
   * @returns {boolean}
   */
  isPressed(playerIndex, action) {
    if (!this.states[playerIndex]) return false;
    return this.states[playerIndex][action] || false;
  }

  /**
   * Reset specific action to false to handle single-trigger events
   * @param {number} playerIndex 
   * @param {string} action 
   */
  consumePress(playerIndex, action) {
    if (this.states[playerIndex] && this.states[playerIndex][action]) {
      this.states[playerIndex][action] = false;
      return true;
    }
    return false;
  }

  /**
   * Clear all inputs (e.g. on round transition, menu open, pause)
   */
  clearAll() {
    for (let player of [0, 1]) {
      for (let key in this.states[player]) {
        this.states[player][key] = false;
      }
    }
  }
}

// Export a singleton instance
export const input = new InputManager();
