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
        // Natural Warm Palette: Cream, Ivory & Warm Stone
        background: {
          DEFAULT: '#FAF7F2',       // Warm ivory / cream main background
          subtle: '#F4EFE6',        // Slightly darker cream for subtle contrast
          card: '#FFFFFF',          // Clean warm white for surfaces
          elevated: '#EFEAE0',      // Soft warm stone for pills, inputs, chips
          border: '#E3DCD0',        // Delicate warm border
          darker: '#DDD5C7',        // Divider / stronger border
        },
        // Muted Forest / Olive Green (Primary Accent)
        primary: {
          DEFAULT: '#2E5A3A',       // Natural forest green
          hover: '#24482E',         // Deep forest green
          active: '#1B3723',        // Darkest forest green
          subtle: 'rgba(46, 90, 58, 0.10)',
          light: '#EBF2ED',
        },
        // Muted Warm Gold / Amber
        gold: {
          DEFAULT: '#C4973B',       // Warm muted gold
          hover: '#B3872F',
          subtle: 'rgba(196, 151, 59, 0.15)',
          light: '#FAF5E8',
        },
        // Board & Pieces Natural Walnut / Ivory Palette
        board: {
          surface: '#3D2817',       // Rich warm walnut wood
          surfaceLight: '#4A321E',  // Highlight wood
          surfaceDark: '#2C1B0F',   // Shadow wood
          border: '#23150C',        // Deep walnut rim
          line: '#6E4829',          // Warm wood etched line
          lineGlow: '#D4AF37',      // Muted gold mill line
          point: '#5A3920',         // Point marker on wood
          pointDot: '#A8845E',      // Contrasting point dot
          whitePiece: '#FDFBF7',    // Warm ivory piece
          whitePieceRim: '#D9CEBD',
          blackPiece: '#1E140C',    // Dark walnut piece
          blackPieceRim: '#3E2A1B',
        },
        // Text Colors: Deep Charcoal & Warm Brown
        ink: {
          DEFAULT: '#1E1915',       // Deep charcoal / nearly black with warm tint
          muted: '#695E55',         // Muted body text
          subtle: '#9A8E84',        // Secondary / placeholder text
          light: '#FAF7F2',         // Ivory text for dark surfaces
        },
        // Semantic alerts
        alert: {
          success: '#2E5A3A',       // Natural forest green
          warning: '#B88225',       // Muted amber
          danger: '#B93838',        // Muted clear red
          info: '#3B6B8A',          // Muted slate blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(44, 30, 18, 0.05)',
        'medium': '0 6px 20px rgba(44, 30, 18, 0.08)',
        'board': '0 20px 50px -10px rgba(35, 21, 12, 0.35), 0 10px 20px -5px rgba(35, 21, 12, 0.2)',
        'piece-ivory': '0 3px 8px rgba(0, 0, 0, 0.35), inset 0 2px 3px rgba(255, 255, 255, 0.9)',
        'piece-walnut': '0 3px 8px rgba(0, 0, 0, 0.6), inset 0 2px 3px rgba(255, 255, 255, 0.15)',
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
