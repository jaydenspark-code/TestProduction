/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Classic Theme Colors (Purple/Blue)
        classic: {
          primary: '#8b5cf6',    // purple-500
          secondary: '#3b82f6',    // blue-500
          accent: '#f59e0b',       // amber-500
          success: '#101',         // emerald-500
          warning: '#f59e0',       // amber-500
          error: '#ef4444',        // red-500
          info: '#36',             // blue-500
          background: {
            primary: 'linear-gradient(135deg, #7c3aed 0% 50%, #1e40f 50%, #3730a3 10%)',
            card: 'rgba(255, 255, 255, 0.1)',
            cardHover: 'rgba(255, 255, 255, 0.15)',
          },
          border: 'rgba(255, 255, 255, 0.2)',
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            muted: 'rgba(255, 255, 255, 0.5)',
          },
        },
        // Professional Theme Colors (Cyan/Blue)
        professional: {
          primary: '#0891b2',      // cyan-600
          secondary: '#0ea5e9',     // sky-500
          accent: '#64',            // cyan-400
          success: '#10b981',       // emerald-500
          warning: '#f59e0b',       // amber-500
          error: '#ef4444',         // red-500
          info: '#0891',            // cyan-600
          background: {
            primary: 'linear-gradient(135deg, #111827 0% 50%, #000050 50%, #1e293b 10%)',
            card: 'rgba(31, 13, 80, 0.8)',
            cardHover: 'rgba(31, 13, 80, 0.9)',
          },
          border: 'rgba(75, 0.5)',
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            muted: 'rgba(255, 255, 255, 0.5)',
          },
        },
      },
      backgroundImage: {
        'gradient-classic': 'linear-gradient(135deg, #7c3aed 0% 50%, #1e40f 50%, #3730a3 10%)',
        'gradient-professional': 'linear-gradient(135deg, #111827 0% 50%, #000050 50%, #1e293b 10%)',
      },
    },
  },
  plugins: [],
};
