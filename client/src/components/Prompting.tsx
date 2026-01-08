import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  playClick,
  playHover,
  playCountdownTick,
  playThemeReveal,
  playPromptSubmit,
  playSabotageMenuOpen,
  playTargetLockOn,
  playSabotageConfirmed,
  playIncomingSabotage,
  playTokensEarned,
  playTokensSpent,
} from '../sounds';
import type { Player, ModelProvider } from '../types';

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
  modelProvider?: ModelProvider; // For enabling @mentions with Nano Banana
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
  modelProvider = 'flux-schnell',
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

  // @Mention autocomplete state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsEnabled = modelProvider === 'nano-banana';

  // Parse mentioned players from prompt
  const mentionedPlayers = useMemo(() => {
    const mentionRegex = /@(\w+)/g;
    const mentions: Player[] = [];
    let match;
    while ((match = mentionRegex.exec(prompt)) !== null) {
      const name = match[1];
      const player = players.find(p => p.name.toLowerCase() === name?.toLowerCase());
      if (player && !mentions.find(m => m.id === player.id)) {
        mentions.push(player);
      }
    }
    return mentions;
  }, [prompt, players]);

  // Filter players for autocomplete based on search text
  const filteredPlayers = useMemo(() => {
    if (!mentionSearchText) return players.filter(p => p.id !== currentPlayerId);
    return players.filter(p =>
      p.id !== currentPlayerId &&
      p.name.toLowerCase().includes(mentionSearchText.toLowerCase())
    );
  }, [players, currentPlayerId, mentionSearchText]);

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
      playIncomingSabotage();
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
      if (diff > 0) {
        playTokensEarned();
      } else {
        playTokensSpent();
      }
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
      playSabotageConfirmed();
      onUseSabotage(selectedVictimId, selectedSabotageType);
      setSelectedVictimId(null);
      setShowSabotagePanel(false);
    }
  }, [selectedVictimId, canAffordSelected, selectedSabotageType, onUseSabotage]);

  // Handle textarea input change with @ detection
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, PROMPT_MAX_LENGTH);
    const cursorPos = e.target.selectionStart ?? 0;
    setPrompt(newValue);

    if (mentionsEnabled) {
      // Find if we're in a @ mention context
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        // Check if there's a space or start of string before @
        const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
        if (lastAtIndex === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') {
          const searchText = textBeforeCursor.slice(lastAtIndex + 1);
          // Only show dropdown if no space after @
          if (!searchText.includes(' ')) {
            setMentionSearchText(searchText);
            setMentionCursorPosition(lastAtIndex);
            setShowMentionDropdown(true);
            return;
          }
        }
      }
      setShowMentionDropdown(false);
    }
  }, [mentionsEnabled]);

  // Insert selected player mention
  const handleSelectMention = useCallback((player: Player) => {
    void playClick();
    const beforeMention = prompt.slice(0, mentionCursorPosition);
    const afterSearch = prompt.slice(mentionCursorPosition + 1 + mentionSearchText.length);
    const newPrompt = `${beforeMention}@${player.name}${afterSearch}`;
    setPrompt(newPrompt.slice(0, PROMPT_MAX_LENGTH));
    setShowMentionDropdown(false);
    setMentionSearchText('');

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = beforeMention.length + player.name.length + 1;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [prompt, mentionCursorPosition, mentionSearchText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mention-dropdown') && !target.closest('.prompt-textarea')) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              placeholder={mentionsEnabled ? "Describe the image... Type @ to mention players" : "Describe the image you want to generate..."}
              maxLength={PROMPT_MAX_LENGTH}
              className="prompt-textarea h-32 w-full resize-none rounded-lg border-2 border-gray-700 bg-gray-900 p-4 font-mono text-white placeholder-gray-500 focus:border-prompt-purple focus:outline-none"
            />
            {/* @Mention Dropdown */}
            {showMentionDropdown && filteredPlayers.length > 0 && (
              <div className="mention-dropdown absolute left-4 top-full z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border-2 border-prompt-purple bg-gray-900 shadow-xl">
                <div className="p-2 text-xs font-bold uppercase tracking-widest text-prompt-purple">
                  Select Player
                </div>
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectMention(player)}
                    onMouseEnter={() => void playHover()}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-prompt-purple/20"
                  >
                    {player.avatar ? (
                      <img src={player.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-white">@{player.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Featuring Section */}
          {mentionedPlayers.length > 0 && (
            <div className="mt-2 rounded-lg border border-prompt-pink/50 bg-prompt-pink/10 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-prompt-pink">Featuring:</span>
                {mentionedPlayers.map((player) => (
                  <span
                    key={player.id}
                    className="inline-flex items-center gap-1 rounded-full bg-prompt-pink/30 px-2 py-1 text-xs font-semibold text-prompt-pink"
                  >
                    {player.avatar ? (
                      <img src={player.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-prompt-pink/50 text-[10px]">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    @{player.name}
                  </span>
                ))}
              </div>
              {mentionedPlayers.length > 3 && (
                <div className="mt-1 flex items-center gap-1 text-xs text-yellow-500">
                  <span>⚠️</span>
                  <span>More than 3 mentions may affect image quality</span>
                </div>
              )}
            </div>
          )}

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
              onClick={() => { void playClick(); playSabotageMenuOpen(); setShowSabotagePanel(true); }}
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
                      onClick={() => { void playClick(); playTargetLockOn(); setSelectedVictimId(player.id); }}
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
