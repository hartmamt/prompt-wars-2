import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getPlayersArray,
  canStartGame,
  updatePlayerReady,
  updateRoomCategory,
  startGame,
  submitPrompt,
  getSubmittedPlayerIds,
  startGenerating,
  storeGeneratedImage,
  getGeneratedCount,
  getRoom,
  startVoting,
  castVote,
  advanceMatchup,
  getCurrentMatchupVotes,
  getPlayerName,
  getRoomBySocketId,
  calculateMatchupScores,
  getLeaderboard,
} from './roomManager.js';
import { generateImage } from './flux.js';
import type { Player, Room, CategorySelection, GamePhase } from './types.js';

interface RoomResponse {
  code: string;
  players: Player[];
  hostId: string | null;
  canStart: boolean;
  category: CategorySelection;
}

interface GameStateResponse {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  category: CategorySelection;
  currentRound: {
    themeText: string;
    phaseEndTime: string;
    submittedPlayerIds: string[];
  } | null;
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

function gameStateToResponse(room: Room): GameStateResponse {
  return {
    phase: room.gameState.phase,
    round: room.gameState.round,
    totalRounds: room.gameState.totalRounds,
    category: room.gameState.category,
    currentRound: room.gameState.currentRound
      ? {
          themeText: room.gameState.currentRound.themeText,
          phaseEndTime: room.gameState.currentRound.phaseEndTime.toISOString(),
          submittedPlayerIds: getSubmittedPlayerIds(room),
        }
      : null,
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

    // Start game (host only)
    socket.on('start-game', (callback: (response: { success: boolean; error?: string }) => void) => {
      const result = startGame(socket.id);

      if (!result.success || !result.room) {
        callback({ success: false, error: result.error });
        return;
      }

      // Notify all players about game start
      io.to(result.room.code).emit('game-started', {
        gameState: gameStateToResponse(result.room),
      });

      callback({ success: true });
    });

    // Submit prompt
    socket.on('submit-prompt', (data: { prompt: string }, callback: (response: { success: boolean; error?: string }) => void) => {
      const result = submitPrompt(socket.id, data.prompt);

      if (!result.success || !result.room) {
        callback({ success: false, error: result.error });
        return;
      }

      // Notify all players about prompt submission (just the ID, not the content)
      io.to(result.room.code).emit('prompt-submitted', {
        playerId: socket.id,
        submittedPlayerIds: getSubmittedPlayerIds(result.room),
        allSubmitted: result.allSubmitted,
      });

      callback({ success: true });

      // If all players have submitted, trigger generating phase
      if (result.allSubmitted) {
        void handleGeneratingPhase(io, result.room.code);
      }
    });

    // Cast vote
    socket.on('cast-vote', (data: { votedForPlayerId: string }, callback: (response: { success: boolean; error?: string }) => void) => {
      const result = castVote(socket.id, data.votedForPlayerId);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      const room = getRoomBySocketId(socket.id);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Notify all players about the vote (just that someone voted, not who they voted for)
      io.to(room.code).emit('vote-cast', {
        voterId: socket.id,
        votersWhoVoted: getCurrentMatchupVotes(room).map((v) => v.voterId),
      });

      callback({ success: true });

      // If all eligible players have voted, advance to next matchup
      if (result.allVoted) {
        // Calculate scores for this matchup before advancing
        const matchupResult = calculateMatchupScores(room);

        // Emit score update
        if (matchupResult) {
          io.to(room.code).emit('matchup-result', {
            winnerId: matchupResult.winnerId,
            loserId: matchupResult.loserId,
            player1Votes: matchupResult.player1Votes,
            player2Votes: matchupResult.player2Votes,
            fastestCorrectVoterId: matchupResult.fastestCorrectVoterId,
            scoreChanges: matchupResult.scoreChanges,
            leaderboard: getLeaderboard(room),
          });
        }

        const advanceResult = advanceMatchup(room.code);

        if (advanceResult.isComplete) {
          // All matchups complete - transition to results phase (US-012)
          io.to(room.code).emit('voting-complete', {
            gameState: advanceResult.room ? gameStateToResponse(advanceResult.room) : null,
            leaderboard: advanceResult.room ? getLeaderboard(advanceResult.room) : [],
          });
        } else if (advanceResult.nextMatchup) {
          // Emit next matchup
          const player1Name = getPlayerName(room, advanceResult.nextMatchup.player1Id);
          const player2Name = getPlayerName(room, advanceResult.nextMatchup.player2Id);

          io.to(room.code).emit('next-matchup', {
            matchup: {
              ...advanceResult.nextMatchup,
              player1Name,
              player2Name,
            },
          });
        }
      }
    });

    // Force advance matchup (for timer expiry)
    socket.on('advance-matchup', (callback: (response: { success: boolean; error?: string }) => void) => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Only host can force advance
      const player = room.players.get(socket.id);
      if (!player?.isHost) {
        callback({ success: false, error: 'Only host can advance matchup' });
        return;
      }

      // Calculate scores for this matchup before advancing
      const matchupResult = calculateMatchupScores(room);

      // Emit score update
      if (matchupResult) {
        io.to(room.code).emit('matchup-result', {
          winnerId: matchupResult.winnerId,
          loserId: matchupResult.loserId,
          player1Votes: matchupResult.player1Votes,
          player2Votes: matchupResult.player2Votes,
          fastestCorrectVoterId: matchupResult.fastestCorrectVoterId,
          scoreChanges: matchupResult.scoreChanges,
          leaderboard: getLeaderboard(room),
        });
      }

      const advanceResult = advanceMatchup(room.code);

      if (advanceResult.isComplete) {
        io.to(room.code).emit('voting-complete', {
          gameState: advanceResult.room ? gameStateToResponse(advanceResult.room) : null,
          leaderboard: advanceResult.room ? getLeaderboard(advanceResult.room) : [],
        });
      } else if (advanceResult.nextMatchup) {
        const player1Name = getPlayerName(room, advanceResult.nextMatchup.player1Id);
        const player2Name = getPlayerName(room, advanceResult.nextMatchup.player2Id);

        io.to(room.code).emit('next-matchup', {
          matchup: {
            ...advanceResult.nextMatchup,
            player1Name,
            player2Name,
          },
        });
      }

      callback({ success: true });
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

async function handleGeneratingPhase(io: SocketIOServer, roomCode: string): Promise<void> {
  const result = startGenerating(roomCode);

  if (!result.success || !result.room || !result.prompts) {
    console.error('Failed to start generating:', result.error);
    return;
  }

  const room = result.room;

  // Notify all players that generating has started
  io.to(roomCode).emit('generating-started', {
    gameState: gameStateToResponse(room),
    totalImages: result.prompts.length,
  });

  // Generate images for all prompts in parallel
  const generationPromises = result.prompts.map(async ({ playerId, prompt }) => {
    const imageResult = await generateImage(prompt);

    const storeResult = storeGeneratedImage(
      roomCode,
      playerId,
      imageResult.success ? (imageResult.imageBase64 ?? null) : null,
      imageResult.success ? null : (imageResult.error ?? 'Unknown error')
    );

    // Get updated room state for counts
    const updatedRoom = getRoom(roomCode);
    if (updatedRoom) {
      const counts = getGeneratedCount(updatedRoom);
      io.to(roomCode).emit('image-generated', {
        playerId,
        generatedCount: counts.generated,
        totalCount: counts.total,
        hasError: !imageResult.success,
      });
    }

    return storeResult;
  });

  // Wait for all generations to complete
  await Promise.all(generationPromises);

  // Get final room state
  const finalRoom = getRoom(roomCode);
  if (finalRoom) {
    io.to(roomCode).emit('generating-complete', {
      gameState: gameStateToResponse(finalRoom),
    });

    // Automatically transition to voting phase
    void handleVotingPhase(io, roomCode);
  }
}

function handleVotingPhase(io: SocketIOServer, roomCode: string): void {
  const result = startVoting(roomCode);

  if (!result.success || !result.room || !result.matchup) {
    console.error('Failed to start voting:', result.error);
    return;
  }

  const room = result.room;

  // Get player names for the matchup
  const player1Name = getPlayerName(room, result.matchup.player1Id);
  const player2Name = getPlayerName(room, result.matchup.player2Id);

  // Notify all players that voting has started
  io.to(roomCode).emit('voting-started', {
    gameState: gameStateToResponse(room),
    matchup: {
      ...result.matchup,
      player1Name,
      player2Name,
      matchupIndex: 0,
      totalMatchups: room.gameState.currentRound?.matchups.length ?? 0,
    },
  });
}
