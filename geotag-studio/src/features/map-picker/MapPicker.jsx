import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalOverlay, modalContent } from '../../animations/variants'

const SCOPES = [
  { value: 'current', label: 'Apply to current image' },
  { value: 'selected', label: 'Apply to selected images' },
  { value: 'all', label: 'Apply to all images' },
]

// same default as metadata editor
const DEFAULT_LAT = 26.716515168625
const DEFAULT_LNG = 88.4217989444778

export default function MapPicker({ isOpen, initialCenter, onApply, onClose }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markerRef = useRef(null)
  const [picked, setPicked] = useState(null)
  const [applyScope, setApplyScope] = useState('current')

  useEffect(() => {
    if (!isOpen) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      if (leafletMap.current) return // already initialized

      await new Promise((r) => setTimeout(r, 100))
      if (!mapRef.current) return

      const center = initialCenter || [DEFAULT_LAT, DEFAULT_LNG]
      const m = L.map(mapRef.current, { center, zoom: initialCenter ? 10 : 2 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(m)

      m.on('click', (e) => {
        const { lat, lng } = e.latlng
        setPicked({ lat, lng })
        if (markerRef.current) markerRef.current.setLatLng(e.latlng)
        else {
          markerRef.current = L.marker(e.latlng).addTo(m)
        }
      })

      leafletMap.current = m
    }

    initMap()
  }, [isOpen])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && leafletMap.current) {
      leafletMap.current.remove()
      leafletMap.current = null
      markerRef.current = null
      setPicked(null)
    }
  }, [isOpen])

  // Resize map when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => leafletMap.current?.invalidateSize(), 200)
    }
  }, [isOpen])

  const handleApply = () => {
    if (!picked) return
    onApply({ coords: picked, scope: applyScope })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...modalOverlay}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            {...modalContent}
            className="bg-surface border border-border2 rounded-2xl overflow-hidden w-[700px] max-w-[95vw] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display text-base font-bold text-text">📍 Pick Location</div>
                <div className="text-[12px] text-muted mt-0.5">Click anywhere on the map to set GPS coordinates</div>
              </div>
              <button onClick={onClose} className="btn btn-ghost text-[12px]">✕ Close</button>
            </div>

            {/* Map */}
            <div ref={mapRef} style={{ height: '400px', width: '100%' }} />

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex items-center gap-3">
              <div className="flex-1 font-mono text-[12px] text-muted">
                {picked ? (
                  <>Lat: <span className="text-accent">{picked.lat.toFixed(6)}</span>{' '}
                   Lng: <span className="text-accent">{picked.lng.toFixed(6)}</span></>
                ) : 'No location selected — click on the map'}
              </div>
              <select
                value={applyScope}
                onChange={(e) => setApplyScope(e.target.value)}
                className="bg-surface2 border border-border text-text text-[12px] px-2 py-1.5 rounded-lg cursor-pointer outline-none"
              >
                {SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <motion.button
                whileHover={picked ? { scale: 1.02 } : {}}
                onClick={handleApply}
                disabled={!picked}
                className="btn btn-primary"
              >
                Apply Coords
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
