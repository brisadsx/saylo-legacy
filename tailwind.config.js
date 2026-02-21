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
          bg: '#0f172a',
          card: '#1e293b',
          text: '#f8fafc',
          muted: '#94a3b8',
          primary: '#6366f1',
          secondary: '#10b981',
          accent: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}