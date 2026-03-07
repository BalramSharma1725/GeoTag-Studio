/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        surface3: 'var(--color-surface3)',
        border: 'var(--color-border)',
        border2: 'var(--color-border2)',
        accent: 'var(--color-accent)',
        accent2: 'var(--color-accent2)',
        accent3: 'var(--color-accent3)',
        muted: 'var(--color-muted)',
        text: 'var(--color-text)',
      },
    },
  },
  plugins: [],
}
