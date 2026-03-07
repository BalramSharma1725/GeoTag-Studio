import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalOverlay, modalContent } from '../../animations/variants'

const SCOPES = [
  { value: 'current', label: 'Apply to current image' },
  { value: 'selected', label: 'Apply to selected images' },
  { value: 'all', label: 'Apply to all images' },
]

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
      if (leafletMap.current) return
      await new Promise((r) => setTimeout(r, 100))
      if (!mapRef.current) return
      const center = initialCenter || [20, 0]
      const m = L.map(mapRef.current, { center, zoom: initialCenter ? 10 : 2 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(m)
      m.on('click', (e) => {
        const { lat, lng } = e.latlng
        setPicked({ lat, lng })
        if (markerRef.current) markerRef.current.setLatLng(e.latlng)
        else markerRef.current = L.marker(e.latlng).addTo(m)
      })
      leafletMap.current = m
    }
    initMap()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && leafletMap.current) {
      leafletMap.current.remove()
      leafletMap.current = null
      markerRef.current = null
      setPicked(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => leafletMap.current?.invalidateSize(), 200)
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
          role="dialog"
          aria-label="Map picker"
          aria-modal="true"
        >
          <motion.div
            {...modalContent}
            className="rounded-2xl overflow-hidden w-[700px] max-w-[95vw] shadow-2xl flex flex-col"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border2)' }}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div className="font-display text-base font-bold" style={{ color: 'var(--color-text)' }}>📍 Pick Location</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-muted)' }}>Click anywhere on the map to set GPS coordinates</div>
              </div>
              <button onClick={onClose} className="btn btn-ghost text-[12px]" aria-label="Close map picker">✕ Close</button>
            </div>

            <div ref={mapRef} style={{ height: '400px', width: '100%' }} role="application" aria-label="Map for selecting GPS coordinates" />

            <div className="px-5 py-3 flex items-center gap-3 max-md:flex-wrap"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <div className="flex-1 font-mono text-[12px]" style={{ color: 'var(--color-muted)' }}>
                {picked ? (
                  <>Lat: <span style={{ color: 'var(--color-accent)' }}>{picked.lat.toFixed(6)}</span>{' '}
                   Lng: <span style={{ color: 'var(--color-accent)' }}>{picked.lng.toFixed(6)}</span></>
                ) : 'No location selected — click on the map'}
              </div>
              <select
                value={applyScope}
                onChange={(e) => setApplyScope(e.target.value)}
                className="text-[12px] px-2 py-1.5 rounded-lg cursor-pointer outline-none"
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                aria-label="Apply scope"
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
                id="apply-coords-btn"
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
