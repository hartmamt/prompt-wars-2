export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string | null;
  isHost: boolean;
  isReady: boolean;
}

export interface RoomState {
  code: string;
  players: Player[];
  hostId: string | null;
  canStart: boolean;
}

export type GamePhase = 'home' | 'lobby' | 'prompting' | 'generating' | 'voting' | 'results' | 'final';
