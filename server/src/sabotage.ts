/**
 * Sabotage System - Multiple Sabotage Types
 *
 * Players can spend tokens to sabotage opponents with various effects.
 */

// Sabotage types and their costs
export type SabotageType = 'word_injection' | 'style_override' | 'photobomb' | 'prompt_swap' | 'mystery_box';

export const SABOTAGE_COSTS: Record<SabotageType, number> = {
  word_injection: 2,
  style_override: 3,
  photobomb: 2,
  prompt_swap: 4,
  mystery_box: 1,
};

export const SABOTAGE_TYPE_LABELS: Record<SabotageType, string> = {
  word_injection: 'Word Injection',
  style_override: 'Style Override',
  photobomb: 'Photobomb',
  prompt_swap: 'Prompt Swap',
  mystery_box: 'Mystery Box',
};

export const SABOTAGE_TYPE_DESCRIPTIONS: Record<SabotageType, string> = {
  word_injection: 'Inject a random silly phrase into their prompt',
  style_override: 'Replace their art style with something ridiculous',
  photobomb: 'Your avatar appears in their image',
  prompt_swap: 'Exchange prompts with your target',
  mystery_box: 'Random effect (weighted toward cheaper options)',
};

// Maximum sabotages per player per game
export const MAX_SABOTAGES_PER_PLAYER_PER_GAME = 2;

export interface SabotageInjection {
  id: string;
  text: string;
  category: 'appearance' | 'object' | 'setting' | 'action' | 'style';
}

export const SABOTAGE_INJECTIONS: SabotageInjection[] = [
  // Appearance (clothing, accessories, physical)
  { id: 'inj-1', text: 'wearing crocs', category: 'appearance' },
  { id: 'inj-2', text: 'with a mullet', category: 'appearance' },
  { id: 'inj-3', text: 'in a banana costume', category: 'appearance' },
  { id: 'inj-4', text: 'wearing socks with sandals', category: 'appearance' },
  { id: 'inj-5', text: 'with a unibrow', category: 'appearance' },
  { id: 'inj-6', text: 'in a tacky Hawaiian shirt', category: 'appearance' },
  { id: 'inj-7', text: 'wearing a fanny pack', category: 'appearance' },
  { id: 'inj-8', text: 'with a bowl cut', category: 'appearance' },
  { id: 'inj-9', text: 'in platform shoes', category: 'appearance' },
  { id: 'inj-10', text: 'wearing a tiny hat', category: 'appearance' },
  { id: 'inj-11', text: 'in a full clown outfit', category: 'appearance' },
  { id: 'inj-12', text: 'with googly eyes', category: 'appearance' },
  { id: 'inj-13', text: 'wearing a monocle', category: 'appearance' },
  { id: 'inj-14', text: 'in a sparkly sequin dress', category: 'appearance' },
  { id: 'inj-15', text: 'with a fake mustache', category: 'appearance' },

  // Objects (holding, with)
  { id: 'inj-16', text: 'holding a rubber duck', category: 'object' },
  { id: 'inj-17', text: 'with a giant foam finger', category: 'object' },
  { id: 'inj-18', text: 'carrying a tiny umbrella', category: 'object' },
  { id: 'inj-19', text: 'holding a slice of pizza', category: 'object' },
  { id: 'inj-20', text: 'with a sword that is clearly a toy', category: 'object' },
  { id: 'inj-21', text: 'holding a "worlds best boss" mug', category: 'object' },
  { id: 'inj-22', text: 'with a kazoo', category: 'object' },
  { id: 'inj-23', text: 'carrying a live chicken', category: 'object' },
  { id: 'inj-24', text: 'with an inflatable flamingo', category: 'object' },
  { id: 'inj-25', text: 'holding a lava lamp', category: 'object' },
  { id: 'inj-26', text: 'with a fish bowl on their head', category: 'object' },
  { id: 'inj-27', text: 'holding a selfie stick', category: 'object' },
  { id: 'inj-28', text: 'with a comically large spoon', category: 'object' },
  { id: 'inj-29', text: 'carrying a boom box', category: 'object' },
  { id: 'inj-30', text: 'with a pet rock', category: 'object' },

  // Settings (location modifiers)
  { id: 'inj-31', text: 'in a public restroom', category: 'setting' },
  { id: 'inj-32', text: 'at a kids birthday party', category: 'setting' },
  { id: 'inj-33', text: 'in a ball pit', category: 'setting' },
  { id: 'inj-34', text: 'at a DMV', category: 'setting' },
  { id: 'inj-35', text: 'in a bouncy castle', category: 'setting' },
  { id: 'inj-36', text: 'at a very awkward family reunion', category: 'setting' },
  { id: 'inj-37', text: 'in a shopping mall food court', category: 'setting' },
  { id: 'inj-38', text: 'at a petting zoo', category: 'setting' },
  { id: 'inj-39', text: 'in an elevator that is stuck', category: 'setting' },
  { id: 'inj-40', text: 'at a car dealership', category: 'setting' },

  // Actions (doing something)
  { id: 'inj-41', text: 'dabbing', category: 'action' },
  { id: 'inj-42', text: 'doing the floss dance', category: 'action' },
  { id: 'inj-43', text: 'aggressively eating a taco', category: 'action' },
  { id: 'inj-44', text: 'T-posing', category: 'action' },
  { id: 'inj-45', text: 'doing a crab walk', category: 'action' },
  { id: 'inj-46', text: 'giving a thumbs up', category: 'action' },
  { id: 'inj-47', text: 'mid-sneeze', category: 'action' },
  { id: 'inj-48', text: 'yelling dramatically', category: 'action' },
  { id: 'inj-49', text: 'doing jazz hands', category: 'action' },
  { id: 'inj-50', text: 'planking on something', category: 'action' },

  // Style (artistic modifiers)
  { id: 'inj-51', text: 'as a low-budget cosplay', category: 'style' },
  { id: 'inj-52', text: 'as clip art from 1999', category: 'style' },
  { id: 'inj-53', text: 'as a poorly drawn MS Paint creation', category: 'style' },
  { id: 'inj-54', text: 'as a cursed image', category: 'style' },
  { id: 'inj-55', text: 'as an infomercial gone wrong', category: 'style' },
];

