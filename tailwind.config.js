/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        tick: {
          up: '#10b981',
          down: '#ef4444',
          flat: '#64748b',
        },
        surface: {
          DEFAULT: '#151d2e',
          hover: '#1a2540',
          secondary: '#111827',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px 2px rgba(59, 130, 246, 0.1)',
        'glow-lg': '0 0 40px 4px rgba(59, 130, 246, 0.15)',
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.3)',
        'card-lg': '0 8px 32px -4px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
