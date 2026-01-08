import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getPlayersArray,
  canStartGame,
  updatePlayerReady,
  updateRoomCategory,
} from './roomManager.js';
import type { Player, Room, CategorySelection } from './types.js';

interface RoomResponse {
  code: string;
  players: Player[];
  hostId: string | null;
  canStart: boolean;
  category: CategorySelection;
}

function roomToResponse(room: Room): RoomResponse {
  return {
    code: room.code,
    players: getPlayersArray(room),
    hostId: room.hostId,
    canStart: canStartGame(room),
    category: room.gameState.category,
  };
}

export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a new room
    socket.on('create-room', (data: { playerName: string }, callback: (response: { success: boolean; room?: RoomResponse; error?: string }) => void) => {
      try {
        const room = createRoom(socket.id, data.playerName);
        void socket.join(room.code);
        callback({ success: true, room: roomToResponse(room) });
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // Join an existing room
    socket.on('join-room', (data: { code: string; playerName: string }, callback: (response: { success: boolean; room?: RoomResponse; error?: string }) => void) => {
      try {
        const result = joinRoom(data.code, socket.id, data.playerName);

        if (!result.success || !result.room) {
          callback({ success: false, error: result.error });
          return;
        }

        void socket.join(result.room.code);

        // Notify all players in room about new player
        io.to(result.room.code).emit('player-joined', {
          player: result.player,
          room: roomToResponse(result.room),
        });

        callback({ success: true, room: roomToResponse(result.room) });
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // Leave room (explicit)
    socket.on('leave-room', (callback?: (response: { success: boolean }) => void) => {
      handleLeaveRoom(io, socket);
      if (callback) callback({ success: true });
    });

    // Update ready status
    socket.on('player-ready', (data: { isReady: boolean }) => {
      const room = updatePlayerReady(socket.id, data.isReady);
      if (room) {
        io.to(room.code).emit('room-updated', {
          room: roomToResponse(room),
        });
      }
    });

    // Update category (host only)
    socket.on('set-category', (data: { category: CategorySelection }) => {
      const room = updateRoomCategory(socket.id, data.category);
      if (room) {
        io.to(room.code).emit('room-updated', {
          room: roomToResponse(room),
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      handleLeaveRoom(io, socket);
    });
  });
}

function handleLeaveRoom(io: SocketIOServer, socket: Socket): void {
  const result = leaveRoom(socket.id);

  if (!result) return;

  const { room, wasHost, newHostId } = result;

  // Notify remaining players
  if (room.players.size > 0) {
    io.to(room.code).emit('player-left', {
      playerId: socket.id,
      wasHost,
      newHostId,
      room: roomToResponse(room),
    });
  }
}
