import { motion } from 'framer-motion'
import { useStore } from '../../context/store'
import { formatFileSize } from '../../utils/exif'
import { slideUp } from '../../animations/variants'

export default function ExportView({ onDownloadAll, onDownloadEdited, onDownloadSingle }) {
  const { images } = useStore()
  const edited = images.filter((i) => i.editedGps)
  const withMeta = images.filter((i) => i.keywords || i.description || i.altText)

  return (
    <motion.div {...slideUp} className="flex-1 overflow-y-auto p-6 max-w-2xl">
      <h2 className="font-display text-xl font-black mb-1" style={{ color: 'var(--color-text)' }}>Export Images</h2>
      <p className="text-[15px] mb-6" style={{ color: 'var(--color-muted)' }}>
        Download your GPS-tagged images individually or as a ZIP archive.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { val: images.length, label: 'Total Images', color: 'var(--color-accent)' },
          { val: edited.length, label: 'GPS Edited', color: 'var(--color-accent3)' },
          { val: withMeta.length, label: 'Has Metadata', color: 'var(--color-accent2)' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="font-display text-3xl font-black" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[14px] mt-1" style={{ color: 'var(--color-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={onDownloadAll} className="btn btn-primary" id="download-all-btn"
        >
          ⬇ Download ZIP (All)
        </motion.button>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={onDownloadEdited} className="btn btn-ghost" id="download-edited-btn"
        >
          ⬇ Download ZIP (Edited Only)
        </motion.button>
      </div>

      {/* Image list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-4 py-3 font-mono text-[12px] uppercase tracking-widest"
          style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-border2)' }}
        >
          {images.length} Images
        </div>
        {images.length === 0 ? (
          <div className="p-6 text-center text-base" style={{ color: 'var(--color-muted)' }}>No images loaded</div>
        ) : (
          <div role="list" aria-label="Export image list">
            {images.map((img, idx) => {
              const gps = img.editedGps
              const isEdited = gps && (!img.originalExif?.gps ||
                gps.lat !== img.originalExif.gps.lat || gps.lng !== img.originalExif.gps.lng)
              const hasMeta = !!(img.keywords || img.description || img.altText)

              return (
                <div key={img.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:opacity-80"
                  style={{ borderBottom: idx < images.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  role="listitem"
                >
                  <img src={img.dataUrl} alt={img.altText || img.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                    style={{ border: '1px solid var(--color-border)' }} loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium truncate" style={{ color: 'var(--color-text)' }}>{img.name}</div>
                    <div className="font-mono text-[13px] flex gap-2 flex-wrap" style={{ color: 'var(--color-border2)' }}>
                      {gps ? <span>📍 {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span> : <span>No GPS</span>}
                      {isEdited && <span style={{ color: 'var(--color-accent3)' }}>● Edited</span>}
                      {img.processed && <span className="text-green-400">✓ Processed</span>}
                      {hasMeta && <span style={{ color: 'var(--color-accent2)' }}>📝 Meta</span>}
                    </div>
                    {img.altText && (
                      <div className="font-mono text-[12px] truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        ALT: {img.altText}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDownloadSingle(img.id)}
                    className="btn btn-ghost btn-sm text-[13px] flex-shrink-0"
                    aria-label={`Download ${img.name}`}
                  >
                    ⬇
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
