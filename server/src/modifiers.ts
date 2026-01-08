/**
 * Chaos Mode - Cosmic Modifiers
 *
 * Random modifiers applied to player prompts during chaos mode.
 * Organized by category and intensity level.
 */

export type ModifierCategory = 'style' | 'context' | 'chaos' | 'vibe';
export type ModifierIntensity = 'light' | 'medium' | 'maximum';

export interface Modifier {
  id: string;
  text: string;
  category: ModifierCategory;
  intensity: ModifierIntensity;
}

// Style Modifiers - Affect visual presentation
const STYLE_MODIFIERS: Modifier[] = [
  // Light
  { id: 's-1', text: 'in the style of a Renaissance painting', category: 'style', intensity: 'light' },
  { id: 's-2', text: 'as a watercolor illustration', category: 'style', intensity: 'light' },
  { id: 's-3', text: 'in a minimalist style', category: 'style', intensity: 'light' },
  { id: 's-4', text: 'as pixel art', category: 'style', intensity: 'light' },
  { id: 's-5', text: 'in a comic book style', category: 'style', intensity: 'light' },
  { id: 's-6', text: 'as an oil painting', category: 'style', intensity: 'light' },
  { id: 's-7', text: 'in Japanese anime style', category: 'style', intensity: 'light' },
  { id: 's-8', text: 'as a vintage photograph', category: 'style', intensity: 'light' },
  { id: 's-9', text: 'in art nouveau style', category: 'style', intensity: 'light' },
  { id: 's-10', text: 'as a charcoal sketch', category: 'style', intensity: 'light' },
  // Medium
  { id: 's-11', text: 'in the style of a fever dream', category: 'style', intensity: 'medium' },
  { id: 's-12', text: 'as a glitched digital artwork', category: 'style', intensity: 'medium' },
  { id: 's-13', text: 'in psychedelic 60s poster style', category: 'style', intensity: 'medium' },
  { id: 's-14', text: 'as a Soviet propaganda poster', category: 'style', intensity: 'medium' },
  { id: 's-15', text: 'in Wes Anderson color palette', category: 'style', intensity: 'medium' },
  { id: 's-16', text: 'as a medieval illuminated manuscript', category: 'style', intensity: 'medium' },
  { id: 's-17', text: 'in the style of a ransom note collage', category: 'style', intensity: 'medium' },
  { id: 's-18', text: 'as corporate clip art from 1998', category: 'style', intensity: 'medium' },
  { id: 's-19', text: 'in vaporwave aesthetic', category: 'style', intensity: 'medium' },
  { id: 's-20', text: 'as a Tim Burton character design', category: 'style', intensity: 'medium' },
  // Maximum
  { id: 's-21', text: 'made entirely of cheese', category: 'style', intensity: 'maximum' },
  { id: 's-22', text: 'as viewed through a kaleidoscope on fire', category: 'style', intensity: 'maximum' },
  { id: 's-23', text: 'if it was a cursed image that went viral', category: 'style', intensity: 'maximum' },
  { id: 's-24', text: 'in the style of a corporate motivational poster having an existential crisis', category: 'style', intensity: 'maximum' },
  { id: 's-25', text: 'as an AI that has become too powerful renders it', category: 'style', intensity: 'maximum' },
];

// Context Modifiers - Change the setting/scenario
const CONTEXT_MODIFIERS: Modifier[] = [
  // Light
  { id: 'c-1', text: 'at a fancy dinner party', category: 'context', intensity: 'light' },
  { id: 'c-2', text: 'during a thunderstorm', category: 'context', intensity: 'light' },
  { id: 'c-3', text: 'in outer space', category: 'context', intensity: 'light' },
  { id: 'c-4', text: 'underwater', category: 'context', intensity: 'light' },
  { id: 'c-5', text: 'in a cozy cottage', category: 'context', intensity: 'light' },
  { id: 'c-6', text: 'at sunset on a beach', category: 'context', intensity: 'light' },
  { id: 'c-7', text: 'in a neon-lit city', category: 'context', intensity: 'light' },
  { id: 'c-8', text: 'in an enchanted forest', category: 'context', intensity: 'light' },
  { id: 'c-9', text: 'in ancient Rome', category: 'context', intensity: 'light' },
  { id: 'c-10', text: 'at a music festival', category: 'context', intensity: 'light' },
  // Medium
  { id: 'c-11', text: 'in a parallel dimension where gravity works sideways', category: 'context', intensity: 'medium' },
  { id: 'c-12', text: 'during the robot uprising of 2087', category: 'context', intensity: 'medium' },
  { id: 'c-13', text: 'inside a giant snow globe being shaken violently', category: 'context', intensity: 'medium' },
  { id: 'c-14', text: 'at a business meeting that has gone horribly wrong', category: 'context', intensity: 'medium' },
  { id: 'c-15', text: 'in a world where everyone is very small', category: 'context', intensity: 'medium' },
  { id: 'c-16', text: 'during a wizard convention', category: 'context', intensity: 'medium' },
  { id: 'c-17', text: 'in the waiting room of an interdimensional DMV', category: 'context', intensity: 'medium' },
  { id: 'c-18', text: 'at the worlds most chaotic potluck', category: 'context', intensity: 'medium' },
  { id: 'c-19', text: 'inside a video game that is glitching out', category: 'context', intensity: 'medium' },
  { id: 'c-20', text: 'during the last 5 minutes before the apocalypse', category: 'context', intensity: 'medium' },
  // Maximum
  { id: 'c-21', text: 'in a reality TV show hosted by a very confused octopus', category: 'context', intensity: 'maximum' },
  { id: 'c-22', text: 'inside the mind of someone who just ate questionable sushi', category: 'context', intensity: 'maximum' },
  { id: 'c-23', text: 'at a family reunion where everyone is secretly plotting', category: 'context', intensity: 'maximum' },
  { id: 'c-24', text: 'in a universe where the laws of physics are merely suggestions', category: 'context', intensity: 'maximum' },
  { id: 'c-25', text: 'during a heist but everyone forgot what they were stealing', category: 'context', intensity: 'maximum' },
];

