import { create } from 'zustand'

const STORAGE_KEY = 'geotag-studio-edits'

function loadPersistedEdits() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function persistEdits(images) {
  const data = {}
  images.forEach((img) => {
    if (img.editedGps || img.keywords || img.description || img.altText) {
      data[img.name] = {
        editedGps: img.editedGps || null,
        keywords: img.keywords || '',
        description: img.description || '',
        altText: img.altText || '',
      }
    }
  })
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

let _idCounter = 0

export const useStore = create((set, get) => ({
  images: [],
  selected: new Set(),
  activeId: null,
  view: 'upload',
  undoStack: {},

  setView: (view) => set({ view }),

  addImages: (newImages) => {
    const persisted = loadPersistedEdits()
    set((s) => ({
      images: [
        ...s.images,
        ...newImages.map((img) => {
          const saved = persisted[img.name] || {}
          // if there's a saved value use it, otherwise fall back to any metadata
          const keywords = saved.keywords !== undefined ? saved.keywords : (img.keywords || '')
          const description = saved.description !== undefined ? saved.description : (img.description || '')
          const altText = saved.altText !== undefined ? saved.altText : (img.altText || '')
          return {
            ...img,
            id: ++_idCounter,
            editedGps: saved.editedGps || img.editedGps,
            keywords,
            description,
            altText,
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

  toggleSelect: (id) =>
    set((s) => { const sel = new Set(s.selected); sel.has(id) ? sel.delete(id) : sel.add(id); return { selected: sel } }),
  selectAll: () => set((s) => ({ selected: new Set(s.images.map((i) => i.id)) })),
  selectNone: () => set({ selected: new Set() }),
  // select images that originally had GPS data (not just edited)
  selectWithGPS: () => set((s) => ({ selected: new Set(s.images.filter((i) => i.originalExif && i.originalExif.gps).map((i) => i.id)) })),

  selectEdited: () => set((s) => ({ selected: new Set(s.images.filter((i) => i.editedGps || i.keywords || i.description || i.altText).map((i) => i.id)) })),
  setActive: (id) => set({ activeId: id }),

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
          processedDataUrl: null
        }
      })
      persistEdits(images)
      return { images, undoStack }
    }),

  updateMeta: (id, patch) =>
    set((s) => {
      const images = s.images.map((img) =>
        img.id === id ? { ...img, ...patch, processed: false, processedDataUrl: null } : img
      )
      persistEdits(images)
      return { images }
    }),

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

  setProcessed: (id, processedDataUrl) =>
    set((s) => ({ images: s.images.map((i) => i.id === id ? { ...i, processed: true, processedDataUrl } : i) })),

  markFailed: (id) =>
    set((s) => ({ images: s.images.map((i) => i.id === id ? { ...i, processed: false, processFailed: true } : i) })),
}))
