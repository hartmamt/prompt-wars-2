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
