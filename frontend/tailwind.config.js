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
        brand: {
          blue: '#0095F6',
          hover: '#1877F2',
          red: '#ED4956',
        },
        ig: {
          bg: '#000000',
          elevated: '#121212',
          card: '#181818',
          border: '#262626',
          muted: '#8E8E8E',
          secondary: '#737373',
          lightBg: '#FAFAFA',
          lightCard: '#FFFFFF',
          lightBorder: '#DBDBDB'
        }
      },
      keyframes: {
        heartBurst: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '0' }
        }
      },
      animation: {
        'heart-burst': 'heartBurst 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
      }
    },
  },
  plugins: [],
}
