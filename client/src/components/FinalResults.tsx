import { useEffect, useRef, useState } from 'react';
import type { LeaderboardEntry, ChaosAward } from '../types';
import { playClick, playHover, playNavigate, playFinalVictory, playRoundLose } from '../sounds';

interface FinalResultsProps {
  leaderboard: LeaderboardEntry[];
  currentPlayerId: string;
  onPlayAgain: () => void;
  onReturnHome: () => void;
  isHost: boolean;
  chaosAwards?: ChaosAward[];
}

// Affectionate titles for different ranks
const TITLES: Record<number, string> = {
  1: 'SUPREME PROMPT OVERLORD',
  2: 'ALMOST HAD IT',
  3: 'BRONZE AGE ARTIST',
  4: 'PARTICIPATION TROPHY',
  5: 'MORAL SUPPORT',
  6: 'ALONG FOR THE RIDE',
  7: 'CREATIVE OBSERVER',
  8: 'FUTURE POTENTIAL',
};

function getTitle(rank: number): string {
  return TITLES[rank] ?? 'PROMPT WARRIOR';
}

export function FinalResults({
  leaderboard,
  currentPlayerId,
  onPlayAgain,
  onReturnHome,
  isHost,
  chaosAwards = [],
}: FinalResultsProps) {
  const winner = leaderboard[0];
  const others = leaderboard.slice(1);
  const hasPlayedSound = useRef(false);
  const [visibleAwards, setVisibleAwards] = useState<number[]>([]);

  // Play victory/lose sound on mount
  useEffect(() => {
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;

    if (winner?.playerId === currentPlayerId) {
      playFinalVictory();
    } else {
      playRoundLose();
    }
  }, [winner, currentPlayerId]);

  // Staggered reveal of chaos awards
  useEffect(() => {
    if (chaosAwards.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    chaosAwards.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleAwards(prev => [...prev, index]);
      }, 500 + index * 400); // Start at 500ms, 400ms between each
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [chaosAwards]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4 md:p-8">
      {/* Game Over Header */}
      <div className="mb-8 text-center md:mb-12">
        <div className="mb-2 text-sm font-bold uppercase tracking-widest text-prompt-pink md:text-base">
          GAME OVER
        </div>
        <h1 className="font-display text-2xl text-prompt-purple md:text-4xl">
          FINAL RESULTS
        </h1>
      </div>

      {/* Winner Celebration */}
      {winner && (
        <div className="mb-8 w-full max-w-lg md:mb-12 md:max-w-2xl">
          <div className="relative overflow-hidden rounded-xl border-4 border-prompt-green bg-gradient-to-b from-prompt-green/20 to-transparent p-6 md:p-10">
            {/* Confetti-like decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="animate-pulse absolute top-2 left-4 text-2xl">
                ✨
              </div>
              <div className="animate-pulse absolute top-4 right-6 text-2xl">
                🎉
              </div>
              <div className="animate-pulse absolute bottom-4 left-8 text-2xl">
                🏆
              </div>
              <div className="animate-pulse absolute bottom-2 right-4 text-2xl">
                ⭐
              </div>
            </div>

            {/* Winner content */}
            <div className="relative text-center">
              <div className="mb-2 text-6xl md:text-7xl">👑</div>
              {winner.playerAvatar ? (
                <img src={winner.playerAvatar} alt="" className="mx-auto mb-3 h-20 w-20 rounded-full border-4 border-prompt-green object-cover md:h-28 md:w-28" />
              ) : (
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-prompt-green bg-gray-700 text-3xl font-bold md:h-28 md:w-28 md:text-4xl">
                  {winner.playerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-prompt-green md:text-sm">
                {getTitle(1)}
              </div>
              <div className="mb-4 text-3xl font-bold text-white md:text-5xl">
                {winner.playerName}
                {winner.playerId === currentPlayerId && (
                  <span className="ml-2 text-lg text-prompt-purple md:text-xl">(YOU!)</span>
                )}
              </div>
              <div className="text-2xl font-bold text-prompt-green md:text-3xl">
                {winner.score.toLocaleString()} POINTS
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-sm text-gray-400 md:text-base">
                <span>{winner.roundWins} round win{winner.roundWins !== 1 ? 's' : ''}</span>
                <span className="text-prompt-pink">{winner.tokens} tokens</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other players */}
      <div className="mb-8 w-full max-w-md md:mb-12 md:max-w-4xl">
        <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-prompt-pink md:mb-4 md:text-sm">
          THE REST OF YOU
        </div>
        <div className="grid gap-2 md:grid-cols-2 md:gap-4">
          {others.map((entry) => (
            <div
              key={entry.playerId}
              className={`flex items-center justify-between rounded-lg border p-4 md:p-5 ${
                entry.playerId === currentPlayerId
                  ? 'border-prompt-purple bg-prompt-purple/20'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold md:h-12 md:w-12 md:text-xl ${
                    entry.rank === 2
                      ? 'bg-gray-400 text-black'
                      : entry.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-700 text-white'
                  }`}
                >
                  {entry.rank}
                </span>
                {entry.playerAvatar ? (
                  <img src={entry.playerAvatar} alt="" className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-lg font-bold md:h-12 md:w-12">
                    {entry.playerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white md:text-lg">
                    {entry.playerName}
                    {entry.playerId === currentPlayerId && (
                      <span className="ml-2 text-xs text-prompt-purple">(YOU)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 md:text-sm">{getTitle(entry.rank)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg font-bold text-prompt-green md:text-xl">
                  {entry.score.toLocaleString()}
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-gray-500 md:text-sm">
                  <span>{entry.roundWins} win{entry.roundWins !== 1 ? 's' : ''}</span>
                  <span className="text-prompt-pink">{entry.tokens}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chaos Awards */}
      {chaosAwards.length > 0 && (
        <div className="mb-8 w-full max-w-md md:mb-12 md:max-w-4xl">
          <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-red-500 md:mb-4 md:text-sm">
            💀 CHAOS AWARDS 💀
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {chaosAwards.map((award, index) => (
              <div
                key={`${award.type}-${award.playerId}`}
                className={`transform rounded-lg border-2 border-red-700 bg-gradient-to-br from-red-900/30 to-gray-900 p-4 transition-all duration-500 md:p-5 ${
                  visibleAwards.includes(index)
                    ? 'translate-y-0 opacity-100 scale-100'
                    : 'translate-y-4 opacity-0 scale-95'
                } ${award.playerId === currentPlayerId ? 'ring-2 ring-prompt-purple' : ''}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="text-4xl md:text-5xl">{award.emoji}</div>
                  <div className="flex-1">
                    <div className="mb-1 text-sm font-bold uppercase tracking-wide text-red-400 md:text-base">
                      {award.title}
                    </div>
                    <div className="flex items-center gap-2">
                      {award.playerAvatar ? (
                        <img
                          src={award.playerAvatar}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover md:h-8 md:w-8"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold md:h-8 md:w-8">
                          {award.playerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-white md:text-lg">
                        {award.playerName}
                        {award.playerId === currentPlayerId && (
                          <span className="ml-2 text-xs text-prompt-purple">(YOU)</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400 md:text-sm">
                      {award.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex w-full max-w-md flex-col gap-3 md:max-w-lg">
        {isHost ? (
          <>
            <button
              onClick={() => { void playClick(); playNavigate(); onPlayAgain(); }}
              onMouseEnter={() => void playHover()}
              className="w-full rounded-lg bg-prompt-purple px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25 md:py-5 md:text-xl"
            >
              ⚔️ PLAY AGAIN ⚔️
            </button>
            <button
              onClick={() => { void playClick(); playNavigate(); onReturnHome(); }}
              onMouseEnter={() => void playHover()}
              className="w-full rounded-lg border-2 border-gray-600 bg-transparent px-6 py-3 font-semibold text-gray-400 transition-all hover:border-gray-500 hover:text-gray-300 md:py-4 md:text-lg"
            >
              Return to Home
            </button>
          </>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-center md:p-6">
            <p className="text-gray-400 md:text-lg">
              Waiting for host to choose next action...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
