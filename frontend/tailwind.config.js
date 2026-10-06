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
        pinterest: {
          red: '#E60023',
          redHover: '#AD081B',
          coral: '#FF4757',
          bg: '#FFFFFF',
          card: '#FFFFFF',
          gray: '#F0F0F0',
          grayHover: '#E2E2E2',
          grayMuted: '#767676',
          border: '#EFEFEF',
          dark: '#111111',
        },
        ios: {
          bg: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F9F9F9',
          border: '#EFEFEF',
          blue: '#E60023',
          blueHover: '#AD081B',
          red: '#E60023',
          pink: '#FF4757',
          green: '#27ae60',
          orange: '#e67e22',
          gray1: '#767676',
          gray2: '#8e8e93',
          gray3: '#cccccc',
          gray4: '#e2e2e2',
          gray5: '#f0f0f0',
          gray6: '#ffffff',
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
