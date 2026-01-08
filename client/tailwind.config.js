/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'prompt-purple': '#9333ea',
        'prompt-pink': '#ec4899',
        'prompt-green': '#22c55e',
        'prompt-black': '#0a0a0a',
      },
      fontFamily: {
        'display': ['"Press Start 2P"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 1s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'holographic': 'holographic 3s ease-in-out infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, -1px)' },
          '80%': { transform: 'translate(1px, 1px)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        holographic: {
          '0%, 100%': { borderColor: '#9333ea' },
          '33%': { borderColor: '#ec4899' },
          '66%': { borderColor: '#22c55e' },
        },
      },
    },
  },
  plugins: [],
};
