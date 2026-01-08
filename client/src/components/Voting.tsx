import { useState, useEffect, useCallback, useRef } from 'react';
import type { LeaderboardEntry, MatchupData, ScoreChange } from '../types';
import { playClick, playHover, playCountdownTick, playVsSting, playVoteCast } from '../sounds';

interface VotingProps {
  matchup: MatchupData;
  currentPlayerId: string;
  votersWhoVoted: string[];
  totalVoters: number;
  hasVoted: boolean;
  onCastVote: (votedForPlayerId: string) => void;
  leaderboard: LeaderboardEntry[];
  recentScoreChanges: ScoreChange[];
}

export function Voting({
  matchup,
  currentPlayerId,
  votersWhoVoted,
  totalVoters,
  hasVoted,
  onCastVote,
  leaderboard,
  recentScoreChanges,
}: VotingProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const prevTimeLeftRef = useRef(60);
  const playedVsStingRef = useRef<number | null>(null);

  // Calculate time left
  useEffect(() => {
    const endTime = new Date(matchup.endTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      // Play countdown tick when time decreases (last 15 seconds for voting)
      if (remaining < prevTimeLeftRef.current && remaining > 0 && remaining <= 15) {
        playCountdownTick(remaining);
      }
      prevTimeLeftRef.current = remaining;

      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [matchup.endTime]);

  // Reset state and play VS sting when matchup changes
  useEffect(() => {
    setSelectedVote(null);
    prevTimeLeftRef.current = 60;

    // Play VS sting only once per matchup
    if (playedVsStingRef.current !== matchup.matchupIndex) {
      playedVsStingRef.current = matchup.matchupIndex;
      playVsSting();
    }
  }, [matchup.matchupIndex]);

  const handleVote = useCallback((playerId: string) => {
    if (hasVoted || selectedVote) return;
    if (playerId === currentPlayerId) return;

    void playClick();
    playVoteCast();
    setSelectedVote(playerId);
    onCastVote(playerId);
  }, [hasVoted, selectedVote, currentPlayerId, onCastVote]);

  const isLowTime = timeLeft <= 10;
  const isInMatchup = currentPlayerId === matchup.player1Id || currentPlayerId === matchup.player2Id;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-prompt-black p-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-prompt-pink">
          MATCHUP {matchup.matchupIndex + 1} OF {matchup.totalMatchups}
        </div>
        <div
          className={`font-mono text-4xl font-bold transition-colors md:text-5xl ${
            isLowTime ? 'animate-pulse text-red-500' : 'text-prompt-purple'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* VS Banner */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-3 rounded-lg border-2 border-prompt-pink bg-prompt-pink/20 px-6 py-2">
          <div className="flex items-center gap-2">
            {matchup.player1Avatar ? (
              <img src={matchup.player1Avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-bold">
                {matchup.player1Name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xl font-bold text-white md:text-2xl">{matchup.player1Name}</span>
          </div>
          <span className="text-2xl">⚔️</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white md:text-2xl">{matchup.player2Name}</span>
            {matchup.player2Avatar ? (
              <img src={matchup.player2Avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-bold">
                {matchup.player2Name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images Container - Side by side on desktop */}
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-stretch">
        {/* Player 1 Image */}
        <div className="flex flex-1 flex-col">
          <div
            className={`relative flex-1 overflow-hidden rounded-lg border-4 transition-all ${
              selectedVote === matchup.player1Id
                ? 'border-prompt-green shadow-lg shadow-prompt-green/25'
                : hasVoted
                  ? 'border-gray-700 opacity-75'
                  : 'border-gray-700 hover:border-prompt-purple'
            }`}
          >
            {matchup.player1Image ? (
              <img
                src={matchup.player1Image}
                alt={`${matchup.player1Name}'s creation`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center bg-gray-900 text-gray-500">
                THE MACHINE SPIRIT REJECTED THIS ONE
              </div>
            )}

            {/* Selected indicator */}
            {selectedVote === matchup.player1Id && (
              <div className="absolute inset-0 flex items-center justify-center bg-prompt-green/20">
                <span className="rounded-full bg-prompt-green px-4 py-2 text-xl font-bold text-black">
                  ✓ YOUR VOTE
                </span>
              </div>
            )}
          </div>

          {/* Vote button for player 1 */}
          <button
            onClick={() => handleVote(matchup.player1Id)}
            onMouseEnter={() => void playHover()}
            disabled={hasVoted || isInMatchup || !matchup.player1Image}
            className={`mt-2 w-full rounded-lg px-4 py-3 text-lg font-bold transition-all ${
              hasVoted || isInMatchup || !matchup.player1Image
                ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                : 'bg-prompt-purple text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {isInMatchup && matchup.player1Id === currentPlayerId
              ? 'YOUR IMAGE'
              : hasVoted
                ? selectedVote === matchup.player1Id
                  ? '✓ VOTED'
                  : 'VOTE CAST'
                : `VOTE ${matchup.player1Name.toUpperCase()}`}
          </button>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center py-2 md:px-4 md:py-0">
          <div className="text-3xl font-bold text-prompt-pink">VS</div>
        </div>

        {/* Player 2 Image */}
        <div className="flex flex-1 flex-col">
          <div
            className={`relative flex-1 overflow-hidden rounded-lg border-4 transition-all ${
              selectedVote === matchup.player2Id
                ? 'border-prompt-green shadow-lg shadow-prompt-green/25'
                : hasVoted
                  ? 'border-gray-700 opacity-75'
                  : 'border-gray-700 hover:border-prompt-purple'
            }`}
          >
            {matchup.player2Image ? (
              <img
                src={matchup.player2Image}
                alt={`${matchup.player2Name}'s creation`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center bg-gray-900 text-gray-500">
                THE MACHINE SPIRIT REJECTED THIS ONE
              </div>
            )}

            {/* Selected indicator */}
            {selectedVote === matchup.player2Id && (
              <div className="absolute inset-0 flex items-center justify-center bg-prompt-green/20">
                <span className="rounded-full bg-prompt-green px-4 py-2 text-xl font-bold text-black">
                  ✓ YOUR VOTE
                </span>
              </div>
            )}
          </div>

          {/* Vote button for player 2 */}
          <button
            onClick={() => handleVote(matchup.player2Id)}
            onMouseEnter={() => void playHover()}
            disabled={hasVoted || isInMatchup || !matchup.player2Image}
            className={`mt-2 w-full rounded-lg px-4 py-3 text-lg font-bold transition-all ${
              hasVoted || isInMatchup || !matchup.player2Image
                ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                : 'bg-prompt-purple text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {isInMatchup && matchup.player2Id === currentPlayerId
              ? 'YOUR IMAGE'
              : hasVoted
                ? selectedVote === matchup.player2Id
                  ? '✓ VOTED'
                  : 'VOTE CAST'
                : `VOTE ${matchup.player2Name.toUpperCase()}`}
          </button>
        </div>
      </div>

      {/* Cannot vote message */}
      {isInMatchup && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            SPECTATE MODE: Your fate is in the hands of the council
          </p>
        </div>
      )}

      {/* Voting progress */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-500">
          VOTES CAST: {votersWhoVoted.length} / {totalVoters}
        </div>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: totalVoters }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full transition-colors ${
                i < votersWhoVoted.length ? 'bg-prompt-green' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Score changes animation */}
      {recentScoreChanges.length > 0 && (
        <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
          {recentScoreChanges.map((change, index) => {
            const playerEntry = leaderboard.find((e) => e.playerId === change.playerId);
            return (
              <div
                key={`${change.playerId}-${index}`}
                className="animate-bounce rounded-lg bg-prompt-green px-4 py-2 text-black shadow-lg"
              >
                <div className="font-bold">+{change.pointsAdded}</div>
                <div className="text-xs">{playerEntry?.playerName ?? 'Player'}</div>
                <div className="text-xs opacity-75">{change.reason}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mx-auto mt-4 w-full max-w-md rounded-lg border border-gray-700 bg-gray-900/50 p-4 md:max-w-2xl md:p-6">
          <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-prompt-pink md:mb-3 md:text-sm">
            LEADERBOARD
          </div>
          <div className="grid gap-1 md:grid-cols-2 md:gap-2">
            {leaderboard.slice(0, 5).map((entry) => (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between rounded px-2 py-1 md:px-3 md:py-2 ${
                  entry.playerId === currentPlayerId ? 'bg-prompt-purple/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-sm text-gray-500 md:text-base">#{entry.rank}</span>
                  {entry.playerAvatar ? (
                    <img src={entry.playerAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold">
                      {entry.playerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-white md:text-base">{entry.playerName}</span>
                </div>
                <span className="font-mono text-sm font-bold text-prompt-green md:text-base">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
