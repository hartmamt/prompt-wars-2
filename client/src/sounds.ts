/**
 * UI Sound Effects - Procedural sounds using the AudioEngine
 *
 * Button hover: quick high-frequency blip
 * Button click: punchy mid-frequency pop
 * Menu navigation: synthetic whoosh sweep
 * Error: crunchy distorted buzz
 * Success: ascending two-tone chime
 */

import { audioEngine } from './audioEngine';

// Button hover: quick high-frequency blip
export async function playHover(): Promise<void> {
  await audioEngine.play({
    frequency: 2000,
    duration: 0.05,
    volume: 0.15,
    type: 'sine',
    attack: 0.005,
    decay: 0.02,
    sustain: 0.3,
    release: 0.02,
  });
}

// Button click: punchy mid-frequency pop
export async function playClick(): Promise<void> {
  await audioEngine.play({
    frequency: 600,
    duration: 0.1,
    volume: 0.3,
    type: 'square',
    attack: 0.005,
    decay: 0.05,
    sustain: 0.1,
    release: 0.04,
    filterFreq: 1200,
    filterQ: 2,
  });
}

// Menu navigation: synthetic whoosh sweep
export function playNavigate(): void {
  // Create a sweep effect with multiple quick tones
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(300, now);
  oscillator.frequency.exponentialRampToValueAtTime(1500, now + 0.08);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(3000, now + 0.05);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.1);
  filter.Q.setValueAtTime(5, now);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.15);

  oscillator.onended = () => {
    oscillator.disconnect();
    filter.disconnect();
    gainNode.disconnect();
  };
}

// Error: crunchy distorted buzz
export function playError(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Create distorted buzz using waveshaper
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const distortion = ctx.createWaveShaper();

  // Create distortion curve
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * 3);
  }
  distortion.curve = curve;

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(150, now);
  oscillator.frequency.setValueAtTime(130, now + 0.05);
  oscillator.frequency.setValueAtTime(100, now + 0.1);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
  gainNode.gain.setValueAtTime(0.25, now + 0.15);
  gainNode.gain.linearRampToValueAtTime(0, now + 0.25);

  oscillator.connect(distortion);
  distortion.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.3);

  oscillator.onended = () => {
    oscillator.disconnect();
    distortion.disconnect();
    gainNode.disconnect();
  };
}

// Success: ascending two-tone chime
export function playSuccess(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // First tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now); // C5
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.25);

  // Second tone (higher, slight delay)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0, now + 0.08);
  gain2.gain.linearRampToValueAtTime(0.35, now + 0.09);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.4);

  osc1.onended = () => {
    osc1.disconnect();
    gain1.disconnect();
  };

  osc2.onended = () => {
    osc2.disconnect();
    gain2.disconnect();
  };
}

// ===========================================
// Game Phase Sounds (US-024)
// ===========================================

// Countdown tick with pitch drop - plays on each second
export function playCountdownTick(secondsRemaining: number): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Higher pitch at start, drops as time runs out
  // Base pitch from 800Hz down to 200Hz
  const pitchMultiplier = Math.max(0.25, secondsRemaining / 60);
  const basePitch = 200 + 600 * pitchMultiplier;

  // Last 5 seconds: add tension with higher volume and faster decay
  const isTense = secondsRemaining <= 5;
  const volume = isTense ? 0.4 : 0.25;

  osc.type = isTense ? 'square' : 'sine';
  osc.frequency.setValueAtTime(basePitch, now);
  osc.frequency.exponentialRampToValueAtTime(basePitch * 0.7, now + 0.08);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, now + (isTense ? 0.15 : 0.1));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// Phase transition: bass drop with glitch stutter
