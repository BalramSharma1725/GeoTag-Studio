import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../context/store'
import { modalOverlay, modalContent } from '../animations/variants'
import { isValidCoords } from '../utils/exif'

/**
 * CSV/GPX Importer — Spec §2 (CSV/GPX Coordinate Import)
 * Parses CSV (filename, lat, lng, keywords, description, altText) and GPX tracks.
 * Shows preview modal before applying. Matches by filename or sequential order.
 */
export default function CsvImporter({ isOpen, onClose, showToast }) {
  const { images, updateBatchMeta } = useStore()
  const [matchedRows, setMatchedRows] = useState([])
  const [unmatchedRows, setUnmatchedRows] = useState([])
  const [csvData, setCsvData] = useState([])
  const [step, setStep] = useState('upload')
  const [error, setError] = useState('')

  const parseCSV = useCallback((text) => {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) { setError('CSV must have a header row and at least one data row'); return null }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
    const colMap = {}
    const possibleNames = {
      filename: ['filename', 'file', 'image', 'name', 'file_name'],
      lat: ['lat', 'latitude', 'gps_lat'],
      lng: ['lng', 'lon', 'longitude', 'long', 'gps_lng', 'gps_lon'],
      keywords: ['keywords', 'tags', 'keyword'],
      description: ['description', 'desc', 'caption'],
      altText: ['alt', 'alttext', 'alt_text', 'alternative'],
    }
    for (const [field, aliases] of Object.entries(possibleNames)) {
      const idx = headers.findIndex((h) => aliases.includes(h))
      if (idx !== -1) colMap[field] = idx
    }
    if (colMap.filename === undefined) { setError('CSV must have a "filename" column'); return null }

    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const cols = []
      let current = '', inQuotes = false
      for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') inQuotes = !inQuotes
        else if (line[c] === ',' && !inQuotes) { cols.push(current.trim()); current = '' }
        else current += line[c]
      }
      cols.push(current.trim())
      rows.push({
        filename: cols[colMap.filename] || '',
        lat: colMap.lat !== undefined ? parseFloat(cols[colMap.lat]) : undefined,
        lng: colMap.lng !== undefined ? parseFloat(cols[colMap.lng]) : undefined,
        keywords: colMap.keywords !== undefined ? cols[colMap.keywords] || '' : undefined,
        description: colMap.description !== undefined ? cols[colMap.description] || '' : undefined,
        altText: colMap.altText !== undefined ? cols[colMap.altText] || '' : undefined,
        lineNumber: i + 1,
      })
    }
    return rows
  }, [])

  // Parse GPX file
  const parseGPX = useCallback((text) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      const waypoints = doc.querySelectorAll('wpt')
      const trackpoints = doc.querySelectorAll('trkpt')
      const points = waypoints.length > 0 ? waypoints : trackpoints

      if (points.length === 0) { setError('No waypoints or track points found in GPX file'); return null }

      const rows = []
      points.forEach((pt, i) => {
        const lat = parseFloat(pt.getAttribute('lat'))
        const lng = parseFloat(pt.getAttribute('lon'))
        const nameEl = pt.querySelector('name')
        const descEl = pt.querySelector('desc')
        rows.push({
          filename: nameEl ? nameEl.textContent : `point_${i + 1}`,
          lat, lng,
          description: descEl ? descEl.textContent : '',
          lineNumber: i + 1,
        })
      })
      return rows
    } catch { setError('Failed to parse GPX file'); return null }
  }, [])

  const matchToImages = useCallback((rows) => {
    const matched = [], unmatched = []
    rows.forEach((row) => {
      const normalizedRowName = row.filename.toLowerCase().replace(/\.[^.]+$/, '')
      const match = images.find((img) => {
        const normalizedImgName = img.name.toLowerCase().replace(/\.[^.]+$/, '')
        return normalizedImgName === normalizedRowName || img.name.toLowerCase() === row.filename.toLowerCase()
      })
      if (match) {
        matched.push({ ...row, imageId: match.id, imageName: match.name, imageThumb: match.dataUrl, hasGpsUpdate: !isNaN(row.lat) && !isNaN(row.lng) && isValidCoords(row.lat, row.lng) })
      } else {
        unmatched.push(row)
      }
    })
    // If no filename matches and counts match, assign sequentially
    if (matched.length === 0 && rows.length === images.length) {
      rows.forEach((row, i) => {
        const img = images[i]
        matched.push({ ...row, imageId: img.id, imageName: img.name, imageThumb: img.dataUrl, hasGpsUpdate: !isNaN(row.lat) && !isNaN(row.lng) && isValidCoords(row.lat, row.lng) })
      })
      unmatched.length = 0
    }
    return { matched, unmatched }
  }, [images])

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const isGpx = file.name.toLowerCase().endsWith('.gpx') || text.trim().startsWith('<?xml')
      const rows = isGpx ? parseGPX(text) : parseCSV(text)
      if (!rows) return
      setCsvData(rows)
      const { matched, unmatched } = matchToImages(rows)
      setMatchedRows(matched)
      setUnmatchedRows(unmatched)
      setStep('preview')
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsText(file)
  }, [parseCSV, parseGPX, matchToImages])

  const handleApply = useCallback(() => {
    if (!matchedRows.length) return
    const updates = matchedRows.map((row) => ({
      id: row.imageId,
      keywords: row.keywords,
      description: row.description,
      altText: row.altText,
      lat: row.hasGpsUpdate ? row.lat : undefined,
      lng: row.hasGpsUpdate ? row.lng : undefined,
    }))
    updateBatchMeta(updates)
    showToast(`Applied metadata to ${matchedRows.length} image${matchedRows.length !== 1 ? 's' : ''}`, 'success')
    if (unmatchedRows.length) showToast(`${unmatchedRows.length} row${unmatchedRows.length !== 1 ? 's' : ''} couldn't be matched`, 'warning')
    setStep('done')
    setTimeout(onClose, 1200)
  }, [matchedRows, unmatchedRows, updateBatchMeta, showToast, onClose])

  const handleReset = useCallback(() => {
    setCsvData([]); setMatchedRows([]); setUnmatchedRows([]); setStep('upload'); setError('')
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        {...modalOverlay}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1100]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-label="CSV/GPX import"
        aria-modal="true"
      >
        <motion.div
          {...modalContent}
          className="rounded-2xl overflow-hidden w-[700px] max-w-[95vw] max-h-[85vh] shadow-2xl flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border2)' }}
        >
          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>📄 Import CSV / GPX</div>
              <div className="text-[14px] mt-0.5" style={{ color: 'var(--color-muted)' }}>Batch import metadata from a CSV or GPX file</div>
            </div>
            <button onClick={onClose} className="btn btn-ghost text-[14px]" aria-label="Close importer">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {step === 'upload' && (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--color-border2)' }}
                  onClick={() => document.getElementById('csv-gpx-input').click()}
                  role="button"
                  aria-label="Click to select CSV or GPX file"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('csv-gpx-input').click() }}
                >
                  <span className="text-4xl block mb-3">📋</span>
                  <div className="font-display font-bold" style={{ color: 'var(--color-text)' }}>Drop CSV or GPX file here</div>
                  <div className="text-[14px] mt-1" style={{ color: 'var(--color-muted)' }}>or click to browse</div>
                  <input id="csv-gpx-input" type="file" accept=".csv,.txt,.gpx" onChange={handleFileUpload} className="hidden" />
                </div>

                <div className="rounded-xl p-4" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                  <div className="font-mono text-[13px] uppercase tracking-wider mb-2" style={{ color: 'var(--color-accent)' }}>Expected CSV Format</div>
                  <div className="font-mono text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                    <div style={{ color: 'var(--color-accent2)' }}>filename, lat, lng, keywords, description, alt</div>
                    <div>photo1.jpg, 40.7128, -74.0060, "city, skyline", "NYC", "Skyline view"</div>
                  </div>
                  <div className="mt-2 text-[12px]" style={{ color: 'var(--color-border2)' }}>
                    Only <strong>filename</strong> is required. GPX files with waypoints are also supported.
                  </div>
                </div>

                <button
                  onClick={() => {
                    const headers = 'filename,lat,lng,keywords,description,alt'
                    const rows = images.map((img) =>
                      `"${img.name}",${img.editedGps?.lat || ''},${img.editedGps?.lng || ''},"${img.keywords || ''}","${img.description || ''}","${img.altText || ''}"`
                    )
                    const csv = [headers, ...rows].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = 'geotag-studio-template.csv'; a.click()
                    URL.revokeObjectURL(url)
                    showToast('Template CSV downloaded', 'success')
                  }}
                  className="btn btn-ghost text-[14px] w-full justify-center"
                >
                  ⬇ Download CSV Template
                </button>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-[14px]" style={{ color: '#f87171' }} role="alert">
                    ❌ {error}
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: csvData.length, label: 'Total Rows', color: 'var(--color-text)' },
                    { val: matchedRows.length, label: 'Matched', color: 'var(--color-accent)' },
                    { val: unmatchedRows.length, label: 'Unmatched', color: '#f87171' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg p-3 text-center" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                      <div className="font-display text-2xl font-black" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-[13px]" style={{ color: 'var(--color-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {matchedRows.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                    <div className="px-4 py-2 font-mono text-[12px] uppercase tracking-wider" style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-accent)' }}>
                      ✓ Matched ({matchedRows.length})
                    </div>
                    <div className="divide-y max-h-[250px] overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
                      {matchedRows.map((row, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                          <img src={row.imageThumb} alt="" className="w-8 h-8 object-cover rounded" style={{ border: '1px solid var(--color-border)' }} loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium" style={{ color: 'var(--color-text)' }}>{row.imageName}</div>
                            <div className="font-mono text-[12px]" style={{ color: 'var(--color-border2)' }}>
                              {row.hasGpsUpdate && <span style={{ color: 'var(--color-accent)' }}>📍 {row.lat.toFixed(4)}, {row.lng.toFixed(4)} </span>}
                              {row.keywords && <span>🏷 {row.keywords.substring(0, 30)} </span>}
                              {row.altText && <span>🖼 {row.altText.substring(0, 30)}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={handleReset} className="btn btn-ghost text-[14px]">← Back</button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleApply}
                    disabled={!matchedRows.length}
                    className="btn btn-primary text-[14px] flex-1 justify-center"
                  >
                    ✓ Apply to {matchedRows.length} Image{matchedRows.length !== 1 ? 's' : ''}
                  </motion.button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-8">
                <span className="text-5xl block mb-3">✅</span>
                <div className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Import Complete!</div>
                <div className="text-[15px] mt-1" style={{ color: 'var(--color-muted)' }}>Applied metadata to {matchedRows.length} images</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
