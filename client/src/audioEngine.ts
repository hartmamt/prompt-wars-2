/**
 * AudioEngine - Web Audio API wrapper for procedural sound generation
 *
 * Provides:
 * - One-shot sounds via play()
 * - Looping sounds via startLoop()/stopLoop()
 * - Global mute toggle
 * - Parameter randomization for organic feel
 * - Automatic node cleanup to prevent memory leaks
 * - Graceful fallback when Web Audio API unavailable
 */

export interface SoundParams {
  frequency?: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  filterFreq?: number;
  filterQ?: number;
}

interface ActiveLoop {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
}

type SoundDefinition = () => void;

class AudioEngine {
  private context: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private activeLoops: Map<string, ActiveLoop> = new Map();
  private soundDefinitions: Map<string, SoundDefinition> = new Map();

  /**
   * Check if Web Audio API is available
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' &&
           (typeof AudioContext !== 'undefined' ||
            typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined');
  }

  /**
   * Initialize the audio context - must be called from user interaction
   */
  async init(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!this.isAvailable()) {
      console.warn('Web Audio API not available');
      return false;
    }

    try {
      const AudioContextClass = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        return false;
      }

      this.context = new AudioContextClass();

      // Resume if suspended (common in browsers)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      return false;
    }
  }

  /**
   * Ensure context is ready (resume if suspended)
   */
  private async ensureReady(): Promise<boolean> {
    if (!this.context) {
      return false;
    }

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch {
        return false;
      }
    }

    return this.context.state === 'running';
  }

  /**
   * Get muted state
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Toggle mute state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;

    // Stop all active loops when muting
    if (muted) {
      this.stopAllLoops();
    }
  }

  /**
   * Toggle mute and return new state
   */
  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Randomize a value within a percentage range
   */
  private randomize(value: number, variance: number = 0.1): number {
    const factor = 1 + (Math.random() * 2 - 1) * variance;
    return value * factor;
  }

  /**
   * Play a one-shot sound
   */
  async play(params: SoundParams): Promise<void> {
    if (this.isMuted || !await this.ensureReady() || !this.context) {
      return;
    }

    const ctx = this.context;
    const now = ctx.currentTime;

    // Apply randomization for organic feel
    const freq = this.randomize(params.frequency ?? 440, 0.02);
    const duration = params.duration ?? 0.2;
    const volume = Math.min(params.volume ?? 0.5, 1);
    const type = params.type ?? 'sine';
    const attack = params.attack ?? 0.01;
    const decay = params.decay ?? 0.1;
    const sustain = params.sustain ?? 0.3;
    const release = params.release ?? 0.1;

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now);

    // Create gain node for envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);

    // ADSR envelope
    gainNode.gain.linearRampToValueAtTime(volume, now + attack);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(volume * sustain, now + duration - release);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    // Optional filter
    let filterNode: BiquadFilterNode | null = null;
    if (params.filterFreq) {
      filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(params.filterFreq, now);
      filterNode.Q.setValueAtTime(params.filterQ ?? 1, now);
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }

    gainNode.connect(ctx.destination);

    // Start and schedule cleanup
    oscillator.start(now);
    oscillator.stop(now + duration + 0.1);

    // Cleanup after sound completes
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
      if (filterNode) {
        filterNode.disconnect();
      }
    };
  }

  /**
   * Register a named sound definition for easy playback
   */
  registerSound(name: string, definition: SoundDefinition): void {
    this.soundDefinitions.set(name, definition);
  }

  /**
   * Play a registered sound by name
   */
  playSound(name: string): void {
    const definition = this.soundDefinitions.get(name);
    if (definition) {
      definition();
    }
  }

  /**
   * Start a looping sound
   */
  async startLoop(id: string, params: SoundParams): Promise<void> {
    if (this.isMuted || !await this.ensureReady() || !this.context) {
      return;
    }

    // Stop existing loop with same id
    this.stopLoop(id);

    const ctx = this.context;

    const freq = this.randomize(params.frequency ?? 440, 0.02);
    const volume = Math.min(params.volume ?? 0.3, 1);
    const type = params.type ?? 'sine';

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    // Create gain node
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    // Optional filter
    let filterNode: BiquadFilterNode | undefined;
    if (params.filterFreq) {
      filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(params.filterFreq, ctx.currentTime);
      filterNode.Q.setValueAtTime(params.filterQ ?? 1, ctx.currentTime);
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }

    gainNode.connect(ctx.destination);
    oscillator.start();

    this.activeLoops.set(id, { oscillator, gainNode, filterNode });
  }

  /**
   * Stop a specific loop
   */
  stopLoop(id: string): void {
    const loop = this.activeLoops.get(id);
    if (loop) {
      try {
        loop.oscillator.stop();
        loop.oscillator.disconnect();
        loop.gainNode.disconnect();
        if (loop.filterNode) {
          loop.filterNode.disconnect();
        }
      } catch {
        // Node may already be stopped
      }
      this.activeLoops.delete(id);
    }
  }

  /**
   * Stop all active loops
   */
  stopAllLoops(): void {
    for (const id of this.activeLoops.keys()) {
      this.stopLoop(id);
    }
  }

  /**
   * Cleanup and dispose of the audio engine
   */
  dispose(): void {
    this.stopAllLoops();
    if (this.context) {
      this.context.close().catch(() => {
        // Ignore close errors
      });
      this.context = null;
    }
    this.isInitialized = false;
    this.soundDefinitions.clear();
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