export function playPhaseTransition(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Bass drop
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = 'sine';
  bassOsc.frequency.setValueAtTime(200, now);
  bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.5, now + 0.02);
  bassGain.gain.linearRampToValueAtTime(0.3, now + 0.15);
  bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  bassOsc.connect(bassGain);
  bassGain.connect(ctx.destination);
  bassOsc.start(now);
  bassOsc.stop(now + 0.5);

  // Glitch stutter - rapid noise bursts
  for (let i = 0; i < 4; i++) {
    const glitchOsc = ctx.createOscillator();
    const glitchGain = ctx.createGain();
    glitchOsc.type = 'sawtooth';
    glitchOsc.frequency.setValueAtTime(100 + Math.random() * 400, now + i * 0.05);
    glitchGain.gain.setValueAtTime(0, now + i * 0.05);
    glitchGain.gain.linearRampToValueAtTime(0.15, now + i * 0.05 + 0.01);
    glitchGain.gain.linearRampToValueAtTime(0, now + i * 0.05 + 0.03);
    glitchOsc.connect(glitchGain);
    glitchGain.connect(ctx.destination);
    glitchOsc.start(now + i * 0.05);
    glitchOsc.stop(now + i * 0.05 + 0.05);

    glitchOsc.onended = () => {
      glitchOsc.disconnect();
      glitchGain.disconnect();
    };
  }

  bassOsc.onended = () => {
    bassOsc.disconnect();
    bassGain.disconnect();
  };
}

// Theme reveal: rapid glitchy 'decrypting' sound
export function playThemeReveal(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Rapid ascending glitchy tones
  for (let i = 0; i < 8; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const startTime = now + i * 0.04;
    const freq = 400 + i * 150 + Math.random() * 100;

    osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, startTime);
    filter.Q.setValueAtTime(5, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.05);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  // Final reveal tone
  const finalOsc = ctx.createOscillator();
  const finalGain = ctx.createGain();
  finalOsc.type = 'sine';
  finalOsc.frequency.setValueAtTime(1200, now + 0.35);
  finalGain.gain.setValueAtTime(0, now + 0.35);
  finalGain.gain.linearRampToValueAtTime(0.3, now + 0.36);
  finalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  finalOsc.connect(finalGain);
  finalGain.connect(ctx.destination);
  finalOsc.start(now + 0.35);
  finalOsc.stop(now + 0.7);

  finalOsc.onended = () => {
    finalOsc.disconnect();
    finalGain.disconnect();
  };
}

// Prompt submitted: mechanical lock-in sound
export function playPromptSubmit(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Mechanical click
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(800, now);
  clickOsc.frequency.setValueAtTime(400, now + 0.02);
  clickGain.gain.setValueAtTime(0, now);
  clickGain.gain.linearRampToValueAtTime(0.3, now + 0.005);
  clickGain.gain.linearRampToValueAtTime(0, now + 0.05);
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start(now);
  clickOsc.stop(now + 0.1);

  // Lock-in thunk
  const thunkOsc = ctx.createOscillator();
  const thunkGain = ctx.createGain();
  thunkOsc.type = 'sine';
  thunkOsc.frequency.setValueAtTime(150, now + 0.03);
  thunkOsc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
  thunkGain.gain.setValueAtTime(0, now + 0.03);
  thunkGain.gain.linearRampToValueAtTime(0.4, now + 0.04);
  thunkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  thunkOsc.connect(thunkGain);
  thunkGain.connect(ctx.destination);
  thunkOsc.start(now + 0.03);
  thunkOsc.stop(now + 0.25);

  clickOsc.onended = () => { clickOsc.disconnect(); clickGain.disconnect(); };
  thunkOsc.onended = () => { thunkOsc.disconnect(); thunkGain.disconnect(); };
}

// Image reveal: heavy impact bass thump
export function playImageReveal(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Heavy bass thump
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = 'sine';
  bassOsc.frequency.setValueAtTime(80, now);
  bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.6, now + 0.01);
  bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  bassOsc.connect(bassGain);
  bassGain.connect(ctx.destination);
  bassOsc.start(now);
  bassOsc.stop(now + 0.4);

  // Impact crack
  const crackOsc = ctx.createOscillator();
  const crackGain = ctx.createGain();
  const crackFilter = ctx.createBiquadFilter();
  crackOsc.type = 'sawtooth';
  crackOsc.frequency.setValueAtTime(500, now);
  crackOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
  crackFilter.type = 'highpass';
  crackFilter.frequency.setValueAtTime(200, now);
  crackGain.gain.setValueAtTime(0, now);
  crackGain.gain.linearRampToValueAtTime(0.25, now + 0.005);
  crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
  crackOsc.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(ctx.destination);
  crackOsc.start(now);
  crackOsc.stop(now + 0.1);

  bassOsc.onended = () => { bassOsc.disconnect(); bassGain.disconnect(); };
  crackOsc.onended = () => { crackOsc.disconnect(); crackFilter.disconnect(); crackGain.disconnect(); };
}

