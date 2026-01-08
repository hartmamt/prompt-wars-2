export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string | null;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  code: string;
  players: Map<string, Player>;
  hostId: string | null;
  createdAt: Date;
  gameState: GameState;
}

export type GamePhase = 'lobby' | 'prompting' | 'generating' | 'voting' | 'results' | 'final';

export type CategorySelection =
  | 'All Categories'
  | 'Pop Culture'
  | 'Absurd Scenarios'
  | 'Mashups'
  | 'Vibes'
  | 'Challenges'
  | 'Art Style Twists'
  | 'Relatable Moments';

export type ModelProvider = 'flux-schnell' | 'nano-banana';

export const MODEL_PROVIDERS: { id: ModelProvider; name: string; description: string }[] = [
  { id: 'flux-schnell', name: 'Flux Schnell', description: 'Fast & cheap (~$0.003/image)' },
  { id: 'nano-banana', name: 'Nano Banana', description: 'Full features (AI avatars, @mentions)' },
];

export interface PlayerPrompt {
  playerId: string;
  prompt: string;
  modifiedPrompt: string | null; // Prompt with modifier applied (null if chaos mode off)
  modifierId: string | null; // ID of modifier applied (null if chaos mode off)
  modifierText: string | null; // Text of modifier applied (null if chaos mode off)
  sabotagedPrompt: string | null; // Prompt after all sabotages applied
  sabotageText: string | null; // Combined sabotage effects text (for display)
  sabotageAttackerId: string | null; // Primary sabotage attacker (for display)
  sabotageType: SabotageType | null; // Primary sabotage type (for display)
  submittedAt: Date;
}

export interface GeneratedImage {
  playerId: string;
  imageBase64: string | null;
  error: string | null;
  generatedAt: Date;
}

export interface Vote {
  voterId: string;
  votedForPlayerId: string;
  votedAt: Date;
}

export interface Matchup {
  player1Id: string;
  player2Id: string;
  votes: Vote[];
  startTime: Date;
  endTime: Date;
}

export const VOTING_DURATION_MS = 60 * 1000; // 60 seconds per matchup

export type SabotageType = 'word_injection' | 'style_override' | 'photobomb' | 'prompt_swap' | 'mystery_box';

export interface Sabotage {
  attackerId: string;
  victimId: string;
  sabotageType: SabotageType;
  effectText: string; // The effect description
  effectData?: string; // Additional data (e.g., attacker name for photobomb)
  appliedAt: Date;
  // Legacy fields for backward compatibility
  injectionId?: string;
  injectionText?: string;
}

// Tracks sabotage history per attacker for per-game limits
export interface SabotageHistory {
  attackerId: string;
  victimId: string;
  roundNumber: number;
}

export interface RoundState {
  themeId: string;
  themeText: string;
  prompts: Map<string, PlayerPrompt>;
  generatedImages: Map<string, GeneratedImage>;
  matchups: Matchup[];
  currentMatchupIndex: number;
  phaseStartTime: Date;
  phaseEndTime: Date;
  sabotages: Sabotage[];
}

export interface PlayerScore {
  playerId: string;
  score: number;
  tokens: number;
  roundWins: number;
  votesReceived: number;
  fastestVoterBonuses: number;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  category: CategorySelection;
  modelProvider: ModelProvider;
  chaosMode: boolean;
  usedThemeIds: Set<string>;
  usedModifierIds: Set<string>;
  currentRound: RoundState | null;
  scores: Map<string, PlayerScore>;
  sabotageHistory: SabotageHistory[]; // Track sabotages for per-game limits
}

export const POINTS_WIN_MATCHUP = 500;
export const POINTS_FASTEST_VOTER = 50;

export const INITIAL_TOKENS = 2;
export const TOKENS_WIN_MATCHUP = 1;
export const TOKENS_MAJORITY_VOTE = 1;
export const TOKENS_WIN_ROUND = 2;

export const PROMPTING_DURATION_MS = 90 * 1000; // 90 seconds
export const PROMPT_MAX_LENGTH = 200;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

// Chaos Awards
export type ChaosAwardType = 'agent_of_chaos' | 'survivor' | 'karma' | 'backfire';

export interface ChaosAward {
  type: ChaosAwardType;
  title: string;
  description: string;
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  emoji: string;
}
