import { useEffect, useRef, useState } from 'react';
import { playClick, playHover } from '../sounds';

interface LandingPageProps {
  onPlayNow: () => void;
}

// Example gallery images (placeholder base64 or URLs can be added later)
const GALLERY_IMAGES = [
  { prompt: 'A dragon playing chess with a penguin', alt: 'AI generated dragon playing chess' },
  { prompt: 'Cyberpunk cat DJ in neon city', alt: 'AI generated cyberpunk cat' },
  { prompt: 'Medieval knight riding a giant corgi', alt: 'AI generated knight on corgi' },
  { prompt: 'Astronaut cooking pasta in space', alt: 'AI generated astronaut cooking' },
  { prompt: 'Steampunk elephant with rocket boosters', alt: 'AI generated steampunk elephant' },
  { prompt: 'Wizard cat brewing potions', alt: 'AI generated wizard cat' },
];

const FEATURES = [
  { emoji: '🎮', title: 'Multiplayer Mayhem', description: 'Play with 2-8 friends in real-time battles of creativity' },
  { emoji: '🎭', title: 'Discord Integration', description: 'Launch directly from Discord Activities for seamless party fun' },
  { emoji: '🤖', title: 'AI-Powered Images', description: 'State-of-the-art image generation brings your prompts to life' },
  { emoji: '🏆', title: 'Competitive Voting', description: 'Vote for the best creations and climb the leaderboard' },
  { emoji: '👤', title: 'Custom Avatars', description: 'Use your Discord avatar or take a selfie to appear in images' },
  { emoji: '🌀', title: 'Chaos Mode', description: 'Sabotage opponents with modifiers, word injections, and photobombs' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Join a Room', description: 'Create or join a room with your friends using a simple code' },
  { step: 2, title: 'Get the Theme', description: 'Everyone receives a secret theme to inspire their prompt' },
  { step: 3, title: 'Craft Your Prompt', description: 'Write the perfect description to generate a winning image' },
  { step: 4, title: 'AI Magic', description: 'Watch as AI transforms your words into stunning visuals' },
  { step: 5, title: 'Vote & Win', description: 'Vote for your favorites in head-to-head matchups to crown the champion' },
];

export function LandingPage({ onPlayNow }: LandingPageProps) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen bg-prompt-black text-white">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
        {/* Animated background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-prompt-purple/30 blur-[100px]" />
        <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-prompt-pink/30 blur-[100px]" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-6 animate-pulse">
            <span className="text-6xl md:text-8xl">⚡</span>
          </div>

          {/* Title */}
          <h1 className="mb-4 font-display text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-prompt-purple via-prompt-pink to-prompt-green bg-clip-text text-transparent">
              PROMPT WARS
            </span>
          </h1>

          {/* Tagline */}
          <p className="mb-8 text-xl text-gray-400 md:text-2xl">
            Battle your friends with AI-generated images
          </p>

          {/* CTA Button */}
          <button
            onClick={() => { void playClick(); onPlayNow(); }}
            onMouseEnter={() => void playHover()}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-prompt-purple to-prompt-pink px-8 py-4 text-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 md:px-12 md:py-5 md:text-2xl"
          >
            <span className="relative z-10">PLAY NOW</span>
            <span className="relative z-10 transition-transform group-hover:translate-x-1">
              ▶
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-prompt-pink to-prompt-purple opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce text-gray-500">
            <div className="text-sm uppercase tracking-widest">Scroll to explore</div>
            <div className="mt-2 text-2xl">↓</div>
          </div>
        </div>
      </section>

      {/* What Is This Section */}
      <section
        id="what-is-this"
        ref={setSectionRef('what-is-this')}
        className={`px-4 py-20 transition-all duration-1000 ${
          visibleSections.has('what-is-this') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-prompt-pink">
            What Is This?
          </h2>
          <h3 className="mb-8 font-display text-3xl font-bold text-white md:text-5xl">
            The Ultimate AI Art Party Game
          </h3>
          <p className="text-lg leading-relaxed text-gray-400 md:text-xl">
            Prompt Wars is a multiplayer party game where creativity meets competition.
            Each round, players receive a secret theme and race to craft the perfect
            prompt that will generate a winning AI image. Vote for your favorites,
            sabotage your opponents, and prove you are the ultimate prompt engineer!
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div>
              <div className="font-mono text-4xl font-bold text-prompt-purple md:text-5xl">2-8</div>
              <div className="mt-2 text-sm text-gray-500">Players</div>
            </div>
            <div>
              <div className="font-mono text-4xl font-bold text-prompt-pink md:text-5xl">3</div>
              <div className="mt-2 text-sm text-gray-500">Rounds</div>
            </div>
            <div>
              <div className="font-mono text-4xl font-bold text-prompt-green md:text-5xl">∞</div>
              <div className="mt-2 text-sm text-gray-500">Fun</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        ref={setSectionRef('how-it-works')}
        className={`bg-gray-900/50 px-4 py-20 transition-all duration-1000 ${
          visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-prompt-pink">
            How It Works
          </h2>
          <h3 className="mb-12 text-center font-display text-3xl font-bold text-white md:text-5xl">
            Five Steps to Glory
          </h3>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-prompt-purple via-prompt-pink to-prompt-green md:block" />

            {/* Steps */}
            <div className="space-y-8 md:space-y-0">
              {HOW_IT_WORKS.map((item, index) => (
                <div
                  key={item.step}
                  className={`relative flex flex-col items-center gap-4 md:flex-row ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
                      <h4 className="mb-2 text-xl font-bold text-white">{item.title}</h4>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </div>

                  {/* Step number */}
                  <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-prompt-purple to-prompt-pink text-xl font-bold">
                    {item.step}
                  </div>

                  {/* Spacer */}
                  <div className="hidden flex-1 md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={setSectionRef('features')}
        className={`px-4 py-20 transition-all duration-1000 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-prompt-pink">
            Features
          </h2>
          <h3 className="mb-12 text-center font-display text-3xl font-bold text-white md:text-5xl">
            Packed With Awesome
          </h3>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-lg border border-gray-700 bg-gray-800/30 p-6 transition-all hover:border-prompt-purple hover:bg-gray-800/50"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 text-4xl">{feature.emoji}</div>
                <h4 className="mb-2 text-xl font-bold text-white group-hover:text-prompt-purple">
                  {feature.title}
                </h4>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section
        id="gallery"
        ref={setSectionRef('gallery')}
        className={`bg-gray-900/50 px-4 py-20 transition-all duration-1000 ${
          visibleSections.has('gallery') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-prompt-pink">
            Gallery
          </h2>
          <h3 className="mb-4 text-center font-display text-3xl font-bold text-white md:text-5xl">
            Example Creations
          </h3>
          <p className="mb-12 text-center text-gray-400">
            See what players have created with their prompts
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GALLERY_IMAGES.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800/30"
              >
                {/* Placeholder for actual images */}
                <div className="aspect-square w-full bg-gradient-to-br from-prompt-purple/20 via-prompt-pink/20 to-prompt-green/20">
                  <div className="flex h-full items-center justify-center text-6xl opacity-50">
                    🎨
                  </div>
                </div>

                {/* Prompt overlay */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="p-4">
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-prompt-pink">
                      Prompt
                    </div>
                    <p className="font-mono text-sm text-white">&quot;{image.prompt}&quot;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-white md:text-5xl">
            Ready to Battle?
          </h2>
          <p className="mb-8 text-lg text-gray-400 md:text-xl">
            Join thousands of players in the ultimate AI art showdown
          </p>

          <button
            onClick={() => { void playClick(); onPlayNow(); }}
            onMouseEnter={() => void playHover()}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-prompt-purple to-prompt-pink px-8 py-4 text-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25 md:px-12 md:py-5 md:text-2xl"
          >
            <span className="relative z-10">START PLAYING</span>
            <span className="relative z-10 text-2xl">⚡</span>
            <div className="absolute inset-0 bg-gradient-to-r from-prompt-pink to-prompt-purple opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8">
        <div className="mx-auto max-w-4xl text-center text-sm text-gray-500">
          <p className="mb-2">Made with ⚡ and AI magic</p>
          <p>Prompt Wars - The AI Art Party Game</p>
        </div>
      </footer>
    </div>
  );
}
