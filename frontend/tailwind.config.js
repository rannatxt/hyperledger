/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        ios: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ios: {
          bg: '#000000',
          card: '#1c1c1e',
          elevated: '#2c2c2e',
          border: '#3a3a3c',
          blue: '#007aff',
          blueHover: '#0062cc',
          red: '#ff3b30',
          pink: '#ff2d55',
          green: '#34c759',
          orange: '#ff9500',
          gray1: '#8e8e93',
          gray2: '#636366',
          gray3: '#48484a',
          gray4: '#3a3a3c',
          gray5: '#2c2c2e',
          gray6: '#1c1c1e',
        },
      },
      borderRadius: {
        'ios': '14px',
        'ios-lg': '20px',
        'ios-xl': '28px',
        'ios-sheet': '32px',
      },
      keyframes: {
        heartBurst: {
          '0%':   { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '40%':  { transform: 'scale(1.3) rotate(5deg)',  opacity: '1' },
          '70%':  { transform: 'scale(0.95)',              opacity: '0.9' },
          '100%': { transform: 'scale(1)',                 opacity: '0' },
        },
        sheetUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        progressBar: {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        pulseGreen: {
          '0%,100%': { opacity: '0.7' },
          '50%':     { opacity: '1' },
        },
      },
      animation: {
        'heart-burst': 'heartBurst 850ms cubic-bezier(0.175,0.885,0.32,1.275) forwards',
        'sheet-up':    'sheetUp 320ms cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':     'fadeIn 200ms ease forwards',
        'progress':    'progressBar 4.5s linear forwards',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