// Chaos Modifiers - Pure randomness
const CHAOS_MODIFIERS: Modifier[] = [
  // Light
  { id: 'ch-1', text: 'but something seems slightly off', category: 'chaos', intensity: 'light' },
  { id: 'ch-2', text: 'with an unexpected guest', category: 'chaos', intensity: 'light' },
  { id: 'ch-3', text: 'at an awkward angle', category: 'chaos', intensity: 'light' },
  { id: 'ch-4', text: 'with dramatic lighting', category: 'chaos', intensity: 'light' },
  { id: 'ch-5', text: 'but tiny', category: 'chaos', intensity: 'light' },
  { id: 'ch-6', text: 'but huge', category: 'chaos', intensity: 'light' },
  { id: 'ch-7', text: 'with googly eyes', category: 'chaos', intensity: 'light' },
  { id: 'ch-8', text: 'wearing a tiny hat', category: 'chaos', intensity: 'light' },
  { id: 'ch-9', text: 'looking suspicious', category: 'chaos', intensity: 'light' },
  { id: 'ch-10', text: 'in slow motion', category: 'chaos', intensity: 'light' },
  // Medium
  { id: 'ch-11', text: 'but everything is on fire (cosmetically)', category: 'chaos', intensity: 'medium' },
  { id: 'ch-12', text: 'with way too many of the same thing', category: 'chaos', intensity: 'medium' },
  { id: 'ch-13', text: 'but everyone is dressed formally for no reason', category: 'chaos', intensity: 'medium' },
  { id: 'ch-14', text: 'with an inexplicable banana present', category: 'chaos', intensity: 'medium' },
  { id: 'ch-15', text: 'mid-sneeze', category: 'chaos', intensity: 'medium' },
  { id: 'ch-16', text: 'but everyone is a cat', category: 'chaos', intensity: 'medium' },
  { id: 'ch-17', text: 'with dramatic wind effects', category: 'chaos', intensity: 'medium' },
  { id: 'ch-18', text: 'photobombed by a confused tourist', category: 'chaos', intensity: 'medium' },
  { id: 'ch-19', text: 'with lens flare everywhere', category: 'chaos', intensity: 'medium' },
  { id: 'ch-20', text: 'but the proportions are all wrong', category: 'chaos', intensity: 'medium' },
  // Maximum
  { id: 'ch-21', text: 'but its secretly a cake', category: 'chaos', intensity: 'maximum' },
  { id: 'ch-22', text: 'combined with a completely unrelated thing', category: 'chaos', intensity: 'maximum' },
  { id: 'ch-23', text: 'but the laws of physics have taken a vacation', category: 'chaos', intensity: 'maximum' },
  { id: 'ch-24', text: 'if it had to testify in court', category: 'chaos', intensity: 'maximum' },
  { id: 'ch-25', text: 'but everything that could go wrong has gone wrong', category: 'chaos', intensity: 'maximum' },
];

