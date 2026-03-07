import { motion, AnimatePresence } from 'framer-motion'
import { modalOverlay, modalContent } from '../animations/variants'

const SECTIONS = [
  {
    icon: '📤',
    title: 'Upload Images',
    content: 'Drag and drop JPG, PNG, or WEBP images into the upload zone, or click to browse files. HEIC/HEIF files from iPhones are automatically converted to JPEG.',
  },
  {
    icon: '📍',
    title: 'Set GPS Coordinates',
    content: 'Select an image, then click on the map or type coordinates manually. Use Place Search to find locations by name. Apply GPS to current image, selected images, or all at once.',
  },
  {
    icon: '✏️',
    title: 'Edit Metadata',
    content: 'Add keywords, descriptions, and alt text per image. Use Bulk Metadata Editor to apply shared tags across all images while providing unique alt text for each.',
  },
  {
    icon: '📄',
    title: 'CSV Import',
    content: 'Import metadata from a CSV file with columns: filename, lat, lng, keywords, description, alt. Download a pre-filled template from the import dialog.',
  },
  {
    icon: '📦',
    title: 'Export & Download',
    content: 'Download individual images or a ZIP archive. GPS coordinates and all metadata are embedded into the EXIF data. Non-JPEG files are converted to JPEG for GPS embedding.',
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    content: 'All processing happens entirely in your browser. No images or data are ever uploaded to any server. GeoTag Studio works offline as an installable PWA.',
  },
  {
    icon: '🌗',
    title: 'Theme & Accessibility',
    content: 'Toggle between Dark, Light, and System themes. The app follows WCAG 2.1 AA accessibility guidelines with keyboard navigation and screen reader support.',
  },
  {
    icon: '⌨️',
    title: 'Keyboard Shortcuts',
    content: 'Tab: Navigate between controls • Enter/Space: Activate buttons • Escape: Close dialogs • The sidebar, editor, and export views are fully keyboard accessible.',
  },
]

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        {...modalOverlay}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1200]"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-label="Help and documentation"
        aria-modal="true"
      >
        <motion.div
          {...modalContent}
          className="rounded-2xl overflow-hidden w-[640px] max-w-[95vw] max-h-[85vh] shadow-2xl flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border2)' }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div className="font-display text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                ❓ Help & Guide
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                Learn how to use GeoTag Studio
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost text-[12px]" aria-label="Close help">✕ Close</button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {SECTIONS.map((section, i) => (
              <div
                key={i}
                className="rounded-xl p-4 transition-colors"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{section.icon}</span>
                  <h3 className="font-display font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                    {section.title}
                  </h3>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {section.content}
                </p>
              </div>
            ))}

            {/* Credits */}
            <div className="text-center pt-3 pb-2">
              <div className="text-[11px] font-mono" style={{ color: 'var(--color-border2)' }}>
                GeoTag Studio v2.0 • MIT License
              </div>
              <a
                href="https://github.com/balramsharma1725/GeoTag-Studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono hover:underline"
                style={{ color: 'var(--color-accent2)' }}
              >
                github.com/balramsharma1725/GeoTag-Studio
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
