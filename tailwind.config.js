/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './services/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
          500: '#22c55e', 600: '#16a34a', 700: '#2D6A4F', 800: '#1b4332', 900: '#081c15',
        },
        warm: {
          50: '#fdfbf7', 100: '#f8f2e9', 200: '#eddcc5', 300: '#e1c39e', 400: '#d4a373',
          500: '#c58b54', 600: '#ad723e', 700: '#8b5630',
        },
      },
    },
  },
  plugins: [],
};
