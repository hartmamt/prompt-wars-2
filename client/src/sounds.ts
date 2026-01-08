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
