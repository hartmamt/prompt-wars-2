import { useState, useEffect, useCallback, useRef } from 'react';
import { playClick, playHover, playCountdownTick, playThemeReveal, playPromptSubmit } from '../sounds';
import type { Player } from '../types';

interface PromptingProps {
  theme: string;
  phaseEndTime: string;
  hasSubmitted: boolean;
  submittedPlayerIds: string[];
  totalPlayers: number;
  onSubmitPrompt: (prompt: string) => void;
  players: Player[];
  currentPlayerId: string;
  currentPlayerTokens: number;
  onUseSabotage: (victimId: string) => void;
  incomingSabotage: { attackerName: string } | null;
}

const PROMPT_MAX_LENGTH = 200;
const SABOTAGE_COST = 2;

export function Prompting({
  theme,
  phaseEndTime,
  hasSubmitted,
  submittedPlayerIds,
  totalPlayers,
  onSubmitPrompt,
  players,
  currentPlayerId,
  currentPlayerTokens,
  onUseSabotage,
  incomingSabotage,
}: PromptingProps) {
  const [prompt, setPrompt] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);
  const prevTimeLeftRef = useRef(90);
  const hasPlayedThemeReveal = useRef(false);
  const [showSabotagePanel, setShowSabotagePanel] = useState(false);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);

  // Play theme reveal sound on mount
  useEffect(() => {
    if (!hasPlayedThemeReveal.current) {
      hasPlayedThemeReveal.current = true;
      playThemeReveal();
    }
  }, []);

  // Calculate and update time left
  useEffect(() => {
    const endTime = new Date(phaseEndTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      // Play countdown tick when time decreases
      if (remaining < prevTimeLeftRef.current && remaining > 0 && remaining <= 30) {
        playCountdownTick(remaining);
      }
      prevTimeLeftRef.current = remaining;

      setTimeLeft(remaining);

      // Auto-submit when timer expires
      if (remaining === 0 && !hasSubmitted && prompt.trim()) {
        onSubmitPrompt(prompt.trim());
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [phaseEndTime, hasSubmitted, prompt, onSubmitPrompt]);

  const handleSubmit = useCallback(() => {
    if (prompt.trim() && !hasSubmitted) {
      void playClick();
      playPromptSubmit();
      onSubmitPrompt(prompt.trim());
    }
  }, [prompt, hasSubmitted, onSubmitPrompt]);

  const handleSabotage = useCallback(() => {
    if (selectedVictimId && currentPlayerTokens >= SABOTAGE_COST) {
      void playClick();
      onUseSabotage(selectedVictimId);
      setSelectedVictimId(null);
      setShowSabotagePanel(false);
    }
  }, [selectedVictimId, currentPlayerTokens, onUseSabotage]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 10;
  const canAffordSabotage = currentPlayerTokens >= SABOTAGE_COST;
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  return (
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4">
      {/* Incoming Sabotage Warning */}
      {incomingSabotage && (
        <div className="fixed left-0 right-0 top-0 z-50 animate-pulse border-b-4 border-red-500 bg-red-900/90 p-4 text-center">
          <div className="text-xl font-bold text-red-400">⚠️ INCOMING SABOTAGE ⚠️</div>
          <div className="text-sm text-red-300">
            {incomingSabotage.attackerName} has targeted you!
          </div>
        </div>
      )}

      {/* Timer */}
      <div className={`mb-6 text-center ${incomingSabotage ? 'mt-16' : ''}`}>
        <div
          className={`font-mono text-6xl font-bold transition-colors ${
            isLowTime ? 'animate-pulse text-red-500' : 'text-prompt-purple'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-gray-500">TIME REMAINING</div>
      </div>

      {/* Theme Display */}
      <div className="mb-8 w-full max-w-2xl">
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-prompt-pink">
          ◆ SECRET THEME ◆
        </div>
        <div className="rounded-lg border-2 border-prompt-purple bg-prompt-purple/10 p-6 text-center">
          <p className="text-xl font-semibold text-white md:text-2xl">{theme}</p>
        </div>
      </div>

      {/* Prompt Input */}
      {!hasSubmitted ? (
        <div className="mb-6 w-full max-w-2xl">
          <div className="mb-2 text-center text-sm font-bold uppercase tracking-wider text-gray-400">
            ◆ CRAFT YOUR INCANTATION ◆
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_MAX_LENGTH))}
            placeholder="Describe the image you want to generate..."
            maxLength={PROMPT_MAX_LENGTH}
            className="h-32 w-full resize-none rounded-lg border-2 border-gray-700 bg-gray-900 p-4 font-mono text-white placeholder-gray-500 focus:border-prompt-purple focus:outline-none"
          />
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-500">
              {prompt.length}/{PROMPT_MAX_LENGTH} characters
            </span>
            <span className="text-gray-500">
              Press submit or wait for timer
            </span>
          </div>

          <button
            onClick={handleSubmit}
            onMouseEnter={() => void playHover()}
            disabled={!prompt.trim()}
            className={`mt-4 w-full rounded-lg px-6 py-4 text-lg font-bold transition-all ${
              prompt.trim()
                ? 'bg-prompt-purple text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/25'
                : 'cursor-not-allowed bg-gray-800 text-gray-500'
            }`}
          >
            ⚡ SUBMIT INCANTATION ⚡
          </button>
        </div>
      ) : (
        <div className="mb-6 w-full max-w-2xl">
          <div className="rounded-lg border-2 border-prompt-green bg-prompt-green/10 p-6 text-center">
            <div className="mb-2 text-2xl">✓</div>
            <div className="text-lg font-bold text-prompt-green">INCANTATION SUBMITTED</div>
            <div className="mt-2 text-sm text-gray-400">
              Waiting for other players...
            </div>
          </div>
        </div>
      )}

      {/* Sabotage Panel */}
      {otherPlayers.length > 0 && (
        <div className="mb-6 w-full max-w-2xl">
          {!showSabotagePanel ? (
            <button
              onClick={() => { void playClick(); setShowSabotagePanel(true); }}
              onMouseEnter={() => void playHover()}
              disabled={!canAffordSabotage}
              className={`w-full rounded-lg border-2 px-4 py-3 text-center transition-all ${
                canAffordSabotage
                  ? 'border-red-700 bg-red-900/20 text-red-400 hover:border-red-500 hover:bg-red-900/40'
                  : 'cursor-not-allowed border-gray-700 bg-gray-900/50 text-gray-600'
              }`}
            >
              <span className="font-bold">💀 SABOTAGE</span>
              <span className="ml-2 text-sm">
                ({SABOTAGE_COST} tokens - You have {currentPlayerTokens})
              </span>
            </button>
          ) : (
            <div className="rounded-lg border-2 border-red-700 bg-gray-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-bold text-red-400">SELECT TARGET</div>
                <button
                  onClick={() => { void playClick(); setShowSabotagePanel(false); setSelectedVictimId(null); }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4 space-y-2">
                {otherPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => { void playClick(); setSelectedVictimId(player.id); }}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                      selectedVictimId === player.id
                        ? 'border-red-500 bg-red-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {player.avatar ? (
                      <img src={player.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-white">{player.name}</span>
                    {selectedVictimId === player.id && (
                      <span className="ml-auto text-red-400">🎯</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSabotage}
                onMouseEnter={() => void playHover()}
                disabled={!selectedVictimId}
                className={`w-full rounded-lg px-4 py-3 font-bold transition-all ${
                  selectedVictimId
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'cursor-not-allowed bg-gray-700 text-gray-500'
                }`}
              >
                💀 CONFIRM SABOTAGE (-{SABOTAGE_COST} tokens)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Submission Progress */}
      <div className="w-full max-w-md">
        <div className="mb-2 text-center text-sm text-gray-500">
          PROMPTS RECEIVED
        </div>
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPlayers }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-8 rounded-full transition-colors ${
                i < submittedPlayerIds.length
                  ? 'bg-prompt-green'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        <div className="mt-2 text-center text-sm text-gray-500">
          {submittedPlayerIds.length}/{totalPlayers} submitted
        </div>
      </div>
    </div>
  );
}
