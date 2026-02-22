/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        tick: {
          up: '#22c55e',
          down: '#ef4444',
          flat: '#64748b',
        },
      },
    },
  },
  plugins: [],
}
