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

export interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