// Vibe Modifiers - Emotional/tonal shifts
const VIBE_MODIFIERS: Modifier[] = [
  // Light
  { id: 'v-1', text: 'but cozy', category: 'vibe', intensity: 'light' },
  { id: 'v-2', text: 'but mysterious', category: 'vibe', intensity: 'light' },
  { id: 'v-3', text: 'but heroic', category: 'vibe', intensity: 'light' },
  { id: 'v-4', text: 'but serene', category: 'vibe', intensity: 'light' },
  { id: 'v-5', text: 'but ominous', category: 'vibe', intensity: 'light' },
  { id: 'v-6', text: 'but whimsical', category: 'vibe', intensity: 'light' },
  { id: 'v-7', text: 'but romantic', category: 'vibe', intensity: 'light' },
  { id: 'v-8', text: 'but nostalgic', category: 'vibe', intensity: 'light' },
  { id: 'v-9', text: 'but ethereal', category: 'vibe', intensity: 'light' },
  { id: 'v-10', text: 'but triumphant', category: 'vibe', intensity: 'light' },
  // Medium
  { id: 'v-11', text: 'but with big villain energy', category: 'vibe', intensity: 'medium' },
  { id: 'v-12', text: 'but inexplicably melancholy', category: 'vibe', intensity: 'medium' },
  { id: 'v-13', text: 'but radiating chaotic energy', category: 'vibe', intensity: 'medium' },
  { id: 'v-14', text: 'but giving main character vibes', category: 'vibe', intensity: 'medium' },
  { id: 'v-15', text: 'but aggressively wholesome', category: 'vibe', intensity: 'medium' },
  { id: 'v-16', text: 'but with ominous foreshadowing', category: 'vibe', intensity: 'medium' },
  { id: 'v-17', text: 'but uncomfortably intense', category: 'vibe', intensity: 'medium' },
  { id: 'v-18', text: 'but peak millennial humor', category: 'vibe', intensity: 'medium' },
  { id: 'v-19', text: 'but radiating imposter syndrome', category: 'vibe', intensity: 'medium' },
  { id: 'v-20', text: 'but with dad joke energy', category: 'vibe', intensity: 'medium' },
  // Maximum
  { id: 'v-21', text: 'but with unhinged optimism', category: 'vibe', intensity: 'maximum' },
  { id: 'v-22', text: 'but its 3am and nothing makes sense anymore', category: 'vibe', intensity: 'maximum' },
  { id: 'v-23', text: 'but everyone is having an existential crisis', category: 'vibe', intensity: 'maximum' },
  { id: 'v-24', text: 'but with the energy of a group project where only one person did the work', category: 'vibe', intensity: 'maximum' },
  { id: 'v-25', text: 'but with the confidence of someone who has no idea what they are doing', category: 'vibe', intensity: 'maximum' },
];

export const ALL_MODIFIERS: Modifier[] = [
  ...STYLE_MODIFIERS,
  ...CONTEXT_MODIFIERS,
  ...CHAOS_MODIFIERS,
  ...VIBE_MODIFIERS,
];

/**
 * Get the intensity level based on round number
 */
export function getIntensityForRound(round: number): ModifierIntensity {
  if (round <= 2) return 'light';
  if (round <= 4) return 'medium';
  return 'maximum';
}

/**
 * Get a random modifier for the given round
 */
export function getRandomModifier(round: number, excludeIds?: Set<string>): Modifier {
  const intensity = getIntensityForRound(round);

  // Filter modifiers by intensity (include lower intensities too for variety)
  const availableModifiers = ALL_MODIFIERS.filter(m => {
    // Allow current intensity and all lower intensities
    if (intensity === 'maximum') return true; // All intensities allowed
    if (intensity === 'medium') return m.intensity === 'light' || m.intensity === 'medium';
    return m.intensity === 'light';
  }).filter(m => !excludeIds?.has(m.id));

  // Weighted towards the current intensity
  const weightedModifiers = availableModifiers.flatMap(m => {
    if (m.intensity === intensity) return [m, m, m]; // 3x weight for current intensity
    return [m]; // 1x weight for lower intensities
  });

  if (weightedModifiers.length === 0) {
    // Fallback if all are excluded
    return ALL_MODIFIERS[Math.floor(Math.random() * ALL_MODIFIERS.length)]!;
  }

  return weightedModifiers[Math.floor(Math.random() * weightedModifiers.length)]!;
}

/**
 * Apply a modifier to a prompt
 */
export function applyModifier(originalPrompt: string, modifier: Modifier): string {
  // Handle modifiers that start with "but" or similar connectors
  const text = modifier.text;
  if (text.startsWith('but ') || text.startsWith('with ') || text.startsWith('combined ')) {
    return `${originalPrompt}, ${text}`;
  }
  // Handle style modifiers
  if (text.startsWith('in ') || text.startsWith('as ') || text.startsWith('made ')) {
    return `${originalPrompt}, ${text}`;
  }
  // Handle context modifiers
  if (text.startsWith('at ') || text.startsWith('during ') || text.startsWith('inside ') || text.startsWith('underwater') || text.startsWith('in ')) {
    return `${originalPrompt}, ${text}`;
  }
  // Handle modifiers that need "if it" prefix
  if (text.startsWith('if ')) {
    return `${originalPrompt}, ${text}`;
  }
  // Default: append with comma
  return `${originalPrompt}, ${text}`;
}
