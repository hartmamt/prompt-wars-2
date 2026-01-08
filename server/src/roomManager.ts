import { Room, Player, MIN_PLAYERS, MAX_PLAYERS, GamePhase } from './types.js';

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
