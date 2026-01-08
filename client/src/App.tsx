import { useEffect, useState, useCallback, useRef } from 'react';
import { socket, connectSocket } from './socket';
import { setupDiscord, isInDiscord, type DiscordUser } from './discord';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Prompting } from './components/Prompting';
import { Generating } from './components/Generating';
import { Voting } from './components/Voting';
import { Results } from './components/Results';
import { FinalResults } from './components/FinalResults';
import { audioEngine } from './audioEngine';
import { playPhaseTransition } from './sounds';
import type { RoomState, GamePhase, Player, CategorySelection, ModelProvider, GameState, MatchupData, LeaderboardEntry, ScoreChange, ChaosAward } from './types';

interface RoomResponse {
  success: boolean;
  room?: RoomState;
  error?: string;
}

interface PlayerJoinedEvent {
  player: Player;
  room: RoomState;
}

interface PlayerLeftEvent {
  playerId: string;
  wasHost: boolean;
  newHostId: string | null;
  room: RoomState;
}

interface RoomUpdatedEvent {
  room: RoomState;
}

interface GameStartedEvent {
  gameState: GameState;
}

interface PromptSubmittedEvent {
  playerId: string;
  submittedPlayerIds: string[];
  allSubmitted: boolean;
}

interface GeneratingStartedEvent {
  gameState: GameState;
  totalImages: number;
}

interface ImageGeneratedEvent {
  playerId: string;
  generatedCount: number;
  totalCount: number;
  hasError: boolean;
}

interface GeneratingCompleteEvent {
  gameState: GameState;
}

interface VotingStartedEvent {
  gameState: GameState;
  matchup: MatchupData;
}

interface VoteCastEvent {
  voterId: string;
  votersWhoVoted: string[];
}

interface NextMatchupEvent {
  matchup: MatchupData;
}

interface VotingCompleteEvent {
  gameState: GameState | null;
  leaderboard: LeaderboardEntry[];
}

interface MatchupResultEvent {
  winnerId: string | null;
  loserId: string | null;
  player1Votes: number;
  player2Votes: number;
  fastestCorrectVoterId: string | null;
  scoreChanges: ScoreChange[];
  leaderboard: LeaderboardEntry[];
}

interface RoundWinner {
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  prompt: string;
  modifierText: string | null;
  sabotageText: string | null;
  sabotageAttackerName: string | null;
  imageBase64: string | null;
  votesReceived: number;
}

interface RoundResultsEvent {
  gameState: GameState;
  leaderboard: LeaderboardEntry[];
  roundWinner: RoundWinner | null;
  theme: string;
  roundNumber: number;
  totalRounds: number;
}

interface FinalResultsEvent {
  gameState: GameState;
  leaderboard: LeaderboardEntry[];
  chaosAwards?: ChaosAward[];
}

interface GameResetEvent {
  room: RoomState;
}

