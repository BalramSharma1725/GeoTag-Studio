import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useImageLoader } from '../../hooks/useImageLoader'
import { useStore } from '../../context/store'

const ACCEPT = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }

export default function Uploader({ onUploaded, showToast }) {
  const { loadFiles } = useImageLoader()
  const setView = useStore((s) => s.setView)

  const onDrop = useCallback(async (acceptedFiles, rejected) => {
    if (rejected.length) showToast(`${rejected.length} file(s) skipped (unsupported format)`, 'error')
    if (!acceptedFiles.length) return
    const result = await loadFiles(acceptedFiles)
    showToast(`Loaded ${result.loaded} image${result.loaded !== 1 ? 's' : ''}`, 'success')
    setView('editor')
    onUploaded?.()
  }, [loadFiles, setView, showToast, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
  })

  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div
        {...getRootProps()}
        className={`relative w-full max-w-[520px] border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-accent shadow-[0_0_30px_rgba(110,231,183,0.2)] bg-surface'
            : 'border-border2 bg-surface hover:border-accent hover:shadow-[0_0_20px_rgba(110,231,183,0.12)]'
          }`}
      >
        {/* Glow bg */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-radial from-accent/5 to-transparent transition-opacity duration-200 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />

        <input {...getInputProps()} />

        <motion.span
          className="block text-5xl mb-4"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          🗺️
        </motion.span>

        <h2 className="font-display text-2xl font-bold mb-2 text-text">
          {isDragActive ? 'Release to Upload' : 'Drop Images Here'}
        </h2>
        <p className="text-muted text-sm mb-5">
          Drag & drop your photos, or click to browse.<br />
          GPS metadata is read & written locally — no uploads to server.
        </p>

        <div className="flex gap-2 justify-center flex-wrap mb-5">
          {['JPG', 'JPEG', 'PNG', 'WEBP'].map((f) => (
            <span key={f} className="bg-surface3 border border-border text-border2 font-mono text-[11px] px-2 py-0.5 rounded uppercase tracking-wider">
              {f}
            </span>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="btn btn-primary"
        >
          📁 Choose Files
        </motion.button>
      </div>
    </div>
  )
}