// VS sting: fighting game flourish
export function playVsSting(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Dramatic chord (minor 7th)
  const freqs = [220, 261.63, 329.63, 415.30]; // A3, C4, E4, G#4

  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  });

  // Impact hit
  const impactOsc = ctx.createOscillator();
  const impactGain = ctx.createGain();
  impactOsc.type = 'square';
  impactOsc.frequency.setValueAtTime(100, now);
  impactOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
  impactGain.gain.setValueAtTime(0, now);
  impactGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
  impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  impactOsc.connect(impactGain);
  impactGain.connect(ctx.destination);
  impactOsc.start(now);
  impactOsc.stop(now + 0.2);

  impactOsc.onended = () => { impactOsc.disconnect(); impactGain.disconnect(); };
}

// Vote cast: chunky confirmation
export function playVoteCast(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Chunky blip
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'square';
  osc1.frequency.setValueAtTime(400, now);
  osc1.frequency.setValueAtTime(600, now + 0.05);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.Q.setValueAtTime(3, now);

  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.35, now + 0.01);
  gain1.gain.setValueAtTime(0.35, now + 0.04);
  gain1.gain.linearRampToValueAtTime(0.25, now + 0.06);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  osc1.connect(filter);
  filter.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.2);

  osc1.onended = () => {
    osc1.disconnect();
    filter.disconnect();
    gain1.disconnect();
  };
}

// ===========================================
// Results & Ambience Sounds (US-025)
// ===========================================

// Score tick up: rapid ascending blips (call multiple times for animation)
export function playScoreTick(index: number, total: number): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Pitch rises through the sequence
  const progress = index / Math.max(total, 1);
  const freq = 400 + progress * 800; // 400Hz to 1200Hz

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// Round win: triumphant synth fanfare
export function playRoundWin(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Triumphant fanfare chord progression: C major -> G major
  const chords = [
    { notes: [523.25, 659.25, 783.99], time: 0 },      // C5, E5, G5 (C major)
    { notes: [783.99, 987.77, 1174.66], time: 0.25 },  // G5, B5, D6 (G major)
  ];

  chords.forEach(chord => {
    chord.notes.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + chord.time);

      gain.gain.setValueAtTime(0, now + chord.time);
      gain.gain.linearRampToValueAtTime(0.12, now + chord.time + 0.02);
      gain.gain.setValueAtTime(0.12, now + chord.time + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + chord.time + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + chord.time);
      osc.stop(now + chord.time + 0.4);

      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    });
  });

  // Cymbal-like shimmer
  const shimmerOsc = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmerOsc.type = 'sawtooth';
  shimmerOsc.frequency.setValueAtTime(2000, now);
  shimmerOsc.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
  shimmerGain.gain.setValueAtTime(0, now);
  shimmerGain.gain.linearRampToValueAtTime(0.1, now + 0.01);
  shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  shimmerOsc.connect(shimmerGain);
  shimmerGain.connect(ctx.destination);
  shimmerOsc.start(now);
  shimmerOsc.stop(now + 0.6);

  shimmerOsc.onended = () => { shimmerOsc.disconnect(); shimmerGain.disconnect(); };
}

// Round lose: comedic descending tones
export function playRoundLose(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Sad descending trombone-like sound
  const tones = [400, 350, 300, 200]; // Descending pitches

  tones.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const startTime = now + i * 0.12;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);
    // Slight pitch bend down for comedic effect
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, startTime + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain.gain.setValueAtTime(0.25, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.2);

    osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
  });
}

