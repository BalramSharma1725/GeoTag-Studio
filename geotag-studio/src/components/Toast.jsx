import { AnimatePresence, motion } from 'framer-motion'

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-2 max-md:right-3 max-md:bottom-3 max-md:left-3" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] shadow-xl max-w-[340px] max-md:max-w-full"
            style={{
              background: 'var(--color-surface2)',
              color: 'var(--color-text)',
              border: `1px solid ${
                t.type === 'success' ? 'rgba(110,231,183,0.3)' :
                t.type === 'warning' ? 'rgba(234,179,8,0.3)' :
                t.type === 'error' ? 'rgba(248,113,113,0.3)' :
                'rgba(56,189,248,0.3)'
              }`,
            }}
            role="alert"
          >
            <span>{t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
