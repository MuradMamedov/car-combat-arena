/**
 * Sound Manager - Procedural audio synthesis using Web Audio API
 * Creates retro-futuristic sound effects without external audio files
 */

export type SoundType =
  | "shoot"
  | "hit"
  | "shieldHit"
  | "shieldBreak"
  | "explosion"
  | "pickup"
  | "boost"
  | "wallHit"
  | "wallDestroy"
  | "gameStart"
  | "gameOver"
  | "victory";

/**
 * Sound Manager that synthesizes game audio effects
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.5;
  private initialized = false;

  // Track active boost sound
  private boostOscillator: OscillatorNode | null = null;
  private boostOscillator2: OscillatorNode | null = null;
  private boostLfo: OscillatorNode | null = null;
  private boostNoiseSource: AudioBufferSourceNode | null = null;
  private boostGain: GainNode | null = null;

  constructor() {
    // Audio context needs user interaction to start
    this.setupUserInteraction();
  }

  /**
   * Setup click listener to initialize audio context
   * (browsers require user interaction before playing audio)
   */
  private setupUserInteraction(): void {
    const initAudio = () => {
      if (!this.initialized) {
        this.initAudioContext();
      }
    };

    document.addEventListener("click", initAudio, { once: false });
    document.addEventListener("keydown", initAudio, { once: false });
  }

  /**
   * Initialize the audio context
   */
  private initAudioContext(): void {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) {
      return;
    }

    // Resume context if suspended
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    switch (type) {
      case "shoot":
        this.playShootSound();
        break;
      case "hit":
        this.playHitSound();
        break;
      case "shieldHit":
        this.playShieldHitSound();
        break;
      case "shieldBreak":
        this.playShieldBreakSound();
        break;
      case "explosion":
        this.playExplosionSound();
        break;
      case "pickup":
        this.playPickupSound();
        break;
      case "boost":
        // Boost is handled separately with start/stop
        break;
      case "wallHit":
        this.playWallHitSound();
        break;
      case "wallDestroy":
        this.playWallDestroySound();
        break;
      case "gameStart":
        this.playGameStartSound();
        break;
      case "gameOver":
        this.playGameOverSound();
        break;
      case "victory":
        this.playVictorySound();
        break;
    }
  }

  /**
   * Laser/cannon shoot sound - short sci-fi zap
   */
  private playShootSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Main laser tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.1);

    // Add some noise for punch
    this.addNoiseBlip(0.08, 0.15);
  }

  /**
   * Health damage hit sound - impact thud
   */
  private playHitSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Low impact thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.15);

    // Distortion burst
    this.addNoiseBlip(0.1, 0.25);
  }

  /**
   * Shield hit sound - electric crackle
   */
  private playShieldHitSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // High electric zap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.1);

    // Electric crackle with noise
    const noise = this.createNoise(0.12);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 3000;

    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.12);
  }

  /**
   * Shield break sound - dramatic electric burst
   */
  private playShieldBreakSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Descending electric whine
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(3000, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.4);

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc1.connect(gain1);
    gain1.connect(this.masterGain!);

    osc1.start(now);
    osc1.stop(now + 0.4);

    // Burst of noise
    const noise = this.createNoise(0.3);
    const noiseGain = ctx.createGain();

    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.3);

    // Low thud
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(100, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.masterGain!);

    osc2.start(now);
    osc2.stop(now + 0.3);
  }

  /**
   * Explosion sound - deep boom with debris
   */
  private playExplosionSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Deep boom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.5);

    // Debris noise
    const noise = this.createNoise(0.4);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.4);
  }

  /**
   * Pickup/collect boon sound - positive chime
   */
  private playPickupSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Rising arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = now + i * 0.05;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });

    // Sparkle effect
    const noise = this.createNoise(0.15);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 8000;

    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * Start boost engine sound - smooth, pleasant thruster whoosh
   */
  startBoost(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;
    if (this.boostOscillator) return; // Already playing

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Main gain output
    this.boostGain = ctx.createGain();
    this.boostGain.gain.setValueAtTime(0, now);
    this.boostGain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    this.boostGain.connect(this.masterGain);

    // Layer 1: Warm sine bass tone
    this.boostOscillator = ctx.createOscillator();
    this.boostOscillator.type = "sine";
    this.boostOscillator.frequency.value = 65; // Deep, warm hum

    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.4;
    this.boostOscillator.connect(bassGain);
    bassGain.connect(this.boostGain);

    // Layer 2: Smooth triangle wave for body
    this.boostOscillator2 = ctx.createOscillator();
    this.boostOscillator2.type = "triangle";
    this.boostOscillator2.frequency.value = 130; // Octave above for fullness

    const midGain = ctx.createGain();
    midGain.gain.value = 0.25;
    this.boostOscillator2.connect(midGain);
    midGain.connect(this.boostGain);

    // Layer 3: Filtered noise for "whoosh" character
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    this.boostNoiseSource = ctx.createBufferSource();
    this.boostNoiseSource.buffer = noiseBuffer;
    this.boostNoiseSource.loop = true;

    // Bandpass filter for smooth whoosh (not harsh)
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.12;

    this.boostNoiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.boostGain);

    // Gentle LFO for subtle pulsing (makes it feel alive)
    this.boostLfo = ctx.createOscillator();
    this.boostLfo.type = "sine";
    this.boostLfo.frequency.value = 3; // Slow, gentle pulse

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4; // Subtle pitch wobble
    this.boostLfo.connect(lfoGain);
    lfoGain.connect(this.boostOscillator.frequency);
    lfoGain.connect(this.boostOscillator2.frequency);

    // Start all oscillators
    this.boostOscillator.start(now);
    this.boostOscillator2.start(now);
    this.boostNoiseSource.start(now);
    this.boostLfo.start(now);
  }

  /**
   * Stop boost engine sound with smooth fade out
   */
  stopBoost(): void {
    if (this.boostGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      const fadeTime = 0.15;
      
      // Smooth fade out
      this.boostGain.gain.linearRampToValueAtTime(0, now + fadeTime);

      // Stop and cleanup all oscillators
      if (this.boostOscillator) {
        this.boostOscillator.stop(now + fadeTime + 0.05);
        this.boostOscillator = null;
      }
      if (this.boostOscillator2) {
        this.boostOscillator2.stop(now + fadeTime + 0.05);
        this.boostOscillator2 = null;
      }
      if (this.boostNoiseSource) {
        this.boostNoiseSource.stop(now + fadeTime + 0.05);
        this.boostNoiseSource = null;
      }
      if (this.boostLfo) {
        this.boostLfo.stop(now + fadeTime + 0.05);
        this.boostLfo = null;
      }

      this.boostGain = null;
    }
  }

  /**
   * Wall hit sound - metallic impact
   */
  private playWallHitSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Metallic ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.1);

    // Short noise burst
    this.addNoiseBlip(0.05, 0.15);
  }

  /**
   * Wall destroy sound - crumbling
   */
  private playWallDestroySound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Crumbling noise
    const noise = this.createNoise(0.35);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.35);
    filter.Q.value = 2;

    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + 0.35);

    // Low rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Game start sound - energizing fanfare
   */
  private playGameStartSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Rising sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.4);

    // Final power chord
    const notes = [261.63, 329.63, 392]; // C4, E4, G4
    notes.forEach((freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.type = "square";
      o.frequency.value = freq;

      g.gain.setValueAtTime(0, now + 0.3);
      g.gain.linearRampToValueAtTime(0.15, now + 0.35);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      o.connect(g);
      g.connect(this.masterGain!);

      o.start(now + 0.3);
      o.stop(now + 0.7);
    });
  }

  /**
   * Game over sound - descending defeat
   */
  private playGameOverSound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Descending tones
    const notes = [440, 349.23, 293.66, 220]; // A4, F4, D4, A3

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.value = freq;

      const startTime = now + i * 0.15;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });

    // Low rumble at end
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 50;

    gain.gain.setValueAtTime(0, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now + 0.5);
    osc.stop(now + 1.0);
  }

  /**
   * Victory sound - triumphant fanfare
   */
  private playVictorySound(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Triumphant ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.value = freq;

      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });

    // Final triumphant chord
    const chordNotes = [523.25, 659.25, 783.99]; // C5, E5, G5
    chordNotes.forEach((freq) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.type = "square";
      o.frequency.value = freq;

      g.gain.setValueAtTime(0, now + 0.4);
      g.gain.linearRampToValueAtTime(0.2, now + 0.45);
      g.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

      o.connect(g);
      g.connect(this.masterGain!);

      o.start(now + 0.4);
      o.stop(now + 1.0);
    });

    // Sparkle effect
    const noise = this.createNoise(0.6);
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 6000;

    noiseGain.gain.setValueAtTime(0.05, now + 0.4);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noise.start(now + 0.4);
    noise.stop(now + 1.0);
  }

  /**
   * Create white noise source
   */
  private createNoise(duration: number): AudioBufferSourceNode {
    const ctx = this.audioContext!;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    return noise;
  }

  /**
   * Add a quick noise blip
   */
  private addNoiseBlip(duration: number, volume: number): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const noise = this.createNoise(duration);
    const gain = ctx.createGain();

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(gain);
    gain.connect(this.masterGain!);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Toggle sound on/off
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBoost();
    }
    return this.enabled;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBoost();
    }
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopBoost();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

/**
 * Get the global SoundManager instance
 */
export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}
