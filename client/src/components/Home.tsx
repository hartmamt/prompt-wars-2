import { useState, useEffect, useRef } from 'react';
import { playClick, playHover, playNavigate, playError } from '../sounds';

interface HomeProps {
  connected: boolean;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  error: string | null;
}

export function Home({ connected, onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const prevError = useRef<string | null>(null);

  // Play error sound when error appears
  useEffect(() => {
    if (error && error !== prevError.current) {
      playError();
    }
    prevError.current = error;
  }, [error]);

  const handleCreate = () => {
    if (playerName.trim()) {
      void playClick();
      onCreateRoom(playerName.trim());
    }
  };

  const handleJoin = () => {
    if (playerName.trim() && roomCode.trim()) {
      void playClick();
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  const handleModeChange = (newMode: 'menu' | 'create' | 'join') => {
    void playClick();
    playNavigate();
    setMode(newMode);
  };

  if (mode === 'menu') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-prompt-black p-4">
        <h1 className="mb-2 font-display text-2xl text-prompt-purple md:text-4xl" data-text="PROMPT WARS">
          PROMPT WARS
        </h1>
        <p className="mb-8 text-sm text-gray-500">THE ULTIMATE AI IMAGE BATTLE</p>

        <div className="mb-4 flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${connected ? 'bg-prompt-green animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-sm text-gray-400">
            {connected ? 'NEURAL LINK ESTABLISHED' : 'THE AI HAS ABANDONED US'}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 px-4 py-2 text-red-400">
            {error}
          </div>
        )}

        <div className="w-full max-w-md space-y-4 px-4">
          <button
            onClick={() => handleModeChange('create')}
            onMouseEnter={() => void playHover()}
            disabled={!connected}
            className="w-full rounded-lg bg-prompt-purple px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⚔️ START NEW BATTLE ⚔️
          </button>
          <button
            onClick={() => handleModeChange('join')}
            onMouseEnter={() => void playHover()}
            disabled={!connected}
            className="w-full rounded-lg border-2 border-prompt-pink bg-transparent px-6 py-4 text-lg font-bold text-prompt-pink transition-all hover:bg-prompt-pink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            🎯 JOIN THE FRAY 🎯
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-prompt-black p-4">
      <h1 className="mb-8 text-3xl font-bold text-prompt-purple md:text-4xl">
        {mode === 'create' ? '⚡ SUMMON THE ARENA ⚡' : '🎯 INFILTRATE THE BATTLE 🎯'}
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500 bg-red-500/10 px-4 py-2 text-red-400">
          {error}
        </div>
      )}

      <div className="w-full max-w-md space-y-4 px-4">
        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-400">
            ◆ WARRIOR NAME ◆
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Choose wisely, champion..."
            maxLength={20}
            className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-prompt-purple focus:outline-none"
          />
        </div>

        {mode === 'join' && (
          <div>
            <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-gray-400">
              ◆ SECRET ACCESS CODE ◆
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="?????"
              maxLength={4}
              className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] text-white placeholder-gray-500 focus:border-prompt-purple focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          onMouseEnter={() => void playHover()}
          disabled={!playerName.trim() || (mode === 'join' && roomCode.length !== 4)}
          className="w-full rounded-lg bg-prompt-purple px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === 'create' ? '⚔️ FORGE THE BATTLEFIELD ⚔️' : '💥 BREACH THE PERIMETER 💥'}
        </button>

        <button
          onClick={() => handleModeChange('menu')}
          onMouseEnter={() => void playHover()}
          className="w-full rounded-lg border-2 border-gray-700 bg-transparent px-6 py-3 font-bold text-gray-400 transition-all hover:border-gray-500 hover:text-gray-300"
        >
          ← RETREAT
        </button>
      </div>
    </div>
  );
}
