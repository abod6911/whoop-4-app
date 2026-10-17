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
          bg: '#0A0C0F',
          bg2: '#0D1015',
          card: '#12151A',
          elevated: '#181C23',
          strain: '#00A3FF',
          strainDeep: '#0055FF',
          green: '#16EC06',
          yellow: '#FFDE00',
          red: '#FF3344',
          // backwards compatibility aliases:
          black: '#0A0C0F',
          surface: '#181C23',
          border: '#262B35',
          borderLight: '#323846',
          blue: '#00A3FF',
          cyan: '#00B4D8',
          sleep: '#7395B7',
          gray: '#8E9BAE',
          muted: '#626D7F',
          text: '#FFFFFF',
        }
      },
      fontSize: {
        badge: ['10px', { lineHeight: '12px', fontWeight: '800' }],
        sub: ['11px', { lineHeight: '14px', fontWeight: '500' }],
        metric: ['32px', { lineHeight: '36px', fontWeight: '900' }],
        'metric-lg': ['48px', { lineHeight: '52px', fontWeight: '900' }],
      },
      boxShadow: {
        'glow-green': '0 0 25px -5px rgba(22, 236, 6, 0.4)',
        'glow-yellow': '0 0 25px -5px rgba(255, 222, 0, 0.4)',
        'glow-red': '0 0 25px -5px rgba(255, 51, 68, 0.45)',
        'glow-strain': '0 0 25px -5px rgba(0, 163, 255, 0.45)',
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