// Final victory: extended celebration sequence
export function playFinalVictory(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Epic fanfare: ascending arpeggios building to chord
  const arpeggioNotes = [
    { freq: 261.63, time: 0 },      // C4
    { freq: 329.63, time: 0.08 },   // E4
    { freq: 392.00, time: 0.16 },   // G4
    { freq: 523.25, time: 0.24 },   // C5
    { freq: 659.25, time: 0.32 },   // E5
    { freq: 783.99, time: 0.40 },   // G5
  ];

  arpeggioNotes.forEach(note => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    gain.gain.setValueAtTime(0, now + note.time);
    gain.gain.linearRampToValueAtTime(0.2, now + note.time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.05, now + note.time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + note.time);
    osc.stop(now + 1.0);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  });

  // Final triumphant chord at 0.5s
  const finalChord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  finalChord.forEach(freq => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + 0.5);

    gain.gain.setValueAtTime(0, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.52);
    gain.gain.setValueAtTime(0.15, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + 0.5);
    osc.stop(now + 1.6);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  });

  // Victory shimmer/sparkle
  for (let i = 0; i < 6; i++) {
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();

    const sparkleTime = now + 0.6 + i * 0.1;
    const sparkleFreq = 2000 + Math.random() * 2000;

    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(sparkleFreq, sparkleTime);

    sparkleGain.gain.setValueAtTime(0, sparkleTime);
    sparkleGain.gain.linearRampToValueAtTime(0.08, sparkleTime + 0.01);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, sparkleTime + 0.15);

    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);

    sparkleOsc.start(sparkleTime);
    sparkleOsc.stop(sparkleTime + 0.2);

    sparkleOsc.onended = () => { sparkleOsc.disconnect(); sparkleGain.disconnect(); };
  }
}

// AI processing ambience: low drone with glitch pops
// Returns stop function to end the ambience
let processingAmbienceInterval: number | null = null;
let processingOscillators: OscillatorNode[] = [];
let processingGains: GainNode[] = [];

export function startProcessingAmbience(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  stopProcessingAmbience(); // Clean up any existing

  const now = ctx.currentTime;

  // Low drone
  const droneOsc = ctx.createOscillator();
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();

  droneOsc.type = 'sawtooth';
  droneOsc.frequency.setValueAtTime(50, now);

  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(100, now);
  droneFilter.Q.setValueAtTime(5, now);

  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.08, now + 0.5);

  droneOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(ctx.destination);

  droneOsc.start(now);
  processingOscillators.push(droneOsc);
  processingGains.push(droneGain);

  // Periodic glitch pops
  processingAmbienceInterval = window.setInterval(() => {
    if (audioEngine.getMuted()) return;
    const popCtx = (audioEngine as unknown as { context: AudioContext | null }).context;
    if (!popCtx) return;

    const popNow = popCtx.currentTime;
    const popOsc = popCtx.createOscillator();
    const popGain = popCtx.createGain();

    popOsc.type = 'square';
    popOsc.frequency.setValueAtTime(100 + Math.random() * 300, popNow);

    popGain.gain.setValueAtTime(0, popNow);
    popGain.gain.linearRampToValueAtTime(0.1, popNow + 0.005);
    popGain.gain.linearRampToValueAtTime(0, popNow + 0.02);

    popOsc.connect(popGain);
    popGain.connect(popCtx.destination);

    popOsc.start(popNow);
    popOsc.stop(popNow + 0.05);

    popOsc.onended = () => { popOsc.disconnect(); popGain.disconnect(); };
  }, 300 + Math.random() * 400);
}

export function stopProcessingAmbience(): void {
  if (processingAmbienceInterval !== null) {
    clearInterval(processingAmbienceInterval);
    processingAmbienceInterval = null;
  }

  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (ctx) {
    const now = ctx.currentTime;
    processingGains.forEach(gain => {
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
    });
    setTimeout(() => {
      processingOscillators.forEach(osc => {
        try { osc.stop(); } catch { /* already stopped */ }
        osc.disconnect();
      });
      processingGains.forEach(gain => gain.disconnect());
      processingOscillators = [];
      processingGains = [];
    }, 400);
  } else {
    processingOscillators = [];
    processingGains = [];
  }
}

// Lobby ambience: subtle synthetic hum
let lobbyAmbienceOsc: OscillatorNode | null = null;
let lobbyAmbienceGain: GainNode | null = null;