// Style Override options - replace entire art style
export const STYLE_OVERRIDES: string[] = [
  'in Minions style',
  'as a bad tattoo',
  'in Shrek style',
  'as a poorly drawn stick figure',
  'in Comic Sans aesthetic',
  'as a Chia Pet',
  'in Nicolas Cage style',
  'as a "Live Laugh Love" decoration',
  'in Teletubbies style',
  'as a dated 90s CGI render',
  'in Clippy the paperclip style',
  'as a bootleg knockoff version',
  'in Furby aesthetic',
  'as an airbrushed van mural',
  'in Ugandan Knuckles style',
];

// Legacy constant for backward compatibility
export const SABOTAGE_COST = 2;

export interface Sabotage {
  attackerId: string;
  victimId: string;
  sabotageType: SabotageType;
  effectText: string; // The text describing what happened
  effectData?: string; // Additional data (e.g., avatar URL for photobomb)
  appliedAt: Date;
  // Legacy fields for backward compatibility
  injectionId?: string;
  injectionText?: string;
}

/**
 * Get a random sabotage injection (for word_injection type)
 */
export function getRandomInjection(excludeIds?: Set<string>): SabotageInjection {
  const available = SABOTAGE_INJECTIONS.filter(inj => !excludeIds?.has(inj.id));
  if (available.length === 0) {
    return SABOTAGE_INJECTIONS[Math.floor(Math.random() * SABOTAGE_INJECTIONS.length)]!;
  }
  return available[Math.floor(Math.random() * available.length)]!;
}

