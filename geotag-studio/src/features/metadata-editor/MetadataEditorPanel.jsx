import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../context/store'
import { validateCoords, formatCoord, formatFileSize } from '../../utils/exif'
import { slideRight } from '../../animations/variants'
import AltTextPanel from '../../components/AltTextPanel'

const SCOPES = [
  { id: 'current', label: 'Current' },
  { id: 'selected', label: 'Selected' },
  { id: 'all', label: 'All' },
]

export default function MetadataEditorPanel({ onOpenMap, showToast }) {
  const { images, activeId, selected, applyGps, resetGps, undoGps, undoStack, updateMeta } = useStore()
  const img = images.find((i) => i.id === activeId)

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [scope, setScope] = useState('current')
  const [errors, setErrors] = useState({})
  const [keywords, setKeywords] = useState('')
  const [description, setDescription] = useState('')
  const [timestamp, setTimestamp] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markerRef = useRef(null)
  const mapInitialized = useRef(false)

  useEffect(() => {
    if (img) {
      setLat(img.editedGps ? img.editedGps.lat.toFixed(6) : '')
      setLng(img.editedGps ? img.editedGps.lng.toFixed(6) : '')
      setKeywords(img.keywords || '')
      setDescription(img.description || '')
      setTimestamp(img.timestamp || '')
    } else {
      setLat(''); setLng(''); setKeywords(''); setDescription(''); setTimestamp('')
    }
    setErrors({})
  }, [activeId, img])

  useEffect(() => {
    if (!mapRef.current || mapInitialized.current) return
    let destroyed = false
    const init = async () => {
      const L = (await import('leaflet')).default
      if (destroyed || mapInitialized.current || !mapRef.current) return
      mapInitialized.current = true
      const center = img && img.editedGps ? [img.editedGps.lat, img.editedGps.lng] : [20, 0]
      const zoom = img && img.editedGps ? 12 : 2
      const m = L.map(mapRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m)
      m.setView(center, zoom)
      if (img && img.editedGps) {
        markerRef.current = L.marker(center).addTo(m)
      }
      m.on('click', (e) => {
        setLat(e.latlng.lat.toFixed(6))
        setLng(e.latlng.lng.toFixed(6))
        setErrors({})
        if (markerRef.current) markerRef.current.setLatLng(e.latlng)
        else markerRef.current = L.marker(e.latlng).addTo(m)
      })
      leafletMap.current = m
    }
    init()
    return () => {
      destroyed = true
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
        markerRef.current = null
        mapInitialized.current = false
      }
    }
  }, [activeId])

  useEffect(() => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    if (!leafletMap.current) return
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return
    const pos = [latNum, lngNum]
    if (markerRef.current) {
      markerRef.current.setLatLng(pos)
    } else {
      import('leaflet').then(({ default: L }) => {
        if (!leafletMap.current) return
        markerRef.current = L.marker(pos).addTo(leafletMap.current)
      })
    }
    const currentZoom = leafletMap.current.getZoom()
    leafletMap.current.setView(pos, currentZoom < 5 ? 12 : currentZoom)
  }, [lat, lng])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(searchQuery)
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data = await res.json()
      if (data.length > 0) {
        setLat(parseFloat(data[0].lat).toFixed(6))
        setLng(parseFloat(data[0].lon).toFixed(6))
        setErrors({})
        showToast('Found: ' + data[0].display_name.split(',').slice(0, 2).join(','), 'success')
      } else {
        showToast('No location found', 'error')
      }
    } catch {
      showToast('Search failed — check your connection', 'error')
    }
    setSearching(false)
  }, [searchQuery, showToast])

  const handleApply = () => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    const errs = validateCoords(latNum, lngNum)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    applyGps({ lat: latNum, lng: lngNum }, scope)
    const count = scope === 'current' ? 1 : scope === 'selected' ? selected.size : images.length
    showToast('GPS applied to ' + count + ' image' + (count !== 1 ? 's' : ''), 'success')
  }

  const handleSaveMeta = () => {
    if (!img) return
    updateMeta(img.id, { keywords: keywords.trim(), description: description.trim(), timestamp })
    showToast('Metadata saved for ' + img.name, 'success')
  }

  if (!img) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-sm text-center px-6 gap-2' style={{ color: 'var(--color-muted)' }}>
        <span className='text-4xl' aria-hidden="true">📍</span>
        <strong style={{ color: 'var(--color-text)' }}>No image selected</strong>
        <p>Click an image to view and edit its GPS metadata</p>
      </div>
    )
  }

  const origGps = img.originalExif ? img.originalExif.gps : null
  const editedGps = img.editedGps
  const hasUndo = !!undoStack[img.id]
  const hasOriginalGps = !!origGps
  const isEdited = editedGps && (!origGps || editedGps.lat !== origGps.lat || editedGps.lng !== origGps.lng)

  return (
    <motion.div {...slideRight} className='h-full overflow-y-auto px-4 py-4 space-y-4'>

      <section aria-label="Image preview">
        <div className='section-label'>Image</div>
        <img
          src={img.dataUrl}
          alt={img.altText || img.name}
          className='w-full rounded-lg max-h-32 object-cover mb-2'
          style={{ border: '1px solid var(--color-border)' }}
        />
        <div className='text-xs truncate' style={{ color: 'var(--color-muted)' }}>{img.name}</div>
        <div className='font-mono text-[11px]' style={{ color: 'var(--color-border2)' }}>{formatFileSize(img.size)}</div>

        {hasOriginalGps && !isEdited && (
          <div className='mt-2 px-2 py-1.5 rounded-lg flex items-center gap-2' style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
            <span>⚠️</span>
            <span className='text-xs font-medium' style={{ color: '#eab308' }}>Already geotagged</span>
          </div>
        )}
      </section>

      <section aria-label="Place search">
        <div className='section-label'>Place Search</div>
        <div className='flex gap-1.5'>
          <input
            className='input-field flex-1 text-xs py-1.5'
            placeholder='Search address or place...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            aria-label="Search for a location"
            id="place-search"
          />
          <button onClick={handleSearch} disabled={searching} className='btn btn-primary text-xs px-3 py-1.5' aria-label="Search location">
            {searching ? '...' : '🔍'}
          </button>
        </div>
      </section>

      <section aria-label="Existing geotags">
        <div className='section-label'>Existing Geotags</div>
        <div className='rounded-lg px-3 py-2 font-mono text-xs space-y-1'
          style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
        >
          {origGps ? (
            <>
              <div className='flex justify-between'>
                <span style={{ color: 'var(--color-border2)' }}>Lat</span>
                <span style={{ color: 'var(--color-accent)' }}>{formatCoord(origGps.lat, true)}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'var(--color-border2)' }}>Lng</span>
                <span style={{ color: 'var(--color-accent)' }}>{formatCoord(origGps.lng, false)}</span>
              </div>
            </>
          ) : <span style={{ color: 'var(--color-border2)' }} className='italic'>No existing GPS</span>}
        </div>
      </section>

      <section aria-label="Map">
        <div className='section-label'>Map — click to set location</div>
        <div className='w-full rounded-lg overflow-hidden' style={{ height: '200px', border: '1px solid var(--color-border)' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} role="application" aria-label="Interactive map for GPS selection" />
        </div>
      </section>

      <section aria-label="GPS coordinates">
        <div className='section-label'>New Geotags</div>
        <div className='grid grid-cols-2 gap-2 mb-2'>
          <div>
            <label className='text-xs block mb-1' style={{ color: 'var(--color-muted)' }} htmlFor="lat-input">Latitude (-90 to 90)</label>
            <input
              id="lat-input"
              type='number'
              className={'input-field text-xs py-1.5' + (errors.lat ? ' error' : '')}
              value={lat}
              onChange={(e) => { setLat(e.target.value); setErrors({}) }}
              placeholder='e.g. 40.7128'
              step='0.000001' min='-90' max='90'
              aria-label="Latitude"
              aria-invalid={!!errors.lat}
            />
            {errors.lat && <div className='text-xs mt-1' style={{ color: '#f87171' }} role="alert">{errors.lat}</div>}
          </div>
          <div>
            <label className='text-xs block mb-1' style={{ color: 'var(--color-muted)' }} htmlFor="lng-input">Longitude (-180 to 180)</label>
            <input
              id="lng-input"
              type='number'
              className={'input-field text-xs py-1.5' + (errors.lng ? ' error' : '')}
              value={lng}
              onChange={(e) => { setLng(e.target.value); setErrors({}) }}
              placeholder='e.g. -74.006'
              step='0.000001' min='-180' max='180'
              aria-label="Longitude"
              aria-invalid={!!errors.lng}
            />
            {errors.lng && <div className='text-xs mt-1' style={{ color: '#f87171' }} role="alert">{errors.lng}</div>}
          </div>
        </div>
        <div className='flex gap-1.5 mb-2' role="radiogroup" aria-label="Apply scope">
          {SCOPES.map((s) => (
            <button key={s.id} onClick={() => setScope(s.id)}
              className='flex-1 py-1 px-1 rounded-lg border text-xs transition-all duration-150'
              style={{
                borderColor: scope === s.id ? 'var(--color-accent)' : 'var(--color-border)',
                color: scope === s.id ? 'var(--color-accent)' : 'var(--color-muted)',
                background: scope === s.id ? 'var(--accent-glow)' : 'transparent',
              }}
              aria-pressed={scope === s.id}
            >
              {s.label}
              {s.id === 'selected' && ' (' + selected.size + ')'}
              {s.id === 'all' && ' (' + images.length + ')'}
            </button>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleApply} className='btn btn-primary w-full justify-center mb-1.5'
          id="apply-gps-btn"
        >
          Write EXIF Tags
        </motion.button>
        <div className='flex gap-2'>
          {editedGps && (
            <button onClick={() => { resetGps(img.id); showToast('GPS reset', 'success') }}
              className='btn btn-danger btn-sm flex-1 justify-center text-xs'>Reset</button>
          )}
          {hasUndo && (
            <button onClick={() => { undoGps(img.id); showToast('Undone', 'success') }}
              className='btn btn-ghost btn-sm flex-1 justify-center text-xs'>Undo</button>
          )}
        </div>
      </section>

      {/* Alt Text Panel (spec §3.3) — below coordinates panel */}
      <section aria-label="Alt text editor">
        <div className='section-label'>Alt Text (Per Image)</div>
        <AltTextPanel imageId={img.id} filename={img.name} />
      </section>

      <section aria-label="Keywords">
        <div className='section-label'>Keywords and Tags</div>
        <textarea
          className='input-field text-xs resize-none w-full'
          rows={3}
          placeholder='keyword1, keyword2, keyword3 — comma separated'
          maxLength={6600}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          aria-label="Keywords"
          id="keywords-input"
        />
        <div className='text-xs text-right mt-0.5' style={{ color: 'var(--color-border2)' }}>{keywords.length}/6600</div>
      </section>

      <section aria-label="Description">
        <div className='section-label'>Description</div>
        <textarea
          className='input-field text-xs resize-none w-full mb-1'
          rows={3}
          placeholder='Image description for SEO and accessibility'
          maxLength={1300}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
          id="description-input"
        />
        <div className='text-xs text-right mb-2' style={{ color: 'var(--color-border2)' }}>{description.length}/1300</div>
      </section>

      <section aria-label="Timestamp">
        <div className='section-label'>Timestamp</div>
        <input
          type="datetime-local"
          className='input-field text-xs py-1.5 mb-2'
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          aria-label="Photo timestamp"
          id="timestamp-input"
        />
      </section>

      <section>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleSaveMeta}
          className='btn btn-primary w-full justify-center'
          id="save-meta-btn"
        >
          💾 Save Metadata
        </motion.button>
      </section>

      <section aria-label="Before and after comparison">
        <div className='section-label'>Before / After</div>
        <div className='grid grid-cols-2 gap-2'>
          {[{ label: 'Before', gps: origGps, color: 'var(--color-muted)' }, { label: 'After', gps: editedGps, color: 'var(--color-accent3)' }]
            .map(({ label, gps, color }) => (
              <div key={label} className='rounded-lg p-2.5'
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
              >
                <div className='font-mono text-xs uppercase tracking-wider mb-2' style={{ color: 'var(--color-border2)' }}>{label}</div>
                {gps ? (
                  <div className='font-mono text-xs space-y-1'>
                    <div className='flex justify-between'>
                      <span style={{ color: 'var(--color-border2)' }}>Lat</span>
                      <span style={{ color }}>{gps.lat.toFixed(5)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'var(--color-border2)' }}>Lng</span>
                      <span style={{ color }}>{gps.lng.toFixed(5)}</span>
                    </div>
                  </div>
                ) : <div className='text-xs italic' style={{ color: 'var(--color-border2)' }}>No GPS</div>}
              </div>
            ))}
        </div>
      </section>

    </motion.div>
  )
}
