/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      colors: {
        plum: {
          50: '#fbf8fc',
          100: '#f5eef8',
          200: '#ebd9f2',
          500: '#7e3af2',
          800: '#3b1c4a',
          900: '#271033',
          950: '#190822',
        },
        gold: {
          100: '#fbf6e9',
          200: '#f5e6c4',
          400: '#d4af37',
          500: '#b89225',
          600: '#967418',
        },
      },
      animation: {
        'pulse-fast': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
