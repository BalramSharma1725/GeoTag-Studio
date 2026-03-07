import { motion, AnimatePresence } from 'framer-motion'
import { modalOverlay, modalContent } from '../animations/variants'

export default function ProgressModal({ progress, onClose }) {
  if (!progress) return null
  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0
  const isFinished = progress.current >= progress.total

  return (
    <AnimatePresence>
      <motion.div
        {...modalOverlay}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
        role="dialog"
        aria-label="Processing progress"
        aria-modal="true"
      >
        <motion.div
          {...modalContent}
          className="rounded-2xl p-7 w-[460px] max-w-[90vw] shadow-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border2)' }}
        >
          <div className="font-display text-xl font-black mb-1" style={{ color: 'var(--color-text)' }}>
            {isFinished ? '✓ Done!' : 'Processing Images…'}
          </div>
          <div className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
            Embedding GPS & EXIF metadata — all processing happens locally
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--color-surface3)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent2))',
                width: `${pct}%`,
              }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="font-mono text-[12px] mb-3" style={{ color: 'var(--color-border2)' }}>
            {progress.current} / {progress.total}
            {progress.name && <span style={{ color: 'var(--color-muted)' }}> — {progress.name}</span>}
          </div>
          {isFinished && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onClose}
              className="btn btn-ghost w-full justify-center"
              aria-label="Close progress dialog"
            >
              ✓ Close
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}