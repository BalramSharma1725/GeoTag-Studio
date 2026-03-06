import { create } from 'zustand'

const STORAGE_KEY = 'geotag-studio-edits'
const THEME_KEY = 'geotag-studio-theme'

function loadPersistedEdits() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

function persistEdits(images) {
  const data = {}
  images.forEach((img) => {
    if (img.editedGps || img.keywords || img.description || img.altText || img.timestamp) {
      data[img.name] = {
        editedGps: img.editedGps || null,
        keywords: img.keywords || '',
        description: img.description || '',
        altText: img.altText || '',
        timestamp: img.timestamp || '',
      }
    }
  })
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
    return 'dark'
  } catch { return 'dark' }
}

let _idCounter = 0

export const useStore = create((set, get) => ({
  images: [],
  selected: new Set(),
  activeId: null,
  view: 'upload', // 'upload' | 'editor' | 'export'
  undoStack: {},
  theme: loadTheme(),
  sidebarOpen: true,
  helpOpen: false,

  // ===== Theme =====
  setTheme: (theme) => {
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
    set({ theme })
  },

  // ===== Sidebar =====
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ===== Help =====
  setHelpOpen: (helpOpen) => set({ helpOpen }),

  // ===== View =====
  setView: (view) => set({ view }),

  // ===== Images =====
  addImages: (newImages) => {
    const persisted = loadPersistedEdits()
    set((s) => ({
      images: [
        ...s.images,
        ...newImages.map((img) => {
          const saved = persisted[img.name] || {}
          return {
            ...img,
            id: ++_idCounter,
            editedGps: saved.editedGps || img.editedGps,
            keywords: saved.keywords !== undefined ? saved.keywords : (img.keywords || ''),
            description: saved.description !== undefined ? saved.description : (img.description || ''),
            altText: saved.altText !== undefined ? saved.altText : (img.altText || ''),
            timestamp: saved.timestamp !== undefined ? saved.timestamp : (img.timestamp || ''),
          }
        }),
      ],
    }))
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ images: [], selected: new Set(), activeId: null, undoStack: {} })
  },

  removeImage: (id) =>
    set((s) => {
      const newSelected = new Set(s.selected)
      newSelected.delete(id)
      const images = s.images.filter((i) => i.id !== id)
      persistEdits(images)
      return { images, selected: newSelected, activeId: s.activeId === id ? null : s.activeId }
    }),

  // ===== Selection =====
  toggleSelect: (id) =>
    set((s) => {
      const sel = new Set(s.selected)
      sel.has(id) ? sel.delete(id) : sel.add(id)
      return { selected: sel }
    }),
  selectAll: () => set((s) => ({ selected: new Set(s.images.map((i) => i.id)) })),
  selectNone: () => set({ selected: new Set() }),
  selectWithGPS: () => set((s) => ({
    selected: new Set(s.images.filter((i) => i.originalExif && i.originalExif.gps).map((i) => i.id))
  })),
  selectEdited: () => set((s) => ({
    selected: new Set(s.images.filter((i) => i.editedGps || i.keywords || i.description || i.altText).map((i) => i.id))
  })),

  // ===== Active =====
  setActive: (id) => set({ activeId: id }),

  // ===== GPS =====
  applyGps: (coords, scope, meta = {}) =>
    set((s) => {
      let targetIds = []
      if (scope === 'current' && s.activeId) targetIds = [s.activeId]
      else if (scope === 'selected') targetIds = [...s.selected]
      else if (scope === 'all') targetIds = s.images.map((i) => i.id)
      const undoStack = { ...s.undoStack }
      const images = s.images.map((img) => {
        if (!targetIds.includes(img.id)) return img
        if (!undoStack[img.id]) undoStack[img.id] = img.editedGps ? { ...img.editedGps } : null
        return {
          ...img,
          editedGps: { ...coords },
          keywords: meta.keywords !== undefined ? meta.keywords : img.keywords,
          description: meta.description !== undefined ? meta.description : img.description,
          altText: meta.altText !== undefined ? meta.altText : img.altText,
          processed: false,
          processedDataUrl: null,
        }
      })
      persistEdits(images)
      return { images, undoStack }
    }),

  // ===== Metadata =====
  updateMeta: (id, patch) =>
    set((s) => {
      const images = s.images.map((img) =>
        img.id === id ? { ...img, ...patch, processed: false, processedDataUrl: null } : img
      )
      persistEdits(images)
      return { images }
    }),

  // ===== Alt Text (spec §3.2) =====
  setAltText: (id, value) =>
    set((s) => {
      const images = s.images.map((img) =>
        img.id === id ? { ...img, altText: value, processed: false, processedDataUrl: null } : img
      )
      persistEdits(images)
      return { images }
    }),

  applyAltTextToEmpty: (sourceId) =>
    set((s) => {
      const source = s.images.find((i) => i.id === sourceId)
      if (!source || !source.altText) return s
      const images = s.images.map((img) =>
        img.id !== sourceId && (!img.altText || img.altText.trim() === '')
          ? { ...img, altText: source.altText, processed: false, processedDataUrl: null }
          : img
      )
      persistEdits(images)
      return { images }
    }),

  // ===== Batch Update =====
  updateBatchMeta: (updates) =>
    set((s) => {
      const updateMap = new Map(updates.map((u) => [u.id, u]))
      const images = s.images.map((img) => {
        const u = updateMap.get(img.id)
        if (!u) return img
        const patch = {}
        if (u.keywords !== undefined) patch.keywords = u.keywords
        if (u.description !== undefined) patch.description = u.description
        if (u.altText !== undefined) patch.altText = u.altText
        if (u.timestamp !== undefined) patch.timestamp = u.timestamp
        if (u.lat !== undefined && u.lng !== undefined) {
          patch.editedGps = { lat: u.lat, lng: u.lng }
        }
        return { ...img, ...patch, processed: false, processedDataUrl: null }
      })
      persistEdits(images)
      return { images }
    }),

  // ===== GPS Reset/Undo =====
  resetGps: (id) =>
    set((s) => {
      const images = s.images.map((i) =>
        i.id === id
          ? { ...i, editedGps: i.originalExif && i.originalExif.gps ? { ...i.originalExif.gps } : null, processed: false, processedDataUrl: null }
          : i
      )
      persistEdits(images)
      return { images }
    }),

  undoGps: (id) =>
    set((s) => {
      const prev = s.undoStack[id]
      const undoStack = { ...s.undoStack }
      delete undoStack[id]
      const images = s.images.map((i) =>
        i.id === id ? { ...i, editedGps: prev, processed: false, processedDataUrl: null } : i
      )
      persistEdits(images)
      return { images, undoStack }
    }),

  // ===== Processing =====
  setProcessed: (id, processedDataUrl) =>
    set((s) => ({ images: s.images.map((i) => i.id === id ? { ...i, processed: true, processedDataUrl } : i) })),

  markFailed: (id) =>
    set((s) => ({ images: s.images.map((i) => i.id === id ? { ...i, processed: false, processFailed: true } : i) })),
}))
