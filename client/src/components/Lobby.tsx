import type { RoomState, Player, CategorySelection } from '../types';
import { CATEGORY_OPTIONS } from '../types';
import { AvatarSelector } from './AvatarSelector';

interface LobbyProps {
  room: RoomState;
  currentPlayerId: string;
  discordAvatarUrl: string | null;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onSetCategory: (category: CategorySelection) => void;
  onAvatarChange: (avatar: string | null) => void;
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
  discordAvatarUrl,
  onStartGame,
  onLeaveRoom,
  onToggleReady,
  onSetCategory,
  onAvatarChange,
}: LobbyProps) {
  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost ?? false;
  const isReady = currentPlayer?.isReady ?? false;
  const currentAvatar = currentPlayer?.avatar ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 text-center md:mb-10">
        <h1 className="mb-2 font-display text-xl text-prompt-purple md:text-3xl">
          PROMPT WARRIORS ASSEMBLE
        </h1>
        <p className="text-gray-400 md:text-lg">Gather your team and prepare for battle</p>
      </div>

      {/* Room Code */}
      <div className="holo-border mb-8 rounded-lg p-6 text-center md:mb-10 md:p-8">
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-prompt-pink md:text-sm">
          ▓▓▓ CLASSIFIED ▓▓▓
        </div>
        <div className="mb-1 text-sm text-gray-400 md:text-base">ROOM ACCESS CODE</div>
        <div className="font-mono text-5xl font-bold tracking-[0.3em] text-white md:text-7xl">
          {room.code}
        </div>
        <div className="mt-2 text-xs text-gray-500 md:text-sm">Share this code with your opponents</div>
      </div>

      {/* Avatar Selector */}
      <div className="mb-8 md:mb-10">
        <AvatarSelector
          discordAvatarUrl={discordAvatarUrl}
          currentAvatar={currentAvatar}
          onAvatarChange={onAvatarChange}
        />
      </div>

      {/* Category Selection (Host Only) */}
      {isHost && (
        <div className="mb-8 w-full max-w-md md:max-w-lg">
          <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-gray-400 md:text-base">
            ◆ THEME CATEGORY ◆
          </h2>
          <select
            value={room.category}
            onChange={(e) => onSetCategory(e.target.value as CategorySelection)}
            className="w-full rounded-lg border-2 border-prompt-purple bg-gray-900 px-4 py-3 text-white focus:border-prompt-pink focus:outline-none md:py-4 md:text-lg"
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
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-center md:px-6 md:py-3">
          <span className="text-xs text-gray-500 md:text-sm">Category: </span>
          <span className="text-sm font-semibold text-prompt-purple md:text-base">{room.category}</span>
        </div>
      )}

      {/* Player List */}
      <div className="mb-8 w-full max-w-md md:mb-10 md:max-w-2xl">
        <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-wider text-prompt-purple md:text-xl">
          ◆ REGISTERED COMBATANTS ◆
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {room.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
            />
          ))}
        </div>
        <div className="mt-3 text-center text-sm text-gray-500 md:mt-4 md:text-base">
          {room.players.length}/8 warriors enlisted
          {room.players.length < 2 && ' • Need at least 2 to battle'}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3 md:max-w-lg">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!room.canStart}
            className={`terminal-btn w-full rounded-lg px-6 py-4 text-lg font-bold transition-all md:py-5 md:text-xl ${
              room.canStart
                ? 'bg-prompt-purple text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25'
                : 'cursor-not-allowed bg-gray-800 text-gray-500'
            }`}
          >
            {room.canStart ? 'INITIATE PROMPT WARFARE' : 'WAITING FOR MORE WARRIORS...'}
          </button>
        ) : (
          <>
            <div className="rounded-lg border-2 border-gray-700 bg-gray-900 px-6 py-4 text-center md:py-5">
              <div className="text-lg font-bold text-gray-400 md:text-xl">
                {isReady ? '✓ READY FOR BATTLE' : 'Waiting for host to start...'}
              </div>
            </div>
            <button
              onClick={onToggleReady}
              className={`w-full rounded-lg px-6 py-3 font-bold transition-all md:py-4 md:text-lg ${
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
          className="w-full rounded-lg border-2 border-gray-700 bg-transparent px-6 py-3 font-bold text-gray-400 transition-all hover:border-red-500 hover:text-red-500 md:py-4 md:text-lg"
        >
          ABANDON MISSION
        </button>
      </div>
    </div>
  );
}
