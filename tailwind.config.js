/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9fe',
          300: '#a1c0fd',
          400: '#739dfa',
          500: '#4875f5',
          600: '#2c53ea',
          700: '#223ecb',
          800: '#2034a4',
          900: '#1e3082',
          950: '#141d4f',
        }
      }
    },
  },
  plugins: [],
}
