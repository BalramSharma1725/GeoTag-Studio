import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../context/store'
import { modalOverlay, modalContent } from '../animations/variants'

export default function BulkMetadataEditor({ isOpen, onClose, showToast, processImages }) {
  const { images, selected, updateBatchMeta } = useStore()
  const [globalKeywords, setGlobalKeywords] = useState('')
  const [globalDescription, setGlobalDescription] = useState('')
  const [globalLat, setGlobalLat] = useState('')
  const [globalLng, setGlobalLng] = useState('')
  const [edits, setEdits] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (isOpen) {
      if (images.length > 0) {
        const firstWithKeys = images.find(img => img.keywords)
        const firstWithDesc = images.find(img => img.description)
        const firstWithGps = images.find(img => img.editedGps)
        setGlobalKeywords(firstWithKeys ? firstWithKeys.keywords : '')
        setGlobalDescription(firstWithDesc ? firstWithDesc.description : '')
        setGlobalLat(firstWithGps?.editedGps ? firstWithGps.editedGps.lat : '')
        setGlobalLng(firstWithGps?.editedGps ? firstWithGps.editedGps.lng : '')
      }
      const initial = {}
      images.forEach((img) => { initial[img.id] = { altText: img.altText || '' } })
      setEdits(initial)
      setFilter('all')
    }
  }, [isOpen, images])

  const updateAlt = useCallback((id, value) => {
    setEdits((prev) => ({ ...prev, [id]: { altText: value } }))
  }, [])

  const handleFillDownAlt = useCallback(() => {
    setEdits((prev) => {
      const next = { ...prev }
      if (!images.length) return next
      const sourceValue = next[images[0].id]?.altText
      if (!sourceValue) return next
      let count = 0
      images.forEach((img) => {
        if (img.id !== images[0].id) { next[img.id] = { altText: sourceValue }; count++ }
      })
      showToast(`Copied ALT Text to ${count} images`, 'success')
      return next
    })
  }, [images, showToast])

  const handleSaveAll = useCallback(async () => {
    const hasLat = String(globalLat).trim() !== ''
    const hasLng = String(globalLng).trim() !== ''
    let latNum = NaN, lngNum = NaN

    if (hasLat || hasLng) {
      latNum = parseFloat(globalLat)
      lngNum = parseFloat(globalLng)
      if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        showToast('Invalid GPS coordinates', 'error')
        return
      }
    }

    const updates = Object.entries(edits).map(([id, meta]) => {
      const updateData = {
        id: parseInt(id),
        altText: (meta.altText || '').trim(),
        keywords: globalKeywords.trim(),
        description: globalDescription.trim(),
      }
      if (hasLat && hasLng) { updateData.lat = latNum; updateData.lng = lngNum }
      return updateData
    })

    updateBatchMeta(updates)
    onClose()
    const targetIds = updates.map((u) => u.id)
    await processImages(targetIds)
    showToast(`Saved and processed metadata for ${updates.length} files`, 'success')
  }, [edits, globalKeywords, globalDescription, globalLat, globalLng, updateBatchMeta, showToast, onClose, processImages])

  const filteredImages = images.filter((img) => {
    if (filter === 'selected') return selected.has(img.id)
    if (filter === 'noMeta') return !(edits[img.id]?.altText)
    return true
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        {...modalOverlay}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1100]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-label="Bulk metadata editor"
        aria-modal="true"
      >
        <motion.div
          {...modalContent}
          className="rounded-2xl overflow-hidden w-[900px] max-w-[95vw] h-[85vh] shadow-2xl flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border2)' }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                📝 Bulk Metadata Editor
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                Apply shared tags + unique ALT text per image
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost text-[12px]" aria-label="Close bulk editor">✕ Close</button>
          </div>

          {/* Shared Fields */}
          <div className="px-5 py-4 flex flex-col gap-3 flex-shrink-0" style={{ background: 'var(--color-surface2)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
              1. Shared Metadata (All images)
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <div>
                <label className="text-[11px] block mb-1 font-mono uppercase tracking-wide" style={{ color: 'var(--color-border2)' }}>Keywords / Tags</label>
                <textarea className="input-field text-[12px] resize-none w-full" rows={2} placeholder="tag1, tag2, tag3" value={globalKeywords} onChange={(e) => setGlobalKeywords(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] block mb-1 font-mono uppercase tracking-wide" style={{ color: 'var(--color-border2)' }}>Image Description</label>
                <textarea className="input-field text-[12px] resize-none w-full" rows={2} placeholder="Globally applied description..." value={globalDescription} onChange={(e) => setGlobalDescription(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 mt-1">
              <div>
                <label className="text-[11px] block mb-1 font-mono uppercase tracking-wide" style={{ color: 'var(--color-border2)' }}>Latitude (Optional)</label>
                <input type="number" step="0.000001" min="-90" max="90" className="input-field text-[12px] w-full py-1.5" placeholder="e.g. 40.7128" value={globalLat} onChange={(e) => setGlobalLat(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] block mb-1 font-mono uppercase tracking-wide" style={{ color: 'var(--color-border2)' }}>Longitude (Optional)</label>
                <input type="number" step="0.000001" min="-180" max="180" className="input-field text-[12px] w-full py-1.5" placeholder="e.g. -74.006" value={globalLng} onChange={(e) => setGlobalLng(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Table Toolbar */}
          <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>2. Unique ALT Text</span>
            <div className="w-px h-4 mx-2" style={{ background: 'var(--color-border)' }} />
            {[
              { id: 'all', label: `All (${images.length})` },
              { id: 'selected', label: `Selected (${selected.size})` },
              { id: 'noMeta', label: 'Missing ALT' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="text-[11px] px-2.5 py-1 rounded-lg border transition-all"
                style={{
                  borderColor: filter === f.id ? 'var(--color-accent)' : 'var(--color-border)',
                  color: filter === f.id ? 'var(--color-accent)' : 'var(--color-muted)',
                  background: filter === f.id ? 'var(--accent-glow)' : 'transparent',
                }}
              >
                {f.label}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={handleFillDownAlt} className="text-[10px] border border-border rounded px-1.5 py-0.5 hover:text-text text-muted transition-colors" title="Copy first row ALT text to all">
              ↓ Fill Down
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-1 pb-4">
            {filteredImages.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                <span className="text-3xl block mb-2">🧾</span>
                No images match the current filter
              </div>
            ) : (
              <table className="w-full text-left text-[12px] border-collapse" style={{ color: 'var(--color-text)' }}>
                <thead className="sticky top-0 z-10" style={{ background: 'var(--color-surface)', boxShadow: '0 1px 0 var(--color-border)' }}>
                  <tr>
                    <th className="py-3 px-3 font-medium w-[250px]" style={{ color: 'var(--color-muted)' }}>Image File</th>
                    <th className="py-3 px-3 font-medium" style={{ color: 'var(--color-muted)' }}>ALT Text</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImages.map((img) => {
                    const e = edits[img.id] || { altText: '' }
                    return (
                      <tr key={img.id} className="group transition-colors hover:bg-black/5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td className="py-2 px-3 align-middle w-[250px] max-w-[250px]">
                          <div className="flex items-center gap-3">
                            <img src={img.dataUrl} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" style={{ border: '1px solid var(--color-border)' }} loading="lazy" />
                            <div className="truncate font-medium flex-1" title={img.name}>{img.name}</div>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <input
                            className="w-full px-3 py-2 rounded transition-all outline-none"
                            placeholder={`Unique ALT text for ${img.name}...`}
                            value={e.altText}
                            onChange={(ev) => updateAlt(img.id, ev.target.value)}
                            maxLength={250}
                            aria-label={`Alt text for ${img.name}`}
                            style={{ background: 'var(--color-surface2)', border: '1px solid transparent' }}
                            onFocus={(ev) => { ev.target.style.borderColor = 'var(--color-accent)' }}
                            onBlur={(ev) => { ev.target.style.borderColor = 'transparent' }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <div className="flex-1" />
            <button onClick={onClose} className="btn btn-ghost text-[12px]">Cancel</button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAll}
              className="btn btn-primary text-[12px]"
            >
              💾 Save & Process All
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