interface GameEndedEvent {
  reason: string;
  room: RoomState;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>('home');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedPrompt, setHasSubmittedPrompt] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalImagesToGenerate, setTotalImagesToGenerate] = useState(0);
  const [hasGenerationError, setHasGenerationError] = useState(false);
  const [currentMatchup, setCurrentMatchup] = useState<MatchupData | null>(null);
  const [votersWhoVoted, setVotersWhoVoted] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [chaosAwards, setChaosAwards] = useState<ChaosAward[]>([]);
  const [recentScoreChanges, setRecentScoreChanges] = useState<ScoreChange[]>([]);
  const [roundWinner, setRoundWinner] = useState<RoundWinner | null>(null);
  const [resultsTheme, setResultsTheme] = useState('');
  const [resultsRoundNumber, setResultsRoundNumber] = useState(1);
  const [resultsTotalRounds, setResultsTotalRounds] = useState(3);
  const [audioMuted, setAudioMuted] = useState(false);
  const [incomingSabotage, setIncomingSabotage] = useState<{ attackerName: string; sabotageType?: string } | null>(null);
  const [armedSabotages, setArmedSabotages] = useState<{ victimId: string; attackerId: string }[]>([]);
  const [sabotagesAgainstMe, setSabotagesAgainstMe] = useState(0);
  const audioInitializedRef = useRef(false);
  const prevPhaseRef = useRef<GamePhase>('home');

  // Get the current player's ID (socket ID)
  const currentPlayerId = socket.id ?? '';

  useEffect(() => {
    const init = async () => {
      // Set up Discord if in Discord iframe
      if (isInDiscord()) {
        const auth = await setupDiscord();
        if (auth) {
          setDiscordUser(auth.user);
        }
      }

      // Connect to Socket.io server
      connectSocket();
      setLoading(false);
    };

    void init();

    // Socket event listeners
    const onConnect = () => {
      setConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      setConnected(false);
      setRoom(null);
      setGameState(null);
      setPhase('home');
      setHasSubmittedPrompt(false);
    };

    const onPlayerJoined = (data: PlayerJoinedEvent) => {
      setRoom(data.room);
    };

    const onPlayerLeft = (data: PlayerLeftEvent) => {
      setRoom(data.room);
    };

    const onRoomUpdated = (data: RoomUpdatedEvent) => {
      setRoom(data.room);
    };

    const onGameStarted = (data: GameStartedEvent) => {
      setGameState(data.gameState);
      setPhase(data.gameState.phase);
      setHasSubmittedPrompt(false);
      // Clear sabotage tracking for new game
      setArmedSabotages([]);
      setSabotagesAgainstMe(0);
    };

    const onPromptSubmitted = (data: PromptSubmittedEvent) => {
      setGameState((prev) => {
        if (!prev?.currentRound) return prev;
        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            submittedPlayerIds: data.submittedPlayerIds,
          },
        };
      });

      // Check if current player submitted
      if (data.playerId === currentPlayerId) {
        setHasSubmittedPrompt(true);
      }
    };

    const onGeneratingStarted = (data: GeneratingStartedEvent) => {
      setGameState(data.gameState);
      setPhase('generating');
      setTotalImagesToGenerate(data.totalImages);
      setGeneratedCount(0);
      setHasGenerationError(false);
    };

    const onImageGenerated = (data: ImageGeneratedEvent) => {
      setGeneratedCount(data.generatedCount);
      if (data.hasError) {
        setHasGenerationError(true);
      }
    };

    const onGeneratingComplete = (data: GeneratingCompleteEvent) => {
      setGameState(data.gameState);
    };

    const onVotingStarted = (data: VotingStartedEvent) => {
      setGameState(data.gameState);
      setPhase('voting');
      setCurrentMatchup(data.matchup);
      setVotersWhoVoted([]);
      setHasVoted(false);
    };

    const onVoteCast = (data: VoteCastEvent) => {
      setVotersWhoVoted(data.votersWhoVoted);
      // Check if current player has voted
      if (data.voterId === currentPlayerId) {
        setHasVoted(true);
      }
    };

    const onNextMatchup = (data: NextMatchupEvent) => {
      setCurrentMatchup(data.matchup);
      setVotersWhoVoted([]);
      setHasVoted(false);
    };

    const onMatchupResult = (data: MatchupResultEvent) => {
      setLeaderboard(data.leaderboard);
      setRecentScoreChanges(data.scoreChanges);

      // Clear recent score changes after animation time
      setTimeout(() => {
        setRecentScoreChanges([]);
      }, 3000);
    };

    const onVotingComplete = (data: VotingCompleteEvent) => {
      if (data.gameState) {
        setGameState(data.gameState);
      }
      setLeaderboard(data.leaderboard);
    };

    const onRoundResults = (data: RoundResultsEvent) => {
      setGameState(data.gameState);
      setLeaderboard(data.leaderboard);
      setRoundWinner(data.roundWinner);
      setResultsTheme(data.theme);
      setResultsRoundNumber(data.roundNumber);
      setResultsTotalRounds(data.totalRounds);
      setPhase('results');
    };

    const onFinalResults = (data: FinalResultsEvent) => {
      setGameState(data.gameState);
      setLeaderboard(data.leaderboard);
      setChaosAwards(data.chaosAwards ?? []);
      setPhase('final');
    };

    const onGameReset = (data: GameResetEvent) => {
      setRoom(data.room);
      setGameState(null);
      setPhase('lobby');
      setHasSubmittedPrompt(false);
      setRoundWinner(null);
      setLeaderboard([]);
      setChaosAwards([]);
    };

    const onGameEnded = (data: GameEndedEvent) => {
      setRoom(data.room);
      setGameState(null);
      setPhase('lobby');
      setHasSubmittedPrompt(false);
      setRoundWinner(null);
      setLeaderboard([]);
      setChaosAwards([]);
      setError(data.reason);
    };

    const onIncomingSabotage = (data: { attackerName: string; sabotageType?: string }) => {
      setIncomingSabotage(data);
      // Increment sabotages against current player
      setSabotagesAgainstMe(prev => prev + 1);
      // Clear the sabotage warning after a few seconds
      setTimeout(() => {
        setIncomingSabotage(null);
      }, 5000);
    };

    const onSabotageUsed = (data: { attackerId: string; victimId: string; victimName: string }) => {
      // Track armed sabotages for UI display
      setArmedSabotages(prev => [...prev, { victimId: data.victimId, attackerId: data.attackerId }]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('player-joined', onPlayerJoined);
    socket.on('player-left', onPlayerLeft);
    socket.on('room-updated', onRoomUpdated);
    socket.on('game-started', onGameStarted);
    socket.on('prompt-submitted', onPromptSubmitted);
    socket.on('generating-started', onGeneratingStarted);
    socket.on('image-generated', onImageGenerated);
    socket.on('generating-complete', onGeneratingComplete);
    socket.on('voting-started', onVotingStarted);
    socket.on('vote-cast', onVoteCast);
    socket.on('next-matchup', onNextMatchup);
    socket.on('matchup-result', onMatchupResult);
    socket.on('voting-complete', onVotingComplete);
    socket.on('round-results', onRoundResults);
    socket.on('final-results', onFinalResults);
    socket.on('game-reset', onGameReset);
    socket.on('game-ended', onGameEnded);
    socket.on('incoming-sabotage', onIncomingSabotage);
    socket.on('sabotage-used', onSabotageUsed);

    // Check if already connected
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('player-joined', onPlayerJoined);
      socket.off('player-left', onPlayerLeft);
      socket.off('room-updated', onRoomUpdated);
      socket.off('game-started', onGameStarted);
      socket.off('prompt-submitted', onPromptSubmitted);
      socket.off('generating-started', onGeneratingStarted);
      socket.off('image-generated', onImageGenerated);
      socket.off('generating-complete', onGeneratingComplete);
      socket.off('voting-started', onVotingStarted);
      socket.off('vote-cast', onVoteCast);
      socket.off('next-matchup', onNextMatchup);
      socket.off('matchup-result', onMatchupResult);
      socket.off('voting-complete', onVotingComplete);
      socket.off('round-results', onRoundResults);
      socket.off('final-results', onFinalResults);
      socket.off('game-reset', onGameReset);
      socket.off('game-ended', onGameEnded);
      socket.off('incoming-sabotage', onIncomingSabotage);
      socket.off('sabotage-used', onSabotageUsed);
    };
  }, [currentPlayerId]);

  // Play phase transition sound when entering game phases
  useEffect(() => {
    const gamePhases: GamePhase[] = ['prompting', 'generating', 'voting', 'results', 'final'];
    const isEnteringGamePhase = gamePhases.includes(phase);
    const wasInDifferentPhase = prevPhaseRef.current !== phase;

    if (isEnteringGamePhase && wasInDifferentPhase) {
      playPhaseTransition();
    }

    prevPhaseRef.current = phase;
  }, [phase]);

  const handleCreateRoom = useCallback((playerName: string) => {
    setError(null);
    const name = discordUser?.global_name ?? discordUser?.username ?? playerName;

    socket.emit('create-room', { playerName: name }, (response: RoomResponse) => {
      if (response.success && response.room) {
        setRoom(response.room);
        setPhase('lobby');
      } else {
        setError(response.error ?? 'Failed to create room');
      }
    });
  }, [discordUser]);

  const handleJoinRoom = useCallback((code: string, playerName: string) => {
    setError(null);
    const name = discordUser?.global_name ?? discordUser?.username ?? playerName;

    socket.emit('join-room', { code, playerName: name }, (response: RoomResponse) => {
      if (response.success && response.room) {
        setRoom(response.room);
        setPhase('lobby');
      } else {
        setError(response.error ?? 'Failed to join room');
      }
    });
  }, [discordUser]);

  const handleLeaveRoom = useCallback(() => {
    socket.emit('leave-room', () => {
      setRoom(null);
      setGameState(null);
      setPhase('home');
      setHasSubmittedPrompt(false);
    });
  }, []);

  const handleToggleReady = useCallback(() => {
    if (!room) return;
    const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
    const newReady = !(currentPlayer?.isReady ?? false);
    socket.emit('player-ready', { isReady: newReady });
  }, [room, currentPlayerId]);

  const handleStartGame = useCallback(() => {
    socket.emit('start-game', (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error ?? 'Failed to start game');
      }
    });
  }, []);

  const handleSetCategory = useCallback((category: CategorySelection) => {
    socket.emit('set-category', { category });
  }, []);

  const handleSetModelProvider = useCallback((modelProvider: ModelProvider) => {
    socket.emit('set-model-provider', { modelProvider });
  }, []);

  const handleSetChaosMode = useCallback((chaosMode: boolean) => {
    socket.emit('set-chaos-mode', { chaosMode });
  }, []);

  const handleAvatarChange = useCallback((avatar: string | null) => {
    if (avatar) {
      socket.emit('update-avatar', { avatar });
    }
  }, []);

  // Get Discord avatar URL if we have a Discord user
  const getDiscordAvatarUrl = useCallback((): string | null => {
    if (!discordUser) return null;
    if (!discordUser.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
  }, [discordUser]);

  // Initialize audio on first user interaction
  const handleInitAudio = useCallback(() => {
    if (audioInitializedRef.current) return;
    audioInitializedRef.current = true;
    void audioEngine.init();
  }, []);

  // Toggle mute state
  const handleToggleMute = useCallback(() => {
    const newMuted = audioEngine.toggleMute();
    setAudioMuted(newMuted);
  }, []);

  const handleSubmitPrompt = useCallback((prompt: string) => {
    socket.emit('submit-prompt', { prompt }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        setHasSubmittedPrompt(true);
      } else {
        setError(response.error ?? 'Failed to submit prompt');
      }
    });
  }, []);

  const handleCastVote = useCallback((votedForPlayerId: string) => {
    socket.emit('cast-vote', { votedForPlayerId }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error ?? 'Failed to cast vote');
      }
    });
  }, []);

  const handleUseSabotage = useCallback((victimId: string, sabotageType: string = 'word_injection') => {
    socket.emit('use-sabotage', { victimId, sabotageType }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error ?? 'Failed to use sabotage');
      }
    });
  }, []);

  const handleNextRound = useCallback(() => {
    socket.emit('next-round', (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error ?? 'Failed to continue');
      }
      // Reset state for next round
      setHasSubmittedPrompt(false);
      setRoundWinner(null);
      // Clear armed sabotages for new round (sabotagesAgainstMe persists across rounds)
      setArmedSabotages([]);
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    socket.emit('play-again', (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error ?? 'Failed to restart game');
      }
    });
  }, []);

  const handleReturnHome = useCallback(() => {
    socket.emit('leave-room', () => {
      setRoom(null);
      setGameState(null);
      setPhase('home');
      setHasSubmittedPrompt(false);
      setLeaderboard([]);
      setRoundWinner(null);
    });
  }, []);

  // Mute button component
  const MuteButton = () => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggleMute();
      }}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border-2 border-prompt-purple bg-prompt-black/90 text-lg transition-all hover:bg-prompt-purple/20"
      aria-label={audioMuted ? 'Unmute' : 'Mute'}
    >
      {audioMuted ? '🔇' : '🔊'}
    </button>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompt-black" onClick={handleInitAudio}>
        <div className="text-prompt-purple text-xl">Loading...</div>
      </div>
    );
  }

  // Prompting phase
  if (phase === 'prompting' && gameState?.currentRound && room) {
    // Get current player's tokens from leaderboard or default to initial tokens (2)
    const currentPlayerTokens = leaderboard.find(e => e.playerId === currentPlayerId)?.tokens ?? 2;

    return (
      <div onClick={handleInitAudio}>
        <Prompting
          theme={gameState.currentRound.themeText}
          phaseEndTime={gameState.currentRound.phaseEndTime}
          hasSubmitted={hasSubmittedPrompt}
          submittedPlayerIds={gameState.currentRound.submittedPlayerIds}
          totalPlayers={room.players.length}
          onSubmitPrompt={handleSubmitPrompt}
          players={room.players}
          currentPlayerId={currentPlayerId}
          currentPlayerTokens={currentPlayerTokens}
          onUseSabotage={handleUseSabotage}
          incomingSabotage={incomingSabotage as { attackerName: string; sabotageType?: 'word_injection' | 'style_override' | 'photobomb' | 'prompt_swap' | 'mystery_box' } | null}
          armedSabotages={armedSabotages}
          sabotagesAgainstMe={sabotagesAgainstMe}
        />
        <MuteButton />
      </div>
    );
  }

  // Generating phase
  if (phase === 'generating') {
    return (
      <div onClick={handleInitAudio}>
        <Generating
          generatedCount={generatedCount}
          totalCount={totalImagesToGenerate}
          hasError={hasGenerationError}
        />
        <MuteButton />
      </div>
    );
  }

  // Voting phase
  if (phase === 'voting' && currentMatchup && room) {
    // Calculate eligible voters (everyone except those in the matchup)
    const eligibleVoters = room.players.filter(
      (p) => p.id !== currentMatchup.player1Id && p.id !== currentMatchup.player2Id
    );

    return (
      <div onClick={handleInitAudio}>
        <Voting
          matchup={currentMatchup}
          currentPlayerId={currentPlayerId}
          votersWhoVoted={votersWhoVoted}
          totalVoters={eligibleVoters.length}
          hasVoted={hasVoted}
          onCastVote={handleCastVote}
          leaderboard={leaderboard}
          recentScoreChanges={recentScoreChanges}
        />
        <MuteButton />
      </div>
    );
  }

  // Results phase
  if (phase === 'results' && room) {
    const isHost = room.players.find((p) => p.id === currentPlayerId)?.isHost ?? false;

    return (
      <div onClick={handleInitAudio}>
        <Results
          theme={resultsTheme}
          roundNumber={resultsRoundNumber}
          totalRounds={resultsTotalRounds}
          roundWinner={roundWinner}
          leaderboard={leaderboard}
          currentPlayerId={currentPlayerId}
          onContinue={handleNextRound}
          isHost={isHost}
        />
        <MuteButton />
      </div>
    );
  }

  // Final results phase
  if (phase === 'final' && room) {
    const isHost = room.players.find((p) => p.id === currentPlayerId)?.isHost ?? false;

    return (
      <div onClick={handleInitAudio}>
        <FinalResults
          leaderboard={leaderboard}
          currentPlayerId={currentPlayerId}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
          isHost={isHost}
          chaosAwards={chaosAwards}
        />
        <MuteButton />
      </div>
    );
  }

  // Lobby phase
  if (phase === 'lobby' && room) {
    return (
      <div onClick={handleInitAudio}>
        <Lobby
          room={room}
          currentPlayerId={currentPlayerId}
          discordAvatarUrl={getDiscordAvatarUrl()}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          onToggleReady={handleToggleReady}
          onSetCategory={handleSetCategory}
          onSetModelProvider={handleSetModelProvider}
          onSetChaosMode={handleSetChaosMode}
          onAvatarChange={handleAvatarChange}
        />
        <MuteButton />
      </div>
    );
  }

  // Home phase
  return (
    <div onClick={handleInitAudio}>
      <Home
        connected={connected}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        error={error}
      />
      <MuteButton />
    </div>
  );
}

export default App;
