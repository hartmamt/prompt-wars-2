import { useState, useEffect, useRef } from 'react';
import { playImageReveal, startProcessingAmbience, stopProcessingAmbience } from '../sounds';

interface GeneratingProps {
  generatedCount: number;
  totalCount: number;
  hasError: boolean;
}

const LOADING_MESSAGES = [
  'Teaching AI what fingers look like...',
  'Adding extra fingers (will fix later)...',
  'Consulting the ancient prompt scrolls...',
  'Bribing the pixel elves...',
  'Downloading more RGB...',
  'Asking ChatGPT for help (jk)...',
  'Rendering in 4D, projecting to 2D...',
  'Summoning the machine spirits...',
  'Applying artistic chaos theory...',
  'Compressing infinite possibilities...',
  'Negotiating with the void...',
  'Calibrating sarcasm detectors...',
  'Translating prompts to robot speak...',
  'Generating controversy (just kidding)...',
  'Counting backwards from infinity...',
  'Reticulating splines (classic)...',
  'Making the AI pinky promise not to hallucinate...',
  'Feeding tokens to the neural net...',
  'Asking nicely for coherent outputs...',
  'Calculating optimal weirdness levels...',
];

export function Generating({ generatedCount, totalCount, hasError }: GeneratingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const prevGeneratedCountRef = useRef(0);

  // Play sound when an image is generated
  useEffect(() => {
    if (generatedCount > prevGeneratedCountRef.current) {
      playImageReveal();
    }
    prevGeneratedCountRef.current = generatedCount;
  }, [generatedCount]);

  // Start/stop processing ambience
  useEffect(() => {
    startProcessingAmbience();
    return () => {
      stopProcessingAmbience();
    };
  }, []);

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Fake progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFakeProgress((prev) => {
        // Progress based on actual count, plus some fake animation
        const realProgress = totalCount > 0 ? (generatedCount / totalCount) * 100 : 0;
        const targetProgress = Math.min(realProgress + Math.random() * 5, 99);

        if (prev < targetProgress) {
          return Math.min(prev + Math.random() * 3, targetProgress);
        }
        // Occasionally go backwards for humor
        if (Math.random() < 0.05) {
          return Math.max(prev - Math.random() * 2, 0);
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [generatedCount, totalCount]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-prompt-black p-4">
      {/* Animated title */}
      <div className="mb-8 text-center">
        <h1 className="animate-pulse text-4xl font-bold text-prompt-purple md:text-5xl">
          GENERATING
        </h1>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="h-3 w-3 animate-bounce rounded-full bg-prompt-pink" style={{ animationDelay: '0ms' }} />
          <span className="h-3 w-3 animate-bounce rounded-full bg-prompt-pink" style={{ animationDelay: '150ms' }} />
          <span className="h-3 w-3 animate-bounce rounded-full bg-prompt-pink" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Rotating humorous message */}
      <div className="mb-8 h-8 text-center">
        <p className="font-mono text-lg text-gray-400 transition-opacity duration-500">
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-4 w-full max-w-md">
        <div className="h-4 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-prompt-purple to-prompt-pink transition-all duration-300"
            style={{ width: `${fakeProgress}%` }}
          />
        </div>
      </div>

      {/* Progress count */}
      <div className="mb-4 text-center">
        <p className="font-mono text-xl text-white">
          {generatedCount} / {totalCount} IMAGES MATERIALIZED
        </p>
      </div>

      {/* Fake AI confidence meter */}
      <div className="w-full max-w-md">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>AI CONFIDENCE</span>
          <span className="text-prompt-green">
            {Math.floor(50 + Math.random() * 45)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full bg-prompt-green transition-all duration-500"
            style={{ width: `${50 + Math.random() * 45}%` }}
          />
        </div>
      </div>

      {/* Error indicator */}
      {hasError && (
        <div className="mt-6 rounded-lg border-2 border-red-500 bg-red-500/10 p-4 text-center">
          <p className="text-sm text-red-400">
            THE MACHINE SPIRIT IS DISPLEASED
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Some images may have failed to generate
          </p>
        </div>
      )}

      {/* Scanline overlay effect */}
      <div
        className="pointer-events-none fixed inset-0 opacity-5"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
    </div>
  );
}
