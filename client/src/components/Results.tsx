import type { LeaderboardEntry } from '../types';
import { playClick, playHover, playNavigate } from '../sounds';

interface RoundWinner {
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
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
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4 md:p-8">
      {/* Round header */}
      <div className="mb-6 text-center md:mb-8">
        <div className="text-sm font-bold uppercase tracking-widest text-prompt-pink">
          ROUND {roundNumber} OF {totalRounds}
        </div>
        <h1 className="mt-2 font-display text-2xl text-prompt-purple md:text-3xl">
          RESULTS
        </h1>
      </div>

      {/* Theme reveal */}
      <div className="mb-6 w-full max-w-4xl md:mb-8">
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
          THE THEME WAS
        </div>
        <div className="rounded-lg border-2 border-prompt-purple bg-prompt-purple/10 p-4 text-center md:p-6">
          <p className="text-xl font-semibold text-white md:text-3xl">{theme}</p>
        </div>
      </div>

      {/* Main content - side by side on desktop */}
      <div className="mb-6 grid w-full max-w-6xl gap-6 md:mb-8 md:grid-cols-2 md:gap-8">
        {/* Winner showcase */}
        {roundWinner && (
          <div className="w-full">
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-prompt-green">
              ROUND CHAMPION
            </div>
            <div className="rounded-lg border-2 border-prompt-green bg-gray-900 p-4 md:p-6">
              {/* Winner name and votes */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-2xl md:text-3xl">👑</span>
                  {roundWinner.playerAvatar ? (
                    <img src={roundWinner.playerAvatar} alt="" className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-lg font-bold md:h-12 md:w-12">
                      {roundWinner.playerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xl font-bold text-prompt-green md:text-2xl">
                    {roundWinner.playerName}
                  </span>
                </div>
                <span className="text-sm text-gray-400 md:text-base">
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
              <div className="rounded bg-gray-800 p-3 md:p-4">
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                  THE INCANTATION
                </div>
                <p className="font-mono text-sm text-white md:text-base">"{roundWinner.prompt}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="w-full">
          <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-prompt-pink">
            STANDINGS
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 md:p-6">
            <div className="space-y-2 md:space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.playerId}
                  className={`flex items-center justify-between rounded-lg p-3 transition-colors md:p-4 ${
                    entry.playerId === currentPlayerId
                      ? 'bg-prompt-purple/20 border border-prompt-purple'
                      : index === 0
                        ? 'bg-prompt-green/10 border border-prompt-green/30'
                        : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold md:h-10 md:w-10 md:text-base ${
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
                    {entry.playerAvatar ? (
                      <img src={entry.playerAvatar} alt="" className="h-8 w-8 rounded-full object-cover md:h-10 md:w-10" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-bold md:h-10 md:w-10">
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
                      <div className="text-xs text-gray-500 md:text-sm">
                        {entry.roundWins} win{entry.roundWins !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-lg font-bold text-prompt-green md:text-xl">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md md:max-w-lg">
        {isHost ? (
          <button
            onClick={() => { void playClick(); playNavigate(); onContinue(); }}
            onMouseEnter={() => void playHover()}
            className="terminal-btn w-full rounded-lg bg-prompt-purple px-6 py-4 text-lg font-bold text-white transition-all hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25 md:py-5 md:text-xl"
          >
            {roundNumber < totalRounds
              ? `BEGIN ROUND ${roundNumber + 1}`
              : 'VIEW FINAL RESULTS'}
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
