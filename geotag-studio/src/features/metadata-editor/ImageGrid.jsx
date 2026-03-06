import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../context/store'
import { formatFileSize } from '../../utils/exif'
import { staggerContainer, cardItem } from '../../animations/variants'

export default function ImageGrid() {
  const { images, selected, activeId, toggleSelect, setActive } = useStore()

  if (!images.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm flex-col gap-2" style={{ color: 'var(--color-muted)' }}>
        <span className="text-4xl" aria-hidden="true">🖼️</span>
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
      role="grid"
      aria-label="Image grid"
    >
      <AnimatePresence>
        {images.map((img) => {
          const isSelected = selected.has(img.id)
          const isActive = activeId === img.id
          const hasGps = !!img.originalExif?.gps
          const hasMeta = !!(img.keywords || img.description || img.altText)
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
              className="relative rounded-xl cursor-pointer transition-all duration-150 overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                border: isActive
                  ? '2px solid var(--color-accent2)'
                  : isSelected
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                boxShadow: isActive
                  ? '0 0 0 2px rgba(56,189,248,0.2)'
                  : isSelected
                  ? '0 0 0 2px rgba(110,231,183,0.2)'
                  : 'none',
              }}
              role="gridcell"
              tabIndex={0}
              aria-label={`Image: ${img.name}${img.altText ? '. Alt: ' + img.altText : ''}${isEdited ? '. GPS edited' : hasGps ? '. Has GPS' : ''}`}
              aria-selected={isActive}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(img.id) } }}
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
                  aria-label={`Select ${img.name}`}
                  tabIndex={-1}
                />
              </div>

              {/* Badges */}
              <div className="absolute top-1.5 right-1.5 z-10 flex gap-1">
                {isEdited && (
                  <div className="text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--color-accent3)' }} aria-label="GPS edited">
                    EDITED
                  </div>
                )}
                {!isEdited && hasGps && (
                  <div className="text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--color-accent2)' }} aria-label="Has GPS data">
                    GPS
                  </div>
                )}
                {hasMeta && (
                  <div className="text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--color-accent)' }} aria-label="Has metadata">
                    META
                  </div>
                )}
              </div>

              {img.processed && (
                <div className="absolute bottom-8 right-1.5 z-10 bg-green-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded" aria-label="Processed">
                  ✓
                </div>
              )}

              <img
                src={img.dataUrl}
                alt={img.altText || img.name}
                className="w-full aspect-square object-cover block"
                style={{ background: 'var(--color-surface2)' }}
                loading="lazy"
              />
              <div className="p-2">
                <div className="text-[11.5px] font-medium truncate" style={{ color: 'var(--color-text)' }} title={img.name}>
                  {img.name}
                </div>
                <div className="font-mono text-[10px]" style={{ color: 'var(--color-border2)' }}>
                  {formatFileSize(img.size)}
                </div>
                {img.altText && (
                  <div className="font-mono text-[9px] truncate mt-0.5" style={{ color: 'var(--color-muted)' }} title={img.altText}>
                    ALT: {img.altText}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