export function startLobbyAmbience(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  stopLobbyAmbience(); // Clean up any existing

  const now = ctx.currentTime;

  // Subtle synthetic hum with slight modulation
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // LFO for subtle modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.3, now); // Very slow modulation
  lfoGain.gain.setValueAtTime(3, now); // Subtle pitch variation

  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, now);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 1);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  lfo.start(now);

  lobbyAmbienceOsc = osc;
  lobbyAmbienceGain = gain;
}

export function stopLobbyAmbience(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx) {
    lobbyAmbienceOsc = null;
    lobbyAmbienceGain = null;
    return;
  }

  if (lobbyAmbienceGain) {
    const now = ctx.currentTime;
    lobbyAmbienceGain.gain.linearRampToValueAtTime(0, now + 0.5);

    const oscRef = lobbyAmbienceOsc;
    const gainRef = lobbyAmbienceGain;

    setTimeout(() => {
      if (oscRef) {
        try { oscRef.stop(); } catch { /* already stopped */ }
        oscRef.disconnect();
      }
      if (gainRef) {
        gainRef.disconnect();
      }
    }, 600);
  }

  lobbyAmbienceOsc = null;
  lobbyAmbienceGain = null;
}

// ===========================================
// Chaos Mode Audio (US-035)
// ===========================================

// Sabotage menu open: ominous whoosh
export function playSabotageMenuOpen(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Ominous reverse sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(50, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
  filter.frequency.exponentialRampToValueAtTime(600, now + 0.35);
  filter.Q.setValueAtTime(5, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);

  osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
}

// Target selected: lock-on sound
export function playTargetLockOn(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Rapid beeps converging (lock-on)
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = now + i * 0.06;
    const freq = 800 + (4 - i) * 100; // Descending then converging

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.05);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  // Final lock tone
  const lockOsc = ctx.createOscillator();
  const lockGain = ctx.createGain();

  lockOsc.type = 'sine';
  lockOsc.frequency.setValueAtTime(1200, now + 0.25);

  lockGain.gain.setValueAtTime(0, now + 0.25);
  lockGain.gain.linearRampToValueAtTime(0.3, now + 0.26);
  lockGain.gain.setValueAtTime(0.3, now + 0.35);
  lockGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

  lockOsc.connect(lockGain);
  lockGain.connect(ctx.destination);

  lockOsc.start(now + 0.25);
  lockOsc.stop(now + 0.55);

  lockOsc.onended = () => { lockOsc.disconnect(); lockGain.disconnect(); };
}

// Sabotage confirmed: evil confirm sound
export function playSabotageConfirmed(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Dark descending chord
  const freqs = [350, 233, 175]; // Diminished chord
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();

    // Distortion curve
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let j = 0; j < samples; j++) {
      const x = (j * 2) / samples - 1;
      curve[j] = Math.tanh(x * 2);
    }
    distortion.curve = curve;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.03);
    osc.stop(now + 0.4);

    osc.onended = () => { osc.disconnect(); distortion.disconnect(); gain.disconnect(); };
  });

  // Evil laugh-like glitch
  const laughOsc = ctx.createOscillator();
  const laughGain = ctx.createGain();
  laughOsc.type = 'square';
  laughOsc.frequency.setValueAtTime(300, now + 0.15);
  laughOsc.frequency.setValueAtTime(250, now + 0.2);
  laughOsc.frequency.setValueAtTime(200, now + 0.25);
  laughGain.gain.setValueAtTime(0, now + 0.15);
  laughGain.gain.linearRampToValueAtTime(0.1, now + 0.16);
  laughGain.gain.setValueAtTime(0.08, now + 0.2);
  laughGain.gain.setValueAtTime(0.06, now + 0.25);
  laughGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  laughOsc.connect(laughGain);
  laughGain.connect(ctx.destination);
  laughOsc.start(now + 0.15);
  laughOsc.stop(now + 0.4);

  laughOsc.onended = () => { laughOsc.disconnect(); laughGain.disconnect(); };
}

