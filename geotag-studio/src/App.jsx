import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './context/store'
import { useToast } from './hooks/useToast'
import { useProcessor } from './hooks/useProcessor'
import { useImageLoader } from './hooks/useImageLoader'
import { embedGpsIntoJpeg, convertAndEmbedGps } from './utils/exif'

import Sidebar from './components/Sidebar'
import ToastContainer from './components/Toast'
import ProgressModal from './components/ProgressModal'

import Uploader from './features/uploader/Uploader'
import ImageGrid from './features/metadata-editor/ImageGrid'
import MetadataEditorPanel from './features/metadata-editor/MetadataEditorPanel'
import MapPicker from './features/map-picker/MapPicker'
import ExportView from './features/export/ExportView'

export default function App() {
  const { view, setView, images, selected, activeId, applyGps, clearAll } = useStore()
  const { toasts, showToast } = useToast()
  const { processImages, progress, clearProgress } = useProcessor()
  const { loadFiles } = useImageLoader()

  const [mapOpen, setMapOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)

  const handleAddMore = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.jpg,.jpeg,.png,.webp'
    input.onchange = async (e) => {
      const result = await loadFiles(e.target.files)
      if (result.loaded) showToast('Added ' + result.loaded + ' image' + (result.loaded !== 1 ? 's' : ''), 'success')
    }
    input.click()
  }, [loadFiles, showToast])

  const handleProcessSelected = useCallback(async () => {
    const ids = selected.size > 0 ? [...selected] : images.map((i) => i.id)
    if (!ids.length) { showToast('No images to process', 'error'); return }
    await processImages(ids)
    showToast('Processing complete', 'success')
  }, [selected, images, processImages, showToast])

  // Download ZIP — always re-process to embed latest meta+GPS
  const downloadZip = useCallback(async (targetImages) => {
    if (!targetImages.length) { showToast('No images to download', 'error'); return }
    const ids = targetImages.map((i) => i.id)
    await processImages(ids)
    // Get fresh images from store after processing
    const freshImages = useStore.getState().images
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    for (const img of targetImages) {
      const fresh = freshImages.find((i) => i.id === img.id) || img
      const src = fresh.processedDataUrl || fresh.dataUrl
      const base64 = src.split(',')[1]
      const isConverted = fresh.processed && !['image/jpeg', 'image/jpg'].includes(fresh.type)
      const ext = isConverted ? '.jpg' : '.' + fresh.type.split('/')[1]
      const fname = fresh.name.replace(/\.[^.]+$/, '') + '_geotagged' + ext
      zip.file(fname, base64, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(URL.createObjectURL(blob), 'geotag-studio-' + Date.now() + '.zip')
    showToast('Downloaded ' + targetImages.length + ' images as ZIP', 'success')
  }, [processImages, showToast])

  // Download single — embed GPS + meta fresh
  const downloadSingle = useCallback(async (id) => {
    const img = useStore.getState().images.find((i) => i.id === id)
    if (!img) return
    const meta = { keywords: img.keywords || '', description: img.description || '', altText: img.altText || '' }
    let src
    if (img.editedGps) {
      if (['image/jpeg', 'image/jpg'].includes(img.type)) {
        src = embedGpsIntoJpeg(img.dataUrl, img.editedGps.lat, img.editedGps.lng, img.originalExif ? img.originalExif.raw || {} : {}, meta)
      } else {
        const res = await convertAndEmbedGps(img.dataUrl, img.editedGps.lat, img.editedGps.lng, meta)
        src = res.dataUrl
      }
    } else {
      src = img.dataUrl
    }
    const ext = img.type !== 'image/jpeg' && img.type !== 'image/jpg' && img.processed ? '.jpg' : '.' + img.type.split('/')[1]
    triggerDownload(src, img.name.replace(/\.[^.]+$/, '') + '_geotagged' + ext)
    showToast('Downloading ' + img.name, 'success')
  }, [])

  const handleMapApply = useCallback(({ coords, scope }) => {
    applyGps(coords, scope)
    const count = scope === 'current' ? 1 : scope === 'selected' ? selected.size : images.length
    showToast('GPS applied to ' + count + ' image' + (count !== 1 ? 's' : ''), 'success')
  }, [applyGps, selected.size, images.length, showToast])

  const openMap = useCallback((center) => {
    setMapCenter(center || null)
    setMapOpen(true)
  }, [])

  return (
    <div className='flex h-screen overflow-hidden relative' style={{ background: '#0a0a0f' }}>
      <div className='fixed inset-0 pointer-events-none z-0' style={{
        background: 'radial-gradient(ellipse 800px 600px at 20% 10%, rgba(110,231,183,0.04) 0%, transparent 70%), radial-gradient(ellipse 600px 400px at 80% 80%, rgba(56,189,248,0.04) 0%, transparent 70%)'
      }} />
      <Sidebar />
      <main className='flex-1 flex flex-col overflow-hidden relative z-1'>
        <div className='h-[52px] border-b border-border bg-surface flex items-center px-5 gap-3 flex-shrink-0'>
          <div className='font-display font-bold text-[15px] text-text flex-1'>
            {view === 'upload' && 'Upload Images'}
            {view === 'editor' && 'GPS Metadata Editor'}
            {view === 'export' && 'Export & Download'}
          </div>
          <div className='flex items-center gap-2'>
            {images.length > 0 && (
              <>
                <button onClick={() => { if (confirm('Remove all images?')) { clearAll(); setView('upload') } }}
                  className='btn btn-ghost text-[12px]'>Clear</button>
                <button onClick={handleAddMore} className='btn btn-ghost text-[12px]'>+ Add More</button>
              </>
            )}
            {images.length > 0 && view === 'editor' && (
              <button onClick={handleProcessSelected} className='btn btn-primary text-[12px]'>Process</button>
            )}
            {images.length > 0 && (
              <button onClick={() => downloadZip(images)} className='btn btn-ghost text-[12px]'>ZIP All</button>
            )}
          </div>
        </div>
        <div className='flex-1 flex overflow-hidden'>
          <AnimatePresence mode='wait'>
            {view === 'upload' && (
              <motion.div key='upload' className='flex-1 flex'
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Uploader onUploaded={() => {}} showToast={showToast} />
              </motion.div>
            )}
            {view === 'editor' && (
              <motion.div key='editor' className='flex-1 flex overflow-hidden'
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className='flex-1 flex flex-col overflow-hidden'>
                  <div className='flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface flex-shrink-0 flex-wrap'>
                    <span className='font-mono text-[12px] text-border2'>{images.length} images</span>
                    <button onClick={() => useStore.getState().selectAll()} className='btn btn-ghost text-[11px] py-1'>Select All</button>
                    <button onClick={() => useStore.getState().selectNone()} className='btn btn-ghost text-[11px] py-1'>Deselect</button>
                    <button onClick={() => useStore.getState().selectWithGPS()} className='btn btn-ghost text-[11px] py-1'>Has GPS</button>
                    <button onClick={() => useStore.getState().selectEdited()} className='btn btn-ghost text-[11px] py-1'>Edited</button>
                  </div>
                  <ImageGrid />
                </div>
                <div className='w-[300px] min-w-[300px] border-l border-border bg-surface flex flex-col overflow-hidden'>
                  <div className='flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0'>
                    <div className='font-display font-bold text-sm'>GPS Editor</div>
                    <button onClick={() => openMap()} className='btn btn-ghost text-[11px] py-1'>Map</button>
                  </div>
                  <div className='flex-1 overflow-y-auto'>
                    <MetadataEditorPanel onOpenMap={openMap} showToast={showToast} />
                  </div>
                </div>
              </motion.div>
            )}
            {view === 'export' && (
              <motion.div key='export' className='flex-1 flex overflow-hidden'
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ExportView
                  onDownloadAll={() => downloadZip(images)}
                  onDownloadEdited={() => downloadZip(images.filter((i) => i.editedGps))}
                  onDownloadSingle={downloadSingle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <MapPicker isOpen={mapOpen} initialCenter={mapCenter} onApply={handleMapApply} onClose={() => setMapOpen(false)} />
      <ProgressModal progress={progress} onClose={clearProgress} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}

function triggerDownload(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  if (href.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(href), 5000)
}
