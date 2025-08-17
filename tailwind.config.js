/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Classic Theme Colors (Purple/Blue)
        classic: {
          primary: '#c4b5fd',    // purple-300 (even lighter for better visibility)
          secondary: '#93c5fd',   // blue-300 (even lighter for better visibility)
          accent: '#fcd34d',      // amber-300 (brighter for emphasis)
          success: '#6ee7b7',     // emerald-300 (lighter for visibility)
          warning: '#fcd34d',     // amber-300 (brighter for emphasis)
          error: '#fca5a5',       // red-300 (lighter for visibility)
          info: '#93c5fd',        // blue-300 (lighter for visibility)
          background: {
            primary: 'linear-gradient(135deg, #a855f7 0% 50%, #3b82f6 50%, #6366f1 100%)',
            card: 'rgba(255, 255, 255, 0.2)',
            cardHover: 'rgba(255, 255, 255, 0.25)',
          },
          border: 'rgba(255, 255, 255, 0.4)',
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.9)',
            muted: 'rgba(255, 255, 255, 0.75)',
          },
        },
        // Professional Theme Colors (Cyan/Blue)
        professional: {
          primary: '#67e8f9',      // cyan-300 (lighter for better visibility)
          secondary: '#7dd3fc',    // sky-300 (lighter for better visibility)
          accent: '#a5f3fc',       // cyan-200 (brighter for emphasis)
          success: '#6ee7b7',      // emerald-300 (lighter for visibility)
          warning: '#fcd34d',      // amber-300 (brighter for emphasis)
          error: '#fca5a5',        // red-300 (lighter for visibility)
          info: '#67e8f9',         // cyan-300 (lighter for visibility)
          background: {
            primary: 'linear-gradient(135deg, #334155 0% 50%, #000066 50%, #1e293b 100%)',
            card: 'rgba(51, 65, 85, 0.9)',
            cardHover: 'rgba(51, 65, 85, 0.95)',
          },
          border: 'rgba(148, 163, 184, 0.5)',
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.9)',
            muted: 'rgba(255, 255, 255, 0.75)',
          },
        },
      },
      backgroundImage: {
        'gradient-classic': 'linear-gradient(135deg, #a855f7 0% 50%, #3b82f6 50%, #6366f1 100%)',
        'gradient-professional': 'linear-gradient(135deg, #334155 0% 50%, #000066 50%, #1e293b 100%)',
      },
    },
  },
  plugins: [],
};
