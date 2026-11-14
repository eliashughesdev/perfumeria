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
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      colors: {
        noir: {
          50: '#f7f7f6',
          100: '#eeeeeb',
          200: '#d9d9d4',
          300: '#bdbdb5',
          400: '#9a9a90',
          500: '#77776c',
          600: '#55554c',
          700: '#3b3b34',
          800: '#262622',
          900: '#1a1a17',
          950: '#10100e',
        },
        champagne: {
          50: '#fdfaf3',
          100: '#faf3e3',
          200: '#f2e2bd',
          300: '#ecd49f',
          400: '#dfc28a',
          500: '#c9a765',
          600: '#a9864a',
          700: '#806438',
          800: '#5c4728',
          900: '#3a2d19',
        },
        cream: '#f7f0e1',
        plum: {
          50: '#f7f7f6',
          100: '#eeeeeb',
          200: '#d9d9d4',
          500: '#77776c',
          700: '#3b3b34',
          800: '#262622',
          900: '#1a1a17',
          950: '#10100e',
        },
        gold: {
          100: '#faf3e3',
          200: '#f2e2bd',
          300: '#ecd49f',
          400: '#dfc28a',
          500: '#c9a765',
          600: '#a9864a',
        },
      },
      animation: {
        'pulse-fast': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
