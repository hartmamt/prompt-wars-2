import { Room, Player, MIN_PLAYERS, MAX_PLAYERS, GamePhase, CategorySelection, PROMPTING_DURATION_MS, PROMPT_MAX_LENGTH, RoundState } from './types.js';
import { getRandomTheme } from './themes.js';

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 4 }, () =>
      ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length))
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(socketId: string, playerName: string): Room {
  const code = generateRoomCode();
  const playerId = socketId;

  const player: Player = {
    id: playerId,
    socketId,
    name: playerName,
    avatar: null,
    isHost: true,
    isReady: false,
  };

  const room: Room = {
    code,
    players: new Map([[playerId, player]]),
    hostId: playerId,
    createdAt: new Date(),
    gameState: {
      phase: 'lobby',
      round: 1,
      totalRounds: 3,
      category: 'All Categories',
      usedThemeIds: new Set(),
      currentRound: null,
    },
  };

  rooms.set(code, room);
  playerToRoom.set(socketId, code);

  return room;
}

export interface JoinRoomResult {
  success: boolean;
  error?: string;
  room?: Room;
  player?: Player;
}

export function joinRoom(code: string, socketId: string, playerName: string): JoinRoomResult {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.players.size >= MAX_PLAYERS) {
    return { success: false, error: 'Room is full' };
  }

  if (room.gameState.phase !== 'lobby') {
    return { success: false, error: 'Game already in progress' };
  }

  const playerId = socketId;
  const player: Player = {
    id: playerId,
    socketId,
    name: playerName,
    avatar: null,
    isHost: false,
    isReady: false,
  };

  room.players.set(playerId, player);
  playerToRoom.set(socketId, code.toUpperCase());

  return { success: true, room, player };
}

export function leaveRoom(socketId: string): { room: Room; wasHost: boolean; newHostId: string | null } | null {
  const code = playerToRoom.get(socketId);
  if (!code) return null;

  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.get(socketId);
  if (!player) return null;

  const wasHost = player.isHost;
  room.players.delete(socketId);
  playerToRoom.delete(socketId);

  let newHostId: string | null = null;

  // If room is empty, delete it
  if (room.players.size === 0) {
    rooms.delete(code);
    return { room, wasHost, newHostId: null };
  }

  // If the leaving player was host, assign new host
  if (wasHost) {
    const iterator = room.players.values();
    const nextResult = iterator.next();
    if (!nextResult.done) {
      const nextPlayer = nextResult.value;
      nextPlayer.isHost = true;
      room.hostId = nextPlayer.id;
      newHostId = nextPlayer.id;
    }
  }

  return { room, wasHost, newHostId };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  const code = playerToRoom.get(socketId);
  if (!code) return undefined;
  return rooms.get(code);
}

export function getPlayersArray(room: Room): Player[] {
  return Array.from(room.players.values());
}

export function canStartGame(room: Room): boolean {
  return room.players.size >= MIN_PLAYERS && room.gameState.phase === 'lobby';
}

export function setGamePhase(room: Room, phase: GamePhase): void {
  room.gameState.phase = phase;
}

export function updatePlayerReady(socketId: string, isReady: boolean): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const player = room.players.get(socketId);
  if (!player) return null;

  player.isReady = isReady;
  return room;
}

export function updatePlayerAvatar(socketId: string, avatar: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const player = room.players.get(socketId);
  if (!player) return null;

  player.avatar = avatar;
  return room;
}

export function updateRoomCategory(socketId: string, category: CategorySelection): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  // Only host can change category
  const player = room.players.get(socketId);
  if (!player?.isHost) return null;

  // Can only change category in lobby phase
  if (room.gameState.phase !== 'lobby') return null;

  room.gameState.category = category;
  return room;
}

export interface StartGameResult {
  success: boolean;
  error?: string;
  room?: Room;
}

export function startGame(socketId: string): StartGameResult {
  const room = getRoomBySocketId(socketId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  // Only host can start game
  const player = room.players.get(socketId);
  if (!player?.isHost) {
    return { success: false, error: 'Only host can start game' };
  }

  // Must have minimum players
  if (room.players.size < MIN_PLAYERS) {
    return { success: false, error: 'Not enough players' };
  }

  // Can only start from lobby
  if (room.gameState.phase !== 'lobby') {
    return { success: false, error: 'Game already started' };
  }

  // Select a theme
  const theme = getRandomTheme(room.gameState.category, room.gameState.usedThemeIds);
  if (!theme) {
    return { success: false, error: 'No themes available' };
  }

  // Mark theme as used
  room.gameState.usedThemeIds.add(theme.id);

  // Start prompting phase
  const now = new Date();
  const endTime = new Date(now.getTime() + PROMPTING_DURATION_MS);

  const roundState: RoundState = {
    themeId: theme.id,
    themeText: theme.text,
    prompts: new Map(),
    phaseStartTime: now,
    phaseEndTime: endTime,
  };

  room.gameState.phase = 'prompting';
  room.gameState.currentRound = roundState;

  return { success: true, room };
}

export interface SubmitPromptResult {
  success: boolean;
  error?: string;
  room?: Room;
  allSubmitted?: boolean;
}

export function submitPrompt(socketId: string, prompt: string): SubmitPromptResult {
  const room = getRoomBySocketId(socketId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.gameState.phase !== 'prompting') {
    return { success: false, error: 'Not in prompting phase' };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round' };
  }

  // Validate prompt length
  const trimmedPrompt = prompt.trim().slice(0, PROMPT_MAX_LENGTH);
  if (trimmedPrompt.length === 0) {
    return { success: false, error: 'Prompt cannot be empty' };
  }

  // Check if already submitted
  if (room.gameState.currentRound.prompts.has(socketId)) {
    return { success: false, error: 'Already submitted' };
  }

  // Store the prompt
  room.gameState.currentRound.prompts.set(socketId, {
    playerId: socketId,
    prompt: trimmedPrompt,
    submittedAt: new Date(),
  });

  // Check if all players have submitted
  const allSubmitted = room.gameState.currentRound.prompts.size === room.players.size;

  return { success: true, room, allSubmitted };
}

export function getSubmittedPlayerIds(room: Room): string[] {
  if (!room.gameState.currentRound) return [];
  return Array.from(room.gameState.currentRound.prompts.keys());
}
