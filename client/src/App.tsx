import { useEffect, useState, useCallback } from 'react';
import { socket, connectSocket } from './socket';
import { setupDiscord, isInDiscord, type DiscordUser } from './discord';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import type { RoomState, GamePhase, Player, CategorySelection } from './types';

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

function App() {
  const [connected, setConnected] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<GamePhase>('home');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setPhase('home');
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('player-joined', onPlayerJoined);
    socket.on('player-left', onPlayerLeft);
    socket.on('room-updated', onRoomUpdated);

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
    };
  }, []);

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
      setPhase('home');
    });
  }, []);

  const handleToggleReady = useCallback(() => {
    if (!room) return;
    const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
    const newReady = !(currentPlayer?.isReady ?? false);
    socket.emit('player-ready', { isReady: newReady });
  }, [room, currentPlayerId]);

  const handleStartGame = useCallback(() => {
    // TODO: Implement game start in US-014
    console.log('Start game');
  }, []);

  const handleSetCategory = useCallback((category: CategorySelection) => {
    socket.emit('set-category', { category });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-prompt-black">
        <div className="text-prompt-purple text-xl">Loading...</div>
      </div>
    );
  }

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
