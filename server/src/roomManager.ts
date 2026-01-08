import { Room, Player, MIN_PLAYERS, MAX_PLAYERS, GamePhase, CategorySelection, PROMPTING_DURATION_MS, PROMPT_MAX_LENGTH, RoundState, GeneratedImage, Matchup, Vote, VOTING_DURATION_MS } from './types.js';
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
    generatedImages: new Map(),
    matchups: [],
    currentMatchupIndex: 0,
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

export interface StartGeneratingResult {
  success: boolean;
  error?: string;
  room?: Room;
  prompts?: Array<{ playerId: string; prompt: string }>;
}

export function startGenerating(roomCode: string): StartGeneratingResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.gameState.phase !== 'prompting') {
    return { success: false, error: 'Not in prompting phase' };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round' };
  }

  // Transition to generating phase
  room.gameState.phase = 'generating';

  // Extract prompts for generation
  const prompts = Array.from(room.gameState.currentRound.prompts.values()).map((p) => ({
    playerId: p.playerId,
    prompt: p.prompt,
  }));

  return { success: true, room, prompts };
}

export interface StoreImageResult {
  success: boolean;
  error?: string;
  allGenerated?: boolean;
}

export function storeGeneratedImage(
  roomCode: string,
  playerId: string,
  imageBase64: string | null,
  error: string | null
): StoreImageResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round' };
  }

  const generatedImage: GeneratedImage = {
    playerId,
    imageBase64,
    error,
    generatedAt: new Date(),
  };

  room.gameState.currentRound.generatedImages.set(playerId, generatedImage);

  // Check if all images are generated
  const allGenerated = room.gameState.currentRound.generatedImages.size >= room.gameState.currentRound.prompts.size;

  return { success: true, allGenerated };
}

export function getGeneratedCount(room: Room): { generated: number; total: number } {
  if (!room.gameState.currentRound) {
    return { generated: 0, total: 0 };
  }
  return {
    generated: room.gameState.currentRound.generatedImages.size,
    total: room.gameState.currentRound.prompts.size,
  };
}

/**
 * Generate all head-to-head matchups for players with successfully generated images
 */
function generateMatchups(playerIds: string[]): Matchup[] {
  const matchups: Matchup[] = [];

  // Generate all unique pairs (round-robin style)
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const player1Id = playerIds[i];
      const player2Id = playerIds[j];
      if (player1Id && player2Id) {
        // Randomize order for fairness
        const [first, second] = Math.random() < 0.5
          ? [player1Id, player2Id]
          : [player2Id, player1Id];

        matchups.push({
          player1Id: first,
          player2Id: second,
          votes: [],
          startTime: new Date(),
          endTime: new Date(),
        });
      }
    }
  }

  // Shuffle matchups for variety
  for (let i = matchups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = matchups[i];
    const swap = matchups[j];
    if (temp && swap) {
      matchups[i] = swap;
      matchups[j] = temp;
    }
  }

  return matchups;
}

export interface StartVotingResult {
  success: boolean;
  error?: string;
  room?: Room;
  matchup?: {
    player1Id: string;
    player2Id: string;
    player1Image: string | null;
    player2Image: string | null;
    endTime: string;
  };
}

export function startVoting(roomCode: string): StartVotingResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.gameState.phase !== 'generating') {
    return { success: false, error: 'Not in generating phase' };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round' };
  }

  // Get players with successfully generated images
  const playersWithImages = Array.from(room.gameState.currentRound.generatedImages.entries())
    .filter(([, img]) => img.imageBase64 !== null)
    .map(([playerId]) => playerId);

  if (playersWithImages.length < 2) {
    return { success: false, error: 'Not enough images to vote' };
  }

  // Generate matchups
  const matchups = generateMatchups(playersWithImages);
  room.gameState.currentRound.matchups = matchups;
  room.gameState.currentRound.currentMatchupIndex = 0;

  // Set up first matchup timing
  const now = new Date();
  const endTime = new Date(now.getTime() + VOTING_DURATION_MS);
  const firstMatchup = matchups[0];
  if (firstMatchup) {
    firstMatchup.startTime = now;
    firstMatchup.endTime = endTime;
  }

  // Transition to voting phase
  room.gameState.phase = 'voting';

  // Get first matchup data
  if (firstMatchup) {
    const player1Image = room.gameState.currentRound.generatedImages.get(firstMatchup.player1Id);
    const player2Image = room.gameState.currentRound.generatedImages.get(firstMatchup.player2Id);

    return {
      success: true,
      room,
      matchup: {
        player1Id: firstMatchup.player1Id,
        player2Id: firstMatchup.player2Id,
        player1Image: player1Image?.imageBase64 ?? null,
        player2Image: player2Image?.imageBase64 ?? null,
        endTime: firstMatchup.endTime.toISOString(),
      },
    };
  }

  return { success: false, error: 'Failed to create matchups' };
}

