import type { RoomState, Player, CategorySelection } from '../types';
import { CATEGORY_OPTIONS } from '../types';

interface LobbyProps {
  room: RoomState;
  currentPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onSetCategory: (category: CategorySelection) => void;
}

function PlayerCard({ player, isCurrentPlayer }: { player: Player; isCurrentPlayer: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-all ${
        player.isHost
          ? 'border-prompt-pink bg-prompt-pink/10'
          : player.isReady
          ? 'border-prompt-green bg-prompt-green/10'
          : 'border-gray-700 bg-gray-900'
      } ${isCurrentPlayer ? 'ring-2 ring-prompt-purple ring-offset-2 ring-offset-prompt-black' : ''}`}
    >
      <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
        {player.avatar ? (
          <img src={player.avatar} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          player.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{player.name}</span>
          {isCurrentPlayer && <span className="text-xs text-gray-500">(you)</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {player.isHost && (
            <span className="rounded bg-prompt-pink/20 px-2 py-0.5 text-xs font-bold text-prompt-pink">
              HOST
            </span>
          )}
          {player.isReady && !player.isHost && (
            <span className="rounded bg-prompt-green/20 px-2 py-0.5 text-xs font-bold text-prompt-green">
              READY
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Lobby({
  room,
  currentPlayerId,
  onStartGame,
  onLeaveRoom,
  onToggleReady,
  onSetCategory,
}: LobbyProps) {
  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const isReady = currentPlayer?.isReady ?? false;

  return (
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-prompt-purple md:text-4xl">
          PROMPT WARRIORS ASSEMBLE
        </h1>
        <p className="text-gray-400">Gather your team and prepare for battle</p>
      </div>

      {/* Room Code */}
      <div className="mb-8 rounded-lg border-2 border-dashed border-prompt-pink bg-prompt-pink/5 p-6 text-center">
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-prompt-pink">
          ▓▓▓ CLASSIFIED ▓▓▓
        </div>
        <div className="mb-1 text-sm text-gray-400">ROOM ACCESS CODE</div>
        <div className="font-mono text-5xl font-bold tracking-[0.3em] text-white md:text-6xl">
          {room.code}
        </div>
        <div className="mt-2 text-xs text-gray-500">Share this code with your opponents</div>
      </div>

      {/* Category Selection (Host Only) */}
      {isHost && (
        <div className="mb-8 w-full max-w-md">
          <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-gray-400">
            ◆ THEME CATEGORY ◆
          </h2>
          <select
            value={room.category}
            onChange={(e) => onSetCategory(e.target.value as CategorySelection)}
            className="w-full rounded-lg border-2 border-prompt-purple bg-gray-900 px-4 py-3 text-white focus:border-prompt-pink focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Display (Non-Host) */}
      {!isHost && (
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-center">
          <span className="text-xs text-gray-500">Category: </span>
          <span className="text-sm font-semibold text-prompt-purple">{room.category}</span>
        </div>
      )}

      {/* Player List */}
      <div className="mb-8 w-full max-w-md">
        <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-wider text-prompt-purple">
          ◆ REGISTERED COMBATANTS ◆
        </h2>
        <div className="space-y-3">
          {room.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
            />
          ))}
        </div>
        <div className="mt-3 text-center text-sm text-gray-500">
          {room.players.length}/8 warriors enlisted
          {room.players.length < 2 && ' • Need at least 2 to battle'}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!room.canStart}
            className={`w-full rounded-lg px-6 py-4 text-lg font-bold transition-all ${
              room.canStart
                ? 'bg-prompt-purple text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25'
                : 'cursor-not-allowed bg-gray-800 text-gray-500'
            }`}
          >
            {room.canStart ? '⚔️ INITIATE PROMPT WARFARE ⚔️' : 'WAITING FOR MORE WARRIORS...'}
          </button>
        ) : (
          <>
            <div className="rounded-lg border-2 border-gray-700 bg-gray-900 px-6 py-4 text-center">
              <div className="text-lg font-bold text-gray-400">
                {isReady ? '✓ READY FOR BATTLE' : 'Waiting for host to start...'}
              </div>
            </div>
            <button
              onClick={onToggleReady}
              className={`w-full rounded-lg px-6 py-3 font-bold transition-all ${
                isReady
                  ? 'border-2 border-prompt-green bg-transparent text-prompt-green hover:bg-prompt-green hover:text-white'
                  : 'bg-prompt-green text-white hover:bg-green-600'
              }`}
            >
              {isReady ? 'CANCEL READY' : 'READY UP'}
            </button>
          </>
        )}

        <button
          onClick={onLeaveRoom}
          className="w-full rounded-lg border-2 border-gray-700 bg-transparent px-6 py-3 font-bold text-gray-400 transition-all hover:border-red-500 hover:text-red-500"
        >
          ABANDON MISSION
        </button>
      </div>
    </div>
  );
}
