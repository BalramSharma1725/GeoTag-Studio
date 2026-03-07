import { useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../context/store'

const THEMES = [
  { id: 'dark', icon: '🌙', label: 'Dark' },
  { id: 'light', icon: '☀️', label: 'Light' },
  { id: 'auto', icon: '💻', label: 'System' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useStore()

  useEffect(() => {
    const root = document.documentElement
    let resolvedTheme = theme
    if (theme === 'auto') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    if (resolvedTheme === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else {
      root.classList.remove('light-theme')
      root.classList.add('dark-theme')
    }

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e) => {
        if (e.matches) {
          root.classList.remove('light-theme')
          root.classList.add('dark-theme')
        } else {
          root.classList.add('light-theme')
          root.classList.remove('dark-theme')
        }
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  const cycleTheme = useCallback(() => {
    const idx = THEMES.findIndex((t) => t.id === theme)
    const next = THEMES[(idx + 1) % THEMES.length]
    setTheme(next.id)
  }, [theme, setTheme])

  const current = THEMES.find((t) => t.id === theme) || THEMES[0]

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-[13px] text-muted hover:text-text hover:border-border2 transition-all"
      title={`Theme: ${current.label}`}
      aria-label={`Switch theme. Current: ${current.label}`}
      id="theme-toggle"
    >
      <span>{current.icon}</span>
      <span className="font-mono">{current.label}</span>
    </motion.button>
  )
}