export interface CastVoteResult {
  success: boolean;
  error?: string;
  allVoted?: boolean;
}

export function castVote(socketId: string, votedForPlayerId: string): CastVoteResult {
  const room = getRoomBySocketId(socketId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.gameState.phase !== 'voting') {
    return { success: false, error: 'Not in voting phase' };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round' };
  }

  const currentMatchup = room.gameState.currentRound.matchups[room.gameState.currentRound.currentMatchupIndex];
  if (!currentMatchup) {
    return { success: false, error: 'No current matchup' };
  }

  // Cannot vote for own image
  if (socketId === votedForPlayerId) {
    return { success: false, error: 'Cannot vote for your own image' };
  }

  // Check if this player is in the matchup
  if (votedForPlayerId !== currentMatchup.player1Id && votedForPlayerId !== currentMatchup.player2Id) {
    return { success: false, error: 'Invalid vote target' };
  }

  // Check if already voted
  if (currentMatchup.votes.some((v) => v.voterId === socketId)) {
    return { success: false, error: 'Already voted' };
  }

  // Record the vote
  const vote: Vote = {
    voterId: socketId,
    votedForPlayerId,
    votedAt: new Date(),
  };
  currentMatchup.votes.push(vote);

  // Check if all eligible voters have voted
  // Eligible voters = all players except the two in the matchup
  const eligibleVoters = Array.from(room.players.keys()).filter(
    (id) => id !== currentMatchup.player1Id && id !== currentMatchup.player2Id
  );
  const allVoted = eligibleVoters.every((voterId) =>
    currentMatchup.votes.some((v) => v.voterId === voterId)
  );

  return { success: true, allVoted };
}

export interface AdvanceMatchupResult {
  success: boolean;
  error?: string;
  room?: Room;
  isComplete: boolean;
  nextMatchup?: {
    player1Id: string;
    player2Id: string;
    player1Image: string | null;
    player2Image: string | null;
    endTime: string;
    matchupIndex: number;
    totalMatchups: number;
  };
}

export function advanceMatchup(roomCode: string): AdvanceMatchupResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return { success: false, error: 'Room not found', isComplete: false };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round', isComplete: false };
  }

  const nextIndex = room.gameState.currentRound.currentMatchupIndex + 1;
  const totalMatchups = room.gameState.currentRound.matchups.length;

  // Check if all matchups are complete
  if (nextIndex >= totalMatchups) {
    return { success: true, room, isComplete: true };
  }

  // Advance to next matchup
  room.gameState.currentRound.currentMatchupIndex = nextIndex;
  const nextMatchup = room.gameState.currentRound.matchups[nextIndex];

  if (!nextMatchup) {
    return { success: false, error: 'Failed to get next matchup', isComplete: false };
  }

  // Set up timing for next matchup
  const now = new Date();
  const endTime = new Date(now.getTime() + VOTING_DURATION_MS);
  nextMatchup.startTime = now;
  nextMatchup.endTime = endTime;

  const player1Image = room.gameState.currentRound.generatedImages.get(nextMatchup.player1Id);
  const player2Image = room.gameState.currentRound.generatedImages.get(nextMatchup.player2Id);

  return {
    success: true,
    room,
    isComplete: false,
    nextMatchup: {
      player1Id: nextMatchup.player1Id,
      player2Id: nextMatchup.player2Id,
      player1Image: player1Image?.imageBase64 ?? null,
      player2Image: player2Image?.imageBase64 ?? null,
      endTime: endTime.toISOString(),
      matchupIndex: nextIndex,
      totalMatchups,
    },
  };
}

export function getCurrentMatchupVotes(room: Room): { voterId: string }[] {
  if (!room.gameState.currentRound) return [];
  const matchup = room.gameState.currentRound.matchups[room.gameState.currentRound.currentMatchupIndex];
  if (!matchup) return [];
  return matchup.votes.map((v) => ({ voterId: v.voterId }));
}

export function getPlayerName(room: Room, playerId: string): string {
  const player = room.players.get(playerId);
  return player?.name ?? 'Unknown';
}
