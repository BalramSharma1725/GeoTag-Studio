import { useStore } from '../context/store'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { id: 'upload', icon: '📤', label: 'Upload' },
  { id: 'editor', icon: '✏️', label: 'Editor' },
  { id: 'export', icon: '📦', label: 'Export' },
]

export default function Sidebar({ onBulkEdit, onCsvImport, onHelp }) {
  const { view, setView, images, selected, sidebarOpen, toggleSidebar } = useStore()
  const edited = images.filter((i) => i.editedGps).length
  const hasGps = images.filter((i) => i.originalExif?.gps).length
  const hasMeta = images.filter((i) => i.keywords || i.description || i.altText).length

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="hidden max-md:block sidebar-overlay"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="hidden max-md:flex fixed top-3 left-3 z-[101] w-9 h-9 items-center justify-center rounded-lg border border-border bg-surface text-text"
        aria-label="Toggle sidebar"
        id="sidebar-toggle"
      >
        ☰
      </button>

      <aside
        className={`w-[220px] min-w-[220px] bg-surface flex flex-col z-10 transition-all duration-300 max-md:${sidebarOpen ? 'sidebar-mobile-shown' : 'sidebar-mobile-hidden'}`}
        style={{ borderRight: '1px solid var(--color-border)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h1 className="font-display text-lg font-black leading-tight tracking-tight" style={{ color: 'var(--color-accent)' }}>
            GeoTag<br />Studio
          </h1>
          <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--color-border2)' }}>
            GPS Metadata Editor
          </span>
        </div>

        {/* Nav */}
        <nav className="p-2 flex-1" role="tablist" aria-label="Application views">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); if (window.innerWidth < 768) toggleSidebar() }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 border transition-all duration-150 ${
                view === item.id
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'text-muted border-transparent hover:bg-surface2 hover:text-text'
              }`}
              aria-label={item.label}
              role="tab"
              aria-selected={view === item.id}
              id={`nav-${item.id}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Tools section */}
          {images.length > 0 && (
            <>
              <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

              <button
                onClick={() => { onBulkEdit?.(); if (window.innerWidth < 768) toggleSidebar() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 border border-transparent text-muted hover:bg-surface2 hover:text-text transition-all duration-150"
                aria-label="Bulk edit metadata"
                id="nav-bulk-edit"
              >
                <span className="text-base">📝</span>
                <span>Bulk Metadata</span>
              </button>

              <button
                onClick={() => { onCsvImport?.(); if (window.innerWidth < 768) toggleSidebar() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 border border-transparent text-muted hover:bg-surface2 hover:text-text transition-all duration-150"
                aria-label="Import CSV or GPX file"
                id="nav-csv-import"
              >
                <span className="text-base">📄</span>
                <span>Import CSV/GPX</span>
              </button>
            </>
          )}

          <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />

          <button
            onClick={() => { onHelp?.(); if (window.innerWidth < 768) toggleSidebar() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium mb-0.5 border border-transparent text-muted hover:bg-surface2 hover:text-text transition-all duration-150"
            aria-label="Open help and documentation"
            id="nav-help"
          >
            <span className="text-base">❓</span>
            <span>Help</span>
          </button>
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 py-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <ThemeToggle />
        </div>

        {/* Stats */}
        <div className="px-4 py-3 font-mono text-[11px] space-y-1" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-border2)' }}>
          {[
            { label: 'Images', val: images.length },
            { label: 'Selected', val: selected.size },
            { label: 'Edited', val: edited },
            { label: 'Has GPS', val: hasGps },
            { label: 'Has Meta', val: hasMeta },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span style={{ color: 'var(--color-accent)' }}>{val}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
