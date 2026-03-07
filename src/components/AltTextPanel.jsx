import { useStore } from '../context/store'

const MAX = 250
const WARN = 100

/**
 * AltTextPanel — Per-image alt text editor (spec §3.3)
 * Reads/writes via Zustand store. Character counter with warning.
 * "Apply to empty images" propagates alt text to images with empty alt text.
 */
export default function AltTextPanel({ imageId, filename }) {
  const images = useStore((s) => s.images)
  const setAltText = useStore((s) => s.setAltText)
  const applyAltTextToEmpty = useStore((s) => s.applyAltTextToEmpty)

  const current = images.find((img) => img.id === imageId)
  const value = current?.altText ?? ''

  return (
    <div className="flex flex-col gap-2 mt-3">
      <label
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-border2)' }}
        htmlFor={`alt-text-${imageId}`}
      >
        Alt Text / Description
      </label>
      <textarea
        id={`alt-text-${imageId}`}
        aria-label={`Alt text for ${filename}`}
        maxLength={MAX}
        rows={3}
        value={value}
        onChange={(e) => setAltText(imageId, e.target.value)}
        className="w-full resize-none rounded-lg px-3 py-2 text-base outline-none transition-all duration-150"
        style={{
          background: 'var(--color-surface2)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-glow)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
        placeholder="Describe the image for accessibility and SEO..."
      />
      <div className="flex justify-between items-center text-sm">
        <span
          aria-live="polite"
          style={{ color: value.length >= WARN ? '#fbbf24' : 'var(--color-border2)' }}
        >
          {value.length}/{MAX} characters
          {value.length >= WARN && value.length < MAX && ' ⚠️ Getting long'}
        </span>
        <button
          onClick={() => applyAltTextToEmpty(imageId)}
          className="hover:opacity-80 transition-colors font-medium"
          style={{ color: 'var(--color-accent2)' }}
          title="Copy this alt text to all images that have an empty alt text field"
          aria-label="Apply alt text to images with empty alt text"
        >
          Apply to empty images
        </button>
      </div>
    </div>
  )
}
