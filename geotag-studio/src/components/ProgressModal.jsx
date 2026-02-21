import { motion, AnimatePresence } from 'framer-motion'
import { modalOverlay, modalContent } from '../animations/variants'

export default function ProgressModal({ progress, onClose }) {
  if (!progress) return null
  
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  
  return (
    <AnimatePresence>
      <motion.div
        {...modalOverlay}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      >
        <motion.div
          {...modalContent}
          className="bg-surface border border-border2 rounded-2xl p-7 w-[460px] max-w-[90vw] shadow-2xl"
        >
          <div className="font-display text-xl font-black mb-1 text-text">
            {progress.finished ? '✓ Done!' : 'Processing Images…'}
          </div>
          <div className="text-sm text-muted mb-5">
            Embedding GPS EXIF metadata — all processing happens locally
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-surface3 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #6ee7b7, #38bdf8)',
                width: `${pct}%`,
              }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="font-mono text-[12px] text-border2 mb-3">
            {progress.done} / {progress.total}
          </div>
          {/* Step log */}
          <div className="max-h-[200px] overflow-y-auto mb-4 space-y-px">
            {progress.steps?.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 py-1.5 text-[12.5px] text-muted border-b border-border"
              >
                <span className="w-5 text-center flex-shrink-0">{s.icon}</span>
                <span className="truncate">{s.msg}</span>
              </motion.div>
            ))}
          </div>
          {progress.finished && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={onClose}
              className="btn btn-ghost w-full justify-center"
            >
              ✓ Close
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}