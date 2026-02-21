import { motion } from 'framer-motion'
import { useStore } from '../context/store'

const NAV = [
  { id: 'upload', icon: '📤', label: 'Upload' },
  { id: 'editor', icon: '✏️', label: 'Editor' },
  { id: 'export', icon: '📦', label: 'Export' },
]

export default function Sidebar() {
  const { view, setView, images, selected } = useStore()
  const edited = images.filter((i) => i.editedGps).length
  const hasGps = images.filter((i) => i.originalExif?.gps).length

  return (
    <aside className="w-[220px] min-w-[220px] bg-surface border-r border-border flex flex-col z-10">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <h1 className="font-display text-lg font-black text-accent leading-tight tracking-tight">
          GeoTag<br />Studio
        </h1>
        <span className="text-[11px] text-border2 font-mono uppercase tracking-widest">
          GPS Metadata Editor
        </span>
      </div>

      {/* Nav */}
      <nav className="p-2 flex-1">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 border transition-all duration-150 ${
              view === item.id
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'text-muted border-transparent hover:bg-surface2 hover:text-text'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-border font-mono text-[11px] text-border2 space-y-1">
        {[
          { label: 'Images', val: images.length },
          { label: 'Selected', val: selected.size },
          { label: 'Edited', val: edited },
          { label: 'Has GPS', val: hasGps },
        ].map(({ label, val }) => (
          <div key={label} className="flex justify-between">
            <span>{label}</span>
            <span className="text-accent">{val}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
