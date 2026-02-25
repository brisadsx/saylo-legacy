/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saylo: {
          cream: '#F2E3D0',
          blue: '#B1C7DE',
          black: '#000000',
          gray: '#7C7D81',
        }
      },
      fontFamily: {
        'sans': ['"NeueHaasThin"', 'sans-serif'], 
      },
      
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards', 
      }
    },
  },
  plugins: [],
}