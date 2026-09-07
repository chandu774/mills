/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0c0f14',
          subtle: '#11151c',
          card: '#161b24',
          elevated: '#1f2633',
          border: '#2a3344',
        },
        primary: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          active: '#15803d',
          subtle: 'rgba(34, 197, 94, 0.15)',
        },
        amber: {
          trophy: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        board: {
          bg: '#1a222d',
          line: '#3b485d',
          point: '#64748b',
          whitePiece: '#f8fafc',
          blackPiece: '#1e293b',
          millHighlight: '#eab308',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'board': '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        'glow-primary': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.25)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      }
    },
  },
  plugins: [],
}
