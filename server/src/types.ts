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

export interface PlayerPrompt {
  playerId: string;
  prompt: string;
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

export interface RoundState {
  themeId: string;
  themeText: string;
  prompts: Map<string, PlayerPrompt>;
  generatedImages: Map<string, GeneratedImage>;
  matchups: Matchup[];
  currentMatchupIndex: number;
  phaseStartTime: Date;
  phaseEndTime: Date;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  category: CategorySelection;
  usedThemeIds: Set<string>;
  currentRound: RoundState | null;
}

export const PROMPTING_DURATION_MS = 90 * 1000; // 90 seconds
export const PROMPT_MAX_LENGTH = 200;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
