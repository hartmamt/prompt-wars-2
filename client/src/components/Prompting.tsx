import { useState, useEffect, useCallback } from 'react';

interface PromptingProps {
  theme: string;
  phaseEndTime: string;
  hasSubmitted: boolean;
  submittedPlayerIds: string[];
  totalPlayers: number;
  onSubmitPrompt: (prompt: string) => void;
}

const PROMPT_MAX_LENGTH = 200;

export function Prompting({
  theme,
  phaseEndTime,
  hasSubmitted,
  submittedPlayerIds,
  totalPlayers,
  onSubmitPrompt,
}: PromptingProps) {
  const [prompt, setPrompt] = useState('');
  const [timeLeft, setTimeLeft] = useState(90);

  // Calculate and update time left
  useEffect(() => {
    const endTime = new Date(phaseEndTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
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
      onSubmitPrompt(prompt.trim());
    }
  }, [prompt, hasSubmitted, onSubmitPrompt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 10;

  return (
    <div className="flex min-h-screen flex-col items-center bg-prompt-black p-4">
      {/* Timer */}
      <div className="mb-6 text-center">
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