/**
 * Get a random style override
 */
export function getRandomStyleOverride(): string {
  return STYLE_OVERRIDES[Math.floor(Math.random() * STYLE_OVERRIDES.length)]!;
}

/**
 * Get a random mystery box sabotage type (weighted toward cheaper ones)
 * Excludes mystery_box itself and prompt_swap (too powerful for mystery)
 */
export function getMysteryBoxType(): SabotageType {
  // Weighted random: cheaper types have higher probability
  const weights: [SabotageType, number][] = [
    ['word_injection', 40], // Most common
    ['style_override', 30],
    ['photobomb', 30],
    // prompt_swap excluded - too powerful
  ];

  const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of weights) {
    random -= weight;
    if (random <= 0) {
      return type;
    }
  }

  return 'word_injection'; // fallback
}

/**
 * Apply sabotage injection to a prompt (for word_injection type)
 */
export function applySabotage(originalPrompt: string, injection: SabotageInjection): string {
  // Add the injection to the end of the prompt with appropriate connector
  const text = injection.text;
  if (text.startsWith('wearing ') || text.startsWith('with ') || text.startsWith('holding ') || text.startsWith('carrying ')) {
    return `${originalPrompt}, ${text}`;
  }
  if (text.startsWith('in ') || text.startsWith('at ') || text.startsWith('as ')) {
    return `${originalPrompt}, ${text}`;
  }
  // Actions get attached directly
  return `${originalPrompt}, ${text}`;
}

/**
 * Apply style override to a prompt
 */
export function applyStyleOverride(originalPrompt: string, styleText: string): string {
  // Style overrides are added at the end
  return `${originalPrompt}, ${styleText}`;
}

/**
 * Apply photobomb to a prompt - adds the attacker's avatar description
 */
export function applyPhotobomb(originalPrompt: string, attackerName: string): string {
  return `${originalPrompt}, with ${attackerName} photobombing in the background`;
}

/**
 * Create a sabotage effect based on type
 */
export interface SabotageEffect {
  effectText: string;
  effectData?: string;
  injectionId?: string;
}

export function createSabotageEffect(
  sabotageType: SabotageType,
  attackerName?: string,
  excludeInjectionIds?: Set<string>
): SabotageEffect {
  switch (sabotageType) {
    case 'word_injection': {
      const injection = getRandomInjection(excludeInjectionIds);
      return {
        effectText: injection.text,
        injectionId: injection.id,
      };
    }
    case 'style_override': {
      return {
        effectText: getRandomStyleOverride(),
      };
    }
    case 'photobomb': {
      return {
        effectText: `photobombed by ${attackerName}`,
        effectData: attackerName, // Store attacker name for prompt modification
      };
    }
    case 'prompt_swap': {
      return {
        effectText: 'prompt swapped!',
      };
    }
    case 'mystery_box': {
      // Resolve to an actual type
      const resolvedType = getMysteryBoxType();
      const resolved = createSabotageEffect(resolvedType, attackerName, excludeInjectionIds);
      return {
        ...resolved,
        effectText: `Mystery Box: ${resolved.effectText}`,
      };
    }
  }
}

/**
 * Apply a sabotage to a prompt based on type
 */
export function applySabotageToPrompt(
  originalPrompt: string,
  sabotage: Sabotage
): string {
  switch (sabotage.sabotageType) {
    case 'word_injection':
      return `${originalPrompt}, ${sabotage.effectText}`;
    case 'style_override':
      return applyStyleOverride(originalPrompt, sabotage.effectText);
    case 'photobomb':
      return applyPhotobomb(originalPrompt, sabotage.effectData ?? 'someone');
    case 'prompt_swap':
      // Prompt swap is handled separately in roomManager
      return originalPrompt;
    case 'mystery_box':
      // Mystery box effect is already resolved in effectText
      return `${originalPrompt}, ${sabotage.effectText.replace('Mystery Box: ', '')}`;
  }
}
