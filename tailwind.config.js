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
        whoop: {
          black: '#000000',
          card: '#12151A',
          surface: '#181C23',
          border: '#262B35',
          borderLight: '#323846',
          blue: '#0093E9',
          cyan: '#00B4D8',
          green: '#16EC06',
          yellow: '#FFDE00',
          red: '#FF0026',
          sleep: '#7395B7',
          gray: '#8E9BAE',
          muted: '#626D7F',
          text: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'Inter', 'Impact', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.15)' },
          '30%': { transform: 'scale(1.05)' },
          '45%': { transform: 'scale(1.2)' },
          '60%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
