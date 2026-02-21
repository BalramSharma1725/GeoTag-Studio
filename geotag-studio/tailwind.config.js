/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#18181f',
        surface3: '#22222c',
        border: '#2a2a38',
        border2: '#383850',
        accent: '#6ee7b7',
        accent2: '#38bdf8',
        accent3: '#f472b6',
        muted: '#9898b0',
        text: '#e8e8f0',
      },
    },
  },
  plugins: [],
}
