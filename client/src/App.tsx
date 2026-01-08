import { useEffect, useState, useCallback } from 'react';
import { socket, connectSocket } from './socket';
import { setupDiscord, isInDiscord, type DiscordUser } from './discord';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Prompting } from './components/Prompting';
import { Generating } from './components/Generating';
import type { RoomState, GamePhase, Player, CategorySelection, GameState } from './types';

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
      // Phase will transition to voting in US-010
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
    };
  }, [currentPlayerId]);

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

  const handleSubmitPrompt = useCallback((prompt: string) => {
    socket.emit('submit-prompt', { prompt }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        setHasSubmittedPrompt(true);
      } else {
        setError(response.error ?? 'Failed to submit prompt');
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompt-black">
        <div className="text-prompt-purple text-xl">Loading...</div>
      </div>
    );
  }

  // Prompting phase
  if (phase === 'prompting' && gameState?.currentRound && room) {
    return (
      <Prompting
        theme={gameState.currentRound.themeText}
        phaseEndTime={gameState.currentRound.phaseEndTime}
        hasSubmitted={hasSubmittedPrompt}
        submittedPlayerIds={gameState.currentRound.submittedPlayerIds}
        totalPlayers={room.players.length}
        onSubmitPrompt={handleSubmitPrompt}
      />
    );
  }

  // Generating phase
  if (phase === 'generating') {
    return (
      <Generating
        generatedCount={generatedCount}
        totalCount={totalImagesToGenerate}
        hasError={hasGenerationError}
      />
    );
  }

  // Lobby phase
  if (phase === 'lobby' && room) {
    return (
      <Lobby
        room={room}
        currentPlayerId={currentPlayerId}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
        onToggleReady={handleToggleReady}
        onSetCategory={handleSetCategory}
      />
    );
  }

  // Home phase
  return (
    <Home
      connected={connected}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      error={error}
    />
  );
}

export default App;
