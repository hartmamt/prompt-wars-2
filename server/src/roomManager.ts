import { Room, Player, MIN_PLAYERS, MAX_PLAYERS, GamePhase, CategorySelection, ModelProvider, PROMPTING_DURATION_MS, PROMPT_MAX_LENGTH, RoundState, GeneratedImage, Matchup, Vote, VOTING_DURATION_MS, POINTS_WIN_MATCHUP, POINTS_FASTEST_VOTER, INITIAL_TOKENS, TOKENS_WIN_MATCHUP, TOKENS_MAJORITY_VOTE, TOKENS_WIN_ROUND, Sabotage, SabotageType } from './types.js';
import { getRandomTheme } from './themes.js';
import { getRandomModifier, applyModifier } from './modifiers.js';
import { SABOTAGE_COSTS, MAX_SABOTAGES_PER_PLAYER_PER_GAME, createSabotageEffect, applySabotageToPrompt } from './sabotage.js';

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
      modelProvider: 'flux-schnell',
      chaosMode: false,
      usedThemeIds: new Set(),
      usedModifierIds: new Set(),
      currentRound: null,
      scores: new Map(),
      sabotageHistory: [],
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

export interface LeaveRoomResult {
  room: Room;
  wasHost: boolean;
  newHostId: string | null;
  gameEnded: boolean;
}