// Incoming sabotage warning: alarm glitch
export function playIncomingSabotage(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Alarm-like oscillating tone with glitch
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = now + i * 0.15;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, startTime);
    osc.frequency.setValueAtTime(400, startTime + 0.07);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
    gain.gain.setValueAtTime(0.3, startTime + 0.06);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.08);
    gain.gain.setValueAtTime(0.2, startTime + 0.12);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.15);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  // Glitch burst
  for (let i = 0; i < 5; i++) {
    const glitchOsc = ctx.createOscillator();
    const glitchGain = ctx.createGain();

    const startTime = now + 0.1 + Math.random() * 0.3;

    glitchOsc.type = 'square';
    glitchOsc.frequency.setValueAtTime(200 + Math.random() * 800, startTime);

    glitchGain.gain.setValueAtTime(0, startTime);
    glitchGain.gain.linearRampToValueAtTime(0.15, startTime + 0.005);
    glitchGain.gain.linearRampToValueAtTime(0, startTime + 0.02);

    glitchOsc.connect(glitchGain);
    glitchGain.connect(ctx.destination);

    glitchOsc.start(startTime);
    glitchOsc.stop(startTime + 0.03);

    glitchOsc.onended = () => { glitchOsc.disconnect(); glitchGain.disconnect(); };
  }
}

// Modifier reveal: corruption sound
export function playModifierReveal(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Glitchy data corruption sound
  for (let i = 0; i < 10; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = now + i * 0.03;
    const freq = 200 + Math.random() * 1000;

    osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * (0.5 + Math.random()), startTime + 0.02);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.005);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.03);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  // Final corrupted tone
  const finalOsc = ctx.createOscillator();
  const finalGain = ctx.createGain();
  const distortion = ctx.createWaveShaper();

  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * 4);
  }
  distortion.curve = curve;

  finalOsc.type = 'sawtooth';
  finalOsc.frequency.setValueAtTime(300, now + 0.3);
  finalOsc.frequency.exponentialRampToValueAtTime(150, now + 0.5);

  finalGain.gain.setValueAtTime(0, now + 0.3);
  finalGain.gain.linearRampToValueAtTime(0.2, now + 0.32);
  finalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

  finalOsc.connect(distortion);
  distortion.connect(finalGain);
  finalGain.connect(ctx.destination);

  finalOsc.start(now + 0.3);
  finalOsc.stop(now + 0.6);

  finalOsc.onended = () => { finalOsc.disconnect(); distortion.disconnect(); finalGain.disconnect(); };
}

// Tokens earned: coin sound
export function playTokensEarned(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Classic coin collect sound
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, now); // B5
  osc1.frequency.setValueAtTime(1318.51, now + 0.05); // E6

  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.25, now + 0.01);
  gain1.gain.setValueAtTime(0.25, now + 0.04);
  gain1.gain.linearRampToValueAtTime(0.2, now + 0.06);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.3);

  osc1.onended = () => { osc1.disconnect(); gain1.disconnect(); };

  // Shimmer overtone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(2637.02, now + 0.05); // E7

  gain2.gain.setValueAtTime(0, now + 0.05);
  gain2.gain.linearRampToValueAtTime(0.1, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now + 0.05);
  osc2.stop(now + 0.25);

  osc2.onended = () => { osc2.disconnect(); gain2.disconnect(); };
}

// Tokens spent: slot machine sound
export function playTokensSpent(): void {
  const ctx = (audioEngine as unknown as { context: AudioContext | null }).context;
  if (!ctx || audioEngine.getMuted()) return;

  const now = ctx.currentTime;

  // Slot machine reel stop sound
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = now + i * 0.08;

    osc.type = 'square';
    osc.frequency.setValueAtTime(300 - i * 30, startTime);
    osc.frequency.exponentialRampToValueAtTime(150 - i * 20, startTime + 0.05);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.08);

    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  // Mechanical click at the end
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();

  clickOsc.type = 'square';
  clickOsc.frequency.setValueAtTime(100, now + 0.25);
  clickOsc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

  clickGain.gain.setValueAtTime(0, now + 0.25);
  clickGain.gain.linearRampToValueAtTime(0.25, now + 0.255);
  clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);

  clickOsc.start(now + 0.25);
  clickOsc.stop(now + 0.35);

  clickOsc.onended = () => { clickOsc.disconnect(); clickGain.disconnect(); };
}
