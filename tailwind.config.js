/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3fd',
          300: '#93d0fb',
          400: '#60b3f7',
          500: '#3b93f2',
          600: '#1e6fe6',
          700: '#1a59d4',
          800: '#1c48ab',
          900: '#1c3f87',
          950: '#152852',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
