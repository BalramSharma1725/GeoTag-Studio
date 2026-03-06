import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useImageLoader } from '../../hooks/useImageLoader'
import { useStore } from '../../context/store'

const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
}

export default function Uploader({ onUploaded, showToast }) {
  const { loadFiles } = useImageLoader()
  const setView = useStore((s) => s.setView)

  const onDrop = useCallback(async (acceptedFiles, rejected) => {
    if (rejected.length) showToast(`${rejected.length} file(s) skipped (unsupported format)`, 'error')
    if (!acceptedFiles.length) return
    const result = await loadFiles(acceptedFiles)
    if (result.unsupportedNames?.length) {
      showToast(`Could not convert: ${result.unsupportedNames.join(', ')}`, 'warning')
    }
    if (result.geotagged > 0) {
      showToast(`Loaded ${result.loaded} images. 📍 ${result.geotagged} already geotagged!`, 'success')
    } else if (result.loaded > 0) {
      showToast(`Loaded ${result.loaded} image${result.loaded !== 1 ? 's' : ''}`, 'success')
    }
    if (result.loaded > 0) {
      setView('editor')
      onUploaded?.()
    }
  }, [loadFiles, setView, showToast, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
  })

  return (
    <div className="flex-1 flex items-center justify-center p-10 max-md:p-4">
      <div
        {...getRootProps()}
        className="relative w-full max-w-[520px] border-2 border-dashed rounded-2xl p-16 max-md:p-8 text-center cursor-pointer transition-all duration-200"
        style={{
          borderColor: isDragActive ? 'var(--color-accent)' : 'var(--color-border2)',
          background: 'var(--color-surface)',
          boxShadow: isDragActive ? '0 0 30px var(--accent-glow)' : 'none',
        }}
        role="button"
        aria-label="Upload images by drag and drop or click to browse"
        tabIndex={0}
        id="upload-zone"
      >
        <div
          className={`absolute inset-0 rounded-2xl transition-opacity duration-200 ${isDragActive ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent)' }}
          aria-hidden="true"
        />
        <input {...getInputProps()} />
        <motion.span
          className="block text-5xl mb-4"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          🗺️
        </motion.span>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          {isDragActive ? 'Release to Upload' : 'Drop Images Here'}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
          Drag & drop your photos, or click to browse.<br />
          GPS metadata is read & written locally — no uploads to server.
        </p>
        <div className="flex gap-2 justify-center flex-wrap mb-5">
          {['JPG', 'PNG', 'WEBP', 'HEIC'].map((f) => (
            <span key={f} className="font-mono text-[11px] px-2 py-0.5 rounded uppercase tracking-wider"
              style={{
                background: 'var(--color-surface3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-border2)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="btn btn-primary"
          aria-label="Choose files to upload"
        >
          📁 Choose Files
        </motion.button>
      </div>
    </div>
  )
}
