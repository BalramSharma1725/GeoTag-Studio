import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../context/store'
import { formatFileSize } from '../../utils/exif'
import { staggerContainer, cardItem } from '../../animations/variants'

export default function ImageGrid() {
  const { images, selected, activeId, toggleSelect, setActive } = useStore()

  if (!images.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm flex-col gap-2">
        <span className="text-4xl">🖼️</span>
        No images loaded
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex-1 overflow-y-auto p-4 grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', alignContent: 'start' }}
    >
      <AnimatePresence>
        {images.map((img) => {
          const isSelected = selected.has(img.id)
          const isActive = activeId === img.id
          const hasGps = !!img.originalExif?.gps
          const isEdited = img.editedGps && (
            !img.originalExif?.gps ||
            img.editedGps.lat !== img.originalExif.gps.lat ||
            img.editedGps.lng !== img.originalExif.gps.lng
          )

          return (
            <motion.div
              key={img.id}
              variants={cardItem}
              layout
              onClick={() => setActive(img.id)}
              className={`relative bg-surface rounded-xl border cursor-pointer transition-all duration-150 overflow-hidden
                ${isActive ? 'border-accent2 shadow-[0_0_0_2px_rgba(56,189,248,0.2)]' : ''}
                ${isSelected && !isActive ? 'border-accent shadow-[0_0_0_2px_rgba(110,231,183,0.2)]' : ''}
                ${!isActive && !isSelected ? 'border-border hover:border-border2 hover:-translate-y-0.5 hover:shadow-xl' : ''}`}
            >
              {/* Checkbox */}
              <div
                className="absolute top-1.5 left-1.5 z-10"
                onClick={(e) => { e.stopPropagation(); toggleSelect(img.id) }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 cursor-pointer accent-accent"
                />
              </div>

              {/* Badge */}
              {isEdited ? (
                <div className="absolute top-1.5 right-1.5 z-10 bg-accent3 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  EDITED
                </div>
              ) : hasGps ? (
                <div className="absolute top-1.5 right-1.5 z-10 bg-accent2 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  GPS
                </div>
              ) : null}

              {/* Processed badge */}
              {img.processed && (
                <div className="absolute bottom-8 right-1.5 z-10 bg-green-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  ✓
                </div>
              )}

              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full aspect-square object-cover block bg-surface2"
                loading="lazy"
              />
              <div className="p-2">
                <div className="text-[11.5px] font-medium text-text truncate" title={img.name}>
                  {img.name}
                </div>
                <div className="font-mono text-[10px] text-border2">{formatFileSize(img.size)}</div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