export function leaveRoom(socketId: string): LeaveRoomResult | null {
  const code = playerToRoom.get(socketId);
  if (!code) return null;

  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.get(socketId);
  if (!player) return null;

  const wasHost = player.isHost;
  const wasInGame = room.gameState.phase !== 'lobby' && room.gameState.phase !== 'final';

  room.players.delete(socketId);
  playerToRoom.delete(socketId);

  let newHostId: string | null = null;
  let gameEnded = false;

  // If room is empty, delete it
  if (room.players.size === 0) {
    rooms.delete(code);
    return { room, wasHost, newHostId: null, gameEnded: false };
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

  // If game was in progress and not enough players remain, end the game
  if (wasInGame && room.players.size < MIN_PLAYERS) {
    room.gameState.phase = 'lobby';
    room.gameState.round = 1;
    room.gameState.currentRound = null;
    room.gameState.usedThemeIds = new Set();
    room.gameState.scores = new Map();

    // Reset all players' ready status
    for (const [, p] of room.players) {
      p.isReady = false;
    }

    gameEnded = true;
  }

  return { room, wasHost, newHostId, gameEnded };
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

export function updateRoomModelProvider(socketId: string, modelProvider: ModelProvider): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  // Only host can change model provider
  const player = room.players.get(socketId);
  if (!player?.isHost) return null;

  // Can only change model provider in lobby phase
  if (room.gameState.phase !== 'lobby') return null;

  room.gameState.modelProvider = modelProvider;
  return room;
}

export function updateRoomChaosMode(socketId: string, chaosMode: boolean): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  // Only host can toggle chaos mode
  const player = room.players.get(socketId);
  if (!player?.isHost) return null;

  // Can only change chaos mode in lobby phase
  if (room.gameState.phase !== 'lobby') return null;

  room.gameState.chaosMode = chaosMode;
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
    sabotages: [],
  };

  room.gameState.phase = 'prompting';
  room.gameState.currentRound = roundState;

  // Initialize scores for all players if not already done
  for (const playerId of room.players.keys()) {
    if (!room.gameState.scores.has(playerId)) {
      room.gameState.scores.set(playerId, {
        playerId,
        score: 0,
        tokens: INITIAL_TOKENS,
        roundWins: 0,
        votesReceived: 0,
        fastestVoterBonuses: 0,
      });
    }
  }

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

  // Apply modifier if chaos mode is enabled
  let modifiedPrompt: string | null = null;
  let modifierId: string | null = null;
  let modifierText: string | null = null;

  if (room.gameState.chaosMode) {
    const modifier = getRandomModifier(room.gameState.round, room.gameState.usedModifierIds);
    room.gameState.usedModifierIds.add(modifier.id);
    modifiedPrompt = applyModifier(trimmedPrompt, modifier);
    modifierId = modifier.id;
    modifierText = modifier.text;
  }

  // Check for sabotages against this player
  let sabotagedPrompt: string | null = null;
  let sabotageText: string | null = null;
  let sabotageAttackerId: string | null = null;
  let sabotageType: SabotageType | null = null;

  const sabotages = room.gameState.currentRound.sabotages.filter(s => s.victimId === socketId);
  if (sabotages.length > 0) {
    // Apply all sabotages to the prompt (use modified prompt if exists, otherwise original)
    let currentPrompt = modifiedPrompt ?? trimmedPrompt;
    const sabotageTexts: string[] = [];

    for (const sabotage of sabotages) {
      // Handle prompt swap specially - will be resolved after all prompts are submitted
      if (sabotage.sabotageType === 'prompt_swap') {
        // Mark for later swap resolution
        sabotageTexts.push('Prompt Swap!');
        sabotageAttackerId = sabotage.attackerId;
        sabotageType = sabotage.sabotageType;
        continue;
      }

      // Apply other sabotage types
      currentPrompt = applySabotageToPrompt(currentPrompt, sabotage);
      sabotageTexts.push(sabotage.effectText);

      // Track the first sabotage for display
      if (!sabotageAttackerId) {
        sabotageAttackerId = sabotage.attackerId;
        sabotageType = sabotage.sabotageType;
      }
    }

    if (sabotageTexts.length > 0) {
      sabotagedPrompt = currentPrompt;
      sabotageText = sabotageTexts.join(' + ');
    }
  }

  // Store the prompt
  room.gameState.currentRound.prompts.set(socketId, {
    playerId: socketId,
    prompt: trimmedPrompt,
    modifiedPrompt,
    modifierId,
    modifierText,
    sabotagedPrompt,
    sabotageText,
    sabotageAttackerId,
    sabotageType,
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

export interface UseSabotageResult {
  success: boolean;
  error?: string;
  room?: Room;
  sabotage?: Sabotage;
}

export function useSabotage(
  attackerSocketId: string,
  victimId: string,
  sabotageType: SabotageType = 'word_injection'
): UseSabotageResult {
  const room = getRoomBySocketId(attackerSocketId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.gameState.phase !== 'prompting') {
    return { success: false, error: 'Not in prompting phase' };
  }

  if (!room.gameState.currentRound) {
    return { success: false, error: 'No active round' };
  }

  // Cannot sabotage yourself
  if (attackerSocketId === victimId) {
    return { success: false, error: 'Cannot sabotage yourself' };
  }

  // Check victim is in the room
  if (!room.players.has(victimId)) {
    return { success: false, error: 'Target not in room' };
  }

  // Check if already sabotaged this player this round
  const existingSabotageThisRound = room.gameState.currentRound.sabotages.find(
    s => s.attackerId === attackerSocketId && s.victimId === victimId
  );
  if (existingSabotageThisRound) {
    return { success: false, error: 'Already sabotaged this player this round' };
  }

  // Check consecutive sabotage limit (cannot sabotage same player in consecutive rounds)
  const currentRound = room.gameState.round;
  const previousRoundSabotage = room.gameState.sabotageHistory.find(
    h => h.attackerId === attackerSocketId && h.victimId === victimId && h.roundNumber === currentRound - 1
  );
  if (previousRoundSabotage) {
    return { success: false, error: 'Cannot sabotage same player consecutively' };
  }

  // Check per-game sabotage limit (max 2 per player per game)
  const sabotagesAgainstVictim = room.gameState.sabotageHistory.filter(
    h => h.attackerId === attackerSocketId && h.victimId === victimId
  ).length;
  if (sabotagesAgainstVictim >= MAX_SABOTAGES_PER_PLAYER_PER_GAME) {
    return { success: false, error: `Max ${MAX_SABOTAGES_PER_PLAYER_PER_GAME} sabotages per player per game` };
  }

  // Get the cost for this sabotage type
  const cost = SABOTAGE_COSTS[sabotageType];

  // Check if attacker has enough tokens
  const attackerScore = room.gameState.scores.get(attackerSocketId);
  if (!attackerScore || attackerScore.tokens < cost) {
    return { success: false, error: 'Not enough tokens' };
  }

  // Get attacker name for photobomb effect
  const attackerName = getPlayerName(room, attackerSocketId);

  // Get used injection IDs to avoid repeats
  const usedInjectionIds = new Set(
    room.gameState.currentRound.sabotages
      .filter(s => s.injectionId)
      .map(s => s.injectionId!)
  );

  // Create the sabotage effect
  const effect = createSabotageEffect(sabotageType, attackerName, usedInjectionIds);

  // Spend tokens
  attackerScore.tokens -= cost;

  // Create the sabotage
  const sabotage: Sabotage = {
    attackerId: attackerSocketId,
    victimId,
    sabotageType,
    effectText: effect.effectText,
    effectData: effect.effectData,
    appliedAt: new Date(),
    injectionId: effect.injectionId,
    injectionText: effect.effectText, // For backward compatibility
  };

  room.gameState.currentRound.sabotages.push(sabotage);

  // Record in sabotage history for per-game limits
  room.gameState.sabotageHistory.push({
    attackerId: attackerSocketId,
    victimId,
    roundNumber: currentRound,
  });

  return { success: true, room, sabotage };
}

export function getSabotagesAgainstPlayer(room: Room, playerId: string): Sabotage[] {
  if (!room.gameState.currentRound) return [];
  return room.gameState.currentRound.sabotages.filter(s => s.victimId === playerId);
}

export function getSabotagesByPlayer(room: Room, playerId: string): Sabotage[] {
  if (!room.gameState.currentRound) return [];
  return room.gameState.currentRound.sabotages.filter(s => s.attackerId === playerId);
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

  // Handle prompt swaps before generating
  const promptSwaps = room.gameState.currentRound.sabotages.filter(s => s.sabotageType === 'prompt_swap');
  for (const swap of promptSwaps) {
    const attackerPrompt = room.gameState.currentRound.prompts.get(swap.attackerId);
    const victimPrompt = room.gameState.currentRound.prompts.get(swap.victimId);

    if (attackerPrompt && victimPrompt) {
      // Swap the final prompts (use sabotaged > modified > original for each)
      const attackerFinalPrompt = attackerPrompt.sabotagedPrompt ?? attackerPrompt.modifiedPrompt ?? attackerPrompt.prompt;
      const victimFinalPrompt = victimPrompt.sabotagedPrompt ?? victimPrompt.modifiedPrompt ?? victimPrompt.prompt;

      // Update with swapped prompts
      attackerPrompt.sabotagedPrompt = victimFinalPrompt;
      attackerPrompt.sabotageText = (attackerPrompt.sabotageText ? attackerPrompt.sabotageText + ' + ' : '') + 'Prompt Swap!';
      attackerPrompt.sabotageAttackerId = swap.attackerId; // Self-sabotage marker

      victimPrompt.sabotagedPrompt = attackerFinalPrompt;
      victimPrompt.sabotageText = (victimPrompt.sabotageText ? victimPrompt.sabotageText + ' + ' : '') + 'Prompt Swap!';
      victimPrompt.sabotageAttackerId = swap.attackerId;
      victimPrompt.sabotageType = 'prompt_swap';
    }
  }

  // Transition to generating phase
  room.gameState.phase = 'generating';

  // Extract prompts for generation (priority: sabotaged > modified > original)
  const prompts = Array.from(room.gameState.currentRound.prompts.values()).map((p) => ({
    playerId: p.playerId,
    prompt: p.sabotagedPrompt ?? p.modifiedPrompt ?? p.prompt,
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

export function getPlayerAvatar(room: Room, playerId: string): string | null {
  const player = room.players.get(playerId);
  return player?.avatar ?? null;
}

export interface ScoreChange {
  playerId: string;
  pointsAdded: number;
  reason: string;
}

export interface TokenChange {
  playerId: string;
  tokensAdded: number;
  reason: string;
}

export interface MatchupResult {
  winnerId: string | null;  // null if tie
  loserId: string | null;
  player1Votes: number;
  player2Votes: number;
  fastestCorrectVoterId: string | null;
  scoreChanges: ScoreChange[];
  tokenChanges: TokenChange[];
}

export function calculateMatchupScores(room: Room): MatchupResult | null {
  if (!room.gameState.currentRound) return null;

  const matchup = room.gameState.currentRound.matchups[room.gameState.currentRound.currentMatchupIndex];
  if (!matchup) return null;

  // Count votes for each player
  const player1Votes = matchup.votes.filter((v) => v.votedForPlayerId === matchup.player1Id).length;
  const player2Votes = matchup.votes.filter((v) => v.votedForPlayerId === matchup.player2Id).length;

  const scoreChanges: ScoreChange[] = [];
  const tokenChanges: TokenChange[] = [];

  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (player1Votes > player2Votes) {
    winnerId = matchup.player1Id;
    loserId = matchup.player2Id;
  } else if (player2Votes > player1Votes) {
    winnerId = matchup.player2Id;
    loserId = matchup.player1Id;
  }
  // If tied, no winner

  // Award points and tokens to winner
  if (winnerId) {
    const winnerScore = room.gameState.scores.get(winnerId);
    if (winnerScore) {
      winnerScore.score += POINTS_WIN_MATCHUP;
      winnerScore.tokens += TOKENS_WIN_MATCHUP;
      winnerScore.roundWins += 1;
      winnerScore.votesReceived += winnerId === matchup.player1Id ? player1Votes : player2Votes;
      scoreChanges.push({ playerId: winnerId, pointsAdded: POINTS_WIN_MATCHUP, reason: 'Matchup Win' });
      tokenChanges.push({ playerId: winnerId, tokensAdded: TOKENS_WIN_MATCHUP, reason: 'Matchup Win' });
    }
  }

  // Update votes received for loser too
  if (loserId) {
    const loserScore = room.gameState.scores.get(loserId);
    if (loserScore) {
      loserScore.votesReceived += loserId === matchup.player1Id ? player1Votes : player2Votes;
    }
  }

  // Find fastest correct voter (voted for winner first)
  let fastestCorrectVoterId: string | null = null;
  if (winnerId && matchup.votes.length > 0) {
    const correctVotes = matchup.votes
      .filter((v) => v.votedForPlayerId === winnerId)
      .sort((a, b) => a.votedAt.getTime() - b.votedAt.getTime());

    if (correctVotes.length > 0 && correctVotes[0]) {
      fastestCorrectVoterId = correctVotes[0].voterId;
      const fastestScore = room.gameState.scores.get(fastestCorrectVoterId);
      if (fastestScore) {
        fastestScore.score += POINTS_FASTEST_VOTER;
        fastestScore.fastestVoterBonuses += 1;
        scoreChanges.push({ playerId: fastestCorrectVoterId, pointsAdded: POINTS_FASTEST_VOTER, reason: 'Fastest Correct Vote' });
      }
    }

    // Award tokens to all voters who voted for the winner (majority vote)
    for (const vote of matchup.votes) {
      if (vote.votedForPlayerId === winnerId) {
        const voterScore = room.gameState.scores.get(vote.voterId);
        if (voterScore) {
          voterScore.tokens += TOKENS_MAJORITY_VOTE;
          tokenChanges.push({ playerId: vote.voterId, tokensAdded: TOKENS_MAJORITY_VOTE, reason: 'Majority Vote' });
        }
      }
    }
  }

  return {
    winnerId,
    loserId,
    player1Votes,
    player2Votes,
    fastestCorrectVoterId,
    scoreChanges,
    tokenChanges,
  };
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  score: number;
  tokens: number;
  roundWins: number;
  rank: number;
}

export function getLeaderboard(room: Room): LeaderboardEntry[] {
  const entries = Array.from(room.gameState.scores.values())
    .map((score) => ({
      playerId: score.playerId,
      playerName: getPlayerName(room, score.playerId),
      playerAvatar: getPlayerAvatar(room, score.playerId),
      score: score.score,
      tokens: score.tokens,
      roundWins: score.roundWins,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

export interface RoundWinnerData {
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  prompt: string;
  modifierText: string | null;
  sabotageText: string | null;
  sabotageAttackerName: string | null;
  imageBase64: string | null;
  totalVotesReceived: number;
}

export function getRoundWinner(room: Room): RoundWinnerData | null {
  if (!room.gameState.currentRound) return null;

  // Count total votes received by each player across all matchups
  const votesByPlayer = new Map<string, number>();

  for (const matchup of room.gameState.currentRound.matchups) {
    for (const vote of matchup.votes) {
      const current = votesByPlayer.get(vote.votedForPlayerId) ?? 0;
      votesByPlayer.set(vote.votedForPlayerId, current + 1);
    }
  }

  // Find player with most votes
  let winnerId: string | null = null;
  let maxVotes = 0;

  for (const [playerId, votes] of votesByPlayer.entries()) {
    if (votes > maxVotes) {
      maxVotes = votes;
      winnerId = playerId;
    }
  }

  if (!winnerId) return null;

  const prompt = room.gameState.currentRound.prompts.get(winnerId);
  const image = room.gameState.currentRound.generatedImages.get(winnerId);

  // Get sabotage attacker name if there was one
  let sabotageAttackerName: string | null = null;
  if (prompt?.sabotageAttackerId) {
    sabotageAttackerName = getPlayerName(room, prompt.sabotageAttackerId);
  }

  return {
    playerId: winnerId,
    playerName: getPlayerName(room, winnerId),
    playerAvatar: getPlayerAvatar(room, winnerId),
    prompt: prompt?.prompt ?? '',
    modifierText: prompt?.modifierText ?? null,
    sabotageText: prompt?.sabotageText ?? null,
    sabotageAttackerName,
    imageBase64: image?.imageBase64 ?? null,
    totalVotesReceived: maxVotes,
  };
}

export interface TransitionToResultsResult {
  success: boolean;
  room?: Room;
  roundWinnerTokenChange?: TokenChange;
}

export function transitionToResults(roomCode: string): TransitionToResultsResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return { success: false };
  }

  room.gameState.phase = 'results';

  // Award tokens to round winner
  let roundWinnerTokenChange: TokenChange | undefined;
  const roundWinner = getRoundWinner(room);
  if (roundWinner) {
    const winnerScore = room.gameState.scores.get(roundWinner.playerId);
    if (winnerScore) {
      winnerScore.tokens += TOKENS_WIN_ROUND;
      roundWinnerTokenChange = {
        playerId: roundWinner.playerId,
        tokensAdded: TOKENS_WIN_ROUND,
        reason: 'Round Win',
      };
    }
  }

  return { success: true, room, roundWinnerTokenChange };
}

export interface StartNextRoundResult {
  success: boolean;
  error?: string;
  room?: Room;
  isFinal?: boolean;
}

export function startNextRound(roomCode: string): StartNextRoundResult {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.gameState.phase !== 'results') {
    return { success: false, error: 'Not in results phase' };
  }

  // Check if this was the final round
  if (room.gameState.round >= room.gameState.totalRounds) {
    room.gameState.phase = 'final';
    return { success: true, room, isFinal: true };
  }

  // Advance to next round
  room.gameState.round += 1;

  // Select a new theme
  const theme = getRandomTheme(room.gameState.category, room.gameState.usedThemeIds);
  if (!theme) {
    return { success: false, error: 'No themes available' };
  }

  // Mark theme as used
  room.gameState.usedThemeIds.add(theme.id);

  // Start new prompting phase
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
    sabotages: [],
  };

  room.gameState.phase = 'prompting';
  room.gameState.currentRound = roundState;

  return { success: true, room, isFinal: false };
}

export interface ResetGameResult {
  success: boolean;
  error?: string;
  room?: Room;
}

export function resetGame(socketId: string): ResetGameResult {
  const room = getRoomBySocketId(socketId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  // Only host can reset game
  const player = room.players.get(socketId);
  if (!player?.isHost) {
    return { success: false, error: 'Only host can reset game' };
  }

  // Can only reset from final phase
  if (room.gameState.phase !== 'final') {
    return { success: false, error: 'Can only reset from final results' };
  }

  // Reset game state
  room.gameState = {
    phase: 'lobby',
    round: 1,
    totalRounds: 3,
    category: room.gameState.category, // Keep the selected category
    modelProvider: room.gameState.modelProvider, // Keep the selected model provider
    chaosMode: room.gameState.chaosMode, // Keep chaos mode setting
    usedThemeIds: new Set(),
    usedModifierIds: new Set(),
    currentRound: null,
    scores: new Map(),
    sabotageHistory: [], // Reset sabotage history for new game
  };

  // Reset all players' ready status
  for (const [, p] of room.players) {
    p.isReady = false;
  }

  return { success: true, room };
}
