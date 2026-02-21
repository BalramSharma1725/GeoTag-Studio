import { AnimatePresence, motion } from 'framer-motion'

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] text-text bg-surface2 border shadow-xl max-w-[300px]
              ${t.type === 'success' ? 'border-accent/30' : 'border-red-400/30'}`}
          >
            <span>{t.type === 'success' ? '✅' : '❌'}</span>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
