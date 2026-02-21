import { motion } from 'framer-motion'
import { useStore } from '../../context/store'
import { formatFileSize } from '../../utils/exif'
import { slideUp } from '../../animations/variants'

export default function ExportView({ onDownloadAll, onDownloadEdited, onDownloadSingle }) {
  const { images } = useStore()
  const edited = images.filter((i) => i.editedGps)

  return (
    <motion.div {...slideUp} className="flex-1 overflow-y-auto p-6 max-w-2xl">
      <h2 className="font-display text-xl font-black mb-1">Export Images</h2>
      <p className="text-muted text-[13px] mb-6">Download your GPS-tagged images individually or as a ZIP archive.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="font-display text-3xl font-black text-accent">{images.length}</div>
          <div className="text-[12px] text-muted mt-1">Total Images</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="font-display text-3xl font-black text-accent3">{edited.length}</div>
          <div className="text-[12px] text-muted mt-1">GPS Edited</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onDownloadAll} className="btn btn-primary">
          ⬇ Download ZIP (All)
        </motion.button>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onDownloadEdited} className="btn btn-ghost">
          ⬇ Download ZIP (Edited Only)
        </motion.button>
      </div>

      {/* Image list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-mono text-[10px] text-border2 uppercase tracking-widest">
          {images.length} Images
        </div>
        {images.length === 0 ? (
          <div className="p-6 text-center text-muted text-sm">No images loaded</div>
        ) : (
          <div className="divide-y divide-border">
            {images.map((img) => {
              const gps = img.editedGps
              const isEdited = gps && (!img.originalExif?.gps ||
                gps.lat !== img.originalExif.gps.lat || gps.lng !== img.originalExif.gps.lng)

              return (
                <div key={img.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface2 transition-colors">
                  <img src={img.dataUrl} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-border" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{img.name}</div>
                    <div className="font-mono text-[11px] text-border2 flex gap-2 flex-wrap">
                      {gps ? <span>📍 {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</span> : <span>No GPS</span>}
                      {isEdited && <span className="text-accent3">● Edited</span>}
                      {img.processed && <span className="text-green-400">✓ Processed</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onDownloadSingle(img.id)}
                    className="btn btn-ghost btn-sm text-[11px] flex-shrink-0"
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
