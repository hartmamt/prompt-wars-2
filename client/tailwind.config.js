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
    },
  },
  plugins: [],
};
