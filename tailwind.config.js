/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"PingFang SC"', '"Source Han Sans SC"', '"Noto Sans SC"', '-apple-system', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Menlo', 'ui-monospace', 'monospace'],
        display: ['"Source Han Serif SC"', '"Songti SC"', 'Georgia', 'serif'],
      },
      colors: {
        tick: {
          up: 'var(--oq-up)',
          down: 'var(--oq-down)',
          flat: 'var(--oq-flat)',
        },
        cn: {
          up: 'var(--oq-up)',
          down: 'var(--oq-down)',
          flat: 'var(--oq-flat)',
        },
        surface: {
          DEFAULT: 'var(--oq-ink-0)',
          hover: 'var(--oq-ink-05)',
          secondary: 'var(--oq-ink-10)',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': 'var(--oq-shadow-sm)',
        'glow-lg': 'var(--oq-shadow-md)',
        'card': 'var(--oq-shadow-md)',
        'card-lg': 'var(--oq-shadow-lg)',
      },
    },
  },
  plugins: [],
}
