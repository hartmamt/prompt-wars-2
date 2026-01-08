import type { LeaderboardEntry } from '../types';

interface RoundWinner {
  playerId: string;
  playerName: string;
  prompt: string;
  imageBase64: string | null;
  votesReceived: number;
}

interface ResultsProps {
  theme: string;
  roundNumber: number;
  totalRounds: number;
  roundWinner: RoundWinner | null;
  leaderboard: LeaderboardEntry[];
  currentPlayerId: string;
  onContinue: () => void;
  isHost: boolean;
}

export function Results({
  theme,
  roundNumber,
  totalRounds,
  roundWinner,
  leaderboard,
  currentPlayerId,
  onContinue,
  isHost,
}: ResultsProps) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4">
      {/* Round header */}
      <div className="mb-6 text-center">
        <div className="text-sm font-bold uppercase tracking-widest text-prompt-pink">
          ROUND {roundNumber} OF {totalRounds}
        </div>
        <h1 className="mt-2 font-display text-2xl text-prompt-purple md:text-3xl">
          RESULTS
        </h1>
      </div>

      {/* Theme reveal */}
      <div className="mb-6 w-full max-w-2xl">
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
          THE THEME WAS
        </div>
        <div className="rounded-lg border-2 border-prompt-purple bg-prompt-purple/10 p-4 text-center">
          <p className="text-xl font-semibold text-white md:text-2xl">{theme}</p>
        </div>
      </div>

      {/* Winner showcase */}
      {roundWinner && (
        <div className="mb-6 w-full max-w-2xl">
          <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-prompt-green">
            ROUND CHAMPION
          </div>
          <div className="rounded-lg border-2 border-prompt-green bg-gray-900 p-4">
            {/* Winner name and votes */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <span className="text-xl font-bold text-prompt-green">
                  {roundWinner.playerName}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {roundWinner.votesReceived} votes
              </span>
            </div>

            {/* Winner image */}
            {roundWinner.imageBase64 && (
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src={roundWinner.imageBase64}
                  alt="Winning creation"
                  className="w-full"
                />
              </div>
            )}

            {/* Winner prompt */}
            <div className="rounded bg-gray-800 p-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                THE INCANTATION
              </div>
              <p className="font-mono text-sm text-white">"{roundWinner.prompt}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="mb-6 w-full max-w-md">
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-prompt-pink">
          STANDINGS
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                  entry.playerId === currentPlayerId
                    ? 'bg-prompt-purple/20 border border-prompt-purple'
                    : index === 0
                      ? 'bg-prompt-green/10 border border-prompt-green/30'
                      : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? 'bg-prompt-green text-black'
                        : index === 1
                          ? 'bg-gray-400 text-black'
                          : index === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-700 text-white'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <div>
                    <div className="font-semibold text-white">
                      {entry.playerName}
                      {entry.playerId === currentPlayerId && (
                        <span className="ml-2 text-xs text-prompt-purple">(YOU)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.roundWins} win{entry.roundWins !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-lg font-bold text-prompt-green">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md">
        {isHost ? (
          <button
            onClick={onContinue}
            className="w-full rounded-lg bg-prompt-purple px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25"
          >
            {roundNumber < totalRounds
              ? `⚡ BEGIN ROUND ${roundNumber + 1} ⚡`
              : '🏆 VIEW FINAL RESULTS 🏆'}
          </button>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-center">
            <p className="text-gray-400">
              Waiting for host to continue...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
