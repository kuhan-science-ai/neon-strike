// Dynamic Web Audio Synthesizer System
class AudioSynthManager {
  constructor() {
    this.ctx = null;
    this.musicInterval = null;
    
    // Volume controls
    this.musicVolumeVal = 0.5;
    this.sfxVolumeVal = 0.6;
    
    // Music state
    this.musicNode = null;
    this.musicGain = null;
    this.isPlayingMusic = false;
  }

  /**
   * Initializes the AudioContext on user interaction
   */
  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    console.log("NEON STRIKE Audio Synth Initialized.");

    // Retrieve initial UI volumes
    const volMusic = document.getElementById('setting-volume');
    const volSfx = document.getElementById('setting-sfx');

    if (volMusic) this.musicVolumeVal = parseFloat(volMusic.value) / 100;
    if (volSfx) this.sfxVolumeVal = parseFloat(volSfx.value) / 100;

    // Attach real-time setting change updates
    volMusic?.addEventListener('input', (e) => {
      this.musicVolumeVal = parseFloat(e.target.value) / 100;
      if (this.musicGain) {
        this.musicGain.gain.setValueAtTime(this.musicVolumeVal * 0.4, this.ctx.currentTime);
      }
    });

    volSfx?.addEventListener('input', (e) => {
      this.sfxVolumeVal = parseFloat(e.target.value) / 100;
    });
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates a cybernetic laser/laser-beam whoosh sound
   */
  playWhoosh(pitch = 220, duration = 0.25) {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.2, t + duration);

    gain.gain.setValueAtTime(this.sfxVolumeVal * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  /**
   * Generates a hit explosion, slap, or metallic tap sound
   */
  playHit(type) {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'light') {
      // High-pitched quick snap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);
      
      gain.gain.setValueAtTime(this.sfxVolumeVal * 0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } 
    else if (type === 'medium') {
      // Deeper punch punch
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
      
      gain.gain.setValueAtTime(this.sfxVolumeVal * 0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      // Distort slightly using lowpass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    } 
    else if (type === 'heavy') {
      // Massive explosion crash
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);
      
      gain.gain.setValueAtTime(this.sfxVolumeVal * 1.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);

      // Add high frequency crack/spark noise
      this.playStaticNoise(0.2, 0.4);
    }
  }

  playBlock() {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Metallic shield ping
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);

    gain.gain.setValueAtTime(this.sfxVolumeVal * 0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playStaticNoise(duration = 0.15, vol = 0.2) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.sfxVolumeVal * vol, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start();
  }

  playMenuClick() {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(660, t + 0.04);

    gain.gain.setValueAtTime(this.sfxVolumeVal * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Starts playing a retro synthwave bassline loops
   */
  startMusic() {
    this.init();
    this.resume();
    if (!this.ctx || this.isPlayingMusic) return;

    this.isPlayingMusic = true;
    
    // Create master music gain node
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolumeVal * 0.4, this.ctx.currentTime);
    this.musicGain.connect(this.ctx.destination);

    // Simple bass notes: E1, G1, A1, C2
    const bassline = [82.41, 98.00, 110.00, 130.81]; // Hz (E2, G2, A2, C3)
    let step = 0;

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Cycle note
      const baseNote = bassline[Math.floor(step / 4) % bassline.length];
      
      // Cyber pulse bass: rhythm beats
      const notes = [baseNote, baseNote, baseNote * 1.5, baseNote];
      const pitch = notes[step % notes.length];

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, t);
      
      // Synth swell envelope
      noteGain.gain.setValueAtTime(0, t);
      noteGain.gain.linearRampToValueAtTime(0.35, t + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.4);

      // Play lead notes on 4th beat arpeggios
      if (step % 8 === 0 && Math.random() < 0.7) {
        this.playLeadArpeggios(baseNote * 4);
      }

      step++;
    }, 450); // BPM tempo scheduler
  }

  playLeadArpeggios(basePitch) {
    const t = this.ctx.currentTime;
    const notes = [basePitch, basePitch * 1.2, basePitch * 1.5, basePitch * 1.8];
    
    notes.forEach((freq, idx) => {
      const timeOffset = idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + timeOffset);

      gain.gain.setValueAtTime(0.08, t + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + timeOffset + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t + timeOffset);
      osc.stop(t + timeOffset + 0.25);
    });
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isPlayingMusic = false;
  }
}

export const audio = new AudioSynthManager();
export default audio;
