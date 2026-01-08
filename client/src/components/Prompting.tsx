import { useState, useEffect, useCallback, useRef } from 'react';
import { playClick, playHover, playCountdownTick, playThemeReveal, playPromptSubmit } from '../sounds';
import type { Player } from '../types';

type SabotageType = 'word_injection' | 'style_override' | 'photobomb' | 'prompt_swap' | 'mystery_box';

interface SabotageOption {
  type: SabotageType;
  name: string;
  description: string;
  cost: number;
  emoji: string;
}

const SABOTAGE_OPTIONS: SabotageOption[] = [
  { type: 'mystery_box', name: 'Mystery Box', description: 'Random effect', cost: 1, emoji: '🎁' },
  { type: 'word_injection', name: 'Word Inject', description: 'Add silly phrase', cost: 2, emoji: '💬' },
  { type: 'photobomb', name: 'Photobomb', description: 'You appear in image', cost: 2, emoji: '📸' },
  { type: 'style_override', name: 'Style Override', description: 'Ridiculous art style', cost: 3, emoji: '🎨' },
  { type: 'prompt_swap', name: 'Prompt Swap', description: 'Exchange prompts', cost: 4, emoji: '🔄' },
];

interface SabotageTarget {
  victimId: string;
  attackerId: string;
}

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
  onUseSabotage: (victimId: string, sabotageType: SabotageType) => void;
  incomingSabotage: { attackerName: string; sabotageType?: SabotageType } | null;
  armedSabotages?: SabotageTarget[]; // Sabotages currently targeting other players
  sabotagesAgainstMe?: number; // Number of sabotages against current player this round
}

