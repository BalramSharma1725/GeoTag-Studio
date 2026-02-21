import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../context/store'
import { validateCoords, formatCoord, formatFileSize } from '../../utils/exif'
import { slideRight } from '../../animations/variants'

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
  const [altText, setAltText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [hasOriginalGps, setHasOriginalGps] = useState(false)

  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markerRef = useRef(null)
  const mapInitialized = useRef(false)

  useEffect(() => {
    if (img) {
      const origGps = img.originalExif?.gps
      setHasOriginalGps(!!origGps)
      
      setLat(img.editedGps ? img.editedGps.lat.toFixed(6) : '26.716515168625')
      setLng(img.editedGps ? img.editedGps.lng.toFixed(6) : '88.4217989444778')
      setKeywords(img.keywords || '')
      setDescription(img.description || '')
      setAltText(img.altText || '')
      
      // Show notification if image already has GPS
      if (origGps && !img.editedGps) {
        showToast('⚠️ This image is already geotagged', 'warning')
      }
    } else {
      setLat(''); setLng(''); setKeywords(''); setDescription(''); setAltText('')
      setHasOriginalGps(false)
    }
    setErrors({})
  }, [activeId, img, showToast])

  useEffect(() => {
    if (!mapRef.current || mapInitialized.current) return
    let destroyed = false
    const init = async () => {
      const L = (await import('leaflet')).default
      if (destroyed || mapInitialized.current || !mapRef.current) return
      mapInitialized.current = true
      const center = img && img.editedGps ? [img.editedGps.lat, img.editedGps.lng] : [26.716515168625, 88.4217989444778]
      const zoom = img && img.editedGps ? 12 : 12
      const m = L.map(mapRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m)
      m.setView(center, zoom)
      if (img && img.editedGps) {
        markerRef.current = L.marker(center).addTo(m)
      } else if (img) {
        markerRef.current = L.marker(center).addTo(m)
      }
      m.on('click', (e) => {
        const la = e.latlng.lat
        const lo = e.latlng.lng
        setLat(la.toFixed(6))
        setLng(lo.toFixed(6))
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
      showToast('Search failed', 'error')
    }
    setSearching(false)
  }, [searchQuery, showToast])

  const checkGeotaggedImages = useCallback(() => {
    let alreadyTagged = 0
    let targetImages = []

    if (scope === 'current') {
      targetImages = [img]
    } else if (scope === 'selected') {
      targetImages = images.filter(i => selected.has(i.id))
    } else {
      targetImages = images
    }

    alreadyTagged = targetImages.filter(i => i.originalExif?.gps).length

    return { alreadyTagged, total: targetImages.length }
  }, [scope, img, images, selected])

  const handleApply = () => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    const errs = validateCoords(latNum, lngNum)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    // Check for already geotagged images
    const { alreadyTagged, total } = checkGeotaggedImages()
    
    if (alreadyTagged > 0) {
      const shouldContinue = window.confirm(
        `⚠️ Warning: ${alreadyTagged} out of ${total} image${alreadyTagged !== 1 ? 's are' : ' is'} already geotagged.\n\nDo you want to overwrite the existing GPS data?`
      )
      if (!shouldContinue) {
        showToast('Operation cancelled', 'info')
        return
      }
    }

    applyGps({ lat: latNum, lng: lngNum }, scope)
    const count = scope === 'current' ? 1 : scope === 'selected' ? selected.size : images.length
    showToast('GPS applied to ' + count + ' image' + (count !== 1 ? 's' : ''), 'success')
  }

  const handleSaveMeta = () => {
    if (!img) return
    updateMeta(img.id, { keywords, description, altText })
    showToast('Metadata saved', 'success')
  }

  if (!img) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-muted text-sm text-center px-6 gap-2'>
        <span className='text-4xl'>📍</span>
        <strong className='text-text'>No image selected</strong>
        <p>Click an image to view and edit its GPS metadata</p>
      </div>
    )
  }

  const origGps = img.originalExif ? img.originalExif.gps : null
  const editedGps = img.editedGps
  const hasUndo = !!undoStack[img.id]

  return (
    <motion.div {...slideRight} className='h-full overflow-y-auto px-4 py-4 space-y-4'>

      <section>
        <div className='section-label'>Image</div>
        <img src={img.dataUrl} alt={img.name} className='w-full rounded-lg max-h-32 object-cover mb-2 border border-border' />
        <div className='text-xs text-muted truncate'>{img.name}</div>
        <div className='font-mono text-[11px] text-border2'>{formatFileSize(img.size)}</div>
        
        {/* Geotagged indicator */}
        {hasOriginalGps && !editedGps && (
          <div className='mt-2 px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2'>
            <span className='text-yellow-500'>⚠️</span>
            <span className='text-xs text-yellow-500 font-medium'>Already geotagged</span>
          </div>
        )}
      </section>

      <section>
        <div className='section-label'>Place Search</div>
        <div className='flex gap-1.5'>
          <input
            className='input-field flex-1 text-xs py-1.5'
            placeholder='Search address or place...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searching} className='btn btn-primary text-xs px-3 py-1.5'>
            {searching ? '...' : String.fromCharCode(0x1F50D)}
          </button>
        </div>
      </section>

      <section>
        <div className='section-label'>Existing Geotags</div>
        <div className='bg-surface2 border border-border rounded-lg px-3 py-2 font-mono text-xs space-y-1'>
          {origGps ? (
            <>
              <div className='flex justify-between'><span className='text-border2'>Lat</span><span className='text-accent'>{formatCoord(origGps.lat, true)}</span></div>
              <div className='flex justify-between'><span className='text-border2'>Lng</span><span className='text-accent'>{formatCoord(origGps.lng, false)}</span></div>
            </>
          ) : <span className='text-border2 italic'>No existing GPS</span>}
        </div>
      </section>

      <section>
        <div className='section-label'>Map — click to set location</div>
        <div className='w-full rounded-lg overflow-hidden border border-border' style={{ height: '200px' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </section>

      <section>
        <div className='section-label'>New Geotags</div>
        <div className='grid grid-cols-2 gap-2 mb-2'>
          <div>
            <label className='text-xs text-muted block mb-1'>Latitude (-90 to 90)</label>
            <input
              type='number'
              className={'input-field text-xs py-1.5' + (errors.lat ? ' error' : '')}
              value={lat}
              onChange={(e) => { setLat(e.target.value); setErrors({}) }}
              placeholder='e.g. 40.7128'
              step='0.000001' min='-90' max='90'
            />
            {errors.lat && <div className='text-xs text-red-400 mt-1'>{errors.lat}</div>}
          </div>
          <div>
            <label className='text-xs text-muted block mb-1'>Longitude (-180 to 180)</label>
            <input
              type='number'
              className={'input-field text-xs py-1.5' + (errors.lng ? ' error' : '')}
              value={lng}
              onChange={(e) => { setLng(e.target.value); setErrors({}) }}
              placeholder='e.g. -74.006'
              step='0.000001' min='-180' max='180'
            />
            {errors.lng && <div className='text-xs text-red-400 mt-1'>{errors.lng}</div>}
          </div>
        </div>
        <div className='flex gap-1.5 mb-2'>
          {SCOPES.map((s) => (
            <button key={s.id} onClick={() => setScope(s.id)}
              className={'flex-1 py-1 px-1 rounded-lg border text-xs transition-all duration-150 ' + (scope === s.id ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-border2 hover:text-text')}>
              {s.label}
              {s.id === 'selected' && ' (' + selected.size + ')'}
              {s.id === 'all' && ' (' + images.length + ')'}
            </button>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleApply} className='btn btn-primary w-full justify-center mb-1.5'>
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

      <section>
        <div className='section-label'>Keywords and Tags</div>
        <textarea
          className='input-field text-xs resize-none w-full'
          rows={3}
          placeholder='keyword1, keyword2, keyword3 — comma separated, max 6600 chars'
          maxLength={6600}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <div className='text-xs text-border2 text-right mt-0.5'>{keywords.length}/6600</div>
      </section>

      <section>
        <div className='section-label'>Description / Alternative Text</div>
        <textarea
          className='input-field text-xs resize-none w-full mb-1'
          rows={3}
          placeholder='Image description (HTML alt text equivalent, max 1300 chars)'
          maxLength={1300}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className='text-xs text-border2 text-right mb-2'>{description.length}/1300</div>
        <label className='text-xs text-muted block mb-1'>ALT Text</label>
        <input
          className='input-field text-xs py-1.5'
          placeholder='Alt text for accessibility and SEO'
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
        />
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleSaveMeta}
          className='btn btn-primary w-full justify-center mt-2'>
          Save Metadata
        </motion.button>
      </section>

      <section>
        <div className='section-label'>Before / After</div>
        <div className='grid grid-cols-2 gap-2'>
          {[{ label: 'Before', gps: origGps, color: 'text-muted' }, { label: 'After', gps: editedGps, color: 'text-accent3' }]
            .map(({ label, gps, color }) => (
              <div key={label} className='bg-surface2 border border-border rounded-lg p-2.5'>
                <div className='font-mono text-xs text-border2 uppercase tracking-wider mb-2'>{label}</div>
                {gps ? (
                  <div className='font-mono text-xs space-y-1'>
                    <div className='flex justify-between'><span className='text-border2'>Lat</span><span className={color}>{gps.lat.toFixed(5)}</span></div>
                    <div className='flex justify-between'><span className='text-border2'>Lng</span><span className={color}>{gps.lng.toFixed(5)}</span></div>
                  </div>
                ) : <div className='text-border2 text-xs italic'>No GPS</div>}
              </div>
            ))}
        </div>
      </section>

    </motion.div>
  )
}