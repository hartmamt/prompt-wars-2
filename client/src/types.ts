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

export interface RoomState {
  code: string;
  players: Player[];
  hostId: string | null;
  canStart: boolean;
  category: CategorySelection;
}

export type GamePhase = 'home' | 'lobby' | 'prompting' | 'generating' | 'voting' | 'results' | 'final';

export interface CurrentRoundState {
  themeText: string;
  phaseEndTime: string;
  submittedPlayerIds: string[];
}

export interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  category: CategorySelection;
  currentRound: CurrentRoundState | null;
}