const PROMPT_MAX_LENGTH = 200;

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
  armedSabotages = [],
  sabotagesAgainstMe = 0,
}: PromptingProps) {
  const [prompt, setPrompt] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);
  const prevTimeLeftRef = useRef(90);
  const hasPlayedThemeReveal = useRef(false);
  const [showSabotagePanel, setShowSabotagePanel] = useState(false);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [selectedSabotageType, setSelectedSabotageType] = useState<SabotageType>('word_injection');
  const [showFlash, setShowFlash] = useState(false);
  const [tokenAnimation, setTokenAnimation] = useState<{ amount: number; type: 'earn' | 'spend' } | null>(null);
  const prevTokensRef = useRef(currentPlayerTokens);

  // Play theme reveal sound on mount
  useEffect(() => {
    if (!hasPlayedThemeReveal.current) {
      hasPlayedThemeReveal.current = true;
      playThemeReveal();
    }
  }, []);

  // Trigger flash animation on incoming sabotage
  useEffect(() => {
    if (incomingSabotage) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [incomingSabotage]);

  // Token change animation
  useEffect(() => {
    const diff = currentPlayerTokens - prevTokensRef.current;
    if (diff !== 0) {
      setTokenAnimation({
        amount: Math.abs(diff),
        type: diff > 0 ? 'earn' : 'spend',
      });
      const timer = setTimeout(() => setTokenAnimation(null), 1000);
      prevTokensRef.current = currentPlayerTokens;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentPlayerTokens]);

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

  const selectedOption = SABOTAGE_OPTIONS.find(o => o.type === selectedSabotageType)!;
  const canAffordSelected = currentPlayerTokens >= selectedOption.cost;

  const handleSabotage = useCallback(() => {
    if (selectedVictimId && canAffordSelected) {
      void playClick();
      onUseSabotage(selectedVictimId, selectedSabotageType);
      setSelectedVictimId(null);
      setShowSabotagePanel(false);
    }
  }, [selectedVictimId, canAffordSelected, selectedSabotageType, onUseSabotage]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 10;
  const cheapestSabotageCost = Math.min(...SABOTAGE_OPTIONS.map(o => o.cost));
  const canAffordAnySabotage = currentPlayerTokens >= cheapestSabotageCost;
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  const getSabotageTypeName = (type: SabotageType): string => {
    return SABOTAGE_OPTIONS.find(o => o.type === type)?.name ?? 'Sabotage';
  };

  // Check if we have an armed sabotage against a player
  const hasArmedSabotage = (playerId: string): boolean => {
    return armedSabotages.some(s => s.victimId === playerId);
  };

  // Check if player is protected (sabotaged max times - though this is per-attacker, simplify to show badge after any sabotage)
  const isProtected = sabotagesAgainstMe >= 2;

  return (
    <div className={`flex min-h-screen flex-col items-center bg-prompt-black p-4 ${showFlash ? 'sabotage-flash' : ''}`}>
      {/* Screen Flash Overlay */}
      {showFlash && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-red-500/20" />
      )}

      {/* Token Animation */}
      {tokenAnimation && (
        <div className={`token-float fixed right-8 top-8 z-50 text-2xl ${
          tokenAnimation.type === 'earn' ? 'token-float-earn' : 'token-float-spend'
        }`}>
          {tokenAnimation.type === 'earn' ? '+' : '-'}{tokenAnimation.amount} 🪙
        </div>
      )}

      {/* Protected Badge Notification */}
      {isProtected && (
        <div className="fixed right-4 top-4 z-30 rounded-lg border border-green-500 bg-green-900/90 px-3 py-2 text-sm">
          <span className="mr-1">🛡️</span>
          <span className="text-green-400">Protected</span>
        </div>
      )}

      {/* Incoming Sabotage Warning */}
      {incomingSabotage && (
        <div className="sabotage-shake fixed left-0 right-0 top-0 z-50 animate-pulse border-b-4 border-red-500 bg-red-900/90 p-4 text-center">
          <div className="text-xl font-bold text-red-400">⚠️ INCOMING SABOTAGE ⚠️</div>
          <div className="text-sm text-red-300">
            {incomingSabotage.attackerName} used {incomingSabotage.sabotageType ? getSabotageTypeName(incomingSabotage.sabotageType) : 'Sabotage'} on you!
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
              disabled={!canAffordAnySabotage}
              className={`w-full rounded-lg border-2 px-4 py-3 text-center transition-all ${
                canAffordAnySabotage
                  ? 'border-red-700 bg-red-900/20 text-red-400 hover:border-red-500 hover:bg-red-900/40'
                  : 'cursor-not-allowed border-gray-700 bg-gray-900/50 text-gray-600'
              }`}
            >
              <span className="font-bold">💀 SABOTAGE</span>
              <span className="ml-2 text-sm">
                (You have {currentPlayerTokens} tokens)
              </span>
            </button>
          ) : (
            <div className="rounded-lg border-2 border-red-700 bg-gray-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-bold text-red-400">SABOTAGE MENU</div>
                <button
                  onClick={() => { void playClick(); setShowSabotagePanel(false); setSelectedVictimId(null); }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Sabotage Type Selection */}
              <div className="mb-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Select Sabotage Type
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {SABOTAGE_OPTIONS.map((option) => {
                    const canAfford = currentPlayerTokens >= option.cost;
                    return (
                      <button
                        key={option.type}
                        onClick={() => { void playClick(); setSelectedSabotageType(option.type); }}
                        disabled={!canAfford}
                        className={`rounded-lg border-2 p-2 text-center transition-all ${
                          selectedSabotageType === option.type
                            ? 'border-red-500 bg-red-900/40'
                            : canAfford
                              ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                              : 'cursor-not-allowed border-gray-800 bg-gray-900 opacity-50'
                        }`}
                      >
                        <div className="text-xl">{option.emoji}</div>
                        <div className="text-xs font-semibold text-white">{option.name}</div>
                        <div className="text-xs text-prompt-pink">{option.cost} tokens</div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-center text-xs text-gray-400">
                  {selectedOption.description}
                </div>
              </div>

              {/* Target Selection */}
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                Select Target
              </div>
              <div className="mb-4 space-y-2">
                {otherPlayers.map((player) => {
                  const isArmed = hasArmedSabotage(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => { void playClick(); setSelectedVictimId(player.id); }}
                      className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                        selectedVictimId === player.id
                          ? 'border-red-500 bg-red-900/30'
                          : isArmed
                            ? 'armed-indicator'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className={`relative ${selectedVictimId === player.id ? 'crosshair-target' : ''}`}>
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-white">{player.name}</span>
                        {isArmed && (
                          <span className="text-xs text-red-400">💣 Sabotage Armed</span>
                        )}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        {isArmed && <span className="text-sm text-red-400">⚡</span>}
                        {selectedVictimId === player.id && (
                          <span className="text-red-400">🎯</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleSabotage}
                onMouseEnter={() => void playHover()}
                disabled={!selectedVictimId || !canAffordSelected}
                className={`w-full rounded-lg px-4 py-3 font-bold transition-all ${
                  selectedVictimId && canAffordSelected
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'cursor-not-allowed bg-gray-700 text-gray-500'
                }`}
              >
                {selectedOption.emoji} CONFIRM {selectedOption.name.toUpperCase()} (-{selectedOption.cost} tokens)
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
