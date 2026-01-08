export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string | null;
  isHost: boolean;
  isReady: boolean;
}

export type CategorySelection =
  | 'All Categories'
  | 'Pop Culture'
  | 'Absurd Scenarios'
  | 'Mashups'
  | 'Vibes'
  | 'Challenges'
  | 'Art Style Twists'
  | 'Relatable Moments';

export const CATEGORY_OPTIONS: CategorySelection[] = [
  'All Categories',
  'Pop Culture',
  'Absurd Scenarios',
  'Mashups',
  'Vibes',
  'Challenges',
  'Art Style Twists',
  'Relatable Moments',
];

export type ModelProvider = 'flux-schnell' | 'nano-banana';

export const MODEL_PROVIDER_OPTIONS: { id: ModelProvider; name: string; description: string }[] = [
  { id: 'flux-schnell', name: 'Flux Schnell', description: 'Fast & cheap (~$0.003/image)' },
  { id: 'nano-banana', name: 'Nano Banana', description: 'Full features (AI avatars, @mentions)' },
];

export interface RoomState {
  code: string;
  players: Player[];
  hostId: string | null;
  canStart: boolean;
  category: CategorySelection;
  modelProvider: ModelProvider;
}

export type GamePhase = 'home' | 'lobby' | 'prompting' | 'generating' | 'voting' | 'results' | 'final';

export interface CurrentRoundState {
  themeText: string;
  phaseEndTime: string;
  submittedPlayerIds: string[];
}

export interface MatchupData {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Avatar: string | null;
  player2Avatar: string | null;
  player1Image: string | null;
  player2Image: string | null;
  endTime: string;
  matchupIndex: number;
  totalMatchups: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  score: number;
  roundWins: number;
  rank: number;
}

export interface ScoreChange {
  playerId: string;
  pointsAdded: number;
  reason: string;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  category: CategorySelection;
  modelProvider: ModelProvider;
  currentRound: CurrentRoundState | null;
}
